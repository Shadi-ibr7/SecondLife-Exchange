import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ItemCategory } from '@prisma/client';
import { z } from 'zod';
import { HashUtil } from '../../common/utils/hash.util';

export interface GeminiAnalysisResult {
  category: ItemCategory;
  tags: string[];
  aiSummary: string;
  aiRepairTip: string;
}

export interface AnalyzeItemRequest {
  title: string;
  description: string;
  locale?: string;
}

// Schémas Zod pour la validation des suggestions
const SuggestedItemDraftSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(50),
  country: z.string().min(1).max(50),
  era: z.string().max(50).nullable(),
  materials: z.string().max(200).nullable(),
  ecoReason: z.string().min(1).max(240),
  repairDifficulty: z.enum(['faible', 'moyenne', 'elevee']),
  popularity: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(30)).max(8),
  photoRef: z.string().max(200).nullable(),
});

const SuggestedItemsResponseSchema = z.object({
  items: z.array(SuggestedItemDraftSchema).max(20),
});

export type SuggestedItemDraft = z.infer<typeof SuggestedItemDraftSchema>;
export type SuggestedItemsResponse = z.infer<
  typeof SuggestedItemsResponseSchema
>;

export interface SuggestedItemWithMetadata extends SuggestedItemDraft {
  aiModel?: string;
  aiPromptHash?: string;
  aiRaw?: any;
}

export interface GenerateSuggestionsRequest {
  themeTitle: string;
  locale: string[];
  trends?: any;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly aiConfig;

  constructor(private readonly configService: ConfigService) {
    this.aiConfig = this.configService.get('ai');

    // Fallback vers les variables d'environnement directes
    if (!this.aiConfig?.geminiApiKey) {
      this.aiConfig = {
        geminiApiKey: process.env.AI_GEMINI_API_KEY,
        geminiModel: process.env.AI_GEMINI_MODEL || 'gemini-2.5-flash',
        geminiTimeout: parseInt(process.env.AI_GEMINI_TIMEOUT_MS || '10000'),
        geminiMaxRetries: parseInt(process.env.AI_GEMINI_MAX_RETRIES || '1'),
        geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      };
    }

    console.log('🔧 Configuration IA chargée:', {
      hasApiKey: !!this.aiConfig?.geminiApiKey,
      model: this.aiConfig?.geminiModel,
      timeout: this.aiConfig?.geminiTimeout,
    });
  }

  /**
   * Analyse un item avec Gemini pour auto-catégorisation et suggestions
   */
  async analyzeItem(
    request: AnalyzeItemRequest,
  ): Promise<GeminiAnalysisResult | null> {
    if (!this.aiConfig.geminiApiKey) {
      this.logger.warn('Clé API Gemini non configurée, analyse IA ignorée');
      return null;
    }

    try {
      const prompt = this.buildAnalysisPrompt(request);
      const response = await this.callGeminiAPI(prompt);

      if (!response) {
        this.logger.warn('Réponse Gemini vide, analyse ignorée');
        return null;
      }

      return this.parseGeminiResponse(response);
    } catch (error) {
      this.logger.error(`Erreur lors de l'analyse Gemini: ${error.message}`);
      return null; // Continue sans IA en cas d'erreur
    }
  }

  /**
   * Construit le prompt pour l'analyse Gemini
   */
  private buildAnalysisPrompt(request: AnalyzeItemRequest): string {
    const { title, description, locale = 'fr' } = request;

    return `Analyse cet objet pour une plateforme d'échange d'objets d'occasion.

Titre: "${title}"
Description: "${description}"

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "category": "CATEGORIE_APPROPRIEE",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "aiSummary": "Résumé concis en ${locale} (max 240 caractères)",
  "aiRepairTip": "Conseil réparation basique en ${locale} (max 240 caractères)"
}

Catégories disponibles: CLOTHING, ELECTRONICS, BOOKS, HOME, TOOLS, TOYS, SPORTS, ART, VINTAGE, HANDCRAFT, OTHER

Règles:
- Choisis la catégorie la plus appropriée
- Génère 3-4 tags pertinents (2-24 caractères chacun)
- Résumé: description courte et attractive
- Conseil réparation: astuce simple si l'objet semble endommagé, sinon "Aucune réparation nécessaire"

Réponds uniquement le JSON, sans texte supplémentaire.`;
  }

  /**
   * Appelle l'API Gemini
   */
  private async callGeminiAPI(prompt: string): Promise<string | null> {
    const url = `${this.aiConfig.geminiBaseUrl}/models/${this.aiConfig.geminiModel}:generateContent?key=${this.aiConfig.geminiApiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 500,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.aiConfig.geminiTimeout,
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Gemini error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error('Réponse Gemini invalide');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error("Timeout de l'API Gemini");
      }

      throw error;
    }
  }

  /**
   * Parse et valide la réponse Gemini
   */
  private parseGeminiResponse(response: string): GeminiAnalysisResult {
    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      // Valider la structure
      if (
        !parsed.category ||
        !parsed.tags ||
        !parsed.aiSummary ||
        !parsed.aiRepairTip
      ) {
        throw new Error('Structure JSON invalide');
      }

      // Valider la catégorie
      const validCategories = Object.values(ItemCategory);
      if (!validCategories.includes(parsed.category)) {
        throw new Error(`Catégorie invalide: ${parsed.category}`);
      }

      // Valider les tags
      if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) {
        throw new Error('Tags invalides');
      }

      // Valider les longueurs
      if (parsed.aiSummary.length > 240) {
        parsed.aiSummary = parsed.aiSummary.substring(0, 237) + '...';
      }

      if (parsed.aiRepairTip.length > 240) {
        parsed.aiRepairTip = parsed.aiRepairTip.substring(0, 237) + '...';
      }

      return {
        category: parsed.category as ItemCategory,
        tags: parsed.tags.slice(0, 4), // Max 4 tags
        aiSummary: parsed.aiSummary,
        aiRepairTip: parsed.aiRepairTip,
      };
    } catch (error) {
      this.logger.error(`Erreur parsing réponse Gemini: ${error.message}`);
      throw new BadRequestException('Réponse IA invalide');
    }
  }

  /**
   * Génère des suggestions d'objets pour un thème hebdomadaire
   */
  async generateSuggestions(
    request: GenerateSuggestionsRequest,
  ): Promise<SuggestedItemWithMetadata[]> {
    if (!this.aiConfig.geminiApiKey) {
      this.logger.warn(
        'Clé API Gemini non configurée, génération de suggestions ignorée',
      );
      return [];
    }

    try {
      const prompt = this.buildSuggestionsPrompt(request);
      const promptHash = HashUtil.promptHash(prompt);

      this.logger.log(
        `Génération de suggestions pour le thème: ${request.themeTitle}`,
      );

      const response = await this.callGeminiAPI(prompt);

      if (!response) {
        this.logger.warn('Réponse Gemini vide, génération ignorée');
        return [];
      }

      const parsed = this.parseSuggestionsResponse(response);

      // Ajouter les métadonnées IA
      const suggestionsWithMetadata = parsed.items.map((item) => ({
        ...item,
        aiModel: this.aiConfig.geminiModel,
        aiPromptHash: promptHash,
        aiRaw: { prompt, response },
      }));

      this.logger.log(
        `Généré ${suggestionsWithMetadata.length} suggestions pour le thème: ${request.themeTitle}`,
      );
      return suggestionsWithMetadata;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la génération de suggestions: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Construit le prompt pour la génération de suggestions
   */
  private buildSuggestionsPrompt(request: GenerateSuggestionsRequest): string {
    const { themeTitle, locale } = request;
    const countries = locale.join(', ');

    return `Rôle: Tu es un curateur d'objets d'échange écoresponsables à l'échelle mondiale.
Tâche: Proposer une liste variée d'objets pertinents pour le thème: "${themeTitle}".

Contraintes:
- Réponds UNIQUEMENT en JSON valide (pas de texte hors JSON).
- 20 objets maximum.
- Contrainte diversité: pas plus de 2 objets par pays et par décennie/ère.
- Préférer vintage, artisanat, objets réparables.
- Focus sur les pays: ${countries}

Champs attendus pour chaque objet:
{
  "name": string,
  "category": string,
  "country": string,             // ISO ou nom pays
  "era": string|null,            // ex "années 80", "Meiji", "2000s"
  "materials": string|null,
  "ecoReason": string,           // pourquoi c'est écoresponsable
  "repairDifficulty": "faible"|"moyenne"|"elevee",
  "popularity": 1|2|3|4|5,
  "tags": string[],
  "photoRef": string|null
}

Sortie: { "items": [ ... ] }

Réponds uniquement le JSON, sans texte supplémentaire.`;
  }

  /**
   * Parse et valide la réponse de suggestions
   */
  private parseSuggestionsResponse(response: string): SuggestedItemsResponse {
    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      // Valider avec Zod
      const validated = SuggestedItemsResponseSchema.parse(parsed);

      return validated;
    } catch (error) {
      this.logger.error(`Erreur parsing réponse suggestions: ${error.message}`);
      throw new BadRequestException('Réponse IA invalide pour les suggestions');
    }
  }

  /**
   * Teste la connexion à l'API Gemini
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.analyzeItem({
        title: 'Test',
        description: 'Test de connexion',
      });
      return result !== null;
    } catch (error) {
      this.logger.error(`Test connexion Gemini échoué: ${error.message}`);
      return false;
    }
  }
}

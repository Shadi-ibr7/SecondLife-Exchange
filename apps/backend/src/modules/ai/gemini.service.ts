/**
 * FICHIER: gemini.service.ts
 * 
 * DESCRIPTION:
 * Ce service gère l'intégration avec l'API Google Gemini pour l'analyse IA.
 * Il permet d'analyser des items et de générer des suggestions d'objets.
 * 
 * FONCTIONNALITÉS:
 * - Analyse automatique d'items (catégorisation, tags, résumé, conseils de réparation)
 * - Génération de suggestions d'objets basées sur des thèmes
 * - Validation des réponses IA avec Zod
 * - Gestion des erreurs et timeouts
 * 
 * CONFIGURATION:
 * - Utilise la clé API Gemini depuis les variables d'environnement
 * - Modèle par défaut: gemini-2.5-flash (rapide et économique)
 * - Timeout configurable (défaut: 10 secondes)
 */

// Import des classes NestJS
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

// Import des services
import { ConfigService } from '@nestjs/config';

// Import des types Prisma
import { ItemCategory } from '@prisma/client';

// Import de Zod pour la validation
import { z } from 'zod';

// Import des utilitaires
import { HashUtil } from '../../common/utils/hash.util';

/**
 * INTERFACE: GeminiAnalysisResult
 * 
 * Résultat de l'analyse IA d'un item.
 * Contient la catégorie suggérée, les tags, un résumé et des conseils de réparation.
 */
export interface GeminiAnalysisResult {
  category: ItemCategory; // Catégorie suggérée par l'IA
  tags: string[];         // Tags pertinents (3-4 tags)
  aiSummary: string;      // Résumé concis (max 240 caractères)
  aiRepairTip: string;    // Conseil de réparation (max 240 caractères)
}

/**
 * INTERFACE: AnalyzeItemRequest
 * 
 * Requête pour analyser un item avec l'IA.
 */
export interface AnalyzeItemRequest {
  title: string;        // Titre de l'item
  description: string; // Description de l'item
  locale?: string;      // Langue (défaut: 'fr')
}

// ============================================
// SCHÉMAS ZOD POUR LA VALIDATION
// ============================================

/**
 * Schéma Zod pour valider une suggestion d'objet générée par l'IA.
 * Utilisé pour valider les réponses de l'API Gemini.
 */
const SuggestedItemDraftSchema = z.object({
  name: z.string().min(1).max(120),                    // Nom de l'objet
  category: z.string().min(1).max(50),                // Catégorie
  country: z.string().min(1).max(50),                  // Pays d'origine
  era: z.string().max(50).nullable(),                  // Époque (optionnel)
  materials: z.string().max(200).nullable(),           // Matériaux (optionnel)
  ecoReason: z.string().min(1).max(240),              // Raison écologique
  repairDifficulty: z.enum(['faible', 'moyenne', 'elevee']), // Difficulté de réparation
  popularity: z.number().int().min(1).max(5),         // Popularité (1-5)
  tags: z.array(z.string().max(30)).max(8),           // Tags (max 8)
  photoRef: z.string().max(200).nullable(),          // Référence photo (optionnel)
});

/**
 * Schéma Zod pour valider la réponse complète de suggestions.
 */
const SuggestedItemsResponseSchema = z.object({
  items: z.array(SuggestedItemDraftSchema).max(20), // Maximum 20 suggestions
});

/**
 * TYPE: SuggestedItemDraft
 * 
 * Type TypeScript inféré depuis le schéma Zod.
 */
export type SuggestedItemDraft = z.infer<typeof SuggestedItemDraftSchema>;

/**
 * TYPE: SuggestedItemsResponse
 * 
 * Type pour la réponse complète de suggestions.
 */
export type SuggestedItemsResponse = z.infer<
  typeof SuggestedItemsResponseSchema
>;

/**
 * INTERFACE: SuggestedItemWithMetadata
 * 
 * Étend SuggestedItemDraft avec les métadonnées IA.
 * Utilisé pour stocker les suggestions avec leurs métadonnées.
 */
export interface SuggestedItemWithMetadata extends SuggestedItemDraft {
  aiModel?: string;        // Modèle IA utilisé
  aiPromptHash?: string;   // Hash du prompt (pour déduplication)
  aiRaw?: any;             // Réponse brute de l'IA (pour débogage)
}

/**
 * INTERFACE: GenerateSuggestionsRequest
 * 
 * Requête pour générer des suggestions d'objets basées sur un thème.
 */
export interface GenerateSuggestionsRequest {
  themeTitle: string;  // Titre du thème
  locale: string[];    // Locales cibles (ex: ['FR', 'MA', 'JP'])
  trends?: any;        // Tendances (optionnel)
}

/**
 * SERVICE: GeminiService
 * 
 * Service pour interagir avec l'API Google Gemini.
 */
@Injectable()
export class GeminiService {
  /**
   * Logger pour enregistrer les événements
   */
  private readonly logger = new Logger(GeminiService.name);

  /**
   * Configuration IA
   * 
   * Contient la clé API, le modèle, le timeout, etc.
   */
  private readonly aiConfig;

  /**
   * CONSTRUCTEUR
   * 
   * Charge la configuration IA et configure les fallbacks.
   */
  constructor(private readonly configService: ConfigService) {
    // Récupérer la configuration depuis ConfigService
    this.aiConfig = this.configService.get('ai');

    // ============================================
    // FALLBACK VERS LES VARIABLES D'ENVIRONNEMENT
    // ============================================
    /**
     * Si la configuration n'est pas chargée via ConfigService,
     * utiliser directement les variables d'environnement.
     * Utile pour le développement ou si la config n'est pas correctement chargée.
     */
    if (!this.aiConfig?.geminiApiKey) {
      this.aiConfig = {
        geminiApiKey: process.env.AI_GEMINI_API_KEY,
        geminiModel: process.env.AI_GEMINI_MODEL || 'gemini-2.5-flash',
        geminiTimeout: parseInt(process.env.AI_GEMINI_TIMEOUT_MS || '10000'),
        geminiMaxRetries: parseInt(process.env.AI_GEMINI_MAX_RETRIES || '1'),
        geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      };
    }

    // Logger la configuration (sans exposer la clé API)
    console.log('🔧 Configuration IA chargée:', {
      hasApiKey: !!this.aiConfig?.geminiApiKey, // true/false seulement
      model: this.aiConfig?.geminiModel,
      timeout: this.aiConfig?.geminiTimeout,
    });
  }

  // ============================================
  // MÉTHODE: analyzeItem (Analyser un item)
  // ============================================
  
  /**
   * Analyse un item avec Gemini pour auto-catégorisation et suggestions.
   * 
   * PROCESSUS:
   * 1. Construit un prompt avec le titre et la description
   * 2. Appelle l'API Gemini
   * 3. Parse et valide la réponse JSON
   * 4. Retourne le résultat structuré
   * 
   * @param request - Requête d'analyse (title, description, locale)
   * @returns Résultat de l'analyse (category, tags, summary, repairTip) ou null si erreur
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

  // ============================================
  // MÉTHODE PRIVÉE: buildAnalysisPrompt
  // ============================================
  
  /**
   * Construit le prompt pour l'analyse Gemini d'un item.
   * 
   * Le prompt demande à l'IA de:
   * - Catégoriser l'objet
   * - Générer des tags pertinents
   * - Créer un résumé concis
   * - Proposer des conseils de réparation
   * 
   * @param request - Requête d'analyse
   * @returns Prompt texte pour l'API Gemini
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

  // ============================================
  // MÉTHODE PRIVÉE: callGeminiAPI
  // ============================================
  
  /**
   * Appelle l'API Google Gemini avec un prompt.
   * 
   * FONCTIONNEMENT:
   * - Construit l'URL de l'API avec la clé API
   * - Envoie une requête POST avec le prompt
   * - Gère le timeout (annule la requête si trop longue)
   * - Parse la réponse JSON
   * 
   * CONFIGURATION:
   * - temperature: 0.3 (réponses plus déterministes)
   * - maxOutputTokens: 500 (limite la longueur de la réponse)
   * 
   * @param prompt - Prompt texte à envoyer à l'IA
   * @returns Réponse texte de l'IA, ou null si erreur
   * @throws Error si l'API retourne une erreur ou timeout
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

  // ============================================
  // MÉTHODE PRIVÉE: parseGeminiResponse
  // ============================================
  
  /**
   * Parse et valide la réponse Gemini pour l'analyse d'un item.
   * 
   * PROCESSUS:
   * 1. Nettoie la réponse (enlève markdown si présent)
   * 2. Parse le JSON
   * 3. Valide la structure (category, tags, aiSummary, aiRepairTip)
   * 4. Valide la catégorie (doit être une valeur valide de ItemCategory)
   * 5. Valide les tags (doit être un tableau non vide)
   * 6. Tronque les textes si trop longs (max 240 caractères)
   * 
   * @param response - Réponse texte de l'API Gemini
   * @returns Résultat structuré de l'analyse
   * @throws BadRequestException si la réponse est invalide
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

  // ============================================
  // MÉTHODE: generateSuggestions
  // ============================================
  
  /**
   * Génère des suggestions d'objets pour un thème hebdomadaire.
   * 
   * PROCESSUS:
   * 1. Construit un prompt avec le thème et les locales
   * 2. Appelle l'API Gemini
   * 3. Parse et valide la réponse avec Zod
   * 4. Ajoute les métadonnées IA (modèle, hash du prompt, réponse brute)
   * 
   * DIVERSITÉ:
   * - Le prompt demande une diversité géographique (max 2 par pays)
   * - Le prompt demande une diversité temporelle (max 2 par époque)
   * 
   * @param request - Requête de génération (themeTitle, locale, trends?)
   * @returns Liste de suggestions avec métadonnées IA
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

  // ============================================
  // MÉTHODE PRIVÉE: buildSuggestionsPrompt
  // ============================================
  
  /**
   * Construit le prompt pour la génération de suggestions d'objets.
   * 
   * Le prompt demande à l'IA de:
   * - Proposer 20 objets maximum
   * - Respecter la diversité (max 2 par pays et par époque)
   * - Préférer vintage, artisanat, objets réparables
   * - Focus sur les pays spécifiés dans locale
   * 
   * @param request - Requête de génération
   * @returns Prompt texte pour l'API Gemini
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

  // ============================================
  // MÉTHODE PRIVÉE: parseSuggestionsResponse
  // ============================================
  
  /**
   * Parse et valide la réponse Gemini pour les suggestions.
   * 
   * PROCESSUS:
   * 1. Nettoie la réponse (enlève markdown si présent)
   * 2. Parse le JSON
   * 3. Valide avec le schéma Zod SuggestedItemsResponseSchema
   * 
   * @param response - Réponse texte de l'API Gemini
   * @returns Réponse validée avec Zod
   * @throws BadRequestException si la réponse est invalide
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

  // ============================================
  // MÉTHODE: generateTheme
  // ============================================
  
  /**
   * Génère un thème hebdomadaire avec l'IA.
   * 
   * PROCESSUS:
   * 1. Construit un prompt pour générer un thème créatif et écologique
   * 2. Appelle l'API Gemini
   * 3. Parse et valide la réponse
   * 4. Retourne le thème avec titre, slug, impactText et terme de recherche pour photo
   * 
   * @param date - Date de la semaine pour le thème
   * @returns Thème généré avec titre, slug, impactText et photoSearchQuery
   */
  async generateTheme(date: Date): Promise<{
    title: string;
    slug: string;
    impactText: string;
    photoSearchQuery: string;
  } | null> {
    if (!this.aiConfig.geminiApiKey) {
      this.logger.error('❌ Clé API Gemini non configurée ! Vérifiez AI_GEMINI_API_KEY dans .env');
      return null;
    }

    this.logger.log(`🔑 Clé API Gemini: ${this.aiConfig.geminiApiKey ? '✅ Configurée' : '❌ Manquante'}`);

    try {
      const prompt = this.buildThemePrompt(date);
      
      this.logger.log(`🎨 Génération de thème pour la semaine du ${date.toLocaleDateString('fr-FR')}`);

      const response = await this.callGeminiAPI(prompt);

      if (!response) {
        this.logger.warn('⚠️  Réponse Gemini vide, génération de thème ignorée');
        return null;
      }

      const parsed = this.parseThemeResponse(response);

      this.logger.log(`✅ Thème généré: "${parsed.title}"`);
      return parsed;
    } catch (error: any) {
      this.logger.error(`❌ Erreur lors de la génération de thème: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      return null;
    }
  }

  // ============================================
  // MÉTHODE PRIVÉE: buildThemePrompt
  // ============================================
  
  /**
   * Construit le prompt pour la génération de thème hebdomadaire.
   */
  private buildThemePrompt(date: Date): string {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const weekFormatted = weekStart.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `Rôle: Tu es un créateur de thèmes hebdomadaires pour une plateforme d'échange d'objets écoresponsables.
Tâche: Créer un thème inspirant pour la semaine du ${weekFormatted}.

Le thème doit:
- Être créatif et engageant
- Mettre en avant l'échange, la réparation, la réutilisation
- Être écologique et durable
- Inspirer les utilisateurs à échanger des objets vintage, artisanaux, réparables
- Être adapté à un public international (France, Maroc, Japon, USA, Brésil)

Réponds UNIQUEMENT en JSON valide (pas de texte hors JSON):
{
  "title": string,              // Titre du thème (ex: "Objets artisanaux du monde")
  "slug": string,              // Slug URL-friendly (ex: "objets-artisanaux-monde")
  "impactText": string,        // Texte d'impact (2-3 phrases expliquant pourquoi ce thème)
  "photoSearchQuery": string    // Terme de recherche pour trouver une photo sur Unsplash (ex: "handmade crafts sustainable")
}

Sortie: Réponds uniquement le JSON, sans texte supplémentaire.`;
  }

  // ============================================
  // MÉTHODE PRIVÉE: parseThemeResponse
  // ============================================
  
  /**
   * Parse et valide la réponse Gemini pour un thème.
   */
  private parseThemeResponse(response: string): {
    title: string;
    slug: string;
    impactText: string;
    photoSearchQuery: string;
  } {
    try {
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      // Validation basique
      if (!parsed.title || !parsed.slug || !parsed.impactText || !parsed.photoSearchQuery) {
        throw new Error('Champs manquants dans la réponse');
      }

      // Nettoyer et valider les longueurs
      return {
        title: parsed.title.trim().substring(0, 200),
        slug: parsed.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 100),
        impactText: parsed.impactText.trim().substring(0, 500),
        photoSearchQuery: parsed.photoSearchQuery.trim().substring(0, 100),
      };
    } catch (error) {
      this.logger.error(`Erreur parsing réponse thème: ${error.message}`);
      throw new BadRequestException('Réponse IA invalide pour le thème');
    }
  }

  // ============================================
  // MÉTHODE: testConnection
  // ============================================
  
  /**
   * Teste la connexion à l'API Gemini.
   * 
   * UTILISATION:
   * - Vérifier que la clé API est valide
   * - Vérifier que l'API est accessible
   * 
   * @returns true si la connexion réussit, false sinon
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

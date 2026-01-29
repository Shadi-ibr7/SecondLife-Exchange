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

// ============================================
// TYPES POUR L'API GEMINI
// ============================================

/**
 * Type pour une partie de la réponse Gemini (contenant le texte)
 */
type GeminiPart = { text?: string };

/**
 * Type pour un candidat de réponse Gemini
 */
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };

/**
 * Type pour la réponse complète de l'API Gemini
 */
type GeminiResponse = { candidates?: GeminiCandidate[] };

/**
 * INTERFACE: GeminiAnalysisResult
 *
 * Résultat de l'analyse IA d'un item.
 * Contient la catégorie suggérée, les tags, un résumé et des conseils de réparation.
 */
export interface GeminiAnalysisResult {
  category: ItemCategory; // Catégorie suggérée par l'IA
  tags: string[]; // Tags pertinents (3-4 tags)
  aiSummary: string; // Résumé concis (max 240 caractères)
  aiRepairTip: string; // Conseil de réparation (max 240 caractères)
}

/**
 * INTERFACE: AnalyzeItemRequest
 *
 * Requête pour analyser un item avec l'IA.
 */
export interface AnalyzeItemRequest {
  title: string; // Titre de l'item
  description: string; // Description de l'item
  locale?: string; // Langue (défaut: 'fr')
  imageUrls?: string[]; // URLs d'images (max 5, optionnel)
}

// ============================================
// SCHÉMAS ZOD POUR LA VALIDATION
// ============================================

/**
 * Schéma Zod pour valider une suggestion d'objet générée par l'IA.
 * Utilisé pour valider les réponses de l'API Gemini.
 */
const SuggestedItemDraftSchema = z.object({
  name: z.string().min(1).max(120), // Nom de l'objet
  category: z.string().min(1).max(50), // Catégorie
  country: z.string().min(1).max(50), // Pays d'origine
  era: z.string().max(50).nullable(), // Époque (optionnel)
  materials: z.string().max(200).nullable(), // Matériaux (optionnel)
  ecoReason: z.string().min(1).max(240), // Raison écologique
  repairDifficulty: z.enum(['faible', 'moyenne', 'elevee']), // Difficulté de réparation
  popularity: z.number().int().min(1).max(5), // Popularité (1-5)
  tags: z.array(z.string().max(30)).max(8), // Tags (max 8)
  photoRef: z.string().max(200).nullable(), // Référence photo (optionnel)
});

/**
 * Schéma Zod pour valider la réponse complète de suggestions.
 */
const SuggestedItemsResponseSchema = z.object({
  items: z.array(SuggestedItemDraftSchema).max(20), // Maximum 20 suggestions
});

/**
 * Schéma Zod pour valider un thème généré par l'IA.
 *
 * Note: impactText est volontairement autorisé jusqu'à ~800 caractères
 * pour permettre un texte explicatif riche avec plusieurs exemples concrets.
 */
const ThemeDraftSchema = z.object({
  title: z.string().min(1).max(200), // Titre du thème
  slug: z.string().min(1).max(100), // Slug URL-friendly
  impactText: z.string().min(1).max(800), // Texte explicatif + exemples
  photoSearchQuery: z.string().min(1).max(100), // Terme de recherche Unsplash
  targetCategories: z.array(z.string()).min(1).max(3), // 1 à 3 catégories ciblées
});

/**
 * TYPE: ThemeDraft
 *
 * Type TypeScript inféré depuis le schéma Zod.
 */
export type ThemeDraft = z.infer<typeof ThemeDraftSchema>;

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
  aiModel?: string; // Modèle IA utilisé
  aiPromptHash?: string; // Hash du prompt (pour déduplication)
  aiRaw?: any; // Réponse brute de l'IA (pour débogage)
}

/**
 * INTERFACE: GenerateSuggestionsRequest
 *
 * Requête pour générer des suggestions d'objets basées sur un thème.
 */
export interface GenerateSuggestionsRequest {
  themeTitle: string; // Titre du thème
  locale: string[]; // Locales cibles (ex: ['FR', 'MA', 'JP'])
  trends?: any; // Tendances (optionnel)
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
    const { title, description, locale = 'fr', imageUrls } = request;

    const imagesPart =
      imageUrls && imageUrls.length
        ? `\nImages (URLs, max 5):\n${imageUrls.slice(0, 5).join('\n')}`
        : '';

    return `Analyse cet objet pour une plateforme d'échange d'objets d'occasion.

Titre: "${title}"
Description: "${description}"${imagesPart}

IMPORTANT - Format JSON STRICT:
- Utilise UNIQUEMENT des guillemets doubles (") pour les clés ET les valeurs
- Pas de guillemets simples (')
- Pas de texte avant ou après le JSON
- Le JSON doit être valide et parseable

Réponds UNIQUEMENT avec ce JSON exact:
{"category":"CATEGORIE","tags":["tag1","tag2","tag3"],"aiSummary":"Résumé en ${locale}","aiRepairTip":"Conseil en ${locale}"}

Catégories: CLOTHING, ELECTRONICS, BOOKS, HOME, TOOLS, TOYS, SPORTS, ART, VINTAGE, HANDCRAFT, OTHER

Règles:
- category: la catégorie la plus appropriée (en MAJUSCULES)
- tags: 3-4 tags pertinents
- aiSummary: description courte et attractive (max 200 caractères)
- aiRepairTip: astuce réparation si endommagé, sinon "Aucune réparation nécessaire"

Exemple de réponse correcte:
{"category":"ELECTRONICS","tags":["smartphone","apple","occasion"],"aiSummary":"iPhone en bon état général avec quelques rayures.","aiRepairTip":"Aucune réparation nécessaire"}

Réponds UNIQUEMENT le JSON, sans markdown, sans code blocks.`;
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
   * - temperature: 0.2 par défaut (réponses très déterministes, plus économiques)
   * - maxOutputTokens: 400 (limite la longueur de la réponse)
   *
   * @param prompt - Prompt texte à envoyer à l'IA
   * @param temperature - Température pour la génération (défaut: 0.3, plus élevé = plus créatif)
   * @returns Réponse texte de l'IA, ou null si erreur
   * @throws Error si l'API retourne une erreur ou timeout
   */
  private async callGeminiAPI(
    prompt: string,
    temperature: number = 0.2,
  ): Promise<string | null> {
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
        temperature: temperature, // Utiliser la température passée en paramètre
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 400,
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

      const data = (await response.json()) as GeminiResponse;

      if (
        !data ||
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0] ||
        !data.candidates[0].content.parts[0].text
      ) {
        this.logger.error(
          'Réponse Gemini invalide:',
          JSON.stringify(data, null, 2),
        );
        throw new Error(
          'Réponse Gemini invalide: structure de réponse inattendue',
        );
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
   * 2. Parse le JSON (avec plusieurs tentatives de réparation)
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
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Essayer d'extraire le JSON si la réponse contient du texte avant/après
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      this.logger.log(`🔍 Réponse Gemini brute: ${cleanResponse.substring(0, 300)}...`);

      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError: any) {
        this.logger.warn(`⚠️  Premier parsing JSON échoué: ${parseError.message}`);
        this.logger.warn(`🔧 Tentative de réparation du JSON...`);

        // Tentative 1: Remplacer les guillemets simples par des guillemets doubles
        let repaired = cleanResponse
          .replace(/'/g, '"') // Remplacer tous les guillemets simples
          .replace(/(\w+):/g, '"$1":') // Ajouter des guillemets aux clés non quotées
          .replace(/,\s*}/g, '}') // Enlever les virgules finales avant }
          .replace(/,\s*]/g, ']'); // Enlever les virgules finales avant ]

        try {
          parsed = JSON.parse(repaired);
          this.logger.log(`✅ Réparation JSON réussie (guillemets)`);
        } catch (e) {
          // Tentative 2: Extraction manuelle des champs avec regex
          this.logger.warn(`⚠️  Réparation guillemets échouée, extraction manuelle...`);

          const categoryMatch = cleanResponse.match(/["']?category["']?\s*:\s*["']([^"']+)["']/i);
          const tagsMatch = cleanResponse.match(/["']?tags["']?\s*:\s*\[(.*?)\]/i);
          const summaryMatch = cleanResponse.match(/["']?aiSummary["']?\s*:\s*["']([^"']*(?:\\.[^"']*)*)["']/i);
          const repairTipMatch = cleanResponse.match(/["']?aiRepairTip["']?\s*:\s*["']([^"']*(?:\\.[^"']*)*)["']/i);

          if (categoryMatch && summaryMatch) {
            // Extraire les tags du match
            let tags: string[] = ['objet', 'occasion'];
            if (tagsMatch && tagsMatch[1]) {
              tags = tagsMatch[1]
                .split(',')
                .map(t => t.trim().replace(/["']/g, ''))
                .filter(t => t.length > 0);
            }

            parsed = {
              category: categoryMatch[1].toUpperCase(),
              tags: tags,
              aiSummary: (summaryMatch[1] || '').replace(/\\"/g, '"').replace(/\\n/g, ' '),
              aiRepairTip: (repairTipMatch?.[1] || 'Aucune réparation nécessaire').replace(/\\"/g, '"').replace(/\\n/g, ' '),
            };
            this.logger.log(`✅ Extraction manuelle réussie: category=${parsed.category}, tags=${parsed.tags.join(',')}`);
          } else {
            throw parseError; // Relancer l'erreur si on ne peut pas extraire
          }
        }
      }

      // Valider la structure
      if (!parsed.category || !parsed.aiSummary) {
        throw new Error('Structure JSON invalide: category ou aiSummary manquant');
      }

      // Valider la catégorie avec fallback sur OTHER en cas de valeur inconnue
      const validCategories = Object.values(ItemCategory) as string[];
      let category: ItemCategory;
      const categoryUpper = parsed.category.toUpperCase();
      if (validCategories.includes(categoryUpper)) {
        category = categoryUpper as ItemCategory;
      } else {
        this.logger.warn(
          `Catégorie IA inconnue (${parsed.category}), utilisation du fallback ItemCategory.OTHER`,
        );
        category = ItemCategory.OTHER;
      }

      // Valider les tags avec fallback
      let tags: string[] = ['objet', 'occasion'];
      if (Array.isArray(parsed.tags) && parsed.tags.length > 0) {
        tags = parsed.tags;
      }

      // Valider les longueurs
      let aiSummary = parsed.aiSummary || 'Description de l\'objet';
      if (aiSummary.length > 240) {
        aiSummary = aiSummary.substring(0, 237) + '...';
      }

      let aiRepairTip = parsed.aiRepairTip || 'Aucune réparation nécessaire';
      if (aiRepairTip.length > 240) {
        aiRepairTip = aiRepairTip.substring(0, 237) + '...';
      }

      return {
        category,
        tags: tags.slice(0, 4), // Max 4 tags (seront re-filtrés ensuite)
        aiSummary,
        aiRepairTip,
      };
    } catch (error) {
      this.logger.error(`Erreur parsing réponse Gemini: ${error.message}`);
      this.logger.error(`🔍 Réponse complète: ${response}`);
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
   *
   * IMPORTANT:
   * - En cas d'erreur de parsing ou de validation, on LOG l'erreur
   *   mais on retourne un objet vide { items: [] } au lieu de lever
   *   une exception, afin de ne jamais « casser » l'app côté suggestions.
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
    } catch (error: any) {
      // On ne remonte plus d'exception ici : on log et on retourne un fallback vide
      this.logger.warn(
        `⚠️  Erreur parsing réponse suggestions: ${error?.message || 'inconnue'}`,
      );
      this.logger.warn(
        `🔍 Réponse brute suggestions (premiers 500 caractères): ${response.substring(
          0,
          500,
        )}`,
      );

      // Fallback propre: aucune suggestion plutôt qu'une erreur
      return { items: [] };
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
  async generateTheme(
    date: Date,
    recentThemes?: Array<{ title: string; impactText: string }>,
  ): Promise<{
    title: string;
    slug: string;
    impactText: string;
    photoSearchQuery: string;
    targetCategories: string[];
  } | null> {
    if (!this.aiConfig.geminiApiKey) {
      this.logger.error(
        '❌ Clé API Gemini non configurée ! Vérifiez AI_GEMINI_API_KEY dans .env',
      );
      return null;
    }

    this.logger.log(
      `🔑 Clé API Gemini: ${this.aiConfig.geminiApiKey ? '✅ Configurée' : '❌ Manquante'}`,
    );

    try {
      const prompt = this.buildThemePrompt(date, recentThemes);

      this.logger.log(
        `🎨 Génération de thème pour la semaine du ${date.toLocaleDateString('fr-FR')}`,
      );
      if (recentThemes && recentThemes.length > 0) {
        this.logger.log(
          `📋 ${recentThemes.length} thèmes récents fournis pour éviter les répétitions`,
        );
      }

      // Utiliser une température élevée (0.9) pour plus de créativité et variété
      const response = await this.callGeminiAPI(prompt, 0.9);

      if (!response) {
        this.logger.warn(
          '⚠️  Réponse Gemini vide, génération de thème ignorée',
        );
        this.logger.error('🔍 Debug: Aucune réponse de l\'API Gemini');
        return null;
      }

      this.logger.log(`🔍 Réponse brute Gemini complète: ${response}`);
      this.logger.log(`🔍 Longueur de la réponse: ${response.length} caractères`);

      const parsed = this.parseThemeResponse(response);
      if (!parsed) {
        // Réponse IA inutilisable → on laisse le service appelant gérer le fallback
        this.logger.warn(
          '⚠️  Réponse IA invalide pour le thème, utilisation du fallback côté ThemesService',
        );
        return null;
      }

      this.logger.log(`✅ Thème généré: "${parsed.title}"`);
      this.logger.log(
        `✅ Description: "${parsed.impactText?.substring(0, 100)}..."`,
      );

      return parsed;
    } catch (error: any) {
      this.logger.error(
        `❌ Erreur lors de la génération de thème: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
      return null;
    }
  }

  // ============================================
  // MÉTHODE: generateThemeTitleAndDescription
  // ============================================

  /**
   * Génère un titre et une description simple pour un thème à partir d'informations minimales.
   * Utilisé lors de la création manuelle d'un thème par un admin.
   *
   * @param startOfWeek - Date de début de la semaine
   * @param userProvidedTitle - Titre fourni par l'utilisateur (optionnel, peut être amélioré)
   * @param recentThemes - Liste des thèmes récents pour éviter les répétitions (optionnel)
   * @returns Titre et description générés par l'IA
   */
  async generateThemeTitleAndDescription(
    startOfWeek: Date,
    userProvidedTitle?: string,
    recentThemes?: Array<{ title: string; impactText: string }>,
  ): Promise<{
    title: string;
    impactText: string;
  } | null> {
    if (!this.aiConfig.geminiApiKey) {
      this.logger.error(
        '❌ Clé API Gemini non configurée ! Vérifiez AI_GEMINI_API_KEY dans .env',
      );
      return null;
    }

    try {
      const weekFormatted = startOfWeek.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Déterminer la saison et le contexte pour plus de variété
      const month = startOfWeek.getMonth() + 1; // 1-12
      const season = month >= 3 && month <= 5 ? 'printemps' :
                     month >= 6 && month <= 8 ? 'été' :
                     month >= 9 && month <= 11 ? 'automne' : 'hiver';

      const weekNumber = Math.ceil((startOfWeek.getDate() + new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 0).getDate()) / 7);

      const prompt = `Rôle: Tu es un créateur de thèmes hebdomadaires pour une plateforme d'échange d'objets écoresponsables.
Tâche: Créer un titre créatif et UNIQUE et une description simple avec exemples pour la semaine du ${weekFormatted}.

CONTEXTE IMPORTANT:
- Saison: ${season}
- Semaine du mois: ${weekNumber}
- Date: ${weekFormatted}
- IMPORTANT: Chaque thème doit être DIFFÉRENT et VARIÉ. Ne répète JAMAIS le même titre ou la même description.

${recentThemes && recentThemes.length > 0 ? `THÈMES RÉCENTS À ÉVITER (ne pas répéter):
${recentThemes.map((t, i) => `${i + 1}. Titre: "${t.title}" - Description: "${t.impactText?.substring(0, 100)}..."`).join('\n')}

CRITIQUE: Le nouveau thème doit être COMPLÈTEMENT DIFFÉRENT de tous ces thèmes précédents.` : ''}

${userProvidedTitle ? `L'utilisateur a fourni ce titre: "${userProvidedTitle}". Améliore-le pour qu'il soit plus créatif, accrocheur et UNIQUE.` : 'Crée un titre créatif, accrocheur et COMPLÈTEMENT UNIQUE.'}

IMPORTANT - Le titre doit être:
- Créatif, accrocheur et mémorable (PAS juste "Thème de la semaine du..." ou "Échange Écoresponsable")
- Inspirant et engageant
- Spécifique à une ou plusieurs catégories d'objets
- COMPLÈTEMENT DIFFÉRENT des thèmes précédents
- Exemples de BONS titres VARIÉS: "Mode Vintage & Rétro", "Artisanat Local et Fait Main", "Électronique Durable et Réparable", "Livres de Science-Fiction Rétro", "Outils de Jardinage Écologiques", "Jouets en Bois Naturel", "Décoration Bohème et Naturelle", "Instruments de Musique Vintage", "Jeux de Société Rétro", "Accessoires Mode Éthique"
- Exemples de MAUVAIS titres (NE PAS UTILISER): "Thème de la semaine du...", "Échange d'objets", "Thème écologique", "Échange Écoresponsable - [mois]"

IMPORTANT - La description (impactText) doit être:
- UNE SEULE phrase simple et claire (maximum 200 caractères)
- Expliquer brièvement le thème de manière UNIQUE
- Donner UN exemple concret d'objet typique de ce thème (DIFFÉRENT à chaque fois)
- Format: "Cette semaine, [explication du thème]. Par exemple, [un objet concret et spécifique]."
- VARIER les exemples à chaque génération

Exemples de bonnes descriptions VARIÉES:
- "Cette semaine, redécouvrez le charme du vintage – vêtements, accessoires et objets uniques aux tendances passées. Par exemple, une veste en jean vintage des années 80."
- "Cette semaine, mettez en avant l'artisanat local et les créations faites main. Par exemple, un service de vaisselle en céramique artisanale."
- "Cette semaine, donnez une seconde vie à l'électronique réparable. Par exemple, une console de jeux rétro des années 90."
- "Cette semaine, explorez les objets de décoration bohème et naturels. Par exemple, un tapis en jute fait main."
- "Cette semaine, valorisez les instruments de musique vintage. Par exemple, une guitare acoustique des années 70."

Catégories d'objets disponibles:
- CLOTHING (Vêtements, chaussures, accessoires)
- ELECTRONICS (Électronique, smartphones, ordinateurs, gadgets)
- BOOKS (Livres, romans, manuels, bandes dessinées)
- HOME (Maison, décoration, mobilier, ustensiles)
- TOOLS (Outils, bricolage, jardinage)
- TOYS (Jouets, jeux de société, puzzles)
- SPORTS (Équipement sportif, vêtements de sport)
- ART (Peintures, sculptures, objets d'art)
- VINTAGE (Objets rétro, collection, antiquités)
- HANDCRAFT (Artisanat, objets faits main, créations)
- OTHER (Autre)

RÈGLE CRITIQUE: Choisis une catégorie ou combinaison de catégories DIFFÉRENTE à chaque fois. Varie entre les catégories pour éviter la répétition.

Réponds UNIQUEMENT en JSON valide (pas de texte hors JSON):
{
  "title": string,              // Titre créatif, accrocheur et UNIQUE (ex: "Mode Vintage & Rétro", "Artisanat Local et Fait Main", etc.)
  "impactText": string           // UNE phrase simple avec un exemple UNIQUE (max 200 caractères, format: "Cette semaine, [explication]. Par exemple, [objet concret et spécifique].")
}

IMPORTANT - Format JSON:
- Utilise UNIQUEMENT des guillemets doubles (") pour les clés et valeurs
- Échappe les guillemets dans les valeurs avec \\"
- Échappe les retours à la ligne avec \\n
- Pas de guillemets simples dans les valeurs
- Pas de texte avant ou après le JSON
- Le JSON doit être valide et parseable

Exemple de réponse correcte:
{"title":"Mode Vintage & Rétro","impactText":"Cette semaine, redécouvrez le charme du vintage. Par exemple, une veste en jean des années 80."}

Sortie: Réponds uniquement le JSON valide, sans texte supplémentaire, sans markdown, sans code blocks.`;

      this.logger.log(
        `🎨 Génération titre et description pour la semaine du ${weekFormatted}`,
      );

      // Utiliser une température élevée (0.9) pour plus de créativité et variété
      const response = await this.callGeminiAPI(prompt, 0.9);

      if (!response) {
        this.logger.warn(
          '⚠️  Réponse Gemini vide, génération ignorée',
        );
        this.logger.error('🔍 Debug: Aucune réponse de l\'API Gemini');
        return null;
      }

      this.logger.log(`🔍 Réponse brute Gemini: ${response.substring(0, 200)}...`);

      // Parser la réponse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.error('❌ Réponse Gemini ne contient pas de JSON valide');
        this.logger.error(`🔍 Réponse complète: ${response}`);
        return null;
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        this.logger.error(`❌ Erreur parsing JSON: ${parseError.message}`);
        this.logger.error(`🔍 JSON extrait: ${jsonMatch[0]}`);
        return null;
      }

      // Valider les champs requis
      if (!parsed.title || !parsed.impactText) {
        this.logger.error('❌ Réponse Gemini incomplète');
        this.logger.error(`🔍 Données parsées: ${JSON.stringify(parsed)}`);
        return null;
      }

      // S'assurer que impactText est bien une phrase simple
      if (parsed.impactText.length > 200) {
        this.logger.warn('⚠️  Description trop longue, tronquée');
        parsed.impactText = parsed.impactText.substring(0, 197) + '...';
      }

      this.logger.log(`✅ Titre généré: "${parsed.title}"`);
      this.logger.log(`✅ Description générée: "${parsed.impactText}"`);

      return {
        title: parsed.title.trim(),
        impactText: parsed.impactText.trim(),
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Erreur lors de la génération titre/description: ${error.message}`,
      );
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
  private buildThemePrompt(
    date: Date,
    recentThemes?: Array<{ title: string; impactText: string }>,
  ): string {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1);
    const weekFormatted = weekStart.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Déterminer la saison et le contexte pour plus de variété
    const month = weekStart.getMonth() + 1; // 1-12
    const season = month >= 3 && month <= 5 ? 'printemps' :
                     month >= 6 && month <= 8 ? 'été' :
                     month >= 9 && month <= 11 ? 'automne' : 'hiver';

    const weekNumber = Math.ceil((weekStart.getDate() + new Date(weekStart.getFullYear(), weekStart.getMonth(), 0).getDate()) / 7);

    return `Rôle: Tu es un créateur de thèmes hebdomadaires pour une plateforme d'échange d'objets écoresponsables.
Tâche: Créer un thème inspirant, créatif et COMPLÈTEMENT UNIQUE pour la semaine du ${weekFormatted}.

CONTEXTE IMPORTANT:
- Saison: ${season}
- Semaine du mois: ${weekNumber}
- Date: ${weekFormatted}
- CRITIQUE: Chaque thème doit être DIFFÉRENT et VARIÉ. Ne répète JAMAIS le même titre ou la même description.

${recentThemes && recentThemes.length > 0 ? `THÈMES RÉCENTS À ÉVITER (ne pas répéter):
${recentThemes.map((t, i) => `${i + 1}. Titre: "${t.title}" - Description: "${t.impactText?.substring(0, 100)}..."`).join('\n')}

CRITIQUE: Le nouveau thème doit être COMPLÈTEMENT DIFFÉRENT de tous ces thèmes précédents. Choisis une catégorie différente, un titre différent, et des exemples différents.` : ''}

IMPORTANT - Le titre du thème doit être:
- Créatif, accrocheur et mémorable (PAS juste "Thème de la semaine du..." ou "Échange Écoresponsable")
- Inspirant et engageant
- Spécifique à une ou plusieurs catégories d'objets
- COMPLÈTEMENT DIFFÉRENT des thèmes précédents
- Exemples de BONS titres VARIÉS: "Objets Vintage des Années 80", "Artisanat Local et Fait Main", "Électronique Durable et Réparable", "Livres de Science-Fiction Rétro", "Outils de Jardinage Écologiques", "Jouets en Bois Naturel", "Décoration Bohème et Naturelle", "Instruments de Musique Vintage", "Jeux de Société Rétro", "Accessoires Mode Éthique"
- Exemples de MAUVAIS titres (NE PAS UTILISER): "Thème de la semaine du...", "Échange d'objets", "Thème écologique", "Échange Écoresponsable - [mois]"

Catégories d'objets disponibles sur la plateforme:
- CLOTHING (Vêtements, chaussures, accessoires)
- ELECTRONICS (Électronique, smartphones, ordinateurs, gadgets)
- BOOKS (Livres, romans, manuels, bandes dessinées)
- HOME (Maison, décoration, mobilier, ustensiles)
- TOOLS (Outils, bricolage, jardinage)
- TOYS (Jouets, jeux de société, puzzles)
- SPORTS (Équipement sportif, vêtements de sport)
- ART (Peintures, sculptures, objets d'art)
- VINTAGE (Objets rétro, collection, antiquités)
- HANDCRAFT (Artisanat, objets faits main, créations)
- OTHER (Autre)

Le thème doit:
- Mettre en avant 1 à 3 catégories principales (choisies parmi la liste ci-dessus)
- VARIER les catégories à chaque génération pour éviter la répétition
- Être créatif et engageant
- Mettre en avant l'échange, la réparation, la réutilisation
- Être écologique et durable
- Inspirer les utilisateurs à échanger des objets vintage, artisanaux, réparables
- Être adapté à un public international (France, Maroc, Japon, USA, Brésil)
- Être COMPLÈTEMENT DIFFÉRENT des thèmes précédents

RÈGLE CRITIQUE: Choisis une catégorie ou combinaison de catégories DIFFÉRENTE à chaque fois. Varie entre les catégories pour éviter la répétition.

Réponds UNIQUEMENT en JSON valide (pas de texte hors JSON):
{
  "title": string,              // Titre créatif, accrocheur et UNIQUE (ex: "Objets Vintage des Années 80", "Artisanat Local et Fait Main")
  "slug": string,               // Slug URL-friendly (ex: "objets-vintage-annees-80", "artisanat-local-fait-main")
  "impactText": string,         // Texte explicatif (2-3 phrases) qui décrit le thème, explique son intérêt écologique
                                // ET donne au moins 2 à 3 exemples concrets d'objets typiques de ce thème
                                // VARIER les exemples à chaque génération
                                // (ex: "veste en jean vintage", "console de jeux des années 90", "service de vaisselle en céramique fait main")
  "photoSearchQuery": string,   // Terme de recherche pour trouver une photo sur Unsplash (en anglais, ex: "vintage 80s objects", "handmade crafts sustainable")
  "targetCategories": string[]  // 1 à 3 catégories principales ciblées par ce thème (ex: ["VINTAGE", "CLOTHING"], ["HANDCRAFT", "HOME"])
}

IMPORTANT - Format JSON STRICT:
- Utilise UNIQUEMENT des guillemets doubles (") pour les clés et valeurs
- Échappe TOUS les guillemets dans les valeurs avec \\"
- Échappe les retours à la ligne avec \\n
- Pas de guillemets simples (') dans les valeurs
- Pas de texte avant ou après le JSON
- Pas de markdown, pas de code blocks
- Le JSON doit être valide et parseable

Exemple de réponse correcte:
{"title":"Mode Vintage & Rétro","slug":"mode-vintage-retro","impactText":"Cette semaine, redécouvrez le charme du vintage. Par exemple, une veste en jean des années 80 ou une console de jeux rétro.","photoSearchQuery":"vintage 80s fashion","targetCategories":["VINTAGE","CLOTHING"]}

Sortie: Réponds uniquement le JSON valide, sans texte supplémentaire, sans markdown, sans code blocks.`;
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
    targetCategories: string[];
  } {
    try {
      // Nettoyer la réponse - enlever les markdown code blocks
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Essayer d'extraire le JSON si la réponse contient du texte avant/après
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      this.logger.log(`🔍 Tentative de parsing JSON (premiers 500 caractères): ${cleanResponse.substring(0, 500)}...`);
      this.logger.log(`🔍 JSON complet: ${cleanResponse}`);

      // Essayer de réparer le JSON si nécessaire
      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError: any) {
        this.logger.warn(`⚠️  Premier parsing échoué, tentative de réparation...`);
        this.logger.warn(`🔍 Erreur: ${parseError.message}`);
        this.logger.warn(`🔍 Position de l'erreur: ${parseError.message.match(/position (\d+)/)?.[1] || 'inconnue'}`);

        // Essayer d'extraire les champs avec des regex plus permissives
        try {
          // Extraire title - accepter les guillemets simples ou doubles, gérer les échappements
          const titleMatch = cleanResponse.match(/"title"\s*:\s*["']([^"']*(?:\\.[^"']*)*)["']/);
          // Extraire impactText de la même manière
          const impactTextMatch = cleanResponse.match(/"impactText"\s*:\s*["']([^"']*(?:\\.[^"']*)*)["']/);
          // Extraire slug
          const slugMatch = cleanResponse.match(/"slug"\s*:\s*["']([^"']*(?:\\.[^"']*)*)["']/);
          // Extraire photoSearchQuery
          const photoSearchQueryMatch = cleanResponse.match(/"photoSearchQuery"\s*:\s*["']([^"']*(?:\\.[^"']*)*)["']/);
          // Extraire targetCategories (tableau)
          const targetCategoriesMatch = cleanResponse.match(/"targetCategories"\s*:\s*\[([^\]]*)\]/);

          if (titleMatch || impactTextMatch) {
            this.logger.log(`🔧 Extraction manuelle des champs JSON`);
            const extractedTitle = titleMatch?.[1]?.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n') || 'Thème Écoresponsable';
            const extractedImpactText = impactTextMatch?.[1]?.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n') || 'Thème généré automatiquement.';

            // Générer des catégories par défaut basées sur le titre si aucune n'est trouvée
            let defaultCategories: string[] = [];
            if (targetCategoriesMatch?.[1]) {
              defaultCategories = targetCategoriesMatch[1].split(',').map(c => c.trim().replace(/["']/g, '').toUpperCase()).filter(Boolean);
            }

            // Si aucune catégorie n'a été extraite, générer une catégorie par défaut basée sur le titre
            if (defaultCategories.length === 0) {
              const titleLower = extractedTitle.toLowerCase();
              // Mapper des mots-clés du titre vers des catégories
              if (titleLower.includes('vêtement') || titleLower.includes('mode') || titleLower.includes('veste') || titleLower.includes('vintage')) {
                defaultCategories = ['VINTAGE', 'CLOTHING'];
              } else if (titleLower.includes('maison') || titleLower.includes('décoration') || titleLower.includes('home')) {
                defaultCategories = ['HOME'];
              } else if (titleLower.includes('électronique') || titleLower.includes('jeux') || titleLower.includes('console')) {
                defaultCategories = ['ELECTRONICS'];
              } else if (titleLower.includes('livre') || titleLower.includes('book')) {
                defaultCategories = ['BOOKS'];
              } else if (titleLower.includes('outil') || titleLower.includes('jardin')) {
                defaultCategories = ['TOOLS'];
              } else if (titleLower.includes('jouet') || titleLower.includes('jeu')) {
                defaultCategories = ['TOYS'];
              } else if (titleLower.includes('artisanat') || titleLower.includes('fait main') || titleLower.includes('handcraft')) {
                defaultCategories = ['HANDCRAFT'];
              } else {
                // Catégorie par défaut
                defaultCategories = ['HOME'];
              }
              this.logger.log(`🔧 Catégories par défaut générées: ${defaultCategories.join(', ')}`);
            }

            parsed = {
              title: extractedTitle,
              impactText: extractedImpactText,
              slug: slugMatch?.[1]?.replace(/\\"/g, '"').replace(/\\'/g, "'") || extractedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              photoSearchQuery: photoSearchQueryMatch?.[1]?.replace(/\\"/g, '"').replace(/\\'/g, "'") || extractedTitle,
              targetCategories: defaultCategories,
            };
            this.logger.log(`✅ Extraction réussie: title="${parsed.title}", impactText="${parsed.impactText.substring(0, 50)}...", categories="${parsed.targetCategories.join(', ')}"`);
          } else {
            // Si on ne peut pas extraire, essayer de réparer le JSON en fermant les chaînes non terminées
            let repaired = cleanResponse;
            // Trouver les chaînes non terminées et les fermer
            repaired = repaired.replace(/"([^"]*)$/, '"$1"'); // Fermer la dernière chaîne si non terminée
            repaired = repaired.replace(/,\s*$/, ''); // Enlever les virgules finales
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1'); // Enlever les virgules avant les fermetures

            try {
              parsed = JSON.parse(repaired);
              this.logger.log(`✅ Réparation du JSON réussie`);
            } catch (e) {
              this.logger.error(`❌ Réparation du JSON échouée: ${e.message}`);
              throw parseError; // Relancer l'erreur originale
            }
          }
        } catch (repairError: any) {
          this.logger.error(`❌ Réparation du JSON échouée: ${repairError.message}`);
          throw parseError; // Relancer l'erreur originale
        }
      }

      this.logger.log(`🔍 JSON parsé: ${JSON.stringify(parsed, null, 2)}`);

      // Si le JSON parsé n'a pas tous les champs requis, essayer de les extraire manuellement
      if (!parsed.title || !parsed.impactText) {
        this.logger.warn(`⚠️  Champs manquants dans le JSON, extraction manuelle...`);

        // Extraire title et impactText avec regex plus permissive
        const titleRegex = /"title"\s*:\s*"((?:[^"\\]|\\.)*)"/;
        const impactTextRegex = /"impactText"\s*:\s*"((?:[^"\\]|\\.)*)"/;

        const titleMatch = cleanResponse.match(titleRegex);
        const impactTextMatch = cleanResponse.match(impactTextRegex);

        if (titleMatch) parsed.title = titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        if (impactTextMatch) parsed.impactText = impactTextMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      }

      // Validation avec Zod (avec valeurs par défaut si manquantes)
      // S'assurer qu'il y a au moins une catégorie
      const categories = parsed.targetCategories && parsed.targetCategories.length > 0
        ? parsed.targetCategories
        : ['HOME']; // Catégorie par défaut si aucune n'est fournie

      const validated = ThemeDraftSchema.parse({
        title: parsed.title || 'Thème Écoresponsable',
        impactText: parsed.impactText || 'Thème généré automatiquement pour encourager les échanges.',
        slug: parsed.slug || parsed.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'theme-ecoresponsable',
        photoSearchQuery: parsed.photoSearchQuery || parsed.title || 'échange écologique',
        targetCategories: categories,
      });

      // Nettoyer et valider les longueurs
      const result = {
        title: validated.title.trim().substring(0, 200),
        slug: validated.slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 100),
        impactText: validated.impactText.trim().substring(0, 500),
        photoSearchQuery: validated.photoSearchQuery.trim().substring(0, 100),
        targetCategories: validated.targetCategories
          .map((cat) => cat.trim().toUpperCase())
          .slice(0, 3),
      };

      this.logger.log(
        `✅ Validation réussie: titre="${result.title}", impactText="${result.impactText.substring(
          0,
          50,
        )}..."`,
      );

      return result;
    } catch (error: any) {
      // Ne pas faire remonter d'exception jusqu'aux contrôleurs :
      // on log et on laisse generateTheme() gérer le fallback.
      this.logger.warn(
        `⚠️  Erreur parsing réponse thème: ${error.message}`,
      );
      this.logger.warn(
        `🔍 Réponse brute thème (premiers 500 caractères): ${response.substring(
          0,
          500,
        )}`,
      );
      // Signal d'échec au niveau du parsing
      return null as any;
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

/**
 * FICHIER: gemini.service.ts (module eco)
 *
 * DESCRIPTION:
 * Ce service gère l'intégration avec l'API Google Gemini spécifiquement
 * pour l'enrichissement de contenus éco-éducatifs.
 *
 * DIFFÉRENCE AVEC ai/gemini.service.ts:
 * - Ce service est dédié à l'enrichissement de contenus éco
 * - Génère des résumés, tags et KPIs pour les articles/vidéos éco
 * - Utilise un modèle différent (gemini-1.5-flash)
 *
 * FONCTIONNALITÉS:
 * - Enrichissement automatique de contenus éco avec résumé, tags et KPIs
 * - Extraction de texte depuis HTML
 * - Validation et formatage des réponses IA
 */

// Import des classes NestJS
import { Injectable, Logger } from '@nestjs/common';

// Import des services
import { ConfigService } from '@nestjs/config';

// Import des DTOs
import { EnrichEcoContentResponse } from './dtos/eco-content.dto';

/**
 * SERVICE: GeminiService (module eco)
 *
 * Service pour l'enrichissement de contenus éco avec Gemini.
 */
@Injectable()
export class GeminiService {
  /**
   * Logger pour enregistrer les événements
   */
  private readonly logger = new Logger(GeminiService.name);

  /**
   * Clé API Gemini
   */
  private readonly apiKey: string;

  /**
   * URL de base de l'API Gemini
   */
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  /**
   * CONSTRUCTEUR
   *
   * Charge la clé API depuis la configuration.
   */
  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured - AI features disabled');
    }
  }

  // ============================================
  // MÉTHODE: enrichEcoContent
  // ============================================

  /**
   * Enrichit un contenu éco-éducatif avec Gemini.
   *
   * PROCESSUS:
   * 1. Construit un prompt avec le titre, l'URL et le contenu HTML (si disponible)
   * 2. Appelle l'API Gemini
   * 3. Parse et valide la réponse JSON
   * 4. Retourne le résumé, les tags et les KPIs
   *
   * @param title - Titre du contenu
   * @param url - URL du contenu
   * @param html - Contenu HTML (optionnel, extrait le texte si fourni)
   * @returns Résultat de l'enrichissement (summary, tags, kpis)
   * @throws Error si la clé API n'est pas configurée ou si l'enrichissement échoue
   */
  async enrichEcoContent({
    title,
    url,
    html,
  }: {
    title: string;
    url: string;
    html?: string;
  }): Promise<EnrichEcoContentResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildEnrichmentPrompt(title, url, html);

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response);
    } catch (error) {
      this.logger.error("Erreur lors de l'enrichissement Gemini:", error);
      throw new Error("Échec de l'enrichissement par IA");
    }
  }

  // ============================================
  // MÉTHODE PRIVÉE: buildEnrichmentPrompt
  // ============================================

  /**
   * Construit le prompt pour l'enrichissement de contenu éco.
   *
   * Le prompt demande à l'IA de:
   * - Générer un résumé concis (max 240 caractères) sur l'impact écologique
   * - Générer jusqu'à 8 tags pertinents en français
   * - Extraire des KPIs si des données chiffrées sont disponibles
   *
   * @param title - Titre du contenu
   * @param url - URL du contenu
   * @param html - Contenu HTML (optionnel)
   * @returns Prompt texte pour l'API Gemini
   */
  private buildEnrichmentPrompt(
    title: string,
    url: string,
    html?: string,
  ): string {
    const content = html ? this.extractTextFromHtml(html) : '';

    return `Analyse ce contenu éco-éducatif et génère un résumé et des tags pertinents.

Titre: ${title}
URL: ${url}
${content ? `Contenu: ${content.substring(0, 2000)}...` : ''}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "summary": "Résumé concis en français (max 240 caractères) expliquant l'impact écologique",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "kpis": {
    "co2Saved": "X kg CO2 épargnés",
    "wasteReduced": "X kg déchets évités",
    "energySaved": "X kWh économisés"
  }
}

Règles:
- Summary: maximum 240 caractères, focus sur l'impact écologique
- Tags: maximum 8 tags, en français, liés à l'écologie/durabilité
- KPIs: seulement si des données chiffrées sont disponibles
- Réponse JSON valide uniquement, pas de texte supplémentaire`;
  }

  // ============================================
  // MÉTHODE PRIVÉE: extractTextFromHtml
  // ============================================

  /**
   * Extrait le texte principal depuis du HTML.
   *
   * FONCTIONNEMENT:
   * - Supprime les balises <script> et <style>
   * - Supprime toutes les balises HTML
   * - Normalise les espaces multiples
   *
   * NOTE:
   * Extraction basique. Pour une extraction plus avancée,
   * utiliser une bibliothèque dédiée comme cheerio ou jsdom.
   *
   * @param html - Contenu HTML
   * @returns Texte extrait
   */
  private extractTextFromHtml(html: string): string {
    // Extraction basique du texte (à améliorer avec une lib dédiée si nécessaire)
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ============================================
  // MÉTHODE PRIVÉE: callGeminiAPI
  // ============================================

  /**
   * Appelle l'API Google Gemini avec un prompt.
   *
   * CONFIGURATION:
   * - Modèle: gemini-1.5-flash (rapide et économique)
   * - Temperature: 0.3 (réponses déterministes)
   * - Timeout: 10 secondes
   *
   * @param prompt - Prompt texte à envoyer à l'IA
   * @returns Réponse JSON de l'API Gemini
   * @throws Error si l'API retourne une erreur ou timeout
   */
  private async callGeminiAPI(prompt: string): Promise<any> {
    const url = `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

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
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("Timeout lors de l'appel à Gemini API");
      }
      throw error;
    }
  }

  // ============================================
  // MÉTHODE PRIVÉE: parseGeminiResponse
  // ============================================

  /**
   * Parse et valide la réponse Gemini pour l'enrichissement.
   *
   * PROCESSUS:
   * 1. Extrait le texte de la réponse
   * 2. Nettoie la réponse (enlève markdown si présent)
   * 3. Parse le JSON
   * 4. Valide la structure (summary, tags requis)
   * 5. Limite le résumé à 240 caractères
   * 6. Limite les tags à 8
   *
   * @param response - Réponse JSON de l'API Gemini
   * @returns Réponse validée et formatée
   * @throws Error si la réponse est invalide
   */
  private parseGeminiResponse(response: any): EnrichEcoContentResponse {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Réponse Gemini vide');
      }

      // Nettoyer la réponse (enlever markdown si présent)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);

      // Validation basique
      if (!parsed.summary || !Array.isArray(parsed.tags)) {
        throw new Error('Format de réponse Gemini invalide');
      }

      // Limiter le résumé à 240 caractères
      if (parsed.summary.length > 240) {
        parsed.summary = parsed.summary.substring(0, 237) + '...';
      }

      // Limiter les tags à 8
      if (parsed.tags.length > 8) {
        parsed.tags = parsed.tags.slice(0, 8);
      }

      return {
        summary: parsed.summary,
        tags: parsed.tags,
        kpis: parsed.kpis || undefined,
      };
    } catch (error) {
      this.logger.error('Erreur lors du parsing de la réponse Gemini:', error);
      throw new Error('Réponse Gemini invalide');
    }
  }
}

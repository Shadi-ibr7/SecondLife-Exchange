import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichEcoContentResponse } from './dtos/eco-content.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured - AI features disabled');
    }
  }

  /**
   * Enrichit un contenu éco avec Gemini
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

  /**
   * Construit le prompt pour l'enrichissement
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

  /**
   * Extrait le texte principal du HTML
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

  /**
   * Appelle l'API Gemini
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

  /**
   * Parse la réponse de Gemini
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

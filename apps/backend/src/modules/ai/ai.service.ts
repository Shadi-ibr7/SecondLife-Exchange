import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey: string;
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.geminiApiKey = this.configService.get('GEMINI_API_KEY');
  }

  @Cron(CronExpression.EVERY_MONDAY_AT_9AM)
  async generateWeeklySuggestions() {
    this.logger.log('Démarrage de la génération des suggestions hebdomadaires');

    if (!this.geminiApiKey) {
      this.logger.warn('Clé API Gemini non configurée, génération des suggestions ignorée');
      return;
    }

    try {
      // Désactiver le thème précédent
      await this.prisma.weeklyTheme.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Créer un nouveau thème pour cette semaine
      const now = new Date();
      const weekNumber = this.getWeekNumber(now);
      const year = now.getFullYear();

      const themePrompt = `
        Génère un thème créatif et inspirant pour une semaine d'échange d'objets.
        Le thème doit encourager les gens à échanger des objets liés à ce concept.
        Réponds uniquement avec un JSON contenant:
        {
          "title": "Titre du thème (max 50 caractères)",
          "description": "Description inspirante du thème (max 200 caractères)"
        }
      `;

      const themeResponse = await this.callGeminiApi(themePrompt);
      const themeData = JSON.parse(themeResponse);

      const weeklyTheme = await this.prisma.weeklyTheme.create({
        data: {
          title: themeData.title,
          description: themeData.description,
          weekNumber,
          year,
          isActive: true,
        },
      });

      // Générer des suggestions d'objets pour ce thème
      const suggestionsPrompt = `
        Basé sur le thème "${themeData.title}" - ${themeData.description},
        génère 10 suggestions d'objets que les gens pourraient échanger.
        Réponds uniquement avec un JSON contenant un tableau d'objets:
        [
          {
            "title": "Nom de l'objet",
            "description": "Description de l'objet",
            "category": "Catégorie (ex: Livres, Décoration, Électronique, etc.)",
            "reason": "Pourquoi cet objet correspond au thème"
          }
        ]
      `;

      const suggestionsResponse = await this.callGeminiApi(suggestionsPrompt);
      const suggestions = JSON.parse(suggestionsResponse);

      // Sauvegarder les suggestions
      for (const suggestion of suggestions) {
        await this.prisma.suggestedItem.create({
          data: {
            title: suggestion.title,
            description: suggestion.description,
            category: suggestion.category,
            reason: suggestion.reason,
            themeId: weeklyTheme.id,
          },
        });
      }

      this.logger.log(`Suggestions hebdomadaires générées: ${suggestions.length} objets pour le thème "${themeData.title}"`);
    } catch (error) {
      this.logger.error('Erreur lors de la génération des suggestions hebdomadaires:', error);
    }
  }

  async getCurrentTheme() {
    const theme = await this.prisma.weeklyTheme.findFirst({
      where: { isActive: true },
      include: {
        suggestedItems: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!theme) {
      // Créer un thème par défaut si aucun n'existe
      return this.createDefaultTheme();
    }

    return theme;
  }

  private async createDefaultTheme() {
    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    const defaultTheme = await this.prisma.weeklyTheme.create({
      data: {
        title: 'Échange Libre',
        description: 'Échangez librement vos objets préférés cette semaine !',
        weekNumber,
        year,
        isActive: true,
      },
    });

    // Ajouter quelques suggestions par défaut
    const defaultSuggestions = [
      {
        title: 'Livre de fiction',
        description: 'Roman ou livre de fiction en bon état',
        category: 'Livres',
        reason: 'Parfait pour découvrir de nouvelles histoires',
      },
      {
        title: 'Plante d\'intérieur',
        description: 'Plante verte pour décorer votre intérieur',
        category: 'Décoration',
        reason: 'Apporte de la vie à votre espace',
      },
      {
        title: 'Accessoire de cuisine',
        description: 'Ustensile ou accessoire de cuisine pratique',
        category: 'Cuisine',
        reason: 'Améliore votre expérience culinaire',
      },
    ];

    for (const suggestion of defaultSuggestions) {
      await this.prisma.suggestedItem.create({
        data: {
          ...suggestion,
          themeId: defaultTheme.id,
        },
      });
    }

    return {
      ...defaultTheme,
      suggestedItems: defaultSuggestions,
    };
  }

  private async callGeminiApi(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      this.logger.error('Erreur lors de l\'appel à l\'API Gemini:', error);
      throw new Error('Impossible de générer le contenu avec Gemini');
    }
  }

  private getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek) + 1;
  }
}

/**
 * FICHIER: themes.service.ts
 *
 * DESCRIPTION:
 * Ce service gère toute la logique métier pour les thèmes hebdomadaires.
 * Les thèmes sont générés par l'IA et proposent des idées d'objets à échanger
 * basées sur des concepts écologiques et culturels.
 *
 * FONCTIONNALITÉS:
 * - Création de thèmes hebdomadaires
 * - Mise à jour et activation de thèmes
 * - Récupération du thème actif avec ses suggestions
 * - Liste paginée des thèmes avec filtres de date
 * - Calendrier des thèmes par semaine
 * - Gestion automatique: un seul thème actif à la fois
 *
 * RÈGLES MÉTIER:
 * - Un seul thème peut être actif à la fois
 * - L'activation d'un thème désactive automatiquement les autres
 * - Les slugs doivent être uniques
 */

// Import des exceptions NestJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

// Import du service Prisma
import { PrismaService } from '../../common/prisma/prisma.service';

// Import des DTOs
import { CreateThemeDto } from './dtos/create-theme.dto';
import { UpdateThemeDto } from './dtos/update-theme.dto';

// Import des types Prisma
import { WeeklyTheme, Prisma } from '@prisma/client';

// Import des services IA et Unsplash
import { GeminiService } from '../ai/gemini.service';
import { UnsplashService } from '../unsplash/unsplash.service';

/**
 * INTERFACE: ThemeWithSuggestions
 *
 * Étend WeeklyTheme pour inclure les suggestions d'objets associées.
 * Utilisée pour typer les réponses des méthodes qui retournent un thème avec ses suggestions.
 */
export interface ThemeWithSuggestions extends WeeklyTheme {
  suggestions: Array<{
    id: string;
    name: string;
    category: string;
    country: string;
    era: string | null;
    popularity: number | null;
    createdAt: Date;
  }>;
}

/**
 * SERVICE: ThemesService
 *
 * Service principal pour la gestion des thèmes hebdomadaires.
 */
@Injectable()
export class ThemesService {
  /**
   * CONSTRUCTEUR
   *
   * Injection des services
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly unsplashService: UnsplashService,
  ) {}

  // ============================================
  // MÉTHODE: createTheme (Créer un thème)
  // ============================================

  /**
   * Crée un nouveau thème hebdomadaire.
   *
   * VALIDATION:
   * - Vérifie que le slug est unique
   * - Si le thème est activé, désactive automatiquement les autres
   *
   * @param createThemeDto - Données du thème à créer
   * @returns Thème créé
   * @throws BadRequestException si le slug existe déjà
   */
  async createTheme(createThemeDto: CreateThemeDto): Promise<WeeklyTheme> {
    // ============================================
    // VÉRIFICATION DE L'UNICITÉ DU SLUG
    // ============================================
    // Vérifier que le slug est unique
    const existingTheme = await this.prisma.weeklyTheme.findUnique({
      where: { slug: createThemeDto.slug },
    });

    if (existingTheme) {
      throw new BadRequestException('Un thème avec ce slug existe déjà');
    }

    // ============================================
    // GESTION DE L'ACTIVATION
    // ============================================
    // Si on active ce thème, désactiver les autres
    // Règle métier: un seul thème actif à la fois
    if (createThemeDto.isActive) {
      await this.prisma.weeklyTheme.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.weeklyTheme.create({
      data: createThemeDto,
    });
  }

  // ============================================
  // MÉTHODE: updateTheme (Mettre à jour un thème)
  // ============================================

  /**
   * Met à jour un thème existant.
   *
   * VALIDATION:
   * - Vérifie que le thème existe
   * - Vérifie l'unicité du slug si modifié
   * - Si le thème est activé, désactive automatiquement les autres
   *
   * @param id - ID du thème à mettre à jour
   * @param updateThemeDto - Données à mettre à jour
   * @returns Thème mis à jour
   * @throws NotFoundException si le thème n'existe pas
   * @throws BadRequestException si le slug existe déjà
   */
  async updateTheme(
    id: string,
    updateThemeDto: UpdateThemeDto,
  ): Promise<WeeklyTheme> {
    // Vérifier que le thème existe
    const existingTheme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
    });

    if (!existingTheme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // ============================================
    // VÉRIFICATION DE L'UNICITÉ DU SLUG
    // ============================================
    // Vérifier l'unicité du slug si modifié
    if (updateThemeDto.slug && updateThemeDto.slug !== existingTheme.slug) {
      const slugExists = await this.prisma.weeklyTheme.findUnique({
        where: { slug: updateThemeDto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Un thème avec ce slug existe déjà');
      }
    }

    // ============================================
    // GESTION DE L'ACTIVATION
    // ============================================
    // Si on active ce thème, désactiver les autres
    if (updateThemeDto.isActive) {
      await this.prisma.weeklyTheme.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.weeklyTheme.update({
      where: { id },
      data: updateThemeDto,
    });
  }

  // ============================================
  // MÉTHODE: getActiveTheme (Récupérer le thème actif)
  // ============================================

  /**
   * Récupère le thème actuellement actif avec toutes ses suggestions.
   *
   * @returns Thème actif avec suggestions, ou null si aucun thème n'est actif
   */
  async getActiveTheme(): Promise<any | null> {
    const theme = await this.prisma.weeklyTheme.findFirst({
      where: { isActive: true },
      include: {
        suggestions: {
          select: {
            id: true,
            name: true,
            category: true,
            country: true,
            era: true,
            popularity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!theme) return null;

    // Mapper pour inclure targetCategories comme array
    return {
      ...theme,
      targetCategories: Array.isArray(theme.targetCategories)
        ? theme.targetCategories
        : theme.targetCategories
        ? JSON.parse(theme.targetCategories as any)
        : [],
    };
  }

  // ============================================
  // MÉTHODE: getThemeById (Récupérer un thème)
  // ============================================

  /**
   * Récupère un thème par son ID avec toutes ses suggestions.
   *
   * @param id - ID du thème
   * @returns Thème avec suggestions
   * @throws NotFoundException si le thème n'existe pas
   */
  async getThemeById(id: string): Promise<any> {
    const theme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
      include: {
        suggestions: {
          select: {
            id: true,
            name: true,
            category: true,
            country: true,
            era: true,
            popularity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Mapper pour inclure targetCategories comme array
    return {
      ...theme,
      targetCategories: Array.isArray(theme.targetCategories)
        ? theme.targetCategories
        : theme.targetCategories
        ? JSON.parse(theme.targetCategories as any)
        : [],
    };
  }

  // ============================================
  // MÉTHODE: listThemes (Lister les thèmes)
  // ============================================

  /**
   * Liste les thèmes avec pagination et filtres de date.
   *
   * FILTRES:
   * - from: Date de début (ISO string)
   * - to: Date de fin (ISO string)
   *
   * @param page - Numéro de page (défaut: 1)
   * @param limit - Nombre d'éléments par page (défaut: 20)
   * @param from - Date de début pour filtrer (optionnel)
   * @param to - Date de fin pour filtrer (optionnel)
   * @returns Liste paginée de thèmes
   */
  async listThemes(
    page: number = 1,
    limit: number = 20,
    from?: string,
    to?: string,
  ): Promise<{
    themes: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: Prisma.WeeklyThemeWhereInput = {};

    if (from || to) {
      where.startOfWeek = {};
      if (from) {
        where.startOfWeek.gte = new Date(from);
      }
      if (to) {
        where.startOfWeek.lte = new Date(to);
      }
    }

    const [themes, total] = await Promise.all([
      this.prisma.weeklyTheme.findMany({
        where,
        orderBy: { startOfWeek: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.weeklyTheme.count({ where }),
    ]);

    // Mapper pour inclure targetCategories comme array
    const themesWithCategories = themes.map((theme) => ({
      ...theme,
      targetCategories: Array.isArray(theme.targetCategories)
        ? theme.targetCategories
        : theme.targetCategories
        ? JSON.parse(theme.targetCategories as any)
        : [],
    }));

    return {
      themes: themesWithCategories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // MÉTHODE: activateTheme (Activer un thème)
  // ============================================

  /**
   * Active un thème spécifique et désactive automatiquement tous les autres.
   *
   * RÈGLE MÉTIER:
   * - Un seul thème peut être actif à la fois
   * - L'activation d'un thème désactive automatiquement les autres
   *
   * @param id - ID du thème à activer
   * @returns Thème activé
   * @throws NotFoundException si le thème n'existe pas
   */
  async activateTheme(id: string): Promise<WeeklyTheme> {
    const theme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    // Désactiver tous les autres thèmes
    await this.prisma.weeklyTheme.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activer le thème sélectionné
    return this.prisma.weeklyTheme.update({
      where: { id },
      data: { isActive: true },
    });
  }

  // ============================================
  // MÉTHODE: deleteTheme (Supprimer un thème)
  // ============================================

  /**
   * Supprime un thème de la base de données.
   *
   * NOTE:
   * - Les suggestions associées peuvent être affectées selon la configuration Prisma
   *
   * @param id - ID du thème à supprimer
   * @throws NotFoundException si le thème n'existe pas
   */
  async deleteTheme(id: string): Promise<void> {
    const theme = await this.prisma.weeklyTheme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    await this.prisma.weeklyTheme.delete({
      where: { id },
    });
  }

  // ============================================
  // MÉTHODE: findOrCreateActiveThemeForDate
  // ============================================

  /**
   * Trouve ou crée le thème actif pour une date donnée.
   * Si aucun thème n'existe, génère automatiquement un thème avec l'IA et une photo Unsplash.
   *
   * UTILISATION:
   * - Appelée par le scheduler pour s'assurer qu'un thème existe pour chaque semaine
   * - Si aucun thème n'existe pour la semaine, génère un thème avec l'IA
   *
   * @param date - Date pour laquelle trouver/créer le thème
   * @returns Thème actif pour cette date
   */
  async findOrCreateActiveThemeForDate(date: Date): Promise<WeeklyTheme> {
    // Trouver le lundi de la semaine
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    // Chercher un thème pour cette semaine
    let theme = await this.prisma.weeklyTheme.findFirst({
      where: {
        startOfWeek: {
          gte: monday,
          lt: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Si aucun thème trouvé, générer un thème avec l'IA
    if (!theme) {
      theme = await this.generateThemeWithAI(monday);
    }

    return theme;
  }

  /**
   * Génère les 4 thèmes du mois en une fois.
   * Calcule les 4 lundis du mois et génère un thème pour chacun.
   *
   * @param month - Date du mois (n'importe quel jour du mois)
   * @returns Liste des thèmes générés
   */
  async generateMonthlyThemes(month: Date = new Date()): Promise<WeeklyTheme[]> {
    const themes: WeeklyTheme[] = [];
    
    // Trouver le premier lundi du mois
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    let firstMonday = new Date(firstDay);
    
    // Trouver le premier lundi
    const dayOfWeek = firstMonday.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    firstMonday.setDate(firstDay.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));
    
    // Générer les 4 thèmes (4 semaines)
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (week * 7));
      
      // Vérifier si un thème existe déjà pour cette semaine
      const existingTheme = await this.prisma.weeklyTheme.findFirst({
        where: {
          startOfWeek: {
            gte: weekStart,
            lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      });
      
      if (existingTheme) {
        console.log(`⚠️  Thème déjà existant pour la semaine du ${weekStart.toLocaleDateString('fr-FR')}`);
        themes.push(existingTheme);
      } else {
        const theme = await this.generateThemeWithAI(weekStart);
        themes.push(theme);
      }
    }
    
    return themes;
  }

  /**
   * Génère automatiquement un thème avec l'IA et récupère une photo depuis Unsplash.
   *
   * @param startOfWeek - Date de début de la semaine (lundi)
   * @returns Thème généré
   */
  async generateThemeWithAI(startOfWeek: Date): Promise<WeeklyTheme> {
    console.log('🎨 Début génération thème avec IA pour:', startOfWeek.toISOString());
    
    // Générer le thème avec l'IA
    const aiTheme = await this.geminiService.generateTheme(startOfWeek);
    
    if (!aiTheme) {
      console.warn('⚠️  L\'IA n\'a pas pu générer le thème, utilisation du fallback');
    } else {
      console.log('✅ Thème généré par l\'IA:', aiTheme.title);
      console.log('📋 Catégories ciblées:', aiTheme.targetCategories?.join(', ') || 'Aucune');
    }

    if (!aiTheme) {
      // Fallback si l'IA échoue - générer un titre plus créatif avec slug unique
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const monthName = monthNames[startOfWeek.getMonth()];
      const timestamp = Date.now();
      const defaultTitle = `Échange Écoresponsable - ${monthName} ${startOfWeek.getFullYear()}`;
      const defaultSlug = `echange-ecoresponsable-${monthName.toLowerCase()}-${startOfWeek.getFullYear()}-${timestamp}`;

      // Vérifier si le slug existe déjà et générer un nouveau slug si nécessaire
      let finalSlug = defaultSlug;
      let slugExists = await this.prisma.weeklyTheme.findUnique({
        where: { slug: finalSlug },
      });
      
      if (slugExists) {
        // Ajouter un suffixe aléatoire si le slug existe déjà
        finalSlug = `${defaultSlug}-${Math.random().toString(36).substring(2, 9)}`;
      }

      const theme = await this.prisma.weeklyTheme.create({
        data: {
          title: defaultTitle,
          slug: finalSlug,
          startOfWeek,
          impactText:
            "Ce thème a été généré automatiquement pour encourager les échanges d'objets écoresponsables. " +
            "Profitez-en pour proposer, par exemple, une veste en jean vintage que vous ne portez plus, " +
            "un service de vaisselle en céramique que vous souhaitez transmettre, ou encore un petit appareil " +
            "électronique réparable (radio, console de jeux, enceinte) qui peut avoir une seconde vie chez quelqu'un d'autre.",
          targetCategories: [],
          isActive: true,
        },
      });

      await this.prisma.weeklyTheme.updateMany({
        where: {
          isActive: true,
          id: { not: theme.id },
        },
        data: { isActive: false },
      });

      return theme;
    }

    // Rechercher une photo sur Unsplash
    let photoUrl: string | null = null;
    let photoUnsplashId: string | null = null;

    if (aiTheme?.photoSearchQuery) {
      console.log('📸 Recherche photo Unsplash pour:', aiTheme.photoSearchQuery);
      const unsplashPhoto = await this.unsplashService.searchPhoto(aiTheme.photoSearchQuery);
      if (unsplashPhoto) {
        photoUrl = unsplashPhoto.urls.regular;
        photoUnsplashId = unsplashPhoto.id;
        console.log('✅ Photo Unsplash trouvée:', photoUrl);
        
        // Déclencher le téléchargement pour l'attribution (requis par Unsplash)
        // On récupère d'abord les détails complets de la photo pour obtenir download_location
        try {
          const photoDetails = await this.unsplashService.getPhotoById(unsplashPhoto.id);
          if (photoDetails?.links?.download_location) {
            await this.unsplashService.triggerDownload(photoDetails.links.download_location);
          }
        } catch (error) {
          console.warn('⚠️  Impossible de déclencher le téléchargement Unsplash:', error);
          // Ignorer les erreurs de téléchargement, ce n'est pas critique
        }
      } else {
        console.warn('⚠️  Aucune photo Unsplash trouvée pour:', aiTheme.photoSearchQuery);
      }
    }

    // Vérifier si c'est la semaine actuelle
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
    currentWeekStart.setHours(0, 0, 0, 0);

    const themeWeekStart = new Date(startOfWeek);
    themeWeekStart.setHours(0, 0, 0, 0);

    const isCurrentWeek =
      themeWeekStart.getTime() === currentWeekStart.getTime() ||
      (themeWeekStart <= now && new Date(themeWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000) > now);

    // Créer le thème avec les données générées par l'IA
    // Activer uniquement si c'est la semaine actuelle
    const theme = await this.prisma.weeklyTheme.create({
      data: {
        title: aiTheme.title,
        slug: aiTheme.slug,
        startOfWeek,
        impactText: aiTheme.impactText,
        photoUrl,
        photoUnsplashId,
        targetCategories: aiTheme.targetCategories || [],
        isActive: isCurrentWeek,
      },
    });

    // Si c'est la semaine actuelle, désactiver les autres thèmes
    if (isCurrentWeek) {
      await this.prisma.weeklyTheme.updateMany({
        where: {
          isActive: true,
          id: { not: theme.id },
        },
        data: { isActive: false },
      });
    }

    return theme;
  }

  // ============================================
  // MÉTHODE: getCalendar (Calendrier des thèmes)
  // ============================================

  /**
   * Récupère le calendrier des thèmes organisé par semaine.
   *
   * RETOURNE:
   * - Une grille de semaines avec le thème associé à chaque semaine
   * - Les semaines passées (3 semaines) et futures (9 semaines par défaut)
   *
   * @param weeks - Nombre de semaines à inclure (défaut: 12)
   * @returns Calendrier avec les thèmes par semaine
   */
  /**
   * Récupère les 4 semaines du mois actuel avec leurs thèmes.
   *
   * @param month - Date du mois (n'importe quel jour du mois, défaut: mois actuel)
   * @returns Calendrier avec les 4 semaines du mois
   */
  async getMonthCalendar(month: Date = new Date()) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // Trouver le premier lundi du mois
    const firstDay = new Date(year, monthIndex, 1);
    let firstMonday = new Date(firstDay);
    const dayOfWeek = firstMonday.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    firstMonday.setDate(firstDay.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));

    // Calculer les dates de début et fin pour récupérer les thèmes
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    // Récupérer tous les thèmes du mois
    const themes = await this.prisma.weeklyTheme.findMany({
      where: {
        startOfWeek: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: { startOfWeek: 'asc' },
    });

    const calendar = [];
    const now = new Date();

    // Générer les 4 semaines du mois
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Trouver le thème pour cette semaine
      const theme = themes.find((t) => {
        const themeStart = new Date(t.startOfWeek);
        const themeEnd = new Date(themeStart);
        themeEnd.setDate(themeEnd.getDate() + 6);
        return themeStart <= weekEnd && themeEnd >= weekStart;
      });

      calendar.push({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        title: theme?.title || 'Thème à venir',
        isActive: !!theme && theme.isActive,
        themeId: theme?.id || null,
        theme: theme
          ? {
              id: theme.id,
              title: theme.title,
              startOfWeek: theme.startOfWeek.toISOString(),
              slug: theme.slug,
              photoUrl: theme.photoUrl,
              impactText: theme.impactText,
              targetCategories: Array.isArray(theme.targetCategories)
                ? theme.targetCategories
                : theme.targetCategories
                ? JSON.parse(theme.targetCategories as any)
                : [],
            }
          : null,
      });
    }

    return {
      weeks: calendar,
      month: monthIndex + 1,
      year,
      currentWeek: calendar.findIndex(
        (w) =>
          w.theme &&
          new Date(w.weekStart) <= now &&
          new Date(w.weekEnd) >= now,
      ),
    };
  }

  async getCalendar(weeks: number = 12) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 3 * 7); // 3 semaines passées

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (weeks - 3) * 7); // 8 semaines futures

    // Récupérer tous les thèmes dans la période
    const themes = await this.prisma.weeklyTheme.findMany({
      where: {
        startOfWeek: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startOfWeek: 'asc',
      },
    });

    // Créer la grille de semaines
    const calendar = [];
    const currentDate = new Date(startDate);

    // S'assurer que currentDate commence un lundi
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + daysToMonday);

    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Trouver le thème actif pour cette semaine
      const activeTheme = themes.find((theme) => {
        const themeStart = new Date(theme.startOfWeek);
        const themeEnd = new Date(themeStart);
        themeEnd.setDate(themeEnd.getDate() + 6);
        return themeStart <= weekEnd && themeEnd >= weekStart;
      });

      calendar.push({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        title: activeTheme?.title || 'Aucun thème',
        isActive: !!activeTheme,
        themeId: activeTheme?.id || null,
        theme: activeTheme
          ? {
              id: activeTheme.id,
              title: activeTheme.title,
              startOfWeek: activeTheme.startOfWeek.toISOString(),
              slug: activeTheme.slug,
              photoUrl: activeTheme.photoUrl,
              impactText: activeTheme.impactText,
              targetCategories: Array.isArray(activeTheme.targetCategories)
                ? activeTheme.targetCategories
                : activeTheme.targetCategories
                ? JSON.parse(activeTheme.targetCategories as any)
                : [],
            }
          : null,
      });

      // Passer à la semaine suivante
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return {
      weeks: calendar,
      totalWeeks: weeks,
      currentWeek: Math.floor(
        (now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      ),
    };
  }
}

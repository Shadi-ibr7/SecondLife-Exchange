/**
 * FICHIER: admin.service.ts
 *
 * DESCRIPTION:
 * Service principal pour toutes les opérations admin.
 */

import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ItemStatus, NotificationType } from '@prisma/client';
import { ThemesService } from '../themes/themes.service';
import {
  SuggestionsService,
  SuggestionStats,
} from '../suggestions/suggestions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateThemeDto } from '../themes/dtos/create-theme.dto';
import { UpdateThemeDto } from '../themes/dtos/update-theme.dto';
import { AuditService } from './services/audit.service';
import { AdminActionType } from './enums/admin-action-type.enum';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private themesService: ThemesService,
    private suggestionsService: SuggestionsService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  /**
   * Helper pour logger les erreurs Prisma avec contexte
   */
  private handlePrismaError(error: any, context: string, requestId?: string): never {
    const isProduction = process.env.NODE_ENV === 'production';

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        JSON.stringify({
          requestId,
          context,
          errorCode: error.code,
          errorMessage: error.message,
        }),
      );
      // Erreurs Prisma connues -> 500 avec message générique en prod
      throw new InternalServerErrorException(
        isProduction
          ? 'Erreur de base de données'
          : `Erreur Prisma ${error.code}: ${error.message}`,
      );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(
        JSON.stringify({
          requestId,
          context,
          errorMessage: error.message,
        }),
      );
      throw new InternalServerErrorException(
        isProduction ? 'Erreur de validation de base de données' : error.message,
      );
    }

    // Autres erreurs Prisma (connexion, timeout, etc.)
    this.logger.error(
      JSON.stringify({
        requestId,
        context,
        errorMessage: error?.message || 'Unknown Prisma error',
        errorType: error?.constructor?.name,
      }),
    );
    throw new InternalServerErrorException(
      isProduction ? 'Erreur de base de données' : error?.message || 'Erreur inconnue',
    );
  }

  // Dashboard Stats
  async getDashboardStats(requestId?: string) {
    try {
      const [
        totalUsers,
        totalItems,
        totalExchanges,
        openReports,
        usersLastMonth,
        itemsLastMonth,
        exchangesLastMonth,
        reportsLastMonth,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.item.count(),
        this.prisma.exchange.count(),
        this.prisma.report.count({ where: { resolved: false } }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.item.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.exchange.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.report.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const totalUsersBefore = totalUsers - usersLastMonth;
      const totalItemsBefore = totalItems - itemsLastMonth;
      const totalExchangesBefore = totalExchanges - exchangesLastMonth;
      const totalReportsBefore = openReports - reportsLastMonth;

      return {
        totalUsers,
        totalItems,
        totalExchanges,
        openReports,
        usersGrowth:
          totalUsersBefore > 0 ? (usersLastMonth / totalUsersBefore) * 100 : 0,
        itemsGrowth:
          totalItemsBefore > 0 ? (itemsLastMonth / totalItemsBefore) * 100 : 0,
        exchangesGrowth:
          totalExchangesBefore > 0
            ? (exchangesLastMonth / totalExchangesBefore) * 100
            : 0,
        reportsGrowth:
          totalReportsBefore > 0
            ? (reportsLastMonth / totalReportsBefore) * 100
            : 0,
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'AdminService.getDashboardStats', requestId);
    }
  }

  // Users Management
  async getUsers(page = 1, limit = 20, search?: string, requestId?: string) {
    try {
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            ban: true,
            _count: {
              select: {
                items: true,
                exchangesRequested: true,
                exchangesResponded: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.handlePrismaError(error, 'AdminService.getUsers', requestId);
    }
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        ban: true,
        items: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            items: true,
            exchangesRequested: true,
            exchangesResponded: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async banUser(userId: string, adminId: string, reason?: string, req?: Request) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.prisma.ban.upsert({
      where: { userId },
      update: { reason },
      create: {
        userId,
        reason,
      },
    });

    await this.logAction(adminId, 'BAN_USER', 'User', userId, { reason }, req);

    return { success: true };
  }

  async unbanUser(userId: string, adminId: string, req?: Request) {
    await this.prisma.ban.deleteMany({ where: { userId } });
    await this.logAction(adminId, 'UNBAN_USER', 'User', userId, undefined, req);
    return { success: true };
  }

  // Items Management
  async getItems(
    page = 1,
    limit = 20,
    filters?: { ownerId?: string; category?: string; status?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          photos: { take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getItemById(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            // Si vous avez des relations de recommandations ou likes
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Objet non trouvé');
    }

    return item;
  }

  async archiveItem(itemId: string, adminId: string, req?: Request) {
    await this.prisma.item.update({
      where: { id: itemId },
      data: { status: ItemStatus.ARCHIVED },
    });

    await this.logAction(adminId, 'ARCHIVE_ITEM', 'Item', itemId, undefined, req);
    return { success: true };
  }

  async deleteItem(itemId: string, adminId: string, req?: Request) {
    await this.prisma.item.delete({ where: { id: itemId } });
    await this.logAction(adminId, 'DELETE_ITEM', 'Item', itemId, undefined, req);
    return { success: true };
  }

  // Reports Management
  async getReports(page = 1, limit = 20, resolved?: boolean) {
    const skip = (page - 1) * limit;
    const where = resolved !== undefined ? { resolved } : {};

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    // Récupérer les données liées pour chaque rapport
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        let reporter = null;
        let targetUser = null;
        let targetItem = null;

        if (report.reporterId) {
          reporter = await this.prisma.user.findUnique({
            where: { id: report.reporterId },
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          });
        }

        if (report.targetUserId) {
          targetUser = await this.prisma.user.findUnique({
            where: { id: report.targetUserId },
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          });
        }

        if (report.targetItemId) {
          targetItem = await this.prisma.item.findUnique({
            where: { id: report.targetItemId },
            select: {
              id: true,
              title: true,
              photos: { take: 1 },
            },
          });
        }

        return {
          ...report,
          reporter,
          targetUser,
          targetItem,
        };
      }),
    );

    return {
      reports: enrichedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportById(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    // Récupérer les données liées manuellement car pas de relations définies
    let reporter = null;
    let targetUser = null;
    let targetItem = null;

    if (report.reporterId) {
      reporter = await this.prisma.user.findUnique({
        where: { id: report.reporterId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    }

    if (report.targetUserId) {
      targetUser = await this.prisma.user.findUnique({
        where: { id: report.targetUserId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
          ban: true,
        },
      });
    }

    if (report.targetItemId) {
      targetItem = await this.prisma.item.findUnique({
        where: { id: report.targetItemId },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          condition: true,
          status: true,
          photos: true,
        },
      });
    }

    return {
      ...report,
      reporter,
      targetUser,
      targetItem,
    };
  }

  async resolveReport(
    reportId: string,
    adminId: string,
    banUser = false,
    deleteItem = false,
    archive = false,
    req?: Request,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    // Si archivé, on marque juste comme résolu sans action
    if (archive) {
      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: adminId,
        },
      });

      await this.logAction(adminId, 'ARCHIVE_REPORT', 'Report', reportId, undefined, req);
      return { success: true };
    }

    // Supprimer l'item si demandé et si c'est un signalement d'item
    if (deleteItem && report.targetItemId) {
      await this.deleteItem(report.targetItemId, adminId, req);

      // Notifier l'utilisateur propriétaire de l'item
      const item = await this.prisma.item.findUnique({
        where: { id: report.targetItemId },
        select: { id: true, ownerId: true, title: true },
      });

      if (item) {
        await this.notificationsService.createNotification({
          userId: item.ownerId,
          type: NotificationType.ADMIN_ACTION,
          title: 'Annonce supprimée',
          body: `Votre annonce "${item.title}" a été supprimée suite à un signalement.`,
          data: {
            itemId: item.id,
            reportId: reportId,
          },
        });
      }
    }

    // Bannir l'utilisateur si demandé
    if (banUser && report.targetUserId) {
      await this.banUser(
        report.targetUserId,
        adminId,
        `Banni suite au signalement #${reportId}`,
        req,
      );

      // Notifier l'utilisateur banni
      const targetUser = await this.prisma.user.findUnique({
        where: { id: report.targetUserId },
        select: { email: true, displayName: true },
      });

      if (targetUser) {
        await this.notificationsService.createNotification({
          userId: report.targetUserId,
          type: NotificationType.ADMIN_ACTION,
          title: 'Compte banni',
          body: `Votre compte a été banni suite à un signalement. Raison: Signalement #${reportId}`,
          data: {
            reportId: reportId,
            reason: `Signalement #${reportId}`,
          },
        });

        // TODO: Envoyer un email de notification (à implémenter avec un service d'email)
        // Pour l'instant, on utilise seulement les notifications in-app
      }
    }

    // Marquer le signalement comme résolu
    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    await this.logAction(adminId, 'RESOLVE_REPORT', 'Report', reportId, {
      banUser,
      deleteItem,
    }, req);
    return { success: true };
  }

  async deleteReport(reportId: string, adminId: string, req?: Request) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    await this.prisma.report.delete({ where: { id: reportId } });
    await this.logAction(adminId, 'DELETE_REPORT', 'Report', reportId, undefined, req);
    return { success: true };
  }

  // Themes Management
  async getThemes() {
    const themes = await this.prisma.weeklyTheme.findMany({
      include: {
        _count: {
          select: { suggestions: true },
        },
      },
      orderBy: { startOfWeek: 'desc' },
    });

    // Enrichir avec les stats réelles pour chaque thème
    const themesWithStats = await Promise.all(
      themes.map(async (theme) => {
        const startDate = new Date(theme.startOfWeek);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // Semaine = 7 jours

        // Compter les items créés pendant la période du thème
        const itemsCount = await this.prisma.item.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        // Compter les échanges créés/complétés pendant la période du thème
        const exchangesCount = await this.prisma.exchange.count({
          where: {
            OR: [
              {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                status: 'COMPLETED',
                completedAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ],
          },
        });

        // Compter les utilisateurs uniques qui ont créé des items ou participé à des échanges pendant cette période
        const [usersWithItems, usersWithExchanges] = await Promise.all([
          this.prisma.user.findMany({
            where: {
              items: {
                some: {
                  createdAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
            },
            select: { id: true },
          }),
          this.prisma.user.findMany({
            where: {
              OR: [
                {
                  exchangesRequested: {
                    some: {
                      OR: [
                        {
                          createdAt: {
                            gte: startDate,
                            lte: endDate,
                          },
                        },
                        {
                          status: 'COMPLETED',
                          completedAt: {
                            gte: startDate,
                            lte: endDate,
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  exchangesResponded: {
                    some: {
                      OR: [
                        {
                          createdAt: {
                            gte: startDate,
                            lte: endDate,
                          },
                        },
                        {
                          status: 'COMPLETED',
                          completedAt: {
                            gte: startDate,
                            lte: endDate,
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
            select: { id: true },
          }),
        ]);

        // Combiner et dédupliquer les utilisateurs
        const uniqueUserIds = new Set([
          ...usersWithItems.map((u) => u.id),
          ...usersWithExchanges.map((u) => u.id),
        ]);

        return {
          ...theme,
          stats: {
            suggestions: theme._count.suggestions,
            items: itemsCount,
            exchanges: exchangesCount,
            participants: uniqueUserIds.size,
          },
        };
      }),
    );

    return themesWithStats;
  }

  async getThemeById(id: string) {
    return this.themesService.getThemeById(id);
  }

  async createTheme(data: CreateThemeDto, adminId: string) {
    const theme = await this.themesService.createTheme(data);
    await this.logAction(adminId, 'CREATE_THEME', 'WeeklyTheme', theme.id, {
      title: theme.title,
      startOfWeek: theme.startOfWeek,
    });
    return theme;
  }

  async updateTheme(id: string, data: UpdateThemeDto, adminId: string) {
    const theme = await this.themesService.updateTheme(id, data);
    await this.logAction(
      adminId,
      'UPDATE_THEME',
      'WeeklyTheme',
      theme.id,
      data,
    );
    return theme;
  }

  async activateTheme(id: string, adminId: string) {
    const theme = await this.themesService.activateTheme(id);
    await this.logAction(adminId, 'ACTIVATE_THEME', 'WeeklyTheme', id);
    return theme;
  }

  async deleteTheme(id: string, adminId: string) {
    await this.themesService.deleteTheme(id);
    await this.logAction(adminId, 'DELETE_THEME', 'WeeklyTheme', id);
    return { success: true };
  }

  async generateThemeSuggestions(
    id: string,
    adminId: string,
    locales?: string[],
  ): Promise<SuggestionStats> {
    const theme = await this.prisma.weeklyTheme.findUnique({ where: { id } });
    if (!theme) {
      throw new NotFoundException('Thème non trouvé');
    }

    const stats = await this.suggestionsService.generateAndSaveSuggestions(
      id,
      theme.title,
      locales && locales.length > 0 ? locales : undefined,
    );

    await this.logAction(
      adminId,
      'GENERATE_THEME_SUGGESTIONS',
      'WeeklyTheme',
      id,
      stats,
    );
    return stats;
  }

  async getThemeSuggestions(
    id: string,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  ) {
    return this.suggestionsService.getThemeSuggestions(id, page, limit, sort);
  }

  async getThemeSuggestionStats(id: string) {
    return this.suggestionsService.getThemeStats(id);
  }

  async generateTheme(adminId: string): Promise<any> {
    try {
      const now = new Date();
      const theme = await this.themesService.generateThemeWithAI(now);
      await this.logAction(adminId, 'GENERATE_THEME', 'WeeklyTheme', theme.id, {
        title: theme.title,
        startOfWeek: theme.startOfWeek,
      });
      return theme;
    } catch (error: any) {
      console.error('❌ Erreur génération thème:', error);
      throw error;
    }
  }

  async generateMonthlyThemes(adminId: string, month?: Date): Promise<any[]> {
    try {
      const themes = await this.themesService.generateMonthlyThemes(month);
      await this.logAction(
        adminId,
        'GENERATE_MONTHLY_THEMES',
        'WeeklyTheme',
        null,
        {
          count: themes.length,
          month: month ? month.toISOString() : new Date().toISOString(),
        },
      );
      return themes;
    } catch (error: any) {
      console.error('❌ Erreur génération thèmes mensuels:', error);
      throw error;
    }
  }

  // Eco Content Management
  async getEcoContent(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [content, total] = await Promise.all([
      this.prisma.ecoContent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ecoContent.count(),
    ]);

    return {
      content,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEcoContentById(id: string) {
    const content = await this.prisma.ecoContent.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    return content;
  }

  async createEcoContent(data: any, adminId: string, req?: Request) {
    const content = await this.prisma.ecoContent.create({
      data: {
        kind: data.kind || 'article',
        title: data.title,
        url: data.url || '',
        locale: data.locale || 'fr',
        tags: data.tags || [],
        source: data.source,
        summary: data.summary,
        kpis: data.kpis,
        publishedAt: data.published ? new Date() : null,
      },
    });

    await this.logAction(
      adminId,
      'CREATE_ECO_CONTENT',
      'EcoContent',
      content.id,
      {
        title: content.title,
      },
      req,
    );

    // Si le contenu est publié, notifier les admins (non bloquant)
    if (data.published) {
      this.notifyEcoContentPublished(content.id, content.title).catch(() => {
        // Erreur silencieuse
      });
    }

    return content;
  }

  /**
   * Notifie les administrateurs de la publication d'un contenu éco.
   */
  private async notifyEcoContentPublished(
    contentId: string,
    contentTitle: string,
  ) {
    const admins = await this.prisma.user.findMany({
      where: { roles: 'ADMIN' },
      select: { id: true },
    });

    const adminIds = admins.map((a) => a.id);

    if (adminIds.length > 0) {
      await this.notificationsService.notifyEcoContentPublished(
        adminIds,
        contentTitle,
        contentId,
      );
    }
  }

  async updateEcoContent(id: string, data: any, adminId: string, req?: Request) {
    const existing = await this.prisma.ecoContent.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.locale !== undefined) updateData.locale = data.locale;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.kpis !== undefined) updateData.kpis = data.kpis;
    if (data.kind !== undefined) updateData.kind = data.kind;

    // Détecter les changements de publication
    const wasPublished = !!existing.publishedAt;
    let publicationChanged = false;

    if (data.published !== undefined) {
      const willBePublished = data.published;
      publicationChanged = wasPublished !== willBePublished;
      updateData.publishedAt = willBePublished ? new Date() : null;
    }

    const content = await this.prisma.ecoContent.update({
      where: { id },
      data: updateData,
    });

    // Logger PUBLISH_ECO_CONTENT ou UNPUBLISH_ECO_CONTENT si le statut de publication change
    if (publicationChanged) {
      const actionType = content.publishedAt
        ? AdminActionType.PUBLISH_ECO_CONTENT
        : AdminActionType.UNPUBLISH_ECO_CONTENT;

      await this.logAction(adminId, actionType, 'EcoContent', id, {
        title: content.title,
      }, req);
    } else {
      // Sinon logger UPDATE_ECO_CONTENT
      await this.logAction(adminId, 'UPDATE_ECO_CONTENT', 'EcoContent', id, {
        title: content.title,
      }, req);
    }

    return content;
  }

  async deleteEcoContent(id: string, adminId: string, req?: Request) {
    const existing = await this.prisma.ecoContent.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Contenu éco non trouvé');
    }

    await this.prisma.ecoContent.delete({ where: { id } });
    await this.logAction(adminId, 'DELETE_ECO_CONTENT', 'EcoContent', id, undefined, req);

    return { success: true };
  }

  // Logs (Audit Trail)
  async getLogs(
    page = 1,
    limit = 50,
    filters?: {
      adminId?: string;
      actionType?: string;
      targetType?: string;
      startDate?: string;
      endDate?: string;
      requestId?: string;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Filtrer par adminId
    if (filters?.adminId) {
      where.adminId = filters.adminId;
    }

    // Filtrer par actionType
    if (filters?.actionType) {
      where.action = filters.actionType;
    }

    // Filtrer par targetType (resourceType)
    if (filters?.targetType) {
      where.resourceType = filters.targetType;
    }

    // Filtrer par requestId
    if (filters?.requestId) {
      where.requestId = filters.requestId;
    }

    // Filtrer par date range
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Ajouter 23h59m59s à la date de fin pour inclure toute la journée
        const endDateObj = new Date(filters.endDate);
        endDateObj.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateObj;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogById(id: string) {
    const log = await this.prisma.adminLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Log non trouvé');
    }

    return log;
  }

  // Exchanges Management
  async getExchanges(
    page = 1,
    limit = 20,
    filters?: { status?: string; requesterId?: string; responderId?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.requesterId) where.requesterId = filters.requesterId;
    if (filters?.responderId) where.responderId = filters.responderId;

    const [exchanges, total] = await Promise.all([
      this.prisma.exchange.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          responder: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exchange.count({ where }),
    ]);

    return {
      exchanges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExchangeById(id: string) {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        responder: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!exchange) {
      throw new NotFoundException('Échange non trouvé');
    }

    return exchange;
  }

  async deleteExchange(exchangeId: string, adminId: string, req?: Request) {
    await this.prisma.exchange.delete({ where: { id: exchangeId } });
    await this.logAction(adminId, 'DELETE_EXCHANGE', 'Exchange', exchangeId, undefined, req);
    return { success: true };
  }

  // Community Management
  async getThreads(page = 1, limit = 20, scope?: string) {
    const skip = (page - 1) * limit;
    const where = scope ? { scope } : {};

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          posts: {
            select: {
              id: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.thread.count({ where }),
    ]);

    // Calculer likesCount et isTrending pour chaque thread
    const threadsWithStats = await Promise.all(
      threads.map(async (thread) => {
        // Compter les likes sur tous les posts du thread
        const likesCount = await this.prisma.postLike.count({
          where: {
            post: {
              threadId: thread.id,
            },
          },
        });

        // Calculer isTrending (algorithme simple basé sur activité récente)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentPosts = await this.prisma.post.count({
          where: {
            threadId: thread.id,
            createdAt: { gte: oneDayAgo },
          },
        });
        const isTrending =
          likesCount >= 5 || recentPosts >= 3 || (likesCount >= 2 && recentPosts >= 1);

        return {
          ...thread,
          likesCount,
          isTrending,
        };
      }),
    );

    return {
      threads: threadsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getThreadById(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread non trouvé');
    }

    return thread;
  }

  async deleteThread(threadId: string, adminId: string, req?: Request) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException('Thread non trouvé');
    }

    await this.prisma.thread.delete({ where: { id: threadId } });
    await this.logAction(adminId, 'DELETE_THREAD', 'Thread', threadId, undefined, req);
    return { success: true };
  }

  async getPosts(
    page = 1,
    limit = 20,
    filters?: { threadId?: string; authorId?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.threadId) where.threadId = filters.threadId;
    if (filters?.authorId) where.authorId = filters.authorId;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          thread: {
            select: {
              id: true,
              title: true,
              scope: true,
            },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            scope: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    return post;
  }

  async deletePost(postId: string, adminId: string, req?: Request) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    await this.prisma.post.delete({ where: { id: postId } });
    await this.logAction(adminId, 'DELETE_POST', 'Post', postId, undefined, req);
    return { success: true };
  }

  // Analytics
  async getAnalyticsOverview(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 jours par défaut
    const end = endDate || new Date();

    const [
      newUsers,
      newItems,
      newExchanges,
      totalUsers,
      totalItems,
      totalExchanges,
      activeUsers,
      topCategories,
      exchangesByStatus,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.item.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.exchange.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.user.count(),
      this.prisma.item.count(),
      this.prisma.exchange.count(),
      this.prisma.user.count({
        where: {
          OR: [
            { items: { some: { createdAt: { gte: start } } } },
            { exchangesRequested: { some: { createdAt: { gte: start } } } },
            { exchangesResponded: { some: { createdAt: { gte: start } } } },
          ],
        },
      }),
      this.prisma.item.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
      this.prisma.exchange.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    return {
      period: { start, end },
      growth: {
        users: newUsers,
        items: newItems,
        exchanges: newExchanges,
      },
      totals: {
        users: totalUsers,
        items: totalItems,
        exchanges: totalExchanges,
      },
      activeUsers,
      topCategories: topCategories.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      exchangesByStatus: exchangesByStatus.map((e) => ({
        status: e.status,
        count: e._count.status,
      })),
    };
  }

  async getUserAnalytics() {
    const [
      totalUsers,
      bannedUsers,
      usersByMonth,
      usersWithItems,
      usersWithExchanges,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ban.count(),
      this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM users
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month DESC
      `,
      this.prisma.user.count({
        where: { items: { some: {} } },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { exchangesRequested: { some: {} } },
            { exchangesResponded: { some: {} } },
          ],
        },
      }),
    ]);

    return {
      total: totalUsers,
      banned: bannedUsers,
      active: totalUsers - bannedUsers,
      withItems: usersWithItems,
      withExchanges: usersWithExchanges,
      byMonth: usersByMonth,
    };
  }

  async getItemAnalytics() {
    const [
      totalItems,
      itemsByStatus,
      itemsByCategory,
      itemsByCondition,
      itemsByMonth,
      averageItemsPerUser,
    ] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.item.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.item.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      this.prisma.item.groupBy({
        by: ['condition'],
        _count: { condition: true },
      }),
      this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM items
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month DESC
      `,
      (async () => {
        const totalUsers = await this.prisma.user.count();
        const totalItems = await this.prisma.item.count();
        return totalUsers > 0 ? totalItems / totalUsers : 0;
      })(),
    ]);

    return {
      total: totalItems,
      byStatus: itemsByStatus.map((i) => ({
        status: i.status,
        count: i._count.status,
      })),
      byCategory: itemsByCategory.map((i) => ({
        category: i.category,
        count: i._count.category,
      })),
      byCondition: itemsByCondition.map((i) => ({
        condition: i.condition,
        count: i._count.condition,
      })),
      byMonth: itemsByMonth,
      averagePerUser: averageItemsPerUser,
    };
  }

  async getExchangeAnalytics() {
    const [
      totalExchanges,
      exchangesByStatus,
      exchangesByMonth,
      averageCompletionTime,
      successRate,
    ] = await Promise.all([
      this.prisma.exchange.count(),
      this.prisma.exchange.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM exchanges
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month DESC
      `,
      this.prisma.$queryRaw<Array<{ avg: number }>>`
        SELECT
          EXTRACT(EPOCH FROM AVG("completedAt" - "createdAt"))::float as avg
        FROM exchanges
        WHERE status = 'COMPLETED' AND "completedAt" IS NOT NULL
      `.then((result) => (result[0]?.avg || 0) / 86400), // Convertir en jours
      this.prisma.exchange
        .count({ where: { status: 'COMPLETED' } })
        .then(async (completed) => {
          const total = await this.prisma.exchange.count();
          return total > 0 ? (completed / total) * 100 : 0;
        }),
    ]);

    return {
      total: totalExchanges,
      byStatus: exchangesByStatus.map((e) => ({
        status: e.status,
        count: e._count.status,
      })),
      byMonth: exchangesByMonth,
      averageCompletionDays: averageCompletionTime,
      successRate: successRate,
    };
  }

  // Helper: Log admin actions (wrapper vers AuditService pour compatibilité)
  private async logAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    meta?: any,
    req?: Request,
  ) {
    // Convertir action string en enum si possible
    const actionType = Object.values(AdminActionType).includes(action as AdminActionType)
      ? (action as AdminActionType)
      : (action as AdminActionType); // Fallback si pas dans l'enum

    // Récupérer le rôle depuis req.user si disponible
    const actorRole = req?.user ? (req.user as any).roles : undefined;

    await this.auditService.log({
      actionType: actionType,
      actorId: adminId,
      actorRole: actorRole,
      targetType: resourceType,
      targetId: resourceId,
      metadata: meta,
      request: req,
    });
  }
}

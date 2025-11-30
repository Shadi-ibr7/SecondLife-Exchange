/**
 * FICHIER: admin.service.ts
 *
 * DESCRIPTION:
 * Service principal pour toutes les opérations admin.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ItemStatus } from '@prisma/client';
import { ThemesService } from '../themes/themes.service';
import { SuggestionsService, SuggestionStats } from '../suggestions/suggestions.service';
import { CreateThemeDto } from '../themes/dtos/create-theme.dto';
import { UpdateThemeDto } from '../themes/dtos/update-theme.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private themesService: ThemesService,
    private suggestionsService: SuggestionsService,
  ) {}

  // Dashboard Stats
  async getDashboardStats() {
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
      usersGrowth: totalUsersBefore > 0 ? ((usersLastMonth / totalUsersBefore) * 100) : 0,
      itemsGrowth: totalItemsBefore > 0 ? ((itemsLastMonth / totalItemsBefore) * 100) : 0,
      exchangesGrowth: totalExchangesBefore > 0 ? ((exchangesLastMonth / totalExchangesBefore) * 100) : 0,
      reportsGrowth: totalReportsBefore > 0 ? ((reportsLastMonth / totalReportsBefore) * 100) : 0,
    };
  }

  // Users Management
  async getUsers(page = 1, limit = 20, search?: string) {
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

  async banUser(userId: string, adminId: string, reason?: string) {
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

    await this.logAction(adminId, 'BAN_USER', 'User', userId, { reason });

    return { success: true };
  }

  async unbanUser(userId: string, adminId: string) {
    await this.prisma.ban.deleteMany({ where: { userId } });
    await this.logAction(adminId, 'UNBAN_USER', 'User', userId);
    return { success: true };
  }

  // Items Management
  async getItems(page = 1, limit = 20, filters?: { ownerId?: string; category?: string; status?: string }) {
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

  async archiveItem(itemId: string, adminId: string) {
    await this.prisma.item.update({
      where: { id: itemId },
      data: { status: ItemStatus.ARCHIVED },
    });

    await this.logAction(adminId, 'ARCHIVE_ITEM', 'Item', itemId);
    return { success: true };
  }

  async deleteItem(itemId: string, adminId: string) {
    await this.prisma.item.delete({ where: { id: itemId } });
    await this.logAction(adminId, 'DELETE_ITEM', 'Item', itemId);
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

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveReport(reportId: string, adminId: string, banUser = false) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    if (banUser && report.targetUserId) {
      await this.banUser(report.targetUserId, adminId, `Banni suite au signalement #${reportId}`);
    }

    await this.logAction(adminId, 'RESOLVE_REPORT', 'Report', reportId, { banUser });
    return { success: true };
  }

  // Themes Management
  async getThemes() {
    return this.prisma.weeklyTheme.findMany({
      include: {
        _count: {
          select: { suggestions: true },
        },
      },
      orderBy: { startOfWeek: 'desc' },
    });
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
    await this.logAction(adminId, 'UPDATE_THEME', 'WeeklyTheme', theme.id, data);
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

    await this.logAction(adminId, 'GENERATE_THEME_SUGGESTIONS', 'WeeklyTheme', id, stats);
    return stats;
  }

  async getThemeSuggestions(id: string, page = 1, limit = 20, sort = '-createdAt') {
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
      await this.logAction(adminId, 'GENERATE_MONTHLY_THEMES', 'WeeklyTheme', null, {
        count: themes.length,
        month: month ? month.toISOString() : new Date().toISOString(),
      });
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

  // Logs
  async getLogs(page = 1, limit = 50, adminId?: string) {
    const skip = (page - 1) * limit;
    const where = adminId ? { adminId } : {};

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

  // Helper: Log admin actions
  private async logAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    meta?: any,
  ) {
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        resourceType,
        resourceId,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
      },
    });
  }
}


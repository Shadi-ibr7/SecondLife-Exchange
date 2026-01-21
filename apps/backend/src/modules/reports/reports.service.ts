/**
 * FICHIER: reports.service.ts
 *
 * DESCRIPTION:
 * Service pour gérer les signalements créés par les utilisateurs.
 */

import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReportDto } from './dtos/create-report.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Crée un nouveau signalement.
   *
   * VALIDATIONS:
   * - Un utilisateur ne peut signaler qu'une seule fois le même élément
   * - Le type doit correspondre à l'ID fourni (ITEM -> targetItemId, USER -> targetUserId)
   * - Si reason = OTHER, message est obligatoire
   *
   * @param userId - ID de l'utilisateur qui signale
   * @param createReportDto - Données du signalement
   * @returns Le signalement créé
   */
  async createReport(userId: string, createReportDto: CreateReportDto) {
    const { type, reason, message, targetItemId, targetUserId } = createReportDto;

    // Validation: le type doit correspondre à l'ID fourni
    if (type === 'ITEM' && !targetItemId) {
      throw new BadRequestException('targetItemId est requis pour un signalement de type ITEM');
    }
    if (type === 'USER' && !targetUserId) {
      throw new BadRequestException('targetUserId est requis pour un signalement de type USER');
    }

    // Validation: message obligatoire si reason = OTHER
    if (reason === 'OTHER' && (!message || message.trim().length === 0)) {
      throw new BadRequestException('Un message est requis lorsque la raison est "Autre"');
    }

    // Vérifier que l'élément signalé existe
    if (type === 'ITEM' && targetItemId) {
      const item = await this.prisma.item.findUnique({
        where: { id: targetItemId },
      });
      if (!item) {
        throw new NotFoundException('Item non trouvé');
      }
    }

    if (type === 'USER' && targetUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }
      // Empêcher de se signaler soi-même
      if (targetUserId === userId) {
        throw new BadRequestException('Vous ne pouvez pas vous signaler vous-même');
      }
    }

    // Vérifier qu'il n'existe pas déjà un signalement non résolu pour cet élément par cet utilisateur
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporterId: userId,
        resolved: false,
        ...(type === 'ITEM' ? { targetItemId } : { targetUserId }),
      },
    });

    if (existingReport) {
      throw new ConflictException('Vous avez déjà signalé cet élément');
    }

    // Créer le signalement
    const report = await this.prisma.report.create({
      data: {
        type: type === 'ITEM' ? 'ITEM' : 'USER',
        message: message || `Signalement: ${reason}`,
        targetItemId: type === 'ITEM' ? targetItemId : null,
        targetUserId: type === 'USER' ? targetUserId : null,
        reporterId: userId,
      },
    });

    // Notifier les admins
    await this.notifyAdmins(report.id);

    return report;
  }

  /**
   * Notifie les admins d'un nouveau signalement.
   */
  private async notifyAdmins(reportId: string) {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          roles: 'ADMIN',
        },
        select: {
          id: true,
        },
      });

      // Créer une notification pour chaque admin
      await Promise.all(
        admins.map((admin) =>
          this.notificationsService.createNotification({
            userId: admin.id,
            type: NotificationType.ADMIN_ACTION,
            title: 'Nouveau signalement',
            body: `Un nouveau signalement a été créé (#${reportId})`,
            data: {
              url: `/admin/reports/${reportId}`,
              reportId,
            },
          }),
        ),
      );
    } catch (error) {
      // Ne pas faire échouer la création du signalement si la notification échoue
      console.error('Erreur lors de la notification des admins:', error);
    }
  }
}

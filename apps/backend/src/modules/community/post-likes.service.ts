/**
 * FICHIER: post-likes.service.ts
 *
 * DESCRIPTION:
 * Ce service gère la logique métier pour les likes de posts.
 * Permet aux utilisateurs de liker/unliker des posts.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * SERVICE: PostLikesService
 *
 * Service pour la gestion des likes de posts.
 */
@Injectable()
export class PostLikesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Toggle le like d'un post (like si pas liké, unlike si déjà liké).
   *
   * @param postId - ID du post
   * @param userId - ID de l'utilisateur
   * @returns true si le post est maintenant liké, false sinon
   * @throws NotFoundException si le post n'existe pas
   */
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    // Vérifier que le post existe et récupérer l'auteur
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        threadId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    // Vérifier si l'utilisateur a déjà liké ce post
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike: supprimer le like
      await this.prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return false;
    } else {
      // Like: créer le like
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });

      // Notifier l'auteur du post (sauf si c'est lui qui like)
      if (post.authorId !== userId) {
        // Récupérer l'auteur du post pour le nom
        const postAuthor = await this.prisma.user.findUnique({
          where: { id: post.authorId },
          select: { displayName: true },
        });

        // Récupérer l'utilisateur qui like pour le nom
        const liker = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true },
        });

        // Créer la notification (non bloquant)
        this.notificationsService
          .createNotification({
            userId: post.authorId,
            type: 'POST_LIKED',
            title: 'Nouveau like',
            body: `${liker?.displayName || 'Quelqu\'un'} a aimé votre message`,
            data: {
              postId,
              threadId: post.threadId,
              likerId: userId,
              likerName: liker?.displayName,
            },
          })
          .catch((err) => {
            // Erreur silencieuse pour ne pas bloquer le like
            console.error('Erreur notification like:', err);
          });
      }

      return true;
    }
  }

  /**
   * Récupère le nombre de likes d'un post.
   *
   * @param postId - ID du post
   * @returns Nombre de likes
   */
  async getLikesCount(postId: string): Promise<number> {
    return this.prisma.postLike.count({
      where: { postId },
    });
  }

  /**
   * Vérifie si un utilisateur a liké un post.
   *
   * @param postId - ID du post
   * @param userId - ID de l'utilisateur
   * @returns true si l'utilisateur a liké le post
   */
  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    return !!like;
  }
}

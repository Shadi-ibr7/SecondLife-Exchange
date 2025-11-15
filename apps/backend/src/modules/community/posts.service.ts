/**
 * FICHIER: posts.service.ts
 *
 * DESCRIPTION:
 * Ce service gère la logique métier pour les posts (messages) dans les threads.
 * Les posts permettent aux utilisateurs de participer aux discussions.
 *
 * FONCTIONNALITÉS:
 * - Création de posts dans un thread
 * - Création de réponses à un post (posts imbriqués)
 * - Liste paginée des posts d'un thread
 * - Mise à jour de posts (auteur ou admin uniquement)
 * - Suppression de posts (auteur ou admin uniquement)
 *
 * RÉPONSES:
 * - Un post peut répondre à un autre post via repliesTo
 * - Les réponses sont comptées et affichées
 */

// Import des exceptions NestJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

// Import du service Prisma
import { PrismaService } from '../../common/prisma/prisma.service';

// Import des DTOs
import {
  CreatePostInput,
  UpdatePostInput,
  ListPostsInput,
  PostResponse,
  PaginatedPostsResponse,
} from './dtos/posts.dto';

/**
 * SERVICE: PostsService
 *
 * Service pour la gestion des posts dans les threads.
 */
@Injectable()
export class PostsService {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service Prisma
   */
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MÉTHODE: listPosts (Lister les posts)
  // ============================================

  /**
   * Liste les posts d'un thread avec pagination.
   *
   * Les posts sont triés par date de création (plus ancien en premier)
   * pour une lecture chronologique de la discussion.
   *
   * @param threadId - ID du thread
   * @param query - Paramètres de pagination
   * @returns Liste paginée de posts avec auteur et nombre de réponses
   * @throws NotFoundException si le thread n'existe pas
   */
  async listPosts(
    threadId: string,
    query: ListPostsInput,
  ): Promise<PaginatedPostsResponse> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Vérifier que le thread existe
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread non trouvé');
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { threadId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where: { threadId } }),
    ]);

    return {
      items: posts.map(this.mapToResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // MÉTHODE: getPostById (Récupérer un post)
  // ============================================

  /**
   * Récupère un post par son ID avec toutes ses informations.
   *
   * @param id - ID du post
   * @returns Post avec auteur et nombre de réponses
   * @throws NotFoundException si le post n'existe pas
   */
  async getPostById(id: string): Promise<PostResponse> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    return this.mapToResponse(post);
  }

  // ============================================
  // MÉTHODE: createPost (Créer un post)
  // ============================================

  /**
   * Crée un nouveau post dans un thread.
   *
   * VALIDATION:
   * - Vérifie que le thread existe
   * - Si repliesTo est fourni, vérifie que le post parent existe et appartient au même thread
   *
   * PROCESSUS:
   * 1. Crée le post
   * 2. Met à jour la date de modification du thread (updatedAt)
   *
   * @param threadId - ID du thread
   * @param authorId - ID de l'auteur du post
   * @param input - Données du post (content, repliesTo?)
   * @returns Post créé avec auteur et nombre de réponses
   * @throws NotFoundException si le thread ou le post parent n'existe pas
   * @throws BadRequestException si le post parent n'appartient pas au thread
   */
  async createPost(
    threadId: string,
    authorId: string,
    input: CreatePostInput,
  ): Promise<PostResponse> {
    // Vérifier que le thread existe
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread non trouvé');
    }

    // Si c'est une réponse, vérifier que le post parent existe
    if (input.repliesTo) {
      const parentPost = await this.prisma.post.findUnique({
        where: { id: input.repliesTo },
        select: { threadId: true },
      });

      if (!parentPost) {
        throw new NotFoundException('Post parent non trouvé');
      }

      if (parentPost.threadId !== threadId) {
        throw new BadRequestException(
          "Le post parent n'appartient pas à ce thread",
        );
      }
    }

    const post = await this.prisma.post.create({
      data: {
        threadId,
        authorId,
        content: input.content,
        repliesTo: input.repliesTo,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Mettre à jour la date de modification du thread
    await this.prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return this.mapToResponse(post);
  }

  // ============================================
  // MÉTHODE: updatePost (Mettre à jour un post)
  // ============================================

  /**
   * Met à jour un post existant.
   *
   * SÉCURITÉ:
   * - Seul l'auteur du post ou un admin peut le modifier
   * - La date d'édition (editedAt) est automatiquement mise à jour
   *
   * @param id - ID du post à mettre à jour
   * @param userId - ID de l'utilisateur qui demande la modification
   * @param userRole - Rôle de l'utilisateur (USER ou ADMIN)
   * @param input - Nouvelles données du post (content)
   * @returns Post mis à jour
   * @throws NotFoundException si le post n'existe pas
   * @throws ForbiddenException si l'utilisateur n'a pas les permissions
   */
  async updatePost(
    id: string,
    userId: string,
    userRole: string,
    input: UpdatePostInput,
  ): Promise<PostResponse> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce post');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        content: input.content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return this.mapToResponse(updatedPost);
  }

  // ============================================
  // MÉTHODE: deletePost (Supprimer un post)
  // ============================================

  /**
   * Supprime un post.
   *
   * SÉCURITÉ:
   * - Seul l'auteur du post ou un admin peut le supprimer
   * - Les réponses au post sont supprimées en cascade (configuration Prisma)
   *
   * PROCESSUS:
   * 1. Supprime le post
   * 2. Met à jour la date de modification du thread (updatedAt)
   *
   * @param id - ID du post à supprimer
   * @param userId - ID de l'utilisateur qui demande la suppression
   * @param userRole - Rôle de l'utilisateur (USER ou ADMIN)
   * @throws NotFoundException si le post n'existe pas
   * @throws ForbiddenException si l'utilisateur n'a pas les permissions
   */
  async deletePost(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true, threadId: true },
    });

    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce post');
    }

    // Supprimer le post et ses réponses
    await this.prisma.post.delete({
      where: { id },
    });

    // Mettre à jour la date de modification du thread
    await this.prisma.thread.update({
      where: { id: post.threadId },
      data: { updatedAt: new Date() },
    });
  }

  // ============================================
  // MÉTHODE PRIVÉE: mapToResponse
  // ============================================

  /**
   * Mappe un post Prisma vers la réponse API.
   *
   * Transforme les données de la base de données en format de réponse
   * avec les informations nécessaires pour le frontend.
   *
   * @param post - Post depuis Prisma
   * @returns Post formaté pour la réponse API
   */
  private mapToResponse(post: any): PostResponse {
    return {
      id: post.id,
      threadId: post.threadId,
      authorId: post.authorId,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      editedAt: post.editedAt?.toISOString(),
      repliesTo: post.repliesTo,
      author: post.author,
      repliesCount: post._count?.replies || 0,
      isEdited: !!post.editedAt,
    };
  }
}

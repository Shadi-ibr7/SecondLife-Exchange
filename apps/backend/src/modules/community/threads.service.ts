/**
 * FICHIER: threads.service.ts
 *
 * DESCRIPTION:
 * Ce service gère la logique métier pour les threads (sujets de discussion) de la communauté.
 * Les threads permettent aux utilisateurs de créer des discussions autour de différents sujets.
 *
 * FONCTIONNALITÉS:
 * - Création de threads avec le premier post
 * - Liste paginée avec filtres (scope, recherche textuelle)
 * - Récupération d'un thread par ID
 * - Suppression de threads (auteur ou admin uniquement)
 *
 * SCOPES:
 * - GENERAL: Discussion générale (pas de scopeRef requis)
 * - ITEM: Discussion liée à un item spécifique (scopeRef = itemId)
 * - EXCHANGE: Discussion liée à un échange (scopeRef = exchangeId)
 * - THEME: Discussion liée à un thème hebdomadaire (scopeRef = themeId)
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
  CreateThreadInput,
  ListThreadsInput,
  ThreadResponse,
  PaginatedThreadsResponse,
  ThreadSortBy,
} from './dtos/threads.dto';

/**
 * SERVICE: ThreadsService
 *
 * Service pour la gestion des threads de discussion.
 */
@Injectable()
export class ThreadsService {
  /**
   * CONSTRUCTEUR
   *
   * Injection du service Prisma
   */
  constructor(private prisma: PrismaService) {}

  // ============================================
  // MÉTHODE: listThreads (Lister les threads)
  // ============================================

  /**
   * Liste les threads avec filtres et pagination.
   *
   * FILTRES DISPONIBLES:
   * - scope: Type de thread (GENERAL, ITEM, EXCHANGE, THEME)
   * - ref: ID de référence (itemId, exchangeId, themeId)
   * - q: Recherche textuelle (titre ou contenu des posts)
   *
   * @param query - Paramètres de filtrage et pagination
   * @returns Liste paginée de threads avec auteur et dernier post
   */
  async listThreads(
    query: ListThreadsInput,
  ): Promise<PaginatedThreadsResponse> {
    const { page = 1, limit = 20, scope, ref, category, q, sortBy } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtres
    if (scope) {
      where.scope = scope;
    }

    if (ref) {
      where.scopeRef = ref;
    }

    if (category) {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { posts: { some: { content: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    // Déterminer l'ordre de tri
    let orderBy: any = { updatedAt: 'desc' };
    if (sortBy === ThreadSortBy.RECENT) {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === ThreadSortBy.POPULAR) {
      // Tri par nombre de posts (popularité = activité)
      orderBy = { posts: { _count: 'desc' } };
    }
    // Pour TRENDING, on triera après avoir calculé isTrending

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
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
            select: {
              posts: true,
            },
          },
        },
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

        // Calculer isTrending (algorithme combinant plusieurs critères)
        const isTrending = await this.calculateIsTrending(thread.id);

        return {
          ...thread,
          _likesCount: likesCount,
          _isTrending: isTrending,
        };
      }),
    );

    // Si tri par trending, réordonner
    if (sortBy === ThreadSortBy.TRENDING) {
      threadsWithStats.sort((a, b) => {
        // Priorité aux threads trending
        if (a._isTrending && !b._isTrending) return -1;
        if (!a._isTrending && b._isTrending) return 1;
        // Ensuite par likesCount
        if (a._likesCount !== b._likesCount) {
          return b._likesCount - a._likesCount;
        }
        // Enfin par date de mise à jour
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
    }

    return {
      items: threadsWithStats.map(this.mapToResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // MÉTHODE: getThreadById (Récupérer un thread)
  // ============================================

  /**
   * Récupère un thread par son ID avec toutes ses informations.
   *
   * @param id - ID du thread
   * @returns Thread avec auteur et nombre de posts
   * @throws NotFoundException si le thread n'existe pas
   */
  async getThreadById(id: string): Promise<ThreadResponse> {
    const thread = await this.prisma.thread.findUnique({
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
            posts: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread non trouvé');
    }

    return this.mapToResponse(thread);
  }

  // ============================================
  // MÉTHODE: createThread (Créer un thread)
  // ============================================

  /**
   * Crée un nouveau thread avec le premier post en transaction atomique.
   *
   * VALIDATION:
   * - Si scope !== 'GENERAL', scopeRef est obligatoire
   *
   * PROCESSUS:
   * 1. Crée le thread
   * 2. Crée automatiquement le premier post avec le contenu fourni
   *
   * @param authorId - ID de l'auteur du thread
   * @param input - Données du thread (scope, scopeRef, title, contentFirst)
   * @returns Thread créé avec auteur et nombre de posts
   * @throws BadRequestException si scopeRef manquant pour un scope non-GENERAL
   */
  async createThread(
    authorId: string,
    input: CreateThreadInput,
  ): Promise<ThreadResponse> {
    // Validation du scope et scopeRef
    if (input.scope !== 'GENERAL' && !input.scopeRef) {
      throw new BadRequestException(
        'scopeRef est requis pour les threads non généraux',
      );
    }

    // Créer le thread et le premier post en transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const thread = await tx.thread.create({
        data: {
          scope: input.scope,
          scopeRef: input.scopeRef,
          category: input.category,
          title: input.title,
          authorId,
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
              posts: true,
            },
          },
        },
      });

      await tx.post.create({
        data: {
          threadId: thread.id,
          authorId,
          content: input.contentFirst,
        },
      });

      return thread;
    });

    return this.mapToResponse(result);
  }

  // ============================================
  // MÉTHODE: deleteThread (Supprimer un thread)
  // ============================================

  /**
   * Supprime un thread.
   *
   * SÉCURITÉ:
   * - Seul l'auteur du thread ou un admin peut le supprimer
   * - Les posts associés sont supprimés en cascade (configuration Prisma)
   *
   * @param id - ID du thread à supprimer
   * @param userId - ID de l'utilisateur qui demande la suppression
   * @param userRole - Rôle de l'utilisateur (USER ou ADMIN)
   * @throws NotFoundException si le thread n'existe pas
   * @throws ForbiddenException si l'utilisateur n'a pas les permissions
   */
  async deleteThread(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread non trouvé');
    }

    if (thread.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce thread');
    }

    await this.prisma.thread.delete({
      where: { id },
    });
  }

  // ============================================
  // MÉTHODE PRIVÉE: mapToResponse
  // ============================================

  /**
   * Mappe un thread Prisma vers la réponse API.
   *
   * Transforme les données de la base de données en format de réponse
   * avec les informations nécessaires pour le frontend.
   *
   * @param thread - Thread depuis Prisma
   * @returns Thread formaté pour la réponse API
   */
  private mapToResponse(thread: any): ThreadResponse {
    const lastPost = thread.posts?.[0];

    return {
      id: thread.id,
      scope: thread.scope,
      scopeRef: thread.scopeRef,
      category: thread.category,
      title: thread.title,
      authorId: thread.authorId,
      author: thread.author,
      postsCount: thread._count?.posts || 0,
      likesCount: thread._likesCount || 0,
      isTrending: thread._isTrending || false,
      lastPostAt: lastPost?.createdAt?.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }

  /**
   * Calcule si un thread est "tendance" selon un algorithme combinant plusieurs critères.
   *
   * ALGORITHME:
   * - Nombre de commentaires récents (dans les 24h) > 5
   * - Nombre de likes total > 10
   * - Activité récente (dernier post dans les 6h)
   *
   * @param threadId - ID du thread
   * @returns true si le thread est tendance
   */
  private async calculateIsTrending(threadId: string): Promise<boolean> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // Compter les posts récents (24h)
    const recentPostsCount = await this.prisma.post.count({
      where: {
        threadId,
        createdAt: { gte: last24h },
      },
    });

    // Compter les likes totaux
    const totalLikes = await this.prisma.postLike.count({
      where: {
        post: {
          threadId,
        },
      },
    });

    // Vérifier l'activité récente (dernier post dans les 6h)
    const lastPost = await this.prisma.post.findFirst({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const hasRecentActivity = lastPost && lastPost.createdAt >= last6h;

    // Critères pour être "tendance"
    return (
      (recentPostsCount > 5 || totalLikes > 10) && hasRecentActivity
    );
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateThreadInput,
  ListThreadsInput,
  ThreadResponse,
  PaginatedThreadsResponse,
} from './dtos/threads.dto';

@Injectable()
export class ThreadsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste les threads avec filtres et pagination
   */
  async listThreads(
    query: ListThreadsInput,
  ): Promise<PaginatedThreadsResponse> {
    const { page = 1, limit = 20, scope, ref, q } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtres
    if (scope) {
      where.scope = scope;
    }

    if (ref) {
      where.scopeRef = ref;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { posts: { some: { content: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
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

    return {
      items: threads.map(this.mapToResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère un thread par ID
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

  /**
   * Crée un nouveau thread avec le premier post
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

  /**
   * Supprime un thread (seulement l'auteur ou admin)
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

  /**
   * Mappe un thread Prisma vers la réponse API
   */
  private mapToResponse(thread: any): ThreadResponse {
    const lastPost = thread.posts?.[0];

    return {
      id: thread.id,
      scope: thread.scope,
      scopeRef: thread.scopeRef,
      title: thread.title,
      authorId: thread.authorId,
      author: thread.author,
      postsCount: thread._count?.posts || 0,
      lastPostAt: lastPost?.createdAt?.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }
}


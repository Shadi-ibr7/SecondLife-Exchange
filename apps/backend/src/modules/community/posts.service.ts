import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePostInput,
  UpdatePostInput,
  ListPostsInput,
  PostResponse,
  PaginatedPostsResponse,
} from './dtos/posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Liste les posts d'un thread avec pagination
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

  /**
   * Récupère un post par ID
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

  /**
   * Crée un nouveau post
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

  /**
   * Met à jour un post (seulement l'auteur ou admin)
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

  /**
   * Supprime un post (seulement l'auteur ou admin)
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

  /**
   * Mappe un post Prisma vers la réponse API
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


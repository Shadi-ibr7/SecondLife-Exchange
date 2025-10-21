import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    thread: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listPosts', () => {
    it('should return paginated posts for a thread', async () => {
      const mockPosts = [
        {
          id: '1',
          threadId: 'thread1',
          authorId: 'user1',
          content: 'Test post',
          createdAt: new Date(),
          author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
          _count: { replies: 0 },
        },
      ];

      mockPrismaService.thread.findUnique.mockResolvedValue({ id: 'thread1' });
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.listPosts('thread1', { page: 1, limit: 20 });

      expect(result).toEqual({
        items: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { threadId: 'thread1' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when thread not found', async () => {
      mockPrismaService.thread.findUnique.mockResolvedValue(null);

      await expect(
        service.listPosts('nonexistent', { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPostById', () => {
    it('should return post by id', async () => {
      const mockPost = {
        id: '1',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'Test post',
        createdAt: new Date(),
        author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
        _count: { replies: 0 },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.getPostById('1');

      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          content: 'Test post',
        }),
      );
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.getPostById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPost', () => {
    it('should create post in thread', async () => {
      const mockPost = {
        id: '1',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'Test post',
        createdAt: new Date(),
        author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
        _count: { replies: 0 },
      };

      mockPrismaService.thread.findUnique.mockResolvedValue({ id: 'thread1' });
      mockPrismaService.post.create.mockResolvedValue(mockPost);
      mockPrismaService.thread.update.mockResolvedValue({});

      const result = await service.createPost('thread1', 'user1', {
        content: 'Test post',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          content: 'Test post',
        }),
      );
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          threadId: 'thread1',
          authorId: 'user1',
          content: 'Test post',
          repliesTo: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('should create reply to existing post', async () => {
      const mockPost = {
        id: '2',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'Reply post',
        createdAt: new Date(),
        author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
        _count: { replies: 0 },
      };

      mockPrismaService.thread.findUnique.mockResolvedValue({ id: 'thread1' });
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        threadId: 'thread1',
      });
      mockPrismaService.post.create.mockResolvedValue(mockPost);
      mockPrismaService.thread.update.mockResolvedValue({});

      const result = await service.createPost('thread1', 'user1', {
        content: 'Reply post',
        repliesTo: '1',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '2',
          content: 'Reply post',
        }),
      );
    });

    it('should throw BadRequestException when parent post not in same thread', async () => {
      mockPrismaService.thread.findUnique.mockResolvedValue({ id: 'thread1' });
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        threadId: 'thread2',
      });

      await expect(
        service.createPost('thread1', 'user1', {
          content: 'Reply post',
          repliesTo: '1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePost', () => {
    it('should update post by author', async () => {
      const mockPost = {
        id: '1',
        authorId: 'user1',
        content: 'Updated content',
        createdAt: new Date(),
        editedAt: new Date(),
        author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
        _count: { replies: 0 },
      };

      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        authorId: 'user1',
      });
      mockPrismaService.post.update.mockResolvedValue(mockPost);

      const result = await service.updatePost('1', 'user1', 'USER', {
        content: 'Updated content',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          content: 'Updated content',
        }),
      );
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          content: 'Updated content',
          editedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should update post by admin', async () => {
      const mockPost = {
        id: '1',
        authorId: 'user2',
        content: 'Updated content',
        createdAt: new Date(),
        editedAt: new Date(),
        author: { id: 'user2', displayName: 'User 2', avatarUrl: null },
        _count: { replies: 0 },
      };

      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        authorId: 'user2',
      });
      mockPrismaService.post.update.mockResolvedValue(mockPost);

      const result = await service.updatePost('1', 'admin1', 'ADMIN', {
        content: 'Updated content',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          content: 'Updated content',
        }),
      );
    });

    it('should throw ForbiddenException when not author or admin', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        authorId: 'user2',
      });

      await expect(
        service.updatePost('1', 'user1', 'USER', {
          content: 'Updated content',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('should delete post by author', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        authorId: 'user1',
        threadId: 'thread1',
      });
      mockPrismaService.post.delete.mockResolvedValue({});
      mockPrismaService.thread.update.mockResolvedValue({});

      await service.deletePost('1', 'user1', 'USER');

      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.thread.update).toHaveBeenCalledWith({
        where: { id: 'thread1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException when not author or admin', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: '1',
        authorId: 'user2',
      });

      await expect(service.deletePost('1', 'user1', 'USER')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});


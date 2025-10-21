import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ThreadsService } from '../threads.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('ThreadsService', () => {
  let service: ThreadsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    thread: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ThreadsService>(ThreadsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listThreads', () => {
    it('should return paginated threads', async () => {
      const mockThreads = [
        {
          id: '1',
          scope: 'GENERAL',
          title: 'Test Thread',
          authorId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
          posts: [],
          _count: { posts: 0 },
        },
      ];

      mockPrismaService.thread.findMany.mockResolvedValue(mockThreads);
      mockPrismaService.thread.count.mockResolvedValue(1);

      const result = await service.listThreads({
        page: 1,
        limit: 20,
        scope: 'GENERAL',
      });

      expect(result).toEqual({
        items: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaService.thread.findMany).toHaveBeenCalledWith({
        where: { scope: 'GENERAL' },
        skip: 0,
        take: 20,
        orderBy: { updatedAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter by search query', async () => {
      const query = {
        page: 1,
        limit: 20,
        q: 'test',
      };

      mockPrismaService.thread.findMany.mockResolvedValue([]);
      mockPrismaService.thread.count.mockResolvedValue(0);

      await service.listThreads(query);

      expect(mockPrismaService.thread.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            {
              posts: {
                some: { content: { contains: 'test', mode: 'insensitive' } },
              },
            },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { updatedAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getThreadById', () => {
    it('should return thread by id', async () => {
      const mockThread = {
        id: '1',
        scope: 'GENERAL',
        title: 'Test Thread',
        authorId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
        _count: { posts: 0 },
      };

      mockPrismaService.thread.findUnique.mockResolvedValue(mockThread);

      const result = await service.getThreadById('1');

      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          title: 'Test Thread',
        }),
      );
    });

    it('should throw NotFoundException when thread not found', async () => {
      mockPrismaService.thread.findUnique.mockResolvedValue(null);

      await expect(service.getThreadById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createThread', () => {
    it('should create thread with first post', async () => {
      const mockThread = {
        id: '1',
        scope: 'GENERAL',
        title: 'Test Thread',
        authorId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 'user1', displayName: 'User 1', avatarUrl: null },
        _count: { posts: 0 },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          thread: {
            create: jest.fn().mockResolvedValue(mockThread),
          },
          post: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.createThread('user1', {
        scope: 'GENERAL',
        title: 'Test Thread',
        contentFirst: 'First post content',
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: '1',
          title: 'Test Thread',
        }),
      );
    });

    it('should throw BadRequestException for non-general scope without scopeRef', async () => {
      await expect(
        service.createThread('user1', {
          scope: 'THEME',
          title: 'Test Thread',
          contentFirst: 'First post content',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteThread', () => {
    it('should delete thread by author', async () => {
      const mockThread = {
        id: '1',
        authorId: 'user1',
      };

      mockPrismaService.thread.findUnique.mockResolvedValue(mockThread);
      mockPrismaService.thread.delete.mockResolvedValue({});

      await service.deleteThread('1', 'user1', 'USER');

      expect(mockPrismaService.thread.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should delete thread by admin', async () => {
      const mockThread = {
        id: '1',
        authorId: 'user2',
      };

      mockPrismaService.thread.findUnique.mockResolvedValue(mockThread);
      mockPrismaService.thread.delete.mockResolvedValue({});

      await service.deleteThread('1', 'admin1', 'ADMIN');

      expect(mockPrismaService.thread.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when thread not found', async () => {
      mockPrismaService.thread.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteThread('nonexistent', 'user1', 'USER'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ItemsService } from '../../src/modules/items/items.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { GeminiService } from '../../src/modules/ai/gemini.service';
import { ItemCategory, ItemCondition, ItemStatus } from '@prisma/client';

describe('ItemsService', () => {
  let service: ItemsService;
  let prismaService: PrismaService;
  let geminiService: GeminiService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockItem = {
    id: 'item-1',
    ownerId: 'user-1',
    title: 'Test Item',
    description: 'Test description',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.GOOD,
    status: ItemStatus.AVAILABLE,
    tags: ['test'],
    aiSummary: null,
    aiRepairTip: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    photos: [],
    owner: mockUser,
  };

  const mockPrismaService = {
    item: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    itemPhoto: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockGeminiService = {
    analyzeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    prismaService = module.get<PrismaService>(PrismaService);
    geminiService = module.get<GeminiService>(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createItem', () => {
    it('devrait créer un item avec succès', async () => {
      const createItemDto = {
        title: 'Test Item',
        description: 'Test description',
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.GOOD,
      };

      mockPrismaService.item.create.mockResolvedValue(mockItem);

      const result = await service.createItem('user-1', createItemDto);

      expect(result).toEqual(mockItem);
      expect(mockPrismaService.item.create).toHaveBeenCalledWith({
        data: {
          ...createItemDto,
          ownerId: 'user-1',
          tags: [],
          aiSummary: undefined,
          aiRepairTip: undefined,
        },
        include: expect.any(Object),
      });
    });

    it('devrait créer un item avec analyse IA', async () => {
      const createItemDto = {
        title: 'Test Item',
        description: 'Test description',
        condition: ItemCondition.GOOD,
        aiAuto: true,
      };

      const aiAnalysis = {
        category: ItemCategory.ELECTRONICS,
        tags: ['smartphone', 'apple'],
        aiSummary: 'Résumé IA',
        aiRepairTip: 'Conseil réparation',
      };

      mockGeminiService.analyzeItem.mockResolvedValue(aiAnalysis);
      mockPrismaService.item.create.mockResolvedValue(mockItem);

      const result = await service.createItem('user-1', createItemDto);

      expect(mockGeminiService.analyzeItem).toHaveBeenCalledWith({
        title: 'Test Item',
        description: 'Test description',
      });
      expect(result).toEqual(mockItem);
    });

    it("devrait utiliser la catégorie OTHER par défaut si l'IA échoue", async () => {
      const createItemDto = {
        title: 'Test Item',
        description: 'Test description',
        condition: ItemCondition.GOOD,
        aiAuto: true,
      };

      mockGeminiService.analyzeItem.mockResolvedValue(null);
      mockPrismaService.item.create.mockResolvedValue({
        ...mockItem,
        category: ItemCategory.OTHER,
      });

      const result = await service.createItem('user-1', createItemDto);

      expect(result.category).toBe(ItemCategory.OTHER);
    });
  });

  describe('listItems', () => {
    it('devrait lister les items avec pagination', async () => {
      const query = { page: 1, limit: 10 };
      const mockItems = [mockItem];
      const mockTotal = 1;

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.item.count.mockResolvedValue(mockTotal);

      const result = await service.listItems(query);

      expect(result).toEqual({
        items: mockItems,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('devrait filtrer par catégorie', async () => {
      const query = { category: ItemCategory.ELECTRONICS };
      const mockItems = [mockItem];
      const mockTotal = 1;

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.item.count.mockResolvedValue(mockTotal);

      await service.listItems(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          status: ItemStatus.AVAILABLE,
          category: ItemCategory.ELECTRONICS,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });

    it('devrait rechercher par mot-clé', async () => {
      const query = { q: 'iPhone' };
      const mockItems = [mockItem];
      const mockTotal = 1;

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.item.count.mockResolvedValue(mockTotal);

      await service.listItems(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          status: ItemStatus.AVAILABLE,
          OR: [
            { title: { contains: 'iPhone', mode: 'insensitive' } },
            { description: { contains: 'iPhone', mode: 'insensitive' } },
            { tags: { has: 'iPhone' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });
  });

  describe('getItemById', () => {
    it('devrait récupérer un item par ID', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);

      const result = await service.getItemById('item-1');

      expect(result).toEqual(mockItem);
      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: expect.any(Object),
      });
    });

    it("devrait lever une erreur si l'item n'existe pas", async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.getItemById('item-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateItem', () => {
    it('devrait mettre à jour un item', async () => {
      const updateItemDto = { title: 'Updated Title' };
      const existingItem = { ...mockItem, ownerId: 'user-1' };
      const updatedItem = { ...mockItem, title: 'Updated Title' };

      mockPrismaService.item.findUnique.mockResolvedValue(existingItem);
      mockPrismaService.item.update.mockResolvedValue(updatedItem);

      const result = await service.updateItem(
        'item-1',
        'user-1',
        updateItemDto,
      );

      expect(result).toEqual(updatedItem);
      expect(mockPrismaService.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: updateItemDto,
        include: expect.any(Object),
      });
    });

    it("devrait lever une erreur si l'utilisateur n'est pas le propriétaire", async () => {
      const updateItemDto = { title: 'Updated Title' };
      const existingItem = { ...mockItem, ownerId: 'user-2' };

      mockPrismaService.item.findUnique.mockResolvedValue(existingItem);

      await expect(
        service.updateItem('item-1', 'user-1', updateItemDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it("devrait lever une erreur si l'item n'existe pas", async () => {
      const updateItemDto = { title: 'Updated Title' };

      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem('item-1', 'user-1', updateItemDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteItem', () => {
    it('devrait supprimer un item', async () => {
      const existingItem = { ...mockItem, ownerId: 'user-1' };

      mockPrismaService.item.findUnique.mockResolvedValue(existingItem);
      mockPrismaService.item.delete.mockResolvedValue(mockItem);

      await service.deleteItem('item-1', 'user-1');

      expect(mockPrismaService.item.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    it("devrait lever une erreur si l'utilisateur n'est pas le propriétaire", async () => {
      const existingItem = { ...mockItem, ownerId: 'user-2' };

      mockPrismaService.item.findUnique.mockResolvedValue(existingItem);

      await expect(service.deleteItem('item-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserItems', () => {
    it("devrait récupérer les items d'un utilisateur", async () => {
      const query = { page: 1, limit: 10 };
      const mockItems = [mockItem];
      const mockTotal = 1;

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.item.count.mockResolvedValue(mockTotal);

      const result = await service.getUserItems('user-1', query);

      expect(result).toEqual({
        items: mockItems,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('searchByTags', () => {
    it('devrait rechercher des items par tags', async () => {
      const tags = ['smartphone', 'apple'];
      const mockItems = [mockItem];

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);

      const result = await service.searchByTags(tags);

      expect(result).toEqual(mockItems);
      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          status: ItemStatus.AVAILABLE,
          tags: { hasSome: tags },
        },
        take: 20,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from '../../src/modules/items/uploads/uploads.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn(),
    },
  },
}));

describe('UploadsService', () => {
  let service: UploadsService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      maxFileSize: 3000000,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxPhotosPerItem: 6,
    }),
  };

  const mockPrismaService = {
    item: {
      findUnique: jest.fn(),
    },
    itemPhoto: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSignedUploadParams', () => {
    it('devrait générer des paramètres de signature', () => {
      const result = service.getSignedUploadParams('items/test-item');

      expect(result).toMatchObject({
        signature: expect.any(String),
        timestamp: expect.any(Number),
        folder: 'items/test-item',
        public_id: expect.any(String),
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 3000000,
        transformation: expect.any(String),
      });
    });

    it('devrait utiliser les paramètres personnalisés', () => {
      const result = service.getSignedUploadParams('items/test-item', 5000000, [
        'jpg',
        'png',
      ]);

      expect(result.max_bytes).toBe(5000000);
      expect(result.allowed_formats).toEqual(['jpg', 'png']);
    });
  });

  describe('attachPhoto', () => {
    it('devrait attacher une photo à un item', async () => {
      const mockItem = { id: 'item-1' };
      const photoData = {
        url: 'https://example.com/photo.jpg',
        publicId: 'photo-123',
        width: 800,
        height: 600,
      };

      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.itemPhoto.count.mockResolvedValue(2);
      mockPrismaService.itemPhoto.create.mockResolvedValue({});

      await service.attachPhoto('item-1', photoData);

      expect(mockPrismaService.itemPhoto.create).toHaveBeenCalledWith({
        data: {
          itemId: 'item-1',
          url: photoData.url,
          publicId: photoData.publicId,
          width: photoData.width,
          height: photoData.height,
        },
      });
    });

    it("devrait lever une erreur si l'item n'existe pas", async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(
        service.attachPhoto('item-1', {
          url: 'https://example.com/photo.jpg',
          publicId: 'photo-123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait lever une erreur si le nombre maximum de photos est atteint', async () => {
      const mockItem = { id: 'item-1' };

      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.itemPhoto.count.mockResolvedValue(6);

      await expect(
        service.attachPhoto('item-1', {
          url: 'https://example.com/photo.jpg',
          publicId: 'photo-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePhoto', () => {
    it('devrait supprimer une photo', async () => {
      const mockPhoto = {
        id: 'photo-1',
        publicId: 'cloudinary-123',
        item: { ownerId: 'user-1' },
      };

      mockPrismaService.itemPhoto.findFirst.mockResolvedValue(mockPhoto);
      mockPrismaService.itemPhoto.delete.mockResolvedValue({});

      await service.deletePhoto('photo-1', 'user-1');

      expect(mockPrismaService.itemPhoto.delete).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
      });
    });

    it("devrait lever une erreur si la photo n'existe pas ou si l'utilisateur n'est pas le propriétaire", async () => {
      mockPrismaService.itemPhoto.findFirst.mockResolvedValue(null);

      await expect(service.deletePhoto('photo-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAllItemPhotos', () => {
    it("devrait supprimer toutes les photos d'un item", async () => {
      const mockPhotos = [{ publicId: 'photo-1' }, { publicId: 'photo-2' }];

      mockPrismaService.itemPhoto.findMany.mockResolvedValue(mockPhotos);
      mockPrismaService.itemPhoto.deleteMany.mockResolvedValue({});

      await service.deleteAllItemPhotos('item-1');

      expect(mockPrismaService.itemPhoto.deleteMany).toHaveBeenCalledWith({
        where: { itemId: 'item-1' },
      });
    });
  });

  describe('validateUploadParams', () => {
    it("devrait valider des paramètres d'upload valides", () => {
      const params = {
        signature: 'valid-signature',
        timestamp: Math.round(Date.now() / 1000),
        folder: 'items/test',
        public_id: 'test-id',
        allowed_formats: ['jpg', 'png'],
        max_bytes: 3000000,
      };

      // Mock la méthode privée createSignature
      jest
        .spyOn(service as any, 'createSignature')
        .mockReturnValue('valid-signature');

      expect(() => service.validateUploadParams(params)).not.toThrow();
    });

    it('devrait lever une erreur pour des paramètres manquants', () => {
      const params = {
        signature: 'valid-signature',
        timestamp: Math.round(Date.now() / 1000),
        // folder manquant
        public_id: 'test-id',
        allowed_formats: ['jpg', 'png'],
        max_bytes: 3000000,
      };

      expect(() => service.validateUploadParams(params)).toThrow(
        BadRequestException,
      );
    });

    it('devrait lever une erreur pour une signature invalide', () => {
      const params = {
        signature: 'invalid-signature',
        timestamp: Math.round(Date.now() / 1000),
        folder: 'items/test',
        public_id: 'test-id',
        allowed_formats: ['jpg', 'png'],
        max_bytes: 3000000,
      };

      // Mock la méthode privée createSignature
      jest
        .spyOn(service as any, 'createSignature')
        .mockReturnValue('valid-signature');

      expect(() => service.validateUploadParams(params)).toThrow(
        BadRequestException,
      );
    });

    it('devrait lever une erreur pour une signature expirée', () => {
      const params = {
        signature: 'valid-signature',
        timestamp: Math.round(Date.now() / 1000) - 400, // 400 secondes dans le passé
        folder: 'items/test',
        public_id: 'test-id',
        allowed_formats: ['jpg', 'png'],
        max_bytes: 3000000,
      };

      // Mock la méthode privée createSignature
      jest
        .spyOn(service as any, 'createSignature')
        .mockReturnValue('valid-signature');

      expect(() => service.validateUploadParams(params)).toThrow(
        BadRequestException,
      );
    });
  });
});

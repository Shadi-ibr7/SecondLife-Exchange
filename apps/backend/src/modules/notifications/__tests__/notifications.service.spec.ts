import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationToken: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    weeklyTheme: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should register a new token', async () => {
      const mockToken = {
        id: '1',
        userId: 'user1',
        provider: 'webpush',
        token: 'test-token',
        createdAt: new Date(),
      };

      mockPrismaService.notificationToken.findFirst.mockResolvedValue(null);
      mockPrismaService.notificationToken.upsert.mockResolvedValue(mockToken);

      const result = await service.registerToken('user1', {
        token: 'test-token',
        provider: 'webpush',
      });

      expect(result).toEqual({
        id: '1',
        userId: 'user1',
        provider: 'webpush',
        token: 'test-token',
        createdAt: expect.any(String),
      });
    });

    it('should return existing token if already registered', async () => {
      const mockToken = {
        id: '1',
        userId: 'user1',
        provider: 'webpush',
        token: 'test-token',
        createdAt: new Date(),
      };

      mockPrismaService.notificationToken.findFirst.mockResolvedValue(
        mockToken,
      );

      const result = await service.registerToken('user1', {
        token: 'test-token',
        provider: 'webpush',
      });

      expect(result).toEqual({
        id: '1',
        userId: 'user1',
        provider: 'webpush',
        token: 'test-token',
        createdAt: expect.any(String),
      });
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification successfully', async () => {
      const mockTokens = [
        {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
          user: {
            displayName: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockPrismaService.notificationToken.findMany.mockResolvedValue(
        mockTokens,
      );

      const result = await service.sendTestNotification('user1', {
        title: 'Test Notification',
        body: 'This is a test',
      });

      expect(result).toEqual({
        success: true,
        message: 'Notification envoyée à 1 appareil(s)',
        sentCount: 1,
      });
    });

    it('should throw NotFoundException when no tokens found', async () => {
      mockPrismaService.notificationToken.findMany.mockResolvedValue([]);

      await expect(
        service.sendTestNotification('user1', {
          title: 'Test Notification',
          body: 'This is a test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle partial failures gracefully', async () => {
      const mockTokens = [
        {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
          user: {
            displayName: 'Test User',
            email: 'test@example.com',
          },
        },
        {
          id: '2',
          userId: 'user1',
          provider: 'fcm',
          token: 'invalid-token',
          user: {
            displayName: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockPrismaService.notificationToken.findMany.mockResolvedValue(
        mockTokens,
      );

      const result = await service.sendTestNotification('user1', {
        title: 'Test Notification',
        body: 'This is a test',
      });

      expect(result.success).toBe(true);
      expect(result.sentCount).toBeGreaterThan(0);
    });
  });

  describe('sendWeeklyThemeReminder', () => {
    it('should send weekly reminder when theme exists', async () => {
      const mockTheme = {
        id: 'theme1',
        title: 'Test Theme',
        isActive: true,
      };

      const mockTokens = [
        {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
          user: {
            displayName: 'Test User',
          },
        },
      ];

      mockPrismaService.weeklyTheme.findFirst.mockResolvedValue(mockTheme);
      mockPrismaService.notificationToken.findMany.mockResolvedValue(
        mockTokens,
      );

      // Mock the private method
      const sendNotificationSpy = jest.spyOn(
        service as any,
        'sendNotificationToToken',
      );
      sendNotificationSpy.mockResolvedValue(undefined);

      await service.sendWeeklyThemeReminder();

      expect(sendNotificationSpy).toHaveBeenCalledWith(
        'test-token',
        'webpush',
        expect.objectContaining({
          title: 'Nouveau thème de la semaine',
          body: 'Découvrez le thème: Test Theme',
        }),
      );
    });

    it('should handle no active theme gracefully', async () => {
      mockPrismaService.weeklyTheme.findFirst.mockResolvedValue(null);

      await expect(service.sendWeeklyThemeReminder()).resolves.not.toThrow();
    });

    it('should handle no tokens gracefully', async () => {
      const mockTheme = {
        id: 'theme1',
        title: 'Test Theme',
        isActive: true,
      };

      mockPrismaService.weeklyTheme.findFirst.mockResolvedValue(mockTheme);
      mockPrismaService.notificationToken.findMany.mockResolvedValue([]);

      await expect(service.sendWeeklyThemeReminder()).resolves.not.toThrow();
    });
  });

  describe('sendExchangeStatusNotification', () => {
    it('should send exchange status notification', async () => {
      const mockTokens = [
        {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
        },
      ];

      mockPrismaService.notificationToken.findMany.mockResolvedValue(
        mockTokens,
      );

      const sendNotificationSpy = jest.spyOn(
        service as any,
        'sendNotificationToToken',
      );
      sendNotificationSpy.mockResolvedValue(undefined);

      await service.sendExchangeStatusNotification(
        'exchange1',
        'ACCEPTED',
        'user1',
      );

      expect(sendNotificationSpy).toHaveBeenCalledWith(
        'test-token',
        'webpush',
        expect.objectContaining({
          title: 'SecondLife Exchange',
          body: 'Votre échange a été accepté',
        }),
      );
    });

    it('should handle no tokens gracefully', async () => {
      mockPrismaService.notificationToken.findMany.mockResolvedValue([]);

      await expect(
        service.sendExchangeStatusNotification(
          'exchange1',
          'ACCEPTED',
          'user1',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('sendNewMessageNotification', () => {
    it('should send new message notification', async () => {
      const mockTokens = [
        {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
        },
      ];

      mockPrismaService.notificationToken.findMany.mockResolvedValue(
        mockTokens,
      );

      const sendNotificationSpy = jest.spyOn(
        service as any,
        'sendNotificationToToken',
      );
      sendNotificationSpy.mockResolvedValue(undefined);

      await service.sendNewMessageNotification(
        'thread1',
        'Test Thread',
        'user1',
        'John Doe',
      );

      expect(sendNotificationSpy).toHaveBeenCalledWith(
        'test-token',
        'webpush',
        expect.objectContaining({
          title: 'Nouveau message de John Doe',
          body: 'Dans: Test Thread',
        }),
      );
    });
  });
});


// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditService } from '../../src/modules/admin/services/audit.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AdminActionType } from '../../src/modules/admin/enums/admin-action-type.enum';
import { Request } from 'express';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    adminLog: {
      create: jest.fn(),
    },
  };

  // Mock Logger pour éviter les logs pendant les tests
  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock Logger
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(mockLogger.debug);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log', () => {
    it('devrait créer un log d audit avec tous les champs', async () => {
      const mockRequest = {
        ip: '192.168.1.1',
        get: jest.fn((header: string) => {
          if (header === 'user-agent') return 'Mozilla/5.0';
          if (header === 'x-request-id') return 'req-123';
          return undefined;
        }),
        socket: { remoteAddress: '192.168.1.1' },
      } as any as Request;

      const actionType = AdminActionType.BAN_USER;
      const actorId = 'admin-123';
      const targetType = 'User';
      const targetId = 'user-456';
      const metadata = { reason: 'Violation des CGU' };

      mockPrismaService.adminLog.create.mockResolvedValue({
        id: 'log-123',
        action: actionType,
        adminId: actorId,
        resourceType: targetType,
        resourceId: targetId,
        meta: metadata,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
        createdAt: new Date(),
      });

      await service.log({
        actionType,
        actorId,
        targetType,
        targetId,
        metadata,
        request: mockRequest,
      });

      expect(mockPrismaService.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminId: actorId,
          action: actionType,
          resourceType: targetType,
          resourceId: targetId,
          meta: metadata,
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-123',
        },
      });
    });

    it('devrait créer un log sans request (valeurs par défaut)', async () => {
      const actionType = AdminActionType.DELETE_ITEM;
      const actorId = 'admin-123';

      mockPrismaService.adminLog.create.mockResolvedValue({
        id: 'log-123',
        action: actionType,
        adminId: actorId,
        resourceType: 'System',
        resourceId: null,
        meta: null,
        ip: null,
        userAgent: null,
        requestId: null,
        createdAt: new Date(),
      });

      await service.log({
        actionType,
        actorId,
      });

      expect(mockPrismaService.adminLog.create).toHaveBeenCalledWith({
        data: {
          adminId: actorId,
          action: actionType,
          resourceType: 'System',
          resourceId: null,
          meta: null,
          ip: null,
          userAgent: null,
          requestId: null,
        },
      });
    });

    it('devrait sanitizer les métadonnées sensibles', async () => {
      const metadata = {
        reason: 'Violation',
        password: 'secret123',
        token: 'jwt-token',
        secretKey: 'key-123',
        safeField: 'value',
      };

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        metadata,
      });

      expect(mockPrismaService.adminLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          meta: {
            reason: 'Violation',
            safeField: 'value',
            // password, token, secretKey doivent être absents
          },
        }),
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.meta).not.toHaveProperty('password');
      expect(callData.meta).not.toHaveProperty('token');
      expect(callData.meta).not.toHaveProperty('secretKey');
    });

    it('devrait sanitizer les métadonnées imbriquées', async () => {
      const metadata = {
        reason: 'Violation',
        user: {
          email: 'user@example.com',
          password: 'secret123', // Doit être enlevé
          token: 'jwt-token', // Doit être enlevé
        },
        config: {
          apiKey: 'key-123', // Doit être enlevé
          setting: 'value', // Doit rester
        },
      };

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        metadata,
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.meta).toMatchObject({
        reason: 'Violation',
        user: {
          email: 'user@example.com',
        },
        config: {
          setting: 'value',
        },
      });

      expect(callData.meta.user).not.toHaveProperty('password');
      expect(callData.meta.user).not.toHaveProperty('token');
      expect(callData.meta.config).not.toHaveProperty('apiKey');
    });

    it('devrait extraire l IP depuis X-Forwarded-For', async () => {
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
          return undefined;
        }),
        ip: '127.0.0.1',
      } as any as Request;

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        request: mockRequest,
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.ip).toBe('192.168.1.1'); // Première IP de X-Forwarded-For
    });

    it('devrait extraire l IP depuis X-Real-IP si X-Forwarded-For est absent', async () => {
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'x-real-ip') return '10.0.0.1';
          return undefined;
        }),
        ip: '127.0.0.1',
      } as any as Request;

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        request: mockRequest,
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.ip).toBe('10.0.0.1');
    });

    it('devrait extraire l IP depuis req.ip si headers proxy absents', async () => {
      const mockRequest = {
        get: jest.fn(() => undefined),
        ip: '192.168.1.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any as Request;

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        request: mockRequest,
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.ip).toBe('192.168.1.1');
    });

    it('devrait extraire le requestId depuis req.requestId', async () => {
      const mockRequest = {
        requestId: 'req-from-middleware-123',
        get: jest.fn((header: string) => {
          if (header === 'x-request-id') return 'req-from-header-456';
          return undefined;
        }),
      } as any as Request;

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        request: mockRequest,
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.requestId).toBe('req-from-middleware-123'); // req.requestId prioritaire
    });

    it('devrait extraire le requestId depuis X-Request-Id si req.requestId absent', async () => {
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'x-request-id') return 'req-from-header-456';
          return undefined;
        }),
      } as any as Request;

      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.BAN_USER,
        actorId: 'admin-123',
        request: mockRequest,
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.requestId).toBe('req-from-header-456');
    });

    it('devrait être non-bloquant si Prisma échoue', async () => {
      const error = new Error('Database error');
      mockPrismaService.adminLog.create.mockRejectedValue(error);

      // Ne doit pas propager l'erreur
      await expect(
        service.log({
          actionType: AdminActionType.BAN_USER,
          actorId: 'admin-123',
        }),
      ).resolves.toBeUndefined();

      // L'erreur doit être loggée
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create audit log'),
        error.stack,
      );
    });

    it('devrait gérer les métadonnées vides ou null', async () => {
      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.DELETE_ITEM,
        actorId: 'admin-123',
        metadata: {},
      });

      const callData = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData.meta).toBeNull(); // Métadonnées vides -> null

      jest.clearAllMocks();

      await service.log({
        actionType: AdminActionType.DELETE_ITEM,
        actorId: 'admin-123',
        metadata: undefined,
      });

      const callData2 = mockPrismaService.adminLog.create.mock.calls[0][0].data;
      expect(callData2.meta).toBeNull();
    });

    it('devrait logger un message debug après création réussie', async () => {
      mockPrismaService.adminLog.create.mockResolvedValue({ id: 'log-123' });

      await service.log({
        actionType: AdminActionType.PUBLISH_ECO_CONTENT,
        actorId: 'admin-123',
        targetType: 'EcoContent',
        targetId: 'eco-456',
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Audit log created: PUBLISH_ECO_CONTENT'),
      );
    });
  });
});

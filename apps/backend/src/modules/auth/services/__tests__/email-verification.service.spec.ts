/**
 * FICHIER: email-verification.service.spec.ts
 *
 * DESCRIPTION:
 * Tests unitaires pour EmailVerificationService.
 * Teste la génération de tokens, la vérification, et la gestion des erreurs.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { EmailVerificationService } from '../email-verification.service';
import { IMailService } from '../../../mail/interfaces/mail.service.interface';
import { createHash } from 'crypto';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let prisma: jest.Mocked<PrismaService>;
  let mailService: jest.Mocked<IMailService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerifiedAt: null,
  };

  const mockTokenRecord = {
    id: 'token-123',
    userId: 'user-123',
    tokenHash: createHash('sha256').update('valid-token').digest('hex'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    usedAt: null,
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const mockPrisma = {
      emailVerificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockMailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: 'IMailService',
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
    prisma = module.get(PrismaService);
    mailService = module.get('IMailService');
    configService = module.get(ConfigService);
  });

  describe('generateAndSendVerificationToken', () => {
    it('devrait générer un token et l\'envoyer par email', async () => {
      prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.emailVerificationToken.create.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        tokenHash: 'hash',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });

      const token = await service.generateAndSendVerificationToken(
        'user-123',
        'test@example.com',
        'Test User',
      );

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalled();
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
      expect(mailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Vérifiez votre adresse email'),
        }),
      );
    });
  });

  describe('verifyToken', () => {
    it('devrait vérifier un token valide', async () => {
      const token = 'valid-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');

      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        ...mockTokenRecord,
        tokenHash,
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });

      prisma.user.update = jest.fn().mockResolvedValue(mockUser);
      prisma.emailVerificationToken.update = jest
        .fn()
        .mockResolvedValue(mockTokenRecord);

      const result = await service.verifyToken(token);

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: { emailVerifiedAt: expect.any(Date) },
        }),
      );
    });

    it('devrait rejeter un token invalide', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait rejeter un token déjà utilisé', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        ...mockTokenRecord,
        usedAt: new Date(),
      });

      await expect(service.verifyToken('used-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait rejeter un token expiré', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 1000), // Expiré
      });

      await expect(service.verifyToken('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait retourner true si email déjà vérifié (idempotence)', async () => {
      const token = 'valid-token';
      const tokenHash = createHash('sha256').update(token).digest('hex');

      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        ...mockTokenRecord,
        tokenHash,
        user: { ...mockUser, emailVerifiedAt: new Date() },
      });

      prisma.emailVerificationToken.update.mockResolvedValue(mockTokenRecord);

      const result = await service.verifyToken(token);

      expect(result).toBe(true);
      expect(prisma.emailVerificationToken.update).toHaveBeenCalled();
    });
  });

  describe('resendVerificationEmail', () => {
    it('devrait renvoyer un email si utilisateur non vérifié', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.emailVerificationToken.create.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        tokenHash: 'hash',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await service.resendVerificationEmail('test@example.com');

      expect(result).toBe(true);
      expect(mailService.sendEmail).toHaveBeenCalled();
    });

    it('devrait retourner true si email déjà vérifié', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      });

      const result = await service.resendVerificationEmail('test@example.com');

      expect(result).toBe(true);
      expect(mailService.sendEmail).not.toHaveBeenCalled();
    });

    it('devrait retourner true même si utilisateur inexistant (anti-enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerificationEmail('unknown@example.com');

      expect(result).toBe(true);
      expect(mailService.sendEmail).not.toHaveBeenCalled();
    });
  });
});

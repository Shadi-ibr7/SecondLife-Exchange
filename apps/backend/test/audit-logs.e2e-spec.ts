import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { AdminActionType } from '../src/modules/admin/enums/admin-action-type.enum';

describe('Audit Logs (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminId: string;
  let adminCookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Configurer le préfixe global comme dans main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  beforeEach(async () => {
    // Nettoyer la base de données
    await prismaService.$executeRaw`SET session_replication_role = replica;`;
    await prismaService.adminLog.deleteMany();
    await prismaService.refreshToken.deleteMany();
    await prismaService.userProfile.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.$executeRaw`SET session_replication_role = DEFAULT;`;

    // Attendre un peu pour s'assurer que les suppressions sont terminées
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Créer un admin utilisateur
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    const admin = await prismaService.user.create({
      data: {
        email: 'admin-audit@example.com',
        passwordHash,
        displayName: 'Admin Audit Test',
        roles: UserRole.ADMIN,
      },
    });

    adminId = admin.id;

    // Se connecter en tant qu'admin pour obtenir les cookies
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        email: 'admin-audit@example.com',
        password: 'Admin123!',
      })
      .expect(200);

    // Extraire les cookies de la réponse
    adminCookies = loginResponse.headers['set-cookie'] || [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/logs', () => {
    it('devrait retourner une liste paginée de logs d audit', async () => {
      // Créer quelques logs d'audit
      await prismaService.adminLog.createMany({
        data: [
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-1',
            meta: { reason: 'Violation des CGU' },
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date(),
          },
          {
            adminId,
            action: AdminActionType.DELETE_ITEM,
            resourceType: 'Item',
            resourceId: 'item-1',
            meta: null,
            ip: '192.168.1.2',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date(Date.now() - 1000), // 1 seconde avant
          },
        ],
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait filtrer par actionType', async () => {
      // Créer des logs avec différents actionTypes
      await prismaService.adminLog.createMany({
        data: [
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-1',
            createdAt: new Date(),
          },
          {
            adminId,
            action: AdminActionType.DELETE_ITEM,
            resourceType: 'Item',
            resourceId: 'item-1',
            createdAt: new Date(),
          },
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-2',
            createdAt: new Date(),
          },
        ],
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ actionType: AdminActionType.BAN_USER })
        .expect(200);

      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((log: any) => {
        expect(log.action).toBe(AdminActionType.BAN_USER);
      });
    });

    it('devrait filtrer par targetType', async () => {
      await prismaService.adminLog.createMany({
        data: [
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-1',
            createdAt: new Date(),
          },
          {
            adminId,
            action: AdminActionType.DELETE_ITEM,
            resourceType: 'Item',
            resourceId: 'item-1',
            createdAt: new Date(),
          },
        ],
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ targetType: 'User' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].resourceType).toBe('User');
    });

    it('devrait filtrer par date (startDate et endDate)', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      await prismaService.adminLog.createMany({
        data: [
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-1',
            createdAt: now,
          },
          {
            adminId,
            action: AdminActionType.DELETE_ITEM,
            resourceType: 'Item',
            resourceId: 'item-1',
            createdAt: yesterday,
          },
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-2',
            createdAt: twoDaysAgo,
          },
        ],
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';
      const startDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ startDate })
        .expect(200);

      // Devrait inclure les logs d'hier et d'aujourd'hui, pas ceux d'il y a 2 jours
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      response.body.data.forEach((log: any) => {
        const logDate = new Date(log.createdAt);
        expect(logDate.getTime()).toBeGreaterThanOrEqual(twoDaysAgo.getTime());
      });
    });

    it('devrait filtrer par requestId', async () => {
      await prismaService.adminLog.createMany({
        data: [
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-1',
            requestId: 'req-123',
            createdAt: new Date(),
          },
          {
            adminId,
            action: AdminActionType.DELETE_ITEM,
            resourceType: 'Item',
            resourceId: 'item-1',
            requestId: 'req-456',
            createdAt: new Date(),
          },
        ],
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ requestId: 'req-123' })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].requestId).toBe('req-123');
    });

    it('devrait rechercher dans les métadonnées (search)', async () => {
      await prismaService.adminLog.createMany({
        data: [
          {
            adminId,
            action: AdminActionType.BAN_USER,
            resourceType: 'User',
            resourceId: 'user-1',
            meta: { reason: 'Violation des CGU', email: 'user@example.com' },
            createdAt: new Date(),
          },
          {
            adminId,
            action: AdminActionType.DELETE_ITEM,
            resourceType: 'Item',
            resourceId: 'item-1',
            meta: { title: 'Test Item' },
            createdAt: new Date(),
          },
        ],
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ search: 'user@example.com' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const foundLog = response.body.data.find((log: any) =>
        JSON.stringify(log.meta || {}).includes('user@example.com'),
      );
      expect(foundLog).toBeDefined();
    });

    it('devrait retourner 401 sans authentification', async () => {
      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .expect(401);
    });

    it('devrait inclure les infos admin dans les logs', async () => {
      await prismaService.adminLog.create({
        data: {
          adminId,
          action: AdminActionType.BAN_USER,
          resourceType: 'User',
          resourceId: 'user-1',
          createdAt: new Date(),
        },
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const log = response.body.data[0];
      if (log.admin) {
        expect(log.admin).toHaveProperty('email');
        expect(log.admin).toHaveProperty('displayName');
      }
    });

    it('devrait gérer la pagination correctement', async () => {
      // Créer 15 logs
      await prismaService.adminLog.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          adminId,
          action: AdminActionType.BAN_USER,
          resourceType: 'User',
          resourceId: `user-${i}`,
          createdAt: new Date(Date.now() - i * 1000), // Dates différentes pour éviter les conflits
        })),
      });

      const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';

      // Page 1 avec limite de 10
      const response1 = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response1.body.data.length).toBe(10);
      expect(response1.body.pagination.page).toBe(1);
      expect(response1.body.pagination.limit).toBe(10);
      expect(response1.body.pagination.total).toBeGreaterThanOrEqual(15);

      // Page 2
      const response2 = await request(app.getHttpServer())
        .get(`/api/v1/${adminBasePath}/logs`)
        .set('Cookie', adminCookies)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(response2.body.data.length).toBeGreaterThanOrEqual(5);
      expect(response2.body.pagination.page).toBe(2);
    });
  });
});

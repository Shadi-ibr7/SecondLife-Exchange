import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationsModule } from '../notifications.module';
import * as request from 'supertest';

describe('Notifications E2E', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prismaService.notificationToken.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('POST /notifications/register', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create test user
      const user = await prismaService.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
          displayName: 'Test User',
          roles: 'USER',
        },
      });
      userId = user.id;

      // Mock JWT token
      authToken = 'mock-jwt-token';
    });

    it('should register notification token', async () => {
      const tokenData = {
        token: 'test-webpush-token',
        provider: 'webpush',
      };

      const response = await request(app.getHttpServer())
        .post('/notifications/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: userId,
        provider: 'webpush',
        token: 'test-webpush-token',
      });

      // Verify token was saved in database
      const savedToken = await prismaService.notificationToken.findFirst({
        where: { userId, token: 'test-webpush-token' },
      });
      expect(savedToken).toBeTruthy();
    });

    it('should require authentication', async () => {
      const tokenData = {
        token: 'test-webpush-token',
        provider: 'webpush',
      };

      await request(app.getHttpServer())
        .post('/notifications/register')
        .send(tokenData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing token
        provider: 'webpush',
      };

      await request(app.getHttpServer())
        .post('/notifications/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should handle duplicate tokens', async () => {
      const tokenData = {
        token: 'duplicate-token',
        provider: 'webpush',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/notifications/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData)
        .expect(201);

      // Second registration with same token should return existing token
      const response = await request(app.getHttpServer())
        .post('/notifications/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData)
        .expect(201);

      expect(response.body.token).toBe('duplicate-token');
    });
  });

  describe('POST /notifications/test', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create test user with admin role
      const user = await prismaService.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: 'hashedpassword',
          displayName: 'Admin User',
          roles: 'ADMIN',
        },
      });
      userId = user.id;

      // Create notification token
      await prismaService.notificationToken.create({
        data: {
          userId,
          provider: 'webpush',
          token: 'test-token',
        },
      });

      authToken = 'mock-jwt-token';
    });

    it('should send test notification', async () => {
      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      const response = await request(app.getHttpServer())
        .post('/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        sentCount: 1,
      });
    });

    it('should require admin role', async () => {
      // Create regular user
      const regularUser = await prismaService.user.create({
        data: {
          email: 'user@example.com',
          passwordHash: 'hashedpassword',
          displayName: 'Regular User',
          roles: 'USER',
        },
      });

      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      await request(app.getHttpServer())
        .post('/notifications/test')
        .set('Authorization', `Bearer mock-token-${regularUser.id}`)
        .send(testData)
        .expect(403);
    });

    it('should require authentication', async () => {
      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      await request(app.getHttpServer())
        .post('/notifications/test')
        .send(testData)
        .expect(401);
    });

    it('should handle user without tokens', async () => {
      // Create user without notification tokens
      const userWithoutTokens = await prismaService.user.create({
        data: {
          email: 'notokens@example.com',
          passwordHash: 'hashedpassword',
          displayName: 'No Tokens User',
          roles: 'ADMIN',
        },
      });

      const testData = {
        userId: userWithoutTokens.id,
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      await request(app.getHttpServer())
        .post('/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(404);
    });

    it('should validate input data', async () => {
      const invalidData = {
        title: '', // Empty title
        body: 'This is a test notification',
      };

      await request(app.getHttpServer())
        .post('/notifications/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });
});


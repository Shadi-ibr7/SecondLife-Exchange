import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test (ordre important pour les contraintes FK)
    await prismaService.refreshToken.deleteMany();
    await prismaService.userProfile.deleteMany();
    await prismaService.user.deleteMany();

    // Attendre un peu pour s'assurer que les suppressions sont terminées
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          displayName: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should return 409 for duplicate email', async () => {
      // Créer un utilisateur existant
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      });

      // Essayer de créer le même utilisateur
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          displayName: 'Test User 2',
        })
        .expect(409);
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Trop court
          displayName: 'T', // Trop court
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Créer un utilisateur pour les tests de login
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'login@example.com',
        password: 'Password123!',
        displayName: 'Login User',
      });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('/users/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Créer un utilisateur et récupérer le token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'me@example.com',
          password: 'Password123!',
          displayName: 'Me User',
        });

      accessToken = response.body.accessToken;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('displayName');
          expect(res.body.email).toBe('me@example.com');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });
  });
});

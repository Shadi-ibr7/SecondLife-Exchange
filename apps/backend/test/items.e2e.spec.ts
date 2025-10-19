import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { ItemCategory, ItemCondition, ItemStatus } from '@prisma/client';

describe('Items (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  });

  beforeEach(async () => {
    // Nettoyer la base de données
    await prismaService.itemPhoto.deleteMany();
    await prismaService.item.deleteMany();
    await prismaService.user.deleteMany();

    // Créer un utilisateur de test
    const user = await authService.register({
      email: 'test-items@example.com',
      password: 'Password123!',
      displayName: 'Test Items User',
    });

    userId = user.id;
    accessToken = user.accessToken;
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('POST /items', () => {
    it('devrait créer un item avec succès', async () => {
      const createItemDto = {
        title: 'iPhone 12 Pro Max',
        description:
          'iPhone 12 Pro Max en excellent état, 128GB, couleur bleu pacifique.',
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.GOOD,
        tags: ['smartphone', 'apple', '5g'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createItemDto)
        .expect(201);

      expect(response.body).toMatchObject({
        title: createItemDto.title,
        description: createItemDto.description,
        category: createItemDto.category,
        condition: createItemDto.condition,
        status: ItemStatus.AVAILABLE,
        tags: createItemDto.tags,
        owner: {
          id: userId,
          displayName: 'Test Items User',
        },
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('devrait rejeter la création sans authentification', async () => {
      const createItemDto = {
        title: 'Test Item',
        description: 'Test description',
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.GOOD,
      };

      await request(app.getHttpServer())
        .post('/api/v1/items')
        .send(createItemDto)
        .expect(401);
    });

    it('devrait rejeter la création avec des données invalides', async () => {
      const createItemDto = {
        title: 'A', // Trop court
        description: 'Test', // Trop court
        category: 'INVALID_CATEGORY',
        condition: ItemCondition.GOOD,
      };

      await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createItemDto)
        .expect(400);
    });
  });

  describe('GET /items', () => {
    beforeEach(async () => {
      // Créer des items de test
      await prismaService.item.createMany({
        data: [
          {
            ownerId: userId,
            title: 'iPhone 12 Pro Max',
            description: 'Smartphone Apple en excellent état',
            category: ItemCategory.ELECTRONICS,
            condition: ItemCondition.GOOD,
            status: ItemStatus.AVAILABLE,
            tags: ['smartphone', 'apple'],
          },
          {
            ownerId: userId,
            title: 'Livre de cuisine',
            description: 'Livre de recettes traditionnelles',
            category: ItemCategory.BOOKS,
            condition: ItemCondition.FAIR,
            status: ItemStatus.AVAILABLE,
            tags: ['livre', 'cuisine'],
          },
        ],
      });
    });

    it('devrait lister tous les items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(200);

      expect(response.body).toMatchObject({
        items: expect.any(Array),
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(response.body.items).toHaveLength(2);
    });

    it('devrait filtrer par catégorie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ category: ItemCategory.ELECTRONICS })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].category).toBe(ItemCategory.ELECTRONICS);
    });

    it('devrait rechercher par mot-clé', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ q: 'iPhone' })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].title).toContain('iPhone');
    });

    it('devrait paginer les résultats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe('GET /items/:id', () => {
    let itemId: string;

    beforeEach(async () => {
      const item = await prismaService.item.create({
        data: {
          ownerId: userId,
          title: 'Test Item',
          description: 'Test description',
          category: ItemCategory.ELECTRONICS,
          condition: ItemCondition.GOOD,
          status: ItemStatus.AVAILABLE,
        },
      });
      itemId = item.id;
    });

    it('devrait récupérer un item par ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/items/${itemId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: itemId,
        title: 'Test Item',
        description: 'Test description',
        category: ItemCategory.ELECTRONICS,
        condition: ItemCondition.GOOD,
        status: ItemStatus.AVAILABLE,
        owner: {
          id: userId,
          displayName: 'Test Items User',
        },
      });
    });

    it('devrait retourner 404 pour un item inexistant', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /items/:id', () => {
    let itemId: string;

    beforeEach(async () => {
      const item = await prismaService.item.create({
        data: {
          ownerId: userId,
          title: 'Test Item',
          description: 'Test description',
          category: ItemCategory.ELECTRONICS,
          condition: ItemCondition.GOOD,
          status: ItemStatus.AVAILABLE,
        },
      });
      itemId = item.id;
    });

    it('devrait mettre à jour un item', async () => {
      const updateData = {
        title: 'Updated Title',
        tags: ['updated', 'tags'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/items/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.tags).toEqual(['updated', 'tags']);
    });

    it('devrait rejeter la mise à jour sans authentification', async () => {
      const updateData = { title: 'Updated Title' };

      await request(app.getHttpServer())
        .patch(`/api/v1/items/${itemId}`)
        .send(updateData)
        .expect(401);
    });

    it('devrait rejeter la mise à jour par un non-propriétaire', async () => {
      // Créer un autre utilisateur
      const otherUser = await authService.register({
        email: 'other@example.com',
        password: 'Password123!',
        displayName: 'Other User',
      });

      const updateData = { title: 'Updated Title' };

      await request(app.getHttpServer())
        .patch(`/api/v1/items/${itemId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /items/:id', () => {
    let itemId: string;

    beforeEach(async () => {
      const item = await prismaService.item.create({
        data: {
          ownerId: userId,
          title: 'Test Item',
          description: 'Test description',
          category: ItemCategory.ELECTRONICS,
          condition: ItemCondition.GOOD,
          status: ItemStatus.AVAILABLE,
        },
      });
      itemId = item.id;
    });

    it('devrait supprimer un item', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/items/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Vérifier que l'item a été supprimé
      await request(app.getHttpServer())
        .get(`/api/v1/items/${itemId}`)
        .expect(404);
    });

    it('devrait rejeter la suppression sans authentification', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/items/${itemId}`)
        .expect(401);
    });

    it('devrait rejeter la suppression par un non-propriétaire', async () => {
      // Créer un autre utilisateur
      const otherUser = await authService.register({
        email: 'other@example.com',
        password: 'Password123!',
        displayName: 'Other User',
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/items/${itemId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /items/user/me', () => {
    beforeEach(async () => {
      // Créer des items pour l'utilisateur
      await prismaService.item.createMany({
        data: [
          {
            ownerId: userId,
            title: 'Item 1',
            description: 'Description 1',
            category: ItemCategory.ELECTRONICS,
            condition: ItemCondition.GOOD,
            status: ItemStatus.AVAILABLE,
          },
          {
            ownerId: userId,
            title: 'Item 2',
            description: 'Description 2',
            category: ItemCategory.BOOKS,
            condition: ItemCondition.FAIR,
            status: ItemStatus.AVAILABLE,
          },
        ],
      });
    });

    it("devrait récupérer les items de l'utilisateur connecté", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items/user/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.items).toHaveLength(2);
      response.body.items.forEach((item: any) => {
        expect(item.owner.id).toBe(userId);
      });
    });

    it("devrait rejeter l'accès sans authentification", async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items/user/me')
        .expect(401);
    });
  });

  describe('POST /items/uploads/signature', () => {
    it("devrait générer une signature d'upload", async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/items/uploads/signature')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          folder: 'items/test-item',
          maxBytes: 3000000,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        signature: expect.any(String),
        timestamp: expect.any(Number),
        folder: 'items/test-item',
        public_id: expect.any(String),
        allowed_formats: expect.any(Array),
        max_bytes: 3000000,
        transformation: expect.any(String),
      });
    });

    it('devrait rejeter la génération de signature sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/items/uploads/signature')
        .send({
          folder: 'items/test-item',
        })
        .expect(401);
    });
  });
});

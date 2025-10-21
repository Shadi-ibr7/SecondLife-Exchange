import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CommunityModule } from '../community.module';
import * as request from 'supertest';

describe('Community E2E', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommunityModule],
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
    await prismaService.post.deleteMany();
    await prismaService.thread.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('Threads', () => {
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

      // Mock JWT token (in real tests, you'd use a proper JWT)
      authToken = 'mock-jwt-token';
    });

    describe('GET /threads', () => {
      it('should return empty list when no threads exist', async () => {
        const response = await request(app.getHttpServer())
          .get('/threads')
          .expect(200);

        expect(response.body).toEqual({
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      });

      it('should return threads with filters', async () => {
        // Create test thread
        await prismaService.thread.create({
          data: {
            scope: 'GENERAL',
            title: 'Test Thread',
            authorId: userId,
          },
        });

        const response = await request(app.getHttpServer())
          .get('/threads?scope=GENERAL')
          .expect(200);

        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0]).toMatchObject({
          scope: 'GENERAL',
          title: 'Test Thread',
        });
      });

      it('should filter by search query', async () => {
        // Create test thread
        await prismaService.thread.create({
          data: {
            scope: 'GENERAL',
            title: 'Searchable Thread',
            authorId: userId,
          },
        });

        const response = await request(app.getHttpServer())
          .get('/threads?q=Searchable')
          .expect(200);

        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].title).toContain('Searchable');
      });
    });

    describe('GET /threads/:id', () => {
      it('should return thread by id', async () => {
        const thread = await prismaService.thread.create({
          data: {
            scope: 'GENERAL',
            title: 'Test Thread',
            authorId: userId,
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/threads/${thread.id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: thread.id,
          title: 'Test Thread',
          scope: 'GENERAL',
        });
      });

      it('should return 404 for non-existent thread', async () => {
        await request(app.getHttpServer())
          .get('/threads/nonexistent')
          .expect(404);
      });
    });

    describe('POST /threads', () => {
      it('should create thread with first post', async () => {
        const threadData = {
          scope: 'GENERAL',
          title: 'New Thread',
          contentFirst: 'First post content',
        };

        const response = await request(app.getHttpServer())
          .post('/threads')
          .set('Authorization', `Bearer ${authToken}`)
          .send(threadData)
          .expect(201);

        expect(response.body).toMatchObject({
          title: 'New Thread',
          scope: 'GENERAL',
        });

        // Verify thread was created in database
        const thread = await prismaService.thread.findUnique({
          where: { id: response.body.id },
        });
        expect(thread).toBeTruthy();
      });

      it('should require authentication', async () => {
        const threadData = {
          scope: 'GENERAL',
          title: 'New Thread',
          contentFirst: 'First post content',
        };

        await request(app.getHttpServer())
          .post('/threads')
          .send(threadData)
          .expect(401);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          scope: 'GENERAL',
          // Missing title and contentFirst
        };

        await request(app.getHttpServer())
          .post('/threads')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);
      });
    });

    describe('DELETE /threads/:id', () => {
      it('should delete thread by author', async () => {
        const thread = await prismaService.thread.create({
          data: {
            scope: 'GENERAL',
            title: 'Test Thread',
            authorId: userId,
          },
        });

        await request(app.getHttpServer())
          .delete(`/threads/${thread.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Verify thread was deleted
        const deletedThread = await prismaService.thread.findUnique({
          where: { id: thread.id },
        });
        expect(deletedThread).toBeNull();
      });

      it('should require authentication', async () => {
        const thread = await prismaService.thread.create({
          data: {
            scope: 'GENERAL',
            title: 'Test Thread',
            authorId: userId,
          },
        });

        await request(app.getHttpServer())
          .delete(`/threads/${thread.id}`)
          .expect(401);
      });
    });
  });

  describe('Posts', () => {
    let authToken: string;
    let userId: string;
    let threadId: string;

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

      // Create test thread
      const thread = await prismaService.thread.create({
        data: {
          scope: 'GENERAL',
          title: 'Test Thread',
          authorId: userId,
        },
      });
      threadId = thread.id;

      authToken = 'mock-jwt-token';
    });

    describe('GET /threads/:id/posts', () => {
      it('should return empty list when no posts exist', async () => {
        const response = await request(app.getHttpServer())
          .get(`/threads/${threadId}/posts`)
          .expect(200);

        expect(response.body).toEqual({
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      });

      it('should return posts for thread', async () => {
        // Create test post
        await prismaService.post.create({
          data: {
            threadId,
            authorId: userId,
            content: 'Test post content',
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/threads/${threadId}/posts`)
          .expect(200);

        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0]).toMatchObject({
          content: 'Test post content',
        });
      });

      it('should return 404 for non-existent thread', async () => {
        await request(app.getHttpServer())
          .get('/threads/nonexistent/posts')
          .expect(404);
      });
    });

    describe('POST /threads/:id/posts', () => {
      it('should create post in thread', async () => {
        const postData = {
          content: 'New post content',
        };

        const response = await request(app.getHttpServer())
          .post(`/threads/${threadId}/posts`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData)
          .expect(201);

        expect(response.body).toMatchObject({
          content: 'New post content',
        });

        // Verify post was created in database
        const post = await prismaService.post.findUnique({
          where: { id: response.body.id },
        });
        expect(post).toBeTruthy();
      });

      it('should create reply to existing post', async () => {
        // Create parent post
        const parentPost = await prismaService.post.create({
          data: {
            threadId,
            authorId: userId,
            content: 'Parent post',
          },
        });

        const replyData = {
          content: 'Reply content',
          repliesTo: parentPost.id,
        };

        const response = await request(app.getHttpServer())
          .post(`/threads/${threadId}/posts`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(replyData)
          .expect(201);

        expect(response.body).toMatchObject({
          content: 'Reply content',
          repliesTo: parentPost.id,
        });
      });

      it('should require authentication', async () => {
        const postData = {
          content: 'New post content',
        };

        await request(app.getHttpServer())
          .post(`/threads/${threadId}/posts`)
          .send(postData)
          .expect(401);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          // Missing content
        };

        await request(app.getHttpServer())
          .post(`/threads/${threadId}/posts`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);
      });
    });

    describe('PATCH /threads/:id/posts/:postId', () => {
      it('should update post by author', async () => {
        const post = await prismaService.post.create({
          data: {
            threadId,
            authorId: userId,
            content: 'Original content',
          },
        });

        const updateData = {
          content: 'Updated content',
        };

        const response = await request(app.getHttpServer())
          .patch(`/threads/${threadId}/posts/${post.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          content: 'Updated content',
        });
      });

      it('should require authentication', async () => {
        const post = await prismaService.post.create({
          data: {
            threadId,
            authorId: userId,
            content: 'Original content',
          },
        });

        const updateData = {
          content: 'Updated content',
        };

        await request(app.getHttpServer())
          .patch(`/threads/${threadId}/posts/${post.id}`)
          .send(updateData)
          .expect(401);
      });
    });

    describe('DELETE /threads/:id/posts/:postId', () => {
      it('should delete post by author', async () => {
        const post = await prismaService.post.create({
          data: {
            threadId,
            authorId: userId,
            content: 'Post to delete',
          },
        });

        await request(app.getHttpServer())
          .delete(`/threads/${threadId}/posts/${post.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Verify post was deleted
        const deletedPost = await prismaService.post.findUnique({
          where: { id: post.id },
        });
        expect(deletedPost).toBeNull();
      });

      it('should require authentication', async () => {
        const post = await prismaService.post.create({
          data: {
            threadId,
            authorId: userId,
            content: 'Post to delete',
          },
        });

        await request(app.getHttpServer())
          .delete(`/threads/${threadId}/posts/${post.id}`)
          .expect(401);
      });
    });
  });
});


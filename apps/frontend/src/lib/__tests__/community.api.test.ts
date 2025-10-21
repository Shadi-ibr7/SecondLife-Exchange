import { communityApi } from '../community.api';
import { apiClient } from '../api';

// Mock the API client
jest.mock('../api', () => ({
  apiClient: {
    client: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockApiClient = apiClient.client as jest.Mocked<typeof apiClient.client>;

describe('Community API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listThreads', () => {
    it('should call GET /threads with correct parameters', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = { scope: 'GENERAL', page: 1, limit: 20 };
      const result = await communityApi.listThreads(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/threads', { params });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call GET /threads without parameters when none provided', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await communityApi.listThreads();

      expect(mockApiClient.get).toHaveBeenCalledWith('/threads', {
        params: {},
      });
    });
  });

  describe('getThread', () => {
    it('should call GET /threads/:id', async () => {
      const mockThread = {
        id: '1',
        scope: 'GENERAL',
        title: 'Test Thread',
        authorId: 'user1',
        author: {
          id: 'user1',
          displayName: 'Test User',
          avatarUrl: null,
        },
        postsCount: 0,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      };

      mockApiClient.get.mockResolvedValue({ data: mockThread });

      const result = await communityApi.getThread('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/threads/1');
      expect(result).toEqual(mockThread);
    });
  });

  describe('createThread', () => {
    it('should call POST /threads with thread data', async () => {
      const threadData = {
        scope: 'GENERAL' as const,
        title: 'New Thread',
        contentFirst: 'First post content',
      };

      const mockThread = {
        id: '1',
        ...threadData,
        authorId: 'user1',
        author: {
          id: 'user1',
          displayName: 'Test User',
          avatarUrl: null,
        },
        postsCount: 0,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({ data: mockThread });

      const result = await communityApi.createThread(threadData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/threads', threadData);
      expect(result).toEqual(mockThread);
    });
  });

  describe('deleteThread', () => {
    it('should call DELETE /threads/:id', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await communityApi.deleteThread('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/threads/1');
    });
  });

  describe('listPosts', () => {
    it('should call GET /threads/:threadId/posts with correct parameters', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 20 };
      const result = await communityApi.listPosts('thread1', params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/threads/thread1/posts', {
        params,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPost', () => {
    it('should call GET /threads/:threadId/posts/:postId', async () => {
      const mockPost = {
        id: '1',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'Test post',
        createdAt: '2024-01-20T10:00:00Z',
        author: {
          id: 'user1',
          displayName: 'Test User',
          avatarUrl: null,
        },
        repliesCount: 0,
        isEdited: false,
      };

      mockApiClient.get.mockResolvedValue({ data: mockPost });

      const result = await communityApi.getPost('thread1', '1');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/threads/thread1/posts/1'
      );
      expect(result).toEqual(mockPost);
    });
  });

  describe('createPost', () => {
    it('should call POST /threads/:threadId/posts with post data', async () => {
      const postData = {
        content: 'New post content',
      };

      const mockPost = {
        id: '1',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'New post content',
        createdAt: '2024-01-20T10:00:00Z',
        author: {
          id: 'user1',
          displayName: 'Test User',
          avatarUrl: null,
        },
        repliesCount: 0,
        isEdited: false,
      };

      mockApiClient.post.mockResolvedValue({ data: mockPost });

      const result = await communityApi.createPost('thread1', postData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/threads/thread1/posts',
        postData
      );
      expect(result).toEqual(mockPost);
    });

    it('should handle reply posts', async () => {
      const postData = {
        content: 'Reply content',
        repliesTo: 'parent1',
      };

      const mockPost = {
        id: '2',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'Reply content',
        repliesTo: 'parent1',
        createdAt: '2024-01-20T10:00:00Z',
        author: {
          id: 'user1',
          displayName: 'Test User',
          avatarUrl: null,
        },
        repliesCount: 0,
        isEdited: false,
      };

      mockApiClient.post.mockResolvedValue({ data: mockPost });

      const result = await communityApi.createPost('thread1', postData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/threads/thread1/posts',
        postData
      );
      expect(result).toEqual(mockPost);
    });
  });

  describe('updatePost', () => {
    it('should call PATCH /threads/:threadId/posts/:postId with update data', async () => {
      const updateData = {
        content: 'Updated content',
      };

      const mockPost = {
        id: '1',
        threadId: 'thread1',
        authorId: 'user1',
        content: 'Updated content',
        createdAt: '2024-01-20T10:00:00Z',
        editedAt: '2024-01-20T11:00:00Z',
        author: {
          id: 'user1',
          displayName: 'Test User',
          avatarUrl: null,
        },
        repliesCount: 0,
        isEdited: true,
      };

      mockApiClient.patch.mockResolvedValue({ data: mockPost });

      const result = await communityApi.updatePost('thread1', '1', updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/threads/thread1/posts/1',
        updateData
      );
      expect(result).toEqual(mockPost);
    });
  });

  describe('deletePost', () => {
    it('should call DELETE /threads/:threadId/posts/:postId', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await communityApi.deletePost('thread1', '1');

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/threads/thread1/posts/1'
      );
    });
  });
});


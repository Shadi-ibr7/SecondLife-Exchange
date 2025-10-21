import { notificationsApi } from '../notifications.api';
import { apiClient } from '../api';

// Mock the API client
jest.mock('../api', () => ({
  apiClient: {
    client: {
      post: jest.fn(),
    },
  },
}));

const mockApiClient = apiClient.client as jest.Mocked<typeof apiClient.client>;

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerToken', () => {
    it('should call POST /notifications/register with token data', async () => {
      const mockResponse = {
        data: {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
          createdAt: '2024-01-20T10:00:00Z',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const tokenData = {
        token: 'test-token',
        provider: 'webpush' as const,
      };

      const result = await notificationsApi.registerToken(tokenData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/notifications/register',
        tokenData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should use default provider when not specified', async () => {
      const mockResponse = {
        data: {
          id: '1',
          userId: 'user1',
          provider: 'webpush',
          token: 'test-token',
          createdAt: '2024-01-20T10:00:00Z',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const tokenData = {
        token: 'test-token',
      };

      const result = await notificationsApi.registerToken(tokenData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/notifications/register',
        tokenData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('sendTestNotification', () => {
    it('should call POST /notifications/test with test data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Notification envoyée à 1 appareil(s)',
          sentCount: 1,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const testData = {
        title: 'Test Notification',
        body: 'This is a test',
      };

      const result = await notificationsApi.sendTestNotification(testData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/notifications/test',
        testData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should call POST /notifications/test without data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Notification envoyée à 1 appareil(s)',
          sentCount: 1,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await notificationsApi.sendTestNotification();

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/notifications/test',
        {}
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(notificationsApi.sendTestNotification()).rejects.toThrow(
        'API Error'
      );
    });
  });
});


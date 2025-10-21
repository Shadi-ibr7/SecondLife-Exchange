import { apiClient } from './api';
import {
  Thread,
  Post,
  PaginatedThreadsResponse,
  PaginatedPostsResponse,
  ListThreadsParams,
  ListPostsParams,
  CreateThreadDto,
  CreatePostDto,
  UpdatePostDto,
} from '@/types';

export const communityApi = {
  /**
   * Liste les threads de discussion
   */
  async listThreads(
    params: ListThreadsParams = {}
  ): Promise<PaginatedThreadsResponse> {
    const response = await apiClient.client.get<PaginatedThreadsResponse>(
      '/threads',
      { params }
    );
    return response.data;
  },

  /**
   * Récupère un thread par ID
   */
  async getThread(id: string): Promise<Thread> {
    const response = await apiClient.client.get<Thread>(`/threads/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau thread
   */
  async createThread(data: CreateThreadDto): Promise<Thread> {
    const response = await apiClient.client.post<Thread>('/threads', data);
    return response.data;
  },

  /**
   * Supprime un thread
   */
  async deleteThread(id: string): Promise<void> {
    await apiClient.client.delete(`/threads/${id}`);
  },

  /**
   * Liste les posts d'un thread
   */
  async listPosts(
    threadId: string,
    params: ListPostsParams = {}
  ): Promise<PaginatedPostsResponse> {
    const response = await apiClient.client.get<PaginatedPostsResponse>(
      `/threads/${threadId}/posts`,
      { params }
    );
    return response.data;
  },

  /**
   * Récupère un post par ID
   */
  async getPost(threadId: string, postId: string): Promise<Post> {
    const response = await apiClient.client.get<Post>(
      `/threads/${threadId}/posts/${postId}`
    );
    return response.data;
  },

  /**
   * Crée un nouveau post
   */
  async createPost(threadId: string, data: CreatePostDto): Promise<Post> {
    const response = await apiClient.client.post<Post>(
      `/threads/${threadId}/posts`,
      data
    );
    return response.data;
  },

  /**
   * Met à jour un post
   */
  async updatePost(
    threadId: string,
    postId: string,
    data: UpdatePostDto
  ): Promise<Post> {
    const response = await apiClient.client.patch<Post>(
      `/threads/${threadId}/posts/${postId}`,
      data
    );
    return response.data;
  },

  /**
   * Supprime un post
   */
  async deletePost(threadId: string, postId: string): Promise<void> {
    await apiClient.client.delete(`/threads/${threadId}/posts/${postId}`);
  },
};


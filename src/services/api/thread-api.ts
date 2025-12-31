/**
 * Thread API client
 * Handles all thread-related CRUD operations
 */

import { BaseApiClient, RequestOptions } from './base-api-client';
import { ForumsThread } from '@/shared/types';
import {
  CreateThreadRequest,
  UpdateThreadRequest,
  ThreadQueryParams,
  PaginatedResponse
} from './types';

export class ThreadApiClient extends BaseApiClient {
  /**
   * Get all threads with optional filtering and pagination
   */
  async getThreads(params: ThreadQueryParams = {}): Promise<PaginatedResponse<ForumsThread>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/threads${queryString}`;
    
    const response = await this.makeRequest<{ threads?: ForumsThread[]; count?: number; nextThreadCursor?: string } | ForumsThread[]>(endpoint);
    
    // Handle both array response and paginated response
    const threads = Array.isArray(response) ? response : response.threads || [];
    const count = Array.isArray(response) ? response.length : response.count || threads.length;
    const nextCursor = Array.isArray(response) ? undefined : response.nextThreadCursor;
    
    return {
      data: threads,
      count,
      nextCursor
    };
  }

  /**
   * Get a specific thread by ID
   */
  async getThread(threadId: string): Promise<ForumsThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    return this.makeRequest<ForumsThread>(`/api/v1/thread/${threadId}`);
  }

  /**
   * Create a new thread
   */
  async createThread(threadData: CreateThreadRequest, bearerToken?: string): Promise<ForumsThread> {
    const options: RequestOptions = {
      method: 'POST',
      body: threadData,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsThread>('/api/v1/thread', options);
  }

  /**
   * Update an existing thread
   */
  async updateThread(
    threadId: string, 
    updates: UpdateThreadRequest, 
    bearerToken?: string
  ): Promise<ForumsThread> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'PUT',
      body: updates,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsThread>(`/api/v1/thread/${threadId}`, options);
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string, bearerToken?: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}`, options);
  }

  /**
   * Like a thread
   */
  async likeThread(threadId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/thread/${threadId}/likes`, options);
  }

  /**
   * Remove like from a thread
   */
  async unlikeThread(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}/likes`, options);
  }

  /**
   * Dislike a thread
   */
  async dislikeThread(threadId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/thread/${threadId}/dislikes`, options);
  }

  /**
   * Remove dislike from a thread
   */
  async removeDislikeThread(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}/dislikes`, options);
  }

  /**
   * Upvote a thread
   */
  async upvoteThread(threadId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/thread/${threadId}/upvotes`, options);
  }

  /**
   * Remove upvote from a thread
   */
  async removeUpvoteThread(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}/upvotes`, options);
  }

  /**
   * Downvote a thread
   */
  async downvoteThread(threadId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/thread/${threadId}/downvotes`, options);
  }

  /**
   * Remove downvote from a thread
   */
  async removeDownvoteThread(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}/downvotes`, options);
  }

  /**
   * Subscribe to a thread
   */
  async subscribeToThread(threadId: string, bearerToken: string): Promise<{ threadId: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ threadId: string; userId: string }>(`/api/v1/thread/${threadId}/subscribers`, options);
  }

  /**
   * Unsubscribe from a thread
   */
  async unsubscribeFromThread(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}/subscribers`, options);
  }
}
/**
 * Client-side API service
 * Handles all API calls from client components to internal API routes
 * Follows senior developer standards with proper error handling and type safety
 */

import { ForumsThread, ForumsPost, ForumsTag, RegisterRequest } from '@/shared/types';
import { SummaryData } from '@/shared/types/common';
import { ApiResponse, ApiListResponse } from '@/services/api/types';

// Extend base API response types for client-specific needs
export interface ThreadResponse extends ApiResponse<ForumsThread> {
  thread?: ForumsThread;
  posts?: ForumsPost[];
}

export interface PostResponse extends ApiResponse<ForumsPost> {
  post?: ForumsPost;
}

export interface ThreadsResponse extends ApiListResponse<ForumsThread> {
  threads?: ForumsThread[];
}

export interface PostsResponse extends ApiListResponse<ForumsPost> {
  data?: ForumsPost[];
}

export class ClientApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

class ClientApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(endpoint, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication errors specially
        if (response.status === 401 && errorData.shouldReauth) {
          // Trigger re-authentication
          if (typeof window !== 'undefined') {
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/auth/signin?message=session-expired' });
          }
          throw new ClientApiError(
            'Your session has expired. Please log in again.',
            response.status
          );
        }
        
        throw new ClientApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ClientApiError) {
        throw error;
      }
      
      throw new ClientApiError(
        'Network error or invalid response',
        undefined,
        error as Error
      );
    }
  }

  // AI operations
  async summarizeThread(threadId: string): Promise<ApiResponse<SummaryData>> {
    return this.makeRequest<ApiResponse<SummaryData>>('/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ threadId }),
    });
  }

  // Authentication operations
  async register(data: RegisterRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Thread operations
  async createThread(data: {
    title: string;
    content: string;
    tags?: string[];
  }): Promise<ThreadResponse> {
    return this.makeRequest<ThreadResponse>('/api/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getThread(id: string): Promise<ThreadResponse> {
    return this.makeRequest<ThreadResponse>(`/api/thread/${id}`);
  }

  async updateThread(id: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
  }): Promise<ThreadResponse> {
    return this.makeRequest<ThreadResponse>(`/api/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteThread(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/api/threads/${id}`, {
      method: 'DELETE',
    });
  }

  async getThreads(params?: {
    query?: string;
    limit?: number;
    cursor?: string;
    tagId?: string;
  }): Promise<ThreadsResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/threads${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ThreadsResponse>(endpoint);
  }

  // Post operations
  async createPost(data: {
    threadId: string;
    parentId?: string;
    content: string;
  }): Promise<PostResponse> {
    return this.makeRequest<PostResponse>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPost(id: string): Promise<PostResponse> {
    return this.makeRequest<PostResponse>(`/api/posts/${id}`);
  }

  async updatePost(id: string, data: {
    content: string;
  }): Promise<PostResponse> {
    return this.makeRequest<PostResponse>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async getThreadPosts(threadId: string): Promise<PostsResponse> {
    return this.makeRequest<PostsResponse>(`/api/threads/${threadId}/posts`);
  }

  // Tag operations (when implemented)
  async getTags(params?: {
    query?: string;
    limit?: number;
    includeThreads?: false;
  }): Promise<ApiResponse<ForumsTag[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = `/api/tags${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ApiResponse<ForumsTag[]>>(endpoint);
  }

  async createTag(data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<ApiResponse<ForumsTag>> {
    return this.makeRequest<ApiResponse<ForumsTag>>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const clientApi = new ClientApiService();

// Export class for testing or custom instances
export { ClientApiService };
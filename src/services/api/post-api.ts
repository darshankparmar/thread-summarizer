/**
 * Post API client
 * Handles all post-related CRUD operations
 */

import { BaseApiClient, RequestOptions } from './base-api-client';
import { ForumsPost } from '@/shared/types';
import {
  CreatePostRequest,
  UpdatePostRequest,
  PostQueryParams,
  PaginatedResponse
} from './types';

export class PostApiClient extends BaseApiClient {
  /**
   * Get all posts with optional filtering and pagination
   */
  async getPosts(params: PostQueryParams = {}): Promise<PaginatedResponse<ForumsPost>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/posts${queryString}`;
    
    const response = await this.makeRequest<{ posts?: ForumsPost[]; count?: number; nextCursor?: string } | ForumsPost[]>(endpoint);
    
    // Handle both array response and paginated response
    const posts = Array.isArray(response) ? response : response.posts || [];
    const count = Array.isArray(response) ? response.length : response.count || posts.length;
    const nextCursor = Array.isArray(response) ? undefined : response.nextCursor;
    
    return {
      data: posts,
      count,
      nextCursor
    };
  }

  /**
   * Get posts for a specific thread
   */
  async getThreadPosts(threadId: string): Promise<ForumsPost[]> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const response = await this.makeRequest<{ posts?: ForumsPost[] } | ForumsPost[]>(`/api/v1/thread/${threadId}/posts`);
    
    // Handle both array response and object response
    return Array.isArray(response) ? response : response.posts || [];
  }

  /**
   * Get a specific post by ID
   */
  async getPost(postId: string): Promise<ForumsPost> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    return this.makeRequest<ForumsPost>(`/api/v1/post/${postId}`);
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostRequest, bearerToken: string): Promise<ForumsPost> {
    const options: RequestOptions = {
      method: 'POST',
      body: postData,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsPost>('/api/v1/post', options);
  }

  /**
   * Update an existing post
   */
  async updatePost(
    postId: string, 
    updates: UpdatePostRequest, 
    bearerToken: string
  ): Promise<ForumsPost> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'PUT',
      body: updates,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsPost>(`/api/v1/post/${postId}`, options);
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, bearerToken: string): Promise<void> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/post/${postId}`, options);
  }

  /**
   * Like a post
   */
  async likePost(postId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/post/${postId}/likes`, options);
  }

  /**
   * Remove like from a post
   */
  async unlikePost(postId: string, bearerToken: string): Promise<void> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/post/${postId}/likes`, options);
  }

  /**
   * Dislike a post
   */
  async dislikePost(postId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/post/${postId}/dislikes`, options);
  }

  /**
   * Remove dislike from a post
   */
  async removeDislikePost(postId: string, bearerToken: string): Promise<void> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/post/${postId}/dislikes`, options);
  }

  /**
   * Upvote a post
   */
  async upvotePost(postId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/post/${postId}/upvotes`, options);
  }

  /**
   * Remove upvote from a post
   */
  async removeUpvotePost(postId: string, bearerToken: string): Promise<void> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/post/${postId}/upvotes`, options);
  }

  /**
   * Downvote a post
   */
  async downvotePost(postId: string, bearerToken: string): Promise<{ id: string; userId: string }> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; userId: string }>(`/api/v1/post/${postId}/downvotes`, options);
  }

  /**
   * Remove downvote from a post
   */
  async removeDownvotePost(postId: string, bearerToken: string): Promise<void> {
    if (!postId?.trim()) {
      throw new Error('Post ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/post/${postId}/downvotes`, options);
  }

  /**
   * Mark a post as the best answer
   */
  async markAsBestAnswer(postId: string, bearerToken: string): Promise<ForumsPost> {
    return this.updatePost(postId, { bestAnswer: true }, bearerToken);
  }

  /**
   * Unmark a post as the best answer
   */
  async unmarkAsBestAnswer(postId: string, bearerToken: string): Promise<ForumsPost> {
    return this.updatePost(postId, { bestAnswer: false }, bearerToken);
  }
}
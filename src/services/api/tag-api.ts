/**
 * Tag API client
 * Handles all tag-related CRUD operations
 */

import { BaseApiClient, RequestOptions } from './base-api-client';
import { ForumsTag } from '@/types';
import {
  CreateTagRequest,
  UpdateTagRequest,
  TagQueryParams,
  PaginatedResponse,
  SubscriptionResponse
} from './types';

export class TagApiClient extends BaseApiClient {
  /**
   * Get all tags with optional filtering and pagination
   */
  async getTags(params: TagQueryParams = {}): Promise<PaginatedResponse<ForumsTag>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/tags${queryString}`;
    
    const response = await this.makeRequest<{ tags?: ForumsTag[]; count?: number; nextCursor?: string } | ForumsTag[]>(endpoint);
    
    // Handle both array response and paginated response
    const tags = Array.isArray(response) ? response : response.tags || [];
    const count = Array.isArray(response) ? response.length : response.count || tags.length;
    const nextCursor = Array.isArray(response) ? undefined : response.nextCursor;
    
    return {
      data: tags,
      count,
      nextCursor
    };
  }

  /**
   * Get subscribed tags for the current user
   */
  async getSubscribedTags(bearerToken: string, params: TagQueryParams = {}): Promise<PaginatedResponse<ForumsTag>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/tags/subscribed${queryString}`;
    
    const options: RequestOptions = {
      method: 'GET',
      useApiKey: false,
      bearerToken
    };

    const response = await this.makeRequest<{ tags?: ForumsTag[]; count?: number; nextCursor?: string } | ForumsTag[]>(endpoint, options);
    
    // Handle both array response and paginated response
    const tags = Array.isArray(response) ? response : response.tags || [];
    const count = Array.isArray(response) ? response.length : response.count || tags.length;
    const nextCursor = Array.isArray(response) ? undefined : response.nextCursor;
    
    return {
      data: tags,
      count,
      nextCursor
    };
  }

  /**
   * Get a specific tag by ID
   */
  async getTag(tagId: string): Promise<ForumsTag> {
    if (!tagId?.trim()) {
      throw new Error('Tag ID is required');
    }

    return this.makeRequest<ForumsTag>(`/api/v1/tag/${tagId}`);
  }

  /**
   * Create a new tag
   */
  async createTag(tagData: CreateTagRequest, bearerToken: string): Promise<ForumsTag> {
    const options: RequestOptions = {
      method: 'POST',
      body: tagData,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsTag>('/api/v1/tag', options);
  }

  /**
   * Update an existing tag
   */
  async updateTag(
    tagId: string, 
    updates: UpdateTagRequest, 
    bearerToken: string
  ): Promise<ForumsTag> {
    if (!tagId?.trim()) {
      throw new Error('Tag ID is required');
    }

    const options: RequestOptions = {
      method: 'PUT',
      body: updates,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsTag>(`/api/v1/tag/${tagId}`, options);
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string, bearerToken: string): Promise<void> {
    if (!tagId?.trim()) {
      throw new Error('Tag ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/tag/${tagId}`, options);
  }

  /**
   * Subscribe to a tag
   */
  async subscribeToTag(tagId: string, bearerToken: string): Promise<SubscriptionResponse> {
    if (!tagId?.trim()) {
      throw new Error('Tag ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<SubscriptionResponse>(`/api/v1/tag/${tagId}/subscribers`, options);
  }

  /**
   * Unsubscribe from a tag
   */
  async unsubscribeFromTag(tagId: string, bearerToken: string): Promise<void> {
    if (!tagId?.trim()) {
      throw new Error('Tag ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/tag/${tagId}/subscribers`, options);
  }

  /**
   * Search tags by name
   */
  async searchTags(query: string, params: Omit<TagQueryParams, 'query'> = {}): Promise<PaginatedResponse<ForumsTag>> {
    if (!query?.trim()) {
      throw new Error('Search query is required');
    }

    return this.getTags({ ...params, query: query.trim() });
  }
}
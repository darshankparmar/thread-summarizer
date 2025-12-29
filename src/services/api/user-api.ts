/**
 * User API client
 * Handles all user-related CRUD operations
 */

import { BaseApiClient, RequestOptions } from './base-api-client';
import { ForumsUser } from '@/types';
import {
  UpdateUserRequest,
  UserQueryParams,
  PaginatedResponse,
  FollowResponse
} from './types';

export class UserApiClient extends BaseApiClient {
  /**
   * Get all users with optional filtering and pagination
   */
  async getUsers(params: UserQueryParams = {}): Promise<PaginatedResponse<ForumsUser>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/users${queryString}`;
    
    const response = await this.makeRequest<{ users?: ForumsUser[]; count?: number; nextCursor?: string } | ForumsUser[]>(endpoint);
    
    // Handle both array response and paginated response
    const users = Array.isArray(response) ? response : response.users || [];
    const count = Array.isArray(response) ? response.length : response.count || users.length;
    const nextCursor = Array.isArray(response) ? undefined : response.nextCursor;
    
    return {
      data: users,
      count,
      nextCursor
    };
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: string): Promise<ForumsUser> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    return this.makeRequest<ForumsUser>(`/api/v1/user/${userId}`);
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string, 
    updates: UpdateUserRequest, 
    bearerToken: string
  ): Promise<ForumsUser> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const options: RequestOptions = {
      method: 'PUT',
      body: updates,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsUser>(`/api/v1/user/${userId}`, options);
  }

  /**
   * Delete a user account
   */
  async deleteUser(userId: string, bearerToken: string): Promise<void> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/user/${userId}`, options);
  }

  /**
   * Get user's followers
   */
  async getUserFollowers(userId: string, params: { limit?: number; cursor?: string } = {}): Promise<PaginatedResponse<FollowResponse>> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/user/${userId}/followers${queryString}`;
    
    const response = await this.makeRequest<{ followers?: FollowResponse[]; count?: number; nextCursor?: string }>(endpoint);
    
    return {
      data: response.followers || [],
      count: response.count || 0,
      nextCursor: response.nextCursor
    };
  }

  /**
   * Get users that a user is following
   */
  async getUserFollowing(userId: string, params: { limit?: number; cursor?: string } = {}): Promise<PaginatedResponse<FollowResponse>> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v1/user/${userId}/following${queryString}`;
    
    const response = await this.makeRequest<{ following?: FollowResponse[]; count?: number; nextCursor?: string }>(endpoint);
    
    return {
      data: response.following || [],
      count: response.count || 0,
      nextCursor: response.nextCursor
    };
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, bearerToken: string): Promise<FollowResponse> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<FollowResponse>(`/api/v1/user/${userId}/followers`, options);
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, bearerToken: string): Promise<void> {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/user/${userId}/followers`, options);
  }

  /**
   * Get current user information (from JWT token)
   */
  async getCurrentUser(bearerToken: string): Promise<ForumsUser> {
    const options: RequestOptions = {
      method: 'GET',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsUser>('/api/v1/auth/me', options);
  }

  /**
   * Update current user's profile
   */
  async updateCurrentUser(updates: UpdateUserRequest, bearerToken: string): Promise<ForumsUser> {
    // First get current user to get their ID
    const currentUser = await this.getCurrentUser(bearerToken);
    return this.updateUser(currentUser.id, updates, bearerToken);
  }
}
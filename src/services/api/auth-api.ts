/**
 * Authentication API client
 * Handles all authentication-related operations
 */

import { BaseApiClient, RequestOptions } from './base-api-client';
import { ForumsUser } from '@/types';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  emailVerified?: boolean;
  roles?: string[];
  extendedData?: Record<string, unknown>;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export class AuthApiClient extends BaseApiClient {
  /**
   * Authenticate user with login credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (!credentials.login?.trim() || !credentials.password?.trim()) {
      throw new Error('Login and password are required');
    }

    const options: RequestOptions = {
      method: 'POST',
      body: credentials,
      useApiKey: true
    };

    return this.makeRequest<LoginResponse>('/api/v1/auth/login', options);
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<ForumsUser> {
    if (!userData.username?.trim() || !userData.email?.trim() || !userData.password?.trim()) {
      throw new Error('Username, email, and password are required');
    }

    const options: RequestOptions = {
      method: 'POST',
      body: userData,
      useApiKey: true 
    };

    return this.makeRequest<ForumsUser>('/api/v1/auth/register', options);
  }

  /**
   * Get current user information from JWT token
   */
  async getCurrentUser(bearerToken: string): Promise<ForumsUser> {
    if (!bearerToken?.trim()) {
      throw new Error('Bearer token is required');
    }

    const options: RequestOptions = {
      method: 'GET',
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<ForumsUser>('/api/v1/auth/me', options);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    if (!email?.trim()) {
      throw new Error('Email is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      body: { email: email.trim() },
      useApiKey: true
    };

    return this.makeRequest<ForgotPasswordResponse>('/api/v1/auth/forgot-password', options);
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<{ success: boolean }> {
    if (!resetData.token?.trim() || !resetData.password?.trim()) {
      throw new Error('Reset token and new password are required');
    }

    const options: RequestOptions = {
      method: 'POST',
      body: resetData,
      useApiKey: true
    };

    return this.makeRequest<{ success: boolean }>('/api/v1/auth/reset-password', options);
  }

  /**
   * Validate JWT token by attempting to get user info
   */
  async validateToken(bearerToken: string): Promise<boolean> {
    try {
      await this.getCurrentUser(bearerToken);
      return true;
    } catch {
      return false;
    }
  }
}
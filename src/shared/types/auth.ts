/**
 * Authentication Types
 */

import type { ForumsUser } from './forums';

// Authentication types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
  roles?: string[];
  forumsToken?: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: ForumsUser;
  error?: string;
}

// Enhanced authentication types
export interface AuthenticationState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  error?: string;
}
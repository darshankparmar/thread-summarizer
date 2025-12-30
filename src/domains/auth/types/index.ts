/**
 * Auth Domain Types
 */

// Import AuthUser for local use
import type { AuthUser } from '@/shared/types';

// Re-export auth-related types from shared types
export type { 
  AuthUser, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  AuthenticationState,
  PasswordResetRequest,
  PasswordResetResponse
} from '@/shared/types';

// Auth-specific component props
export interface SessionProviderProps {
  children: React.ReactNode;
}

// Auth service types
export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface SessionData {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}
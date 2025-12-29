/**
 * API module exports
 * Provides clean exports for all API-related functionality
 */

// Main API client
export { 
  ForumsApiClient, 
  createForumsApiClient, 
  forumsApiClient 
} from './forums-api-client';

// Individual API clients (for advanced usage)
export { ThreadApiClient } from './thread-api';
export { PostApiClient } from './post-api';
export { UserApiClient } from './user-api';
export { TagApiClient } from './tag-api';
export { PollApiClient } from './poll-api';
export { AuthApiClient } from './auth-api';

// Base client and error handling
export { BaseApiClient, ApiError } from './base-api-client';
export type { ApiConfig, RequestOptions } from './base-api-client';

// All API types
export * from './types';

// Auth-specific types (re-exported for convenience)
export type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest
} from './auth-api';

// Poll-specific types (re-exported for convenience)
export type { Poll } from './poll-api';
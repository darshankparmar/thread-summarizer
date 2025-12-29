/**
 * Authentication module exports
 * Provides clean exports for all authentication-related functionality
 */

// Main authentication service
export { EnhancedAuthService } from './enhanced-auth-service';
export type { AuthResult, ValidationResult } from './enhanced-auth-service';

// Session and token management
export { SessionManager } from './session-manager';
export type { SessionData } from './session-manager';

export { TokenManager } from './token-manager';
export type { TokenData } from './token-manager';

// Protected API wrapper
export { ProtectedApiWrapper } from './protected-api-wrapper';

// Factory function to create configured auth service
import { EnhancedAuthService } from './enhanced-auth-service';
import { ProtectedApiWrapper } from './protected-api-wrapper';
import { forumsApiClient } from '../api';

/**
 * Create a configured authentication service instance
 */
export function createAuthService(apiClient = forumsApiClient): EnhancedAuthService {
  return new EnhancedAuthService(apiClient);
}

/**
 * Create a configured protected API wrapper instance
 */
export function createProtectedApi(apiClient = forumsApiClient): ProtectedApiWrapper {
  return new ProtectedApiWrapper(apiClient);
}

/**
 * Default export - pre-configured auth service instance
 */
export const authService = createAuthService();

/**
 * Default export - pre-configured protected API instance
 */
export const protectedApi = createProtectedApi();
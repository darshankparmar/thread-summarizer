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

// Factory function to create configured auth service
import { EnhancedAuthService } from './enhanced-auth-service';
import { forumsApiClient } from '@/domains/threads/services/api';

/**
 * Create a configured authentication service instance
 */
export function createAuthService(apiClient = forumsApiClient): EnhancedAuthService {
  return new EnhancedAuthService(apiClient);
}

/**
 * Default export - pre-configured auth service instance
 */
export const authService = createAuthService();
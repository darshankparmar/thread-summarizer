/**
 * Legacy Authentication Service (Deprecated)
 * This file is kept for backward compatibility
 * New code should use the enhanced auth service from ./auth/
 */

import { authService } from './auth';

// Re-export the enhanced auth service for backward compatibility
export const AuthService = authService.constructor;
export { authService };

// Keep the old interface for existing code
export class LegacyAuthService {
  async login(credentials: { login: string; password: string }) {
    return authService.login(credentials);
  }

  async register(userData: { username: string; email: string; password: string; displayName?: string }) {
    return authService.register(userData);
  }

  async getUserFromToken(token: string) {
    const isValid = await authService.validateToken(token);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }

    const user = await authService.getCurrentUser();
    return {
      success: true,
      user
    };
  }
}

// Export legacy instance for backward compatibility
export const legacyAuthService = new LegacyAuthService();
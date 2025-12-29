import { ForumsApiClient, ForumsApiError, createForumsApiClient } from './forums-api';
import { ForumsUser, AuthUser, LoginRequest, RegisterRequest } from '@/types';

/**
 * Authentication service for managing user authentication with Foru.ms API
 */
export class AuthService {
  private forumsApi: ForumsApiClient;

  constructor(forumsApi?: ForumsApiClient) {
    this.forumsApi = forumsApi || createForumsApiClient();
  }

  /**
   * Authenticate user with username/email and password
   * @param credentials - Login credentials
   * @returns Promise<{success: boolean, user?: AuthUser, token?: string, error?: string}>
   */
  async login(credentials: LoginRequest): Promise<{
    success: boolean;
    user?: AuthUser;
    token?: string;
    error?: string;
  }> {
    try {
      // Validate input
      if (!credentials.login?.trim() || !credentials.password?.trim()) {
        return {
          success: false,
          error: 'Username/email and password are required'
        };
      }

      // Authenticate with Foru.ms API
      const authResult = await this.forumsApi.authenticateUser(
        credentials.login.trim(),
        credentials.password
      );

      // Transform ForumsUser to AuthUser
      const authUser: AuthUser = {
        id: authResult.user.id,
        username: authResult.user.username,
        email: authResult.user.email,
        name: authResult.user.displayName || authResult.user.username,
        image: authResult.user.image,
        emailVerified: authResult.user.emailVerified,
        roles: authResult.user.roles || [],
        forumsToken: authResult.token
      };

      return {
        success: true,
        user: authUser,
        token: authResult.token
      };
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof ForumsApiError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Register new user
   * @param userData - Registration data
   * @returns Promise<{success: boolean, user?: ForumsUser, error?: string}>
   */
  async register(userData: RegisterRequest): Promise<{
    success: boolean;
    user?: ForumsUser;
    error?: string;
  }> {
    try {
      // Validate input
      if (!userData.username?.trim() || !userData.email?.trim() || !userData.password?.trim()) {
        return {
          success: false,
          error: 'Username, email, and password are required'
        };
      }

      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error
        };
      }

      // Register with Foru.ms API
      const user = await this.forumsApi.registerUser({
        username: userData.username.trim(),
        email: userData.email.trim(),
        password: userData.password,
        displayName: userData.displayName?.trim(),
        emailVerified: false,
        roles: ['user'] // Default role
      });

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof ForumsApiError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Get user information from JWT token
   * @param token - JWT token
   * @returns Promise<{success: boolean, user?: AuthUser, error?: string}>
   */
  async getUserFromToken(token: string): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    try {
      if (!token?.trim()) {
        return {
          success: false,
          error: 'Token is required'
        };
      }

      // Get user info from Foru.ms API
      const forumsUser = await this.forumsApi.getUserInfo(token);

      // Transform ForumsUser to AuthUser
      const authUser: AuthUser = {
        id: forumsUser.id,
        username: forumsUser.username,
        email: forumsUser.email,
        name: forumsUser.displayName || forumsUser.username,
        image: forumsUser.image,
        emailVerified: forumsUser.emailVerified,
        roles: forumsUser.roles || [],
        forumsToken: token
      };

      return {
        success: true,
        user: authUser
      };
    } catch (error) {
      console.error('Get user from token error:', error);

      if (error instanceof ForumsApiError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Failed to get user information'
      };
    }
  }

  /**
   * Validate email format
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @private
   */
  private validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter'
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter'
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number'
      };
    }

    return { isValid: true };
  }
}

/**
 * Default export - pre-configured auth service instance
 */
export const authService = new AuthService();
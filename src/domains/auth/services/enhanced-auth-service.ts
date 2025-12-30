/**
 * Enhanced Authentication Service
 * Integrates with the new API client and provides comprehensive auth management
 */

import { ForumsApiClient, ApiError } from '@/domains/threads/services/api';
import { AuthUser, LoginRequest, RegisterRequest, ForumsRole } from '@/shared/types';
import { SessionManager } from './session-manager';
import { TokenManager } from './token-manager';

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

export class EnhancedAuthService {
  private apiClient: ForumsApiClient;

  constructor(apiClient: ForumsApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Authenticate user with username/email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResult> {
    try {
      // Validate input
      const validation = this.validateLoginCredentials(credentials);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Authenticate with API
      const authResult = await this.apiClient.authenticateAndGetUser(
        credentials.login.trim(),
        credentials.password
      );

      // Create session
      const sessionData = SessionManager.createSession(authResult.user, authResult.token);

      return {
        success: true,
        user: sessionData.user,
        token: authResult.token
      };
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          error: this.getHumanReadableError(error)
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
   */
  async register(userData: RegisterRequest): Promise<AuthResult> {
    try {
      // Validate input
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Register with API
      const user = await this.apiClient.auth.register({
        username: userData.username.trim(),
        email: userData.email.trim(),
        password: userData.password,
        displayName: userData.displayName?.trim(),
        emailVerified: false,
        roles: ['user'] // Default role
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.displayName || user.username,
          image: user.image,
          emailVerified: user.emailVerified,
          roles: user.roles ? user.roles.map((role: string | ForumsRole) => 
            typeof role === 'string' ? role : role.name
          ) : []
        }
      };
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          error: this.getRegistrationError(error)
        };
      }

      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    SessionManager.clearSession();
  }

  /**
   * Get current user from session or validate with API
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const sessionUser = SessionManager.getCurrentUser();
    if (!sessionUser) {
      return null;
    }

    // If token is expiring soon, try to refresh user data
    if (TokenManager.isTokenExpiringSoon()) {
      try {
        const token = SessionManager.getCurrentToken();
        if (token) {
          const freshUser = await this.apiClient.auth.getCurrentUser(token);
          SessionManager.updateUser({
            username: freshUser.username,
            email: freshUser.email,
            name: freshUser.displayName || freshUser.username,
            image: freshUser.image,
            emailVerified: freshUser.emailVerified,
            roles: freshUser.roles ? freshUser.roles.map((role: string | ForumsRole) => 
              typeof role === 'string' ? role : role.name
            ) : []
          });
        }
      } catch (error) {
        console.warn('Failed to refresh user data:', error);
        // If refresh fails, clear session
        if (error instanceof ApiError && error.statusCode === 401) {
          SessionManager.clearSession();
          return null;
        }
      }
    }

    return SessionManager.getCurrentUser();
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return SessionManager.isAuthenticated();
  }

  /**
   * Get current JWT token
   */
  getCurrentToken(): string | null {
    return SessionManager.getCurrentToken();
  }

  /**
   * Validate JWT token
   */
  async validateToken(token?: string): Promise<boolean> {
    const tokenToValidate = token || this.getCurrentToken();
    if (!tokenToValidate) {
      return false;
    }

    try {
      await this.apiClient.auth.getCurrentUser(tokenToValidate);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      if (!email?.trim()) {
        return {
          success: false,
          error: 'Email address is required'
        };
      }

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      await this.apiClient.auth.forgotPassword(email.trim());

      return {
        success: true
      };
    } catch (error) {
      console.error('Password reset request error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          error: this.getHumanReadableError(error)
        };
      }

      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      if (!token?.trim() || !newPassword?.trim()) {
        return {
          success: false,
          error: 'Reset token and new password are required'
        };
      }

      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error
        };
      }

      await this.apiClient.auth.resetPassword({
        token: token.trim(),
        password: newPassword
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Password reset error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          error: this.getHumanReadableError(error)
        };
      }

      return {
        success: false,
        error: 'Failed to reset password. Please try again.'
      };
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthResult> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const token = this.getCurrentToken();
      if (!token) {
        return {
          success: false,
          error: 'Authentication token not found'
        };
      }

      // Update via API
      const updatedUser = await this.apiClient.users.updateCurrentUser({
        username: updates.username,
        email: updates.email,
        displayName: updates.name,
        image: updates.image
      }, token);

      // Update session
      const updatedAuthUser = SessionManager.updateUser({
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.displayName || updatedUser.username,
        image: updatedUser.image,
        emailVerified: updatedUser.emailVerified,
        roles: updatedUser.roles ? updatedUser.roles.map((role: string | ForumsRole) => 
          typeof role === 'string' ? role : role.name
        ) : []
      });

      return {
        success: true,
        user: updatedAuthUser?.user
      };
    } catch (error) {
      console.error('Profile update error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          error: this.getHumanReadableError(error)
        };
      }

      return {
        success: false,
        error: 'Failed to update profile. Please try again.'
      };
    }
  }

  /**
   * Validate login credentials
   */
  private validateLoginCredentials(credentials: LoginRequest): ValidationResult {
    if (!credentials.login?.trim()) {
      return {
        isValid: false,
        error: 'Username or email is required'
      };
    }

    if (!credentials.password?.trim()) {
      return {
        isValid: false,
        error: 'Password is required'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate registration data
   */
  private validateRegistrationData(userData: RegisterRequest): ValidationResult {
    if (!userData.username?.trim()) {
      return {
        isValid: false,
        error: 'Username is required'
      };
    }

    if (!userData.email?.trim()) {
      return {
        isValid: false,
        error: 'Email address is required'
      };
    }

    if (!userData.password?.trim()) {
      return {
        isValid: false,
        error: 'Password is required'
      };
    }

    if (!this.isValidEmail(userData.email)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address'
      };
    }

    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    return { isValid: true };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): ValidationResult {
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

  /**
   * Convert API errors to human-readable messages for registration
   */
  private getRegistrationError(error: ApiError): string {
    switch (error.statusCode) {
      case 400:
        // Check if the error message contains specific validation info
        if (error.message?.toLowerCase().includes('username')) {
          return 'Username is invalid or already taken. Please choose a different username.';
        }
        if (error.message?.toLowerCase().includes('email')) {
          return 'Email address is invalid or already registered. Please use a different email.';
        }
        if (error.message?.toLowerCase().includes('password')) {
          return 'Password does not meet requirements. Please choose a stronger password.';
        }
        return 'Invalid registration data. Please check your input and try again.';
      case 409:
        // Conflict - usually means username or email already exists
        if (error.message?.toLowerCase().includes('username')) {
          return 'This username is already taken. Please choose a different username.';
        }
        if (error.message?.toLowerCase().includes('email')) {
          return 'This email address is already registered. Please use a different email or try signing in.';
        }
        return 'Username or email already exists. Please choose different credentials.';
      case 422:
        return 'Registration data is invalid. Please check all fields and try again.';
      case 429:
        return 'Too many registration attempts. Please wait a few minutes before trying again.';
      case 500:
        return 'Server error during registration. Please try again later.';
      case 503:
        return 'Registration service is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'Registration failed. Please try again.';
    }
  }

  /**
   * Convert API errors to human-readable messages
   */
  private getHumanReadableError(error: ApiError): string {
    switch (error.statusCode) {
      case 401:
        return 'Invalid username/email or password';
      case 400:
        return 'Invalid data provided. Please check your input.';
      case 409:
        return 'Username or email already exists';
      case 422:
        return 'Please check your input and try again';
      case 429:
        return 'Too many attempts. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
}
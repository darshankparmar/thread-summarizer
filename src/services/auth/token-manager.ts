/**
 * JWT Token Manager
 * Handles token storage, validation, and lifecycle management
 */

export interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'forums_auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'forums_refresh_token';
  private static readonly EXPIRES_AT_KEY = 'forums_token_expires_at';

  /**
   * Store JWT token in localStorage with expiration
   */
  static storeToken(tokenData: TokenData): void {
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    try {
      localStorage.setItem(this.TOKEN_KEY, tokenData.token);
      localStorage.setItem(this.EXPIRES_AT_KEY, tokenData.expiresAt.toString());
      
      if (tokenData.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
      }
    } catch (error) {
      console.warn('Failed to store token in localStorage:', error);
    }
  }

  /**
   * Retrieve stored JWT token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') {
      return null; // Skip on server-side
    }

    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);

      if (!token || !expiresAt) {
        return null;
      }

      // Check if token is expired
      if (Date.now() >= parseInt(expiresAt)) {
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      console.warn('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  /**
   * Get refresh token if available
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Check if current token is valid and not expired
   */
  static isTokenValid(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  static isTokenExpiringSoon(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
      if (!expiresAt) {
        return false;
      }

      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
      return parseInt(expiresAt) <= fiveMinutesFromNow;
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored tokens
   */
  static clearToken(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.EXPIRES_AT_KEY);
    } catch (error) {
      console.warn('Failed to clear tokens from localStorage:', error);
    }
  }

  /**
   * Parse JWT token to extract expiration time
   */
  static parseTokenExpiration(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : Date.now() + (24 * 60 * 60 * 1000); // Default to 24 hours
    } catch (error) {
      console.warn('Failed to parse token expiration:', error);
      return Date.now() + (24 * 60 * 60 * 1000); // Default to 24 hours
    }
  }

  /**
   * Store token with automatic expiration parsing
   */
  static storeTokenWithAutoParsing(token: string, refreshToken?: string): void {
    const expiresAt = this.parseTokenExpiration(token);
    this.storeToken({ token, expiresAt, refreshToken });
  }
}
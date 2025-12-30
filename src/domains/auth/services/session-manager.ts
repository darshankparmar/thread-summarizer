/**
 * Session Manager
 * Handles user session state and persistence
 */

import { ForumsUser, AuthUser, ForumsRole } from '@/shared/types';
import { TokenManager } from './token-manager';

export interface SessionData {
  user: AuthUser;
  token: string;
  isAuthenticated: boolean;
  lastActivity: number;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'forums_user_session';
  private static readonly ACTIVITY_KEY = 'forums_last_activity';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create and store user session
   */
  static createSession(user: ForumsUser, token: string): SessionData {
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.displayName || user.username,
      image: user.image,
      emailVerified: user.emailVerified,
      roles: user.roles ? user.roles.map((role: string | ForumsRole) => 
        typeof role === 'string' ? role : role.name
      ) : [],
      forumsToken: token
    };

    const sessionData: SessionData = {
      user: authUser,
      token,
      isAuthenticated: true,
      lastActivity: Date.now()
    };

    this.storeSession(sessionData);
    TokenManager.storeTokenWithAutoParsing(token);

    return sessionData;
  }

  /**
   * Store session data in localStorage
   */
  private static storeSession(sessionData: SessionData): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to store session data:', error);
    }
  }

  /**
   * Retrieve current session
   */
  static getSession(): SessionData | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const sessionJson = localStorage.getItem(this.SESSION_KEY);
      const lastActivity = localStorage.getItem(this.ACTIVITY_KEY);

      if (!sessionJson || !lastActivity) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);
      const activityTime = parseInt(lastActivity);

      // Check if session is expired
      if (Date.now() - activityTime > this.SESSION_TIMEOUT) {
        this.clearSession();
        return null;
      }

      // Verify token is still valid
      if (!TokenManager.isTokenValid()) {
        this.clearSession();
        return null;
      }

      // Update last activity
      this.updateActivity();

      return sessionData;
    } catch (error) {
      console.warn('Failed to retrieve session data:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update user information in current session
   */
  static updateUser(updatedUser: Partial<AuthUser>): SessionData | null {
    const currentSession = this.getSession();
    if (!currentSession) {
      return null;
    }

    const updatedSession: SessionData = {
      ...currentSession,
      user: {
        ...currentSession.user,
        ...updatedUser
      },
      lastActivity: Date.now()
    };

    this.storeSession(updatedSession);
    return updatedSession;
  }

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to update activity timestamp:', error);
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session?.isAuthenticated === true && TokenManager.isTokenValid();
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): AuthUser | null {
    const session = this.getSession();
    return session?.user || null;
  }

  /**
   * Get current JWT token
   */
  static getCurrentToken(): string | null {
    const session = this.getSession();
    return session?.token || TokenManager.getToken();
  }

  /**
   * Clear current session
   */
  static clearSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.ACTIVITY_KEY);
      TokenManager.clearToken();
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }

  /**
   * Check if session is expiring soon
   */
  static isSessionExpiringSoon(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const lastActivity = localStorage.getItem(this.ACTIVITY_KEY);
      if (!lastActivity) {
        return false;
      }

      const activityTime = parseInt(lastActivity);
      const timeUntilExpiry = this.SESSION_TIMEOUT - (Date.now() - activityTime);
      const thirtyMinutes = 30 * 60 * 1000;

      return timeUntilExpiry <= thirtyMinutes;
    } catch {
      return false;
    }
  }

  /**
   * Extend session by updating activity
   */
  static extendSession(): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    this.updateActivity();
    return true;
  }
}
/**
 * Server-side Authentication Utilities
 * Provides helper functions for authentication in API routes and server components
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/shared/lib/config/auth-config';
import { AuthUser } from '@/shared/types';

/**
 * Get the current user session on the server side
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user from server session
 */
export async function getServerAuthUser(): Promise<AuthUser | null> {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    emailVerified: session.user.emailVerified,
    roles: session.user.roles ? session.user.roles.map(role => 
      typeof role === 'string' ? role : (role as { name?: string }).name || String(role)
    ) : []
  };
}

/**
 * Check if the current server session is authenticated
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const session = await getServerAuthSession();
  return !!session?.user;
}

/**
 * Get the Forums token from the server session (server-side only)
 * This is used for API calls to the Forums backend
 */
export async function getValidatedForumsTokenFromSession(): Promise<string | null> {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    return null;
  }

  // The forumsToken is stored in the JWT token (server-side only)
  // and is not exposed to the client for security reasons
  return (session as { forumsToken?: string }).forumsToken || null;
}

/**
 * Extract and validate the user's forums token from the JWT
 * Returns the token if valid, or throws an error response if invalid
 */
export async function getValidatedForumsTokenFromRequest(request: NextRequest): Promise<string> {
  // First check if user has a valid session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Extract the forums token from JWT
  const jwt = await import('next-auth/jwt');
  const token = await jwt.getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const forumsToken = token?.forumsToken as string;
  if (!forumsToken) {
    throw NextResponse.json(
      { success: false, error: 'User authentication token not found. Please log in again.' },
      { status: 401 }
    );
  }

  return forumsToken;
}

/**
 * Require authentication for API routes
 * Throws an error if user is not authenticated
 */
export async function requireServerAuth(): Promise<AuthUser> {
  const user = await getServerAuthUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require specific roles for API routes
 * Throws an error if user doesn't have required roles
 */
export async function requireServerRoles(requiredRoles: string[]): Promise<AuthUser> {
  const user = await requireServerAuth();
  
  const hasRequiredRole = requiredRoles.some(role => 
    user.roles?.includes(role)
  );
  
  if (!hasRequiredRole) {
    throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
  }
  
  return user;
}

/**
 * Check if user has specific role
 */
export async function hasServerRole(role: string): Promise<boolean> {
  const user = await getServerAuthUser();
  return user?.roles?.includes(role) || false;
}

/**
 * Check if user is admin
 */
export async function isServerAdmin(): Promise<boolean> {
  return await hasServerRole('admin');
}

/**
 * Check if user is moderator or admin
 */
export async function isServerModerator(): Promise<boolean> {
  const user = await getServerAuthUser();
  return user?.roles?.some(role => ['admin', 'moderator'].includes(role)) || false;
}

/**
 * Get user display information for server-side rendering
 */
export async function getServerUserDisplayInfo() {
  const user = await getServerAuthUser();
  
  if (!user) {
    return null;
  }
  
  return {
    displayName: user.name || user.username,
    username: user.username,
    avatar: user.image,
    isEmailVerified: user.emailVerified || false,
    roles: user.roles || []
  };
}
/**
 * Authentication utilities for server-side API routes
 * Provides reusable functions for token validation and extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * Extract and validate the user's forums token from the JWT
 * Returns the token if valid, or throws an error response if invalid
 */
export async function getValidatedForumsToken(request: NextRequest): Promise<string> {
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
 * Check if user is authenticated (has valid session)
 * Returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    return !!session?.user;
  } catch {
    return false;
  }
}

/**
 * Get the current user's session
 * Returns the session if valid, null otherwise
 */
export async function getCurrentSession() {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}
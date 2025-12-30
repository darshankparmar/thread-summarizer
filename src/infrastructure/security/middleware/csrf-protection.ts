/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

/**
 * Generate a secure CSRF token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRF protection middleware for state-changing operations
 */
export async function csrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method;
  
  // Only protect state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null;
  }

  // Skip CSRF for API routes that use other authentication methods
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/auth/')) {
    return null; // NextAuth handles its own CSRF protection
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get(CSRF_HEADER);
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;

  // Check if user is authenticated
  const token = await getToken({ req: request });
  
  if (token) {
    // For authenticated users, require CSRF token
    if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CSRF token missing or invalid. Please refresh the page and try again.',
          code: 'CSRF_TOKEN_INVALID'
        },
        { status: 403 }
      );
    }
  }

  return null; // Continue to next middleware
}

/**
 * Set CSRF token in response for authenticated users
 */
export function setCSRFToken(response: NextResponse, request: NextRequest): NextResponse {
  // Only set CSRF token for authenticated users
  getToken({ req: request }).then(token => {
    if (token) {
      const csrfToken = generateCSRFToken();
      response.cookies.set(CSRF_COOKIE, csrfToken, {
        httpOnly: false, // Needs to be accessible to client for header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });
    }
  });

  return response;
}
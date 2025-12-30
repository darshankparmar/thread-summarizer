/**
 * Unified Authentication Verification Service
 * Consolidates all authentication verification patterns with token validation
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth-config';
import { Session } from 'next-auth';

export interface AuthVerificationResult {
  isAuthenticated: boolean;
  session?: Session | null;
  forumsToken?: string;
  userId?: string;
  error?: string;
  tokenExpired?: boolean;
}

export interface TokenValidationOptions {
  validateWithAPI?: boolean; // Whether to validate token with forums API
  allowExpiredSession?: boolean; // Whether to allow expired NextAuth sessions
}

/**
 * Validate forums token with the actual API
 * This is the expensive but reliable way to check token validity
 */
async function validateForumsToken(forumsToken: string): Promise<boolean> {
  try {
    // Import here to avoid circular dependencies
    const { forumsApiClient } = await import('@/services/api');
    await forumsApiClient.auth.getCurrentUser(forumsToken);
    return true;
  } catch (error) {
    console.warn('Forums token validation failed:', error);
    return false;
  }
}

/**
 * Comprehensive authentication verification for API routes
 * Handles token expiration and validation
 */
export async function verifyAuthentication(
  request: NextRequest, 
  options: TokenValidationOptions = {}
): Promise<AuthVerificationResult> {
  const { validateWithAPI = false, allowExpiredSession = false } = options;

  try {
    // Step 1: Check NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user && !allowExpiredSession) {
      return {
        isAuthenticated: false,
        error: 'No valid session found'
      };
    }

    // Step 2: Extract forums token from JWT
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    const forumsToken = token?.forumsToken as string;
    if (!forumsToken) {
      return {
        isAuthenticated: false,
        session,
        error: 'Forums token not found. Please log in again.',
        tokenExpired: true
      };
    }

    // Step 3: Validate token with forums API if requested or if we suspect expiration
    if (validateWithAPI) {
      const isTokenValid = await validateForumsToken(forumsToken);
      if (!isTokenValid) {
        return {
          isAuthenticated: false,
          session,
          forumsToken,
          error: 'Forums token has expired. Please log in again.',
          tokenExpired: true
        };
      }
    }
    
    return {
      isAuthenticated: true,
      session,
      forumsToken,
      userId: session?.user?.id || token?.id as string,
    };

  } catch (error) {
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Authentication verification failed'
    };
  }
}

/**
 * Smart authentication verification with automatic token validation on failure
 * This is the recommended approach for production API routes
 */
export async function verifyAuthenticationSmart(request: NextRequest): Promise<AuthVerificationResult> {
  // First, try fast verification (trust JWT)
  const fastResult = await verifyAuthentication(request, { validateWithAPI: false });
  
  if (fastResult.isAuthenticated) {
    return fastResult;
  }

  // If fast verification failed due to potential token expiration, validate with API
  if (fastResult.tokenExpired || fastResult.forumsToken) {
    console.log('Fast auth failed, validating token with forums API...');
    return await verifyAuthentication(request, { validateWithAPI: true });
  }

  return fastResult;
}

/**
 * Handle API call with automatic token validation and retry
 * Use this wrapper for external API calls that might fail due to token expiration
 */
export async function executeWithTokenValidation<T>(
  request: NextRequest,
  apiCall: (forumsToken: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; shouldReauth?: boolean }> {
  try {
    // First attempt with fast verification
    const authResult = await verifyAuthentication(request, { validateWithAPI: false });
    
    if (!authResult.isAuthenticated || !authResult.forumsToken) {
      return {
        success: false,
        error: authResult.error || 'Authentication required',
        shouldReauth: true
      };
    }

    try {
      // Try the API call
      const data = await apiCall(authResult.forumsToken);
      return { success: true, data };
    } catch (error: unknown) {
      // If we get 401, the token might be expired - validate and retry
      const errorObj = error as { statusCode?: number; message?: string };
      if (errorObj?.statusCode === 401 || errorObj?.message?.includes('401')) {
        console.log('Got 401 error, validating token with forums API...');
        
        const validatedAuthResult = await verifyAuthentication(request, { validateWithAPI: true });
        
        if (!validatedAuthResult.isAuthenticated || !validatedAuthResult.forumsToken) {
          return {
            success: false,
            error: 'Token has expired. Please log in again.',
            shouldReauth: true
          };
        }

        // Retry with validated token
        try {
          const data = await apiCall(validatedAuthResult.forumsToken);
          return { success: true, data };
        } catch (retryError) {
          return {
            success: false,
            error: retryError instanceof Error ? retryError.message : 'API call failed after token validation',
            shouldReauth: true
          };
        }
      }

      // Non-401 error, just return it
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication verification failed'
    };
  }
}

/**
 * Quick session check (no token validation)
 * Use for non-critical operations
 */
export async function quickSessionCheck(): Promise<{ isAuthenticated: boolean; session?: Session | null }> {
  try {
    const session = await getServerSession(authOptions);
    return {
      isAuthenticated: !!session?.user,
      session
    };
  } catch {
    return { isAuthenticated: false };
  }
}

/**
 * Client-side session validation
 * For use in client components
 */
export function validateClientSession(session: Session | null): {
  isValid: boolean;
  hasRequiredFields: boolean;
  user?: Session['user'];
} {
  if (!session?.user) {
    return { isValid: false, hasRequiredFields: false };
  }

  const user = session.user;
  const hasRequiredFields = !!(user.id && user.username);

  return {
    isValid: true,
    hasRequiredFields,
    user
  };
}

/**
 * Extract user info safely from session
 */
export function extractUserInfo(session: Session | null) {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    roles: session.user.roles || [],
    emailVerified: session.user.emailVerified
  };
}
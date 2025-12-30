/**
 * Middleware Index
 * Centralized exports for all middleware functions
 */

// CORS middleware
export { addCORSHeaders, handleCORSPreflight, withCORS } from './cors';

// CSRF protection
export { csrfProtection, setCSRFToken } from './csrf-protection';

// Request logging
export { 
  requestLogger, 
  logRequest, 
  logResponse, 
  withRequestLogging, 
  getRequestLogs 
} from './request-logger';

// Combined middleware wrapper
import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from './cors';
import { csrfProtection } from './csrf-protection';
import { withRequestLogging } from './request-logger';

/**
 * Combined middleware that applies all security and logging middleware
 */
export function withAllMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withCORS(async (request: NextRequest) => {
    return withRequestLogging(request, async (req: NextRequest) => {
      // Apply CSRF protection
      const csrfResponse = await csrfProtection(req);
      if (csrfResponse) {
        return csrfResponse;
      }

      // Continue to the actual handler
      return handler(req);
    });
  });
}
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Proxy configuration to handle authentication for protected routes
 * This replaces the deprecated middleware.ts file in Next.js 16+
 */
export default withAuth(
  function proxy() {
    // Allow the request to proceed if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized() {
        // For now, we'll handle authentication in individual API routes
        // This proxy can be extended later for other protected routes
        return true;
      },
    },
  }
);

/**
 * Configure which routes should be handled by the proxy
 */
export const config = {
  matcher: [
    // Currently no routes are protected at proxy level
    // Authentication is handled in individual API routes
    // Add routes here if you want proxy-level protection
  ]
};
/**
 * CORS (Cross-Origin Resource Sharing) Middleware
 * Configures proper CORS headers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

interface CORSOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CORSOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-csrf-token'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string | string[] | boolean): boolean {
  if (allowedOrigins === true) return true;
  if (allowedOrigins === false) return false;
  if (!origin) return false;

  if (typeof allowedOrigins === 'string') {
    return origin === allowedOrigins;
  }

  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }

  return false;
}

/**
 * Add CORS headers to response
 */
export function addCORSHeaders(
  request: NextRequest,
  response: NextResponse,
  options: CORSOptions = {}
): NextResponse {
  const opts = { ...defaultOptions, ...options };
  const origin = request.headers.get('origin');

  // Set Access-Control-Allow-Origin
  if (opts.origin === true) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && isOriginAllowed(origin, opts.origin || false)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }

  // Set other CORS headers
  if (opts.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (opts.methods) {
    response.headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
  }

  if (opts.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
  }

  if (opts.maxAge) {
    response.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
  }

  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCORSPreflight(
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const response = new NextResponse(null, { status: 204 });
  return addCORSHeaders(request, response, options);
}

/**
 * CORS middleware wrapper
 */
export function withCORS(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CORSOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    const preflightResponse = handleCORSPreflight(request, options);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Process the actual request
    const response = await handler(request);
    
    // Add CORS headers to the response
    return addCORSHeaders(request, response, options);
  };
}
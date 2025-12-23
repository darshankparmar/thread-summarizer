import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Rate limiting store for tracking requests
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const existing = this.store.get(key);
    
    if (!existing || now > existing.resetTime) {
      // New window or expired window
      const entry = { count: 1, resetTime };
      this.store.set(key, entry);
      return entry;
    }
    
    // Increment existing window
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

/**
 * Input validation utilities
 */
export class InputValidator {
  /**
   * Validate and sanitize thread ID
   * Requirements: 8.1, 8.2
   */
  static validateThreadId(threadId: unknown): { isValid: boolean; sanitized?: string; error?: string } {
    // Check if threadId exists
    if (threadId === undefined || threadId === null) {
      return { isValid: false, error: 'Thread ID is required' };
    }

    // Check if threadId is a string
    if (typeof threadId !== 'string') {
      return { isValid: false, error: 'Thread ID must be a string' };
    }

    // Sanitize by trimming whitespace
    const sanitized = threadId.trim();

    // Check if empty after sanitization
    if (sanitized === '') {
      return { isValid: false, error: 'Thread ID cannot be empty' };
    }

    // Check length constraints (reasonable limits)
    if (sanitized.length > 100) {
      return { isValid: false, error: 'Thread ID is too long (maximum 100 characters)' };
    }

    // Check for potentially malicious patterns
    if (this.containsMaliciousPatterns(sanitized)) {
      return { isValid: false, error: 'Thread ID contains invalid characters' };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Check for potentially malicious patterns in input
   * Requirements: 8.1, 8.2
   */
  private static containsMaliciousPatterns(input: string): boolean {
    // Check for common injection patterns
    const maliciousPatterns = [
      /<script/i,           // Script tags
      /javascript:/i,       // JavaScript protocol
      /on\w+\s*=/i,        // Event handlers
      /\.\.\//,            // Path traversal
      /[<>'"]/,            // HTML/XML characters
      /\x00/,              // Null bytes
      /[\r\n]/,            // Line breaks
      /[{}]/,              // Curly braces (potential template injection)
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate request body structure
   * Requirements: 8.1, 8.2
   */
  static validateRequestBody(body: unknown): { isValid: boolean; error?: string } {
    // Check if body exists
    if (!body || typeof body !== 'object') {
      return { isValid: false, error: 'Request body must be a valid JSON object' };
    }

    // Check if body has expected structure
    const bodyObj = body as Record<string, unknown>;
    
    // Ensure only expected fields are present
    const allowedFields = ['threadId'];
    const bodyFields = Object.keys(bodyObj);
    
    const unexpectedFields = bodyFields.filter(field => !allowedFields.includes(field));
    if (unexpectedFields.length > 0) {
      return { isValid: false, error: `Unexpected fields in request: ${unexpectedFields.join(', ')}` };
    }

    // Ensure required fields are present
    if (!bodyObj.threadId) {
      return { isValid: false, error: 'threadId field is required' };
    }

    // Ensure threadId is a string
    if (typeof bodyObj.threadId !== 'string') {
      return { isValid: false, error: 'threadId must be a string' };
    }

    return { isValid: true };
  }
}

/**
 * Rate limiting middleware
 * Requirements: 8.2
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 10 }) {
    this.config = config;
  }

  /**
   * Check if request should be rate limited
   * Requirements: 8.2
   */
  checkRateLimit(request: NextRequest): { allowed: boolean; resetTime?: number; remaining?: number } {
    // Get client identifier (IP address with fallbacks)
    const clientId = this.getClientId(request);
    
    // Increment request count
    const { count, resetTime } = rateLimitStore.increment(clientId, this.config.windowMs);
    
    if (count > this.config.maxRequests) {
      return { 
        allowed: false, 
        resetTime,
        remaining: 0
      };
    }

    return { 
      allowed: true, 
      resetTime,
      remaining: this.config.maxRequests - count
    };
  }

  /**
   * Get client identifier for rate limiting
   * Uses multiple fallbacks to ensure we can identify clients
   */
  private getClientId(request: NextRequest): string {
    // Try to get real IP from various headers (for production deployments)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    // Use the first available IP
    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, use the first one
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    // Fallback to a default identifier for development
    return 'unknown-client';
  }
}

/**
 * Security headers middleware
 * Requirements: 8.1, 8.2
 */
export class SecurityHeaders {
  /**
   * Add security headers to response
   * Requirements: 8.1, 8.2
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent API keys from being exposed to client
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Ensure HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Content Security Policy to prevent script injection
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'none'; object-src 'none';"
    );

    return response;
  }
}

/**
 * Combined middleware for API routes
 * Requirements: 8.1, 8.2
 */
export class APIMiddleware {
  private rateLimiter: RateLimiter;

  constructor(rateLimitConfig?: RateLimitConfig) {
    this.rateLimiter = new RateLimiter(rateLimitConfig);
  }

  /**
   * Apply all security and validation middleware
   * Requirements: 8.1, 8.2
   */
  async apply(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // 1. Rate limiting check
      const rateLimitResult = this.rateLimiter.checkRateLimit(request);
      
      if (!rateLimitResult.allowed) {
        const response = NextResponse.json({
          success: false,
          error: 'Too many requests. Please try again later.',
          cached: false,
          generatedAt: new Date().toISOString()
        }, { status: 429 });

        // Add rate limit headers
        if (rateLimitResult.resetTime) {
          response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
        }
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('Retry-After', '60');

        return SecurityHeaders.addSecurityHeaders(response);
      }

      // 2. Method validation (only for POST requests to summarize)
      if (request.method !== 'POST') {
        const response = NextResponse.json({
          success: false,
          error: 'Method not allowed. Use POST to generate summaries.',
          cached: false,
          generatedAt: new Date().toISOString()
        }, { status: 405 });

        response.headers.set('Allow', 'POST');
        return SecurityHeaders.addSecurityHeaders(response);
      }

      // 3. Content-Type validation
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const response = NextResponse.json({
          success: false,
          error: 'Content-Type must be application/json',
          cached: false,
          generatedAt: new Date().toISOString()
        }, { status: 400 });

        return SecurityHeaders.addSecurityHeaders(response);
      }

      // 4. Body size validation (prevent large payloads)
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 1024) { // 1KB limit
        const response = NextResponse.json({
          success: false,
          error: 'Request body too large',
          cached: false,
          generatedAt: new Date().toISOString()
        }, { status: 413 });

        return SecurityHeaders.addSecurityHeaders(response);
      }

      // 5. Execute the handler
      const response = await handler(request);

      // 6. Add rate limit headers to successful responses
      if (rateLimitResult.remaining !== undefined) {
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      }
      if (rateLimitResult.resetTime) {
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      }

      // 7. Add security headers
      return SecurityHeaders.addSecurityHeaders(response);

    } catch (error) {
      console.error('Middleware error:', error);
      
      const response = NextResponse.json({
        success: false,
        error: 'Internal server error',
        cached: false,
        generatedAt: new Date().toISOString()
      }, { status: 500 });

      return SecurityHeaders.addSecurityHeaders(response);
    }
  }
}

/**
 * Default middleware instance for API routes
 */
export const apiMiddleware = new APIMiddleware({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10       // 10 requests per minute per IP
});
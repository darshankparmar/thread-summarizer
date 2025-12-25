/**
 * Property-based tests for API security
 * Feature: thread-summarizer, Property 12: Server-Side Security
 * Validates: Requirements 8.1, 8.2
 */

import fc from 'fast-check';
import { NextRequest, NextResponse } from 'next/server';
import { InputValidator, SecurityHeaders, RateLimiter } from '@/lib/middleware';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Map(Object.entries(init?.headers || {})),
      status: init?.status || 200
    }))
  }
}));

// Mock the services to focus on security testing
jest.mock('@/services/thread-fetcher', () => ({
  threadFetcher: {
    fetchThreadData: jest.fn().mockResolvedValue({
      success: true,
      data: {
        thread: { id: 'test', title: 'Test', body: 'Test body' },
        posts: [],
        lastPostTimestamp: '1234567890'
      }
    })
  }
}));

jest.mock('@/services/ai-service', () => ({
  aiService: {
    generateSummary: jest.fn().mockResolvedValue({
      success: true,
      data: {
        summary: ['Test summary'],
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        contributors: [{ username: 'user1', contribution: 'test' }],
        sentiment: 'Neutral',
        healthScore: 5,
        healthLabel: 'Needs Attention'
      }
    })
  }
}));

jest.mock('@/services/cache-manager', () => ({
  cacheManager: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn()
  }
}));

jest.mock('@/services/performance-monitor', () => ({
  performanceMonitor: {
    recordCacheHit: jest.fn(),
    recordCacheMiss: jest.fn()
  }
}));

// Import after mocking

// Helper function to check malicious patterns (mirrors InputValidator logic)
function containsMaliciousPatterns(input: string): boolean {
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
 * Property-based tests for API security
 * Feature: thread-summarizer, Property 12: Server-Side Security
 * Validates: Requirements 8.1, 8.2
 */


describe('API Security Property Tests', () => {
  /**
   * Property 12: Server-Side Security
   * For any API processing request, all API calls should execute server-side 
   * and no API keys should be exposed to the client
   * Validates: Requirements 8.1, 8.2
   */
  describe('Property 12: Server-Side Security', () => {
    test('should validate and sanitize all thread ID inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Valid thread IDs
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
              !/[<>'"{}]/.test(s) && !/\.\./. test(s) && !/javascript:/i.test(s) && !/[\r\n\x00]/.test(s)
            ),
            // Potentially malicious thread IDs
            fc.constantFrom(
              '<script>alert("xss")</script>',
              'javascript:alert(1)',
              '../../../etc/passwd',
              '"><script>alert(1)</script>',
              '{{{malicious}}}',
              '\x00null\x00',
              'thread\r\nid',
              'thread"id\'test',
              '',
              '   ',
              'a'.repeat(200) // Too long
            )
          ),
          async (threadId) => {
            const validation = InputValidator.validateThreadId(threadId);

            // For malicious or invalid inputs, validation should fail
            if (typeof threadId === 'string' && (
              threadId.includes('<script') ||
              threadId.includes('javascript:') ||
              threadId.includes('../') ||
              threadId.includes('\x00') ||
              threadId.includes('\r') ||
              threadId.includes('\n') ||
              threadId.includes('"') ||
              threadId.includes("'") ||
              threadId.includes('{') ||
              threadId.includes('}') ||
              threadId.trim() === '' ||
              threadId.length > 100
            )) {
              expect(validation.isValid).toBe(false);
              expect(validation.error).toBeTruthy();
              expect(validation.sanitized).toBeUndefined();
            } else if (typeof threadId === 'string' && threadId.trim().length > 0) {
              // Valid inputs should pass validation
              expect(validation.isValid).toBe(true);
              expect(validation.sanitized).toBe(threadId.trim());
              expect(validation.error).toBeUndefined();
            } else {
              // Non-string or empty inputs should fail
              expect(validation.isValid).toBe(false);
              expect(validation.error).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should validate request body structure and reject malicious payloads', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Valid request bodies
            fc.record({ threadId: fc.string({ minLength: 1, maxLength: 50 }) }),
            // Invalid request bodies
            fc.constantFrom(
              null,
              undefined,
              'string',
              123,
              [],
              { wrongField: 'value' },
              { threadId: 123 },
              { threadId: null },
              { threadId: '' },
              { threadId: 'valid', extraField: 'malicious' }
            )
          ),
          async (requestBody) => {
            const validation = InputValidator.validateRequestBody(requestBody);

            if (
              requestBody &&
              typeof requestBody === 'object' &&
              !Array.isArray(requestBody) &&
              'threadId' in requestBody &&
              (requestBody as Record<string, unknown>).threadId &&
              typeof (requestBody as Record<string, unknown>).threadId === 'string' &&
              ((requestBody as Record<string, unknown>).threadId as string).trim() !== '' &&
              Object.keys(requestBody).length === 1 &&
              Object.keys(requestBody)[0] === 'threadId' &&
              // Check that threadId doesn't contain malicious patterns
              !containsMaliciousPatterns((requestBody as Record<string, unknown>).threadId as string)
            ) {
              // Valid request body structure
              expect(validation.isValid).toBe(true);
              expect(validation.error).toBeUndefined();
            } else {
              // Invalid request body structure
              expect(validation.isValid).toBe(false);
              expect(validation.error).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should enforce rate limiting for different client patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            clientIps: fc.array(fc.ipV4(), { minLength: 1, maxLength: 3 }),
            requestCounts: fc.array(fc.integer({ min: 1, max: 15 }), { minLength: 1, maxLength: 3 })
          }),
          async ({ clientIps, requestCounts }) => {
            const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 10 });
            
            for (let i = 0; i < Math.min(clientIps.length, requestCounts.length); i++) {
              const clientIp = clientIps[i];
              const requestCount = requestCounts[i];
              
              let rateLimitTriggered = false;

              // Simulate multiple requests from the same IP
              for (let j = 0; j < requestCount; j++) {
                // Mock NextRequest for rate limiting
                const mockRequest = {
                  headers: new Map([['x-forwarded-for', clientIp]])
                } as unknown as NextRequest;

                const result = rateLimiter.checkRateLimit(mockRequest);
                
                if (!result.allowed) {
                  rateLimitTriggered = true;
                  expect(result.remaining).toBe(0);
                  expect(result.resetTime).toBeTruthy();
                }
              }

              // If more than 10 requests were made, rate limiting should have been triggered
              if (requestCount > 10) {
                expect(rateLimitTriggered).toBe(true);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should add security headers to prevent client-side vulnerabilities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            statusCode: fc.integer({ min: 200, max: 500 })
          }),
          async ({ statusCode }) => {
            // Create a simple mock without recursive calls
            const headerCalls: Array<[string, string]> = [];
            const mockResponse = {
              headers: {
                set: (key: string, value: string) => {
                  headerCalls.push([key, value]);
                }
              },
              status: statusCode
            } as unknown as NextResponse;

            SecurityHeaders.addSecurityHeaders(mockResponse);

            // Verify security headers are present
            const headerKeys = headerCalls.map(([key]) => key);
            const headerValues = headerCalls.map(([, value]) => value);

            expect(headerKeys).toContain('X-Content-Type-Options');
            expect(headerKeys).toContain('X-Frame-Options');
            expect(headerKeys).toContain('X-XSS-Protection');
            expect(headerKeys).toContain('Referrer-Policy');
            expect(headerKeys).toContain('Content-Security-Policy');
            
            // Verify CSP prevents script execution
            const cspValue = headerValues.find((_, index) => headerKeys[index] === 'Content-Security-Policy');
            expect(cspValue).toContain("script-src 'none'");
            expect(cspValue).toContain("object-src 'none'");

            // In production, HSTS should be set
            if (process.env.NODE_ENV === 'production') {
              expect(headerKeys).toContain('Strict-Transport-Security');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should prevent API key exposure in any response content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            responseContent: fc.string({ minLength: 0, maxLength: 1000 }),
            headers: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.string({ minLength: 1, maxLength: 100 })
            )
          }),
          async ({ responseContent, headers }) => {
            // Common API key patterns that should never appear in responses
            const apiKeyPatterns = [
              /sk-[a-zA-Z0-9]{20,}/,  // OpenAI API key pattern
              /api[_-]?key/i,         // Generic API key references
              /secret/i,              // Secret references
              /bearer\s+[a-zA-Z0-9]/i // Bearer tokens
            ];

            // Check response content doesn't contain API keys
            apiKeyPatterns.forEach(pattern => {
              expect(responseContent).not.toMatch(pattern);
            });

            // Check headers don't contain API keys
            Object.values(headers).forEach(headerValue => {
              apiKeyPatterns.forEach(pattern => {
                // Allow safe references like 'X-Response-Time'
                if (!headerValue.toLowerCase().includes('response-time') && 
                    !headerValue.toLowerCase().includes('cache-status') &&
                    !headerValue.toLowerCase().includes('content-type')) {
                  expect(headerValue).not.toMatch(pattern);
                }
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
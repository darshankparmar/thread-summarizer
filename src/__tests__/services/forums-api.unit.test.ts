import { ForumsApiClient, ForumsApiError } from '@/services/forums-api';
import { createMockThread } from '../utils/mock-data';

// Unit tests for API error handling

describe('Forums API Error Handling Unit Tests', () => {
  let apiClient: ForumsApiClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;
    
    // Create API client with test configuration
    apiClient = new ForumsApiClient({
      baseUrl: 'https://test-api.foru.ms',
      apiKey: 'test-api-key'
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('Authentication Failures', () => {
    test('should throw ForumsApiError with 401 status for invalid API key', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ error: 'Invalid API key' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Authentication failed - invalid API key', 401)
      );
    });

    test('should throw ForumsApiError with 401 status for fetchThreadPosts with invalid API key', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ error: 'Invalid API key' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThreadPosts('thread-123')).rejects.toThrow(
        new ForumsApiError('Authentication failed - invalid API key', 401)
      );
    });

    test('should provide user-friendly error message for authentication failures', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      ) as jest.Mock;

      try {
        await apiClient.fetchThread('thread-123');
        fail('Expected ForumsApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForumsApiError);
        expect((error as ForumsApiError).message).toBe('Authentication failed - invalid API key');
        expect((error as ForumsApiError).statusCode).toBe(401);
      }
    });
  });

  describe('Network Timeouts', () => {
    test('should throw ForumsApiError for network timeout on fetchThread', async () => {
      // Mock timeout error
      global.fetch = jest.fn(() =>
        Promise.reject(new DOMException('The operation was aborted.', 'TimeoutError'))
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Request timeout - Foru.ms API did not respond in time')
      );
    });

    test('should throw ForumsApiError for network timeout on fetchThreadPosts', async () => {
      // Mock timeout error
      global.fetch = jest.fn(() =>
        Promise.reject(new DOMException('The operation was aborted.', 'TimeoutError'))
      ) as jest.Mock;

      await expect(apiClient.fetchThreadPosts('thread-123')).rejects.toThrow(
        new ForumsApiError('Request timeout - Foru.ms API did not respond in time')
      );
    });

    test('should provide user-friendly error message for timeout scenarios', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new DOMException('The operation was aborted.', 'TimeoutError'))
      ) as jest.Mock;

      try {
        await apiClient.fetchThread('thread-123');
        fail('Expected ForumsApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForumsApiError);
        expect((error as ForumsApiError).message).toBe('Request timeout - Foru.ms API did not respond in time');
        expect((error as ForumsApiError).originalError).toBeInstanceOf(DOMException);
      }
    });
  });

  describe('Invalid Thread IDs', () => {
    test('should throw ForumsApiError with 404 status for non-existent thread', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({ error: 'Thread not found' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThread('invalid-thread-id')).rejects.toThrow(
        new ForumsApiError('Thread with ID invalid-thread-id not found', 404)
      );
    });

    test('should throw ForumsApiError with 404 status for posts of non-existent thread', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({ error: 'Thread not found' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThreadPosts('invalid-thread-id')).rejects.toThrow(
        new ForumsApiError('Posts for thread invalid-thread-id not found', 404)
      );
    });

    test('should throw ForumsApiError for empty thread ID', async () => {
      await expect(apiClient.fetchThread('')).rejects.toThrow(
        new ForumsApiError('Thread ID is required')
      );
    });

    test('should throw ForumsApiError for whitespace-only thread ID', async () => {
      await expect(apiClient.fetchThread('   ')).rejects.toThrow(
        new ForumsApiError('Thread ID is required')
      );
    });

    test('should throw ForumsApiError for empty thread ID in fetchThreadPosts', async () => {
      await expect(apiClient.fetchThreadPosts('')).rejects.toThrow(
        new ForumsApiError('Thread ID is required')
      );
    });
  });

  describe('Rate Limiting', () => {
    test('should throw ForumsApiError with 429 status for rate limit exceeded', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Rate limit exceeded - please try again later', 429)
      );
    });

    test('should provide user-friendly error message for rate limiting', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
      ) as jest.Mock;

      try {
        await apiClient.fetchThreadPosts('thread-123');
        fail('Expected ForumsApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForumsApiError);
        expect((error as ForumsApiError).message).toBe('Rate limit exceeded - please try again later');
        expect((error as ForumsApiError).statusCode).toBe(429);
      }
    });
  });

  describe('Network Failures', () => {
    test('should throw ForumsApiError for network connection failure', async () => {
      // Mock network error
      global.fetch = jest.fn(() =>
        Promise.reject(new TypeError('Failed to fetch'))
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Network error - unable to connect to Foru.ms API')
      );
    });

    test('should throw ForumsApiError for DNS resolution failure', async () => {
      // Mock network error with specific message
      global.fetch = jest.fn(() =>
        Promise.reject(new TypeError('fetch failed'))
      ) as jest.Mock;

      await expect(apiClient.fetchThreadPosts('thread-123')).rejects.toThrow(
        new ForumsApiError('Network error - unable to connect to Foru.ms API')
      );
    });

    test('should preserve original error for debugging', async () => {
      const originalError = new TypeError('Network connection failed');
      global.fetch = jest.fn(() =>
        Promise.reject(originalError)
      ) as jest.Mock;

      try {
        await apiClient.fetchThread('thread-123');
        fail('Expected ForumsApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForumsApiError);
        expect((error as ForumsApiError).originalError).toBe(originalError);
      }
    });
  });

  describe('Invalid API Responses', () => {
    test('should throw ForumsApiError for invalid thread data structure', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'thread-123',
            // Missing required fields: title, body, createdAt, updatedAt, user
          }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Invalid thread data received from API')
      );
    });

    test('should throw ForumsApiError for invalid post data structure', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            {
              id: 'post-123',
              // Missing required fields: body, threadId, userId, createdAt, user
            }
          ]),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThreadPosts('thread-123')).rejects.toThrow(
        new ForumsApiError('Invalid post data received from API')
      );
    });

    test('should throw ForumsApiError for malformed JSON response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError('Unexpected token')),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Unexpected error occurred')
      );
    });
  });

  describe('Server Errors', () => {
    test('should throw ForumsApiError for 500 internal server error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ error: 'Server error' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThread('thread-123')).rejects.toThrow(
        new ForumsApiError('API request failed with status 500', 500)
      );
    });

    test('should throw ForumsApiError for 503 service unavailable', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: () => Promise.resolve({ error: 'Service temporarily unavailable' }),
        })
      ) as jest.Mock;

      await expect(apiClient.fetchThreadPosts('thread-123')).rejects.toThrow(
        new ForumsApiError('API request failed with status 503', 503)
      );
    });
  });

  describe('fetchCompleteThread Error Propagation', () => {
    test('should propagate thread fetch errors in fetchCompleteThread', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });

      await expect(apiClient.fetchCompleteThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Network error - unable to connect to Foru.ms API')
      );
    });

    test('should propagate posts fetch errors in fetchCompleteThread', async () => {
      const mockThread = createMockThread({ id: 'thread-123' });
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockThread),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

      await expect(apiClient.fetchCompleteThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Posts for thread thread-123 not found', 404)
      );
    });

    test('should handle concurrent errors gracefully', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'));

      await expect(apiClient.fetchCompleteThread('thread-123')).rejects.toThrow(
        new ForumsApiError('Network error - unable to connect to Foru.ms API')
      );
    });
  });

  describe('Error Message User-Friendliness', () => {
    test('should provide clear error messages for user-facing scenarios', async () => {
      const testCases = [
        {
          status: 401,
          expectedMessage: 'Authentication failed - invalid API key'
        },
        {
          status: 404,
          expectedMessage: 'Thread with ID test-thread not found'
        },
        {
          status: 429,
          expectedMessage: 'Rate limit exceeded - please try again later'
        },
        {
          status: 500,
          expectedMessage: 'API request failed with status 500'
        }
      ];

      for (const testCase of testCases) {
        global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: false,
            status: testCase.status,
            statusText: 'Error',
          })
        ) as jest.Mock;

        try {
          await apiClient.fetchThread('test-thread');
          fail(`Expected error for status ${testCase.status}`);
        } catch (error) {
          expect(error).toBeInstanceOf(ForumsApiError);
          expect((error as ForumsApiError).message).toBe(testCase.expectedMessage);
        }
      }
    });

    test('should ensure error messages are actionable for users', async () => {
      // Test that error messages provide guidance on what users can do
      const actionableErrors = [
        {
          setup: () => {
            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: false,
                status: 429,
              })
            ) as jest.Mock;
          },
          expectedGuidance: 'please try again later'
        },
        {
          setup: () => {
            global.fetch = jest.fn(() =>
              Promise.reject(new TypeError('fetch failed'))
            ) as jest.Mock;
          },
          expectedGuidance: 'unable to connect'
        },
        {
          setup: () => {
            global.fetch = jest.fn(() =>
              Promise.reject(new DOMException('timeout', 'TimeoutError'))
            ) as jest.Mock;
          },
          expectedGuidance: 'did not respond in time'
        }
      ];

      for (const testCase of actionableErrors) {
        testCase.setup();
        
        try {
          await apiClient.fetchThread('test-thread');
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ForumsApiError);
          expect((error as ForumsApiError).message.toLowerCase()).toContain(
            testCase.expectedGuidance
          );
        }
      }
    });
  });
});
import * as fc from 'fast-check';
import { ForumsApiClient } from '@/services/forums-api';
import { forumsThreadArbitrary, forumsPostArbitrary } from '../utils/property-generators';

// Feature: thread-summarizer, Property 13: API Integration Completeness

describe('Forums API Integration Property Tests', () => {
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

  describe('Property 13: API Integration Completeness', () => {
    test('fetchThread should retrieve complete thread metadata for any valid thread ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Non-empty thread IDs only
          forumsThreadArbitrary,
          async (threadId, mockThread) => {
            // Mock successful API response
            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ ...mockThread, id: threadId }),
              })
            ) as jest.Mock;

            const result = await apiClient.fetchThread(threadId);

            // Verify all required thread metadata fields are present
            expect(result).toHaveProperty('id', threadId);
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('body');
            expect(result).toHaveProperty('createdAt');
            expect(result).toHaveProperty('updatedAt');
            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('id');
            expect(result.user).toHaveProperty('username');

            // Verify API was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
              `https://test-api.foru.ms/api/v1/thread/${threadId}`,
              expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                  'x-api-key': 'test-api-key',
                  
                  'Content-Type': 'application/json',
                  'User-Agent': 'ThreadSummarizer/1.0'
                })
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('fetchThreadPosts should retrieve all associated posts for any valid thread ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Non-empty thread IDs only
          fc.array(forumsPostArbitrary, { minLength: 0, maxLength: 20 }),
          async (threadId, mockPosts) => {
            // Ensure all posts have the correct threadId
            const postsWithCorrectThreadId = mockPosts.map(post => ({
              ...post,
              threadId
            }));

            // Mock successful API response
            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(postsWithCorrectThreadId),
              })
            ) as jest.Mock;

            const result = await apiClient.fetchThreadPosts(threadId);

            // Verify result is an array
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(postsWithCorrectThreadId.length);

            // Verify each post has required fields
            result.forEach((post) => {
              expect(post).toHaveProperty('id');
              expect(post).toHaveProperty('body');
              expect(post).toHaveProperty('threadId', threadId);
              expect(post).toHaveProperty('userId');
              expect(post).toHaveProperty('createdAt');
              // Note: user field is now optional in the updated types
              if (post.user) {
                expect(post.user).toHaveProperty('username');
              }
            });

            // Verify API was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
              `https://test-api.foru.ms/api/v1/thread/${threadId}/posts`,
              expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                  'x-api-key': 'test-api-key',
                  'Content-Type': 'application/json',
                  'User-Agent': 'ThreadSummarizer/1.0'
                })
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('fetchCompleteThread should retrieve both thread metadata and posts with proper authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Non-empty thread IDs only
          forumsThreadArbitrary,
          fc.array(forumsPostArbitrary, { minLength: 0, maxLength: 10 }),
          async (threadId, mockThread, mockPosts) => {
            // Ensure thread has correct ID and posts have correct threadId
            const threadWithCorrectId = { ...mockThread, id: threadId };
            const postsWithCorrectThreadId = mockPosts.map(post => ({
              ...post,
              threadId
            }));

            // Mock successful API responses for both calls
            global.fetch = jest.fn()
              .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(threadWithCorrectId),
              })
              .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(postsWithCorrectThreadId),
              });

            const result = await apiClient.fetchCompleteThread(threadId);

            // Verify complete thread data structure
            expect(result).toHaveProperty('thread');
            expect(result).toHaveProperty('posts');
            expect(Array.isArray(result.posts)).toBe(true);

            // Verify thread metadata completeness
            expect(result.thread.id).toBe(threadId);
            expect(result.thread).toHaveProperty('title');
            expect(result.thread).toHaveProperty('body');
            expect(result.thread).toHaveProperty('createdAt');
            expect(result.thread).toHaveProperty('updatedAt');
            expect(result.thread).toHaveProperty('user');

            // Verify posts completeness
            result.posts.forEach(post => {
              expect(post.threadId).toBe(threadId);
              expect(post).toHaveProperty('id');
              expect(post).toHaveProperty('body');
              expect(post).toHaveProperty('userId');
              expect(post).toHaveProperty('createdAt');
              // Note: user field is now optional in the updated types
              if (post.user) {
                expect(post.user).toHaveProperty('username');
              }
            });

            // Verify both API calls were made with proper authentication
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenNthCalledWith(1,
              `https://test-api.foru.ms/api/v1/thread/${threadId}`,
              expect.objectContaining({
                headers: expect.objectContaining({
                  'x-api-key': 'test-api-key'
                })
              })
            );
            expect(global.fetch).toHaveBeenNthCalledWith(2,
              `https://test-api.foru.ms/api/v1/thread/${threadId}/posts`,
              expect.objectContaining({
                headers: expect.objectContaining({
                  'x-api-key': 'test-api-key'
                })
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('API calls should handle authentication mechanism as defined by Foru.ms', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Non-empty thread IDs only
          fc.string({ minLength: 10, maxLength: 100 }), // API key
          async (threadId, apiKey) => {
            const clientWithCustomKey = new ForumsApiClient({
              baseUrl: 'https://test-api.foru.ms',
              apiKey
            });

            // Mock successful response
            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  id: threadId,
                  title: 'Test Thread',
                  body: 'Test Body',
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                  user: { id: 'user1', username: 'testuser' }
                }),
              })
            ) as jest.Mock;

            await clientWithCustomKey.fetchThread(threadId);

            // Verify authentication header uses the provided API key
            expect(global.fetch).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                headers: expect.objectContaining({
                  'x-api-key': `${apiKey}`
                })
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('API integration should handle paginated post responses correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Non-empty thread IDs only
          fc.array(forumsPostArbitrary, { minLength: 1, maxLength: 15 }),
          async (threadId, mockPosts) => {
            const postsWithCorrectThreadId = mockPosts.map(post => ({
              ...post,
              threadId
            }));

            // Mock paginated response format
            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                  posts: postsWithCorrectThreadId,
                  pagination: { page: 1, total: postsWithCorrectThreadId.length }
                }),
              })
            ) as jest.Mock;

            const result = await apiClient.fetchThreadPosts(threadId);

            // Should extract posts from paginated response
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(postsWithCorrectThreadId.length);
            
            // All posts should have correct threadId
            result.forEach(post => {
              expect(post.threadId).toBe(threadId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
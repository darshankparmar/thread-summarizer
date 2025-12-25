import { ThreadFetcherService } from '@/services/thread-fetcher';
import { ForumsApiClient, ForumsApiError } from '@/services/forums-api';
import { createMockThread, createMockPost } from '../utils/mock-data';

// Unit tests for ThreadFetcher error handling

describe('ThreadFetcher Error Handling Unit Tests', () => {
  let threadFetcher: ThreadFetcherService;
  let mockApiClient: jest.Mocked<ForumsApiClient>;

  beforeEach(() => {
    // Create mock API client
    mockApiClient = {
      fetchCompleteThread: jest.fn(),
      fetchThread: jest.fn(),
      fetchThreadPosts: jest.fn(),
    } as Partial<jest.Mocked<ForumsApiClient>> as jest.Mocked<ForumsApiClient>;

    // Create thread fetcher with mock client
    threadFetcher = new ThreadFetcherService(mockApiClient);
  });

  describe('Input Validation', () => {
    test('should return error for empty thread ID', async () => {
      const result = await threadFetcher.fetchThreadData('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Thread ID is required');
      expect(mockApiClient.fetchCompleteThread).not.toHaveBeenCalled();
    });

    test('should return error for whitespace-only thread ID', async () => {
      const result = await threadFetcher.fetchThreadData('   ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Thread ID is required');
      expect(mockApiClient.fetchCompleteThread).not.toHaveBeenCalled();
    });
  });

  describe('API Error Handling', () => {
    test('should handle authentication errors with user-friendly message', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Authentication failed - invalid API key', 401)
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to access forum data - authentication required');
      expect(result.fallback).toBeUndefined();
    });

    test('should handle thread not found errors with user-friendly message', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Thread with ID thread-123 not found', 404)
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Thread not found - please check the thread ID and try again');
      expect(result.fallback).toBeUndefined();
    });

    test('should handle rate limiting errors with user-friendly message', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Rate limit exceeded - please try again later', 429)
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests - please wait a moment and try again');
      expect(result.fallback).toBeUndefined();
    });

    test('should handle network errors with fallback data', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Network error - unable to connect to Foru.ms API')
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to connect to forum - please check your connection and try again');
      expect(result.fallback).toBeDefined();
      expect(result.fallback?.threadStats.postCount).toBe(0);
      expect(result.fallback?.threadStats.contributorCount).toBe(0);
      expect(result.fallback?.message).toContain('thread-123');
    });

    test('should handle timeout errors with fallback data', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Request timeout - Foru.ms API did not respond in time')
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to connect to forum - please check your connection and try again');
      expect(result.fallback).toBeDefined();
      expect(result.fallback?.message).toBe('Unable to analyze thread thread-123 - forum data temporarily unavailable');
    });

    test('should handle generic API errors with fallback data', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('API request failed with status 500', 500)
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Forum data temporarily unavailable - please try again later');
      expect(result.fallback).toBeDefined();
    });
  });

  describe('Unexpected Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new Error('Unexpected system error')
      );

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while fetching thread data');
      expect(result.fallback).toBeDefined();
      expect(result.fallback?.threadStats.postCount).toBe(0);
    });

    test('should handle null/undefined errors', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(null);

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while fetching thread data');
      expect(result.fallback).toBeDefined();
    });
  });

  describe('Successful Data Processing', () => {
    test('should calculate last post timestamp correctly with posts', async () => {
      const mockThread = createMockThread({
        id: 'thread-123',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T11:00:00Z'
      });

      const mockPosts = [
        createMockPost({
          id: 'post-1',
          threadId: 'thread-123',
          createdAt: '2024-01-01T12:00:00Z',
          userId: 'user-1'
        }),
        createMockPost({
          id: 'post-2',
          threadId: 'thread-123',
          createdAt: '2024-01-01T13:00:00Z',
          userId: 'user-2'
        })
      ];

      mockApiClient.fetchCompleteThread.mockResolvedValue({
        thread: mockThread,
        posts: mockPosts
      });

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(true);
      expect(result.data?.lastPostTimestamp).toBe(
        new Date('2024-01-01T13:00:00Z').getTime().toString()
      );
    });

    test('should calculate last post timestamp from thread when no posts', async () => {
      const mockThread = createMockThread({
        id: 'thread-123',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T11:00:00Z'
      });

      mockApiClient.fetchCompleteThread.mockResolvedValue({
        thread: mockThread,
        posts: []
      });

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(true);
      expect(result.data?.lastPostTimestamp).toBe(
        new Date('2024-01-01T10:00:00Z').getTime().toString()
      );
    });

    test('should calculate contributor count correctly', async () => {
      const mockThread = createMockThread({ id: 'thread-123' });
      const mockPosts = [
        createMockPost({ userId: 'user-1', threadId: 'thread-123' }),
        createMockPost({ userId: 'user-2', threadId: 'thread-123' }),
        createMockPost({ userId: 'user-1', threadId: 'thread-123' }), // Duplicate user
        createMockPost({ userId: 'user-3', threadId: 'thread-123' })
      ];

      mockApiClient.fetchCompleteThread.mockResolvedValue({
        thread: mockThread,
        posts: mockPosts
      });

      const result = await threadFetcher.fetchThreadData('thread-123');

      expect(result.success).toBe(true);
      expect(result.data?.contributorCount).toBe(3); // Unique users only
      expect(result.data?.postCount).toBe(4);
    });
  });

  describe('Content Suitability Analysis', () => {
    test('should identify thread as unsuitable when body is too short', () => {
      const mockData = {
        thread: createMockThread({ body: 'Hi' }),
        posts: [],
        lastPostTimestamp: '1234567890',
        postCount: 0,
        contributorCount: 0
      };

      const result = threadFetcher.isSuitableForAnalysis(mockData);
      expect(result).toBe(false);
    });

    test('should identify thread as suitable when body is adequate', () => {
      const mockData = {
        thread: createMockThread({ body: 'This is a substantial thread body with enough content for analysis.' }),
        posts: [],
        lastPostTimestamp: '1234567890',
        postCount: 0,
        contributorCount: 0
      };

      const result = threadFetcher.isSuitableForAnalysis(mockData);
      expect(result).toBe(true);
    });

    test('should identify thread as suitable when posts have meaningful content', () => {
      const mockData = {
        thread: createMockThread({ body: 'Short' }),
        posts: [
          createMockPost({ body: 'This is a meaningful response with substantial content.' })
        ],
        lastPostTimestamp: '1234567890',
        postCount: 1,
        contributorCount: 1
      };

      const result = threadFetcher.isSuitableForAnalysis(mockData);
      expect(result).toBe(true);
    });

    test('should identify thread as unsuitable when posts are too short', () => {
      const mockData = {
        thread: createMockThread({ body: 'Hi' }),
        posts: [
          createMockPost({ body: 'Ok' }),
          createMockPost({ body: '+1' })
        ],
        lastPostTimestamp: '1234567890',
        postCount: 2,
        contributorCount: 2
      };

      const result = threadFetcher.isSuitableForAnalysis(mockData);
      expect(result).toBe(false);
    });
  });

  describe('AI Formatting', () => {
    test('should format thread data correctly for AI processing', () => {
      const mockData = {
        thread: createMockThread({
          title: 'Test Discussion',
          body: 'This is the main thread content.'
        }),
        posts: [
          createMockPost({
            body: 'First response',
            user: { username: 'alice' }
          }),
          createMockPost({
            body: 'Second response',
            user: { username: 'bob' }
          })
        ],
        lastPostTimestamp: '1234567890',
        postCount: 2,
        contributorCount: 2
      };

      const formatted = threadFetcher.formatForAI(mockData);

      expect(formatted).toContain('Thread Title: Test Discussion');
      expect(formatted).toContain('Thread Body: This is the main thread content.');
      expect(formatted).toContain('Posts (2 total):');
      expect(formatted).toContain('1. @alice: First response');
      expect(formatted).toContain('2. @bob: Second response');
    });

    test('should handle empty posts array in formatting', () => {
      const mockData = {
        thread: createMockThread({
          title: 'Solo Thread',
          body: 'Just the original post.'
        }),
        posts: [],
        lastPostTimestamp: '1234567890',
        postCount: 0,
        contributorCount: 0
      };

      const formatted = threadFetcher.formatForAI(mockData);

      expect(formatted).toContain('Thread Title: Solo Thread');
      expect(formatted).toContain('Thread Body: Just the original post.');
      expect(formatted).toContain('Posts (0 total):');
      expect(formatted).not.toContain('@');
    });
  });

  describe('Fallback Data Generation', () => {
    test('should generate appropriate fallback data structure', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Network error')
      );

      const result = await threadFetcher.fetchThreadData('test-thread-456');

      expect(result.fallback).toBeDefined();
      expect(result.fallback?.threadStats).toEqual({
        postCount: 0,
        contributorCount: 0,
        createdAt: expect.any(String)
      });
      expect(result.fallback?.message).toBe(
        'Unable to analyze thread test-thread-456 - forum data temporarily unavailable'
      );
    });

    test('should include thread ID in fallback message', async () => {
      mockApiClient.fetchCompleteThread.mockRejectedValue(
        new ForumsApiError('Timeout error')
      );

      const result = await threadFetcher.fetchThreadData('special-thread-789');

      expect(result.fallback?.message).toContain('special-thread-789');
    });
  });
});
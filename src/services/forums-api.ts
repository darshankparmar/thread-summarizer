import { ForumsThread, ForumsPost } from '@/types';
import { demoApiService } from './demo-api';

/**
 * Configuration for Foru.ms API client
 */
interface ForumsApiConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Error types for Foru.ms API operations
 */
export class ForumsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ForumsApiError';
  }
}

/**
 * Foru.ms API client for fetching thread and post data
 */
export class ForumsApiClient {
  private config: ForumsApiConfig;

  constructor(config: ForumsApiConfig) {
    this.config = config;
  }

  /**
   * Fetch thread metadata from Foru.ms API
   * @param threadId - The ID of the thread to fetch
   * @returns Promise<ForumsThread> - Thread metadata
   * @throws ForumsApiError - When API request fails
   */
  async fetchThread(threadId: string): Promise<ForumsThread> {
    if (!threadId || threadId.trim() === '') {
      throw new ForumsApiError('Thread ID is required');
    }

    // Use demo data if demo mode is enabled
    if (demoApiService.isDemoMode()) {
      try {
        return await demoApiService.fetchThread(threadId);
      } catch {
        throw new ForumsApiError(`Demo thread not found: ${threadId}`, 404);
      }
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/threads/${threadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ThreadSummarizer/1.0'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ForumsApiError('Authentication failed - invalid API key', 401);
        }
        if (response.status === 404) {
          throw new ForumsApiError(`Thread with ID ${threadId} not found`, 404);
        }
        if (response.status === 429) {
          throw new ForumsApiError('Rate limit exceeded - please try again later', 429);
        }
        throw new ForumsApiError(
          `API request failed with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      
      // Validate response structure
      if (!this.isValidThread(data)) {
        throw new ForumsApiError('Invalid thread data received from API');
      }

      return data as ForumsThread;
    } catch (error) {
      if (error instanceof ForumsApiError) {
        throw error;
      }
      
      // Handle network errors (including generic TypeError)
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Unexpected error occurred', undefined, error as Error);
    }
  }

  /**
   * Fetch all posts for a given thread from Foru.ms API
   * @param threadId - The ID of the thread whose posts to fetch
   * @returns Promise<ForumsPost[]> - Array of posts in the thread
   * @throws ForumsApiError - When API request fails
   */
  async fetchThreadPosts(threadId: string): Promise<ForumsPost[]> {
    if (!threadId || threadId.trim() === '') {
      throw new ForumsApiError('Thread ID is required');
    }

    // Use demo data if demo mode is enabled
    if (demoApiService.isDemoMode()) {
      try {
        return await demoApiService.fetchThreadPosts(threadId);
      } catch {
        throw new ForumsApiError(`Demo posts not found for thread: ${threadId}`, 404);
      }
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/threads/${threadId}/posts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ThreadSummarizer/1.0'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout for posts (potentially larger response)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ForumsApiError('Authentication failed - invalid API key', 401);
        }
        if (response.status === 404) {
          throw new ForumsApiError(`Posts for thread ${threadId} not found`, 404);
        }
        if (response.status === 429) {
          throw new ForumsApiError('Rate limit exceeded - please try again later', 429);
        }
        throw new ForumsApiError(
          `API request failed with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      
      // Handle both array response and paginated response
      const posts = Array.isArray(data) ? data : data.posts || [];
      
      // Validate each post structure
      if (!Array.isArray(posts) || !posts.every(post => this.isValidPost(post))) {
        throw new ForumsApiError('Invalid post data received from API');
      }

      return posts as ForumsPost[];
    } catch (error) {
      if (error instanceof ForumsApiError) {
        throw error;
      }
      
      // Handle network errors (including generic TypeError)
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Unexpected error occurred', undefined, error as Error);
    }
  }

  /**
   * Fetch both thread metadata and posts in a single operation
   * @param threadId - The ID of the thread to fetch completely
   * @returns Promise<{thread: ForumsThread, posts: ForumsPost[]}> - Complete thread data
   * @throws ForumsApiError - When any API request fails
   */
  async fetchCompleteThread(threadId: string): Promise<{thread: ForumsThread, posts: ForumsPost[]}> {
    // Use demo data if demo mode is enabled
    if (demoApiService.isDemoMode()) {
      try {
        return await demoApiService.fetchCompleteThread(threadId);
      } catch {
        throw new ForumsApiError(`Demo thread not found: ${threadId}`, 404);
      }
    }

    try {
      // Fetch thread and posts concurrently for better performance
      const [thread, posts] = await Promise.all([
        this.fetchThread(threadId),
        this.fetchThreadPosts(threadId)
      ]);

      return { thread, posts };
    } catch (error) {
      // Re-throw ForumsApiError as-is
      if (error instanceof ForumsApiError) {
        throw error;
      }
      throw new ForumsApiError('Failed to fetch complete thread data', undefined, error as Error);
    }
  }

  /**
   * Validate thread data structure
   * @private
   */
  private isValidThread(data: unknown): data is ForumsThread {
    if (!data || typeof data !== 'object') return false;
    
    const thread = data as Record<string, unknown>;
    return (
      typeof thread.id === 'string' &&
      typeof thread.title === 'string' &&
      typeof thread.body === 'string' &&
      typeof thread.createdAt === 'string' &&
      typeof thread.updatedAt === 'string' &&
      thread.user !== null &&
      typeof thread.user === 'object' &&
      typeof (thread.user as Record<string, unknown>).id === 'string' &&
      typeof (thread.user as Record<string, unknown>).username === 'string'
    );
  }

  /**
   * Validate post data structure
   * @private
   */
  private isValidPost(data: unknown): data is ForumsPost {
    if (!data || typeof data !== 'object') return false;
    
    const post = data as Record<string, unknown>;
    return (
      typeof post.id === 'string' &&
      typeof post.body === 'string' &&
      typeof post.threadId === 'string' &&
      typeof post.userId === 'string' &&
      typeof post.createdAt === 'string' &&
      post.user !== null &&
      typeof post.user === 'object' &&
      typeof (post.user as Record<string, unknown>).username === 'string'
    );
  }
}

/**
 * Factory function to create a configured Foru.ms API client
 * @param config - Optional configuration override
 * @returns ForumsApiClient instance
 */
export function createForumsApiClient(config?: Partial<ForumsApiConfig>): ForumsApiClient {
  const defaultConfig: ForumsApiConfig = {
    baseUrl: process.env.FORUMS_API_URL || 'https://api.foru.ms',
    apiKey: process.env.FORUMS_API_KEY || ''
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.apiKey) {
    throw new ForumsApiError('FORUMS_API_KEY environment variable is required');
  }

  return new ForumsApiClient(finalConfig);
}

/**
 * Default export - pre-configured client instance
 */
export const forumsApi = createForumsApiClient();
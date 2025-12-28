import { ForumsThread, ForumsPost, FallbackData } from '@/types';
import { ForumsApiClient, ForumsApiError, createForumsApiClient } from './forums-api';

/**
 * Complete thread data with metadata and posts
 */
export interface CompleteThreadData {
  thread: ForumsThread;
  posts: ForumsPost[];
  lastPostTimestamp: string;
  postCount: number;
  contributorCount: number;
}

/**
 * Result type for thread fetching operations
 */
export interface ThreadFetchResult {
  success: boolean;
  data?: CompleteThreadData;
  error?: string;
  fallback?: FallbackData;
}

/**
 * High-level service for fetching and processing thread data
 */
export class ThreadFetcherService {
  private apiClient: ForumsApiClient;

  constructor(apiClient?: ForumsApiClient) {
    this.apiClient = apiClient || createForumsApiClient();
  }

  /**
   * Fetch complete thread data with error handling and fallback generation
   * @param threadId - The ID of the thread to fetch
   * @returns Promise<ThreadFetchResult> - Result with data or error information
   */
  async fetchThreadData(threadId: string): Promise<ThreadFetchResult> {
    try {
      // Validate input
      if (!threadId || threadId.trim() === '') {
        return {
          success: false,
          error: 'Thread ID is required'
        };
      }

      // Fetch complete thread data
      const { thread, posts } = await this.apiClient.fetchCompleteThread(threadId);

      // Calculate derived data
      const lastPostTimestamp = this.calculateLastPostTimestamp(thread, posts);
      const contributorCount = this.calculateContributorCount(posts);

      const completeData: CompleteThreadData = {
        thread,
        posts,
        lastPostTimestamp,
        postCount: posts.length,
        contributorCount
      };

      return {
        success: true,
        data: completeData
      };

    } catch (error) {
      if (error instanceof ForumsApiError) {
        return this.handleApiError(error, threadId);
      }

      // Handle unexpected errors
      return {
        success: false,
        error: 'An unexpected error occurred while fetching thread data',
        fallback: this.generateBasicFallback(threadId)
      };
    }
  }

  /**
   * Handle specific API errors with appropriate user-facing messages
   * @private
   */
  private handleApiError(error: ForumsApiError, threadId: string): ThreadFetchResult {
    switch (error.statusCode) {
      case 401:
        return {
          success: false,
          error: 'Unable to access forum data - authentication required'
        };
      
      case 404:
        return {
          success: false,
          error: `Thread not found - please check the thread ID and try again`
        };
      
      case 429:
        return {
          success: false,
          error: 'Too many requests - please wait a moment and try again'
        };
      
      default:
        // For network errors and other issues, provide fallback
        if (error.message.includes('Network error') || error.message.includes('timeout')) {
          return {
            success: false,
            error: 'Unable to connect to forum - please check your connection and try again',
            fallback: this.generateBasicFallback(threadId)
          };
        }
        
        return {
          success: false,
          error: 'Forum data temporarily unavailable - please try again later',
          fallback: this.generateBasicFallback(threadId)
        };
    }
  }

  /**
   * Calculate the timestamp of the most recent post or thread creation
   * @private
   */
  private calculateLastPostTimestamp(thread: ForumsThread, posts: ForumsPost[]): string {
    if (posts.length === 0) {
      return new Date(thread.createdAt).getTime().toString();
    }

    // Find the most recent post
    const mostRecentPost = posts.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });

    // Compare with thread updated timestamp
    const threadUpdated = new Date(thread.updatedAt);
    const postCreated = new Date(mostRecentPost.createdAt);

    return Math.max(threadUpdated.getTime(), postCreated.getTime()).toString();
  }

  /**
   * Calculate the number of unique contributors in the thread
   * @private
   */
  private calculateContributorCount(posts: ForumsPost[]): number {
    const uniqueUserIds = new Set(posts.map(post => post.userId));
    return uniqueUserIds.size;
  }

  /**
   * Generate basic fallback data when thread cannot be fetched
   * @private
   */
  private generateBasicFallback(threadId: string): FallbackData {
    return {
      threadStats: {
        postCount: 0,
        contributorCount: 0,
        createdAt: new Date().toISOString()
      },
      message: `Unable to analyze thread ${threadId} - forum data temporarily unavailable`
    };
  }

  /**
   * Check if thread data is suitable for AI processing
   * @param data - Complete thread data to validate
   * @returns boolean - True if thread has sufficient content for analysis
   */
  isSuitableForAnalysis(data: CompleteThreadData): boolean {
    // Calculate total content length
    const threadBodyLength = (data.thread.body || '').trim().length;
    const totalPostContent = data.posts.reduce((total, post) => 
      total + (post.body || '').trim().length, 0
    );
    const totalContentLength = threadBodyLength + totalPostContent;

    // Need at least 50 characters of meaningful content for AI analysis
    return totalContentLength >= 50;
  }

  /**
   * Format thread data for AI processing
   * @param data - Complete thread data
   * @returns string - Formatted text suitable for AI analysis
   */
  formatForAI(data: CompleteThreadData): string {
    const { thread, posts } = data;
    
    let formatted = `Thread Title: ${thread.title}\n`;
    formatted += `Thread Body: ${thread.body}\n`;
    formatted += `Posts (${posts.length} total):\n`;

    posts.forEach((post, index) => {
      formatted += `\n${index + 1}. @${post.user?.username || 'Unknown User'}: ${post.body}`;
    });

    return formatted;
  }
}

/**
 * Default export - pre-configured service instance
 */
export const threadFetcher = new ThreadFetcherService();
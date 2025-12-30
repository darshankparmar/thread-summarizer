/**
 * Thread Fetcher Service
 * Handles fetching thread data from the Forums API
 */

import { ForumsThread, ForumsPost } from '@/shared/types';
import { forumsApiClient } from './api';

export interface ThreadFetchResult {
  success: boolean;
  data?: {
    thread: ForumsThread;
    posts: ForumsPost[];
    lastPostTimestamp: string;
  };
  error?: string;
  statusCode?: number;
}

export class ThreadFetcher {
  /**
   * Fetch complete thread data including posts
   */
  async fetchThreadData(threadId: string): Promise<ThreadFetchResult> {
    try {
      // Fetch thread and posts in parallel
      const [threadResult, postsResult] = await Promise.all([
        forumsApiClient.threads.getThread(threadId),
        forumsApiClient.posts.getThreadPosts(threadId)
      ]);

      // Determine last post timestamp for cache key
      const lastPostTimestamp = this.getLastPostTimestamp(postsResult || []);

      return {
        success: true,
        data: {
          thread: threadResult,
          posts: postsResult || [],
          lastPostTimestamp
        }
      };

    } catch (error) {
      console.error('Thread fetch error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch thread data',
        statusCode: 500
      };
    }
  }

  /**
   * Get the timestamp of the most recent post for cache invalidation
   */
  private getLastPostTimestamp(posts: ForumsPost[]): string {
    if (posts.length === 0) {
      return Date.now().toString();
    }

    // Find the most recent post
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return new Date(sortedPosts[0].createdAt).getTime().toString();
  }
}

// Export singleton instance
export const threadFetcher = new ThreadFetcher();
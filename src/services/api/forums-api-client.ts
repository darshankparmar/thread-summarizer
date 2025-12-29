/**
 * Main Foru.ms API client
 * Combines all individual API clients into a single interface
 */

import { ApiConfig } from './base-api-client';
import { ThreadApiClient } from './thread-api';
import { PostApiClient } from './post-api';
import { UserApiClient } from './user-api';
import { TagApiClient } from './tag-api';
import { PollApiClient } from './poll-api';
import { AuthApiClient } from './auth-api';

export class ForumsApiClient {
  public readonly threads: ThreadApiClient;
  public readonly posts: PostApiClient;
  public readonly users: UserApiClient;
  public readonly tags: TagApiClient;
  public readonly polls: PollApiClient;
  public readonly auth: AuthApiClient;

  constructor(config: ApiConfig) {
    // Initialize all API clients with the same configuration
    this.threads = new ThreadApiClient(config);
    this.posts = new PostApiClient(config);
    this.users = new UserApiClient(config);
    this.tags = new TagApiClient(config);
    this.polls = new PollApiClient(config);
    this.auth = new AuthApiClient(config);
  }

  /**
   * Convenience method to get complete thread data (thread + posts)
   */
  async getCompleteThread(threadId: string): Promise<{
    thread: import('@/types').ForumsThread;
    posts: import('@/types').ForumsPost[];
  }> {
    const [thread, posts] = await Promise.all([
      this.threads.getThread(threadId),
      this.posts.getThreadPosts(threadId)
    ]);

    return { thread, posts };
  }

  /**
   * Convenience method for authenticated user operations
   */
  async authenticateAndGetUser(login: string, password: string): Promise<{
    user: import('@/types').ForumsUser;
    token: string;
  }> {
    // Step 1: Login to get JWT token
    const loginResponse = await this.auth.login({ login, password });
    
    // Step 2: Get user information using the JWT token
    const user = await this.auth.getCurrentUser(loginResponse.token);

    return {
      user,
      token: loginResponse.token
    };
  }

  /**
   * Search across multiple resource types
   */
  async search(query: string, options: {
    includeThreads?: boolean;
    includePosts?: boolean;
    includeTags?: boolean;
    includeUsers?: boolean;
    limit?: number;
  } = {}): Promise<{
    threads?: import('@/types').ForumsThread[];
    posts?: import('@/types').ForumsPost[];
    tags?: import('@/types').ForumsTag[];
    users?: import('@/types').ForumsUser[];
  }> {
    const {
      includeThreads = true,
      includePosts = true,
      includeTags = true,
      includeUsers = true,
      limit = 10
    } = options;

    const searchPromises: Promise<void>[] = [];
    const results: {
      threads?: import('@/types').ForumsThread[];
      posts?: import('@/types').ForumsPost[];
      tags?: import('@/types').ForumsTag[];
      users?: import('@/types').ForumsUser[];
    } = {};

    if (includeThreads) {
      searchPromises.push(
        this.threads.getThreads({ query, limit }).then(response => {
          results.threads = response.data;
        })
      );
    }

    if (includePosts) {
      searchPromises.push(
        this.posts.getPosts({ limit }).then(response => {
          // Filter posts by query (basic client-side filtering)
          results.posts = response.data.filter(post => 
            post.body.toLowerCase().includes(query.toLowerCase())
          ).slice(0, limit);
        })
      );
    }

    if (includeTags) {
      searchPromises.push(
        this.tags.searchTags(query, { limit }).then(response => {
          results.tags = response.data;
        })
      );
    }

    if (includeUsers) {
      searchPromises.push(
        this.users.getUsers({ query, limit }).then(response => {
          results.users = response.data;
        })
      );
    }

    await Promise.allSettled(searchPromises);
    return results;
  }
}

/**
 * Factory function to create a configured Foru.ms API client
 */
export function createForumsApiClient(config?: Partial<ApiConfig>): ForumsApiClient {
  const defaultConfig: ApiConfig = {
    baseUrl: process.env.FORUMS_API_URL || 'https://foru.ms',
    apiKey: process.env.FORUMS_API_KEY || '',
    timeout: 10000
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.apiKey) {
    throw new Error('FORUMS_API_KEY environment variable is required');
  }

  return new ForumsApiClient(finalConfig);
}

/**
 * Default export - pre-configured client instance
 */
export const forumsApiClient = createForumsApiClient();

// Re-export all types for convenience
export * from './types';
export * from './base-api-client';
export { ApiError } from './base-api-client';
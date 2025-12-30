/**
 * Protected API Wrapper
 * Provides automatic authentication for API calls
 */

import { ForumsApiClient, ApiError } from '../api';
import { SessionManager } from './session-manager';

export class ProtectedApiWrapper {
  private apiClient: ForumsApiClient;

  constructor(apiClient: ForumsApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get current authentication token, throwing error if not available
   */
  private getAuthToken(): string {
    const token = SessionManager.getCurrentToken();
    if (!token) {
      throw new ApiError('Authentication required - please log in', 401);
    }
    return token;
  }

  /**
   * Execute an API call with automatic authentication
   */
  private async executeWithAuth<T>(
    operation: (token: string) => Promise<T>,
    requireAuth: boolean = true
  ): Promise<T> {
    if (requireAuth) {
      const token = this.getAuthToken();
      
      try {
        const result = await operation(token);
        
        // Update session activity on successful API call
        SessionManager.updateActivity();
        
        return result;
      } catch (error) {
        // Handle authentication errors
        if (error instanceof ApiError && error.statusCode === 401) {
          // Clear invalid session
          SessionManager.clearSession();
          throw new ApiError('Session expired - please log in again', 401);
        }
        throw error;
      }
    } else {
      return operation('');
    }
  }

  // Thread operations
  async createThread(threadData: import('../api/types').CreateThreadRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.createThread(threadData, token)
    );
  }

  async updateThread(threadId: string, updates: import('../api/types').UpdateThreadRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.updateThread(threadId, updates, token)
    );
  }

  async deleteThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.deleteThread(threadId, token)
    );
  }

  async likeThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.likeThread(threadId, token)
    );
  }

  async unlikeThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.unlikeThread(threadId, token)
    );
  }

  async upvoteThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.upvoteThread(threadId, token)
    );
  }

  async downvoteThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.downvoteThread(threadId, token)
    );
  }

  async subscribeToThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.subscribeToThread(threadId, token)
    );
  }

  async unsubscribeFromThread(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.threads.unsubscribeFromThread(threadId, token)
    );
  }

  // Post operations
  async createPost(postData: import('../api/types').CreatePostRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.posts.createPost(postData, token)
    );
  }

  async updatePost(postId: string, updates: import('../api/types').UpdatePostRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.posts.updatePost(postId, updates, token)
    );
  }

  async deletePost(postId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.posts.deletePost(postId, token)
    );
  }

  async likePost(postId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.posts.likePost(postId, token)
    );
  }

  async upvotePost(postId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.posts.upvotePost(postId, token)
    );
  }

  async markPostAsBestAnswer(postId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.posts.markAsBestAnswer(postId, token)
    );
  }

  // User operations
  async updateCurrentUser(updates: import('../api/types').UpdateUserRequest) {
    const result = await this.executeWithAuth(token => 
      this.apiClient.users.updateCurrentUser(updates, token)
    );

    // Update session with new user data
    SessionManager.updateUser({
      username: result.username,
      email: result.email,
      name: result.displayName || result.username,
      image: result.image
    });

    return result;
  }

  async followUser(userId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.users.followUser(userId, token)
    );
  }

  async unfollowUser(userId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.users.unfollowUser(userId, token)
    );
  }

  async getCurrentUser() {
    return this.executeWithAuth(token => 
      this.apiClient.auth.getCurrentUser(token)
    );
  }

  // Tag operations
  async createTag(tagData: import('../api/types').CreateTagRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.tags.createTag(tagData, token)
    );
  }

  async updateTag(tagId: string, updates: import('../api/types').UpdateTagRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.tags.updateTag(tagId, updates, token)
    );
  }

  async deleteTag(tagId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.tags.deleteTag(tagId, token)
    );
  }

  async subscribeToTag(tagId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.tags.subscribeToTag(tagId, token)
    );
  }

  async getSubscribedTags() {
    return this.executeWithAuth(token => 
      this.apiClient.tags.getSubscribedTags(token)
    );
  }

  // Poll operations
  async createPoll(threadId: string, pollData: import('../api/types').CreatePollRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.polls.createPoll(threadId, pollData, token)
    );
  }

  async updatePoll(threadId: string, updates: import('../api/types').UpdatePollRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.polls.updatePoll(threadId, updates, token)
    );
  }

  async deletePoll(threadId: string) {
    return this.executeWithAuth(token => 
      this.apiClient.polls.deletePoll(threadId, token)
    );
  }

  async castVote(threadId: string, voteData: import('../api/types').PollVoteRequest) {
    return this.executeWithAuth(token => 
      this.apiClient.polls.castVote(threadId, voteData, token)
    );
  }

  async getPollResults(threadId: string) {
    // Poll results can be viewed without authentication, but include user vote if authenticated
    const token = SessionManager.getCurrentToken();
    return this.apiClient.polls.getPollResults(threadId, token || undefined);
  }

  // Public operations (no authentication required)
  async getThreads(params?: import('../api/types').ThreadQueryParams) {
    return this.apiClient.threads.getThreads(params);
  }

  async getThread(threadId: string) {
    return this.apiClient.threads.getThread(threadId);
  }

  async getThreadPosts(threadId: string) {
    return this.apiClient.posts.getThreadPosts(threadId);
  }

  async getCompleteThread(threadId: string) {
    return this.apiClient.getCompleteThread(threadId);
  }

  async getTags(params?: import('../api/types').TagQueryParams) {
    return this.apiClient.tags.getTags(params);
  }

  async getTag(tagId: string) {
    return this.apiClient.tags.getTag(tagId);
  }

  async getUsers(params?: import('../api/types').UserQueryParams) {
    return this.apiClient.users.getUsers(params);
  }

  async getUser(userId: string) {
    return this.apiClient.users.getUser(userId);
  }

  async search(query: string, options?: Parameters<ForumsApiClient['search']>[1]) {
    return this.apiClient.search(query, options);
  }
}
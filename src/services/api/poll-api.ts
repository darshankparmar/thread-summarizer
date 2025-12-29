/**
 * Poll API client
 * Handles all poll-related CRUD operations
 */

import { BaseApiClient, RequestOptions } from './base-api-client';
import {
  CreatePollRequest,
  UpdatePollRequest,
  PollVoteRequest,
  PollResults
} from './types';

export interface Poll {
  id: string;
  title: string;
  threadId: string;
  expiresAt?: string;
  closed: boolean;
  closedAt?: string;
  options: Array<{
    id: string;
    title: string;
    color?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class PollApiClient extends BaseApiClient {
  /**
   * Create a poll for a thread
   */
  async createPoll(threadId: string, pollData: CreatePollRequest, bearerToken: string): Promise<Poll> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      body: pollData,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<Poll>(`/api/v1/thread/${threadId}/poll`, options);
  }

  /**
   * Update a poll for a thread
   */
  async updatePoll(
    threadId: string, 
    updates: UpdatePollRequest, 
    bearerToken: string
  ): Promise<Poll> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'PUT',
      body: updates,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<Poll>(`/api/v1/thread/${threadId}/poll`, options);
  }

  /**
   * Delete a poll for a thread
   */
  async deletePoll(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/thread/${threadId}/poll`, options);
  }

  /**
   * Get poll results for a thread
   */
  async getPollResults(threadId: string, bearerToken?: string): Promise<PollResults> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'GET',
      useApiKey: !bearerToken,
      bearerToken
    };

    return this.makeRequest<PollResults>(`/api/v1/thread/${threadId}/poll/results`, options);
  }

  /**
   * Cast a vote in a poll
   */
  async castVote(threadId: string, voteData: PollVoteRequest, bearerToken: string): Promise<{ id: string; optionId: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'POST',
      body: voteData,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; optionId: string; userId: string }>(`/api/v1/threads/${threadId}/poll/votes`, options);
  }

  /**
   * Update or change a vote in a poll
   */
  async updateVote(threadId: string, voteData: PollVoteRequest, bearerToken: string): Promise<{ id: string; optionId: string; userId: string }> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'PUT',
      body: voteData,
      useApiKey: false,
      bearerToken
    };

    return this.makeRequest<{ id: string; optionId: string; userId: string }>(`/api/v1/threads/${threadId}/poll/votes`, options);
  }

  /**
   * Remove a vote from a poll
   */
  async removeVote(threadId: string, bearerToken: string): Promise<void> {
    if (!threadId?.trim()) {
      throw new Error('Thread ID is required');
    }

    const options: RequestOptions = {
      method: 'DELETE',
      useApiKey: false,
      bearerToken
    };

    await this.makeRequest<void>(`/api/v1/threads/${threadId}/poll/votes`, options);
  }

  /**
   * Close a poll manually
   */
  async closePoll(threadId: string, bearerToken: string): Promise<Poll> {
    return this.updatePoll(threadId, { closed: true }, bearerToken);
  }

  /**
   * Reopen a closed poll
   */
  async reopenPoll(threadId: string, bearerToken: string): Promise<Poll> {
    return this.updatePoll(threadId, { closed: false }, bearerToken);
  }
}
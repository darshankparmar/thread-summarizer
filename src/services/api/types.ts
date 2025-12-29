/**
 * API-specific types and interfaces
 * Extends the main types with API-specific request/response structures
 */

// Pagination types
export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  nextCursor?: string;
}

// Thread API types
export interface CreateThreadRequest {
  title: string;
  body: string;
  tagIds?: string[];
  locked?: boolean;
  pinned?: boolean;
}

export interface UpdateThreadRequest {
  title?: string;
  body?: string;
  locked?: boolean;
  pinned?: boolean;
  tagIds?: string[];
}

export interface ThreadQueryParams extends PaginationParams {
  query?: string;
  tagId?: string;
  filter?: string;
  type?: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined;
}

// Post API types
export interface CreatePostRequest {
  body: string;
  threadId: string;
  parentId?: string;
}

export interface UpdatePostRequest {
  body?: string;
  bestAnswer?: boolean;
}

export interface PostQueryParams extends PaginationParams {
  threadId?: string;
  userId?: string;
  parentId?: string;
  [key: string]: string | number | boolean | undefined;
}

// User API types
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  signature?: string;
  url?: string;
  image?: string;
  extendedData?: Record<string, unknown>;
}

export interface UserQueryParams extends PaginationParams {
  query?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

// Tag API types
export interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
  extendedData?: Record<string, unknown>;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
  color?: string;
  extendedData?: Record<string, unknown>;
}

export interface TagQueryParams extends PaginationParams {
  query?: string;
  includeThreads?: boolean;
  [key: string]: string | number | boolean | undefined;
}

// Engagement API types
export interface LikeResponse {
  id: string;
  userId: string;
  threadId?: string;
  postId?: string;
  dislike?: boolean;
  createdAt: string;
}

export interface UpvoteResponse {
  id: string;
  userId: string;
  threadId?: string;
  postId?: string;
  downvote?: boolean;
  createdAt: string;
}

// Poll API types
export interface CreatePollRequest {
  title: string;
  options: Array<{
    title: string;
    color?: string;
  }>;
  expiresAt?: string;
}

export interface UpdatePollRequest {
  title?: string;
  options?: Array<{
    id?: string;
    title: string;
    color?: string;
  }>;
  closed?: boolean;
  expiresAt?: string;
}

export interface PollVoteRequest {
  optionId: string;
}

export interface PollResults {
  options: Array<{
    id: string;
    title: string;
    color?: string;
    votes: number;
  }>;
  userVote?: string | null;
}

// Follow API types
export interface FollowResponse {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Subscription API types
export interface SubscriptionResponse {
  threadId: string;
  userId: string;
  createdAt: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  count: number;
  nextCursor?: string;
}
// Core data types for Thread Summarizer

// Foru.ms API Types
export interface ForumsUser {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  image?: string;
  avatar?: string; // Used in thread user object
  roles?: string[];
  bio?: string;
  signature?: string;
  url?: string;
  extendedData?: Record<string, unknown>;
}

export interface ForumsTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  threads?: ForumsThread[];
  extendedData?: Record<string, unknown>;
}

export interface ForumsThread {
  id: string;
  title: string;
  slug?: string;
  body: string;
  views?: number;
  locked?: boolean;
  pinned?: boolean;
  bestAnswerId?: string;
  createdAt: string;
  updatedAt: string;
  likes?: ForumsLike[];
  upvotes?: ForumsUpvote[];
  _count?: {
    Post: number;
  };
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  tags?: ForumsTag[];
}

export interface ForumsLike {
  id: string;
  userId: string;
}

export interface ForumsUpvote {
  id: string;
  userId: string;
}

export interface ForumsPost {
  id: string;
  body: string;
  threadId: string;
  userId: string;
  parentId?: string;
  bestAnswer?: boolean;
  likes?: ForumsLike[];
  upvotes?: ForumsUpvote[];
  extendedData?: Record<string, unknown>;
  instanceId?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    username: string;
    id?: string;
    displayName?: string;
    avatar?: string;
  };
}

// Summary data types
export interface Contributor {
  username: string;
  contribution: string;
}

export type SentimentType = 'Positive' | 'Neutral' | 'Mixed' | 'Negative';
export type HealthLabel = 'Healthy' | 'Needs Attention' | 'Heated Discussion';

export interface SummaryData {
  summary: string[];
  keyPoints: string[];
  contributors: Contributor[];
  sentiment: SentimentType;
  healthScore: number;
  healthLabel: HealthLabel;
}

// API request/response types
export interface SummarizeRequest {
  threadId: string;
}

export interface SummarizeResponse {
  success: boolean;
  data?: SummaryData;
  error?: string;
  cached: boolean;
  generatedAt: string;
}

// Error handling types
export interface ErrorResponse {
  success: false;
  error: string;
  fallback?: {
    summary: string[];
    keyPoints: string[];
    contributors: Contributor[];
    sentiment: 'Neutral';
    healthScore: 5;
  };
}

export interface FallbackData {
  threadStats: {
    postCount: number;
    contributorCount: number;
    createdAt: string;
  };
  message: string;
}

// Cache types
export interface CacheKey {
  pattern: `summary_${string}_${string}`;
  threadId: string;
  lastPostTimestamp: string;
}

// Component prop types
export interface ThreadSummaryPanelProps {
  threadId: string;
  className?: string;
}

export interface LoadingStateProps {
  isGenerating: boolean;
  error?: string;
  fallbackMessage?: string;
}
/**
 * Common Shared Types
 * Types used across multiple domains
 */

// Summary data types
export interface Contributor {
  username: string;
  contribution: string;
}

export type SentimentType = 'Positive' | 'Neutral' | 'Mixed' | 'Negative' | 'No Discussion';
export type HealthLabel = 'Healthy' | 'Needs Attention' | 'Heated Discussion' | 'New Thread';

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
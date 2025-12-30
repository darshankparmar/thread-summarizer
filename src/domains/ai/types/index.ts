/**
 * AI Domain Types
 */

import type { ForumsThread, ForumsPost } from '@/shared/types';

// Re-export AI-related types from shared types
export type { 
  SummaryData, 
  Contributor, 
  SentimentType, 
  HealthLabel,
  SummarizeRequest,
  SummarizeResponse,
  ThreadSummaryPanelProps,
  LoadingStateProps
} from '@/shared/types';

// AI-specific types
export interface AIPromptTemplate {
  thread: ForumsThread;
  posts: ForumsPost[];
}

export interface AIServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface SummarySchema {
  type: "object";
  properties: {
    summary: {
      type: "array";
      items: { type: "string" };
      maxItems: number;
    };
    keyPoints: {
      type: "array";
      items: { type: "string" };
      minItems: number;
      maxItems: number;
    };
    contributors: {
      type: "array";
      items: {
        type: "object";
        properties: {
          username: { type: "string" };
          contribution: { type: "string" };
        };
        required: ["username", "contribution"];
      };
      minItems: number;
      maxItems: number;
    };
    sentiment: {
      type: "string";
      enum: ["Positive", "Neutral", "Mixed", "Negative"];
    };
    healthScore: {
      type: "integer";
      minimum: 1;
      maximum: 10;
    };
  };
  required: ["summary", "keyPoints", "contributors", "sentiment", "healthScore"];
  additionalProperties: false;
}
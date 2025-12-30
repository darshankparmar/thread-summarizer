/**
 * Data formatting utilities for Thread Summarizer
 * Centralized location for all data formatting functions
 */

import { Contributor, SentimentType, HealthLabel } from '@/shared/types';

/**
 * Format contributor information for display
 */
export const formatContributor = (contributor: Contributor): string => {
  return `${contributor.username} – ${contributor.contribution}`;
};

/**
 * Get health label based on health score
 */
export const getHealthLabel = (healthScore: number): HealthLabel => {
  if (healthScore >= 7) return 'Healthy';
  if (healthScore >= 4) return 'Needs Attention';
  return 'Heated Discussion';
};

/**
 * Get emoji representation for sentiment
 */
export const getSentimentEmoji = (sentiment: SentimentType): string => {
  const emojiMap: Record<SentimentType, string> = {
    'Positive': '😊',
    'Neutral': '😐',
    'Mixed': '🤔',
    'Negative': '😠',
    'No Discussion': '💬'
  };
  return emojiMap[sentiment];
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format post count for display
 */
export const formatPostCount = (count: number): string => {
  if (count === 0) return 'No posts';
  if (count === 1) return '1 post';
  if (count < 1000) return `${count} posts`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k posts`;
  return `${(count / 1000000).toFixed(1)}M posts`;
};
import React from 'react';
import { SummaryData, Contributor, SentimentType, HealthLabel } from '../types';

// Utility functions for data formatting
export const formatContributor = (contributor: Contributor): string => {
  return `${contributor.username} – ${contributor.contribution}`;
};

export const getHealthLabel = (healthScore: number): HealthLabel => {
  if (healthScore >= 7) return 'Healthy';
  if (healthScore >= 4) return 'Needs Attention';
  return 'Heated Discussion';
};

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

// Component for displaying formatted summary data
interface SummaryDisplayProps {
  data: SummaryData;
}

export function SummaryDisplay({ data }: SummaryDisplayProps) {
  return (
    <div className="summary-display space-y-4">
      {/* Summary Points */}
      <div className="summary-section">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
        <div className="text-based-list">
          {data.summary.map((point, index) => (
            <div key={index} className="text-sm text-gray-700 mb-1">
              • {point}
            </div>
          ))}
        </div>
      </div>

      {/* Key Points */}
      <div className="key-points-section">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Discussion Points</h4>
        <div className="text-based-list">
          {data.keyPoints.map((point, index) => (
            <div key={index} className="text-sm text-gray-700 mb-1">
              • {point}
            </div>
          ))}
        </div>
      </div>

      {/* Contributors with @username formatting */}
      <div className="contributors-section">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Contributors</h4>
        <div className="text-based-list">
          {data.contributors.map((contributor, index) => (
            <div key={index} className="text-sm text-gray-700 mb-1">
              {formatContributor(contributor)}
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment and Health Score - Text-based presentation */}
      <div className="metrics-section border-t border-gray-200 pt-3">
        <div className="flex justify-between items-center text-sm">
          <div className="sentiment-display">
            <span className="font-medium text-gray-900">Sentiment: </span>
            <span className="sentiment-emoji">{getSentimentEmoji(data.sentiment)}</span>
            <span className="sentiment-text text-gray-700"> {data.sentiment}</span>
          </div>
          {data.healthScore !== 0 && (
            <>
              <div className="health-score-display">
                <span className="font-medium text-gray-900">Health: </span>
                <span className="health-score text-gray-900">{data.healthScore}/10</span>
                <span className="health-label text-gray-600"> ({data.healthLabel})</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility component for loading states
interface LoadingDisplayProps {
  message?: string;
}

export function LoadingDisplay({ message = "Analyzing thread content..." }: LoadingDisplayProps) {
  return (
    <div className="loading-display text-center py-6">
      <div className="text-sm text-gray-600">{message}</div>
    </div>
  );
}

// Utility component for error states
interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="error-display bg-red-50 border border-red-200 rounded p-3">
      <div className="text-sm text-red-800">
        <span className="font-medium">Error: </span>
        {error}
      </div>
    </div>
  );
}
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
    <div className="summary-display space-y-6">
      {/* Summary Points */}
      <div className="summary-section">
        <h4 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          Summary
        </h4>
        <div className="text-based-list space-y-2 pl-4">
          {data.summary.map((point, index) => (
            <div key={index} className="text-sm text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-primary mt-1.5 text-xs">•</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Points */}
      <div className="key-points-section">
        <h4 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-secondary rounded-full"></span>
          Key Discussion Points
        </h4>
        <div className="text-based-list space-y-2 pl-4">
          {data.keyPoints.map((point, index) => (
            <div key={index} className="text-sm text-text-secondary leading-relaxed flex items-start gap-2">
              <span className="text-secondary mt-1.5 text-xs">•</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contributors with @username formatting */}
      <div className="contributors-section">
        <h4 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-full"></span>
          Key Contributors
        </h4>
        <div className="text-based-list space-y-2 pl-4">
          {data.contributors.map((contributor, index) => (
            <div key={index} className="text-sm text-text-secondary leading-relaxed">
              <span className="font-medium text-primary">@{contributor.username}</span>
              <span className="text-text-secondary"> – {contributor.contribution}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment and Health Score - Text-based presentation */}
      <div className="metrics-section border-t border-secondary/20 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sentiment-display bg-surface/50 rounded-lg p-3 border border-secondary/10">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label={`${data.sentiment} sentiment`}>
                {getSentimentEmoji(data.sentiment)}
              </span>
              <div>
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Sentiment</span>
                <div className="text-sm font-semibold text-text-primary">{data.sentiment}</div>
              </div>
            </div>
          </div>
          
          {data.healthScore !== 0 && (
            <div className="health-score-display bg-surface/50 rounded-lg p-3 border border-secondary/10">
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${data.healthScore >= 7 ? 'bg-green-500' : 
                    data.healthScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}
                `}>
                  {data.healthScore}
                </div>
                <div>
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Health Score</span>
                  <div className="text-sm font-semibold text-text-primary">{data.healthLabel}</div>
                </div>
              </div>
            </div>
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
    <div className="loading-display text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-secondary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-secondary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <div className="text-sm text-text-secondary font-medium">{message}</div>
        <div className="text-xs text-text-secondary/70">This may take a few moments...</div>
      </div>
    </div>
  );
}

// Utility component for error states
interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="error-display bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-lg">⚠️</span>
        <div className="text-sm text-red-800">
          <span className="font-medium">Error: </span>
          {error}
        </div>
      </div>
    </div>
  );
}
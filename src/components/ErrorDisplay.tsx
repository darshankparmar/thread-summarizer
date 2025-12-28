'use client';

import { useState } from 'react';
import { UserFriendlyError, ErrorCategory } from '@/services/error-handler';

interface ErrorDisplayProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const categoryIcons = {
  [ErrorCategory.NETWORK]: '🌐',
  [ErrorCategory.API]: '⚙️',
  [ErrorCategory.AI_PROCESSING]: '🤖',
  [ErrorCategory.VALIDATION]: '⚠️',
  [ErrorCategory.RATE_LIMIT]: '⏱️',
  [ErrorCategory.TIMEOUT]: '⏰',
  [ErrorCategory.NOT_FOUND]: '🔍',
  [ErrorCategory.AUTHENTICATION]: '🔐',
  [ErrorCategory.UNKNOWN]: '❓'
};

const categoryColors = {
  [ErrorCategory.NETWORK]: 'border-blue-200/50 bg-blue-50/50 dark:border-blue-400/30 dark:bg-blue-900/20',
  [ErrorCategory.API]: 'border-orange-200/50 bg-orange-50/50 dark:border-orange-400/30 dark:bg-orange-900/20',
  [ErrorCategory.AI_PROCESSING]: 'border-purple-200/50 bg-purple-50/50 dark:border-purple-400/30 dark:bg-purple-900/20',
  [ErrorCategory.VALIDATION]: 'border-yellow-200/50 bg-yellow-50/50 dark:border-yellow-400/30 dark:bg-yellow-900/20',
  [ErrorCategory.RATE_LIMIT]: 'border-indigo-200/50 bg-indigo-50/50 dark:border-indigo-400/30 dark:bg-indigo-900/20',
  [ErrorCategory.TIMEOUT]: 'border-red-200/50 bg-red-50/50 dark:border-red-400/30 dark:bg-red-900/20',
  [ErrorCategory.NOT_FOUND]: 'border-gray-200/50 bg-gray-50/50 dark:border-gray-400/30 dark:bg-gray-900/20',
  [ErrorCategory.AUTHENTICATION]: 'border-red-200/50 bg-red-50/50 dark:border-red-400/30 dark:bg-red-900/20',
  [ErrorCategory.UNKNOWN]: 'border-gray-200/50 bg-gray-50/50 dark:border-gray-400/30 dark:bg-gray-900/20'
};

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = ''
}: ErrorDisplayProps) {
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const icon = categoryIcons[error.category];
  const colorClass = categoryColors[error.category];

  // Handle retry with countdown for rate-limited errors
  const handleRetry = () => {
    if (error.retryAfter && error.retryAfter > 0) {
      setRetryCountdown(error.retryAfter);
      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            if (onRetry) onRetry();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (onRetry) onRetry();
    }
  };

  return (
    <div className={`
      rounded-xl border-2 p-6 backdrop-blur-sm
      ${colorClass} 
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={error.category}>
            {icon}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {error.title}
            </h3>
            <p className="text-text-secondary mt-1 leading-relaxed">
              {error.message}
            </p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="
              text-text-secondary/60 hover:text-text-secondary 
              transition-colors duration-200 p-1 rounded-md
              hover:bg-surface/50
            "
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions */}
      {error.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            What you can try:
          </h4>
          <ul className="space-y-2">
            {error.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="text-primary mt-1 text-xs">•</span>
                <span className="leading-relaxed">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {error.retryable && onRetry && (
          <button
            onClick={handleRetry}
            disabled={retryCountdown !== null}
            className="
              px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg 
              hover:bg-primary/90 active:bg-primary/80
              disabled:bg-gray-400 disabled:cursor-not-allowed 
              transition-all duration-200 transform hover:scale-105 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
              shadow-sm hover:shadow-md
            "
          >
            {retryCountdown !== null ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retry in {retryCountdown}s
              </span>
            ) : (
              'Try Again'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
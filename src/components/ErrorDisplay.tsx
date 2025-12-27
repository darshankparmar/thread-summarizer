'use client';

import { useState } from 'react';
import { UserFriendlyError, ErrorCategory } from '@/services/error-handler';

interface ErrorDisplayProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
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
  [ErrorCategory.NETWORK]: 'border-blue-200 bg-blue-50',
  [ErrorCategory.API]: 'border-orange-200 bg-orange-50',
  [ErrorCategory.AI_PROCESSING]: 'border-purple-200 bg-purple-50',
  [ErrorCategory.VALIDATION]: 'border-yellow-200 bg-yellow-50',
  [ErrorCategory.RATE_LIMIT]: 'border-indigo-200 bg-indigo-50',
  [ErrorCategory.TIMEOUT]: 'border-red-200 bg-red-50',
  [ErrorCategory.NOT_FOUND]: 'border-gray-200 bg-gray-50',
  [ErrorCategory.AUTHENTICATION]: 'border-red-200 bg-red-50',
  [ErrorCategory.UNKNOWN]: 'border-gray-200 bg-gray-50'
};

export default function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showTechnicalDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
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
    <div className={`rounded-lg border-2 p-6 ${colorClass} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={error.category}>
            {icon}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {error.title}
            </h3>
            <p className="text-gray-700 mt-1">
              {error.message}
            </p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
          <h4 className="font-medium text-gray-900 mb-2">What you can try:</h4>
          <ul className="space-y-1">
            {error.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-4">
        {error.retryable && onRetry && (
          <button
            onClick={handleRetry}
            disabled={retryCountdown !== null}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {retryCountdown !== null ? (
              `Retry in ${retryCountdown}s`
            ) : (
              'Try Again'
            )}
          </button>
        )}

        {(showTechnicalDetails || error.technicalDetails) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Technical Details */}
      {showDetails && error.technicalDetails && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Technical Details:</h4>
          <div className="bg-gray-100 rounded p-3 text-sm font-mono text-gray-800 overflow-x-auto">
            {error.technicalDetails}
          </div>
        </div>
      )}

      {/* Category Badge */}
      <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        <span>Error Category: {error.category}</span>
        {error.actionable && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            Actionable
          </span>
        )}
      </div>
    </div>
  );
}
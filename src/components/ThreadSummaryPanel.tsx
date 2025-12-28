'use client';

import { useState } from 'react';
import { SummaryData, ThreadSummaryPanelProps } from '../types';
import { SummaryDisplay, LoadingDisplay, getHealthLabel } from './SummaryDataFormatter';
import ErrorDisplay from './ErrorDisplay';
import { errorHandler, UserFriendlyError } from '@/services/error-handler';

interface ThreadSummaryPanelState {
  isLoading: boolean;
  data: SummaryData | null;
  error: UserFriendlyError | null;
  retryCount: number;
  hasGenerated: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;

export default function ThreadSummaryPanel({ threadId, className = '' }: ThreadSummaryPanelProps) {
  const [state, setState] = useState<ThreadSummaryPanelState>({
    isLoading: false,
    data: null,
    error: null,
    retryCount: 0,
    hasGenerated: false
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchSummaryWithRetry = async (): Promise<SummaryData> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status === 404) {
          throw new Error('Thread not found. Please check the thread ID.');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again.');
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate summary');
      }

      if (!result.data) {
        throw new Error('No summary data received from server');
      }

      // Ensure health label is derived from health score
      return {
        ...result.data,
        healthLabel: getHealthLabel(result.data.healthScore)
      };

    } catch (error) {
      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      // Re-throw other errors as-is
      throw error;
    }
  };

  const generateSummary = async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      data: null, 
      error: null, 
      retryCount: 0 
    }));

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        setState(prev => ({ ...prev, retryCount: attempt }));
        
        const summaryData = await fetchSummaryWithRetry();
        
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          data: summaryData, 
          error: null,
          hasGenerated: true
        }));
        return; // Success - exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Process error through error handler
        const processedError = errorHandler.processError(lastError, 'summary generation');
        
        // Don't retry for non-retryable errors
        if (!errorHandler.isRetryable(processedError)) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: processedError,
            hasGenerated: true
          }));
          return;
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const retryDelay = Math.min(errorHandler.getRetryDelay(processedError), 5000);
          await delay(retryDelay);
        }
      }
    }

    // All retries failed
    if (lastError) {
      const processedError = errorHandler.processError(lastError, 'summary generation after retries');
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: processedError,
        hasGenerated: true
      }));
    }
  };

  const handleRetry = () => {
    generateSummary();
  };

  const handleDismissError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const { isLoading, data, error, retryCount, hasGenerated } = state;

  return (
    <div className={`thread-summary-panel bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Thread Summary</h3>
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            retryCount > 1 ? `Retrying... (${retryCount}/${MAX_RETRY_ATTEMPTS})` : 'Generating...'
          ) : hasGenerated ? 'Re-generate Summary' : 'Generate Summary'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingDisplay />}

      {/* Enhanced Error State */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
          showTechnicalDetails={process.env.NODE_ENV === 'development'}
          className="mb-4"
        />
      )}

      {/* Summary Data Display - Text-based presentation without charts/graphs */}
      {data && <SummaryDisplay data={data} />}
    </div>
  );
}
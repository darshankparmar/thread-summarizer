'use client';

import { useState } from 'react';
import { SummaryData, ThreadSummaryPanelProps } from '../types';
import { SummaryDisplay, LoadingDisplay, getHealthLabel } from './SummaryDataFormatter';

interface ThreadSummaryPanelState {
  isLoading: boolean;
  data: SummaryData | null;
  error: string | null;
  retryCount: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export default function ThreadSummaryPanel({ threadId, className = '' }: ThreadSummaryPanelProps) {
  const [state, setState] = useState<ThreadSummaryPanelState>({
    isLoading: false,
    data: null,
    error: null,
    retryCount: 0
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
          error: null 
        }));
        return; // Success - exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Don't retry for certain types of errors
        if (lastError.message.includes('Thread not found') || 
            lastError.message.includes('Rate limit exceeded')) {
          break;
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt); // Exponential backoff
        }
      }
    }

    // All retries failed
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      error: lastError?.message || 'Failed to generate summary after multiple attempts' 
    }));
  };

  const { isLoading, data, error, retryCount } = state;

  return (
    <div className={`thread-summary-panel bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Thread Summary</h3>
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            retryCount > 1 ? `Retrying... (${retryCount}/${MAX_RETRY_ATTEMPTS})` : 'Generating...'
          ) : 'Generate Summary'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingDisplay />}

      {/* Error State with Retry Option */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-red-800">Error generating summary</h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <button
                  onClick={generateSummary}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Data Display - Text-based presentation without charts/graphs */}
      {data && <SummaryDisplay data={data} />}
    </div>
  );
}
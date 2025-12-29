'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SummaryData, ThreadSummaryPanelProps } from '../types';
import { SummaryDisplay, LoadingDisplay, getHealthLabel } from './SummaryDataFormatter';
import ErrorDisplay from './ErrorDisplay';
import { errorHandler, UserFriendlyError } from '@/services/error-handler';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface ThreadSummaryPanelState {
  isLoading: boolean;
  data: SummaryData | null;
  error: UserFriendlyError | null;
  retryCount: number;
  hasGenerated: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;

export default function ThreadSummaryPanel({ threadId, className = '' }: ThreadSummaryPanelProps) {
  const { data: session, status } = useSession();
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
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in to use AI features.');
        } else if (response.status === 429) {
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

  // Show authentication required message if not signed in
  if (status !== 'loading' && !session) {
    return (
      <Card className={`thread-summary-panel ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            AI Thread Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-center py-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="font-semibold text-text-primary mb-2">
                Sign In Required
              </h3>
              <p className="text-text-secondary mb-4">
                AI-powered thread analysis requires authentication. Sign in to unlock intelligent summaries, sentiment analysis, and key insights.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`}
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth/signup'}
                  variant="outline"
                >
                  Create Account
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`thread-summary-panel ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            AI Thread Summary
          </CardTitle>
          <Button
            onClick={generateSummary}
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {retryCount > 1 ? `Retrying... (${retryCount}/${MAX_RETRY_ATTEMPTS})` : 'Generating...'}
              </span>
            ) : hasGenerated ? 'Re-generate Summary' : 'Generate Summary'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && <LoadingDisplay />}

        {/* Enhanced Error State */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            className="mb-6"
          />
        )}

        {/* Summary Data Display - Text-based presentation without charts/graphs */}
        {data && <SummaryDisplay data={data} />}
      </CardContent>
    </Card>
  );
}
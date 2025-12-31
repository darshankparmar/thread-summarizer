'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SummaryDisplay, LoadingDisplay } from './SummaryDataFormatter';
import { getHealthLabel } from '@/shared/lib/utils/formatters';
import ErrorDisplay from '@/shared/components/feedback/ErrorDisplay';
import { errorHandler, UserFriendlyError } from '@/services/error-handler';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/ui/spinner';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { SummaryData, ThreadSummaryPanelProps } from '@/shared/types/common';
import { clientApi, ClientApiError } from '@/services/client-api';

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

      const response = await clientApi.summarizeThread(threadId);

      clearTimeout(timeoutId);

      if (!response.success) {
        // Handle specific error cases
        if (response.error?.includes('Authentication required')) {
          throw new ClientApiError('Authentication required. Please sign in to use AI features.', 401);
        } else if (response.error?.includes('Rate limit')) {
          throw new ClientApiError('Rate limit exceeded. Please wait a moment before trying again.', 429);
        } else if (response.error?.includes('not found')) {
          throw new ClientApiError('Thread not found. Please check the thread ID.', 404);
        } else {
          throw new ClientApiError(response.error || 'Failed to generate summary');
        }
      }

      if (!response.data) {
        throw new ClientApiError('No summary data received from server');
      }

      // Ensure health label is derived from health score
      return {
        ...response.data,
        healthLabel: getHealthLabel(response.data.healthScore)
      };

    } catch (error) {
      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ClientApiError('Request timed out. Please try again.');
      }

      // Handle ClientApiError
      if (error instanceof ClientApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ClientApiError('Network error. Please check your connection and try again.');
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
        lastError = error instanceof ClientApiError ? error : new ClientApiError('Unknown error occurred');
        
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
    <Card 
      // className={`thread-summary-panel ${className}`}
      className={`thread-summary-panel flex flex-col h-full max-h-[calc(100vh-100px)] ${className}`}
    >
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                <Spinner size="sm" className="h-4 w-4" />
                {retryCount > 1 ? `Retrying... (${retryCount}/${MAX_RETRY_ATTEMPTS})` : 'Generating...'}
              </span>
            ) : hasGenerated ? 'Re-generate Summary' : 'Generate Summary'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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

        {!data && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4 opacity-20">📊</div>
            <p className="text-text-secondary text-sm">
              Click generate to see AI insights <br/> for this conversation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
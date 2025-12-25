'use client';

import { useState, useEffect } from 'react';
import { ForumsThread, ForumsPost } from '@/types';
import ThreadSummaryPanel from '@/components/ThreadSummaryPanel';

interface ThreadPageProps {
  params: {
    id: string;
  };
}

interface ThreadPageState {
  thread: ForumsThread | null;
  posts: ForumsPost[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

export default function ThreadPage({ params }: ThreadPageProps) {
  const [state, setState] = useState<ThreadPageState>({
    thread: null,
    posts: [],
    isLoading: true,
    error: null,
    retryCount: 0
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchThreadDataWithRetry = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`/api/thread/${params.id}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Thread not found. Please check the thread ID.');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again.');
        } else {
          throw new Error(`Failed to fetch thread: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch thread data');
      }

      return { thread: data.thread, posts: data.posts };

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

  const fetchThreadData = async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      retryCount: 0 
    }));

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        setState(prev => ({ ...prev, retryCount: attempt }));
        
        const { thread, posts } = await fetchThreadDataWithRetry();
        
        setState({
          thread,
          posts,
          isLoading: false,
          error: null,
          retryCount: 0
        });
        return; // Success - exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Don't retry for 404 errors
        if (lastError.message.includes('Thread not found')) {
          break;
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt);
        }
      }
    }

    // All retries failed
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: lastError?.message || 'Failed to fetch thread data after multiple attempts'
    }));
  };

  useEffect(() => {
    fetchThreadData();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { thread, posts, isLoading, error, retryCount } = state;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          {retryCount > 1 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Retrying... (attempt {retryCount}/{MAX_RETRY_ATTEMPTS})
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h1 className="text-lg font-medium text-red-800 mb-2">Error Loading Thread</h1>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={fetchThreadData}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-yellow-800 mb-2">Thread Not Found</h1>
            <p className="text-yellow-600 mb-4">The requested thread could not be found.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Thread Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{thread.title}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>Started by @{thread.user.username}</span>
            <span className="mx-2">•</span>
            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>{posts.length} {posts.length === 1 ? 'reply' : 'replies'}</span>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>

        {/* AI Summary Panel - Integrated with thread content */}
        <ThreadSummaryPanel 
          threadId={params.id} 
          className="mb-6"
        />

        {/* Thread Posts */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium text-gray-900">@{post.user.username}</span>
                  <span className="mx-2">•</span>
                  <span>Reply #{index + 1}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{post.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state for threads with no posts */}
        {posts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-500">No replies yet. Be the first to respond!</p>
          </div>
        )}
      </div>
    </div>
  );
}
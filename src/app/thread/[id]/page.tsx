'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ForumsThread, ForumsPost } from '@/types';
import ThreadSummaryPanel from '@/components/ThreadSummaryPanel';
import Avatar from '@/components/Avatar';
import ThreadTags from '@/components/ThreadTags';
import ThreadStatus from '@/components/ThreadStatus';
import PostEngagement from '@/components/PostEngagement';

interface ThreadPageState {
  thread: ForumsThread | null;
  posts: ForumsPost[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

export default function ThreadPage() {
  const params = useParams();
  const id = params.id as string;

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

      const response = await fetch(`/api/thread/${id}`, {
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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Thread Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          {/* Thread Status Indicators */}
          <ThreadStatus pinned={thread.pinned} locked={thread.locked} className="mb-3" />

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{thread.title}</h1>
          
          {/* Thread Tags */}
          <ThreadTags tags={thread.tags || []} className="mb-4" />

          {/* Thread Author Info with Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 mb-4 gap-2 sm:gap-0">
            <div className="flex items-center">
              <Avatar 
                src={thread.user.avatar} 
                username={thread.user.username} 
                size="sm" 
                className="mr-2" 
              />
              <span>Started by @{thread.user.username}</span>
            </div>
            <span className="hidden sm:inline mx-2">•</span>
            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
            {thread.updatedAt && thread.updatedAt !== thread.createdAt && (
              <>
                <span className="hidden sm:inline mx-2">•</span>
                <span className="text-gray-400">Updated {new Date(thread.updatedAt).toLocaleDateString()}</span>
              </>
            )}
            <span className="hidden sm:inline mx-2">•</span>
            <span>{posts.length} {posts.length === 1 ? 'reply' : 'replies'}</span>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>

        {/* AI Summary Panel - Integrated with thread content */}
        <ThreadSummaryPanel
          threadId={id}
          className="mb-6"
        />

        {/* Thread Posts */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 ${
                post.bestAnswer 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              {/* Best Answer Badge */}
              {post.bestAnswer && (
                <div className="flex items-center mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Best Answer
                  </span>
                </div>
              )}

              {/* Post Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                <div className="flex items-center text-sm text-gray-500">
                  {/* User Avatar and Info */}
                  <div className="flex items-center">
                    <Avatar 
                      src={post.user?.avatar} 
                      username={post.user?.username || 'Unknown User'} 
                      size="md" 
                      className="mr-3" 
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">@{post.user?.username || 'Unknown User'}</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <span>Reply #{index + 1}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="italic">edited</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Engagement */}
                <PostEngagement likes={post.likes} upvotes={post.upvotes} />
              </div>

              {/* Post Content */}
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{post.body}</p>
              </div>

              {/* Nested Replies Indicator */}
              {post.parentId && (
                <div className="mt-3 text-xs text-gray-500 italic">
                  <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L3 11.414V13a1 1 0 11-2 0V9a1 1 0 011-1h4a1 1 0 110 2H4.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Reply to previous post
                </div>
              )}
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
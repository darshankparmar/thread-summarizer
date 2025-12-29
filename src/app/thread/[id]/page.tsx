'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ForumsThread, ForumsPost } from '@/types';
import ThreadSummaryPanel from '@/components/ThreadSummaryPanel';
import Avatar from '@/components/Avatar';
import ThreadTags from '@/components/ThreadTags';
import ThreadStatus from '@/components/ThreadStatus';
import PostCard from '@/components/PostCard';
import PostEngagement from '@/components/PostEngagement';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ThreadPageState {
  thread: ForumsThread | null;
  posts: ForumsPost[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

type SortOption = 'newest' | 'oldest' | 'popular';

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

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showRepliesFor, setShowRepliesFor] = useState<Set<string>>(new Set());

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

  // Organize posts into threads (parent posts and their replies)
  const organizedPosts = () => {
    const parentPosts = posts.filter(post => !post.parentId);
    const childPosts = posts.filter(post => post.parentId);
    
    return parentPosts.map(parent => ({
      parent,
      replies: childPosts.filter(child => child.parentId === parent.id)
    }));
  };

  // Sort posts based on selected option
  const sortedPosts = () => {
    const organized = organizedPosts();
    
    return organized.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.parent.createdAt).getTime() - new Date(a.parent.createdAt).getTime();
        case 'oldest':
          return new Date(a.parent.createdAt).getTime() - new Date(b.parent.createdAt).getTime();
        case 'popular':
          const aLikes = (a.parent.likes?.length || 0) + (a.parent.upvotes?.length || 0);
          const bLikes = (b.parent.likes?.length || 0) + (b.parent.upvotes?.length || 0);
          return bLikes - aLikes;
        default:
          return 0;
      }
    });
  };

  const toggleReplies = (postId: string) => {
    setShowRepliesFor(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded mb-4"></div>
            <div className="h-4 bg-surface rounded mb-2"></div>
            <div className="h-4 bg-surface rounded mb-8"></div>
            <div className="h-32 bg-surface rounded"></div>
          </div>
          {retryCount > 1 && (
            <div className="mt-4 text-center text-sm text-text-secondary">
              Retrying... (attempt {retryCount}/{MAX_RETRY_ATTEMPTS})
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h1 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Thread</h1>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={fetchThreadData}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-surface text-text-primary border border-secondary/30 rounded-md hover:bg-secondary/20 transition-colors"
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
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Thread Not Found</h1>
            <p className="text-yellow-600 dark:text-yellow-300 mb-4">The requested thread could not be found.</p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout: Two Column Grid */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2">
            {/* Thread Header */}
            <div className="bg-surface rounded-lg shadow-sm border border-secondary/20 p-4 sm:p-6 mb-6">
              {/* Thread Status Indicators */}
              <ThreadStatus pinned={thread.pinned} locked={thread.locked} className="mb-3" />

              <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">{thread.title}</h1>
              
              {/* Thread Tags */}
              <ThreadTags tags={thread.tags || []} className="mb-4" />

              {/* Thread Author Info with Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-text-secondary mb-4 gap-2 sm:gap-0">
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
                <span>{new Date(thread.createdAt).toLocaleString()}</span>
              </div>

              {/* Thread Stats */}
              <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{thread.views || 0} views</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{posts.length} {posts.length === 1 ? 'reply' : 'replies'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{(thread.likes?.length || 0) + (thread.upvotes?.length || 0)} likes</span>
                </div>
              </div>
              
              <div className="prose max-w-none mb-4">
                <p className="text-text-secondary whitespace-pre-wrap">{thread.body}</p>
              </div>

              {/* Thread Engagement */}
              <PostEngagement 
                likes={thread.likes || []}
                upvotes={thread.upvotes || []}
                className="border-t border-secondary/20 pt-4"
              />
            </div>

            {/* Mobile AI Summary - Show only on mobile */}
            <div className="lg:hidden mb-6">
              <ThreadSummaryPanel
                threadId={id}
                className=""
              />
            </div>

            {/* Thread Posts Header with Sort Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Discussion ({posts.length} {posts.length === 1 ? 'reply' : 'replies'})
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Thread Posts with Threading */}
            <div className="space-y-6">
              {sortedPosts().map(({ parent, replies }) => (
                <div key={parent.id} className="space-y-4">
                  {/* Parent Post */}
                  <div className="bg-surface rounded-lg shadow-sm border border-secondary/20">
                    <PostCard 
                      post={parent} 
                      showReplyButton={true}
                      onReply={(postId) => console.log('Reply to:', postId)}
                    />
                    
                    {/* Reply Actions */}
                    {replies.length > 0 && (
                      <div className="px-4 pb-4 border-t border-secondary/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReplies(parent.id)}
                          className="text-text-secondary hover:text-text-primary"
                        >
                          <svg className={`w-4 h-4 mr-2 transition-transform ${showRepliesFor.has(parent.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {showRepliesFor.has(parent.id) ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Replies */}
                  {showRepliesFor.has(parent.id) && replies.length > 0 && (
                    <div className="ml-8 space-y-4">
                      {replies
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((reply) => (
                          <div key={reply.id} className="relative">
                            {/* Reply indicator line */}
                            <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-primary/30"></div>
                            <div className="absolute -left-8 top-6 w-6 h-0.5 bg-primary/30"></div>
                            
                            <PostCard 
                              post={reply} 
                              isReply={true}
                              showReplyButton={true}
                              onReply={(postId) => console.log('Reply to:', postId)}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty state for threads with no posts */}
            {posts.length === 0 && (
              <div className="bg-surface rounded-lg shadow-sm border border-secondary/20 p-8 text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-text-primary mb-2">No replies yet</h3>
                <p className="text-text-secondary mb-4">Be the first to join the conversation!</p>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Reply
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Desktop AI Summary */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <ThreadSummaryPanel
                threadId={id}
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ForumsThread } from '@/types';
import Avatar from '@/components/Avatar';
import ThreadTags from '@/components/ThreadTags';
import ThreadStatus from '@/components/ThreadStatus';

interface ThreadsResponse {
  success: boolean;
  threads: ForumsThread[];
  count: number;
  error?: string;
}

export default function Home() {
  const [threads, setThreads] = useState<ForumsThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch('/api/threads');
        const data: ThreadsResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch threads');
        }

        setThreads(data.threads);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Thread Summarizer
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered forum thread analysis and summarization
            </p>
          </div>
          
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available threads...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Thread Summarizer
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered forum thread analysis and summarization
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-red-800 mb-2">Unable to Load Threads</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thread Summarizer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered forum thread analysis and summarization
          </p>
        </div>

        {/* Threads Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Available Threads</h2>
          
          {threads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No threads available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/thread/${thread.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Thread Status */}
                  <ThreadStatus pinned={thread.pinned} locked={thread.locked} className="mb-3" />
                  
                  {/* Thread Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                    {thread.title}
                  </h3>
                  
                  {/* Thread Tags */}
                  <ThreadTags tags={thread.tags || []} className="mb-4" />
                  
                  {/* Thread Preview */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {thread.body.length > 200 
                      ? `${thread.body.substring(0, 200)}...` 
                      : thread.body
                    }
                  </p>
                  
                  {/* Thread Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{thread.views} views</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{thread._count?.Post || 0} replies</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{(thread.likes?.length || 0) + (thread.upvotes?.length || 0)} likes</span>
                    </div>
                  </div>
                  
                  {/* Thread Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Avatar 
                        src={thread.user.avatar} 
                        username={thread.user.username} 
                        size="sm" 
                        className="mr-2" 
                      />
                      <span>by {thread.user.displayName || thread.user.username}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {thread.updatedAt !== thread.createdAt 
                          ? `Updated ${new Date(thread.updatedAt).toLocaleString()}`
                          : `Created ${new Date(thread.createdAt).toLocaleString()}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Analyze Thread</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Have a specific thread in mind?
          </h3>
          <p className="text-gray-600 mb-4">
            Enter a thread ID directly to analyze any thread from Foru.ms
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter thread ID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    window.location.href = `/thread/${input.value.trim()}`;
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[placeholder="Enter thread ID..."]') as HTMLInputElement;
                if (input?.value.trim()) {
                  window.location.href = `/thread/${input.value.trim()}`;
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

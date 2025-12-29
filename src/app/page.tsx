'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ForumsThread } from '@/types';
import Avatar from '@/components/Avatar';
import ThreadTags from '@/components/ThreadTags';
import ThreadStatus from '@/components/ThreadStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-secondary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-secondary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-text-secondary font-medium">Loading available threads...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <AlertTitle className="text-xl mb-3">Unable to Load Threads</AlertTitle>
            <AlertDescription className="mb-6 leading-relaxed">{error}</AlertDescription>
            <Button
              onClick={() => window.location.reload()}
              variant="destructive"
              size="lg"
            >
              Try Again
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Welcome to ThreadWise
          </h1>
          <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-2xl mx-auto">
            Discover and analyze forum discussions with AI-powered insights. Get instant summaries, key points, and sentiment analysis.
          </p>
        </div>

        {/* Threads Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3">
            <span className="w-3 h-3 bg-primary rounded-full"></span>
            Available Threads
          </h2>
          
          {threads.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-text-secondary">No threads available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/thread/${thread.id}`}
                  className="
                    block bg-surface rounded-xl shadow-sm border border-secondary/20 p-6 
                    hover:border-primary/40 hover:shadow-lg hover:scale-[1.02]
                    transition-all duration-300 backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                  "
                >
                  {/* Thread Status */}
                  <ThreadStatus pinned={thread.pinned} locked={thread.locked} className="mb-4" />
                  
                  {/* Thread Title */}
                  <h3 className="text-xl font-semibold text-text-primary mb-4 hover:text-primary transition-colors leading-relaxed">
                    {thread.title}
                  </h3>
                  
                  {/* Thread Tags */}
                  <ThreadTags tags={thread.tags || []} className="mb-4" />
                  
                  {/* Thread Preview */}
                  <p className="text-text-secondary mb-6 line-clamp-3 leading-relaxed">
                    {thread.body.length > 200 
                      ? `${thread.body.substring(0, 200)}...` 
                      : thread.body
                    }
                  </p>
                  
                  {/* Thread Stats */}
                  <div className="flex items-center gap-6 text-sm text-text-secondary mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{thread.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{thread._count?.Post || 0} replies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{(thread.likes?.length || 0) + (thread.upvotes?.length || 0)} likes</span>
                    </div>
                  </div>
                  
                  {/* Thread Meta */}
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center">
                      <Avatar 
                        src={thread.user.avatar} 
                        username={thread.user.username} 
                        size="sm" 
                        className="mr-3" 
                      />
                      <span>by @{thread.user.username}</span>
                      <span className="mx-2 text-secondary">•</span>
                      <span>{`Created ${new Date(thread.createdAt).toLocaleString()}`}</span>
                    </div>
                    {/* 
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Analyze Thread</span>
                    </div> 
                    */}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <Card className="text-center">
          <CardHeader>
            <div className="text-4xl mb-4">🔍</div>
            <CardTitle>Have a specific thread in mind?</CardTitle>
            <CardDescription>
              Enter a thread ID directly to analyze any thread from Foru.ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Enter thread ID..."
                className="rounded-r-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      window.location.href = `/thread/${input.value.trim()}`;
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter thread ID..."]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    window.location.href = `/thread/${input.value.trim()}`;
                  }
                }}
                className="rounded-l-none"
                size="default"
              >
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

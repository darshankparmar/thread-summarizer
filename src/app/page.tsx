'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ForumsThread, ForumsTag } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, Input } from '@/components/ui';
import SearchFilters, { SortOption, ViewMode, DateFilter, EngagementFilter } from '@/components/SearchFilters';
import ThreadGrid from '@/components/ThreadGrid';

interface ThreadsResponse {
  success: boolean;
  threads: ForumsThread[];
  count: number;
  nextCursor?: string;
  error?: string;
}

export default function Home() {
  const [threads, setThreads] = useState<ForumsThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<ForumsTag[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [engagementFilter, setEngagementFilter] = useState<EngagementFilter>('all');

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    if (!threads || !Array.isArray(threads) || threads.length === 0) {
      return [];
    }

    let filtered = threads.filter(Boolean);

    // Apply search filter (full-text search)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(query) ||
        thread.body.toLowerCase().includes(query) ||
        thread.user.username.toLowerCase().includes(query) ||
        thread.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Apply author filter
    if (authorFilter.trim()) {
      const author = authorFilter.toLowerCase();
      filtered = filtered.filter(thread =>
        thread.user.username.toLowerCase().includes(author)
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(thread =>
        new Date(thread.createdAt) >= filterDate
      );
    }

    // Apply engagement filter
    if (engagementFilter !== 'all') {
      if (engagementFilter === 'popular') {
        filtered = filtered.filter(thread => {
          const engagement = (thread.likes?.length || 0) + (thread.upvotes?.length || 0);
          return engagement >= 5; // Threshold for "popular"
        });
      } else if (engagementFilter === 'trending') {
        filtered = filtered.filter(thread => {
          const engagement = (thread.likes?.length || 0) + (thread.upvotes?.length || 0) + (thread._count?.Post || 0);
          const recency = Date.now() - new Date(thread.updatedAt || thread.createdAt).getTime();
          const trendingScore = engagement / (recency / 86400000 + 1); // Engagement per day
          return trendingScore >= 1; // Threshold for "trending"
        });
      }
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      const selectedTagIds = selectedTags.map(tag => tag.id);
      filtered = filtered.filter(thread =>
        thread.tags?.some(tag => selectedTagIds.includes(tag.id))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          const aLikes = (a.likes?.length || 0) + (a.upvotes?.length || 0);
          const bLikes = (b.likes?.length || 0) + (b.upvotes?.length || 0);
          return bLikes - aLikes;
        case 'trending':
          // Trending = recent activity + engagement
          const aScore = (a.likes?.length || 0) + (a.upvotes?.length || 0) + (a._count?.Post || 0);
          const bScore = (b.likes?.length || 0) + (b.upvotes?.length || 0) + (b._count?.Post || 0);
          const aRecency = Date.now() - new Date(a.updatedAt || a.createdAt).getTime();
          const bRecency = Date.now() - new Date(b.updatedAt || b.createdAt).getTime();
          return (bScore / (bRecency / 86400000 + 1)) - (aScore / (aRecency / 86400000 + 1));
        default:
          return 0;
      }
    });

    return sorted;
  }, [threads, searchQuery, selectedTags, sortBy, authorFilter, dateFilter, engagementFilter]);

  const fetchThreads = useCallback(async (cursor?: string, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const url = new URL('/api/threads', window.location.origin);
      if (cursor) url.searchParams.set('cursor', cursor);
      url.searchParams.set('limit', '20');

      const response = await fetch(url.toString());
      const data: ThreadsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch threads');
      }

      // Ensure threads is always an array
      const fetchedThreads = Array.isArray(data.threads) ? data.threads : [];

      if (append) {
        setThreads(prev => {
          const prevThreads = Array.isArray(prev) ? prev : [];
          return [...prevThreads, ...fetchedThreads];
        });
      } else {
        setThreads(fetchedThreads);
      }

      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Ensure threads is still an array even on error
      if (!append) {
        setThreads([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (nextCursor && hasMore && !loadingMore) {
      fetchThreads(nextCursor, true);
    }
  }, [nextCursor, hasMore, loadingMore, fetchThreads]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setSortBy('newest');
    setAuthorFilter('');
    setDateFilter('all');
    setEngagementFilter('all');
    setShowAdvancedFilters(false);
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Check if there are active filters
  const hasActiveFilters = Boolean(searchQuery || selectedTags.length > 0 || authorFilter || dateFilter !== 'all' || engagementFilter !== 'all');

  // Create empty state configuration
  const emptyState = {
    icon: hasActiveFilters ? '🔍' : '💬',
    title: hasActiveFilters ? 'No threads found' : 'No threads available',
    description: hasActiveFilters
      ? 'Try adjusting your search criteria or filters to find more results.'
      : 'No threads available at the moment.',
    action: hasActiveFilters ? {
      label: 'Clear All Filters',
      onClick: clearFilters
    } : undefined
  };

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

        {/* Search and Filters */}
        <div className="mb-3">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
            authorFilter={authorFilter}
            onAuthorFilterChange={setAuthorFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            engagementFilter={engagementFilter}
            onEngagementFilterChange={setEngagementFilter}
            filteredCount={filteredAndSortedThreads.length}
            totalCount={threads.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Tag Selector */}
        {/* <div className="mb-8">
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div> */}

        {/* Threads Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3">
            <svg
              width="12"
              height="12"
              className="shrink-0"
              style={{ fill: 'var(--color-primary)' }}
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r="6" />
            </svg>
            Available Threads
          </h2>

          <ThreadGrid
            threads={filteredAndSortedThreads}
            viewMode={viewMode}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            emptyState={emptyState}
          />
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
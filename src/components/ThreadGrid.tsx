'use client';

import { ForumsThread } from '@/types';
import ThreadCard from './ThreadCard';
import { Button } from '@/components/ui/button';
import { ViewMode } from './SearchFilters';

interface ThreadGridProps {
  threads: ForumsThread[];
  viewMode: ViewMode;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  emptyState?: {
    icon: string;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export default function ThreadGrid({
  threads,
  viewMode,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyState
}: ThreadGridProps) {
  if (threads.length === 0 && emptyState) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 p-8 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4">{emptyState.icon}</div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          {emptyState.title}
        </h3>
        <p className="text-text-secondary mb-4">
          {emptyState.description}
        </p>
        {emptyState.action && (
          <Button variant="outline" onClick={emptyState.action.onClick}>
            {emptyState.action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {threads.map((thread) => (
          <ThreadCard 
            key={thread.id} 
            thread={thread} 
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={onLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2"></div>
                Loading more...
              </>
            ) : (
              'Load More Threads'
            )}
          </Button>
        </div>
      )}
    </>
  );
}
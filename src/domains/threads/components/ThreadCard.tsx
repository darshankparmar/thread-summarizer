'use client';

import Link from 'next/link';
import { ForumsThread } from '@/domains/threads/types';
import Avatar from '@/shared/components/common/Avatar';
import { ViewMode } from '@/shared/components/common/SearchFilters';
import ThreadStatus from './ThreadStatus';
import ThreadTags from './ThreadTags';
import { RichTextDisplay } from '@/components/RichTextDisplay';

interface ThreadCardProps {
  thread: ForumsThread;
  viewMode: ViewMode;
}

export default function ThreadCard({ thread, viewMode }: ThreadCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const totalEngagement = (thread.likes?.length || 0) + (thread.upvotes?.length || 0);

  return (
    <Link
      href={`/thread/${thread.id}`}
      className={`
        block bg-surface rounded-xl shadow-sm border border-secondary/20 p-6 
        hover:border-primary/40 hover:shadow-lg hover:scale-[1.02]
        transition-all duration-300 backdrop-blur-sm
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${viewMode === 'grid' ? 'h-full flex flex-col' : ''}
      `}
    >
      {/* Thread Status */}
      <ThreadStatus pinned={thread.pinned} locked={thread.locked} className="mb-4" />
      
      {/* Thread Title */}
      <h3 className={`font-semibold text-text-primary mb-4 hover:text-primary transition-colors leading-relaxed ${
        viewMode === 'grid' ? 'text-lg line-clamp-2' : 'text-xl'
      }`}>
        {thread.title}
      </h3>
      
      {/* Thread Tags */}
      <ThreadTags tags={thread.tags || []} className="mb-4" />
      
      {/* Thread Preview */}
      <div className={`text-text-secondary mb-6 leading-relaxed ${
        viewMode === 'grid' ? 'text-sm line-clamp-4 flex-grow' : 'line-clamp-3'
      }`}>
        {thread.body.length > (viewMode === 'grid' ? 120 : 200)
          ? <RichTextDisplay content={`${thread.body.substring(0, viewMode === 'grid' ? 120 : 200)}...`} />
          : <RichTextDisplay content={thread.body} />
        }
      </div>
      
      {/* Thread Stats */}
      <div className={`flex items-center text-sm text-text-secondary mb-4 ${
        viewMode === 'grid' ? 'flex-wrap gap-3' : 'gap-4'
      }`}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{thread.views || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{thread._count?.Post || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{totalEngagement}</span>
        </div>
      </div>
      
      {/* Thread Meta */}
      <div className={`flex items-center text-sm text-text-secondary mt-auto ${
        viewMode === 'grid' ? 'flex-col items-start gap-2' : 'justify-between'
      }`}>
        <div className="flex items-center">
          <Avatar 
            src={thread.user.avatar} 
            username={thread.user.username} 
            size="sm" 
            className="mr-3" 
          />
          <span>@{thread.user.username}</span>
          <span className="mx-2 text-secondary">•</span>
          <span>{formatDate(thread.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
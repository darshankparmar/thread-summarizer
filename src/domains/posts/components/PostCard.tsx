'use client';

import { useState } from 'react';
import { ForumsPost } from '@/shared/types';
import Avatar from '@/shared/components/common/Avatar';
import PostEngagement from './PostEngagement';

interface PostCardProps {
  post: ForumsPost;
  isReply?: boolean;
  showReplyButton?: boolean;
  onReply?: (postId: string) => void;
}

const PREVIEW_LENGTH = 300; // Characters to show before "Show more"

export default function PostCard({ post, isReply = false, showReplyButton = false, onReply }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = post.body.length > PREVIEW_LENGTH;
  const displayBody = shouldTruncate && !isExpanded
    ? post.body.substring(0, PREVIEW_LENGTH) + '...'
    : post.body;

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`rounded-lg shadow-sm border p-4 sm:p-6 transition-all duration-200 hover:shadow-md ${
      post.bestAnswer
        ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
        : isReply 
          ? 'border-secondary/10 bg-surface/50'
          : 'border-secondary/20 bg-surface'
    }`}>

      {/* Best Answer Badge */}
      {post.bestAnswer && (
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Best Answer
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-text-secondary gap-2 sm:gap-0">
          <div className="flex items-center">
            <Avatar
              src={post.user?.avatar}
              username={post.user?.username || 'Unknown User'}
              size="sm"
              className="mr-2"
            />
            <span className="font-medium">@{post.user?.username || "guest"}</span>
          </div>
          <span className="hidden sm:inline mx-2">•</span>
          <span>{getTimeAgo(post.createdAt)}</span>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <>
              <span className="hidden sm:inline mx-2">•</span>
              <div className="text-xs text-text-secondary">
                <span className="italic">edited {getTimeAgo(post.updatedAt)}</span>
              </div>
            </>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-2">
          {showReplyButton && onReply && (
            <button
              onClick={() => onReply(post.id)}
              className="text-text-secondary hover:text-primary text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="prose max-w-none mb-4">
        <div className="text-text-primary whitespace-pre-wrap leading-relaxed">
          {displayBody}
        </div>

        {/* Show More/Less Button */}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Post Engagement */}
      <PostEngagement 
        likes={post.likes || []} 
        upvotes={post.upvotes || []} 
        className="border-t border-secondary/20 pt-4"
      />

      {/* Reply Indicator for nested posts */}
      {post.parentId && (
        <div className="flex items-center text-xs text-text-secondary bg-secondary/10 rounded px-2 py-1 w-fit mt-2">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L3 11.414V13a1 1 0 11-2 0V9a1 1 0 011-1h4a1 1 0 110 2H4.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Reply to previous post</span>
        </div>
      )}
    </div>
  );
}
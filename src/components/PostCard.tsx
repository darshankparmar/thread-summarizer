'use client';

import { useState } from 'react';
import { ForumsPost } from '@/types';
import Avatar from './Avatar';
import PostEngagement from './PostEngagement';

interface PostCardProps {
  post: ForumsPost;
  isLatest?: boolean;
}

const PREVIEW_LENGTH = 300; // Characters to show before "Show more"

export default function PostCard({ post, isLatest = false }: PostCardProps) {
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
    <div className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 transition-all duration-200 hover:shadow-md ${
      post.bestAnswer 
        ? 'border-green-200 bg-green-50' 
        : 'border-gray-200'
    } ${isLatest ? 'ring-2 ring-blue-100 border-blue-200' : ''}`}>
      
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

      {/* Latest Post Badge */}
      {isLatest && (
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Latest
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
        <div className="flex items-start">
          <Avatar 
            src={post.user?.avatar} 
            username={post.user?.username || 'Unknown User'} 
            size="md" 
            className="mr-3 flex-shrink-0" 
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 truncate">
                {post.user?.displayName || post.user?.username || 'Unknown User'}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {getTimeAgo(post.createdAt)}
              </span>
            </div>
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <div className="text-xs text-gray-400">
                <span className="italic">edited {getTimeAgo(post.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Post Engagement */}
        <div className="flex-shrink-0">
          <PostEngagement likes={post.likes} upvotes={post.upvotes} />
        </div>
      </div>

      {/* Post Content */}
      <div className="prose max-w-none mb-4">
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {displayBody}
        </div>
        
        {/* Show More/Less Button */}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Nested Replies Indicator */}
      {post.parentId && (
        <div className="flex items-center text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 w-fit">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L3 11.414V13a1 1 0 11-2 0V9a1 1 0 011-1h4a1 1 0 110 2H4.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Reply to previous post</span>
        </div>
      )}
    </div>
  );
}
import { ForumsLike, ForumsUpvote } from '@/shared/types';

interface PostEngagementProps {
  likes?: ForumsLike[];
  upvotes?: ForumsUpvote[];
  className?: string;
}

export default function PostEngagement({ likes, upvotes, className = '' }: PostEngagementProps) {
  const hasLikes = likes && likes.length > 0;
  const hasUpvotes = upvotes && upvotes.length > 0;

  if (!hasLikes && !hasUpvotes) {
    return null;
  }

  return (
    <div className={`flex items-center gap-4 text-sm text-text-secondary ${className}`}>
      {/* Likes */}
      {hasLikes && (
        <div className="flex items-center hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <svg className="w-4 h-4 mr-1 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span>{likes.length}</span>
        </div>
      )}

      {/* Upvotes */}
      {hasUpvotes && (
        <div className="flex items-center hover:text-green-500 dark:hover:text-green-400 transition-colors">
          <svg className="w-4 h-4 mr-1 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span>{upvotes.length}</span>
        </div>
      )}
    </div>
  );
}
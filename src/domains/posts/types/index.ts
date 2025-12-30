/**
 * Post Domain Types
 */

// Import types for local use
import type { ForumsPost } from '@/shared/types';

// Re-export post-related types from shared types
export type { ForumsPost, ForumsLike, ForumsUpvote } from '@/shared/types';

// Post-specific component props
export interface PostCardProps {
  post: ForumsPost;
  threadId: string;
}

export interface PostItemProps {
  post: ForumsPost;
  threadId: string;
  level?: number;
  onReply?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export interface PostComposerProps {
  threadId: string;
  parentId?: string;
  onSubmit: (data: CreatePostData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export interface CreatePostData {
  body: string;
  parentId?: string;
}

export interface PostEngagementProps {
  post: ForumsPost;
  onLike?: () => void;
  onUpvote?: () => void;
}
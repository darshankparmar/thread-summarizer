/**
 * Thread Domain Types
 */

// Import types for local use
import type { ForumsThread, ForumsTag } from '@/shared/types';

// Re-export thread-related types from shared types
export type { ForumsThread, ForumsTag, ForumsLike, ForumsUpvote } from '@/shared/types';

// Thread-specific component props
export interface ThreadCardProps {
  thread: ForumsThread;
  viewMode: 'list' | 'grid';
}

export interface ThreadGridProps {
  threads: ForumsThread[];
  viewMode: 'list' | 'grid';
  loading?: boolean;
}

export interface ThreadComposerProps {
  onSubmit: (data: CreateThreadData) => Promise<void>;
  loading?: boolean;
}

export interface CreateThreadData {
  title: string;
  body: string;
  tags?: string[];
}

export interface ThreadStatusProps {
  pinned?: boolean;
  locked?: boolean;
  className?: string;
}

export interface ThreadTagsProps {
  tags: ForumsTag[];
  className?: string;
}
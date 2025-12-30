/**
 * Forums API Types
 * Core data types from the Forums API
 */

// Foru.ms API Types
export interface ForumsUser {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  image?: string;
  avatar?: string; // Used in thread user object
  roles?: (string | ForumsRole)[];
  bio?: string;
  signature?: string;
  url?: string;
  extendedData?: Record<string, unknown>;
}

export interface ForumsRole {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  extendedData?: Record<string, unknown> | null;
  instanceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumsTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  threads?: ForumsThread[];
  extendedData?: Record<string, unknown>;
}

export interface ForumsThread {
  id: string;
  title: string;
  slug?: string;
  body: string;
  views?: number;
  locked?: boolean;
  pinned?: boolean;
  bestAnswerId?: string;
  createdAt: string;
  updatedAt: string;
  likes?: ForumsLike[];
  upvotes?: ForumsUpvote[];
  _count?: {
    Post: number;
  };
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  tags?: ForumsTag[];
}

export interface ForumsLike {
  id: string;
  userId: string;
}

export interface ForumsUpvote {
  id: string;
  userId: string;
}

export interface ForumsPost {
  id: string;
  body: string;
  threadId: string;
  userId: string;
  parentId?: string;
  bestAnswer?: boolean;
  likes?: ForumsLike[];
  upvotes?: ForumsUpvote[];
  extendedData?: Record<string, unknown>;
  instanceId?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    username: string;
    id?: string;
    displayName?: string;
    avatar?: string;
  };
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { PostComposer } from './PostComposer';
import { EditComposer } from '../../../components/EditComposer';
import { DeleteConfirmDialog } from '../../../components/DeleteConfirmDialog';
import PostEngagement from './PostEngagement';
import Avatar from '@/shared/components/common/Avatar';
import { ForumsPost, ForumsThread } from '@/shared/types';
import { formatTimestamp } from '@/shared/lib/utils/formatters';
import { RichTextDisplay } from '@/components/RichTextDisplay';
import {
  Reply,
  MessageSquare,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

interface PostItemProps {
  post: ForumsPost;
  threadId: string;
  allPosts: ForumsPost[];
  onReplyCreated: (reply: ForumsPost) => void;
  onPostDeleted: (postId: string) => void;
  level?: number;
}

export function PostItem({ post, threadId, allPosts, onReplyCreated, onPostDeleted, level = 0 }: PostItemProps) {
  const { data: session } = useSession();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // if you want to set Auto-expand : level < 2
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const childReplies = allPosts.filter(p => p.parentId === post.id);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [currentPost.body]);

  const handleReplyCreated = (newReply: ForumsPost) => {
    onReplyCreated(newReply);
    setShowReplyComposer(false);
  };

  const handlePostUpdated = (updatedItem: ForumsPost | ForumsThread) => {
    const updatedPost = updatedItem as ForumsPost;
    setCurrentPost(updatedPost);
    setIsEditing(false);
  };

  const handlePostDeleted = () => {
    setShowDeleteDialog(false);
    onPostDeleted(currentPost.id);
  };

  const canEditOrDelete = () => {
    if (!session?.user) return false;

    const sessionUser = session.user;
    const userId = sessionUser?.id || session.user?.email;
    const postUserId = currentPost.userId;

    return userId === postUserId ||
      sessionUser.roles?.includes('admin') ||
      sessionUser.roles?.includes('moderator');
  };

  const indentClass = level > 0 ? `ml-${Math.min(level * 4, 16)}` : '';

  return (
    <div className={`post-item ${indentClass}`}>
      <Card className={`
        mb-4 transition-all duration-200 hover:shadow-md
        ${level > 0 ? 'border-l-4 border-l-primary/20' : ''}
        ${currentPost.bestAnswer ? 'ring-2 ring-green-500/20 bg-green-50/30 dark:bg-green-900/10' : ''}
      `}>
        <CardContent className="p-4">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar
                src={currentPost.user?.avatar}
                username={currentPost.user?.username || 'Unknown User'}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text-primary">
                    {currentPost.user?.displayName || currentPost.user?.username || 'Unknown User'}
                  </span>
                  {currentPost.bestAnswer && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Award className="w-3 h-3 mr-1" />
                      Best Answer
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(currentPost.createdAt)}</span>
                  {currentPost.updatedAt && currentPost.updatedAt !== currentPost.createdAt && (
                    <span className="text-text-secondary/70">(edited)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Post Actions */}
            {canEditOrDelete() && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>

                {showActions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActions(false)}
                    />
                    <div className="absolute right-0 top-10 bg-[hsl(var(--popover))] text-popover-foreground border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setShowActions(false);
                        }}
                        className="w-full justify-start text-left h-8 px-3 hover:bg-orange-400 dark:hover:bg-orange-400"
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeleteDialog(true);
                          setShowActions(false);
                        }}
                        className="w-full justify-start text-left h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-300 dark:hover:bg-red-300"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="mb-4">
            {isEditing ? (
              <EditComposer
                item={currentPost}
                type="post"
                onSaved={handlePostUpdated}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <div
                  ref={contentRef}
                  className={`transition-all duration-300 ${expanded ? 'max-h-none' : 'max-h-[300px] overflow-hidden'}`}
                >
                  <RichTextDisplay content={currentPost.body} />
                </div>
                {isOverflowing && (
                  <Button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2"
                    variant="link"
                    size="sm"
                  >
                    {expanded ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Post Engagement */}
          <PostEngagement
            likes={currentPost.likes}
            upvotes={currentPost.upvotes}
            className="mb-3"
          />

          {/* Post Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {session?.user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyComposer(!showReplyComposer)}
                className="text-text-secondary hover:text-text-primary"
              >
                <Reply className="w-4 h-4 mr-1" />
                Reply
              </Button>
            )}

            {childReplies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="text-text-secondary hover:text-text-primary"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {childReplies.length} {childReplies.length === 1 ? 'Reply' : 'Replies'}
                {showReplies ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            )}
          </div>

          {/* Reply Composer */}
          {showReplyComposer && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <PostComposer
                threadId={threadId}
                parentPost={currentPost}
                onPostCreated={handleReplyCreated}
                onCancel={() => setShowReplyComposer(false)}
                placeholder="Write your reply..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {showReplies && childReplies.length > 0 && (
        <div className="replies-container">
          {childReplies.map((child) => {
            return (
              <PostItem
                key={child.id}
                post={child}
                threadId={threadId}
                allPosts={allPosts}
                onReplyCreated={onReplyCreated}
                onPostDeleted={handlePostDeleted}
                level={level + 1}
              />
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          item={currentPost}
          type="post"
          onDeleted={handlePostDeleted}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { ForumsPost } from '@/shared/types';
import { clientApi } from '@/services/client-api';
import { Send, Reply, AlertCircle, X } from 'lucide-react';
import { Spinner } from '@/shared/components/ui/spinner';

interface PostComposerProps {
  threadId: string;
  parentPost?: ForumsPost;
  onPostCreated?: (post: ForumsPost) => void;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
}

export function PostComposer({
  threadId,
  parentPost,
  onPostCreated,
  onCancel,
  className = "",
  placeholder = "Write your reply..."
}: PostComposerProps) {
  const { data: session } = useSession();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!body.trim()) {
      setValidationError('Post content is required');
      return false;
    }

    if (body.trim().length < 3) {
      setValidationError('Post must be at least 3 characters long');
      return false;
    }

    if (body.trim().length > 10000) {
      setValidationError('Post must be less than 10,000 characters');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      setError('You must be logged in to post');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await clientApi.createPost({
        threadId,
        parentId: parentPost?.id,
        content: body.trim()
      });

      if (!result.success || !result.post) {
        throw new Error(result.error || 'Failed to create post');
      }

      // Enrich post with logged-in user data
      const enrichedPost: ForumsPost = {
        ...result.post,
        user: {
          id: session.user.id,
          username: session.user.username,
          displayName: session.user.name,
          avatar: session.user.image
        }
      };

      setBody('');

      if (onPostCreated) {
        onPostCreated(enrichedPost);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setBody('');
    setError(null);
    setValidationError(null);
    if (onCancel) {
      onCancel();
    }
  };

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to post a reply.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {parentPost && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Reply className="h-4 w-4" />
            Replying to @{parentPost.user?.username}
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="ml-auto h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded border-l-4 border-orange-500">
            <div
              dangerouslySetInnerHTML={{ __html: parentPost.body }}
              className="prose prose-sm max-w-none dark:prose-invert line-clamp-3"
            />
          </div>
        </CardHeader>
      )}

      <CardContent className={parentPost ? "pt-0" : ""}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={placeholder}
              className={validationError ? 'border-red-500' : ''}
              minHeight="150px"
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
            <p className="text-xs text-gray-500">
              {body.replace(/<[^>]*>/g, '').length}/10,000 characters
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Posting as @{session.user?.username || session.user?.email || 'User'}
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !body.trim()}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" className="h-4 w-4" />
                    Posting...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {parentPost ? 'Reply' : 'Post'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
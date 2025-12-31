'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { TiptapEditor } from './TiptapEditor';
import { TagSelector } from './TagSelector';
import { ForumsThread, ForumsPost, ForumsTag } from '@/shared/types';
import { clientApi } from '@/services/client-api';
import { Save, X, AlertCircle, Edit } from 'lucide-react';
import { Spinner } from '@/shared/components/ui/spinner';

interface EditComposerProps {
  item: ForumsThread | ForumsPost;
  type: 'thread' | 'post';
  onSaved?: (updatedItem: ForumsThread | ForumsPost) => void;
  onCancel?: () => void;
  className?: string;
}

export function EditComposer({
  item,
  type,
  onSaved,
  onCancel,
  className = ""
}: EditComposerProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<ForumsTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with existing data
  useEffect(() => {
    if (type === 'thread') {
      const thread = item as ForumsThread;
      setTitle(thread.title);
      setBody(thread.body);
      setSelectedTags(thread.tags || []);
    } else {
      const post = item as ForumsPost;
      setBody(post.body);
    }
  }, [item, type]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (type === 'thread') {
      if (!title.trim()) {
        errors.title = 'Title is required';
      } else if (title.trim().length < 5) {
        errors.title = 'Title must be at least 5 characters long';
      } else if (title.trim().length > 200) {
        errors.title = 'Title must be less than 200 characters';
      }
    }

    if (!body.trim()) {
      errors.body = 'Content is required';
    } else if (body.trim().length < 10) {
      errors.body = 'Content must be at least 10 characters long';
    }
    else if (body.trim().length > 10000) {
      errors.body = 'Content must be less than 10,000 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      setError('You must be logged in to edit');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (type === 'thread') {
        const result = await clientApi.updateThread(item.id, {
          title: title.trim(),
          content: body.trim(),
          tags: selectedTags.map(tag => tag.id).filter(id => !id.startsWith('temp-'))
        });

        if (!result.success || !result.thread) {
          throw new Error(result.error || 'Failed to update thread');
        }

        const enrichedThread: ForumsThread = {
          ...result.thread,
          user: {
            id: session.user.id,
            username: session.user.username,
            displayName: session.user.name,
            avatar: session.user.image
          }
        };

        if (onSaved) {
          onSaved(enrichedThread);
        }
      } else {
        const result = await clientApi.updatePost(item.id, {
          content: body.trim()
        });

        if (!result.success || !result.post) {
          throw new Error(result.error || 'Failed to update post');
        }

        const enrichedPost: ForumsPost = {
          ...result.post,
          user: {
            id: session.user.id,
            username: session.user.username,
            displayName: session.user.name,
            avatar: session.user.image
          }
        };

        if (onSaved) {
          onSaved(enrichedPost);
        }
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      setError(error instanceof Error ? error.message : `Failed to update ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (type === 'thread') {
      const thread = item as ForumsThread;
      setTitle(thread.title);
      setBody(thread.body);
      setSelectedTags(thread.tags || []);
    } else {
      const post = item as ForumsPost;
      setBody(post.body);
    }

    setError(null);
    setValidationErrors({});

    if (onCancel) {
      onCancel();
    }
  };

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to edit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit {type === 'thread' ? 'Thread' : 'Post'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title Input (only for threads) */}
          {type === 'thread' && (
            <div className="space-y-2">
              {/* <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label> */}
              <Input
                id="title"
                type="text"
                placeholder="Enter thread title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={validationErrors.title ? 'border-red-500' : ''}
                maxLength={200}
              />
              {validationErrors.title && (
                <p className="text-sm text-red-500">{validationErrors.title}</p>
              )}
              <p className="text-xs text-gray-500">
                {title.length}/200 characters
              </p>
            </div>
          )}

          {/* Content Editor */}
          <div className="space-y-2">
            <TiptapEditor
              value={body}
              onChange={setBody}
              placeholder={`Edit your ${type} content...`}
              className={validationErrors.body ? 'border-red-500' : ''}
              minHeight="200px"
            />
            {validationErrors.body && (
              <p className="text-sm text-red-500">{validationErrors.body}</p>
            )}
            <p className="text-xs text-gray-500">
              {body.replace(/<[^>]*>/g, '').length}/10,000 characters
            </p>
          </div>

          {/* Tag Selector (only for threads) */}
          {type === 'thread' && (
            <div className="space-y-2">
              {/* <label className="text-sm font-medium">
                Tags (optional)
              </label> */}
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                maxTags={5}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !body.trim() || (type === 'thread' && !title.trim())}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" className="h-4 w-4" />
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
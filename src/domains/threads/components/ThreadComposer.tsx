'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { ForumsTag } from '@/shared/types';
import { clientApi } from '@/services/client-api';
import { Save, Send, AlertCircle } from 'lucide-react';
import { TiptapEditor } from '@/components/TiptapEditor';
import { TagSelector } from '@/components/TagSelector';
import { Spinner } from '@/shared/components/ui/spinner';

interface ThreadComposerProps {
  onThreadCreated?: (threadId: string) => void;
  className?: string;
}

interface ThreadDraft {
  title: string;
  body: string;
  tags: ForumsTag[];
  lastSaved: number;
}

export function ThreadComposer({ onThreadCreated, className = "" }: ThreadComposerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<ForumsTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const DRAFT_KEY = 'thread-composer-draft';

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft: ThreadDraft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setBody(draft.body || '');
        setSelectedTags(draft.tags || []);
        setIsDraftSaved(true);
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      if (title.trim() || body.trim() || selectedTags.length > 0) {
        const draft: ThreadDraft = {
          title: title.trim(),
          body: body.trim(),
          tags: selectedTags,
          lastSaved: Date.now()
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setIsDraftSaved(true);
      }
    };

    const debounceTimer = setTimeout(saveDraft, 2000);
    return () => clearTimeout(debounceTimer);
  }, [title, body, selectedTags]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
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
      setError('You must be logged in to create a thread');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await clientApi.createThread({
        title: title.trim(),
        content: body.trim(),
        tags: selectedTags.map(tag => tag.id)
      });

      if (!result.success || !result.thread) {
        throw new Error(result.error || 'Failed to create thread');
      }

      // Clear draft after successful creation
      localStorage.removeItem(DRAFT_KEY);

      if (onThreadCreated) {
        onThreadCreated(result.thread.id);
      } else {
        router.push(`/thread/${result.thread.id}`);
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      setError(error instanceof Error ? error.message : 'Failed to create thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draft: ThreadDraft = {
      title: title.trim(),
      body: body.trim(),
      tags: selectedTags,
      lastSaved: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setIsDraftSaved(true);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setBody('');
    setSelectedTags([]);
    setIsDraftSaved(false);
    setValidationErrors({});
    setError(null);
  };

  if (!session) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to create a thread.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold">
            Create New Thread
          </h1>
          <p className="mt-2 text-sm">
          Start a new discussion and share your thoughts with the community.
        </p>
          </div>
          {isDraftSaved && (
            <span className="text-sm font-normal text-green-600 dark:text-green-400">
              Draft saved
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title Input */}
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

          {/* Content Editor */}
          <div className="space-y-2">
            {/* <label className="text-sm font-medium">
              Content *
            </label> */}
            <TiptapEditor
              value={body}
              onChange={setBody}
              placeholder="Write your thread content..."
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

          {/* Tag Selector */}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!title.trim() && !body.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={clearDraft}
                disabled={!title.trim() && !body.trim() && selectedTags.length === 0}
              >
                Clear
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !body.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" className="h-4 w-4" />
                  Creating...
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Thread
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
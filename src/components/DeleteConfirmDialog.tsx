'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ForumsThread, ForumsPost } from '@/types';
import { clientApi } from '@/services/client-api';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  item: ForumsThread | ForumsPost;
  type: 'thread' | 'post';
  onDeleted?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function DeleteConfirmDialog({
  item,
  type,
  onDeleted,
  onCancel,
  className = ""
}: DeleteConfirmDialogProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const requiredConfirmText = 'DELETE';

  const handleDelete = async () => {
    if (!session?.user) {
      setError('You must be logged in to delete');
      return;
    }

    if (confirmText !== requiredConfirmText) {
      setError(`Please type "${requiredConfirmText}" to confirm`);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = type === 'thread' 
        ? await clientApi.deleteThread(item.id)
        : await clientApi.deletePost(item.id);

      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${type}`);
      }
      
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setError(error instanceof Error ? error.message : `Failed to delete ${type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getItemTitle = () => {
    if (type === 'thread') {
      return (item as ForumsThread).title;
    } else {
      const post = item as ForumsPost;
      const preview = post.body.replace(/<[^>]*>/g, '').substring(0, 50);
      return preview + (post.body.length > 50 ? '...' : '');
    }
  };

  const getWarningMessage = () => {
    if (type === 'thread') {
      return 'This will permanently delete the thread and all its posts. This action cannot be undone.';
    } else {
      return 'This will permanently delete this post. This action cannot be undone.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete {type === 'thread' ? 'Thread' : 'Post'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to delete:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border-l-4 border-red-500">
              <p className="font-medium text-sm">{getItemTitle()}</p>
              <p className="text-xs text-gray-500 mt-1">
                By @{type === 'thread' ? (item as ForumsThread).user.username : (item as ForumsPost).user?.username}
              </p>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {getWarningMessage()}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium text-red-600 dark:text-red-400">
                Type &quot;{requiredConfirmText}&quot; to confirm deletion:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                placeholder={requiredConfirmText}
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== requiredConfirmText}
              className="min-w-[120px]"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Deleting...
                </div>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {type === 'thread' ? 'Thread' : 'Post'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
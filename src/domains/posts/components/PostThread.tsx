'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/components/ui/button';
import { PostComposer } from './PostComposer';
import { PostItem } from './PostItem';
import { ForumsPost } from '@/shared/types';
import { MessageSquare, Plus } from 'lucide-react';

interface PostThreadProps {
  threadId: string;
  posts: ForumsPost[];
  onPostsUpdate?: (posts: ForumsPost[]) => void;
  onReloadNeeded?: () => void; // New prop for triggering reload
  className?: string;
}

export default function PostThread({
  threadId,
  posts,
  onPostsUpdate,
  onReloadNeeded,
  className = ''
}: PostThreadProps) {
  const { data: session } = useSession();
  const [showComposer, setShowComposer] = useState(false);
  const [currentPosts, setCurrentPosts] = useState<ForumsPost[]>(posts);

  useEffect(() => {
    setCurrentPosts(posts);
  }, [posts]);

  const handlePostCreated = (newPost: ForumsPost) => {
    const updatedPosts = [...currentPosts, newPost];
    setCurrentPosts(updatedPosts);
    onPostsUpdate?.(updatedPosts);
    setShowComposer(false);
  };

  const handleReplyCreated = (newReply: ForumsPost) => {
    const updatedPosts = [...currentPosts, newReply];
    setCurrentPosts(updatedPosts);
    onPostsUpdate?.(updatedPosts);
  };

  const handlePostDeleted = (postId: string) => {
    // Instead of manually managing state, trigger a reload from the server
    // This ensures we always have the correct post hierarchy and avoids React state update errors
    if (onReloadNeeded) {
      onReloadNeeded();
    } else {
      // Fallback: remove from local state if no reload callback provided
      setCurrentPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    }
  };

  if (currentPosts.length === 0) {
    return (
      <div className={`post-thread-empty ${className}`}>
        {!showComposer && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-text-secondary/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No posts yet</h3>
            <p className="text-text-secondary mb-6">Be the first to contribute to this discussion!</p>

            {session?.user && (
              <Button
                onClick={() => setShowComposer(true)}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Start the Discussion
              </Button>
            )}
          </div>
        )}

        {showComposer && (
          <div className="mt-8">
            <PostComposer
              threadId={threadId}
              onPostCreated={handlePostCreated}
              onCancel={() => setShowComposer(false)}
              placeholder="Share your thoughts on this topic..."
              className='pt-4'
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`post-thread ${className}`}>
      {/* Add Post Button */}
      {session?.user && !showComposer && (
        <div className="my-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <Button
            onClick={() => setShowComposer(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a Comment
          </Button>
        </div>
      )}

      {/* Post Composer */}
      {showComposer && (
        <div className="my-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <PostComposer
            threadId={threadId}
            onPostCreated={handlePostCreated}
            onCancel={() => setShowComposer(false)}
            placeholder="Share your thoughts on this topic..."
            className='pt-4'
          />
        </div>
      )}

      {/* Posts List */}
      <div className="posts-list space-y-4">
        {currentPosts
          .filter(post => !post.parentId)
          .map(post => (
            <PostItem
              key={post.id}
              post={post}
              allPosts={currentPosts}
              threadId={threadId}
              onReplyCreated={handleReplyCreated}
              onPostDeleted={handlePostDeleted}
              level={0}
            />
          ))}
      </div>
    </div>
  );
}
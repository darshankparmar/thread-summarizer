'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PostComposer } from './PostComposer';
import { PostItem } from './PostItem';
import { ForumsPost } from '@/types';
import { MessageSquare, Plus } from 'lucide-react';

interface PostThreadProps {
  threadId: string;
  posts: ForumsPost[];
  onPostsUpdate?: (posts: ForumsPost[]) => void;
  className?: string;
}

export default function PostThread({ 
  threadId, 
  posts, 
  onPostsUpdate,
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

  // Organize posts into a tree structure
  const organizePostsIntoTree = (posts: ForumsPost[]) => {
    const rootPosts = posts.filter(post => !post.parentId);
    const childPosts = posts.filter(post => post.parentId);
    
    return rootPosts.map(rootPost => ({
      post: rootPost,
      replies: childPosts.filter(child => child.parentId === rootPost.id)
    }));
  };

  const postTree = organizePostsIntoTree(currentPosts);

  if (currentPosts.length === 0) {
    return (
      <div className={`post-thread-empty ${className}`}>
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

        {showComposer && (
          <div className="mt-8">
            <PostComposer
              threadId={threadId}
              onPostCreated={handlePostCreated}
              onCancel={() => setShowComposer(false)}
              placeholder="Share your thoughts on this topic..."
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`post-thread ${className}`}>
      {/* Posts List */}
      <div className="posts-list space-y-4">
        {postTree.map(({ post, replies }) => (
          <PostItem
            key={post.id}
            post={post}
            threadId={threadId}
            replies={replies}
            onReplyCreated={handleReplyCreated}
            level={0}
          />
        ))}
      </div>

      {/* Add Post Button */}
      {session?.user && !showComposer && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
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
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <PostComposer
            threadId={threadId}
            onPostCreated={handlePostCreated}
            onCancel={() => setShowComposer(false)}
            placeholder="Share your thoughts on this topic..."
          />
        </div>
      )}
    </div>
  );
}
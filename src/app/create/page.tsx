import { Metadata } from 'next';
import { ThreadComposer } from '@/components/ThreadComposer';

export const metadata: Metadata = {
  title: 'Create Thread - Thread Summarizer',
  description: 'Create a new discussion thread',
};

export default function CreateThreadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create New Thread
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Start a new discussion and share your thoughts with the community.
        </p>
      </div>
      
      <ThreadComposer />
    </div>
  );
}
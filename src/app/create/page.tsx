import { Metadata } from 'next';
import { ThreadComposer } from '@/domains/threads/components';

export const metadata: Metadata = {
  title: 'Create Thread - Thread Summarizer',
  description: 'Create a new discussion thread',
};

export default function CreateThreadPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ThreadComposer />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DemoThread {
  id: string;
  title: string;
  description: string;
  category: 'edge-case' | 'heated' | 'constructive' | 'technical';
  postCount: number;
}

const categoryColors = {
  'edge-case': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'heated': 'bg-red-100 text-red-800 border-red-200',
  'constructive': 'bg-green-100 text-green-800 border-green-200',
  'technical': 'bg-blue-100 text-blue-800 border-blue-200'
};

const categoryLabels = {
  'edge-case': 'Edge Case',
  'heated': 'Heated Discussion',
  'constructive': 'Constructive',
  'technical': 'Technical'
};

export default function DemoPage() {
  const [demoThreads, setDemoThreads] = useState<DemoThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch demo thread metadata
    const fetchDemoData = async () => {
      try {
        const response = await fetch('/api/demo/threads');
        if (!response.ok) {
          throw new Error('Failed to fetch demo threads');
        }
        const data = await response.json();
        setDemoThreads(data.threads || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo threads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thread Summarizer Demo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Explore AI-powered forum thread analysis with our demo threads
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">Demo Features:</h3>
            <ul className="text-blue-800 space-y-1">
              <li>• AI-generated summaries with key discussion points</li>
              <li>• Sentiment analysis and health scoring</li>
              <li>• Key contributor identification</li>
              <li>• Edge case handling (empty threads, single posts)</li>
              <li>• Performance optimization with caching</li>
            </ul>
          </div>
        </div>

        {/* Demo Threads Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {demoThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          categoryColors[thread.category]
                        }`}
                      >
                        {categoryLabels[thread.category]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {thread.postCount} {thread.postCount === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {thread.title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {thread.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href={`/thread/${thread.id}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    View Thread & Generate Summary
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  
                  <div className="text-sm text-gray-500">
                    ID: {thread.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              About This Demo
            </h3>
            <p className="text-gray-600 text-sm">
              This demo showcases the Thread Summarizer&apos;s ability to analyze different types of forum discussions.
              Each thread demonstrates specific capabilities like edge case handling, sentiment analysis, 
              and complex discussion summarization. The AI processes real thread content to generate 
              structured summaries, identify key contributors, and assess discussion health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
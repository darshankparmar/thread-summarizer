'use client';

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Thread Summarizer</h1>
          <p className="text-lg text-gray-600 mb-8">
            AI-powered intelligence layer for forum discussions. Analyze threads and get concise summaries, 
            key viewpoints, contributor insights, sentiment indicators, and health scores.
          </p>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Demo Threads</h2>
            <p className="text-gray-600 mb-4">
              Try the thread summarizer with these sample thread IDs:
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Link 
                href="/thread/demo-thread-1"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Demo Thread 1</h3>
                <p className="text-sm text-gray-600">Sample discussion thread</p>
              </Link>
              
              <Link 
                href="/thread/demo-thread-2"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Demo Thread 2</h3>
                <p className="text-sm text-gray-600">Another sample thread</p>
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Custom Thread ID</h3>
              <p className="text-sm text-blue-700 mb-3">
                You can also navigate directly to any thread by visiting: <code>/thread/[thread-id]</code>
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter thread ID"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        window.location.href = `/thread/${input.value.trim()}`;
                      }
                    }
                  }}
                />
                <button 
                  onClick={(e) => {
                    const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      window.location.href = `/thread/${input.value.trim()}`;
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

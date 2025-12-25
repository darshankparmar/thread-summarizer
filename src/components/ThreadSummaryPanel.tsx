'use client';

import React, { useState } from 'react';
import { SummaryData, ThreadSummaryPanelProps } from '../types';
import { SummaryDisplay, LoadingDisplay, ErrorDisplay, getHealthLabel } from './SummaryDataFormatter';

interface ThreadSummaryPanelState {
  isLoading: boolean;
  data: SummaryData | null;
  error: string | null;
}

export default function ThreadSummaryPanel({ threadId, className = '' }: ThreadSummaryPanelProps) {
  const [state, setState] = useState<ThreadSummaryPanelState>({
    isLoading: false,
    data: null,
    error: null
  });

  const generateSummary = async () => {
    setState({ isLoading: true, data: null, error: null });

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Ensure health label is derived from health score
        const dataWithHealthLabel = {
          ...result.data,
          healthLabel: getHealthLabel(result.data.healthScore)
        };
        setState({ isLoading: false, data: dataWithHealthLabel, error: null });
      } else {
        setState({ 
          isLoading: false, 
          data: null, 
          error: result.error || 'Failed to generate summary' 
        });
      }
    } catch {
      setState({ 
        isLoading: false, 
        data: null, 
        error: 'Network error occurred while generating summary' 
      });
    }
  };

  const { isLoading, data, error } = state;

  return (
    <div className={`thread-summary-panel bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Thread Summary</h3>
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingDisplay />}

      {/* Error State */}
      {error && <ErrorDisplay error={error} />}

      {/* Summary Data Display - Text-based presentation without charts/graphs */}
      {data && <SummaryDisplay data={data} />}
    </div>
  );
}
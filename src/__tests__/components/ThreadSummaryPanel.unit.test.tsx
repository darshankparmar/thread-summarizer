/**
 * Unit tests for ThreadSummaryPanel component rendering
 * Tests loading states, error states, and successful summary display
 * Verifies accessibility and responsive design
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThreadSummaryPanel from '@/components/ThreadSummaryPanel';
import { SummaryData } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

const mockSummaryData: SummaryData = {
  summary: [
    'This is a discussion about React testing',
    'Multiple approaches were discussed',
    'Community consensus emerged on best practices'
  ],
  keyPoints: [
    'Unit testing is essential for component reliability',
    'Property-based testing catches edge cases',
    'Integration tests verify user workflows'
  ],
  contributors: [
    { username: 'testuser1', contribution: 'Provided testing examples' },
    { username: 'testuser2', contribution: 'Shared best practices' }
  ],
  sentiment: 'Positive',
  healthScore: 8,
  healthLabel: 'Healthy'
};

describe('ThreadSummaryPanel Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  /**
   * Test initial render state
   */
  test('renders initial state with generate button', () => {
    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    // Should show title
    expect(screen.getByText('AI Thread Summary')).toBeInTheDocument();
    
    // Should show generate button
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
    
    // Should not show loading or error states initially
    expect(screen.queryByText(/analyzing thread content/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  /**
   * Test loading state display
   */
  test('displays loading state when generating summary', async () => {
    // Mock a delayed response
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSummaryData })
      }), 100))
    );

    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);
    
    // Should show loading state
    expect(screen.getByText(/analyzing thread content/i)).toBeInTheDocument();
    
    // Button should be disabled during loading
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    
    // Should not show error or success content during loading
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/key discussion points/i)).not.toBeInTheDocument();
  });

  /**
   * Test error state display
   */
  test('displays error state when API call fails', async () => {
    const errorMessage = 'Thread not found. Please check the thread ID.';
    // Mock a 404 error which doesn't retry
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ success: false, error: errorMessage })
    });

    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      // Should show the new ErrorDisplay component - it shows "Resource Not Found" for NOT_FOUND category
      expect(screen.getByText('Resource Not Found')).toBeInTheDocument();
      expect(screen.getByText('The requested resource could not be found.')).toBeInTheDocument();
    });
    
    // Should not show loading or success states
    expect(screen.queryByText(/analyzing thread content/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/key discussion points/i)).not.toBeInTheDocument();
  });

  /**
   * Test network error handling
   */
  test('displays network error when fetch fails', async () => {
    // Mock multiple network errors since the component retries network errors
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      // Should show the new ErrorDisplay component with "Connection Problem" title
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the forum service. Please check your internet connection.')).toBeInTheDocument();
    }, { timeout: 15000 }); // Increase timeout to account for retries
  }, 20000); // Set test timeout to 20 seconds

  /**
   * Test successful summary display
   */
  test('displays summary data when API call succeeds', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSummaryData })
    });

    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      // Should show all summary sections
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Key Discussion Points')).toBeInTheDocument();
      expect(screen.getByText('Key Contributors')).toBeInTheDocument();
      
      // Should show summary content
      expect(screen.getByText(/react testing/i)).toBeInTheDocument();
      expect(screen.getByText(/unit testing is essential/i)).toBeInTheDocument();
      
      // Should show contributors with @username format
      expect(screen.getByText(/@testuser1/)).toBeInTheDocument();
      expect(screen.getByText(/provided testing examples/i)).toBeInTheDocument();
      
      // Should show sentiment with emoji and text
      expect(screen.getByText('😊')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
      
      // Should show health score
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('8/10') || false
      })[0]).toBeInTheDocument();
      expect(screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Healthy') || false
      })[0]).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000); // Set test timeout to 15 seconds

  /**
   * Test accessibility features
   */
  test('has proper accessibility attributes', () => {
    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    // Button should be accessible
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    expect(generateButton).toBeInTheDocument();
    
    // Should have proper heading structure
    const heading = screen.getByRole('heading', { name: /ai thread summary/i });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
  });

  /**
   * Test responsive design classes
   */
  test('applies responsive design classes', () => {
    const { container } = render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    // Should have responsive container classes
    const panel = container.querySelector('.thread-summary-panel');
    expect(panel).toHaveClass('bg-gray-50', 'border', 'border-gray-200', 'rounded-lg', 'p-4');
    
    // Should have responsive flex layout for header
    const header = container.querySelector('.flex.items-center.justify-between');
    expect(header).toBeInTheDocument();
  });

  /**
   * Test custom className prop
   */
  test('applies custom className when provided', () => {
    const customClass = 'custom-panel-class';
    const { container } = render(
      <ThreadSummaryPanel threadId="test-thread-123" className={customClass} />
    );
    
    const panel = container.querySelector('.thread-summary-panel');
    expect(panel).toHaveClass(customClass);
  });

  /**
   * Test API request format
   */
  test('sends correct API request format', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSummaryData })
    });

    render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/summarize', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId: 'test-thread-123' }),
        signal: expect.any(AbortSignal)
      }));
    });
  });

  /**
   * Test compact panel layout constraint
   */
  test('maintains compact panel layout', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockSummaryData })
    });

    const { container } = render(<ThreadSummaryPanel threadId="test-thread-123" />);
    
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      // Should have exactly one main panel container
      const panels = container.querySelectorAll('.thread-summary-panel');
      expect(panels).toHaveLength(1);
      
      // All content should be within the single panel
      const summaryContent = screen.getByText('Summary');
      const keyPointsContent = screen.getByText('Key Discussion Points');
      const contributorsContent = screen.getByText('Key Contributors');
      
      expect(panels[0]).toContainElement(summaryContent);
      expect(panels[0]).toContainElement(keyPointsContent);
      expect(panels[0]).toContainElement(contributorsContent);
    });
  });
});
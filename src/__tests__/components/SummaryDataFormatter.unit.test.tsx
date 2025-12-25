/**
 * Unit tests for SummaryDataFormatter components and utilities
 * Tests formatting functions and display components
 * **Validates: Requirements 11.1, 11.2**
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  formatContributor, 
  getHealthLabel, 
  getSentimentEmoji,
  SummaryDisplay,
  LoadingDisplay,
  ErrorDisplay
} from '@/components/SummaryDataFormatter';
import { SummaryData, Contributor } from '@/types';

const mockSummaryData: SummaryData = {
  summary: [
    'Discussion about testing strategies',
    'Community shared various approaches'
  ],
  keyPoints: [
    'Unit tests provide confidence',
    'Property tests catch edge cases',
    'Integration tests verify workflows'
  ],
  contributors: [
    { username: 'alice', contribution: 'Shared testing framework insights' },
    { username: 'bob', contribution: 'Provided real-world examples' }
  ],
  sentiment: 'Positive',
  healthScore: 7,
  healthLabel: 'Healthy'
};

describe('SummaryDataFormatter Utilities', () => {
  
  /**
   * Test contributor formatting function
   * **Validates: Requirements 3.3**
   */
  describe('formatContributor', () => {
    test('formats contributor with @username pattern', () => {
      const contributor: Contributor = {
        username: 'testuser',
        contribution: 'Made valuable contributions'
      };
      
      const formatted = formatContributor(contributor);
      expect(formatted).toBe('@testuser – Made valuable contributions');
    });

    test('handles special characters in username', () => {
      const contributor: Contributor = {
        username: 'user_123',
        contribution: 'Provided examples'
      };
      
      const formatted = formatContributor(contributor);
      expect(formatted).toBe('@user_123 – Provided examples');
    });

    test('handles empty contribution', () => {
      const contributor: Contributor = {
        username: 'testuser',
        contribution: ''
      };
      
      const formatted = formatContributor(contributor);
      expect(formatted).toBe('@testuser – ');
    });
  });

  /**
   * Test health label derivation
   * **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
   */
  describe('getHealthLabel', () => {
    test('returns "Healthy" for scores 7-10', () => {
      expect(getHealthLabel(7)).toBe('Healthy');
      expect(getHealthLabel(8)).toBe('Healthy');
      expect(getHealthLabel(9)).toBe('Healthy');
      expect(getHealthLabel(10)).toBe('Healthy');
    });

    test('returns "Needs Attention" for scores 4-6', () => {
      expect(getHealthLabel(4)).toBe('Needs Attention');
      expect(getHealthLabel(5)).toBe('Needs Attention');
      expect(getHealthLabel(6)).toBe('Needs Attention');
    });

    test('returns "Heated Discussion" for scores 1-3', () => {
      expect(getHealthLabel(1)).toBe('Heated Discussion');
      expect(getHealthLabel(2)).toBe('Heated Discussion');
      expect(getHealthLabel(3)).toBe('Heated Discussion');
    });
  });

  /**
   * Test sentiment emoji mapping
   * **Validates: Requirements 4.2**
   */
  describe('getSentimentEmoji', () => {
    test('returns correct emoji for each sentiment', () => {
      expect(getSentimentEmoji('Positive')).toBe('😊');
      expect(getSentimentEmoji('Neutral')).toBe('😐');
      expect(getSentimentEmoji('Mixed')).toBe('🤔');
      expect(getSentimentEmoji('Negative')).toBe('😠');
    });
  });
});

describe('SummaryDisplay Component', () => {
  
  /**
   * Test complete summary display rendering
   * **Validates: Requirements 11.1, 11.2**
   */
  test('renders all summary sections', () => {
    render(<SummaryDisplay data={mockSummaryData} />);
    
    // Should render all section headers
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Key Discussion Points')).toBeInTheDocument();
    expect(screen.getByText('Key Contributors')).toBeInTheDocument();
    
    // Should render summary content
    expect(screen.getByText(/discussion about testing strategies/i)).toBeInTheDocument();
    expect(screen.getByText(/community shared various approaches/i)).toBeInTheDocument();
  });

  /**
   * Test key points display
   * **Validates: Requirements 11.1, 11.2**
   */
  test('renders key discussion points', () => {
    render(<SummaryDisplay data={mockSummaryData} />);
    
    expect(screen.getByText(/unit tests provide confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/property tests catch edge cases/i)).toBeInTheDocument();
    expect(screen.getByText(/integration tests verify workflows/i)).toBeInTheDocument();
  });

  /**
   * Test contributors display with proper formatting
   * **Validates: Requirements 3.3, 11.1, 11.2**
   */
  test('renders contributors with @username format', () => {
    render(<SummaryDisplay data={mockSummaryData} />);
    
    expect(screen.getByText(/@alice – Shared testing framework insights/)).toBeInTheDocument();
    expect(screen.getByText(/@bob – Provided real-world examples/)).toBeInTheDocument();
  });

  /**
   * Test sentiment display with emoji and text
   * **Validates: Requirements 4.2, 11.1, 11.2**
   */
  test('renders sentiment with emoji and text label', () => {
    render(<SummaryDisplay data={mockSummaryData} />);
    
    expect(screen.getByText('😊')).toBeInTheDocument();
    expect(screen.getByText('Positive')).toBeInTheDocument();
    expect(screen.getByText(/sentiment:/i)).toBeInTheDocument();
  });

  /**
   * Test health score display
   * **Validates: Requirements 5.2, 11.1, 11.2**
   */
  test('renders health score with label', () => {
    render(<SummaryDisplay data={mockSummaryData} />);
    
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('(Healthy)')).toBeInTheDocument();
    expect(screen.getByText(/health:/i)).toBeInTheDocument();
  });

  /**
   * Test text-based layout structure
   * **Validates: Requirements 11.2, 11.3**
   */
  test('uses text-based layout without complex visuals', () => {
    const { container } = render(<SummaryDisplay data={mockSummaryData} />);
    
    // Should have text-based list classes
    const textLists = container.querySelectorAll('.text-based-list');
    expect(textLists.length).toBeGreaterThanOrEqual(3);
    
    // Should not contain charts or graphs
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
    
    // Should have proper section structure
    expect(container.querySelector('.summary-section')).toBeInTheDocument();
    expect(container.querySelector('.key-points-section')).toBeInTheDocument();
    expect(container.querySelector('.contributors-section')).toBeInTheDocument();
    expect(container.querySelector('.metrics-section')).toBeInTheDocument();
  });

  /**
   * Test different sentiment types
   * **Validates: Requirements 4.2**
   */
  test('renders different sentiment types correctly', () => {
    const sentiments = ['Positive', 'Neutral', 'Mixed', 'Negative'] as const;
    const expectedEmojis = ['😊', '😐', '🤔', '😠'];
    
    sentiments.forEach((sentiment, index) => {
      const data = { ...mockSummaryData, sentiment };
      const { rerender } = render(<SummaryDisplay data={data} />);
      
      expect(screen.getByText(expectedEmojis[index])).toBeInTheDocument();
      expect(screen.getByText(sentiment)).toBeInTheDocument();
      
      if (index < sentiments.length - 1) {
        rerender(<div />); // Clear for next test
      }
    });
  });
});

describe('LoadingDisplay Component', () => {
  
  /**
   * Test loading display with default message
   * **Validates: Requirements 11.1, 11.2**
   */
  test('renders default loading message', () => {
    render(<LoadingDisplay />);
    expect(screen.getByText(/analyzing thread content/i)).toBeInTheDocument();
  });

  /**
   * Test loading display with custom message
   * **Validates: Requirements 11.1, 11.2**
   */
  test('renders custom loading message', () => {
    const customMessage = 'Processing your request...';
    render(<LoadingDisplay message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });
});

describe('ErrorDisplay Component', () => {
  
  /**
   * Test error display rendering
   * **Validates: Requirements 11.1, 11.2**
   */
  test('renders error message', () => {
    const errorMessage = 'Something went wrong';
    render(<ErrorDisplay error={errorMessage} />);
    
    expect(screen.getByText(/error:/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  /**
   * Test error display styling
   * **Validates: Requirements 11.1, 11.2**
   */
  test('applies error styling classes', () => {
    const { container } = render(<ErrorDisplay error="Test error" />);
    
    const errorDiv = container.querySelector('.error-display');
    expect(errorDiv).toHaveClass('bg-red-50', 'border', 'border-red-200', 'rounded', 'p-3');
  });
});
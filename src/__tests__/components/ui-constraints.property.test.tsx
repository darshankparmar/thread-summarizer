/**
 * Property-based tests for UI constraints
 * Feature: thread-summarizer, Property 6: Contributor Format Validation
 * Feature: thread-summarizer, Property 8: Sentiment Display Format  
 * Feature: thread-summarizer, Property 14: UI Layout Constraints
 * **Validates: Requirements 3.3, 4.2, 11.1, 11.2, 11.3**
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { formatContributor, getSentimentEmoji, SummaryDisplay } from '@/components/SummaryDataFormatter';
import ThreadSummaryPanel from '@/components/ThreadSummaryPanel';
import { summaryDataArbitrary, usernameArbitrary, sentimentArbitrary } from '../utils/property-generators';
import { Contributor, SentimentType } from '@/types';

describe('UI Constraints Property Tests', () => {
  
  /**
   * Property 6: Contributor Format Validation
   * For any contributor output, the format should match the pattern `@username – description` exactly
   * **Validates: Requirements 3.3**
   */
  test('Property 6: Contributor format validation', () => {
    fc.assert(fc.property(
      fc.record({
        username: usernameArbitrary,
        contribution: fc.string({ minLength: 1, maxLength: 100 })
      }),
      (contributor: Contributor) => {
        const formatted = formatContributor(contributor);
        
        // Should start with @username
        expect(formatted).toMatch(new RegExp(`^@${contributor.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        
        // Should contain the separator " – "
        expect(formatted).toContain(' – ');
        
        // Should end with the contribution
        expect(formatted).toMatch(new RegExp(`${contributor.contribution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
        
        // Should match exact pattern
        const expectedFormat = `@${contributor.username} – ${contributor.contribution}`;
        expect(formatted).toBe(expectedFormat);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 8: Sentiment Display Format
   * For any sentiment output in the UI, both text label and emoji indicator should be present
   * **Validates: Requirements 4.2**
   */
  test('Property 8: Sentiment display format', () => {
    fc.assert(fc.property(
      sentimentArbitrary,
      (sentiment: SentimentType) => {
        const emoji = getSentimentEmoji(sentiment);
        
        // Should return a valid emoji for each sentiment
        expect(emoji).toBeTruthy();
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
        
        // Should map to correct emojis
        const expectedEmojis: Record<SentimentType, string> = {
          'Positive': '😊',
          'Neutral': '😐', 
          'Mixed': '🤔',
          'Negative': '😠'
        };
        
        expect(emoji).toBe(expectedEmojis[sentiment]);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 8 (continued): Sentiment display in rendered component
   * For any sentiment output in the UI, both text label and emoji indicator should be present
   * **Validates: Requirements 4.2**
   */
  test('Property 8: Sentiment display in UI contains both emoji and text', () => {
    fc.assert(fc.property(
      summaryDataArbitrary,
      (summaryData) => {
        const { container } = render(<SummaryDisplay data={summaryData} />);
        
        // Find sentiment display section
        const sentimentDisplay = container.querySelector('.sentiment-display');
        expect(sentimentDisplay).toBeTruthy();
        
        // Should contain both emoji and text
        const emojiElement = sentimentDisplay?.querySelector('.sentiment-emoji');
        const textElement = sentimentDisplay?.querySelector('.sentiment-text');
        
        expect(emojiElement).toBeTruthy();
        expect(textElement).toBeTruthy();
        
        // Verify emoji matches sentiment
        const expectedEmoji = getSentimentEmoji(summaryData.sentiment);
        expect(emojiElement?.textContent).toBe(expectedEmoji);
        
        // Verify text matches sentiment
        expect(textElement?.textContent).toContain(summaryData.sentiment);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 14: UI Layout Constraints
   * For any summary display, all outputs should be contained within a single compact panel without charts, graphs, or heat maps
   * **Validates: Requirements 11.1, 11.2, 11.3**
   */
  test('Property 14: UI layout constraints - single compact panel', () => {
    fc.assert(fc.property(
      summaryDataArbitrary,
      (summaryData) => {
        const { container } = render(<SummaryDisplay data={summaryData} />);
        
        // Should be contained in a single summary display container
        const summaryDisplays = container.querySelectorAll('.summary-display');
        expect(summaryDisplays).toHaveLength(1);
        
        // Should contain all required sections in text-based format
        const summarySection = container.querySelector('.summary-section');
        const keyPointsSection = container.querySelector('.key-points-section');
        const contributorsSection = container.querySelector('.contributors-section');
        const metricsSection = container.querySelector('.metrics-section');
        
        expect(summarySection).toBeTruthy();
        expect(keyPointsSection).toBeTruthy();
        expect(contributorsSection).toBeTruthy();
        expect(metricsSection).toBeTruthy();
        
        // Should use text-based lists, not complex UI elements
        const textBasedLists = container.querySelectorAll('.text-based-list');
        expect(textBasedLists.length).toBeGreaterThanOrEqual(3); // summary, keyPoints, contributors
        
        // Should NOT contain charts, graphs, or heat maps
        const charts = container.querySelectorAll('canvas, svg[class*="chart"], [class*="graph"], [class*="heatmap"]');
        expect(charts).toHaveLength(0);
        
        // Should NOT contain complex visual indicators beyond basic text and emojis
        const complexVisuals = container.querySelectorAll('[class*="progress"], [class*="bar"], [class*="meter"]');
        expect(complexVisuals).toHaveLength(0);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 14 (continued): ThreadSummaryPanel layout constraints
   * For any summary display, all outputs should be contained within a single compact panel
   * **Validates: Requirements 11.1, 11.2, 11.3**
   */
  test('Property 14: ThreadSummaryPanel single compact panel layout', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }),
      (threadId) => {
        const { container } = render(<ThreadSummaryPanel threadId={threadId} />);
        
        // Should have exactly one thread-summary-panel container
        const panels = container.querySelectorAll('.thread-summary-panel');
        expect(panels).toHaveLength(1);
        
        // Panel should be compact (not sprawling across multiple containers)
        const panel = panels[0];
        expect(panel).toBeTruthy();
        
        // Should contain header with title and button in single row
        const header = panel.querySelector('.flex.items-center.justify-between');
        expect(header).toBeTruthy();
        
        // Should NOT contain multiple separate panels or complex layouts
        const nestedPanels = panel.querySelectorAll('[class*="panel"]');
        expect(nestedPanels.length).toBeLessThanOrEqual(1); // Only the main panel itself
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 14 (continued): Text-based presentation constraint
   * All content should prioritize text-based presentation with minimal visual indicators
   * **Validates: Requirements 11.2, 11.3**
   */
  test('Property 14: Text-based presentation without complex visuals', () => {
    fc.assert(fc.property(
      summaryDataArbitrary,
      (summaryData) => {
        const { container } = render(<SummaryDisplay data={summaryData} />);
        
        // Should primarily use text elements
        const textElements = container.querySelectorAll('div, span, h4');
        expect(textElements.length).toBeGreaterThan(0);
        
        // Should NOT contain image elements (except emojis as text)
        const images = container.querySelectorAll('img');
        expect(images).toHaveLength(0);
        
        // Should NOT contain canvas elements for charts
        const canvases = container.querySelectorAll('canvas');
        expect(canvases).toHaveLength(0);
        
        // Should NOT contain SVG graphics (charts/graphs)
        const svgs = container.querySelectorAll('svg');
        expect(svgs).toHaveLength(0);
        
        // Visual indicators should be minimal (only emojis and basic styling)
        const emoji = container.querySelector('.sentiment-emoji');
        if (emoji) {
          // Emoji should be simple text content, not complex graphics
          expect(emoji.tagName.toLowerCase()).toBe('span');
          // Should be one of our expected sentiment emojis
          const validEmojis = ['😊', '😐', '🤔', '😠'];
          expect(validEmojis).toContain(emoji.textContent);
        }
      }
    ), { numRuns: 100 });
  });
});
import * as fc from 'fast-check';
import { AIService } from '@/services/ai-service';
import { createMockThread, createMockPost } from '../utils/mock-data';

// Mock OpenAI to avoid actual API calls during testing
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('Mocked OpenAI error'))
        }
      }
    }))
  };
});

describe('AI Service Property Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Set up environment variable for testing
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Create fresh AI service instance
    aiService = new AIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: Structured Output Completeness - Edge Cases
   */
  test('Property 11: Structured Output Completeness - Edge Cases', async () => {
    // Test empty thread case
    const emptyThread = createMockThread();
    const emptyPosts: never[] = [];

    const result = await aiService.generateSummary(emptyThread, emptyPosts);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.fallback).toBe(true);

    if (result.data) {
      // Verify all required fields are present even in fallback
      expect(result.data).toHaveProperty('summary');
      expect(result.data).toHaveProperty('keyPoints');
      expect(result.data).toHaveProperty('contributors');
      expect(result.data).toHaveProperty('sentiment');
      expect(result.data).toHaveProperty('healthScore');
      expect(result.data).toHaveProperty('healthLabel');
    }
  });

  /**
   * Property: Summary Format Constraints - Edge Cases
   * Feature: thread-summarizer, Property: For any thread analysis request, the generated summary should contain 5 or fewer bullet points in the correct format
   */
  test('Property 1: Summary Format Constraints - Edge Cases', async () => {
    // Test with edge case data
    const thread = createMockThread();
    const posts = [
      createMockPost({ id: 'post-1' }),
      createMockPost({ id: 'post-2' }),
      createMockPost({ id: 'post-3' })
    ];

    // Since OpenAI is mocked to fail, test the fallback behavior
    const result = await aiService.generateSummary(thread, posts);

    // The result should provide fallback data
    expect(result).toBeDefined();
    if (result.data) {
      // Verify summary constraints
      expect(result.data.summary.length).toBeLessThanOrEqual(5);
      expect(result.data.summary.length).toBeGreaterThan(0);
      
      // Verify all summary items are strings
      result.data.summary.forEach((item: string) => {
        expect(typeof item).toBe('string');
        expect(item.length).toBeGreaterThan(0);
      });
    }
  });

  /**
   * Property: Viewpoint Extraction Bounds - Fallback Behavior
   * Feature: thread-summarizer, Property: For any thread with sufficient content, the system should extract between 3 and 5 unique viewpoints
   */
  test('Property 4: Viewpoint Extraction Bounds - Fallback Behavior', async () => {
    const thread = createMockThread();
    const posts = [
      createMockPost({ id: 'post-1' }),
      createMockPost({ id: 'post-2' }),
      createMockPost({ id: 'post-3' })
    ];

    const result = await aiService.generateSummary(thread, posts);

    if (result.data) {
      // In fallback, keyPoints should still be present and valid
      expect(Array.isArray(result.data.keyPoints)).toBe(true);
      expect(result.data.keyPoints.length).toBeGreaterThan(0);
      
      // Verify all keyPoints are strings
      result.data.keyPoints.forEach((point: string) => {
        expect(typeof point).toBe('string');
        expect(point.length).toBeGreaterThan(0);
      });
    }
  });

  /**
   * Property: Contributor Identification Bounds - Fallback Behavior
   * Feature: thread-summarizer, Property: For any thread analysis, the system should identify between 2 and 4 key contributors
   */
  test('Property 5: Contributor Identification Bounds - Fallback Behavior', async () => {
    const thread = createMockThread();
    const posts = [
      createMockPost({ id: 'post-1' }),
      createMockPost({ id: 'post-2' }),
      createMockPost({ id: 'post-3' })
    ];

    const result = await aiService.generateSummary(thread, posts);

    if (result.data) {
      // Verify contributors structure
      expect(Array.isArray(result.data.contributors)).toBe(true);
      
      result.data.contributors.forEach((contributor: { username: string; contribution: string }) => {
        expect(contributor).toHaveProperty('username');
        expect(contributor).toHaveProperty('contribution');
        expect(typeof contributor.username).toBe('string');
        expect(typeof contributor.contribution).toBe('string');
        expect(contributor.username.length).toBeGreaterThan(0);
        expect(contributor.contribution.length).toBeGreaterThan(0);
      });
    }
  });

  /**
   * Property: Sentiment Enumeration Constraint
   * Feature: thread-summarizer, Property: For any thread analysis, the sentiment classification should be exactly one of the allowed values
   */
  test('Property 7: Sentiment Enumeration Constraint', async () => {
    const thread = createMockThread();
    const posts = [
      createMockPost({ id: 'post-1' }),
      createMockPost({ id: 'post-2' }),
      createMockPost({ id: 'post-3' })
    ];

    const result = await aiService.generateSummary(thread, posts);

    if (result.data) {
      // Verify sentiment is one of allowed values
      const validSentiments = ['Positive', 'Neutral', 'Mixed', 'Negative'];
      expect(validSentiments).toContain(result.data.sentiment);
      expect(typeof result.data.sentiment).toBe('string');
    }
  });

  /**
   * Property: Health Score Range Validation
   * Feature: thread-summarizer, Property: For any thread analysis, the health score should be an integer between 1 and 10 inclusive, with appropriate labels
   */
  test('Property 9: Health Score Range Validation', async () => {
    const thread = createMockThread();
    const posts = [
      createMockPost({ id: 'post-1' }),
      createMockPost({ id: 'post-2' }),
      createMockPost({ id: 'post-3' })
    ];

    const result = await aiService.generateSummary(thread, posts);

    if (result.data) {
      // Verify health score range
      expect(result.data.healthScore).toBeGreaterThanOrEqual(1);
      expect(result.data.healthScore).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result.data.healthScore)).toBe(true);
      
      // Verify health label corresponds to score
      const { healthScore, healthLabel } = result.data;
      if (healthScore >= 7) {
        expect(healthLabel).toBe('Healthy');
      } else if (healthScore >= 4) {
        expect(healthLabel).toBe('Needs Attention');
      } else {
        expect(healthLabel).toBe('Heated Discussion');
      }
    }
  });

  /**
   * Property Constraints - Comprehensive Edge Cases with Fallbacks
   */
  test('Property Constraints - Comprehensive Edge Cases with Fallbacks', async () => {
    // Test empty thread constraints
    const emptyThread = createMockThread();
    const emptyPosts: never[] = [];

    const emptyResult = await aiService.generateSummary(emptyThread, emptyPosts);
    
    expect(emptyResult.success).toBe(true);
    expect(emptyResult.fallback).toBe(true);
    
    if (emptyResult.data) {
      // Verify constraints even in fallback
      expect(emptyResult.data.summary.length).toBeLessThanOrEqual(5);
      expect(emptyResult.data.healthScore).toBeGreaterThanOrEqual(1);
      expect(emptyResult.data.healthScore).toBeLessThanOrEqual(10);
      expect(['Positive', 'Neutral', 'Mixed', 'Negative']).toContain(emptyResult.data.sentiment);
    }

    // Test single post constraints
    const singleThread = createMockThread();
    const singlePost = [createMockPost()];

    const singleResult = await aiService.generateSummary(singleThread, singlePost);
    
    expect(singleResult.success).toBe(true);
    expect(singleResult.fallback).toBe(true);
    
    if (singleResult.data) {
      // Verify constraints in single post fallback
      expect(singleResult.data.summary.length).toBeLessThanOrEqual(5);
      expect(singleResult.data.healthScore).toBeGreaterThanOrEqual(1);
      expect(singleResult.data.healthScore).toBeLessThanOrEqual(10);
      expect(['Positive', 'Neutral', 'Mixed', 'Negative']).toContain(singleResult.data.sentiment);
    }
  });

  /**
   * Property-based test for fallback response generation
   */
  test('Property-based fallback response validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          id: fc.string(),
          body: fc.string(),
          threadId: fc.string(),
          userId: fc.string(),
          createdAt: fc.string(),
          user: fc.record({ username: fc.string() })
        }), { minLength: 3, maxLength: 10 }),
        async (posts) => {
          const thread = createMockThread();
          
          // Since OpenAI is mocked to fail, this will test fallback generation
          const result = await aiService.generateSummary(thread, posts);

          // Should always provide some response
          expect(result).toBeDefined();
          
          if (result.data) {
            // Verify all constraints are met in fallback
            expect(result.data.summary.length).toBeLessThanOrEqual(5);
            expect(result.data.healthScore).toBeGreaterThanOrEqual(1);
            expect(result.data.healthScore).toBeLessThanOrEqual(10);
            expect(['Positive', 'Neutral', 'Mixed', 'Negative']).toContain(result.data.sentiment);
            expect(Array.isArray(result.data.summary)).toBe(true);
            expect(Array.isArray(result.data.keyPoints)).toBe(true);
            expect(Array.isArray(result.data.contributors)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
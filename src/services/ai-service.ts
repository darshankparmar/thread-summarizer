import OpenAI from 'openai';
import { ForumsThread, ForumsPost, SummaryData } from '../types';

// OpenAI client configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON schema for structured output validation
export const summarySchema = {
  type: "object",
  properties: {
    summary: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
      description: "Bullet-point summary of the thread"
    },
    keyPoints: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5,
      description: "Unique viewpoints from the discussion"
    },
    contributors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          username: { type: "string" },
          contribution: { type: "string" }
        },
        required: ["username", "contribution"]
      },
      minItems: 2,
      maxItems: 4
    },
    sentiment: {
      type: "string",
      enum: ["Positive", "Neutral", "Mixed", "Negative"]
    },
    healthScore: {
      type: "integer",
      minimum: 1,
      maximum: 10
    }
  },
  required: ["summary", "keyPoints", "contributors", "sentiment", "healthScore"],
  additionalProperties: false
} as const;

// AI prompt template for thread analysis with optimization for faster processing
export const createPromptTemplate = (
  thread: ForumsThread,
  posts: ForumsPost[]
): string => {
  const postCount = posts.length;
  
  // Optimize prompt length for faster processing
  const optimizedPosts = optimizePostsForPrompt(posts);
  const postsText = optimizedPosts
    .map(post => `@${post.user?.username || 'Unknown User'}: ${post.body}`)
    .join('\n\n');

  return `
Analyze this forum thread and provide a structured summary.

Thread Title: ${thread.title}
Thread Body: ${thread.body}
Posts (${postCount} total):
${postsText}

Return a JSON object with:
- summary: Array of 3-5 bullet points covering main discussion points
- keyPoints: Array of 3-5 unique viewpoints, including disagreements
- contributors: Array of 2-4 users who provided valuable insights (quality over quantity)
- sentiment: Overall tone (Positive/Neutral/Mixed/Negative)
- healthScore: Constructiveness rating 1-10 (10 = highly constructive, 1 = toxic/unhelpful)

Focus on factual, neutral analysis. Represent disagreements fairly.
`.trim();
};

/**
 * Optimize posts for AI prompt to reduce processing time while maintaining quality
 */
function optimizePostsForPrompt(posts: ForumsPost[]): ForumsPost[] {
  // If we have a reasonable number of posts, return all
  if (posts.length <= 20) {
    return posts;
  }

  // For larger threads, use intelligent sampling to maintain quality while reducing size
  const optimized: ForumsPost[] = [];
  
  // Always include first few posts (context)
  optimized.push(...posts.slice(0, 3));
  
  // Include last few posts (recent context)
  optimized.push(...posts.slice(-3));
  
  // Sample middle posts, prioritizing longer posts (likely more substantive)
  const middlePosts = posts.slice(3, -3);
  if (middlePosts.length > 0) {
    // Sort by post length and take top posts
    const substantivePosts = middlePosts
      .filter(post => post.body.length > 50) // Filter out very short posts
      .sort((a, b) => b.body.length - a.body.length)
      .slice(0, Math.min(14, middlePosts.length)); // Take up to 14 substantial posts
    
    // Sort back to chronological order
    substantivePosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    optimized.splice(3, 0, ...substantivePosts);
  }
  
  // Remove duplicates (in case of overlap)
  const seen = new Set<string>();
  return optimized.filter(post => {
    if (seen.has(post.id)) {
      return false;
    }
    seen.add(post.id);
    return true;
  });
}

// AI service interface
export interface AIServiceResponse {
  success: boolean;
  data?: SummaryData;
  error?: string;
  fallback?: boolean;
}

// Error types for better error handling
export enum AIServiceErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_CONTENT = 'INSUFFICIENT_CONTENT'
}

export interface AIServiceError extends Error {
  type: AIServiceErrorType;
  retryAfter?: number;
}

// Main AI service class
export class AIService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.client = openai;
  }

  /**
   * Generate thread summary using OpenAI with structured output
   */
  async generateSummary(
    thread: ForumsThread,
    posts: ForumsPost[]
  ): Promise<AIServiceResponse> {
    try {
      // Handle edge cases first
      const edgeCaseResponse = this.handleEdgeCases(thread, posts);
      if (edgeCaseResponse) {
        return edgeCaseResponse;
      }

      const prompt = createPromptTemplate(thread, posts);

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert forum thread analyzer. Provide structured, factual analysis of discussions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "thread_summary",
            schema: summarySchema
          }
        },
        temperature: 0.3,
        max_tokens: 1500
      }, {
        timeout: 30000 // 30 second timeout in options
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw this.createAIServiceError(
          AIServiceErrorType.INVALID_RESPONSE,
          'No response content from OpenAI'
        );
      }

      // Parse and validate the JSON response
      const parsedResponse = JSON.parse(responseContent);
      const validatedData = this.validateAndEnrichResponse(parsedResponse);

      return {
        success: true,
        data: validatedData
      };

    } catch (error) {
      console.error('AI service error:', error);
      return this.handleAIServiceError(error, thread, posts);
    }
  }

  /**
   * Handle edge cases before AI processing
   * Only skip AI for truly minimal content (< 50 chars total)
   */
  private handleEdgeCases(
    thread: ForumsThread,
    posts: ForumsPost[]
  ): AIServiceResponse | null {
    // Empty thread case
    if (posts.length === 0) {
      return {
        success: true,
        data: {
          summary: ["Thread has no posts yet"],
          keyPoints: ["No discussion content available"],
          contributors: [],
          sentiment: "No Discussion",
          healthScore: 0,
          healthLabel: "New Thread"
        },
        fallback: true
      };
    }

    // Check if content is substantial enough for AI processing
    const threadBodyLength = (thread.body || '').trim().length;
    const totalPostContent = posts.reduce((total, post) => total + (post.body || '').trim().length, 0);
    const totalContentLength = threadBodyLength + totalPostContent;

    // Only use fallback for truly minimal content (less than 50 characters total)
    if (totalContentLength < 50) {
      const contributorCount = new Set(posts.map(p => p.user?.username || 'Unknown User')).size;
      return {
        success: true,
        data: {
          summary: [`Discussion about: ${thread.title}`, `${posts.length} post(s) from ${contributorCount} contributor(s)`],
          keyPoints: [thread.body || "Main topic discussion"],
          contributors: posts.slice(0, 2).map(post => ({
            username: post.user?.username || 'Unknown User',
            contribution: "Participant in discussion"
          })),
          sentiment: "Neutral",
          healthScore: 6,
          healthLabel: "Needs Attention"
        },
        fallback: true
      };
    }

    return null; // No edge case, proceed with normal processing
  }

  /**
   * Handle AI service errors with appropriate fallbacks
   */
  private handleAIServiceError(
    error: unknown,
    thread: ForumsThread,
    posts: ForumsPost[]
  ): AIServiceResponse {
    const aiError = this.parseAIServiceError(error);

    // Rate limiting case
    if (aiError.type === AIServiceErrorType.RATE_LIMIT) {
      return {
        success: false,
        error: `AI service is temporarily unavailable due to rate limits. Please try again in ${aiError.retryAfter || 60} seconds.`,
        data: this.generateFallbackResponse(thread, posts),
        fallback: true
      };
    }

    // Timeout case
    if (aiError.type === AIServiceErrorType.TIMEOUT) {
      return {
        success: false,
        error: "AI processing timed out. Please try again with a shorter thread.",
        data: this.generateFallbackResponse(thread, posts),
        fallback: true
      };
    }

    // Validation error case
    if (aiError.type === AIServiceErrorType.VALIDATION_ERROR) {
      return {
        success: false,
        error: "AI response validation failed. Using fallback analysis.",
        data: this.generateFallbackResponse(thread, posts),
        fallback: true
      };
    }

    // General AI processing failure
    return {
      success: false,
      error: "AI processing failed. Showing basic thread statistics.",
      data: this.generateFallbackResponse(thread, posts),
      fallback: true
    };
  }

  /**
   * Parse different types of AI service errors
   */
  private parseAIServiceError(error: unknown): AIServiceError {
    if (error instanceof Error) {
      // Check for OpenAI rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        const retryAfter = this.extractRetryAfter(error.message);
        return {
          ...error,
          type: AIServiceErrorType.RATE_LIMIT,
          retryAfter
        } as AIServiceError;
      }

      // Check for timeout errors
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return {
          ...error,
          type: AIServiceErrorType.TIMEOUT
        } as AIServiceError;
      }

      // Check for validation errors
      if (error.message.includes('Invalid') && error.message.includes('field')) {
        return {
          ...error,
          type: AIServiceErrorType.VALIDATION_ERROR
        } as AIServiceError;
      }

      // Check for JSON parsing errors
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        return {
          ...error,
          type: AIServiceErrorType.INVALID_RESPONSE
        } as AIServiceError;
      }
    }

    // Default to API error
    return {
      name: 'AIServiceError',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: AIServiceErrorType.API_ERROR
    } as AIServiceError;
  }

  /**
   * Extract retry-after value from error message
   */
  private extractRetryAfter(errorMessage: string): number {
    const match = errorMessage.match(/retry.*?(\d+)/i);
    return match ? parseInt(match[1], 10) : 60;
  }

  /**
   * Create typed AI service error
   */
  private createAIServiceError(type: AIServiceErrorType, message: string): AIServiceError {
    return {
      name: 'AIServiceError',
      message,
      type
    } as AIServiceError;
  }
  /**
   * Validate AI response and add derived fields with enhanced error handling
   */
  private validateAndEnrichResponse(response: Record<string, unknown>): SummaryData {
    try {
      // Validate required fields exist with proper types
      if (!response.summary || !Array.isArray(response.summary)) {
        throw this.createAIServiceError(
          AIServiceErrorType.VALIDATION_ERROR,
          'Invalid summary field in AI response'
        );
      }

      if (!response.keyPoints || !Array.isArray(response.keyPoints)) {
        throw this.createAIServiceError(
          AIServiceErrorType.VALIDATION_ERROR,
          'Invalid keyPoints field in AI response'
        );
      }

      if (!response.contributors || !Array.isArray(response.contributors)) {
        throw this.createAIServiceError(
          AIServiceErrorType.VALIDATION_ERROR,
          'Invalid contributors field in AI response'
        );
      }

      if (!response.sentiment || typeof response.sentiment !== 'string') {
        throw this.createAIServiceError(
          AIServiceErrorType.VALIDATION_ERROR,
          'Invalid sentiment field in AI response'
        );
      }

      if (typeof response.healthScore !== 'number' || response.healthScore < 1 || response.healthScore > 10) {
        throw this.createAIServiceError(
          AIServiceErrorType.VALIDATION_ERROR,
          'Invalid healthScore field in AI response'
        );
      }

      // Validate sentiment enum
      const validSentiments = ['Positive', 'Neutral', 'Mixed', 'Negative'];
      if (!validSentiments.includes(response.sentiment)) {
        throw this.createAIServiceError(
          AIServiceErrorType.VALIDATION_ERROR,
          `Invalid sentiment value: ${response.sentiment}`
        );
      }

      // Validate array bounds
      if (response.summary.length > 5) {
        response.summary = response.summary.slice(0, 5);
      }

      if (response.keyPoints.length > 5) {
        response.keyPoints = response.keyPoints.slice(0, 5);
      }

      if (response.contributors.length > 4) {
        response.contributors = (response.contributors as unknown[]).slice(0, 4);
      }

      // Validate contributors structure
      const contributors = response.contributors as Record<string, unknown>[];
      contributors.forEach((contributor: Record<string, unknown>, index: number) => {
        if (!contributor.username || typeof contributor.username !== 'string') {
          throw this.createAIServiceError(
            AIServiceErrorType.VALIDATION_ERROR,
            `Invalid username in contributor ${index}`
          );
        }
        if (!contributor.contribution || typeof contributor.contribution !== 'string') {
          throw this.createAIServiceError(
            AIServiceErrorType.VALIDATION_ERROR,
            `Invalid contribution in contributor ${index}`
          );
        }
      });

      // Add derived healthLabel based on healthScore
      const healthLabel = this.getHealthLabel(response.healthScore);

      return {
        summary: response.summary as string[],
        keyPoints: response.keyPoints as string[],
        contributors: contributors as Array<{ username: string; contribution: string }>,
        sentiment: response.sentiment as 'Positive' | 'Neutral' | 'Mixed' | 'Negative',
        healthScore: response.healthScore,
        healthLabel
      };

    } catch (error) {
      // Re-throw validation errors
      if (error instanceof Error && 'type' in error) {
        throw error;
      }
      
      throw this.createAIServiceError(
        AIServiceErrorType.VALIDATION_ERROR,
        `Response validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Derive health label from health score
   */
  private getHealthLabel(healthScore: number): 'Healthy' | 'Needs Attention' | 'Heated Discussion' {
    if (healthScore >= 7) {
      return 'Healthy';
    } else if (healthScore >= 4) {
      return 'Needs Attention';
    } else {
      return 'Heated Discussion';
    }
  }

  /**
   * Generate fallback response for error cases
   */
  generateFallbackResponse(
    thread: ForumsThread,
    posts: ForumsPost[]
  ): SummaryData {
    const postCount = posts.length;
    const contributorCount = new Set(posts.map(p => p.user?.username || 'Unknown User')).size;
    const topPosters = this.getTopPosters(posts);

    return {
      summary: [`Thread contains ${postCount} posts from ${contributorCount} contributors`],
      keyPoints: ["Discussion covers multiple topics"],
      contributors: topPosters.slice(0, 2).map(user => ({
        username: user.username,
        contribution: "Active participant"
      })),
      sentiment: "Neutral",
      healthScore: 5,
      healthLabel: "Needs Attention"
    };
  }

  /**
   * Get top posters by post count for fallback
   */
  private getTopPosters(posts: ForumsPost[]): Array<{ username: string; count: number }> {
    const posterCounts = new Map<string, number>();
    
    posts.forEach(post => {
      const username = post.user?.username || 'Unknown User';
      posterCounts.set(username, (posterCounts.get(username) || 0) + 1);
    });

    return Array.from(posterCounts.entries())
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count);
  }
}

// Export singleton instance
export const aiService = new AIService();
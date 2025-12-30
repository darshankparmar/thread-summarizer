import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/shared/lib/config/auth-config';
import { threadFetcher } from '@/domains/threads/services/thread-fetcher';
import { aiService } from '@/domains/ai/services/ai-service';
import { cacheManager } from '@/infrastructure/cache/cache-manager';
import { errorHandler, ErrorCategory } from '@/services/error-handler';
import { apiMiddleware, InputValidator } from '@/infrastructure/security';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/v1/threads/[id]/summarize
 * Generate AI-powered summary for a specific forum thread
 */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  // Apply security and validation middleware
  return apiMiddleware.apply(request, async (req: NextRequest) => {
    return await handleSummarizeRequest(req, id);
  });
}

/**
 * Core summarize request handler (after middleware validation)
 */
async function handleSummarizeRequest(_request: NextRequest, threadId: string): Promise<NextResponse> {
  try {
    // Check authentication - AI features require login
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to use AI features.',
        cached: false,
        generatedAt: new Date().toISOString()
      }, { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer',
          'X-Auth-Required': 'true'
        }
      });
    }

    // Validate and sanitize thread ID
    const threadIdValidation = InputValidator.validateThreadId(threadId);
    if (!threadIdValidation.isValid || !threadIdValidation.sanitized) {
      return NextResponse.json({
        success: false,
        error: threadIdValidation.error || 'Invalid thread ID',
        cached: false,
        generatedAt: new Date().toISOString()
      }, { status: 400 });
    }

    const sanitizedThreadId = threadIdValidation.sanitized;

    // Start performance tracking
    // const requestId = performanceMonitor.startRequest(sanitizedThreadId);

    // Step 1: Fetch thread data
    const threadResult = await threadFetcher.fetchThreadData(sanitizedThreadId);
    
    if (!threadResult.success || !threadResult.data) {
      // Handle thread fetching errors with enhanced error processing
      const fallbackResponse = errorHandler.generateFallbackContent(
        { 
          title: 'Thread Not Found',
          message: threadResult.error || 'Thread not found',
          category: ErrorCategory.NOT_FOUND,
          suggestions: ['Check the thread ID', 'Try refreshing the page'],
          retryable: false,
          actionable: true
        },
        sanitizedThreadId
      );

      // performanceMonitor.endRequest?.(requestId, false);

      return NextResponse.json({
        success: false,
        error: threadResult.error || 'Thread not found',
        data: {
          summary: fallbackResponse.summary,
          keyPoints: fallbackResponse.keyPoints,
          contributors: fallbackResponse.contributors,
          sentiment: fallbackResponse.sentiment,
          healthScore: fallbackResponse.healthScore,
          healthLabel: fallbackResponse.healthLabel
        },
        cached: false,
        generatedAt: new Date().toISOString()
      }, { status: threadResult.statusCode || 404 });
    }

    const { thread, posts, lastPostTimestamp } = threadResult.data;

    // Step 2: Check cache first
    const cachedSummary = cacheManager.get(sanitizedThreadId, lastPostTimestamp);
    if (cachedSummary) {
      // performanceMonitor.endRequest?.(requestId, true, true);
      
      return NextResponse.json({
        success: true,
        data: cachedSummary.data,
        cached: true,
        generatedAt: cachedSummary.generatedAt
      });
    }

    // Step 3: Generate AI summary
    const summaryResult = await aiService.generateSummary(thread, posts);
    
    if (!summaryResult.success || !summaryResult.data) {
      // Handle AI service errors with fallback
      const fallbackResponse = errorHandler.generateFallbackContent(
        {
          title: 'AI Processing Failed',
          message: summaryResult.error || 'AI processing failed',
          category: ErrorCategory.AI_PROCESSING,
          suggestions: ['Try again later', 'Check your internet connection'],
          retryable: true,
          actionable: true
        },
        sanitizedThreadId
      );

      // performanceMonitor.endRequest?.(requestId, false);

      return NextResponse.json({
        success: false,
        error: summaryResult.error || 'AI processing failed',
        data: {
          summary: fallbackResponse.summary,
          keyPoints: fallbackResponse.keyPoints,
          contributors: fallbackResponse.contributors,
          sentiment: fallbackResponse.sentiment,
          healthScore: fallbackResponse.healthScore,
          healthLabel: fallbackResponse.healthLabel
        },
        cached: false,
        generatedAt: new Date().toISOString()
      }, { status: 500 });
    }

    // Step 4: Cache the successful result
    cacheManager.set(sanitizedThreadId, lastPostTimestamp, summaryResult.data);

    // Step 5: End performance tracking
    // performanceMonitor.endRequest?.(requestId, true, false);

    return NextResponse.json({
      success: true,
      data: summaryResult.data,
      cached: false,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error in summarize endpoint:', error);
    
    // Generate fallback response for unexpected errors
    const fallbackResponse = errorHandler.generateFallbackContent(
      {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred',
        category: ErrorCategory.UNKNOWN,
        suggestions: ['Try refreshing the page', 'Contact support if the issue persists'],
        retryable: true,
        actionable: true
      },
      threadId
    );

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      data: {
        summary: fallbackResponse.summary,
        keyPoints: fallbackResponse.keyPoints,
        contributors: fallbackResponse.contributors,
        sentiment: fallbackResponse.sentiment,
        healthScore: fallbackResponse.healthScore,
        healthLabel: fallbackResponse.healthLabel
      },
      cached: false,
      generatedAt: new Date().toISOString()
    }, { status: 500 });
  }
}
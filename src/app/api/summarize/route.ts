import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { threadFetcher } from '@/services/thread-fetcher';
import { errorHandler } from '@/services/error-handler';
import { SummarizeRequest } from '@/shared/types';
import { apiMiddleware, InputValidator } from '@/infrastructure/security';
import { authOptions } from '@/shared/lib/config';
import { cacheManager } from '@/infrastructure/cache';
import { aiService } from '@/domains/ai/services';
import { performanceMonitor } from '@/infrastructure/monitoring';

/**
 * POST /api/summarize
 * Generate AI-powered summary for a forum thread
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply security and validation middleware
  return apiMiddleware.apply(request, async (req: NextRequest) => {
    return await handleSummarizeRequest(req);
  });
}

/**
 * Core summarize request handler (after middleware validation)
 */
async function handleSummarizeRequest(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
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
    // Parse and validate request body
    const body: SummarizeRequest = await request.json();
    
    // Validate request body structure
    const bodyValidation = InputValidator.validateRequestBody(body);
    if (!bodyValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: bodyValidation.error || 'Invalid request body',
        cached: false,
        generatedAt: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate and sanitize thread ID
    const threadIdValidation = InputValidator.validateThreadId(body.threadId);
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
    const requestId = performanceMonitor.startRequest(sanitizedThreadId);

    // Step 1: Fetch thread data
    const threadResult = await threadFetcher.fetchThreadData(sanitizedThreadId);
    
    if (!threadResult.success || !threadResult.data) {
      // Handle thread fetching errors with enhanced error processing
      const processedError = errorHandler.processError(
        threadResult.error || 'Failed to fetch thread data',
        'thread fetching'
      );
      
      performanceMonitor.completeRequest(requestId, threadResult.error);
      
      // Generate fallback content for certain error types
      const fallbackData = errorHandler.generateFallbackContent(processedError, sanitizedThreadId);
      
      return NextResponse.json({
        success: false,
        error: processedError.message,
        fallback: fallbackData,
        cached: false,
        generatedAt: new Date().toISOString()
      }, { 
        status: processedError.category === 'NOT_FOUND' ? 404 : 500,
        headers: {
          'X-Error-Category': processedError.category,
          'X-Retryable': processedError.retryable.toString()
        }
      });
    }

    const { thread, posts, lastPostTimestamp } = threadResult.data;

    // Step 2: Check cache first
    const cacheKey = `summary_${sanitizedThreadId}_${lastPostTimestamp}`;
    const cachedEntry = cacheManager.get(sanitizedThreadId, lastPostTimestamp);
    
    if (cachedEntry) {
      // Return cached result instantly (< 100ms requirement)
      performanceMonitor.markCacheHit(requestId, cacheKey);
      const responseTime = Date.now() - startTime;
      performanceMonitor.completeRequest(requestId);
      
      return NextResponse.json({
        success: true,
        data: cachedEntry.data,
        cached: true,
        generatedAt: cachedEntry.generatedAt
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600', // 1 hour cache header
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'HIT'
        }
      });
    }

    // Step 3: Check if thread is suitable for AI analysis
    if (!threadFetcher.isSuitableForAnalysis(threadResult.data)) {
      // Return fallback for insufficient content
      const fallbackData = {
        summary: ["Thread has insufficient content for analysis"],
        keyPoints: ["No meaningful discussion content available"],
        contributors: [],
        sentiment: "Neutral" as const,
        healthScore: 5,
        healthLabel: "Needs Attention" as const
      };

      // Cache the fallback response
      cacheManager.set(sanitizedThreadId, lastPostTimestamp, fallbackData);

      const responseTime = Date.now() - startTime;
      performanceMonitor.completeRequest(requestId);

      return NextResponse.json({
        success: true,
        data: fallbackData,
        cached: false,
        generatedAt: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-Fallback': 'INSUFFICIENT_CONTENT'
        }
      });
    }

    // Step 4: Generate AI summary
    const aiStartTime = Date.now();
    const aiResult = await aiService.generateSummary(thread, posts);
    const aiProcessingTime = Date.now() - aiStartTime;
    
    performanceMonitor.recordAIProcessingTime(requestId, aiProcessingTime);
    
    if (!aiResult.success || !aiResult.data) {
      // Handle AI processing errors with enhanced error processing
      const processedError = errorHandler.processError(
        aiResult.error || 'AI processing failed',
        'AI summary generation'
      );
      
      const responseTime = Date.now() - startTime;
      performanceMonitor.completeRequest(requestId, aiResult.error);

      // Generate fallback content
      const fallbackData = errorHandler.generateFallbackContent(processedError, sanitizedThreadId);

      return NextResponse.json({
        success: false,
        error: processedError.message,
        fallback: fallbackData,
        cached: false,
        generatedAt: new Date().toISOString()
      }, { 
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'MISS',
          'X-AI-Status': 'FAILED',
          'X-Error-Category': processedError.category,
          'X-Retryable': processedError.retryable.toString(),
          ...(processedError.retryAfter && { 'Retry-After': processedError.retryAfter.toString() })
        }
      });
    }

    // Step 5: Cache the successful result
    cacheManager.set(sanitizedThreadId, lastPostTimestamp, aiResult.data);

    // Step 6: Record performance metrics
    const responseTime = Date.now() - startTime;
    performanceMonitor.completeRequest(requestId);

    // Ensure response time meets requirements
    if (responseTime > 3000) {
      console.warn(`Summary generation took ${responseTime}ms, exceeding 3s requirement for thread ${sanitizedThreadId}`);
    }

    // Step 7: Return successful response
    return NextResponse.json({
      success: true,
      data: aiResult.data,
      cached: false,
      generatedAt: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Status': 'MISS',
        'X-AI-Status': aiResult.fallback ? 'FALLBACK' : 'SUCCESS'
      }
    });

  } catch (error) {
    // Handle unexpected errors with enhanced error processing
    const responseTime = Date.now() - startTime;
    const processedError = errorHandler.processError(error, 'API request processing');
    
    console.error('Unexpected error in /api/summarize:', error);

    // Generate fallback content
    const fallbackData = errorHandler.generateFallbackContent(processedError);

    return NextResponse.json({
      success: false,
      error: processedError.message,
      fallback: fallbackData,
      cached: false,
      generatedAt: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Status': 'ERROR',
        'X-Error-Category': processedError.category,
        'X-Retryable': processedError.retryable.toString()
      }
    });
  }
}

/**
 * Handle unsupported HTTP methods with middleware
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return apiMiddleware.apply(request, async () => {
    return NextResponse.json({
      success: false,
      error: 'Method not allowed. Use POST to generate summaries.',
      cached: false,
      generatedAt: new Date().toISOString()
    }, { status: 405 });
  });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return apiMiddleware.apply(request, async () => {
    return NextResponse.json({
      success: false,
      error: 'Method not allowed. Use POST to generate summaries.',
      cached: false,
      generatedAt: new Date().toISOString()
    }, { status: 405 });
  });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return apiMiddleware.apply(request, async () => {
    return NextResponse.json({
      success: false,
      error: 'Method not allowed. Use POST to generate summaries.',
      cached: false,
      generatedAt: new Date().toISOString()
    }, { status: 405 });
  });
}
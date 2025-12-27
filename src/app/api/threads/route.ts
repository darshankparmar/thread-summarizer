import { NextResponse } from 'next/server';
import { ForumsApiError, forumsApi } from '@/services/forums-api';

/**
 * GET /api/threads - Fetch available threads from Foru.ms API
 */
export async function GET() {
  try {
    // Use the service layer to fetch threads
    const result = await forumsApi.fetchThreads({ limit: 10 });
    
    return NextResponse.json({
      success: true,
      threads: result.threads,
      count: result.count,
      nextCursor: result.nextCursor
    });

  } catch (error) {
    console.error('Error fetching threads:', error);

    if (error instanceof ForumsApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          statusCode: error.statusCode
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch threads'
      },
      { status: 500 }
    );
  }
}
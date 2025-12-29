import { NextResponse } from 'next/server';
import { ApiError, forumsApiClient } from '@/services/api';

/**
 * GET /api/threads - Fetch available threads from Foru.ms API
 */
export async function GET() {
  try {
    // Use the service layer to fetch threads
    const result = await forumsApiClient.threads.getThreads({ limit: 10 });
    
    return NextResponse.json({
      success: true,
      threads: result.data,
      count: result.count,
      nextCursor: result.nextCursor
    });

  } catch (error) {
    console.error('Error fetching threads:', error);

    if (error instanceof ApiError) {
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
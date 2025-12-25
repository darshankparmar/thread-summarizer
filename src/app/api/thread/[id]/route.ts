import { NextRequest, NextResponse } from 'next/server';
import { forumsApi, ForumsApiError } from '@/services/forums-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Fetch complete thread data (thread metadata + posts)
    const { thread, posts } = await forumsApi.fetchCompleteThread(threadId);

    return NextResponse.json({
      success: true,
      thread,
      posts,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Thread fetch error:', error);

    if (error instanceof ForumsApiError) {
      // Map specific API errors to appropriate HTTP status codes
      let statusCode = 500;
      if (error.statusCode === 404) {
        statusCode = 404;
      } else if (error.statusCode === 401) {
        statusCode = 401;
      } else if (error.statusCode === 429) {
        statusCode = 429;
      }

      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          statusCode: error.statusCode
        },
        { status: statusCode }
      );
    }

    // Generic error handling
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error occurred while fetching thread data' 
      },
      { status: 500 }
    );
  }
}
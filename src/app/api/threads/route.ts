import { NextRequest, NextResponse } from 'next/server';
import { ApiError, forumsApiClient } from '@/services/api';
import { ThreadQueryParams } from '@/services/api/types';

/**
 * GET /api/threads - Fetch available threads from Foru.ms API with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sort = searchParams.get('sort') || 'newest';

    // Build query parameters for the API
    const queryParams: ThreadQueryParams = { 
      limit: Math.min(limit, 50) // Cap at 50 for performance
    };

    if (cursor) {
      queryParams.cursor = cursor;
    }

    if (search) {
      queryParams.query = search;
    }

    if (tags && tags.length > 0) {
      // For now, just use the first tag since the API expects a single tagId
      queryParams.tagId = tags[0];
    }

    if (sort) {
      queryParams.filter = sort;
    }

    // Use the service layer to fetch threads
    const result = await forumsApiClient.threads.getThreads(queryParams);
    
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
import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { handleApiRouteError } from '@/shared/lib/api';

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
    const { thread, posts } = await forumsApiClient.getCompleteThread(threadId);

    return NextResponse.json({
      success: true,
      thread,
      posts,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Internal server error occurred while fetching thread data'
    });
  }
}
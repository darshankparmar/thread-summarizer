import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { handleApiRouteError } from '@/shared/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const posts = await forumsApiClient.posts.getThreadPosts(id);

    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to fetch thread posts'
    });
  }
}
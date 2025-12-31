import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { UpdatePostRequest } from '@/services/api/types';
import { getValidatedForumsTokenFromRequest } from '@/shared/lib/auth/auth-utils';
import { handleApiRouteError } from '@/shared/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await forumsApiClient.posts.getPost(id);

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to fetch post'
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsTokenFromRequest(request);

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const updates: UpdatePostRequest = {
      body: content.trim() // Map content to body for API
    };
    
    const updatedPost = await forumsApiClient.posts.updatePost(id, updates, forumsToken);

    return NextResponse.json({
      success: true,
      post: updatedPost
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to update post'
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsTokenFromRequest(request);
    
    await forumsApiClient.posts.deletePost(id, forumsToken);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to delete post'
    });
  }
}
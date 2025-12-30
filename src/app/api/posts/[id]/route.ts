import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { UpdatePostRequest } from '@/services/api/types';
import { getValidatedForumsToken } from '@/lib/auth-utils';

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
    console.error('Error fetching post:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch post' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsToken(request);

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
    // If error is already a NextResponse (from auth validation), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error('Error updating post:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update post' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsToken(request);
    
    await forumsApiClient.posts.deletePost(id, forumsToken);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    // If error is already a NextResponse (from auth validation), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error('Error deleting post:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete post' 
      },
      { status: 500 }
    );
  }
}
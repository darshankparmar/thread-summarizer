import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { CreatePostRequest } from '@/services/api/types';
import { getValidatedForumsTokenFromRequest } from '@/shared/lib/auth/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsTokenFromRequest(request);
    
    const body = await request.json();
    const { threadId, parentId, content } = body;

    if (!threadId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Thread ID and content are required' },
        { status: 400 }
      );
    }

    const postData: CreatePostRequest = {
      body: content.trim(),
      threadId,
      parentId: parentId || undefined
    };

    const newPost = await forumsApiClient.posts.createPost(postData, forumsToken);
    
    return NextResponse.json({
      success: true,
      post: newPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    
    if (error instanceof NextResponse) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create post' 
      },
      { status: 500 }
    );
  }
}
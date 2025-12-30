import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { CreatePostRequest } from '@/services/api/types';
import { executeWithTokenValidation } from '@/lib/auth-verification';

export async function POST(request: NextRequest) {
  try {
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

    // Use smart token validation with automatic retry on 401
    const result = await executeWithTokenValidation(
      request,
      async (forumsToken: string) => {
        return await forumsApiClient.posts.createPost(postData, forumsToken);
      }
    );

    if (!result.success) {
      const statusCode = result.shouldReauth ? 401 : 500;
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to create post',
          shouldReauth: result.shouldReauth 
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      post: result.data
    });

  } catch (error) {
    console.error('Error creating post:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create post' 
      },
      { status: 500 }
    );
  }
}
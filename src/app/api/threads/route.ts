import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { CreateThreadRequest } from '@/services/api/types';
import { getValidatedForumsTokenFromRequest } from '@/shared/lib/auth/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const result = await forumsApiClient.threads.getThreads(params);

    return NextResponse.json({
      success: true,
      threads: result.data || [], // Map data to threads for client compatibility
      count: result.count || 0,
      nextCursor: result.nextCursor
    });

  } catch (error) {
    console.error('Error fetching threads:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch threads',
        threads: [], // Provide empty array on error
        count: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsTokenFromRequest(request);

    const body = await request.json();
    const { title, content, tags } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const threadData: CreateThreadRequest = {
      title: title.trim(),
      body: content.trim(), // Map content to body for API
      tagIds: tags || []
    };
    
    const newThread = await forumsApiClient.threads.createThread(threadData, forumsToken);

    return NextResponse.json({
      success: true,
      thread: newThread
    });

  } catch (error) {
    console.error('Error creating thread:', error);

    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create thread' 
      },
      { status: 500 }
    );
  }
}
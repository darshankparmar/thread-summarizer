import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/domains/threads/services/api';
import { CreateThreadRequest } from '@/domains/threads/services/api/types';
import { getValidatedForumsTokenFromSession } from '@/shared/lib/auth/auth-utils';

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
    const token = await getValidatedForumsTokenFromSession();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateThreadRequest = await request.json();
    
    const thread = await forumsApiClient.threads.createThread(body, token);

    return NextResponse.json({
      success: true,
      thread
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating thread:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create thread'
      },
      { status: 500 }
    );
  }
}
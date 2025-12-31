import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient, CreateThreadRequest } from '@/services/api';
import { getValidatedForumsTokenFromSession } from '@/shared/lib/auth/auth-utils';
import { handleApiRouteError } from '@/shared/lib/api';

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
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to fetch threads',
      includeArrayFields: true
    });
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
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to create thread'
    });
  }
}
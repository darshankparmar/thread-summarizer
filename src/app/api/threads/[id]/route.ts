import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { UpdateThreadRequest } from '@/services/api/types';
import { getValidatedForumsTokenFromRequest } from '@/shared/lib/auth/auth-utils';
import { handleApiRouteError } from '@/shared/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = await forumsApiClient.threads.getThread(id);

    return NextResponse.json({
      success: true,
      thread
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to fetch thread'
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
    const { title, content, tags } = body;

    const updates: UpdateThreadRequest = {};
    
    if (title !== undefined) {
      updates.title = title.trim();
    }
    
    if (content !== undefined) {
      updates.body = content.trim(); // Map content to body for API
    }
    
    if (tags !== undefined) {
      updates.tagIds = tags;
    }
    
    const updatedThread = await forumsApiClient.threads.updateThread(id, updates, forumsToken);

    return NextResponse.json({
      success: true,
      thread: updatedThread
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to update thread'
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
    
    await forumsApiClient.threads.deleteThread(id, forumsToken);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to delete thread'
    });
  }
}
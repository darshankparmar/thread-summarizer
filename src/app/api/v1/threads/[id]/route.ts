import { NextRequest, NextResponse } from 'next/server';
import { UpdateThreadRequest, forumsApiClient } from '@/services/api';
import { getValidatedForumsTokenFromSession } from '@/shared/lib/auth/auth-utils';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const thread = await forumsApiClient.threads.getThread(id);

    return NextResponse.json({
      success: true,
      thread
    });

  } catch (error) {
    console.error('Error fetching thread:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch thread'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = await getValidatedForumsTokenFromSession();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateThreadRequest = await request.json();
    
    const thread = await forumsApiClient.threads.updateThread(id, body, token);

    return NextResponse.json({
      success: true,
      thread
    });

  } catch (error) {
    console.error('Error updating thread:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update thread'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = await getValidatedForumsTokenFromSession();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await forumsApiClient.threads.deleteThread(id, token);

    return NextResponse.json({
      success: true,
      message: 'Thread deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting thread:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete thread'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';

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
    console.error('Error fetching thread posts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch thread posts' 
      },
      { status: 500 }
    );
  }
}
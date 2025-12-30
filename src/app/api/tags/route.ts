import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { CreateTagRequest } from '@/services/api/types';
import { getValidatedForumsToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const tags = await forumsApiClient.tags.getTags(params);

    return NextResponse.json({
      success: true,
      ...tags
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tags' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsToken(request);

    const body = await request.json();
    const { name, description, color } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tagData: CreateTagRequest = {
      name: name.trim(),
      description: description?.trim(),
      color: color?.trim()
    };
    
    const newTag = await forumsApiClient.tags.createTag(tagData, forumsToken);

    return NextResponse.json({
      success: true,
      tag: newTag
    });

  } catch (error) {
    // If error is already a NextResponse (from auth validation), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error('Error creating tag:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create tag' 
      },
      { status: 500 }
    );
  }
}
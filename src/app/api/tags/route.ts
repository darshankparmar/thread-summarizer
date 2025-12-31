import { NextRequest, NextResponse } from 'next/server';
import { forumsApiClient } from '@/services/api';
import { CreateTagRequest } from '@/services/api/types';
import { getValidatedForumsTokenFromRequest } from '@/shared/lib/auth/auth-utils';
import { handleApiRouteError } from '@/shared/lib/api';

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
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to fetch tags'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and get forums token
    const forumsToken = await getValidatedForumsTokenFromRequest(request);

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
    return handleApiRouteError(error, {
      defaultMessage: 'Failed to create tag'
    });
  }
}
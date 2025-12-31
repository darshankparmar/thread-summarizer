/**
 * Reusable error response handler for API routes
 * Handles ApiError status codes and converts them to proper HTTP responses
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponseOptions {
  defaultMessage: string;
  includeArrayFields?: boolean;
}

interface ApiErrorLike extends Error {
  statusCode?: number;
}

interface ErrorResponseBody {
  success: false;
  error: string;
  threads?: unknown[];
  count?: number;
}

/**
 * Handle API route errors with proper status code forwarding
 */
export function handleApiRouteError(
  error: unknown,
  options: ApiErrorResponseOptions
): NextResponse {
  // If error is already a NextResponse (from auth validation), return it
  if (error instanceof NextResponse) {
    return error;
  }

  console.error(`API Error: ${options.defaultMessage}`, error);

  const buildResponseBody = (message: string): ErrorResponseBody => {
    const body: ErrorResponseBody = {
      success: false,
      error: message
    };

    if (options.includeArrayFields) {
      body.threads = [];
      body.count = 0;
    }

    return body;
  };

  // Handle known ApiError shape
  if (error instanceof Error && 'statusCode' in error) {
    const apiError = error as ApiErrorLike;

    return NextResponse.json(
      buildResponseBody(apiError.message),
      { status: apiError.statusCode ?? 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    buildResponseBody(
      error instanceof Error ? error.message : options.defaultMessage
    ),
    { status: 500 }
  );
}
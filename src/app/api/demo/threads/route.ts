import { NextResponse } from 'next/server';
import { demoApiService } from '@/services/demo-api';

/**
 * GET /api/demo/threads
 * Get metadata for all available demo threads
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check if demo mode is enabled
    if (!demoApiService.isDemoMode()) {
      return NextResponse.json({
        success: false,
        error: 'Demo mode is not enabled',
        threads: []
      }, { status: 404 });
    }

    // Get demo thread metadata
    const threads = demoApiService.getDemoThreadMetadata();

    return NextResponse.json({
      success: true,
      threads,
      count: threads.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minute cache
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching demo threads:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch demo threads',
      threads: []
    }, { status: 500 });
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use GET to fetch demo threads.',
    threads: []
  }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use GET to fetch demo threads.',
    threads: []
  }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use GET to fetch demo threads.',
    threads: []
  }, { status: 405 });
}
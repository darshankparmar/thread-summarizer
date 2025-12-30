/**
 * Health Check Endpoint
 * Provides system health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
    ai: 'healthy' | 'degraded' | 'unhealthy';
    forums: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    requestCount?: number;
    errorRate?: number;
    averageResponseTime?: number;
  };
}

const startTime = Date.now();

/**
 * Check individual service health
 */
async function checkServiceHealth() {
  const services: HealthStatus['services'] = {
    database: 'healthy' as const, // No database in current implementation
    cache: 'healthy' as const,    // In-memory cache is always available
    ai: 'healthy' as const,       // Will be checked if OpenAI key is available
    forums: 'healthy' as const,   // Will be checked if Forums API is available
  };

  // Check OpenAI API availability
  try {
    if (process.env.OPENAI_API_KEY) {
      // Could add a simple API call to verify OpenAI is accessible
      services.ai = 'healthy';
    } else {
      services.ai = 'degraded'; // Missing API key
    }
  } catch {
    services.ai = 'unhealthy';
  }

  // Check Forums API availability
  try {
    if (process.env.FORUMS_API_KEY && process.env.FORUMS_API_URL) {
      // Could add a simple API call to verify Forums API is accessible
      services.forums = 'healthy';
    } else {
      services.forums = 'degraded'; // Missing API configuration
    }
  } catch {
    services.forums = 'unhealthy';
  }

  return services;
}

/**
 * Determine overall system health
 */
function getOverallHealth(services: HealthStatus['services']): HealthStatus['status'] {
  const serviceStatuses = Object.values(services);
  
  if (serviceStatuses.every(status => status === 'healthy')) {
    return 'healthy';
  }
  
  if (serviceStatuses.some(status => status === 'unhealthy')) {
    return 'unhealthy';
  }
  
  return 'degraded';
}

/**
 * GET /api/health
 * Returns system health status
 */
export async function GET(): Promise<NextResponse> {
  try {
    const services = await checkServiceHealth();
    const overallHealth = getOverallHealth(services);
    
    const healthStatus: HealthStatus = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: {
        memoryUsage: process.memoryUsage(),
        // These could be populated from performance monitor
        requestCount: undefined,
        errorRate: undefined,
        averageResponseTime: undefined,
      },
    };

    // Set appropriate HTTP status based on health
    const statusCode = overallHealth === 'healthy' ? 200 : 
                      overallHealth === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch {
    // If health check itself fails, return unhealthy status
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unhealthy',
        cache: 'unhealthy',
        ai: 'unhealthy',
        forums: 'unhealthy',
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
      },
    };

    return NextResponse.json(errorStatus, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}
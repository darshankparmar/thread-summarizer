/**
 * Request Logging Middleware
 * Provides audit trail and monitoring for API requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  username?: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

/**
 * Simple in-memory logger (in production, use external logging service)
 */
class RequestLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.timestamp}] ${entry.method} ${entry.url} - ${entry.statusCode || 'pending'} - ${entry.responseTime || 0}ms - User: ${entry.username || 'anonymous'}`);
    }
  }

  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  getErrorLogs(limit: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.error || (log.statusCode && log.statusCode >= 400))
      .slice(-limit);
  }

  getUserLogs(userId: string, limit: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }
}

export const requestLogger = new RequestLogger();

/**
 * Log incoming requests
 */
export async function logRequest(request: NextRequest): Promise<LogEntry> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Get user information if authenticated
  const token = await getToken({ req: request });
  
  // Get client IP (considering proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor || realIp || 'unknown';

  const logEntry: LogEntry = {
    timestamp,
    method: request.method,
    url: request.nextUrl.pathname + request.nextUrl.search,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: Array.isArray(ip) ? ip[0] : ip,
    userId: token?.sub || undefined,
    username: token?.username || undefined,
  };

  // Store start time for response logging
  (request as { __logEntry?: LogEntry; __startTime?: number }).__logEntry = logEntry;
  (request as { __logEntry?: LogEntry; __startTime?: number }).__startTime = startTime;

  return logEntry;
}

/**
 * Log response details
 */
export function logResponse(request: NextRequest, response: NextResponse, error?: string) {
  const logEntry = (request as { __logEntry?: LogEntry; __startTime?: number }).__logEntry;
  const startTime = (request as { __logEntry?: LogEntry; __startTime?: number }).__startTime;
  
  if (logEntry && startTime) {
    logEntry.statusCode = response.status;
    logEntry.responseTime = Date.now() - startTime;
    logEntry.error = error;

    requestLogger.log(logEntry);
  }
}

/**
 * Middleware wrapper for automatic request/response logging
 */
export async function withRequestLogging(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Log the incoming request
  await logRequest(request);
  
  try {
    const response = await handler(request);
    logResponse(request, response);
    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
    
    logResponse(request, errorResponse, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get request logs (for admin/monitoring endpoints)
 */
export function getRequestLogs(type: 'all' | 'errors' | 'user', userId?: string, limit?: number) {
  switch (type) {
    case 'errors':
      return requestLogger.getErrorLogs(limit);
    case 'user':
      return userId ? requestLogger.getUserLogs(userId, limit) : [];
    default:
      return requestLogger.getLogs(limit);
  }
}
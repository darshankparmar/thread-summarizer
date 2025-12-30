/**
 * Services index - Single source of truth for all service instances
 * Provides centralized access to singleton services
 */

// Core services
export { aiService } from './ai-service';
export { CacheManager } from './cache-manager';
export { ErrorHandlerService } from './error-handler';
export { clientApi } from './client-api';
export { threadFetcher } from './thread-fetcher';
export { performanceMonitor } from './performance-monitor';

// Auth services
export { authService } from './auth';

// API clients
export { forumsApiClient } from './api';

// Re-export types for convenience
export type { UserFriendlyError, ErrorCategory } from './error-handler';
export type { CacheEntry, CacheStats, CacheConfig } from './cache-manager';
export type { SummaryData } from '../types';
/**
 * Services index - Single source of truth for all service instances
 * Provides centralized access to singleton services
 */

// Core services
export { ErrorHandlerService } from './error-handler';
export { clientApi } from './client-api';
export { threadFetcher } from './thread-fetcher';

// API clients
export { forumsApiClient } from './api';

// Re-export types for convenience
export type { UserFriendlyError, ErrorCategory } from './error-handler';
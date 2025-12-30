/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 */

// Cache Configuration
export const CACHE_CONFIG = {
  TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
  MAX_ENTRIES: 1000,
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_WINDOW: 10,
  WINDOW_MS: 60 * 1000, // 1 minute
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Request/Response Configuration
export const REQUEST_CONFIG = {
  MAX_BODY_SIZE: 1024, // 1KB
  TIMEOUT_MS: 30 * 1000, // 30 seconds
  MAX_RETRIES: 3,
} as const;

// AI Service Configuration
export const AI_CONFIG = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.3,
  MAX_TOKENS: 1500,
  TIMEOUT_MS: 30 * 1000,
  MAX_POSTS_FOR_PROCESSING: 20,
  MIN_CONTENT_LENGTH: 50,
} as const;

// Thread Processing Configuration
export const THREAD_CONFIG = {
  MAX_SUMMARY_POINTS: 5,
  MIN_KEY_POINTS: 3,
  MAX_KEY_POINTS: 5,
  MIN_CONTRIBUTORS: 2,
  MAX_CONTRIBUTORS: 4,
  MAX_NESTING_LEVEL: 5,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  CSRF_TOKEN_LENGTH: 32,
  CSRF_COOKIE_NAME: 'csrf-token',
  CSRF_HEADER_NAME: 'x-csrf-token',
  SESSION_COOKIE_MAX_AGE: 24 * 60 * 60, // 24 hours
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
  MIN_THREAD_TITLE_LENGTH: 3,
  MAX_THREAD_TITLE_LENGTH: 200,
  MIN_POST_BODY_LENGTH: 1,
  MAX_POST_BODY_LENGTH: 10000,
  MAX_USERNAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 254,
  THREAD_ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  THREAD_ID_MAX_LENGTH: 100,
} as const;

// Performance Monitoring Configuration
export const PERFORMANCE_CONFIG = {
  SLOW_REQUEST_THRESHOLD_MS: 1000,
  METRICS_RETENTION_HOURS: 24,
  MAX_METRICS_ENTRIES: 10000,
} as const;

// Error Handling Configuration
export const ERROR_CONFIG = {
  MAX_ERROR_MESSAGE_LENGTH: 500,
  DEFAULT_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 10000,
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
  FORM: 'application/x-www-form-urlencoded',
} as const;

// Environment Types
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// API Response Messages
export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Invalid input data',
  RATE_LIMITED: 'Too many requests, please try again later',
  INTERNAL_ERROR: 'An internal error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  CSRF_ERROR: 'CSRF token missing or invalid. Please refresh the page and try again.',
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  THREAD_ID: /^[a-zA-Z0-9_-]+$/,
  URL: /^https?:\/\/.+/,
  HTML_TAG: /<[^>]*>/g,
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  DANGEROUS_ATTRIBUTES: /\s*on\w+\s*=\s*["'][^"']*["']/gi,
} as const;
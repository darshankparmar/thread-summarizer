/**
 * Comprehensive error handling service for Thread Summarizer
 * Provides user-friendly error messages and fallback strategies
 */

export enum ErrorCategory {
    NETWORK = 'NETWORK',
    API = 'API',
    AI_PROCESSING = 'AI_PROCESSING',
    VALIDATION = 'VALIDATION',
    RATE_LIMIT = 'RATE_LIMIT',
    TIMEOUT = 'TIMEOUT',
    NOT_FOUND = 'NOT_FOUND',
    AUTHENTICATION = 'AUTHENTICATION',
    UNKNOWN = 'UNKNOWN'
}

export interface UserFriendlyError {
    category: ErrorCategory;
    title: string;
    message: string;
    actionable: boolean;
    retryable: boolean;
    retryAfter?: number;
    suggestions: string[];
    technicalDetails?: string;
}

export class ErrorHandlerService {
    private static instance: ErrorHandlerService;

    private constructor() { }

    public static getInstance(): ErrorHandlerService {
        if (!ErrorHandlerService.instance) {
            ErrorHandlerService.instance = new ErrorHandlerService();
        }
        return ErrorHandlerService.instance;
    }

    /**
     * Convert any error into a user-friendly error object
     */
    public processError(error: unknown, context?: string): UserFriendlyError {
        // Handle known error types
        if (error instanceof Error) {
            return this.processKnownError(error, context);
        }

        // Handle string errors
        if (typeof error === 'string') {
            return this.processStringError(error, context);
        }

        // Handle unknown error types
        return this.createUnknownError(context);
    }

    /**
     * Process known Error objects
     */
    private processKnownError(error: Error, context?: string): UserFriendlyError {
        const message = error.message.toLowerCase();
        const ctx = context?.toLowerCase() ?? '';

        const technicalDetails = context
            ? `[${context}] ${error.message}`
            : error.message;

        // Network errors
        if (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('connection') ||
            ctx.includes('network') ||
            ctx.includes('fetch')
        ) {
            return {
                category: ErrorCategory.NETWORK,
                title: 'Connection Problem',
                message:
                    'Unable to connect to the forum service. Please check your internet connection.',
                actionable: true,
                retryable: true,
                suggestions: [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Wait a moment and try again'
                ],
                technicalDetails
            };
        }

        // Rate limiting
        if (
            message.includes('rate limit') ||
            message.includes('429') ||
            message.includes('too many requests')
        ) {
            const retryAfter = this.extractRetryAfter(error.message);
            return {
                category: ErrorCategory.RATE_LIMIT,
                title: 'Service Temporarily Busy',
                message: `The service is currently handling many requests. Please wait ${retryAfter} seconds and try again.`,
                actionable: true,
                retryable: true,
                retryAfter,
                suggestions: [
                    `Wait ${retryAfter} seconds before trying again`,
                    'Try again during off-peak hours',
                    'Consider using demo mode for testing'
                ],
                technicalDetails
            };
        }

        // Timeout errors
        if (
            message.includes('timeout') ||
            message.includes('etimedout') ||
            ctx.includes('timeout')
        ) {
            return {
                category: ErrorCategory.TIMEOUT,
                title: 'Request Timed Out',
                message:
                    'The request took too long to complete. This might be due to a large thread or temporary service issues.',
                actionable: true,
                retryable: true,
                suggestions: [
                    'Try again with a smaller thread',
                    'Wait a moment and retry',
                    'Check if the thread ID is correct'
                ],
                technicalDetails
            };
        }

        // Authentication errors
        if (
            message.includes('auth') ||
            message.includes('401') ||
            message.includes('unauthorized') ||
            ctx.includes('auth')
        ) {
            return {
                category: ErrorCategory.AUTHENTICATION,
                title: 'Authentication Required',
                message:
                    'Unable to access the forum data. The service may need to be configured with proper credentials.',
                actionable: false,
                retryable: false,
                suggestions: [
                    'Contact the administrator to configure API access',
                    'Try using demo mode instead',
                    'Check if the forum service is available'
                ],
                technicalDetails
            };
        }

        // Not found errors
        if (message.includes('not found') || message.includes('404')) {
            const isThreadContext =
                ctx.includes('thread') || ctx.includes('post') || ctx.includes('comment');

            return {
                category: ErrorCategory.NOT_FOUND,
                title: isThreadContext ? 'Thread Not Found' : 'Resource Not Found',
                message: isThreadContext
                    ? 'The requested thread could not be found. Please check the thread ID and try again.'
                    : 'The requested resource could not be found.',
                actionable: true,
                retryable: false,
                suggestions: [
                    'Double-check the identifier',
                    'Make sure the resource exists',
                    'Try browsing to it directly'
                ],
                technicalDetails
            };
        }

        // AI processing errors
        if (
            message.includes('ai') ||
            message.includes('openai') ||
            message.includes('processing') ||
            ctx.includes('ai') ||
            ctx.includes('analysis')
        ) {
            return {
                category: ErrorCategory.AI_PROCESSING,
                title: 'Analysis Failed',
                message:
                    'The AI analysis service encountered an error. A basic summary is available instead.',
                actionable: true,
                retryable: true,
                suggestions: [
                    'Try again in a few moments',
                    'The basic thread statistics are still available',
                    'Consider trying with a different thread'
                ],
                technicalDetails
            };
        }

        // Validation errors
        if (
            message.includes('invalid') ||
            message.includes('validation') ||
            message.includes('required') ||
            ctx.includes('validation')
        ) {
            return {
                category: ErrorCategory.VALIDATION,
                title: 'Invalid Input',
                message:
                    'The provided input is not valid. Please check your request and try again.',
                actionable: true,
                retryable: false,
                suggestions: [
                    'Check that the thread ID is correct',
                    'Make sure all required fields are provided',
                    'Try with a different thread'
                ],
                technicalDetails
            };
        }

        // Generic API / service errors
        if (
            message.includes('api') ||
            message.includes('server') ||
            message.includes('service')
        ) {
            return {
                category: ErrorCategory.API,
                title: 'Service Error',
                message:
                    'The forum service is experiencing issues. Please try again later.',
                actionable: true,
                retryable: true,
                suggestions: [
                    'Wait a few minutes and try again',
                    'Check if the forum service is operational',
                    'Try using demo mode for testing'
                ],
                technicalDetails
            };
        }

        // Default fallback
        return {
            category: ErrorCategory.UNKNOWN,
            title: 'Unexpected Error',
            message:
                'An unexpected error occurred. Please try again or contact support if the problem persists.',
            actionable: true,
            retryable: true,
            suggestions: [
                'Try refreshing the page',
                'Wait a moment and try again',
                'Contact support if the problem continues'
            ],
            technicalDetails
        };
    }

    /**
     * Process string error messages
     */
    private processStringError(error: string, context?: string): UserFriendlyError {
        return this.processKnownError(new Error(error), context);
    }

    /**
     * Create error for unknown error types
     */
    private createUnknownError(context?: string): UserFriendlyError {
        return {
            category: ErrorCategory.UNKNOWN,
            title: 'Unknown Error',
            message: 'An unknown error occurred while processing your request.',
            actionable: true,
            retryable: true,
            suggestions: [
                'Try refreshing the page',
                'Wait a moment and try again',
                'Contact support if the problem persists'
            ],
            technicalDetails: context ? `Context: ${context}` : undefined
        };
    }

    /**
     * Extract retry-after value from error message
     */
    private extractRetryAfter(errorMessage: string): number {
        const match = errorMessage.match(/(\d+)\s*seconds?/i);
        if (match) {
            return parseInt(match[1], 10);
        }

        const retryMatch = errorMessage.match(/retry.*?(\d+)/i);
        if (retryMatch) {
            return parseInt(retryMatch[1], 10);
        }

        return 60; // Default to 60 seconds
    }

    /**
     * Generate fallback content for different error scenarios
     */
    public generateFallbackContent(error: UserFriendlyError, threadId?: string): {
        summary: string[];
        keyPoints: string[];
        contributors: Array<{ username: string; contribution: string }>;
        sentiment: 'Neutral';
        healthScore: number;
        healthLabel: 'Needs Attention';
    } {
        const baseContent = {
            summary: ['Unable to generate AI summary due to service issues'],
            keyPoints: ['Thread analysis temporarily unavailable'],
            contributors: [] as Array<{ username: string; contribution: string }>,
            sentiment: 'Neutral' as const,
            healthScore: 5 as number,
            healthLabel: 'Needs Attention' as const
        };

        switch (error.category) {
            case ErrorCategory.NOT_FOUND:
                return {
                    ...baseContent,
                    summary: [`Thread ${threadId || 'requested'} was not found`],
                    keyPoints: ['Thread may have been deleted or moved']
                };

            case ErrorCategory.NETWORK:
                return {
                    ...baseContent,
                    summary: ['Network connection issues prevented analysis'],
                    keyPoints: ['Please check your internet connection and try again']
                };

            case ErrorCategory.RATE_LIMIT:
                return {
                    ...baseContent,
                    summary: ['Service is temporarily busy with other requests'],
                    keyPoints: [`Please wait ${error.retryAfter || 60} seconds and try again`]
                };

            case ErrorCategory.AI_PROCESSING:
                return {
                    ...baseContent,
                    summary: ['AI analysis service is temporarily unavailable'],
                    keyPoints: ['Basic thread information is still accessible']
                };

            default:
                return baseContent;
        }
    }

    /**
     * Check if an error is retryable
     */
    public isRetryable(error: UserFriendlyError): boolean {
        return error.retryable && [
            ErrorCategory.NETWORK,
            ErrorCategory.TIMEOUT,
            ErrorCategory.RATE_LIMIT,
            ErrorCategory.AI_PROCESSING,
            ErrorCategory.API
        ].includes(error.category);
    }

    /**
     * Get retry delay for retryable errors
     */
    public getRetryDelay(error: UserFriendlyError): number {
        if (!this.isRetryable(error)) {
            return 0;
        }

        switch (error.category) {
            case ErrorCategory.RATE_LIMIT:
                return (error.retryAfter || 60) * 1000; // Convert to milliseconds
            case ErrorCategory.NETWORK:
                return 5000; // 5 seconds
            case ErrorCategory.TIMEOUT:
                return 10000; // 10 seconds
            case ErrorCategory.AI_PROCESSING:
                return 15000; // 15 seconds
            default:
                return 5000; // Default 5 seconds
        }
    }
}

/**
 * Default export - singleton instance
 */
export const errorHandler = ErrorHandlerService.getInstance();
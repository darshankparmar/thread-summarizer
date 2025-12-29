/**
 * Base API client for Foru.ms API
 * Provides common functionality for all API operations
 */

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  useApiKey?: boolean;
  bearerToken?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BaseApiClient {
  protected config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
  }

  /**
   * Make an authenticated API request
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      timeout = this.config.timeout,
      useApiKey = true,
      bearerToken
    } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ThreadSummarizer/2.0',
      ...customHeaders
    };

    // Add authentication headers
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    } else if (useApiKey && this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout!)
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, requestOptions);

      if (!response.ok) {
        await this.handleErrorResponse(response, endpoint);
      }

      // Handle empty responses (like DELETE operations)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error) {
      throw this.handleRequestError(error, endpoint);
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response, endpoint: string): Promise<never> {
    let errorMessage = `API request failed with status ${response.status}`;
    
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parsing errors for error responses
    }

    switch (response.status) {
      case 401:
        throw new ApiError('Authentication failed - invalid credentials', 401);
      case 403:
        throw new ApiError('Access forbidden - insufficient permissions', 403);
      case 404:
        throw new ApiError(`Resource not found: ${endpoint}`, 404);
      case 409:
        throw new ApiError('Conflict - resource already exists or is in use', 409);
      case 422:
        throw new ApiError('Validation failed - invalid data provided', 422);
      case 429:
        throw new ApiError('Rate limit exceeded - please try again later', 429);
      case 500:
        throw new ApiError('Internal server error - please try again later', 500);
      default:
        throw new ApiError(errorMessage, response.status);
    }
  }

  /**
   * Handle network and other request errors
   */
  private handleRequestError(error: unknown, endpoint: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError) {
      return new ApiError(
        'Network error - unable to connect to Foru.ms API',
        undefined,
        error as Error
      );
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return new ApiError(
        'Request timeout - Foru.ms API did not respond in time',
        undefined,
        error as Error
      );
    }

    return new ApiError(
      `Unexpected error occurred for ${endpoint}`,
      undefined,
      error as Error
    );
  }

  /**
   * Build query string from parameters
   */
  protected buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
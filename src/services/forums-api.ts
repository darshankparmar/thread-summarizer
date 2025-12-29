import { ForumsThread, ForumsPost, ForumsUser } from '@/types';

/**
 * Configuration for Foru.ms API client
 */
interface ForumsApiConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Error types for Foru.ms API operations
 */
export class ForumsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ForumsApiError';
  }
}

/**
 * Foru.ms API client for fetching thread and post data
 */
export class ForumsApiClient {
  private config: ForumsApiConfig;

  constructor(config: ForumsApiConfig) {
    this.config = config;
  }

  /**
   * Common method to make API requests with consistent error handling
   * @private
   */
  private async makeApiRequest(
    endpoint: string, 
    options: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
      timeout?: number;
      useApiKey?: boolean;
      bearerToken?: string;
    } = {}
  ): Promise<unknown> {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      timeout = 10000,
      useApiKey = true,
      bearerToken
    } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ThreadSummarizer/1.0',
      ...customHeaders
    };

    // Add authentication headers
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    } else if (useApiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, requestOptions);

    if (!response.ok) {
      if (response.status === 401) {
        throw new ForumsApiError('Authentication failed - invalid credentials', 401);
      }
      if (response.status === 404) {
        throw new ForumsApiError(`Resource not found: ${endpoint}`, 404);
      }
      if (response.status === 429) {
        throw new ForumsApiError('Rate limit exceeded - please try again later', 429);
      }
      throw new ForumsApiError(
        `API request failed with status ${response.status}`,
        response.status
      );
    }

    return response.json();
  }

  /**
   * Authenticate user with Foru.ms API
   * @param login - Username or email
   * @param password - User password
   * @returns Promise<{user: ForumsUser, token: string}> - User data and JWT token
   * @throws ForumsApiError - When authentication fails
   */
  async authenticateUser(login: string, password: string): Promise<{user: ForumsUser, token: string}> {
    if (!login || !password) {
      throw new ForumsApiError('Login and password are required');
    }

    try {
      // Step 1: Login to get JWT token
      const loginData = await this.makeApiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { login, password },
        useApiKey: true,
        timeout: 15000
      }) as { token: string };

      // Step 2: Get user information using the JWT token
      const userData = await this.makeApiRequest('/api/v1/auth/me', {
        method: 'GET',
        bearerToken: loginData.token,
        useApiKey: false,
        timeout: 10000
      }) as ForumsUser;

      // Validate user data structure
      if (!this.isValidUser(userData)) {
        throw new ForumsApiError('Invalid user data received from API');
      }

      return {
        user: userData,
        token: loginData.token
      };
    } catch (error) {
      if (error instanceof ForumsApiError) {
        // Customize error messages for authentication
        if (error.statusCode === 401) {
          throw new ForumsApiError('Invalid username/email or password', 401);
        }
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Authentication failed', undefined, error as Error);
    }
  }

  /**
   * Register new user with Foru.ms API
   * @param userData - User registration data
   * @returns Promise<ForumsUser> - Created user data
   * @throws ForumsApiError - When registration fails
   */
  async registerUser(userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
    roles?: string[];
    extendedData?: Record<string, unknown>;
  }): Promise<ForumsUser> {
    if (!userData.username || !userData.email || !userData.password) {
      throw new ForumsApiError('Username, email, and password are required');
    }

    try {
      const createdUser = await this.makeApiRequest('/api/v1/auth/register', {
        method: 'POST',
        body: userData,
        useApiKey: false, // Don't use API key for registration
        timeout: 15000
      }) as ForumsUser;

      // Validate user data structure
      if (!this.isValidUser(createdUser)) {
        throw new ForumsApiError('Invalid user data received from API');
      }

      return createdUser;
    } catch (error) {
      if (error instanceof ForumsApiError) {
        // Customize error messages for registration
        if (error.statusCode === 400) {
          throw new ForumsApiError('Registration failed - invalid data or user already exists', 400);
        }
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Registration failed', undefined, error as Error);
    }
  }

  /**
   * Get user information using JWT token
   * @param token - JWT token from login
   * @returns Promise<ForumsUser> - User data
   * @throws ForumsApiError - When request fails
   */
  async getUserInfo(token: string): Promise<ForumsUser> {
    if (!token) {
      throw new ForumsApiError('JWT token is required');
    }

    try {
      const userData = await this.makeApiRequest('/api/v1/auth/me', {
        method: 'GET',
        bearerToken: token,
        useApiKey: false,
        timeout: 10000
      }) as ForumsUser;

      // Validate user data structure
      if (!this.isValidUser(userData)) {
        throw new ForumsApiError('Invalid user data received from API');
      }

      return userData;
    } catch (error) {
      if (error instanceof ForumsApiError) {
        // Customize error messages for user info
        if (error.statusCode === 401) {
          throw new ForumsApiError('Invalid or expired token', 401);
        }
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Failed to get user information', undefined, error as Error);
    }
  }

  /**
   * Fetch a list of threads from Foru.ms API
   * @param options - Optional query parameters for filtering and pagination
   * @returns Promise<ForumsThread[]> - Array of threads
   * @throws ForumsApiError - When API request fails
   */
  async fetchThreads(options: {
    limit?: number;
    cursor?: string;
    query?: string;
    tagId?: string;
    filter?: string;
    type?: string;
    userId?: string;
  } = {}): Promise<{ threads: ForumsThread[]; count: number; nextCursor?: string }> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.cursor) params.append('cursor', options.cursor);
      if (options.query) params.append('query', options.query);
      if (options.tagId) params.append('tagId', options.tagId);
      if (options.filter) params.append('filter', options.filter);
      if (options.type) params.append('type', options.type);
      if (options.userId) params.append('userId', options.userId);

      const queryString = params.toString();
      const endpoint = `/api/v1/threads${queryString ? `?${queryString}` : ''}`;
      
      const data = await this.makeApiRequest(endpoint);
      
      // Type guard for the response data
      const responseData = data as { threads?: ForumsThread[]; count?: number; nextThreadCursor?: string } | ForumsThread[];
      
      // Handle both array response and paginated response
      const threads = Array.isArray(responseData) ? responseData : responseData.threads || [];
      const count = Array.isArray(responseData) ? responseData.length : responseData.count || threads.length;
      const nextCursor = Array.isArray(responseData) ? undefined : responseData.nextThreadCursor;
      
      // Validate each thread structure
      if (!Array.isArray(threads) || !threads.every(thread => this.isValidThread(thread))) {
        throw new ForumsApiError('Invalid thread data received from API');
      }

      return { 
        threads: threads as ForumsThread[], 
        count,
        nextCursor 
      };
    } catch (error) {
      if (error instanceof ForumsApiError) {
        throw error;
      }
      
      // Handle network errors (including generic TypeError)
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Unexpected error occurred', undefined, error as Error);
    }
  }

  /**
   * Fetch thread metadata from Foru.ms API
   * @param threadId - The ID of the thread to fetch
   * @returns Promise<ForumsThread> - Thread metadata
   * @throws ForumsApiError - When API request fails
   */
  async fetchThread(threadId: string): Promise<ForumsThread> {
    if (!threadId || threadId.trim() === '') {
      throw new ForumsApiError('Thread ID is required');
    }

    try {
      const data = await this.makeApiRequest(`/api/v1/thread/${threadId}`);
      
      // Validate response structure
      if (!this.isValidThread(data)) {
        throw new ForumsApiError('Invalid thread data received from API');
      }

      return data as ForumsThread;
    } catch (error) {
      if (error instanceof ForumsApiError) {
        // Customize 404 error message for thread endpoint
        if (error.statusCode === 404) {
          throw new ForumsApiError(`Thread with ID ${threadId} not found`, 404);
        }
        throw error;
      }
      
      // Handle network errors (including generic TypeError)
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Unexpected error occurred', undefined, error as Error);
    }
  }

  /**
   * Fetch all posts for a given thread from Foru.ms API
   * @param threadId - The ID of the thread whose posts to fetch
   * @returns Promise<ForumsPost[]> - Array of posts in the thread
   * @throws ForumsApiError - When API request fails
   */
  async fetchThreadPosts(threadId: string): Promise<ForumsPost[]> {
    if (!threadId || threadId.trim() === '') {
      throw new ForumsApiError('Thread ID is required');
    }

    try {
      const data = await this.makeApiRequest(`/api/v1/thread/${threadId}/posts`, { timeout: 15000 });
      
      // Type guard for the response data
      const responseData = data as { posts?: ForumsPost[] } | ForumsPost[];
      
      // Handle both array response and paginated response
      const posts = Array.isArray(responseData) ? responseData : responseData.posts || [];
      
      // Validate each post structure
      if (!Array.isArray(posts) || !posts.every(post => this.isValidPost(post))) {
        throw new ForumsApiError('Invalid post data received from API');
      }

      return posts as ForumsPost[];
    } catch (error) {
      if (error instanceof ForumsApiError) {
        // Customize 404 error message for posts endpoint
        if (error.statusCode === 404) {
          throw new ForumsApiError(`Posts for thread ${threadId} not found`, 404);
        }
        throw error;
      }
      
      // Handle network errors (including generic TypeError)
      if (error instanceof TypeError) {
        throw new ForumsApiError('Network error - unable to connect to Foru.ms API', undefined, error as Error);
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ForumsApiError('Request timeout - Foru.ms API did not respond in time', undefined, error as Error);
      }
      
      throw new ForumsApiError('Unexpected error occurred', undefined, error as Error);
    }
  }

  /**
   * Fetch both thread metadata and posts in a single operation
   * @param threadId - The ID of the thread to fetch completely
   * @returns Promise<{thread: ForumsThread, posts: ForumsPost[]}> - Complete thread data
   * @throws ForumsApiError - When any API request fails
   */
  async fetchCompleteThread(threadId: string): Promise<{thread: ForumsThread, posts: ForumsPost[]}> {
    try {
      // Fetch thread and posts concurrently for better performance
      const [thread, posts] = await Promise.all([
        this.fetchThread(threadId),
        this.fetchThreadPosts(threadId)
      ]);

      return { thread, posts };
    } catch (error) {
      // Re-throw ForumsApiError as-is
      if (error instanceof ForumsApiError) {
        throw error;
      }
      throw new ForumsApiError('Failed to fetch complete thread data', undefined, error as Error);
    }
  }

  /**
   * Validate user data structure
   * @private
   */
  private isValidUser(data: unknown): data is ForumsUser {
    if (!data || typeof data !== 'object') return false;
    
    const user = data as Record<string, unknown>;
    return (
      typeof user.id === 'string' &&
      typeof user.username === 'string' &&
      (user.email === undefined || typeof user.email === 'string') &&
      (user.displayName === undefined || typeof user.displayName === 'string') &&
      (user.emailVerified === undefined || typeof user.emailVerified === 'boolean') &&
      (user.image === undefined || typeof user.image === 'string') &&
      (user.roles === undefined || Array.isArray(user.roles))
    );
  }

  /**
   * Validate thread data structure
   * @private
   */
  private isValidThread(data: unknown): data is ForumsThread {
    if (!data || typeof data !== 'object') return false;
    
    const thread = data as Record<string, unknown>;
    return (
      typeof thread.id === 'string' &&
      typeof thread.title === 'string' &&
      typeof thread.body === 'string' &&
      typeof thread.createdAt === 'string' &&
      typeof thread.updatedAt === 'string' &&
      thread.user !== null &&
      typeof thread.user === 'object' &&
      typeof (thread.user as Record<string, unknown>).id === 'string' &&
      typeof (thread.user as Record<string, unknown>).username === 'string'
    );
  }

  /**
   * Validate post data structure
   * @private
   */
  private isValidPost(data: unknown): data is ForumsPost {
    if (!data || typeof data !== 'object') return false;
    
    const post = data as Record<string, unknown>;
    return (
      typeof post.id === 'string' &&
      typeof post.body === 'string' &&
      typeof post.threadId === 'string' &&
      typeof post.userId === 'string' &&
      typeof post.createdAt === 'string'
      // Note: user object is optional in posts, so we don't validate it as required
      // likes, upvotes, and other fields are also optional
    );
  }
}

/**
 * Factory function to create a configured Foru.ms API client
 * @param config - Optional configuration override
 * @returns ForumsApiClient instance
 */
export function createForumsApiClient(config?: Partial<ForumsApiConfig>): ForumsApiClient {
  const defaultConfig: ForumsApiConfig = {
    baseUrl: process.env.FORUMS_API_URL || 'https://api.foru.ms',
    apiKey: process.env.FORUMS_API_KEY || ''
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.apiKey) {
    throw new ForumsApiError('FORUMS_API_KEY environment variable is required');
  }

  return new ForumsApiClient(finalConfig);
}

/**
 * Default export - pre-configured client instance
 */
export const forumsApi = createForumsApiClient();
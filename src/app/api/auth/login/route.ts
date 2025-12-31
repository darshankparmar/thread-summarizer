import { NextRequest, NextResponse } from 'next/server';
import { LoginRequest, LoginResponse } from '@/shared/types';
import { apiMiddleware } from '@/infrastructure/security';
import { authService } from '@/domains/auth/services';
import { handleApiRouteError } from '@/shared/lib/api';

/**
 * POST /api/auth/login
 * Authenticate user with Foru.ms API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply security and validation middleware
  return apiMiddleware.apply(request, async (req: NextRequest) => {
    return await handleLoginRequest(req);
  });
}

/**
 * Core login request handler (after middleware validation)
 */
async function handleLoginRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body: LoginRequest = await request.json();

    // Validate request body structure
    const bodyValidation = validateLoginRequest(body);
    if (!bodyValidation.isValid) {
      const response: LoginResponse = {
        success: false,
        error: bodyValidation.error || 'Invalid request body'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Authenticate user
    const loginResult = await authService.login(body);

    if (!loginResult.success) {
      const response: LoginResponse = {
        success: false,
        error: loginResult.error || 'Authentication failed'
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Return successful response (without sensitive token data)
    const response: LoginResponse = {
      success: true,
      user: {
        id: loginResult.user!.id,
        username: loginResult.user!.username,
        email: loginResult.user!.email,
        name: loginResult.user!.name,
        image: loginResult.user!.image,
        roles: loginResult.user!.roles,
        // forumsToken is excluded for security
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    return handleApiRouteError(error, {
      defaultMessage: 'Login Failed. Internal server error'
    });
  }
}

/**
 * Validate login request body
 */
function validateLoginRequest(body: unknown): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const loginData = body as Record<string, unknown>;

  // Check required fields
  if (!loginData.login || typeof loginData.login !== 'string') {
    return { isValid: false, error: 'login field is required and must be a string' };
  }

  if (!loginData.password || typeof loginData.password !== 'string') {
    return { isValid: false, error: 'password field is required and must be a string' };
  }

  // Validate login field (username or email)
  const login = loginData.login.trim();
  if (login.length === 0) {
    return { isValid: false, error: 'login cannot be empty' };
  }

  if (login.length > 100) {
    return { isValid: false, error: 'login is too long (maximum 100 characters)' };
  }

  // Validate password
  if (loginData.password.length === 0) {
    return { isValid: false, error: 'password cannot be empty' };
  }

  if (loginData.password.length > 200) {
    return { isValid: false, error: 'password is too long' };
  }

  // Check for unexpected fields
  const allowedFields = ['login', 'password'];
  const bodyFields = Object.keys(loginData);
  const unexpectedFields = bodyFields.filter(field => !allowedFields.includes(field));

  if (unexpectedFields.length > 0) {
    return { isValid: false, error: `Unexpected fields: ${unexpectedFields.join(', ')}` };
  }

  return { isValid: true };
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to login.'
  }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to login.'
  }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to login.'
  }, { status: 405 });
}
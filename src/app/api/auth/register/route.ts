import { NextRequest, NextResponse } from 'next/server';
import { RegisterRequest, RegisterResponse } from '@/shared/types';
import { apiMiddleware } from '@/infrastructure/security';
import { authService } from '@/domains/auth/services';

/**
 * POST /api/auth/register
 * Register new user with Foru.ms API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply security and validation middleware
  return apiMiddleware.apply(request, async (req: NextRequest) => {
    return await handleRegisterRequest(req);
  });
}

/**
 * Core register request handler (after middleware validation)
 */
async function handleRegisterRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body: RegisterRequest = await request.json();
    
    // Validate request body structure
    const bodyValidation = validateRegisterRequest(body);
    if (!bodyValidation.isValid) {
      const response: RegisterResponse = {
        success: false,
        error: bodyValidation.error || 'Invalid request body'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Register user
    const registerResult = await authService.register(body);

    if (!registerResult.success) {
      const response: RegisterResponse = {
        success: false,
        error: registerResult.error || 'Registration failed'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Return successful response
    const response: RegisterResponse = {
      success: true,
      user: registerResult.user
    };

    return NextResponse.json(response, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Register API error:', error);
    
    const response: RegisterResponse = {
      success: false,
      error: 'Internal server error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Validate register request body
 */
function validateRegisterRequest(body: unknown): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const registerData = body as Record<string, unknown>;
  
  // Check required fields
  if (!registerData.username || typeof registerData.username !== 'string') {
    return { isValid: false, error: 'username field is required and must be a string' };
  }

  if (!registerData.email || typeof registerData.email !== 'string') {
    return { isValid: false, error: 'email field is required and must be a string' };
  }

  if (!registerData.password || typeof registerData.password !== 'string') {
    return { isValid: false, error: 'password field is required and must be a string' };
  }

  // Validate username
  const username = registerData.username.trim();
  if (username.length === 0) {
    return { isValid: false, error: 'username cannot be empty' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'username must be at least 3 characters long' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'username is too long (maximum 50 characters)' };
  }

  // Validate username format (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'username can only contain letters, numbers, and underscores' };
  }

  // Validate email
  const email = registerData.email.trim();
  if (email.length === 0) {
    return { isValid: false, error: 'email cannot be empty' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'please enter a valid email address' };
  }

  if (email.length > 100) {
    return { isValid: false, error: 'email is too long (maximum 100 characters)' };
  }

  // Validate password
  if (registerData.password.length < 8) {
    return { isValid: false, error: 'password must be at least 8 characters long' };
  }

  if (registerData.password.length > 200) {
    return { isValid: false, error: 'password is too long' };
  }

  // Validate optional displayName
  if (registerData.displayName !== undefined) {
    if (typeof registerData.displayName !== 'string') {
      return { isValid: false, error: 'displayName must be a string' };
    }
    
    const displayName = registerData.displayName.trim();
    if (displayName.length > 100) {
      return { isValid: false, error: 'displayName is too long (maximum 100 characters)' };
    }
  }

  // Check for unexpected fields
  const allowedFields = ['username', 'email', 'password', 'displayName'];
  const bodyFields = Object.keys(registerData);
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
    error: 'Method not allowed. Use POST to register.'
  }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to register.'
  }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST to register.'
  }, { status: 405 });
}
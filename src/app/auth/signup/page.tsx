'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { RegisterRequest, RegisterResponse } from '@/shared/types';
import { Spinner } from '@/shared/components/ui/spinner';

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect authenticated users
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
      router.refresh();
    }
  }, [status, session, router]);

  // Show loading while checking authentication status
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" className="w-16 h-16" />
      </div>
    );
  }

  // Don't render the form if user is authenticated (will redirect)
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" className="w-16 h-16" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const registerData: RegisterRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        displayName: formData.displayName.trim() || undefined
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const result: RegisterResponse = await response.json();

      if (!result.success) {
        setError(result.error || 'Registration failed');
      } else {
        setSuccess(true);
        // Redirect to sign in page after successful registration
        setTimeout(() => {
          router.push('/auth/signin?message=Registration successful. Please sign in.');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Registration Successful!
                </h2>
                <p className="text-text-secondary mb-6">
                  Your account has been created successfully. You will be redirected to the sign-in page shortly.
                </p>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                >
                  Continue to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-text-secondary">
            Join Foru.ms to access AI-powered thread analysis
          </p>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create your account to unlock thread analysis features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                    Username *
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a username"
                    disabled={loading}
                    className="w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    3-50 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
                    Full Name
                  </label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Your full name (optional)"
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                    Password *
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    disabled={loading}
                    className="w-full"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    At least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                    Confirm Password *
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" className="w-4 h-4" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-text-secondary">
                <Link 
                  href="/" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  ← Back to Home
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-surface/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-sm text-text-secondary">
                Join the community and unlock AI-powered insights for forum discussions. 
                Your account will be created on Foru.ms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
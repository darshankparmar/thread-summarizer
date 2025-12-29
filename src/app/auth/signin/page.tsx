'use client';

import { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

function SignInContent() {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('forums-credentials', {
        login: formData.login,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username/email or password');
      } else if (result?.ok) {
        // Refresh session and redirect
        await getSession();
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError('An unexpected error occurred');
      }
    } catch (err) {
      console.error('Sign in error:', err);
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Sign In
          </h1>
          <p className="text-text-secondary">
            Sign in to your Foru.ms account to access AI features
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access thread analysis features
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
                  <label htmlFor="login" className="block text-sm font-medium text-text-primary mb-2">
                    Username or Email
                  </label>
                  <Input
                    id="login"
                    name="login"
                    type="text"
                    required
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder="Enter your username or email"
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.login.trim() || !formData.password.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-text-secondary">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign up
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
              <div className="text-2xl mb-2">🔐</div>
              <p className="text-sm text-text-secondary">
                Your credentials are securely authenticated with Foru.ms. 
                AI features require authentication to ensure proper access control.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-secondary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
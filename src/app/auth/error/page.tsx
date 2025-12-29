'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const errorMessages: Record<string, { title: string; description: string; action?: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in.',
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification token has expired or has already been used.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
    action: 'Try signing in again'
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The username/email or password you entered is incorrect.',
    action: 'Check your credentials and try again'
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
    action: 'Please sign in to continue'
  }
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Authentication Error
          </h1>
          <p className="text-text-secondary">
            Something went wrong during authentication
          </p>
        </div>

        {/* Error Card */}
        <Card>
          <CardHeader>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
            </div>
            <CardTitle className="text-center">{errorInfo.title}</CardTitle>
            <CardDescription className="text-center">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Error Code: {error}</AlertTitle>
              <AlertDescription>
                {errorInfo.action || 'Please try again or contact support if the problem persists.'}
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full"
                size="lg"
              >
                Try Sign In Again
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-surface/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl mb-2">💡</div>
              <h3 className="font-semibold text-text-primary mb-2">Need Help?</h3>
              <p className="text-sm text-text-secondary mb-4">
                If you continue to experience issues, here are some things you can try:
              </p>
              <ul className="text-sm text-text-secondary text-left space-y-1">
                <li>• Clear your browser cache and cookies</li>
                <li>• Try using a different browser</li>
                <li>• Check if your account exists on Foru.ms</li>
                <li>• Ensure you&apos;re using the correct credentials</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-secondary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import Avatar from '@/shared/components/common/Avatar';
import { Spinner } from '@/shared/components/ui';

interface DashboardStats {
  summariesGenerated: number;
  threadsAnalyzed: number;
  lastActivity: string;
  favoriteTopics: string[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    summariesGenerated: 0,
    threadsAnalyzed: 0,
    lastActivity: 'Never',
    favoriteTopics: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats from localStorage (in a real app, this would come from an API)
      const savedStats = localStorage.getItem('userStats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        // Initialize default stats
        const defaultStats: DashboardStats = {
          summariesGenerated: 0,
          threadsAnalyzed: 0,
          lastActivity: 'Never',
          favoriteTopics: ['General Discussion', 'Technology', 'Help & Support']
        };
        setStats(defaultStats);
        localStorage.setItem('userStats', JSON.stringify(defaultStats));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (newStats: Partial<DashboardStats>) => {
    const updatedStats = { ...stats, ...newStats };
    setStats(updatedStats);
    localStorage.setItem('userStats', JSON.stringify(updatedStats));
  };

  // Use updateStats when needed (placeholder for future functionality)
  // This function will be used when implementing activity tracking
  void updateStats;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Loading dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              You must be signed in to view the dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={session.user?.image || undefined}
              username={session.user?.username || session.user?.name || 'User'}
              size="lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Welcome back, {session.user?.username || session.user?.name}!
              </h1>
              <p className="text-sm text-text-secondary">
                Here&apos;s your ThreadWise activity overview
              </p>
            </div>
          </div>

          {/* Development Mode Notice */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <AlertDescription className="text-blue-800 text-blue-800">
                <strong>Development Mode:</strong> This dashboard is currently in development.
                Features and data shown here are for demonstration purposes and will be enhanced in future updates.
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Summaries Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {stats.summariesGenerated}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                AI-powered analyses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Threads Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {stats.threadsAnalyzed}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Unique discussions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {stats.lastActivity}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Most recent use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Account Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {(() => {
                  const roles = session.user?.roles || [];
                  const hasAdminRole = roles.some(role =>
                    typeof role === 'string' ? role === 'admin' : role.name === 'admin'
                  );
                  return hasAdminRole ? 'Admin' : 'User';
                })()}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Access level
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => router.push('/')}
                className="w-full justify-start"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Browse Threads
              </Button>

              <Button
                onClick={() => router.push('/profile')}
                className="w-full justify-start"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  const threadId = prompt('Enter thread ID to analyze:');
                  if (threadId?.trim()) {
                    router.push(`/thread/${threadId.trim()}`);
                  }
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analyze Thread
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => window.open('https://foru.ms', '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Foru.ms
              </Button>
            </CardContent>
          </Card>

          {/* Favorite Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Topics</CardTitle>
              <CardDescription>
                Topics you engage with most
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.favoriteTopics.length > 0 ? (
                  stats.favoriteTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-text-primary font-medium">{topic}</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        #{index + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-text-secondary">
                      Start analyzing threads to see your favorite topics here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest ThreadWise interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="font-semibold text-text-primary mb-2">No Recent Activity</h3>
              <p className="text-text-secondary mb-4">
                Start analyzing threads to see your activity history here
              </p>
              <Button
                onClick={() => router.push('/')}
              >
                Browse Threads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Avatar from '@/components/Avatar';
import { ForumsUser } from '@/types';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<ForumsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    theme: 'system',
    emailNotifications: true,
    summaryNotifications: true
  });

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData: ForumsUser = {
        id: (session?.user as { id?: string })?.id || '',
        username: (session?.user as { username?: string })?.username || session?.user?.name || '',
        email: session?.user?.email || '',
        displayName: session?.user?.name || '',
        image: session?.user?.image || '',
        roles: (session?.user as { roles?: string[] })?.roles || ['user'],
        emailVerified: (session?.user as { emailVerified?: boolean })?.emailVerified || false,
      };

      setUserProfile(profileData);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }

    if (status === 'authenticated' && session) {
      // Load user profile data
      loadUserProfile();
      // Load preferences from localStorage
      loadPreferences();
    }
  }, [status, session, router, loadUserProfile]);

  const loadPreferences = () => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const savePreferences = () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      // Show success message (you could add a toast notification here)
      alert('Preferences saved successfully!');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save preferences');
    }
  };

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              Unable to load user profile. Please try signing in again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">User Profile</h1>
          <p className="text-text-secondary">Manage your account settings and preferences</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your account information from Foru.ms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={userProfile.image}
                  username={userProfile.username}
                  size="lg"
                />
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {userProfile.displayName || userProfile.username}
                  </h3>
                  <p className="text-sm text-text-secondary">@{userProfile.username}</p>
                  <div className="flex gap-1 mt-1">
                    {userProfile.roles?.map((role) => {
                      // Handle both string roles and role objects
                      const roleName = typeof role === 'string' ? role : role.name;
                      return (
                        <span
                          key={typeof role === 'string' ? role : role.id}
                          className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {roleName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Username
                  </label>
                  <Input
                    value={userProfile.username}
                    disabled
                    className="bg-secondary/10"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1">
                    Email Address
                    <span
                      className={`flex items-center gap-1 text-xs ${userProfile.emailVerified ? 'text-green-600' : 'text-red-500'
                        }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${userProfile.emailVerified ? 'bg-green-500' : 'bg-red-500'
                          }`}
                      />
                      {userProfile.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </label>

                  <Input
                    value={userProfile.email || ''}
                    disabled
                    className="bg-secondary/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Full Name
                  </label>
                  <Input
                    value={userProfile.displayName || ''}
                    disabled
                    className="bg-secondary/10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your ThreadWise experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Preference */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Theme Preference
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary/20 rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary">
                  Notification Preferences
                </label>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">Email Notifications</p>
                    <p className="text-xs text-text-secondary">Receive updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-secondary/20 rounded focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">Summary Notifications</p>
                    <p className="text-xs text-text-secondary">Get notified when summaries are ready</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.summaryNotifications}
                    onChange={(e) => handlePreferenceChange('summaryNotifications', e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-secondary/20 rounded focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={savePreferences}
                className="w-full"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
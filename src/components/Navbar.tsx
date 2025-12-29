'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import Avatar from './Avatar';
import ClientThemeToggle from './ClientThemeToggle';
import { getUserDisplayInfo } from '@/lib/auth-utils';

export default function Navbar() {
  const { data: session, status } = useSession();
  const userInfo = getUserDisplayInfo(session);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-secondary/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
              {/* Gradient background with better contrast */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
              {/* Letter T */}
              <span className="relative text-white font-bold text-lg drop-shadow-sm">T</span>
            </div>
            <span className="text-xl font-bold text-text-primary">ThreadWise</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              Home
            </Link>
            {session && (
              <Link 
                href="/dashboard" 
                className="text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Dashboard
              </Link>
            )}
            <Link 
              href="/about" 
              className="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              About
            </Link>
          </div>

          {/* Auth & Theme Toggle */}
          <div className="flex items-center gap-4">
            {/* Authentication Status */}
            {status === 'loading' ? (
              <div className="w-8 h-8 border-2 border-secondary/20 border-t-primary rounded-full animate-spin"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <Avatar 
                    src={userInfo.avatar} 
                    username={userInfo.username} 
                    size="sm" 
                  />
                  <div className="text-sm">
                    <p className="text-text-primary font-medium">
                      {userInfo.displayName || userInfo.username}
                    </p>
                    <p className="text-text-secondary text-xs capitalize">
                      {userInfo.primaryRole}
                    </p>
                  </div>
                </div>
                
                {/* User Menu Dropdown (simplified for now) */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => window.location.href = '/profile'}
                    variant="ghost"
                    size="sm"
                    className="text-sm hidden sm:flex"
                  >
                    Profile
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.location.href = '/auth/signin'}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => window.location.href = '/auth/signup'}
                  size="sm"
                  className="text-sm"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Theme Toggle */}
            <ClientThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
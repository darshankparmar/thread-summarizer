'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button, Spinner } from '@/shared/components/ui';
import Avatar from '@/shared/components/common/Avatar';
import ClientThemeToggle from '@/shared/components/common/ClientThemeToggle';
import { getUserDisplayInfo } from '@/shared/lib/auth/client-auth-utils';
import {
  Menu,
  X,
  Home,
  Plus,
  LayoutDashboard,
  Info,
  User,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';

// NavLink component moved outside of render
const NavLink = ({ href, children, onClick, className = "" }: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-1 px-2 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary/10 transition-all duration-200 ${className}`}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { data: session, status } = useSession();
  const userInfo = getUserDisplayInfo(session);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    setIsSidebarOpen(false);
  };

  // Close sidebar when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('menu-button');

      if (sidebar && !sidebar.contains(e.target as Node) &&
        menuButton && !menuButton.contains(e.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home, showAlways: true },
    { href: '/create', label: 'Create Thread', icon: Plus, requireAuth: true },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requireAuth: true },
    { href: '/about', label: 'About', icon: Info, showAlways: true },
  ];

  return (
    <>
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-secondary/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                <span className="relative text-white font-bold text-lg drop-shadow-sm">T</span>
              </div>
              <span className="text-xl font-bold text-text-primary">ThreadWise</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => {
                if (item.requireAuth && !session) return null;
                if (!item.showAlways && !item.requireAuth) return null;

                return (
                  <NavLink key={item.href} href={item.href}>
                    <item.icon className="w-4 h-4 relative top-[0.5px]" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Desktop Auth & Theme */}
            <div className="hidden lg:flex items-center gap-4">
              {status === 'loading' ? (
                <Spinner size="sm" />
              ) : session ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
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

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => window.location.href = '/profile'}
                      variant="ghost"
                      size="sm"
                      className="text-sm"
                    >
                      <User className="w-4 h-4 mr-1" />
                      Profile
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
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
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/auth/signup'}
                    size="sm"
                    className="text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Sign Up
                  </Button>
                </div>
              )}

              <ClientThemeToggle />
            </div>

            {/* Mobile Menu Button & Theme Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <ClientThemeToggle />
              <Button
                id="menu-button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-surface border-l border-secondary/20 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary/20">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                <span className="relative text-white font-bold text-lg drop-shadow-sm">T</span>
              </div>
              <span className="text-lg font-bold text-text-primary">ThreadWise</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info (if logged in) */}
          {session && (
            <div className="p-4 border-b border-secondary/20">
              <div className="flex items-center gap-3">
                <Avatar
                  src={userInfo.avatar}
                  username={userInfo.username}
                  size="md"
                />
                <div>
                  <p className="text-text-primary font-medium">
                    {userInfo.displayName || userInfo.username}
                  </p>
                  <p className="text-text-secondary text-sm capitalize">
                    {userInfo.primaryRole}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              if (item.requireAuth && !session) return null;
              if (!item.showAlways && !item.requireAuth) return null;

              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-full"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}

            {session && (
              <NavLink
                href="/profile"
                onClick={() => setIsSidebarOpen(false)}
                className="w-full"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </NavLink>
            )}
          </div>

          {/* Auth Actions */}
          <div className="p-4 border-t border-secondary/20 space-y-2">
            {session ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full justify-start"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    window.location.href = '/auth/signin';
                    setIsSidebarOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <LogIn className="w-5 h-5 mr-3" />
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = '/auth/signup';
                    setIsSidebarOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <UserPlus className="w-5 h-5 mr-3" />
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
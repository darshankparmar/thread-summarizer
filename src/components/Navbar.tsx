'use client';

import Link from 'next/link';
import ClientThemeToggle from './ClientThemeToggle';

export default function Navbar() {
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
            <Link 
              href="/about" 
              className="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              About
            </Link>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center">
            <ClientThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
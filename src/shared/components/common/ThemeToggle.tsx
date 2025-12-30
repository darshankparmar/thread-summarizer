'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useMounted } from '@/hooks/useMounted';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useMounted();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={`
        relative inline-flex h-8 w-14 items-center rounded-full 
        bg-gray-300 dark:bg-gray-600 transition-colors duration-200 ease-in-out
        border border-gray-200 dark:border-gray-500
        ${className}
      `}>
        <span className="inline-block h-6 w-6 transform rounded-full bg-white dark:bg-gray-200 translate-x-1 shadow-sm" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full 
        transition-all duration-200 ease-in-out focus:outline-none 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 
        focus-visible:ring-offset-background hover:shadow-md
        border shadow-sm
        ${theme === 'dark' 
          ? 'bg-orange-500 border-orange-400 hover:bg-orange-600' 
          : 'bg-gray-300 border-gray-200 hover:bg-gray-400'
        }
        ${className}
      `}
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle circle with icon */}
      <span
        className={`
          inline-flex items-center justify-center h-6 w-6 transform rounded-full 
          transition-all duration-200 ease-in-out shadow-md
          ${theme === 'dark' 
            ? 'translate-x-7 bg-white' 
            : 'translate-x-1 bg-white'
          }
        `}
      >
        {/* Theme icon */}
        {theme === 'dark' ? (
          // Moon icon for dark mode - using dark color for visibility
          <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
          </svg>
        ) : (
          // Sun icon for light mode
          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      
      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </button>
  );
}
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMounted } from '@/hooks/useMounted';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const mounted = useMounted();
  
  // Initialize theme state lazily to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>(() => {
    // This will only run on the client side after hydration
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return savedTheme || systemTheme;
  });

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Update CSS custom properties
    if (theme === 'light') {
      root.style.setProperty('--color-background', '#FFF7ED');
      root.style.setProperty('--color-surface', '#FFFFFF');
      root.style.setProperty('--color-primary', '#F97316');
      root.style.setProperty('--color-secondary', '#FDBA74');
      root.style.setProperty('--color-accent', '#FDE68A');
      root.style.setProperty('--color-text-primary', '#431407');
      root.style.setProperty('--color-text-secondary', '#7C2D12');
    } else {
      // Improved dark theme with better contrast and modern colors
      root.style.setProperty('--color-background', '#1a1a1a');     // Softer dark gray instead of brown
      root.style.setProperty('--color-surface', '#2d2d2d');        // Medium gray for cards/surfaces
      root.style.setProperty('--color-primary', '#FB923C');        // Keep the orange primary
      root.style.setProperty('--color-secondary', '#FDBA74');      // Keep secondary
      root.style.setProperty('--color-accent', '#FDE68A');         // Keep accent
      root.style.setProperty('--color-text-primary', '#f5f5f5');   // Softer white for text
      root.style.setProperty('--color-text-secondary', '#a3a3a3'); // Medium gray for secondary text
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Theme Colors
        light: {
          background: '#FFF7ED',
          surface: '#FFFFFF',
          primary: '#F97316',
          secondary: '#FDBA74',
          accent: '#FDE68A',
          'text-primary': '#431407',
          'text-secondary': '#7C2D12',
        },
        // Dark Theme Colors - Updated for better visual appeal
        dark: {
          background: '#1a1a1a',
          surface: '#2d2d2d',
          primary: '#FB923C',
          secondary: '#FDBA74',
          'text-primary': '#f5f5f5',
          'text-secondary': '#a3a3a3',
        },
        // Semantic colors that adapt to theme
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
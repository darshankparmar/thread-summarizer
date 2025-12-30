'use client';

import dynamic from 'next/dynamic';

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => (
    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors duration-200 ease-in-out">
      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
    </div>
  )
});

export default ThemeToggle;
import { cn } from '@/shared/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  src?: string;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base'
};

const sizePx = {
  sm: 24,
  md: 32,
  lg: 48
};

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

const getColorFromName = (name?: string) => {
  if (!name) return COLORS[0];
  const charCode = name.charCodeAt(0);
  return COLORS[charCode % COLORS.length];
};

export default function Avatar({ src, username, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const sizePxValue = sizePx[size];

  // If no src provided or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-medium text-white",
          getColorFromName(username),
          sizeClass,
          className
        )}
      >
        {(username?.[0] || "?").toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={`${username}'s avatar`}
        width={sizePxValue}
        height={sizePxValue}
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized // Since we're dealing with external URLs that might not be optimized
      />
    </div>
  );
}
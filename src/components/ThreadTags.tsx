import { ForumsTag } from '@/types';

interface ThreadTagsProps {
  tags: ForumsTag[];
  className?: string;
}

// Fallback colors for tags without assigned colors
const fallbackColors = [
  '#10b981', // green
  '#8b5cf6', // purple  
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
];

// Convert CSS color names to hex values
const colorNameToHex: Record<string, string> = {
  'red': '#ef4444',
  'green': '#10b981',
  'blue': '#3b82f6',
  'yellow': '#f59e0b',
  'purple': '#8b5cf6',
  'pink': '#ec4899',
  'orange': '#f97316',
  'gray': '#6b7280',
  'grey': '#6b7280',
  'black': '#1f2937',
  'white': '#f9fafb',
  'indigo': '#6366f1',
  'violet': '#8b5cf6',
  'cyan': '#06b6d4',
  'teal': '#14b8a6',
  'lime': '#84cc16',
  'amber': '#f59e0b',
  'emerald': '#10b981',
  'rose': '#f43f5e',
  'sky': '#0ea5e9',
  'slate': '#64748b',
};

function normalizeColor(color: string): string {
  if (!color) return fallbackColors[0];
  
  // If it's already a hex color, return as is
  if (color.startsWith('#')) {
    return color;
  }
  
  // If it's a CSS color name, convert to hex
  const lowerColor = color.toLowerCase();
  if (colorNameToHex[lowerColor]) {
    return colorNameToHex[lowerColor];
  }
  
  // If we don't recognize the color name, return a fallback
  return fallbackColors[0];
}

export default function ThreadTags({ tags, className = '' }: ThreadTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => {
        // Normalize the color to hex format
        const tagColor = tag.color 
          ? normalizeColor(tag.color)
          : fallbackColors[index % fallbackColors.length];
        
        return (
          <span
            key={tag.id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 border"
            style={{
              backgroundColor: `${tagColor}20`,
              color: tagColor,
              borderColor: `${tagColor}40`
            }}
            title={tag.description}
          >
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
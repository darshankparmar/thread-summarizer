'use client';

import { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TagSelector({
  availableTags,
  selectedTags,
  onTagsChange,
  placeholder = "Type to search and add tags...",
  className = ""
}: TagSelectorProps) {
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const addTag = useCallback((tagName: string) => {
    if (tagName && !selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
      setTagInput('');
      setShowTagDropdown(true);
    }
  }, [selectedTags, onTagsChange]);

  const removeTag = useCallback((tagName: string) => {
    onTagsChange(selectedTags.filter(t => t !== tagName));
  }, [selectedTags, onTagsChange]);

  // Filter available tags based on input
  const filteredAvailableTags = useMemo(() => {
    if (!tagInput.trim()) return availableTags.filter(
      tag => !selectedTags.includes(tag)
    );

    return availableTags.filter(tag =>
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(tag)
    );
  }, [availableTags, tagInput, selectedTags]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="[display:-webkit-box] gap-2">

        <span className="text-sm font-medium text-text-secondary">Filter by tags:</span>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-sm font-medium leading-none bg-muted text-muted-foreground hover:bg-muted/80 border border-border/40 transition-colors cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <svg className="w-3 h-3 shrink-0 opacity-70 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Badge>
            ))}
          </div>
        )}

      </div>

      {/* Tag Input Field */}
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setShowTagDropdown(e.target.value.length > 0);
          }}
          onFocus={() => setShowTagDropdown(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setShowTagDropdown(false);
            }
          }}
          className="w-full"
        />

        {/* Tag Dropdown */}
        {showTagDropdown && filteredAvailableTags.length > 0 && (
          <div tabIndex={-1} className="absolute top-full left-0 right-0 mt-1 bg-surface border border-secondary/20 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto bg-[hsl(var(--popover))] text-popover-foreground">
            {filteredAvailableTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevents blur
                  addTag(tag);
                }}
                className="w-full text-left px-3 py-2 hover:bg-secondary/10 transition-colors text-text-primary text-sm"
              >
                {tag}
              </button>
            ))}
            {filteredAvailableTags.length > 10 && (
              <div className="px-3 py-2 text-xs text-text-secondary border-t border-secondary/20">
                +{filteredAvailableTags.length - 10} more tags available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
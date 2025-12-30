'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ForumsTag } from '@/types';
import { clientApi } from '@/services/client-api';
import { X, Plus, Search } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: ForumsTag[];
  onTagsChange: (tags: ForumsTag[]) => void;
  className?: string;
  maxTags?: number;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  className = "",
  maxTags = 5
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTags, setAvailableTags] = useState<ForumsTag[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Search for tags
  useEffect(() => {
    const searchTags = async () => {
      if (searchQuery.trim().length < 2) {
        setAvailableTags([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await clientApi.getTags({
          query: searchQuery,
          limit: 10
        });
        
        if (response.success && response.data) {
          setAvailableTags(response.data);
          
          // Show create new option if no exact match found
          const exactMatch = response.data.some(
            tag => tag.name.toLowerCase() === searchQuery.toLowerCase()
          );
          setShowCreateNew(!exactMatch && searchQuery.trim().length > 0);
        } else {
          setAvailableTags([]);
          setShowCreateNew(searchQuery.trim().length > 0);
        }
      } catch (error) {
        console.error('Error searching tags:', error);
        setAvailableTags([]);
        setShowCreateNew(searchQuery.trim().length > 0);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchTags, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleTagSelect = (tag: ForumsTag) => {
    if (selectedTags.length >= maxTags) return;
    if (selectedTags.some(selected => selected.id === tag.id)) return;

    onTagsChange([...selectedTags, tag]);
    setSearchQuery('');
    setAvailableTags([]);
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const response = await clientApi.createTag({
        name: newTagName.trim(),
        description: `User-created tag: ${newTagName.trim()}`
      });

      if (response.success && response.data) {
        handleTagSelect(response.data);
      } else {
        // Fallback to temporary tag if creation fails
        const tempTag: ForumsTag = {
          id: `temp-${Date.now()}`,
          name: newTagName.trim(),
          description: `User-created tag: ${newTagName.trim()}`
        };
        handleTagSelect(tempTag);
      }

      setNewTagName('');
      setShowCreateNew(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating tag:', error);
      
      // Fallback to temporary tag
      const tempTag: ForumsTag = {
        id: `temp-${Date.now()}`,
        name: newTagName.trim(),
        description: `User-created tag: ${newTagName.trim()}`
      };
      handleTagSelect(tempTag);
      setNewTagName('');
      setShowCreateNew(false);
      setSearchQuery('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
                style={{ backgroundColor: tag.color || undefined }}
              >
                {tag.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTagRemove(tag.id)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Tag Search */}
        {selectedTags.length < maxTags && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search or create tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {(availableTags.length > 0 || showCreateNew) && (
              <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant="ghost"
                      onClick={() => handleTagSelect(tag)}
                      className="w-full justify-start text-left h-auto p-2"
                      disabled={selectedTags.some(selected => selected.id === tag.id)}
                    >
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        {tag.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {tag.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}

                  {showCreateNew && (
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="New tag name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateNewTag();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateNewTag}
                          disabled={!newTagName.trim() || isCreating}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        )}

        {selectedTags.length >= maxTags && (
          <p className="text-sm text-gray-500">
            Maximum {maxTags} tags allowed
          </p>
        )}
      </div>
    </div>
  );
}
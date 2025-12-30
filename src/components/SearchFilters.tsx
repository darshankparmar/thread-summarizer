'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortOption = 'newest' | 'oldest' | 'popular' | 'trending';
export type ViewMode = 'grid' | 'list';
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';
export type EngagementFilter = 'all' | 'popular' | 'trending';

interface SearchFiltersProps {
  // Search and view
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Sorting
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  
  // Advanced filters
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  authorFilter: string;
  onAuthorFilterChange: (author: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (date: DateFilter) => void;
  engagementFilter: EngagementFilter;
  onEngagementFilterChange: (engagement: EngagementFilter) => void;
  
  // Results info
  filteredCount: number;
  totalCount: number;
  
  // Clear filters
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  authorFilter,
  onAuthorFilterChange,
  dateFilter,
  onDateFilterChange,
  engagementFilter,
  onEngagementFilterChange,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters
}: SearchFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search threads, users, or content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAdvancedFilters}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            Filters
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-surface rounded-lg border border-secondary/20 p-4 space-y-4">
          <h4 className="font-medium text-text-primary">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Author</label>
              <Input
                type="text"
                placeholder="Filter by username..."
                value={authorFilter}
                onChange={(e) => onAuthorFilterChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Date Range</label>
              <Select value={dateFilter} onValueChange={onDateFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Engagement Filter */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Engagement</label>
              <Select value={engagementFilter} onValueChange={onEngagementFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select engagement level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Threads</SelectItem>
                  <SelectItem value="popular">Popular (5+ likes)</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-secondary">Sort by:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
          </Button>
        )}

        <div className="text-sm text-text-secondary">
          {filteredCount} of {totalCount} threads
        </div>
      </div>
    </div>
  );
}
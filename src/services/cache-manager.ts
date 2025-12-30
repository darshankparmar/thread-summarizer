import { SummaryData } from '@/types';
import { CACHE_CONFIG } from '@/lib/constants';

/**
 * Cache entry structure for storing summary data
 */
export interface CacheEntry {
  data: SummaryData;
  timestamp: number;
  threadId: string;
  lastPostTimestamp: string;
  generatedAt: string;
}

/**
 * Cache key structure following the pattern: summary_<thread_id>_<last_post_timestamp>
 */
export interface CacheKeyComponents {
  threadId: string;
  lastPostTimestamp: string;
}

/**
 * Cache statistics for performance monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  maxAge: number; // Maximum age in milliseconds
  maxEntries: number; // Maximum number of entries to store
  cleanupInterval: number; // Cleanup interval in milliseconds
}

/**
 * Cache manager service for handling summary caching with performance optimization
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxAge: CACHE_CONFIG.TTL_MS,
      maxEntries: CACHE_CONFIG.MAX_ENTRIES,
      cleanupInterval: CACHE_CONFIG.CLEANUP_INTERVAL_MS,
      ...config
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Generate cache key following the pattern: summary_<thread_id>_<last_post_timestamp>
   */
  generateCacheKey(threadId: string, lastPostTimestamp: string): string {
    if (!threadId || !lastPostTimestamp) {
      throw new Error('Thread ID and last post timestamp are required for cache key generation');
    }

    // Validate thread ID format (basic validation)
    if (threadId.trim() === '') {
      throw new Error('Thread ID cannot be empty');
    }

    // Validate timestamp format (should be numeric string)
    if (!/^\d+$/.test(lastPostTimestamp)) {
      throw new Error('Last post timestamp must be a numeric string');
    }

    return `summary_${threadId}_${lastPostTimestamp}`;
  }

  /**
   * Parse cache key back into components
   */
  parseCacheKey(cacheKey: string): CacheKeyComponents | null {
    const pattern = /^summary_(.+)_(\d+)$/;
    const match = cacheKey.match(pattern);
    
    if (!match) {
      return null;
    }

    return {
      threadId: match[1],
      lastPostTimestamp: match[2]
    };
  }

  /**
   * Store summary data in cache with proper key generation
   */
  set(threadId: string, lastPostTimestamp: string, data: SummaryData): void {
    const cacheKey = this.generateCacheKey(threadId, lastPostTimestamp);
    
    // Invalidate any old cache entries for this thread BEFORE setting new entry
    this.invalidateOldEntries(threadId, lastPostTimestamp);
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      threadId,
      lastPostTimestamp,
      generatedAt: new Date().toISOString()
    };

    // Check if we need to evict old entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldestEntries();
    }

    this.cache.set(cacheKey, entry);
  }

  /**
   * Retrieve summary data from cache
   */
  get(threadId: string, lastPostTimestamp: string): CacheEntry | null {
    this.stats.totalRequests++;
    
    const cacheKey = this.generateCacheKey(threadId, lastPostTimestamp);
    const entry = this.cache.get(cacheKey);

    if (entry) {
      // Check if entry is still valid
      if (this.isEntryValid(entry)) {
        this.stats.hits++;
        this.updateHitRate();
        return entry;
      } else {
        // Remove expired entry
        this.cache.delete(cacheKey);
      }
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Check if cached summary exists for thread
   */
  has(threadId: string, lastPostTimestamp: string): boolean {
    const entry = this.get(threadId, lastPostTimestamp);
    return entry !== null;
  }

  /**
   * Invalidate cache entries for a thread when new posts are added
   */
  invalidateThread(threadId: string): number {
    let invalidatedCount = 0;
    
    for (const [cacheKey, entry] of this.cache.entries()) {
      if (entry.threadId === threadId) {
        this.cache.delete(cacheKey);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Invalidate old cache entries for a thread (when timestamp changes)
   */
  private invalidateOldEntries(threadId: string, currentTimestamp: string): void {
    for (const [cacheKey, entry] of this.cache.entries()) {
      if (entry.threadId === threadId && entry.lastPostTimestamp !== currentTimestamp) {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Check if cache entry is still valid based on age
   */
  private isEntryValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.config.maxAge;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
  }

  /**
   * Get cache statistics for performance monitoring
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size information
   */
  getSize(): { entries: number; maxEntries: number; utilizationPercent: number } {
    const entries = this.cache.size;
    const maxEntries = this.config.maxEntries;
    const utilizationPercent = (entries / maxEntries) * 100;
    
    return {
      entries,
      maxEntries,
      utilizationPercent
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [cacheKey, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(cacheKey);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * Stop cleanup timer (for testing or shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Get all cache keys for debugging
   */
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry by key (for debugging)
   */
  getByKey(cacheKey: string): CacheEntry | undefined {
    return this.cache.get(cacheKey);
  }
}

/**
 * Default cache manager instance with production configuration
 */
export const cacheManager = new CacheManager({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 1000,
  cleanupInterval: 60 * 60 * 1000 // 1 hour
});
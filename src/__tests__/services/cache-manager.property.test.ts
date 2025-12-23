import * as fc from 'fast-check';
import { CacheManager } from '@/services/cache-manager';
import { PerformanceMonitor } from '@/services/performance-monitor';
import { summaryDataArbitrary, threadIdArbitrary } from '../utils/property-generators';

describe('Cache Manager Property Tests', () => {
  let cacheManager: CacheManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Create fresh instances for each test
    cacheManager = new CacheManager({
      maxAge: 60000, // 1 minute for testing
      maxEntries: 100,
      cleanupInterval: 10000 // 10 seconds
    });
    performanceMonitor = new PerformanceMonitor();
  });

  afterEach(() => {
    cacheManager.clear();
    cacheManager.stopCleanup();
    performanceMonitor.clearMetrics();
  });

  /**
   * Property 2: Cache Key Format Consistency
   * Feature: thread-summarizer, Property 2: For any summary generation, the cache key should match the pattern summary_<thread_id>_<last_post_timestamp> and cache invalidation should occur when timestamps change
   * Validates: Requirements 1.3, 1.5, 6.3, 6.4
   */
  test('Property 2: Cache Key Format Consistency', async () => {
    await fc.assert(
      fc.property(
        threadIdArbitrary,
        fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
        (threadId, lastPostTimestamp) => {
          // Precondition: thread ID must not be empty after trimming
          fc.pre(threadId.trim() !== '');
          
          // Test cache key generation follows correct pattern
          const cacheKey = cacheManager.generateCacheKey(threadId, lastPostTimestamp);
          
          // Verify pattern: summary_<thread_id>_<last_post_timestamp>
          const expectedPattern = `summary_${threadId}_${lastPostTimestamp}`;
          expect(cacheKey).toBe(expectedPattern);
          
          // Verify key can be parsed back correctly
          const parsed = cacheManager.parseCacheKey(cacheKey);
          expect(parsed).not.toBeNull();
          expect(parsed!.threadId).toBe(threadId);
          expect(parsed!.lastPostTimestamp).toBe(lastPostTimestamp);
          
          // Test that invalid keys return null when parsed
          const invalidKey = `invalid_${threadId}_${lastPostTimestamp}`;
          expect(cacheManager.parseCacheKey(invalidKey)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Cache Invalidation on Timestamp Change
   * Feature: thread-summarizer, Property 2: Cache invalidation should occur when timestamps change
   * Validates: Requirements 1.5, 6.4
   */
  test('Property 2: Cache Invalidation on Timestamp Change', async () => {
    await fc.assert(
      fc.property(
        threadIdArbitrary,
        fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
        fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
        summaryDataArbitrary,
        (threadId, timestamp1, timestamp2, summaryData) => {
          // Preconditions
          fc.pre(threadId.trim() !== ''); // Thread ID must not be empty
          fc.pre(timestamp1 !== timestamp2); // Timestamps must be different
          
          // Store data with first timestamp
          cacheManager.set(threadId, timestamp1, summaryData);
          expect(cacheManager.has(threadId, timestamp1)).toBe(true);
          
          // Store data with second timestamp (should invalidate first)
          cacheManager.set(threadId, timestamp2, summaryData);
          
          // First timestamp should be invalidated
          expect(cacheManager.has(threadId, timestamp1)).toBe(false);
          // Second timestamp should be available
          expect(cacheManager.has(threadId, timestamp2)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Thread Invalidation
   * Feature: thread-summarizer, Property 2: All cache entries for a thread should be invalidated when requested
   * Validates: Requirements 1.5, 6.4
   */
  test('Property 2: Thread Invalidation', async () => {
    await fc.assert(
      fc.property(
        threadIdArbitrary,
        fc.array(fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String), { minLength: 1, maxLength: 5 }),
        summaryDataArbitrary,
        (threadId, timestamps, summaryData) => {
          // Precondition: thread ID must not be empty after trimming
          fc.pre(threadId.trim() !== '');
          
          // Remove duplicates from timestamps to ensure accurate count
          const uniqueTimestamps = [...new Set(timestamps)];
          fc.pre(uniqueTimestamps.length >= 1); // Need at least one unique timestamp
          
          // Store multiple entries for the same thread with different timestamps
          // Note: Each set() call will invalidate previous entries for the same thread
          // So we need to test the invalidateThread() method specifically
          uniqueTimestamps.forEach(timestamp => {
            cacheManager.set(threadId, timestamp, summaryData);
          });
          
          // After all sets, only the last entry should exist (due to invalidateOldEntries)
          const lastTimestamp = uniqueTimestamps[uniqueTimestamps.length - 1];
          expect(cacheManager.has(threadId, lastTimestamp)).toBe(true);
          
          // Verify that only one entry exists for this thread
          const allKeys = cacheManager.getAllKeys();
          const threadKeys = allKeys.filter(key => {
            const parsed = cacheManager.parseCacheKey(key);
            return parsed && parsed.threadId === threadId;
          });
          expect(threadKeys.length).toBe(1);
          
          // Now test invalidateThread() - it should invalidate the remaining entry
          const invalidatedCount = cacheManager.invalidateThread(threadId);
          expect(invalidatedCount).toBe(1); // Only one entry should have been invalidated
          
          // Verify the entry is gone
          expect(cacheManager.has(threadId, lastTimestamp)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Cache Performance Requirements - Response Time Validation
   * Feature: thread-summarizer, Property 3: For any cached summary request, the response time should be under 100ms, and for uncached requests, processing should complete within 3 seconds
   * Validates: Requirements 1.4, 6.1, 6.2
   */
  test('Property 3: Cache Performance Requirements - Response Time Validation', async () => {
    await fc.assert(
      fc.property(
        threadIdArbitrary,
        fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
        summaryDataArbitrary,
        (threadId, lastPostTimestamp, summaryData) => {
          // Precondition: thread ID must not be empty after trimming
          fc.pre(threadId.trim() !== '');
          
          // Test cached response time
          const requestId = performanceMonitor.startRequest(threadId);
          
          // Store in cache first
          cacheManager.set(threadId, lastPostTimestamp, summaryData);
          
          // Simulate cache hit
          const startTime = performance.now();
          const cachedEntry = cacheManager.get(threadId, lastPostTimestamp);
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          // Mark as cache hit for monitoring
          if (cachedEntry) {
            const cacheKey = cacheManager.generateCacheKey(threadId, lastPostTimestamp);
            performanceMonitor.markCacheHit(requestId, cacheKey);
          }
          
          performanceMonitor.completeRequest(requestId);
          
          // Verify cached response exists and is fast
          expect(cachedEntry).not.toBeNull();
          expect(cachedEntry!.data).toEqual(summaryData);
          
          // Verify performance requirement: cached responses should be very fast
          // Note: In real scenarios this would be < 100ms, but for unit tests we're more lenient
          expect(responseTime).toBeLessThan(50); // 50ms for unit test environment
          
          // Verify performance monitor correctly identifies fast cached response
          expect(performanceMonitor.isCachedResponseFast(responseTime)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Cache Performance Requirements - Uncached Response Time Limits
   * Feature: thread-summarizer, Property 3: Uncached requests should have reasonable time limits
   * Validates: Requirements 6.1
   */
  test('Property 3: Cache Performance Requirements - Uncached Response Time Limits', async () => {
    await fc.assert(
      fc.property(
        threadIdArbitrary,
        fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
        (threadId, lastPostTimestamp) => {
          const requestId = performanceMonitor.startRequest(threadId);
          
          // Simulate cache miss
          // const startTime = performance.now();
          const cachedEntry = cacheManager.get(threadId, lastPostTimestamp);
          // const endTime = performance.now();
          // const responseTime = endTime - startTime;
          
          // Should be cache miss
          expect(cachedEntry).toBeNull();
          
          // Simulate various uncached response times
          const simulatedUncachedTimes = [500, 1500, 2500, 3500, 5000];
          
          simulatedUncachedTimes.forEach(simulatedTime => {
            // Test performance monitor's validation of uncached response times
            const isFast = performanceMonitor.isUncachedResponseFast(simulatedTime);
            
            if (simulatedTime < 3000) {
              expect(isFast).toBe(true);
            } else {
              expect(isFast).toBe(false);
            }
          });
          
          performanceMonitor.completeRequest(requestId);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Cache Statistics Accuracy
   * Feature: thread-summarizer, Property 3: Cache statistics should accurately reflect hit/miss ratios
   * Validates: Requirements 6.2
   */
  test('Property 3: Cache Statistics Accuracy', async () => {
    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            threadId: threadIdArbitrary,
            timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
            summaryData: summaryDataArbitrary
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (cacheOperations) => {
          // Create fresh instances to avoid interference between test runs
          const testCacheManager = new CacheManager({
            maxAge: 60000,
            maxEntries: 100,
            cleanupInterval: 10000
          });
          const testPerformanceMonitor = new PerformanceMonitor();
          
          // Filter out invalid thread IDs and ensure uniqueness
          const validOperations = cacheOperations
            .filter(op => op.threadId.trim() !== '')
            .filter((op, index, arr) => {
              // Keep only first occurrence of each threadId+timestamp combination
              return arr.findIndex(other => 
                other.threadId === op.threadId && other.timestamp === op.timestamp
              ) === index;
            });
          
          fc.pre(validOperations.length >= 3); // Need at least 3 valid operations
          
          let expectedHits = 0;
          let expectedMisses = 0;
          
          // Perform cache operations and track expected results
          validOperations.forEach(({ threadId, timestamp, summaryData }) => {
            const requestId = testPerformanceMonitor.startRequest(threadId);
            
            // Try to get from cache first (should be miss initially)
            const cachedEntry = testCacheManager.get(threadId, timestamp);
            if (cachedEntry) {
              expectedHits++;
              const cacheKey = testCacheManager.generateCacheKey(threadId, timestamp);
              testPerformanceMonitor.markCacheHit(requestId, cacheKey);
            } else {
              expectedMisses++;
              // Store in cache for potential future hits
              testCacheManager.set(threadId, timestamp, summaryData);
            }
            
            testPerformanceMonitor.completeRequest(requestId);
          });
          
          // Verify cache statistics match expectations
          const cacheStats = testCacheManager.getStats();
          const perfStats = testPerformanceMonitor.getStats();
          
          expect(cacheStats.hits).toBe(expectedHits);
          expect(cacheStats.misses).toBe(expectedMisses);
          expect(cacheStats.totalRequests).toBe(expectedHits + expectedMisses);
          
          if (cacheStats.totalRequests > 0) {
            const expectedHitRate = expectedHits / (expectedHits + expectedMisses);
            expect(cacheStats.hitRate).toBeCloseTo(expectedHitRate, 2);
            expect(perfStats.cacheHitRate).toBeCloseTo(expectedHitRate, 2);
          }
          
          // Cleanup
          testCacheManager.stopCleanup();
          testPerformanceMonitor.clearMetrics();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Cache Key Validation and Error Handling
   * Feature: thread-summarizer, Property 2: Cache key generation should handle edge cases and validate inputs
   * Validates: Requirements 6.3
   */
  test('Property: Cache Key Validation and Error Handling', async () => {
    await fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.string({ minLength: 1, maxLength: 100 }), // Valid string
          fc.constant('   '), // Whitespace only
        ),
        fc.oneof(
          fc.constant(''), // Empty string
          fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String), // Valid timestamp
          fc.constant('invalid'), // Invalid timestamp
          fc.constant('   '), // Whitespace only
        ),
        (threadId, timestamp) => {
          // Test cache key generation with various inputs
          if (threadId.trim() === '' || timestamp.trim() === '' || !/^\d+$/.test(timestamp)) {
            // Should throw error for invalid inputs
            expect(() => {
              cacheManager.generateCacheKey(threadId, timestamp);
            }).toThrow();
          } else {
            // Should succeed for valid inputs
            const cacheKey = cacheManager.generateCacheKey(threadId, timestamp);
            expect(cacheKey).toBe(`summary_${threadId}_${timestamp}`);
            
            // Should be parseable
            const parsed = cacheManager.parseCacheKey(cacheKey);
            expect(parsed).not.toBeNull();
            expect(parsed!.threadId).toBe(threadId);
            expect(parsed!.lastPostTimestamp).toBe(timestamp);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cache Size Management and Eviction
   * Feature: thread-summarizer, Property 2: Cache should manage size and evict entries appropriately
   * Validates: Requirements 6.4
   */
  test('Property: Cache Size Management and Eviction', async () => {
    // Create cache with small limits for testing
    const smallCache = new CacheManager({
      maxAge: 60000,
      maxEntries: 5, // Small limit for testing
      cleanupInterval: 10000
    });

    await fc.assert(
      fc.property(
        fc.array(
          fc.record({
            threadId: threadIdArbitrary,
            timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }).map(String),
            summaryData: summaryDataArbitrary
          }),
          { minLength: 10, maxLength: 15 } // More entries than cache limit
        ),
        (entries) => {
          // Filter out invalid thread IDs
          const validEntries = entries.filter(entry => entry.threadId.trim() !== '');
          fc.pre(validEntries.length >= 8); // Need enough valid entries to test eviction
          
          // Add entries to cache
          validEntries.forEach(({ threadId, timestamp, summaryData }) => {
            smallCache.set(threadId, timestamp, summaryData);
          });
          
          // Cache should not exceed max entries
          const sizeInfo = smallCache.getSize();
          expect(sizeInfo.entries).toBeLessThanOrEqual(sizeInfo.maxEntries);
          
          // Should have evicted some entries
          expect(sizeInfo.entries).toBeLessThan(validEntries.length);
          
          smallCache.clear();
        }
      ),
      { numRuns: 20 }
    );

    smallCache.stopCleanup();
  });
});
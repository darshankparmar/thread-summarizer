/**
 * Performance metrics for tracking response times and cache behavior
 */
export interface PerformanceMetrics {
  requestId: string;
  threadId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit: boolean;
  cacheKey?: string;
  aiProcessingTime?: number;
  apiRequestTime?: number;
  totalResponseTime?: number;
  error?: string;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  totalRequests: number;
  cachedRequests: number;
  uncachedRequests: number;
  averageResponseTime: number;
  averageCachedResponseTime: number;
  averageUncachedResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

/**
 * Performance monitoring service for tracking response times and optimization
 * Implements requirements 1.4, 6.1, 6.2
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 1000; // Keep last 1000 requests
  private requestCounter = 0;

  /**
   * Start tracking a new request
   * Requirement 6.1, 6.2
   */
  startRequest(threadId: string): string {
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;
    
    const metric: PerformanceMetrics = {
      requestId,
      threadId,
      startTime: performance.now(),
      cacheHit: false
    };

    this.metrics.push(metric);
    
    // Keep metrics history bounded
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    return requestId;
  }

  /**
   * Mark request as cache hit
   * Requirement 1.4, 6.2
   */
  markCacheHit(requestId: string, cacheKey: string): void {
    const metric = this.findMetric(requestId);
    if (metric) {
      metric.cacheHit = true;
      metric.cacheKey = cacheKey;
    }
  }

  /**
   * Record AI processing time
   * Requirement 6.1
   */
  recordAIProcessingTime(requestId: string, processingTime: number): void {
    const metric = this.findMetric(requestId);
    if (metric) {
      metric.aiProcessingTime = processingTime;
    }
  }

  /**
   * Record API request time (for Foru.ms API calls)
   * Requirement 6.1
   */
  recordApiRequestTime(requestId: string, apiTime: number): void {
    const metric = this.findMetric(requestId);
    if (metric) {
      metric.apiRequestTime = apiTime;
    }
  }

  /**
   * Complete request tracking and calculate total response time
   * Requirement 1.4, 6.1, 6.2
   */
  completeRequest(requestId: string, error?: string): PerformanceMetrics | null {
    const metric = this.findMetric(requestId);
    if (!metric) {
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.totalResponseTime = metric.duration;
    
    if (error) {
      metric.error = error;
    }

    // Log performance information
    this.logPerformanceInfo(metric);

    return metric;
  }

  /**
   * Get current performance statistics
   * Requirement 6.1, 6.2
   */
  getStats(): PerformanceStats {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        totalRequests: 0,
        cachedRequests: 0,
        uncachedRequests: 0,
        averageResponseTime: 0,
        averageCachedResponseTime: 0,
        averageUncachedResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      };
    }

    const cachedMetrics = completedMetrics.filter(m => m.cacheHit);
    const uncachedMetrics = completedMetrics.filter(m => !m.cacheHit);
    const errorMetrics = completedMetrics.filter(m => m.error);

    // Calculate response times
    const allResponseTimes = completedMetrics.map(m => m.duration!).sort((a, b) => a - b);
    const cachedResponseTimes = cachedMetrics.map(m => m.duration!);
    const uncachedResponseTimes = uncachedMetrics.map(m => m.duration!);

    return {
      totalRequests: completedMetrics.length,
      cachedRequests: cachedMetrics.length,
      uncachedRequests: uncachedMetrics.length,
      averageResponseTime: this.calculateAverage(allResponseTimes),
      averageCachedResponseTime: this.calculateAverage(cachedResponseTimes),
      averageUncachedResponseTime: this.calculateAverage(uncachedResponseTimes),
      cacheHitRate: completedMetrics.length > 0 ? cachedMetrics.length / completedMetrics.length : 0,
      errorRate: completedMetrics.length > 0 ? errorMetrics.length / completedMetrics.length : 0,
      p95ResponseTime: this.calculatePercentile(allResponseTimes, 0.95),
      p99ResponseTime: this.calculatePercentile(allResponseTimes, 0.99)
    };
  }

  /**
   * Check if cached response meets performance requirements (< 100ms)
   * Requirement 6.2
   */
  isCachedResponseFast(responseTime: number): boolean {
    return responseTime < 100; // 100ms requirement
  }

  /**
   * Check if uncached response meets performance requirements (< 3000ms)
   * Requirement 6.1
   */
  isUncachedResponseFast(responseTime: number): boolean {
    return responseTime < 3000; // 3 second requirement
  }

  /**
   * Get recent slow requests for debugging
   */
  getSlowRequests(threshold: number = 3000): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.duration && m.duration > threshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10); // Return top 10 slowest
  }

  /**
   * Get cache hit/miss logging for debugging
   * Requirement 6.2
   */
  getCacheAnalysis(): {
    recentCacheHits: PerformanceMetrics[];
    recentCacheMisses: PerformanceMetrics[];
    cacheEffectiveness: number;
  } {
    const recent = this.metrics.slice(-100); // Last 100 requests
    const hits = recent.filter(m => m.cacheHit);
    const misses = recent.filter(m => !m.cacheHit && m.duration !== undefined);
    
    const avgHitTime = this.calculateAverage(hits.map(m => m.duration!).filter(d => d !== undefined));
    const avgMissTime = this.calculateAverage(misses.map(m => m.duration!).filter(d => d !== undefined));
    
    const cacheEffectiveness = avgMissTime > 0 ? (avgMissTime - avgHitTime) / avgMissTime : 0;

    return {
      recentCacheHits: hits.slice(-10),
      recentCacheMisses: misses.slice(-10),
      cacheEffectiveness
    };
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
    this.requestCounter = 0;
  }

  /**
   * Find metric by request ID
   * @private
   */
  private findMetric(requestId: string): PerformanceMetrics | undefined {
    return this.metrics.find(m => m.requestId === requestId);
  }

  /**
   * Log performance information for debugging
   * @private
   */
  private logPerformanceInfo(metric: PerformanceMetrics): void {
    const duration = metric.duration!;
    const cacheStatus = metric.cacheHit ? 'HIT' : 'MISS';
    
    // Log slow requests
    if (!metric.cacheHit && duration > 3000) {
      console.warn(`Slow uncached request: ${metric.requestId} took ${duration.toFixed(2)}ms (thread: ${metric.threadId})`);
    }
    
    // Log very slow cached requests (should be rare)
    if (metric.cacheHit && duration > 100) {
      console.warn(`Slow cached request: ${metric.requestId} took ${duration.toFixed(2)}ms (cache key: ${metric.cacheKey})`);
    }

    // Log cache performance
    console.log(`Request ${metric.requestId}: ${duration.toFixed(2)}ms [${cacheStatus}] (thread: ${metric.threadId})`);
    
    if (metric.error) {
      console.error(`Request ${metric.requestId} failed: ${metric.error}`);
    }
  }

  /**
   * Calculate average of an array of numbers
   * @private
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate percentile of an array of sorted numbers
   * @private
   */
  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0;
    
    const index = Math.ceil(sortedNumbers.length * percentile) - 1;
    return sortedNumbers[Math.max(0, index)];
  }
}

/**
 * Default performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
import type { Platform } from "./types.js";

/**
 * Performance monitoring and optimization utilities
 */
export interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  errorCount: number;
  errorRate: number;
  lastRequestTime: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
}

export interface RequestMetrics {
  platform: Platform;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  cacheHit?: boolean;
}

/**
 * In-memory cache for API responses
 */
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100; // Maximum number of cached items
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get cached response if valid
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store response in cache
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Will be calculated by PerformanceMonitor
    };
  }
}

/**
 * Performance monitoring system
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<Platform, PerformanceMetrics>();
  private requests: RequestMetrics[] = [];
  private cache = new ResponseCache();
  private maxRequestHistory = 1000;

  private constructor() {
    // Initialize metrics for each platform
    const platforms: Platform[] = ["whatsapp", "messenger", "instagram"];
    for (const platform of platforms) {
      this.metrics.set(platform, {
        requestCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        errorCount: 0,
        errorRate: 0,
        lastRequestTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Start tracking a request
   */
  startRequest(platform: Platform, method: string): string {
    const requestId = `${platform}-${method}-${Date.now()}-${Math.random()}`;
    const request: RequestMetrics = {
      platform,
      method,
      startTime: Date.now(),
      success: false,
    };

    this.requests.push(request);

    // Limit request history size
    if (this.requests.length > this.maxRequestHistory) {
      this.requests.shift();
    }

    return requestId;
  }

  /**
   * End tracking a request
   */
  endRequest(requestId: string, success: boolean, error?: string, cacheHit?: boolean): void {
    const request = this.requests.find(r => 
      `${r.platform}-${r.method}-${r.startTime}` === requestId.substring(0, requestId.lastIndexOf('-'))
    );

    if (!request) {
      return;
    }

    request.endTime = Date.now();
    request.duration = request.endTime - request.startTime;
    request.success = success;
    request.error = error;
    request.cacheHit = cacheHit;

    // Update platform metrics
    this.updateMetrics(request);
  }

  /**
   * Update platform metrics
   */
  private updateMetrics(request: RequestMetrics): void {
    const metrics = this.metrics.get(request.platform);
    if (!metrics) {
      return;
    }

    metrics.requestCount++;
    metrics.lastRequestTime = request.endTime || Date.now();

    if (request.duration) {
      metrics.totalResponseTime += request.duration;
      metrics.averageResponseTime = metrics.totalResponseTime / metrics.requestCount;
    }

    if (!request.success) {
      metrics.errorCount++;
    }
    metrics.errorRate = metrics.errorCount / metrics.requestCount;

    if (request.cacheHit) {
      metrics.cacheHits++;
    } else {
      metrics.cacheMisses++;
    }

    const totalCacheRequests = metrics.cacheHits + metrics.cacheMisses;
    metrics.cacheHitRate = totalCacheRequests > 0 ? metrics.cacheHits / totalCacheRequests : 0;
  }

  /**
   * Get metrics for a platform
   */
  getMetrics(platform: Platform): PerformanceMetrics | null {
    return this.metrics.get(platform) || null;
  }

  /**
   * Get metrics for all platforms
   */
  getAllMetrics(): Record<Platform, PerformanceMetrics> {
    const result = {} as Record<Platform, PerformanceMetrics>;
    for (const [platform, metrics] of this.metrics.entries()) {
      result[platform] = { ...metrics };
    }
    return result;
  }

  /**
   * Get recent requests
   */
  getRecentRequests(platform?: Platform, limit: number = 50): RequestMetrics[] {
    let requests = this.requests;

    if (platform) {
      requests = requests.filter(r => r.platform === platform);
    }

    return requests
      .sort((a, b) => (b.startTime) - (a.startTime))
      .slice(0, limit);
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    for (const metrics of this.metrics.values()) {
      Object.assign(metrics, {
        requestCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        errorCount: 0,
        errorRate: 0,
        lastRequestTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
      });
    }
    this.requests = [];
  }

  /**
   * Get cached response
   */
  getCachedResponse(key: string): any | null {
    const result = this.cache.get(key);
    return result;
  }

  /**
   * Cache a response
   */
  cacheResponse(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, data, ttlMs);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key for request
   */
  static generateCacheKey(platform: Platform, method: string, params: Record<string, any>): string {
    // Remove sensitive data from cache key
    const sanitizedParams = { ...params };
    delete sanitizedParams.accessToken;
    
    const paramString = JSON.stringify(sanitizedParams, Object.keys(sanitizedParams).sort());
    
    // Use Buffer for Node.js compatibility instead of btoa
    if (typeof Buffer !== "undefined") {
      return `${platform}:${method}:${Buffer.from(paramString).toString("base64")}`;
    } else {
      // Fallback for environments without Buffer
      return `${platform}:${method}:${paramString}`;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalRequests: number;
    totalErrors: number;
    overallErrorRate: number;
    averageResponseTime: number;
    cacheEfficiency: number;
    platformBreakdown: Record<Platform, { requests: number; errors: number; avgResponseTime: number }>;
  } {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let totalCacheHits = 0;
    let totalCacheRequests = 0;

    const platformBreakdown = {} as Record<Platform, { requests: number; errors: number; avgResponseTime: number }>;

    for (const [platform, metrics] of this.metrics.entries()) {
      totalRequests += metrics.requestCount;
      totalErrors += metrics.errorCount;
      totalResponseTime += metrics.totalResponseTime;
      totalCacheHits += metrics.cacheHits;
      totalCacheRequests += metrics.cacheHits + metrics.cacheMisses;

      platformBreakdown[platform] = {
        requests: metrics.requestCount,
        errors: metrics.errorCount,
        avgResponseTime: metrics.averageResponseTime,
      };
    }

    return {
      totalRequests,
      totalErrors,
      overallErrorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      cacheEfficiency: totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0,
      platformBreakdown,
    };
  }
}
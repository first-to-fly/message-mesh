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
 * Performance monitoring system
 */
export declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private requests;
    private cache;
    private maxRequestHistory;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): PerformanceMonitor;
    /**
     * Start tracking a request
     */
    startRequest(platform: Platform, method: string): string;
    /**
     * End tracking a request
     */
    endRequest(requestId: string, success: boolean, error?: string, cacheHit?: boolean): void;
    /**
     * Update platform metrics
     */
    private updateMetrics;
    /**
     * Get metrics for a platform
     */
    getMetrics(platform: Platform): PerformanceMetrics | null;
    /**
     * Get metrics for all platforms
     */
    getAllMetrics(): Record<Platform, PerformanceMetrics>;
    /**
     * Get recent requests
     */
    getRecentRequests(platform?: Platform, limit?: number): RequestMetrics[];
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Get cached response
     */
    getCachedResponse(key: string): any | null;
    /**
     * Cache a response
     */
    cacheResponse(key: string, data: any, ttlMs?: number): void;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Generate cache key for request
     */
    static generateCacheKey(platform: Platform, method: string, params: Record<string, any>): string;
    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        totalRequests: number;
        totalErrors: number;
        overallErrorRate: number;
        averageResponseTime: number;
        cacheEfficiency: number;
        platformBreakdown: Record<Platform, {
            requests: number;
            errors: number;
            avgResponseTime: number;
        }>;
    };
}

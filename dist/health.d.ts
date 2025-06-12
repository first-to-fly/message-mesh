/**
 * Health check status levels
 */
export type HealthStatus = "healthy" | "degraded" | "unhealthy";
/**
 * Individual health check result
 */
export interface HealthCheckResult {
    name: string;
    status: HealthStatus;
    message: string;
    duration: number;
    metadata?: Record<string, any>;
}
/**
 * Overall system health report
 */
export interface HealthReport {
    status: HealthStatus;
    timestamp: string;
    uptime: number;
    version: string;
    checks: HealthCheckResult[];
    summary: {
        total: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
    };
}
/**
 * Health check function type
 */
export type HealthCheckFunction = () => Promise<HealthCheckResult>;
/**
 * System health monitoring and reporting
 */
export declare class HealthMonitor {
    private static instance;
    private startTime;
    private checks;
    private logger;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): HealthMonitor;
    /**
     * Register default health checks
     */
    private registerDefaultChecks;
    /**
     * Register a custom health check
     */
    registerCheck(name: string, checkFunction: HealthCheckFunction): void;
    /**
     * Remove a health check
     */
    unregisterCheck(name: string): void;
    /**
     * Run all health checks and generate report
     */
    checkHealth(): Promise<HealthReport>;
    /**
     * Check memory usage
     */
    private checkMemoryUsage;
    /**
     * Check performance metrics
     */
    private checkPerformanceMetrics;
    /**
     * Check for recent errors in logs
     */
    private checkRecentErrors;
    /**
     * Check platform API connectivity (basic connectivity test)
     */
    private checkPlatformAPIs;
    /**
     * Get system uptime in milliseconds
     */
    getUptime(): number;
    /**
     * Get formatted uptime string
     */
    getFormattedUptime(): string;
    /**
     * Check if system is ready to handle requests
     */
    isReady(): Promise<boolean>;
    /**
     * Check if system is alive (basic liveness check)
     */
    isAlive(): boolean;
}

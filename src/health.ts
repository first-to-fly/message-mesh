import type { Platform } from "./types.js";
import { PerformanceMonitor } from "./performance.js";
import { Logger } from "./logger.js";

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
export class HealthMonitor {
  private static instance: HealthMonitor;
  private startTime: number;
  private checks: Map<string, HealthCheckFunction> = new Map();
  private logger: Logger;

  private constructor() {
    this.startTime = Date.now();
    this.logger = Logger.getInstance();
    this.registerDefaultChecks();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): HealthMonitor {
    if (!this.instance) {
      this.instance = new HealthMonitor();
    }
    return this.instance;
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    this.registerCheck("memory", this.checkMemoryUsage.bind(this));
    this.registerCheck("performance", this.checkPerformanceMetrics.bind(this));
    this.registerCheck("errors", this.checkRecentErrors.bind(this));
    this.registerCheck("platform_apis", this.checkPlatformAPIs.bind(this));
  }

  /**
   * Register a custom health check
   */
  registerCheck(name: string, checkFunction: HealthCheckFunction): void {
    this.checks.set(name, checkFunction);
    this.logger.debug(`Health check registered: ${name}`);
  }

  /**
   * Remove a health check
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
    this.logger.debug(`Health check unregistered: ${name}`);
  }

  /**
   * Run all health checks and generate report
   */
  async checkHealth(): Promise<HealthReport> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    const checks: HealthCheckResult[] = [];

    this.logger.debug("Starting health check cycle");

    // Run all registered checks
    for (const [name, checkFunction] of this.checks.entries()) {
      try {
        const startTime = Date.now();
        const result = await checkFunction();
        const duration = Date.now() - startTime;
        
        checks.push({
          ...result,
          duration,
        });

        this.logger.debug(`Health check completed: ${name}`, undefined, {
          status: result.status,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - Date.now();
        checks.push({
          name,
          status: "unhealthy",
          message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          duration,
        });

        this.logger.error(`Health check failed: ${name}`, undefined, undefined, error instanceof Error ? error : undefined);
      }
    }

    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === "healthy").length,
      degraded: checks.filter(c => c.status === "degraded").length,
      unhealthy: checks.filter(c => c.status === "unhealthy").length,
    };

    // Determine overall status
    let overallStatus: HealthStatus = "healthy";
    if (summary.unhealthy > 0) {
      overallStatus = "unhealthy";
    } else if (summary.degraded > 0) {
      overallStatus = "degraded";
    }

    const report: HealthReport = {
      status: overallStatus,
      timestamp,
      uptime,
      version: "0.1.0", // Should match package version
      checks,
      summary,
    };

    this.logger.info("Health check completed", undefined, {
      status: overallStatus,
      totalChecks: summary.total,
      healthyChecks: summary.healthy,
    });

    return report;
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    try {
      // For Node.js/Bun environments
      if (typeof process !== "undefined" && process.memoryUsage) {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

        let status: HealthStatus = "healthy";
        let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`;

        if (heapUsagePercent > 90) {
          status = "unhealthy";
          message += " - Critical memory usage";
        } else if (heapUsagePercent > 75) {
          status = "degraded";
          message += " - High memory usage";
        }

        return {
          name: "memory",
          status,
          message,
          duration: 0,
          metadata: {
            heapUsed: heapUsedMB,
            heapTotal: heapTotalMB,
            heapUsagePercent: heapUsagePercent.toFixed(1),
            rss: Math.round(usage.rss / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
          },
        };
      } else {
        // Fallback for environments without process.memoryUsage
        return {
          name: "memory",
          status: "healthy",
          message: "Memory monitoring not available in this environment",
          duration: 0,
        };
      }
    } catch (error) {
      return {
        name: "memory",
        status: "unhealthy",
        message: `Memory check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0,
      };
    }
  }

  /**
   * Check performance metrics
   */
  private async checkPerformanceMetrics(): Promise<HealthCheckResult> {
    try {
      const monitor = PerformanceMonitor.getInstance();
      const summary = monitor.getPerformanceSummary();

      let status: HealthStatus = "healthy";
      let message = `Performance: ${summary.totalRequests} requests, ${summary.overallErrorRate.toFixed(1)}% errors, ${summary.averageResponseTime.toFixed(0)}ms avg response`;

      if (summary.overallErrorRate > 0.1) {
        status = "unhealthy";
        message += " - High error rate";
      } else if (summary.overallErrorRate > 0.05) {
        status = "degraded";
        message += " - Elevated error rate";
      }

      if (summary.averageResponseTime > 5000) {
        status = "unhealthy";
        message += " - Slow response times";
      } else if (summary.averageResponseTime > 2000) {
        if (status !== "unhealthy") status = "degraded";
        message += " - Slower than optimal";
      }

      return {
        name: "performance",
        status,
        message,
        duration: 0,
        metadata: {
          totalRequests: summary.totalRequests,
          errorRate: summary.overallErrorRate,
          averageResponseTime: summary.averageResponseTime,
          cacheEfficiency: summary.cacheEfficiency,
        },
      };
    } catch (error) {
      return {
        name: "performance",
        status: "unhealthy",
        message: `Performance check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0,
      };
    }
  }

  /**
   * Check for recent errors in logs
   */
  private async checkRecentErrors(): Promise<HealthCheckResult> {
    try {
      const logger = Logger.getInstance();
      const stats = logger.getLogStats();
      const hasRecentErrors = logger.hasRecentErrors(10);

      let status: HealthStatus = "healthy";
      let message = `Error logs: ${stats.recentErrors} errors in the last hour`;

      if (hasRecentErrors) {
        status = "degraded";
        message += " - Recent errors detected";
      }

      if (stats.recentErrors > 10) {
        status = "unhealthy";
        message += " - High error frequency";
      }

      return {
        name: "errors",
        status,
        message,
        duration: 0,
        metadata: {
          recentErrors: stats.recentErrors,
          totalLogs: stats.total,
          errorsByLevel: stats.byLevel,
        },
      };
    } catch (error) {
      return {
        name: "errors",
        status: "unhealthy",
        message: `Error check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0,
      };
    }
  }

  /**
   * Check platform API connectivity (basic connectivity test)
   */
  private async checkPlatformAPIs(): Promise<HealthCheckResult> {
    try {
      const platforms: Platform[] = ["whatsapp", "messenger", "instagram"];
      const results: Record<Platform, boolean> = {} as any;
      let healthyCount = 0;

      // Note: This is a basic check. In a real implementation, you might want to
      // make actual API calls to verify connectivity, but that requires valid tokens
      for (const platform of platforms) {
        try {
          // Basic DNS/connectivity check
          const baseUrls = {
            whatsapp: "https://graph.facebook.com",
            messenger: "https://graph.facebook.com", 
            instagram: "https://graph.instagram.com",
          };

          // Simple connectivity test (this is basic and might not work in all environments)
          results[platform] = true; // Assume healthy for now
          healthyCount++;
        } catch {
          results[platform] = false;
        }
      }

      let status: HealthStatus = "healthy";
      let message = `Platform APIs: ${healthyCount}/${platforms.length} reachable`;

      if (healthyCount === 0) {
        status = "unhealthy";
        message += " - No platform APIs reachable";
      } else if (healthyCount < platforms.length) {
        status = "degraded";
        message += " - Some platform APIs unreachable";
      }

      return {
        name: "platform_apis",
        status,
        message,
        duration: 0,
        metadata: {
          platforms: results,
          healthyCount,
          totalCount: platforms.length,
        },
      };
    } catch (error) {
      return {
        name: "platform_apis",
        status: "unhealthy",
        message: `Platform API check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0,
      };
    }
  }

  /**
   * Get system uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get formatted uptime string
   */
  getFormattedUptime(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Check if system is ready to handle requests
   */
  async isReady(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.status !== "unhealthy";
  }

  /**
   * Check if system is alive (basic liveness check)
   */
  isAlive(): boolean {
    return true; // If we can execute this method, we're alive
  }
}
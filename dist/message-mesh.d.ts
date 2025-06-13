import type { MessageMeshConfig, Platform, SendMessageResponse } from "./types.js";
import type { IWhatsAppService, IMessengerService, IInstagramService } from "./interfaces.js";
import { type PlatformCapabilities } from "./platform-capabilities.js";
import { type PerformanceMetrics } from "./performance.js";
import { type LogLevel, type LogEntry } from "./logger.js";
import { type HealthReport } from "./health.js";
import { type WebhookEvent } from "./webhook.js";
export declare class MessageMesh {
    readonly whatsapp: IWhatsAppService;
    readonly messenger: IMessengerService;
    readonly instagram: IInstagramService;
    private readonly httpClient;
    constructor(config?: MessageMeshConfig);
    getVersion(): string;
    getConfig(): MessageMeshConfig;
    /**
     * Get capabilities for a specific platform
     */
    getPlatformCapabilities(platform: Platform): PlatformCapabilities;
    /**
     * Check if a platform supports a specific feature
     */
    platformSupportsFeature(platform: Platform, feature: keyof PlatformCapabilities): boolean;
    /**
     * Get all platforms that support a specific feature
     */
    getPlatformsWithFeature(feature: keyof PlatformCapabilities): Platform[];
    /**
     * Get maximum message length for a platform
     */
    getMaxMessageLength(platform: Platform): number;
    /**
     * Get maximum media size for a platform (in MB)
     */
    getMaxMediaSize(platform: Platform): number;
    /**
     * Check if a file type is supported by a platform
     */
    isFileTypeSupported(platform: Platform, mimeType: string): boolean;
    /**
     * Get rate limit information for a platform
     */
    getRateLimit(platform: Platform): {
        default: number;
        burst: number;
    };
    /**
     * Compare capabilities across all platforms
     */
    compareAllPlatforms(): Record<Platform, {
        supportedFeatures: string[];
        totalFeatures: number;
    }>;
    /**
     * Get feature availability matrix across all platforms
     */
    getFeatureMatrix(): Record<string, Record<Platform, boolean>>;
    /**
     * Find the best platform for a specific use case
     */
    getBestPlatformForFeatures(requiredFeatures: (keyof PlatformCapabilities)[]): Platform | null;
    /**
     * Get supported platforms (all available platforms)
     */
    getSupportedPlatforms(): Platform[];
    /**
     * Universal message sender that automatically chooses the best platform
     * or sends to multiple platforms with graceful degradation
     */
    sendUniversalMessage(options: {
        accessTokens: Partial<Record<Platform, string>>;
        to: Partial<Record<Platform, string>>;
        message: string;
        phoneNumberIds?: Partial<Record<Platform, string>>;
        preferredPlatforms?: Platform[];
        fallbackToAnyPlatform?: boolean;
        metadata?: Record<string, any>;
    }): Promise<Record<Platform, SendMessageResponse>>;
    /**
     * Validate message options across platforms with detailed feedback
     */
    validateMessageAcrossPlatforms(options: {
        message: string;
        mediaType?: string;
        platforms?: Platform[];
    }): Record<Platform, {
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Get platform-specific formatting recommendations
     */
    getFormattingRecommendations(platform: Platform): {
        maxMessageLength: number;
        supportedMediaTypes: string[];
        recommendedPractices: string[];
    };
    /**
     * Get performance metrics for a specific platform
     */
    getPerformanceMetrics(platform: Platform): PerformanceMetrics | null;
    /**
     * Get performance metrics for all platforms
     */
    getAllPerformanceMetrics(): Record<Platform, PerformanceMetrics>;
    /**
     * Get recent request history
     */
    getRecentRequests(platform?: Platform, limit?: number): import("./performance.js").RequestMetrics[];
    /**
     * Get performance summary across all platforms
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
    /**
     * Reset performance metrics
     */
    resetPerformanceMetrics(): void;
    /**
     * Clear response cache
     */
    clearResponseCache(): void;
    /**
     * Get cache statistics and efficiency
     */
    getCacheStats(): {
        summary: {
            totalRequests: number;
            cacheEfficiency: number;
        };
        byPlatform: Record<Platform, {
            cacheHits: number;
            cacheMisses: number;
            hitRate: number;
        }>;
    };
    /**
     * Analyze performance and provide optimization suggestions
     */
    getPerformanceAnalysis(): {
        overall: string;
        suggestions: string[];
        warnings: string[];
        platformAnalysis: Record<Platform, {
            status: "good" | "warning" | "critical";
            issues: string[];
        }>;
    };
    /**
     * Configure logging
     */
    configureLogging(config: {
        level?: LogLevel;
        enableConsole?: boolean;
        enableFile?: boolean;
        maxLogSize?: number;
        sensitiveFields?: string[];
    }): void;
    /**
     * Get recent logs
     */
    getLogs(level?: LogLevel, platform?: Platform, limit?: number): LogEntry[];
    /**
     * Get log statistics
     */
    getLogStats(): {
        total: number;
        byLevel: Record<LogLevel, number>;
        byPlatform: Record<Platform, number>;
        recentErrors: number;
    };
    /**
     * Clear all logs
     */
    clearLogs(): void;
    /**
     * Export logs as JSON
     */
    exportLogs(): string;
    /**
     * Perform comprehensive health check
     */
    checkHealth(): Promise<HealthReport>;
    /**
     * Check if system is ready to handle requests
     */
    isReady(): Promise<boolean>;
    /**
     * Check if system is alive (basic liveness check)
     */
    isAlive(): boolean;
    /**
     * Get system uptime
     */
    getUptime(): number;
    /**
     * Get formatted uptime string
     */
    getFormattedUptime(): string;
    /**
     * Register custom health check
     */
    registerHealthCheck(name: string, checkFunction: () => Promise<{
        status: "healthy" | "degraded" | "unhealthy";
        message: string;
        metadata?: Record<string, any>;
    }>): void;
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string, secret: string, algorithm?: "sha1" | "sha256", prefix?: string): boolean;
    /**
     * Handle webhook verification challenge
     */
    handleWebhookChallenge(mode: string, token: string, challenge: string, verifyToken: string): import("./webhook.js").WebhookVerificationResult;
    /**
     * Parse webhook events from platform
     */
    parseWebhookEvents(payload: any, platform: Platform): WebhookEvent[];
    /**
     * Register webhook event processor
     */
    registerWebhookProcessor(eventType: string, processor: (event: WebhookEvent) => Promise<void> | void): void;
    /**
     * Process webhook events
     */
    processWebhookEvents(events: WebhookEvent[]): Promise<void>;
    /**
     * Validate webhook payload structure
     */
    validateWebhookPayload(payload: any, platform: Platform): boolean;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): Promise<{
        health: HealthReport;
        performance: any;
        logs: any;
        uptime: string;
        version: string;
    }>;
}

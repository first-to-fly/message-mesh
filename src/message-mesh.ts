import type { MessageMeshConfig, Platform, SendMessageResponse } from "./types.js";
import type { IWhatsAppService, IMessengerService, IInstagramService } from "./interfaces.js";
import { MessageMeshError } from "./types.js";
import { HttpClient } from "./http-client.js";
import { WhatsAppService } from "./services/whatsapp.js";
import { MessengerService } from "./services/messenger.js";
import { InstagramService } from "./services/instagram.js";
import { PlatformCapabilitiesManager, type PlatformCapabilities } from "./platform-capabilities.js";
import { PerformanceMonitor, type PerformanceMetrics } from "./performance.js";
import { Logger, type LogLevel, type LogEntry } from "./logger.js";
import { HealthMonitor, type HealthReport } from "./health.js";
import { WebhookManager, type WebhookEvent } from "./webhook.js";

export class MessageMesh {
  public readonly whatsapp: IWhatsAppService;
  public readonly messenger: IMessengerService;
  public readonly instagram: IInstagramService;
  private readonly httpClient: HttpClient;

  constructor(config: MessageMeshConfig = {}) {
    this.httpClient = new HttpClient({
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    });

    this.whatsapp = new WhatsAppService(this.httpClient);
    this.messenger = new MessengerService(this.httpClient);
    this.instagram = new InstagramService(this.httpClient);
  }

  getVersion(): string {
    return "0.1.0";
  }

  getConfig(): MessageMeshConfig {
    return {
      timeout: this.httpClient["config"].timeout,
      retryAttempts: this.httpClient["config"].retryAttempts,
    };
  }

  // Platform Capabilities Methods

  /**
   * Get capabilities for a specific platform
   */
  getPlatformCapabilities(platform: Platform): PlatformCapabilities {
    return PlatformCapabilitiesManager.getCapabilities(platform);
  }

  /**
   * Check if a platform supports a specific feature
   */
  platformSupportsFeature(platform: Platform, feature: keyof PlatformCapabilities): boolean {
    return PlatformCapabilitiesManager.supportsFeature(platform, feature);
  }

  /**
   * Get all platforms that support a specific feature
   */
  getPlatformsWithFeature(feature: keyof PlatformCapabilities): Platform[] {
    return PlatformCapabilitiesManager.getPlatformsWithFeature(feature);
  }

  /**
   * Get maximum message length for a platform
   */
  getMaxMessageLength(platform: Platform): number {
    return PlatformCapabilitiesManager.getMaxMessageLength(platform);
  }

  /**
   * Get maximum media size for a platform (in MB)
   */
  getMaxMediaSize(platform: Platform): number {
    return PlatformCapabilitiesManager.getMaxMediaSize(platform);
  }

  /**
   * Check if a file type is supported by a platform
   */
  isFileTypeSupported(platform: Platform, mimeType: string): boolean {
    return PlatformCapabilitiesManager.isFileTypeSupported(platform, mimeType);
  }

  /**
   * Get rate limit information for a platform
   */
  getRateLimit(platform: Platform): { default: number; burst: number } {
    return PlatformCapabilitiesManager.getRateLimit(platform);
  }

  /**
   * Compare capabilities across all platforms
   */
  compareAllPlatforms(): Record<Platform, { supportedFeatures: string[]; totalFeatures: number }> {
    return PlatformCapabilitiesManager.compareCapabilities();
  }

  /**
   * Get feature availability matrix across all platforms
   */
  getFeatureMatrix(): Record<string, Record<Platform, boolean>> {
    return PlatformCapabilitiesManager.getFeatureMatrix();
  }

  /**
   * Find the best platform for a specific use case
   */
  getBestPlatformForFeatures(requiredFeatures: (keyof PlatformCapabilities)[]): Platform | null {
    const platforms = Object.keys(this.getPlatformCapabilities("whatsapp")) as Platform[];
    
    for (const platform of platforms) {
      const hasAllFeatures = requiredFeatures.every(feature => 
        this.platformSupportsFeature(platform, feature)
      );
      
      if (hasAllFeatures) {
        return platform;
      }
    }
    
    return null; // No platform supports all required features
  }

  /**
   * Get supported platforms (all available platforms)
   */
  getSupportedPlatforms(): Platform[] {
    return ["whatsapp", "messenger", "instagram"];
  }

  // Universal Messaging Methods

  /**
   * Universal message sender that automatically chooses the best platform
   * or sends to multiple platforms with graceful degradation
   */
  async sendUniversalMessage(options: {
    accessTokens: Partial<Record<Platform, string>>;
    to: Partial<Record<Platform, string>>;
    message: string;
    phoneNumberIds?: Partial<Record<Platform, string>>;
    preferredPlatforms?: Platform[];
    fallbackToAnyPlatform?: boolean;
    metadata?: Record<string, any>;
  }): Promise<Record<Platform, SendMessageResponse>> {
    const results: Record<Platform, SendMessageResponse> = {} as any;
    const platforms = options.preferredPlatforms || this.getSupportedPlatforms();

    for (const platform of platforms) {
      const accessToken = options.accessTokens[platform];
      const recipient = options.to[platform];
      const phoneNumberId = options.phoneNumberIds?.[platform];

      if (!accessToken || !recipient) {
        results[platform] = {
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message: `Missing access token or recipient for ${platform}`,
            platform,
          },
        };
        continue;
      }

      // For WhatsApp, phoneNumberId is required
      if (platform === "whatsapp" && !phoneNumberId) {
        results[platform] = {
          success: false,
          error: {
            code: "MISSING_PHONE_NUMBER_ID",
            message: "phoneNumberId is required for WhatsApp messaging",
            platform,
          },
        };
        continue;
      }

      // Check if platform supports text messaging
      if (!this.platformSupportsFeature(platform, "sendTextMessage")) {
        results[platform] = {
          success: false,
          error: {
            code: "FEATURE_NOT_SUPPORTED",
            message: `Text messaging not supported on ${platform}`,
            platform,
          },
        };
        continue;
      }

      // Check message length limits
      const maxLength = this.getMaxMessageLength(platform);
      if (options.message.length > maxLength) {
        results[platform] = {
          success: false,
          error: {
            code: "MESSAGE_TOO_LONG",
            message: `Message exceeds ${platform} limit of ${maxLength} characters`,
            platform,
          },
        };
        continue;
      }

      // Send message using appropriate service
      try {
        switch (platform) {
          case "whatsapp":
            results[platform] = await this.whatsapp.sendMessage({
              accessToken,
              to: recipient,
              message: options.message,
              phoneNumberId: phoneNumberId!,
              metadata: options.metadata,
            });
            break;
          case "messenger":
            results[platform] = await this.messenger.sendMessage({
              accessToken,
              to: recipient,
              message: options.message,
              metadata: options.metadata,
            });
            break;
          case "instagram":
            results[platform] = await this.instagram.sendMessage({
              accessToken,
              to: recipient,
              message: options.message,
              metadata: options.metadata,
            });
            break;
        }
      } catch (error) {
        results[platform] = {
          success: false,
          error: {
            code: "SEND_FAILED",
            message: error instanceof Error ? error.message : "Unknown error occurred",
            platform,
          },
        };
      }
    }

    return results;
  }

  /**
   * Validate message options across platforms with detailed feedback
   */
  validateMessageAcrossPlatforms(options: {
    message: string;
    mediaType?: string;
    platforms?: Platform[];
  }): Record<Platform, { valid: boolean; issues: string[] }> {
    const platforms = options.platforms || this.getSupportedPlatforms();
    const results: Record<Platform, { valid: boolean; issues: string[] }> = {} as any;

    for (const platform of platforms) {
      const issues: string[] = [];
      
      // Check message length
      const maxLength = this.getMaxMessageLength(platform);
      if (options.message.length > maxLength) {
        issues.push(`Message exceeds maximum length of ${maxLength} characters`);
      }

      // Check media type support if specified
      if (options.mediaType && !this.isFileTypeSupported(platform, options.mediaType)) {
        issues.push(`Media type ${options.mediaType} not supported`);
      }

      // Check basic text messaging support
      if (!this.platformSupportsFeature(platform, "sendTextMessage")) {
        issues.push("Text messaging not supported");
      }

      results[platform] = {
        valid: issues.length === 0,
        issues,
      };
    }

    return results;
  }

  /**
   * Get platform-specific formatting recommendations
   */
  getFormattingRecommendations(platform: Platform): {
    maxMessageLength: number;
    supportedMediaTypes: string[];
    recommendedPractices: string[];
  } {
    const capabilities = this.getPlatformCapabilities(platform);
    const recommendations: string[] = [];

    // Platform-specific recommendations
    switch (platform) {
      case "whatsapp":
        recommendations.push(
          "Use +country_code format for phone numbers",
          "Template messages require pre-approval",
          "Media messages support captions",
          "Business API rate limits apply"
        );
        break;
      case "messenger":
        recommendations.push(
          "User must have messaged your page within 24 hours",
          "Use Facebook User IDs for recipients",
          "Message tags may be required for certain use cases"
        );
        break;
      case "instagram":
        recommendations.push(
          "Use Instagram Scoped User IDs (IGSID)",
          "Business account required",
          "Lower character limits compared to other platforms"
        );
        break;
    }

    return {
      maxMessageLength: capabilities.maxMessageLength,
      supportedMediaTypes: capabilities.supportedFileTypes,
      recommendedPractices: recommendations,
    };
  }

  // Performance Monitoring Methods

  /**
   * Get performance metrics for a specific platform
   */
  getPerformanceMetrics(platform: Platform): PerformanceMetrics | null {
    return PerformanceMonitor.getInstance().getMetrics(platform);
  }

  /**
   * Get performance metrics for all platforms
   */
  getAllPerformanceMetrics(): Record<Platform, PerformanceMetrics> {
    return PerformanceMonitor.getInstance().getAllMetrics();
  }

  /**
   * Get recent request history
   */
  getRecentRequests(platform?: Platform, limit: number = 50) {
    return PerformanceMonitor.getInstance().getRecentRequests(platform, limit);
  }

  /**
   * Get performance summary across all platforms
   */
  getPerformanceSummary() {
    return PerformanceMonitor.getInstance().getPerformanceSummary();
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    PerformanceMonitor.getInstance().resetMetrics();
  }

  /**
   * Clear response cache
   */
  clearResponseCache(): void {
    PerformanceMonitor.getInstance().clearCache();
  }

  /**
   * Get cache statistics and efficiency
   */
  getCacheStats(): {
    summary: { totalRequests: number; cacheEfficiency: number };
    byPlatform: Record<Platform, { cacheHits: number; cacheMisses: number; hitRate: number }>;
  } {
    const allMetrics = this.getAllPerformanceMetrics();
    const summary = this.getPerformanceSummary();
    
    const byPlatform = {} as Record<Platform, { cacheHits: number; cacheMisses: number; hitRate: number }>;
    
    for (const [platform, metrics] of Object.entries(allMetrics)) {
      byPlatform[platform as Platform] = {
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        hitRate: metrics.cacheHitRate,
      };
    }

    return {
      summary: {
        totalRequests: summary.totalRequests,
        cacheEfficiency: summary.cacheEfficiency,
      },
      byPlatform,
    };
  }

  /**
   * Analyze performance and provide optimization suggestions
   */
  getPerformanceAnalysis(): {
    overall: string;
    suggestions: string[];
    warnings: string[];
    platformAnalysis: Record<Platform, { status: "good" | "warning" | "critical"; issues: string[] }>;
  } {
    const summary = this.getPerformanceSummary();
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const platformAnalysis = {} as Record<Platform, { status: "good" | "warning" | "critical"; issues: string[] }>;

    // Analyze overall performance
    let overall = "good";
    
    if (summary.overallErrorRate > 0.1) {
      overall = "critical";
      warnings.push(`High error rate: ${(summary.overallErrorRate * 100).toFixed(1)}%`);
    } else if (summary.overallErrorRate > 0.05) {
      overall = "warning";
      warnings.push(`Elevated error rate: ${(summary.overallErrorRate * 100).toFixed(1)}%`);
    }

    if (summary.averageResponseTime > 5000) {
      overall = "critical";
      warnings.push(`Slow average response time: ${summary.averageResponseTime.toFixed(0)}ms`);
    } else if (summary.averageResponseTime > 2000) {
      if (overall !== "critical") overall = "warning";
      warnings.push(`Slower than optimal response time: ${summary.averageResponseTime.toFixed(0)}ms`);
    }

    // Cache efficiency analysis
    if (summary.cacheEfficiency < 0.3 && summary.totalRequests > 50) {
      suggestions.push("Consider implementing response caching for frequently accessed data");
    } else if (summary.cacheEfficiency > 0.7) {
      suggestions.push("Good cache efficiency! Consider expanding caching to more endpoints");
    }

    // Platform-specific analysis
    const allMetrics = this.getAllPerformanceMetrics();
    for (const [platform, metrics] of Object.entries(allMetrics)) {
      const issues: string[] = [];
      let status: "good" | "warning" | "critical" = "good";

      if (metrics.errorRate > 0.1) {
        status = "critical";
        issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      } else if (metrics.errorRate > 0.05) {
        status = "warning";
        issues.push(`Elevated error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      }

      if (metrics.averageResponseTime > 5000) {
        status = "critical";
        issues.push(`Slow response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
      } else if (metrics.averageResponseTime > 2000) {
        if (status !== "critical") status = "warning";
        issues.push(`Slower response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
      }

      platformAnalysis[platform as Platform] = { status, issues };
    }

    // General suggestions
    if (summary.totalRequests > 1000) {
      suggestions.push("Consider implementing request batching for high-volume use cases");
    }

    if (suggestions.length === 0) {
      suggestions.push("Performance looks good! Continue monitoring for optimization opportunities");
    }

    return {
      overall,
      suggestions,
      warnings,
      platformAnalysis,
    };
  }

  // Production Features

  /**
   * Configure logging
   */
  configureLogging(config: { 
    level?: LogLevel; 
    enableConsole?: boolean; 
    enableFile?: boolean;
    maxLogSize?: number;
    sensitiveFields?: string[];
  }): void {
    Logger.getInstance().configure(config);
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, platform?: Platform, limit: number = 100): LogEntry[] {
    return Logger.getInstance().getLogs(level, platform, limit);
  }

  /**
   * Get log statistics
   */
  getLogStats() {
    return Logger.getInstance().getLogStats();
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    Logger.getInstance().clearLogs();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return Logger.getInstance().exportLogs();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthReport> {
    return HealthMonitor.getInstance().checkHealth();
  }

  /**
   * Check if system is ready to handle requests
   */
  async isReady(): Promise<boolean> {
    return HealthMonitor.getInstance().isReady();
  }

  /**
   * Check if system is alive (basic liveness check)
   */
  isAlive(): boolean {
    return HealthMonitor.getInstance().isAlive();
  }

  /**
   * Get system uptime
   */
  getUptime(): number {
    return HealthMonitor.getInstance().getUptime();
  }

  /**
   * Get formatted uptime string
   */
  getFormattedUptime(): string {
    return HealthMonitor.getInstance().getFormattedUptime();
  }

  /**
   * Register custom health check
   */
  registerHealthCheck(name: string, checkFunction: () => Promise<{ status: "healthy" | "degraded" | "unhealthy"; message: string; metadata?: Record<string, any> }>): void {
    HealthMonitor.getInstance().registerCheck(name, async () => {
      const result = await checkFunction();
      return {
        name,
        status: result.status,
        message: result.message,
        duration: 0,
        metadata: result.metadata,
      };
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: "sha1" | "sha256" = "sha256",
    prefix?: string
  ): boolean {
    return WebhookManager.getInstance().verifySignature(payload, signature, {
      secret,
      algorithm,
      headerName: "x-hub-signature-256",
      prefix,
    });
  }

  /**
   * Handle webhook verification challenge
   */
  handleWebhookChallenge(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ) {
    return WebhookManager.getInstance().handleVerificationChallenge(mode, token, challenge, verifyToken);
  }

  /**
   * Parse webhook events from platform
   */
  parseWebhookEvents(payload: any, platform: Platform): WebhookEvent[] {
    const webhookManager = WebhookManager.getInstance();
    
    switch (platform) {
      case "whatsapp":
        return webhookManager.parseWhatsAppWebhook(payload);
      case "messenger":
        return webhookManager.parseMessengerWebhook(payload);
      case "instagram":
        return webhookManager.parseInstagramWebhook(payload);
      default:
        throw new MessageMeshError(
          "UNSUPPORTED_PLATFORM",
          platform,
          `Webhook parsing not supported for platform: ${platform}`
        );
    }
  }

  /**
   * Register webhook event processor
   */
  registerWebhookProcessor(eventType: string, processor: (event: WebhookEvent) => Promise<void> | void): void {
    WebhookManager.getInstance().registerProcessor(eventType, processor);
  }

  /**
   * Process webhook events
   */
  async processWebhookEvents(events: WebhookEvent[]): Promise<void> {
    return WebhookManager.getInstance().processEvents(events);
  }

  /**
   * Validate webhook payload structure
   */
  validateWebhookPayload(payload: any, platform: Platform): boolean {
    return WebhookManager.getInstance().validateWebhookPayload(payload, platform);
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<{
    health: HealthReport;
    performance: any; // ReturnType of getPerformanceSummary
    logs: any; // ReturnType of getLogStats
    uptime: string;
    version: string;
  }> {
    const health = await this.checkHealth();
    const performance = this.getPerformanceSummary();
    const logs = this.getLogStats();
    const uptime = this.getFormattedUptime();
    const version = this.getVersion();

    return {
      health,
      performance,
      logs,
      uptime,
      version,
    };
  }
}
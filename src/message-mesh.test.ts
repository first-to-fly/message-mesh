import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { MessageMesh } from "./message-mesh.js";
import { MessageMeshError } from "./types.js";
import { SecurityUtils } from "./security.js";
import { PlatformCapabilitiesManager } from "./platform-capabilities.js";
import { PerformanceMonitor } from "./performance.js";
import { Logger } from "./logger.js";
import { HealthMonitor } from "./health.js";
import { WebhookManager } from "./webhook.js";

describe("MessageMesh", () => {
  it("should create instance with default config", () => {
    const mesh = new MessageMesh();
    expect(mesh).toBeDefined();
    expect(mesh.whatsapp).toBeDefined();
    expect(mesh.messenger).toBeDefined();
    expect(mesh.instagram).toBeDefined();
  });

  it("should create instance with custom config", () => {
    const config = { timeout: 60000, retryAttempts: 5 };
    const mesh = new MessageMesh(config);
    expect(mesh.getConfig()).toEqual(config);
  });

  it("should return version", () => {
    const mesh = new MessageMesh();
    expect(mesh.getVersion()).toBe("0.1.0");
  });
});

  describe("Platform Capabilities", () => {
    let mesh: MessageMesh;

    beforeEach(() => {
      mesh = new MessageMesh();
    });

    it("should get platform capabilities", () => {
      const whatsappCaps = mesh.getPlatformCapabilities("whatsapp");
      expect(whatsappCaps).toBeDefined();
      expect(whatsappCaps.sendTextMessage).toBe(true);
      expect(whatsappCaps.sendTemplate).toBe(true);
      expect(whatsappCaps.maxMessageLength).toBe(4096);
    });

    it("should check feature support", () => {
      expect(mesh.platformSupportsFeature("whatsapp", "sendTextMessage")).toBe(true);
      expect(mesh.platformSupportsFeature("messenger", "sendTemplate")).toBe(false);
    });

    it("should get platforms with feature", () => {
      const platforms = mesh.getPlatformsWithFeature("sendTextMessage");
      expect(platforms).toContain("whatsapp");
      expect(platforms).toContain("messenger");
      expect(platforms).toContain("instagram");
    });

    it("should get max message length", () => {
      expect(mesh.getMaxMessageLength("whatsapp")).toBe(4096);
      expect(mesh.getMaxMessageLength("messenger")).toBe(2000);
      expect(mesh.getMaxMessageLength("instagram")).toBe(1000);
    });

    it("should check file type support", () => {
      expect(mesh.isFileTypeSupported("whatsapp", "image/jpeg")).toBe(true);
      expect(mesh.isFileTypeSupported("instagram", "application/pdf")).toBe(false);
    });

    it("should get feature matrix", () => {
      const matrix = mesh.getFeatureMatrix();
      expect(matrix.sendTextMessage).toBeDefined();
      expect(matrix.sendTextMessage?.whatsapp).toBe(true);
      expect(matrix.sendTemplate?.messenger).toBe(false);
    });
  });

  describe("Performance Monitoring", () => {
    let mesh: MessageMesh;

    beforeEach(() => {
      mesh = new MessageMesh();
      mesh.resetPerformanceMetrics();
    });

    it("should get performance metrics", () => {
      const metrics = mesh.getPerformanceMetrics("whatsapp");
      expect(metrics).toBeDefined();
      expect(metrics?.requestCount).toBe(0);
      expect(metrics?.errorCount).toBe(0);
    });

    it("should get performance summary", () => {
      const summary = mesh.getPerformanceSummary();
      expect(summary).toBeDefined();
      expect(summary.totalRequests).toBe(0);
      expect(summary.overallErrorRate).toBe(0);
    });

    it("should get cache stats", () => {
      const stats = mesh.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.summary).toBeDefined();
      expect(stats.byPlatform).toBeDefined();
    });

    it("should get performance analysis", () => {
      const analysis = mesh.getPerformanceAnalysis();
      expect(analysis).toBeDefined();
      expect(analysis.overall).toBe("good");
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(Array.isArray(analysis.warnings)).toBe(true);
    });
  });

  describe("Health Monitoring", () => {
    let mesh: MessageMesh;

    beforeEach(() => {
      mesh = new MessageMesh();
    });

    it("should check if system is alive", () => {
      expect(mesh.isAlive()).toBe(true);
    });

    it("should get uptime", () => {
      const uptime = mesh.getUptime();
      expect(typeof uptime).toBe("number");
      expect(uptime).toBeGreaterThanOrEqual(0);
    });

    it("should get formatted uptime", () => {
      const uptime = mesh.getFormattedUptime();
      expect(typeof uptime).toBe("string");
    });

    it("should perform health check", async () => {
      const health = await mesh.checkHealth();
      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBe("0.1.0");
      expect(Array.isArray(health.checks)).toBe(true);
    });

    it("should check readiness", async () => {
      const ready = await mesh.isReady();
      expect(typeof ready).toBe("boolean");
    });

    it("should register custom health check", async () => {
      mesh.registerHealthCheck("test-check", async () => ({
        status: "healthy",
        message: "Test check passed"
      }));

      const health = await mesh.checkHealth();
      const testCheck = health.checks.find(check => check.name === "test-check");
      expect(testCheck).toBeDefined();
      expect(testCheck?.status).toBe("healthy");
    });
  });

  describe("Logging", () => {
    let mesh: MessageMesh;

    beforeEach(() => {
      mesh = new MessageMesh();
      mesh.clearLogs();
    });

    afterEach(() => {
      mesh.clearLogs();
    });

    it("should configure logging", () => {
      mesh.configureLogging({
        level: "debug",
        enableConsole: false,
        maxLogSize: 500
      });
      
      // Configuration is applied, no direct way to verify but no errors should occur
      expect(true).toBe(true);
    });

    it("should get log stats", () => {
      const stats = mesh.getLogStats();
      expect(stats).toBeDefined();
      expect(stats.total).toBe(0);
      expect(stats.byLevel).toBeDefined();
      expect(stats.byPlatform).toBeDefined();
    });

    it("should export logs", () => {
      const exported = mesh.exportLogs();
      expect(typeof exported).toBe("string");
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe("Webhook Utilities", () => {
    let mesh: MessageMesh;

    beforeEach(() => {
      mesh = new MessageMesh();
    });

    it("should handle webhook verification challenge", () => {
      const result = mesh.handleWebhookChallenge(
        "subscribe",
        "test-token",
        "test-challenge",
        "test-token"
      );
      
      expect(result.isValid).toBe(true);
      expect(result.challenge).toBe("test-challenge");
    });

    it("should fail invalid webhook challenge", () => {
      const result = mesh.handleWebhookChallenge(
        "subscribe",
        "wrong-token",
        "test-challenge",
        "test-token"
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should validate webhook payload", () => {
      const validPayload = { entry: [{ id: "123", changes: [] }] };
      const invalidPayload = { invalid: true };

      expect(mesh.validateWebhookPayload(validPayload, "whatsapp")).toBe(true);
      expect(mesh.validateWebhookPayload(invalidPayload, "whatsapp")).toBe(false);
    });

    it("should parse WhatsApp webhook", () => {
      const payload = {
        entry: [{
          id: "123",
          changes: [{
            field: "messages",
            value: { messages: [{ id: "msg123", text: { body: "Hello" } }] }
          }]
        }]
      };

      const events = mesh.parseWebhookEvents(payload, "whatsapp");
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(1);
      expect(events[0]?.platform).toBe("whatsapp");
      expect(events[0]?.eventType).toBe("message_received");
    });

    it("should register webhook processor", () => {
      const processor = (event: any) => {
        // Mock processor
      };

      mesh.registerWebhookProcessor("test-event", processor);
      // No direct way to verify registration, but should not throw
      expect(true).toBe(true);
    });
  });

  describe("Universal Messaging", () => {
    let mesh: MessageMesh;

    beforeEach(() => {
      mesh = new MessageMesh();
    });

    it("should validate message across platforms", () => {
      const shortMessage = "Hello";
      const longMessage = "x".repeat(5000);

      const shortValidation = mesh.validateMessageAcrossPlatforms({ message: shortMessage });
      expect(shortValidation.whatsapp.valid).toBe(true);
      expect(shortValidation.messenger.valid).toBe(true);
      expect(shortValidation.instagram.valid).toBe(true);

      const longValidation = mesh.validateMessageAcrossPlatforms({ message: longMessage });
      expect(longValidation.whatsapp.valid).toBe(false);
      expect(longValidation.messenger.valid).toBe(false);
      expect(longValidation.instagram.valid).toBe(false);
    });

    it("should get formatting recommendations", () => {
      const whatsappRecs = mesh.getFormattingRecommendations("whatsapp");
      expect(whatsappRecs.maxMessageLength).toBe(4096);
      expect(Array.isArray(whatsappRecs.supportedMediaTypes)).toBe(true);
      expect(Array.isArray(whatsappRecs.recommendedPractices)).toBe(true);
    });

    it("should get system status", async () => {
      const status = await mesh.getSystemStatus();
      expect(status).toBeDefined();
      expect(status.health).toBeDefined();
      expect(status.performance).toBeDefined();
      expect(status.logs).toBeDefined();
      expect(status.uptime).toBeDefined();
      expect(status.version).toBe("0.1.0");
    });
  });

describe("SecurityUtils", () => {
  describe("Text Sanitization", () => {
    it("should sanitize text input", () => {
      const input = "Hello\x00World\x1F";
      const sanitized = SecurityUtils.sanitizeText(input);
      expect(sanitized).toBe("HelloWorld");
    });

    it("should validate message content", () => {
      const validMessage = "Hello World";
      const emptyMessage = "";
      const longMessage = "x".repeat(5000);

      expect(() => SecurityUtils.validateMessageContent(validMessage, "whatsapp")).not.toThrow();
      expect(() => SecurityUtils.validateMessageContent(emptyMessage, "whatsapp")).toThrow();
      expect(() => SecurityUtils.validateMessageContent(longMessage, "whatsapp")).toThrow();
    });
  });

  describe("Access Token Validation", () => {
    it("should validate access token", () => {
      const validToken = "valid-token-123";
      const invalidToken = "";
      const tokenWithInvalidChars = "token\nwith\rnewlines";

      expect(() => SecurityUtils.validateAccessToken(validToken, "whatsapp")).not.toThrow();
      expect(() => SecurityUtils.validateAccessToken(invalidToken, "whatsapp")).toThrow();
      expect(() => SecurityUtils.validateAccessToken(tokenWithInvalidChars, "whatsapp")).toThrow();
    });
  });

  describe("URL Validation", () => {
    it("should validate secure URLs", () => {
      const httpsUrl = "https://example.com/api";
      const httpUrl = "http://example.com/api";
      const invalidUrl = "not-a-url";

      expect(() => SecurityUtils.validateUrl(httpsUrl, "whatsapp")).not.toThrow();
      expect(() => SecurityUtils.validateUrl(httpUrl, "whatsapp")).toThrow();
      expect(() => SecurityUtils.validateUrl(invalidUrl, "whatsapp")).toThrow();
    });
  });

  describe("Metadata Validation", () => {
    it("should validate and sanitize metadata", () => {
      const validMetadata = { key1: "value1", key2: 123, key3: true };
      const oversizedMetadata = { data: "x".repeat(10000) };

      expect(() => SecurityUtils.validateMetadata(validMetadata, "whatsapp")).not.toThrow();
      expect(() => SecurityUtils.validateMetadata(oversizedMetadata, "whatsapp")).toThrow();
    });
  });
});

describe("PlatformCapabilitiesManager", () => {
  it("should get capabilities for platforms", () => {
    const whatsappCaps = PlatformCapabilitiesManager.getCapabilities("whatsapp");
    expect(whatsappCaps.sendTextMessage).toBe(true);
    expect(whatsappCaps.maxMessageLength).toBe(4096);
  });

  it("should check feature support", () => {
    expect(PlatformCapabilitiesManager.supportsFeature("whatsapp", "sendTextMessage")).toBe(true);
    expect(PlatformCapabilitiesManager.supportsFeature("messenger", "sendTemplate")).toBe(false);
  });

  it("should get platforms with feature", () => {
    const platforms = PlatformCapabilitiesManager.getPlatformsWithFeature("sendTextMessage");
    expect(platforms).toContain("whatsapp");
    expect(platforms).toContain("messenger");
    expect(platforms).toContain("instagram");
  });

  it("should compare capabilities", () => {
    const comparison = PlatformCapabilitiesManager.compareCapabilities();
    expect(comparison.whatsapp).toBeDefined();
    expect(comparison.whatsapp.supportedFeatures.length).toBeGreaterThan(0);
    expect(comparison.whatsapp.totalFeatures).toBeGreaterThan(0);
  });
});

describe("MessageMeshError", () => {
  it("should create error with required fields", () => {
    const error = new MessageMeshError("TEST_CODE", "whatsapp", "Test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error.platform).toBe("whatsapp");
    expect(error.message).toBe("Test message");
    expect(error.name).toBe("MessageMeshError");
  });

  it("should create error with original error", () => {
    const originalError = new Error("Original error");
    const error = new MessageMeshError("TEST_CODE", "whatsapp", "Test message", originalError);
    expect(error.originalError).toBe(originalError);
  });
});
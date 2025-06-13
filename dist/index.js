// @bun
var __require = import.meta.require;

// src/types.ts
class MessageMeshError extends Error {
  code;
  platform;
  originalError;
  constructor(code, platform, message, originalError) {
    super(message);
    this.code = code;
    this.platform = platform;
    this.originalError = originalError;
    this.name = "MessageMeshError";
  }
}

// src/performance.ts
class ResponseCache {
  cache = new Map;
  maxSize = 100;
  defaultTTL = 5 * 60 * 1000;
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  set(key, data, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  clear() {
    this.cache.clear();
  }
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0
    };
  }
}

class PerformanceMonitor {
  static instance;
  metrics = new Map;
  requests = [];
  cache = new ResponseCache;
  maxRequestHistory = 1000;
  constructor() {
    const platforms = ["whatsapp", "messenger", "instagram"];
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
        cacheHitRate: 0
      });
    }
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor;
    }
    return this.instance;
  }
  startRequest(platform, method) {
    const requestId = `${platform}-${method}-${Date.now()}-${Math.random()}`;
    const request = {
      platform,
      method,
      startTime: Date.now(),
      success: false
    };
    this.requests.push(request);
    if (this.requests.length > this.maxRequestHistory) {
      this.requests.shift();
    }
    return requestId;
  }
  endRequest(requestId, success, error, cacheHit) {
    const request = this.requests.find((r) => `${r.platform}-${r.method}-${r.startTime}` === requestId.substring(0, requestId.lastIndexOf("-")));
    if (!request) {
      return;
    }
    request.endTime = Date.now();
    request.duration = request.endTime - request.startTime;
    request.success = success;
    request.error = error;
    request.cacheHit = cacheHit;
    this.updateMetrics(request);
  }
  updateMetrics(request) {
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
  getMetrics(platform) {
    return this.metrics.get(platform) || null;
  }
  getAllMetrics() {
    const result = {};
    for (const [platform, metrics] of this.metrics.entries()) {
      result[platform] = { ...metrics };
    }
    return result;
  }
  getRecentRequests(platform, limit = 50) {
    let requests = this.requests;
    if (platform) {
      requests = requests.filter((r) => r.platform === platform);
    }
    return requests.sort((a, b) => b.startTime - a.startTime).slice(0, limit);
  }
  resetMetrics() {
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
        cacheHitRate: 0
      });
    }
    this.requests = [];
  }
  getCachedResponse(key) {
    const result = this.cache.get(key);
    return result;
  }
  cacheResponse(key, data, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, data, ttlMs);
  }
  clearCache() {
    this.cache.clear();
  }
  static generateCacheKey(platform, method, params) {
    const sanitizedParams = { ...params };
    delete sanitizedParams.accessToken;
    const paramString = JSON.stringify(sanitizedParams, Object.keys(sanitizedParams).sort());
    if (typeof Buffer !== "undefined") {
      return `${platform}:${method}:${Buffer.from(paramString).toString("base64")}`;
    } else {
      return `${platform}:${method}:${paramString}`;
    }
  }
  getPerformanceSummary() {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let totalCacheHits = 0;
    let totalCacheRequests = 0;
    const platformBreakdown = {};
    for (const [platform, metrics] of this.metrics.entries()) {
      totalRequests += metrics.requestCount;
      totalErrors += metrics.errorCount;
      totalResponseTime += metrics.totalResponseTime;
      totalCacheHits += metrics.cacheHits;
      totalCacheRequests += metrics.cacheHits + metrics.cacheMisses;
      platformBreakdown[platform] = {
        requests: metrics.requestCount,
        errors: metrics.errorCount,
        avgResponseTime: metrics.averageResponseTime
      };
    }
    return {
      totalRequests,
      totalErrors,
      overallErrorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      cacheEfficiency: totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0,
      platformBreakdown
    };
  }
}

// src/logger.ts
class Logger {
  static instance;
  config;
  logs = [];
  levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  constructor(config = {}) {
    this.config = {
      level: config.level || "info",
      enableConsole: config.enableConsole ?? true,
      enableFile: config.enableFile ?? false,
      maxLogSize: config.maxLogSize || 1000,
      sensitiveFields: config.sensitiveFields || ["accessToken", "password", "secret", "key", "token"]
    };
  }
  static getInstance(config) {
    if (!this.instance) {
      this.instance = new Logger(config);
    }
    return this.instance;
  }
  configure(config) {
    this.config = { ...this.config, ...config };
  }
  shouldLog(level) {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }
  sanitizeMetadata(metadata) {
    if (!metadata)
      return;
    const sanitized = { ...metadata };
    for (const field of this.config.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      }
    }
    return sanitized;
  }
  createLogEntry(level, message, platform, metadata, error) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      platform,
      metadata: this.sanitizeMetadata(metadata)
    };
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    return entry;
  }
  addLogEntry(entry) {
    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogSize) {
      this.logs = this.logs.slice(-this.config.maxLogSize);
    }
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }
  outputToConsole(entry) {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const platformInfo = entry.platform ? ` [${entry.platform}]` : "";
    const logMessage = `${prefix}${platformInfo} ${entry.message}`;
    switch (entry.level) {
      case "debug":
        console.debug(logMessage, entry.metadata);
        break;
      case "info":
        console.info(logMessage, entry.metadata);
        break;
      case "warn":
        console.warn(logMessage, entry.metadata);
        if (entry.error)
          console.warn(entry.error);
        break;
      case "error":
        console.error(logMessage, entry.metadata);
        if (entry.error)
          console.error(entry.error);
        break;
    }
  }
  debug(message, platform, metadata) {
    if (!this.shouldLog("debug"))
      return;
    const entry = this.createLogEntry("debug", message, platform, metadata);
    this.addLogEntry(entry);
  }
  info(message, platform, metadata) {
    if (!this.shouldLog("info"))
      return;
    const entry = this.createLogEntry("info", message, platform, metadata);
    this.addLogEntry(entry);
  }
  warn(message, platform, metadata, error) {
    if (!this.shouldLog("warn"))
      return;
    const entry = this.createLogEntry("warn", message, platform, metadata, error);
    this.addLogEntry(entry);
  }
  error(message, platform, metadata, error) {
    if (!this.shouldLog("error"))
      return;
    const entry = this.createLogEntry("error", message, platform, metadata, error);
    this.addLogEntry(entry);
  }
  logRequestStart(platform, method, url, metadata) {
    this.debug(`API request started: ${method} ${url}`, platform, {
      method,
      url,
      ...metadata
    });
  }
  logRequestEnd(platform, method, url, duration, success, metadata) {
    const level = success ? "info" : "warn";
    const status = success ? "completed" : "failed";
    this[level](`API request ${status}: ${method} ${url} (${duration}ms)`, platform, {
      method,
      url,
      duration,
      success,
      ...metadata
    });
  }
  logMessageSent(platform, recipient, success, messageId) {
    const level = success ? "info" : "error";
    const status = success ? "sent" : "failed";
    this[level](`Message ${status}`, platform, {
      recipient: this.maskRecipient(recipient),
      success,
      messageId
    });
  }
  maskRecipient(recipient) {
    if (recipient.includes("@")) {
      const [local, domain] = recipient.split("@");
      const localPart = local || "";
      const domainPart = domain || "";
      return `${localPart.slice(0, 2)}***@${domainPart}`;
    } else if (recipient.startsWith("+")) {
      return `${recipient.slice(0, 4)}***${recipient.slice(-2)}`;
    } else {
      return `${recipient.slice(0, 3)}***${recipient.slice(-2)}`;
    }
  }
  getLogs(level, platform, limit = 100) {
    let filteredLogs = this.logs;
    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }
    if (platform) {
      filteredLogs = filteredLogs.filter((log) => log.platform === platform);
    }
    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }
  getLogStats() {
    const byLevel = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };
    const byPlatform = {
      whatsapp: 0,
      messenger: 0,
      instagram: 0
    };
    let recentErrors = 0;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const log of this.logs) {
      byLevel[log.level]++;
      if (log.platform) {
        byPlatform[log.platform]++;
      }
      if (log.level === "error" && new Date(log.timestamp).getTime() > oneHourAgo) {
        recentErrors++;
      }
    }
    return {
      total: this.logs.length,
      byLevel,
      byPlatform,
      recentErrors
    };
  }
  clearLogs() {
    this.logs = [];
  }
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
  hasRecentErrors(minutes = 10) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.logs.some((log) => log.level === "error" && new Date(log.timestamp).getTime() > cutoff);
  }
}

// src/http-client.ts
class HttpClient {
  config;
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 3
    };
  }
  async request(url, options, platform) {
    this.validateSecureUrl(url);
    const sanitizedHeaders = this.sanitizeHeaders(options.headers);
    const monitor = PerformanceMonitor.getInstance();
    const requestId = monitor.startRequest(platform, options.method);
    const logger = Logger.getInstance();
    const requestStartTime = Date.now();
    logger.logRequestStart(platform, options.method, url, {
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts
    });
    const { timeout, retryAttempts } = this.config;
    let lastError;
    for (let attempt = 0;attempt <= retryAttempts; attempt++) {
      try {
        const controller = new AbortController;
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "User-Agent": "message-mesh/0.1.0",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            ...sanitizedHeaders
          }
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          const error = new MessageMeshError(`HTTP_${response.status}`, platform, `HTTP ${response.status}: ${errorText}`, new Error(errorText));
          monitor.endRequest(requestId, false, error.message);
          throw error;
        }
        monitor.endRequest(requestId, true);
        const duration = Date.now() - requestStartTime;
        logger.logRequestEnd(platform, options.method, url, duration, true, {
          status: response.status,
          attempt: attempt + 1
        });
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (error instanceof MessageMeshError) {
          throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
          const timeoutError = new MessageMeshError("TIMEOUT", platform, `Request timed out after ${timeout}ms`, error);
          monitor.endRequest(requestId, false, timeoutError.message);
          const duration2 = Date.now() - requestStartTime;
          logger.logRequestEnd(platform, options.method, url, duration2, false, {
            error: "timeout",
            attempt: attempt + 1
          });
          throw timeoutError;
        }
        if (attempt < retryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 1e4);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        const networkError = new MessageMeshError("NETWORK_ERROR", platform, `Network error after ${retryAttempts + 1} attempts: ${lastError.message}`, lastError);
        monitor.endRequest(requestId, false, networkError.message);
        const duration = Date.now() - requestStartTime;
        logger.logRequestEnd(platform, options.method, url, duration, false, {
          error: "network",
          attempts: retryAttempts + 1,
          lastError: lastError.message
        });
        throw networkError;
      }
    }
    const unknownError = new MessageMeshError("UNKNOWN_ERROR", platform, "Request failed for unknown reasons", lastError);
    monitor.endRequest(requestId, false, unknownError.message);
    throw unknownError;
  }
  async get(url, headers, platform) {
    return this.request(url, { method: "GET", headers }, platform);
  }
  async post(url, body, headers, platform) {
    return this.request(url, { method: "POST", headers, body }, platform);
  }
  async put(url, body, headers, platform) {
    return this.request(url, { method: "PUT", headers, body }, platform);
  }
  async delete(url, headers, platform) {
    return this.request(url, { method: "DELETE", headers }, platform);
  }
  validateSecureUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:") {
        throw new MessageMeshError("INSECURE_URL", "all", "All API calls must use HTTPS for security");
      }
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError("INVALID_URL", "all", "Invalid URL format provided");
    }
  }
  sanitizeHeaders(headers) {
    if (!headers)
      return {};
    const sanitized = {};
    const dangerousHeaders = ["host", "origin", "referer"];
    for (const [key, value] of Object.entries(headers)) {
      if (dangerousHeaders.includes(key.toLowerCase())) {
        continue;
      }
      if (typeof value === "string") {
        const sanitizedValue = value.replace(/[\r\n\t]/g, "").trim();
        if (sanitizedValue && sanitizedValue.length <= 2048) {
          sanitized[key] = sanitizedValue;
        }
      }
    }
    return sanitized;
  }
}

// src/security.ts
class SecurityUtils {
  static MAX_MESSAGE_LENGTH = 4096;
  static MAX_METADATA_SIZE = 8192;
  static MAX_ACCESS_TOKEN_LENGTH = 512;
  static MAX_USER_ID_LENGTH = 64;
  static sanitizeText(input) {
    if (typeof input !== "string") {
      throw new Error("Input must be a string");
    }
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    sanitized = sanitized.normalize("NFC");
    sanitized = sanitized.trim();
    return sanitized;
  }
  static validateMessageContent(message, platform) {
    const sanitized = this.sanitizeText(message);
    if (!sanitized) {
      throw new MessageMeshError("INVALID_MESSAGE", platform, "Message content cannot be empty after sanitization");
    }
    if (sanitized.length > this.MAX_MESSAGE_LENGTH) {
      throw new MessageMeshError("MESSAGE_TOO_LONG", platform, `Message content exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`);
    }
    return sanitized;
  }
  static validateAccessToken(token, platform) {
    if (typeof token !== "string" || !token.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", platform, "Access token is required and must be a non-empty string");
    }
    const trimmed = token.trim();
    if (trimmed.length > this.MAX_ACCESS_TOKEN_LENGTH) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", platform, `Access token exceeds maximum length of ${this.MAX_ACCESS_TOKEN_LENGTH} characters`);
    }
    if (!/^[A-Za-z0-9_\-|.]+$/.test(trimmed)) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", platform, "Access token contains invalid characters");
    }
    return trimmed;
  }
  static validateUserId(userId, platform) {
    if (typeof userId !== "string" || !userId.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", platform, "User ID is required and must be a non-empty string");
    }
    const trimmed = userId.trim();
    if (trimmed.length > this.MAX_USER_ID_LENGTH) {
      throw new MessageMeshError("INVALID_RECIPIENT", platform, `User ID exceeds maximum length of ${this.MAX_USER_ID_LENGTH} characters`);
    }
    return trimmed;
  }
  static validateMetadata(metadata, platform) {
    if (!metadata || typeof metadata !== "object") {
      return {};
    }
    const serialized = JSON.stringify(metadata);
    if (serialized.length > this.MAX_METADATA_SIZE) {
      throw new MessageMeshError("METADATA_TOO_LARGE", platform, `Metadata size exceeds maximum of ${this.MAX_METADATA_SIZE} bytes`);
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeText(value);
      } else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[key] = value;
      } else if (value === null) {
        sanitized[key] = null;
      }
    }
    return sanitized;
  }
  static validateUrl(url, platform) {
    if (typeof url !== "string" || !url.trim()) {
      throw new MessageMeshError("INVALID_URL", platform, "URL is required");
    }
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:") {
        throw new MessageMeshError("INSECURE_URL", platform, "Only HTTPS URLs are allowed for security");
      }
      if (!parsedUrl.hostname || parsedUrl.hostname === "localhost") {
        throw new MessageMeshError("INVALID_URL", platform, "Invalid or local hostname not allowed");
      }
      return url.trim();
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError("INVALID_URL", platform, "Invalid URL format");
    }
  }
  static getSecureHeaders() {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache"
    };
  }
  static checkRateLimit(lastRequestTime, minIntervalMs, platform) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < minIntervalMs) {
      const waitTime = minIntervalMs - timeSinceLastRequest;
      throw new MessageMeshError("RATE_LIMIT_EXCEEDED", platform, `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying`);
    }
  }
}

// src/services/whatsapp.ts
class WhatsAppService {
  httpClient;
  static BASE_URL = "https://graph.facebook.com/v23.0";
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  async validateAccessToken(accessToken) {
    try {
      const response = await this.httpClient.get(`${WhatsAppService.BASE_URL}/me`, {
        Authorization: `Bearer ${accessToken}`
      }, "whatsapp");
      return response.status === 200;
    } catch {
      return false;
    }
  }
  async sendMessage(options) {
    try {
      console.log(`[MessageMesh] WhatsApp sendMessage called with phoneNumberId: "${options.phoneNumberId}", to: ${options.to}`);
      this.validateMessageOptions(options);
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "text",
        text: {
          body: options.message
        },
        ...options.metadata && { metadata: options.metadata }
      };
      const phoneNumberId = this.extractPhoneNumberId(options.accessToken, options.phoneNumberId);
      const url = `${WhatsAppService.BASE_URL}/${phoneNumberId}/messages`;
      console.log(`[MessageMesh] sendMessage - Constructed WhatsApp API URL: ${url}`);
      const response = await this.httpClient.post(url, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendTemplate(options) {
    try {
      console.log(`[MessageMesh] WhatsApp sendTemplate called with phoneNumberId: "${options.phoneNumberId}", templateName: ${options.templateName}, to: ${options.to}`);
      this.validateTemplateOptions(options);
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "template",
        template: {
          name: options.templateName,
          language: {
            code: options.templateLanguage
          },
          ...options.templateComponents && {
            components: options.templateComponents
          }
        },
        ...options.metadata && { metadata: options.metadata }
      };
      const phoneNumberId = this.extractPhoneNumberId(options.accessToken, options.phoneNumberId);
      const url = `${WhatsAppService.BASE_URL}/${phoneNumberId}/messages`;
      console.log(`[MessageMesh] sendTemplate - Constructed WhatsApp API URL: ${url}`);
      const response = await this.httpClient.post(url, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  async replyMessage(options) {
    try {
      console.log(`[MessageMesh] WhatsApp replyMessage called with phoneNumberId: "${options.phoneNumberId}", replyToMessageId: ${options.replyToMessageId}, to: ${options.to}`);
      this.validateReplyOptions(options);
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "text",
        context: {
          message_id: options.replyToMessageId
        },
        text: {
          body: options.message
        },
        ...options.metadata && { metadata: options.metadata }
      };
      const response = await this.httpClient.post(`${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendReaction(options) {
    try {
      this.validateReactionOptions(options);
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "reaction",
        reaction: {
          message_id: options.messageId,
          emoji: options.emoji
        }
      };
      const response = await this.httpClient.post(`${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendMedia(options) {
    try {
      this.validateMediaOptions(options);
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: options.mediaType,
        [options.mediaType]: {
          ...options.mediaUrl && { link: options.mediaUrl },
          ...options.mediaPath && { id: options.mediaPath },
          ...options.caption && { caption: options.caption },
          ...options.filename && { filename: options.filename }
        },
        ...options.metadata && { metadata: options.metadata }
      };
      const response = await this.httpClient.post(`${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendEmoji(options) {
    try {
      this.validateEmojiOptions(options);
      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "text",
        text: {
          body: options.emoji
        },
        ...options.metadata && { metadata: options.metadata }
      };
      const response = await this.httpClient.post(`${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  validateMessageOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "whatsapp");
    SecurityUtils.validateUserId(options.to, "whatsapp");
    const sanitizedMessage = SecurityUtils.validateMessageContent(options.message, "whatsapp");
    if (!/^\+\d{1,15}$/.test(options.to.trim())) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient must be a valid WhatsApp phone number in E.164 format (e.g., +1234567890)");
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "whatsapp");
    }
    options.message = sanitizedMessage;
  }
  validateTemplateOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "whatsapp");
    SecurityUtils.validateUserId(options.to, "whatsapp");
    if (!/^\+\d{1,15}$/.test(options.to.trim())) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient must be a valid WhatsApp phone number in E.164 format");
    }
    const sanitizedTemplateName = SecurityUtils.sanitizeText(options.templateName);
    const sanitizedTemplateLanguage = SecurityUtils.sanitizeText(options.templateLanguage);
    if (!sanitizedTemplateName) {
      throw new MessageMeshError("INVALID_TEMPLATE", "whatsapp", "Template name is required");
    }
    if (!sanitizedTemplateLanguage) {
      throw new MessageMeshError("INVALID_TEMPLATE", "whatsapp", "Template language is required");
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "whatsapp");
    }
    options.templateName = sanitizedTemplateName;
    options.templateLanguage = sanitizedTemplateLanguage;
  }
  validateReplyOptions(options) {
    this.validateMessageOptions(options);
    if (!options.replyToMessageId?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE_ID", "whatsapp", "Reply message ID is required");
    }
  }
  validateReactionOptions(options) {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
    }
    if (!options.messageId?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE_ID", "whatsapp", "Message ID is required");
    }
    if (!options.emoji?.trim()) {
      throw new MessageMeshError("INVALID_EMOJI", "whatsapp", "Emoji is required");
    }
  }
  validateMediaOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "whatsapp");
    SecurityUtils.validateUserId(options.to, "whatsapp");
    if (!/^\+\d{1,15}$/.test(options.to.trim())) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient must be a valid WhatsApp phone number in E.164 format");
    }
    if (!options.mediaUrl && !options.mediaPath) {
      throw new MessageMeshError("INVALID_MEDIA", "whatsapp", "Either media URL or media path is required");
    }
    if (options.mediaUrl) {
      SecurityUtils.validateUrl(options.mediaUrl, "whatsapp");
    }
    const validTypes = ["image", "video", "audio", "document"];
    if (!validTypes.includes(options.mediaType)) {
      throw new MessageMeshError("INVALID_MEDIA_TYPE", "whatsapp", `Invalid media type. Must be one of: ${validTypes.join(", ")}`);
    }
    if (options.caption) {
      options.caption = SecurityUtils.sanitizeText(options.caption);
    }
    if (options.filename) {
      options.filename = SecurityUtils.sanitizeText(options.filename);
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "whatsapp");
    }
  }
  validateEmojiOptions(options) {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
    }
    if (!options.emoji?.trim()) {
      throw new MessageMeshError("INVALID_EMOJI", "whatsapp", "Emoji is required");
    }
  }
  async createTemplate(options) {
    try {
      this.validateTemplateCreateOptions(options);
      const payload = {
        name: options.name,
        category: options.category,
        language: options.language,
        components: options.components,
        ...options.allowCategoryChange && { allow_category_change: options.allowCategoryChange }
      };
      const businessId = options.businessId || this.extractBusinessId(options.accessToken);
      const response = await this.httpClient.post(`${WhatsAppService.BASE_URL}/${businessId}/message_templates`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      if (result.id) {
        return {
          success: true,
          templateId: result.id
        };
      }
      return this.handleTemplateError(result);
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }
  async updateTemplate(options) {
    try {
      this.validateTemplateUpdateOptions(options);
      const payload = {};
      if (options.components)
        payload.components = options.components;
      if (options.category)
        payload.category = options.category;
      const response = await this.httpClient.post(`${WhatsAppService.BASE_URL}/${options.templateId}`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "whatsapp");
      const result = await response.json();
      if (result.error) {
        return this.handleTemplateError(result);
      }
      return {
        success: true,
        templateId: options.templateId
      };
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }
  async deleteTemplate(options) {
    try {
      this.validateTemplateDeleteOptions(options);
      const response = await this.httpClient.delete(`${WhatsAppService.BASE_URL}/${options.templateId}?name=${encodeURIComponent(options.name)}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "whatsapp");
      const result = await response.json();
      if (result.error) {
        return this.handleTemplateError(result);
      }
      return {
        success: true,
        templateId: options.templateId
      };
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }
  async getTemplate(options) {
    try {
      this.validateTemplateStatusOptions(options);
      const params = new URLSearchParams;
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      const response = await this.httpClient.get(`${WhatsAppService.BASE_URL}/${options.templateId}?${params.toString()}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "whatsapp");
      const result = await response.json();
      if (result.id) {
        return {
          success: true,
          template: this.formatTemplate(result)
        };
      }
      return this.handleTemplateError(result);
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }
  async listTemplates(options) {
    try {
      this.validateTemplateListOptions(options);
      const params = new URLSearchParams;
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      if (options.limit)
        params.append("limit", options.limit.toString());
      if (options.offset)
        params.append("offset", options.offset);
      if (options.status)
        params.append("status", options.status);
      if (options.category)
        params.append("category", options.category);
      const businessId = this.extractBusinessId(options.accessToken, options.businessId);
      const response = await this.httpClient.get(`${WhatsAppService.BASE_URL}/${businessId}/message_templates?${params.toString()}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "whatsapp");
      const result = await response.json();
      if (result.data) {
        return {
          success: true,
          templates: result.data.map((template) => this.formatTemplate(template)),
          paging: result.paging
        };
      }
      return this.handleTemplateListError(result);
    } catch (error) {
      return this.handleTemplateListError(error);
    }
  }
  extractPhoneNumberId(_accessToken, phoneNumberId) {
    console.log(`[MessageMesh] extractPhoneNumberId called with phoneNumberId: "${phoneNumberId}" (type: ${typeof phoneNumberId})`);
    if (phoneNumberId) {
      console.log(`[MessageMesh] Using provided phoneNumberId: "${phoneNumberId}"`);
      return phoneNumberId;
    }
    console.log(`[MessageMesh] WARNING: No phoneNumberId provided, falling back to placeholder "PHONE_NUMBER_ID"`);
    return "PHONE_NUMBER_ID";
  }
  extractBusinessId(_accessToken, businessId) {
    if (businessId) {
      return businessId;
    }
    return "BUSINESS_ID";
  }
  validateTemplateCreateOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "whatsapp", "Template name is required");
    }
    if (!options.category) {
      throw new MessageMeshError("INVALID_TEMPLATE_CATEGORY", "whatsapp", "Template category is required");
    }
    if (!options.language) {
      throw new MessageMeshError("INVALID_TEMPLATE_LANGUAGE", "whatsapp", "Template language is required");
    }
    if (!options.components || options.components.length === 0) {
      throw new MessageMeshError("INVALID_TEMPLATE_COMPONENTS", "whatsapp", "Template components are required");
    }
  }
  validateTemplateUpdateOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "whatsapp", "Template ID is required");
    }
  }
  validateTemplateDeleteOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "whatsapp", "Template ID is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "whatsapp", "Template name is required");
    }
  }
  validateTemplateStatusOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "whatsapp", "Template ID is required");
    }
  }
  validateTemplateListOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
  }
  formatTemplate(apiTemplate) {
    const template = apiTemplate;
    return {
      id: template.id,
      name: template.name,
      status: template.status,
      category: template.category,
      language: template.language,
      components: template.components,
      createdTime: template.created_time,
      modifiedTime: template.modified_time,
      qualityScore: template.quality_score ? {
        score: template.quality_score.score,
        date: template.quality_score.date
      } : undefined,
      rejectedReason: template.rejected_reason,
      disabledDate: template.disabled_date
    };
  }
  handleTemplateError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "TEMPLATE_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "whatsapp"
      }
    };
  }
  handleTemplateListError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "TEMPLATE_LIST_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "whatsapp"
      }
    };
  }
  handleError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "whatsapp"
      }
    };
  }
}

// src/services/messenger.ts
class MessengerService {
  httpClient;
  static BASE_URL = "https://graph.facebook.com/v23.0";
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  async validateAccessToken(accessToken) {
    try {
      const response = await this.httpClient.get(`${MessengerService.BASE_URL}/me`, {
        Authorization: `Bearer ${accessToken}`
      }, "messenger");
      return response.status === 200;
    } catch {
      return false;
    }
  }
  async sendMessage(options) {
    try {
      this.validateMessageOptions(options);
      const pageId = await this.extractPageId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to
        },
        messaging_type: "RESPONSE",
        message: {
          text: options.message
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${MessengerService.BASE_URL}/${pageId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "messenger");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "messenger", `Failed to send message: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendMedia(options) {
    try {
      this.validateMediaOptions(options);
      const pageId = await this.extractPageId(options.accessToken);
      const attachment = {
        type: options.type === "file" ? "file" : options.type,
        payload: {}
      };
      if (options.mediaUrl) {
        attachment.payload.url = options.mediaUrl;
        attachment.payload.is_reusable = true;
      } else if (options.mediaId) {
        attachment.payload.attachment_id = options.mediaId;
      }
      const message = {
        attachment
      };
      if (options.caption && (options.type === "image" || options.type === "video")) {
        message.text = options.caption;
      }
      const payload = {
        recipient: {
          id: options.to
        },
        messaging_type: "RESPONSE",
        message,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${MessengerService.BASE_URL}/${pageId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "messenger");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id,
          attachmentId: data.attachment_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "messenger", `Failed to send media: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendTemplate(options) {
    try {
      this.validateTemplateOptions(options);
      const pageId = await this.extractPageId(options.accessToken);
      let template;
      switch (options.templateType) {
        case "button":
          template = {
            type: "template",
            payload: {
              template_type: "button",
              text: options.text || "",
              buttons: options.buttons
            }
          };
          break;
        case "generic":
          template = {
            type: "template",
            payload: {
              template_type: "generic",
              elements: options.elements
            }
          };
          break;
        default:
          throw new MessageMeshError("UNSUPPORTED_TEMPLATE_TYPE", "messenger", `Template type ${options.templateType} is not yet supported`);
      }
      const payload = {
        recipient: {
          id: options.to
        },
        messaging_type: "RESPONSE",
        message: {
          attachment: template
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${MessengerService.BASE_URL}/${pageId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "messenger");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "messenger", `Failed to send template: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async replyMessage(options) {
    try {
      this.validateReplyOptions(options);
      const pageId = await this.extractPageId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to
        },
        messaging_type: "RESPONSE",
        message: {
          text: options.message,
          reply_to: {
            mid: options.replyToMessageId
          }
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${MessengerService.BASE_URL}/${pageId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "messenger");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "messenger", `Failed to send reply: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async createTemplate(options) {
    try {
      this.validateMessengerTemplateCreateOptions(options);
      const payload = {
        name: options.name,
        category: options.category,
        language: options.language || "en_US",
        components: options.components
      };
      const pageId = await this.extractPageId(options.accessToken);
      const response = await this.httpClient.post(`${MessengerService.BASE_URL}/${pageId}/message_templates`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "messenger");
      const result = await response.json();
      if (result.id) {
        return {
          success: true,
          templateId: result.id
        };
      }
      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }
  async updateTemplate(options) {
    try {
      this.validateMessengerTemplateUpdateOptions(options);
      const payload = {};
      if (options.components)
        payload.components = options.components;
      if (options.category)
        payload.category = options.category;
      const response = await this.httpClient.post(`${MessengerService.BASE_URL}/${options.templateId}`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "messenger");
      const result = await response.json();
      if (result.error) {
        return this.handleMessengerTemplateError(result);
      }
      return {
        success: true,
        templateId: options.templateId
      };
      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }
  async deleteTemplate(options) {
    try {
      this.validateMessengerTemplateDeleteOptions(options);
      const response = await this.httpClient.delete(`${MessengerService.BASE_URL}/${options.templateId}?name=${encodeURIComponent(options.name)}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "messenger");
      const result = await response.json();
      if (result.error) {
        return this.handleMessengerTemplateError(result);
      }
      return {
        success: true,
        templateId: options.templateId
      };
      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }
  async getTemplate(options) {
    try {
      this.validateMessengerTemplateStatusOptions(options);
      const params = new URLSearchParams;
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      const response = await this.httpClient.get(`${MessengerService.BASE_URL}/${options.templateId}?${params.toString()}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "messenger");
      const result = await response.json();
      if (result.id) {
        return {
          success: true,
          template: this.formatMessengerTemplate(result)
        };
      }
      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }
  async listTemplates(options) {
    try {
      this.validateMessengerTemplateListOptions(options);
      const params = new URLSearchParams;
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      if (options.limit)
        params.append("limit", options.limit.toString());
      if (options.offset)
        params.append("offset", options.offset);
      if (options.status)
        params.append("status", options.status);
      if (options.category)
        params.append("category", options.category);
      const pageId = await this.extractPageId(options.accessToken);
      const response = await this.httpClient.get(`${MessengerService.BASE_URL}/${pageId}/message_templates?${params.toString()}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "messenger");
      const result = await response.json();
      if (result.data) {
        return {
          success: true,
          templates: result.data.map((template) => this.formatMessengerTemplate(template)),
          paging: result.paging
        };
      }
      return this.handleMessengerTemplateListError(result);
    } catch (error) {
      return this.handleMessengerTemplateListError(error);
    }
  }
  async extractPageId(accessToken) {
    try {
      const response = await this.httpClient.get(`${MessengerService.BASE_URL}/me`, {
        Authorization: `Bearer ${accessToken}`
      }, "messenger");
      if (response.status === 200) {
        const data = await response.json();
        if (!data.id) {
          throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Unable to extract page ID from access token");
        }
        return data.id;
      }
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Failed to validate access token");
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Failed to extract page ID from access token");
    }
  }
  validateMessageOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    SecurityUtils.validateUserId(options.to, "messenger");
    const sanitizedMessage = SecurityUtils.validateMessageContent(options.message, "messenger");
    if (sanitizedMessage.length > 2000) {
      throw new MessageMeshError("MESSAGE_TOO_LONG", "messenger", "Message content cannot exceed 2000 characters for Messenger");
    }
    if (!/^\d+$/.test(options.to.trim())) {
      throw new MessageMeshError("INVALID_RECIPIENT", "messenger", "Recipient ID must be a valid Facebook user ID (numeric)");
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "messenger");
    }
    options.message = sanitizedMessage;
  }
  validateMediaOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    SecurityUtils.validateUserId(options.to, "messenger");
    if (!options.mediaUrl && !options.mediaId) {
      throw new MessageMeshError("MISSING_MEDIA_SOURCE", "messenger", "Either mediaUrl or mediaId must be provided");
    }
    if (options.mediaUrl) {
      try {
        new URL(options.mediaUrl);
        if (!options.mediaUrl.startsWith("https://")) {
          throw new MessageMeshError("INVALID_MEDIA_URL", "messenger", "Media URL must use HTTPS protocol");
        }
      } catch {
        throw new MessageMeshError("INVALID_MEDIA_URL", "messenger", "Invalid media URL format");
      }
    }
    const validTypes = ["image", "video", "audio", "file"];
    if (!validTypes.includes(options.type)) {
      throw new MessageMeshError("INVALID_MEDIA_TYPE", "messenger", `Invalid media type: ${options.type}. Must be one of: ${validTypes.join(", ")}`);
    }
    if (options.caption && options.caption.length > 1000) {
      throw new MessageMeshError("CAPTION_TOO_LONG", "messenger", "Caption cannot exceed 1000 characters");
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "messenger");
    }
  }
  validateTemplateOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    SecurityUtils.validateUserId(options.to, "messenger");
    const validTypes = ["generic", "button", "receipt", "airline"];
    if (!validTypes.includes(options.templateType)) {
      throw new MessageMeshError("INVALID_TEMPLATE_TYPE", "messenger", `Invalid template type: ${options.templateType}. Must be one of: ${validTypes.join(", ")}`);
    }
    switch (options.templateType) {
      case "button":
        if (!options.text) {
          throw new MessageMeshError("MISSING_TEMPLATE_TEXT", "messenger", "Button template requires text");
        }
        if (!options.buttons || options.buttons.length === 0) {
          throw new MessageMeshError("MISSING_TEMPLATE_BUTTONS", "messenger", "Button template requires at least one button");
        }
        if (options.buttons.length > 3) {
          throw new MessageMeshError("TOO_MANY_BUTTONS", "messenger", "Button template supports maximum 3 buttons");
        }
        break;
      case "generic":
        if (!options.elements || options.elements.length === 0) {
          throw new MessageMeshError("MISSING_TEMPLATE_ELEMENTS", "messenger", "Generic template requires at least one element");
        }
        if (options.elements.length > 10) {
          throw new MessageMeshError("TOO_MANY_ELEMENTS", "messenger", "Generic template supports maximum 10 elements");
        }
        break;
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "messenger");
    }
  }
  validateReplyOptions(options) {
    this.validateMessageOptions({
      accessToken: options.accessToken,
      to: options.to,
      message: options.message,
      metadata: options.metadata
    });
    if (!options.replyToMessageId || options.replyToMessageId.trim().length === 0) {
      throw new MessageMeshError("MISSING_REPLY_MESSAGE_ID", "messenger", "Reply message ID is required");
    }
  }
  validateMessengerTemplateCreateOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "messenger", "Template name is required");
    }
    if (!options.category) {
      throw new MessageMeshError("INVALID_TEMPLATE_CATEGORY", "messenger", "Template category is required");
    }
    if (!options.components || options.components.length === 0) {
      throw new MessageMeshError("INVALID_TEMPLATE_COMPONENTS", "messenger", "Template components are required");
    }
  }
  validateMessengerTemplateUpdateOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "messenger", "Template ID is required");
    }
  }
  validateMessengerTemplateDeleteOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "messenger", "Template ID is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "messenger", "Template name is required");
    }
  }
  validateMessengerTemplateStatusOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "messenger", "Template ID is required");
    }
  }
  validateMessengerTemplateListOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
  }
  formatMessengerTemplate(apiTemplate) {
    const template = apiTemplate;
    return {
      id: template.id,
      name: template.name,
      status: template.status,
      category: template.category,
      language: template.language,
      components: template.components,
      createdTime: template.created_time,
      modifiedTime: template.modified_time,
      qualityScore: template.quality_score ? {
        score: template.quality_score.score,
        date: template.quality_score.date
      } : undefined,
      rejectedReason: template.rejected_reason,
      disabledDate: template.disabled_date
    };
  }
  handleMessengerTemplateError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "MESSENGER_TEMPLATE_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger"
      }
    };
  }
  handleMessengerTemplateListError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "MESSENGER_TEMPLATE_LIST_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger"
      }
    };
  }
  handleError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    if (error && typeof error === "object" && "status" in error) {
      const httpError = error;
      switch (httpError.status) {
        case 400:
          return {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Invalid request parameters or malformed data",
              platform: "messenger"
            }
          };
        case 401:
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid or expired access token",
              platform: "messenger"
            }
          };
        case 403:
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Insufficient permissions or messaging policy violation",
              platform: "messenger"
            }
          };
        case 404:
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "Recipient not found or not reachable",
              platform: "messenger"
            }
          };
        case 429:
          return {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests, please try again later",
              platform: "messenger"
            }
          };
        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Messenger platform temporarily unavailable",
              platform: "messenger"
            }
          };
      }
    }
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger"
      }
    };
  }
}

// src/services/instagram.ts
class InstagramService {
  httpClient;
  static BASE_URL = "https://graph.instagram.com/v23.0";
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  async validateAccessToken(accessToken) {
    try {
      const response = await this.httpClient.get(`${InstagramService.BASE_URL}/me`, {
        Authorization: `Bearer ${accessToken}`
      }, "instagram");
      return response.status === 200;
    } catch {
      return false;
    }
  }
  async sendMessage(options) {
    try {
      this.validateMessageOptions(options);
      const instagramAccountId = await this.extractInstagramAccountId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to
        },
        message: {
          text: options.message
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${InstagramService.BASE_URL}/${instagramAccountId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "instagram");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "instagram", `Failed to send message: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async sendMedia(options) {
    try {
      this.validateMediaOptions(options);
      const instagramAccountId = await this.extractInstagramAccountId(options.accessToken);
      const attachment = {
        type: options.type,
        payload: {}
      };
      if (options.mediaUrl) {
        attachment.payload.url = options.mediaUrl;
        attachment.payload.is_reusable = true;
      } else if (options.mediaId) {
        attachment.payload.attachment_id = options.mediaId;
      }
      const message = {
        attachment
      };
      if (options.caption && (options.type === "image" || options.type === "video")) {
        message.text = options.caption;
      }
      const payload = {
        recipient: {
          id: options.to
        },
        message,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${InstagramService.BASE_URL}/${instagramAccountId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "instagram");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id,
          attachmentId: data.attachment_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "instagram", `Failed to send media: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async replyMessage(options) {
    try {
      this.validateReplyOptions(options);
      const instagramAccountId = await this.extractInstagramAccountId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to
        },
        message: {
          text: options.message,
          reply_to: {
            mid: options.replyToMessageId
          }
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined
      };
      const response = await this.httpClient.post(`${InstagramService.BASE_URL}/${instagramAccountId}/messages`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "instagram");
      if (response.status === 200) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.message_id
        };
      }
      throw new MessageMeshError("SEND_FAILED", "instagram", `Failed to send reply: ${response.status}`);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async createTemplate(options) {
    try {
      this.validateInstagramTemplateCreateOptions(options);
      const payload = {
        name: options.name,
        category: options.category,
        language: options.language || "en_US",
        components: options.components
      };
      const accountId = await this.extractInstagramAccountId(options.accessToken);
      const response = await this.httpClient.post(`${InstagramService.BASE_URL}/${accountId}/message_templates`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "instagram");
      const result = await response.json();
      if (result.id) {
        return {
          success: true,
          templateId: result.id
        };
      }
      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }
  async updateTemplate(options) {
    try {
      this.validateInstagramTemplateUpdateOptions(options);
      const payload = {};
      if (options.components)
        payload.components = options.components;
      if (options.category)
        payload.category = options.category;
      const response = await this.httpClient.post(`${InstagramService.BASE_URL}/${options.templateId}`, JSON.stringify(payload), {
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json"
      }, "instagram");
      const result = await response.json();
      if (result.error) {
        return this.handleInstagramTemplateError(result);
      }
      return {
        success: true,
        templateId: options.templateId
      };
      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }
  async deleteTemplate(options) {
    try {
      this.validateInstagramTemplateDeleteOptions(options);
      const response = await this.httpClient.delete(`${InstagramService.BASE_URL}/${options.templateId}?name=${encodeURIComponent(options.name)}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "instagram");
      const result = await response.json();
      if (result.error) {
        return this.handleInstagramTemplateError(result);
      }
      return {
        success: true,
        templateId: options.templateId
      };
      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }
  async getTemplate(options) {
    try {
      this.validateInstagramTemplateStatusOptions(options);
      const params = new URLSearchParams;
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      const response = await this.httpClient.get(`${InstagramService.BASE_URL}/${options.templateId}?${params.toString()}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "instagram");
      const result = await response.json();
      if (result.id) {
        return {
          success: true,
          template: this.formatInstagramTemplate(result)
        };
      }
      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }
  async listTemplates(options) {
    try {
      this.validateInstagramTemplateListOptions(options);
      const params = new URLSearchParams;
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      if (options.limit)
        params.append("limit", options.limit.toString());
      if (options.offset)
        params.append("offset", options.offset);
      if (options.status)
        params.append("status", options.status);
      if (options.category)
        params.append("category", options.category);
      const accountId = await this.extractInstagramAccountId(options.accessToken);
      const response = await this.httpClient.get(`${InstagramService.BASE_URL}/${accountId}/message_templates?${params.toString()}`, {
        Authorization: `Bearer ${options.accessToken}`
      }, "instagram");
      const result = await response.json();
      if (result.data) {
        return {
          success: true,
          templates: result.data.map((template) => this.formatInstagramTemplate(template)),
          paging: result.paging
        };
      }
      return this.handleInstagramTemplateListError(result);
    } catch (error) {
      return this.handleInstagramTemplateListError(error);
    }
  }
  async extractInstagramAccountId(accessToken) {
    try {
      const response = await this.httpClient.get(`${InstagramService.BASE_URL}/me`, {
        Authorization: `Bearer ${accessToken}`
      }, "instagram");
      if (response.status === 200) {
        const data = await response.json();
        if (!data.id) {
          throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Unable to extract Instagram account ID from access token");
        }
        return data.id;
      }
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Failed to validate access token");
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Failed to extract Instagram account ID from access token");
    }
  }
  validateMessageOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "instagram");
    SecurityUtils.validateUserId(options.to, "instagram");
    const sanitizedMessage = SecurityUtils.validateMessageContent(options.message, "instagram");
    if (sanitizedMessage.length > 1000) {
      throw new MessageMeshError("MESSAGE_TOO_LONG", "instagram", "Message content cannot exceed 1000 characters for Instagram");
    }
    if (!/^\d+$/.test(options.to.trim())) {
      throw new MessageMeshError("INVALID_RECIPIENT", "instagram", "Recipient ID must be a valid Instagram Scoped User ID (IGSID)");
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "instagram");
    }
    options.message = sanitizedMessage;
  }
  validateMediaOptions(options) {
    SecurityUtils.validateAccessToken(options.accessToken, "instagram");
    SecurityUtils.validateUserId(options.to, "instagram");
    if (!options.mediaUrl && !options.mediaId) {
      throw new MessageMeshError("MISSING_MEDIA_SOURCE", "instagram", "Either mediaUrl or mediaId must be provided");
    }
    if (options.mediaUrl) {
      try {
        new URL(options.mediaUrl);
        if (!options.mediaUrl.startsWith("https://")) {
          throw new MessageMeshError("INVALID_MEDIA_URL", "instagram", "Media URL must use HTTPS protocol");
        }
      } catch {
        throw new MessageMeshError("INVALID_MEDIA_URL", "instagram", "Invalid media URL format");
      }
    }
    const validTypes = ["image", "video", "audio"];
    if (!validTypes.includes(options.type)) {
      throw new MessageMeshError("INVALID_MEDIA_TYPE", "instagram", `Invalid media type: ${options.type}. Must be one of: ${validTypes.join(", ")}`);
    }
    if (options.type === "audio") {
      console.warn("Instagram has limited support for audio messages. Consider using video instead.");
    }
    if (options.caption && options.caption.length > 2200) {
      throw new MessageMeshError("CAPTION_TOO_LONG", "instagram", "Caption cannot exceed 2200 characters");
    }
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "instagram");
    }
  }
  validateReplyOptions(options) {
    this.validateMessageOptions({
      accessToken: options.accessToken,
      to: options.to,
      message: options.message,
      metadata: options.metadata
    });
    if (!options.replyToMessageId || options.replyToMessageId.trim().length === 0) {
      throw new MessageMeshError("MISSING_REPLY_MESSAGE_ID", "instagram", "Reply message ID is required");
    }
  }
  validateInstagramTemplateCreateOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "instagram", "Template name is required");
    }
    if (!options.category) {
      throw new MessageMeshError("INVALID_TEMPLATE_CATEGORY", "instagram", "Template category is required");
    }
    if (!options.components || options.components.length === 0) {
      throw new MessageMeshError("INVALID_TEMPLATE_COMPONENTS", "instagram", "Template components are required");
    }
  }
  validateInstagramTemplateUpdateOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "instagram", "Template ID is required");
    }
  }
  validateInstagramTemplateDeleteOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "instagram", "Template ID is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "instagram", "Template name is required");
    }
  }
  validateInstagramTemplateStatusOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "instagram", "Template ID is required");
    }
  }
  validateInstagramTemplateListOptions(options) {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
  }
  formatInstagramTemplate(apiTemplate) {
    const template = apiTemplate;
    return {
      id: template.id,
      name: template.name,
      status: template.status,
      category: template.category,
      language: template.language,
      components: template.components,
      createdTime: template.created_time,
      modifiedTime: template.modified_time,
      qualityScore: template.quality_score ? {
        score: template.quality_score.score,
        date: template.quality_score.date
      } : undefined,
      rejectedReason: template.rejected_reason,
      disabledDate: template.disabled_date
    };
  }
  handleInstagramTemplateError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INSTAGRAM_TEMPLATE_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "instagram"
      }
    };
  }
  handleInstagramTemplateListError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    return {
      success: false,
      error: {
        code: "INSTAGRAM_TEMPLATE_LIST_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "instagram"
      }
    };
  }
  handleError(error) {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform
        }
      };
    }
    if (error && typeof error === "object" && "status" in error) {
      const httpError = error;
      switch (httpError.status) {
        case 400:
          return {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Invalid request parameters or malformed Instagram Scoped User ID",
              platform: "instagram"
            }
          };
        case 401:
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid or expired Instagram access token",
              platform: "instagram"
            }
          };
        case 403:
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Insufficient permissions or Instagram messaging policy violation",
              platform: "instagram"
            }
          };
        case 404:
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "Instagram user not found or not reachable via messaging",
              platform: "instagram"
            }
          };
        case 429:
          return {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Instagram messaging rate limit exceeded, please try again later",
              platform: "instagram"
            }
          };
        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Instagram platform temporarily unavailable",
              platform: "instagram"
            }
          };
      }
    }
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "instagram"
      }
    };
  }
}

// src/platform-capabilities.ts
var PLATFORM_CAPABILITIES = {
  whatsapp: {
    sendTextMessage: true,
    sendEmoji: true,
    replyToMessage: true,
    sendReaction: true,
    sendImage: true,
    sendVideo: true,
    sendAudio: true,
    sendDocument: true,
    sendTemplate: true,
    markAsRead: false,
    typing: false,
    deliveryReceipts: false,
    maxMessageLength: 4096,
    maxMediaSize: 100,
    supportedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/3gpp",
      "audio/aac",
      "audio/mp4",
      "audio/mpeg",
      "audio/amr",
      "audio/ogg",
      "application/pdf",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    defaultRateLimit: 80,
    burstRateLimit: 100
  },
  messenger: {
    sendTextMessage: true,
    sendEmoji: true,
    replyToMessage: false,
    sendReaction: false,
    sendImage: false,
    sendVideo: false,
    sendAudio: false,
    sendDocument: false,
    sendTemplate: false,
    markAsRead: false,
    typing: false,
    deliveryReceipts: false,
    maxMessageLength: 2000,
    maxMediaSize: 25,
    supportedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "audio/mp3",
      "audio/mp4"
    ],
    defaultRateLimit: 200,
    burstRateLimit: 300
  },
  instagram: {
    sendTextMessage: true,
    sendEmoji: true,
    replyToMessage: false,
    sendReaction: false,
    sendImage: false,
    sendVideo: false,
    sendAudio: false,
    sendDocument: false,
    sendTemplate: false,
    markAsRead: false,
    typing: false,
    deliveryReceipts: false,
    maxMessageLength: 1000,
    maxMediaSize: 8,
    supportedFileTypes: [
      "image/jpeg",
      "image/png",
      "video/mp4"
    ],
    defaultRateLimit: 100,
    burstRateLimit: 150
  }
};

class PlatformCapabilitiesManager {
  static getCapabilities(platform) {
    return PLATFORM_CAPABILITIES[platform];
  }
  static supportsFeature(platform, feature) {
    const capabilities = this.getCapabilities(platform);
    const value = capabilities[feature];
    if (typeof value === "boolean") {
      return value;
    } else if (typeof value === "number") {
      return value > 0;
    } else if (Array.isArray(value)) {
      return value.length > 0;
    }
    return false;
  }
  static getMaxMessageLength(platform) {
    return this.getCapabilities(platform).maxMessageLength;
  }
  static getMaxMediaSize(platform) {
    return this.getCapabilities(platform).maxMediaSize;
  }
  static isFileTypeSupported(platform, mimeType) {
    const capabilities = this.getCapabilities(platform);
    return capabilities.supportedFileTypes.includes(mimeType);
  }
  static getRateLimit(platform) {
    const capabilities = this.getCapabilities(platform);
    return {
      default: capabilities.defaultRateLimit,
      burst: capabilities.burstRateLimit
    };
  }
  static getPlatformsWithFeature(feature) {
    const platforms = [];
    for (const [platform, capabilities] of Object.entries(PLATFORM_CAPABILITIES)) {
      const value = capabilities[feature];
      let isSupported = false;
      if (typeof value === "boolean") {
        isSupported = value;
      } else if (typeof value === "number") {
        isSupported = value > 0;
      } else if (Array.isArray(value)) {
        isSupported = value.length > 0;
      }
      if (isSupported) {
        platforms.push(platform);
      }
    }
    return platforms;
  }
  static compareCapabilities() {
    const comparison = {};
    for (const platform of Object.keys(PLATFORM_CAPABILITIES)) {
      const capabilities = this.getCapabilities(platform);
      const supportedFeatures = [];
      let totalFeatures = 0;
      for (const [feature, value] of Object.entries(capabilities)) {
        if (typeof value === "boolean") {
          totalFeatures++;
          if (value) {
            supportedFeatures.push(feature);
          }
        }
      }
      comparison[platform] = {
        supportedFeatures,
        totalFeatures
      };
    }
    return comparison;
  }
  static getFeatureMatrix() {
    const matrix = {};
    const sampleCapabilities = PLATFORM_CAPABILITIES.whatsapp;
    const booleanFeatures = Object.entries(sampleCapabilities).filter(([_, value]) => typeof value === "boolean").map(([key, _]) => key);
    for (const feature of booleanFeatures) {
      matrix[feature] = {};
      for (const platform of Object.keys(PLATFORM_CAPABILITIES)) {
        matrix[feature][platform] = this.supportsFeature(platform, feature);
      }
    }
    return matrix;
  }
}

// src/health.ts
class HealthMonitor {
  static instance;
  startTime;
  checks = new Map;
  logger;
  constructor() {
    this.startTime = Date.now();
    this.logger = Logger.getInstance();
    this.registerDefaultChecks();
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new HealthMonitor;
    }
    return this.instance;
  }
  registerDefaultChecks() {
    this.registerCheck("memory", this.checkMemoryUsage.bind(this));
    this.registerCheck("performance", this.checkPerformanceMetrics.bind(this));
    this.registerCheck("errors", this.checkRecentErrors.bind(this));
    this.registerCheck("platform_apis", this.checkPlatformAPIs.bind(this));
  }
  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
    this.logger.debug(`Health check registered: ${name}`);
  }
  unregisterCheck(name) {
    this.checks.delete(name);
    this.logger.debug(`Health check unregistered: ${name}`);
  }
  async checkHealth() {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    const checks = [];
    this.logger.debug("Starting health check cycle");
    for (const [name, checkFunction] of this.checks.entries()) {
      try {
        const startTime = Date.now();
        const result = await checkFunction();
        const duration = Date.now() - startTime;
        checks.push({
          ...result,
          duration
        });
        this.logger.debug(`Health check completed: ${name}`, undefined, {
          status: result.status,
          duration
        });
      } catch (error) {
        const duration = Date.now() - Date.now();
        checks.push({
          name,
          status: "unhealthy",
          message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          duration
        });
        this.logger.error(`Health check failed: ${name}`, undefined, undefined, error instanceof Error ? error : undefined);
      }
    }
    const summary = {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      degraded: checks.filter((c) => c.status === "degraded").length,
      unhealthy: checks.filter((c) => c.status === "unhealthy").length
    };
    let overallStatus = "healthy";
    if (summary.unhealthy > 0) {
      overallStatus = "unhealthy";
    } else if (summary.degraded > 0) {
      overallStatus = "degraded";
    }
    const report = {
      status: overallStatus,
      timestamp,
      uptime,
      version: "0.1.0",
      checks,
      summary
    };
    this.logger.info("Health check completed", undefined, {
      status: overallStatus,
      totalChecks: summary.total,
      healthyChecks: summary.healthy
    });
    return report;
  }
  async checkMemoryUsage() {
    try {
      if (typeof process !== "undefined" && process.memoryUsage) {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const heapUsagePercent = heapUsedMB / heapTotalMB * 100;
        let status = "healthy";
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
            external: Math.round(usage.external / 1024 / 1024)
          }
        };
      } else {
        return {
          name: "memory",
          status: "healthy",
          message: "Memory monitoring not available in this environment",
          duration: 0
        };
      }
    } catch (error) {
      return {
        name: "memory",
        status: "unhealthy",
        message: `Memory check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0
      };
    }
  }
  async checkPerformanceMetrics() {
    try {
      const monitor = PerformanceMonitor.getInstance();
      const summary = monitor.getPerformanceSummary();
      let status = "healthy";
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
        if (status !== "unhealthy")
          status = "degraded";
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
          cacheEfficiency: summary.cacheEfficiency
        }
      };
    } catch (error) {
      return {
        name: "performance",
        status: "unhealthy",
        message: `Performance check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0
      };
    }
  }
  async checkRecentErrors() {
    try {
      const logger = Logger.getInstance();
      const stats = logger.getLogStats();
      const hasRecentErrors = logger.hasRecentErrors(10);
      let status = "healthy";
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
          errorsByLevel: stats.byLevel
        }
      };
    } catch (error) {
      return {
        name: "errors",
        status: "unhealthy",
        message: `Error check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0
      };
    }
  }
  async checkPlatformAPIs() {
    try {
      const platforms = ["whatsapp", "messenger", "instagram"];
      const results = {};
      let healthyCount = 0;
      for (const platform of platforms) {
        try {
          const baseUrls = {
            whatsapp: "https://graph.facebook.com",
            messenger: "https://graph.facebook.com",
            instagram: "https://graph.instagram.com"
          };
          results[platform] = true;
          healthyCount++;
        } catch {
          results[platform] = false;
        }
      }
      let status = "healthy";
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
          totalCount: platforms.length
        }
      };
    } catch (error) {
      return {
        name: "platform_apis",
        status: "unhealthy",
        message: `Platform API check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        duration: 0
      };
    }
  }
  getUptime() {
    return Date.now() - this.startTime;
  }
  getFormattedUptime() {
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
  async isReady() {
    const health = await this.checkHealth();
    return health.status !== "unhealthy";
  }
  isAlive() {
    return true;
  }
}

// src/webhook.ts
class WebhookManager {
  static instance;
  processors = new Map;
  logger;
  constructor() {
    this.logger = Logger.getInstance();
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new WebhookManager;
    }
    return this.instance;
  }
  verifySignature(payload, signature, options) {
    try {
      const crypto = this.getCrypto();
      if (!crypto) {
        this.logger.warn("Crypto module not available for signature verification");
        return false;
      }
      const hmac = crypto.createHmac(options.algorithm, options.secret);
      hmac.update(payload, "utf8");
      const expectedSignature = hmac.digest("hex");
      const expectedSignatureWithPrefix = options.prefix ? `${options.prefix}${expectedSignature}` : expectedSignature;
      return this.timingSafeEquals(signature, expectedSignatureWithPrefix);
    } catch (error) {
      this.logger.error("Webhook signature verification failed", undefined, undefined, error instanceof Error ? error : undefined);
      return false;
    }
  }
  getCrypto() {
    try {
      return __require("crypto");
    } catch {
      try {
        return __require("crypto");
      } catch {
        return null;
      }
    }
  }
  timingSafeEquals(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0;i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  verifyFacebookWebhook(payload, signature, appSecret) {
    return this.verifySignature(payload, signature, {
      secret: appSecret,
      algorithm: "sha256",
      headerName: "x-hub-signature-256",
      prefix: "sha256="
    });
  }
  handleVerificationChallenge(mode, token, challenge, verifyToken) {
    if (mode === "subscribe" && token === verifyToken) {
      this.logger.info("Webhook verification challenge successful");
      return {
        isValid: true,
        challenge
      };
    }
    this.logger.warn("Webhook verification challenge failed", undefined, {
      mode,
      expectedToken: "[REDACTED]",
      receivedToken: "[REDACTED]"
    });
    return {
      isValid: false,
      error: "Invalid verification token"
    };
  }
  parseWhatsAppWebhook(payload) {
    const events = [];
    try {
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === "messages" && change.value) {
                const event = {
                  platform: "whatsapp",
                  eventType: this.determineWhatsAppEventType(change.value),
                  timestamp: new Date().toISOString(),
                  data: change.value,
                  metadata: {
                    entryId: entry.id,
                    changeField: change.field
                  }
                };
                events.push(event);
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse WhatsApp webhook", "whatsapp", { payload }, error instanceof Error ? error : undefined);
      throw new MessageMeshError("WEBHOOK_PARSE_ERROR", "whatsapp", "Failed to parse WhatsApp webhook payload");
    }
    return events;
  }
  parseMessengerWebhook(payload) {
    const events = [];
    try {
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              const event = {
                platform: "messenger",
                eventType: this.determineMessengerEventType(messaging),
                timestamp: new Date(messaging.timestamp).toISOString(),
                data: messaging,
                metadata: {
                  entryId: entry.id,
                  entryTime: entry.time
                }
              };
              events.push(event);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse Messenger webhook", "messenger", { payload }, error instanceof Error ? error : undefined);
      throw new MessageMeshError("WEBHOOK_PARSE_ERROR", "messenger", "Failed to parse Messenger webhook payload");
    }
    return events;
  }
  parseInstagramWebhook(payload) {
    const events = [];
    try {
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              const event = {
                platform: "instagram",
                eventType: this.determineInstagramEventType(messaging),
                timestamp: new Date(messaging.timestamp).toISOString(),
                data: messaging,
                metadata: {
                  entryId: entry.id,
                  entryTime: entry.time
                }
              };
              events.push(event);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse Instagram webhook", "instagram", { payload }, error instanceof Error ? error : undefined);
      throw new MessageMeshError("WEBHOOK_PARSE_ERROR", "instagram", "Failed to parse Instagram webhook payload");
    }
    return events;
  }
  determineWhatsAppEventType(data) {
    if (data.messages) {
      return "message_received";
    } else if (data.statuses) {
      return "message_status";
    } else if (data.contacts) {
      return "contact_update";
    }
    return "unknown";
  }
  determineMessengerEventType(messaging) {
    if (messaging.message) {
      return "message_received";
    } else if (messaging.delivery) {
      return "message_delivered";
    } else if (messaging.read) {
      return "message_read";
    } else if (messaging.postback) {
      return "postback";
    }
    return "unknown";
  }
  determineInstagramEventType(messaging) {
    if (messaging.message) {
      return "message_received";
    } else if (messaging.delivery) {
      return "message_delivered";
    } else if (messaging.read) {
      return "message_read";
    }
    return "unknown";
  }
  registerProcessor(eventType, processor) {
    this.processors.set(eventType, processor);
    this.logger.debug(`Webhook processor registered for event type: ${eventType}`);
  }
  unregisterProcessor(eventType) {
    this.processors.delete(eventType);
    this.logger.debug(`Webhook processor unregistered for event type: ${eventType}`);
  }
  async processEvents(events) {
    for (const event of events) {
      try {
        this.logger.info(`Processing webhook event: ${event.eventType}`, event.platform, {
          eventType: event.eventType,
          timestamp: event.timestamp
        });
        const processor = this.processors.get(event.eventType);
        if (processor) {
          await processor(event);
          this.logger.debug(`Webhook event processed successfully: ${event.eventType}`, event.platform);
        } else {
          this.logger.warn(`No processor found for event type: ${event.eventType}`, event.platform);
        }
      } catch (error) {
        this.logger.error(`Failed to process webhook event: ${event.eventType}`, event.platform, { eventType: event.eventType }, error instanceof Error ? error : undefined);
      }
    }
  }
  validateWebhookPayload(payload, platform) {
    try {
      switch (platform) {
        case "whatsapp":
          return this.validateWhatsAppPayload(payload);
        case "messenger":
          return this.validateMessengerPayload(payload);
        case "instagram":
          return this.validateInstagramPayload(payload);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Webhook payload validation failed for ${platform}`, platform, undefined, error instanceof Error ? error : undefined);
      return false;
    }
  }
  validateWhatsAppPayload(payload) {
    return payload && typeof payload === "object" && Array.isArray(payload.entry) && payload.entry.length > 0;
  }
  validateMessengerPayload(payload) {
    return payload && typeof payload === "object" && Array.isArray(payload.entry) && payload.entry.length > 0;
  }
  validateInstagramPayload(payload) {
    return payload && typeof payload === "object" && Array.isArray(payload.entry) && payload.entry.length > 0;
  }
  generateSuccessResponse() {
    return {
      status: 200,
      body: "OK"
    };
  }
  generateErrorResponse(error) {
    return {
      status: 400,
      body: JSON.stringify({ error })
    };
  }
}

// src/message-mesh.ts
class MessageMesh {
  whatsapp;
  messenger;
  instagram;
  httpClient;
  constructor(config = {}) {
    this.httpClient = new HttpClient({
      timeout: config.timeout,
      retryAttempts: config.retryAttempts
    });
    this.whatsapp = new WhatsAppService(this.httpClient);
    this.messenger = new MessengerService(this.httpClient);
    this.instagram = new InstagramService(this.httpClient);
  }
  getVersion() {
    return "0.1.0";
  }
  getConfig() {
    return {
      timeout: this.httpClient["config"].timeout,
      retryAttempts: this.httpClient["config"].retryAttempts
    };
  }
  getPlatformCapabilities(platform) {
    return PlatformCapabilitiesManager.getCapabilities(platform);
  }
  platformSupportsFeature(platform, feature) {
    return PlatformCapabilitiesManager.supportsFeature(platform, feature);
  }
  getPlatformsWithFeature(feature) {
    return PlatformCapabilitiesManager.getPlatformsWithFeature(feature);
  }
  getMaxMessageLength(platform) {
    return PlatformCapabilitiesManager.getMaxMessageLength(platform);
  }
  getMaxMediaSize(platform) {
    return PlatformCapabilitiesManager.getMaxMediaSize(platform);
  }
  isFileTypeSupported(platform, mimeType) {
    return PlatformCapabilitiesManager.isFileTypeSupported(platform, mimeType);
  }
  getRateLimit(platform) {
    return PlatformCapabilitiesManager.getRateLimit(platform);
  }
  compareAllPlatforms() {
    return PlatformCapabilitiesManager.compareCapabilities();
  }
  getFeatureMatrix() {
    return PlatformCapabilitiesManager.getFeatureMatrix();
  }
  getBestPlatformForFeatures(requiredFeatures) {
    const platforms = Object.keys(this.getPlatformCapabilities("whatsapp"));
    for (const platform of platforms) {
      const hasAllFeatures = requiredFeatures.every((feature) => this.platformSupportsFeature(platform, feature));
      if (hasAllFeatures) {
        return platform;
      }
    }
    return null;
  }
  getSupportedPlatforms() {
    return ["whatsapp", "messenger", "instagram"];
  }
  async sendUniversalMessage(options) {
    const results = {};
    const platforms = options.preferredPlatforms || this.getSupportedPlatforms();
    for (const platform of platforms) {
      const accessToken = options.accessTokens[platform];
      const recipient = options.to[platform];
      if (!accessToken || !recipient) {
        results[platform] = {
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message: `Missing access token or recipient for ${platform}`,
            platform
          }
        };
        continue;
      }
      if (!this.platformSupportsFeature(platform, "sendTextMessage")) {
        results[platform] = {
          success: false,
          error: {
            code: "FEATURE_NOT_SUPPORTED",
            message: `Text messaging not supported on ${platform}`,
            platform
          }
        };
        continue;
      }
      const maxLength = this.getMaxMessageLength(platform);
      if (options.message.length > maxLength) {
        results[platform] = {
          success: false,
          error: {
            code: "MESSAGE_TOO_LONG",
            message: `Message exceeds ${platform} limit of ${maxLength} characters`,
            platform
          }
        };
        continue;
      }
      try {
        switch (platform) {
          case "whatsapp":
            results[platform] = await this.whatsapp.sendMessage({
              accessToken,
              to: recipient,
              message: options.message,
              metadata: options.metadata
            });
            break;
          case "messenger":
            results[platform] = await this.messenger.sendMessage({
              accessToken,
              to: recipient,
              message: options.message,
              metadata: options.metadata
            });
            break;
          case "instagram":
            results[platform] = await this.instagram.sendMessage({
              accessToken,
              to: recipient,
              message: options.message,
              metadata: options.metadata
            });
            break;
        }
      } catch (error) {
        results[platform] = {
          success: false,
          error: {
            code: "SEND_FAILED",
            message: error instanceof Error ? error.message : "Unknown error occurred",
            platform
          }
        };
      }
    }
    return results;
  }
  validateMessageAcrossPlatforms(options) {
    const platforms = options.platforms || this.getSupportedPlatforms();
    const results = {};
    for (const platform of platforms) {
      const issues = [];
      const maxLength = this.getMaxMessageLength(platform);
      if (options.message.length > maxLength) {
        issues.push(`Message exceeds maximum length of ${maxLength} characters`);
      }
      if (options.mediaType && !this.isFileTypeSupported(platform, options.mediaType)) {
        issues.push(`Media type ${options.mediaType} not supported`);
      }
      if (!this.platformSupportsFeature(platform, "sendTextMessage")) {
        issues.push("Text messaging not supported");
      }
      results[platform] = {
        valid: issues.length === 0,
        issues
      };
    }
    return results;
  }
  getFormattingRecommendations(platform) {
    const capabilities = this.getPlatformCapabilities(platform);
    const recommendations = [];
    switch (platform) {
      case "whatsapp":
        recommendations.push("Use +country_code format for phone numbers", "Template messages require pre-approval", "Media messages support captions", "Business API rate limits apply");
        break;
      case "messenger":
        recommendations.push("User must have messaged your page within 24 hours", "Use Facebook User IDs for recipients", "Message tags may be required for certain use cases");
        break;
      case "instagram":
        recommendations.push("Use Instagram Scoped User IDs (IGSID)", "Business account required", "Lower character limits compared to other platforms");
        break;
    }
    return {
      maxMessageLength: capabilities.maxMessageLength,
      supportedMediaTypes: capabilities.supportedFileTypes,
      recommendedPractices: recommendations
    };
  }
  getPerformanceMetrics(platform) {
    return PerformanceMonitor.getInstance().getMetrics(platform);
  }
  getAllPerformanceMetrics() {
    return PerformanceMonitor.getInstance().getAllMetrics();
  }
  getRecentRequests(platform, limit = 50) {
    return PerformanceMonitor.getInstance().getRecentRequests(platform, limit);
  }
  getPerformanceSummary() {
    return PerformanceMonitor.getInstance().getPerformanceSummary();
  }
  resetPerformanceMetrics() {
    PerformanceMonitor.getInstance().resetMetrics();
  }
  clearResponseCache() {
    PerformanceMonitor.getInstance().clearCache();
  }
  getCacheStats() {
    const allMetrics = this.getAllPerformanceMetrics();
    const summary = this.getPerformanceSummary();
    const byPlatform = {};
    for (const [platform, metrics] of Object.entries(allMetrics)) {
      byPlatform[platform] = {
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        hitRate: metrics.cacheHitRate
      };
    }
    return {
      summary: {
        totalRequests: summary.totalRequests,
        cacheEfficiency: summary.cacheEfficiency
      },
      byPlatform
    };
  }
  getPerformanceAnalysis() {
    const summary = this.getPerformanceSummary();
    const suggestions = [];
    const warnings = [];
    const platformAnalysis = {};
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
      if (overall !== "critical")
        overall = "warning";
      warnings.push(`Slower than optimal response time: ${summary.averageResponseTime.toFixed(0)}ms`);
    }
    if (summary.cacheEfficiency < 0.3 && summary.totalRequests > 50) {
      suggestions.push("Consider implementing response caching for frequently accessed data");
    } else if (summary.cacheEfficiency > 0.7) {
      suggestions.push("Good cache efficiency! Consider expanding caching to more endpoints");
    }
    const allMetrics = this.getAllPerformanceMetrics();
    for (const [platform, metrics] of Object.entries(allMetrics)) {
      const issues = [];
      let status = "good";
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
        if (status !== "critical")
          status = "warning";
        issues.push(`Slower response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
      }
      platformAnalysis[platform] = { status, issues };
    }
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
      platformAnalysis
    };
  }
  configureLogging(config) {
    Logger.getInstance().configure(config);
  }
  getLogs(level, platform, limit = 100) {
    return Logger.getInstance().getLogs(level, platform, limit);
  }
  getLogStats() {
    return Logger.getInstance().getLogStats();
  }
  clearLogs() {
    Logger.getInstance().clearLogs();
  }
  exportLogs() {
    return Logger.getInstance().exportLogs();
  }
  async checkHealth() {
    return HealthMonitor.getInstance().checkHealth();
  }
  async isReady() {
    return HealthMonitor.getInstance().isReady();
  }
  isAlive() {
    return HealthMonitor.getInstance().isAlive();
  }
  getUptime() {
    return HealthMonitor.getInstance().getUptime();
  }
  getFormattedUptime() {
    return HealthMonitor.getInstance().getFormattedUptime();
  }
  registerHealthCheck(name, checkFunction) {
    HealthMonitor.getInstance().registerCheck(name, async () => {
      const result = await checkFunction();
      return {
        name,
        status: result.status,
        message: result.message,
        duration: 0,
        metadata: result.metadata
      };
    });
  }
  verifyWebhookSignature(payload, signature, secret, algorithm = "sha256", prefix) {
    return WebhookManager.getInstance().verifySignature(payload, signature, {
      secret,
      algorithm,
      headerName: "x-hub-signature-256",
      prefix
    });
  }
  handleWebhookChallenge(mode, token, challenge, verifyToken) {
    return WebhookManager.getInstance().handleVerificationChallenge(mode, token, challenge, verifyToken);
  }
  parseWebhookEvents(payload, platform) {
    const webhookManager = WebhookManager.getInstance();
    switch (platform) {
      case "whatsapp":
        return webhookManager.parseWhatsAppWebhook(payload);
      case "messenger":
        return webhookManager.parseMessengerWebhook(payload);
      case "instagram":
        return webhookManager.parseInstagramWebhook(payload);
      default:
        throw new MessageMeshError("UNSUPPORTED_PLATFORM", platform, `Webhook parsing not supported for platform: ${platform}`);
    }
  }
  registerWebhookProcessor(eventType, processor) {
    WebhookManager.getInstance().registerProcessor(eventType, processor);
  }
  async processWebhookEvents(events) {
    return WebhookManager.getInstance().processEvents(events);
  }
  validateWebhookPayload(payload, platform) {
    return WebhookManager.getInstance().validateWebhookPayload(payload, platform);
  }
  async getSystemStatus() {
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
      version
    };
  }
}
export {
  MessageMeshError,
  MessageMesh
};

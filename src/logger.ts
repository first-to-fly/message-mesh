import type { Platform } from "./types.js";

/**
 * Log levels in order of priority
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  platform?: Platform;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  maxLogSize: number; // Maximum number of log entries to keep in memory
  sensitiveFields: string[]; // Fields to redact in logs
}

/**
 * Production-ready logger with structured logging and security features
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || "info",
      enableConsole: config.enableConsole ?? true,
      enableFile: config.enableFile ?? false,
      maxLogSize: config.maxLogSize || 1000,
      sensitiveFields: config.sensitiveFields || ["accessToken", "password", "secret", "key", "token"],
    };
  }

  /**
   * Get singleton logger instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!this.instance) {
      this.instance = new Logger(config);
    }
    return this.instance;
  }

  /**
   * Configure logger settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  /**
   * Sanitize metadata by removing sensitive fields
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };
    
    for (const field of this.config.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }

    // Deep sanitization for nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      }
    }

    return sanitized;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    platform?: Platform,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      platform,
      metadata: this.sanitizeMetadata(metadata),
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Add log entry to storage
   */
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);

    // Trim logs if they exceed max size
    if (this.logs.length > this.config.maxLogSize) {
      this.logs = this.logs.slice(-this.config.maxLogSize);
    }

    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to console with appropriate formatting
   */
  private outputToConsole(entry: LogEntry): void {
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
        if (entry.error) console.warn(entry.error);
        break;
      case "error":
        console.error(logMessage, entry.metadata);
        if (entry.error) console.error(entry.error);
        break;
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, platform?: Platform, metadata?: Record<string, any>): void {
    if (!this.shouldLog("debug")) return;
    const entry = this.createLogEntry("debug", message, platform, metadata);
    this.addLogEntry(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, platform?: Platform, metadata?: Record<string, any>): void {
    if (!this.shouldLog("info")) return;
    const entry = this.createLogEntry("info", message, platform, metadata);
    this.addLogEntry(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, platform?: Platform, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog("warn")) return;
    const entry = this.createLogEntry("warn", message, platform, metadata, error);
    this.addLogEntry(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, platform?: Platform, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog("error")) return;
    const entry = this.createLogEntry("error", message, platform, metadata, error);
    this.addLogEntry(entry);
  }

  /**
   * Log API request start
   */
  logRequestStart(platform: Platform, method: string, url: string, metadata?: Record<string, any>): void {
    this.debug(`API request started: ${method} ${url}`, platform, {
      method,
      url,
      ...metadata,
    });
  }

  /**
   * Log API request completion
   */
  logRequestEnd(
    platform: Platform,
    method: string,
    url: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const level = success ? "info" : "warn";
    const status = success ? "completed" : "failed";
    
    this[level](`API request ${status}: ${method} ${url} (${duration}ms)`, platform, {
      method,
      url,
      duration,
      success,
      ...metadata,
    });
  }

  /**
   * Log message sending
   */
  logMessageSent(platform: Platform, recipient: string, success: boolean, messageId?: string): void {
    const level = success ? "info" : "error";
    const status = success ? "sent" : "failed";
    
    this[level](`Message ${status}`, platform, {
      recipient: this.maskRecipient(recipient),
      success,
      messageId,
    });
  }

  /**
   * Mask recipient information for privacy
   */
  private maskRecipient(recipient: string): string {
    if (recipient.includes("@")) {
      // Email format
      const [local, domain] = recipient.split("@");
      const localPart = local || "";
      const domainPart = domain || "";
      return `${localPart.slice(0, 2)}***@${domainPart}`;
    } else if (recipient.startsWith("+")) {
      // Phone number format
      return `${recipient.slice(0, 4)}***${recipient.slice(-2)}`;
    } else {
      // Generic ID format
      return `${recipient.slice(0, 3)}***${recipient.slice(-2)}`;
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, platform?: Platform, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (platform) {
      filteredLogs = filteredLogs.filter(log => log.platform === platform);
    }

    return filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byPlatform: Record<Platform, number>;
    recentErrors: number;
  } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    const byPlatform: Record<Platform, number> = {
      whatsapp: 0,
      messenger: 0,
      instagram: 0,
    };

    let recentErrors = 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

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
      recentErrors,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Check if there are recent errors that might indicate system issues
   */
  hasRecentErrors(minutes: number = 10): boolean {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.logs.some(log => 
      log.level === "error" && 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
}
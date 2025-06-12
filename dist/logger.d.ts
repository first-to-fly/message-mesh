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
    maxLogSize: number;
    sensitiveFields: string[];
}
/**
 * Production-ready logger with structured logging and security features
 */
export declare class Logger {
    private static instance;
    private config;
    private logs;
    private readonly levelPriority;
    private constructor();
    /**
     * Get singleton logger instance
     */
    static getInstance(config?: Partial<LoggerConfig>): Logger;
    /**
     * Configure logger settings
     */
    configure(config: Partial<LoggerConfig>): void;
    /**
     * Check if a log level should be logged
     */
    private shouldLog;
    /**
     * Sanitize metadata by removing sensitive fields
     */
    private sanitizeMetadata;
    /**
     * Create a log entry
     */
    private createLogEntry;
    /**
     * Add log entry to storage
     */
    private addLogEntry;
    /**
     * Output log entry to console with appropriate formatting
     */
    private outputToConsole;
    /**
     * Debug level logging
     */
    debug(message: string, platform?: Platform, metadata?: Record<string, any>): void;
    /**
     * Info level logging
     */
    info(message: string, platform?: Platform, metadata?: Record<string, any>): void;
    /**
     * Warning level logging
     */
    warn(message: string, platform?: Platform, metadata?: Record<string, any>, error?: Error): void;
    /**
     * Error level logging
     */
    error(message: string, platform?: Platform, metadata?: Record<string, any>, error?: Error): void;
    /**
     * Log API request start
     */
    logRequestStart(platform: Platform, method: string, url: string, metadata?: Record<string, any>): void;
    /**
     * Log API request completion
     */
    logRequestEnd(platform: Platform, method: string, url: string, duration: number, success: boolean, metadata?: Record<string, any>): void;
    /**
     * Log message sending
     */
    logMessageSent(platform: Platform, recipient: string, success: boolean, messageId?: string): void;
    /**
     * Mask recipient information for privacy
     */
    private maskRecipient;
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
     * Check if there are recent errors that might indicate system issues
     */
    hasRecentErrors(minutes?: number): boolean;
}

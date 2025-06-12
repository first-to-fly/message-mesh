import type { Platform } from "./types.js";
/**
 * Defines the capabilities and features available on each messaging platform
 */
export interface PlatformCapabilities {
    sendTextMessage: boolean;
    sendEmoji: boolean;
    replyToMessage: boolean;
    sendReaction: boolean;
    sendImage: boolean;
    sendVideo: boolean;
    sendAudio: boolean;
    sendDocument: boolean;
    sendTemplate: boolean;
    markAsRead: boolean;
    typing: boolean;
    deliveryReceipts: boolean;
    maxMessageLength: number;
    maxMediaSize: number;
    supportedFileTypes: string[];
    defaultRateLimit: number;
    burstRateLimit: number;
}
/**
 * Platform capabilities configuration for each supported platform
 */
export declare const PLATFORM_CAPABILITIES: Record<Platform, PlatformCapabilities>;
/**
 * Platform capabilities manager for feature detection and validation
 */
export declare class PlatformCapabilitiesManager {
    /**
     * Get capabilities for a specific platform
     */
    static getCapabilities(platform: Platform): PlatformCapabilities;
    /**
     * Check if a platform supports a specific feature
     */
    static supportsFeature(platform: Platform, feature: keyof PlatformCapabilities): boolean;
    /**
     * Get maximum message length for a platform
     */
    static getMaxMessageLength(platform: Platform): number;
    /**
     * Get maximum media size for a platform (in MB)
     */
    static getMaxMediaSize(platform: Platform): number;
    /**
     * Check if a file type is supported by a platform
     */
    static isFileTypeSupported(platform: Platform, mimeType: string): boolean;
    /**
     * Get rate limit information for a platform
     */
    static getRateLimit(platform: Platform): {
        default: number;
        burst: number;
    };
    /**
     * Get all platforms that support a specific feature
     */
    static getPlatformsWithFeature(feature: keyof PlatformCapabilities): Platform[];
    /**
     * Compare capabilities across platforms
     */
    static compareCapabilities(): Record<Platform, {
        supportedFeatures: string[];
        totalFeatures: number;
    }>;
    /**
     * Get feature availability matrix across all platforms
     */
    static getFeatureMatrix(): Record<string, Record<Platform, boolean>>;
}

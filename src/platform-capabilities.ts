import type { Platform } from "./types.js";

/**
 * Defines the capabilities and features available on each messaging platform
 */
export interface PlatformCapabilities {
  // Basic messaging features
  sendTextMessage: boolean;
  sendEmoji: boolean;
  replyToMessage: boolean;
  sendReaction: boolean;
  
  // Media capabilities
  sendImage: boolean;
  sendVideo: boolean;
  sendAudio: boolean;
  sendDocument: boolean;
  
  // Advanced features
  sendTemplate: boolean;
  markAsRead: boolean;
  typing: boolean;
  deliveryReceipts: boolean;
  
  // Platform-specific limits
  maxMessageLength: number;
  maxMediaSize: number; // in MB
  supportedFileTypes: string[];
  
  // Rate limiting information
  defaultRateLimit: number; // requests per minute
  burstRateLimit: number; // max burst requests
}

/**
 * Platform capabilities configuration for each supported platform
 */
export const PLATFORM_CAPABILITIES: Record<Platform, PlatformCapabilities> = {
  whatsapp: {
    // Basic messaging
    sendTextMessage: true,
    sendEmoji: true,
    replyToMessage: true,
    sendReaction: true,
    
    // Media
    sendImage: true,
    sendVideo: true,
    sendAudio: true,
    sendDocument: true,
    
    // Advanced features
    sendTemplate: true,
    markAsRead: false, // Not implemented yet
    typing: false, // Not implemented yet
    deliveryReceipts: false, // Not implemented yet
    
    // Limits
    maxMessageLength: 4096,
    maxMediaSize: 100, // 100MB for WhatsApp
    supportedFileTypes: [
      "image/jpeg", "image/png", "image/webp",
      "video/mp4", "video/3gpp",
      "audio/aac", "audio/mp4", "audio/mpeg", "audio/amr", "audio/ogg",
      "application/pdf", "text/plain", "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    
    // Rate limits
    defaultRateLimit: 80, // WhatsApp Business API typical rate limit
    burstRateLimit: 100,
  },
  
  messenger: {
    // Basic messaging
    sendTextMessage: true,
    sendEmoji: true,
    replyToMessage: false, // Not implemented yet
    sendReaction: false, // Not implemented yet
    
    // Media
    sendImage: false, // Not implemented yet
    sendVideo: false, // Not implemented yet
    sendAudio: false, // Not implemented yet
    sendDocument: false, // Not implemented yet
    
    // Advanced features
    sendTemplate: false, // Not implemented yet
    markAsRead: false, // Not implemented yet
    typing: false, // Not implemented yet
    deliveryReceipts: false, // Not implemented yet
    
    // Limits
    maxMessageLength: 2000,
    maxMediaSize: 25, // 25MB for Messenger
    supportedFileTypes: [
      "image/jpeg", "image/png", "image/gif",
      "video/mp4", "video/quicktime",
      "audio/mp3", "audio/mp4"
    ],
    
    // Rate limits
    defaultRateLimit: 200, // Messenger typical rate limit
    burstRateLimit: 300,
  },
  
  instagram: {
    // Basic messaging
    sendTextMessage: true,
    sendEmoji: true,
    replyToMessage: false, // Not implemented yet
    sendReaction: false, // Not implemented yet
    
    // Media
    sendImage: false, // Not implemented yet
    sendVideo: false, // Not implemented yet
    sendAudio: false, // Not implemented yet
    sendDocument: false, // Not implemented yet
    
    // Advanced features
    sendTemplate: false, // Not implemented yet
    markAsRead: false, // Not implemented yet
    typing: false, // Not implemented yet
    deliveryReceipts: false, // Not implemented yet
    
    // Limits
    maxMessageLength: 1000,
    maxMediaSize: 8, // 8MB for Instagram
    supportedFileTypes: [
      "image/jpeg", "image/png",
      "video/mp4"
    ],
    
    // Rate limits
    defaultRateLimit: 100, // Instagram typical rate limit
    burstRateLimit: 150,
  },
};

/**
 * Platform capabilities manager for feature detection and validation
 */
export class PlatformCapabilitiesManager {
  
  /**
   * Get capabilities for a specific platform
   */
  static getCapabilities(platform: Platform): PlatformCapabilities {
    return PLATFORM_CAPABILITIES[platform];
  }
  
  /**
   * Check if a platform supports a specific feature
   */
  static supportsFeature(platform: Platform, feature: keyof PlatformCapabilities): boolean {
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
  
  /**
   * Get maximum message length for a platform
   */
  static getMaxMessageLength(platform: Platform): number {
    return this.getCapabilities(platform).maxMessageLength;
  }
  
  /**
   * Get maximum media size for a platform (in MB)
   */
  static getMaxMediaSize(platform: Platform): number {
    return this.getCapabilities(platform).maxMediaSize;
  }
  
  /**
   * Check if a file type is supported by a platform
   */
  static isFileTypeSupported(platform: Platform, mimeType: string): boolean {
    const capabilities = this.getCapabilities(platform);
    return capabilities.supportedFileTypes.includes(mimeType);
  }
  
  /**
   * Get rate limit information for a platform
   */
  static getRateLimit(platform: Platform): { default: number; burst: number } {
    const capabilities = this.getCapabilities(platform);
    return {
      default: capabilities.defaultRateLimit,
      burst: capabilities.burstRateLimit,
    };
  }
  
  /**
   * Get all platforms that support a specific feature
   */
  static getPlatformsWithFeature(feature: keyof PlatformCapabilities): Platform[] {
    const platforms: Platform[] = [];
    
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
        platforms.push(platform as Platform);
      }
    }
    
    return platforms;
  }
  
  /**
   * Compare capabilities across platforms
   */
  static compareCapabilities(): Record<Platform, { supportedFeatures: string[]; totalFeatures: number }> {
    const comparison: Record<Platform, { supportedFeatures: string[]; totalFeatures: number }> = {} as any;
    
    for (const platform of Object.keys(PLATFORM_CAPABILITIES) as Platform[]) {
      const capabilities = this.getCapabilities(platform);
      const supportedFeatures: string[] = [];
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
        totalFeatures,
      };
    }
    
    return comparison;
  }
  
  /**
   * Get feature availability matrix across all platforms
   */
  static getFeatureMatrix(): Record<string, Record<Platform, boolean>> {
    const matrix: Record<string, Record<Platform, boolean>> = {};
    
    // Get all boolean features
    const sampleCapabilities = PLATFORM_CAPABILITIES.whatsapp;
    const booleanFeatures = Object.entries(sampleCapabilities)
      .filter(([_, value]) => typeof value === "boolean")
      .map(([key, _]) => key);
    
    for (const feature of booleanFeatures) {
      matrix[feature] = {} as Record<Platform, boolean>;
      
      for (const platform of Object.keys(PLATFORM_CAPABILITIES) as Platform[]) {
        matrix[feature][platform] = this.supportsFeature(platform, feature as keyof PlatformCapabilities);
      }
    }
    
    return matrix;
  }
}
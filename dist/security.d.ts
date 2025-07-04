import type { Platform } from "./types.js";
/**
 * Security utilities for input validation and sanitization
 */
export declare class SecurityUtils {
    private static readonly MAX_MESSAGE_LENGTH;
    private static readonly MAX_METADATA_SIZE;
    private static readonly MAX_ACCESS_TOKEN_LENGTH;
    private static readonly MAX_USER_ID_LENGTH;
    /**
     * Sanitize text input by removing potentially dangerous characters
     */
    static sanitizeText(input: string): string;
    /**
     * Validate and sanitize message content
     */
    static validateMessageContent(message: string, platform: Platform): string;
    /**
     * Validate access token format and security
     */
    static validateAccessToken(token: string, platform: Platform): string;
    /**
     * Validate user/recipient ID
     */
    static validateUserId(userId: string, platform: Platform): string;
    /**
     * Validate and sanitize metadata object
     */
    static validateMetadata(metadata: Record<string, any>, platform: Platform): Record<string, any>;
    /**
     * Validate URL format and ensure it's secure
     */
    static validateUrl(url: string, platform: Platform): string;
    /**
     * Generate secure headers for API requests
     */
    static getSecureHeaders(): Record<string, string>;
    /**
     * Rate limiting helper - check if action is allowed
     */
    static checkRateLimit(lastRequestTime: number, minIntervalMs: number, platform: Platform): void;
}
/**
 * Encryption utilities for secure token storage
 */
export declare class EncryptionUtils {
    /**
     * Encrypt access token for secure storage
     */
    static encryptToken(token: string, encryptionKey: string, encryptionSalt: string): string;
    /**
     * Decrypt access token for use
     */
    static decryptToken(encryptedToken: string, encryptionKey: string, encryptionSalt: string): string;
}

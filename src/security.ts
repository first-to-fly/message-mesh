import { MessageMeshError } from "./types.js";
import type { Platform } from "./types.js";
import * as crypto from "crypto";

/**
 * Security utilities for input validation and sanitization
 */
export class SecurityUtils {
  // Maximum lengths for various input types
  private static readonly MAX_MESSAGE_LENGTH = 4096;
  private static readonly MAX_METADATA_SIZE = 8192;
  private static readonly MAX_ACCESS_TOKEN_LENGTH = 512;
  private static readonly MAX_USER_ID_LENGTH = 64;

  /**
   * Sanitize text input by removing potentially dangerous characters
   */
  static sanitizeText(input: string): string {
    if (typeof input !== "string") {
      throw new Error("Input must be a string");
    }

    // Remove control characters except newline, tab, and carriage return
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    
    // Normalize unicode characters
    sanitized = sanitized.normalize("NFC");
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  /**
   * Validate and sanitize message content
   */
  static validateMessageContent(message: string, platform: Platform): string {
    const sanitized = this.sanitizeText(message);
    
    if (!sanitized) {
      throw new MessageMeshError(
        "INVALID_MESSAGE",
        platform,
        "Message content cannot be empty after sanitization"
      );
    }

    if (sanitized.length > this.MAX_MESSAGE_LENGTH) {
      throw new MessageMeshError(
        "MESSAGE_TOO_LONG",
        platform,
        `Message content exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`
      );
    }

    return sanitized;
  }

  /**
   * Validate access token format and security
   */
  static validateAccessToken(token: string, platform: Platform): string {
    if (typeof token !== "string" || !token.trim()) {
      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        platform,
        "Access token is required and must be a non-empty string"
      );
    }

    const trimmed = token.trim();
    
    if (trimmed.length > this.MAX_ACCESS_TOKEN_LENGTH) {
      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        platform,
        `Access token exceeds maximum length of ${this.MAX_ACCESS_TOKEN_LENGTH} characters`
      );
    }

    // Basic format validation - tokens should be alphanumeric with some special chars
    if (!/^[A-Za-z0-9_\-|.]+$/.test(trimmed)) {
      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        platform,
        "Access token contains invalid characters"
      );
    }

    return trimmed;
  }

  /**
   * Validate user/recipient ID
   */
  static validateUserId(userId: string, platform: Platform): string {
    if (typeof userId !== "string" || !userId.trim()) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        platform,
        "User ID is required and must be a non-empty string"
      );
    }

    const trimmed = userId.trim();
    
    if (trimmed.length > this.MAX_USER_ID_LENGTH) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        platform,
        `User ID exceeds maximum length of ${this.MAX_USER_ID_LENGTH} characters`
      );
    }

    return trimmed;
  }

  /**
   * Validate and sanitize metadata object
   */
  static validateMetadata(metadata: Record<string, any>, platform: Platform): Record<string, any> {
    if (!metadata || typeof metadata !== "object") {
      return {};
    }

    const serialized = JSON.stringify(metadata);
    if (serialized.length > this.MAX_METADATA_SIZE) {
      throw new MessageMeshError(
        "METADATA_TOO_LARGE",
        platform,
        `Metadata size exceeds maximum of ${this.MAX_METADATA_SIZE} bytes`
      );
    }

    // Sanitize string values in metadata
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeText(value);
      } else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[key] = value;
      } else if (value === null) {
        sanitized[key] = null;
      }
      // Skip other types like objects, arrays, functions for security
    }

    return sanitized;
  }

  /**
   * Validate URL format and ensure it's secure
   */
  static validateUrl(url: string, platform: Platform): string {
    if (typeof url !== "string" || !url.trim()) {
      throw new MessageMeshError("INVALID_URL", platform, "URL is required");
    }

    try {
      const parsedUrl = new URL(url);
      
      // Ensure HTTPS
      if (parsedUrl.protocol !== "https:") {
        throw new MessageMeshError(
          "INSECURE_URL",
          platform,
          "Only HTTPS URLs are allowed for security"
        );
      }

      // Validate hostname
      if (!parsedUrl.hostname || parsedUrl.hostname === "localhost") {
        throw new MessageMeshError(
          "INVALID_URL",
          platform,
          "Invalid or local hostname not allowed"
        );
      }

      return url.trim();
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError(
        "INVALID_URL",
        platform,
        "Invalid URL format"
      );
    }
  }

  /**
   * Generate secure headers for API requests
   */
  static getSecureHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    };
  }

  /**
   * Rate limiting helper - check if action is allowed
   */
  static checkRateLimit(
    lastRequestTime: number,
    minIntervalMs: number,
    platform: Platform
  ): void {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < minIntervalMs) {
      const waitTime = minIntervalMs - timeSinceLastRequest;
      throw new MessageMeshError(
        "RATE_LIMIT_EXCEEDED",
        platform,
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying`
      );
    }
  }
}

/**
 * Encryption utilities for secure token storage
 */
export class EncryptionUtils {
  /**
   * Encrypt access token for secure storage
   */
  static encryptToken(token: string, encryptionKey: string, encryptionSalt: string): string {
    const algorithm = "aes-256-cbc";
    const secretKey = crypto.scryptSync(encryptionKey, encryptionSalt, 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt access token for use
   */
  static decryptToken(encryptedToken: string, encryptionKey: string, encryptionSalt: string): string {
    try {
      const algorithm = "aes-256-cbc";
      const secretKey = crypto.scryptSync(encryptionKey, encryptionSalt, 32);
      const parts = encryptedToken.split(":");
      
      if (parts.length !== 2) {
        throw new Error("Invalid encrypted token format");
      }
      
      const ivHex = parts[0]!;
      const encrypted = parts[1]!;
      const iv = Buffer.from(ivHex, "hex");

      const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch {
      throw new Error("Failed to decrypt access token");
    }
  }
}
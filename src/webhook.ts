import type { Platform } from "./types.js";
import { MessageMeshError } from "./types.js";
import { Logger } from "./logger.js";

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  isValid: boolean;
  challenge?: string; // For verification challenges
  error?: string;
}

/**
 * Webhook event data structure
 */
export interface WebhookEvent {
  platform: Platform;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Webhook processor function type
 */
export type WebhookProcessor = (event: WebhookEvent) => Promise<void> | void;

/**
 * Webhook signature verification options
 */
export interface SignatureVerificationOptions {
  secret: string;
  algorithm: "sha1" | "sha256";
  headerName: string;
  prefix?: string; // e.g., "sha1=" or "sha256="
}

/**
 * Webhook utilities for secure webhook processing and verification
 */
export class WebhookManager {
  private static instance: WebhookManager;
  private processors = new Map<string, WebhookProcessor>();
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebhookManager {
    if (!this.instance) {
      this.instance = new WebhookManager();
    }
    return this.instance;
  }

  /**
   * Verify webhook signature using HMAC
   */
  verifySignature(
    payload: string,
    signature: string,
    options: SignatureVerificationOptions
  ): boolean {
    try {
      // Create HMAC hash
      const crypto = this.getCrypto();
      if (!crypto) {
        this.logger.warn("Crypto module not available for signature verification");
        return false;
      }

      const hmac = crypto.createHmac(options.algorithm, options.secret);
      hmac.update(payload, "utf8");
      const expectedSignature = hmac.digest("hex");
      
      // Add prefix if specified
      const expectedSignatureWithPrefix = options.prefix 
        ? `${options.prefix}${expectedSignature}`
        : expectedSignature;

      // Compare signatures using timing-safe comparison
      return this.timingSafeEquals(signature, expectedSignatureWithPrefix);
    } catch (error) {
      this.logger.error("Webhook signature verification failed", undefined, undefined, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Get crypto module (Node.js/Bun compatible)
   */
  private getCrypto(): any {
    try {
      // Try Node.js crypto first
      return require("crypto");
    } catch {
      try {
        // Try dynamic import for ES modules
        return require("node:crypto");
      } catch {
        return null;
      }
    }
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Verify Facebook/Meta webhook (WhatsApp, Messenger, Instagram)
   */
  verifyFacebookWebhook(
    payload: string,
    signature: string,
    appSecret: string
  ): boolean {
    return this.verifySignature(payload, signature, {
      secret: appSecret,
      algorithm: "sha256",
      headerName: "x-hub-signature-256",
      prefix: "sha256=",
    });
  }

  /**
   * Handle webhook verification challenge (Facebook/Meta platforms)
   */
  handleVerificationChallenge(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ): WebhookVerificationResult {
    if (mode === "subscribe" && token === verifyToken) {
      this.logger.info("Webhook verification challenge successful");
      return {
        isValid: true,
        challenge,
      };
    }

    this.logger.warn("Webhook verification challenge failed", undefined, {
      mode,
      expectedToken: "[REDACTED]",
      receivedToken: "[REDACTED]",
    });

    return {
      isValid: false,
      error: "Invalid verification token",
    };
  }

  /**
   * Parse WhatsApp webhook event
   */
  parseWhatsAppWebhook(payload: any): WebhookEvent[] {
    const events: WebhookEvent[] = [];

    try {
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === "messages" && change.value) {
                const event: WebhookEvent = {
                  platform: "whatsapp",
                  eventType: this.determineWhatsAppEventType(change.value),
                  timestamp: new Date().toISOString(),
                  data: change.value,
                  metadata: {
                    entryId: entry.id,
                    changeField: change.field,
                  },
                };
                events.push(event);
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse WhatsApp webhook", "whatsapp", { payload }, error instanceof Error ? error : undefined);
      throw new MessageMeshError(
        "WEBHOOK_PARSE_ERROR",
        "whatsapp",
        "Failed to parse WhatsApp webhook payload"
      );
    }

    return events;
  }

  /**
   * Parse Messenger webhook event
   */
  parseMessengerWebhook(payload: any): WebhookEvent[] {
    const events: WebhookEvent[] = [];

    try {
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              const event: WebhookEvent = {
                platform: "messenger",
                eventType: this.determineMessengerEventType(messaging),
                timestamp: new Date(messaging.timestamp).toISOString(),
                data: messaging,
                metadata: {
                  entryId: entry.id,
                  entryTime: entry.time,
                },
              };
              events.push(event);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse Messenger webhook", "messenger", { payload }, error instanceof Error ? error : undefined);
      throw new MessageMeshError(
        "WEBHOOK_PARSE_ERROR",
        "messenger",
        "Failed to parse Messenger webhook payload"
      );
    }

    return events;
  }

  /**
   * Parse Instagram webhook event
   */
  parseInstagramWebhook(payload: any): WebhookEvent[] {
    const events: WebhookEvent[] = [];

    try {
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              const event: WebhookEvent = {
                platform: "instagram",
                eventType: this.determineInstagramEventType(messaging),
                timestamp: new Date(messaging.timestamp).toISOString(),
                data: messaging,
                metadata: {
                  entryId: entry.id,
                  entryTime: entry.time,
                },
              };
              events.push(event);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse Instagram webhook", "instagram", { payload }, error instanceof Error ? error : undefined);
      throw new MessageMeshError(
        "WEBHOOK_PARSE_ERROR",
        "instagram",
        "Failed to parse Instagram webhook payload"
      );
    }

    return events;
  }

  /**
   * Determine WhatsApp event type from webhook data
   */
  private determineWhatsAppEventType(data: any): string {
    if (data.messages) {
      return "message_received";
    } else if (data.statuses) {
      return "message_status";
    } else if (data.contacts) {
      return "contact_update";
    }
    return "unknown";
  }

  /**
   * Determine Messenger event type from webhook data
   */
  private determineMessengerEventType(messaging: any): string {
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

  /**
   * Determine Instagram event type from webhook data
   */
  private determineInstagramEventType(messaging: any): string {
    if (messaging.message) {
      return "message_received";
    } else if (messaging.delivery) {
      return "message_delivered";
    } else if (messaging.read) {
      return "message_read";
    }
    return "unknown";
  }

  /**
   * Register a webhook event processor
   */
  registerProcessor(eventType: string, processor: WebhookProcessor): void {
    this.processors.set(eventType, processor);
    this.logger.debug(`Webhook processor registered for event type: ${eventType}`);
  }

  /**
   * Unregister a webhook event processor
   */
  unregisterProcessor(eventType: string): void {
    this.processors.delete(eventType);
    this.logger.debug(`Webhook processor unregistered for event type: ${eventType}`);
  }

  /**
   * Process webhook events
   */
  async processEvents(events: WebhookEvent[]): Promise<void> {
    for (const event of events) {
      try {
        this.logger.info(`Processing webhook event: ${event.eventType}`, event.platform, {
          eventType: event.eventType,
          timestamp: event.timestamp,
        });

        const processor = this.processors.get(event.eventType);
        if (processor) {
          await processor(event);
          this.logger.debug(`Webhook event processed successfully: ${event.eventType}`, event.platform);
        } else {
          this.logger.warn(`No processor found for event type: ${event.eventType}`, event.platform);
        }
      } catch (error) {
        this.logger.error(
          `Failed to process webhook event: ${event.eventType}`,
          event.platform,
          { eventType: event.eventType },
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  /**
   * Validate webhook payload structure
   */
  validateWebhookPayload(payload: any, platform: Platform): boolean {
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

  /**
   * Validate WhatsApp webhook payload structure
   */
  private validateWhatsAppPayload(payload: any): boolean {
    return (
      payload &&
      typeof payload === "object" &&
      Array.isArray(payload.entry) &&
      payload.entry.length > 0
    );
  }

  /**
   * Validate Messenger webhook payload structure
   */
  private validateMessengerPayload(payload: any): boolean {
    return (
      payload &&
      typeof payload === "object" &&
      Array.isArray(payload.entry) &&
      payload.entry.length > 0
    );
  }

  /**
   * Validate Instagram webhook payload structure
   */
  private validateInstagramPayload(payload: any): boolean {
    return (
      payload &&
      typeof payload === "object" &&
      Array.isArray(payload.entry) &&
      payload.entry.length > 0
    );
  }

  /**
   * Generate webhook response for successful processing
   */
  generateSuccessResponse(): { status: number; body: string } {
    return {
      status: 200,
      body: "OK",
    };
  }

  /**
   * Generate webhook response for errors
   */
  generateErrorResponse(error: string): { status: number; body: string } {
    return {
      status: 400,
      body: JSON.stringify({ error }),
    };
  }
}
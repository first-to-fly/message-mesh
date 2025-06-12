import type { Platform } from "./types.js";
/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
    isValid: boolean;
    challenge?: string;
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
    prefix?: string;
}
/**
 * Webhook utilities for secure webhook processing and verification
 */
export declare class WebhookManager {
    private static instance;
    private processors;
    private logger;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): WebhookManager;
    /**
     * Verify webhook signature using HMAC
     */
    verifySignature(payload: string, signature: string, options: SignatureVerificationOptions): boolean;
    /**
     * Get crypto module (Node.js/Bun compatible)
     */
    private getCrypto;
    /**
     * Timing-safe string comparison to prevent timing attacks
     */
    private timingSafeEquals;
    /**
     * Verify Facebook/Meta webhook (WhatsApp, Messenger, Instagram)
     */
    verifyFacebookWebhook(payload: string, signature: string, appSecret: string): boolean;
    /**
     * Handle webhook verification challenge (Facebook/Meta platforms)
     */
    handleVerificationChallenge(mode: string, token: string, challenge: string, verifyToken: string): WebhookVerificationResult;
    /**
     * Parse WhatsApp webhook event
     */
    parseWhatsAppWebhook(payload: any): WebhookEvent[];
    /**
     * Parse Messenger webhook event
     */
    parseMessengerWebhook(payload: any): WebhookEvent[];
    /**
     * Parse Instagram webhook event
     */
    parseInstagramWebhook(payload: any): WebhookEvent[];
    /**
     * Determine WhatsApp event type from webhook data
     */
    private determineWhatsAppEventType;
    /**
     * Determine Messenger event type from webhook data
     */
    private determineMessengerEventType;
    /**
     * Determine Instagram event type from webhook data
     */
    private determineInstagramEventType;
    /**
     * Register a webhook event processor
     */
    registerProcessor(eventType: string, processor: WebhookProcessor): void;
    /**
     * Unregister a webhook event processor
     */
    unregisterProcessor(eventType: string): void;
    /**
     * Process webhook events
     */
    processEvents(events: WebhookEvent[]): Promise<void>;
    /**
     * Validate webhook payload structure
     */
    validateWebhookPayload(payload: any, platform: Platform): boolean;
    /**
     * Validate WhatsApp webhook payload structure
     */
    private validateWhatsAppPayload;
    /**
     * Validate Messenger webhook payload structure
     */
    private validateMessengerPayload;
    /**
     * Validate Instagram webhook payload structure
     */
    private validateInstagramPayload;
    /**
     * Generate webhook response for successful processing
     */
    generateSuccessResponse(): {
        status: number;
        body: string;
    };
    /**
     * Generate webhook response for errors
     */
    generateErrorResponse(error: string): {
        status: number;
        body: string;
    };
}

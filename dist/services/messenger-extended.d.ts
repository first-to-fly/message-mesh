import type { IMessengerService } from "../interfaces.js";
import { HttpClient } from "../http-client.js";
import { MessengerService } from "./messenger.js";
export interface AccessToken {
    access_token: string;
    token_type: string;
    expires_in?: number;
}
export interface PageProfile {
    id: string;
    name: string;
    about?: string;
    category?: string;
    description?: string;
    emails?: string[];
    phone?: string;
    website?: string;
    picture?: {
        data: {
            url: string;
        };
    };
}
export interface MessengerConfig {
    page_id: string;
    page_access_token: string;
    webhook_verify_token: string;
    greeting_text?: string;
    persistent_menu?: Record<string, unknown>;
    auto_responses?: Record<string, unknown>[];
}
export interface MessengerPageInfo {
    id: string;
    name: string;
    access_token: string;
    category?: string;
    about?: string;
    description?: string;
    emails?: string[];
    phone?: string;
    website?: string;
    picture?: {
        data: {
            url: string;
        };
    };
}
interface ExtendedMessengerConfig {
    appId: string;
    appSecret: string;
    apiVersion?: string;
    messengerApiVersion?: string;
}
export declare class MessengerExtendedService extends MessengerService implements IMessengerService {
    private static readonly FACEBOOK_GRAPH_BASE_URL;
    private readonly appId;
    private readonly appSecret;
    private readonly apiVersion;
    constructor(httpClient: HttpClient, config: ExtendedMessengerConfig);
    /**
     * Get user's Facebook pages
     */
    getUserPages(userAccessToken: string): Promise<MessengerPageInfo[]>;
    /**
     * Exchange short-lived user access token for long-lived token
     */
    exchangeForLongLivedUserToken(shortLivedToken: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
    }>;
    /**
     * Get never-expiring page access token using long-lived user token
     */
    getNeverExpiringPageAccessToken(pageId: string, userAccessToken: string): Promise<{
        access_token: string;
        expires_at: number;
    }>;
    /**
     * Get page access token (legacy method - now uses never-expiring logic)
     */
    getPageAccessToken(pageId: string, userAccessToken: string): Promise<string>;
    /**
     * Subscribe to Messenger webhooks
     */
    subscribeToWebhooks(pageId: string, pageAccessToken: string, _companyId: string, _verifyToken: string): Promise<void>;
    /**
     * Validate Messenger page access token
     */
    validatePageToken(pageAccessToken: string, pageId: string): Promise<boolean>;
    /**
     * Get page profile information
     */
    getPageProfile(pageId: string, pageAccessToken: string): Promise<PageProfile>;
    /**
     * Check webhook subscription status
     */
    checkWebhookSubscription(pageId: string, pageAccessToken: string): Promise<boolean>;
    /**
     * Send test message to verify connection
     */
    sendTestMessage(pageAccessToken: string, recipientId: string, message: string): Promise<boolean>;
}
export {};

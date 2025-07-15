import type { IMessengerService } from "../interfaces.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";
import { MessengerService } from "./messenger.js";
import { Logger as LoggerClass } from "../logger.js";

// Helper to convert unknown to Record<string, any>
const toLogMetadata = (data?: unknown): Record<string, any> | undefined => {
  if (!data) return undefined;
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, any>;
  }
  return { data };
};

// Create a static logger wrapper to match the crm-be Logger API
const Logger = {
  info: (message: string, metadata?: unknown) => {
    LoggerClass.getInstance().info(message, "messenger", toLogMetadata(metadata));
  },
  error: (message: string, metadata?: unknown, error?: Error) => {
    LoggerClass.getInstance().error(message, "messenger", toLogMetadata(metadata), error);
  },
  warn: (message: string, metadata?: unknown, error?: Error) => {
    LoggerClass.getInstance().warn(message, "messenger", toLogMetadata(metadata), error);
  },
  debug: (message: string, metadata?: unknown) => {
    LoggerClass.getInstance().debug(message, "messenger", toLogMetadata(metadata));
  }
};

interface MessengerApiResponse {
  id?: string;
  data?: unknown[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

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

export class MessengerExtendedService extends MessengerService implements IMessengerService {
  private static readonly FACEBOOK_GRAPH_BASE_URL = "https://graph.facebook.com";
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly apiVersion: string;

  constructor(httpClient: HttpClient, config: ExtendedMessengerConfig) {
    super(httpClient);
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.apiVersion = config.apiVersion || "v19.0";
  }

  /**
   * Get user's Facebook pages
   */
  async getUserPages(userAccessToken: string): Promise<MessengerPageInfo[]> {
    try {
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/me/accounts`;
      const params = new URLSearchParams({
        fields:
          "id,name,access_token,category,about,description,emails,phone,website,picture",
        access_token: userAccessToken,
      });

      Logger.info("Fetching user's Facebook pages");

      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as MessengerApiResponse;
        Logger.error("Failed to fetch user's Facebook pages", errorData);
        throw new MessageMeshError(
          "FACEBOOK_API_ERROR",
          "messenger",
          errorData.error?.message || "Failed to fetch pages"
        );
      }

      const data = await response.json() as { data?: MessengerPageInfo[] };
      Logger.info(`Successfully fetched ${data.data?.length || 0} pages`);

      return data.data || [];
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      Logger.error("Error fetching user's Facebook pages", error);
      throw new MessageMeshError(
        "FACEBOOK_API_ERROR",
        "messenger",
        error instanceof Error ? error.message : "Failed to fetch pages"
      );
    }
  }

  /**
   * Exchange short-lived user access token for long-lived token
   */
  async exchangeForLongLivedUserToken(shortLivedToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    try {
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/oauth/access_token`;
      const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      });

      Logger.info("Exchanging short-lived user token for long-lived token");

      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as MessengerApiResponse;
        Logger.error("Failed to exchange for long-lived user token", errorData);
        throw new MessageMeshError(
          "TOKEN_EXCHANGE_FAILED",
          "messenger",
          errorData.error?.message || "Failed to exchange token"
        );
      }

      const data = await response.json() as { access_token: string; token_type: string; expires_in: number };
      Logger.info("Successfully exchanged for long-lived user token");

      return data;
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      Logger.error("Error exchanging for long-lived user token", error);
      throw new MessageMeshError(
        "TOKEN_EXCHANGE_FAILED",
        "messenger",
        error instanceof Error ? error.message : "Failed to exchange token"
      );
    }
  }

  /**
   * Get never-expiring page access token using long-lived user token
   */
  async getNeverExpiringPageAccessToken(
    pageId: string,
    userAccessToken: string
  ): Promise<{
    access_token: string;
    expires_at: number; // 0 means never expires
  }> {
    try {
      // Step 1: Exchange for long-lived user token
      Logger.info(
        `Getting never-expiring page access token for page ${pageId}`
      );
      const longLivedUserToken = await this.exchangeForLongLivedUserToken(
        userAccessToken
      );

      // Step 2: Get page access tokens using long-lived user token
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/me/accounts`;
      const params = new URLSearchParams({
        access_token: longLivedUserToken.access_token,
      });

      Logger.info("Fetching page access tokens with long-lived user token");

      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as MessengerApiResponse;
        Logger.error("Failed to get page access tokens", errorData);
        throw new MessageMeshError(
          "PAGE_TOKEN_FETCH_FAILED",
          "messenger",
          errorData.error?.message || "Failed to get page access tokens"
        );
      }

      const data = await response.json() as { data?: Array<{ id: string; access_token: string }> };
      const pages = data.data || [];

      // Step 3: Find the specific page
      const targetPage = pages.find(
        (page: { id: string }) => page.id === pageId
      );
      if (!targetPage) {
        throw new MessageMeshError(
          "PAGE_NOT_FOUND",
          "messenger",
          `Page ${pageId} not found in user's pages`
        );
      }

      const pageAccessToken = targetPage.access_token;

      // Step 4: Verify token expiration status
      Logger.info("Verifying page access token expiration status");
      const debugUrl = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/debug_token`;
      const debugParams = new URLSearchParams({
        input_token: pageAccessToken,
        access_token: `${this.appId}|${this.appSecret}`,
      });

      const debugResponse = await fetch(
        `${debugUrl}?${debugParams.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (debugResponse.ok) {
        const debugData = await debugResponse.json() as { data?: { expires_at?: number } };
        const tokenInfo = debugData.data || {};
        const expiresAt = tokenInfo.expires_at || 0;

        Logger.info(
          `Page access token expiration status: expires_at=${expiresAt} (0 = never expires)`
        );

        return {
          access_token: pageAccessToken,
          expires_at: expiresAt,
        };
      } else {
        Logger.warn(
          "Could not verify token expiration, but returning token anyway"
        );
        return {
          access_token: pageAccessToken,
          expires_at: 0, // Assume never expires
        };
      }
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      Logger.error(
        `Error getting never-expiring page access token for ${pageId}`,
        error
      );
      throw new MessageMeshError(
        "PAGE_TOKEN_FETCH_FAILED",
        "messenger",
        error instanceof Error ? error.message : "Failed to get page access token"
      );
    }
  }

  /**
   * Get page access token (legacy method - now uses never-expiring logic)
   */
  async getPageAccessToken(
    pageId: string,
    userAccessToken: string
  ): Promise<string> {
    try {
      const tokenData = await this.getNeverExpiringPageAccessToken(
        pageId,
        userAccessToken
      );

      if (tokenData.expires_at === 0) {
        Logger.info(
          `Successfully obtained never-expiring page access token for ${pageId}`
        );
      } else {
        Logger.warn(
          `Page access token for ${pageId} expires at ${new Date(
            tokenData.expires_at * 1000
          ).toISOString()}`
        );
      }

      return tokenData.access_token;
    } catch (error) {
      Logger.error(
        `Error getting page access token for ${pageId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Subscribe to Messenger webhooks
   */
  async subscribeToWebhooks(
    pageId: string,
    pageAccessToken: string,
    _companyId: string,
    _verifyToken: string
  ): Promise<void> {
    try {
      // For Messenger, we need to subscribe the app to the page, not set webhook URL
      // The webhook URL is configured at the app level in Facebook Developer Console
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/${pageId}/subscribed_apps`;

      Logger.info(
        `Subscribing app to Messenger page ${pageId} for webhook events`
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscribed_fields: [
            "messages",
            "messaging_postbacks",
            "messaging_optins",
            "message_deliveries",
            "message_reads",
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as MessengerApiResponse;
        Logger.error(
          `Failed to subscribe app to page ${pageId}`,
          errorData
        );
        throw new MessageMeshError(
          "WEBHOOK_SUBSCRIPTION_FAILED",
          "messenger",
          errorData.error?.message || "Failed to subscribe app to page"
        );
      }

      const responseData = await response.json() as Record<string, unknown>;
      Logger.info(
        `Successfully subscribed app to page ${pageId}. Response: ${JSON.stringify(
          responseData
        )}`
      );
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      Logger.error(
        `Error subscribing app to page ${pageId}`,
        error
      );
      throw new MessageMeshError(
        "WEBHOOK_SUBSCRIPTION_FAILED",
        "messenger",
        error instanceof Error ? error.message : "Failed to subscribe to webhooks"
      );
    }
  }

  /**
   * Validate Messenger page access token
   */
  async validatePageToken(
    pageAccessToken: string,
    pageId: string
  ): Promise<boolean> {
    try {
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/debug_token`;
      const params = new URLSearchParams({
        input_token: pageAccessToken,
        access_token: `${this.appId}|${this.appSecret}`,
      });

      Logger.info(`Validating page access token for page ${pageId}`);

      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        Logger.error(
          `Token validation failed: ${response.status}`,
          errorData
        );
        return false;
      }

      const data = await response.json() as { data?: { is_valid: boolean; app_id: string; type: string; scopes?: string[] } };
      const tokenData = data.data || { is_valid: false };

      Logger.info(
        `Token validation response: is_valid=${tokenData.is_valid}, app_id=${'app_id' in tokenData ? tokenData.app_id : 'N/A'}, type=${'type' in tokenData ? tokenData.type : 'N/A'}`
      );

      // Check if token is valid
      if (!tokenData.is_valid) {
        Logger.warn("Page access token is not valid");
        return false;
      }

      // Check if token has required permissions
      const requiredPermissions = ["pages_messaging", "pages_manage_metadata"];
      const scopes = 'scopes' in tokenData ? tokenData.scopes : undefined;
      const hasRequiredPermissions = scopes ? requiredPermissions.every((perm) =>
        scopes.includes(perm)
      ) : false;

      if (!hasRequiredPermissions) {
        Logger.warn(
          `Token missing required permissions. Has: ${scopes?.join(
            ", "
          ) || 'none'}, Needs: ${requiredPermissions.join(", ")}`
        );
      }

      return hasRequiredPermissions;
    } catch (error) {
      Logger.error(
        `Error validating page access token for ${pageId}`,
        error
      );
      return false;
    }
  }

  /**
   * Get page profile information
   */
  async getPageProfile(
    pageId: string,
    pageAccessToken: string
  ): Promise<PageProfile> {
    try {
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/${pageId}`;
      const params = new URLSearchParams({
        fields:
          "id,name,about,category,description,emails,phone,website,picture",
        access_token: pageAccessToken,
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as MessengerApiResponse;
        Logger.error(
          `Failed to get page profile for ${pageId}`,
          errorData
        );
        throw new MessageMeshError(
          "PROFILE_FETCH_FAILED",
          "messenger",
          errorData.error?.message || "Failed to get page profile"
        );
      }

      const data = await response.json() as PageProfile;
      return data;
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      Logger.error(
        `Error getting page profile for ${pageId}`,
        error
      );
      throw new MessageMeshError(
        "PROFILE_FETCH_FAILED",
        "messenger",
        error instanceof Error ? error.message : "Failed to get page profile"
      );
    }
  }

  /**
   * Check webhook subscription status
   */
  async checkWebhookSubscription(
    pageId: string,
    pageAccessToken: string
  ): Promise<boolean> {
    try {
      const url = `${MessengerExtendedService.FACEBOOK_GRAPH_BASE_URL}/${this.apiVersion}/${pageId}/subscribed_apps`;

      Logger.info(`Checking app subscription for Messenger page ${pageId}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        Logger.warn(
          `App subscription check failed: ${response.status}`,
          errorData
        );
        return false;
      }

      const data = await response.json() as { data?: Array<{ id: string }> };
      Logger.info(`App subscription response: ${JSON.stringify(data)}`);

      // Check if our app is in the subscribed apps list
      const apps = data.data || [];
      const isOurAppSubscribed = apps.some(
        (app: { id: string }) => app.id === this.appId
      );

      Logger.info(
        `Our app (${this.appId}) subscription status for page ${pageId}: ${
          isOurAppSubscribed ? "subscribed" : "not subscribed"
        }`
      );

      if (isOurAppSubscribed) {
        // Check which fields we're subscribed to
        const ourApp = apps.find((app: { id: string }) => app.id === this.appId);
        if (ourApp) {
          Logger.info(
            `Subscribed fields for our app: ${JSON.stringify(ourApp)}`
          );
        }
      }

      return isOurAppSubscribed;
    } catch (error) {
      Logger.error(
        `Error checking app subscription for page ${pageId}`,
        error
      );
      return false;
    }
  }

  /**
   * Send test message to verify connection
   */
  async sendTestMessage(
    pageAccessToken: string,
    recipientId: string,
    message: string
  ): Promise<boolean> {
    try {
      await this.sendMessage({
        accessToken: pageAccessToken,
        to: recipientId,
        message: message,
      });
      return true;
    } catch (error) {
      Logger.error(
        "Error sending test message",
        error
      );
      return false;
    }
  }
}
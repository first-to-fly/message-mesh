import type { IMessengerService } from "../interfaces.js";
import type { SendMessageResponse, MessengerMessageOptions } from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";
import { SecurityUtils } from "../security.js";

export class MessengerService implements IMessengerService {
  private static readonly BASE_URL = "https://graph.facebook.com/v18.0";

  constructor(private httpClient: HttpClient) {}

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `${MessengerService.BASE_URL}/me`,
        {
          Authorization: `Bearer ${accessToken}`,
        },
        "messenger"
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async sendMessage(options: MessengerMessageOptions): Promise<SendMessageResponse> {
    try {
      this.validateMessageOptions(options);

      const pageId = await this.extractPageId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to,
        },
        messaging_type: "MESSAGE_TAG",
        message: {
          text: options.message,
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      };

      const response = await this.httpClient.post(
        `${MessengerService.BASE_URL}/${pageId}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "messenger"
      );

      if (response.status === 200) {
        const data = await response.json() as { message_id?: string };
        return {
          success: true,
          messageId: data.message_id,
        };
      }

      throw new MessageMeshError(
        "SEND_FAILED",
        "messenger",
        `Failed to send message: ${response.status}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async extractPageId(accessToken: string): Promise<string> {
    try {
      const response = await this.httpClient.get(
        `${MessengerService.BASE_URL}/me`,
        {
          Authorization: `Bearer ${accessToken}`,
        },
        "messenger"
      );

      if (response.status === 200) {
        const data = await response.json() as { id?: string };
        if (!data.id) {
          throw new MessageMeshError(
            "INVALID_ACCESS_TOKEN",
            "messenger", 
            "Unable to extract page ID from access token"
          );
        }
        return data.id;
      }

      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        "messenger",
        "Failed to validate access token"
      );
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        "messenger",
        "Failed to extract page ID from access token"
      );
    }
  }

  private validateMessageOptions(options: MessengerMessageOptions): void {
    // Use security utilities for enhanced validation
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    SecurityUtils.validateUserId(options.to, "messenger");
    
    const sanitizedMessage = SecurityUtils.validateMessageContent(options.message, "messenger");
    
    // Messenger-specific validations
    if (sanitizedMessage.length > 2000) {
      throw new MessageMeshError(
        "MESSAGE_TOO_LONG", 
        "messenger", 
        "Message content cannot exceed 2000 characters for Messenger"
      );
    }
    
    // Validate recipient ID format (should be numeric for Facebook user ID)
    if (!/^\d+$/.test(options.to.trim())) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT", 
        "messenger", 
        "Recipient ID must be a valid Facebook user ID (numeric)"
      );
    }
    
    // Validate and sanitize metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "messenger");
    }
    
    // Update the message content with sanitized version
    options.message = sanitizedMessage;
  }

  private handleError(error: unknown): SendMessageResponse {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: error.platform,
        },
      };
    }

    // Handle HTTP-specific errors
    if (error && typeof error === "object" && "status" in error) {
      const httpError = error as { status: number; data?: any };
      
      // Map common Messenger API error responses
      switch (httpError.status) {
        case 400:
          return {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Invalid request parameters or malformed data",
              platform: "messenger",
            },
          };
        case 401:
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid or expired access token",
              platform: "messenger",
            },
          };
        case 403:
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Insufficient permissions or messaging policy violation",
              platform: "messenger",
            },
          };
        case 404:
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "Recipient not found or not reachable",
              platform: "messenger",
            },
          };
        case 429:
          return {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests, please try again later",
              platform: "messenger",
            },
          };
        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Messenger platform temporarily unavailable",
              platform: "messenger",
            },
          };
      }
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger",
      },
    };
  }
}
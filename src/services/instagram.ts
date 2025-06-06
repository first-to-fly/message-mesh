import type { IInstagramService } from "../interfaces.js";
import type { 
  SendMessageResponse, 
  InstagramMessageOptions,
  InstagramMediaOptions,
  InstagramReplyOptions
} from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";
import { SecurityUtils } from "../security.js";

export class InstagramService implements IInstagramService {
  private static readonly BASE_URL = "https://graph.instagram.com/v18.0";

  constructor(private httpClient: HttpClient) {}

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `${InstagramService.BASE_URL}/me`,
        {
          Authorization: `Bearer ${accessToken}`,
        },
        "instagram"
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async sendMessage(options: InstagramMessageOptions): Promise<SendMessageResponse> {
    try {
      this.validateMessageOptions(options);

      const instagramAccountId = await this.extractInstagramAccountId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to,
        },
        message: {
          text: options.message,
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      };

      const response = await this.httpClient.post(
        `${InstagramService.BASE_URL}/${instagramAccountId}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "instagram"
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
        "instagram",
        `Failed to send message: ${response.status}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendMedia(options: InstagramMediaOptions): Promise<SendMessageResponse> {
    try {
      this.validateMediaOptions(options);

      const instagramAccountId = await this.extractInstagramAccountId(options.accessToken);
      
      // Build attachment object based on media type
      const attachment: {
        type: string;
        payload: {
          url?: string;
          is_reusable?: boolean;
          attachment_id?: string;
        };
      } = {
        type: options.type,
        payload: {}
      };

      // Use media URL or media ID
      if (options.mediaUrl) {
        attachment.payload.url = options.mediaUrl;
        attachment.payload.is_reusable = true;
      } else if (options.mediaId) {
        attachment.payload.attachment_id = options.mediaId;
      }

      const message: {
        attachment: typeof attachment;
        text?: string;
      } = {
        attachment
      };

      // Add caption for images and videos
      if (options.caption && (options.type === "image" || options.type === "video")) {
        message.text = options.caption;
      }

      const payload = {
        recipient: {
          id: options.to,
        },
        message,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      };

      const response = await this.httpClient.post(
        `${InstagramService.BASE_URL}/${instagramAccountId}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "instagram"
      );

      if (response.status === 200) {
        const data = await response.json() as { message_id?: string, attachment_id?: string };
        return {
          success: true,
          messageId: data.message_id,
          attachmentId: data.attachment_id,
        };
      }

      throw new MessageMeshError(
        "SEND_FAILED",
        "instagram",
        `Failed to send media: ${response.status}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async replyMessage(options: InstagramReplyOptions): Promise<SendMessageResponse> {
    try {
      this.validateReplyOptions(options);

      const instagramAccountId = await this.extractInstagramAccountId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to,
        },
        message: {
          text: options.message,
          reply_to: {
            mid: options.replyToMessageId
          }
        },
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      };

      const response = await this.httpClient.post(
        `${InstagramService.BASE_URL}/${instagramAccountId}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "instagram"
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
        "instagram",
        `Failed to send reply: ${response.status}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async extractInstagramAccountId(accessToken: string): Promise<string> {
    try {
      const response = await this.httpClient.get(
        `${InstagramService.BASE_URL}/me`,
        {
          Authorization: `Bearer ${accessToken}`,
        },
        "instagram"
      );

      if (response.status === 200) {
        const data = await response.json() as { id?: string };
        if (!data.id) {
          throw new MessageMeshError(
            "INVALID_ACCESS_TOKEN",
            "instagram", 
            "Unable to extract Instagram account ID from access token"
          );
        }
        return data.id;
      }

      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        "instagram",
        "Failed to validate access token"
      );
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError(
        "INVALID_ACCESS_TOKEN",
        "instagram",
        "Failed to extract Instagram account ID from access token"
      );
    }
  }

  private validateMessageOptions(options: InstagramMessageOptions): void {
    // Use security utilities for enhanced validation
    SecurityUtils.validateAccessToken(options.accessToken, "instagram");
    SecurityUtils.validateUserId(options.to, "instagram");
    
    const sanitizedMessage = SecurityUtils.validateMessageContent(options.message, "instagram");
    
    // Instagram-specific validations
    if (sanitizedMessage.length > 1000) {
      throw new MessageMeshError(
        "MESSAGE_TOO_LONG", 
        "instagram", 
        "Message content cannot exceed 1000 characters for Instagram"
      );
    }
    
    // Validate IGSID format (should be numeric for Instagram Scoped User ID)
    if (!/^\d+$/.test(options.to.trim())) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT", 
        "instagram", 
        "Recipient ID must be a valid Instagram Scoped User ID (IGSID)"
      );
    }
    
    // Validate and sanitize metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "instagram");
    }
    
    // Update the message content with sanitized version
    options.message = sanitizedMessage;
  }

  private validateMediaOptions(options: InstagramMediaOptions): void {
    // Use security utilities for basic validation
    SecurityUtils.validateAccessToken(options.accessToken, "instagram");
    SecurityUtils.validateUserId(options.to, "instagram");
    
    // Validate media source
    if (!options.mediaUrl && !options.mediaId) {
      throw new MessageMeshError(
        "MISSING_MEDIA_SOURCE",
        "instagram",
        "Either mediaUrl or mediaId must be provided"
      );
    }
    
    // Validate media URL if provided
    if (options.mediaUrl) {
      try {
        new URL(options.mediaUrl);
        if (!options.mediaUrl.startsWith("https://")) {
          throw new MessageMeshError(
            "INVALID_MEDIA_URL",
            "instagram",
            "Media URL must use HTTPS protocol"
          );
        }
      } catch {
        throw new MessageMeshError(
          "INVALID_MEDIA_URL",
          "instagram",
          "Invalid media URL format"
        );
      }
    }
    
    // Validate media type
    const validTypes = ["image", "video", "audio"];
    if (!validTypes.includes(options.type)) {
      throw new MessageMeshError(
        "INVALID_MEDIA_TYPE",
        "instagram",
        `Invalid media type: ${options.type}. Must be one of: ${validTypes.join(", ")}`
      );
    }
    
    // Instagram specific: Audio is limited
    if (options.type === "audio") {
      // Note: Instagram has limited support for audio messages
      console.warn("Instagram has limited support for audio messages. Consider using video instead.");
    }
    
    // Validate caption length if provided
    if (options.caption && options.caption.length > 2200) {
      throw new MessageMeshError(
        "CAPTION_TOO_LONG",
        "instagram",
        "Caption cannot exceed 2200 characters"
      );
    }
    
    // Validate metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "instagram");
    }
  }

  private validateReplyOptions(options: InstagramReplyOptions): void {
    // Reuse message validation
    this.validateMessageOptions({
      accessToken: options.accessToken,
      to: options.to,
      message: options.message,
      metadata: options.metadata
    });
    
    // Validate reply message ID
    if (!options.replyToMessageId || options.replyToMessageId.trim().length === 0) {
      throw new MessageMeshError(
        "MISSING_REPLY_MESSAGE_ID",
        "instagram",
        "Reply message ID is required"
      );
    }
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
      const httpError = error as { status: number; data?: unknown };
      
      // Map common Instagram API error responses
      switch (httpError.status) {
        case 400:
          return {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Invalid request parameters or malformed Instagram Scoped User ID",
              platform: "instagram",
            },
          };
        case 401:
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid or expired Instagram access token",
              platform: "instagram",
            },
          };
        case 403:
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Insufficient permissions or Instagram messaging policy violation",
              platform: "instagram",
            },
          };
        case 404:
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "Instagram user not found or not reachable via messaging",
              platform: "instagram",
            },
          };
        case 429:
          return {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Instagram messaging rate limit exceeded, please try again later",
              platform: "instagram",
            },
          };
        case 500:
        case 502:
        case 503:
          return {
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Instagram platform temporarily unavailable",
              platform: "instagram",
            },
          };
      }
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "instagram",
      },
    };
  }
}
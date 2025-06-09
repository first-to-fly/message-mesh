import type { IInstagramService } from "../interfaces.js";
import type {
  SendMessageResponse,
  InstagramMessageOptions,
  InstagramMediaOptions,
  InstagramReplyOptions,
  InstagramTemplateCreateOptions,
  InstagramTemplateUpdateOptions,
  InstagramTemplateDeleteOptions,
  InstagramTemplateListOptions,
  InstagramTemplateStatusOptions,
  InstagramTemplateResponse,
  InstagramTemplateListResponse,
  InstagramTemplate,
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
        const data = (await response.json()) as { message_id?: string };
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
        payload: {},
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
        attachment,
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
        const data = (await response.json()) as { message_id?: string; attachment_id?: string };
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
            mid: options.replyToMessageId,
          },
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
        const data = (await response.json()) as { message_id?: string };
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

  // Template Management Methods

  async createTemplate(options: InstagramTemplateCreateOptions): Promise<InstagramTemplateResponse> {
    try {
      this.validateInstagramTemplateCreateOptions(options);

      const payload = {
        name: options.name,
        category: options.category,
        language: options.language || "en_US",
        components: options.components,
      };

      const accountId = await this.extractInstagramAccountId(options.accessToken);
      const response = await this.httpClient.post(
        `${InstagramService.BASE_URL}/${accountId}/message_templates`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "instagram"
      );

      const result = await response.json();

      if (result.id) {
        return {
          success: true,
          templateId: result.id,
        };
      }

      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }

  async updateTemplate(options: InstagramTemplateUpdateOptions): Promise<InstagramTemplateResponse> {
    try {
      this.validateInstagramTemplateUpdateOptions(options);

      const payload: any = {};
      if (options.components) payload.components = options.components;
      if (options.category) payload.category = options.category;

      const response = await this.httpClient.post(
        `${InstagramService.BASE_URL}/${options.templateId}`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "instagram"
      );

      const result = await response.json();

      if (result.success !== false) {
        return {
          success: true,
          templateId: options.templateId,
        };
      }

      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }

  async deleteTemplate(options: InstagramTemplateDeleteOptions): Promise<InstagramTemplateResponse> {
    try {
      this.validateInstagramTemplateDeleteOptions(options);

      const response = await this.httpClient.delete(
        `${InstagramService.BASE_URL}/${options.templateId}?name=${encodeURIComponent(options.name)}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "instagram"
      );

      const result = await response.json();

      if (result.success !== false) {
        return {
          success: true,
          templateId: options.templateId,
        };
      }

      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }

  async getTemplate(options: InstagramTemplateStatusOptions): Promise<InstagramTemplateResponse> {
    try {
      this.validateInstagramTemplateStatusOptions(options);

      const params = new URLSearchParams();
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }

      const response = await this.httpClient.get(
        `${InstagramService.BASE_URL}/${options.templateId}?${params.toString()}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "instagram"
      );

      const result = await response.json();

      if (result.id) {
        return {
          success: true,
          template: this.formatInstagramTemplate(result),
        };
      }

      return this.handleInstagramTemplateError(result);
    } catch (error) {
      return this.handleInstagramTemplateError(error);
    }
  }

  async listTemplates(options: InstagramTemplateListOptions): Promise<InstagramTemplateListResponse> {
    try {
      this.validateInstagramTemplateListOptions(options);

      const params = new URLSearchParams();
      
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append("fields", "id,name,status,category,language,components,quality_score,rejected_reason");
      }
      
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset);
      if (options.status) params.append("status", options.status);
      if (options.category) params.append("category", options.category);

      const accountId = await this.extractInstagramAccountId(options.accessToken);
      const response = await this.httpClient.get(
        `${InstagramService.BASE_URL}/${accountId}/message_templates?${params.toString()}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "instagram"
      );

      const result = await response.json();

      if (result.data) {
        return {
          success: true,
          templates: result.data.map((template: any) => this.formatInstagramTemplate(template)),
          paging: result.paging,
        };
      }

      return this.handleInstagramTemplateListError(result);
    } catch (error) {
      return this.handleInstagramTemplateListError(error);
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
        const data = (await response.json()) as { id?: string };
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
        throw new MessageMeshError("INVALID_MEDIA_URL", "instagram", "Invalid media URL format");
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
      console.warn(
        "Instagram has limited support for audio messages. Consider using video instead."
      );
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
      metadata: options.metadata,
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

  private validateInstagramTemplateCreateOptions(options: InstagramTemplateCreateOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "instagram", "Template name is required");
    }
    if (!options.category) {
      throw new MessageMeshError("INVALID_TEMPLATE_CATEGORY", "instagram", "Template category is required");
    }
    if (!options.components || options.components.length === 0) {
      throw new MessageMeshError("INVALID_TEMPLATE_COMPONENTS", "instagram", "Template components are required");
    }
  }

  private validateInstagramTemplateUpdateOptions(options: InstagramTemplateUpdateOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "instagram", "Template ID is required");
    }
  }

  private validateInstagramTemplateDeleteOptions(options: InstagramTemplateDeleteOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "instagram", "Template ID is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "instagram", "Template name is required");
    }
  }

  private validateInstagramTemplateStatusOptions(options: InstagramTemplateStatusOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "instagram", "Template ID is required");
    }
  }

  private validateInstagramTemplateListOptions(options: InstagramTemplateListOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
  }

  private formatInstagramTemplate(apiTemplate: any): InstagramTemplate {
    return {
      id: apiTemplate.id,
      name: apiTemplate.name,
      status: apiTemplate.status,
      category: apiTemplate.category,
      language: apiTemplate.language,
      components: apiTemplate.components,
      createdTime: apiTemplate.created_time,
      modifiedTime: apiTemplate.modified_time,
      qualityScore: apiTemplate.quality_score ? {
        score: apiTemplate.quality_score.score,
        date: apiTemplate.quality_score.date,
      } : undefined,
      rejectedReason: apiTemplate.rejected_reason,
      disabledDate: apiTemplate.disabled_date,
    };
  }

  private handleInstagramTemplateError(error: unknown): InstagramTemplateResponse {
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

    return {
      success: false,
      error: {
        code: "INSTAGRAM_TEMPLATE_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "instagram",
      },
    };
  }

  private handleInstagramTemplateListError(error: unknown): InstagramTemplateListResponse {
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

    return {
      success: false,
      error: {
        code: "INSTAGRAM_TEMPLATE_LIST_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "instagram",
      },
    };
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

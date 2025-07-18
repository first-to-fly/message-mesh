import type { IMessengerService } from "../interfaces.js";
import type {
  SendMessageResponse,
  MessengerMessageOptions,
  MessengerMediaOptions,
  MessengerTemplateOptions,
  MessengerReplyOptions,
  MessengerUserProfileOptions,
  MessengerUserProfileResponse,
  MessengerUserProfile,
  MessengerTemplateCreateOptions,
  MessengerTemplateUpdateOptions,
  MessengerTemplateDeleteOptions,
  MessengerTemplateListOptions,
  MessengerTemplateStatusOptions,
  MessengerTemplateResponse,
  MessengerTemplateListResponse,
  MessengerTemplate,
  MessengerTemplateComponent,
} from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";
import { SecurityUtils } from "../security.js";

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

export class MessengerService implements IMessengerService {
  private static readonly BASE_URL = "https://graph.facebook.com/v23.0";

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
        messaging_type: "RESPONSE",
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
        const data = (await response.json()) as { message_id?: string };
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

  async sendMedia(options: MessengerMediaOptions): Promise<SendMessageResponse> {
    try {
      this.validateMediaOptions(options);

      const pageId = await this.extractPageId(options.accessToken);

      // Build attachment object based on media type
      const attachment: {
        type: string;
        payload: {
          url?: string;
          is_reusable?: boolean;
          attachment_id?: string;
        };
      } = {
        type: options.type === "file" ? "file" : options.type,
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
        messaging_type: "RESPONSE",
        message,
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
        const data = (await response.json()) as { message_id?: string; attachment_id?: string };
        return {
          success: true,
          messageId: data.message_id,
          attachmentId: data.attachment_id,
        };
      }

      throw new MessageMeshError(
        "SEND_FAILED",
        "messenger",
        `Failed to send media: ${response.status}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendTemplate(options: MessengerTemplateOptions): Promise<SendMessageResponse> {
    try {
      this.validateTemplateOptions(options);

      const pageId = await this.extractPageId(options.accessToken);

      let template: {
        type: string;
        payload: {
          template_type: string;
          text?: string;
          buttons?: Array<{
            type: string;
            title: string;
            url?: string;
            payload?: string;
            phoneNumber?: string;
          }>;
          elements?: Array<{
            title: string;
            subtitle?: string;
            imageUrl?: string;
            buttons?: Array<{
              type: string;
              title: string;
              url?: string;
              payload?: string;
            }>;
          }>;
        };
      };

      switch (options.templateType) {
        case "button":
          template = {
            type: "template",
            payload: {
              template_type: "button",
              text: options.text || "",
              buttons: options.buttons,
            },
          };
          break;

        case "generic":
          template = {
            type: "template",
            payload: {
              template_type: "generic",
              elements: options.elements,
            },
          };
          break;

        default:
          throw new MessageMeshError(
            "UNSUPPORTED_TEMPLATE_TYPE",
            "messenger",
            `Template type ${options.templateType} is not yet supported`
          );
      }

      const payload = {
        recipient: {
          id: options.to,
        },
        messaging_type: "RESPONSE",
        message: {
          attachment: template,
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
        const data = (await response.json()) as { message_id?: string };
        return {
          success: true,
          messageId: data.message_id,
        };
      }

      throw new MessageMeshError(
        "SEND_FAILED",
        "messenger",
        `Failed to send template: ${response.status}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async replyMessage(options: MessengerReplyOptions): Promise<SendMessageResponse> {
    try {
      this.validateReplyOptions(options);

      // NOTE: Facebook Messenger API doesn't support programmatic replies like WhatsApp
      // The reply_to field is only available in incoming webhook events, not outgoing messages
      // So we'll send a regular message instead and add context to indicate it's a reply
      
      const pageId = await this.extractPageId(options.accessToken);
      const payload = {
        recipient: {
          id: options.to,
        },
        messaging_type: "RESPONSE",
        message: {
          text: options.message,
        },
        metadata: options.metadata ? JSON.stringify({
          ...options.metadata,
          reply_to_message_id: options.replyToMessageId,
          is_reply: true
        }) : JSON.stringify({
          reply_to_message_id: options.replyToMessageId,
          is_reply: true
        }),
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
        const data = (await response.json()) as { message_id?: string };
        return {
          success: true,
          messageId: data.message_id,
        };
      }

      // Get detailed error information from Facebook API
      const errorText = await response.text();
      let errorDetails = errorText;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorDetails = `${errorJson.error.message} (Code: ${errorJson.error.code}, Type: ${errorJson.error.type})`;
        }
      } catch {
        // If JSON parsing fails, use the raw error text
      }

      throw new MessageMeshError(
        "SEND_FAILED",
        "messenger",
        `Failed to send reply: ${response.status} - ${errorDetails}`
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(options: MessengerUserProfileOptions): Promise<MessengerUserProfileResponse> {
    try {
      this.validateUserProfileOptions(options);

      // Default fields if not specified
      const fields = options.fields || ["first_name", "last_name", "profile_pic"];
      const fieldsParam = fields.join(",");

      const response = await this.httpClient.get(
        `${MessengerService.BASE_URL}/${options.userId}?fields=${fieldsParam}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "messenger"
      );

      if (response.status === 200) {
        const profile = (await response.json()) as MessengerUserProfile;
        return {
          success: true,
          profile,
        };
      }

      throw new MessageMeshError(
        "PROFILE_FETCH_FAILED",
        "messenger",
        `Failed to fetch user profile: ${response.status}`
      );
    } catch (error) {
      return this.handleUserProfileError(error);
    }
  }

  // Template Management Methods

  async createTemplate(
    options: MessengerTemplateCreateOptions
  ): Promise<MessengerTemplateResponse> {
    try {
      this.validateMessengerTemplateCreateOptions(options);

      const payload = {
        name: options.name,
        category: options.category,
        language: options.language || "en_US",
        components: options.components,
      };

      const pageId = await this.extractPageId(options.accessToken);
      const response = await this.httpClient.post(
        `${MessengerService.BASE_URL}/${pageId}/message_templates`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "messenger"
      );

      const result = (await response.json()) as MessengerApiResponse;

      if (result.id) {
        return {
          success: true,
          templateId: result.id,
        };
      }

      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }

  async updateTemplate(
    options: MessengerTemplateUpdateOptions
  ): Promise<MessengerTemplateResponse> {
    try {
      this.validateMessengerTemplateUpdateOptions(options);

      const payload: Record<string, unknown> = {};
      if (options.components) payload.components = options.components;
      if (options.category) payload.category = options.category;

      const response = await this.httpClient.post(
        `${MessengerService.BASE_URL}/${options.templateId}`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "messenger"
      );

      const result = (await response.json()) as MessengerApiResponse;

      if (result.error) {
        return this.handleMessengerTemplateError(result);
      }

      return {
        success: true,
        templateId: options.templateId,
      };

      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }

  async deleteTemplate(
    options: MessengerTemplateDeleteOptions
  ): Promise<MessengerTemplateResponse> {
    try {
      this.validateMessengerTemplateDeleteOptions(options);

      const response = await this.httpClient.delete(
        `${MessengerService.BASE_URL}/${options.templateId}?name=${encodeURIComponent(options.name)}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "messenger"
      );

      const result = (await response.json()) as MessengerApiResponse;

      if (result.error) {
        return this.handleMessengerTemplateError(result);
      }

      return {
        success: true,
        templateId: options.templateId,
      };

      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }

  async getTemplate(options: MessengerTemplateStatusOptions): Promise<MessengerTemplateResponse> {
    try {
      this.validateMessengerTemplateStatusOptions(options);

      const params = new URLSearchParams();
      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append(
          "fields",
          "id,name,status,category,language,components,quality_score,rejected_reason"
        );
      }

      const response = await this.httpClient.get(
        `${MessengerService.BASE_URL}/${options.templateId}?${params.toString()}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "messenger"
      );

      const result = (await response.json()) as MessengerApiResponse;

      if (result.id) {
        return {
          success: true,
          template: this.formatMessengerTemplate(result as Record<string, unknown>),
        };
      }

      return this.handleMessengerTemplateError(result);
    } catch (error) {
      return this.handleMessengerTemplateError(error);
    }
  }

  async listTemplates(
    options: MessengerTemplateListOptions
  ): Promise<MessengerTemplateListResponse> {
    try {
      this.validateMessengerTemplateListOptions(options);

      const params = new URLSearchParams();

      if (options.fields) {
        params.append("fields", options.fields.join(","));
      } else {
        params.append(
          "fields",
          "id,name,status,category,language,components,quality_score,rejected_reason"
        );
      }

      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset);
      if (options.status) params.append("status", options.status);
      if (options.category) params.append("category", options.category);

      const pageId = await this.extractPageId(options.accessToken);
      const response = await this.httpClient.get(
        `${MessengerService.BASE_URL}/${pageId}/message_templates?${params.toString()}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "messenger"
      );

      const result = (await response.json()) as MessengerApiResponse;

      if (result.data) {
        return {
          success: true,
          templates: result.data.map((template: unknown) =>
            this.formatMessengerTemplate(template as Record<string, unknown>)
          ),
          paging: result.paging,
        };
      }

      return this.handleMessengerTemplateListError(result);
    } catch (error) {
      return this.handleMessengerTemplateListError(error);
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
        const data = (await response.json()) as { id?: string };
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

  private validateMediaOptions(options: MessengerMediaOptions): void {
    // Use security utilities for basic validation
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    SecurityUtils.validateUserId(options.to, "messenger");

    // Validate media source
    if (!options.mediaUrl && !options.mediaId) {
      throw new MessageMeshError(
        "MISSING_MEDIA_SOURCE",
        "messenger",
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
            "messenger",
            "Media URL must use HTTPS protocol"
          );
        }
      } catch {
        throw new MessageMeshError("INVALID_MEDIA_URL", "messenger", "Invalid media URL format");
      }
    }

    // Validate media type
    const validTypes = ["image", "video", "audio", "file"];
    if (!validTypes.includes(options.type)) {
      throw new MessageMeshError(
        "INVALID_MEDIA_TYPE",
        "messenger",
        `Invalid media type: ${options.type}. Must be one of: ${validTypes.join(", ")}`
      );
    }

    // Validate caption length if provided
    if (options.caption && options.caption.length > 1000) {
      throw new MessageMeshError(
        "CAPTION_TOO_LONG",
        "messenger",
        "Caption cannot exceed 1000 characters"
      );
    }

    // Validate metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "messenger");
    }
  }

  private validateTemplateOptions(options: MessengerTemplateOptions): void {
    // Use security utilities for basic validation
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    SecurityUtils.validateUserId(options.to, "messenger");

    // Validate template type
    const validTypes = ["generic", "button", "receipt", "airline"];
    if (!validTypes.includes(options.templateType)) {
      throw new MessageMeshError(
        "INVALID_TEMPLATE_TYPE",
        "messenger",
        `Invalid template type: ${options.templateType}. Must be one of: ${validTypes.join(", ")}`
      );
    }

    // Type-specific validations
    switch (options.templateType) {
      case "button":
        if (!options.text) {
          throw new MessageMeshError(
            "MISSING_TEMPLATE_TEXT",
            "messenger",
            "Button template requires text"
          );
        }
        if (!options.buttons || options.buttons.length === 0) {
          throw new MessageMeshError(
            "MISSING_TEMPLATE_BUTTONS",
            "messenger",
            "Button template requires at least one button"
          );
        }
        if (options.buttons.length > 3) {
          throw new MessageMeshError(
            "TOO_MANY_BUTTONS",
            "messenger",
            "Button template supports maximum 3 buttons"
          );
        }
        break;

      case "generic":
        if (!options.elements || options.elements.length === 0) {
          throw new MessageMeshError(
            "MISSING_TEMPLATE_ELEMENTS",
            "messenger",
            "Generic template requires at least one element"
          );
        }
        if (options.elements.length > 10) {
          throw new MessageMeshError(
            "TOO_MANY_ELEMENTS",
            "messenger",
            "Generic template supports maximum 10 elements"
          );
        }
        break;
    }

    // Validate metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "messenger");
    }
  }

  private validateReplyOptions(options: MessengerReplyOptions): void {
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
        "messenger",
        "Reply message ID is required"
      );
    }
  }

  private validateMessengerTemplateCreateOptions(options: MessengerTemplateCreateOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "messenger", "Template name is required");
    }
    if (!options.category) {
      throw new MessageMeshError(
        "INVALID_TEMPLATE_CATEGORY",
        "messenger",
        "Template category is required"
      );
    }
    if (!options.components || options.components.length === 0) {
      throw new MessageMeshError(
        "INVALID_TEMPLATE_COMPONENTS",
        "messenger",
        "Template components are required"
      );
    }
  }

  private validateMessengerTemplateUpdateOptions(options: MessengerTemplateUpdateOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "messenger", "Template ID is required");
    }
  }

  private validateMessengerTemplateDeleteOptions(options: MessengerTemplateDeleteOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "messenger", "Template ID is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "messenger", "Template name is required");
    }
  }

  private validateMessengerTemplateStatusOptions(options: MessengerTemplateStatusOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "messenger", "Template ID is required");
    }
  }

  private validateMessengerTemplateListOptions(options: MessengerTemplateListOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
  }

  private validateUserProfileOptions(options: MessengerUserProfileOptions): void {
    SecurityUtils.validateAccessToken(options.accessToken, "messenger");
    
    if (!options.userId || options.userId.trim().length === 0) {
      throw new MessageMeshError(
        "INVALID_USER_ID",
        "messenger",
        "User ID is required"
      );
    }

    // Validate user ID format (should be numeric for Facebook user ID)
    if (!/^\d+$/.test(options.userId.trim())) {
      throw new MessageMeshError(
        "INVALID_USER_ID_FORMAT",
        "messenger",
        "User ID must be a valid Facebook user ID (numeric)"
      );
    }

    // Validate fields if provided
    if (options.fields) {
      const validFields = ["first_name", "last_name", "profile_pic"];
      for (const field of options.fields) {
        if (!validFields.includes(field)) {
          throw new MessageMeshError(
            "INVALID_FIELD",
            "messenger",
            `Invalid field: ${field}. Valid fields are: ${validFields.join(", ")}`
          );
        }
      }
    }
  }

  private formatMessengerTemplate(apiTemplate: Record<string, unknown>): MessengerTemplate {
    const template = apiTemplate as {
      id: string;
      name: string;
      status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
      category:
        | "ACCOUNT_UPDATE"
        | "PAYMENT_UPDATE"
        | "PERSONAL_FINANCE_UPDATE"
        | "SHIPPING_UPDATE"
        | "RESERVATION_UPDATE"
        | "ISSUE_RESOLUTION"
        | "APPOINTMENT_UPDATE"
        | "TRANSPORTATION_UPDATE"
        | "FEATURE_FUNCTIONALITY_UPDATE"
        | "TICKET_UPDATE";
      language: string;
      components: MessengerTemplateComponent[];
      created_time?: string;
      modified_time?: string;
      quality_score?: {
        score: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
        date?: string;
      };
      rejected_reason?: string;
      disabled_date?: string;
    };

    return {
      id: template.id,
      name: template.name,
      status: template.status,
      category: template.category,
      language: template.language,
      components: template.components,
      createdTime: template.created_time,
      modifiedTime: template.modified_time,
      qualityScore: template.quality_score
        ? {
            score: template.quality_score.score,
            date: template.quality_score.date,
          }
        : undefined,
      rejectedReason: template.rejected_reason,
      disabledDate: template.disabled_date,
    };
  }

  private handleMessengerTemplateError(error: unknown): MessengerTemplateResponse {
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
        code: "MESSENGER_TEMPLATE_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger",
      },
    };
  }

  private handleMessengerTemplateListError(error: unknown): MessengerTemplateListResponse {
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
        code: "MESSENGER_TEMPLATE_LIST_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger",
      },
    };
  }

  private handleUserProfileError(error: unknown): MessengerUserProfileResponse {
    if (error instanceof MessageMeshError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          platform: "messenger",
        },
      };
    }

    // Handle HTTP-specific errors for profile fetching
    if (error && typeof error === "object" && "status" in error) {
      const httpError = error as { status: number; data?: unknown };

      switch (httpError.status) {
        case 400:
          return {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Invalid request parameters or user ID",
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
              message: "Insufficient permissions to access user profile",
              platform: "messenger",
            },
          };
        case 404:
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User profile not found or not accessible",
              platform: "messenger",
            },
          };
      }
    }

    return {
      success: false,
      error: {
        code: "PROFILE_FETCH_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "messenger",
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

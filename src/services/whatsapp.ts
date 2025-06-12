import type { IWhatsAppService } from "../interfaces.js";
import type {
  SendMessageResponse,
  WhatsAppMessageOptions,
  WhatsAppTemplateOptions,
  WhatsAppReplyOptions,
  WhatsAppReactionOptions,
  WhatsAppMediaOptions,
  WhatsAppEmojiOptions,
  TemplateCreateOptions,
  TemplateUpdateOptions,
  TemplateDeleteOptions,
  TemplateListOptions,
  TemplateStatusOptions,
  TemplateResponse,
  TemplateListResponse,
  Template,
  TemplateComponent,
} from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";
import { SecurityUtils } from "../security.js";

interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
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

export class WhatsAppService implements IWhatsAppService {
  private static readonly BASE_URL = "https://graph.facebook.com/v23.0";

  constructor(private httpClient: HttpClient) {}

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `${WhatsAppService.BASE_URL}/me`,
        {
          Authorization: `Bearer ${accessToken}`,
        },
        "whatsapp"
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async sendMessage(options: WhatsAppMessageOptions): Promise<SendMessageResponse> {
    try {
      this.validateMessageOptions(options);

      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "text",
        text: {
          body: options.message,
        },
        ...(options.metadata && { metadata: options.metadata }),
      };

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendTemplate(options: WhatsAppTemplateOptions): Promise<SendMessageResponse> {
    try {
      this.validateTemplateOptions(options);

      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "template",
        template: {
          name: options.templateName,
          language: {
            code: options.templateLanguage,
          },
          ...(options.templateComponents && {
            components: options.templateComponents,
          }),
        },
        ...(options.metadata && { metadata: options.metadata }),
      };

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async replyMessage(options: WhatsAppReplyOptions): Promise<SendMessageResponse> {
    try {
      this.validateReplyOptions(options);

      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "text",
        context: {
          message_id: options.replyToMessageId,
        },
        text: {
          body: options.message,
        },
        ...(options.metadata && { metadata: options.metadata }),
      };

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendReaction(options: WhatsAppReactionOptions): Promise<SendMessageResponse> {
    try {
      this.validateReactionOptions(options);

      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "reaction",
        reaction: {
          message_id: options.messageId,
          emoji: options.emoji,
        },
      };

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendMedia(options: WhatsAppMediaOptions): Promise<SendMessageResponse> {
    try {
      this.validateMediaOptions(options);

      const payload: Record<string, unknown> = {
        messaging_product: "whatsapp",
        to: options.to,
        type: options.mediaType,
        [options.mediaType]: {
          ...(options.mediaUrl && { link: options.mediaUrl }),
          ...(options.mediaPath && { id: options.mediaPath }), // For uploaded media
          ...(options.caption && { caption: options.caption }),
          ...(options.filename && { filename: options.filename }),
        },
        ...(options.metadata && { metadata: options.metadata }),
      };

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendEmoji(options: WhatsAppEmojiOptions): Promise<SendMessageResponse> {
    try {
      this.validateEmojiOptions(options);

      const payload = {
        messaging_product: "whatsapp",
        to: options.to,
        type: "text",
        text: {
          body: options.emoji,
        },
        ...(options.metadata && { metadata: options.metadata }),
      };

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken, options.phoneNumberId)}/messages`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private validateMessageOptions(options: WhatsAppMessageOptions): void {
    // Use security utilities for enhanced validation
    SecurityUtils.validateAccessToken(options.accessToken, "whatsapp");
    SecurityUtils.validateUserId(options.to, "whatsapp");

    const sanitizedMessage = SecurityUtils.validateMessageContent(options.message, "whatsapp");

    // Validate WhatsApp phone number format
    if (!/^\+\d{1,15}$/.test(options.to.trim())) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        "whatsapp",
        "Recipient must be a valid WhatsApp phone number in E.164 format (e.g., +1234567890)"
      );
    }

    // Validate and sanitize metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "whatsapp");
    }

    // Update the message content with sanitized version
    options.message = sanitizedMessage;
  }

  private validateTemplateOptions(options: WhatsAppTemplateOptions): void {
    SecurityUtils.validateAccessToken(options.accessToken, "whatsapp");
    SecurityUtils.validateUserId(options.to, "whatsapp");

    // Validate WhatsApp phone number format
    if (!/^\+\d{1,15}$/.test(options.to.trim())) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        "whatsapp",
        "Recipient must be a valid WhatsApp phone number in E.164 format"
      );
    }

    // Validate template name and language
    const sanitizedTemplateName = SecurityUtils.sanitizeText(options.templateName);
    const sanitizedTemplateLanguage = SecurityUtils.sanitizeText(options.templateLanguage);

    if (!sanitizedTemplateName) {
      throw new MessageMeshError("INVALID_TEMPLATE", "whatsapp", "Template name is required");
    }
    if (!sanitizedTemplateLanguage) {
      throw new MessageMeshError("INVALID_TEMPLATE", "whatsapp", "Template language is required");
    }

    // Validate metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "whatsapp");
    }

    // Update with sanitized values
    options.templateName = sanitizedTemplateName;
    options.templateLanguage = sanitizedTemplateLanguage;
  }

  private validateReplyOptions(options: WhatsAppReplyOptions): void {
    this.validateMessageOptions(options);
    if (!options.replyToMessageId?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE_ID", "whatsapp", "Reply message ID is required");
    }
  }

  private validateReactionOptions(options: WhatsAppReactionOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        "whatsapp",
        "Recipient phone number is required"
      );
    }
    if (!options.messageId?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE_ID", "whatsapp", "Message ID is required");
    }
    if (!options.emoji?.trim()) {
      throw new MessageMeshError("INVALID_EMOJI", "whatsapp", "Emoji is required");
    }
  }

  private validateMediaOptions(options: WhatsAppMediaOptions): void {
    SecurityUtils.validateAccessToken(options.accessToken, "whatsapp");
    SecurityUtils.validateUserId(options.to, "whatsapp");

    // Validate WhatsApp phone number format
    if (!/^\+\d{1,15}$/.test(options.to.trim())) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        "whatsapp",
        "Recipient must be a valid WhatsApp phone number in E.164 format"
      );
    }

    if (!options.mediaUrl && !options.mediaPath) {
      throw new MessageMeshError(
        "INVALID_MEDIA",
        "whatsapp",
        "Either media URL or media path is required"
      );
    }

    // Validate media URL if provided
    if (options.mediaUrl) {
      SecurityUtils.validateUrl(options.mediaUrl, "whatsapp");
    }

    const validTypes = ["image", "video", "audio", "document"];
    if (!validTypes.includes(options.mediaType)) {
      throw new MessageMeshError(
        "INVALID_MEDIA_TYPE",
        "whatsapp",
        `Invalid media type. Must be one of: ${validTypes.join(", ")}`
      );
    }

    // Sanitize optional fields
    if (options.caption) {
      options.caption = SecurityUtils.sanitizeText(options.caption);
    }
    if (options.filename) {
      options.filename = SecurityUtils.sanitizeText(options.filename);
    }

    // Validate metadata if present
    if (options.metadata) {
      SecurityUtils.validateMetadata(options.metadata, "whatsapp");
    }
  }

  private validateEmojiOptions(options: WhatsAppEmojiOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError(
        "INVALID_RECIPIENT",
        "whatsapp",
        "Recipient phone number is required"
      );
    }
    if (!options.emoji?.trim()) {
      throw new MessageMeshError("INVALID_EMOJI", "whatsapp", "Emoji is required");
    }
  }

  // Template Management Methods

  async createTemplate(options: TemplateCreateOptions): Promise<TemplateResponse> {
    try {
      this.validateTemplateCreateOptions(options);

      const payload = {
        name: options.name,
        category: options.category,
        language: options.language,
        components: options.components,
        ...(options.allowCategoryChange && { allow_category_change: options.allowCategoryChange }),
      };

      const businessId = options.businessId || this.extractBusinessId(options.accessToken);
      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${businessId}/message_templates`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      if (result.id) {
        return {
          success: true,
          templateId: result.id,
        };
      }

      return this.handleTemplateError(result);
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }

  async updateTemplate(options: TemplateUpdateOptions): Promise<TemplateResponse> {
    try {
      this.validateTemplateUpdateOptions(options);

      const payload: Record<string, unknown> = {};
      if (options.components) payload.components = options.components;
      if (options.category) payload.category = options.category;

      const response = await this.httpClient.post(
        `${WhatsAppService.BASE_URL}/${options.templateId}`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      if (result.error) {
        return this.handleTemplateError(result);
      }

      return {
        success: true,
        templateId: options.templateId,
      };
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }

  async deleteTemplate(options: TemplateDeleteOptions): Promise<TemplateResponse> {
    try {
      this.validateTemplateDeleteOptions(options);

      const response = await this.httpClient.delete(
        `${WhatsAppService.BASE_URL}/${options.templateId}?name=${encodeURIComponent(options.name)}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      if (result.error) {
        return this.handleTemplateError(result);
      }

      return {
        success: true,
        templateId: options.templateId,
      };
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }

  async getTemplate(options: TemplateStatusOptions): Promise<TemplateResponse> {
    try {
      this.validateTemplateStatusOptions(options);

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
        `${WhatsAppService.BASE_URL}/${options.templateId}?${params.toString()}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      if (result.id) {
        return {
          success: true,
          template: this.formatTemplate(result as Record<string, unknown>),
        };
      }

      return this.handleTemplateError(result);
    } catch (error) {
      return this.handleTemplateError(error);
    }
  }

  async listTemplates(options: TemplateListOptions): Promise<TemplateListResponse> {
    try {
      this.validateTemplateListOptions(options);

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

      const businessId = this.extractBusinessId(options.accessToken, options.businessId);
      const response = await this.httpClient.get(
        `${WhatsAppService.BASE_URL}/${businessId}/message_templates?${params.toString()}`,
        {
          Authorization: `Bearer ${options.accessToken}`,
        },
        "whatsapp"
      );

      const result = (await response.json()) as WhatsAppApiResponse;

      if (result.data) {
        return {
          success: true,
          templates: result.data.map((template: unknown) => this.formatTemplate(template as Record<string, unknown>)),
          paging: result.paging,
        };
      }

      return this.handleTemplateListError(result);
    } catch (error) {
      return this.handleTemplateListError(error);
    }
  }

  private extractPhoneNumberId(_accessToken: string, phoneNumberId?: string): string {
    // Use provided phoneNumberId if available, otherwise fall back to placeholder
    if (phoneNumberId) {
      return phoneNumberId;
    }

    // This is a placeholder - in a real implementation, you would need to
    // extract the phone number ID from the access token or require it as a parameter
    // For now, we'll use a placeholder that developers need to replace
    return "PHONE_NUMBER_ID";
  }

  private extractBusinessId(_accessToken: string, businessId?: string): string {
    // Use provided businessId if available, otherwise fall back to placeholder
    if (businessId) {
      return businessId;
    }

    // This is a placeholder - in a real implementation, you would need to
    // extract the business ID from the access token or require it as a parameter
    // For now, we'll use a placeholder that developers need to replace
    return "BUSINESS_ID";
  }

  private validateTemplateCreateOptions(options: TemplateCreateOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "whatsapp", "Template name is required");
    }
    if (!options.category) {
      throw new MessageMeshError(
        "INVALID_TEMPLATE_CATEGORY",
        "whatsapp",
        "Template category is required"
      );
    }
    if (!options.language) {
      throw new MessageMeshError(
        "INVALID_TEMPLATE_LANGUAGE",
        "whatsapp",
        "Template language is required"
      );
    }
    if (!options.components || options.components.length === 0) {
      throw new MessageMeshError(
        "INVALID_TEMPLATE_COMPONENTS",
        "whatsapp",
        "Template components are required"
      );
    }
  }

  private validateTemplateUpdateOptions(options: TemplateUpdateOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "whatsapp", "Template ID is required");
    }
  }

  private validateTemplateDeleteOptions(options: TemplateDeleteOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "whatsapp", "Template ID is required");
    }
    if (!options.name) {
      throw new MessageMeshError("INVALID_TEMPLATE_NAME", "whatsapp", "Template name is required");
    }
  }

  private validateTemplateStatusOptions(options: TemplateStatusOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.templateId) {
      throw new MessageMeshError("INVALID_TEMPLATE_ID", "whatsapp", "Template ID is required");
    }
  }

  private validateTemplateListOptions(options: TemplateListOptions): void {
    if (!options.accessToken) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
  }

  private formatTemplate(apiTemplate: Record<string, unknown>): Template {
    const template = apiTemplate as {
      id: string;
      name: string;
      status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
      category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
      language: string;
      components: TemplateComponent[];
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

  private handleTemplateError(error: unknown): TemplateResponse {
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
        code: "TEMPLATE_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "whatsapp",
      },
    };
  }

  private handleTemplateListError(error: unknown): TemplateListResponse {
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
        code: "TEMPLATE_LIST_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "whatsapp",
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

    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        platform: "whatsapp",
      },
    };
  }
}

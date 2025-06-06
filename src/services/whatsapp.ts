import type { IWhatsAppService } from "../interfaces.js";
import type {
  SendMessageResponse,
  WhatsAppMessageOptions,
  WhatsAppTemplateOptions,
  WhatsAppReplyOptions,
  WhatsAppReactionOptions,
  WhatsAppMediaOptions,
  WhatsAppEmojiOptions,
} from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";
import { SecurityUtils } from "../security.js";

interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export class WhatsAppService implements IWhatsAppService {
  private static readonly BASE_URL = "https://graph.facebook.com/v18.0";

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
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken)}/messages`,
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
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken)}/messages`,
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
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken)}/messages`,
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
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken)}/messages`,
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
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken)}/messages`,
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
        `${WhatsAppService.BASE_URL}/${this.extractPhoneNumberId(options.accessToken)}/messages`,
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

  private extractPhoneNumberId(_accessToken: string): string {
    // This is a placeholder - in a real implementation, you would need to
    // extract the phone number ID from the access token or require it as a parameter
    // For now, we'll use a placeholder that developers need to replace
    return "PHONE_NUMBER_ID";
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

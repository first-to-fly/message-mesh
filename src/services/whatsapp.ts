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

      const result = await response.json() as WhatsAppApiResponse;
      
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

      const result = await response.json() as WhatsAppApiResponse;
      
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

      const result = await response.json() as WhatsAppApiResponse;
      
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

      const result = await response.json() as WhatsAppApiResponse;
      
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

      const result = await response.json() as WhatsAppApiResponse;
      
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

      const result = await response.json() as WhatsAppApiResponse;
      
      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private validateMessageOptions(options: WhatsAppMessageOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
    }
    if (!options.message?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE", "whatsapp", "Message content is required");
    }
  }

  private validateTemplateOptions(options: WhatsAppTemplateOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
    }
    if (!options.templateName?.trim()) {
      throw new MessageMeshError("INVALID_TEMPLATE", "whatsapp", "Template name is required");
    }
    if (!options.templateLanguage?.trim()) {
      throw new MessageMeshError("INVALID_TEMPLATE", "whatsapp", "Template language is required");
    }
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
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
    }
    if (!options.messageId?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE_ID", "whatsapp", "Message ID is required");
    }
    if (!options.emoji?.trim()) {
      throw new MessageMeshError("INVALID_EMOJI", "whatsapp", "Emoji is required");
    }
  }

  private validateMediaOptions(options: WhatsAppMediaOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
    }
    if (!options.mediaUrl && !options.mediaPath) {
      throw new MessageMeshError("INVALID_MEDIA", "whatsapp", "Either media URL or media path is required");
    }
    const validTypes = ["image", "video", "audio", "document"];
    if (!validTypes.includes(options.mediaType)) {
      throw new MessageMeshError("INVALID_MEDIA_TYPE", "whatsapp", `Invalid media type. Must be one of: ${validTypes.join(", ")}`);
    }
  }

  private validateEmojiOptions(options: WhatsAppEmojiOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "whatsapp", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "whatsapp", "Recipient phone number is required");
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
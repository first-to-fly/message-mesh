export interface MessageMeshConfig {
  timeout?: number;
  retryAttempts?: number;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  attachmentId?: string;
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

export type Platform = "whatsapp" | "messenger" | "instagram";

export interface WhatsAppMessageOptions {
  accessToken: string;
  to: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppTemplateOptions {
  accessToken: string;
  to: string;
  templateName: string;
  templateLanguage: string;
  templateComponents?: TemplateComponent[];
  metadata?: Record<string, any>;
}

export interface WhatsAppReplyOptions {
  accessToken: string;
  to: string;
  message: string;
  replyToMessageId: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppReactionOptions {
  accessToken: string;
  to: string;
  messageId: string;
  emoji: string;
}

export interface WhatsAppMediaOptions {
  accessToken: string;
  to: string;
  mediaType: "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  mediaPath?: string;
  caption?: string;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppEmojiOptions {
  accessToken: string;
  to: string;
  emoji: string;
  metadata?: Record<string, any>;
}

export interface TemplateComponent {
  type: "header" | "body" | "footer" | "button";
  parameters?: TemplateParameter[];
}

export interface TemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
  video?: {
    link: string;
  };
}

export interface MessengerMessageOptions {
  accessToken: string;
  to: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface MessengerMediaOptions {
  accessToken: string;
  to: string;
  type: "image" | "video" | "audio" | "file";
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface MessengerTemplateOptions {
  accessToken: string;
  to: string;
  templateType: "generic" | "button" | "receipt" | "airline";
  elements?: Array<{
    title: string;
    subtitle?: string;
    imageUrl?: string;
    buttons?: Array<{
      type: "web_url" | "postback";
      title: string;
      url?: string;
      payload?: string;
    }>;
  }>;
  text?: string;
  buttons?: Array<{
    type: "web_url" | "postback" | "call";
    title: string;
    url?: string;
    payload?: string;
    phoneNumber?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface MessengerReplyOptions {
  accessToken: string;
  to: string;
  message: string;
  replyToMessageId: string;
  metadata?: Record<string, any>;
}

export interface InstagramMessageOptions {
  accessToken: string;
  to: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface InstagramMediaOptions {
  accessToken: string;
  to: string;
  type: "image" | "video" | "audio";
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  metadata?: Record<string, any>;
}

export interface InstagramReplyOptions {
  accessToken: string;
  to: string;
  message: string;
  replyToMessageId: string;
  metadata?: Record<string, any>;
}

export class MessageMeshError extends Error {
  constructor(
    public code: string,
    public platform: Platform,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "MessageMeshError";
  }
}
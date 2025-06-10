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

// Template Management Types
export interface TemplateCreateOptions {
  accessToken: string;
  businessId?: string; // WhatsApp Business Account ID
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components: TemplateComponent[];
  allowCategoryChange?: boolean;
}

export interface TemplateUpdateOptions {
  accessToken: string;
  templateId: string;
  components?: TemplateComponent[];
  category?: "MARKETING" | "UTILITY" | "AUTHENTICATION";
}

export interface TemplateDeleteOptions {
  accessToken: string;
  templateId: string;
  name: string;
}

export interface TemplateListOptions {
  accessToken: string;
  fields?: string[];
  limit?: number;
  offset?: string;
  status?: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  category?: "MARKETING" | "UTILITY" | "AUTHENTICATION";
}

export interface TemplateStatusOptions {
  accessToken: string;
  templateId: string;
  fields?: string[];
}

export interface Template {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components: TemplateComponent[];
  createdTime?: string;
  modifiedTime?: string;
  qualityScore?: {
    score: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
    date?: string;
  };
  rejectedReason?: string;
  disabledDate?: string;
}

export interface TemplateResponse {
  success: boolean;
  template?: Template;
  templates?: Template[];
  templateId?: string;
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

export interface TemplateListResponse {
  success: boolean;
  templates?: Template[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

// Messenger Template Management Types
export interface MessengerTemplateCreateOptions {
  accessToken: string;
  name: string;
  category: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
  components: MessengerTemplateComponent[];
  language?: string;
}

export interface MessengerTemplateUpdateOptions {
  accessToken: string;
  templateId: string;
  components?: MessengerTemplateComponent[];
  category?: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
}

export interface MessengerTemplateDeleteOptions {
  accessToken: string;
  templateId: string;
  name: string;
}

export interface MessengerTemplateListOptions {
  accessToken: string;
  fields?: string[];
  limit?: number;
  offset?: string;
  status?: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  category?: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
}

export interface MessengerTemplateStatusOptions {
  accessToken: string;
  templateId: string;
  fields?: string[];
}

export interface MessengerTemplate {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  category: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
  language: string;
  components: MessengerTemplateComponent[];
  createdTime?: string;
  modifiedTime?: string;
  qualityScore?: {
    score: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
    date?: string;
  };
  rejectedReason?: string;
  disabledDate?: string;
}

export interface MessengerTemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  text?: string;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface MessengerTemplateResponse {
  success: boolean;
  template?: MessengerTemplate;
  templates?: MessengerTemplate[];
  templateId?: string;
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

export interface MessengerTemplateListResponse {
  success: boolean;
  templates?: MessengerTemplate[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

// Instagram Template Management Types
export interface InstagramTemplateCreateOptions {
  accessToken: string;
  name: string;
  category: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
  components: InstagramTemplateComponent[];
  language?: string;
}

export interface InstagramTemplateUpdateOptions {
  accessToken: string;
  templateId: string;
  components?: InstagramTemplateComponent[];
  category?: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
}

export interface InstagramTemplateDeleteOptions {
  accessToken: string;
  templateId: string;
  name: string;
}

export interface InstagramTemplateListOptions {
  accessToken: string;
  fields?: string[];
  limit?: number;
  offset?: string;
  status?: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  category?: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
}

export interface InstagramTemplateStatusOptions {
  accessToken: string;
  templateId: string;
  fields?: string[];
}

export interface InstagramTemplate {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
  category: "ACCOUNT_UPDATE" | "PAYMENT_UPDATE" | "PERSONAL_FINANCE_UPDATE" | "SHIPPING_UPDATE" | "RESERVATION_UPDATE" | "ISSUE_RESOLUTION" | "APPOINTMENT_UPDATE" | "TRANSPORTATION_UPDATE" | "FEATURE_FUNCTIONALITY_UPDATE" | "TICKET_UPDATE";
  language: string;
  components: InstagramTemplateComponent[];
  createdTime?: string;
  modifiedTime?: string;
  qualityScore?: {
    score: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
    date?: string;
  };
  rejectedReason?: string;
  disabledDate?: string;
}

export interface InstagramTemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  text?: string;
  format?: "TEXT" | "IMAGE" | "VIDEO";
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL";
    text: string;
    url?: string;
  }>;
}

export interface InstagramTemplateResponse {
  success: boolean;
  template?: InstagramTemplate;
  templates?: InstagramTemplate[];
  templateId?: string;
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

export interface InstagramTemplateListResponse {
  success: boolean;
  templates?: InstagramTemplate[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    code: string;
    message: string;
    platform: "whatsapp" | "messenger" | "instagram";
  };
}

// API Response Types
export interface WhatsAppAPIResponse {
  id?: string;
  data?: any[];
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

export interface MessengerAPIResponse {
  id?: string;
  data?: any[];
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

export interface InstagramAPIResponse {
  id?: string;
  data?: any[];
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
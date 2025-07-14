import type {
  SendMessageResponse,
  WhatsAppMessageOptions,
  WhatsAppTemplateOptions,
  WhatsAppReplyOptions,
  WhatsAppReactionOptions,
  WhatsAppMediaOptions,
  WhatsAppEmojiOptions,
  MessengerMessageOptions,
  MessengerMediaOptions,
  MessengerTemplateOptions,
  MessengerReplyOptions,
  MessengerUserProfileOptions,
  MessengerUserProfileResponse,
  InstagramMessageOptions,
  InstagramMediaOptions,
  InstagramReplyOptions,
  TemplateCreateOptions,
  TemplateUpdateOptions,
  TemplateDeleteOptions,
  TemplateListOptions,
  TemplateStatusOptions,
  TemplateResponse,
  TemplateListResponse,
  MessengerTemplateCreateOptions,
  MessengerTemplateUpdateOptions,
  MessengerTemplateDeleteOptions,
  MessengerTemplateListOptions,
  MessengerTemplateStatusOptions,
  MessengerTemplateResponse,
  MessengerTemplateListResponse,
  InstagramTemplateCreateOptions,
  InstagramTemplateUpdateOptions,
  InstagramTemplateDeleteOptions,
  InstagramTemplateListOptions,
  InstagramTemplateStatusOptions,
  InstagramTemplateResponse,
  InstagramTemplateListResponse,
  PhoneNumberListOptions,
  PhoneNumberListResponse,
} from "./types.js";

export interface IPlatformService {
  validateAccessToken(accessToken: string): Promise<boolean>;
}

export interface IWhatsAppService extends IPlatformService {
  sendMessage(options: WhatsAppMessageOptions): Promise<SendMessageResponse>;
  sendTemplate(options: WhatsAppTemplateOptions): Promise<SendMessageResponse>;
  replyMessage(options: WhatsAppReplyOptions): Promise<SendMessageResponse>;
  sendReaction(options: WhatsAppReactionOptions): Promise<SendMessageResponse>;
  sendMedia(options: WhatsAppMediaOptions): Promise<SendMessageResponse>;
  sendEmoji(options: WhatsAppEmojiOptions): Promise<SendMessageResponse>;
  
  // Template Management Methods
  createTemplate(options: TemplateCreateOptions): Promise<TemplateResponse>;
  updateTemplate(options: TemplateUpdateOptions): Promise<TemplateResponse>;
  deleteTemplate(options: TemplateDeleteOptions): Promise<TemplateResponse>;
  getTemplate(options: TemplateStatusOptions): Promise<TemplateResponse>;
  listTemplates(options: TemplateListOptions): Promise<TemplateListResponse>;
  
  // Phone Number Management Methods
  getPhoneNumbers(options: PhoneNumberListOptions): Promise<PhoneNumberListResponse>;
}

export interface IMessengerService extends IPlatformService {
  sendMessage(options: MessengerMessageOptions): Promise<SendMessageResponse>;
  sendMedia(options: MessengerMediaOptions): Promise<SendMessageResponse>;
  sendTemplate(options: MessengerTemplateOptions): Promise<SendMessageResponse>;
  replyMessage(options: MessengerReplyOptions): Promise<SendMessageResponse>;
  
  // User Profile Methods
  getUserProfile(options: MessengerUserProfileOptions): Promise<MessengerUserProfileResponse>;
  
  // Template Management Methods
  createTemplate(options: MessengerTemplateCreateOptions): Promise<MessengerTemplateResponse>;
  updateTemplate(options: MessengerTemplateUpdateOptions): Promise<MessengerTemplateResponse>;
  deleteTemplate(options: MessengerTemplateDeleteOptions): Promise<MessengerTemplateResponse>;
  getTemplate(options: MessengerTemplateStatusOptions): Promise<MessengerTemplateResponse>;
  listTemplates(options: MessengerTemplateListOptions): Promise<MessengerTemplateListResponse>;
}

export interface IInstagramService extends IPlatformService {
  sendMessage(options: InstagramMessageOptions): Promise<SendMessageResponse>;
  sendMedia(options: InstagramMediaOptions): Promise<SendMessageResponse>;
  replyMessage(options: InstagramReplyOptions): Promise<SendMessageResponse>;
  
  // Template Management Methods
  createTemplate(options: InstagramTemplateCreateOptions): Promise<InstagramTemplateResponse>;
  updateTemplate(options: InstagramTemplateUpdateOptions): Promise<InstagramTemplateResponse>;
  deleteTemplate(options: InstagramTemplateDeleteOptions): Promise<InstagramTemplateResponse>;
  getTemplate(options: InstagramTemplateStatusOptions): Promise<InstagramTemplateResponse>;
  listTemplates(options: InstagramTemplateListOptions): Promise<InstagramTemplateListResponse>;
}
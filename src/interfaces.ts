import type {
  SendMessageResponse,
  WhatsAppMessageOptions,
  WhatsAppTemplateOptions,
  WhatsAppReplyOptions,
  WhatsAppReactionOptions,
  WhatsAppMediaOptions,
  WhatsAppEmojiOptions,
  MessengerMessageOptions,
  InstagramMessageOptions,
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
}

export interface IMessengerService extends IPlatformService {
  sendMessage(options: MessengerMessageOptions): Promise<SendMessageResponse>;
}

export interface IInstagramService extends IPlatformService {
  sendMessage(options: InstagramMessageOptions): Promise<SendMessageResponse>;
}
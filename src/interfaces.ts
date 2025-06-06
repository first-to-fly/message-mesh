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
  InstagramMessageOptions,
  InstagramMediaOptions,
  InstagramReplyOptions,
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
  sendMedia(options: MessengerMediaOptions): Promise<SendMessageResponse>;
  sendTemplate(options: MessengerTemplateOptions): Promise<SendMessageResponse>;
  replyMessage(options: MessengerReplyOptions): Promise<SendMessageResponse>;
}

export interface IInstagramService extends IPlatformService {
  sendMessage(options: InstagramMessageOptions): Promise<SendMessageResponse>;
  sendMedia(options: InstagramMediaOptions): Promise<SendMessageResponse>;
  replyMessage(options: InstagramReplyOptions): Promise<SendMessageResponse>;
}
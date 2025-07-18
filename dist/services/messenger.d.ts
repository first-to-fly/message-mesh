import type { IMessengerService } from "../interfaces.js";
import type { SendMessageResponse, MessengerMessageOptions, MessengerMediaOptions, MessengerTemplateOptions, MessengerReplyOptions, MessengerUserProfileOptions, MessengerUserProfileResponse, MessengerTemplateCreateOptions, MessengerTemplateUpdateOptions, MessengerTemplateDeleteOptions, MessengerTemplateListOptions, MessengerTemplateStatusOptions, MessengerTemplateResponse, MessengerTemplateListResponse } from "../types.js";
import { HttpClient } from "../http-client.js";
export declare class MessengerService implements IMessengerService {
    private httpClient;
    private static readonly BASE_URL;
    constructor(httpClient: HttpClient);
    validateAccessToken(accessToken: string): Promise<boolean>;
    sendMessage(options: MessengerMessageOptions): Promise<SendMessageResponse>;
    sendMedia(options: MessengerMediaOptions): Promise<SendMessageResponse>;
    sendTemplate(options: MessengerTemplateOptions): Promise<SendMessageResponse>;
    replyMessage(options: MessengerReplyOptions): Promise<SendMessageResponse>;
    /**
     * Get user profile information
     */
    getUserProfile(options: MessengerUserProfileOptions): Promise<MessengerUserProfileResponse>;
    createTemplate(options: MessengerTemplateCreateOptions): Promise<MessengerTemplateResponse>;
    updateTemplate(options: MessengerTemplateUpdateOptions): Promise<MessengerTemplateResponse>;
    deleteTemplate(options: MessengerTemplateDeleteOptions): Promise<MessengerTemplateResponse>;
    getTemplate(options: MessengerTemplateStatusOptions): Promise<MessengerTemplateResponse>;
    listTemplates(options: MessengerTemplateListOptions): Promise<MessengerTemplateListResponse>;
    private extractPageId;
    private validateMessageOptions;
    private validateMediaOptions;
    private validateTemplateOptions;
    private validateReplyOptions;
    private validateMessengerTemplateCreateOptions;
    private validateMessengerTemplateUpdateOptions;
    private validateMessengerTemplateDeleteOptions;
    private validateMessengerTemplateStatusOptions;
    private validateMessengerTemplateListOptions;
    private validateUserProfileOptions;
    private formatMessengerTemplate;
    private handleMessengerTemplateError;
    private handleMessengerTemplateListError;
    private handleUserProfileError;
    private handleError;
}

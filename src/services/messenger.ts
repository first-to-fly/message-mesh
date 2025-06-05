import type { IMessengerService } from "../interfaces.js";
import type { SendMessageResponse, MessengerMessageOptions } from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";

export class MessengerService implements IMessengerService {
  private static readonly BASE_URL = "https://graph.facebook.com/v18.0";

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

      // TODO: Implement Messenger API integration
      // This is a placeholder implementation
      throw new MessageMeshError(
        "NOT_IMPLEMENTED",
        "messenger",
        "Messenger integration is not yet implemented"
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private validateMessageOptions(options: MessengerMessageOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "messenger", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "messenger", "Recipient ID is required");
    }
    if (!options.message?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE", "messenger", "Message content is required");
    }
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
        platform: "messenger",
      },
    };
  }
}
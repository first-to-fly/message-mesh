import type { IInstagramService } from "../interfaces.js";
import type { SendMessageResponse, InstagramMessageOptions } from "../types.js";
import { HttpClient } from "../http-client.js";
import { MessageMeshError } from "../types.js";

export class InstagramService implements IInstagramService {
  private static readonly BASE_URL = "https://graph.facebook.com/v18.0";

  constructor(private httpClient: HttpClient) {}

  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `${InstagramService.BASE_URL}/me`,
        {
          Authorization: `Bearer ${accessToken}`,
        },
        "instagram"
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async sendMessage(options: InstagramMessageOptions): Promise<SendMessageResponse> {
    try {
      this.validateMessageOptions(options);

      // TODO: Implement Instagram API integration
      // This is a placeholder implementation
      throw new MessageMeshError(
        "NOT_IMPLEMENTED",
        "instagram",
        "Instagram integration is not yet implemented"
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private validateMessageOptions(options: InstagramMessageOptions): void {
    if (!options.accessToken?.trim()) {
      throw new MessageMeshError("INVALID_ACCESS_TOKEN", "instagram", "Access token is required");
    }
    if (!options.to?.trim()) {
      throw new MessageMeshError("INVALID_RECIPIENT", "instagram", "Recipient ID is required");
    }
    if (!options.message?.trim()) {
      throw new MessageMeshError("INVALID_MESSAGE", "instagram", "Message content is required");
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
        platform: "instagram",
      },
    };
  }
}
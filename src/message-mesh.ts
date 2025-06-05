import type { MessageMeshConfig } from "./types.js";
import type { IWhatsAppService, IMessengerService, IInstagramService } from "./interfaces.js";
import { HttpClient } from "./http-client.js";
import { WhatsAppService } from "./services/whatsapp.js";
import { MessengerService } from "./services/messenger.js";
import { InstagramService } from "./services/instagram.js";

export class MessageMesh {
  public readonly whatsapp: IWhatsAppService;
  public readonly messenger: IMessengerService;
  public readonly instagram: IInstagramService;
  private readonly httpClient: HttpClient;

  constructor(config: MessageMeshConfig = {}) {
    this.httpClient = new HttpClient({
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    });

    this.whatsapp = new WhatsAppService(this.httpClient);
    this.messenger = new MessengerService(this.httpClient);
    this.instagram = new InstagramService(this.httpClient);
  }

  getVersion(): string {
    return "0.1.0";
  }

  getConfig(): MessageMeshConfig {
    return {
      timeout: this.httpClient["config"].timeout,
      retryAttempts: this.httpClient["config"].retryAttempts,
    };
  }
}
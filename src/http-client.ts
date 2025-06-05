import type { Platform } from "./types.js";
import { MessageMeshError } from "./types.js";

export interface HttpClientConfig {
  timeout?: number;
  retryAttempts?: number;
}

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
}

export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 30000, // 30 seconds default
      retryAttempts: config.retryAttempts ?? 3,
    };
  }

  async request(
    url: string,
    options: RequestOptions,
    platform: Platform
  ): Promise<Response> {
    const { timeout, retryAttempts } = this.config;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryAttempts!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "User-Agent": "message-mesh/0.1.0",
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new MessageMeshError(
            `HTTP_${response.status}`,
            platform,
            `HTTP ${response.status}: ${errorText}`,
            new Error(errorText)
          );
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof MessageMeshError) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw new MessageMeshError(
            "TIMEOUT",
            platform,
            `Request timed out after ${timeout}ms`,
            error
          );
        }

        // Retry for network errors
        if (attempt < retryAttempts!) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new MessageMeshError(
          "NETWORK_ERROR",
          platform,
          `Network error after ${retryAttempts! + 1} attempts: ${lastError.message}`,
          lastError
        );
      }
    }

    throw new MessageMeshError(
      "UNKNOWN_ERROR",
      platform,
      "Request failed for unknown reasons",
      lastError
    );
  }

  async get(url: string, headers: Record<string, string>, platform: Platform): Promise<Response> {
    return this.request(url, { method: "GET", headers }, platform);
  }

  async post(
    url: string,
    body: string | FormData,
    headers: Record<string, string>,
    platform: Platform
  ): Promise<Response> {
    return this.request(url, { method: "POST", headers, body }, platform);
  }

  async put(
    url: string,
    body: string | FormData,
    headers: Record<string, string>,
    platform: Platform
  ): Promise<Response> {
    return this.request(url, { method: "PUT", headers, body }, platform);
  }

  async delete(url: string, headers: Record<string, string>, platform: Platform): Promise<Response> {
    return this.request(url, { method: "DELETE", headers }, platform);
  }
}
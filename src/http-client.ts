import type { Platform } from "./types.js";
import { MessageMeshError } from "./types.js";
import { PerformanceMonitor } from "./performance.js";
import { Logger } from "./logger.js";

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
    // Security: Enforce HTTPS for all API calls
    this.validateSecureUrl(url);
    
    // Security: Sanitize and validate headers
    const sanitizedHeaders = this.sanitizeHeaders(options.headers);
    
    // Performance: Start monitoring
    const monitor = PerformanceMonitor.getInstance();
    const requestId = monitor.startRequest(platform, options.method);
    
    // Logging: Log request start
    const logger = Logger.getInstance();
    const requestStartTime = Date.now();
    logger.logRequestStart(platform, options.method, url, {
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts,
    });
    
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
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            ...sanitizedHeaders,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          const error = new MessageMeshError(
            `HTTP_${response.status}`,
            platform,
            `HTTP ${response.status}: ${errorText}`,
            new Error(errorText)
          );
          
          // Performance: End monitoring with error
          monitor.endRequest(requestId, false, error.message);
          throw error;
        }

        // Performance: End monitoring with success
        monitor.endRequest(requestId, true);
        
        // Logging: Log successful request
        const duration = Date.now() - requestStartTime;
        logger.logRequestEnd(platform, options.method, url, duration, true, {
          status: response.status,
          attempt: attempt + 1,
        });
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof MessageMeshError) {
          // Performance monitoring already handled above
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          const timeoutError = new MessageMeshError(
            "TIMEOUT",
            platform,
            `Request timed out after ${timeout}ms`,
            error
          );
          
          // Performance: End monitoring with timeout error
          monitor.endRequest(requestId, false, timeoutError.message);
          
          // Logging: Log timeout error
          const duration = Date.now() - requestStartTime;
          logger.logRequestEnd(platform, options.method, url, duration, false, {
            error: "timeout",
            attempt: attempt + 1,
          });
          
          throw timeoutError;
        }

        // Retry for network errors
        if (attempt < retryAttempts!) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        const networkError = new MessageMeshError(
          "NETWORK_ERROR",
          platform,
          `Network error after ${retryAttempts! + 1} attempts: ${lastError.message}`,
          lastError
        );
        
        // Performance: End monitoring with network error
        monitor.endRequest(requestId, false, networkError.message);
        
        // Logging: Log network error
        const duration = Date.now() - requestStartTime;
        logger.logRequestEnd(platform, options.method, url, duration, false, {
          error: "network",
          attempts: retryAttempts! + 1,
          lastError: lastError.message,
        });
        
        throw networkError;
      }
    }

    const unknownError = new MessageMeshError(
      "UNKNOWN_ERROR",
      platform,
      "Request failed for unknown reasons",
      lastError
    );
    
    // Performance: End monitoring with unknown error
    monitor.endRequest(requestId, false, unknownError.message);
    throw unknownError;
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

  // Security: Validate that all URLs use HTTPS
  private validateSecureUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:") {
        throw new MessageMeshError(
          "INSECURE_URL",
          "all" as Platform,
          "All API calls must use HTTPS for security"
        );
      }
    } catch (error) {
      if (error instanceof MessageMeshError) {
        throw error;
      }
      throw new MessageMeshError(
        "INVALID_URL",
        "all" as Platform,
        "Invalid URL format provided"
      );
    }
  }

  // Security: Sanitize and validate headers
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    
    const sanitized: Record<string, string> = {};
    const dangerousHeaders = ["host", "origin", "referer"];
    
    for (const [key, value] of Object.entries(headers)) {
      // Security: Remove dangerous headers that could be exploited
      if (dangerousHeaders.includes(key.toLowerCase())) {
        continue;
      }
      
      // Security: Sanitize header values
      if (typeof value === "string") {
        // Remove newlines and control characters that could enable header injection
        const sanitizedValue = value.replace(/[\r\n\t]/g, "").trim();
        if (sanitizedValue && sanitizedValue.length <= 2048) { // Reasonable header value length limit
          sanitized[key] = sanitizedValue;
        }
      }
    }
    
    return sanitized;
  }
}
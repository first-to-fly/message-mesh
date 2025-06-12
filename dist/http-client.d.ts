import type { Platform } from "./types.js";
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
export declare class HttpClient {
    private config;
    constructor(config?: HttpClientConfig);
    request(url: string, options: RequestOptions, platform: Platform): Promise<Response>;
    get(url: string, headers: Record<string, string>, platform: Platform): Promise<Response>;
    post(url: string, body: string | FormData, headers: Record<string, string>, platform: Platform): Promise<Response>;
    put(url: string, body: string | FormData, headers: Record<string, string>, platform: Platform): Promise<Response>;
    delete(url: string, headers: Record<string, string>, platform: Platform): Promise<Response>;
    private validateSecureUrl;
    private sanitizeHeaders;
}

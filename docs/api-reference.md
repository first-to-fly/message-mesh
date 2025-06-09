# Message-Mesh API Reference

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Classes](#core-classes)
  - [MessageMesh](#messagemesh)
- [Platform Services](#platform-services)
  - [WhatsApp Service](#whatsapp-service)
  - [Messenger Service](#messenger-service)
  - [Instagram Service](#instagram-service)
- [Types and Interfaces](#types-and-interfaces)
- [Error Handling](#error-handling)
- [Webhook Support](#webhook-support)
- [Platform Capabilities](#platform-capabilities)
- [Performance Monitoring](#performance-monitoring)

## Installation

```bash
# Using npm
npm install message-mesh

# Using yarn
yarn add message-mesh

# Using bun
bun add message-mesh
```

## Quick Start

```typescript
import { MessageMesh } from "message-mesh";

const mesh = new MessageMesh({
  timeout: 30000, // Request timeout in ms (default: 30000)
  retryAttempts: 3, // Number of retry attempts (default: 3)
});

// Send a WhatsApp message
const result = await mesh.whatsapp.sendMessage({
  accessToken: "YOUR_ACCESS_TOKEN",
  to: "+1234567890",
  message: "Hello from Message-Mesh!",
  metadata: { userId: "123" },
});
```

## Core Classes

### MessageMesh

The main class that provides access to all platform services.

#### Constructor

```typescript
new MessageMesh(config?: MessageMeshConfig)
```

**Parameters:**

- `config` (optional): Configuration object
  - `timeout?: number` - Request timeout in milliseconds (default: 30000)
  - `retryAttempts?: number` - Number of retry attempts for failed requests (default: 3)

#### Properties

- `whatsapp: IWhatsAppService` - WhatsApp Business API service
- `messenger: IMessengerService` - Facebook Messenger service
- `instagram: IInstagramService` - Instagram messaging service

#### Methods

##### getVersion()

```typescript
getVersion(): string
```

Returns the current version of the SDK.

##### getConfig()

```typescript
getConfig(): MessageMeshConfig
```

Returns the current configuration.

##### sendUniversalMessage()

```typescript
async sendUniversalMessage(options: {
  accessTokens: Partial<Record<Platform, string>>;
  to: Partial<Record<Platform, string>>;
  message: string;
  preferredPlatforms?: Platform[];
  fallbackToAnyPlatform?: boolean;
  metadata?: Record<string, any>;
}): Promise<Record<Platform, SendMessageResponse>>
```

Sends a message across multiple platforms with automatic fallback.

## Platform Services

### WhatsApp Service

#### sendMessage()

```typescript
async sendMessage(options: WhatsAppMessageOptions): Promise<SendMessageResponse>
```

Sends a text message via WhatsApp.

**Parameters:**

- `accessToken: string` - WhatsApp Business API access token
- `to: string` - Recipient phone number in E.164 format (e.g., +1234567890)
- `message: string` - Message content
- `metadata?: Record<string, any>` - Optional metadata for tracking

**Returns:** `SendMessageResponse`

#### sendTemplate()

```typescript
async sendTemplate(options: WhatsAppTemplateOptions): Promise<SendMessageResponse>
```

Sends a pre-approved template message.

**Parameters:**

- `accessToken: string` - WhatsApp Business API access token
- `to: string` - Recipient phone number
- `templateName: string` - Name of the approved template
- `templateLanguage: string` - Language code (e.g., 'en', 'es')
- `templateComponents?: TemplateComponent[]` - Template parameters
- `metadata?: Record<string, any>` - Optional metadata

**Example:**

```typescript
await mesh.whatsapp.sendTemplate({
  accessToken: "YOUR_TOKEN",
  to: "+1234567890",
  templateName: "order_confirmation",
  templateLanguage: "en",
  templateComponents: [
    {
      type: "body",
      parameters: [
        { type: "text", text: "John Doe" },
        { type: "text", text: "12345" },
      ],
    },
  ],
});
```

#### sendMedia()

```typescript
async sendMedia(options: WhatsAppMediaOptions): Promise<SendMessageResponse>
```

Sends media messages (images, videos, audio, documents).

**Parameters:**

- `accessToken: string` - WhatsApp Business API access token
- `to: string` - Recipient phone number
- `type: "image" | "video" | "audio" | "document"` - Media type
- `mediaUrl?: string` - HTTPS URL of the media
- `mediaId?: string` - Previously uploaded media ID
- `caption?: string` - Caption for images/videos
- `filename?: string` - Filename for documents
- `metadata?: Record<string, any>` - Optional metadata

#### replyMessage()

```typescript
async replyMessage(options: WhatsAppReplyOptions): Promise<SendMessageResponse>
```

Replies to a specific message.

**Parameters:**

- `accessToken: string` - WhatsApp Business API access token
- `to: string` - Recipient phone number
- `message: string` - Reply message content
- `replyToMessageId: string` - ID of the message to reply to
- `metadata?: Record<string, any>` - Optional metadata

#### sendReaction()

```typescript
async sendReaction(options: WhatsAppReactionOptions): Promise<SendMessageResponse>
```

Sends an emoji reaction to a message.

**Parameters:**

- `accessToken: string` - WhatsApp Business API access token
- `to: string` - Recipient phone number
- `messageId: string` - ID of the message to react to
- `emoji: string` - Single emoji character
- `metadata?: Record<string, any>` - Optional metadata

#### sendEmoji()

```typescript
async sendEmoji(options: WhatsAppEmojiOptions): Promise<SendMessageResponse>
```

Sends a standalone emoji message.

**Parameters:**

- `accessToken: string` - WhatsApp Business API access token
- `to: string` - Recipient phone number
- `emoji: string` - Emoji content
- `metadata?: Record<string, any>` - Optional metadata

### Messenger Service

#### sendMessage()

```typescript
async sendMessage(options: MessengerMessageOptions): Promise<SendMessageResponse>
```

Sends a text message via Messenger.

**Parameters:**

- `accessToken: string` - Page access token
- `to: string` - Facebook user ID (PSID)
- `message: string` - Message content (max 2000 characters)
- `metadata?: Record<string, any>` - Optional metadata

#### sendMedia()

```typescript
async sendMedia(options: MessengerMediaOptions): Promise<SendMessageResponse>
```

Sends media messages via Messenger.

**Parameters:**

- `accessToken: string` - Page access token
- `to: string` - Facebook user ID (PSID)
- `type: "image" | "video" | "audio" | "file"` - Media type
- `mediaUrl?: string` - HTTPS URL of the media
- `mediaId?: string` - Previously uploaded media ID
- `caption?: string` - Caption for images/videos (max 1000 characters)
- `filename?: string` - Filename for file attachments
- `metadata?: Record<string, any>` - Optional metadata

#### sendTemplate()

```typescript
async sendTemplate(options: MessengerTemplateOptions): Promise<SendMessageResponse>
```

Sends template messages (buttons, generic, etc.).

**Parameters:**

- `accessToken: string` - Page access token
- `to: string` - Facebook user ID (PSID)
- `templateType: "generic" | "button" | "receipt" | "airline"` - Template type
- `elements?: Array<{...}>` - Elements for generic templates
- `text?: string` - Text for button templates
- `buttons?: Array<{...}>` - Buttons for button templates
- `metadata?: Record<string, any>` - Optional metadata

**Example:**

```typescript
await mesh.messenger.sendTemplate({
  accessToken: "YOUR_TOKEN",
  to: "USER_PSID",
  templateType: "button",
  text: "What would you like to do?",
  buttons: [
    {
      type: "web_url",
      title: "Visit Website",
      url: "https://example.com",
    },
    {
      type: "postback",
      title: "Get Started",
      payload: "GET_STARTED",
    },
  ],
});
```

#### replyMessage()

```typescript
async replyMessage(options: MessengerReplyOptions): Promise<SendMessageResponse>
```

Replies to a specific message.

**Parameters:**

- `accessToken: string` - Page access token
- `to: string` - Facebook user ID (PSID)
- `message: string` - Reply message content
- `replyToMessageId: string` - ID of the message to reply to
- `metadata?: Record<string, any>` - Optional metadata

### Instagram Service

#### sendMessage()

```typescript
async sendMessage(options: InstagramMessageOptions): Promise<SendMessageResponse>
```

Sends a text message via Instagram.

**Parameters:**

- `accessToken: string` - Instagram access token
- `to: string` - Instagram Scoped User ID (IGSID)
- `message: string` - Message content (max 1000 characters)
- `metadata?: Record<string, any>` - Optional metadata

#### sendMedia()

```typescript
async sendMedia(options: InstagramMediaOptions): Promise<SendMessageResponse>
```

Sends media messages via Instagram.

**Parameters:**

- `accessToken: string` - Instagram access token
- `to: string` - Instagram Scoped User ID (IGSID)
- `type: "image" | "video" | "audio"` - Media type
- `mediaUrl?: string` - HTTPS URL of the media
- `mediaId?: string` - Previously uploaded media ID
- `caption?: string` - Caption (max 2200 characters)
- `metadata?: Record<string, any>` - Optional metadata

#### replyMessage()

```typescript
async replyMessage(options: InstagramReplyOptions): Promise<SendMessageResponse>
```

Replies to a specific message.

**Parameters:**

- `accessToken: string` - Instagram access token
- `to: string` - Instagram Scoped User ID (IGSID)
- `message: string` - Reply message content
- `replyToMessageId: string` - ID of the message to reply to
- `metadata?: Record<string, any>` - Optional metadata

## Types and Interfaces

### SendMessageResponse

```typescript
interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  attachmentId?: string;
  error?: {
    code: string;
    message: string;
    platform: Platform;
  };
}
```

### Platform

```typescript
type Platform = "whatsapp" | "messenger" | "instagram";
```

### TemplateComponent

```typescript
interface TemplateComponent {
  type: "header" | "body" | "footer" | "button";
  parameters?: TemplateParameter[];
}
```

### TemplateParameter

```typescript
interface TemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "document" | "video";
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: { link: string };
  document?: { link: string; filename?: string };
  video?: { link: string };
}
```

## Error Handling

### MessageMeshError

All errors thrown by the SDK are instances of `MessageMeshError`:

```typescript
class MessageMeshError extends Error {
  code: string;
  platform: Platform;
  message: string;
  originalError?: Error;
}
```

### Error Codes

Common error codes across all platforms:

- `INVALID_ACCESS_TOKEN` - Invalid or expired access token
- `INVALID_RECIPIENT` - Invalid recipient ID or phone number
- `MESSAGE_TOO_LONG` - Message exceeds platform limits
- `INVALID_MEDIA_URL` - Invalid media URL format
- `INVALID_MEDIA_TYPE` - Unsupported media type
- `MISSING_MEDIA_SOURCE` - Neither mediaUrl nor mediaId provided
- `SEND_FAILED` - General send failure
- `NETWORK_ERROR` - Network-related errors
- `TIMEOUT` - Request timeout
- `RATE_LIMIT_EXCEEDED` - Platform rate limit exceeded

### Error Handling Example

```typescript
try {
  const result = await mesh.whatsapp.sendMessage({
    accessToken: "YOUR_TOKEN",
    to: "+1234567890",
    message: "Hello!",
  });

  if (result.success) {
    console.log("Message sent:", result.messageId);
  } else {
    console.error("Failed:", result.error);
  }
} catch (error) {
  if (error instanceof MessageMeshError) {
    console.error(`Error on ${error.platform}: ${error.code} - ${error.message}`);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Webhook Support

### Webhook Verification

```typescript
// Verify webhook signature
const isValid = mesh.verifyWebhookSignature(
  payload, // Request body as string
  signature, // Signature header value
  appSecret, // Your app secret
  "sha256", // Algorithm (sha1 or sha256)
  "sha256=" // Optional prefix
);

// Handle verification challenge
const result = mesh.handleWebhookChallenge(
  mode, // Query param: hub.mode
  token, // Query param: hub.verify_token
  challenge, // Query param: hub.challenge
  verifyToken // Your verify token
);
```

### Processing Webhook Events

```typescript
// Parse webhook events
const events = mesh.parseWebhookEvents(payload, "whatsapp");

// Register event processors
mesh.registerWebhookProcessor("message_received", async (event) => {
  console.log("New message:", event.data);
  // Your processing logic here
});

// Process events
await mesh.processWebhookEvents(events);
```

### Webhook Event Types

- WhatsApp: `message_received`, `message_status`, `contact_update`
- Messenger: `message_received`, `message_delivered`, `message_read`, `postback`
- Instagram: `message_received`, `message_delivered`, `message_read`

## Platform Capabilities

### Query Platform Features

```typescript
// Get all capabilities for a platform
const capabilities = mesh.getPlatformCapabilities("whatsapp");

// Check if a platform supports a feature
const supportsMedia = mesh.platformSupportsFeature("instagram", "sendMedia");

// Get platforms that support a feature
const platformsWithTemplates = mesh.getPlatformsWithFeature("sendTemplate");

// Get maximum message length
const maxLength = mesh.getMaxMessageLength("messenger"); // 2000

// Get maximum media size (MB)
const maxSize = mesh.getMaxMediaSize("whatsapp"); // 16

// Check if file type is supported
const isSupported = mesh.isFileTypeSupported("whatsapp", "application/pdf");

// Get rate limits
const limits = mesh.getRateLimit("whatsapp");
// { default: 80, burst: 500 }
```

### Feature Comparison

```typescript
// Compare capabilities across platforms
const comparison = mesh.compareAllPlatforms();

// Get feature matrix
const matrix = mesh.getFeatureMatrix();
// {
//   sendTextMessage: { whatsapp: true, messenger: true, instagram: true },
//   sendTemplate: { whatsapp: true, messenger: true, instagram: false },
//   ...
// }

// Find best platform for features
const bestPlatform = mesh.getBestPlatformForFeatures([
  "sendTextMessage",
  "sendMedia",
  "sendTemplate",
]);
```

## Performance Monitoring

### Get Performance Metrics

```typescript
// Get metrics for a specific platform
const metrics = mesh.getPerformanceMetrics("whatsapp");
// {
//   totalRequests: 1000,
//   successfulRequests: 950,
//   failedRequests: 50,
//   averageResponseTime: 250,
//   errorRate: 0.05,
//   cacheHits: 100,
//   cacheMisses: 900,
//   cacheHitRate: 0.1
// }

// Get all platform metrics
const allMetrics = mesh.getAllPerformanceMetrics();

// Get recent requests
const recentRequests = mesh.getRecentRequests("messenger", 10);

// Get performance summary
const summary = mesh.getPerformanceSummary();

// Get performance analysis
const analysis = mesh.getPerformanceAnalysis();
// {
//   overall: "good",
//   suggestions: [...],
//   warnings: [...],
//   platformAnalysis: {...}
// }
```

### Cache Management

```typescript
// Get cache statistics
const cacheStats = mesh.getCacheStats();

// Clear response cache
mesh.clearResponseCache();

// Reset all performance metrics
mesh.resetPerformanceMetrics();
```

### Health Monitoring

```typescript
// Comprehensive health check
const health = await mesh.checkHealth();

// Check if ready
const isReady = await mesh.isReady();

// Check if alive
const isAlive = mesh.isAlive();

// Get uptime
const uptime = mesh.getUptime(); // milliseconds
const formattedUptime = mesh.getFormattedUptime(); // "2d 5h 30m 15s"

// Get system status
const status = await mesh.getSystemStatus();
```

### Logging

```typescript
// Configure logging
mesh.configureLogging({
  level: "debug", // 'debug' | 'info' | 'warn' | 'error'
  enableConsole: true,
  enableFile: false,
  maxLogSize: 10000,
  sensitiveFields: ["accessToken", "password"],
});

// Get logs
const logs = mesh.getLogs("error", "whatsapp", 50);

// Get log statistics
const logStats = mesh.getLogStats();

// Export logs
const exportedLogs = mesh.exportLogs();

// Clear logs
mesh.clearLogs();
```

## Best Practices

1. **Access Token Security**: Never hardcode access tokens. Use environment variables.
2. **Error Handling**: Always handle both sync and async errors.
3. **Rate Limiting**: Respect platform rate limits. Use the rate limit information provided.
4. **Webhook Security**: Always verify webhook signatures in production.
5. **Metadata**: Use metadata for tracking and analytics.
6. **Performance**: Monitor performance metrics and optimize based on analysis.
7. **Logging**: Configure appropriate log levels for production.

## Migration Guide

If you're migrating from direct platform APIs:

```typescript
// Before (WhatsApp API)
const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "text",
    text: { body: message },
  }),
});

// After (Message-Mesh)
const response = await mesh.whatsapp.sendMessage({
  accessToken,
  to: phoneNumber,
  message,
});
```

## Support

For issues, feature requests, or questions:

- GitHub Issues: [github.com/your-org/message-mesh/issues](https://github.com/your-org/message-mesh/issues)
- Documentation: [docs.message-mesh.io](https://docs.message-mesh.io)

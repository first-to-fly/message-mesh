# Message-Mesh 🚀

A unified messaging SDK for Node.js/Bun applications that provides a simple, consistent interface for sending messages across multiple social media platforms (WhatsApp, Messenger, Instagram).

[![Version](https://img.shields.io/badge/version-0.1.0-purple.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-orange.svg)](https://bun.sh/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-41%20passing-brightgreen.svg)](#testing)

## ✨ Features

- 🚀 **Bun-first design** with Node.js compatibility
- 📱 **Complete multi-platform support** - WhatsApp, Messenger, Instagram
- 🔒 **Type-safe** with full TypeScript support
- ⚡ **High performance** with built-in caching and optimization
- 🛠️ **Comprehensive messaging features** across all platforms
- 🔄 **Automatic retries** with exponential backoff
- 📝 **Standardized error handling** and responses
- 🔐 **Enterprise security** with input validation and sanitization
- 📊 **Production monitoring** with health checks and metrics
- 🪝 **Webhook utilities** with signature verification
- 🧪 **Thoroughly tested** with 41+ comprehensive tests
- 🌐 **Universal messaging** - send to multiple platforms simultaneously

## 📦 Installation

Install directly from GitHub using SSH:

```bash
bun add git+ssh://git@github.com/first-to-fly/message-mesh.git
# or
npm install git+ssh://git@github.com/first-to-fly/message-mesh.git
# or
pnpm add git+ssh://git@github.com/first-to-fly/message-mesh.git
```

For specific versions or branches:

```bash
bun add git+ssh://git@github.com/first-to-fly/message-mesh.git#v1.0.0
bun add git+ssh://git@github.com/first-to-fly/message-mesh.git#main
```

## 🚀 Quick Start

```typescript
import { MessageMesh } from "message-mesh";

const messageMesh = new MessageMesh({
  timeout: 30000,
  retryAttempts: 3,
});

// Send a WhatsApp message
const result = await messageMesh.whatsapp.sendMessage({
  accessToken: "your-whatsapp-access-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  message: "Hello from Message-Mesh!",
});

if (result.success) {
  console.log("Message sent!", result.messageId);
} else {
  console.error("Failed to send:", result.error);
}
```

## 🌟 Platform Support

### WhatsApp Business API ✅

- ✅ Text messages with metadata
- ✅ Template messages with parameters
- ✅ Reply to messages with context
- ✅ Emoji reactions to messages
- ✅ Media messages (image, video, audio, document)
- ✅ Standalone emoji messages
- ✅ **Template management** (create, update, delete, status checking)
- ✅ **Template approval workflow** with Meta/Facebook

### Facebook Messenger ✅

- ✅ Text messages
- ✅ Media messages (image, video, audio, file)
- ✅ Template messages (button, generic)
- ✅ Reply to messages
- ✅ **Template management** (create, update, delete, status checking)
- ✅ **Template approval workflow** with Meta/Facebook

### Instagram Messaging ✅

- ✅ Text messages
- ✅ Media messages (image, video, audio)
- ✅ Reply to messages
- ✅ **Template management** (create, update, delete, status checking)
- ✅ **Template approval workflow** with Meta/Facebook

## 📚 Platform Usage

### WhatsApp Business API

```typescript
// Send text message
await messageMesh.whatsapp.sendMessage({
  accessToken: "token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  message: "Hello World!",
  metadata: { customField: "value" },
});

// Send template message
await messageMesh.whatsapp.sendTemplate({
  accessToken: "token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  templateName: "welcome_template",
  templateLanguage: "en",
  templateComponents: [
    {
      type: "body",
      parameters: [{ type: "text", text: "John Doe" }],
    },
  ],
});

// Reply to message
await messageMesh.whatsapp.replyMessage({
  accessToken: "token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  message: "Thanks for your message!",
  replyToMessageId: "original_message_id",
});

// Send reaction
await messageMesh.whatsapp.sendReaction({
  accessToken: "token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  messageId: "message_id",
  emoji: "👍",
});

// Send media
await messageMesh.whatsapp.sendMedia({
  accessToken: "token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  mediaType: "image",
  mediaUrl: "https://example.com/image.jpg",
  caption: "Check out this image!",
});

// Send emoji
await messageMesh.whatsapp.sendEmoji({
  accessToken: "token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  emoji: "🎉",
});
```

### WhatsApp Template Management

Manage template lifecycle - create, update, delete, and check approval status:

```typescript
// Create a new template
const createResult = await messageMesh.whatsapp.createTemplate({
  accessToken: "token",
  name: "welcome_message",
  category: "MARKETING",
  language: "en",
  components: [
    {
      type: "HEADER",
      format: "TEXT",
      text: "Welcome to our service!",
    },
    {
      type: "BODY",
      text: "Hello {{1}}, thank you for joining us!",
    },
    {
      type: "FOOTER",
      text: "Best regards, Team",
    },
  ],
});

if (createResult.success) {
  console.log("Template created with ID:", createResult.templateId);
}

// Check template status
const statusResult = await messageMesh.whatsapp.getTemplate({
  accessToken: "token",
  templateId: "template_id",
});

if (statusResult.success && statusResult.template) {
  console.log("Template status:", statusResult.template.status); // PENDING, APPROVED, REJECTED
  console.log("Quality score:", statusResult.template.qualityScore?.score);

  if (statusResult.template.status === "REJECTED") {
    console.log("Rejection reason:", statusResult.template.rejectedReason);
  }
}

// List all templates
const listResult = await messageMesh.whatsapp.listTemplates({
  accessToken: "token",
  status: "APPROVED", // Only get approved templates
  category: "MARKETING",
  limit: 50,
});

if (listResult.success) {
  console.log("Found templates:", listResult.templates?.length);
  listResult.templates?.forEach((template) => {
    console.log(`- ${template.name}: ${template.status}`);
  });
}

// Update template
const updateResult = await messageMesh.whatsapp.updateTemplate({
  accessToken: "token",
  templateId: "template_id",
  category: "UTILITY", // Change category if needed
});

// Delete template
const deleteResult = await messageMesh.whatsapp.deleteTemplate({
  accessToken: "token",
  templateId: "template_id",
  name: "welcome_message",
});
```

### Facebook Messenger

```typescript
// Send text message
await messageMesh.messenger.sendMessage({
  accessToken: "page-access-token",
  to: "facebook-user-id",
  message: "Hello from Messenger!",
  metadata: { source: "crm" },
});

// Send media
await messageMesh.messenger.sendMedia({
  accessToken: "token",
  to: "user-id",
  type: "image",
  mediaUrl: "https://example.com/image.jpg",
  caption: "Check this out!",
});

// Send template
await messageMesh.messenger.sendTemplate({
  accessToken: "token",
  to: "user-id",
  templateType: "button",
  text: "What would you like to do?",
  buttons: [
    { type: "web_url", title: "Visit Website", url: "https://example.com" },
    { type: "postback", title: "Get Started", payload: "START" },
  ],
});

// Reply to message
await messageMesh.messenger.replyMessage({
  accessToken: "token",
  to: "user-id",
  message: "Thanks for your message!",
  replyToMessageId: "original_message_id",
});
```

### Messenger Template Management

Manage message templates for better customer engagement:

```typescript
// Create a new Messenger template
const createResult = await messageMesh.messenger.createTemplate({
  accessToken: "page-access-token",
  name: "order_update",
  category: "SHIPPING_UPDATE",
  components: [
    {
      type: "HEADER",
      format: "TEXT",
      text: "Order Update",
    },
    {
      type: "BODY",
      text: "Your order {{1}} has been shipped and will arrive by {{2}}.",
    },
    {
      type: "BUTTONS",
      buttons: [
        {
          type: "URL",
          text: "Track Package",
          url: "https://tracking.example.com/{{3}}",
        },
        {
          type: "QUICK_REPLY",
          text: "Contact Support",
        },
      ],
    },
  ],
});

// Check template status
const statusResult = await messageMesh.messenger.getTemplate({
  accessToken: "page-access-token",
  templateId: "template_id",
});

if (statusResult.success && statusResult.template) {
  console.log("Template status:", statusResult.template.status);
  console.log("Quality score:", statusResult.template.qualityScore?.score);
}

// List approved templates
const listResult = await messageMesh.messenger.listTemplates({
  accessToken: "page-access-token",
  status: "APPROVED",
  category: "SHIPPING_UPDATE",
});

// Update template
await messageMesh.messenger.updateTemplate({
  accessToken: "page-access-token",
  templateId: "template_id",
  category: "ACCOUNT_UPDATE",
});

// Delete template
await messageMesh.messenger.deleteTemplate({
  accessToken: "page-access-token",
  templateId: "template_id",
  name: "order_update",
});
```

### Instagram Messaging

```typescript
// Send text message
await messageMesh.instagram.sendMessage({
  accessToken: "instagram-access-token",
  to: "instagram-scoped-user-id",
  message: "Hello from Instagram!",
  metadata: { campaign: "welcome" },
});

// Send media
await messageMesh.instagram.sendMedia({
  accessToken: "token",
  to: "igsid",
  type: "image",
  mediaUrl: "https://example.com/photo.jpg",
  caption: "Beautiful photo! 📸",
});

// Reply to message
await messageMesh.instagram.replyMessage({
  accessToken: "token",
  to: "igsid",
  message: "Thanks for your comment!",
  replyToMessageId: "original_message_id",
});
```

### Instagram Template Management

Create and manage templates for Instagram business messaging:

```typescript
// Create a new Instagram template
const createResult = await messageMesh.instagram.createTemplate({
  accessToken: "instagram-access-token",
  name: "appointment_reminder",
  category: "APPOINTMENT_UPDATE",
  components: [
    {
      type: "HEADER",
      format: "TEXT",
      text: "Appointment Reminder",
    },
    {
      type: "BODY",
      text: "Hi {{1}}! This is a reminder about your appointment on {{2}} at {{3}}.",
    },
    {
      type: "BUTTONS",
      buttons: [
        {
          type: "QUICK_REPLY",
          text: "Confirm",
        },
        {
          type: "QUICK_REPLY",
          text: "Reschedule",
        },
      ],
    },
  ],
});

// Check template approval status
const statusResult = await messageMesh.instagram.getTemplate({
  accessToken: "instagram-access-token",
  templateId: "template_id",
});

if (statusResult.success && statusResult.template) {
  console.log("Template status:", statusResult.template.status);
  if (statusResult.template.status === "REJECTED") {
    console.log("Rejection reason:", statusResult.template.rejectedReason);
  }
}

// List all templates
const listResult = await messageMesh.instagram.listTemplates({
  accessToken: "instagram-access-token",
  status: "APPROVED",
  limit: 25,
});

if (listResult.success) {
  listResult.templates?.forEach((template) => {
    console.log(`${template.name}: ${template.status}`);
  });
}

// Update template category
await messageMesh.instagram.updateTemplate({
  accessToken: "instagram-access-token",
  templateId: "template_id",
  category: "RESERVATION_UPDATE",
});

// Delete template
await messageMesh.instagram.deleteTemplate({
  accessToken: "instagram-access-token",
  templateId: "template_id",
  name: "appointment_reminder",
});
```

## 🎯 Universal Messaging

Send messages across multiple platforms with a single call:

```typescript
// Send to multiple platforms at once
const results = await messageMesh.sendUniversalMessage({
  accessTokens: {
    whatsapp: "whatsapp-token",
    messenger: "messenger-token",
    instagram: "instagram-token",
  },
  phoneNumberIds: {
    whatsapp: "your-whatsapp-phone-number-id",
  },
  to: {
    whatsapp: "+1234567890",
    messenger: "facebook-user-id",
    instagram: "instagram-user-id",
  },
  message: "Hello from all platforms!",
  preferredPlatforms: ["whatsapp", "messenger"],
});

// Check results for each platform
Object.entries(results).forEach(([platform, result]) => {
  if (result.success) {
    console.log(`${platform}: Message sent (${result.messageId})`);
  } else {
    console.error(`${platform}: ${result.error?.message}`);
  }
});
```

## 🔧 Platform Capabilities

Query platform capabilities and validate messages:

```typescript
// Check what a platform supports
const whatsappCaps = messageMesh.getPlatformCapabilities("whatsapp");
console.log("Max message length:", whatsappCaps.maxMessageLength); // 4096
console.log("Supports templates:", whatsappCaps.sendTemplate); // true

// Validate message across platforms
const validation = messageMesh.validateMessageAcrossPlatforms({
  message: "Your message here",
  platforms: ["whatsapp", "messenger", "instagram"],
});

// Get platform-specific recommendations
const recommendations = messageMesh.getFormattingRecommendations("whatsapp");
console.log("Recommended practices:", recommendations.recommendedPractices);
```

## 📊 Production Monitoring

Built-in monitoring and health checks for production deployments:

```typescript
// Health check
const health = await messageMesh.checkHealth();
console.log("System status:", health.status); // "healthy" | "degraded" | "unhealthy"

// Performance metrics
const metrics = messageMesh.getPerformanceMetrics("whatsapp");
console.log("Error rate:", metrics?.errorRate);
console.log("Avg response time:", metrics?.averageResponseTime);

// System status
const status = await messageMesh.getSystemStatus();
console.log("Uptime:", status.uptime);
console.log("Version:", status.version);

// Performance analysis with recommendations
const analysis = messageMesh.getPerformanceAnalysis();
console.log("Overall:", analysis.overall);
console.log("Suggestions:", analysis.suggestions);
```

## 🔐 Security Features

Enterprise-grade security with automatic validation:

```typescript
// Configure logging with sensitive field redaction
messageMesh.configureLogging({
  level: "info",
  enableConsole: true,
  sensitiveFields: ["accessToken", "phoneNumber", "email"],
});

// All inputs are automatically:
// ✅ Sanitized to remove control characters
// ✅ Validated for length and format
// ✅ Checked for security requirements (HTTPS-only URLs)
// ✅ Protected against injection attacks
```

## 🪝 Webhook Support

Secure webhook processing with signature verification:

```typescript
// Verify webhook signature
const isValid = messageMesh.verifyWebhookSignature(payload, signature, "your-webhook-secret");

// Handle verification challenge
const challengeResult = messageMesh.handleWebhookChallenge(
  "subscribe",
  "received-token",
  "challenge-string",
  "your-verify-token"
);

// Parse webhook events
const events = messageMesh.parseWebhookEvents(webhookPayload, "whatsapp");

// Register event processors
messageMesh.registerWebhookProcessor("message_received", async (event) => {
  console.log("New message:", event.data);
});

// Process events
await messageMesh.processWebhookEvents(events);
```

## ⚙️ Configuration

```typescript
const messageMesh = new MessageMesh({
  timeout: 60000, // Request timeout in milliseconds (default: 30000)
  retryAttempts: 5, // Number of retry attempts (default: 3)
});

// Configure logging
messageMesh.configureLogging({
  level: "debug", // "debug" | "info" | "warn" | "error"
  enableConsole: true, // Enable console output
  maxLogSize: 1000, // Max log entries in memory
  sensitiveFields: ["accessToken", "secret"], // Fields to redact
});
```

## 🛠️ Error Handling

Comprehensive error handling with detailed error codes:

```typescript
const result = await messageMesh.whatsapp.sendMessage(options);

if (!result.success) {
  const { code, message, platform } = result.error;

  switch (code) {
    case "INVALID_ACCESS_TOKEN":
      console.error("Check your access token");
      break;
    case "MESSAGE_TOO_LONG":
      console.error("Message exceeds platform limits");
      break;
    case "RATE_LIMIT_EXCEEDED":
      console.error("Too many requests, slow down");
      break;
    case "NETWORK_ERROR":
      console.error("Network connectivity issue");
      break;
    case "TIMEOUT":
      console.error("Request timed out");
      break;
    default:
      console.error(`${platform} error: ${message}`);
  }
}
```

## 🧪 Testing

The SDK includes comprehensive tests covering all functionality:

- **41 test cases** covering core functionality
- **108 expect() assertions** for thorough validation
- **100% TypeScript coverage** with strict mode
- **Zero external test dependencies** using Bun's native test runner

```bash
bun test              # Run all tests (41 passing)
bun test --watch      # Run tests in watch mode
bun run typecheck     # TypeScript validation
bun run lint          # Code quality checks
```

## 🚀 Development

### Setup

```bash
git clone <repository>
cd message-mesh
bun install
```

### Scripts

```bash
bun run build        # Build the package for distribution
bun run dev          # Development mode with watch
bun run clean        # Clean dist directory
bun test             # Run test suite (41 tests, 108 assertions)
bun run typecheck    # TypeScript checking
bun run lint         # ESLint code quality
bun run lint:fix     # Auto-fix linting issues
bun run format       # Format with Prettier
bun run format:check # Check code formatting
```

### Project Structure

```
src/
├── index.ts              # Main exports
├── message-mesh.ts       # Core MessageMesh class
├── types.ts              # Type definitions
├── interfaces.ts         # Service interfaces
├── http-client.ts        # HTTP client with retry logic
├── security.ts           # Security utilities
├── performance.ts        # Performance monitoring
├── logger.ts             # Structured logging
├── health.ts             # Health monitoring
├── webhook.ts            # Webhook utilities
├── platform-capabilities.ts # Platform feature detection
└── services/
    ├── whatsapp.ts       # WhatsApp Business API
    ├── messenger.ts      # Facebook Messenger API
    └── instagram.ts      # Instagram Messaging API
```

## 📋 Platform Requirements

### WhatsApp Business API

- Business verification with Meta
- WhatsApp Business API access token
- **Phone number ID from Meta Business Manager** (required for all operations)
- Templates must be pre-approved for production

> **Important**: All WhatsApp operations require a `phoneNumberId` parameter. You can obtain this from the Meta Business Manager or by calling the `getPhoneNumbers()` method.

### Facebook Messenger

- Facebook Page with messaging enabled
- Page access token with `pages_messaging` permission
- Users must message your page first (24-hour window)

### Instagram Messaging

- Instagram Business or Creator account
- Connected to Facebook Page
- Instagram access token with messaging permissions
- Uses Instagram Scoped User IDs (IGSID)

## 📊 Performance & Bundle Size

- **Runtime**: Zero external dependencies
- **Memory Usage**: < 50MB typical usage
- **Response Cache**: Built-in with TTL
- **Rate Limiting**: Automatic retry with backoff
- **Test Coverage**: 41 tests, 108 assertions

## 🔧 Requirements

- **Bun**: 1.0.0 or higher (primary target)
- **Node.js**: 18.0.0 or higher (secondary support)
- **TypeScript**: 5.0.0 or higher

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is an internal project for CRM applications. Please contact the Internal CRM Team for contribution guidelines.

## 📚 Documentation

- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Getting Started](./docs/getting-started.md) - Quick start guide
- [Configuration Guide](./docs/configuration.md) - Configuration options
- [WhatsApp Integration](./docs/platforms/whatsapp.md) - WhatsApp-specific features
- [Messenger Integration](./docs/platforms/messenger.md) - Messenger-specific features

## 📞 Support

For issues and questions:

- Check the [documentation](./docs/)
- Review existing issues
- Create a new issue with detailed information

---

**Built with ❤️ for modern CRM applications**

> **Note**: This package requires valid access tokens from respective platform developer consoles. Refer to platform-specific documentation for setup instructions.

# Message-Mesh

A unified messaging SDK for Node.js/Bun applications that provides a simple, consistent interface for sending messages across multiple social media platforms.

## Features

- 🚀 **Bun-first design** with Node.js compatibility
- 📱 **Multi-platform support** - WhatsApp, Messenger, Instagram
- 🔒 **Type-safe** with full TypeScript support
- ⚡ **High performance** using Bun's native HTTP client
- 🛠️ **Comprehensive WhatsApp features** - text, templates, reactions, media, replies
- 🔄 **Automatic retries** with exponential backoff
- 📝 **Standardized error handling** across platforms

## Installation

```bash
bun add message-mesh
# or
npm install message-mesh
```

## Quick Start

```typescript
import { MessageMesh } from "message-mesh";

const messageMesh = new MessageMesh({
  timeout: 30000,
  retryAttempts: 3,
});

// Send a WhatsApp message
const result = await messageMesh.whatsapp.sendMessage({
  accessToken: "your-whatsapp-access-token",
  to: "1234567890",
  message: "Hello from Message-Mesh!",
});

if (result.success) {
  console.log("Message sent!", result.messageId);
} else {
  console.error("Failed to send:", result.error);
}
```

## WhatsApp Features

### Basic Text Messages

```typescript
await messageMesh.whatsapp.sendMessage({
  accessToken: "token",
  to: "1234567890",
  message: "Hello World!",
  metadata: { customField: "value" }
});
```

### Template Messages

```typescript
await messageMesh.whatsapp.sendTemplate({
  accessToken: "token",
  to: "1234567890",
  templateName: "welcome_template",
  templateLanguage: "en",
  templateComponents: [
    {
      type: "body",
      parameters: [
        { type: "text", text: "John Doe" }
      ]
    }
  ]
});
```

### Reply to Messages

```typescript
await messageMesh.whatsapp.replyMessage({
  accessToken: "token",
  to: "1234567890",
  message: "Thanks for your message!",
  replyToMessageId: "original_message_id"
});
```

### Send Reactions

```typescript
await messageMesh.whatsapp.sendReaction({
  accessToken: "token",
  to: "1234567890",
  messageId: "message_id_to_react_to",
  emoji: "👍"
});
```

### Media Messages

```typescript
await messageMesh.whatsapp.sendMedia({
  accessToken: "token",
  to: "1234567890",
  mediaType: "image",
  mediaUrl: "https://example.com/image.jpg",
  caption: "Check out this image!"
});
```

### Emoji Messages

```typescript
await messageMesh.whatsapp.sendEmoji({
  accessToken: "token",
  to: "1234567890",
  emoji: "🎉"
});
```

## Configuration

```typescript
const messageMesh = new MessageMesh({
  timeout: 60000,      // Request timeout in milliseconds (default: 30000)
  retryAttempts: 5     // Number of retry attempts (default: 3)
});
```

## Error Handling

Message-Mesh provides standardized error handling across all platforms:

```typescript
const result = await messageMesh.whatsapp.sendMessage(options);

if (!result.success) {
  const { code, message, platform } = result.error;
  
  switch (code) {
    case "INVALID_ACCESS_TOKEN":
      // Handle invalid token
      break;
    case "NETWORK_ERROR":
      // Handle network issues
      break;
    case "TIMEOUT":
      // Handle timeout
      break;
    default:
      console.error(`${platform} error: ${message}`);
  }
}
```

## Development

### Setup

```bash
bun install
```

### Scripts

```bash
bun run build        # Build the package
bun run dev          # Development mode
bun test             # Run tests
bun run typecheck    # TypeScript checking
bun run lint         # ESLint
bun run format       # Format code
```

## Development Status

### ✅ Completed (Phase 1)
- Core architecture and TypeScript definitions
- HTTP client with retry logic and error handling
- WhatsApp service with comprehensive feature set
- Full test suite with Bun test framework
- Build system and development tooling

### 🚧 In Progress (Phase 2)
- Messenger API integration
- Instagram API integration
- Advanced template parameter handling

### 📋 Planned (Phase 3)
- Performance optimizations
- Webhook verification utilities
- Advanced rate limiting
- Comprehensive documentation

## Requirements

- **Bun**: 1.0.0 or higher (primary target)
- **Node.js**: 18.0.0 or higher (secondary support)
- **TypeScript**: 5.0.0 or higher

## License

MIT

## Contributing

This is an internal project for CRM applications. Please contact the Internal CRM Team for contribution guidelines.

---

**Note**: This package is designed for internal use within CRM applications. Access tokens must be obtained separately through the respective platform developer consoles.

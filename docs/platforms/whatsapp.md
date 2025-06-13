# WhatsApp Business API Guide

Comprehensive guide for using Message-Mesh with WhatsApp Business API.

## 🚀 Overview

WhatsApp Business API integration provides the most comprehensive messaging features in Message-Mesh, including:

- ✅ Text messages with metadata
- ✅ Template messages with parameters
- ✅ Reply to messages with context
- ✅ Emoji reactions to messages
- ✅ Media messages (image, video, audio, document)
- ✅ Standalone emoji messages

## 🔑 Setup Requirements

### 1. Meta Business Account
- Verified Meta Business account
- WhatsApp Business API app in Meta for Developers
- Business phone number verification

### 2. Access Token
```typescript
const accessToken = "EAAxxxxxxxxxxxxx"; // Your WhatsApp Business API token
```

### 3. Phone Number ID
**Required for all WhatsApp operations.** Get from Meta Business Manager or use `getPhoneNumbers()` method.

```typescript
const phoneNumberId = "1234567890123456"; // Your WhatsApp Business phone number ID
```

## 📱 Basic Text Messages

Send simple text messages with optional metadata:

```typescript
const result = await messageMesh.whatsapp.sendMessage({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id", // Required
  to: "+1234567890",        // E.164 format required
  message: "Hello from WhatsApp!",
  metadata: {               // Optional metadata
    customerId: "12345",
    source: "crm",
    timestamp: Date.now()
  }
});

if (result.success) {
  console.log("Message sent! ID:", result.messageId);
} else {
  console.error("Error:", result.error?.message);
}
```

### Phone Number Format

WhatsApp requires E.164 format:
- ✅ `+1234567890` (correct)
- ❌ `1234567890` (missing +)
- ❌ `+1 (234) 567-8900` (contains formatting)

## 📋 Template Messages

Send pre-approved template messages with dynamic parameters:

### Basic Template

```typescript
await messageMesh.whatsapp.sendTemplate({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  templateName: "welcome_message",
  templateLanguage: "en",
  templateComponents: [
    {
      type: "body",
      parameters: [
        { type: "text", text: "John Doe" },
        { type: "text", text: "Premium" }
      ]
    }
  ]
});
```

### Template with Header

```typescript
await messageMesh.whatsapp.sendTemplate({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  templateName: "order_confirmation",
  templateLanguage: "en",
  templateComponents: [
    {
      type: "header",
      parameters: [
        {
          type: "image",
          image: { link: "https://example.com/product.jpg" }
        }
      ]
    },
    {
      type: "body",
      parameters: [
        { type: "text", text: "ORDER-12345" },
        { type: "text", text: "$99.99" }
      ]
    },
    {
      type: "button",
      parameters: [
        { type: "text", text: "TRACK-12345" }
      ]
    }
  ]
});
```

### Template Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Plain text | `{ type: "text", text: "John Doe" }` |
| `currency` | Currency amount | `{ type: "currency", currency: { code: "USD", amount_1000: 99900 } }` |
| `date_time` | Date/time | `{ type: "date_time", date_time: { fallback_value: "Jan 1, 2024" } }` |
| `image` | Image URL | `{ type: "image", image: { link: "https://..." } }` |
| `document` | Document URL | `{ type: "document", document: { link: "https://...", filename: "doc.pdf" } }` |
| `video` | Video URL | `{ type: "video", video: { link: "https://..." } }` |

## 💬 Reply Messages

Reply to specific messages with context:

```typescript
await messageMesh.whatsapp.replyMessage({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  message: "Thanks for your question! Let me help you with that.",
  replyToMessageId: "wamid.xxxxxxxxxxxxx", // Original message ID
  metadata: {
    ticketId: "SUPPORT-12345",
    agent: "John Doe"
  }
});
```

### Getting Message IDs

Message IDs come from:
1. **Webhook events** when users send messages
2. **API responses** when you send messages
3. **Message status updates**

## 😊 Emoji Reactions

React to messages with emojis:

```typescript
await messageMesh.whatsapp.sendReaction({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890", 
  messageId: "wamid.xxxxxxxxxxxxx", // Message to react to
  emoji: "👍"                       // Single emoji only
});
```

### Supported Emojis

Any single Unicode emoji:
- ✅ `👍`, `❤️`, `😊`, `🎉`, `👏`
- ❌ Multiple emojis: `👍👏`
- ❌ Text: `thumbs up`

### Remove Reactions

```typescript
// Send empty emoji to remove reaction
await messageMesh.whatsapp.sendReaction({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  messageId: "wamid.xxxxxxxxxxxxx",
  emoji: "" // Empty string removes reaction
});
```

## 📎 Media Messages

Send images, videos, audio, and documents:

### Image Messages

```typescript
await messageMesh.whatsapp.sendMedia({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  mediaType: "image",
  mediaUrl: "https://example.com/image.jpg",
  caption: "Check out our new product!"
});
```

### Video Messages

```typescript
await messageMesh.whatsapp.sendMedia({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890", 
  mediaType: "video",
  mediaUrl: "https://example.com/video.mp4",
  caption: "Product demonstration video"
});
```

### Audio Messages

```typescript
await messageMesh.whatsapp.sendMedia({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  mediaType: "audio",
  mediaUrl: "https://example.com/audio.mp3"
  // Note: Audio messages don't support captions
});
```

### Document Messages

```typescript
await messageMesh.whatsapp.sendMedia({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  mediaType: "document",
  mediaUrl: "https://example.com/document.pdf",
  filename: "Product_Catalog.pdf", // Optional filename
  caption: "Our latest product catalog"
});
```

### Supported Media Types

| Type | Formats | Max Size | Caption |
|------|---------|----------|---------|
| **Image** | JPEG, PNG, WebP | 5 MB | ✅ |
| **Video** | MP4, 3GPP | 16 MB | ✅ |
| **Audio** | AAC, M4A, AMR, MP3, OGG | 16 MB | ❌ |
| **Document** | PDF, DOC, DOCX, XLS, XLSX, TXT | 100 MB | ✅ |

### Media URL Requirements

- Must be HTTPS
- Publicly accessible (no authentication required)
- Valid file format
- Within size limits

## 🎭 Emoji Messages

Send standalone emoji messages:

```typescript
await messageMesh.whatsapp.sendEmoji({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  emoji: "🎉",
  metadata: {
    type: "celebration",
    event: "birthday"
  }
});
```

## 🔍 Validation & Capabilities

### Check WhatsApp Capabilities

```typescript
const caps = messageMesh.getPlatformCapabilities("whatsapp");
console.log("Max message length:", caps.maxMessageLength); // 4096
console.log("Supports templates:", caps.sendTemplate);     // true
console.log("Supports media:", caps.sendImage);            // true
console.log("Supported file types:", caps.supportedFileTypes);
```

### Validate Messages

```typescript
const validation = messageMesh.validateMessageAcrossPlatforms({
  message: "Your message content here",
  platforms: ["whatsapp"]
});

if (!validation.whatsapp.valid) {
  console.error("Validation issues:", validation.whatsapp.issues);
}
```

### Validate Access Token

```typescript
const isValid = await messageMesh.whatsapp.validateAccessToken("your-token");
console.log("Token valid:", isValid);
```

## 🚨 Error Handling

### Common Error Codes

```typescript
const result = await messageMesh.whatsapp.sendMessage(options);

if (!result.success) {
  switch (result.error?.code) {
    case "INVALID_ACCESS_TOKEN":
      // Token expired, invalid, or insufficient permissions
      console.error("Check your access token");
      break;
      
    case "INVALID_RECIPIENT":
      // Invalid phone number format
      console.error("Use E.164 format: +1234567890");
      break;
      
    case "MESSAGE_TOO_LONG":
      // Message exceeds 4096 characters
      console.error("Message too long, max 4096 characters");
      break;
      
    case "RATE_LIMIT_EXCEEDED":
      // Too many requests
      console.error("Slow down requests, rate limit exceeded");
      break;
      
    case "NETWORK_ERROR":
      // Network connectivity issues
      console.error("Network error, check connectivity");
      break;
      
    case "TIMEOUT":
      // Request timed out
      console.error("Request timed out");
      break;
      
    case "INVALID_TEMPLATE":
      // Template doesn't exist or not approved
      console.error("Template not found or not approved");
      break;
      
    case "INVALID_MEDIA":
      // Media URL issues
      console.error("Media URL invalid or inaccessible");
      break;
      
    default:
      console.error("WhatsApp error:", result.error?.message);
  }
}
```

## 🔧 Advanced Features

### Bulk Messaging

```typescript
async function sendBulkMessages(recipients: string[], message: string) {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await messageMesh.whatsapp.sendMessage({
        accessToken: "your-token",
        phoneNumberId: "your-phone-number-id",
        to: recipient,
        message,
        metadata: { batch: "bulk-001", timestamp: Date.now() }
      });
      
      results.push({ recipient, success: result.success, messageId: result.messageId });
      
      // Rate limiting: Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({ recipient, success: false, error: error.message });
    }
  }
  
  return results;
}
```

### Template Message Builder

```typescript
class WhatsAppTemplateBuilder {
  private components: any[] = [];
  
  addHeader(type: "text" | "image" | "video" | "document", content: any) {
    this.components.push({
      type: "header",
      parameters: [{ type, [type]: content }]
    });
    return this;
  }
  
  addBody(...textParameters: string[]) {
    this.components.push({
      type: "body", 
      parameters: textParameters.map(text => ({ type: "text", text }))
    });
    return this;
  }
  
  addFooter() {
    // Footer doesn't usually have parameters
    return this;
  }
  
  addButton(text: string) {
    this.components.push({
      type: "button",
      parameters: [{ type: "text", text }]
    });
    return this;
  }
  
  build() {
    return this.components;
  }
}

// Usage
const templateComponents = new WhatsAppTemplateBuilder()
  .addHeader("image", { link: "https://example.com/logo.png" })
  .addBody("John Doe", "Premium", "expires Dec 31")
  .addButton("VIEW_ACCOUNT")
  .build();

await messageMesh.whatsapp.sendTemplate({
  accessToken: "your-token",
  phoneNumberId: "your-phone-number-id",
  to: "+1234567890",
  templateName: "subscription_reminder",
  templateLanguage: "en",
  templateComponents
});
```

### Rich Media Gallery

```typescript
async function sendMediaGallery(recipient: string, mediaItems: Array<{
  type: "image" | "video";
  url: string;
  caption: string;
}>) {
  const results = [];
  
  for (const item of mediaItems) {
    const result = await messageMesh.whatsapp.sendMedia({
      accessToken: "your-token",
      phoneNumberId: "your-phone-number-id",
      to: recipient,
      mediaType: item.type,
      mediaUrl: item.url,
      caption: item.caption
    });
    
    results.push(result);
    
    // Small delay between media messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}
```

## 📊 Analytics & Monitoring

### Track Message Performance

```typescript
// Get WhatsApp-specific metrics
const metrics = messageMesh.getPerformanceMetrics("whatsapp");
console.log("WhatsApp metrics:", {
  totalRequests: metrics?.requestCount,
  errorRate: metrics?.errorRate,
  avgResponseTime: metrics?.averageResponseTime
});

// Get recent WhatsApp requests
const recentRequests = messageMesh.getRecentRequests("whatsapp", 50);
console.log("Recent WhatsApp requests:", recentRequests);
```

### Message Status Tracking

```typescript
// Track message sending
const messagesToSend = [
  { to: "+1234567890", message: "Hello User 1" },
  { to: "+1234567891", message: "Hello User 2" }
];

const messageTracker = new Map();

for (const msg of messagesToSend) {
  const result = await messageMesh.whatsapp.sendMessage({
    accessToken: "your-token",
    phoneNumberId: "your-phone-number-id",
    ...msg
  });
  
  messageTracker.set(msg.to, {
    messageId: result.messageId,
    success: result.success,
    timestamp: Date.now(),
    error: result.error
  });
}

console.log("Message tracking:", Array.from(messageTracker.entries()));
```

## 🎯 Best Practices

### 1. Rate Limiting
```typescript
// Implement rate limiting for bulk operations
const RATE_LIMIT = 80; // messages per minute
const delay = 60000 / RATE_LIMIT; // ms between messages

for (const recipient of recipients) {
  await sendMessage(recipient);
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

### 2. Error Recovery
```typescript
async function sendWithRetry(options: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await messageMesh.whatsapp.sendMessage(options);
    
    if (result.success) {
      return result;
    }
    
    // Don't retry certain errors
    if (result.error?.code === "INVALID_ACCESS_TOKEN" || 
        result.error?.code === "INVALID_RECIPIENT") {
      throw new Error(`Non-recoverable error: ${result.error.message}`);
    }
    
    // Wait before retry with exponential backoff
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts`);
}
```

### 3. Template Management
```typescript
// Keep track of approved templates
const approvedTemplates = {
  welcome: { name: "welcome_message", language: "en" },
  order_confirm: { name: "order_confirmation", language: "en" },
  support: { name: "support_response", language: "en" }
};

function sendTemplate(type: keyof typeof approvedTemplates, to: string, params: any[]) {
  const template = approvedTemplates[type];
  if (!template) {
    throw new Error(`Template ${type} not found`);
  }
  
  return messageMesh.whatsapp.sendTemplate({
    accessToken: "your-token",
    phoneNumberId: "your-phone-number-id",
    to,
    templateName: template.name,
    templateLanguage: template.language,
    templateComponents: [{ type: "body", parameters: params }]
  });
}
```

---

**Next**: [Facebook Messenger Guide](./messenger.md)
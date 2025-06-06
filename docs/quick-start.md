# Quick Start Guide

Get up and running with Message-Mesh in under 5 minutes.

## 🚀 5-Minute Setup

### Step 1: Install
```bash
bun add message-mesh
```

### Step 2: Initialize
```typescript
import { MessageMesh } from "message-mesh";

const messageMesh = new MessageMesh();
```

### Step 3: Send a Message
```typescript
// WhatsApp
const result = await messageMesh.whatsapp.sendMessage({
  accessToken: "your-token",
  to: "+1234567890",
  message: "Hello World!"
});

console.log(result.success ? "Sent!" : "Failed:", result.error?.message);
```

## 📱 Platform Examples

### WhatsApp Business API

```typescript
// Text message
await messageMesh.whatsapp.sendMessage({
  accessToken: "EAAxxxxx",
  to: "+1234567890",
  message: "Welcome to our service!"
});

// Template message
await messageMesh.whatsapp.sendTemplate({
  accessToken: "EAAxxxxx",
  to: "+1234567890",
  templateName: "welcome_message",
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

// Media message
await messageMesh.whatsapp.sendMedia({
  accessToken: "EAAxxxxx",
  to: "+1234567890",
  mediaType: "image",
  mediaUrl: "https://example.com/image.jpg",
  caption: "Check this out!"
});
```

### Facebook Messenger

```typescript
// Text message
await messageMesh.messenger.sendMessage({
  accessToken: "page-token",
  to: "facebook-user-id",
  message: "Hello from Messenger!"
});
```

### Instagram Messaging

```typescript
// Text message
await messageMesh.instagram.sendMessage({
  accessToken: "instagram-token",
  to: "instagram-scoped-user-id",
  message: "Hello from Instagram!"
});
```

## 🎯 Universal Messaging

Send to multiple platforms at once:

```typescript
const results = await messageMesh.sendUniversalMessage({
  accessTokens: {
    whatsapp: "whatsapp-token",
    messenger: "messenger-token",
    instagram: "instagram-token"
  },
  to: {
    whatsapp: "+1234567890",
    messenger: "facebook-user-id",
    instagram: "instagram-user-id"
  },
  message: "Multi-platform announcement!"
});

// Check results
Object.entries(results).forEach(([platform, result]) => {
  console.log(`${platform}:`, result.success ? "✅" : "❌");
});
```

## 🔧 Essential Configuration

```typescript
const messageMesh = new MessageMesh({
  timeout: 30000,      // 30 second timeout
  retryAttempts: 3     // 3 retry attempts
});

// Configure logging
messageMesh.configureLogging({
  level: "info",
  enableConsole: true,
  sensitiveFields: ["accessToken", "phoneNumber"]
});
```

## 🛡️ Error Handling

```typescript
const result = await messageMesh.whatsapp.sendMessage(options);

if (!result.success) {
  const { code, message, platform } = result.error;
  
  switch (code) {
    case "INVALID_ACCESS_TOKEN":
      console.error("Token expired or invalid");
      break;
    case "MESSAGE_TOO_LONG":
      console.error("Message exceeds platform limit");
      break;
    case "RATE_LIMIT_EXCEEDED":
      console.error("Slow down your requests");
      break;
    default:
      console.error(`${platform} error: ${message}`);
  }
}
```

## 📊 Monitoring

```typescript
// Health check
const health = await messageMesh.checkHealth();
console.log("Status:", health.status);

// Performance metrics
const metrics = messageMesh.getPerformanceMetrics("whatsapp");
console.log("Error rate:", metrics?.errorRate);
console.log("Avg response time:", metrics?.averageResponseTime);

// System status
const status = await messageMesh.getSystemStatus();
console.log("Uptime:", status.uptime);
console.log("Version:", status.version);
```

## 🪝 Webhook Handling

```typescript
// Verify webhook signature
const isValid = messageMesh.verifyWebhookSignature(
  payload,
  signature,
  "your-webhook-secret"
);

if (isValid) {
  // Parse events
  const events = messageMesh.parseWebhookEvents(payload, "whatsapp");
  
  // Process events
  await messageMesh.processWebhookEvents(events);
}
```

## 🔍 Validation & Capabilities

```typescript
// Validate message across platforms
const validation = messageMesh.validateMessageAcrossPlatforms({
  message: "Your message here",
  platforms: ["whatsapp", "messenger", "instagram"]
});

// Check platform capabilities
const caps = messageMesh.getPlatformCapabilities("whatsapp");
console.log("Max length:", caps.maxMessageLength);
console.log("Supports templates:", caps.sendTemplate);
console.log("Supported file types:", caps.supportedFileTypes);
```

## 🎨 Complete Example: CRM Integration

```typescript
import { MessageMesh } from "message-mesh";

class CRMMessaging {
  private messageMesh: MessageMesh;
  
  constructor() {
    this.messageMesh = new MessageMesh({
      timeout: 60000,
      retryAttempts: 3
    });
    
    // Configure logging for production
    this.messageMesh.configureLogging({
      level: "info",
      enableConsole: true,
      sensitiveFields: ["accessToken", "phoneNumber", "email"]
    });
  }
  
  async sendWelcomeMessage(customerData: {
    phone: string;
    email: string;
    name: string;
    preferredPlatform: "whatsapp" | "messenger" | "instagram";
  }) {
    const { phone, name, preferredPlatform } = customerData;
    
    // Validate message first
    const message = `Welcome ${name}! Thanks for joining our service.`;
    const validation = this.messageMesh.validateMessageAcrossPlatforms({
      message,
      platforms: [preferredPlatform]
    });
    
    if (!validation[preferredPlatform].valid) {
      throw new Error(`Message validation failed: ${validation[preferredPlatform].issues.join(", ")}`);
    }
    
    // Send based on preferred platform
    switch (preferredPlatform) {
      case "whatsapp":
        return await this.messageMesh.whatsapp.sendMessage({
          accessToken: process.env.WHATSAPP_TOKEN!,
          to: phone,
          message,
          metadata: { customer_id: customerData.email, type: "welcome" }
        });
        
      case "messenger":
        return await this.messageMesh.messenger.sendMessage({
          accessToken: process.env.MESSENGER_TOKEN!,
          to: customerData.email, // Assuming email maps to FB user ID
          message,
          metadata: { customer_id: customerData.email, type: "welcome" }
        });
        
      case "instagram":
        return await this.messageMesh.instagram.sendMessage({
          accessToken: process.env.INSTAGRAM_TOKEN!,
          to: customerData.email, // Assuming email maps to IG user ID
          message,
          metadata: { customer_id: customerData.email, type: "welcome" }
        });
    }
  }
  
  async sendBulkAnnouncement(announcement: string, recipients: Array<{
    whatsapp?: string;
    messenger?: string;
    instagram?: string;
  }>) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.messageMesh.sendUniversalMessage({
        accessTokens: {
          whatsapp: process.env.WHATSAPP_TOKEN!,
          messenger: process.env.MESSENGER_TOKEN!,
          instagram: process.env.INSTAGRAM_TOKEN!
        },
        to: recipient,
        message: announcement
      });
      
      results.push(result);
    }
    
    return results;
  }
  
  async getSystemHealth() {
    return await this.messageMesh.checkHealth();
  }
}

// Usage
const crm = new CRMMessaging();

// Send welcome message
await crm.sendWelcomeMessage({
  phone: "+1234567890",
  email: "customer@example.com",
  name: "John Doe",
  preferredPlatform: "whatsapp"
});

// Check system health
const health = await crm.getSystemHealth();
console.log("CRM messaging health:", health.status);
```

## 📚 What's Next?

You're now ready to integrate Message-Mesh into your application! Explore these guides for more advanced features:

- [Platform-Specific Features](./platforms/)
- [Production Deployment](./advanced/production.md)
- [Security Best Practices](./features/security.md)
- [Performance Optimization](./features/performance.md)

---

**Next**: [Configuration Options](./configuration.md)
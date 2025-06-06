# Getting Started with Message-Mesh

This guide will help you get up and running with Message-Mesh quickly.

## 📦 Installation

Message-Mesh supports multiple package managers and runtime environments:

### Using Bun (Recommended)
```bash
bun add message-mesh
```

### Using npm
```bash
npm install message-mesh
```

### Using pnpm
```bash
pnpm add message-mesh
```

## 🔧 Requirements

- **Bun**: 1.0.0 or higher (primary target)
- **Node.js**: 18.0.0 or higher (secondary support)
- **TypeScript**: 5.0.0 or higher (recommended)

## 🚀 Basic Setup

### 1. Import and Initialize

```typescript
import { MessageMesh } from "message-mesh";

// Create instance with default configuration
const messageMesh = new MessageMesh();

// Or with custom configuration
const messageMesh = new MessageMesh({
  timeout: 60000,      // 60 seconds
  retryAttempts: 5     // 5 retry attempts
});
```

### 2. Platform Tokens

Before sending messages, you'll need access tokens for each platform:

#### WhatsApp Business API
```typescript
const whatsappToken = "your-whatsapp-business-api-token";
```

#### Facebook Messenger
```typescript
const messengerToken = "your-facebook-page-access-token";
```

#### Instagram Messaging
```typescript
const instagramToken = "your-instagram-business-access-token";
```

### 3. Send Your First Message

```typescript
// WhatsApp example
const result = await messageMesh.whatsapp.sendMessage({
  accessToken: whatsappToken,
  to: "+1234567890",  // E.164 format
  message: "Hello from Message-Mesh!"
});

if (result.success) {
  console.log("Message sent! ID:", result.messageId);
} else {
  console.error("Error:", result.error?.message);
}
```

## 🔐 Platform Setup

### WhatsApp Business API Setup

1. **Meta Business Account**: Create or use existing Meta Business account
2. **WhatsApp Business App**: Create app in Meta for Developers
3. **Phone Number**: Add and verify business phone number
4. **Access Token**: Generate permanent access token
5. **Webhook**: Configure webhook URL for receiving messages

**Required Permissions:**
- `whatsapp_business_messaging`
- `whatsapp_business_management`

### Facebook Messenger Setup

1. **Facebook Page**: Create business Facebook Page
2. **Facebook App**: Create app with Messenger product
3. **Page Access Token**: Generate token with messaging permissions
4. **Webhook**: Set up webhook for message events

**Required Permissions:**
- `pages_messaging`
- `pages_manage_metadata`

### Instagram Messaging Setup

1. **Instagram Business Account**: Convert to business account
2. **Connect to Facebook Page**: Link Instagram to Facebook Page
3. **Facebook App**: Add Instagram messaging to existing app
4. **Access Token**: Use same token as connected Facebook Page

**Requirements:**
- Instagram Professional account (Business or Creator)
- Connected to Facebook Page
- App approved for Instagram messaging

## 🧪 Testing Your Setup

### 1. Validate Tokens

```typescript
// Test WhatsApp token
const isWhatsAppValid = await messageMesh.whatsapp.validateAccessToken(whatsappToken);
console.log("WhatsApp token valid:", isWhatsAppValid);

// Test Messenger token
const isMessengerValid = await messageMesh.messenger.validateAccessToken(messengerToken);
console.log("Messenger token valid:", isMessengerValid);

// Test Instagram token
const isInstagramValid = await messageMesh.instagram.validateAccessToken(instagramToken);
console.log("Instagram token valid:", isInstagramValid);
```

### 2. Check Platform Capabilities

```typescript
// Check what each platform supports
const whatsappCaps = messageMesh.getPlatformCapabilities("whatsapp");
console.log("WhatsApp max message length:", whatsappCaps.maxMessageLength);
console.log("WhatsApp supports templates:", whatsappCaps.sendTemplate);

const messengerCaps = messageMesh.getPlatformCapabilities("messenger");
console.log("Messenger max message length:", messengerCaps.maxMessageLength);

const instagramCaps = messageMesh.getPlatformCapabilities("instagram");
console.log("Instagram max message length:", instagramCaps.maxMessageLength);
```

### 3. Health Check

```typescript
// Verify system health
const health = await messageMesh.checkHealth();
console.log("System status:", health.status);
console.log("All checks:", health.checks.map(c => `${c.name}: ${c.status}`));
```

## 🔍 Common Issues

### Token Validation Fails
- Verify token hasn't expired
- Check token permissions/scopes
- Ensure app is approved for production

### Message Sending Fails
- Verify recipient format (E.164 for WhatsApp, User IDs for others)
- Check message length limits
- Ensure recipient has contacted you first (Messenger/Instagram)

### Network Errors
- Check internet connectivity
- Verify firewall/proxy settings
- Monitor rate limits

## 📚 Next Steps

Now that you have Message-Mesh set up, explore these guides:

- [Configuration Options](./configuration.md)
- [Platform-Specific Guides](./platforms/)
- [Universal Messaging](./universal-messaging.md)
- [Security Features](./features/security.md)
- [Production Deployment](./advanced/production.md)

## 💡 Tips

1. **Development vs Production**: Use sandbox tokens during development
2. **Rate Limits**: Implement proper rate limiting in your application
3. **Error Handling**: Always check the `success` field in responses
4. **Logging**: Enable logging to debug issues
5. **Monitoring**: Use built-in health checks in production

---

**Next**: [Configuration](./configuration.md)
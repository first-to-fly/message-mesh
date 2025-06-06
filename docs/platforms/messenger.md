# Facebook Messenger Guide

Complete guide for integrating Facebook Messenger with Message-Mesh.

## 🚀 Overview

Facebook Messenger integration provides essential messaging capabilities:

- ✅ Text messages with metadata
- 🚧 Rich media messages (planned)
- 🚧 Template messages (planned)
- 🚧 Quick replies (planned)

## 🔑 Setup Requirements

### 1. Facebook Page
- Business Facebook Page
- Page must have messaging enabled
- Page must be published (not in draft mode)

### 2. Facebook App
- Facebook app with Messenger product added
- App must be approved for production messaging
- Webhook configured for message events

### 3. Access Token
```typescript
const pageAccessToken = "EAAxxxxxxxxxxxxxx"; // Your Page Access Token
```

### 4. Required Permissions
- `pages_messaging` - Send messages to users
- `pages_manage_metadata` - Manage page settings

## 📱 Basic Text Messages

Send text messages to users who have messaged your page:

```typescript
const result = await messageMesh.messenger.sendMessage({
  accessToken: "your-page-access-token",
  to: "facebook-user-id",           // Facebook User ID (PSID)
  message: "Hello from Messenger!",
  metadata: {                       // Optional metadata
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

### User ID Format

Messenger uses Facebook User IDs (Page-Scoped IDs - PSIDs):
- ✅ `1234567890123456` (numeric string)
- ❌ `user@email.com` (email addresses)
- ❌ `+1234567890` (phone numbers)

### 24-Hour Messaging Window

**Important**: You can only send messages to users who have messaged your page within the last 24 hours, unless using approved message tags.

## 🔍 Validation & Capabilities

### Check Messenger Capabilities

```typescript
const caps = messageMesh.getPlatformCapabilities("messenger");
console.log("Max message length:", caps.maxMessageLength); // 2000
console.log("Supports templates:", caps.sendTemplate);     // false (not yet implemented)
console.log("Supports media:", caps.sendImage);            // false (not yet implemented)
console.log("Supported file types:", caps.supportedFileTypes);
```

### Validate Messages

```typescript
const validation = messageMesh.validateMessageAcrossPlatforms({
  message: "Your message content here",
  platforms: ["messenger"]
});

if (!validation.messenger.valid) {
  console.error("Validation issues:", validation.messenger.issues);
}
```

### Validate Access Token

```typescript
const isValid = await messageMesh.messenger.validateAccessToken("your-token");
console.log("Token valid:", isValid);
```

## 🚨 Error Handling

### Common Error Codes

```typescript
const result = await messageMesh.messenger.sendMessage(options);

if (!result.success) {
  switch (result.error?.code) {
    case "INVALID_ACCESS_TOKEN":
      // Token expired, invalid, or insufficient permissions
      console.error("Check your page access token");
      break;
      
    case "INVALID_RECIPIENT":
      // Invalid user ID format
      console.error("User ID must be numeric Facebook PSID");
      break;
      
    case "MESSAGE_TOO_LONG":
      // Message exceeds 2000 characters
      console.error("Message too long, max 2000 characters");
      break;
      
    case "UNAUTHORIZED":
      // Token doesn't have required permissions
      console.error("Token needs pages_messaging permission");
      break;
      
    case "FORBIDDEN":
      // User hasn't messaged page or 24-hour window expired
      console.error("User outside 24-hour messaging window");
      break;
      
    case "USER_NOT_FOUND":
      // User ID doesn't exist or not reachable
      console.error("User not found or not reachable");
      break;
      
    case "RATE_LIMIT_EXCEEDED":
      // Too many requests
      console.error("Rate limit exceeded, slow down requests");
      break;
      
    case "SERVER_ERROR":
      // Messenger platform issues
      console.error("Messenger platform temporarily unavailable");
      break;
      
    default:
      console.error("Messenger error:", result.error?.message);
  }
}
```

## 🔧 Advanced Configuration

### Message Tags (Coming Soon)

For messaging outside the 24-hour window, you'll need approved message tags:

```typescript
// Future implementation
await messageMesh.messenger.sendMessage({
  accessToken: "your-token",
  to: "user-id",
  message: "Your order has been shipped!",
  messageTag: "SHIPPING_UPDATE" // Requires Facebook approval
});
```

### Common Message Tags
- `SHIPPING_UPDATE` - Shipping notifications
- `RESERVATION_UPDATE` - Reservation changes
- `ISSUE_RESOLUTION` - Customer service updates
- `APPOINTMENT_UPDATE` - Appointment changes
- `PAYMENT_UPDATE` - Payment notifications

## 📊 Messenger API Specifics

### Page Token vs User Token

Always use Page Access Tokens, not User Access Tokens:

```typescript
// ✅ Correct: Page Access Token
const pageToken = "EAAxxxxx"; // From Page settings

// ❌ Wrong: User Access Token  
const userToken = "EAAyyyyy"; // From user login
```

### Getting Page ID

Extract Page ID from your access token:

```typescript
// Page ID is extracted automatically by Message-Mesh
// But you can also get it manually:
const response = await fetch(`https://graph.facebook.com/me?access_token=${pageToken}`);
const data = await response.json();
console.log("Page ID:", data.id);
```

## 🎯 Best Practices

### 1. User Consent
```typescript
// Always ensure users have opted in to receive messages
function canSendMessage(userId: string, lastMessageTime: number) {
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  return (now - lastMessageTime) < twentyFourHours;
}

// Check before sending
if (canSendMessage(userId, lastMessage.timestamp)) {
  await messageMesh.messenger.sendMessage(options);
} else {
  console.log("User outside 24-hour window, need message tag");
}
```

### 2. Rate Limiting
```typescript
// Messenger rate limits (approximate)
const RATE_LIMIT = 200; // messages per minute
const delay = 60000 / RATE_LIMIT;

async function sendBulkMessages(messages: any[]) {
  for (const msg of messages) {
    await messageMesh.messenger.sendMessage(msg);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 3. Error Recovery
```typescript
async function sendWithRetry(options: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await messageMesh.messenger.sendMessage(options);
    
    if (result.success) {
      return result;
    }
    
    // Don't retry permission or user errors
    if (result.error?.code === "FORBIDDEN" || 
        result.error?.code === "USER_NOT_FOUND") {
      throw new Error(`Non-recoverable error: ${result.error.message}`);
    }
    
    // Exponential backoff for retries
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts`);
}
```

## 🔮 Upcoming Features

### Rich Media Messages (Planned)

```typescript
// Coming soon
await messageMesh.messenger.sendMedia({
  accessToken: "your-token",
  to: "user-id",
  mediaType: "image",
  mediaUrl: "https://example.com/image.jpg"
});
```

### Template Messages (Planned)

```typescript
// Coming soon
await messageMesh.messenger.sendTemplate({
  accessToken: "your-token",
  to: "user-id",
  templateType: "generic",
  elements: [
    {
      title: "Product Name",
      subtitle: "Product description",
      imageUrl: "https://example.com/image.jpg",
      buttons: [
        { type: "web_url", title: "View", url: "https://example.com/product" }
      ]
    }
  ]
});
```

### Quick Replies (Planned)

```typescript
// Coming soon
await messageMesh.messenger.sendMessage({
  accessToken: "your-token",
  to: "user-id",
  message: "What would you like to do?",
  quickReplies: [
    { title: "View Orders", payload: "VIEW_ORDERS" },
    { title: "Contact Support", payload: "CONTACT_SUPPORT" },
    { title: "Update Profile", payload: "UPDATE_PROFILE" }
  ]
});
```

## 📋 Facebook App Configuration

### Webhook Setup

Configure your webhook in Facebook App settings:

```typescript
// Webhook endpoint example
app.post('/webhook/messenger', (req, res) => {
  const body = req.body;
  
  // Verify webhook
  if (body.object === 'page') {
    // Parse Messenger events
    const events = messageMesh.parseWebhookEvents(body, "messenger");
    
    // Process events
    messageMesh.processWebhookEvents(events);
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Webhook verification
app.get('/webhook/messenger', (req, res) => {
  const result = messageMesh.handleWebhookChallenge(
    req.query['hub.mode'],
    req.query['hub.verify_token'],
    req.query['hub.challenge'],
    process.env.MESSENGER_VERIFY_TOKEN
  );
  
  if (result.isValid) {
    res.status(200).send(result.challenge);
  } else {
    res.sendStatus(403);
  }
});
```

### Required Webhook Fields

Subscribe to these webhook fields:
- `messages` - Receive incoming messages
- `messaging_postbacks` - Button clicks
- `messaging_deliveries` - Delivery confirmations
- `messaging_reads` - Read receipts

## 📊 Analytics & Monitoring

### Track Messenger Performance

```typescript
// Get Messenger-specific metrics
const metrics = messageMesh.getPerformanceMetrics("messenger");
console.log("Messenger metrics:", {
  totalRequests: metrics?.requestCount,
  errorRate: metrics?.errorRate,
  avgResponseTime: metrics?.averageResponseTime
});

// Monitor for specific error patterns
const recentRequests = messageMesh.getRecentRequests("messenger", 50);
const permissionErrors = recentRequests.filter(r => 
  !r.success && r.error?.includes("FORBIDDEN")
);

if (permissionErrors.length > 5) {
  console.warn("High number of permission errors - check 24-hour window compliance");
}
```

### Message Delivery Tracking

```typescript
// Track message delivery status
const messageTracker = new Map();

async function sendTrackedMessage(to: string, message: string) {
  const result = await messageMesh.messenger.sendMessage({
    accessToken: "your-token",
    to,
    message,
    metadata: { trackingId: `msg_${Date.now()}` }
  });
  
  messageTracker.set(result.messageId, {
    to,
    message,
    sentAt: Date.now(),
    delivered: false,
    read: false
  });
  
  return result;
}

// Update delivery status from webhooks
function updateDeliveryStatus(messageId: string, status: 'delivered' | 'read') {
  const tracked = messageTracker.get(messageId);
  if (tracked) {
    tracked[status] = true;
    tracked[`${status}At`] = Date.now();
  }
}
```

## 🔐 Security Considerations

### Token Security
```typescript
// Store tokens securely
const pageToken = process.env.MESSENGER_PAGE_TOKEN; // Use environment variables
const appSecret = process.env.MESSENGER_APP_SECRET; // For webhook verification

// Verify webhook signatures
const isValidSignature = messageMesh.verifyWebhookSignature(
  req.body,
  req.headers['x-hub-signature-256'],
  appSecret
);

if (!isValidSignature) {
  res.sendStatus(403);
  return;
}
```

### User Privacy
```typescript
// Respect user privacy in logs
messageMesh.configureLogging({
  level: "info",
  sensitiveFields: [
    "accessToken",
    "userId",
    "messageContent",
    "personalInfo"
  ]
});
```

---

**Next**: [Instagram Messaging Guide](./instagram.md)
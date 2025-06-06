# Configuration

Comprehensive configuration options for Message-Mesh SDK.

## 🔧 Basic Configuration

### Constructor Options

```typescript
import { MessageMesh } from "message-mesh";

const messageMesh = new MessageMesh({
  timeout: 30000,      // Request timeout in milliseconds
  retryAttempts: 3     // Number of retry attempts
});
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `30000` | Request timeout in milliseconds (max: 600000) |
| `retryAttempts` | `number` | `3` | Number of retry attempts for failed requests |

### Default Configuration

```typescript
{
  timeout: 30000,        // 30 seconds
  retryAttempts: 3       // 3 retry attempts
}
```

## 📝 Logging Configuration

Configure structured logging with security features:

```typescript
messageMesh.configureLogging({
  level: "info",                           // Log level
  enableConsole: true,                     // Console output
  enableFile: false,                       // File output (future)
  maxLogSize: 1000,                        // Max log entries in memory
  sensitiveFields: ["accessToken", "secret"] // Fields to redact
});
```

### Logging Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | `"debug" \| "info" \| "warn" \| "error"` | `"info"` | Minimum log level to record |
| `enableConsole` | `boolean` | `true` | Enable console output |
| `enableFile` | `boolean` | `false` | Enable file output (planned feature) |
| `maxLogSize` | `number` | `1000` | Maximum log entries to keep in memory |
| `sensitiveFields` | `string[]` | `["accessToken", "password", "secret", "key", "token"]` | Fields to redact in logs |

### Log Levels

```typescript
// Debug: Detailed information for debugging
messageMesh.configureLogging({ level: "debug" });

// Info: General information about operations
messageMesh.configureLogging({ level: "info" });

// Warn: Warning messages about potential issues
messageMesh.configureLogging({ level: "warn" });

// Error: Error messages only
messageMesh.configureLogging({ level: "error" });
```

## 🔐 Security Configuration

### Automatic Security Features

Message-Mesh automatically applies security best practices:

- **HTTPS Enforcement**: All API calls must use HTTPS
- **Input Sanitization**: Control characters and dangerous content removed
- **Header Sanitization**: Dangerous headers filtered out
- **Access Token Validation**: Format and security checks
- **URL Validation**: Secure URL format enforcement

### Security Headers

Automatically applied security headers:

```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache"
}
```

### Input Validation Limits

| Input Type | Maximum Length | Validation |
|------------|----------------|------------|
| Message Content | 4096 characters | Control character removal |
| Access Token | 512 characters | Alphanumeric + specific chars |
| User ID | 64 characters | Platform-specific format |
| Metadata | 8192 bytes (serialized) | Recursive sanitization |

## 📊 Performance Configuration

### HTTP Client Settings

The HTTP client automatically configures:

```typescript
{
  timeout: 30000,              // Request timeout
  retryAttempts: 3,            // Retry attempts
  userAgent: "message-mesh/0.1.0",
  retryDelay: "exponential",   // Exponential backoff
  maxRetryDelay: 10000        // Maximum 10 second delay
}
```

### Cache Configuration

Built-in response caching:

```typescript
{
  maxSize: 100,               // Max cached items
  defaultTTL: 300000,         // 5 minutes default TTL
  cleanupInterval: 60000      // 1 minute cleanup
}
```

### Performance Monitoring

Automatic performance tracking:

```typescript
{
  maxRequestHistory: 1000,    // Max requests to track
  metricsRetention: 3600000   // 1 hour metrics retention
}
```

## 🏥 Health Check Configuration

### Default Health Checks

Automatically registered health checks:

1. **Memory Usage**: System memory monitoring
2. **Performance Metrics**: Error rates and response times
3. **Error Logs**: Recent error frequency
4. **Platform APIs**: Basic connectivity checks

### Custom Health Checks

Register custom health checks:

```typescript
messageMesh.registerHealthCheck("database", async () => {
  try {
    await checkDatabaseConnection();
    return {
      status: "healthy",
      message: "Database connection successful"
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Database connection failed",
      metadata: { error: error.message }
    };
  }
});
```

### Health Check Thresholds

Default health check thresholds:

```typescript
{
  memory: {
    warningThreshold: 75,     // 75% memory usage
    criticalThreshold: 90     // 90% memory usage
  },
  performance: {
    errorRateWarning: 0.05,   // 5% error rate
    errorRateCritical: 0.1,   // 10% error rate
    responseTimeWarning: 2000, // 2 second response time
    responseTimeCritical: 5000 // 5 second response time
  },
  errorLogs: {
    recentErrorThreshold: 10  // 10 errors in last hour
  }
}
```

## 🌍 Environment Configuration

### Environment Variables

Common environment variable patterns:

```bash
# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# Messenger
MESSENGER_PAGE_ACCESS_TOKEN=your_page_token
MESSENGER_APP_SECRET=your_app_secret
MESSENGER_VERIFY_TOKEN=your_verify_token

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_APP_SECRET=your_app_secret

# General
MESSAGE_MESH_LOG_LEVEL=info
MESSAGE_MESH_TIMEOUT=30000
MESSAGE_MESH_RETRY_ATTEMPTS=3
```

### Development vs Production

#### Development Configuration

```typescript
const messageMesh = new MessageMesh({
  timeout: 10000,      // Shorter timeout for development
  retryAttempts: 1     // Fewer retries for faster feedback
});

messageMesh.configureLogging({
  level: "debug",      // Verbose logging
  enableConsole: true  // Console output for debugging
});
```

#### Production Configuration

```typescript
const messageMesh = new MessageMesh({
  timeout: 60000,      // Longer timeout for production
  retryAttempts: 5     // More retries for reliability
});

messageMesh.configureLogging({
  level: "warn",       // Less verbose logging
  enableConsole: false, // Structured logging to files
  maxLogSize: 5000,    // Larger log buffer
  sensitiveFields: [   // Comprehensive field redaction
    "accessToken",
    "secret",
    "password",
    "phoneNumber",
    "email",
    "userId"
  ]
});
```

## 🎯 Platform-Specific Configuration

### WhatsApp Configuration

```typescript
// Phone number format validation
const whatsappConfig = {
  phoneNumberFormat: /^\+\d{1,15}$/,     // E.164 format
  maxMessageLength: 4096,                // Character limit
  templateRequired: true,                // For marketing messages
  supportedMediaTypes: [
    "image/jpeg", "image/png", "image/webp",
    "video/mp4", "video/3gpp",
    "audio/aac", "audio/mp4", "audio/mpeg",
    "application/pdf"
  ]
};
```

### Messenger Configuration

```typescript
// Messenger-specific settings
const messengerConfig = {
  userIdFormat: /^\d+$/,                 // Numeric user IDs
  maxMessageLength: 2000,                // Character limit
  messagingWindow: 24 * 60 * 60 * 1000,  // 24 hour window
  supportedMediaTypes: [
    "image/jpeg", "image/png", "image/gif",
    "video/mp4", "audio/mp3"
  ]
};
```

### Instagram Configuration

```typescript
// Instagram-specific settings
const instagramConfig = {
  userIdFormat: /^\d+$/,                 // Instagram Scoped User ID
  maxMessageLength: 1000,                // Character limit
  businessAccountRequired: true,         // Business account only
  supportedMediaTypes: [
    "image/jpeg", "image/png",
    "video/mp4"
  ]
};
```

## 📋 Configuration Validation

### Validate Configuration

```typescript
// Get current configuration
const config = messageMesh.getConfig();
console.log("Current config:", config);

// Validate platform capabilities
const whatsappCaps = messageMesh.getPlatformCapabilities("whatsapp");
console.log("WhatsApp capabilities:", whatsappCaps);

// Check system status
const status = await messageMesh.getSystemStatus();
console.log("System configuration:", {
  version: status.version,
  uptime: status.uptime,
  health: status.health.status
});
```

### Configuration Best Practices

1. **Timeouts**: Set appropriate timeouts for your use case
2. **Retries**: Balance reliability vs. performance
3. **Logging**: Use appropriate log levels for each environment
4. **Security**: Always redact sensitive fields in logs
5. **Monitoring**: Enable health checks in production
6. **Environment**: Use environment variables for tokens
7. **Validation**: Validate configuration at startup

### Example: Production Configuration Class

```typescript
class MessageMeshConfig {
  static create(env: "development" | "staging" | "production") {
    const baseConfig = {
      timeout: env === "development" ? 10000 : 60000,
      retryAttempts: env === "development" ? 1 : 5
    };

    const messageMesh = new MessageMesh(baseConfig);

    // Configure logging based on environment
    messageMesh.configureLogging({
      level: env === "development" ? "debug" : "warn",
      enableConsole: env === "development",
      maxLogSize: env === "production" ? 5000 : 1000,
      sensitiveFields: [
        "accessToken", "secret", "password",
        "phoneNumber", "email", "userId",
        ...(env === "production" ? ["metadata"] : [])
      ]
    });

    // Register environment-specific health checks
    if (env === "production") {
      messageMesh.registerHealthCheck("external_api", async () => {
        // Custom production health check
        return { status: "healthy", message: "External API responsive" };
      });
    }

    return messageMesh;
  }
}

// Usage
const messageMesh = MessageMeshConfig.create("production");
```

---

**Next**: [Platform Guides](./platforms/)
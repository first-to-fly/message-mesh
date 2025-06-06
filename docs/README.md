# Message-Mesh Documentation

Welcome to the comprehensive documentation for Message-Mesh, a unified messaging SDK for Node.js/Bun applications.

## 📚 Table of Contents

### Getting Started
- [Installation & Setup](./getting-started.md)
- [Quick Start Guide](./quick-start.md)
- [Configuration](./configuration.md)

### Platform Guides
- [WhatsApp Business API](./platforms/whatsapp.md)
- [Facebook Messenger](./platforms/messenger.md)
- [Instagram Messaging](./platforms/instagram.md)
- [Universal Messaging](./universal-messaging.md)

### Features
- [Security & Validation](./features/security.md)
- [Performance Monitoring](./features/performance.md)
- [Health Checks](./features/health.md)
- [Logging](./features/logging.md)
- [Webhook Handling](./features/webhooks.md)

### Advanced Topics
- [Platform Capabilities](./advanced/platform-capabilities.md)
- [Error Handling](./advanced/error-handling.md)
- [Production Deployment](./advanced/production.md)
- [Best Practices](./advanced/best-practices.md)

### Reference
- [API Reference](./api/)
- [Examples](./examples/)
- [Troubleshooting](./troubleshooting.md)
- [Migration Guide](./migration.md)

## 🚀 Overview

Message-Mesh is a production-ready SDK that provides:

- **Multi-platform messaging** across WhatsApp, Messenger, and Instagram
- **Enterprise security** with input validation and sanitization
- **Production monitoring** with health checks and performance metrics
- **Type safety** with comprehensive TypeScript support
- **Webhook utilities** for secure event processing
- **Universal messaging** interface for cross-platform operations

## 📦 Quick Installation

```bash
bun add message-mesh
# or npm install message-mesh
```

## 🔧 Basic Usage

```typescript
import { MessageMesh } from "message-mesh";

const messageMesh = new MessageMesh();

// Send a WhatsApp message
const result = await messageMesh.whatsapp.sendMessage({
  accessToken: "your-token",
  to: "+1234567890",
  message: "Hello from Message-Mesh!"
});
```

## 📋 Platform Support Matrix

| Feature | WhatsApp | Messenger | Instagram |
|---------|----------|-----------|-----------|
| Text Messages | ✅ | ✅ | ✅ |
| Template Messages | ✅ | 🚧 | 🚧 |
| Media Messages | ✅ | 🚧 | 🚧 |
| Reactions | ✅ | 🚧 | 🚧 |
| Replies | ✅ | 🚧 | 🚧 |

✅ = Fully supported  
🚧 = Coming soon

## 📞 Support

- **Documentation Issues**: Check existing docs or create an issue
- **Feature Requests**: Submit detailed requirements
- **Bug Reports**: Provide reproduction steps and environment details

## 🤝 Contributing

See our [Contributing Guide](../CONTRIBUTING.md) for development setup and guidelines.

---

**Next**: [Installation & Setup](./getting-started.md)
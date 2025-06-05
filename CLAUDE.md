# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Message-Mesh is a unified messaging SDK for Node.js/Bun applications that provides a simple, consistent interface for sending messages across multiple social media platforms (WhatsApp, Messenger, Instagram). It's designed with Bun-first architecture while maintaining Node.js compatibility.

## Development Commands

```bash
# Development
bun install                 # Install dependencies
bun run dev                 # Development mode with watch
bun run build              # Build the package for distribution
bun run clean              # Clean dist directory

# Quality Assurance
bun test                   # Run test suite
bun test --watch           # Run tests in watch mode
bun run typecheck          # TypeScript type checking
bun run lint               # ESLint code quality checks
bun run lint:fix           # Auto-fix linting issues
bun run format             # Format code with Prettier
bun run format:check       # Check code formatting

# Publishing
bun run prepublishOnly     # Clean and build before publishing
```

## Architecture Overview

### Core Design Patterns

The SDK follows a service-oriented architecture with platform-specific implementations:

1. **MessageMesh (Main Class)**: Central orchestrator that provides unified access to all platform services
2. **Platform Services**: Individual service classes for each messaging platform (WhatsApp, Messenger, Instagram)
3. **HTTP Client**: Shared HTTP client with retry logic, timeout handling, and exponential backoff
4. **Standardized Responses**: Consistent `SendMessageResponse` interface across all platforms

### Key Components

- `MessageMesh` class: Main entry point exposing platform services
- `HttpClient`: Bun-optimized HTTP client with retry and error handling
- `WhatsAppService`: Complete WhatsApp Business API implementation
- `MessengerService`/`InstagramService`: Placeholder implementations for future platforms
- Type definitions in `types.ts` and interfaces in `interfaces.ts`

### Error Handling Strategy

All errors are standardized through `MessageMeshError` class with:
- Platform-specific error codes (INVALID_ACCESS_TOKEN, NETWORK_ERROR, TIMEOUT, etc.)
- Consistent error response format across all platforms
- Automatic retry with exponential backoff for transient failures
- Detailed error messages with actionable guidance

## WhatsApp Business API Integration

The WhatsApp service provides comprehensive messaging capabilities:

### Core Features (Fully Implemented)
- **Text Messages**: Basic message sending with metadata support
- **Template Messages**: WhatsApp-approved templates with parameter substitution
- **Reply Messages**: Message replies with context linking
- **Reactions**: Emoji reactions to existing messages
- **Media Messages**: Support for images, videos, audio, and documents
- **Emoji Messages**: Standalone emoji sending

### Important Notes
- Uses Facebook Graph API v18.0
- Requires WhatsApp Business API access token
- Phone number ID extraction is placeholder (line 342-347 in whatsapp.ts)
- All methods return standardized `SendMessageResponse` format

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- ESNext target for modern JavaScript features
- Bundler module resolution for optimal Bun compatibility
- Strict mode enabled with additional safety checks
- No emit mode (build handled by Bun bundler)

## Testing Framework

Uses Bun's native test framework:
- Test files follow `*.test.ts` pattern
- Located in `src/` directory alongside source files
- Comprehensive test coverage for WhatsApp service functionality
- Mock-based testing approach for external API calls

## Development Status

**Phase 1-3 Complete (WhatsApp):**
- ✅ Core architecture and TypeScript setup
- ✅ HTTP client with retry logic
- ✅ Complete WhatsApp Business API integration
- ✅ All 6 WhatsApp messaging features
- ✅ Comprehensive error handling
- ✅ Test suite and build system

**Phase 4+ Planned:**
- 🚧 Messenger API integration
- 🚧 Instagram API integration
- 📋 Performance optimizations
- 📋 Webhook verification utilities

## Code Organization

```
src/
├── index.ts              # Main exports
├── message-mesh.ts       # Core MessageMesh class
├── types.ts              # Type definitions and MessageMeshError
├── interfaces.ts         # Service interfaces
├── http-client.ts        # HTTP client with retry logic
├── services/
│   ├── whatsapp.ts       # WhatsApp Business API service
│   ├── messenger.ts      # Messenger service (placeholder)
│   └── instagram.ts      # Instagram service (placeholder)
└── message-mesh.test.ts  # Test suite
```

## Performance Considerations

- Bun-first design leverages native HTTP performance
- Request timeout: 30 seconds (configurable)
- Retry attempts: 3 (configurable with exponential backoff)
- Maximum retry delay: 10 seconds
- User-Agent: "message-mesh/0.1.0"

## Security & Validation

- Input validation for all message options
- Access token validation methods
- HTTPS-only API communication
- No logging of sensitive data (access tokens, message content)
- Standardized error responses avoid leaking internal details

## Usage Patterns

The SDK is designed for internal CRM applications with focus on:
- Type safety with full TypeScript support
- Consistent error handling across platforms
- Retry logic for reliable message delivery
- Metadata support for message tracking and analytics
- Simple, intuitive API design

## Dependencies

**Runtime**: Zero external dependencies (uses Bun/Node.js built-ins)
**Development**: ESLint, Prettier, TypeScript
**Peer**: TypeScript 5.0+
**Engines**: Bun >=1.0.0, Node.js >=18.0.0
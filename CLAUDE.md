# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Synclaude is a modern TypeScript/Node.js interactive CLI tool that integrates Synthetic AI models with Claude Code. It provides model selection, configuration management, and seamless launching of Claude Code with various language models through synthetic endpoints.

## Development Commands

### Environment Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Link for global testing
npm link
```

### Testing
```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- config.test.ts
```

### Code Quality
```bash
# Format code
npm run format

# Lint with ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Run all quality checks together
npm run lint && npm test && npm run build
```

### Local Installation and Testing
```bash
# Install locally for development
npm install && npm run build && npm link

# Test the CLI
synclaude --help
synclaude doctor
synclaude models

# Uninstall when done
npm unlink -g synclaude
```

## Architecture Overview

The application follows a modular TypeScript architecture with clear separation of concerns:

### Core Components

1. **CLI Layer (`src/cli/`)** - Commander.js-based command-line interface with comprehensive command grouping
2. **Application Layer (`src/core/app.ts`)** - Main orchestrator coordinating all components, handling core workflows
3. **Configuration (`src/config/`)** - Zod-based configuration management with type safety and validation
4. **Model Management (`src/models/`)** - Handles fetching, caching, and categorizing models from Synthetic API
5. **User Interface (`src/ui/`)** - React-based terminal UI components using Ink library
6. **Launcher (`src/launcher/`)** - Manages Claude Code execution with proper environment variable setup
7. **API Client (`src/api/`)** - Axios-based HTTP client with proper error handling

### Key Data Flows

1. **Model Selection Flow**: CLI → App → ModelManager.fetch_models() → UI.selection → Launcher.launch()
2. **Configuration Flow**: CLI → App → ConfigManager → UI prompts → Config persistence
3. **Manual Update Flow**: Users update via `npm update -g synclaude` (standard npm package management)

### Configuration Architecture

- **Config Storage**: `~/.config/synclaude/config.json`
- **Cache Storage**: `~/.config/synclaude/models_cache.json`
- **Version Info**: `src/config/version.json`
- **Executable**: `dist/cli/index.js` (via npm bin)

### API Integration

The tool integrates with two Synthetic API endpoints:
- **Models API**: `https://api.synthetic.new/openai/v1/models` (OpenAI-compatible)
- **Anthropic API**: `https://api.synthetic.new/anthropic` (Anthropic-compatible)

Environment variables automatically configured for Claude Code:
- `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_DEFAULT_*_MODEL` variants
- `CLAUDE_CODE_SUBAGENT_MODEL`

## Development Guidelines

### Code Structure
- Use TypeScript throughout with strict type checking
- Follow modern JavaScript/ES2022+ patterns
- Maintain strict separation between UI, business logic, and external integrations
- Use Zod for all configuration and data validation
- Functional programming patterns where appropriate

### Error Handling
- Use structured logging with appropriate console methods
- Catch and handle network failures gracefully with Axios error handling
- Provide user-friendly error messages via UI layer
- Don't let component failures crash the entire application

### Testing Strategy
- Unit tests for individual components using Jest
- Mock external API calls (axios)
- Test CLI commands programmatically
- Test configuration persistence and validation
- Type checking catches many errors at compile time

### Adding New Commands
1. Add command function in `src/cli/commands.ts` with proper Commander.js decorators
2. Implement corresponding method in `src/core/app.ts` with error handling
3. Add UI methods in `src/ui/` if needed
4. Update tests and documentation

### Model Management
When adding new model categories or filters:
- Modify `ModelManager.get_categorized_models()` in `src/models/manager.ts`
- Update UI display logic in `src/ui/components/`
- Consider cache invalidation implications

### UI Components
All UI components use Ink (React for CLI):
- Components in `src/ui/components/` are reusable React components
- Use hooks for state management and effects
- Follow React best practices for CLI applications
- Test components with Jest and React Testing Library

## Installation and Distribution

The project supports multiple installation methods:
1. **One-line installer**: `curl -sSL ... | bash` (npm-based installation)
2. **Package install**: `npm install -g synclaude`
3. **Local development**: `npm install && npm run build && npm link`

Key installation files:
- `scripts/install.sh`: Production one-line installer
- `scripts/uninstall.sh`: Complete removal utility (also available as one-line uninstaller)
- `package.json`: npm package configuration with proper bin mapping

## Dependencies

### Core runtime dependencies:
- `axios` - HTTP library for API calls
- `commander` - CLI framework
- `ink` - React-based terminal UI framework
- `chalk` - Terminal colors and styling
- `zod` - Data validation and settings
- `react` - UI component library

### Development dependencies:
- `typescript` - TypeScript compiler and type checking
- `jest` - Testing framework with coverage
- `eslint` + `@typescript-eslint` - Linting
- `prettier` - Code formatting
- `ts-node` - TypeScript execution in development

## Environment Variables for Development

- `SYNTHETIC_API_KEY`: Can be set for testing (overrides config)
- `SYNTHETIC_BASE_URL`: Override API base URL for testing
- `NODE_ENV`: Set to 'development' for debug output

## Build Process

```bash
# Development
npm run dev          # Run with ts-node

# Production
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run compiled version

# Testing
npm test             # Run all tests
npm run test:coverage # Run with coverage report
```

The build process compiles TypeScript to `dist/` directory, creating:
- `dist/cli/index.js` - Main executable
- `dist/**/*.js` - All compiled modules
- Type declarations for consumers

## Type Safety

This project uses TypeScript's strict mode with:
- No implicit any
- Strict null checks
- Exact optional properties
- Zod runtime validation for external data

All APIs are properly typed, and configuration validation occurs at both compile time and runtime.
- use npm for all commands when doing local development.
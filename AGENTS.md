# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Development Commands

### Environment Setup

```bash
npm install
npm run build
npm link
```

### Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
npm test -- config.test.ts # Run specific test file
```

### Code Quality

```bash
npm run lint               # Check code style
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier
npm run lint && npm test && npm run build  # Full quality check
```

### Local Development

```bash
npm run dev                # Run with ts-node
npm run build && npm link  # Build and install globally for testing
npm unlink -g synclaude    # Uninstall when done
```

## Architecture Overview

### Core Application Flow

The application follows a clear orchestration pattern:

1. **CLI Entry** (`src/cli/index.ts` → `src/cli/commands.ts`) - Commander.js parses commands and creates `SyntheticClaudeApp` instance
2. **App Orchestration** (`src/core/app.ts`) - Main coordinator that manages all components and handles core workflows
3. **Component Initialization** - App initializes ConfigManager, ModelManager, UserInterface, and ClaudeLauncher
4. **Command Execution** - App methods implement the actual business logic for each CLI command

### Key Data Flows

**Model Selection Flow**: CLI command → App.interactiveModelSelection() → ModelManager.fetchModels() → UI.selectModel() → ConfigManager.setSavedModel()

**Configuration Flow**: CLI command → App.setup() → UI prompts → ConfigManager.updateConfig() → persistent storage

**Claude Launch Flow**: CLI command → App.run() → App.selectModel() → ClaudeLauncher.launchClaudeCode() with environment variables

### Component Architecture

**ConfigManager** (`src/config/manager.ts`): Handles all configuration persistence using Zod validation. Stores config in `~/.config/synclaude/config.json` with secure permissions (0o600). Implements robust error recovery and backup creation.

**ModelManager** (`src/models/manager.ts`): Manages model fetching, caching, and categorization from Synthetic API. Uses file-based caching in `~/.config/synclaude/models_cache.json` with configurable TTL.

**UserInterface** (`src/ui/`): React-based terminal UI using Ink. All interactive elements (model selection, prompts, confirmations) are React components. Handles all user interaction and display formatting.

**ClaudeLauncher** (`src/launcher/claude-launcher.ts`): Manages Claude Code execution with proper environment variable setup. Automatically configures ANTHROPIC\_\* environment variables for Synthetic API integration.

**API Client** (`src/api/client.ts`): Axios-based HTTP client with structured error handling for Synthetic API endpoints.

### Configuration Architecture

- **Storage**: `~/.config/synclaude/config.json` with 0o600 permissions
- **Schema**: Zod-based validation with type safety (`src/config/types.ts`)
- **Cache**: `~/.config/synclaude/models_cache.json` with TTL validation
- **Key Fields**: `apiKey`, `baseUrl`, `modelsApiUrl`, `cacheDurationHours`, `selectedModel`, `firstRunCompleted`

### API Integration

The tool integrates with two Synthetic API endpoints:

- **Models API**: `https://api.synthetic.new/openai/v1/models` (OpenAI-compatible)
- **Anthropic API**: `https://api.synthetic.new/anthropic` (Anthropic-compatible)

Environment variables automatically configured for Claude Code:

- `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_DEFAULT_*_MODEL` variants
- `CLAUDE_CODE_SUBAGENT_MODEL`

## Development Guidelines

### Adding New Commands

1. Add command in `src/cli/commands.ts` with Commander.js decorators
2. Implement corresponding method in `src/core/app.ts`
3. Add UI methods in `src/ui/` if interactive components needed
4. Update tests in `tests/` directory

### Model Management

When modifying model categorization or filtering:

- Update `ModelManager.get_categorized_models()` in `src/models/manager.ts`
- Modify UI display logic in `src/ui/components/ModelList.tsx`
- Consider cache invalidation implications

### Error Handling Patterns

- Use structured logging via `src/utils/logger.ts`
- Handle network failures gracefully with Axios error handling
- Provide user-friendly messages through UI layer
- Never let component failures crash the entire application

### UI Components

All UI components use Ink (React for CLI):

- Components in `src/ui/components/` are reusable React components
- Use hooks for state management and effects
- Follow React best practices for terminal applications

### Testing Strategy

- Unit tests for individual components using Jest
- Mock external API calls (axios)
- Test CLI commands programmatically
- Test configuration persistence and validation
- Type checking catches many errors at compile time

## Build and Distribution

The project builds TypeScript to `dist/` directory:

- Main executable: `dist/cli/index.js`
- All modules compiled to `dist/**/*.js`
- Uses npm for package management and distribution
- Supports global installation via npm bin mapping

## Important Notes

- **Manual Updates**: Users update via `npm update -g synclaude` (no auto-update functionality)
- **Node.js Requirement**: Requires Node.js 18+ (specified in package.json engines)
- **Configuration Security**: Config files use 0o600 permissions for API key protection
- **Cache Management**: Model cache respects TTL with configurable duration (1-168 hours)
- **First Run Experience**: Setup wizard guides users through API key configuration and model selection

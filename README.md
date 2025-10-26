# Synclaude

Interactive model selection tool for Claude Code with Synthetic AI models.

## Overview

synclaude is a modern TypeScript/Node.js application that provides a seamless interface for selecting and launching Claude Code with various AI models from the Synthetic API.

## Features

- **Modern TypeScript Stack**: Built with TypeScript, Node.js, and npm
- **Interactive Model Selection**: Rich terminal UI for browsing and selecting models
- **Smart Search**: Search models by name, provider, or capabilities
- **Persistent Configuration**: Save your preferred model choices
- **Easy Installation**: One-line installer with npm support
- **System Health**: Built-in diagnostic tools
- **Well Tested**: Comprehensive Jest test suite
- **Beautiful UI**: Modern React-based terminal interface with Ink

## Quick Start

### Prerequisites

- Node.js 18+ and npm installed
- Synthetic API key (get one from [synthetic.new](https://synthetic.new))
- Claude Code installed (get from [claude.com/product/claude-code](https://claude.com/product/claude-code))

### Installation

#### Option 1: One-line Installer (Recommended)

```bash
curl -sSL https://raw.githubusercontent.com/parnexcodes/synclaude/main/scripts/install.sh | bash
```

#### Option 2: npm Global Install

```bash
npm install -g synclaude
```

#### Option 3: Local Development

```bash
npm install -g synclaude
# Or download the source and run:
curl -sSL https://github.com/parnexcodes/synclaude/archive/main.tar.gz | tar -xz
cd synclaude-main
npm install
npm run build
npm link
```

### Uninstallation

#### Option 1: One-line Uninstaller

```bash
curl -sSL https://raw.githubusercontent.com/parnexcodes/synclaude/main/scripts/uninstall.sh | bash
```

#### Option 2: Manual Uninstall

```bash
# If installed globally via npm
npm uninstall -g synclaude

# If installed locally via npm link
npm unlink -g synclaude

# Remove configuration and cache
rm -rf ~/.config/synclaude
```

### Initial Setup

After installation, run the setup wizard:

```bash
synclaude setup
```

This will guide you through:
1. Configuring your Synthetic API key
2. Testing your connection
3. Selecting your first model

### Basic Usage

#### Launch Claude Code with Model Selection

```bash
# Interactive model selection
synclaude

# Use specific model
synclaude --model "openai:gpt-4"

# Or use saved model
synclaude model  # Select and save a model
synclaude         # Launch with saved model
```

#### Model Management

```bash
# List all available models
synclaude models

# Search for specific models
synclaude search "gpt"

# Force refresh model cache
synclaude models --refresh

# Interactive model selection
synclaude model
```

#### Configuration

```bash
# Show current configuration
synclaude config show

# Set configuration values
synclaude config set apiKey "your-api-key"
synclaude config set cacheDurationHours 12

# Reset to defaults
synclaude config reset
```

#### System Tools

```bash
# Check system health and configuration
synclaude doctor

# Clear model cache
synclaude cache clear

# Show cache information
synclaude cache info
```

## Advanced Usage

### Configuration Options

Synclaude stores configuration in `~/.config/synclaude/config.json`. Key options include:

- `apiKey`: Your Synthetic API key
- `baseUrl`: Synthetic API base URL
- `modelsApiUrl`: Models endpoint URL
- `cacheDurationHours`: Model cache duration (1-168 hours)
- `selectedModel`: Last selected model
- `firstRunCompleted`: Whether first-time setup has been completed

### Updates

Synclaude follows standard npm package management conventions. Instead of built-in auto-updates, you manage updates manually:

```bash

# Update to latest version
npm update -g synclaude

# Check current version
synclaude --version
```

This approach provides:
- **Full control** over when updates happen
- **Standard npm workflow** that developers are familiar with
- **No update-related bugs or complexity**
- **Rollback capability** if needed (`npm install -g synclaude@specific-version`)

### Environment Variables

You can override configuration with environment variables:

```bash
export SYNTHETIC_API_KEY="your-api-key"
export SYNTHETIC_BASE_URL="https://api.synthetic.new"
export SYNTHETIC_CACHE_DURATION=24
```

### Development

#### Setup Development Environment

```bash
git clone https://github.com/parnexcodes/synclaude.git
cd synclaude
npm install
```

#### Development Commands

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Full development cycle
npm run lint && npm test && npm run build
```

#### Project Structure

```
synclaude/
├── src/
│   ├── cli/           # CLI commands and parsing (Commander.js)
│   ├── core/          # Application orchestration
│   ├── config/        # Configuration management (Zod)
│   ├── models/        # Data models and API interfaces
│   ├── ui/            # Terminal UI components (Ink)
│   ├── launcher/      # Claude Code launcher
│   ├── api/           # HTTP client (axios)
│   └── utils/         # Shared utilities
├── tests/             # Jest tests
├── scripts/           # Installation and utility scripts
└── dist/              # Built TypeScript output
```

## API Integration

### Synthetic API Endpoints

- **Models API**: `https://api.synthetic.new/openai/v1/models`
- **Anthropic API**: `https://api.synthetic.new/anthropic`

### Environment Variables for Claude Code

When launching Claude Code, Synclaude automatically sets:

- `ANTHROPIC_BASE_URL=https://api.synthetic.new/anthropic`
- `ANTHROPIC_AUTH_TOKEN={your_api_key}`
- `ANTHROPIC_DEFAULT_*_MODEL` variants
- `CLAUDE_CODE_SUBAGENT_MODEL={selected_model}`

## Troubleshooting

### Common Issues

#### Node.js Version Issues

```bash
# Check your Node.js version
node --version

# Upgrade to Node.js 18+ if needed
nvm install 18
nvm use 18
```

#### PATH Issues

If `synclaude` command is not found after installation:

```bash
# Check if local bin directory is in PATH
echo $PATH | grep -o "$HOME/.local/bin"

# Add to PATH (add to your .bashrc, .zshrc, etc.)
export PATH="$PATH:$HOME/.local/bin"
```

#### Permission Issues

```bash
# Fix npm global permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

#### API Connection Issues

```bash
# Test API connection
synclaude doctor

# Clear cache and retry
synclaude cache clear
synclaude models --refresh
```

### Get Help

```bash
# Show all commands
synclaude --help

# Get help for specific command
synclaude models --help
synclaude config --help

# Check system health
synclaude doctor
```


## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `npm test && npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new functionality
- Update documentation for API changes
- Ensure compatibility with Node.js 18+

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/parnexcodes/synclaude/issues)
- **Documentation**: [GitHub Wiki](https://github.com/parnexcodes/synclaude/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/parnexcodes/synclaude/discussions)
- **Synthetic API**: [https://dev.synthetic.new](https://dev.synthetic.new)
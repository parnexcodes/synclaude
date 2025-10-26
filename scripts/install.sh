#!/bin/bash

# Synclaude Installation Script
# One-line installer: curl -sSL https://raw.githubusercontent.com/parnexcodes/synclaude/main/scripts/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default installation directory
INSTALL_DIR="$HOME/.local/share/synclaude"
BIN_DIR="$HOME/.local/bin"
REPO_URL="https://github.com/parnexcodes/synclaude.git"

# Helper functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Bun installation
check_bun() {
    if ! command_exists bun; then
        error "Bun is not installed. Please install Bun first."
        echo "Visit: https://bun.sh/ or use the installation command:"
        echo "  curl -fsSL https://bun.sh/install | bash"
        echo ""
        echo "Or use your package manager:"
        echo "  macOS: brew install bun"
        echo "  Windows: powershell -c \"irm bun.sh/install.ps1 | iex\""
        echo "  Linux: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi

    # Check Bun version (Bun is modern, so we just need any recent version)
    BUN_VERSION=$(bun --version)
    success "Bun $BUN_VERSION found"
}

# Create directories
create_directories() {
    log "Creating installation directories..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BIN_DIR"
    success "Directories created"
}

# Install synclaude package
install_package() {
    log "Installing synclaude package..."

    # Install globally using Bun
    if bun install -g synclaude; then
        success "synclaude package installed globally"
    else
        warn "Global installation failed, trying local installation..."

        # Fallback to local installation
        cd "$INSTALL_DIR"
        if bun init -y && bun install synclaude; then
            log "Creating symlink in $BIN_DIR..."
            ln -sf "$INSTALL_DIR/node_modules/.bin/synclaude" "$BIN_DIR/synclaude"
            success "Local installation completed"
        else
            error "Failed to install synclaude package"
            exit 1
        fi
    fi
}

# Update PATH
update_path() {
    if ! echo "$PATH" | grep -q "$BIN_DIR"; then
        log "Adding $BIN_DIR to PATH..."

        # Detect shell and update appropriate config file
        SHELL_NAME=$(basename "$SHELL")
        case "$SHELL_NAME" in
            bash)
                if [ -f "$HOME/.bashrc" ]; then
                    echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$HOME/.bashrc"
                    SHELL_CONFIG="$HOME/.bashrc"
                elif [ -f "$HOME/.bash_profile" ]; then
                    echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$HOME/.bash_profile"
                    SHELL_CONFIG="$HOME/.bash_profile"
                fi
                ;;
            zsh)
                echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$HOME/.zshrc"
                SHELL_CONFIG="$HOME/.zshrc"
                ;;
            fish)
                echo "set -gx PATH \$PATH $BIN_DIR" >> "$HOME/.config/fish/config.fish"
                SHELL_CONFIG="$HOME/.config/fish/config.fish"
                ;;
            *)
                warn "Unsupported shell: $SHELL_NAME"
                warn "Please add $BIN_DIR to your PATH manually"
                SHELL_CONFIG=""
                ;;
        esac

        if [ -n "$SHELL_CONFIG" ]; then
            success "Updated $SHELL_CONFIG"
            warn "Please run 'source $SHELL_CONFIG' or restart your terminal"
        fi
    else
        success "$BIN_DIR is already in PATH"
    fi
}

# Verify installation
verify_installation() {
    if command_exists synclaude; then
        success "synclaude is installed and available"
        log "Run 'synclaude --help' to get started"

        # Show version
        SYNCLAUDE_VERSION=$(synclaude --version 2>/dev/null || echo "unknown")
        log "Installed version: $SYNCLAUDE_VERSION"
    else
        error "synclaude command not found after installation"
        error "Please ensure $BIN_DIR is in your PATH"
        exit 1
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    success "Installation completed!"
    echo ""
    log "Next steps:"
    echo "1. Run 'synclaude setup' to configure your API key"
    echo "2. Run 'synclaude' to launch Claude Code with model selection"
    echo "3. Run 'synclaude --help' to see all available commands"
    echo ""
    log "Useful commands:"
    echo "  synclaude setup            - Initial configuration"
    echo "  synclaude models            - List available models"
    echo "  synclaude search <query>    - Search models"
    echo "  synclaude model             - Interactive model selection"
    echo "  synclaude doctor            - Check system health"
    echo ""
}

# Main installation flow
main() {
    echo ""
    echo "Synclaude Installation Script"
    echo "================================"
    echo ""

    log "Installing synclaude..."

    # Pre-installation checks
    check_bun
    create_directories

    # Installation
    install_package
    update_path

    # Verification
    verify_installation
    show_next_steps

    success "Installation completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Synclaude Installation Script"
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "This script will:"
        echo "1. Check for Bun installation"
        echo "2. Install the synclaude package"
        echo "3. Set up PATH if needed"
        echo "4. Verify the installation"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
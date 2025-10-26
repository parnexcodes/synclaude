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
REPO_URL="https://github.com/parnexcodes/synclaude"
TARBALL_URL="$REPO_URL/archive/main.tar.gz"

# Script variables
VERBOSE="${VERBOSE:-false}"
PATH_UPDATED="${PATH_UPDATED:-false}"
PATH_IN_PATH="${PATH_IN_PATH:-false}"

# Helper functions
log() {
    [ "$VERBOSE" = "true" ] && echo -e "${BLUE}[INFO]${NC} $1"
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

progress() {
    echo -n "."
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system dependencies
check_dependencies() {
    # Check for Node.js and npm
    if ! command_exists node; then
        error "Node.js is not installed. Please install Node.js first."
        echo "Visit: https://nodejs.org/ or use your package manager:"
        echo "  macOS: brew install node"
        echo "  Windows: Download from https://nodejs.org/"
        echo "  Linux (Ubuntu/Debian): sudo apt-get install nodejs npm"
        echo "  Linux (RedHat/CentOS): sudo yum install nodejs npm"
        exit 1
    fi

    if ! command_exists npm; then
        error "npm is not installed. Please install npm first."
        echo "npm usually comes with Node.js. If not available:"
        echo "  Linux (Ubuntu/Debian): sudo apt-get install npm"
        echo "  Linux (RedHat/CentOS): sudo yum install npm"
        exit 1
    fi

    # Check for curl or wget for downloading
    if ! command_exists curl && ! command_exists wget; then
        error "Neither curl nor wget is available for downloading."
        echo "Please install one of them:"
        echo "  curl: sudo apt-get install curl (Ubuntu/Debian)"
        echo "  wget: sudo apt-get install wget (Ubuntu/Debian)"
        exit 1
    fi

 progress
}

# Create directories
create_directories() {
    progress
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BIN_DIR"
}

# Install synclaude package
install_package() {
    progress

    # Clean up any existing installation
    rm -rf "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"

    # Download and extract repository
    cd "$INSTALL_DIR"
    progress
    if command_exists curl; then
        if curl -sL "$TARBALL_URL" | tar -xz --strip-components=1 >/dev/null 2>&1; then
            progress
        else
            error "Failed to download repository with curl"
            exit 1
        fi
    elif command_exists wget; then
        if wget -qO- "$TARBALL_URL" | tar -xz --strip-components=1 >/dev/null 2>&1; then
            progress
        else
            error "Failed to download repository with wget"
            exit 1
        fi
    fi

    # Install dependencies and build
    progress
    if npm install --silent >/dev/null 2>&1 && npm run build >/dev/null 2>&1; then
        progress
        ln -sf "$INSTALL_DIR/dist/cli/index.js" "$BIN_DIR/synclaude"
        chmod +x "$BIN_DIR/synclaude"
    else
        error "Failed to install dependencies or build project"
        exit 1
    fi
}

# Update PATH
update_path() {
    if ! echo "$PATH" | grep -q "$BIN_DIR"; then
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
            PATH_UPDATED=true
        fi
    else
        PATH_IN_PATH=true
    fi
}

# Verify installation
verify_installation() {
    if command_exists synclaude; then
        progress
        SYNCLAUDE_VERSION=$(synclaude --version 2>/dev/null || echo "unknown")
        VERSION_INSTALLED="$SYNCLAUDE_VERSION"
    else
        error "synclaude command not found after installation"
        error "Please ensure $BIN_DIR is in your PATH"
        exit 1
    fi
}

# Show final message
show_final_message() {
    echo ""
    echo "✓ synclaude installed successfully!"

    if [ "$PATH_UPDATED" = "true" ]; then
        echo "⚠️  Please restart your terminal or run 'source $SHELL_CONFIG'"
    fi

    echo ""
    echo "Run 'synclaude setup' to configure, then 'synclaude' to start."
}

# Main installation flow
main() {
    echo -n "Installing synclaude"

    # Pre-installation checks
    check_dependencies
    create_directories

    # Installation
    install_package
    update_path

    # Verification
    verify_installation

    echo ""
    show_final_message
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Synclaude Installation Script"
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h      Show this help message"
        echo "  --verbose, -v   Show detailed installation output"
        echo ""
        echo "This script will:"
        echo "1. Check for Node.js and npm installation"
        echo "2. Download and install the synclaude package"
        echo "3. Set up PATH if needed"
        echo "4. Verify the installation"
        exit 0
        ;;
    --verbose|-v)
        VERBOSE=true
        main
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
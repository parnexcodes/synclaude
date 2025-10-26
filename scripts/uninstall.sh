#!/bin/bash

# Synclaude Uninstallation Script
# One-line uninstaller: curl -sSL https://raw.githubusercontent.com/parnexcodes/synclaude/main/scripts/uninstall.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default paths
INSTALL_DIR="$HOME/.local/share/synclaude"
CONFIG_DIR="$HOME/.config/synclaude"
BIN_DIR="$HOME/.local/bin"

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

# Confirm uninstallation
confirm_uninstall() {
    echo ""
    warn "This will uninstall synclaude and remove all configuration files."
    echo "The following will be removed:"
    echo "  - synclaude package (global and local installations)"
    echo "  - Configuration files in ~/.config/synclaude"
    echo "  - Cache files in ~/.local/share/synclaude"
    echo ""
    read -p "Are you sure you want to continue? [y/N] " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Uninstallation cancelled"
        exit 0
    fi
}

# Uninstall global package
uninstall_global() {
    log "Removing global synclaude package..."

    if bun pm ls -g synclaude >/dev/null 2>&1; then
        if bun uninstall -g synclaude; then
            success "Global package removed"
        else
            warn "Failed to remove global package (might not be globally installed)"
        fi
    else
        log "Global package not found"
    fi
}

# Remove bun link
remove_bun_link() {
    if command_exists bun && [ -L "$(which synclaude 2>/dev/null)" ]; then
        log "Removing bun link..."
        # Remove the symlink directly
        SYNCLAUDE_PATH=$(which synclaude)
        if [ -L "$SYNCLAUDE_PATH" ]; then
            rm -f "$SYNCLAUDE_PATH"
            success "Bun link removed"
        fi
    fi
}

# Uninstall local installation
uninstall_local() {
    if [ -d "$INSTALL_DIR" ]; then
        log "Removing local installation directory..."
        rm -rf "$INSTALL_DIR"
        success "Local installation removed"
    else
        log "Local installation directory not found"
    fi
}

# Remove symlink
remove_symlink() {
    if [ -L "$BIN_DIR/synclaude" ]; then
        log "Removing symlink..."
        rm -f "$BIN_DIR/synclaude"
        success "Symlink removed"
    fi
}

# Remove configuration
remove_config() {
    if [ -d "$CONFIG_DIR" ]; then
        log "Removing configuration directory..."
        rm -rf "$CONFIG_DIR"
        success "Configuration removed"
    else
        log "Configuration directory not found"
    fi
}

# Clean up PATH references
cleanup_path() {
    log "Checking for PATH references to clean up..."

    # Remove from common shell config files
    for config_file in "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.zshrc" "$HOME/.config/fish/config.fish"; do
        if [ -f "$config_file" ]; then
            if grep -q "$BIN_DIR" "$config_file" 2>/dev/null; then
                warn "Found PATH reference in $config_file"
                warn "Manual cleanup may be required"
                warn "Remove any lines containing: export PATH=\"\$PATH:$BIN_DIR\""
            fi
        fi
    done
}

# Verify uninstallation
verify_uninstall() {
    if command_exists synclaude; then
        error "synclaude command still found after uninstallation"
        warn "You may need to restart your terminal or manually clean up PATH"
        exit 1
    else
        success "synclaude has been successfully uninstalled"
    fi
}

# Main uninstallation flow
main() {
    echo ""
    echo "Synclaude Uninstallation Script"
    echo "=================================="
    echo ""

    # Check if synclaude is installed
    if ! command_exists synclaude && [ ! -d "$INSTALL_DIR" ] && [ ! -d "$CONFIG_DIR" ]; then
        warn "synclaude doesn't appear to be installed"
        exit 0
    fi

    # Confirm uninstallation
    confirm_uninstall

    # Uninstallation steps
    uninstall_global
    remove_bun_link
    uninstall_local
    remove_symlink
    remove_config
    cleanup_path

    # Verification
    verify_uninstall

    echo ""
    success "Uninstallation completed successfully!"
    log "Thank you for using synclaude!"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Synclaude Uninstallation Script"
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "This script will:"
        echo "1. Remove the synclaude package (both global and local)"
        echo "2. Remove configuration files"
        echo "3. Remove cache files"
        echo "4. Clean up symlinks"
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
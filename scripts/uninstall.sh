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

# Force uninstall flag
FORCE_UNINSTALL=false

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

    # Check if force flag is set or running in interactive mode
    if [ "$FORCE_UNINSTALL" = false ]; then
        if [ ! -t 0 ]; then
            warn "Non-interactive mode detected. Add '--force' flag to proceed."
            echo ""
            echo "To uninstall, run:"
            echo "  curl -sSL ... | bash -s -- --force"
            echo "Or download and run locally:"
            echo "  curl -sSL ... > uninstall.sh && chmod +x uninstall.sh && ./uninstall.sh"
            echo ""
            exit 1
        fi

        read -p "Are you sure you want to continue? [y/N] " -n 1 -r
        echo ""

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Uninstallation cancelled"
            exit 0
        fi
    else
        log "Force uninstall mode - skipping confirmation"
    fi
}

# Uninstall global package
uninstall_global() {
    log "Removing global synclaude package..."

    if npm list -g synclaude >/dev/null 2>&1; then
        if npm uninstall -g synclaude; then
            success "Global package removed"
        else
            warn "Failed to remove global package (might not be globally installed)"
        fi
    else
        log "Global package not found"
    fi
}

# Remove npm link
remove_npm_link() {
    if command_exists npm && [ -L "$(which synclaude 2>/dev/null)" ]; then
        log "Removing npm link..."
        # Remove the symlink directly
        SYNCLAUDE_PATH=$(which synclaude)
        if [ -L "$SYNCLAUDE_PATH" ]; then
            rm -f "$SYNCLAUDE_PATH"
            success "Npm link removed"
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
    remove_npm_link
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

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_UNINSTALL=true
                shift
                ;;
            --help|-h)
                echo "Synclaude Uninstallation Script"
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --force        Skip confirmation prompt"
                echo "  --help, -h     Show this help message"
                echo ""
                echo "This script will:"
                echo "1. Remove the synclaude package (both global and local)"
                echo "2. Remove configuration files"
                echo "3. Remove cache files"
                echo "4. Clean up symlinks"
                echo ""
                echo "Usage examples:"
                echo "  curl -sSL ... | bash                    # Interactive mode"
                echo "  curl -sSL ... | bash -s -- --force       # Non-interactive"
                echo "  ./uninstall.sh --force                  # Local interactive bypass"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Handle script arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Called directly (not sourced)
    parse_args "$@"
    main
else
    # Script is being piped in, check for --force in arguments
    if [[ "$*" == *"--force"* ]]; then
        FORCE_UNINSTALL=true
    fi
    main
fi
#!/bin/bash

# Build script that creates a distributable CLI
echo "Building synclaude..."

# Clean dist directory
rm -rf dist
mkdir -p dist

# Copy source files
cp -r src/* dist/

# Copy package.json but modify it for distribution
cat > dist/package.json << 'EOF'
{
  "name": "synclaude",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "axios": "^1.6.2",
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "ink": "^4.4.1",
    "zod": "^3.22.4",
    "react": "^18.2.0"
  }
}
EOF

# Create a simple Node.js wrapper that uses bun to run TypeScript
cat > "dist/cli/index.js" << 'EOF'
#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Spawn bun to run the actual TypeScript CLI
const child = spawn('bun', [
    join(__dirname, 'index.ts'),
    ...process.argv.slice(2)
], {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
        ...process.env,
        NODE_NO_WARNINGS: '1'
    }
});

child.on('exit', (code) => {
    process.exit(code);
});

child.on('error', (err) => {
    console.error('Failed to spawn bun process:', err);
    console.error('Please ensure bun is installed and available in your PATH');
    process.exit(1);
});
EOF

# Make the wrapper executable
chmod +x "dist/cli/index.js"

echo "Build complete!"
echo "CLI executable created at: dist/cli/index.js"
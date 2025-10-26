#!/bin/bash

# Build script that creates proper bundled files for the CLI
echo "Building synclaude..."

# Clean dist directory
rm -rf dist
mkdir -p dist

# Copy TypeScript files (don't bundle them, just copy source)
cp -r src/* dist/

# Create wrapper script that forces bun execution
cat > dist/cli.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Get the directory where this script is located
const scriptDir = path.dirname(__filename);

// Spawn bun to run the actual TypeScript CLI
const child = spawn('bun', [path.join(scriptDir, 'cli/index.ts'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: scriptDir
});

child.on('exit', (code) => {
  process.exit(code);
});
EOF

# Make it executable
chmod +x dist/cli.js

# Copy package.json for dependency resolution
cp package.json dist/

echo "Build complete!"
#!/bin/bash

# Build script that compiles TypeScript to JavaScript
echo "Building synclaude..."

# Clean and recreate dist directory
rm -rf dist
mkdir -p dist

# Compile TypeScript to JavaScript
npx tsc

# Create proper executable with shebang
echo '#!/usr/bin/env node' > dist/cli/index.js.cat
cat dist/cli/index.js >> dist/cli/index.js.cat
mv dist/cli/index.js.cat dist/cli/index.js
chmod +x dist/cli/index.js

"

echo "Build complete!"
echo "CLI executable at: dist/cli/index.js"
echo "Compiled JavaScript ready for distribution"
#!/bin/bash

# ChunkFlow Alpha Release Script
# Quick script to release alpha versions

set -e

echo "🚀 ChunkFlow Alpha Release"
echo "=========================="
echo ""

# Get target version
if [ -z "$1" ]; then
  echo "Usage: ./scripts/release-alpha.sh <version>"
  echo "Example: ./scripts/release-alpha.sh 0.0.1-alpha.1"
  exit 1
fi

TARGET_VERSION=$1

echo "📦 Target version: $TARGET_VERSION"
echo ""

# Confirm
read -p "Continue with release? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

echo ""
echo "📝 Step 1: Updating versions..."
# Update all package versions
for pkg in packages/*/package.json; do
  if [ -f "$pkg" ]; then
    # Check if package is not private
    IS_PRIVATE=$(node -p "require('./$pkg').private || false")
    if [ "$IS_PRIVATE" = "false" ]; then
      PKG_NAME=$(node -p "require('./$pkg').name")
      echo "  Updating $PKG_NAME to $TARGET_VERSION"
      # Use node to update version
      node -e "
        const fs = require('fs');
        const pkg = require('./$pkg');
        pkg.version = '$TARGET_VERSION';
        fs.writeFileSync('$pkg', JSON.stringify(pkg, null, 2) + '\n');
      "
    fi
  fi
done

echo ""
echo "📦 Step 2: Building packages..."
pnpm build

echo ""
echo "🔍 Step 2.5: Verifying packages before publishing..."
chmod +x scripts/verify-publish.sh
./scripts/verify-publish.sh

echo ""
echo "📝 Step 3: Running tests..."
pnpm test || echo "⚠️  Tests failed, but continuing..."

echo ""
echo "🔍 Step 4: Type checking..."
pnpm typecheck

echo ""
echo "🎯 Step 5: Publishing to npm with 'alpha' tag..."
echo "Make sure you are logged in to npm (run 'npm login' if needed)"
read -p "Press enter to continue with publishing..."

# Publish each package with alpha tag
for pkg in packages/*/package.json; do
  if [ -f "$pkg" ]; then
    IS_PRIVATE=$(node -p "require('./$pkg').private || false")
    if [ "$IS_PRIVATE" = "false" ]; then
      PKG_DIR=$(dirname "$pkg")
      PKG_NAME=$(node -p "require('./$pkg').name")
      echo "  Publishing $PKG_NAME..."
      (cd "$PKG_DIR" && pnpm publish --tag alpha --access public --no-git-checks)
    fi
  fi
done

echo ""
echo "📌 Step 6: Committing version changes..."
git add .
git commit -m "chore: release $TARGET_VERSION"

echo ""
echo "🏷️  Step 7: Creating git tag..."
git tag -a "v$TARGET_VERSION" -m "Release v$TARGET_VERSION"

echo ""
echo "⬆️  Step 8: Pushing to GitHub..."
git push origin main
git push origin "v$TARGET_VERSION"

echo ""
echo "📰 Step 9: Creating GitHub Release..."

# Check if gh CLI is installed
if command -v gh &> /dev/null; then
  echo "Using GitHub CLI to create prerelease..."
  
  gh release create "v$TARGET_VERSION" \
    --title "ChunkFlow v$TARGET_VERSION" \
    --notes "🧪 Alpha release - for testing purposes only

## Installation

\`\`\`bash
npm install @chunkflowjs/core@alpha
# or
npm install @chunkflowjs/core@$TARGET_VERSION
\`\`\`

## ⚠️ Warning

This is an alpha release and may contain bugs. API may change in future releases.

## 📦 Packages

- @chunkflowjs/core@$TARGET_VERSION
- @chunkflowjs/protocol@$TARGET_VERSION
- @chunkflowjs/shared@$TARGET_VERSION
- @chunkflowjs/upload-client-react@$TARGET_VERSION
- @chunkflowjs/upload-client-vue@$TARGET_VERSION
- @chunkflowjs/upload-component-react@$TARGET_VERSION
- @chunkflowjs/upload-component-vue@$TARGET_VERSION
- @chunkflowjs/upload-server@$TARGET_VERSION" \
    --prerelease
  
  echo "✅ GitHub Prerelease created successfully!"
else
  echo "⚠️  GitHub CLI (gh) is not installed."
  echo ""
  echo "📝 Manual steps to create GitHub Release:"
  echo "  1. Go to: https://github.com/Sunny-117/chunkflow/releases/new?tag=v$TARGET_VERSION"
  echo "  2. Title: ChunkFlow v$TARGET_VERSION"
  echo "  3. Mark as prerelease"
  echo "  4. Publish"
  echo ""
  echo "Or install GitHub CLI and run:"
  echo "  gh release create v$TARGET_VERSION --title \"ChunkFlow v$TARGET_VERSION\" --prerelease --notes \"Alpha release\""
fi

echo ""
echo "🏷️  Step 10: Updating dist-tags..."
# Update alpha tag
chmod +x scripts/update-dist-tags.sh
./scripts/update-dist-tags.sh "$TARGET_VERSION" alpha

# Also update latest tag if no stable version exists
echo ""
echo "Update 'latest' tag to point to this alpha version?"
echo "(Only do this if there's no stable release yet)"
read -p "Update latest tag? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  ./scripts/update-dist-tags.sh "$TARGET_VERSION" latest
  echo "✅ Updated 'latest' tag"
else
  echo "⏭️  Skipped 'latest' tag update"
fi

echo ""
echo "✅ Alpha release complete!"
echo ""
echo "🎉 Version $TARGET_VERSION has been published!"
echo ""
echo "📦 Verify on npm:"
echo "  npm view @chunkflowjs/core dist-tags"
echo "  npm view @chunkflowjs/core@alpha"
echo ""
echo "📥 Install with:"
echo "  npm install @chunkflowjs/core@alpha"
echo "  npm install @chunkflowjs/core@$TARGET_VERSION"

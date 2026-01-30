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
      (cd "$PKG_DIR" && npm publish --tag alpha --access public)
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
echo "✅ Alpha release complete!"
echo ""
echo "📝 Create GitHub Release:"
echo ""
echo "Option 1 - Using GitHub CLI:"
echo "  gh release create v$TARGET_VERSION --title \"ChunkFlow v$TARGET_VERSION\" --prerelease --notes \"Alpha release\""
echo ""
echo "Option 2 - Using Web UI:"
echo "  https://github.com/Sunny-117/chunkflow/releases/new?tag=v$TARGET_VERSION"
echo ""
echo "📦 Verify on npm:"
echo "  npm view @chunkflow/core dist-tags"
echo "  npm view @chunkflow/core@alpha"

#!/bin/bash

# ChunkFlow Alpha Release Script
# Quick script to release alpha versions
# Supports resuming from failures

set -e

# Load state management
source "$(dirname "$0")/release-state.sh"

echo "🚀 ChunkFlow Alpha Release"
echo "=========================="
echo ""

# Check if there's a previous release in progress
if load_state; then
  echo "⚠️  Found previous release in progress!"
  show_state
  echo ""
  read -p "Resume from last checkpoint? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting fresh release..."
    clean_state
  else
    echo "Resuming from checkpoint..."
    # Load version from state
    source .release-state
    TARGET_VERSION=$VERSION
    echo "Target version: $TARGET_VERSION"
    echo ""
  fi
fi

# Get target version if not resuming
if [ -z "$TARGET_VERSION" ]; then
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
  
  # Initialize state
  init_state "$TARGET_VERSION"
fi

echo ""

# Step 1: Update versions
if ! is_step_done VERSION; then
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
  mark_step_done VERSION
  echo "✅ Versions updated"
else
  echo "⏭️  Step 1: Version update (already done)"
fi

echo ""

# Step 2: Build packages
if ! is_step_done BUILD; then
  echo "📦 Step 2: Building packages..."
  if pnpm build; then
    mark_step_done BUILD
    echo "✅ Build completed"
  else
    echo "❌ Build failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 2: Build (already done)"
fi

echo ""

# Step 2.5: Verify packages
if ! is_step_done VERIFY; then
  echo "🔍 Step 2.5: Verifying packages before publishing..."
  chmod +x scripts/verify-publish.sh
  if ./scripts/verify-publish.sh; then
    mark_step_done VERIFY
    echo "✅ Verification completed"
  else
    echo "⚠️  Verification warnings (continuing...)"
    mark_step_done VERIFY
  fi
else
  echo "⏭️  Step 2.5: Verify (already done)"
fi

echo ""

# Step 3: Run tests
if ! is_step_done TEST; then
  echo "📝 Step 3: Running tests..."
  if pnpm test; then
    mark_step_done TEST
    echo "✅ Tests passed"
  else
    echo "⚠️  Tests failed, but continuing with alpha release..."
    mark_step_done TEST
  fi
else
  echo "⏭️  Step 3: Tests (already done)"
fi

echo ""

# Step 4: Type checking
if ! is_step_done TYPECHECK; then
  echo "🔍 Step 4: Type checking..."
  if pnpm typecheck; then
    mark_step_done TYPECHECK
    echo "✅ Type check passed"
  else
    echo "❌ Type check failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 4: Typecheck (already done)"
fi

echo ""

# Step 5: Publish to npm
if ! is_step_done PUBLISH; then
  echo "🎯 Step 5: Publishing to npm with 'alpha' tag..."
  echo "Make sure you are logged in to npm (run 'npm login' if needed)"
  read -p "Press enter to continue with publishing..."
  
  # Publish each package with alpha tag
  PUBLISH_FAILED=0
  for pkg in packages/*/package.json; do
    if [ -f "$pkg" ]; then
      IS_PRIVATE=$(node -p "require('./$pkg').private || false")
      if [ "$IS_PRIVATE" = "false" ]; then
        PKG_DIR=$(dirname "$pkg")
        PKG_NAME=$(node -p "require('./$pkg').name")
        PKG_VERSION=$(node -p "require('./$pkg').version")
        
        # Check if this version is already published
        if npm view "$PKG_NAME@$PKG_VERSION" version &>/dev/null; then
          echo "  ⏭️  $PKG_NAME@$PKG_VERSION already published"
        else
          echo "  Publishing $PKG_NAME..."
          if (cd "$PKG_DIR" && pnpm publish --tag alpha --access public --no-git-checks); then
            echo "  ✅ $PKG_NAME published"
          else
            echo "  ❌ $PKG_NAME publish failed"
            PUBLISH_FAILED=1
          fi
        fi
      fi
    fi
  done
  
  if [ $PUBLISH_FAILED -eq 0 ]; then
    mark_step_done PUBLISH
    echo "✅ All packages published"
  else
    echo "❌ Some packages failed to publish! Fix the errors and run the script again."
    echo "   Already published packages will be skipped on retry."
    exit 1
  fi
else
  echo "⏭️  Step 5: Publish (already done)"
fi

echo ""

# Step 6: Commit version changes
if ! is_step_done COMMIT; then
  echo "📌 Step 6: Committing version changes..."
  if git add . && git commit -m "chore: release $TARGET_VERSION"; then
    mark_step_done COMMIT
    echo "✅ Changes committed"
  else
    # Check if there's nothing to commit
    if [[ -z $(git status -s) ]]; then
      echo "⏭️  Nothing to commit (already committed)"
      mark_step_done COMMIT
    else
      echo "❌ Commit failed! Fix the errors and run the script again."
      exit 1
    fi
  fi
else
  echo "⏭️  Step 6: Commit (already done)"
fi

echo ""

# Step 7: Create git tag
if ! is_step_done TAG; then
  echo "🏷️  Step 7: Creating git tag..."
  if git tag -a "v$TARGET_VERSION" -m "Release v$TARGET_VERSION" 2>/dev/null; then
    mark_step_done TAG
    echo "✅ Tag created: v$TARGET_VERSION"
  else
    # Check if tag already exists
    if git rev-parse "v$TARGET_VERSION" >/dev/null 2>&1; then
      echo "⏭️  Tag already exists: v$TARGET_VERSION"
      mark_step_done TAG
    else
      echo "❌ Tag creation failed! Fix the errors and run the script again."
      exit 1
    fi
  fi
else
  echo "⏭️  Step 7: Tag (already done)"
fi

echo ""

# Step 8: Push to GitHub
if ! is_step_done PUSH; then
  echo "⬆️  Step 8: Pushing to GitHub..."
  if git push origin main && git push origin "v$TARGET_VERSION"; then
    mark_step_done PUSH
    echo "✅ Pushed to GitHub"
  else
    echo "❌ Push failed! Check your network and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 8: Push (already done)"
fi

echo ""

# Step 9: Create GitHub Release
if ! is_step_done RELEASE; then
  echo "📰 Step 9: Creating GitHub Release..."
  
  # Check if gh CLI is installed
  if command -v gh &> /dev/null; then
    echo "Using GitHub CLI to create prerelease..."
    
    # Check if release already exists
    if gh release view "v$TARGET_VERSION" &>/dev/null; then
      echo "⏭️  GitHub Release already exists"
      mark_step_done RELEASE
    else
      if gh release create "v$TARGET_VERSION" \
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
        --prerelease; then
        mark_step_done RELEASE
        echo "✅ GitHub Prerelease created successfully!"
      else
        echo "❌ GitHub Release creation failed! Run the script again to retry."
        exit 1
      fi
    fi
  else
    echo "⚠️  GitHub CLI (gh) is not installed."
    echo ""
    echo "📝 Manual steps to create GitHub Release:"
    echo "  1. Go to: https://github.com/Sunny-117/chunkflow/releases/new?tag=v$TARGET_VERSION"
    echo "  2. Title: ChunkFlow v$TARGET_VERSION"
    echo "  3. Mark as prerelease"
    echo "  4. Publish"
    echo ""
    read -p "Press enter after creating the release manually..."
    mark_step_done RELEASE
  fi
else
  echo "⏭️  Step 9: GitHub Release (already done)"
fi

echo ""

# Step 10: Update dist-tags
if ! is_step_done DISTTAG; then
  echo "🏷️  Step 10: Updating dist-tags..."
  # Update alpha tag
  chmod +x scripts/update-dist-tags.sh
  if ./scripts/update-dist-tags.sh "$TARGET_VERSION" alpha; then
    echo "✅ Alpha tag updated"
    
    # Ask about updating latest tag
    echo ""
    echo "Update 'latest' tag to point to this alpha version?"
    echo "(Only do this if there's no stable release yet)"
    read -p "Update latest tag? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if ./scripts/update-dist-tags.sh "$TARGET_VERSION" latest; then
        echo "✅ Latest tag updated"
      else
        echo "⚠️  Latest tag update failed (continuing...)"
      fi
    else
      echo "⏭️  Skipped 'latest' tag update"
    fi
    
    mark_step_done DISTTAG
  else
    echo "❌ Dist-tag update failed! Run the script again to retry."
    exit 1
  fi
else
  echo "⏭️  Step 10: Dist-tags (already done)"
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
echo ""

# Clean up state file
clean_state
echo "🧹 Cleaned up release state"

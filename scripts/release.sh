#!/bin/bash

# ChunkFlow Release Script
# This script helps you release a new version to npm and GitHub
# Supports resuming from failures

set -e

# Load state management
source "$(dirname "$0")/release-state.sh"

echo "🚀 ChunkFlow Release Script"
echo "============================"
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
    echo ""
  fi
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Warning: You are not on the main branch (current: $CURRENT_BRANCH)"
  read -p "Do you want to continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "⚠️  You have uncommitted changes:"
  git status -s
  read -p "Do you want to continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 1: Build packages
if ! is_step_done BUILD; then
  echo "📦 Step 1: Building packages..."
  if pnpm build; then
    mark_step_done BUILD
    echo "✅ Build completed"
  else
    echo "❌ Build failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 1: Build (already done)"
fi

echo ""

# Step 1.5: Verify packages
if ! is_step_done VERIFY; then
  echo "🔍 Step 1.5: Verifying packages before release..."
  chmod +x scripts/verify-publish.sh
  if ./scripts/verify-publish.sh; then
    mark_step_done VERIFY
    echo "✅ Verification completed"
  else
    echo "⚠️  Verification warnings (continuing...)"
    mark_step_done VERIFY
  fi
else
  echo "⏭️  Step 1.5: Verify (already done)"
fi

echo ""

# Step 2: Run tests
if ! is_step_done TEST; then
  echo "📝 Step 2: Running tests..."
  if pnpm test; then
    mark_step_done TEST
    echo "✅ Tests passed"
  else
    echo "❌ Tests failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 2: Tests (already done)"
fi

echo ""

# Step 3: Type checking
if ! is_step_done TYPECHECK; then
  echo "🔍 Step 3: Type checking..."
  if pnpm typecheck; then
    mark_step_done TYPECHECK
    echo "✅ Type check passed"
  else
    echo "❌ Type check failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 3: Typecheck (already done)"
fi

echo ""

# Step 4: Apply changesets and update versions
if ! is_step_done VERSION; then
  echo "📋 Step 4: Applying changesets and updating versions..."
  if pnpm changeset version; then
    mark_step_done VERSION
    echo "✅ Versions updated"
  else
    echo "❌ Version update failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 4: Version update (already done)"
fi

echo ""

# Step 5: Rebuild with new versions
if ! is_step_done REBUILD; then
  echo "📦 Step 5: Building packages again with new versions..."
  if pnpm build; then
    mark_step_done REBUILD
    echo "✅ Rebuild completed"
  else
    echo "❌ Rebuild failed! Fix the errors and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 5: Rebuild (already done)"
fi

echo ""

# Step 6: Publish to npm
if ! is_step_done PUBLISH; then
  echo "🎯 Step 6: Publishing to npm..."
  echo "Make sure you are logged in to npm (run 'npm login' if needed)"
  read -p "Press enter to continue with publishing..."
  
  if pnpm changeset publish; then
    mark_step_done PUBLISH
    echo "✅ Published to npm"
  else
    echo "❌ Publish failed! Check the error and run the script again."
    echo "   If some packages were published, the script will skip them on retry."
    exit 1
  fi
else
  echo "⏭️  Step 6: Publish (already done)"
fi

echo ""

# Get version for tagging
VERSION=$(node -p "require('./packages/core/package.json').version")

# Initialize state with version if not already done
if ! load_state; then
  init_state "$VERSION"
fi

# Step 7: Commit version changes
if ! is_step_done COMMIT; then
  echo "📌 Step 7: Committing version changes..."
  if git add . && git commit -m "chore: release packages"; then
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
  echo "⏭️  Step 7: Commit (already done)"
fi

echo ""

# Step 8: Create git tag
if ! is_step_done TAG; then
  echo "🏷️  Step 8: Creating git tag..."
  if git tag -a "v$VERSION" -m "Release v$VERSION" 2>/dev/null; then
    mark_step_done TAG
    echo "✅ Tag created: v$VERSION"
  else
    # Check if tag already exists
    if git rev-parse "v$VERSION" >/dev/null 2>&1; then
      echo "⏭️  Tag already exists: v$VERSION"
      mark_step_done TAG
    else
      echo "❌ Tag creation failed! Fix the errors and run the script again."
      exit 1
    fi
  fi
else
  echo "⏭️  Step 8: Tag (already done)"
fi

echo ""

# Step 9: Push to GitHub
if ! is_step_done PUSH; then
  echo "⬆️  Step 9: Pushing to GitHub..."
  if git push origin main && git push origin "v$VERSION"; then
    mark_step_done PUSH
    echo "✅ Pushed to GitHub"
  else
    echo "❌ Push failed! Check your network and run the script again."
    exit 1
  fi
else
  echo "⏭️  Step 9: Push (already done)"
fi

echo ""

# Step 10: Create GitHub Release
if ! is_step_done RELEASE; then
  echo "📰 Step 10: Creating GitHub Release..."
  
  # Check if gh CLI is installed
  if command -v gh &> /dev/null; then
    echo "Using GitHub CLI to create release..."
    
    # Check if release already exists
    if gh release view "v$VERSION" &>/dev/null; then
      echo "⏭️  GitHub Release already exists"
      mark_step_done RELEASE
    else
      # Check if CHANGELOG.md exists
      if [ -f "CHANGELOG.md" ]; then
        if gh release create "v$VERSION" \
          --title "ChunkFlow v$VERSION" \
          --notes-file CHANGELOG.md \
          --verify-tag; then
          mark_step_done RELEASE
          echo "✅ GitHub Release created successfully!"
        else
          echo "❌ GitHub Release creation failed! Run the script again to retry."
          exit 1
        fi
      else
        # Generate release notes automatically
        if gh release create "v$VERSION" \
          --title "ChunkFlow v$VERSION" \
          --generate-notes \
          --verify-tag; then
          mark_step_done RELEASE
          echo "✅ GitHub Release created with auto-generated notes!"
        else
          echo "❌ GitHub Release creation failed! Run the script again to retry."
          exit 1
        fi
      fi
    fi
  else
    echo "⚠️  GitHub CLI (gh) is not installed."
    echo ""
    echo "📝 Manual steps to create GitHub Release:"
    echo "1. Go to: https://github.com/Sunny-117/chunkflow/releases/new"
    echo "2. Select tag: v$VERSION"
    echo "3. Title: ChunkFlow v$VERSION"
    echo "4. Copy the changelog from CHANGELOG.md"
    echo "5. Publish the release"
    echo ""
    read -p "Press enter after creating the release manually..."
    mark_step_done RELEASE
  fi
else
  echo "⏭️  Step 10: GitHub Release (already done)"
fi

echo ""

# Step 11: Update dist-tags
if ! is_step_done DISTTAG; then
  echo "🏷️  Step 11: Updating dist-tags..."
  # Automatically update latest tag for stable releases
  if [[ ! "$VERSION" =~ (alpha|beta|rc) ]]; then
    echo "Updating 'latest' tag for stable release v$VERSION..."
    chmod +x scripts/update-dist-tags.sh
    if ./scripts/update-dist-tags.sh "$VERSION" latest; then
      mark_step_done DISTTAG
      echo "✅ Dist-tags updated"
    else
      echo "❌ Dist-tag update failed! Run the script again to retry."
      exit 1
    fi
  else
    echo "⏭️  Skipping 'latest' tag update for pre-release version"
    mark_step_done DISTTAG
  fi
else
  echo "⏭️  Step 11: Dist-tags (already done)"
fi

echo ""
echo "✅ Release complete!"
echo ""
echo "🎉 Version $VERSION has been published to npm and GitHub!"
echo ""

# Clean up state file
clean_state
echo "🧹 Cleaned up release state"

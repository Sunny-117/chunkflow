#!/bin/bash

# ChunkFlow Release Script
# This script helps you release a new version to npm and GitHub

set -e

echo "🚀 ChunkFlow Release Script"
echo "============================"
echo ""

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

echo "📦 Step 1: Building packages..."
pnpm build

echo ""
echo "📝 Step 2: Running tests..."
pnpm test

echo ""
echo "🔍 Step 3: Type checking..."
pnpm typecheck

echo ""
echo "📋 Step 4: Applying changesets and updating versions..."
pnpm changeset version

echo ""
echo "📦 Step 5: Building packages again with new versions..."
pnpm build

echo ""
echo "🎯 Step 6: Publishing to npm..."
echo "Make sure you are logged in to npm (run 'npm login' if needed)"
read -p "Press enter to continue with publishing..."

pnpm changeset publish

echo ""
echo "📌 Step 7: Committing version changes..."
git add .
git commit -m "chore: release packages"

echo ""
echo "🏷️  Step 8: Creating git tag..."
# Get the version from one of the packages
VERSION=$(node -p "require('./packages/core/package.json').version")
git tag -a "v$VERSION" -m "Release v$VERSION"

echo ""
echo "⬆️  Step 9: Pushing to GitHub..."
git push origin main
git push origin "v$VERSION"

echo ""
echo "✅ Release complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to GitHub: https://github.com/Sunny-117/chunkflow/releases/new"
echo "2. Select tag: v$VERSION"
echo "3. Title: ChunkFlow v$VERSION"
echo "4. Copy the changelog from CHANGELOG.md"
echo "5. Publish the release"
echo ""
echo "Or use GitHub CLI:"
echo "gh release create v$VERSION --title \"ChunkFlow v$VERSION\" --notes-file CHANGELOG.md"

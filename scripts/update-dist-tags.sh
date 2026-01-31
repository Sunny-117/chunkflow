#!/bin/bash

# Update dist-tags for all packages
# Usage: ./scripts/update-dist-tags.sh <version> <tag>
# Example: ./scripts/update-dist-tags.sh 0.1.0 latest

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/update-dist-tags.sh <version> <tag>"
  echo "Example: ./scripts/update-dist-tags.sh 0.1.0 latest"
  echo ""
  echo "Common tags:"
  echo "  latest  - Stable release (default for npm install)"
  echo "  alpha   - Alpha/preview release"
  echo "  beta    - Beta release"
  echo "  next    - Next major version"
  exit 1
fi

VERSION=$1
TAG=$2

echo "🏷️  Updating dist-tags for all packages"
echo "Version: $VERSION"
echo "Tag: $TAG"
echo ""

# List of all published packages
PACKAGES=(
  "core"
  "protocol"
  "shared"
  "upload-client-react"
  "upload-client-vue"
  "upload-component-react"
  "upload-component-vue"
  "upload-server"
)

for pkg in "${PACKAGES[@]}"; do
  FULL_NAME="@chunkflowjs/$pkg"
  echo "📦 Updating $FULL_NAME..."
  
  # Check if version exists
  if npm view "$FULL_NAME@$VERSION" version &> /dev/null; then
    npm dist-tag add "$FULL_NAME@$VERSION" "$TAG"
    echo "   ✅ $FULL_NAME@$VERSION → $TAG"
  else
    echo "   ⚠️  Version $VERSION not found for $FULL_NAME"
  fi
  echo ""
done

echo "✅ Dist-tags updated!"
echo ""
echo "Verify with:"
echo "  npm dist-tag ls @chunkflowjs/core"

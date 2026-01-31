#!/bin/bash

# Verify packages are ready for publishing
# Checks for workspace:* dependencies

echo "🔍 Verifying packages for publishing..."
echo ""

HAS_WORKSPACE_DEPS=false

for pkg in packages/*/package.json; do
  if [ -f "$pkg" ]; then
    PKG_NAME=$(node -p "require('./$pkg').name")
    
    # Check for workspace:* in dependencies
    if grep -q '"workspace:\*"' "$pkg"; then
      echo "⚠️  $PKG_NAME has workspace:* dependencies"
      HAS_WORKSPACE_DEPS=true
      
      # Show which dependencies
      grep -A 1 '"workspace:\*"' "$pkg" | grep -v "^--$"
      echo ""
    fi
  fi
done

if [ "$HAS_WORKSPACE_DEPS" = true ]; then
  echo "❌ Found workspace:* dependencies!"
  echo ""
  echo "These will be automatically converted during 'changeset publish'."
  echo "If they are not converted, the published packages will be broken."
  echo ""
  echo "To manually verify, run:"
  echo "  pnpm pack --pack-destination /tmp/test-pack"
  echo "  tar -tzf /tmp/test-pack/*.tgz | grep package.json"
  echo "  tar -xzf /tmp/test-pack/*.tgz -O package/package.json | grep workspace"
  echo ""
else
  echo "✅ No workspace:* dependencies found!"
fi

#!/bin/bash

# Release state management
# Tracks which steps have been completed to allow resuming from failures

STATE_FILE=".release-state"

# Initialize state file
init_state() {
  local version=$1
  echo "VERSION=$version" > "$STATE_FILE"
  echo "STEP_BUILD=0" >> "$STATE_FILE"
  echo "STEP_VERIFY=0" >> "$STATE_FILE"
  echo "STEP_TEST=0" >> "$STATE_FILE"
  echo "STEP_TYPECHECK=0" >> "$STATE_FILE"
  echo "STEP_VERSION=0" >> "$STATE_FILE"
  echo "STEP_REBUILD=0" >> "$STATE_FILE"
  echo "STEP_PUBLISH=0" >> "$STATE_FILE"
  echo "STEP_COMMIT=0" >> "$STATE_FILE"
  echo "STEP_TAG=0" >> "$STATE_FILE"
  echo "STEP_PUSH=0" >> "$STATE_FILE"
  echo "STEP_RELEASE=0" >> "$STATE_FILE"
  echo "STEP_DISTTAG=0" >> "$STATE_FILE"
}

# Load state
load_state() {
  if [ -f "$STATE_FILE" ]; then
    source "$STATE_FILE"
    return 0
  else
    return 1
  fi
}

# Mark step as completed
mark_step_done() {
  local step=$1
  if [ -f "$STATE_FILE" ]; then
    sed -i.bak "s/^STEP_${step}=0/STEP_${step}=1/" "$STATE_FILE"
    rm -f "${STATE_FILE}.bak"
  fi
}

# Check if step is done
is_step_done() {
  local step=$1
  if [ -f "$STATE_FILE" ]; then
    local value=$(grep "^STEP_${step}=" "$STATE_FILE" | cut -d= -f2)
    [ "$value" = "1" ]
  else
    return 1
  fi
}

# Clean state file
clean_state() {
  rm -f "$STATE_FILE" "${STATE_FILE}.bak"
}

# Show current state
show_state() {
  if [ -f "$STATE_FILE" ]; then
    echo "📊 Current release state:"
    echo ""
    source "$STATE_FILE"
    echo "  Version: $VERSION"
    echo ""
    echo "  Steps completed:"
    [ "$STEP_BUILD" = "1" ] && echo "    ✅ Build" || echo "    ⏸️  Build"
    [ "$STEP_VERIFY" = "1" ] && echo "    ✅ Verify" || echo "    ⏸️  Verify"
    [ "$STEP_TEST" = "1" ] && echo "    ✅ Test" || echo "    ⏸️  Test"
    [ "$STEP_TYPECHECK" = "1" ] && echo "    ✅ Typecheck" || echo "    ⏸️  Typecheck"
    [ "$STEP_VERSION" = "1" ] && echo "    ✅ Version update" || echo "    ⏸️  Version update"
    [ "$STEP_REBUILD" = "1" ] && echo "    ✅ Rebuild" || echo "    ⏸️  Rebuild"
    [ "$STEP_PUBLISH" = "1" ] && echo "    ✅ Publish" || echo "    ⏸️  Publish"
    [ "$STEP_COMMIT" = "1" ] && echo "    ✅ Commit" || echo "    ⏸️  Commit"
    [ "$STEP_TAG" = "1" ] && echo "    ✅ Tag" || echo "    ⏸️  Tag"
    [ "$STEP_PUSH" = "1" ] && echo "    ✅ Push" || echo "    ⏸️  Push"
    [ "$STEP_RELEASE" = "1" ] && echo "    ✅ GitHub Release" || echo "    ⏸️  GitHub Release"
    [ "$STEP_DISTTAG" = "1" ] && echo "    ✅ Dist-tags" || echo "    ⏸️  Dist-tags"
    echo ""
  else
    echo "No release in progress"
  fi
}

# Export functions
export -f init_state load_state mark_step_done is_step_done clean_state show_state

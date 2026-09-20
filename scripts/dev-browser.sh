#!/usr/bin/env bash

# ==============================================================================
# HigherBits.dev — Automated Dev Browser Launcher with MCP Support
#
# Flags included:
#   --enable-automation        Displays top banner: "Chrome is being controlled by automated test software"
#   --remote-debugging-port    Enables MCP (chrome-devtools) connection on port 9222
#   --user-data-dir            Isolated profile directory dedicated to dev/MCP
# ==============================================================================

PORT=9222
TARGET_URL="${1:-http://localhost:3000}"
USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome-DevBrowser"
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Check if Chrome binary exists
if [ ! -f "$CHROME_PATH" ]; then
  if [ -f "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" ]; then
    CHROME_PATH="/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
  elif command -v google-chrome &> /dev/null; then
    CHROME_PATH="$(command -v google-chrome)"
  elif command -v chromium &> /dev/null; then
    CHROME_PATH="$(command -v chromium)"
  else
    echo "❌ Error: Google Chrome executable not found at $CHROME_PATH"
    exit 1
  fi
fi

# Ensure user data directory exists
mkdir -p "$USER_DATA_DIR"

# Check if port 9222 is already in use
if lsof -i :$PORT > /dev/null 2>&1; then
  echo "ℹ️  Dev browser is already running on port $PORT."
  echo "🌐 Navigating to $TARGET_URL..."
  # Open URL in existing instance if possible
  "$CHROME_PATH" \
    --user-data-dir="$USER_DATA_DIR" \
    "$TARGET_URL" > /dev/null 2>&1 &
  exit 0
fi

echo "🚀 Launching Dev Browser with MCP & Automation enabled..."
echo "   • Target:        $TARGET_URL"
echo "   • Debug Port:    $PORT (MCP ready)"
echo "   • Profile Dir:   $USER_DATA_DIR"
echo "   • Infobar:       'Chrome is being controlled by automated test software'"

# Ensure hardware acceleration is enabled in Local State
LOCAL_STATE_FILE="$USER_DATA_DIR/Local State"
if [ -f "$LOCAL_STATE_FILE" ]; then
  node -e "
    const fs = require('fs');
    try {
      const p = process.argv[1];
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      data.hardware_acceleration_mode = { enabled: true };
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
  " "$LOCAL_STATE_FILE"
fi

# Launch Chrome in background and disown
"$CHROME_PATH" \
  --enable-automation \
  --remote-debugging-port=$PORT \
  --user-data-dir="$USER_DATA_DIR" \
  --ignore-gpu-blocklist \
  --enable-gpu-rasterization \
  --enable-webgl \
  --no-first-run \
  --no-default-browser-check \
  "$TARGET_URL" > /dev/null 2>&1 &

CHROME_PID=$!
disown $CHROME_PID

echo "✅ Dev browser launched successfully (PID: $CHROME_PID)."

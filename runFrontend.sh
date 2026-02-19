#!/usr/bin/env bash
set -euo pipefail

# Run the Next.js app locally.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_NODE_MODULES="$SCRIPT_DIR/node_modules"
APP_NODE_MODULES="$SCRIPT_DIR/app/node_modules"

# Next.js may resolve CSS package imports from the workspace root.
# Ensure root-level node_modules points to app dependencies.
if [ -L "$ROOT_NODE_MODULES" ]; then
  CURRENT_LINK_TARGET="$(readlink "$ROOT_NODE_MODULES")"
  # Replace stale or incorrect symlinks (including dangling links).
  if [ "$CURRENT_LINK_TARGET" != "$APP_NODE_MODULES" ] || [ ! -e "$ROOT_NODE_MODULES" ]; then
    rm "$ROOT_NODE_MODULES"
  fi
elif [ -e "$ROOT_NODE_MODULES" ] && [ ! -d "$ROOT_NODE_MODULES/tailwindcss" ]; then
  rm -rf "$ROOT_NODE_MODULES"
fi

if [ ! -e "$ROOT_NODE_MODULES" ] && [ ! -L "$ROOT_NODE_MODULES" ]; then
  ln -s "$APP_NODE_MODULES" "$ROOT_NODE_MODULES"
fi

cd "$SCRIPT_DIR/app"

# Install deps if node_modules is missing.
if [ ! -d "node_modules" ]; then
  npm install
fi

node ./scripts/patch-browserslist.js
npm run dev -- --webpack

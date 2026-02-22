#!/usr/bin/env bash
set -euo pipefail

NODE_DEFAULT="--max-old-space-size=14000"
export NODE_OPTIONS="${NODE_OPTIONS:-$NODE_DEFAULT}"
if [[ "$NODE_OPTIONS" != *"scripts/filter-noisy-logs.js"* ]]; then
  export NODE_OPTIONS="$NODE_OPTIONS --require ./scripts/filter-noisy-logs.js"
fi
export BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA=true
export BROWSERSLIST_IGNORE_OLD_DATA=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/app"

echo "Checking formatting..."
npm run format:check

echo "Running lint..."
npm run lint

echo "Running tests (CI mode)..."
npm run test:ci

GREEN=$'\033[0;32m'
RESET=$'\033[0m'
export GREEN_COLOR="$GREEN"
export RESET_COLOR="$RESET"

echo "Checking coverage threshold (>=99%)..."
export COVERAGE_TARGET=99
node scripts/checkCoverage.js

echo "Running typecheck..."
npm run typecheck

echo "Building frontend..."
npm run build

echo "precommit checks passed."

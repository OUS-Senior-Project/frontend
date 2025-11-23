#!/usr/bin/env bash
set -euo pipefail

# Lint, format, and test before committing changes.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/app"

npm run format
npm run lint
CI=true npm test -- --watch=false

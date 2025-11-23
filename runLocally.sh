#!/usr/bin/env bash
set -euo pipefail

# Run the CRA app locally.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/app"

# Install deps if node_modules is missing.
if [ ! -d "node_modules" ]; then
  npm install
fi

npm start

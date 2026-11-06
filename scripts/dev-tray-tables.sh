#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/tray-tables"
PORT="${1:-3001}"

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Could not find package.json at: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
npm run dev -- -p "$PORT"

#!/bin/zsh
set -eu
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 22.12 or newer, then open this launcher again."
  read -r '?Press Enter to close.'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci --cache "${TMPDIR:-/tmp}/howard-npm-cache"
fi
if curl --silent --max-time 1 http://127.0.0.1:5173/ | grep -q 'Howard of War'; then
  open http://127.0.0.1:5173/
  exit 0
fi
(sleep 2; open http://127.0.0.1:5173/) &
npm run dev -- --port 5173 --strictPort

#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-4174}"
URL="http://127.0.0.1:${PORT}/"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
npm run preview -- --host 127.0.0.1 --port "$PORT" --strictPort &
PREV=$!
cleanup() { kill "$PREV" 2>/dev/null || true; wait "$PREV" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -sf "$URL" >/dev/null; then break; fi
  sleep 1
done

PUPPETEER_ROOT="${PUPPETEER_ROOT:-/tmp/pwa-smoke}"
if [[ ! -d "$PUPPETEER_ROOT/node_modules/puppeteer-core" ]]; then
  echo "Install puppeteer-core once: mkdir -p $PUPPETEER_ROOT && cd $PUPPETEER_ROOT && npm install puppeteer-core@24.8.2" >&2
  exit 2
fi
cp "$ROOT/scripts/pwa-offline-smoke.mjs" "$PUPPETEER_ROOT/run.mjs"
cd "$PUPPETEER_ROOT"
PREVIEW_URL="$URL" node run.mjs

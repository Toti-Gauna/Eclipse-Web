#!/usr/bin/env bash
# Starts an isolated `next dev` (own distDir) so several can run side by side.
# Usage: scripts/dev.sh <port>   →  http://localhost:<port>/es/
set -euo pipefail
PORT="${1:-3000}"
export NEXT_DIST_DIR=".next-dev-${PORT}"
export NEXT_TELEMETRY_DISABLED=1
exec npx next dev --port "$PORT"

#!/bin/bash
# Health check for Playmorrow production endpoints
# Usage: ./scripts/health-check.sh [--quiet]
# Logs to scripts/health-check.log
# Sends macOS notification on failure (optional)
#
# For cron (every 5 minutes):
#   * * * * * /Users/nataliawindelboth/Desktop/FRONTEND/playmorrow/scripts/health-check.sh --quiet

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/health-check.log"
QUIET="${1:-}"
MAX_TIME=10

ENDPOINTS=(
  "https://playmorrow.vercel.app"
  "https://playmorrow-api-aged-mountain-9542.fly.dev/api/health"
  "https://playmorrow-api-aged-mountain-9542.fly.dev/api/games"
)

FAILED=0
RESULTS=""

log() {
  local level="$1"
  shift
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
  echo "$msg" >> "$LOG_FILE"
  [ "$QUIET" != "--quiet" ] && echo "$msg"
}

notify() {
  local title="$1"
  local msg="$2"
  if command -v osascript &>/dev/null; then
    osascript -e "display notification \"$msg\" with title \"$title\" sound name \"Basso\"" 2>/dev/null || true
  fi
}

log "INFO" "=== Health Check Started ==="

for url in "${ENDPOINTS[@]}"; do
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $MAX_TIME "$url" 2>/dev/null || echo "000")
  if [ "$status_code" = "200" ] || [ "$status_code" = "301" ] || [ "$status_code" = "302" ]; then
    RESULTS="${RESULTS}OK:   $url ($status_code)\n"
    log "OK" "$url (HTTP $status_code)"
  else
    RESULTS="${RESULTS}FAIL: $url (HTTP $status_code)\n"
    log "FAIL" "$url (HTTP $status_code)"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  log "ERROR" "=== Health Check FAILED ==="
  notify "Playmorrow Health Check" "One or more endpoints are down!"
else
  log "INFO" "=== Health Check Passed ==="
fi

echo ""
echo -e "$RESULTS"

exit $FAILED

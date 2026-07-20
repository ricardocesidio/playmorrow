#!/bin/bash
# Simple health check for Playmorrow production endpoints
# Usage: ./scripts/health-check.sh
# Returns non-zero if any endpoint fails.

ENDPOINTS=(
  "https://playmorrow.vercel.app"
  "https://playmorrow-api-production.up.railway.app/health"
  "https://playmorrow-api-production.up.railway.app/api/games"
)

FAILED=0
for url in "${ENDPOINTS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  if [ "$status" != "200" ]; then
    echo "FAIL: $url (HTTP $status)"
    FAILED=1
  else
    echo "OK:   $url"
  fi
done

exit $FAILED

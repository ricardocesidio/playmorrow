#!/usr/bin/env bash
# One-time setup: store backup pipeline secrets in gitignored .env.backup-secrets
# and print the gh secret set commands to run. Secrets are NEVER echoed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.env.backup-secrets"
umask 077

if [[ -z "${1:-}" || -z "${2:-}" ]]; then
  echo "Usage: $0 <backup-database-url-file> <fly-app-name>" >&2
  echo "  backup-database-url-file: file containing the read-only role URL" >&2
  echo "  fly-app-name: e.g. playmorrow-api-aged-mountain-9542" >&2
  exit 1
fi
URL_FILE="$1"
FLY_APP="$2"

echo "# Backup pipeline secrets (auto-generated $(date -u +%Y-%m-%dT%H:%M:%SZ))" > "$OUT"
echo "BACKUP_DATABASE_URL=$(cat "$URL_FILE")" >> "$OUT"

# Read R2 creds from the Fly app without printing them.
R2_ENDPOINT=$(flyctl ssh console -a "$FLY_APP" -C "sh -lc 'printenv R2_ENDPOINT'" 2>/dev/null | tr -d '\r' | grep -E '^https?://' | head -1)
R2_BUCKET=$(flyctl ssh console -a "$FLY_APP" -C "sh -lc 'printenv S3_BUCKET'" 2>/dev/null | tr -d '\r' | grep -E '^[a-z0-9-]+$' | head -1)
R2_AK=$(flyctl ssh console -a "$FLY_APP" -C "sh -lc 'printenv AWS_ACCESS_KEY_ID'" 2>/dev/null | tr -d '\r' | grep -E '^[A-Za-z0-9]+$' | head -1)
R2_SK=$(flyctl ssh console -a "$FLY_APP" -C "sh -lc 'printenv AWS_SECRET_ACCESS_KEY'" 2>/dev/null | tr -d '\r' | grep -E '^[A-Za-z0-9/+=]+$' | head -1)

[[ -n "$R2_ENDPOINT" ]] && echo "R2_ENDPOINT=$R2_ENDPOINT" >> "$OUT"
[[ -n "$R2_BUCKET" ]] && echo "R2_BUCKET=$R2_BUCKET" >> "$OUT"
[[ -n "$R2_AK" ]] && echo "R2_ACCESS_KEY_ID=$R2_AK" >> "$OUT"
[[ -n "$R2_SK" ]] && echo "R2_SECRET_ACCESS_KEY=$R2_SK" >> "$OUT"

echo "✅ Wrote $(grep -c '=' "$OUT") secrets to $OUT (chmod 600, gitignored)"
echo ""
echo "Run these once (after gh auth login):"
for k in BACKUP_DATABASE_URL R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY; do
  if grep -q "^$k=" "$OUT"; then
    echo "  gh secret set $k --repo ricardocesidio/playmorrow < <(grep \"^$k=\" \"$OUT\" | cut -d= -f2-)"
  else
    echo "  # WARN: $k not found on Fly app" >&2
  fi
done

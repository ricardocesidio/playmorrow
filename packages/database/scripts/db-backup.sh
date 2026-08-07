#!/usr/bin/env bash
# Database backup script — produces a compressed pg_dump + SHA-256 checksum and
# optionally uploads it to an S3-compatible endpoint (Cloudflare R2).
#
# Usage:
#   BACKUP_DATABASE_URL=... ./db-backup.sh [--upload] [--keep-days N]
#
# Environment:
#   BACKUP_DATABASE_URL  required. Read-only role URL (direct host, NOT -pooler).
#   PGDUMP_ARGS          extra pg_dump args (e.g. --exclude-schema=neon_auth).
#   BACKUP_DIR           local staging dir (default: /tmp/playmorrow-backups).
#   BACKUP_PREFIX        object key prefix (default: db-backups).
#   R2_ENDPOINT / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
#                        required for --upload.
#   KEEP_DAYS            retention in days (default 14) when --upload.
#
# The script never prints the connection string or password. Only the host,
# database name, object key, and checksum are shown.

set -euo pipefail

URL="${BACKUP_DATABASE_URL:-}"
if [[ -z "$URL" ]]; then
  echo "❌ BACKUP_DATABASE_URL is required (read-only role, direct host)" >&2
  exit 1
fi

PGDUMP_ARGS="${PGDUMP_ARGS:---exclude-schema=neon_auth}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/playmorrow-backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-db-backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
UPLOAD=false
if [[ "${1:-}" == "--upload" ]]; then UPLOAD=true; fi

HOST="$(node -e 'console.log(new URL(process.argv[1]).hostname)' "$URL")"
DB="$(node -e 'console.log(decodeURIComponent(new URL(process.argv[1]).pathname.replace(/^\//, "")))' "$URL")"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${BACKUP_DIR}/${STAMP}.dump"
CHECKSUM_FILE="${DUMP_FILE}.sha256"

echo "== Dumping ${HOST}/${DB} → ${DUMP_FILE}"
pg_dump --no-owner --no-privileges -Fc $PGDUMP_ARGS "$URL" -f "$DUMP_FILE"
shasum -a 256 "$DUMP_FILE" | awk '{print $1}' > "$CHECKSUM_FILE"
SIZE="$(stat -f%z "$DUMP_FILE" 2>/dev/null || stat -c%s "$DUMP_FILE")"
echo "   Size: ${SIZE} bytes   SHA-256: $(cat "$CHECKSUM_FILE")"

if [[ "$UPLOAD" == "true" ]]; then
  for v in R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY; do
    if [[ -z "${!v:-}" ]]; then echo "❌ $v is required for --upload" >&2; exit 1; fi
  done
  OBJ_PREFIX="${R2_BUCKET}/${BACKUP_PREFIX}"
  echo "== Uploading to r2://${OBJ_PREFIX}/${STAMP}.dump"
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws --endpoint-url "$R2_ENDPOINT" s3 cp "$DUMP_FILE" "s3://${OBJ_PREFIX}/${STAMP}.dump" >/dev/null
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws --endpoint-url "$R2_ENDPOINT" s3 cp "$CHECKSUM_FILE" "s3://${OBJ_PREFIX}/${STAMP}.dump.sha256" >/dev/null

  echo "== Retention: keeping ${KEEP_DAYS} days, pruning older keys"
  CUTOFF="$(date -u -v-${KEEP_DAYS}d +%Y%m%dT%H%M%SZ 2>/dev/null || date -u -d "${KEEP_DAYS} days ago" +%Y%m%dT%H%M%SZ)"
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws --endpoint-url "$R2_ENDPOINT" s3 ls "s3://${OBJ_PREFIX}/" --recursive | while read -r line; do
    KEY="$(echo "$line" | awk '{print $4}')"
    BASENAME="$(basename "$KEY" .sha256)"
    KEY_STAMP="${BASENAME%%.dump}"
    if [[ "$KEY_STAMP" < "$CUTOFF" ]]; then
      AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
      AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
      aws --endpoint-url "$R2_ENDPOINT" s3 rm "s3://${OBJ_PREFIX}/${KEY}" >/dev/null && echo "   pruned: ${KEY}"
    fi
  done
fi

echo "✅ Backup complete: ${DUMP_FILE}"

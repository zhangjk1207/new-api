#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common-prod.sh
source "$SCRIPT_DIR/common-prod.sh"
load_production_environment

database_name="$(production_database_name)"
timestamp="$(date +%Y%m%d%H%M%S)"
backup_dir="$ZHIQING_PROD_APP_DIR/backups"
backup_file="$backup_dir/${database_name}-before-docker-${ZHIQING_IMAGE_TAG}-${timestamp}.dump"
mkdir -p "$backup_dir"

docker exec "$ZHIQING_POSTGRES_CONTAINER" sh -lc \
  'pg_dump -U "$POSTGRES_USER" --format=custom -d "$1"' \
  sh "$database_name" >"$backup_file"
if [[ ! -s "$backup_file" ]]; then
  rm -f "$backup_file"
  echo "production backup is empty" >&2
  exit 1
fi
sha256sum "$backup_file" >"$backup_file.sha256"
chmod 600 "$backup_file" "$backup_file.sha256"
echo "$backup_file"

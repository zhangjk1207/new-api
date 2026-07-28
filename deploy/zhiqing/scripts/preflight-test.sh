#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
load_runtime_environment

mkdir -p "$ZHIQING_PREFLIGHT_DATA_DIR" "$ZHIQING_PREFLIGHT_LOG_DIR"

database_name="$(test_database_name)"
docker exec "$ZHIQING_POSTGRES_CONTAINER" sh -lc \
  'pg_dump -U "$POSTGRES_USER" --schema-only -d "$1" >/dev/null' \
  sh "$database_name"

cleanup() {
  "${COMPOSE[@]}" --profile preflight rm -f -s app-preflight >/dev/null 2>&1 || true
}
trap cleanup EXIT

"${COMPOSE[@]}" --profile preflight up -d --no-deps app-preflight
wait_for_healthy app-preflight 45
curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:17992/api/status >/dev/null
echo "preflight passed: image=$ZHIQING_IMAGE_TAG database=$database_name"

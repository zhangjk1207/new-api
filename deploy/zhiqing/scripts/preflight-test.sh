#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
load_runtime_environment

mkdir -p "$ZHIQING_PREFLIGHT_DATA_DIR" "$ZHIQING_PREFLIGHT_LOG_DIR"
rm -f "$ZHIQING_PREFLIGHT_DATA_DIR/one-api.db"
sqlite3 "$ZHIQING_DATA_DIR/one-api.db" ".backup '$ZHIQING_PREFLIGHT_DATA_DIR/one-api.db'"

cleanup() {
  "${COMPOSE[@]}" --profile preflight rm -f -s app-preflight >/dev/null 2>&1 || true
}
trap cleanup EXIT

"${COMPOSE[@]}" --profile preflight up -d --no-deps app-preflight
wait_for_healthy app-preflight 45
curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:17992/api/status >/dev/null
echo "preflight passed: http://127.0.0.1:17992/api/status"

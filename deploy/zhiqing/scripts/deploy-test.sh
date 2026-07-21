#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
load_runtime_environment

"$SCRIPT_DIR/preflight-test.sh"

if [[ -f "$ZHIQING_APP_DIR/new-api.pid" ]]; then
  native_pid="$(<"$ZHIQING_APP_DIR/new-api.pid")"
  if [[ -n "$native_pid" ]] && kill -0 "$native_pid" 2>/dev/null; then
    "$ZHIQING_APP_DIR/stop.sh"
  fi
fi

if ! "${COMPOSE[@]}" up -d --no-build --force-recreate app; then
  "$ZHIQING_APP_DIR/start.sh"
  exit 1
fi

if ! wait_for_healthy app 45; then
  "${COMPOSE[@]}" down
  "$ZHIQING_APP_DIR/start.sh"
  exit 1
fi

if ! "${COMPOSE[@]}" up -d --no-build --force-recreate nginx || ! wait_for_healthy nginx 30; then
  "${COMPOSE[@]}" down
  "$ZHIQING_APP_DIR/start.sh"
  exit 1
fi

curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:7992/api/status >/dev/null
echo "deployed zhiqing test image $ZHIQING_IMAGE_TAG on port 7992"

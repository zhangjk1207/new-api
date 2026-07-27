#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common-prod.sh
source "$SCRIPT_DIR/common-prod.sh"
load_production_environment

"$SCRIPT_DIR/preflight-prod.sh"
backup_file="$($SCRIPT_DIR/backup-prod.sh)"
echo "production backup created: $backup_file"

native_was_running=false
if [[ -s "$ZHIQING_PROD_APP_DIR/new-api.pid" ]]; then
  native_pid="$(<"$ZHIQING_PROD_APP_DIR/new-api.pid")"
  if [[ -n "$native_pid" ]] && kill -0 "$native_pid" 2>/dev/null; then
    native_was_running=true
  fi
fi

rollback_on_error() {
  status="$?"
  if [[ "$status" -eq 0 ]]; then
    return
  fi
  echo "production deployment failed; restoring native 7990" >&2
  restore_native_production
  exit "$status"
}
trap rollback_on_error EXIT

"${PROD_COMPOSE[@]}" up -d --no-build --force-recreate app
wait_for_prod_healthy app 45

if [[ "$native_was_running" == true ]]; then
  "$ZHIQING_PROD_APP_DIR/stop.sh"
fi

"${PROD_COMPOSE[@]}" up -d --no-build --force-recreate nginx
wait_for_prod_healthy nginx 30
curl --noproxy '*' --fail --silent --show-error \
  http://127.0.0.1:7990/api/status >/dev/null

prod_app_id="$("${PROD_COMPOSE[@]}" ps -q app)"
prod_image_id="$(docker inspect --format '{{.Image}}' "$prod_app_id")"
test_app_id="$(test_app_container_id)"
test_image_id="$(docker inspect --format '{{.Image}}' "$test_app_id")"
if [[ "$prod_image_id" != "$test_image_id" ]]; then
  echo "post-deploy image mismatch between 7990 and 7992" >&2
  exit 1
fi

mkdir -p "$ZHIQING_PROD_APP_DIR/docker"
printf '%s\n' "$ZHIQING_IMAGE_TAG" >"$ZHIQING_PROD_APP_DIR/docker/production-image-tag"
trap - EXIT
echo "deployed production image $ZHIQING_IMAGE_TAG on port 7990"

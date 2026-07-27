#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common-prod.sh
source "$SCRIPT_DIR/common-prod.sh"
load_production_environment

"${PROD_COMPOSE[@]}" config --quiet

image_id="$(docker image inspect "zhiqing-new-api:$ZHIQING_IMAGE_TAG" --format '{{.Id}}')"
test_container_id="$(test_app_container_id)"
test_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$test_container_id")"
test_image_id="$(docker inspect --format '{{.Image}}' "$test_container_id")"
if [[ "$test_status" != "healthy" ]]; then
  echo "7992 test app is not healthy: $test_status" >&2
  exit 1
fi
if [[ "$test_image_id" != "$image_id" ]]; then
  echo "image mismatch: 7992 is not running zhiqing-new-api:$ZHIQING_IMAGE_TAG" >&2
  exit 1
fi
curl --noproxy '*' --fail --silent --show-error \
  http://127.0.0.1:7992/api/status >/dev/null

database_name="$(production_database_name)"
docker exec "$ZHIQING_POSTGRES_CONTAINER" sh -lc \
  'pg_dump -U "$POSTGRES_USER" --schema-only -d "$1" >/dev/null' \
  sh "$database_name"

echo "production preflight passed: image=$ZHIQING_IMAGE_TAG database=$database_name"

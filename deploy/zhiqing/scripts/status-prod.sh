#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common-prod.sh
source "$SCRIPT_DIR/common-prod.sh"
load_production_environment

"${PROD_COMPOSE[@]}" ps
curl --noproxy '*' --fail --silent --show-error \
  http://127.0.0.1:7990/api/status >/dev/null

prod_app_id="$("${PROD_COMPOSE[@]}" ps -q app)"
test_app_id="$(test_app_container_id)"
if [[ -z "$prod_app_id" || -z "$test_app_id" ]]; then
  echo "production or test app container is missing" >&2
  exit 1
fi
prod_image_id="$(docker inspect --format '{{.Image}}' "$prod_app_id")"
test_image_id="$(docker inspect --format '{{.Image}}' "$test_app_id")"
if [[ "$prod_image_id" != "$test_image_id" ]]; then
  echo "7990 and 7992 are running different image IDs" >&2
  exit 1
fi
echo "7990 and 7992 are healthy on the same image: $prod_image_id"

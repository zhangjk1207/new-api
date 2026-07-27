#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/../.." && pwd)"

export ZHIQING_PROD_APP_DIR="${ZHIQING_PROD_APP_DIR:-/data2/zhangjikang/work_dir/newapi_remote_10808}"
export ZHIQING_PROD_DATA_DIR="${ZHIQING_PROD_DATA_DIR:-$ZHIQING_PROD_APP_DIR}"
export ZHIQING_PROD_LOG_DIR="${ZHIQING_PROD_LOG_DIR:-$ZHIQING_PROD_APP_DIR/logs}"
export ZHIQING_IMAGE_TAG="${ZHIQING_IMAGE_TAG:-$(git -C "$REPO_DIR" rev-parse --short HEAD)}"
export ZHIQING_UID="${ZHIQING_UID:-$(id -u)}"
export ZHIQING_GID="${ZHIQING_GID:-$(id -g)}"
export ZHIQING_POSTGRES_CONTAINER="${ZHIQING_POSTGRES_CONTAINER:-workflow-postgres}"

PROD_COMPOSE=(docker compose -f "$DEPLOY_DIR/compose.prod.yml")

load_production_environment() {
  if [[ ! -s "$ZHIQING_PROD_APP_DIR/session_secret" ]]; then
    echo "missing production session secret: $ZHIQING_PROD_APP_DIR/session_secret" >&2
    return 1
  fi
  if [[ ! -s "$ZHIQING_PROD_APP_DIR/audit.env" ]]; then
    echo "missing production database environment: $ZHIQING_PROD_APP_DIR/audit.env" >&2
    return 1
  fi

  SESSION_SECRET="$(<"$ZHIQING_PROD_APP_DIR/session_secret")"
  export SESSION_SECRET

  set -a
  # shellcheck disable=SC1090
  source "$ZHIQING_PROD_APP_DIR/audit.env"
  set +a

  local variable
  for variable in SQL_DSN LOG_SQL_DSN CONVERSATION_AUDIT_DSN; do
    if [[ -z "${!variable:-}" ]]; then
      echo "missing production variable: $variable" >&2
      return 1
    fi
  done
  export SQL_DSN LOG_SQL_DSN CONVERSATION_AUDIT_DSN
}

production_database_name() {
  local dsn_without_query="${SQL_DSN%%\?*}"
  local database_name="${dsn_without_query##*/}"
  if [[ -z "$database_name" || "$database_name" == "$dsn_without_query" ]]; then
    echo "unable to determine production database name from SQL_DSN" >&2
    return 1
  fi
  printf '%s\n' "$database_name"
}

test_app_container_id() {
  local container_id
  container_id="$(docker ps -q \
    --filter label=com.docker.compose.project=zhiqing-test \
    --filter label=com.docker.compose.service=app)"
  if [[ -z "$container_id" ]]; then
    echo "7992 test app container is not running" >&2
    return 1
  fi
  printf '%s\n' "$container_id"
}

wait_for_prod_healthy() {
  local service="$1"
  local attempts="${2:-30}"
  local container_id status

  container_id="$("${PROD_COMPOSE[@]}" ps -q "$service")"
  if [[ -z "$container_id" ]]; then
    echo "production container not found for service: $service" >&2
    return 1
  fi

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
      docker logs --tail 100 "$container_id" >&2 || true
      return 1
    fi
    sleep 2
  done

  echo "timed out waiting for production $service to become healthy" >&2
  docker logs --tail 100 "$container_id" >&2 || true
  return 1
}

restore_native_production() {
  "${PROD_COMPOSE[@]}" down >/dev/null 2>&1 || true
  "$ZHIQING_PROD_APP_DIR/start.sh"
  curl --noproxy '*' --fail --silent --show-error \
    http://127.0.0.1:7990/api/status >/dev/null
}

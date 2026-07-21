#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/../.." && pwd)"

export ZHIQING_APP_DIR="${ZHIQING_APP_DIR:-/data2/zhangjikang/work_dir/newapi_test_7992}"
export ZHIQING_DATA_DIR="${ZHIQING_DATA_DIR:-$ZHIQING_APP_DIR}"
export ZHIQING_LOG_DIR="${ZHIQING_LOG_DIR:-$ZHIQING_APP_DIR/logs}"
export ZHIQING_PREFLIGHT_DATA_DIR="${ZHIQING_PREFLIGHT_DATA_DIR:-$ZHIQING_APP_DIR/docker/preflight-data}"
export ZHIQING_PREFLIGHT_LOG_DIR="${ZHIQING_PREFLIGHT_LOG_DIR:-$ZHIQING_APP_DIR/docker/preflight-logs}"
export ZHIQING_IMAGE_TAG="${ZHIQING_IMAGE_TAG:-$(git -C "$REPO_DIR" rev-parse --short HEAD)}"
export ZHIQING_UID="${ZHIQING_UID:-$(id -u)}"
export ZHIQING_GID="${ZHIQING_GID:-$(id -g)}"

COMPOSE=(docker compose -f "$DEPLOY_DIR/compose.test.yml")

load_runtime_environment() {
  if [[ ! -s "$ZHIQING_APP_DIR/session_secret" ]]; then
    echo "missing session secret: $ZHIQING_APP_DIR/session_secret" >&2
    return 1
  fi
  if [[ ! -s "$ZHIQING_APP_DIR/audit.env" ]]; then
    echo "missing audit environment: $ZHIQING_APP_DIR/audit.env" >&2
    return 1
  fi

  SESSION_SECRET="$(<"$ZHIQING_APP_DIR/session_secret")"
  export SESSION_SECRET

  set -a
  # shellcheck disable=SC1090
  source "$ZHIQING_APP_DIR/audit.env"
  set +a
  CONVERSATION_AUDIT_CLICKHOUSE_DSN="${CONVERSATION_AUDIT_CLICKHOUSE_DSN//@127.0.0.1:/@aisales-clickhouse:}"
  CONVERSATION_AUDIT_CLICKHOUSE_DSN="${CONVERSATION_AUDIT_CLICKHOUSE_DSN//@localhost:/@aisales-clickhouse:}"
  export CONVERSATION_AUDIT_CLICKHOUSE_DSN
}

wait_for_healthy() {
  local service="$1"
  local attempts="${2:-30}"
  local container_id status

  container_id="$("${COMPOSE[@]}" ps -q "$service")"
  if [[ -z "$container_id" ]]; then
    echo "container not found for service: $service" >&2
    return 1
  fi

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
      docker logs --tail 80 "$container_id" >&2 || true
      return 1
    fi
    sleep 2
  done

  echo "timed out waiting for $service to become healthy" >&2
  docker logs --tail 80 "$container_id" >&2 || true
  return 1
}

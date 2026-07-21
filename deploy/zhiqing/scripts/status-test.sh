#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
load_runtime_environment

"${COMPOSE[@]}" ps
curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:7992/api/status >/dev/null
echo "zhiqing test service is healthy on port 7992"

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
load_runtime_environment

"${COMPOSE[@]}" down
"$ZHIQING_APP_DIR/start.sh"
curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:7992/api/status >/dev/null
echo "rolled back 7992 to the native binary deployment"

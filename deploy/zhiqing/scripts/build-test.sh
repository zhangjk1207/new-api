#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"
load_runtime_environment

docker pull nginx:1.27-alpine
"${COMPOSE[@]}" build app agent
echo "built zhiqing-new-api:$ZHIQING_IMAGE_TAG and zhiqing-pi-agent:$ZHIQING_AGENT_IMAGE_TAG"

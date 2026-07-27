#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common-prod.sh
source "$SCRIPT_DIR/common-prod.sh"
load_production_environment

restore_native_production
echo "rolled back production 7990 to the native binary deployment"

#!/bin/bash
# Runner para testes BATS dos scripts .add
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

cd "$ROOT_DIR"
npx bats "$SCRIPT_DIR"/*.bats "$@"

#!/bin/bash
# ============================================
# BACKLOG — compatibility wrapper
# The project backlog: a prioritised ticket board the repository carries.
# Work that is decided but not started — the gap between the pipeline and
# the delivery index.
# ============================================
# Usage: bash .codeadd/scripts/backlog.sh add                < ticket.json
#        bash .codeadd/scripts/backlog.sh update  <id>       < patch.json
#        bash .codeadd/scripts/backlog.sh comment <id>       < comment.json
#        bash .codeadd/scripts/backlog.sh move    <id> --top | --after <id> | --bottom
#        bash .codeadd/scripts/backlog.sh remove  <id>
#        bash .codeadd/scripts/backlog.sh list   [--all | --status <name>]
#        bash .codeadd/scripts/backlog.sh search  <query>
#
# Dependencies: bash 3.2+, node >= 18
#
# This wrapper delegates all operations to the adjacent Node CLI
# (backlog-cli.cjs), which calls the canonical core (backlog-core.cjs).
# The wrapper handles: Node guard, ID allocation for add, and invocation.
#
# THIS SCRIPT WRITES FILES AND NEVER COMMITS.
#
# THE FORMAT IS NOT DEFINED HERE. The two files, the ticket fields,
# the status vocabulary, the seven hard bans and the REFUSED= names live in
# add--doc-schemas/references/backlog.md.
#
# THE STATUS VOCABULARY BELONGS TO THE USER.
#
# THE ID COMES FROM THE SHARED GLOBAL COUNTER, via status.sh next-id B.
# ============================================

set -u

# --- Guards -------------------------------------------------------------
command -v node >/dev/null 2>&1 || { echo "ERROR=node-missing"; exit 2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
    cat >&2 <<'USAGE'
USAGE: bash .codeadd/scripts/backlog.sh <mode> [args]
  add                       < ticket.json
  update  <id>              < patch.json
  comment <id>              < comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>
  list    [--all | --status <name>]
  search  <query>
USAGE
}

MODE="${1:-}"
case "$MODE" in
    add|update|comment|move|remove|list|search) ;;
    *) echo "ERROR=bad-mode"; usage; exit 2 ;;
esac

# --- The id, for `add` only ---------------------------------------------
NEW_ID=""
if [ "$MODE" = "add" ]; then
    NEW_ID=$(bash "$SCRIPT_DIR/status.sh" next-id B 2>/dev/null || true)
    if ! printf '%s' "$NEW_ID" | grep -qE '^[0-9]{4}B$'; then
        echo "ERROR=id-allocation-failed"
        exit 1
    fi
fi

# --- Invoke the Node CLI -------------------------------------------------
BACKLOG_NEW_ID="$NEW_ID" node "$SCRIPT_DIR/backlog-cli.cjs" "$@"

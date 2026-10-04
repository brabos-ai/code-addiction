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
# THIS IS A THIN WRAPPER. Everything else is the adjacent Node CLI:
#   - the positional grammar and the --record-file channel live in
#     backlog-cli.cjs, whose exports the publication entry reuses;
#   - the canonical core is backlog-core.cjs, and storage is
#     backlog-storage.cjs — the same one the board server reads;
#   - the ID comes from the shared global counter, calculated natively by
#     backlog-id.cjs at the operation root; when BACKLOG_NEW_ID metadata is
#     supplied it is honored, and when it is explicitly malformed the
#     allocation error is the old one. NO ALLOCATOR RUNS IN BASH HERE, and
#     this wrapper never names status.sh or next-id.sh.
#
# THIS SCRIPT WRITES FILES AND NEVER COMMITS. The git route belongs to
# backlog-commit.sh/backlog-commit.cjs.
#
# THE FORMAT IS NOT DEFINED HERE. The two files, the ticket fields,
# the status vocabulary, the seven hard bans and the REFUSED= names live in
# add--doc-schemas/references/backlog.md.
#
# THE STATUS VOCABULARY BELONGS TO THE USER.
# ============================================

set -u

# --- The only guard that stays in bash -----------------------------------
command -v node >/dev/null 2>&1 || {
    echo "ERROR=node-missing"
    cat >&2 <<'GUIDE'
Node >= 18 must be reachable as `node` in this shell's PATH.
The native form runs with Node directly and needs no shell at all:
  node .codeadd/scripts/backlog-cli.cjs <mode> [args] [--record-file <path>]
GUIDE
    exit 2;
}

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

# --- Invoke the Node CLI --------------------------------------------------
node "$SCRIPT_DIR/backlog-cli.cjs" "$@"

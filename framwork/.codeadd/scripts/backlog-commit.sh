#!/bin/bash
# ============================================
# BACKLOG COMMIT
# The git route for a backlog write: wraps backlog.sh so the ticket reaches
# the BASE branch whatever branch the caller was standing on.
# ============================================
# Usage: bash .codeadd/scripts/backlog-commit.sh add            < ticket.json
#        bash .codeadd/scripts/backlog-commit.sh update  <id>   < patch.json
#        bash .codeadd/scripts/backlog-commit.sh comment <id>   < comment.json
#        bash .codeadd/scripts/backlog-commit.sh move    <id> --top | --after <id> | --bottom
#        bash .codeadd/scripts/backlog-commit.sh remove  <id>
#
# Dependencies: bash 3.2+, git, and whatever backlog.sh needs (node >= 18).
#
# Output: KEY=VALUE lines — ROUTE, BASE_BRANCH, TICKET_ID, SHA, PUSHED, and
#         DEGRADED when one applies, plus the additive PERSISTED, COMMITTED,
#         RECOVERY_PATH and RECOVERY_REF the native entry reports. The same
#         shape backlog.sh and delivered.sh emit, so one consumer parses all.
#
# Exit:   0 for a result, a DEGRADED one INCLUDED — the ticket was written and
#         that is the result. 1 when the write itself failed. 2 for caller
#         error: a bad mode, a READ mode, bad arguments, the local CLI's own
#         REFUSED=, or a refused worktree state.
#
# THIS IS A THIN WRAPPER. The route, the worktree and its lock, the
# path-scoped commit, the rebase, the push, the durable recovery refs and
# every degradation reason live in the adjacent native entry
# (backlog-commit.cjs), which parses once, captures the record once and calls
# the same domain operation the local CLI calls — through argument arrays,
# shell:false, and never a bash subprocess of its own. Reads are refused by
# the entry with ERROR=read-mode; call backlog.sh directly for those.
#
# THE STATUS VOCABULARY BELONGS TO THE USER.
#
# THIS SCRIPT WRITES THROUGH THE ENTRY AND DECIDES NOTHING ITSELF.
# ============================================

set -u

# --- The only guard that stays in bash -----------------------------------
command -v node >/dev/null 2>&1 || {
    echo "ERROR=node-missing"
    cat >&2 <<'GUIDE'
Node >= 18 must be reachable as `node` in this shell's PATH.
The native form runs with Node directly and needs no shell at all:
  node .codeadd/scripts/backlog-commit.cjs <write-mode> [args] [--record-file <path>]
GUIDE
    exit 2;
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Invoke the native publication entry ---------------------------------
node "$SCRIPT_DIR/backlog-commit.cjs" "$@"

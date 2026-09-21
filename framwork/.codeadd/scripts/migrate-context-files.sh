#!/bin/bash
# =============================================================================
# migrate-context-files.sh — fold legacy context files into AGENTS.md
# =============================================================================
# AGENTS.md is the only context file the framework writes and reads. Claude Code
# reads it only when no CLAUDE.md exists in the working directory or above, and
# Antigravity lets GEMINI.md override it, so a leftover legacy file hides or
# overrides AGENTS.md. This script removes them without losing a line.
#
# Usage:
#   bash .codeadd/scripts/migrate-context-files.sh     # run at the project root
#
# Candidates, in this order: CLAUDE.md, .claude/CLAUDE.md, GEMINI.md
#   AGENTS.md absent     → the candidate becomes AGENTS.md verbatim
#   already contained    → nothing is carried (the old add.wiki copies:
#                          AGENTS.md = CLAUDE.md + shell policy, GEMINI.md = copy)
#   otherwise            → appended whole under "## Migrated from <file>"
# The candidate is deleted only after AGENTS.md was written. "Contained" compares
# the whole candidate, CRLF → LF and trailing newlines trimmed, as a substring of
# AGENTS.md under the same normalisation. CLAUDE.local.md is personal and never
# touched — it is only reported, because it also hides AGENTS.md from Claude Code.
#
# Output (one line per fact):
#   MIGRATED:<file>:created|duplicate|appended
#   LEGACY_LOCAL:CLAUDE.local.md
#   CONTEXT_MIGRATION:none            (no candidate was found)
#
# Exit codes:
#   0  done (including nothing to do)
#   1  I/O error — candidates migrated before the failure stay migrated; a
#      re-run completes the rest
# =============================================================================

set -euo pipefail

TARGET="AGENTS.md"
CANDIDATES=("CLAUDE.md" ".claude/CLAUDE.md" "GEMINI.md")
FOUND=0

# File content with CRLF → LF; $(...) already drops trailing newlines.
normalised() {
    tr -d '\r' < "$1"
}

# Write $2 into AGENTS.md through a temp file, so a failure never leaves it half-written.
replace_target() {
    local tmp
    tmp="$(mktemp "${TARGET}.XXXXXX")" || return 1
    if ! cat "$1" > "$tmp"; then rm -f "$tmp"; return 1; fi
    mv -f "$tmp" "$TARGET"
}

migrate() {
    local file="$1" outcome tmp
    if [ ! -f "$TARGET" ]; then
        replace_target "$file" || return 1
        outcome="created"
    else
        local target_text file_text
        target_text="$(normalised "$TARGET")"
        file_text="$(normalised "$file")"
        if [[ "$target_text" == *"$file_text"* ]]; then
            outcome="duplicate"
        else
            tmp="$(mktemp "${TARGET}.XXXXXX")" || return 1
            if ! {
                printf '%s\n\n## Migrated from %s\n\n%s\n' "$target_text" "$file" "$file_text" > "$tmp"
            }; then
                rm -f "$tmp"
                return 1
            fi
            mv -f "$tmp" "$TARGET" || return 1
            outcome="appended"
        fi
    fi
    rm -f "$file" || return 1
    echo "MIGRATED:${file}:${outcome}"
}

for candidate in "${CANDIDATES[@]}"; do
    [ -f "$candidate" ] || continue
    FOUND=1
    if ! migrate "$candidate"; then
        echo "ERROR: could not migrate $candidate into $TARGET" >&2
        exit 1
    fi
done

[ -f "CLAUDE.local.md" ] && echo "LEGACY_LOCAL:CLAUDE.local.md"
[ "$FOUND" -eq 0 ] && echo "CONTEXT_MIGRATION:none"

exit 0

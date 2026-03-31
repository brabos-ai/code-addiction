#!/bin/bash
# ============================================
# log-jsonl.sh
# Append a JSON line to any JSONL file (fire & forget)
# ============================================
# Usage: bash .codeadd/scripts/log-jsonl.sh <file> <type> <agent> '<extra-fields>'
#
# Args:
#   file   - target JSONL file path (relative or absolute)
#   type   - entry type (pivot|add|fix|refactor|test|docs)
#   agent  - agent/area identifier (database|backend|frontend|coordinator|/dev|/hotfix|/autopilot)
#   fields - remaining JSON fields as raw key:value pairs (already quoted)
#
# Examples:
#   bash .codeadd/scripts/log-jsonl.sh "docs/features/0011F-board/decisions.jsonl" \
#     "pivot" "database" \
#     '"from":"Junction table","decision":"Separate tables","reason":"Better query perf","attempt":1'
#
#   bash .codeadd/scripts/log-jsonl.sh "docs/features/0011F-board/iterations.jsonl" \
#     "add" "/dev" \
#     '"slug":"board-crud","what":"Board CRUD endpoints","files":["src/board.ts"]'
# ============================================

set -euo pipefail

# --- Validate Args ---
if [ $# -lt 4 ]; then
    echo "ERROR:missing_args"
    echo "USAGE: bash log-jsonl.sh <file> <type> <agent> '<extra-fields>'"
    exit 1
fi

FILE="$1"
TYPE="$2"
AGENT="$3"
FIELDS="$4"

[ -z "$FILE"   ] && echo "ERROR:empty_file"   && exit 1
[ -z "$TYPE"   ] && echo "ERROR:empty_type"   && exit 1
[ -z "$AGENT"  ] && echo "ERROR:empty_agent"  && exit 1
[ -z "$FIELDS" ] && echo "ERROR:empty_fields" && exit 1

# --- Ensure directory exists ---
DIR=$(dirname "$FILE")
if [ ! -d "$DIR" ]; then
    mkdir -p "$DIR"
fi

# --- Generate timestamp ---
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || true)
if [ -z "$TS" ]; then
    echo "ERROR:date_failed"
    exit 1
fi

# --- Append JSONL ---
printf '{"ts":"%s","agent":"%s","type":"%s",%s}\n' "$TS" "$AGENT" "$TYPE" "$FIELDS" >> "$FILE"

# --- Output ---
echo "LOGGED:$FILE"
echo "TYPE:$TYPE"
echo "AGENT:$AGENT"

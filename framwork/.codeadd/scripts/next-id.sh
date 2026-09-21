#!/bin/bash
# ============================================
# NEXT-ID - Global Sequential ID Calculator
# Calculate next global ID with type suffix
# ============================================
# Usage: bash .codeadd/scripts/next-id.sh [TYPE_LETTER]
# Examples:
#   bash next-id.sh F  → 0001F
#   bash next-id.sh H  → 0002H
#   bash next-id.sh R  → 0003R
#   bash next-id.sh B  → 0004B   (a backlog ticket)
# Dependencies: bash, find, grep, sort
#
# ONE COUNTER OVER TWO SOURCES. The number is global across every work type,
# so it is the max over BOTH docs/features/[NNNN][L]-*/ directories AND the
# ids already on the backlog board, docs/backlog.jsonl. Counting only the
# first would hand out a number a ticket already holds.
#
# THE BACKLOG IS READ BY GREP, NEVER PARSED. This script is pure bash and
# stays that way: it already extracts ids from directory names with the same
# `grep -oE`, and a JSON parse here would make node a dependency of every
# /add.new. Grepping the raw text also means a line whose JSON is damaged
# still yields its id, so a hand-broken board can never block an allocation.
#
# `status.sh next-id` REIMPLEMENTS THIS SCAN rather than calling this script,
# and the two must return the same string for the same tree. Nothing in the
# code holds them together — `framwork/.codeadd/scripts/tests/backlog.bats`
# (NEXT_ID_AGREE) is the only gate. Change one and change the other.
# ============================================

set -euo pipefail

# --- Detection ---

TYPE_LETTER="${1:-}"

# Validate type letter
if [ -z "$TYPE_LETTER" ]; then
    echo "ERROR: TYPE_LETTER required (F|H|R|C|D)" >&2
    exit 1
fi

if ! [[ "$TYPE_LETTER" =~ ^[A-Z]$ ]]; then
    echo "ERROR: TYPE_LETTER must be a single uppercase letter (got: $TYPE_LETTER)" >&2
    exit 1
fi

# Docs directory
DOCS_DIR="docs/features"
BACKLOG_FILE="docs/backlog.jsonl"

# --- Execution ---

# Find all existing IDs in format [NNNN][L] (e.g., 0001F, 0002H, etc.)
# Directory pattern: docs/features/[0-9][0-9][0-9][0-9][A-Z]-*/
# If directory doesn't exist yet, EXISTING_IDS will be empty and we'll start at 0001
# The match is on the directory NAME, never the path above it: an id lives in
# the basename, and grepping the full path let a parent directory carrying
# four digits — a temp dir, a year in someone's checkout path — pose as an id.
EXISTING_IDS=$(find "$DOCS_DIR" -maxdepth 1 -type d -regex ".*/[0-9][0-9][0-9][0-9][A-Z]-.*" 2>/dev/null | \
    sed 's#.*/##' | grep -oE '^[0-9]{4}[A-Z]' | sort -u || true)

# Fold in the ids already on the backlog board.
#
# The match is anchored on the `"id":"..."` field rather than on a bare
# [0-9]{4}[A-Z] anywhere in the line: a ticket's title or note can quote an
# id in passing, and counting that would skip numbers for no reason. The
# anchor also catches `"work_id":"0042F"` as a substring, which is correct —
# that is a real id too.
#
# An absent file is a no-op: the `[ -f ]` guard keeps every project without a
# backlog allocating exactly the id it allocates today. The `|| true` is not
# optional under `set -o pipefail` — grep exits 1 on no match, which would
# otherwise kill the script on an empty board.
if [ -f "$BACKLOG_FILE" ]; then
    BACKLOG_IDS=$(grep -oE '"id":"[0-9]{4}[A-Z]"' "$BACKLOG_FILE" 2>/dev/null | \
        grep -oE '[0-9]{4}[A-Z]' | sort -u || true)
    if [ -n "$BACKLOG_IDS" ]; then
        EXISTING_IDS=$(printf '%s\n%s\n' "$EXISTING_IDS" "$BACKLOG_IDS" | grep -vE '^$' | sort -u || true)
    fi
fi

if [ -z "$EXISTING_IDS" ]; then
    # No existing IDs, start at 0001
    NEXT_NUM=1
else
    # Extract all numeric parts, find max, increment
    MAX_NUM=$(echo "$EXISTING_IDS" | grep -oE '^[0-9]{4}' | sort -n | tail -1)
    NEXT_NUM=$((10#$MAX_NUM + 1))
fi

# Format as [NNNN][L]
NEXT_ID=$(printf "%04d%s" "$NEXT_NUM" "$TYPE_LETTER")

# --- Output ---

echo "$NEXT_ID"

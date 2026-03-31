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
# Dependencies: bash, find, grep, sort
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

if [ ! -d "$DOCS_DIR" ]; then
    echo "ERROR: docs/features/ directory not found" >&2
    exit 1
fi

# --- Execution ---

# Find all existing IDs in format [NNNN][L] (e.g., 0001F, 0002H, etc.)
# Directory pattern: docs/features/[0-9][0-9][0-9][0-9][A-Z]-*/
EXISTING_IDS=$(find "$DOCS_DIR" -maxdepth 1 -type d -regex ".*/[0-9][0-9][0-9][0-9][A-Z]-.*" 2>/dev/null | \
    grep -oE '[0-9]{4}[A-Z]' | sort -u || true)

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

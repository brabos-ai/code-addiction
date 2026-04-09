#!/bin/bash
# =============================================================================
# Pattern Search
# Searches project patterns skill for areas/topics with line ranges.
# Enables JIT loading: agents read only the chunk they need.
# =============================================================================
# Usage:
#   bash .codeadd/scripts/pattern-search.sh --list
#   bash .codeadd/scripts/pattern-search.sh <area>
#   bash .codeadd/scripts/pattern-search.sh <area> <topic>
#   bash .codeadd/scripts/pattern-search.sh <area1>,<area2>
#
# Output format:
#   --list    → SKILL_PATH:<path>\nAREAS:<csv>
#   <area>    → AREA:<name> FILE:<path>\nTOPIC:<name> LINES:<start>-<end>\n...
#   <area> <topic> → AREA:<name> FILE:<path>\nTOPIC:<name> LINES:<start>-<end>
#
# Exit codes:
#   0 — results found
#   1 — skill directory not found
#   2 — area not found
#   3 — topic not found in area
# =============================================================================

set -euo pipefail

# =============================================================================
# DETECTION: locate project-patterns skill
# =============================================================================

SKILL_DIR=".codeadd/skills/project-patterns"

if [ ! -d "$SKILL_DIR" ]; then
    echo "ERROR:project-patterns skill not found at $SKILL_DIR" >&2
    echo "HINT:Run /add.xray to generate project patterns" >&2
    exit 1
fi

# =============================================================================
# SUBCOMMAND: --list
# Lists all mapped areas and total topic count.
# =============================================================================

if [ "${1:-}" = "--list" ]; then
    echo "SKILL_PATH:$SKILL_DIR"

    AREAS=""
    TOTAL_TOPICS=0

    for md_file in "$SKILL_DIR"/*.md; do
        [ -f "$md_file" ] || continue
        fname=$(basename "$md_file" .md)

        # Skip SKILL.md (index file, not an area)
        [ "$fname" = "SKILL" ] && continue

        AREAS="${AREAS:+$AREAS,}$fname"

        # Count ## headers (topics) in the file, excluding TL;DR and TOC
        count=$(grep -cE '^## ' "$md_file" 2>/dev/null || true)
        # Subtract TL;DR and TOC if present
        has_tldr=$(grep -c '^## TL;DR' "$md_file" 2>/dev/null || true)
        has_toc=$(grep -c '^## TOC' "$md_file" 2>/dev/null || true)
        count=$((count - has_tldr - has_toc))
        [ "$count" -lt 0 ] && count=0
        TOTAL_TOPICS=$((TOTAL_TOPICS + count))
    done

    if [ -z "$AREAS" ]; then
        echo "AREAS:none"
        echo "TOPICS:0"
    else
        echo "AREAS:$AREAS"
        echo "TOPICS:$TOTAL_TOPICS"
    fi
    exit 0
fi

# =============================================================================
# HELPER: extract topics with line ranges from a file
# Finds each ## header and calculates the range until the next ## or EOF.
# Excludes ## TL;DR and ## TOC (structural, not pattern topics).
# =============================================================================

extract_topics() {
    local file="$1"
    local filter_topic="${2:-}"
    local total_lines
    total_lines=$(wc -l < "$file" | tr -d ' \r\n')

    local found=0
    local prev_topic=""
    local prev_line=0

    while IFS=: read -r line_num line_text; do
        # Extract topic name (strip "## ")
        topic_name="${line_text#\#\# }"

        # Skip structural headers
        [ "$topic_name" = "TL;DR" ] && continue
        [ "$topic_name" = "TOC" ] && continue

        # Emit previous topic range
        if [ -n "$prev_topic" ]; then
            end_line=$((line_num - 1))
            if [ -z "$filter_topic" ] || echo "$prev_topic" | grep -qi "$filter_topic"; then
                echo "TOPIC:$prev_topic LINES:${prev_line}-${end_line}"
                found=1
            fi
        fi

        prev_topic="$topic_name"
        prev_line="$line_num"
    done < <(grep -nE '^## ' "$file" 2>/dev/null || true)

    # Emit last topic (range until EOF)
    if [ -n "$prev_topic" ]; then
        if [ -z "$filter_topic" ] || echo "$prev_topic" | grep -qi "$filter_topic"; then
            echo "TOPIC:$prev_topic LINES:${prev_line}-${total_lines}"
            found=1
        fi
    fi

    return $((1 - found))
}

# =============================================================================
# MAIN: parse area(s) and optional topic
# =============================================================================

AREA_ARG="${1:-}"
TOPIC_ARG="${2:-}"

if [ -z "$AREA_ARG" ]; then
    echo "Usage: pattern-search.sh --list | <area>[,<area2>] [<topic>]" >&2
    exit 2
fi

# Split comma-separated areas
IFS=',' read -ra AREAS <<< "$AREA_ARG"

EXIT_CODE=0

for area in "${AREAS[@]}"; do
    # Trim whitespace
    area=$(echo "$area" | tr -d ' ')

    area_file="$SKILL_DIR/${area}.md"

    if [ ! -f "$area_file" ]; then
        echo "ERROR:area '$area' not found (no file $area_file)" >&2
        EXIT_CODE=2
        continue
    fi

    echo "AREA:$area FILE:$area_file"

    if ! extract_topics "$area_file" "$TOPIC_ARG"; then
        if [ -n "$TOPIC_ARG" ]; then
            echo "ERROR:topic '$TOPIC_ARG' not found in $area" >&2
            EXIT_CODE=3
        fi
    fi
done

exit "$EXIT_CODE"

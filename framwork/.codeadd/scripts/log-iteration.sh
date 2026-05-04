#!/bin/bash

# =============================================================================
# log-iteration.sh
# Append iteration entry to feature's iterations.md (token-optimized)
# Used by: /add-dev command (automatic at completion)
# =============================================================================
# Usage: bash .codeadd/scripts/log-iteration.sh <type> <slug> <what> <files> [cmd] [--feature N] [--epic name]
#
# Args:
#   type   - fix|enhance|refactor|add|remove|config
#   slug   - short identifier (kebab-case)
#   what   - brief description (max 60 chars)
#   files  - affected files (grouped, e.g., api/{ctrl,svc}.ts)
#   cmd    - command used (default: /dev)
#   --feature N - (optional) marks feature N as complete (for Epics)
#   --epic name - (optional) epic identifier (kebab-case)
#
# Examples:
#   bash .codeadd/scripts/log-iteration.sh fix save-btn-500 "validation missing DTO" "api/{ctrl,svc}.ts"
#   bash .codeadd/scripts/log-iteration.sh add signup-flow "feature 1 signup" "api/{ctrl,svc}.ts" "/dev" "--feature 1"
#   bash .codeadd/scripts/log-iteration.sh add signup-flow "feature 1" "api/{ctrl,svc}.ts" "/dev" "--feature 1" "--epic auth-system"
# =============================================================================

# FIX P1: set -euo pipefail ensures that: errors in any command abort the
# script (-e), pipes propagate failures (-o pipefail) and undefined variables
# cause immediate error (-u).
set -euo pipefail

# =============================================================================
# ARGS
# =============================================================================

# FIX P2: Required arguments (TYPE, SLUG, WHAT, FILES) are now
# validated explicitly instead of receiving silent default values that
# would mask incorrect calls.
if [ $# -lt 4 ]; then
    echo "ERROR:missing_required_args"
    echo "USAGE: bash log-iteration.sh <type> <slug> <what> <files> [cmd] [--feature N] [--epic name]"
    exit 1
fi

TYPE="${1}"
SLUG="${2}"
WHAT="${3}"
FILES="${4}"
CMD="${5:-/dev}"

# FIX P2 (continued): Validate that required args are not empty strings.
[ -z "$TYPE"  ] && echo "ERROR:empty_arg_type"  && exit 1
[ -z "$SLUG"  ] && echo "ERROR:empty_arg_slug"  && exit 1
[ -z "$WHAT"  ] && echo "ERROR:empty_arg_what"  && exit 1
[ -z "$FILES" ] && echo "ERROR:empty_arg_files" && exit 1

# FIX P10: Flag parser rewritten to support variadic positional arguments
# (--feature N --epic name can come in any position starting from
# arg 6) and with correct lookahead for flag/value pairs separated by space.
FEATURE_NUM=""
EPIC_NAME=""

shift $(( $# >= 5 ? 5 : $# ))  # Discard the first 5 args; the rest are optional flags.
while [ $# -gt 0 ]; do
    case "$1" in
        --feature)
            # FIX P10: real lookahead — consumes the next argument as value.
            if [ $# -lt 2 ] || ! [[ "$2" =~ ^[0-9]+$ ]]; then
                echo "ERROR:--feature requires a numeric argument"
                exit 1
            fi
            FEATURE_NUM="$2"
            shift 2
            ;;
        --feature=*)
            val="${1#--feature=}"
            if ! [[ "$val" =~ ^[0-9]+$ ]]; then
                echo "ERROR:--feature value must be numeric, got: $val"
                exit 1
            fi
            FEATURE_NUM="$val"
            shift
            ;;
        --epic)
            if [ $# -lt 2 ] || [ -z "$2" ]; then
                echo "ERROR:--epic requires a non-empty argument"
                exit 1
            fi
            EPIC_NAME="$2"
            shift 2
            ;;
        --epic=*)
            val="${1#--epic=}"
            if [ -z "$val" ]; then
                echo "ERROR:--epic value must not be empty"
                exit 1
            fi
            EPIC_NAME="$val"
            shift
            ;;
        *)
            echo "ERROR:unknown_argument: $1"
            exit 1
            ;;
    esac
done

# Validate type
case "$TYPE" in
    fix|enhance|refactor|add|remove|config) ;;
    *)
        echo "ERROR:invalid_type '$TYPE'. Allowed: fix|enhance|refactor|add|remove|config"
        exit 1
        ;;
esac

# =============================================================================
# DETECT FEATURE
# =============================================================================

# FIX P8: Verify that git is available before using it.
if ! command -v git > /dev/null 2>&1; then
    echo "ERROR:git_not_found"
    exit 1
fi

# FIX P8: Use fallback compatible with Git < 2.22 which does not have
# --show-current; `git rev-parse --abbrev-ref HEAD` works in older versions
# and returns "HEAD" when in detached state (no branch).
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)

# Extract feature slug from branch (feature/0001F-name or fix/0001H-name)
FEATURE_ID=""
if [[ "$CURRENT_BRANCH" =~ ([0-9]{4}[A-Z]-[^/[:space:]]+)$ ]]; then
    FEATURE_ID="${BASH_REMATCH[1]}"
fi

if [ -z "$FEATURE_ID" ]; then
    echo "ERROR:not_on_feature_branch"
    echo "BRANCH:${CURRENT_BRANCH:-<detached HEAD>}"
    exit 1
fi

FEATURE_DIR="docs/features/${FEATURE_ID}"
ITERATIONS_FILE="${FEATURE_DIR}/iterations.md"

# FIX P9: Validate that date produces output in the expected format.
DATE_TODAY=$(date +"%Y-%m-%d" 2>/dev/null || true)
if [ -z "$DATE_TODAY" ]; then
    echo "ERROR:date_command_failed_or_produced_empty_output"
    exit 1
fi

# =============================================================================
# ENSURE FEATURE DIR EXISTS
# =============================================================================

if [ ! -d "$FEATURE_DIR" ]; then
    echo "ERROR:feature_dir_not_found"
    echo "PATH:$FEATURE_DIR"
    exit 1
fi

# FIX P6: Verify write permission on the directory before attempting to create
# or modify files within it.
if [ ! -w "$FEATURE_DIR" ]; then
    echo "ERROR:no_write_permission"
    echo "PATH:$FEATURE_DIR"
    exit 1
fi

# =============================================================================
# GET NEXT ITERATION NUMBER
# =============================================================================

if [ -f "$ITERATIONS_FILE" ]; then
    # FIX P6: Verify write permission on the existing file.
    if [ ! -w "$ITERATIONS_FILE" ]; then
        echo "ERROR:no_write_permission"
        echo "PATH:$ITERATIONS_FILE"
        exit 1
    fi

    # FIX P3 + P5: The original pipeline silently failed with set -e
    # when grep found no matches (exit 1). The solution temporarily disables
    # error exit for grep, and guarantees fallback "0"
    # even if the expression returns an empty string.
    LAST_NUM=$(grep -oE '^## I([0-9]+)' "$ITERATIONS_FILE" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || true)
    # FIX P5: Ensure LAST_NUM is always numeric before arithmetic.
    if [ -z "$LAST_NUM" ] || ! [[ "$LAST_NUM" =~ ^[0-9]+$ ]]; then
        LAST_NUM=0
    fi
    NEXT_NUM=$((LAST_NUM + 1))
else
    NEXT_NUM=1
    # Create file with header
    cat > "$ITERATIONS_FILE" << 'HEREDOC'
# Iterations

> AI agent context. Token-optimized format.
> Format: ## I{n}|{date}|{cmd}|{type} \n {slug}|{what}|{files}

HEREDOC
fi

# =============================================================================
# APPEND ITERATION
# =============================================================================

# FIX P4: head -c 60 operates on bytes, not characters, and may cut in the middle
# of a multibyte UTF-8. Use cut -c1-60 which operates on characters.
WHAT_TRUNCATED=$(printf '%s' "$WHAT" | cut -c1-60)

# Build feature/epic suffix for header if specified
FEATURE_HEADER=""
FEATURE_MARKER=""
if [ -n "$FEATURE_NUM" ]; then
    FEATURE_HEADER="|feature:${FEATURE_NUM}"
    FEATURE_MARKER="[FEATURE ${FEATURE_NUM} COMPLETE]"
fi
if [ -n "$EPIC_NAME" ]; then
    FEATURE_HEADER="${FEATURE_HEADER}|epic:${EPIC_NAME}"
fi

# FIX P7: Heredoc with quoted delimiter ('EOF') disables variable expansion
# inside the body — correct for the static header above. However,
# for the data block we need controlled expansion. The safe approach
# is to use printf with placeholders, preventing metacharacters present in
# variable values (backticks, $, \) from being interpreted by the shell.
{
    printf '## I%s|%s|%s|%s%s\n' \
        "$NEXT_NUM" "$DATE_TODAY" "$CMD" "$TYPE" "$FEATURE_HEADER"
    printf '%s|%s|%s\n' \
        "$SLUG" "$WHAT_TRUNCATED" "$FILES"
    if [ -n "$FEATURE_MARKER" ]; then
        printf '%s\n' "$FEATURE_MARKER"
    fi
    printf '\n'
} >> "$ITERATIONS_FILE"

# =============================================================================
# OUTPUT
# =============================================================================

echo "LOGGED:I${NEXT_NUM}"
echo "FEATURE:$FEATURE_ID"
echo "FILE:$ITERATIONS_FILE"
echo "ENTRY:${TYPE}:${SLUG}|${WHAT_TRUNCATED}"
if [ -n "$FEATURE_NUM" ]; then echo "FEATURE_COMPLETE:${FEATURE_NUM}"; fi
if [ -n "$EPIC_NAME"   ]; then echo "EPIC:${EPIC_NAME}"; fi

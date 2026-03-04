#!/bin/bash

# =============================================================================
# feature-init.sh (v2 - Token Optimized)
# Feature Discovery Initialization - compact output for agents
# =============================================================================

set -euo pipefail

# =============================================================================
# DEPENDENCY CHECK
# =============================================================================

if ! command -v git &>/dev/null; then
    echo "ERROR: git is not installed or not in PATH" >&2
    exit 1
fi

# =============================================================================
# OWNER
# =============================================================================

if [ -f "docs/owner.md" ]; then
    # Extract nivel only (compact)
    NIVEL=$(grep -i "nivel\|nível" docs/owner.md 2>/dev/null | head -1 | sed 's/.*: *//' || true)
    [ -z "$NIVEL" ] && NIVEL="INTERMEDIARIO"
    echo "OWNER:$NIVEL"
else
    echo "OWNER:INTERMEDIARIO (default)"
fi

# =============================================================================
# GIT
# =============================================================================

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
# git branch --show-current returns empty string (exit 0) in detached HEAD
if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="detached-HEAD"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "ERROR: get-main-branch.sh not found at $SCRIPT_DIR/get-main-branch.sh" >&2
    exit 1
fi

if [ ! -x "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "ERROR: get-main-branch.sh is not executable" >&2
    exit 1
fi

MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")

# Branch type
BRANCH_TYPE="other"
[[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]] && BRANCH_TYPE="main"
[[ "$CURRENT_BRANCH" == feature/* ]] && BRANCH_TYPE="feature"
[[ "$CURRENT_BRANCH" == fix/* ]] && BRANCH_TYPE="fix"
[[ "$CURRENT_BRANCH" == refactor/* ]] && BRANCH_TYPE="refactor"
[[ "$CURRENT_BRANCH" == hotfix/* ]] && BRANCH_TYPE="hotfix"

UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' \r\n')

echo "GIT:branch=$CURRENT_BRANCH type=$BRANCH_TYPE main=$MAIN_BRANCH uncommitted=$UNCOMMITTED"

# =============================================================================
# FEATURES
# =============================================================================

FEATURES_DIR="docs/features"

if [ -d "$FEATURES_DIR" ]; then
    FEATURE_LIST=$(ls -1 "$FEATURES_DIR" 2>/dev/null | grep -E '^F[0-9]{4}-' | sort || true)

    if [ -z "$FEATURE_LIST" ]; then
        FEATURE_COUNT=0
    else
        FEATURE_COUNT=$(echo "$FEATURE_LIST" | grep -c . || true)
    fi

    LAST_FEATURE=$(echo "$FEATURE_LIST" | sort -r | head -1 || true)
    if [ -z "$LAST_FEATURE" ]; then
        NEXT_NUM="F0001"
    else
        LAST_NUM=$(echo "$LAST_FEATURE" | grep -oE '[0-9]{4}' | head -1 || true)
        if [ -z "$LAST_NUM" ]; then
            echo "ERROR: Could not extract numeric ID from last feature dir: $LAST_FEATURE" >&2
            exit 1
        fi
        NEXT_NUM="F$(printf "%04d" $((10#$LAST_NUM + 1)))"
    fi

    echo "FEATURES:count=$FEATURE_COUNT next=$NEXT_NUM"
else
    mkdir -p "$FEATURES_DIR"
    echo "FEATURES:count=0 next=F0001 (created)"
fi

# Current feature (if on feature branch)
FEATURE_ID=$(echo "$CURRENT_BRANCH" | sed -n 's|.*/\(F[0-9]\{4\}-[^/]*\)$|\1|p')
if [ -n "$FEATURE_ID" ]; then
    DOCS=""
    [ -f "$FEATURES_DIR/$FEATURE_ID/about.md" ]     && DOCS="${DOCS}about.md,"
    [ -f "$FEATURES_DIR/$FEATURE_ID/discovery.md" ] && DOCS="${DOCS}discovery.md,"
    [ -f "$FEATURES_DIR/$FEATURE_ID/design.md" ]    && DOCS="${DOCS}design.md,"
    [ -f "$FEATURES_DIR/$FEATURE_ID/plan.md" ]      && DOCS="${DOCS}plan.md,"
    [ -f "$FEATURES_DIR/$FEATURE_ID/changelog.md" ] && DOCS="${DOCS}changelog.md,"
    DOCS="${DOCS%,}"

    if [ -n "$DOCS" ]; then
        echo "CURRENT:$FEATURE_ID docs=[$DOCS]"
    else
        echo "CURRENT:$FEATURE_ID docs=[]"
    fi
fi

# =============================================================================
# ARCHITECTURE
# =============================================================================

[ -f "CLAUDE.md" ] && echo "ARCH:CLAUDE.md" || echo "ARCH:none"

# =============================================================================
# STACK (detect from package.json)
# =============================================================================

if [ -f "package.json" ]; then
    STACK=""
    grep -q "@nestjs" package.json 2>/dev/null && STACK="${STACK}nestjs,"
    grep -q "express"  package.json 2>/dev/null && STACK="${STACK}express,"
    grep -q '"react"'  package.json 2>/dev/null && STACK="${STACK}react,"
    grep -q "kysely"   package.json 2>/dev/null && STACK="${STACK}kysely,"
    grep -q "prisma"   package.json 2>/dev/null && STACK="${STACK}prisma,"
    grep -q "bullmq"   package.json 2>/dev/null && STACK="${STACK}bullmq,"
    STACK="${STACK%,}"
    [ -n "$STACK" ] && echo "STACK:$STACK"
fi

# =============================================================================
# MODULES (if exists)
# =============================================================================

if [ -d "apps/backend/src/api/modules" ]; then
    MODULES=$(ls -1 apps/backend/src/api/modules 2>/dev/null | tr '\n' ',' | sed 's/,$//' || true)
    [ -n "$MODULES" ] && echo "MODULES:$MODULES"
fi

# =============================================================================
# LSP DETECTION - PRIORITY RULES
# =============================================================================

LSP_AVAILABLE=false
if command -v lsp &>/dev/null; then
    LSP_AVAILABLE=true
fi

if [ "$LSP_AVAILABLE" = true ]; then
    echo "LSP:AVAILABLE"
    echo "LSP_PRIORITY:MANDATORY"
    echo "LSP_SKILL:.codeadd/skills/lsp-code-analysis/SKILL.md"
    echo "LSP_ACTION:Load lsp-code-analysis skill BEFORE any code search"
else
    echo "LSP:NOT_INSTALLED"
fi

# =============================================================================
# OUTPUT: RECENT_CHANGELOGS (últimas 5 features finalizadas - contexto cross-feature)
# =============================================================================

if [ -d "$FEATURES_DIR" ]; then
    # find + sort by modification time using -printf '%T@ %p\n' (GNU find) with
    # fallback to xargs ls -t for non-GNU environments.
    # Use null-delimited output to handle paths with spaces safely.
    CHANGELOGS=$(find "$FEATURES_DIR" -name "changelog.md" -type f -print0 2>/dev/null | \
        xargs -0 -r ls -t 2>/dev/null | head -5 || true)

    if [ -n "$CHANGELOGS" ]; then
        echo "RECENT_CHANGELOGS:"
        while IFS= read -r cl; do
            if [ -f "$cl" ]; then
                # Extract feature ID from path
                FEAT=$(echo "$cl" | grep -oE 'F[0-9]{4}-[^/]+' | head -1)

                # Extract summary: content after "## Resumo" or "## Summary"
                # Skip blockquotes (>) and empty lines
                SUMMARY=$(awk '
                    /^## Resumo/ || /^## Summary/ { found=1; next }
                    found && /^[^#>\[]/ && NF > 0 { gsub(/^[[:space:]]+|[[:space:]]+$/, ""); print; exit }
                ' "$cl" 2>/dev/null | head -c 120 || true)

                # Fallback: get title from first # line (without date/branch metadata)
                if [ -z "$SUMMARY" ]; then
                    SUMMARY=$(grep -m1 "^# " "$cl" 2>/dev/null | sed 's/^# //' | head -c 80 || true)
                fi

                if [ -n "$SUMMARY" ]; then echo "  $FEAT|$SUMMARY"; fi
            fi
        done <<< "$CHANGELOGS"
        echo "CHANGELOGS_PATH:docs/features/{F*}/changelog.md"
    fi
fi

# =============================================================================
# RECOMMENDATION
# =============================================================================

if [ "$BRANCH_TYPE" = "main" ]; then
    echo "REC:create feature branch with /feature"
elif [ -n "$FEATURE_ID" ]; then
    if [ -d "$FEATURES_DIR/$FEATURE_ID" ]; then
        echo "REC:continue discovery for $FEATURE_ID"
    else
        echo "REC:create docs for $FEATURE_ID"
    fi
fi

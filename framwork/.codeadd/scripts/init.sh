#!/bin/bash

# =============================================================================
# init.sh (v3 - Centralized Metadata)
# Project Initialization - compact output for agents
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
    OWNER_NAME=$(grep -i "^Nome:" docs/owner.md 2>/dev/null | sed 's/^Nome:[[:space:]]*//' | head -1 || true)
    OWNER_NIVEL=$(grep -i "^Nivel:" docs/owner.md 2>/dev/null | sed 's/^Nivel:[[:space:]]*//' | head -1 || true)
    OWNER_IDIOMA=$(grep -i "^Idioma:" docs/owner.md 2>/dev/null | sed 's/^Idioma:[[:space:]]*//' | head -1 || true)
    [ -z "$OWNER_NAME" ] && OWNER_NAME="unknown"
    [ -z "$OWNER_NIVEL" ] && OWNER_NIVEL="intermediario"
    [ -z "$OWNER_IDIOMA" ] && OWNER_IDIOMA="en-us"
    echo "OWNER:$OWNER_NAME|$OWNER_NIVEL|$OWNER_IDIOMA"
else
    echo "OWNER:unknown|intermediario|en-us (default)"
fi

# =============================================================================
# GIT (detection delegated to get-branch-metadata.sh)
# =============================================================================

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

# Branch metadata detection via get-branch-metadata.sh
if [ ! -f "$SCRIPT_DIR/get-branch-metadata.sh" ]; then
    echo "ERROR: get-branch-metadata.sh not found at $SCRIPT_DIR/get-branch-metadata.sh" >&2
    exit 1
fi
if [ ! -x "$SCRIPT_DIR/get-branch-metadata.sh" ]; then
    echo "ERROR: get-branch-metadata.sh is not executable" >&2
    exit 1
fi

eval "$("$SCRIPT_DIR/get-branch-metadata.sh")"
CURRENT_BRANCH="$BRANCH_NAME"

UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' \r\n')

echo "GIT:branch=$CURRENT_BRANCH type=$BRANCH_TYPE main=$MAIN_BRANCH uncommitted=$UNCOMMITTED"

# =============================================================================
# FEATURES (NEW: Global sequential IDs with flat structure)
# =============================================================================

DOCS_DIR="docs"

if [ ! -d "$DOCS_DIR" ]; then
    mkdir -p "$DOCS_DIR"
fi

# Count all work items (new format: [NNNN][L]-*)
FEATURE_LIST=$(find "$DOCS_DIR" -maxdepth 1 -type d -regex "$DOCS_DIR/[0-9][0-9][0-9][0-9][A-Z]-.*" 2>/dev/null | \
    basename -a | sort || true)

if [ -z "$FEATURE_LIST" ]; then
    FEATURE_COUNT=0
else
    FEATURE_COUNT=$(echo "$FEATURE_LIST" | grep -c . || true)
fi

# Calculate next feature ID using next-id.sh script
if ! command -v bash &>/dev/null; then
    echo "ERROR: bash is required for next-id.sh" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$SCRIPT_DIR/next-id.sh" ]; then
    echo "ERROR: next-id.sh not found at $SCRIPT_DIR/next-id.sh" >&2
    exit 1
fi

NEXT_FEATURE=$(bash "$SCRIPT_DIR/next-id.sh" "F" 2>/dev/null || echo "F0001")

echo "FEATURES:count=$FEATURE_COUNT next=$NEXT_FEATURE"

# Current feature (if on feature branch)
FEATURE_ID="$FEATURE_SLUG"
if [ -n "$FEATURE_ID" ]; then
    DOCS=""
    # New flat structure: docs/[NNNN][L]-[slug]/
    WORK_DIR="$DOCS_DIR/$FEATURE_ID"
    [ -f "$WORK_DIR/about.md" ]     && DOCS="${DOCS}about.md,"
    [ -f "$WORK_DIR/discovery.md" ] && DOCS="${DOCS}discovery.md,"
    [ -f "$WORK_DIR/design.md" ]    && DOCS="${DOCS}design.md,"
    [ -f "$WORK_DIR/plan.md" ]      && DOCS="${DOCS}plan.md,"
    [ -f "$WORK_DIR/changelog.md" ] && DOCS="${DOCS}changelog.md,"
    [ -f "$WORK_DIR/hotfix.md" ]    && DOCS="${DOCS}hotfix.md,"
    [ -f "$WORK_DIR/related.md" ]   && DOCS="${DOCS}related.md,"
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
# OUTPUT: RECENT_CHANGELOGS (últimas 5 items finalizados - contexto cross-feature)
# =============================================================================

# New flat structure: docs/[NNNN][L]-*/changelog.md
CHANGELOGS=$(find "$DOCS_DIR" -maxdepth 2 -name "changelog.md" -type f -print0 2>/dev/null | \
    xargs -0 -r ls -t 2>/dev/null | head -5 || true)

if [ -n "$CHANGELOGS" ]; then
    echo "RECENT_CHANGELOGS:"
    while IFS= read -r cl; do
        if [ -f "$cl" ]; then
            # Extract work item ID from path (new format: [NNNN][L]-[slug])
            WORK_ITEM=$(echo "$cl" | grep -oE '[0-9]{4}[A-Z]-[^/]+' | head -1)

            # Extract summary: content after "## Resumo" or "## Summary"
            # Skip blockquotes (>) and empty lines
            SUMMARY=$(awk '
                /^## Resumo/ || /^## Summary/ { found=1; next }
                found && /^[^#>\[]/ && NF > 0 { gsub(/^[[:space:]]+|[[:space:]]+$/, ""); print; exit }
            ' "$cl" 2>/dev/null | head -c 120 || true)

            # Fallback: get title from first # line
            if [ -z "$SUMMARY" ]; then
                SUMMARY=$(grep -m1 "^# " "$cl" 2>/dev/null | sed 's/^# //' | head -c 80 || true)
            fi

            if [ -n "$SUMMARY" ]; then echo "  $WORK_ITEM|$SUMMARY"; fi
        fi
    done <<< "$CHANGELOGS"
    echo "CHANGELOGS_PATH:docs/{[0-9][0-9][0-9][0-9][A-Z]-*}/changelog.md"
fi

# =============================================================================
# RECOMMENDATION
# =============================================================================

if [ "$BRANCH_TYPE" = "main" ]; then
    echo "REC:create feature branch with /add-feature"
elif [ -n "$FEATURE_ID" ]; then
    if [ -d "$DOCS_DIR/$FEATURE_ID" ]; then
        echo "REC:continue work on $FEATURE_ID"
    else
        echo "REC:create docs for $FEATURE_ID"
    fi
fi

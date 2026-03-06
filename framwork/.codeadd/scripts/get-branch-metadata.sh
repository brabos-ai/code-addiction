#!/bin/bash
# ============================================
# GET BRANCH METADATA
# Extract complete metadata from any branch
# ============================================
# Usage: eval "$(bash framwork/.codeadd/scripts/get-branch-metadata.sh [branch])"
# Output:
#   BRANCH_NAME=feature/F0001-auth-system
#   BRANCH_PREFIX=feature
#   BRANCH_TYPE=feature
#   COMMIT_TYPE=feat
#   FEATURE_ID=F0001
#   FEATURE_SLUG=F0001-auth-system
#   DOCS_DIR=docs/features/F0001-auth-system
# Dependencies: git
# ============================================

set -euo pipefail

# --- Detection ---

BRANCH_NAME="${1:-$(git branch --show-current 2>/dev/null || echo "")}"

if [ -z "$BRANCH_NAME" ]; then
    echo "BRANCH_NAME=(detached)"
    echo "BRANCH_PREFIX="
    echo "BRANCH_TYPE=detached"
    echo "COMMIT_TYPE="
    echo "FEATURE_ID="
    echo "FEATURE_SLUG="
    echo "DOCS_DIR="
    exit 0
fi

echo "BRANCH_NAME=$BRANCH_NAME"

# Extract prefix (everything before the first /)
BRANCH_PREFIX="${BRANCH_NAME%%/*}"
echo "BRANCH_PREFIX=$BRANCH_PREFIX"

# --- BRANCH_TYPE detection (order matters: new [NNNN][L] format prioritized) ---

FEATURE_ID=""
BRANCH_TYPE=""

case "$BRANCH_NAME" in
    # New format: [type]/[NNNN][L]-[slug] (e.g., feature/0001F-auth-system)
    feature/[0-9][0-9][0-9][0-9][A-Z]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE '[0-9]{4}[A-Z]' | head -1)
        BRANCH_TYPE="feature"
        ;;
    hotfix/[0-9][0-9][0-9][0-9][A-Z]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE '[0-9]{4}[A-Z]' | head -1)
        BRANCH_TYPE="hotfix"
        ;;
    refactor/[0-9][0-9][0-9][0-9][A-Z]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE '[0-9]{4}[A-Z]' | head -1)
        BRANCH_TYPE="refactor"
        ;;
    chore/[0-9][0-9][0-9][0-9][A-Z]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE '[0-9]{4}[A-Z]' | head -1)
        BRANCH_TYPE="chore"
        ;;
    docs/[0-9][0-9][0-9][0-9][A-Z]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE '[0-9]{4}[A-Z]' | head -1)
        BRANCH_TYPE="docs"
        ;;
    # Fallback: old format F[NNNN] or H[NNNN] (legacy support during transition)
    fix/F[0-9][0-9][0-9][0-9]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE 'F[0-9]{4}')
        BRANCH_TYPE="hotfix_feature"
        ;;
    fix/H[0-9][0-9][0-9][0-9]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE 'H[0-9]{4}')
        BRANCH_TYPE="hotfix_standalone"
        ;;
    */F[0-9][0-9][0-9][0-9]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE 'F[0-9]{4}')
        BRANCH_TYPE="feature"
        ;;
    */H[0-9][0-9][0-9][0-9]-*)
        FEATURE_ID=$(echo "$BRANCH_NAME" | grep -oE 'H[0-9]{4}')
        BRANCH_TYPE="hotfix_standalone"
        ;;
    main|master)
        BRANCH_TYPE="main"
        ;;
    *)
        BRANCH_TYPE="other"
        ;;
esac

echo "BRANCH_TYPE=$BRANCH_TYPE"

# --- COMMIT_TYPE from branch prefix ---

COMMIT_TYPE=""
if [ -n "$FEATURE_ID" ] || [ "$BRANCH_TYPE" = "other" ]; then
    case "$BRANCH_PREFIX" in
        feature)  COMMIT_TYPE="feat" ;;
        fix)      COMMIT_TYPE="fix" ;;
        refactor) COMMIT_TYPE="refactor" ;;
        chore)    COMMIT_TYPE="chore" ;;
        docs)     COMMIT_TYPE="docs" ;;
        perf)     COMMIT_TYPE="perf" ;;
        test)     COMMIT_TYPE="test" ;;
        *)        COMMIT_TYPE="$BRANCH_PREFIX" ;;
    esac
fi

echo "COMMIT_TYPE=$COMMIT_TYPE"

# --- FEATURE_SLUG and DOCS_DIR ---

FEATURE_SLUG=""
DOCS_DIR=""

if [ -n "$FEATURE_ID" ]; then
    # Extract slug: everything after the first / (e.g. 0001F-auth-system)
    FEATURE_SLUG="${BRANCH_NAME#*/}"

    # Flat structure: docs/[NNNN][L]-[slug]/
    DOCS_DIR="docs/$FEATURE_SLUG"
fi

# --- Output ---

echo "FEATURE_ID=$FEATURE_ID"
echo "FEATURE_SLUG=$FEATURE_SLUG"
echo "DOCS_DIR=$DOCS_DIR"

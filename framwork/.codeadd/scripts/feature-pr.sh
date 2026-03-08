#!/bin/bash

# =============================================================================
# Feature PR Script
# Prepares feature for PR: changelog, commit, push, create PR, await merge
# Used by: /pr command
# =============================================================================

set -euo pipefail

# =============================================================================
# FLAGS
# =============================================================================

CREATE_PR=false
CONFIRM_MERGE=false
for arg in "$@"; do
    case $arg in
        --create-pr)
            CREATE_PR=true
            ;;
        --confirm-merge)
            CONFIRM_MERGE=true
            ;;
    esac
done

# =============================================================================
# DETECT FEATURE
# =============================================================================

CURRENT_BRANCH=$(git branch --show-current)

# Guard: HEAD detached or empty branch name
if [ -z "$CURRENT_BRANCH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Could not detect current branch (HEAD may be detached)"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Guard: helper script must exist and be executable
if [ ! -x "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Helper script not found or not executable: $SCRIPT_DIR/get-main-branch.sh"
    exit 1
fi

MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")

# Guard: MAIN_BRANCH must not be empty
if [ -z "$MAIN_BRANCH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Could not determine main branch"
    exit 1
fi

FEATURE_ID=$(echo "$CURRENT_BRANCH" | sed -n 's|.*/\([0-9]\{4\}[A-Z]-[^/]*\)$|\1|p')
FEATURE_DIR="docs/features/${FEATURE_ID}"
TODAY=$(date +%Y-%m-%d)

echo "========================================"
echo "FEATURE_PR"
echo "========================================"
echo "CURRENT_BRANCH=$CURRENT_BRANCH"
echo "MAIN_BRANCH=$MAIN_BRANCH"
echo "FEATURE_ID=$FEATURE_ID"
echo "FEATURE_DIR=$FEATURE_DIR"
echo ""

# Validate feature branch
if [ -z "$FEATURE_ID" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Not on a feature branch"
    echo "HINT=Switch to your feature branch first (e.g. feature/0001F-name)"
    exit 1
fi

# =============================================================================
# CONFIRM MERGE MODE
# =============================================================================

if [ "$CONFIRM_MERGE" = true ]; then
    echo "MODE=CONFIRM_MERGE"
    echo ""

    # Step 1: Switch to main and pull
    echo "STEP=Switching to $MAIN_BRANCH..."
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    echo "CHECKOUT_MAIN=OK"

    # Step 2: Delete local branch only
    echo "STEP=Cleaning up local branch..."
    git branch -d "$CURRENT_BRANCH" 2>/dev/null && echo "LOCAL_DELETE=OK" || echo "LOCAL_DELETE=SKIPPED"

    echo ""
    echo "========================================"
    echo "DONE"
    echo "========================================"
    echo "STATUS=SUCCESS"
    echo "FEATURE=$FEATURE_ID"
    echo "CURRENT_BRANCH=$MAIN_BRANCH"
    echo "CLEANUP=LOCAL_ONLY"
    exit 0
fi

# =============================================================================
# CHECK FEATURE DIR (only for non-confirm-merge mode)
# =============================================================================

if [ ! -d "$FEATURE_DIR" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Feature directory not found: $FEATURE_DIR"
    exit 1
fi

# =============================================================================
# CHECK PENDING CHANGES
# =============================================================================

echo "========================================"
echo "PENDING_CHANGES"
echo "========================================"

# Count non-empty lines safely (avoids grep -c returning 1 for empty input)
_count_lines() {
    local input="$1"
    if [ -z "$input" ]; then
        echo "0"
    else
        printf '%s\n' "$input" | grep -c '^.' || echo "0"
    fi
}

# Uncommitted changes (modified + staged + untracked)
MODIFIED=$(git diff --name-only 2>/dev/null || true)
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null || true)

MODIFIED_COUNT=$(_count_lines "$MODIFIED")
STAGED_COUNT=$(_count_lines "$STAGED")
UNTRACKED_COUNT=$(_count_lines "$UNTRACKED")

echo "MODIFIED_COUNT=$MODIFIED_COUNT"
echo "STAGED_COUNT=$STAGED_COUNT"
echo "UNTRACKED_COUNT=$UNTRACKED_COUNT"

HAS_UNCOMMITTED=false
if [ "${MODIFIED_COUNT}" -gt 0 ] || [ "${STAGED_COUNT}" -gt 0 ] || [ "${UNTRACKED_COUNT}" -gt 0 ]; then
    HAS_UNCOMMITTED=true
fi
echo "HAS_UNCOMMITTED=$HAS_UNCOMMITTED"

# Unpushed commits — only attempt if remote tracking branch exists
UNPUSHED=""
if git rev-parse --verify "origin/$CURRENT_BRANCH" &>/dev/null; then
    UNPUSHED=$(git log "origin/$CURRENT_BRANCH".."$CURRENT_BRANCH" --oneline 2>/dev/null || true)
else
    echo "UPSTREAM_NOTE=No remote tracking branch found for origin/$CURRENT_BRANCH (will be created on push)"
fi
UNPUSHED_COUNT=$(_count_lines "$UNPUSHED")
echo "UNPUSHED_COUNT=$UNPUSHED_COUNT"

# List uncommitted files if any
if [ "$HAS_UNCOMMITTED" = true ]; then
    echo ""
    echo "UNCOMMITTED_FILES=["
    [ -n "$MODIFIED" ] && printf '%s\n' "$MODIFIED" | while read -r f; do [ -n "$f" ] && echo "  \"$f\" (modified)"; done || true
    [ -n "$STAGED" ] && printf '%s\n' "$STAGED" | while read -r f; do [ -n "$f" ] && echo "  \"$f\" (staged)"; done || true
    [ -n "$UNTRACKED" ] && printf '%s\n' "$UNTRACKED" | while read -r f; do [ -n "$f" ] && echo "  \"$f\" (untracked)"; done || true
    echo "]"
fi

# =============================================================================
# GET ALL CHANGED FILES IN BRANCH
# =============================================================================

echo ""
echo "========================================"
echo "BRANCH_CHANGES"
echo "========================================"

# All files changed in this branch vs main
CHANGED_FILES=$(git diff --name-only "$MAIN_BRANCH"..."$CURRENT_BRANCH" 2>/dev/null || true)
CHANGED_COUNT=$(_count_lines "$CHANGED_FILES")

echo "CHANGED_COUNT=$CHANGED_COUNT"
echo "CHANGED_FILES=["
[ -n "$CHANGED_FILES" ] && printf '%s\n' "$CHANGED_FILES" | while read -r f; do [ -n "$f" ] && echo "  \"$f\""; done || true
echo "]"

# =============================================================================
# PREVIEW MODE
# =============================================================================

if [ "$CREATE_PR" = false ]; then
    echo ""
    echo "========================================"
    echo "ACTION"
    echo "========================================"
    echo "MODE=PREVIEW"
    echo ""
    echo "WILL_DO=["
    [ "$HAS_UNCOMMITTED" = true ] && echo "  \"Commit all pending changes\""
    echo "  \"Append file list ($CHANGED_COUNT files) to changelog.md\""
    echo "  \"Push to origin/$CURRENT_BRANCH\""
    echo "  \"Create Pull Request to $MAIN_BRANCH\""
    echo "  \"[After merge confirmed] Switch to $MAIN_BRANCH\""
    echo "  \"[After merge confirmed] Delete local branch: $CURRENT_BRANCH\""
    echo "]"
    echo ""
    echo "CONFIRM=Run with --create-pr to execute"
    echo "COMMAND=bash .codeadd/scripts/feature-pr.sh --create-pr"
    exit 0
fi

# =============================================================================
# CREATE PR MODE - EXECUTE
# =============================================================================

echo ""
echo "========================================"
echo "ACTION"
echo "========================================"
echo "MODE=EXECUTE"
echo ""

# Guard: ensure there are commits different from main before creating PR
# Note: untracked files (e.g. changelog.md pre-created) do not count as "changes"
if [ "$CHANGED_COUNT" -eq 0 ] && [ "$MODIFIED_COUNT" -eq 0 ] && [ "$STAGED_COUNT" -eq 0 ]; then
    echo "STATUS=ERROR"
    echo "ERROR=No commits or changes found relative to $MAIN_BRANCH"
    echo "HINT=Make changes and commit before opening a PR"
    exit 1
fi

# Step 1: Commit pending changes if any
if [ "$HAS_UNCOMMITTED" = true ]; then
    echo "STEP=Committing pending changes..."
    git add -A
    git commit -m "feat($FEATURE_ID): finalize feature implementation

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
    echo "COMMIT=OK"
fi

# Step 2: Append file list to changelog.md
echo "STEP=Processing changelog.md..."
CHANGELOG_PATH="$FEATURE_DIR/changelog.md"

# Check if intelligent changelog exists (MUST be created by /pr agent before --create-pr)
if [ ! -f "$CHANGELOG_PATH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=changelog.md not found. Agent must create it before --create-pr"
    echo "HINT=Run /pr without --create-pr first to generate intelligent changelog"
    exit 1
fi

echo "CHANGELOG=EXISTS"
echo "CHANGELOG_PATH=$CHANGELOG_PATH"

# Recalculate CHANGED_FILES after pending commit so list is up-to-date
CHANGED_FILES=$(git diff --name-only "$MAIN_BRANCH"..."$CURRENT_BRANCH" 2>/dev/null || true)
CHANGED_COUNT=$(_count_lines "$CHANGED_FILES")

# Append complete file list to changelog
echo "STEP=Appending file list to changelog..."
cat >> "$CHANGELOG_PATH" << EOF

---

## Lista Completa de Arquivos Alterados

> Gerado automaticamente pelo script em $TODAY

\`\`\`
$CHANGED_FILES
\`\`\`

**Total:** $CHANGED_COUNT arquivos

---

_Finalizado por feature-pr.sh em ${TODAY}_
EOF

# Only add changelog if not in gitignore
if ! git check-ignore -q "$CHANGELOG_PATH" 2>/dev/null; then
    git add "$CHANGELOG_PATH"

    # Commit changelog changes
    if ! git diff --cached --quiet 2>/dev/null; then
        git commit -m "docs($FEATURE_ID): finalize changelog with file list

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
        echo "CHANGELOG_APPEND=OK"
    else
        echo "CHANGELOG_APPEND=NO_CHANGES"
    fi
else
    echo "CHANGELOG_APPEND=SKIPPED_GITIGNORE"
fi

# Step 2.5: Stage about.md if updated (with addendum)
if [ -f "$FEATURE_DIR/about.md" ]; then
    # Only add if not in gitignore
    if ! git check-ignore -q "$FEATURE_DIR/about.md" 2>/dev/null; then
        # Check if about.md has uncommitted changes (addendum added by /pr command)
        if git diff --name-only "$FEATURE_DIR/about.md" 2>/dev/null | grep -q .; then
            echo "STEP=Staging about.md addendum..."
            git add "$FEATURE_DIR/about.md"
            if ! git diff --cached --quiet 2>/dev/null; then
                git commit -m "docs($FEATURE_ID): add out-of-scope deliveries addendum

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
                echo "ABOUT_ADDENDUM=OK"
            else
                echo "ABOUT_ADDENDUM=NO_CHANGES"
            fi
        fi
    else
        echo "ABOUT_ADDENDUM=SKIPPED_GITIGNORE"
    fi
fi

# Step 3: Push to feature branch
echo "STEP=Pushing to feature branch..."
if ! git push -u origin "$CURRENT_BRANCH"; then
    echo "STATUS=ERROR"
    echo "ERROR=git push failed for branch $CURRENT_BRANCH"
    echo "HINT=Check remote permissions or run: git push -u origin $CURRENT_BRANCH"
    exit 1
fi
echo "PUSH_FEATURE=OK"

# Step 4: Create Pull Request
echo "STEP=Creating Pull Request..."

# Guard: gh CLI must be available
if ! command -v gh &>/dev/null; then
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
    REPO_SLUG=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]([^/]+/[^/]+?)(\.git)?$|\1|')
    echo "PR_CREATE=SKIPPED"
    echo "PR_ERROR=gh CLI not found"
    echo "HINT=Install GitHub CLI: https://cli.github.com/"
    if [ -n "$REPO_SLUG" ]; then
        echo "MANUAL_URL=https://github.com/${REPO_SLUG}/compare/${MAIN_BRANCH}...${CURRENT_BRANCH}"
    fi
    exit 1
fi

# Guard: gh CLI must be authenticated
if ! gh auth status &>/dev/null; then
    echo "STATUS=ERROR"
    echo "ERROR=gh CLI is not authenticated"
    echo "HINT=Run: gh auth login"
    exit 1
fi

# Guard: abort if a PR already exists for this branch to prevent duplicates
EXISTING_PR=$(gh pr list --head "$CURRENT_BRANCH" --base "$MAIN_BRANCH" --state open --json url --jq '.[0].url' 2>/dev/null || true)
if [ -n "$EXISTING_PR" ]; then
    echo "PR_CREATE=SKIPPED"
    echo "PR_STATUS=ALREADY_EXISTS"
    echo "PR_URL=$EXISTING_PR"
    echo "HINT=A PR is already open for this branch. Close or merge it before creating a new one."
    exit 1
fi

# Read changelog for PR body
PR_BODY=""
if [ -f "$CHANGELOG_PATH" ]; then
    PR_BODY=$(cat "$CHANGELOG_PATH")
fi

# Read about.md for PR title context
ABOUT_SUMMARY=""
if [ -f "$FEATURE_DIR/about.md" ]; then
    ABOUT_SUMMARY=$(head -20 "$FEATURE_DIR/about.md" | grep -v '^#' | grep -v '^>' | grep -v '^$' | head -2 | tr '\n' ' ' | sed 's/[[:space:]]*$//')
fi

# Generate PR title — fallback to feature ID when summary is empty
if [ -n "$ABOUT_SUMMARY" ]; then
    PR_TITLE="feat($FEATURE_ID): $ABOUT_SUMMARY"
else
    PR_TITLE="feat($FEATURE_ID): feature implementation"
fi
# Truncate if too long
PR_TITLE=$(echo "$PR_TITLE" | cut -c1-72)

# Create PR — separate stdout from stderr so PR_URL is clean
PR_URL=$(gh pr create --title "$PR_TITLE" --body "$PR_BODY" --base "$MAIN_BRANCH" 2>/tmp/gh_pr_stderr)
GH_STATUS=$?

if [ $GH_STATUS -eq 0 ] && [ -n "$PR_URL" ]; then
    echo "PR_CREATE=OK"
    echo "PR_URL=$PR_URL"
else
    GH_ERR=$(cat /tmp/gh_pr_stderr 2>/dev/null || true)
    echo "PR_CREATE=FAILED"
    echo "PR_ERROR=${GH_ERR}"
    echo "HINT=Check if gh CLI is authenticated: gh auth status"
    rm -f /tmp/gh_pr_stderr
    exit 1
fi
rm -f /tmp/gh_pr_stderr

# =============================================================================
# DONE - AWAITING MERGE
# =============================================================================

echo ""
echo "========================================"
echo "PR_CREATED"
echo "========================================"
echo "STATUS=AWAITING_MERGE"
echo "FEATURE=$FEATURE_ID"
echo "BRANCH=$CURRENT_BRANCH"
echo "TARGET=$MAIN_BRANCH"
echo ""
echo "NEXT_STEP=After PR is merged, run: bash .codeadd/scripts/feature-pr.sh --confirm-merge"

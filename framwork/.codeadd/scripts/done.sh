#!/bin/bash

# ============================================
# DONE SCRIPT
# Branch finalization: context collection + merge execution
# ============================================
# Usage:
#   bash .codeadd/scripts/done.sh           # Context mode (default)
#   bash .codeadd/scripts/done.sh --merge   # Merge mode
# Dependencies: get-main-branch.sh
# ============================================

# [FIX-1] Added -u (undefined variables cause error) and -o pipefail
# (errors in pipes were not propagated). The original script only had `set -e`.
set -euo pipefail

# --- Args ---
MODE="context"
while [[ $# -gt 0 ]]; do
    case $1 in
        --merge) MODE="merge"; shift ;;
        *) shift ;;
    esac
done

# --- Detection ---

# [FIX-2] CURRENT_BRANCH could be empty in repository with detached HEAD.
# Explicit verification added.
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=HEAD is detached. Checkout a named branch before running this script."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# [FIX-3] Verify that the dependency script exists and is executable before
# calling it. Failure here produced a shell error message without clear context.
if [ ! -f "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Dependency not found: $SCRIPT_DIR/get-main-branch.sh"
    exit 1
fi
if [ ! -x "$SCRIPT_DIR/get-main-branch.sh" ]; then
    chmod +x "$SCRIPT_DIR/get-main-branch.sh"
fi

MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")

# [FIX-4] Empty MAIN_BRANCH would cause git checkout/merge to silently fail.
if [ -z "$MAIN_BRANCH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Could not determine main branch."
    exit 1
fi

# Branch type, feature ID and commit type detection via get-branch-metadata.sh
if [ ! -f "$SCRIPT_DIR/get-branch-metadata.sh" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Dependency not found: $SCRIPT_DIR/get-branch-metadata.sh"
    exit 1
fi
if [ ! -x "$SCRIPT_DIR/get-branch-metadata.sh" ]; then
    chmod +x "$SCRIPT_DIR/get-branch-metadata.sh"
fi

METADATA_OUTPUT=$("$SCRIPT_DIR/get-branch-metadata.sh" "$CURRENT_BRANCH" 2>&1) || {
    echo "$METADATA_OUTPUT"
    exit 1
}

eval "$METADATA_OUTPUT"

# done.sh requires a feature/hotfix ID to proceed
if [ -z "$FEATURE_ID" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=No feature/hotfix ID found in branch: $CURRENT_BRANCH"
    echo "HINT=Branch must contain /[NNNN][L]-* (e.g. feature/0001F-name, refactor/0002R-cleanup)"
    exit 1
fi

FEATURE_NUMBER="$FEATURE_ID"
BRANCH_TYPE="$BRANCH_TYPE"
COMMIT_TYPE="$COMMIT_TYPE"

# ============================================
# CONTEXT MODE (default)
# ============================================

if [ "$MODE" = "context" ]; then

    echo "========================================"
    echo "CONTEXT"
    echo "========================================"
    echo "CURRENT_BRANCH=$CURRENT_BRANCH"
    echo "MAIN_BRANCH=$MAIN_BRANCH"
    echo "BRANCH_TYPE=$BRANCH_TYPE"
    echo "FEATURE_NUMBER=$FEATURE_NUMBER"
    echo ""

    # Validate branch
    if [ "$BRANCH_TYPE" = "unknown" ]; then
        echo "STATUS=ERROR"
        echo "ERROR=Unsupported branch type: $CURRENT_BRANCH"
        echo "HINT=Expected: [type]/[NNNN][L]-* (e.g. feature/0001F-name, fix/0002H-urgent)"
        exit 1
    fi

    # --- Pending Changes ---
    echo "========================================"
    echo "PENDING_CHANGES"
    echo "========================================"

    # [FIX-6] The 2>/dev/null redirections were hiding real git errors
    # (e.g.: not being inside a repository). Removed; set -euo pipefail
    # now captures real failures while legitimate error output remains visible.
    MODIFIED=$(git diff --name-only)
    STAGED=$(git diff --cached --name-only)
    UNTRACKED=$(git ls-files --others --exclude-standard)

    # [FIX-7] wc -l on an empty string still returns 1 on some systems.
    # Use of `|| true` for counts and filter with grep -c avoid false positives.
    MODIFIED_COUNT=$(printf '%s\n' "$MODIFIED" | grep -c '[^[:space:]]' || true)
    STAGED_COUNT=$(printf '%s\n' "$STAGED" | grep -c '[^[:space:]]' || true)
    UNTRACKED_COUNT=$(printf '%s\n' "$UNTRACKED" | grep -c '[^[:space:]]' || true)

    echo "MODIFIED_COUNT=$MODIFIED_COUNT"
    echo "STAGED_COUNT=$STAGED_COUNT"
    echo "UNTRACKED_COUNT=$UNTRACKED_COUNT"

    HAS_UNCOMMITTED=false
    if [ "$MODIFIED_COUNT" -gt 0 ] || [ "$STAGED_COUNT" -gt 0 ] || [ "$UNTRACKED_COUNT" -gt 0 ]; then
        HAS_UNCOMMITTED=true
    fi
    echo "HAS_UNCOMMITTED=$HAS_UNCOMMITTED"

    if [ "$HAS_UNCOMMITTED" = true ]; then
        echo ""
        echo "UNCOMMITTED_FILES=["
        [ -n "$MODIFIED" ] && printf '%s\n' "$MODIFIED" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\" (modified)"; fi; done || true
        [ -n "$STAGED" ] && printf '%s\n' "$STAGED" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\" (staged)"; fi; done || true
        [ -n "$UNTRACKED" ] && printf '%s\n' "$UNTRACKED" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\" (untracked)"; fi; done || true
        echo "]"
    fi

    # --- Branch Changes ---
    echo ""
    echo "========================================"
    echo "BRANCH_CHANGES"
    echo "========================================"

    # [FIX-8] The `|| echo ""` fallback was masking real errors (e.g.: non-existent
    # remote branch). The explicit check below emits a useful message instead
    # of silencing the problem.
    if ! git rev-parse --verify "origin/$MAIN_BRANCH" >/dev/null 2>&1; then
        echo "STATUS=WARNING"
        echo "WARNING=Remote branch origin/$MAIN_BRANCH not found. BRANCH_CHANGES may be incomplete."
        CHANGED_FILES=""
    else
        CHANGED_FILES=$(git diff --name-only "$MAIN_BRANCH"..."$CURRENT_BRANCH")
    fi

    CHANGED_COUNT=$(printf '%s\n' "$CHANGED_FILES" | grep -c '[^[:space:]]' || true)

    echo "CHANGED_COUNT=$CHANGED_COUNT"
    echo "CHANGED_FILES=["
    printf '%s\n' "$CHANGED_FILES" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\""; fi; done || true
    echo "]"

    exit 0
fi

# ============================================
# MERGE MODE (--merge)
# ============================================

if [ "$MODE" = "merge" ]; then

    echo "========================================"
    echo "MERGE"
    echo "========================================"
    echo "BRANCH=$CURRENT_BRANCH"
    echo "TARGET=$MAIN_BRANCH"
    echo "TYPE=$BRANCH_TYPE"
    echo ""

    # [FIX-9] Prevent merge when current branch IS ALREADY the main branch.
    # Without this guard the script would squash-merge main into main.
    if [ "$CURRENT_BRANCH" = "$MAIN_BRANCH" ]; then
        echo "STATUS=ERROR"
        echo "ERROR=Already on $MAIN_BRANCH. Checkout a feature/fix branch first."
        exit 1
    fi

    # [FIX-10] Prevent merge when branch type is unknown.
    # The original script allowed proceeding and created commits with type "chore"
    # and number "UNKNOWN", which is probably undesired.
    if [ "$BRANCH_TYPE" = "unknown" ]; then
        echo "STATUS=ERROR"
        echo "ERROR=Unsupported branch type: $CURRENT_BRANCH"
        echo "HINT=Expected: [type]/[NNNN][L]-* (e.g. feature/0001F-name, fix/0002H-urgent)"
        exit 1
    fi

    # Step 1: Commit pending changes if any
    MODIFIED=$(git diff --name-only)
    STAGED=$(git diff --cached --name-only)
    UNTRACKED=$(git ls-files --others --exclude-standard)

    HAS_UNCOMMITTED=false
    [ -n "$(printf '%s\n' "$MODIFIED" | grep '[^[:space:]]' || true)" ] && HAS_UNCOMMITTED=true
    [ -n "$(printf '%s\n' "$STAGED" | grep '[^[:space:]]' || true)" ] && HAS_UNCOMMITTED=true
    [ -n "$(printf '%s\n' "$UNTRACKED" | grep '[^[:space:]]' || true)" ] && HAS_UNCOMMITTED=true

    if [ "$HAS_UNCOMMITTED" = true ]; then
        echo "STEP=Committing pending changes..."
        git add -A
        git commit -m "$COMMIT_TYPE($FEATURE_NUMBER): finalize before merge

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
        echo "COMMIT=OK"
    else
        echo "COMMIT=SKIPPED"
    fi

    # Step 2: Push to branch
    echo "STEP=Pushing to branch..."
    # [FIX-11] The first push used 2>/dev/null, hiding authentication errors
    # or non-existent remote. Only the definitive push is kept, with error output
    # visible to the operator.
    git push -u origin "$CURRENT_BRANCH"
    echo "PUSH_BRANCH=OK"

    # Step 3: Switch to main and pull
    echo "STEP=Switching to $MAIN_BRANCH..."
    # [FIX-12] Store the branch name BEFORE checkout so it can be used
    # after Step 7, since after checkout CURRENT_BRANCH would no longer
    # be valid as the "source branch" if queried again via git.
    # The variable was already captured before; we only document the reason here.
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    echo "CHECKOUT_MAIN=OK"

    # Step 4: Squash merge
    echo "STEP=Squash merging..."
    # [FIX-13] `git merge --squash` does not create a merge commit; does not accept
    # `--abort`. The original called `git merge --abort` on failure, which
    # would always return error (no merge in progress), masking the real
    # problem. Fixed to only clean the index with `git reset HEAD`.
    if ! git merge --squash "$CURRENT_BRANCH"; then
        echo "STATUS=ERROR"
        echo "ERROR=Merge conflict detected"
        echo "HINT=Resolve conflicts manually, then run: git add . && git commit"
        git reset HEAD 2>/dev/null || true
        exit 1
    fi
    echo "SQUASH=OK"

    # Step 5: Create merge commit
    # [FIX-14] After `git merge --squash` there may be nothing staged when
    # the source branch has no commits ahead of main (e.g.: branch already integrated).
    # In that case `git commit` would fail with "nothing to commit". Verification added.
    echo "STEP=Creating merge commit..."
    if git diff --cached --quiet; then
        echo "MERGE_COMMIT=SKIPPED (nothing to commit after squash)"
    else
        git commit -m "$COMMIT_TYPE($FEATURE_NUMBER): merge from $CURRENT_BRANCH

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
        echo "MERGE_COMMIT=OK"
    fi

    # Step 6: Push to main
    echo "STEP=Pushing to $MAIN_BRANCH..."
    git push origin "$MAIN_BRANCH"
    echo "PUSH_MAIN=OK"

    # Step 7: Cleanup checkpoint tags for this feature
    echo "STEP=Cleaning up checkpoint tags..."
    CHECKPOINT_TAGS=$(git tag -l "checkpoint/${FEATURE_NUMBER}-*" 2>/dev/null || true)
    if [ -n "$CHECKPOINT_TAGS" ]; then
        echo "$CHECKPOINT_TAGS" | while read -r tag; do
            git tag -d "$tag" 2>/dev/null || true
            git push origin --delete "$tag" 2>/dev/null || true
        done
        CHECKPOINT_COUNT=$(echo "$CHECKPOINT_TAGS" | grep -c '[^[:space:]]' || true)
        echo "CHECKPOINT_CLEANUP=${CHECKPOINT_COUNT} tags removed"
    else
        echo "CHECKPOINT_CLEANUP=SKIPPED (no checkpoint tags found)"
    fi

    # Step 8: Cleanup branches
    echo "STEP=Cleaning up branches..."
    git branch -d "$CURRENT_BRANCH" 2>/dev/null || echo "LOCAL_DELETE=SKIPPED"
    git push origin --delete "$CURRENT_BRANCH" 2>/dev/null || echo "REMOTE_DELETE=SKIPPED"
    echo "CLEANUP=OK"

    # Done
    echo ""
    echo "========================================"
    echo "DONE"
    echo "========================================"
    echo "STATUS=SUCCESS"
    echo "MERGED_TO=$MAIN_BRANCH"
    echo "CURRENT_BRANCH=$MAIN_BRANCH"

    exit 0
fi

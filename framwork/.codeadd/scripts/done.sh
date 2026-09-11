#!/bin/bash

# ============================================
# DONE SCRIPT
# Branch finalization: context collection + merge execution
# ============================================
# Usage:
#   bash .codeadd/scripts/done.sh           # Context mode (default)
#   bash .codeadd/scripts/done.sh --merge   # Merge mode
# Dependencies: get-main-branch.sh, get-branch-metadata.sh, node >= 18 (the
#               ROUTE probes' JSON parse only), gh (optional — its absence is
#               the value PR_STATE=no-gh, never an error)
# ============================================

# [FIX-1] Added -u (undefined variables cause error) and -o pipefail
# (errors in pipes were not propagated). The original script only had `set -e`.
set -euo pipefail

# --- Args ---
MODE="context"
while [[ $# -gt 0 ]]; do
    case $1 in
        --merge) MODE="merge"; shift ;;
        --commit-push) MODE="commit-push"; shift ;;
        --cleanup) MODE="cleanup"; shift ;;
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

# Start guard: refuse to run from inside a linked worktree.
# In the primary checkout --git-dir and --git-common-dir resolve to the same
# path; in a linked worktree --git-dir points at .git/worktrees/<name> while
# --git-common-dir points at the primary .git. Resolve both to physical paths
# before comparing — git returns one absolute and one cwd-relative from a
# subdir, so a raw string compare (or a literal `.git` check) false-positives.
GIT_DIR=$(cd "$(git rev-parse --git-dir 2>/dev/null)" 2>/dev/null && pwd || echo "")
GIT_COMMON_DIR=$(cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd || echo "")
if [ -n "$GIT_DIR" ] && [ "$GIT_DIR" != "$GIT_COMMON_DIR" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Running inside a linked worktree. Run /add.done from the primary checkout."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

verify_final_snapshots() {
    [ "$BRANCH_TYPE" = "feature" ] || return 0
    [ -n "${DOCS_DIR:-}" ] && [ -d "$DOCS_DIR" ] || return 0
    local file snapshot
    while IFS= read -r snapshot; do
        [ -n "$snapshot" ] || continue
        if ! git diff --cached --quiet HEAD -- "$snapshot" || ! git diff --quiet -- "$snapshot"; then
            echo "STATUS=ERROR"
            echo "ERROR=Immutable final QA snapshot differs from HEAD: $snapshot"
            return 1
        fi
    done < <(
        git ls-tree -r --name-only HEAD -- "$DOCS_DIR" |
            sed -nE 's#^(.*/_tests/final/run-[0-9][0-9][0-9])/.*#\1#p' |
            sort -u
    )
    while IFS= read -r -d '' file; do
        if git check-ignore -q -- "$file"; then
            echo "STATUS=ERROR"
            echo "ERROR=Final QA snapshot is ignored and cannot enter finalization: $file"
            return 1
        fi
        if ! git ls-files --error-unmatch -- "$file" >/dev/null 2>&1; then
            echo "STATUS=ERROR"
            echo "ERROR=Final QA snapshot was not staged for finalization: $file"
            return 1
        fi
    done < <(find "$DOCS_DIR" -type f -path '*/_tests/final/run-[0-9][0-9][0-9]/*' -print0)
}

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


    # --- Route probes -------------------------------------------------------
    # /add.done crosses four facts to choose between its Normal, Resume, Closed
    # out and Recovery routes. Deriving them in prose is how two commands end up
    # disagreeing about the same tree, which is the reason converge-gates.sh
    # exists; these are the same idea for routing rather than gating.
    #
    # NOTHING here is a gate. gh missing, no PR, no index and no ledger are all
    # ordinary values, and the probe still exits 0.
    echo ""
    echo "========================================"
    echo "ROUTE"
    echo "========================================"

    PR_STATE="no-gh"
    PR_URL=""
    PR_HEAD_SHA=""
    PR_MERGE_COMMIT=""

    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        PR_JSON=$(gh pr view --json state,url,headRefOid,mergeCommit 2>/dev/null || true)
        if [ -z "$PR_JSON" ]; then
            PR_STATE="none"
        else
            # Parsed by node, not by a regex over JSON: gh nests mergeCommit,
            # and a regex works until a field moves. node is already required by
            # converge-gates.sh, which the same command runs.
            PR_FIELDS=$(printf '%s' "$PR_JSON" | node -e "
              let raw='';
              process.stdin.on('data', d => raw += d);
              process.stdin.on('end', () => {
                try {
                  const j = JSON.parse(raw);
                  const mc = (j.mergeCommit && j.mergeCommit.oid) || '';
                  console.log(String(j.state || 'none').toLowerCase());
                  console.log(j.url || '');
                  console.log(j.headRefOid || '');
                  console.log(mc);
                } catch (e) { console.log('none'); console.log(''); console.log(''); console.log(''); }
              });
            " 2>/dev/null || true)
            PR_STATE=$(printf '%s' "$PR_FIELDS" | sed -n '1p')
            PR_URL=$(printf '%s' "$PR_FIELDS" | sed -n '2p')
            PR_HEAD_SHA=$(printf '%s' "$PR_FIELDS" | sed -n '3p')
            PR_MERGE_COMMIT=$(printf '%s' "$PR_FIELDS" | sed -n '4p')
            [ -n "$PR_STATE" ] || PR_STATE="none"
        fi
    fi

    echo "PR_STATE=$PR_STATE"
    echo "PR_URL=$PR_URL"
    echo "PR_HEAD_SHA=$PR_HEAD_SHA"
    echo "PR_MERGE_COMMIT=$PR_MERGE_COMMIT"

    # The FILE, committed or not. The duplicate entry this probe exists to catch
    # is born in the working tree: /add.done 6.8 writes the line and leaves it
    # there for done.sh --merge to commit, so a check reading only commits is
    # blind to exactly the state it is for.
    INDEX_FILE="docs/delivered.jsonl"
    if [ ! -f "$INDEX_FILE" ]; then
        INDEX_ENTRY="no-index"
    elif grep -q "\"id\":\"$FEATURE_NUMBER\"" "$INDEX_FILE" 2>/dev/null; then
        INDEX_ENTRY="present"
    else
        INDEX_ENTRY="absent"
    fi
    echo "INDEX_ENTRY=$INDEX_ENTRY"

    # `unknown` is a real answer, not a failure: an unfetched or absent
    # origin/<main> cannot say whether this branch landed, and reporting `no`
    # there would be a guess.
    if ! git rev-parse --verify "origin/$MAIN_BRANCH" >/dev/null 2>&1; then
        MERGED_ON_MAIN="unknown"
    elif git merge-base --is-ancestor HEAD "origin/$MAIN_BRANCH" 2>/dev/null; then
        MERGED_ON_MAIN="yes"
    else
        MERGED_ON_MAIN="no"
    fi
    echo "MERGED_ON_MAIN=$MERGED_ON_MAIN"

    LEDGER_PATH=""
    [ -n "${DOCS_DIR:-}" ] && LEDGER_PATH="$DOCS_DIR/build-ledger.md"
    echo "LEDGER_PATH=$LEDGER_PATH"

    # The LAST Publish line wins. The ledger is a log, not a set: a second build
    # on the same branch appends rather than replacing, and the latest answer is
    # the operator's current intent.
    PUBLISH_RECORD="none"
    PUBLISH_RECORD_URL=""
    if [ -n "$LEDGER_PATH" ] && [ -f "$LEDGER_PATH" ]; then
        PUBLISH_LINE=$(grep '^Publish:' "$LEDGER_PATH" 2>/dev/null | tail -1 || true)
        if [ -n "$PUBLISH_LINE" ]; then
            PUBLISH_RECORD=$(printf '%s' "$PUBLISH_LINE" | sed 's/^Publish:[[:space:]]*//' | awk '{print $1}')
            PUBLISH_RECORD_URL=$(printf '%s' "$PUBLISH_LINE" | grep -oE 'https?://[^[:space:]]+' | head -1 || true)
        fi
    fi
    echo "PUBLISH_RECORD=$PUBLISH_RECORD"
    echo "PUBLISH_RECORD_URL=$PUBLISH_RECORD_URL"

    exit 0
fi

# ============================================
# MERGE MODE (--merge)
# ============================================

# ============================================
# MODE BODIES
# ============================================
# EXTRACTED from --merge, never re-implemented beside it. --merge composes
# them around its own checkout, squash and push, so every test written against
# --merge still exercises the whole sequence through its original entry point.
#
# The PR route calls --commit-push, lets gh merge server-side, then calls
# --cleanup. The local route is --merge, unchanged.

merge_guards() {

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

}

do_commit_push() {
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
        # Feature-scoped staging: stage all code changes but ONLY the current
        # feature's docs; other features' untracked docs stay untracked.
        git add -A -- . ':(exclude)docs/features/*'
        [ -n "$DOCS_DIR" ] && [ -d "$DOCS_DIR" ] && git add -A -- "$DOCS_DIR" || true
    fi

    # A promoted final snapshot is permanent delivery evidence. Refuse before
    # commit if an ignore rule or staging regression would silently omit it.
    verify_final_snapshots

    if [ "$HAS_UNCOMMITTED" = true ]; then
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

}

do_cleanup() {
    # Standalone, this runs from the feature branch: gh merged server-side and
    # nothing moved the local HEAD. Inside --merge it runs already on main, where
    # the switch is a no-op. One implementation, both callers.
    if [ "$(git branch --show-current)" != "$MAIN_BRANCH" ]; then
        echo "STEP=Switching to $MAIN_BRANCH..."
        git checkout "$MAIN_BRANCH"
        git pull origin "$MAIN_BRANCH"
        echo "CHECKOUT_MAIN=OK"
    fi
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
    # Remove the feature's worktree first: `git branch -d` fails while the branch
    # is checked out in a linked worktree. No --force — fail loud if dirty.
    if [ -n "$FEATURE_SLUG" ] && git worktree list --porcelain 2>/dev/null | grep -qE "^worktree .*/\.worktrees/${FEATURE_SLUG}$"; then
        echo "STEP=Removing worktree .worktrees/${FEATURE_SLUG}..."
        git worktree remove ".worktrees/${FEATURE_SLUG}"
        echo "WORKTREE_CLEANUP=OK"
    fi
    git branch -d "$CURRENT_BRANCH" 2>/dev/null || echo "LOCAL_DELETE=SKIPPED"
    git push origin --delete "$CURRENT_BRANCH" 2>/dev/null || echo "REMOTE_DELETE=SKIPPED"
    echo "CLEANUP=OK"

}

if [ "$MODE" = "merge" ]; then

    merge_guards
    do_commit_push

    # Step 3: Switch to main and pull
    echo "STEP=Switching to $MAIN_BRANCH..."
    # [FIX-12] Store the branch name BEFORE checkout so it can be used
    # after Step 7, since after checkout CURRENT_BRANCH would no longer
    # be valid as the "source branch" if queried again via git.
    # The variable was already captured before; we only document the reason here.
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    echo "CHECKOUT_MAIN=OK"

    # Step 4: Choose the merge mode — DETERMINISTICALLY, never by catching a
    # conflict.
    #
    # WHY THIS EXISTS: on the /add.pull-request route the branch is still
    # un-merged locally, but `main` already carries equivalent content, applied
    # by GitHub's squash button as a NEW commit with a different SHA. The
    # branch's commits are therefore not ancestors of `main`, and STEP 6 then
    # adds one more commit on top. A squash from the original merge base
    # re-applies content `main` already has. FIX-14 covers the FULLY redundant
    # case; this is the PARTIALLY redundant one.
    #
    # The question is "is there anything here `main` does not already have,
    # other than what STEP 6 just wrote". Discovering that as a merge failure
    # and retrying is guessing, so it is answered before anything is attempted.
    #
    # TWO DOTS, NOT THREE. `git diff main...branch` is merge-base-relative: on
    # the PR route it still reports the whole feature diff, because that diff
    # IS what the branch added since the base — even though `main` now carries
    # it. It would be non-empty exactly when this check needs to be empty, and
    # the direct-commit mode below would be dead code. Two dots compare the two
    # TREES, which is the actual question.
    STEP6_PATHS="docs/features docs/delivered.jsonl .codeadd/wiki .codeadd/project/decisions.jsonl"
    if git diff --quiet "$MAIN_BRANCH" "$CURRENT_BRANCH" -- . \
        ':(exclude)docs/features' \
        ':(exclude)docs/delivered.jsonl' \
        ':(exclude).codeadd/wiki' \
        ':(exclude).codeadd/project/decisions.jsonl'; then
        MERGE_MODE="direct"
    else
        MERGE_MODE="squash"
    fi
    echo "MERGE_MODE=$MERGE_MODE"

    if [ "$MERGE_MODE" = "direct" ]; then
        # `main` already has the branch's content. The squash would contribute
        # nothing but a duplicated diff, so commit ONLY what STEP 6 authored,
        # straight onto `main`. This keeps done.sh --merge the sole git owner
        # rather than introducing a second committer.
        #
        # Applied as a patch rather than `git checkout <branch> -- <paths>`,
        # because checkout cannot carry a DELETION: with docs-pruning enabled
        # STEP 6 removes files, and checkout would silently leave them on main.
        echo "STEP=Committing STEP 6 output directly onto $MAIN_BRANCH..."
        STEP6_DIFF=$(git diff "$MAIN_BRANCH" "$CURRENT_BRANCH" -- $STEP6_PATHS)
        if [ -z "$STEP6_DIFF" ]; then
            echo "MERGE_COMMIT=SKIPPED (nothing to commit: $MAIN_BRANCH already carries the branch)"
        else
            if ! printf '%s\n' "$STEP6_DIFF" | git apply --index --whitespace=nowarn; then
                echo "STATUS=ERROR"
                echo "ERROR=Could not apply STEP 6 output onto $MAIN_BRANCH"
                echo "HINT=Resolve manually, then run: git add . && git commit"
                git reset HEAD 2>/dev/null || true
                exit 1
            fi
            git commit -m "$COMMIT_TYPE($FEATURE_NUMBER): docs from $CURRENT_BRANCH

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
            echo "MERGE_COMMIT=OK"
        fi
    else
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
    fi

    # Step 6: Push to main
    echo "STEP=Pushing to $MAIN_BRANCH..."
    git push origin "$MAIN_BRANCH"
    echo "PUSH_MAIN=OK"

    do_cleanup

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

# ============================================
# COMMIT-PUSH MODE (--commit-push)
# ============================================

if [ "$MODE" = "commit-push" ]; then
    merge_guards
    do_commit_push
    echo ""
    echo "STATUS=SUCCESS"
    echo "BRANCH=$CURRENT_BRANCH"
    exit 0
fi

# ============================================
# CLEANUP MODE (--cleanup)
# ============================================

if [ "$MODE" = "cleanup" ]; then
    merge_guards
    do_cleanup
    echo ""
    echo "STATUS=SUCCESS"
    echo "CURRENT_BRANCH=$MAIN_BRANCH"
    exit 0
fi

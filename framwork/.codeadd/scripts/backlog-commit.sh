#!/bin/bash
# ============================================
# BACKLOG COMMIT
# The git route for a backlog write: wraps backlog.sh so the ticket reaches
# the BASE branch whatever branch the caller was standing on.
# ============================================
# Usage: bash .codeadd/scripts/backlog-commit.sh add            < ticket.json
#        bash .codeadd/scripts/backlog-commit.sh update  <id>   < patch.json
#        bash .codeadd/scripts/backlog-commit.sh comment <id>   < comment.json
#        bash .codeadd/scripts/backlog-commit.sh move    <id> --top | --after <id> | --bottom
#        bash .codeadd/scripts/backlog-commit.sh remove  <id>
#
# Dependencies: bash 3.2+, git, and whatever backlog.sh needs (node >= 18).
#
# Output: KEY=VALUE lines — ROUTE, BASE_BRANCH, TICKET_ID, SHA, PUSHED, and
#         DEGRADED when one applies. The same shape backlog.sh and
#         delivered.sh emit, so one consumer parses all three.
#
# Exit:   0 for a result, a DEGRADED one INCLUDED — the ticket was written and
#         that is the result. 1 when the write itself failed. 2 for caller
#         error: a bad mode, a READ mode, bad arguments, backlog.sh's own
#         REFUSED=, or REFUSED=worktree-locked.
#
# `set -u` ONLY, NEVER -e. Half of this script is git commands whose failure
# is a degradation rather than an error, and -e would turn each one into an
# exit — the reason delivered.sh and backlog.sh both state in their headers.
#
# WHY THIS IS A SECOND SCRIPT. backlog.sh runs no git command at all: its
# header says so twice and backlog.bats L1.5b asserts it, commenting "the git
# route belongs to subtopic 002". That promise is delivered and is not
# reopened here. A trap also needs a process, and the skill that calls this is
# not one — six git commands driven from a skill is six places a run can stop
# and leave a worktree behind.
#
# WRITE MODES ONLY. `list` and `search` commit nothing, so routing them
# through a script that resolves a base branch and may open a worktree is pure
# cost — and it would break the read path in a directory that is not a git
# repository at all. They are refused here and called on backlog.sh directly.
#
# THE ROUTE IS ONE TEST: the current branch name equals the name
# get-main-branch.sh returned. Equal -> direct. Anything else, a DETACHED HEAD
# INCLUDED -> worktree. A detached HEAD is not the base branch, and the
# worktree is the safe side of the only ambiguous case the test has.
#
# THE WORKTREE IS CREATED DETACHED, and that is not a detail. A capture
# launched from inside a linked worktree finds the base branch already checked
# out in the primary tree, and `git worktree add` refuses a branch that is
# checked out elsewhere. Detached works in both cases, and the local base ref
# is fast-forwarded afterwards only when nothing has it checked out.
#
# THE WORKTREE IS LOCKED FOR THE WHOLE CAPTURE. The lock is the only thing
# that tells a live capture from a leaked one. Without it the sweep below
# would delete a concurrent capture's tree mid-commit, which is the silent
# loss this whole design exists to prevent.
#
# THE WRITE IS NEVER DISCARDED. Every failure past the write degrades: the
# ticket is already on disk, and the report says what did not happen and why.
# A rebase conflict is ABORTED, never resolved — a repository left mid-rebase
# is the one outcome worse than an unpushed commit.
# ============================================

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKLOG="docs/backlog.jsonl"
DEFS="docs/backlog.definitions.json"
WT=".worktrees/backlog"

usage() {
    cat >&2 <<'USAGE'
USAGE: bash .codeadd/scripts/backlog-commit.sh <write-mode> [args]
  add               < ticket.json
  update  <id>      < patch.json
  comment <id>      < comment.json
  move    <id> --top | --after <id> | --bottom
  remove  <id>

`list` and `search` are reads. Call backlog.sh directly for those.
USAGE
}

# --- Mode ----------------------------------------------------------------
#
# A read is rejected by NAME rather than falling through to bad-mode, so a
# caller that routed one here learns what it did wrong.
MODE="${1:-}"
case "$MODE" in
    add|update|comment|move|remove) ;;
    list|search) echo "ERROR=read-mode"; usage; exit 2 ;;
    *) echo "ERROR=bad-mode"; usage; exit 2 ;;
esac
shift

BACKLOG_ARGS=("$MODE" "$@")

# --- stdin, for the modes that take a record -----------------------------
#
# Read HERE, once, because the write happens in another directory and may
# happen after a worktree is created — stdin is not still available there.
STDIN_JSON=""
case "$MODE" in
    add|update|comment) STDIN_JSON=$(cat) ;;
esac

# --- Reporting -----------------------------------------------------------
#
# Collected and printed at the end, so a degradation discovered late still
# reports the keys gathered early. backlog.sh's own output is captured rather
# than echoed, and TICKET_ID is lifted out of it — on an `add` that id does
# not exist before the write, so this is the only way the caller learns it.
ROUTE=""
BASE_BRANCH=""
TICKET_ID=""
SHA=""
PUSHED="no"
DEGRADED=""

report() {
    [ -n "$ROUTE" ]       && echo "ROUTE=$ROUTE"
    [ -n "$BASE_BRANCH" ] && echo "BASE_BRANCH=$BASE_BRANCH"
    [ -n "$TICKET_ID" ]   && echo "TICKET_ID=$TICKET_ID"
    [ -n "$SHA" ]         && echo "SHA=$SHA"
    echo "PUSHED=$PUSHED"
    [ -n "$DEGRADED" ]    && echo "DEGRADED=$DEGRADED"
    return 0
}

# run_backlog <dir> — run backlog.sh in <dir>, capture its output, lift
# TICKET_ID. Returns backlog.sh's own exit code untouched: a REFUSED= from it
# is caller error here too, and inventing a different code would hide it.
BACKLOG_OUT=""
run_backlog() {
    local dir="$1"
    BACKLOG_OUT=$(cd "$dir" && printf '%s' "$STDIN_JSON" | bash "$SCRIPT_DIR/backlog.sh" "${BACKLOG_ARGS[@]}" 2>&1)
    local rc=$?
    TICKET_ID=$(printf '%s\n' "$BACKLOG_OUT" | grep -E '^TICKET_ID=' | head -1 | cut -d= -f2-)
    return $rc
}

# --- The base branch -----------------------------------------------------
#
# get-main-branch.sh has THREE outcomes and two of them are degradations that
# still write. Exit 1 is "not a git repository", exit 2 is "no base branch
# found" — different states, and the report must say which.
BASE_BRANCH=$(bash "$SCRIPT_DIR/get-main-branch.sh" 2>/dev/null)
BASE_RC=$?

if [ "$BASE_RC" -ne 0 ] || [ -z "$BASE_BRANCH" ]; then
    case "$BASE_RC" in
        1) DEGRADED="not-a-git-repo" ;;
        *) DEGRADED="no-base-branch" ;;
    esac
    BASE_BRANCH=""
    # THE WRITE STILL HAPPENS, in the caller's own tree, uncommitted. A
    # project with no remote and no main is a real project, and losing the
    # thought is worse than not committing it.
    run_backlog "."
    rc=$?
    if [ "$rc" -ne 0 ]; then printf '%s\n' "$BACKLOG_OUT"; exit "$rc"; fi
    ROUTE="none"
    report
    exit 0
fi

# --- The sweep, before anything else -------------------------------------
#
# A crash can die before its trap. The sweep is the second chance, and it runs
# on every write because the write path has already resolved git state — a
# read is the wrong place for it, being the path that does no git at all.
#
# STALE MEANS UNLOCKED. A locked tree is either a live capture or a crash that
# died holding the lock, and only a human can tell those apart — so this
# removes nothing and says how to clear it.
if git worktree list --porcelain 2>/dev/null | grep -qE "^worktree .*/\.worktrees/backlog$"; then
    if git worktree list --porcelain 2>/dev/null | grep -A3 -E "^worktree .*/\.worktrees/backlog$" | grep -q '^locked'; then
        echo "REFUSED=worktree-locked"
        echo "A capture is holding $WT, or one crashed while holding it."
        echo "Clear it with: git worktree unlock $WT"
        exit 2
    fi
    git worktree remove "$WT" >/dev/null 2>&1 || git worktree prune >/dev/null 2>&1
fi

# --- The route -----------------------------------------------------------
#
# ONE test. A detached HEAD reports as "HEAD", which equals no branch name, so
# it falls to the worktree side without a case of its own.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
    ROUTE="direct"
    WORKDIR="."
else
    ROUTE="worktree"
    WORKDIR="$WT"
fi

# --- Set up the worktree, if this is that route --------------------------
CLEANUP_WT=0
cleanup() {
    if [ "$CLEANUP_WT" = "1" ]; then
        git worktree unlock "$WT" >/dev/null 2>&1
        # NO --force, matching done.sh: a dirty tree fails loud rather than
        # being silently discarded.
        git worktree remove "$WT" >/dev/null 2>&1
    fi
}
trap cleanup EXIT

if [ "$ROUTE" = "worktree" ]; then
    # `.worktrees/` is gitignored the way build-setup.sh already does it. A
    # second convention for the same directory is a second thing to learn.
    if [ ! -f .gitignore ] || ! grep -qF '.worktrees/' .gitignore; then
        echo ".worktrees/" >> .gitignore
    fi

    # DETACHED. The base branch may be checked out in another worktree — that
    # is exactly the case a capture from inside a linked worktree hits — and
    # `git worktree add` refuses a branch that is.
    if ! git worktree add -q --detach "$WT" "$BASE_BRANCH" 2>/dev/null; then
        DEGRADED="worktree-failed"
        run_backlog "."
        rc=$?
        if [ "$rc" -ne 0 ]; then printf '%s\n' "$BACKLOG_OUT"; exit "$rc"; fi
        ROUTE="none"
        report
        exit 0
    fi
    CLEANUP_WT=1
    git worktree lock "$WT" >/dev/null 2>&1
fi

# --- The write -----------------------------------------------------------
run_backlog "$WORKDIR"
WRITE_RC=$?
if [ "$WRITE_RC" -ne 0 ]; then
    # backlog.sh refused or failed. Its own output IS the message, and its
    # exit code IS the answer — a REFUSED=unknown-id is caller error here too.
    printf '%s\n' "$BACKLOG_OUT"
    exit "$WRITE_RC"
fi

# --- Commit --------------------------------------------------------------
#
# THE TWO PATHS BY NAME. Never -A and never `.`: this commit goes to the base
# branch and the caller's tree may carry unrelated work.
COMMIT_MSG="chore(backlog): ${MODE} ${TICKET_ID}"

( cd "$WORKDIR" && git add -- "$BACKLOG" "$DEFS" >/dev/null 2>&1 )
if ! ( cd "$WORKDIR" && git diff --cached --quiet ); then
    if ! ( cd "$WORKDIR" && git commit -q -m "$COMMIT_MSG" >/dev/null 2>&1 ); then
        echo "ERROR=commit-failed"
        exit 1
    fi
fi
SHA=$( cd "$WORKDIR" && git rev-parse HEAD 2>/dev/null )

# --- Reconcile and push --------------------------------------------------
#
# No remote is a result, not a failure: the commit is durable across the
# session and the report says the push did not land.
if ! git remote get-url origin >/dev/null 2>&1; then
    DEGRADED="no-remote"
else
    ( cd "$WORKDIR" && git fetch -q origin "$BASE_BRANCH" >/dev/null 2>&1 )

    if ( cd "$WORKDIR" && git rev-parse --verify -q FETCH_HEAD >/dev/null 2>&1 ); then
        if ! ( cd "$WORKDIR" && git rebase -q FETCH_HEAD >/dev/null 2>&1 ); then
            # ABORT, never resolve. Nobody is here to decide, and leaving a
            # repository mid-rebase is worse than an unpushed commit.
            ( cd "$WORKDIR" && git rebase --abort >/dev/null 2>&1 )
            DEGRADED="rebase-conflict"
        else
            SHA=$( cd "$WORKDIR" && git rev-parse HEAD 2>/dev/null )
        fi
    fi

    if [ -z "$DEGRADED" ]; then
        if ( cd "$WORKDIR" && git push -q origin "HEAD:refs/heads/$BASE_BRANCH" >/dev/null 2>&1 ); then
            PUSHED="yes"
        else
            DEGRADED="push-refused"
        fi
    fi
fi

# --- Fast-forward the local base ref -------------------------------------
#
# The worktree is detached, so the commit is reachable by sha and by nothing
# else until this runs. Skipped when the base branch is checked out somewhere,
# because moving a ref out from under a live working tree makes that tree
# report changes nobody made.
if [ "$ROUTE" = "worktree" ] && [ -n "$SHA" ]; then
    if git worktree list --porcelain 2>/dev/null | grep -qE "^branch refs/heads/$BASE_BRANCH$"; then
        [ -z "$DEGRADED" ] && [ "$PUSHED" = "no" ] && DEGRADED="base-checked-out-elsewhere"
    else
        git update-ref "refs/heads/$BASE_BRANCH" "$SHA" >/dev/null 2>&1
    fi
fi

report
exit 0

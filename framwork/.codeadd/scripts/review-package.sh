#!/bin/bash
# ============================================
# REVIEW-PACKAGE
# Write the scoped diff for BASE..HEAD into ONE file, so a reviewer is
# dispatched against a PATH instead of a pasted diff.
# ============================================
# Usage: bash .codeadd/scripts/review-package.sh <BASE> <HEAD> <OUT_DIR>
# Dependencies: bash, git.
# Output: KEY=VALUE lines — PACKAGE=<path>, COMMITS=<n>, FILES=<n>.
# Exit:   0 on success. 2 ONLY on CLI misuse — wrong arity, an unresolvable
#         ref, no git repository, or AN EMPTY RANGE. 1 only on a refused write.
#
# THE EMPTY RANGE IS REFUSED, AND THAT IS THE POINT. An empty package is how a
# reviewer gets dispatched against nothing and comes back "looks fine" — a
# clean verdict on work nobody looked at, which is worse than no review. The
# refusal happens BEFORE anything is written, so a failed call leaves no file a
# later step could pick up and hand to an agent anyway.
#
# "Empty" means no commits AND no textual diff. A range whose only commit is
# empty still packages: `git log` is content, and the reviewer should see that
# a task produced a marker commit and nothing else.
#
# BASE..HEAD exists at all only because /add.build now commits per task. The
# coordinator records BASE before dispatching and HEAD after the agent's
# commits land; both go in the ledger line, and this script turns that bracket
# into something a reviewer can read.
# ============================================

set -u

usage() {
  {
    echo "Usage: review-package.sh <BASE> <HEAD> <OUT_DIR>"
    echo "  BASE     any git ref — recorded before the dispatch"
    echo "  HEAD     any git ref — recorded after the agent's commits landed"
    echo "  OUT_DIR  scratch dir, typically <FEATURE_DIR>/_build — created, and self-ignored"
  } >&2
  exit 2
}

fail() {
  echo "ERROR=$1" >&2
  exit 1
}

refuse() {
  echo "ERROR=$1" >&2
  exit 2
}

[ "$#" -eq 3 ] || usage

BASE="$1"
HEAD_REF="$2"
OUT_DIR="$3"

[ -n "$BASE" ] && [ -n "$HEAD_REF" ] && [ -n "$OUT_DIR" ] || usage

git rev-parse --git-dir >/dev/null 2>&1 || refuse "Not a git repository: $(pwd)"

# Resolve both ends to commits first. `--verify --quiet` prints nothing and
# returns non-zero on a ref that does not exist, so an emptiness check on the
# result is the whole validation.
BASE_SHA=$(git rev-parse --verify --quiet "$BASE^{commit}" 2>/dev/null || true)
[ -n "$BASE_SHA" ] || refuse "BASE does not resolve to a commit: $BASE"
HEAD_SHA=$(git rev-parse --verify --quiet "$HEAD_REF^{commit}" 2>/dev/null || true)
[ -n "$HEAD_SHA" ] || refuse "HEAD does not resolve to a commit: $HEAD_REF"

COMMITS=$(git rev-list --count "$BASE_SHA..$HEAD_SHA" 2>/dev/null || echo 0)
COMMITS=${COMMITS:-0}
DIFF=$(git diff -U10 "$BASE_SHA" "$HEAD_SHA" 2>/dev/null || true)

if [ "$COMMITS" -eq 0 ] && [ -z "$DIFF" ]; then
  refuse "Empty range $BASE..$HEAD_REF — there is nothing to review"
fi

FILES=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA" 2>/dev/null | grep -c '' || true)

BASE_SHORT=$(git rev-parse --short "$BASE_SHA" 2>/dev/null)
HEAD_SHORT=$(git rev-parse --short "$HEAD_SHA" 2>/dev/null)

[ -d "$OUT_DIR" ] || mkdir -p "$OUT_DIR" 2>/dev/null || fail "Cannot create directory $OUT_DIR"

# F4's scratch contract — see task-brief.sh. Written only when absent.
[ -f "$OUT_DIR/.gitignore" ] || printf '*\n' > "$OUT_DIR/.gitignore" 2>/dev/null \
  || fail "Cannot write $OUT_DIR/.gitignore"

PACKAGE="$OUT_DIR/review-package-$BASE_SHORT-$HEAD_SHORT.md"

# No fenced code blocks. A diff of a markdown file carries its own fences, and
# any fence chosen here can be closed early by the content it is meant to hold.
# Raw sections are unbreakable instead: no line git emits — log hashes, stat
# lines (leading space), `diff --git`, `@@` hunks, `+`/`-`/context — can ever
# start with `## `, so the section headings stay unambiguous.
{
  printf '# Review package — %s..%s\n\n' "$BASE_SHORT" "$HEAD_SHORT"
  printf '> Range: `%s..%s` (%s..%s)\n' "$BASE" "$HEAD_REF" "$BASE_SHA" "$HEAD_SHA"
  printf '> Commits: %s — Files changed: %s\n\n' "$COMMITS" "${FILES:-0}"
  printf '## Commits (git log --oneline)\n\n'
  git log --oneline "$BASE_SHA..$HEAD_SHA" 2>/dev/null
  printf '\n## Files changed (git diff --stat)\n\n'
  git diff --stat "$BASE_SHA" "$HEAD_SHA" 2>/dev/null
  printf '\n## Diff (git diff -U10)\n\n'
  printf '%s\n' "$DIFF"
} > "$PACKAGE" 2>/dev/null || fail "Cannot write $PACKAGE"

echo "PACKAGE=$PACKAGE"
echo "COMMITS=$COMMITS"
echo "FILES=${FILES:-0}"

exit 0

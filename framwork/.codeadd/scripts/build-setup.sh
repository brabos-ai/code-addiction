#!/bin/bash
# ============================================
# BUILD SETUP
# Create-or-checkout the branch a feature's about.md decided, at build time.
# ============================================
# Usage: bash .codeadd/scripts/build-setup.sh <FEATURE_ID|FEATURE_SLUG> [--worktree]
# Output (parseable, last non-hint line):
#   BRANCH:<name> STATE:created|existing|current MODE:in-place|worktree [DERIVED:true] [WORKTREE:<path>]
# Exit codes:
#   0 — success
#   2 — feature dir not found / ambiguous
#   3 — invalid branch: format or slug != dirname (Hard Invariant)
#   4 — no verifiable main branch
#   5 — dirty tracked working tree (in-place mode only)
# Dependencies: git, get-main-branch.sh
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Arguments ---

FEATURE_ARG=""
WORKTREE=false
for arg in "$@"; do
  case "$arg" in
    --worktree) WORKTREE=true ;;
    *)          FEATURE_ARG="$arg" ;;
  esac
done

if [ -z "$FEATURE_ARG" ]; then
  echo "ERROR: missing <FEATURE_ID|FEATURE_SLUG> argument." >&2
  exit 2
fi

# --- 1. Resolve FEATURE_DIR ---

if [[ "$FEATURE_ARG" =~ ^[0-9]{4}[A-Z]$ ]]; then
  # ID form → glob docs/features/<ID>-*
  shopt -s nullglob
  matches=( docs/features/"${FEATURE_ARG}"-* )
  shopt -u nullglob
  case "${#matches[@]}" in
    0) echo "ERROR: no feature docs match '${FEATURE_ARG}' (docs/features/${FEATURE_ARG}-*)." >&2; exit 2 ;;
    1) FEATURE_DIR="${matches[0]}" ;;
    *) echo "ERROR: ambiguous ID '${FEATURE_ARG}' matches multiple dirs:" >&2
       printf '  %s\n' "${matches[@]}" >&2
       exit 2 ;;
  esac
else
  # Full slug form → exact dir
  FEATURE_DIR="docs/features/${FEATURE_ARG}"
  if [ ! -d "$FEATURE_DIR" ]; then
    echo "ERROR: feature docs not found: ${FEATURE_DIR}." >&2
    exit 2
  fi
fi

DIRNAME="$(basename "$FEATURE_DIR")"

# --- 2. Read branch: from about.md (legacy fallback if absent) ---

ABOUT="$FEATURE_DIR/about.md"
BRANCH=""
DERIVED=false

if [ -f "$ABOUT" ]; then
  BRANCH="$(grep -m1 '^branch:' "$ABOUT" 2>/dev/null | sed 's/^branch:[[:space:]]*//' || true)"
fi

if [ -z "$BRANCH" ]; then
  # Legacy docs: derive type from ID letter → <type>/<dirname>
  LETTER=""
  [[ "$DIRNAME" =~ ^[0-9]{4}([A-Z]) ]] && LETTER="${BASH_REMATCH[1]}"
  case "$LETTER" in
    F) TYPE=feature ;;
    H) TYPE=hotfix ;;
    R) TYPE=refactor ;;
    C) TYPE=chore ;;
    D) TYPE=docs ;;
    P) TYPE=perf ;;
    T) TYPE=test ;;
    *) echo "ERROR: cannot derive branch type from dir '${DIRNAME}' (no valid ID letter)." >&2; exit 3 ;;
  esac
  BRANCH="${TYPE}/${DIRNAME}"
  DERIVED=true
fi

# --- 3. Validate format + Hard Invariant (slug == dirname) ---

if ! [[ "$BRANCH" =~ ^[a-z]+/[0-9]{4}[A-Z]-[a-z0-9-]+$ ]]; then
  echo "ERROR: invalid branch value '${BRANCH}' (expected [type]/[NNNN][L]-[slug])." >&2
  exit 3
fi

BRANCH_SLUG="${BRANCH#*/}"
if [ "$BRANCH_SLUG" != "$DIRNAME" ]; then
  echo "ERROR: branch slug '${BRANCH_SLUG}' != docs dir '${DIRNAME}' (Hard Invariant)." >&2
  exit 3
fi

# --- 4. Resolve base (local main ref; no network) ---

MAIN_BRANCH="$("$SCRIPT_DIR/get-main-branch.sh" 2>/dev/null)" || MAIN_BRANCH=""
if [ -z "$MAIN_BRANCH" ]; then
  echo "ERROR: no verifiable main branch (main/master absent)." >&2
  exit 4
fi

CURRENT="$(git branch --show-current 2>/dev/null || echo "")"

# --- 5. Dirty-tree guard (in-place mode only; untracked allowed) ---

if [ "$WORKTREE" = false ]; then
  DIRTY="$(git status --porcelain 2>/dev/null | grep -v '^??' || true)"
  if [ -n "$DIRTY" ]; then
    echo "ERROR: working tree has tracked modifications (commit or stash first):" >&2
    printf '%s\n' "$DIRTY" >&2
    exit 5
  fi
fi

# --- 6/7. Create-or-checkout (idempotent) ---

if [ "$WORKTREE" = false ]; then
  MODE="in-place"
  if [ "$CURRENT" = "$BRANCH" ]; then
    STATE="current"
  elif git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout -q "$BRANCH"
    STATE="existing"
  else
    git checkout -q -b "$BRANCH" "$MAIN_BRANCH"
    STATE="created"
  fi
else
  MODE="worktree"
  WT_PATH=".worktrees/${DIRNAME}"

  # Ensure .worktrees/ is gitignored
  if [ ! -f .gitignore ] || ! grep -qF '.worktrees/' .gitignore; then
    echo ".worktrees/" >> .gitignore
  fi

  if git worktree list --porcelain 2>/dev/null | grep -qE "^worktree .*/\.worktrees/${DIRNAME}$"; then
    STATE="current"
  else
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git worktree add -q "$WT_PATH" "$BRANCH"
      STATE="existing"
    else
      git worktree add -q -b "$BRANCH" "$WT_PATH" "$MAIN_BRANCH"
      STATE="created"
    fi
    # Untracked feature docs do not follow `worktree add` — copy them in.
    mkdir -p "$WT_PATH/$(dirname "$FEATURE_DIR")"
    cp -R "$FEATURE_DIR" "$WT_PATH/$(dirname "$FEATURE_DIR")/"
  fi

  WT_ABS="$(cd "$WT_PATH" && pwd)"
fi

# --- 8. Output ---

OUT="BRANCH:${BRANCH} STATE:${STATE} MODE:${MODE}"
[ "$DERIVED" = true ] && OUT="${OUT} DERIVED:true"
[ "$WORKTREE" = true ] && OUT="${OUT} WORKTREE:${WT_ABS}"
echo "$OUT"

if [ "$WORKTREE" = true ]; then
  echo "→ Open ${WT_PATH} in your editor (same window — it is in-repo) and run one Claude session per worktree." >&2
fi

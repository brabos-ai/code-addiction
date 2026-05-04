#!/bin/bash
# =============================================================================
# Get Main Branch
# Detects the project's main branch with cascading fallback
# =============================================================================
# Usage: MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")
# Returns: name of the main branch (main, master, etc)
# Exit codes:
#   0 — branch found with certainty (verified in repository)
#   1 — not a git repository
#   2 — no default branch found (hardcoded fallback not used)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Guard: verify we are inside a git repository
# ---------------------------------------------------------------------------
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "ERROR: current directory is not a git repository." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Try origin/HEAD (works in correctly cloned repos)
#    Uses subshell to isolate pipefail — if git symbolic-ref fails,
#    the pipe with sed does not mask the error.
# ---------------------------------------------------------------------------
MAIN=""
if MAIN=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'); then
  if [ -n "$MAIN" ]; then
    echo "$MAIN"
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# 2. Check if origin/main exists on remote
# ---------------------------------------------------------------------------
if git show-ref --verify --quiet refs/remotes/origin/main 2>/dev/null; then
  echo "main"
  exit 0
fi

# ---------------------------------------------------------------------------
# 3. Check if origin/master exists on remote
# ---------------------------------------------------------------------------
if git show-ref --verify --quiet refs/remotes/origin/master 2>/dev/null; then
  echo "master"
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Fallback: check local branches (repo without remote or without fetch)
# ---------------------------------------------------------------------------
if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
  echo "main"
  exit 0
fi

if git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
  echo "master"
  exit 0
fi

# ---------------------------------------------------------------------------
# 5. Last resort: no default branch found
#    Emits warning on stderr and exits with error — does not blindly return "main"
#    because the caller needs to know there is no verified branch.
# ---------------------------------------------------------------------------
echo "ERROR: no main branch found (main/master absent locally and remotely)." >&2
exit 2

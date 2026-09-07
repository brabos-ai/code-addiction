#!/bin/bash
# ============================================
# BUILD-LEDGER
# Append ONE line to a feature's build ledger, creating the file with its
# identity header when absent.
# ============================================
# Usage: bash .codeadd/scripts/build-ledger.sh <LEDGER_FILE> <LINE> [FEATURE_ID] [PLAN_PATH]
# Dependencies: bash, awk (POSIX). No git, no node — the ledger must be
#               writable in the middle of a half-finished build.
# Output: KEY=VALUE lines — LEDGER=<path as given>, CREATED=true|false,
#         LINES=<entries after the header>.
# Exit:   0 on success. 2 ONLY on CLI misuse. 1 only when the filesystem
#         refuses the write — a ruling that silently fails to land is worse
#         than a loud failure, so this one case does not exit 0.
#
# WHY THIS SCRIPT EXISTS: the build coordinator's Decision Log lived in the
# conversation, so a compaction erased the answer to "is task 4 done?" and the
# coordinator re-dispatched finished work. The ledger is that answer on disk.
# It is TRACKED, not scratch (unlike ${FEATURE_DIR}/_build/), because it
# carries the rulings — a reviewer who cannot see what was decided on their
# behalf cannot review it.
#
# IT IS A LOG, NOT A SET: the same line twice appends twice. De-duplicating
# would erase "fix round 1" followed by "fix round 2" of the same finding, and
# would hide that a task was re-entered after a crash.
#
# THE IDENTITY HEADER is written once, on creation only:
#   # Build ledger — feature: <ID> — plan: <path>
# FEATURE_ID and PLAN_PATH are optional. When omitted they are derived from the
# ledger's own directory — `docs/features/<ID>/build-ledger.md` on a simple
# feature, `<SF_DIR>/build-ledger.md` on an epic — so the two-argument call
# documented in the plan always works. Pass them explicitly when the directory
# name is not the identity you want recorded (an epic's SF slug, typically).
# Once the file exists they are IGNORED: the header is never rewritten, because
# a ledger whose identity changes mid-build is a ledger that cannot be trusted.
# ============================================

# -u only. -e would turn a probe result into an exit code, and every failure
# below is either reported as misuse (2) or as a loud write error (1).
set -u

usage() {
  {
    echo "Usage: build-ledger.sh <LEDGER_FILE> <LINE> [FEATURE_ID] [PLAN_PATH]"
    echo "  LEDGER_FILE  docs/features/<ID>/build-ledger.md, or <SF_DIR>/build-ledger.md on an epic"
    echo "  LINE         one event, one line — must not be empty and must not contain a newline"
    echo "  FEATURE_ID   optional; defaults to the ledger directory's name"
    echo "  PLAN_PATH    optional; defaults to <ledger directory>/plan.md"
  } >&2
  exit 2
}

fail() {
  echo "ERROR=$1" >&2
  exit 1
}

[ "$#" -ge 2 ] && [ "$#" -le 4 ] || usage

LEDGER_FILE="$1"
LINE="$2"
FEATURE_ID="${3:-}"
PLAN_PATH="${4:-}"

[ -n "$LEDGER_FILE" ] || usage

# An empty line is not an event. Appending it would put a blank row in an
# append-only log and make the entry count lie.
[ -n "$LINE" ] || usage

# One line per event is the whole shape. A multi-line LINE (a pasted report, an
# agent's output) would break every reader that counts entries or resumes from
# the last one, so it is misuse rather than something to silently flatten.
NEWLINE='
'
case "$LINE" in
  *"$NEWLINE"*) usage ;;
esac

LEDGER_DIR="$(dirname "$LEDGER_FILE")"
[ -d "$LEDGER_DIR" ] || mkdir -p "$LEDGER_DIR" 2>/dev/null || fail "Cannot create directory $LEDGER_DIR"

CREATED=false
if [ ! -f "$LEDGER_FILE" ]; then
  ID="$FEATURE_ID"
  [ -n "$ID" ] || ID="$(basename "$LEDGER_DIR")"
  PLAN="$PLAN_PATH"
  [ -n "$PLAN" ] || PLAN="$LEDGER_DIR/plan.md"
  {
    printf '# Build ledger — feature: %s — plan: %s\n' "$ID" "$PLAN"
    printf '\n'
  } > "$LEDGER_FILE" 2>/dev/null || fail "Cannot write $LEDGER_FILE"
  CREATED=true
fi

# printf '%s\n' — never `echo`, never a format string built from the line. A
# ruling reads "100% of `UserDto.name` uses %s"; echo would eat the escapes and
# a bare printf would read the percent signs as directives.
printf '%s\n' "$LINE" >> "$LEDGER_FILE" 2>/dev/null || fail "Cannot append to $LEDGER_FILE"

# Entries only: line 1 is the header, line 2 is the blank line under it.
LINES=$(awk 'NR > 2 && $0 != "" { n++ } END { print n + 0 }' "$LEDGER_FILE" 2>/dev/null)

echo "LEDGER=$LEDGER_FILE"
echo "CREATED=$CREATED"
echo "LINES=${LINES:-0}"

exit 0

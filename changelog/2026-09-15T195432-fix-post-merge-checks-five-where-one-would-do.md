# Post-merge checks: five where one would do

**Date:** 2026-09-15
**Plan:** `2026-09-14T215437-PLAN--post-merge-checks-five-where-one-would-do`
**Layers:** internal (the check removal), product (one recorded note)

## TL;DR

`/add-framework--done` STEP 8 now runs two post-merge checks instead of five. The three that were cut
re-proved something the command's own step order already guarantees, and one of them broke outright on
Windows inside a deep worktree — refusing the cleanup of a delivery that had archived correctly.

## What changed

- **STEP 8's gate reads the fetch and the merge check, and nothing else.** Checks 3 (every archive
  member resolves), 4 (the index entry is on `main`) and 5 (byte-identical) are gone, together with the
  subsection heading that counted them, the "Run all five" line, and the two callouts that existed only
  to explain checks 3 and 5. The step-order argument is recorded in their place: STEP 6 commits the
  archive, the index entry and the changelog in one commit, and STEP 7 merges that commit — so a
  successful merge cannot exist without the archive existing.
- **Check 5's one real case is now prevented instead of detected.** It existed for a ledger appended to
  after the archive commit and never re-copied. STEP 6.1 now states that nothing writes to the ledger
  after the archive is assembled, which makes that state unreachable rather than something a later
  check has to catch.
- **Exit 127 is named alongside exit 2** in the bats-gate fallback at `:225`. A fresh worktree has no
  root `node_modules`, so `npm run test:scripts` exits 127 rather than the documented 2; the remedy
  (`npm install` at the worktree root) is stated with it.
- **`/add.done` records why the product close-out has none of this.** `done.sh`'s `do_cleanup` already
  runs exactly the two checks the internal command is being cut down to — a fetch and a merge-ancestry
  check, nothing per file. The note keeps a later reader from "fixing" a parity gap that is deliberate.
- **`cli/tests/close-out-hardening.test.js`'s `L3.3` matches the new gate.** It previously asserted the
  presence of `git show origin/main:` and `cmp` — the exact text this delivery removes.

## Why

Measured on 2026-09-14, closing `2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary`:
from a worktree 97 characters deep, against a 152-character member path, check 3's
`git show origin/main:docs/deliveries/<id>/<member>` answered `fatal: failed to stat … Filename too
long`, exit 128 — while `git ls-tree` proved the member was on `main` the whole time. That false
negative sits inside the gate that refuses every deletion in STEP 8, so a correct delivery had its
worktree, branch and local originals all left behind, and the operator was handed a
`/add-framework--plan` suggestion for a problem that did not exist.

The operator's decision, recorded in `docs/roadmap/index.md` §5.1 the same day: *"esses done — 
add-framework--done e add.done — não têm que fazer check de arquivo byte a byte. É só verificar se foi
feito merge e fim. Gasta tempo e token à toa."*

An earlier draft of this work proposed repairing check 3 by resolving archive members through
`git ls-tree` + `git cat-file blob` instead of by stated path, keeping all five checks. That draft was
abandoned: it solves a path-length problem that stops existing once the checks it applied to are gone.

## Files

| Action | File |
|---|---|
| Modified | `.claude/commands/add-framework--done.md` |
| Modified | `cli/tests/close-out-hardening.test.js` |
| Modified | `framwork/.codeadd/commands/add.done.md` |
| Deleted | none |

## Follow-up

`docs/roadmap/index.md` §5.1 is not removed by this delivery — roadmap edits push straight to `main`
through `/add-framework--roadmap`'s own flow, outside a feature branch's PR. Remove it there once this
merges.

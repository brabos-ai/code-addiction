# Brainstorm: Command Write/Read Mismatches — Post-Merge Checks Are Five Where One Would Do

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-14
> **Type:** workflow
> **Umbrella:** `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md`
> **Layer:** `both`. The check-removal and STEP 6 reorder are `[internal]`
> (`.claude/commands/add-framework--done.md`). The recorded-parity-gap note is `[product]`
> (`framwork/.codeadd/commands/add.done.md`) — the one product F-block this subtopic carries.

Subtopic 3 of 3. Covers umbrella finding 3, and closes `docs/roadmap/index.md` item **5.1**.

⛔ **This subtopic was rewritten during its own review pass.** The first draft proposed fixing checks 3
and 5 by resolving members through a git object id instead of a stated path, citing the roadmap as its
source. `@plan-review-agent` caught that the roadmap had been updated, same day, to a materially
different and simpler decision — recorded below — after the first draft was already written. The
object-id approach is abandoned; nothing here should be read as reflecting it.

## Discovery

Read directly from `docs/roadmap/index.md` §5.1 as it stands now, and from
`.claude/commands/add-framework--done.md` STEP 8:

- **Operator decision, 2026-09-14** (quoted verbatim in the roadmap): *"esses done — add-framework--done
  e add.done — não têm que fazer check de arquivo byte a byte. É só verificar se foi feito merge e fim.
  Gasta tempo e token à toa."*
- **The measured defect that prompted the item**, closing
  `2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary`: check 3
  (`git show origin/main:docs/deliveries/<id>/<member>`) stats the full path including the
  `origin/main:` prefix. From a worktree 97 characters deep against a 152-character member path, it
  answered `fatal: failed to stat … Filename too long`, exit 128 — while `git ls-tree` proved the member
  was on `main` the whole time. That false negative sits inside the gate that refuses every deletion in
  STEP 8, so a delivery that archived correctly had its worktree, branch and local originals left
  behind.
- **Why the fix is deletion, not repair.** `.claude/commands/add-framework--done.md` STEP 6 commits
  `docs/deliveries/<id>/`, the index entry and the changelog in **one commit on the branch**; STEP 7
  merges that branch. So "the PR is merged" already entails "the archive and the entry are on `main`" —
  there is no order in which the merge lands and the archive does not. Checks 3 (every member
  resolves), 4 (`git show origin/main:docs/delivered.jsonl | grep …`, the entry is present) and 5
  (byte-identical) each spend git calls re-proving a consequence of a step the same command already
  performed two steps earlier.
- **Check 5 caught one real case, and the roadmap's fix moves it earlier instead of checking for it
  later.** It existed for a ledger appended to *after* STEP 6's archive commit and never re-copied: the
  local original ends up ahead of `main`, and deleting it would lose the newer rulings. The cheap fix is
  in STEP 6 itself — assemble the archive as the very last thing before the commit, and the command's
  own text states that nothing writes to the ledger after that point — not a byte comparison run after
  the merge.
- **What stays**, per the roadmap: the fetch (check 1) and the merge check (check 2). `origin/main` is a
  local ref and `gh pr merge` moves the branch on the server without moving it here, so a stale ref
  would make even the merge check read the wrong state — the fetch has to stay for the merge check to
  mean anything.
- **The bats-gate exit-127 fix is unrelated to the checks and unchanged from the first draft.**
  `add-framework--done.md:225` names only exit 2 as a refusal. A fresh worktree has no root
  `node_modules`, so the same fallback exits 127 (`./node_modules/.bin/bats: No such file or
  directory`) — a third outcome the line does not name. `npm install` at the worktree root fixes it.
- **The product layer never had this, and the roadmap now says so explicitly rather than leaving it
  silent.** `framwork/.codeadd/commands/add.done.md` carries no equivalent of the five checks, and
  `framwork/.codeadd/scripts/done.sh`'s `do_cleanup` (read directly, lines 422–491) has exactly two
  checks — a fetch and `git merge-base --is-ancestor` — matching what the internal layer is being cut
  down *to*, not what it is being cut down *from*. The roadmap: *"Record that as a deliberate parity gap
  rather than leaving it to read as an omission someone later 'fixes'."*

## Problem / Opportunity

Five checks run before STEP 8 deletes anything. Three of them (3, 4, 5) re-prove something the
command's own step order already guarantees — STEP 6 commits the archive and the entry together, STEP 7
merges that same commit, so a successful merge cannot exist without the archive existing. One of the
three (check 3) also breaks outright on Windows inside a sufficiently deep worktree, refusing a correct
cleanup over a false reading. The product layer never grew any of the five, which the operator's
decision confirms was right rather than an oversight to fix.

## Proposed Solution

The roadmap item states the chosen fix directly, as a dated operator decision reached the same day.
This subtopic implements it; it does not re-open the choice.

**Cut checks 3, 4 and 5. Keep the fetch and the merge check. Move the ledger-freshness guarantee into
STEP 6's own ordering instead of checking for its absence afterward.**

The alternative this replaces — resolving checks 3 and 5 by git object id instead of by stated path,
keeping all five checks — was this subtopic's own first draft. It is not a candidate under
consideration; it is recorded in the header above as what was tried and abandoned, because the
operator decision it would have kept intact (five checks, at git-call cost on every close-out) is the
exact thing the roadmap update rejected.

## Type of Artefact

Workflow (a deletion plus a reordering, inside existing command text). No new file, no new command.

## Scope

### Includes

- Remove checks 3, 4 and 5 from `.claude/commands/add-framework--done.md` STEP 8, leaving the gate
  reading the fetch and the merge check alone.
- Record the step-order argument in STEP 8's own text, in place of the deleted checks, so a future
  reader sees why three checks were removed rather than finding a gate that shrank without a reason on
  disk.
- Reorder STEP 6 so the archive under `docs/deliveries/<id>/` is assembled as the last thing before the
  commit, and state explicitly that nothing writes to `docs/plans/<id>--ledger.md` after that point in
  the same run.
- Update line 225 to name exit 127 alongside exit 2, with the `npm install` remedy, for the fresh
  worktree bats-gate case — unchanged from the roadmap's original diagnosis, independent of the checks
  decision.
- Add the recorded-parity-gap note to `add.done.md` (or confirm it already reads that way): the product
  close-out has no equivalent of these checks, and that is deliberate, not an omission.
- Remove roadmap item 5.1 from `docs/roadmap/index.md` once delivered, per the framework's own
  convention for closed items.

### Does NOT Include

- Any object-id-based resolution of any check. Superseded by deletion; see the header note.
- Any change to `done.sh` or any product-layer command — the roadmap's own text confirms product never
  had these checks and should not grow them.
- Any change to the fetch or the merge check themselves, beyond their now being the only two that run.

## Key Decisions

| # | Decision | Rationale | Validated |
|---|---|---|---|
| 1 | Delete checks 3, 4 and 5 rather than repair check 3's path resolution | Operator decision, 2026-09-14, quoted in the roadmap: byte-level file checks cost time and tokens for no question a successful merge doesn't already answer | ✅ |
| 2 | Check 5's real case (ledger appended to after the archive commit) is prevented by STEP 6's ordering, not detected by a later check | Cheaper to make the bad state unreachable than to keep checking for it after the fact | ✅ |
| 3 | The fetch and the merge check are the only two that survive | `origin/main` is a local ref; without the fetch the merge check reads a stale state | ✅ |
| 4 | Product layer gets a recorded reason, not the checks | `done.sh`'s `do_cleanup` was read directly and confirmed to already match the internal layer's target shape (fetch + ancestor check only) | ✅ |
| 5 | The first draft's object-id fix is abandoned, not merged alongside the deletion | It solves a problem (path length) that stops existing once the checks it applied to are deleted | ✅ |

## Ecosystem Impact

| Component | Called by (verified) | Action |
|---|---|---|
| `.claude/commands/add-framework--done.md` | Every internal close-out via `/add-framework--done` | Remove checks 3, 4, 5 from STEP 8; reorder STEP 6; update line 225 |
| `framwork/.codeadd/commands/add.done.md` | Every product close-out via `/add.done` | Add or confirm the recorded-parity-gap note |
| `docs/roadmap/index.md` | — | Remove item 5.1 on delivery |

`framwork/.codeadd/scripts/done.sh` was read and confirmed to already match the target shape — listed
for the record, not as a file this subtopic edits.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A close-out that never gives a false "missing" verdict, at any worktree depth, because the check that could give one is gone | Three checks that occasionally caught a real divergence between the local ledger and the archived copy — replaced by making that divergence structurally impossible instead |
| Fewer git calls and less token cost on every single close-out | The explicit "prove it" evidence trail those three checks produced in STEP 9's report |
| A recorded, deliberate reason the product layer has none of this, instead of silence a later reader could mistake for an oversight | — |

| Risk | Probability | Mitigation |
|---|---|---|
| STEP 6's reordering has an edge case where something still writes to the ledger after the archive is assembled (e.g., a manual ruling added by the operator mid-STEP-6) | Low | The command's own text states the rule explicitly, so it is a documented discipline, not an implicit assumption; the plan should phrase it as an instruction the command enforces, not just describes |
| Deleting checks removes real evidence from STEP 9's report, making a genuine problem harder to diagnose after the fact if one ever occurs | Low | The step-order argument recorded in the gate's place is exactly the reasoning a human would otherwise reconstruct by hand; `git log` and the branch's own commit remain available for a manual check if ever needed |

## Next Steps

`/add-framework--plan write/read mismatches — post-merge checks are five where one would do`

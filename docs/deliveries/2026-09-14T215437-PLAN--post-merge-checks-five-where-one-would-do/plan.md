# Plan: Post-Merge Checks Are Five Where One Would Do — cut `/add-framework--done` STEP 8 to fetch + merge

> **Status:** implemented
> **Layers:** both
> **Type:** command
> **Created:** 2026-09-14

---

## Context

`/add-framework--done` STEP 8 runs five checks before deleting a closed-out plan's worktree, branch and
local originals. Three of them (checks 3, 4, 5) re-prove something STEP 6's own commit-then-merge order
already guarantees, and check 3 breaks outright on Windows inside a sufficiently deep worktree — a
measured false "missing" verdict refused a correct cleanup on 2026-09-14. `docs/roadmap/index.md` item
5.1 recorded a dated operator decision the same day: cut to the fetch and the merge check, fix check
5's one real case by reordering STEP 6 instead of checking for it afterward, and have the product
layer's `/add.done` — which never grew any of the five checks — carry a recorded reason for that. Found
by the same write/read-mismatch sweep that produced the other two plans from this set.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md` | Why this sits alongside two unrelated fixes found by the same sweep |
| `docs/brainstorming/2026-09-14T211914-write-read-mismatches-003-worktree-path-length.md` | The full roadmap citation, the abandoned first-draft alternative (object-id resolution), and why it was abandoned |

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `npm run test:scripts` and the `cli` suite (`npm --prefix cli run test`) both pass, including the updated `close-out-hardening.test.js` (Global default per `add-framework-internal-layer`)

## Problem

1. **Three checks re-prove what the step order already guarantees.** STEP 6 commits the archive, the index entry and the changelog in one commit; STEP 7 merges that commit. A successful merge cannot exist without the archive existing, so checks 3, 4 and 5 spend git calls confirming that on every close-out.
2. **Check 3 gives a false negative on Windows.** `git show origin/main:docs/deliveries/<id>/<file-member>` stats the full path including the `origin/main:` prefix; inside a worktree 97 characters deep against a 152-character member it answered `fatal: … Filename too long`, exit 128 — read as "missing," refusing every deletion in STEP 8 for a delivery that had, in fact, archived correctly.
3. **Check 5's one real case has a cheaper fix than checking for it.** A ledger appended to after STEP 6's archive commit and never re-copied leaves the local original ahead of `main`. Reordering STEP 6 to assemble the archive last prevents the state instead of detecting it afterward.
4. **The bats-gate fallback names only one of two non-pass exit codes.** Line 225 documents exit 2 as a refusal; a fresh worktree's missing `node_modules` exits 127, undocumented.
5. **The product layer's silence reads as an omission.** `add.done.md` never grew these checks and the roadmap decision confirms it should not — but nothing on disk says so, so a later reader could "fix" it as a gap.
6. **One redundant line, found auditing this command as the subject of the change (ruler item 7).** `.claude/commands/add-framework--done.md:610-611`'s `NEVER: Record a rename as a deletion or a supersession` restates STEP 3.2's table row (L314) verbatim in substance, at the end of the file where nobody is deciding anything.

## Proposal

Delete checks 3, 4 and 5 from STEP 8, keeping only the fetch and the merge check. Reorder STEP 6 to
assemble the archive as the last thing before its commit, with the command's own text stating that
nothing writes to the ledger after that point. Update the one test that pins the deleted checks' exact
text. Record the product layer's parity gap explicitly. Fix the one unrelated prompt-quality finding
from auditing this command as the plan's subject.

## Scope

### Includes

- **F1** [internal] — `.claude/commands/add-framework--done.md`: remove checks 3, 4 and 5 from STEP 8
  — the five-command code block (lines 487–493), the subsection heading `### The five post-merge
  checks — BEFORE any deletion` (L482) and its "Run all five, then decide once" line (L484), and the
  two checks-3/5-specific `⛔` callouts (L501–503, L509–513) — leaving only the fetch and the merge
  check, and no leftover prose describing checks that no longer exist. Record the step-order argument
  in the gate's own text in their place. **STEP 6's reorder is additive, not structural**: 6.1
  ("Assemble `docs/deliveries/<id>/`") already runs immediately before 6.2 ("Commit and push") in the
  current file — nothing sits between them to move. Add one explicit sentence to 6.1 or 6.2 stating
  that nothing writes to `docs/plans/<id>--ledger.md` after 6.1 assembles the archive in the same run.
  Update line 225 to name exit 127 alongside exit 2, with the `npm install` remedy. Ref: design doc,
  Scope → Includes.
  - **Produces:** STEP 8's gate reads two checks (fetch, merge), not five, with no dangling prose about
    the deleted three; STEP 6 states its no-write-after-assembly rule explicitly.
- **F2** [product] — `cli/tests/close-out-hardening.test.js`: update the `L3.3` test
  ("the deletions are refused unless main actually holds the archive", lines 178–191) — it currently
  asserts `step8` contains `git show origin/main:` and matches `/\bcmp\b/`; both assertions target text
  F1 deletes. Replace with assertions matching the two-check gate (fetch + merge) and confirm the
  refusal-on-failure block (`DO NOT USE: Bash to run rm`) still exists for the surviving checks. Tagged
  `[product]`, not `[internal]`, despite testing an internal command's text — `add-plan-authoring`'s
  layer table and `add-framework--done.md` STEP 3.2 (L327–332) both classify every `cli/` path as
  product regardless of what it tests, and `add-framework-product-layer` is the skill that knows this
  suite is mandatory. Ref: design doc, Discovery (test found independently of the brainstorm, during
  this plan's own STEP 3).
  - **Consumes:** F1's new STEP 8 text (F1).
- **F3** [product] — `framwork/.codeadd/commands/add.done.md`: add or confirm a recorded note that the
  product close-out has no equivalent of these checks by design — `done.sh`'s `do_cleanup` already
  matches the shape STEP 8 is being cut down to (a fetch plus a merge-ancestry check, nothing
  per-file). Ref: design doc, Scope → Includes.
- **F4** [internal] — `.claude/commands/add-framework--done.md`: delete the `NEVER:` label (L609)
  together with its sole bullet (L610, `Record a rename as a deletion or a supersession`) from the
  `## Rules` section — not the bullet alone, which would leave an empty `NEVER:` label dangling with
  nothing under it. `## Rules` ends after the `ALWAYS:` block. STEP 3.2's table (L314) already states
  this rule unambiguously at the decision point; the Rules-section copy is filler (ruler item 7,
  `@prompt-review-agent` audit, `mode: audit`, this plan's STEP 3.4). Independent of F1–F3; touches a
  different section of the same file.

### Does NOT Include (important!)

- Any check-level change to `framwork/.codeadd/scripts/done.sh`. Confirmed by direct read: its `do_cleanup` already matches the target shape (fetch + `git merge-base --is-ancestor`, nothing per-file).
- Any object-id-based resolution of any check (`git ls-tree` / `git cat-file blob`). This was the design's own abandoned first draft — superseded by deletion once the roadmap's actual decision was found; see the design doc's header note.
- Removing `docs/roadmap/index.md` item 5.1. Roadmap edits push directly to `main` via `/add-framework--roadmap`'s own flow, separate from a feature branch's PR — left as a manual follow-up after this plan merges, not mixed into this plan's branch.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Repair check 3's path resolution, or delete checks 3/4/5? | Delete | Operator decision, 2026-09-14, recorded in the roadmap: byte-level checks cost time and tokens for no question a successful merge doesn't already answer — design doc, Key Decision 1 |
| How is check 5's real case (ledger appended to after the archive commit) handled? | Prevented by STEP 6's reordering, not detected afterward | Cheaper to make the bad state unreachable — design doc, Key Decision 2 |
| Does the product layer get the same checks? | No — a recorded note instead | `done.sh`'s `do_cleanup` was read directly and already matches the target shape — design doc, Key Decision 4 |
| Is the first-draft object-id fix merged alongside the deletion? | No, abandoned entirely | It solves a problem (path length) that stops existing once the checks it applied to are deleted — design doc, Key Decision 5 |
| Does F4 (ruler item 7) belong in this plan or a separate one? | This plan | It is a `❌` finding from auditing this plan's own subject artefact (STEP 3.4); `add-plan-authoring` requires one F-block per failed audit item in the plan that dispatched the audit |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| STEP 6's reordering has an edge case where something still writes to the ledger after the archive is assembled | Low | F1 states the rule explicitly in the command's own text, as an instruction it enforces, not an implicit assumption |
| Deleting checks removes explicit evidence from STEP 9's report | Low | The step-order argument recorded in the gate's place (F1) is the reasoning a human would otherwise reconstruct by hand; `git log` remains available |
| `cli/tests/close-out-hardening.test.js`'s `L3.3` test is missed and left asserting deleted text | Medium | F2 is its own F-block specifically for this; L1's build-side validation below re-asserts it |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `.claude/commands/add-framework--done.md` | internal | modify | F1 — STEP 8 checks 3/4/5 and their prose removed, STEP 6 gains its no-write-after-assembly sentence, L225 updated; F4 — L609–610 (`NEVER:` label and bullet) removed |
| `cli/tests/close-out-hardening.test.js` | product | modify | F2 — `L3.3` updated to match the two-check gate |
| `framwork/.codeadd/commands/add.done.md` | product | modify | F3 — recorded parity-gap note added |
| `framwork/.codeadd/scripts/done.sh` | product | none | Confirmed unaffected — listed for the record only |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.**

### L1 — Unit / build-side (RED → GREEN)

1. `grep -n "git show origin/main:docs/deliveries" .claude/commands/add-framework--done.md` returns zero matches. *RED today: 2 matches (checks 3 and 4's `git show` calls).*
2. STEP 8's block, extracted, contains exactly two check commands (fetch, `gh pr view`/merge check) and no `cmp`. *RED today: five checks, including a `cmp` in check 5.*
3. `grep -n "exit 127" .claude/commands/add-framework--done.md` matches at least once, near line 225. *RED today: zero matches.*
4. STEP 6's text states that the archive is assembled last and that nothing writes to the ledger after that point. *RED today: no such statement exists.*
5. `grep -n "Record a rename as a deletion or a supersession" .claude/commands/add-framework--done.md` returns zero matches. *RED today: one match, in `## Rules`.*
6. `node scripts/build.js` exits 0, no new warning.

### L2 — Integration

1. `npm --prefix cli run test -- close-out-hardening` passes, specifically `L3.3` and `L3.4`. *RED today (post-F1, pre-F2): `L3.3` fails — it asserts text F1 removed.*
2. `npm run test:scripts` passes (no `.sh` file in this plan's scope, but the internal-layer default gate still runs).

### L3 — Behavioural acceptance

1. A cold reader of STEP 8 alone states the gate now reads two facts (the fetch succeeded, the PR merged) rather than five.
2. A cold reader of `add.done.md` can state, without reading `add-framework--done.md`, why the product close-out carries no equivalent checks.

**RED expectations against the current tree:** L1's five assertions and L2's `L3.3` fail today. **GREEN = all levels pass after F1–F4.**

---

## Execution Order

F1 → F2 → F3 and F4 (independent of each other and of F1/F2's completion, but sequenced after F1 for a
clean diff).

- **F1 first** because F2's test update targets F1's new text — writing F2 against the old text would assert against something about to change.
- **F1 alone leaves the repo in a working state**, but `cli`'s test suite is red until F2 lands — this plan does not treat that as a stopping point on its own; F1 and F2 land in the same build session.
- **F3 and F4 are independent** of F1/F2 and of each other — different files, no shared state. Either may land before or after F1/F2 without consequence; ordering them last here is for diff clarity, not a dependency.

## Reviewer Handoff

- **What changed** — `.claude/commands/add-framework--done.md` (F1, F4), `cli/tests/close-out-hardening.test.js` (F2), `framwork/.codeadd/commands/add.done.md` (F3).
- **Which validation levels cover it** — L1 (6 assertions), L2 (2), L3 (2).
- **Any decision deferred or altered** — none from the design doc's final version; the design doc's own first draft (object-id resolution) was already abandoned before this plan was written, recorded in its header note. One item moved between the design and this plan: the design's Scope listed removing `docs/roadmap/index.md` §5.1 as part of this subtopic; this plan defers that to a manual `/add-framework--roadmap` run after merge (Does NOT Include), since that command pushes straight to `main` outside any feature branch's PR.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — confirm L1's greps were run against the pre-F1 tree, and L2's `L3.3` was seen failing before F2 landed.
2. A second test file pinning STEP 8's old text that neither the design doc's grep sweep nor this plan's Impact table found — re-run `grep -rn "git show origin/main:docs/deliveries" cli/tests` after F1+F2 rather than trusting the single file named here.
3. That F1 removed the checks-3/5 prose (the subsection heading and both `⛔` callouts) and not only the code block — a partial edit would leave the heading still claiming "five" checks.

## References

- Design set: `docs/brainstorming/2026-09-14T211914-write-read-mismatches-000-umbrella.md` (umbrella), `docs/brainstorming/2026-09-14T211914-write-read-mismatches-003-worktree-path-length.md` (this subtopic)
- `docs/roadmap/index.md` §5.1 — the operator decision this plan implements; remove the item via `/add-framework--roadmap` after this plan merges

---

## Next Steps

/add-framework--build post-merge-checks-five-where-one-would-do

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-14 | Initial creation |
| 2026-09-15 | Implemented. F1 `3c0d752` (+ correction `7b6a547`), F2 `6be697a`, F3 `e748dc8`, F4 `0512abc`. Review: 0 findings. |

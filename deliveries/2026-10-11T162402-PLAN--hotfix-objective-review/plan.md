# Plan: Hotfix objective review — a short review on the diff and the objective, and gates that let a wanted removal through

> **Status:** implemented
> **Layers:** both (product; F8 internal — native tests under scripts/tests/)
> **Type:** cross-cutting
> **Created:** 2026-10-11
> **Delivery:** confirm
> **Ticket:** 0048B

---

## Objective

`[from conversation, no design document]` — the ticket 0048B is the specification; its three decisions
are Maicon's and are carried as settled.

A hotfix whose objective is to remove something — a file, a test, code — closes through `/add-done`
without a false `HOTFIX_REVIEW=stale`; the hotfix review judges the diff against the hotfix objective;
and a hotfix started on the wrong branch is told the exact branch name `/add-done` will require.

**When this build is done:** `hotfix-gates.cjs` treats a reviewed path that is absent from the final tree
as covered, so its receipt stays `ok` after the deletion is staged, committed or merged. `/add-hotfix`
hands its reviewer an explicit objective and the diff only, and offers a review-only resume on an
existing hotfix branch, which is where `/add-done` sends a stale receipt. `@reviewer-agent` carries one
rule for every caller: a removal the objective asks for is not a finding. `/add-hotfix` and `done.cjs`
both name `hotfix/[NNNN]H-<slug>` when the branch is wrong.

**Ticket done when:** Um hotfix que apaga um arquivo ja listado no receipt passa no add-done sem HOTFIX_REVIEW=stale; o hotfix roda a review curta e o add-done aceita o receipt; a mensagem sobre branch existente cita o nome hotfix/NNNNH-*. Cada ponto coberto por teste em scripts/tests e cli/tests.

## Context

Real case (OMF, v1.5.2, hotfix `0043H-remove-turnstile`): `/add-done` stopped with `HOTFIX_REVIEW=stale`
and `Reviewed Paths mismatch` because the hotfix deleted `verify-turnstile.spec.ts`, which was in the
receipt. Removing that file was the whole point of the hotfix.

The source of truth is the board ticket `0048B` (`notes` = the three decisions, `done_when` above,
`paths` = the four product files). There is no design document and no intent file.

| Document | Carries |
|---|---|
| Board ticket `0048B` | Decisions 1-3, the OMF case, `done_when`, the four target paths |

## Global Constraints

- `hotfix-gates.cjs` stays on Node built-ins and git on PATH, no shell (its header, "Dependencies")
- `hotfix-gates.cjs` exit codes are unchanged: 0 / 1 / 2, and 3 for `review-validate` not `ok` (its header, "Exit")
- No existing product STEP ID is renamed or removed; the one new ID is the `###` sub-step `add-hotfix.resume-review` (`add-framework-injection`)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js`, in the container, never `npx vitest` in `cli/` (project memory: tests in container, tests do not write in the checkout)
- No push of the code branch and no PR from the build without asking (user instruction for this ticket)

## Problem

1. **A wanted deletion makes the receipt stale.** `manifestEntries` computes the current manifest and
   `compareManifest` requires it to equal the receipt line by line. A reviewed path that is later
   deleted changes its row, so the fingerprint changes and `review-validate` returns `stale`.
2. **A deleted row is not even stable on its own.** `entryFor` writes a deleted path's mode from the
   index, else HEAD, else `000000` (`hotfix-gates.cjs`, `entryFor`). The same deletion reads `100644`
   while unstaged and `000000` once committed, and under `--tree` it reads the mode from whatever is
   checked out. A receipt written before the commit — `/add-hotfix` never commits — goes stale at
   `/add-done` with no file changed after the review. Which of problems 1 and 2 hit OMF is not known; the rule below covers both.
3. **The hotfix review has no explicit objective.** `STEP add-hotfix.review-input` passes the diff, the
   root cause and the blast radius, then dispatches `MODE: task`, whose spec is "about.md, plan.md" —
   which a hotfix has not written yet at that point. Nothing tells the reviewer what the hotfix is meant
   to remove, so a wanted removal can come back as a finding.
4. **Recovering a stale receipt costs the whole hotfix.** `/add-done` says "rerun `/add-hotfix`". On a
   `hotfix/*` branch that rerun goes to `STEP add-hotfix.history` and repeats history, investigation and
   root cause, to refresh one review.
5. **The wrong branch is found only at the end.** `STEP add-hotfix.branch-check` handles `main` and
   `hotfix/*` and says nothing for any other branch; `hotfix/foo` (no ID) passes it. `done.cjs` then
   fails with a hint whose example is `fix/0002H-urgent`, which is not the hotfix shape either.

## Proposal

Fix the gate first, because it is the reported failure and everything else leans on it. Then make the
review objective-driven, in the hotfix command and in the reviewer agent. Then the branch messages.

The gate rule is ONE rule that solves problems 1 and 2 together: **for every path the receipt lists
that is absent from the final tree, the receipt row stands.** The comparison and the fingerprint both
run over the current manifest with those rows taken from the receipt. A deleted path is covered whether
it was reviewed present or reviewed deleted, and whatever mode git now reports. Anything else that
changed after the review — an edited file, a new file — still goes stale, so the gate only relaxes for
deletions. New receipts write deleted rows with mode `000000`, so the receipt reflects the final state.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/hotfix-gates.cjs`: the covered-deletion rule in the review
  modes (`review-manifest`, `review-fingerprint`, `review-validate`, with and without `--tree`).
  1. In `manifestEntries` only, a `deleted` entry is written with mode `000000`. `entryFor` itself is
     NOT changed, so `diagnosis-baseline` and `diagnosis-check` keep their current output.
  2. **Absent from the final tree** means: in worktree mode, `lstat` fails with `ENOENT`; under `--tree`,
     `ls-tree` finds no entry for the path in that commit. A path that is now a directory is NOT absent.
  3. `manifestEntries(hotfixDir, tree, recorded = null)` takes an optional receipt manifest. When
     `recorded` is passed, it builds the **effective manifest**: the current entries, where every path
     the receipt lists that is absent from the final tree takes the receipt row verbatim — including a
     receipt path no longer in the delivery set at all (added on the branch, reviewed, then deleted). The
     `about.md` self-row placeholder hash is then computed with the effective rows in the Reviewed Paths
     block, so it matches what the receipt wrote. With `recorded = null` (`review-manifest`) the output is
     the raw current manifest, as today.
  4. `fingerprintFor` parses the receipt FIRST (`parseReceiptManifest`), then calls
     `manifestEntries(hotfixDir, tree, recorded)`, then `compareManifest` and the fingerprint over the
     effective manifest. `review-fingerprint` and `review-validate` both go through it.
  5. Update the header: one `// Review rule:` line stating the covered-deletion rule.
  - **Must NOT lose:** an edited path after review → `stale`; a path added after review → `stale`;
    tampered receipt → `stale` (test `hotfix-gates#008`). `diagnosis-baseline` and `diagnosis-check` are
    untouched — they keep `entryFor`'s current mode, so diagnosis reports already on disk stay valid.
  - **Produces:** `the covered-deletion rule` (the sentence in the Proposal, verbatim in the header).
- **F2** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/fix.md`, schema `hotfix`, the
  Reviewed Paths paragraph: add that deleted rows carry mode `000000`, and that a path absent from the
  final tree keeps its receipt row (the covered-deletion rule).
  - **Consumes:** `the covered-deletion rule` (F1).
- **F3** [product] — `framwork/.codeadd/agents/reviewer-agent.md`, `## Constraints`: one rule for every
  MODE — "Judge the change by its objective. A removal the objective asks for — a file, a test, code — is
  not a finding. A removal the objective does not ask for is reviewed like any other change." This is
  decision 2 for reviews; it reaches `/add-build`, `/add-review` and `/add-hotfix` through the one agent.
  - **Produces:** `the objective rule` (that sentence).
- **F4** [product] — `framwork/.codeadd/commands/add-hotfix.md`, the short review (decision 1). Load
  `add-framework-injection` first.
  1. `STEP add-hotfix.review-input`: add `OBJECTIVE` — one sentence: the confirmed root cause and what
     the fix must do, naming any file, test or code the fix must remove. State that the review covers this
     branch's diff against `OBJECTIVE` only — the diff against the same base `hotfix-gates.cjs` uses (the
     merge-base with `main`, else `master`, else `HEAD`) — and that `OBJECTIVE` is the spec for `MODE: task`.
  2. `STEP add-hotfix.dispatch-reviewer`: pass `OBJECTIVE` as the spec; restate the objective rule.
  3. New sub-step `STEP add-hotfix.resume-review` inside `STEP add-hotfix.branch-check`: on a
     `hotfix/[NNNN]H-*` branch whose `docs/features/[NNNN]H-<slug>/about.md` already carries `## Review`,
     build `OBJECTIVE` from that `about.md`'s `## Root Cause` topic sentence plus its `## Fix` bullets (no
     new schema field), re-run `STEP add-hotfix.verify-build` (and the pinned test when `pinned-test:
     passed`), then go to `STEP add-hotfix.review` and run review → correct → log → receipt → validate.
     History, investigation, root cause and implementation are skipped. A `status: blocked` receipt resumes
     the same way — the review is what runs again. It is a `###` sub-step: `cli/tests/hotfix-review-0073.test.js`
     L4.9 builds the STEPS list from `## STEP` headings only, so it is NOT added to the STEPS list.
  4. `STEP add-hotfix.fingerprint`: one line saying a deletion made after this step stays covered, an edit does not.
  - **Consumes:** `the objective rule` (F3), `the covered-deletion rule` (F1).
  - **Must NOT lose:** the tdd-pipeline, board, agent-mode and gitnexus slot markers byte-for-byte; every
    existing STEP ID; "Never send a hotfix to `/add-review`".
- **F5** [product] — `framwork/.codeadd/commands/add-hotfix.md`, `STEP add-hotfix.branch-check` (decision 3):
  replace `IF BRANCH:hotfix/*` with `IF the branch matches hotfix/[NNNN]H-*`, and add a case for any other
  branch: STOP and print that `/add-done` only closes a branch named `hotfix/[NNNN]H-<slug>`, show the
  current name, and say to switch to main and rerun `/add-hotfix`, or rename the branch to that shape.
- **F6** [product] — `framwork/.codeadd/scripts/done.cjs`, the three branch-name hints:
  1. `mergeGuards` and `runContext` (`HINT=Expected: … fix/0002H-urgent`, today lines 264 and 385): the
     example becomes `hotfix/0002H-urgent`.
  2. `main`, the "No feature/hotfix ID found" error (today line 662): when the branch starts with
     `hotfix/`, the hint is `HINT=Hotfix branches must be named hotfix/[NNNN]H-<slug> (e.g. hotfix/0043H-remove-turnstile)`;
     otherwise the current hint stays. `hotfix/remove-turnstile` reaches this line, not the other two.
- **F7** [product] — `framwork/.codeadd/commands/add-done.md`, `STEP add-done.hotfix-review-receipt`: the
  `stale` / `blocked` row says rerun `/add-hotfix` **on the same branch**, which resumes at the short
  review (`STEP add-hotfix.resume-review`), not the full hotfix. `missing` / `malformed` keep the full rerun.
  - **Consumes:** `STEP add-hotfix.resume-review` (F4).
- **F8** [internal] — native script tests at the repo root (RED first):
  - `scripts/tests/hotfix-gates.test.cjs`: `#009`–`#015` (L1 below).
  - `scripts/tests/done.test.cjs`: next free `done#` number for the hotfix hint (L2).
- **F9** [product] — `cli/tests/hotfix-objective-review-0048.test.js`, new: the contract checks (L3).

### Does NOT Include (important!)

- `scripts/test-loss-guard.cjs` and the `Test-Removed:` trailer — internal layer; the ticket is `[product]`. It already lets a wanted removal through with a trailer.
- A new reviewer MODE. `MODE: task` with `OBJECTIVE` as its spec is enough; a fifth mode would touch every caller's dispatch table.
- Relaxing anything but deletions. An edit or an addition after the review still goes stale — that is the gate doing its job.
- `get-branch-metadata.cjs` — the type detection is correct; only the messages are wrong.
- `diagnosis-baseline` / `diagnosis-check` modes — see F1 "Must NOT lose".

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Short review for hotfix | Diff + `OBJECTIVE` only, `MODE: task`, one fix wave as today; `/add-done` keeps accepting the receipt via `review-validate` | Ticket decision 1. `/add-done` already never sends a hotfix to `/add-review`, so the gap is the objective, not the acceptance |
| Review-only resume on an existing hotfix branch | Included (F4.3, F7) | Ruling: decision 1's "short path" is worth little if recovering a stale receipt reruns history and investigation. Derived, recorded here |
| Every review and gate judges by the objective | One rule in `@reviewer-agent` (all callers) + the covered-deletion rule in the one product gate that blocked a removal | Ticket decision 2. No other product gate checks removals (searched `framwork/.codeadd/`) |
| A reviewed then deleted file | Covered; the receipt row stands; new receipts write the final state (`deleted`, `000000`) | Ticket "Regra esperada" |
| Deleted-row mode | `000000` in review manifests only | Problem 2. Diagnosis keeps its mode so reports on disk stay valid |
| Receipts written before this change | Pass, because the receipt row stands for any absent path, old mode included | Same rule; no migration needed |
| Branch message | `/add-hotfix` STOPs on a non-`hotfix/[NNNN]H-*` branch and names the shape; `done.cjs` hint names it too | Ticket decision 3 |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The rule hides a deletion nobody wanted | Low | F3 makes the reviewer flag a removal the objective does not ask for; the deletion is in the diff the reviewer saw. L1.6 proves edits, additions and file→directory still go stale |
| The self-hash of `about.md` diverges when the effective rows are substituted | Medium | F1.3 computes it over the effective rows; L1.1–L1.5 assert `HOTFIX_REVIEW=ok`, which fails if it diverges |
| A new STEP breaks the stable-ID and step-list tests | Medium | F4 adds it as a `###` sub-step, outside the STEPS list; `cli/tests/hotfix-review-0073.test.js` L4.9 runs unchanged in L3 |
| Reviewer rule changes behaviour of `/add-build` and `/add-review` | Low | It only removes false findings on wanted removals; L3.4 pins the wording |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/hotfix-gates.cjs` | product | modify | F1 — covered-deletion rule. Risk HIGH (4 direct callers: add-diagnose, add-done, add-hotfix, add--subagent-driven-development) |
| `framwork/.codeadd/skills/add--doc-schemas/references/fix.md` | product | modify | F2 — schema text. Risk HIGH (add--doc-schemas is a hub) |
| `framwork/.codeadd/agents/reviewer-agent.md` | product | modify | F3 — objective rule. Risk HIGH (10 direct callers) |
| `framwork/.codeadd/commands/add-hotfix.md` | product | modify | F4, F5. Risk HIGH (12 direct dependants, 4 fragments) |
| `framwork/.codeadd/scripts/done.cjs` | product | modify | F6 — hints. Risk HIGH (4 direct callers); message-only change |
| `framwork/.codeadd/commands/add-done.md` | product | modify | F7. Risk HIGH (16 direct dependants); one table row |
| `scripts/tests/hotfix-gates.test.cjs` | internal | modify | F8 |
| `scripts/tests/done.test.cjs` | internal | modify | F8 |
| `cli/tests/hotfix-objective-review-0048.test.js` | product | create | F9 |

`AGENTS.md` does not change. Delivery index: no `gone` or `superseded` entry for `hotfix-gates.cjs` or `add-hotfix` (product layer).

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

### L1 — `hotfix-gates.cjs` (scripts/tests/hotfix-gates.test.cjs)

Fixtures: a temp repo with `main`, a branch `hotfix/0043H-remove-turnstile`, a receipt written through
`review-manifest` + `review-fingerprint` (as `/add-hotfix` STEP add-hotfix.fingerprint does).

1. `#009` receipt lists `verify-turnstile.spec.ts` `present`; the file is then `git rm`-ed and committed → `review-validate` prints `HOTFIX_REVIEW=ok`, exit 0. *RED today: `Reviewed Paths mismatch`, exit 3.* This is `done_when` point 1.
2. `#010` receipt written while the deletion is unstaged (plain `rm`, path still in the index); then committed → `ok`. *RED today: mode `100644` in the receipt vs `000000` now.*
3. `#011` old-style receipt: its row is `deleted	100644	-` (hand-written, as receipts written before this change carry), the path then committed gone → `ok`. Proves the substitution rule, which `#010` alone does not (the `000000` change would turn `#010` GREEN by itself).
4. `#012` a file added on the branch, reviewed, then deleted (no longer in the delivery set) → `ok`. *RED today: path-count mismatch.*
5. `#013` same as `#009`, then `git merge --no-ff` into `main`, validated with `--tree <merge commit>` → `ok`.
6. `#014` negative: after a valid receipt, (a) edit a reviewed file → `stale`; (b) add a new file → `stale`; (c) replace a reviewed file with a directory of the same name → `stale`. *(a) and (b) GREEN today and must stay GREEN.*
7. `#015` `review-manifest` prints `deleted	000000	-	<hex>` for a deletion that is unstaged with the path still in the index. *RED today: prints `100644`.* A committed deletion already prints `000000`.
8. `#001`–`#008` pass unchanged — `diagnosis-*` output included.

### L2 — `done.cjs` (scripts/tests/done.test.cjs)

1. On branch `hotfix/remove-turnstile` (no ID), the context run exits non-zero with `ERROR=No feature/hotfix ID found…` and a `HINT=` containing `hotfix/[NNNN]H-<slug>`. *RED today: hint shows `feature/0001F-name, refactor/0002R-cleanup`.*
2. On a non-hotfix branch with no ID (e.g. `feature/foo`), that hint is unchanged.
3. The two `HINT=Expected:` lines carry `hotfix/0002H-urgent` and no `HINT=` line carries `fix/0002H`. *RED today.*

### L3 — Contract (cli/tests/hotfix-objective-review-0048.test.js)

1. `add-hotfix.md` `STEP add-hotfix.review-input` names `OBJECTIVE` and says the review covers the diff against it.
2. `add-hotfix.md` has a `### STEP add-hotfix.resume-review` heading inside `## STEP add-hotfix.branch-check`, NOT in the STEPS list; its body names `STEP add-hotfix.review` as where it goes and builds `OBJECTIVE` from `## Root Cause` and `## Fix`.
3. `add-hotfix.md` `STEP add-hotfix.branch-check` contains `hotfix/[NNNN]H-` in a STOP case for a branch that is neither main nor a hotfix branch.
4. `reviewer-agent.md` `## Constraints` carries the objective rule (removal the objective asks for is not a finding).
5. `add-done.md` `STEP add-done.hotfix-review-receipt` sends `stale` to `/add-hotfix` on the same branch.
6. `cli/tests/hotfix-review-0073.test.js` (step IDs stable, list = bodies, slot anchors) passes unchanged.

### L4 — Behavioural acceptance

1. The OMF case end to end in a temp repo: hotfix branch `hotfix/0043H-remove-turnstile`, receipt written by `review-manifest` + `review-fingerprint` with `verify-turnstile.spec.ts` present, file then deleted and committed → `review-validate` `ok`. This is `done_when` point 1; it may be the same test as L1.1.
2. `node scripts/build.js` exits 0 with no new warning; built provider copies of `add-hotfix` stay marker-free.

**RED expectations against the current tree:** L1.1–L1.5, L1.7, L2.1, L2.3, L3.1–L3.5 fail. L1.6 (a)(b), L1.8, L2.2, L3.6 pass. L1.6 (c) is checked GREEN after F1.
**GREEN = all levels pass after F1–F9.**

---

## Execution Order

1. **F8 [internal] + F9 [product] tests first (RED)** — write L1–L3, confirm the RED expectations above.
2. **F1** [product] → L1 GREEN. The gate is the reported failure; F2 and F4 describe its rule.
3. **F2** [product] — schema text, consumes F1's rule.
4. **F3** [product] — reviewer rule; F4 restates it.
5. **F4** [product] → **F5** [product] — same file, two commits.
6. **F6** [product] → L2 GREEN.
7. **F7** [product] — consumes F4's new step → L3 GREEN.
8. Build + full suite (L4).

Every boundary after F1 leaves the repository working: F1 alone already fixes the reported case.

## Reviewer Handoff

For each F-block the evidence must name the files touched, the levels covering it and their state, and
any decision altered.

Gaps to hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. The effective manifest relaxing more than deletions — check L1.6 really edits a *reviewed* path and adds a *new* one.
3. `about.md`'s self-row computed over the raw manifest instead of the effective one — passes only when no row was substituted.
4. `diagnosis-*` modes picking up the `000000` change through a shared helper.
5. The resume step skipping the build/pinned-test re-run.

## References

- Board ticket `0048B` (decisions 1-3, OMF case).
- `cli/tests/hotfix-review-0073.test.js` — the stable-ID contract for `add-hotfix`.

---

## Next Steps

/add-framework--build docs/plans/2026-10-11T162402-PLAN--hotfix-objective-review.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-11 | Initial creation |
| 2026-10-11 | Plan review (blocked → fixed): resume is a `###` sub-step outside the STEPS list; F6 names all three hints; F1 implementation shape and absence definition; OBJECTIVE source on resume; fixtures and the old-receipt case; review base |
| 2026-10-11 | Implemented on branch hotfix-objective-review-0048B (commits ceb36d9..HEAD; see ledger) |

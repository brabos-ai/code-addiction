# Plan: Optional Review — `/add.build` owns a final whole-diff review; `/add.review` stops gating `/add.done`

> **Status:** implemented
> **Layers:** product
> **Type:** workflow
> **Created:** 2026-09-19
> **Delivery:** automatic

---

## Objective

A feature can be closed out with `/add.done` straight after `/add.build`, without running
`/add.review`. The build itself runs one final review over the whole feature diff, applies the
corrections and moves on to the next step. `/add.review` becomes an optional pass for detail and QA;
when it does run, `/add.done` still honours it — a failed review still blocks and its QA baseline is
still validated. The `/add.build` prompt does not grow in size or complexity to get there.

**When this build is done:** a feature built by `/add.build` carries a `Final review:` verdict in its
ledger that `converge-gates.sh` accepts in place of a `review-NNN.md`; `/add.done` merges it without
`/add.review` (asking first only when `qa-pipeline` is on); the automatic build ⇄ review loop no
longer exists; the build reaches its `## Loop End` by itself; and `add.build.md` is no longer than it
was at branch start.

## Context

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-19T112200-optional-review-build-final-review.md` | The mechanism: final review shape, ledger line and its three verdicts, most-recent-wins rule, QA stop, Loop End entry, Checkpoint step 0, DELTA routing, alternatives rejected |
| `docs/brainstorming/2026-09-19T112200-optional-review-build-final-review-intent.md` | Path `architectural`, the 13 closed decisions, `## Open: None`, `delivery: automatic`, worktree execution |

`/add.review` is mandatory at close-out only because it is the one command that writes a verdict
`converge-gates.sh` can read. The build already reviews per area and per task, but nothing looks at the
whole diff at once. This plan gives the build that one look, and gives the gate script a second
verdict source.

## Global Constraints

- The build's verdict ledger line reads exactly `Final review: passed (after review-NNN)`, `Final review: ruled N (after review-NNN)` or `Final review: blocked N (after review-NNN)` (design, Proposed Solution)
- Each open blocker of a `blocked N` verdict is one ledger line, written right after the verdict line: `Blocker suggestion: <finding-id> — <ready-to-paste command>` (review v01, B1)
- `converge-gates.sh` stays read-only and always exits 0 except on CLI misuse (script header, "Exit: always 0")
- `review-NNN.md` is written only by `/add.review` (design, Key Decisions)
- `framwork/.codeadd/commands/add.build.md` ends with a line count ≤ its count at branch start — 1609 on `main` at 34731b0 (design, Scope → Includes)
- A `blocker` still open after the fix wave is never turned into a `Ruling:` (design, Key Decisions)
- The user is never expected to type `--loop-end`; any suggested next command is printed complete, ready to paste (design, Key Decisions)
- The hotfix close-out gate (`hotfix-gates.sh`, `about.md` receipt) is untouched (design, Does NOT Include)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)

## Problem

1. **Close-out hard-blocks on `/add.review`** — `add.done` STEP 4.0 stops a feature with "Run /add.review before /add.done" when no `review-NNN.md` exists.
2. **No whole-diff look inside the build** — per-area and per-task reviews cannot see a cross-area break or an RF/RN that spans areas.
3. **The automatic loop is dead weight once review is optional** — 1.0.1's baseline, STEP 17's skip, STEP 18.2's handoff, `add.review` 11.5 and `add-delivery-mode`'s loop section exist only to chain a mandatory review.

## Proposal

Give the gate script a second verdict source first, then add the producer of that verdict (reviewer
mode + the owning skill section), then rewire the build to run it and drop the loop, then relax the
close-out and the review, and finally sweep wording and pin everything with tests.

## Current State

| Artefact | Direct callers (depth 1) | Risk |
|---|---|---|
| `commands/add.build.md` | 20 | HIGH |
| `commands/add.review.md` | 16 | HIGH |
| `commands/add.done.md` | 10 | HIGH |
| `agents/reviewer-agent.md` | 9 | HIGH |
| `skills/add-delivery-mode/SKILL.md` | 7 | HIGH |
| `commands/add.qa-setup.md` | 6 | HIGH |
| `scripts/converge-gates.sh` | 3 (add.build, add.done, add-commit) | HIGH |
| `skills/add-review-discipline/SKILL.md` (product) | 3 (add.build, add.new, add.plan) | HIGH |
| `skills/add-doc-schemas/references/review.md` | 2 | MEDIUM |
| `commands/add.md` | 0 | LOW |
| `fragments/qa-pipeline/add.build.md` | feature `qa-pipeline` (CONTAINS) | LOW |
| `skills/add-ecosystem/SKILL.md` | 6 (add, add.audit, add.diagnose, add.done, add.hotfix, add.wiki) — descriptive rows only change | HIGH |

Delivery index: `add.review` and `add.done` each have one `live` entry
(`cut-review-and-build-loop-cost`, `product-close-out-parity`); nothing `gone` or `superseded`. No
internal artefact is the subject, so no prompt audit ran.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/converge-gates.sh` and `framwork/.codeadd/scripts/tests/converge-gates.bats`: Gate 1 reads the last `Final review:` line of the scoped `build-ledger.md` (same scope resolution Gate 5 uses) and applies most-recent-wins against the highest `review-NNN.md` — no higher review → the ledger verdict decides (`passed`/`ruled N` → `ok`, `blocked N` → `broken` with the line in `GATE_REVIEW_DETAIL`); a higher review → its `**Overall**` cell, as today; neither → `missing`. Emit `REVIEW_SOURCE=build|review|none`. Gate 2: when `REVIEW_SOURCE=build` → `GATE_QA_BASELINE=skipped`, counted as passing, `BASELINE=none`. When the build's verdict is `blocked N`, `GATE_REVIEW_DETAIL` carries the verdict line followed by every `Blocker suggestion:` line written after it, flattened. Header documents both and the new `skipped` status. Must NOT lose: the anchored `**Overall**` cell parse, the exit-0 contract, the `qa-evidence.sh validate` path when a review decides. (design, Scope → converge-gates)
  - **Produces:** `REVIEW_SOURCE=build|review|none`
  - **Produces:** `GATE_QA_BASELINE=skipped`
  - **Produces:** `Final review: passed|ruled N|blocked N (after review-NNN)` ledger line grammar (parsed)
  - **Produces:** `Blocker suggestion: <finding-id> — <ready-to-paste command>` ledger line grammar (parsed)
  - **Produces:** `GATE_REVIEW_DETAIL` carrying the blocker suggestions
- **F2** [product] — `framwork/.codeadd/agents/reviewer-agent.md`: add `MODE: feature` — whole delivery-unit review package; checks cross-area consistency and each RF/RN of `plan.md`/`about.md`; same Report Format and `Confidence` field as `task`. Must NOT lose: `task` as the default, `re-review`, `owasp`. (design, Scope → reviewer-agent)
  - **Produces:** `MODE: feature`
- **F3** [product] — `framwork/.codeadd/skills/add-review-discipline/SKILL.md` (product): new section "The Build's Final Review" owning: `review-package.sh` over the unit's base..HEAD, `MODE: feature` dispatch, conditional `MODE: owasp` on the same trigger `add.review` STEP 4.1 names, judging each finding before applying, one `@fix-agent` wave, `add.build` STEP 12.2's scoped re-review, non-blocker leftovers → `Ruling:`, open blockers → `blocked N` plus one suggested next step per blocker reasoned from the unit's objective and printed as a ready-to-paste command, and writing the verdict line plus one `Blocker suggestion:` line per open blocker. Must NOT lose: the rule that only `review-NNN.md` and `qa-validation-NNN.md` reach disk as reader outputs — the ledger line is a ledger event, not a reader output. (design, Proposed Solution)
  - **Consumes:** `MODE: feature` (F2)
  - **Consumes:** `Final review: passed|ruled N|blocked N (after review-NNN)` ledger line grammar (parsed) (F1)
  - **Consumes:** `Blocker suggestion: <finding-id> — <ready-to-paste command>` ledger line grammar (parsed) (F1)
  - **Produces:** `The Build's Final Review` section
- **F4** [product] — `framwork/.codeadd/commands/add.build.md`: (a) a short final-review step after the last area of the unit (after 11.4, before STEP 13) — an **unnumbered `##` heading**, like `## Loop End`, so STEPs 13–18 keep their numbers — pointing at F3, and on the epic's last subfeature the DELTA pass runs before it with its findings joining that review when `REVIEW_SOURCE` is not `review`; (b) after the final review or a CORRECTION-mode run the build enters `## Loop End` itself, every delivery mode; `## Loop End`'s entry text and 5.0's `--loop-end` pre-check reworded — `--loop-end` stays as an internal entry; (c) Checkpoint Sequence step 0 reads the source `REVIEW_SOURCE` names (review → `## Fix Routing` as today; build → `blocked N` stops and prints blockers with suggestions); (d) STEP 17's "Before asking" clause also prints the last `Final review:` line and its `Blocker suggestion:` lines when the build's verdict decides, so a simple feature (which never runs the Checkpoint Sequence) shows them before the publish question; remove 1.0.1's review baseline, STEP 17's automatic skip, STEP 18.2's automatic handoff to `/add.review` — 18.2's table prints the complete next command; (e) keep STEP 12 and 12.3's "run `{{cmd:add.review}}`" when `## Fix Routing` is absent. Net line count ≤ 0. (design, Scope → /add.build)
  - **Consumes:** `The Build's Final Review` section (F3)
  - **Consumes:** `REVIEW_SOURCE=build|review|none` (F1)
- **F5** [product] — `framwork/.codeadd/commands/add.done.md`: STEP 4.0 parses `REVIEW_SOURCE`; `missing` still blocks (no build verdict and no review); `REVIEW_SOURCE=build` with `GATE_REVIEW=broken` prints `GATE_REVIEW_DETAIL` — the verdict and its blocker suggestions — never reading the ledger itself; `qa-pipeline` enabled (per `QA_FEATURE_STATE` and the CLI default) and `REVIEW_SOURCE=build` → a deciding stop asking whether to close out without judged QA (no → stop and print `/add.review` as the command); `GATE_QA_BASELINE=skipped` accepted and STEP 5 runs as the `BASELINE=none` no-op. Must NOT lose: the hotfix receipt gate, the other four gates, the "never author a baseline" rule. (design, Scope → /add.done)
  - **Consumes:** `REVIEW_SOURCE=build|review|none` (F1)
  - **Consumes:** `GATE_QA_BASELINE=skipped` (F1)
  - **Consumes:** `GATE_REVIEW_DETAIL` carrying the blocker suggestions (F1)
- **F6** [product] — `framwork/.codeadd/commands/add.review.md`: remove STEP 11.5 and the Rules line about a third round; replace "This review is the LAST gate" with the review being optional and most-recent-wins; next-step prints the complete `/add.build` line when agent-routed `## Fix Routing` rows exist, else `/add.done`. (design, Scope → /add.review)
- **F7** [product] — `framwork/.codeadd/skills/add-delivery-mode/SKILL.md`: remove `## The Review Loop — Two Rounds` and its two Rules lines; the build's closing handoff on `automatic` goes to the publish question. Update its frontmatter `description`. (design, Scope → add-delivery-mode)
- **F8** [product] — wording sweep: `framwork/.codeadd/commands/add.md` (router row: review optional, build → done), `framwork/.codeadd/commands/add.qa-setup.md` (STEP 14 handoff), `framwork/.codeadd/fragments/qa-pipeline/add.build.md` (loop and "two rounds" wording at ~28-30 and ~61), `framwork/.codeadd/skills/add-doc-schemas/references/review.md` (check only; keep the STEP 12 regeneration rule), `framwork/.codeadd/skills/add-ecosystem/SKILL.md` (add.build, add-delivery-mode and reviewer-agent rows — the last gains `MODE: feature`). (design, Scope → wording updates)
- **F9** [product] — `cli/tests/optional-review-build-final-review.test.js` (new) plus updates to `cli/tests/product-pipeline-parity.test.js` (L1.10's `build→review` and `review→build` chain pairs, L1.13's loop assertion inverted) and the stale comment in `cli/tests/loop-consolidation-0070.test.js`. Must NOT lose any unrelated assertion in those files.

### Does NOT Include (important!)

- Hotfix branches — the merged hotfix delivery owns them.
- A reviewed-tree fingerprint — not checked today either; known gap.
- `/add.review`'s own audit, reviewers or QA judgement.
- `GATE_EPIC`, `GATE_COVERAGE`, `GATE_LEDGER`.
- The internal pipeline (`add-framework--*`).
- README / web docs — `add-framework--sync` at release.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does the build's verdict live? | A `build-ledger.md` line | Design, Key Decisions |
| Keep the automatic loop? | Removed | Design, Key Decisions |
| `qa-pipeline` on and no review? | Done asks the user | Design, Key Decisions |
| What does the final review cover? | Whole diff + spec + conditional OWASP | Design, Key Decisions |
| How many fix rounds? | One wave + scoped re-review | Design, Key Decisions |
| Open blocker after the wave? | Blocks, with a suggestion from the objective | Design, Key Decisions |
| Review file vs ledger line, both present? | Most recent wins, by the `NNN` in the line | Design, Key Decisions |
| How does the build reach Loop End? | By itself, every mode; complete commands printed | Design, Key Decisions |
| Where do DELTA findings go without a review? | Into the last subfeature's final review | Design, Key Decisions |
| How is prompt size held? | Owning skill + net lines ≤ 0 | Design, Key Decisions |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Feature closes right after the build | A mandatory deeper second review |
| Whole-diff check where the fix happens | One or two extra dispatches per delivery unit |
| A shorter build prompt | The automatic two-round loop |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A feature merges after only one fix wave | Medium | Non-blocker leftovers print as rulings; blockers block (F3, F4, F5; L2, L3) |
| `add.build.md` grows | Medium | Line-count assertion (L3.1) |
| Removing the loop breaks an injection anchor | Low | `node scripts/build.js` + injection suites (L5) |
| Most-recent-wins misreads a scoped ledger on an epic | Medium | `.bats` cases for SFxx scope (L1) |
| A stale test still pins the loop | Medium | F9 updates, full cli suite (L5) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/converge-gates.sh` | product | modify | F1 |
| `framwork/.codeadd/scripts/tests/converge-gates.bats` | product | modify | F1 |
| `framwork/.codeadd/agents/reviewer-agent.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add-review-discipline/SKILL.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F4 |
| `framwork/.codeadd/commands/add.done.md` | product | modify | F5 |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F6 |
| `framwork/.codeadd/skills/add-delivery-mode/SKILL.md` | product | modify | F7 |
| `framwork/.codeadd/commands/add.md` | product | modify | F8 |
| `framwork/.codeadd/commands/add.qa-setup.md` | product | modify | F8 |
| `framwork/.codeadd/fragments/qa-pipeline/add.build.md` | product | modify | F8 |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | product | check / modify | F8 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | product | modify | F8 |
| `cli/tests/optional-review-build-final-review.test.js` | product | create | F9 |
| `cli/tests/product-pipeline-parity.test.js` | product | modify | F9 |
| `cli/tests/loop-consolidation-0070.test.js` | product | modify (comment) | F9 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

### L1 — `converge-gates.bats` (F1) (RED → GREEN)

1. Ledger `Final review: passed (after review-000)`, no review → `GATE_REVIEW=ok`, `REVIEW_SOURCE=build`, `GATE_QA_BASELINE=skipped`, `BASELINE=none`. *RED: today `GATE_REVIEW=missing`.*
2. Same with `ruled 2` → `ok`; with `blocked 1` plus one `Blocker suggestion:` line → `GATE_REVIEW=broken`, detail carries the verdict line and the suggestion.
3. Line names `review-002`, `review-002.md` BLOCKED on disk → `REVIEW_SOURCE=build`, `ok`.
4. Line names `review-002`, `review-003.md` PASSED on disk → `REVIEW_SOURCE=review`, baseline path unchanged.
5. No line, no review → `GATE_REVIEW=missing`, `REVIEW_SOURCE=none`.
6. Epic `SFxx` scope reads the subfeature's ledger, not the feature root's.
7. Exit code is 0 in every case above.

### L2 — Text contract (F2, F3, F5, F6, F7)

1. `reviewer-agent.md` documents `MODE: feature`; `task` stays the default. *RED today.*
2. Product `add-review-discipline` carries "The Build's Final Review" with the three ledger verdicts verbatim, the OWASP condition, one fix wave, and "blocker" never ruled. *RED today.*
3. `add.done.md` parses `REVIEW_SOURCE`, names `skipped`, and has a deciding stop for `qa-pipeline` with no review; the "Run /add.review before /add.done" message is gone for `REVIEW_SOURCE=build`. *RED today.*
4. `add.done.md` STEP 4.0 prints `GATE_REVIEW_DETAIL` for `REVIEW_SOURCE=build` and does not read `build-ledger.md` itself. *RED today.*
5. `add.review.md` has no `### 11.5` and no "LAST gate". *RED today.*
6. `add-delivery-mode` has no "Two Rounds" section and no "third review round" rule. *RED today.*

### L3 — Build prompt (F4)

1. `add.build.md` line count ≤ 1609. *GREEN today; must stay GREEN.*
2. Loads/points at `add-review-discipline` for the final review; no `review baseline <NNN>` ledger write; no automatic `follow {{cmd:add.review}}`. *RED today.*
3. `## Loop End` entry text names the final review and correction runs, not `/add.review`. *RED today.*
4. Checkpoint step 0 names `REVIEW_SOURCE`. *RED today.*
4b. STEP 17's "Before asking" clause names the `Final review:` line and `Blocker suggestion:`. *RED today.*
4c. The final-review heading is unnumbered; `## STEP 13` through `## STEP 18` still exist. *13-18 GREEN today; heading RED.*
5. The existing `product-close-out-parity` and `product-pipeline-parity` L1.7 assertions (checkpoint tag, `GATE_EPIC=ok`, `Fix Routing` + `blocker`) still pass.

### L4 — Wording sweep (F8)

1. No product artefact contains "Run /add.review before /add.done", "two review rounds" or "LAST gate". *RED today.*
2. `add-ecosystem/SKILL.md`'s reviewer-agent row names `MODE: feature`. *RED today.*
3. `add.md` router routes "feature implemented" to `/add.done`, naming `/add.review` as optional.

### L5 — Build and suites

1. `node scripts/build.js` exits 0 with no new warning; `injection-points.json` still resolves every anchor in `add.build`, `add.review`, `add.done`.
2. `npm test` in `cli/` passes (per project memory the local suite rewrites sidecars — attribute a failure by running the single test; CI is the verdict).
3. `npm run test:scripts` for `converge-gates.bats` passes.

### L6 — Behavioural acceptance

1. Reading `add.build.md` → `add-review-discipline` → `add.done.md` in order, a feature with no `review-NNN.md` and a `Final review: passed` line reaches the merge without any instruction to run `/add.review`.
2. The same path with `qa-pipeline` on stops once to ask, and nowhere else.

**RED expectations against the current tree:** L1.1-6, L2, L3.2-4, L4 fail today. L3.1 and L3.5 pass and must keep passing.
**GREEN = all levels pass after F1–F9.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 (all [product]).

- **F1 first** — F4's step 0 and F5's gate read `REVIEW_SOURCE`; the ledger grammar is fixed there.
- **F2 before F3** — the skill dispatches the mode the agent defines.
- **F3 before F4** — the build points at the section; F4 must measure its own net lines after pointing, not inlining.
- **F5, F6, F7** only relax or remove; after F4 the pipeline is coherent.
- **F8, F9** close wording and tests.

The repo is in a working state after F1 (script accepts a new source nobody writes yet), after F4, and after F7.

Beyond the layer default: run `converge-gates.bats` after F1, `wc -l` on `add.build.md` after F4, `node scripts/build.js` after F4 and F8.

**Execution runs in an isolated git worktree branched from current `main`** (intent, Decided).

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, validation levels covering it with pass state, and any decision altered with the design section it departs from.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. `add.build.md` meeting ≤ 1609 by deleting guidance unrelated to the loop.
3. Gate 1 reading the feature-root ledger on an epic instead of the subfeature's.
4. An open blocker converted into a `Ruling:` anywhere in F3/F4 text.
5. A suggested next command printed without its arguments.

## References

- Design set: `docs/brainstorming/2026-09-19T112200-optional-review-build-final-review.md`, `...-intent.md`
- Prior art: `2026-09-17T153506-PLAN--cut-review-and-build-loop-cost` (one review, one fix wave); `2026-09-11T014333-PLAN--product-close-out-parity` (GATE_LEDGER, close-out cross); `2026-09-16T205633-PLAN--product-pipeline-parity` (the automatic loop this removes)

---

## Next Steps

/add-framework--build optional-review-build-final-review

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-19 | Initial creation |
| 2026-09-19 | Review v01 (fix-then-ok): `Blocker suggestion:` ledger line + carried in `GATE_REVIEW_DETAIL` (F1, F3, F5); STEP 17 prints the build's blockers (F4); add-ecosystem reviewer-agent row (F8); final-review heading unnumbered (F4); L1.2, L2.4, L3.4b-c, L4.2 added |
| 2026-09-19 | Implemented on `feat/optional-review-build-final-review`: F1 04f5a5d, F2 9bd8881, F3 48623e1, F4 ec28453, F5 2aa0ab6, F6 0f21d48, F7 7a35191, F8 982347b, F9 a3b7386, audit fixes a8baabb |

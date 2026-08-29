# Plan: T2 — Epic foundations

> **Status:** implemented
> **Type:** schema + command
> **Created:** 2026-08-27
> **Author:** Maicon + Claude (ADD Strategy)
> **Umbrella:** `0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Checkpoint:** ends at **C2** · **Depends on C1**

---

## Context

T1 made convergence provable. T2 makes the epic itself readable, so an outer loop can resolve its own work list and so gate 3 stops depending on string matching.

This is the highest-risk topic in the set for injection anchors. Five of the files it edits carry markers, and one edit sits four lines below a plugin marker's anchor candidate. The Injection Surface section below is not advisory.

## Problem (T2 scope only)

1. **`epic.md` has no schema.** `/add.new` STEP 5 writes it as "subfeature table + order + notes". Three places then parse it by string: `/add.build` block 14.3 rewrites a row by pattern, `/add.plan` STEP 8.0 reads a "dependency graph" out of it, `/add.done` STEP 4.1 counts rows containing the word "done". None of that is a contract.
2. **The checkpoint tag is fake.** `/add.build` block 14.2 (under heading STEP 16) creates `checkpoint/${FEATURE_ID}-${SF}-done`, while line 54 of the same file says *"GIT CLEAN: Leave files unstaged. Never git add/commit/stage"*. The tag lands on the previous commit, which does not contain the subfeature's work.
3. **Reviews do not say which subfeature they cover.** The `review` schema has no `scope:` field. The sibling `qa-validation` schema has one. An epic produces a flat `review-NNN.md` sequence with no owner per file.
4. **Gate 3 is only as reliable as a string match.** T1 scripts it against `epic.md` as text, which is all today's rule ever was. Until the file has a contract, a cosmetic row edit or the word "done" inside a subfeature's name can flip the answer.

## Scope

### Includes

- **F10** — `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md`: new `epic` schema. It owns frontmatter, the subfeature table's columns (id, name, objective, status, dependencies, checkpoint), the allowed status values, and how a dependency is written so a machine can resolve order. **No normalisation path, and no either/or:** the schema describes today's shape as its baseline and adds every new column as **optional with a documented default** — an absent `dependencies` cell means no dependencies, an absent `checkpoint` cell means no checkpoint yet. Every existing `epic.md` therefore passes unchanged and nothing has to be rewritten. This follows the fallback precedent the same file already sets for `feature-design` Location (L141), where consumers accept both the new and the legacy shape rather than invalidating one.
- **F11** — `framwork/.codeadd/skills/add-doc-schemas/SKILL.md`: register `epic` in the Schema Index by Category, per that skill's own rule for adding a schema. No new ID prefix is needed — an epic lives under its feature's `[NNNN]F`.
- **F12** — `framwork/.codeadd/commands/add.new.md` STEP 5: write `epic.md` per the schema instead of ad hoc. Edits stay **inside** STEP 5's body.
- **F13** — `framwork/.codeadd/commands/add.build.md`, the block labelled `**14.2 Create Checkpoint Tag**` under heading `## STEP 16: Log Iteration + Checkpoint`: **drop the tag creation entirely.** One path, not a choice. `/add.build` never commits and never will — line 54's `GIT CLEAN` rule is not up for revision here — so there is no condition it could evaluate at this block that would make the tag truthful. A conditional tag whose condition is never true is the same lie wearing a different hat.

  `status.sh:322` reads `LAST_CHECKPOINT` from `checkpoint/*` tags. After F13 it reports nothing, which is correct: until T4 there is no commit to point at. **T4's F27 re-creates the tag at the moment it makes the real commit**, so tag and work land together and `LAST_CHECKPOINT` becomes truthful for the first time. F13 and F27 are two halves of one fix and must not be split across a release.
- **F14** — same file, the block labelled `**14.3 Update epic.md**` under that same STEP 16 heading: update the subfeature row through the schema's column contract instead of rewriting a matched string.
- **F15** — `framwork/.codeadd/commands/add.done.md` STEP 4.1: count subfeatures by the schema's status column instead of counting rows containing "done".
- **F16** — `framwork/.codeadd/commands/add.plan.md` STEP 8.0 (and the epic rows in the STEP 5 documentation table): read the dependency graph through the schema. **See Injection Surface — this is the tightest edit in the set.**
- **F17** — `framwork/.codeadd/skills/add-doc-schemas/references/review.md`: add `scope: [<SFxx>, ...]` to the `review` schema's frontmatter, matching the field `qa-validation` already has. On a simple feature it is the feature scope.
- **F18** — `framwork/.codeadd/commands/add.review.md` STEP 11.3: write `scope:` into the review document. Edits stay inside 11.3.
- **F19** — `converge-gates.sh` + `converge-gates.bats`: gate 3 swaps its T1 string read of `epic.md` for a schema read. The three outcomes are unchanged — `ok` when every subfeature is done, `broken` when one is pending, `ok` on a feature with no `epic.md` — so T1's L1.4 (the three gate-3 outcomes) and L3.3 (no regression on clean trees) both re-run untouched. What changes is reliability, not behaviour: a cosmetic row edit or the word "done" in a subfeature name no longer moves the answer.

### Does NOT Include

- Making `/add.build` commit. That is F27, in T4, and it belongs to `/add.plan-to-ready`.
- The outer loop over subfeatures. T4.
- Backfilling `scope:` into existing review documents. New documents carry it; old ones are read without it.
- Any renumbering of steps. See Injection Surface.

## Injection Surface (read before editing)

Five of T2's seven target files carry markers. The build strips markers and remembers each by the text next to it, so editing that text breaks the anchor.

| File | Injection points (line) | T2 edit | Distance | Risk |
|---|---|---|---|---|
| `add.plan.md` | `qa-pipeline:step-list` L57 · `tdd-pipeline:step-list` L59 · **`plugin:gitnexus:graph-plan` L198** · `tdd-pipeline:step9` L494 · `qa-pipeline:qa-spec` L500 | **F16** at STEP 8.0, L205+ | **4 lines below the anchor candidate at L201** | **High — the tightest point in the set** |
| `add.build.md` | 10 points, L201–L595; nearest are `tdd-pipeline:verification` L592 and `tdd-pipeline:coverage` L594 | F13 at block 14.2 (~L637), F14 at block 14.3 (~L645) | ~45 lines | Medium |
| `add.new.md` | `plugin:gitnexus:graph-map` L91 | F12 at STEP 5 (~L205–240) | ~115 lines | Low |
| `add.review.md` | `tdd-pipeline:step-list` L31 · `tdd-pipeline:spec-audit` L362 · `plugin:playwright:drive` L815 | F18 at STEP 11.3 (~L925) | ~110 lines | Low |
| `add.done.md` | `plugin:gitnexus:graph-reindex` L379 | F15 at STEP 4.1 (~L137–157) | ~220 lines | Low |

**F16 in detail.** The marker pair sits at L198–199. Its anchor is one of the two lines around it: `**Execution rule:** SEQUENTIAL only…` (L196) or `**Output location:** Each subagent writes to…` (L201). Section `### 8.0 Cross-SF Context (EPIC ONLY)` starts at **L205**. **Both L196 and L201 are off limits.** F16 edits from L205 down.

**Note on `add.build.md`'s numbering.** The heading reads `## STEP 16: Log Iteration + Checkpoint` but its inner blocks are labelled `14.1`, `14.2`, `14.3` — a pre-existing leftover. F13 and F14 cite the **literal in-file labels**, because that is what a builder text-searches for. **Do not tidy this quirk**: renumbering is banned in this file by constraint 1 below.

**Hard constraints for this topic:**

1. **No F-block adds, removes or renumbers a STEP** in any of the five files. Fragments quote step numbers as plain text — `qa-pipeline/add.build.md` cites STEP 12, `tdd-pipeline/add.build.md` cites STEP 15, `tdd-pipeline/add.plan.md` defines STEP 9, `qa-pipeline/add.plan.md` defines STEP 10.0, `tdd-pipeline/add.review.md` defines STEP 3.5. **Nothing in the build checks those references.** A renumber leaves the fragment injecting fine and pointing at the wrong step, and no gate catches it.
2. **Never touch the line directly above or below a marker pair.** If an edit needs that line, move the edit.
3. **Run the build after each file**, not once at the end of the topic.
4. **`qa-pipeline/add.plan.md` assumes the plan run is scoped to one SF** and never rewritten from scratch. F16 must not break that assumption — it is also what T4's per-subfeature plan leg relies on.

## Validated Decisions (T2)

| Question | Decision | Rationale |
|---|---|---|
| Where the `epic` schema lives | `references/new-feature.md` | It is a feature-lifecycle document, same category as `feature-about` and `feature-plan` |
| Existing `epic.md` files | Schema accepts today's shape via optional-with-default columns. **No normalisation, no migration script** | Optional columns mean every existing file passes untouched. A schema that invalidates every live epic is a breaking migration nobody asked for |
| Fake checkpoint tag | **Drop it entirely.** T4's F27 re-creates it on the real commit it makes | `/add.build` never commits, so no condition it could evaluate here makes the tag true. The clean-tree rule stays; the tag returns only where there is a commit to point at |
| `scope:` on reviews | New documents only | Backfilling rewrites finalized audit documents, which the `review` schema bans |
| Gate 3 outcomes | **`ok` or `broken`, nothing else.** `ok` covers both "every subfeature done" and "no `epic.md` at all"; `broken` covers "one still pending" | There is no third literal value. Inventing `not-applicable` would put a status outside the four legal ones that F3 checks against |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| **F16 breaks the `gitnexus:graph-plan` anchor** | **High** | The L196/L201 exclusion above + L5.1 runs the build immediately after F16, before any other edit |
| A renumbered step silently breaks fragment text | Medium | Constraint 1 forbids renumbering; L5.3 greps every fragment's step references against the edited commands |
| Existing epics stop parsing | Medium | L4.1 runs the schema against a pre-schema `epic.md` |
| Dropping the checkpoint tag breaks `status.sh` | Medium | L4.4 asserts `LAST_CHECKPOINT` still reports truthfully whichever way F13 goes |
| Gate 3 blocks simple features | Medium | L3.2 — not-applicable must not behave like failed |
| The schema is written to fit the loop rather than the document | Low | F10 is written before F19 and reviewed against `/add.new`'s current output first |

## Ecosystem Impact

| Component | Necessary action | F |
|---|---|---|
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | New `epic` schema | F10 |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | Schema Index entry | F11 |
| `framwork/.codeadd/commands/add.new.md` | STEP 5 writes per schema | F12 |
| `framwork/.codeadd/commands/add.build.md` | Block 14.2 fake tag dropped; block 14.3 row update (both under heading STEP 16) | F13, F14 |
| `framwork/.codeadd/commands/add.done.md` | STEP 4.1 counts per schema | F15 |
| `framwork/.codeadd/commands/add.plan.md` | STEP 8.0 dependency graph per schema | F16 |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | `scope:` field | F17 |
| `framwork/.codeadd/commands/add.review.md` | STEP 11.3 writes `scope:` | F18 |
| `framwork/.codeadd/scripts/converge-gates.sh` + `.bats` | Gate 3 probes | F19 |

---

## Red-Green Validation Matrix (T2)

**RED first**, against the post-C1 tree.

### L1 — Schema gate

1. A well-formed `epic.md` passes the `add-doc-schemas` validation gate for schema `epic`. *RED: the schema does not exist.*
2. Each depth-floor violation is caught individually: missing status column, unknown status value, dependency naming a subfeature that is not in the table, duplicate subfeature id.
3. A dependency cycle is rejected. *An epic whose order cannot be resolved must fail at the document, not at the loop.*

### L2 — Consumers read the schema, not strings

1. `/add.build` STEP 14.3 updates the row through the column contract; a row whose text differs cosmetically from the old pattern still updates. *RED today: pattern-matching misses it.*
2. `/add.done` STEP 4.1 counts by the status column; an epic where the word "done" appears in a subfeature's **name** is counted correctly. *RED today: the substring count is wrong.*
3. `/add.plan` STEP 8.0 resolves consumers and providers from the schema, and produces the same `${CROSS_SF_CONTEXT}` for an epic that parsed correctly before.
4. **`/add.new` writes a conforming epic.** Run STEP 5 on a fresh decomposition and confirm its `epic.md` passes the L1 schema gate with no manual edit. *This is the only check covering F12.*

### L3 — Gate 3

1. Epic with a pending subfeature → `broken`. Epic with all done → `ok`. Both already pass after T1 — this level re-runs unchanged and is a regression guard, not a RED level.
1b. **The string rule's two blind spots close.** An epic whose row text differs cosmetically from the old pattern, and one where "done" appears inside a subfeature's *name*, are both answered correctly. *RED after T1: the string read gets both wrong.*
2. **Simple feature with no `epic.md` → `ok`, and `CONVERGED` is still reachable.** Unchanged from T1; re-run as a regression guard.
3. Subfeature-scoped run → gate 3 uses the scoped rule from STEP 6 (that subfeature's own checklist complete and its row ready to move to done), not the epic-wide one. Already passing after T1 — regression guard, not a RED level.

### L4 — Compatibility and truth

1. A pre-schema `epic.md` written by today's `/add.new` either passes, or is normalised by the path F10 ships. It must not simply fail.
2. `review-NNN.md` written after F18 carries `scope:`; one written before is still read without error.
3. `qa-validation-NNN.md`'s existing `scope:` and the review's new one agree on the same run.
4. **`LAST_CHECKPOINT` tells the truth.** After F13, `status.sh:322` either reports a tag that points at a commit containing the subfeature's work, or reports nothing. It never reports a tag that points at work-free history. *RED today: it reports exactly that.*

### L5 — Injection integrity (this topic's own risk)

1. **Build immediately after F16**, before any other T2 edit. The injection total equals the umbrella's L0.1 baseline and `plugin:gitnexus:graph-plan` still resolves.
2. Build after each of F12, F13, F14, F15, F18 with the same assertion.
3. **Fragment step references still point at the right steps.** Scope: the five feature fragments whose commands T2 edits (`tdd-pipeline/add.build.md`, `qa-pipeline/add.build.md`, `tdd-pipeline/add.plan.md`, `qa-pipeline/add.plan.md`, `tdd-pipeline/add.review.md`) and the four plugin command fragments (`gitnexus/add.new.md`, `gitnexus/add.plan.md`, `gitnexus/add.done.md`, `playwright/add.review.md`). For each, grep its `STEP N` references and confirm each names the step it meant. *Nothing automates this — it is a manual check and it must be recorded in the evidence file.*
4. Enable and disable `tdd-pipeline` and `qa-pipeline` on a project installed from the post-T2 build; each round-trip returns the files byte-identical to the pristine install.
5. Same round-trip for the `gitnexus` and `playwright` plugins, command fragments and agent fragments both.

**RED expectations:** L1 entirely; L2.1 and L2.2 fail on cosmetic and substring cases today; L3.1b fails after T1 for the same two reasons; L4.4 is the fake tag reproduced. L3.1 and L3.2 pass after T1 and must keep passing — regression guards, not RED levels. **GREEN = all levels pass after F10–F19.**

---

## Reviewer Handoff

Beyond the umbrella's list:

1. **Was the build run after F16 specifically,** or only at the end of the topic? The evidence file must show the injection total at that point, not just at C2.
2. **Was L5.3 actually done by hand?** It is the one check nothing automates, and it is the easiest to claim without doing.
3. **Does the `epic` schema describe `/add.new`'s real output,** or an idealised shape the loop would prefer? Compare against a real `epic.md` from a live feature.
4. **Did F13 actually drop the tag,** or reintroduce it behind a condition? The decision is drop, full stop; T4's F27 owns re-creating it alongside the real commit.
5. **Does a feature with no `epic.md` still get `ok` from gate 3?** L3.2 is the level most likely to be written to pass rather than bite. There is no `not-applicable` status to look for — if the implementation invented one, that is the finding.
6. **Was any step renumbered?** If yes, every fragment reference in every affected command has to be re-checked, and the evidence must show it.

## Next Steps

This topic is built as part of the 0074 set; the full invocation order is in the umbrella's Next Steps. T2 is the second build and ends at checkpoint **C2**. It requires **C1** to be in place — F19 edits the script T1 creates.

## References

- `framwork/.codeadd/commands/add.new.md:227-233` — the current freeform epic creation F10 has to accept.
- `framwork/.codeadd/commands/add.build.md:54` and `:637-641` — the `GIT CLEAN` rule against the tag it contradicts.
- `framwork/.codeadd/scripts/status.sh:321-323` — the `LAST_CHECKPOINT` read F13 must keep truthful.
- `framwork/.codeadd/commands/add.plan.md:194-210` — the marker, its anchor lines, and the section F16 edits.
- `framwork/.codeadd/skills/add-doc-schemas/references/review.md:87` — `qa-validation`'s `scope:` field, the model for F17.
- `framwork/.codeadd/skills/add-doc-schemas/SKILL.md:176` — the rule for adding a schema that F11 follows.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-27 | Initial creation |
| 2026-08-27 | Review v02: Validated Decisions rows for the checkpoint tag and for existing `epic.md` files reworded to the single pinned decision — the Scope text was fixed in v01 but the summary table still read as an open either/or (B1, B2). Gate 3's outcomes stated as `ok`/`broken` only, with no invented `not-applicable` status (AT1). L3.3 marked a regression guard; F19's level citation corrected to L1.4 + L3.3 (N1, N2) |
| 2026-08-27 | Review v01: F13 pinned to dropping the tag, with T4's F27 named as the half that re-creates it (A1). F10 pinned to optional-with-default columns, removing the normalisation either/or (A2). F13/F14 now cite the file's literal `14.x` block labels under heading STEP 16 (A3). L2.4 added to cover F12 (A4). Line numbers corrected for `8.0` and `add.new` (N1, N3); L5.3's manual-check scope enumerated (N2) |
| 2026-08-29 | Implemented at C2 (af7cce6). F19's gate-3 reader later hardened against three parser breaks found adversarially. Status -> implemented |

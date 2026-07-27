# Plan: Dual-Judge QA Validation

> **Status:** implemented
> **Type:** command + agents + skill + schema
> **Created:** 2026-07-27
> **Author:** Maicon + Claude (ADD Strategy)
> **Source brainstorm:** `docs/brainstorming/2026-07-26-04-dual-judge-qa-validation.md` (final) · Umbrella topic 04
> **Depends on:** plans 0057 + 0058 (implemented). **Blocks:** 0060 (05).

## Context

`qa-agent` judges four axes alone and the UX axis is the weakest — a generalist judging visual quality with no access to design intent. 0057 gave `@ux-agent` the critic identity and 0058 made the contract measurable with a deterministic computed-style capture. This plan splits `add.qa` STEP 4 into two parallel specialist judges per SF — `@ux-agent` (review mode: judgement-only visual dimensions) ∥ `@qa-agent` (functional + ALL a11y + deterministic conformance + failure forensics) — moves coverage reconciliation to the coordinator, adds the root-cause taxonomy that 0060's routing keys off, and adds merge/dedupe rules.

Inherited invariants: the Verified-by partition (computed style ×4 / axe ×2 / screenshot ×4 / evidence set ×1) is the axis split; `unverifiable — never passing`; rejected `## Design Review` items may return at FULL SEVERITY when rendered evidence contradicts the recorded rationale, citing it (the polish-cap was explicitly rejected in the corrected brainstorms); rubric isolation is advisory-only (0057 note) — review mode must ground every finding in the contract + run evidence, never in recalled critique rationale.

## Global Constraints (bind every task)

- Source of truth `framwork/.codeadd/` only; `node scripts/build.js` clean after every task; `cd cli && npx vitest run tests/qa-reachability.smoke.test.js` green (17 tests) after every task.
- **Injection anchors:** `add.qa.md` carries the `plugin:playwright:drive` marker pair (after the STEP 4 dispatch block) — its pair lines and immediately adjacent anchor prose must remain valid; `ux-agent.md` carries the `plugin:gitnexus:graph` pair — untouched adjacent prose. Rebuild fails loud on anchor errors; `tests/gitnexus-plugin.test.js` failure list must stay identical (CRLF baseline).
- `add.qa` remains an audit: read-only on the codebase, never fixes, never emits pass/fail verdicts. The read-only guard must name BOTH judges and is the sole enforcement mechanism (`disallowedTools` stays empty by prior decision).
- Severity taxonomy (blocker/major/minor/polish) unchanged. Expected error states are correct behavior, never classified findings.
- Vitest baseline: 27 environmental failures. All text 100% English. Conventional commit per task + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Task 1: add.qa STEP 4 restructure + STEP 5 merge rules

**Files:** `framwork/.codeadd/commands/add.qa.md`.

Read the file fully first. The `plugin:playwright:drive` marker pair sits after the STEP 4 dispatch block — identify its adjacent anchor prose lines BEFORE editing and keep them byte-identical (position in file may shift with content around them, but the pair ordering and adjacent lines must survive; rebuild + `npx vitest run tests/qa-reachability.smoke.test.js` verifies).

1. **`run-NNN` resolved at the top of STEP 4** (before 4.1): scan `SCOPE_DIR/_tests/run-*/`, take highest + 1 (start `001`) — closing the pre-existing hole where 4.1 wrote PNGs under a number computed only at STEP 5. STEP 5 consumes the already-resolved number.
2. **STEP 4.0 retained unchanged** (specs-absent branch incl. plugin live-drive stopgap).
3. **STEP 4.1**: run `<surface>.qa.spec` via the qa-project Managed App Lifecycle — now collects PNGs + axe results + assertion roll-up **+ the captured computed styles** (`_tests/run-NNN/computed-styles/<screen>.<viewport>.json`, from 0058).
4. **STEP 4.2 — coordinator coverage reconciliation** (moved from qa-agent Step 0.5, which Task 3 removes): extract the expected screen set from `design.md` (layout tree + Screens section), compare against captured evidence; both existing rules preserved verbatim — a reachable in-contract screen with no evidence is a `blocker` titled `coverage: <screen> not captured`, and `design.md` wins over `screens.json` with the drift noted. The reconciliation table is shared input to both judges. Coverage blockers are the coordinator's findings, never a judge's.
5. **STEP 4.3 — per SF, PARALLEL, WAIT-ALL**: dispatch `@ux-agent` (review mode) AND `@qa-agent`. Axis ownership table (verbatim in the step):

| Axis | Judge | Source of truth |
|---|---|---|
| UX quality (judgement) | `@ux-agent` | `## Design Contract` + `## Design Review` |
| Conformance — deterministic | `@qa-agent` | captured computed styles vs the contract |
| Conformance — judgement (hierarchy, optical alignment, primary-CTA reading, declared reflow) | `@ux-agent` | contract + screenshots |
| Responsiveness | `@ux-agent` | declared breakpoint behaviour + per-viewport PNGs |
| Functional delivery | `@qa-agent` | `about.md` criteria + assertion roll-up |
| Failure forensics | `@qa-agent` | assertion error + failure PNG + console/network |
| a11y — ALL of it | `@qa-agent` | axe-core (incl. `color-contrast`, `target-size`) |

   `@ux-agent` gets NO a11y and NO deterministic conformance (dedupe would be impossible). Each dispatch passes: SCOPE_DIR paths (about.md, design.md), the run-NNN evidence dirs, the reconciliation table, and the relevant skill. Soft-degrade clause on BOTH dispatches (generic subagent + `add-qa` skill). Every check has an `unverifiable` outcome: a declared dimension whose verification method did not run (computed styles not captured, axe absent, state never reached) is recorded `unverifiable` with the reason — never passing, never silently omitted.
6. **Read-only guard**: extend the existing `⛔ qa-agent is READ-ONLY` line to name `ux-agent` too, mandatory wording ("if either agent edited code, reject the run") — WITHOUT disturbing the playwright marker anchor lines (if the guard line IS the anchor, keep its original text intact and add a second guard line adjacent instead; verify against the sidecar after rebuild).
7. **STEP 5 — merge rules** (coordinator): dedupe key `(screen, state, viewport, symptom)` — on collision keep one finding, merge evidence; domain precedence — visual symptoms keep `@ux-agent` wording, behavioural keep `@qa-agent`'s; a visual symptom with a functional root cause keeps the root cause + the visual description; severity — higher of the two survives, losing judge's rationale kept as a note; contradiction — report once at the LOWER severity with both positions stated verbatim (silent omission is hard-banned). STEP 6 summary gains per-judge counts.
8. Update STEPS IN ORDER block + prohibitions table accordingly (keep 0056's preflight rows intact).

## Task 2: @ux-agent review mode (replaces the 0059 stub)

**Files:** `framwork/.codeadd/agents/ux-agent.md`.

⛔ The `plugin:gitnexus:graph` marker pair + adjacent prose lines stay byte-identical. Replace the one-line review-mode stub with:

1. **Approval rubric** — judge each in-contract screen × state × viewport, the senior-designer question: "is this ready for a user, and if not, what exactly must change?" Checks (each names its contract dimension): measured-gap-on-scale? NO — deterministic rows belong to qa-agent. The rubric covers ONLY the judgement dimensions: breakpoint behaviour (did the declared reflow happen), primary CTA count (how many actions read as primary vs declared), visual hierarchy (reading order leads to the primary action), optical alignment (baselines, icon/label pairing), required-states RENDER quality (the evidence-set comparison is the coordinator's; the reviewer judges whether each captured state renders correctly), plus overall UX quality vs the contract. State explicitly: spacing/token/type/grid values and ALL a11y are OUT of this rubric (deterministic, `@qa-agent`'s).
2. **`## Design Review` reading — context, not immunity**: read it first; a finding must not re-litigate a rejected item WITHOUT evidence; a rejected item MAY be raised at full severity when rendered evidence contradicts the recorded rationale, and the finding must cite the rationale it overrides.
3. **`spec-gap` emission**: when the rubric names a dimension the contract failed to declare, emit finding type `spec-gap` naming the exact missing dimension (a spec-gap without a named dimension is invalid). State its honest limit: it catches clerical omission, not blind spots.
4. **Grounding rule** (rubric-isolation note from 0057): every finding cites contract line + evidence file; never "recalled" critique rationale.
5. Findings-only output in review mode (no file writes besides what the command collects); keep critique mode and everything else intact.

## Task 3: @qa-agent rewrite

**Files:** `framwork/.codeadd/agents/qa-agent.md`.

1. Remove `memory: project` from frontmatter (judge reads evidence, never recalls — matches ux-agent's 0057 removal; note: this breaks the 13/13 memory uniformity deliberately, role-scoped).
2. Remove the UX axis and Step 0.5 coverage reconciliation (now the coordinator's; the agent RECEIVES the reconciliation table).
3. Add **deterministic conformance**: compare captured computed-style values (`computed-styles/<screen>.<viewport>.json`) against the `## Design Contract` rows verified-by computed style; a numeric comparison, findings type `ux` with the measured value + declared set in evidence; missing capture for a declared dimension → `unverifiable`, never passing.
4. Keep ALL a11y (axe by rule/impact incl. `color-contrast`, `target-size`).
5. Add **failure forensics**: on a failed assertion, diagnose before reporting — inputs: assertion error text, failure-state PNG, console/page errors, failed requests + status codes, the spec source. Every functional finding carries exactly one **root cause**:

| Root cause | Signature |
|---|---|
| `missing-implementation` | the element/behaviour the criterion promises does not exist |
| `contract-mismatch` | frontend and backend disagree on field, shape, or status code |
| `selector-drift` | element exists but the spec's selector no longer matches |
| `spec-defect` | the assertion itself is wrong or over-specified |
| `data-seed` | flow needs state the run did not seed (authSeed gap) |
| `env-boot` | app or dependency not up; environmental |
| `regression` | a criterion that passed in the immediately previous run now fails |

   Classification requires citing the supporting evidence. `regression` reads ONLY the immediately previous `run-NNN` report (no history walk); first run has no regression class (state in caveats). Expected error states are never classified.
6. Keep: read-only, leaf agent, `add-qa` skill load, soft-degrade compatibility.

## Task 4: qa-validation schema + add-qa skill + ecosystem

**Files:** `framwork/.codeadd/skills/add-doc-schemas/references/review.md`, `framwork/.codeadd/skills/add-qa/SKILL.md`, `framwork/.codeadd/skills/add-ecosystem/SKILL.md`.

1. **`qa-validation` schema** (`references/review.md`): finding `type` extended to `ux | functional | a11y | spec-gap`; `root cause` REQUIRED on functional findings (the 7-value taxonomy); `unverifiable` outcome added to the check-result vocabulary; **`Responsiveness` and `Accessibility` added to the schema's Sections list** (they exist only in the report template today, invisible to the gate's depth-floor walk); `## TOC` required (the report has 9+ H2 sections; the universal >3-H2 rule applies — state it). Existing hard bans preserved (finding without evidence, silent omission, "fix applied" claims).
2. **`add-qa/SKILL.md`**: axis-ownership table (mirroring Task 1's), the review-mode approval rubric summary + pointer to the agent, the root-cause taxonomy table, the merge/dedupe/precedence/contradiction rules, judge-split documentation (replacing the "a later plan splits" forward note), report template updated: per-judge counts in Summary, `root cause` line in the finding template, `spec-gap` in the type enum, Responsiveness/Accessibility kept as sections, `## TOC` added to the template, method line reflects dual-judge. The "no pixel-diff / no Figma baseline" decision stays (deterministic conformance compares NUMBERS, not images — state the distinction).
3. **`add-ecosystem/SKILL.md`**: `add.qa` command row + Agents table rows (`ux-agent` gains `add.qa (review)` dispatch; `qa-agent` description updated: dual-judge split, forensics), Dependency Index rows updated.

## Task 5: sweep + tests + evidence + changelog

1. Grep sweep: no remaining "4-axis"/"dual-axis (UX + functional)" wording that contradicts the judge split (add-qa skill, add-ecosystem, qa-agent, add.qa; the umbrella brainstorm files are historical — untouched); no `Step 0.5` references; `memory: project` count expectations in tests (build.test.js asserts agent frontmatter — check whether any test pins qa-agent memory; fix fixtures if so).
2. Extend smoke suite (scenario 7): built `add.qa.md` contains the parallel dual-judge dispatch (`@ux-agent` + `@qa-agent` in STEP 4.3) and run-NNN-at-STEP-4 resolution; built `qa-agent.md` has no `memory:` line and contains `root cause`; built `ux-agent.md` contains the review-mode rubric marker (e.g. "context, not immunity"); built `review.md` reference contains `spec-gap` and `unverifiable`.
3. Full vitest = 27-row baseline; bats 63/63. Evidence `docs/plans/0059-PLAN--dual-judge-qa-validation--evidence-v01.md`; changelog `docs/changelog/2026-07-27-update-dual-judge-qa-validation.md` (note framework version bump obligation — schema change); plan status → implemented.

## Validated Decisions (carried)

Two parallel judges per SF (wall-clock flat); coverage to the coordinator (shared input, computed once); both coverage rules verbatim; spec-gap named-dimension-required; FULL-severity override on rejected items with cited rationale (polish-cap rejected); root cause with evidence citation; regression bounded to previous run; merge key + higher-severity-wins + contradiction-once-lower-both-positions; soft-degrade both judges; `memory` removed from qa-agent (role-scoped); read-only via command guard naming both.

## Risks

| Risk | Mitigation |
|---|---|
| playwright drive-marker anchor breaks in the STEP 4 restructure | Anchor lines identified before editing; rebuild + smoke round-trip + gitnexus test-list comparison |
| Duplicate findings across judges | a11y + deterministic conformance exclusively qa-agent's; dedupe key + precedence |
| spec-gap becomes a dump | named-dimension requirement |
| Double token cost per SF | Accepted (parallel, narrower slices each) |
| 0060 coupling | taxonomy values frozen as listed — 0060 routes on them verbatim |

## Next Steps

Executed via subagent-driven development in-session.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-07-27 | Created from brainstorm 04 (post coherence pass: full-severity override, no ux-agent a11y), task-structured for SDD |

# Brainstorm 04: Dual-Judge QA Validation

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-07-26
> **Type:** command + agents + skill
> **Layer:** product (`framwork/.codeadd/`)
> **Umbrella:** `2026-07-26-00-qa-ux-umbrella.md` · **Depends on:** `02`, `03` · **Blocks:** `05`

## Discovery

- **`add.qa` STEP 4** — 4.1 runs the persisted `<surface>.qa.spec` via the `qa-project` Managed App Lifecycle, collecting functional pass/fail, axe results, and PNGs at `_tests/run-NNN/screenshots/<screen>.<state>.<viewport>.png`. 4.2 dispatches one `@qa-agent` per SF in parallel, WAIT-ALL before STEP 5. Soft-degrade clause: dispatch a generic subagent with the same directive plus the `add-qa` skill if `@qa-agent` is unavailable.
- **`qa-agent`** — Step 0 derives a functional checklist from `about.md`; Step 0.5 does contract-anchored coverage reconciliation against `design.md` (a reachable in-contract screen with no evidence is a `blocker` titled `coverage: <screen> not captured`; `design.md` wins over `screens.json` on disagreement); Axes 1–4 are UX, functional, responsiveness, a11y. Read-only, leaf agent.
- **`add-qa` skill** — Level C model; severity taxonomy `blocker/major/minor/polish`; finding tag `type: ux | functional | a11y`; report template with `TL;DR`, `Summary`, `Coverage`, `Functional delivery`, `Findings`, `Responsiveness`, `Accessibility`, `Clean screens`, `Not covered / caveats`; explicit note that *an expected error state is correct behavior, not a finding*.
- **`qa-validation` schema** — sections `TL;DR · Summary · Coverage · Functional delivery · Findings · Clean screens · Not covered / caveats`. Depth floor per finding: severity, type, screen, viewport, related criterion or design ref, concrete evidence, observed, expected, fix hint. Hard bans include a finding without evidence, a functional result without a tested criterion, silent omission, and any "fix applied" claim.
- **`e2e-agent`** — authors the spec; on a genuine delivery failure it must *"surface it as a real gap; NEVER soften the assertion"*. On boot failure it defers the first run to `/add.qa` with a flagged note.
- **From `02`** — `design.md` now exists at `SCOPE_DIR` and carries `## Design Review` (accepted/rejected critique with rationale). From `03` — it carries `## Design Contract` (assertable values).

## Context & Motivation

`qa-agent` judges four axes alone, and the UX axis is the weakest of the four. The reason is structural, not a prompt defect: a generalist judging visual quality has no access to design intent, and until `03` there were no declared values to measure against.

The owner wants `/add.qa` to behave as a **senior designer approving the delivered layout** — reading screenshots and recording what must change before the feature is user-ready — and, when a functional test fails, to explain *what happened* rather than report a red mark. Both outputs feed `/add.build`.

The umbrella's organising decision makes this natural: the agent that authored and critiqued the design contract is the right one to judge conformance to it. `@ux-agent` already reviews an image at design time (`03`); it reviews an image again at delivery time. Same eye, same modality, both ends.

## Problem / Opportunity

| Problem | Effect |
|---|---|
| One generalist judges four axes | The visual axis gets the least specialised attention, and design intent is unavailable to it |
| Functional judgement stops at pass/fail | The report says a scenario failed but not why, so `/add.build` must re-diagnose from scratch |
| `spec-gap` has no expression | When `design.md` failed to declare what was needed to judge something, the reviewer silently judges nothing |
| Consciously rejected design decisions are invisible to the judge | The reviewer re-raises closed decisions as findings, eroding trust in the report |
| No root-cause vocabulary | Nothing downstream can route a fix, because nothing classifies *what kind* of failure it is |

## Proposed Solution

Split STEP 4 into two parallel specialist judges per SF, move coverage reconciliation to the coordinator, add a root-cause taxonomy to functional failures, and give the UX reviewer an approval-grade rubric anchored in `## Design Contract`.

### Judge split and axis ownership

```
STEP 4.0  RETAINED unchanged — specs-absent branch (qa-pipeline OFF vs
          ON-but-not-generated, incl. the plugin live-drive stopgap)
STEP 4.1  resolve run-NNN, then run <surface>.qa.spec
          → PNGs + axe + assertion roll-up + captured computed styles
STEP 4.2  build the Coverage reconciliation (coordinator)
STEP 4.3  per SF, PARALLEL:
            @ux-agent  [review]  — judgement-only visual axes
            @qa-agent            — functional + a11y + deterministic conformance + forensics
          WAIT-ALL
STEP 5    merge, dedupe, write qa-validation-NNN.md
```

**`run-NNN` must be resolved before 4.1, not at STEP 5.** Today STEP 4.1 writes PNGs to `_tests/run-NNN/screenshots/` while `add.qa.md:111` computes `NNN` at STEP 5 — a pre-existing ordering hole that 4.2's coverage reconciliation (which reads that directory) would deepen. Resolve the number once, at the top of STEP 4.

**STEP 4.0 is retained, not replaced.** `01`'s preflight surfaces the same information earlier; the branch itself still governs what happens when specs are absent mid-run.

| Axis | Judge | Source of truth |
|---|---|---|
| UX quality | `@ux-agent` | `design.md` `## Design Contract` + `## Design Review` |
| Design conformance — **deterministic** | `@qa-agent` | captured computed-style values compared to the contract (`03`) |
| Design conformance — **judgement** | `@ux-agent` | hierarchy, optical alignment, primary-CTA reading, declared reflow |
| Responsiveness | `@ux-agent` | declared breakpoint behaviour + per-viewport PNGs |
| Functional delivery | `@qa-agent` | `about.md` criteria + assertion roll-up |
| Failure forensics | `@qa-agent` | assertion error, failure-state PNG, console/network diagnostics |
| a11y — **all of it** | `@qa-agent` | axe-core violations by rule/impact, incl. `color-contrast` and `target-size` |

Two corrections to the naive split, both forced by what agents can actually do:

- **Conformance is split by verification method, not by axis.** Per `03`, spacing steps, tokens, type scale, and container geometry are verified by comparing **captured computed-style values** to the contract — a numeric comparison `@qa-agent` performs deterministically. A vision model cannot measure pixel gaps or read font sizes from a downscaled full-page PNG. `@ux-agent` receives only what genuinely needs eyes.
- **`@ux-agent` gets no a11y at all.** The earlier split gave it "contrast and visible focus against declared tokens" — but those are exactly axe's `color-contrast` and `target-size` rules. Since the dedupe key cannot reconcile a DOM-node-scoped axe violation with a prose symptom string, every AA failure would land twice. All a11y is `@qa-agent`'s.

**Every check has an `unverifiable` outcome.** When a contract dimension was declared but its verification method did not run (computed styles not captured, axe absent, state never reached), the judge records `unverifiable` with the reason. Without it the schema pressure is perverse: silent omission is hard-banned, `spec-gap` is defined as *undeclared* and therefore invalid here, and the only remaining option is to state a measurement that was never made.

**Coverage reconciliation moves to the coordinator.** Today `qa-agent` Step 0.5 builds it. With two judges it must not be built twice. It is *not* purely mechanical — extracting the expected screen set from a Markdown `design.md` and applying "design.md wins over screens.json" across two representations is LLM extraction, so the table will vary slightly run to run. It moves to the coordinator because it is **shared input**, not because it is deterministic; making it genuinely mechanical would require deriving the expected set from the layout tree (`03`) rather than from prose. Both existing rules are preserved verbatim: a reachable in-contract screen with no evidence is a `blocker`, and `design.md` wins over `screens.json` with the drift noted.

The existing soft-degrade clause extends to both judges: if a named agent is unavailable in the engine, dispatch a generic subagent with the same directive plus the relevant skill.

### The senior-designer approval rubric

`@ux-agent` review mode judges each in-contract screen × state × viewport against `## Design Contract`, asking the question a senior designer asks: **is this ready for a user, and if not, what exactly must change?**

| Check | Contract dimension | Failure looks like |
|---|---|---|
| Measured gaps land on the declared scale | spacing scale | an arbitrary gap between scale steps |
| Rendered colours trace to allowed tokens | token allowlist | a colour outside the palette |
| Type sizes/weights are on the scale | typographic scale | an off-scale heading |
| Content respects the container and column count | grid / container | overflow past the container, wrong column count |
| Observed reflow matches the declared one | breakpoint behaviour | a desktop layout not collapsing as declared |
| Interactive elements meet the minimum at 375 | tap target | a control below the declared minimum |
| Every declared state has evidence and renders correctly | required states | `error` declared but never captured or rendered wrong |
| Exactly the declared number of primary actions reads as primary | primary CTA count | two equally weighted CTAs |
| Text/background pairs meet the target | contrast target | AA failure on a declared pair |
| Visual hierarchy leads to the primary action | (judgement, contract-informed) | the primary action is not the first thing seen |
| Optical alignment across labels, icons, baselines | (judgement, contract-informed) | icon and label baselines off |

Two mandatory behaviours:

- **Read `## Design Review` first — as context, not as immunity.** The earlier draft capped a consciously rejected item at `polish`. That is wrong: the coordinator that consolidates the design also decides what to reject, so the cap would let the pipeline immunise its own defects at plan time (reject "two primary CTAs" with a rationale, ship two competing CTAs, and QA is contractually barred from calling it `major`). The rule is instead: **a rejected item may be raised at full severity when the rendered evidence contradicts the recorded rationale**, and the finding must cite the rationale it is overriding. `## Design Review` prevents re-litigation without evidence; it never caps severity when evidence exists.
- **Emit `spec-gap` when the contract failed to declare a dimension the rubric names.** New finding type alongside `ux | functional | a11y`. **Its honest limit:** it catches dimensions the rubric knows about and the contract omitted. A dimension neither the author nor the rubric ever conceived is absent from both, so nothing fires — `spec-gap` detects clerical omission, not genuine blind spots. It is worth having and it is not a solution to the circularity risk.

### Functional failure forensics

When an assertion fails, `@qa-agent` must diagnose before reporting. Inputs: the assertion error text, the state screenshot at failure, console and page errors, failed requests and their status codes, and the spec source for the failing scenario.

Every functional finding is classified into one **root cause**:

| Root cause | Signature |
|---|---|
| `missing-implementation` | the element or behaviour the criterion promises does not exist |
| `contract-mismatch` | frontend and backend disagree on a field, shape, or status code |
| `selector-drift` | the element exists but the spec's selector no longer matches |
| `spec-defect` | the assertion itself is wrong or over-specified |
| `data-seed` | the flow needs state the run did not seed (`authSeed` gap) |
| `env-boot` | app or dependency not up; the failure is environmental |
| `regression` | a criterion that passed in an earlier `run-NNN` now fails |

This taxonomy is the load-bearing output of this topic: `05`'s routing rules key off it, and it is what turns "red test" into "this is a backend DTO mismatch". The existing rule that an *expected* error state is correct behaviour, not a finding, is preserved — an expected error is never classified.

`regression` requires reading the previous `run-NNN` report for the same scope. Bounded to the immediately previous run; no full history walk.

### Merge rules (coordinator, STEP 5)

Two judges can see the same defect from different angles.

- **Dedupe key** — `(screen, state, viewport, symptom)`. On collision keep one finding, merge evidence.
- **Domain precedence** — visual symptoms keep the `@ux-agent` wording; behavioural symptoms keep `@qa-agent`'s. A visual symptom with a functional root cause keeps the root cause and the visual description.
- **Severity** — the higher of the two survives, with the losing judge's rationale retained as a note.
- **Coverage blockers** are the coordinator's, never a judge's, since the coordinator computed the table.
- **Contradiction** — if judges disagree on whether something is a defect at all, report it once at the lower severity with both positions stated. Never silently drop it; silent omission is already hard-banned.

### Alternatives considered

| Option | Verdict |
|---|---|
| Keep one 4-axis `qa-agent` and give it the design contract | **Rejected.** Cheaper, but keeps a generalist on the axis that needs specialisation, and forfeits the author-judges-delivery symmetry that makes `## Design Review` usable |
| A third dedicated `design-review-agent` | **Rejected.** `@ux-agent` already holds the contract and critiqued the proposal; a third agent duplicates that context and orphans `@ux-agent` |
| Let both judges compute coverage independently and reconcile | **Rejected.** Duplicated mechanical work and a guaranteed source of conflicting tables |
| Give `@ux-agent` all a11y | **Rejected.** axe output is deterministic and code-adjacent; visual a11y is contract judgement. Splitting on that line avoids duplicates |
| Forensics as a third agent after `@qa-agent` | **Rejected.** The diagnosis needs the same evidence already in `@qa-agent`'s context; a handoff adds a dispatch and loses context |
| Full regression history walk across all runs | **Rejected.** Unbounded cost; the previous run answers "is this new?" |

## Type of Artefact

Command modification (`add.qa`), agent rewrites (`ux-agent` review mode, `qa-agent`), skill and schema modifications (`add-qa`, `qa-validation`).

## Scope

### Includes

- `add.qa` STEP 4 restructured: coordinator coverage reconciliation, two parallel judges per SF, WAIT-ALL preserved
- `add.qa` STEP 5 merge, dedupe, precedence, and contradiction rules
- `@ux-agent` review mode with the approval rubric, `## Design Review` reading, and `spec-gap` emission
- `@qa-agent` rewritten: UX axis removed, deterministic conformance comparison added, forensics and the root-cause taxonomy added, previous-run regression check, **`memory` removed**
- `add.qa` read-only guard extended to name `ux-agent` alongside `qa-agent`
- `add-qa` skill: axis-ownership table, approval rubric, root-cause taxonomy, merge rules, judge-split documentation
- `qa-validation` schema: `type` extended with `spec-gap`; `root cause` required on functional findings; `unverifiable` outcome added. **`Responsiveness` and `Accessibility` must first be added to the schema's Sections list** — they exist only in the `add-qa` report template today, so the gate's depth-floor walk cannot see them
- A `## TOC` in the report template: it already has 9 H2 sections and `add-doc-schemas` requires a TOC above 3, with `add.qa` STEP 7 running that gate mandatorily
- `run-NNN` resolved at the top of STEP 4, closing the existing write-before-resolve hole
- Soft-degrade clause extended to both judges
- **Framework version bump at release** with the affected-command list, per `add-doc-schemas` Self-Governance. No schema-version field exists and nothing migrates user docs on update, so this is a release-notes obligation, not a gate mechanism

### Does NOT Include

- Fix routing and the responsible-agent field — `05`
- `add.build` consuming the report — `05`
- Any code modification by either judge — both stay read-only
- Persisting or comparing mock screenshots from `03`
- Cross-run regression policy beyond the immediately previous run
- Changing `4.1` spec execution or the `qa-project` Managed App Lifecycle
- Non-web surfaces

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Two parallel judges per SF instead of one generalist | The visual axis needs the agent that holds the contract; parallel keeps wall-clock unchanged | ✅ |
| `@ux-agent` owns UX quality, judgement-conformance, responsiveness — no a11y | It authored and critiqued the contract and already judges images; all a11y stays with `@qa-agent` (axe) to avoid double findings | ✅ |
| `@qa-agent` owns functional, axe a11y, heading order, forensics | Deterministic and code-adjacent evidence; forensics needs assertion context | ✅ |
| Coverage reconciliation moves to the coordinator | Mechanical, needed by both judges, and must not be computed twice | ✅ |
| Both existing coverage rules preserved verbatim | They are the guarantee that every declared screen is judged | ✅ |
| `spec-gap` added as a finding type | Makes the author-judges-own-spec blind spot visible instead of silent | ✅ |
| Reviewer must read `## Design Review`; a rejected item may be raised at full severity only when rendered evidence contradicts the recorded rationale, citing it | Prevents re-litigation without evidence, without letting plan-time rejections immunise defects | ✅ |
| Every functional finding carries a root cause from a fixed taxonomy | Turns a red test into a diagnosis, and is the key `05` routes on | ✅ |
| `regression` bounded to the immediately previous run | Answers "is this new?" without an unbounded history walk | ✅ |
| Expected error states are never classified | Preserves the existing rule that expected errors are correct behaviour | ✅ |
| Merge by `(screen, state, viewport, symptom)`; higher severity wins; contradictions reported once with both positions | Prevents duplicates without silent omission, which is hard-banned | ✅ |
| Soft-degrade clause extended to both judges | Keeps the pipeline functional where named agents do not exist | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add.qa` | STEP 4 restructured; STEP 5 gains merge rules; STEP 6 summary reports per-judge counts | Modify |
| `ux-agent` | Review mode added (critique mode from `02`) | Modify |
| `qa-agent` | UX axis removed; forensics + taxonomy added; coverage step removed | Rewrite |
| `add-qa` skill | Axis ownership, approval rubric, taxonomy, merge rules, judge split | Modify |
| `add-doc-schemas` (`references/review.md`) | `qa-validation` gains `spec-gap` and required root cause | Modify |
| `add-ecosystem` skill | `add.qa` dispatch entry lists two agents | Modify |
| `add.build` | Consumes richer findings — full integration in `05` | None here |
| `e2e-agent` | Unchanged; `spec-defect` and `selector-drift` classifications point back at its output | None |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A specialist visual judge holding the design contract | Two dispatches per SF instead of one |
| A diagnosis instead of a red mark | Longer `@qa-agent` runs (reading diagnostics and the previous run) |
| The blind-spot weakness made visible via `spec-gap` | A new finding type to teach every consumer of the schema |
| Closed design decisions stay closed | Dependence on `## Design Review` being maintained |
| A taxonomy that makes routing possible | Coupling between `04`'s taxonomy and `05`'s routing rules |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Duplicate findings across the two judges | Med | Explicit dedupe key + domain precedence. The main generator was the a11y overlap, now removed entirely — `@ux-agent` gets no a11y and no deterministic conformance |
| The judges grade an implementation that never received the contract | **Low, once `02` lands** | `add.build` already consumes `design.md` (`:118`, `:130`, `:184`, `:340`); the only break is `HAS_DESIGN`, which `status.sh` never emits. `02` fixes the emission and domain-scopes the `plan.md > design.md` precedence so a lossy paraphrase cannot outrank the contract. **Hard dependency: this topic must not ship before that fix**, or every run manufactures conformance findings |
| The reviewer recalls its own design rationale instead of reading the artefact | Low | Resolved in `02`: **`memory` is removed** from `@ux-agent` and from `@qa-agent`. With no persistent memory, both judges must read `design.md`, `about.md`, and the run evidence. A judge should read evidence, not remember |
| Neither judge has `disallowedTools`, so read-only is prose | Med | Consistent with today's `@qa-agent`. `add.qa`'s existing guard (*"if an agent edited code, reject the run"*) is extended to name `ux-agent` and becomes the sole, mandatory mechanism |
| Root-cause misclassification sends `05` to the wrong agent | Med | Each cause has a stated signature; classification requires citing the evidence that supports it; `05` allows multiple routed agents and confirms before changing code |
| `spec-gap` becomes a dumping ground for "I could not judge this" | Med | Requires naming the exact contract dimension that was missing; a `spec-gap` without a named dimension is invalid |
| The reviewer defers to `## Design Review` and suppresses a real defect | Med | The full-severity override exists precisely for this; it requires citing rendered evidence that contradicts the recorded rationale |
| Parallel judges double token cost per SF | High | Accepted — parallel keeps wall-clock flat, and each judge reads a narrower slice than today's generalist |
| The rubric checks values a project never declared | Med | Those become `spec-gap`, not failures — the honest outcome |
| `regression` check fails when no previous run exists | Low | First run has no `regression` class; state it in the caveats section |
| Contradiction handling produces vague findings | Med | Both positions must be stated verbatim; the lower severity applies, and the finding still requires evidence |

## Next Steps

Run: `/add-framework--plan implement docs/brainstorming/2026-07-26-04-dual-judge-qa-validation.md`

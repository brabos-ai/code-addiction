---
name: add-cross-sf-consistency
description: Use when judging contract consistency across an epic's subfeature plans — the five-dimension rubric, dedupe rules, and finding routes.
---

# add-cross-sf-consistency — Cross-Subfeature Consistency Rubric

## Overview

The rubric `consistency-agent` loads before it reports. `/add.plan-to-ready`'s epic loop dispatches that agent twice per epic run: a **FULL pass** after each subfeature's `plan.md` is consolidated and reviewed (comparing it against every already-converged sibling), and one **DELTA pass** at the end of the epic (re-checking only what changed since the last verdict). The agent compares declared contracts **document against document** — `plan.md`, `about.md`, `design.md` — and never opens source code; code-level review stays `@reviewer-agent`'s job.

This produces no new persisted artefact of its own. A `FULL`-pass finding is applied straight into the subfeature's own `plan.md`; a `DELTA`-pass finding is written into the epic's existing `review-NNN.md`. There is no `consistency-validation-NNN.md` and none should ever be invented — see Where Findings Go below.

## When to Use

- `consistency-agent` loads this skill as its rubric source, on every dispatch (`FULL` or `DELTA`).
- `/add.plan-to-ready`'s epic loop needs the routing hints to fold a `DELTA`-pass finding into `## Fix Routing`.

## When NOT to Use

- Judging one subfeature in isolation against its own `about.md`/`design.md` — that is `@qa-agent` / `@ux-agent` (dual-judge QA, `add-qa`) or `@plan-reviewer-agent` (pre-delivery executability, `add-plan-review`). This rubric only fires when there are **two or more** subfeatures to compare.
- Code-level review (naming, security, architecture, whether the code matches the plan) — `@reviewer-agent` / `add-code-review`.
- A single-feature (non-epic) run of `/add.plan-to-ready`. With one subfeature there is nothing to compare against, so the loop never dispatches this agent.
- **Single-plan completeness** — whether a shared enum/config was declared ONCE in the earliest subfeature instead of duplicated, whether a subfeature depending on an unbuilt sibling declares fallback behavior, whether new services are registered in DI/as workers. That is `/add.plan` STEP 10.5's job. See Boundary below.

## Boundary — this rubric vs `/add.plan` 10.5

Two artefacts look across an epic's subfeature plans, and they split on one line: **`consistency-agent` DETECTS divergence between plans; `/add.plan` STEP 10.5 (Cross-SF Integration Review) fixes COMPLETENESS of a single plan, in place.** Every dimension below asks *do two declarations disagree?* — 10.5's checks ask *is one plan complete?*

| Question | Owner | Mode |
|---|---|---|
| Do two subfeatures declare the same contract differently? | `consistency-agent` — the five dimensions below | Read-only judge: reports a verdict, never edits |
| Is a shared enum/config declared ONCE in the earliest subfeature, or duplicated? | `/add.plan` 10.5 | Fixes `plan.md` in place |
| Does a subfeature depending on an unbuilt sibling declare fallback behavior? | `/add.plan` 10.5 | Fixes `plan.md` in place |
| Are new services registered in DI / as workers? | `/add.plan` 10.5 | Fixes `plan.md` in place |

The traffic runs both ways. 10.5 no longer derives **schema ↔ consumer alignment** or **cross-SF handoff contracts** itself — those are dimensions 2 and 1 here, and 10.5 **consumes** this agent's `FULL`-pass findings for them rather than opening a second verdict. In return, ⛔ this rubric never reports a 10.5 concern — not as a finding, not as `informational`. A duplicated declaration is not two declarations disagreeing, so the *out-of-rubric divergence → `informational`* path does not reach it either. This is also why the cap holds at five: folding 10.5's three checks in would need a sixth dimension, which is banned.

## The Five Dimensions — exactly five, nothing else

This cap is a validated decision (plan 0074 T4): an open-ended consistency judge produces endless findings and the loop never converges. A divergence outside these five is `informational` and never blocks, no matter how serious it looks.

| # | Dimension | What it catches |
|---|---|---|
| 1 | **API contracts** | An endpoint/DTO one subfeature consumes and another delivers with a divergent shape (fields, types, status codes) |
| 2 | **Data schema** | Two subfeatures declaring the same entity/column with a different type or name |
| 3 | **Requirements** | An RF/RN in one subfeature contradicting or duplicating another's |
| 4 | **Design tokens / shared components** | Divergence on a shared component's contract. **Only evaluated when `HAS_DESIGN` is true.** On a backend-only epic this dimension produces no finding at all — not even a clean one, it never ran |
| 5 | **Auth / permission model** | Divergent access rules over the same resource |

⛔ Do not evaluate a sixth dimension, even informally, and do not let one of the five absorb concerns it was never meant to own (e.g. performance, naming style, test coverage — none of these are in scope, ever).

## Severity Taxonomy

| Severity | Meaning |
|---|---|
| `blocker` | A direct contradiction on a shared contract (same endpoint/entity/rule, incompatible declarations). **What it actually does:** on a `FULL` pass it is a hard exit for that subfeature's plan leg; on a `DELTA` pass it stops the checkpoint — `{{cmd:add.plan-to-ready}}`'s checkpoint sequence reads `## Fix Routing` before it flips a row, and refuses to commit, tag or push while an unresolved `blocker` stands. See Why the DELTA pass runs first, below |
| `major` | A significant divergence that is not yet a hard contradiction but will produce an integration failure once both sides are built |
| `minor` | A cosmetic or naming divergence unlikely to break integration (e.g. one plan calls it `userId`, the sibling `user_id`, but both resolve to the same column) |
| `informational` | Anything outside the five dimensions. Always this severity, regardless of how serious it reads — **never blocks** |

### Why the DELTA pass runs BEFORE the last checkpoint

A `blocker` is only a real severity if something reads it before the thing it
should stop has already happened. The DELTA pass therefore runs **before** the
final subfeature's checkpoint, not after it.

Run after, its verdict would arrive once that subfeature had already been
committed, tagged and pushed — nothing re-runs the convergence gate at that
point, and its rows would sit in a `review-NNN.md` no later step ever commits,
because the loop makes no further commit. The severity would be real in this
table and inert in the loop.

Two things make it real, and both are required:

1. the pass runs before the checkpoint, so its rows land in the version of
   `review-NNN.md` the checkpoint stages;
2. the checkpoint's own **step 0 pre-check** reads `## Fix Routing` and refuses
   to proceed while an unresolved `blocker` row stands.

⛔ Neither alone is sufficient. Moving the pass earlier without the pre-check
leaves `blocker` decorative; a pre-check reading a document written after it
runs would read rows that are not there yet.

A finding without evidence is not a finding — see Evidence Discipline below. This mirrors the `review` schema's own hard ban on unevidenced findings.

## Run Modes

### FULL pass (plan-time)

Dispatched once, right after a subfeature's `plan.md` (+ `design.md`) is consolidated and has passed its own `feature-plan` schema gate. Compares the new subfeature against **every already-converged sibling** in the epic, across all five dimensions (four when `HAS_DESIGN` is false). Already-converged siblings are read-only inputs here — they have shipped code and a checkpoint commit; this pass never proposes changing them.

### DELTA pass (end-of-epic)

Dispatched once, after the last subfeature reaches CONVERGED. Re-checks **only the dimensions whose inputs changed** since the last verdict — a `plan.md`/`about.md`/`design.md` touched by a fix wave after it was last judged. The agent states which dimensions it skipped and why (inputs unchanged). This bounds the pass to what actually moved instead of re-walking the whole epic a second time.

## Where Findings Go — differs by mode (load-bearing)

The review document (`review-NNN.md`) does not exist yet at plan time — a subfeature's own review only gets written after it is built. That single fact is why the two modes route to different places, and getting this backwards silently reopens the gap F31 exists to close.

| Mode | Destination | Mechanism |
|---|---|---|
| `FULL` (plan-time) | The new subfeature's own `plan.md` | Apply the finding as a concrete edit to `plan.md` — never to an already-converged sibling's plan, those are frozen. Re-run the `feature-plan` schema gate. Re-dispatch `consistency-agent` **once** to confirm the conflict is resolved. If it still isn't after that single re-dispatch, or the conflict needs a decision no edit can make unilaterally (two shipped siblings each own a divergent shape and picking a winner is a product call, not a text fix) → `blocked`, a hard exit for the whole epic run, naming the subfeature and the dimension. This is the exact apply → re-gate → one-re-dispatch → hard-exit shape `@plan-reviewer-agent`'s `fix-then-ok` / `blocked` loop already uses (`add-plan-review`) — reused here, not reinvented. |
| `DELTA` (end-of-epic) | The epic's `review-NNN.md`, `## Fix Routing` table | One row per finding, using the `review` schema's columns (`Scope \| ID \| Severity \| Area \| Route \| File \| Symptom \| Blocked by`). `Route` and `Area` come from the Routing Hints table below — the dispatching command derives them, never this agent. `informational` findings are **not** written into `## Fix Routing` (nothing there ever blocks the routing table's own contract) — record them in the run's notes instead, so they are visible but never gate anything. |

`informational` findings at plan-time are noted in the Decision Log, not applied as an edit — an out-of-rubric observation is not a `plan.md` fix.

## Dedupe & Precedence Rules

`add-qa`'s coordinator merges findings from **two judges**. This rubric has only **one** judge, dispatched across **multiple passes** and, within a `FULL` pass, comparing the new subfeature against **every** already-converged sibling at once (an N-way comparison, not a single pair). "Merge" here means collapsing what would otherwise be duplicate findings across that N-way comparison and across passes — modelled on the same four moves plan 0059 established, adapted to a single judge:

1. **Dedupe key** `(dimension, contract-name, subfeature-pair)` — the pair sorted, so `(SFa, SFb)` and `(SFb, SFa)` are the same key. On collision within one pass (e.g. three siblings all declare a diverging shape for the same endpoint), keep **ONE** finding and merge the evidence citations from every subfeature that declares it, not just the first two found.
2. **Cross-pass dedupe** — a finding already applied and confirmed by the plan-time fix loop (schema re-gate + the one re-dispatch came back clean) is CLOSED. Neither a later `FULL` pass nor the `DELTA` pass may re-raise it unless a NEW change reopens the same `contract-name` — an already-converged sibling cannot regress on its own, and a subfeature fixed at plan-time is itself an already-converged input from that point on.
3. **Dimension precedence** — when one underlying conflict could be filed under two of the five dimensions, keep the dimension whose declaration is the **proximate** cause and note the secondary dimension in the evidence rather than opening a second finding. Example: an auth-gated endpoint's *payload-shape* mismatch files under API contracts; a mismatch in *who may call it* files under Auth/permission model — the same endpoint can produce one finding of each kind, but never two findings of the same kind for the same cause.
4. **Severity precedence** — when the same `contract-name` is cited at different severities across the N-way comparison (contradicts one sibling at `blocker`, merely diverges in naming from another at `minor`), the **HIGHER** severity survives as the finding's severity; the lower-severity note is kept, never dropped.
5. **Contradiction** — when it is genuinely ambiguous whether two subfeatures actually disagree (e.g. a field marked "TBD" in one plan vs. a concrete type in the sibling — is that a real conflict or an open placeholder resolving itself later?), report it **ONCE** at the **LOWER** of the two plausible severities, with **both** readings stated verbatim. Silent omission of a contradicted finding is hard-banned, exactly as in `add-qa`.

**Scope naming in `## Fix Routing` (DELTA only).** The `review` schema's own "no dedup across scopes" rule (`add-doc-schemas/references/review.md`) governs two scopes *independently* reporting the *same symptom* — each keeps its own fix site. A consistency finding is not that: it is inherently a relationship **between** two subfeatures, not two independent reports. Name the `Scope` cell with the subfeature whose declaration is the fix target — by default the **later** subfeature in `epic.md`'s dependency order (the earlier one shipped first; downstream code already depends on what it declared) — and cite the earlier, authoritative subfeature in the `Symptom` text. Do not split one consistency finding into two Fix Routing rows; that is what rule 1 above already exists to prevent.

## Evidence Discipline

Every finding cites **both** sides of the disagreement, each as `<doc path>#<section heading>` or `<doc path>:<line>` when a line is quotable (mirrors `add-doc-schemas/references/review.md`'s evidence reference forms). A finding naming only one subfeature's declaration, or naming a subfeature without a section/line, is not a finding — do not report it, do not "round up" a vague impression into one.

## Routing Hints (coordinator use, DELTA pass only)

The dispatching command derives `Route` and `Area` from the finding's `dimension` — this agent never emits a route itself (mirrors `add-qa`: judges emit `type` + evidence, the coordinator routes).

| Dimension | Area | Default route |
|---|---|---|
| API contracts | `api-contract` | `@backend-agent` → `@frontend-agent` |
| Data schema | `schema` | `@database-agent` |
| Requirements | `requirements` | **user (manual)** — reconciling two RF/RN is a product/scope decision, no implementer agent may pick a winner |
| Design tokens / shared components | `design-spec` | `@ux-agent` |
| Auth / permission model | `auth` | `@backend-agent` (+ `@frontend-agent` if enforcement is duplicated client-side) |

Capability validation follows the same hard rules `add-qa`'s coordinator reference states: `@ux-agent` may only be routed to `design-spec`; implementation agents may not be routed to `design-spec`; an invalid route is a schema violation, not a warning.

## Finding Shape (returned to the dispatching command, not persisted)

```markdown
### [SEVERITY · dimension] <SFa> vs <SFb> — <short title>
- **Dimension:** api-contract | data-schema | requirements | design-tokens | auth-model | out-of-rubric (→ severity: informational)
- **Subfeatures:** <SFa> — <doc path>#<section> · <SFb> — <doc path>#<section>
- **Evidence:** <SFa>'s declaration, quoted or paraphrased, cited · <SFb>'s declaration, quoted or paraphrased, cited
- **Conflict:** <one sentence — what disagrees>
- **Suggested fix (FULL only):** <the concrete plan.md edit that would resolve it>
```

`SEVERITY` is one of `blocker | major | minor | informational`. `dimension` is exactly one of the five, or `out-of-rubric`. The dispatching command applies the `FULL`-pass shape to `plan.md`, or turns the `DELTA`-pass shape into a `## Fix Routing` row via the Routing Hints above.

## Validation Checklist

```
[ ] Exactly five dimensions evaluated (four when HAS_DESIGN is false) — no sixth, ever
[ ] Dimension 4 produced NO finding at all (not even clean) on a HAS_DESIGN=false epic
[ ] Every finding cites both subfeatures' documents by path + section/line — no finding without evidence
[ ] Out-of-rubric divergences are `informational` and never appear in a blocking role
[ ] No single-plan completeness concern reported — shared-resource centralization, fallback/degradation and DI/worker registration are /add.plan 10.5's, never a finding here at any severity
[ ] FULL-pass findings applied to the new subfeature's plan.md only — never to an already-converged sibling
[ ] FULL-pass application followed apply → re-run feature-plan gate → one re-dispatch → blocked-on-failure, same shape as @plan-reviewer-agent's fix-then-ok/blocked loop
[ ] DELTA-pass findings written into review-NNN.md's ## Fix Routing, not a new file
[ ] DELTA pass states which dimensions it skipped and why (unchanged inputs since last verdict)
[ ] Dedupe key + cross-pass dedupe applied — no duplicate finding for one underlying conflict
[ ] Severity precedence kept the higher severity; the lower-severity note was kept, not dropped
[ ] A genuine contradiction reported once, at the lower severity, with both positions stated
[ ] No route emitted by the agent itself — routing derived by the dispatching command from the Routing Hints table
[ ] Agent read no application source, no review-NNN.md, no git history
[ ] No new artefact/report file invented — this rubric produces no persisted document of its own
```

# Brainstorm: Product Pipeline Parity

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-16
> **Type:** workflow

## Objective

When this is done, a user of the installed framework gets the same pipeline this repository already
runs internally: `add.brainstorm` conducts exploration the way `add-framework--brainstorm` does, the
feature's objective is drafted in the brainstorm and travels through `about.md` and `plan.md` to the
reviewer, and one approval can carry a delivery unattended up to the PR question. Today the objective
is lost after the brainstorm, every stage asks for an approval that decides nothing, and bounded
convergence lives in a separate command — `add.plan-to-ready` — that this change removes.

## Discovery

Sources ported — three internal-layer deliveries of 2026-09-16:
- `docs/changelog/2026-09-16T072716-refactor-pipeline-ceremony-rebalance.md` — the intent file, `add-feature-specification` as single writer of `about.md`, review scaled by path. **Already on both layers.**
- `docs/changelog/2026-09-16T144210-feat-objective-as-anchor.md` — objective drafted first, `Serves` column, SET-member inheritance, `Objective fit` reviewer dimension. **Internal only; product deferred explicitly.**
- `docs/changelog/2026-09-16T151938-refactor-the-pipeline-chains.md` — one three-option approval, `delivery:` field, deciding vs confirming stops, plan preview, merge keeps history. **Internal only, except the merge.**

State of the product layer today (discovery report, evidence cited there):
- `add.brainstorm` — already has the three paths, the one-way ratchet, mandatory recommendation, structured questions and the intent file. Lacks: objective, section checklist, "repo wins", three-option approval; writes its document only on request; ends on an offer to author `about.md` inline.
- `feature-about-template.md` — already opens on `## Objective`; Decisions table has no `Serves`.
- `feature-plan` schema (`add-doc-schemas/references/new-feature.md`) — no `## Objective`.
- `add-plan-review` / `plan-reviewer-agent` — eight dimensions, no `Objective fit`.
- `add.build` `STEP 17: Publish [STOP]` — unconditional.
- `add.done` / `delivered.sh` — already `gh pr merge --merge` and `--first-parent` (plan `2026-09-11T014333-PLAN--product-close-out-parity`). **Nothing to port.**
- `add.plan-to-ready` — 958 lines; bounded build ⇄ review loop (cap 3) and an epic outer loop with checkpoints. No delivery-index entry.
- Delivery index: no `gone` or `superseded` entry for any artefact touched.

## Context & Motivation

The internal pipeline was rebalanced three times in one day and each change was proved on this
repository's own work. The product pipeline is what users install, and it still carries the cost the
internal one removed: an objective that exists only in a chat transcript, and four stage approvals on
work whose gates are green. The product also has a second path to unattended convergence,
`add.plan-to-ready`, that duplicates what a chained pipeline would do and must be kept consistent
with it by hand.

## Problem / Opportunity

- A feature's decisions are recorded without what they are for. A reviewer with eight dimensions
  passes work that serves no stated objective.
- The product brainstorm writes its document only when asked, so the design a user approved is often
  not on disk.
- Every stage transition waits on the user even when nothing is left to decide.
- Two unattended routes exist (`add.plan-to-ready`, and none in the pipeline) instead of one.

## Proposed Solution

**Recommended — port the internal mechanisms, adapted to the product's command chain and fragments.**

1. **`add.brainstorm` conducts exploration like the internal skill.**
   - Draft the objective from what the user said and have them correct it, before any other question.
   - The section checklist (context, problem, solution with 2–3 directions, scope includes/excludes,
     ecosystem impact, key decisions, trade-offs), scaled by path exactly as internally.
   - Outside practice keeps `WebSearch` (useful in a user's project) but must **name** the product,
     framework or convention; where it conflicts with the repository, **the repository wins**.
   - Ask who uses what the design changes through `add-knowledge-discovery`'s GRAPH step; write
     `NOT VERIFIED` when no graph is reachable, never a blank.
   - On `architectural`, **always write the brainstorm document** (no longer only on request), then a
     short self-review checklist — objective present, nothing open, `Serves` filled, no contradiction.
     No agent dispatch, preserving the ceremony rebalance.
   - End on one approval with three options — confirm each stage / deliver automatically / keep
     discussing — recorded as `delivery:` in the intent file. **The inline "write `about.md` now"
     offer is removed**: on approval `/add.new` authors `about.md` with its id, directory and gate.
   - `spike` still writes nothing and is not asked the three-option question.
2. **`add.new` carries the objective and the mode.**
   - Reads `delivery:` from the intent file.
   - `about.md` Decisions table gains `Serves`.
   - On an epic split, each subfeature row states how it serves the feature objective; one that cannot
     STOPs naming the two readings (belongs elsewhere / objective written too narrowly), picking
     neither.
   - **On an epic split in automatic mode**, present the subfeature plan and ask: continue automatic
     (every pending SF in dependency order, PR question once at the end) or semi-automatic (stop
     between SFs for approval). This is a deciding stop.
3. **`add.plan` carries the objective to the build.**
   - `feature-plan` schema gains `## Objective`, copied from `about.md` (copied, not referenced), plus
     one line on what is true once the build is done.
   - Plan header gains `> **Delivery:**`.
   - A preview — objective, phases, order and why, risk per area, exclusions — shown inside the stop
     before the plan is written.
4. **The loop: `add.build → add.review`, at most two reviews.**
   - Each command hands to the next. `add.build` ends → `add.review` (read-only, writes
     `review-NNN.md` with `## Fix Routing`). Findings on round 1 → `add.build`, whose STEP 12 already
     consumes `## Fix Routing` → `add.review` round 2 → `add.build` STEP 17 Publish.
   - The round is counted from the delivery's `review-NNN.md` files, not from memory.
   - After the second review, STEP 17 stops on the PR question and shows whatever findings remain,
     unfixed. **That question is the terminus.** Same shape as superpowers: final review, then the
     integration decision is the user's.
   - **`add.build` becomes the single owner of the checkpoint.** "The Checkpoint Sequence" moves from
     `add.plan-to-ready` into `add.build` and runs when a subfeature's loop ends: `converge-gates.sh`,
     the checkpoint commit, the `checkpoint/${FEATURE_ID}-${SF}-done` tag (or `checkpoint/${FEATURE_ID}-done`
     on a simple feature) and the `epic.md` `checkpoint` cell. STEP 16.3's prohibition is rewritten to
     name `add.build` as owner. It runs in both delivery modes. `status.sh`'s `LAST_CHECKPOINT` and
     `done.sh`'s tag cleanup read the same tag name, unchanged, so an interrupted epic resumes at the
     next SF without the tag.
   - The checkpoint records the loop ending, not a clean review: a subfeature that reaches the cap
     with findings still gets its tag only if `converge-gates.sh` passes; if it does not, the loop
     stops at STEP 17 with the gate output, and no tag is written.
5. **Reviewer:** `add-plan-review` and `plan-reviewer-agent` gain a ninth dimension, `Objective fit` —
   fails when a scope item, task or artefact cannot be traced to the stated objective, or when none is
   stated.
6. **New skill `add-delivery-mode`** — the single owner of the delivery-mode rule: `confirm` vs
   `automatic`, deciding vs confirming stops, "a stop that passes through still prints what it would
   have shown", doubt falls toward deciding, `add.done` never reached unattended. Every stage points
   to it; none restates it.
7. **Remove `add.plan-to-ready`** — source, `provider-map.json`, `/add` router, `add-ecosystem`, every
   artefact that names it, tests, README and web docs.

**How the TDD and QA fragments behave in automatic mode** — they are injected into `add.plan`,
`add.build` and `add.review`, so they run inside the chain. Their stops are classified:

| Stop | Where | Automatic mode |
|---|---|---|
| Present QA findings and CONFIRM before fixing | `fragments/qa-pipeline/add.build.md` step 2 | **confirming** — prints the rows, fixes every routable one |
| Manual routes (`data-seed`, `env-boot`), capability-invalid routes, `@ux-agent` rows missing a citation | same file, step 3 | **deciding** — stops |
| No `## Fix Routing` section | same file, step 3 | error stop — stops |
| Test still failing after 3 iterations | `fragments/tdd-pipeline/add.build.md` | **deciding** — stops |
| `add.qa-setup` installs and confirmations | separate command | **outside the chain** — without its receipt the review skips QA steps, as today |

**Alternatives considered:**

| Alternative | Why not |
|---|---|
| Keep `add.plan-to-ready` and add the automatic mode beside it | Two unattended routes kept consistent by hand; the internal layer already proved one chain is enough |
| Fold the epic outer loop and checkpoint sequence into the chain unconditionally | A long unattended run with no one looking; replaced by the explicit automatic / semi-automatic question at the split |
| Dispatch `plan-reviewer-agent` over the brainstorm document, as internally | Re-adds a dispatch the ceremony rebalance removed on purpose; `Objective fit` already runs at `add.new` (full path) and `add.plan` |
| Put the delivery-mode rule in `add-doc-schemas/references/` | Mixes a flow rule into a document-schema skill |
| A three-review cap (like `add.plan-to-ready`) | User chose two reviews |

## Type of Artefact

workflow — changes to five commands, two fragments, three skills, one agent; one new skill; one
command removed.

## Scope

### Includes
- `add.brainstorm`: objective draft, section checklist, named outside practice with repo-wins, caller check, document always on `architectural`, self-review, three-option approval, inline `about.md` offer removed
- `add.new`: reads `delivery:`, `Serves` column, SF objective membership check, automatic/semi-automatic question on epic split
- `add.plan`: `## Objective` copied, `Delivery:` header, preview before writing
- `add.build` / `add.review`: automatic handoffs and the two-review loop ending at STEP 17
- `add.build`: owns "The Checkpoint Sequence" moved from `add.plan-to-ready` (gate, commit, tag, `epic.md` `checkpoint` cell); STEP 16.3 rewritten
- `fragments/qa-pipeline` and `fragments/tdd-pipeline`: stops classified per the table above
- `add-plan-review` + `plan-reviewer-agent`: `Objective fit`
- `add-doc-schemas`: `brainstorm-intent` gains `delivery:`; `feature-plan` gains `## Objective`; about Decisions gains `Serves`
- `add-feature-specification`, `feature-about-template.md`: the `Serves` column
- New skill `add-delivery-mode`, registered in `provider-map.json`
- Removal of `add.plan-to-ready` and every reference to it (`add`, `add-ecosystem`, the nine dependants, `cli/tests`, README, `web/`)

### Does NOT Include
- Umbrella / SET documents in the product brainstorm — the epic split in `add.new` is the product's set
- Any change to `add.done` — `--merge` and `--first-parent` already shipped
- `add.diagnose`, `add.hotfix`, `add.qa-setup` joining the automatic chain
- An agent review of the brainstorm document
- Epic runs with no automatic / semi-automatic question
- The `--yolo` flag of `add.review` — untouched

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Draft the objective and have the user correct it | the objective is drafted in the brainstorm | Asking cold hands the work back; proven internally | ✅ |
| Brainstorm document always written on `architectural` | the approved design exists to travel | The superpowers flow: write the spec, then approve, then plan | ✅ |
| Self-review checklist, no agent over the brainstorm | one approval without added ceremony | Keeps the rebalance's dispatch cut; `Objective fit` runs later | ✅ |
| Three-option approval replaces the inline `about.md` offer | one approval carries the delivery | The offer wrote `about.md` with no id, directory or gate; `/add.new` does all of it | ✅ |
| WebSearch kept, named source required, repository wins | the brainstorm conducts exploration like the internal one | Product runs in a user's project, where search helps; the name is what makes it checkable | ✅ |
| `Objective fit` as ninth reviewer dimension | the objective travels to the reviewer | Eight dimensions passed work that served nothing | ✅ |
| `## Objective` copied into `plan.md` | the objective travels to the plan | The reviewer reads the plan; a reference is a read it may skip | ✅ |
| Loop `build → review`, at most two reviews, then STEP 17 | unattended delivery up to the PR question | User's cap; remaining findings shown, never silently dropped | ✅ |
| Commands hand off to each other; round counted from `review-NNN.md` | unattended delivery up to the PR question | No orchestrator command needed; disk is the counter, not memory | ✅ |
| Epic split asks automatic vs semi-automatic | unattended delivery up to the PR question | An epic is one branch and one PR; the user decides how long to run unwatched | ✅ |
| QA "confirm before fixing" is confirming; manual routes and TDD 3-strike are deciding | unattended delivery up to the PR question | Otherwise the loop blocks on a stop that decides nothing | ✅ |
| New skill `add-delivery-mode` owns the rule | one approval carries the delivery | Five commands read one rule; no product mirror of `add-plan-authoring` exists | ✅ |
| `add.build` owns the checkpoint tag, after `converge-gates.sh` | unattended delivery up to the PR question | Keeps one tag owner and epic resume; `status.sh` and `done.sh` read the same tag unchanged | ✅ |
| Remove `add.plan-to-ready` | `add.plan-to-ready` is no longer needed | The chain replaces its loop; its epic loop is replaced by the split question | ✅ |
| One design document, not an umbrella | — does not serve a part; a sizing choice | The three themes edit the same commands; splitting would plan the same files three times. The planner phases it | ✅ |

## Ecosystem Impact

Layer: every artefact below is **product**, except the ported-from sources which are not changed.

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add.brainstorm` | `add`, `add.new`, `add-feature-specification` | Exploration conduct, document, approval, handoff | Rewrite STEPS 2–5 |
| `add.new` | `add`, `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add-doc-schemas`, `add-feature-specification`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline`; fragment `plugins/gitnexus/fragments/add.new.md` | Reads `delivery:`, SF objective check, epic split question | Edit |
| `add.plan` | agents `consistency`, `test`, `ux`, `ux-flow`; 5 commands; fragments `qa-pipeline`, `tdd-pipeline`, `plugins/gitnexus`; 8 skills (discovery report) | Objective, `Delivery:` header, preview, handoff | Edit; check both fragments' stops |
| `add.build` | `ux-agent`, `add`, `add.done`, `add.new`, `add.plan`, `add.plan-to-ready`, `add.qa-setup`, `add.review`; fragments `qa-pipeline`, `tdd-pipeline`; 6 skills | Hands to review; STEP 17 conditional by state | Edit |
| `add.review` | agents `consistency`, `e2e`, `qa`, `ux`; commands `add`, `add.build`, `add.done`, `add.plan`, `add.plan-to-ready`, `add.qa-setup`; fragments `qa-pipeline`, `tdd-pipeline`, `plugins/playwright`; skills `add-delivery-validation`, `add-id-convention`, `add-qa`, `add-qa-migration` | Round count, hand back to build or to STEP 17 | Edit |
| `fragments/qa-pipeline/add.build.md` | injected into `add.build` | Stops classified | Edit |
| `fragments/tdd-pipeline/add.build.md` | injected into `add.build` | 3-strike stop classified deciding | Edit |
| `add-plan-review` | `plan-reviewer-agent`, `add.new`, `add.plan`, `add-cross-sf-consistency`, `add-doc-schemas`, `add-feature-readback`, `add-review-discipline` | Ninth dimension | Edit |
| `plan-reviewer-agent` | `add.new`, `add.plan`, `add.plan-to-ready`, `add-cross-sf-consistency`, `add-feature-readback`, `add-plan-review`, `add-review-discipline` | Ninth dimension | Edit |
| `add-doc-schemas` | 22 artefacts (14 commands, 1 fragment, 7 skills incl. `plan-reviewer-agent`) | `brainstorm-intent.delivery`, `feature-plan` `## Objective`, `Serves` | Edit schemas; gates of every caller keep passing |
| `add-feature-specification` | `discovery-agent`, `add.brainstorm`, `add.new` | `Serves` column; no longer reached from the brainstorm offer | Edit |
| `add-ecosystem` | `add`, `add.audit`, `add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.plan`, `add.wiki` | Topology: chain, loop, command removed | Edit |
| `add` | none (entry point) | Router drops `add.plan-to-ready` | Edit |
| `converge-gates.sh`, `status.sh`, `done.sh` | `add.done`, `add.plan-to-ready` (removed), `add.build` (new caller of `converge-gates.sh`) | Checkpoint tag name and `LAST_CHECKPOINT` unchanged; `add.done` STEP prose naming `add.plan-to-ready` as tag creator goes stale | Scripts unchanged; fix `add.done` wording |
| `add.plan-to-ready` | `add`, `add.build`, `add.done`, `add.plan`, `add-cross-sf-consistency`, `add-delivery-validation`, `add-plan-review`, `add-review-discipline`, `add-tasks-checklist` | Removed | Delete; sweep all nine plus `CLAUDE.md` inventory |
| `add-delivery-mode` (new) | none yet — all five stages will | New owner | Create, register |
| `cli/tests` | not graph nodes | `build`, `graph-query`, `inventory`, `loop-consolidation-0070`, `product-close-out-parity`, `qa-reachability.smoke`, `test-terminal-states-qa-boundary` name `add.plan-to-ready`; `review-no-loops` pins reviewer dimensions and the product/internal isolation guard (L3.9) | Update |
| `README.md`, `web/` | not graph nodes | Name `add.plan-to-ready` | Via `add-framework--sync` |

What the graph does not cover here: `CLAUDE.md` (the inventory line lists `add.plan-to-ready` — regenerated by `scripts/inventory.js`), `cli/tests`, `README.md`, `web/`.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One approval carries a feature to the PR question | The user sees no code until the PR question in automatic mode |
| The objective is checked at review | One more reviewer dimension that can fail a plan |
| One unattended route instead of two | `add.plan-to-ready`'s third review round and its unconditional epic loop |
| The approved design is always on disk | A document written on every architectural brainstorm |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A command following another command's file behaves differently across the 5 providers | Med | Handoff is "read and follow `{{cmd:NAME}}`", plain markdown every provider can read; no provider-specific tool |
| A findings-remaining second review reaches the PR question and the user merges unfixed work | Med | STEP 17 prints the remaining findings before asking; the merge stays with `add.done`, never unattended |
| A fragment stop left unclassified blocks the loop | Med | Every stop in both fragments is in the table above; the plan carries it as a checklist |
| Removing `add.plan-to-ready` leaves a stale reference | Med | Graph `impact` sweep of the nine dependants + grep of `cli/tests`, `README.md`, `web/`, `CLAUDE.md` |
| `review-no-loops` L3.9 isolation guard trips on internal wording copied into product | Low | Port by meaning, never copy `add-framework--` names |
| Moving the checkpoint sequence loses a guard `add.plan-to-ready` had (row flip before commit, pre-check step 0) | Med | Move the section whole, in its order, and keep its tests pointed at the new owner |
| Round counting miscounts when a user ran `add.review` by hand before | Low | Count only `review-NNN.md` written after the plan's build started; the plan settles the exact rule |

## Next Steps

Run: `/add-framework--plan product pipeline parity`

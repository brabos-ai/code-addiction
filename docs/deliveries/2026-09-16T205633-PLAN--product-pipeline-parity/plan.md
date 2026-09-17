# Plan: Product Pipeline Parity — the objective travels, one approval chains the stages, `add.plan-to-ready` goes

> **Status:** implemented
> **Layers:** both
> **Type:** workflow
> **Created:** 2026-09-16
> **Delivery:** automatic

---

## Objective

When this is done, a user of the installed framework gets the same pipeline this repository already
runs internally: `add.brainstorm` conducts exploration the way `add-framework--brainstorm` does, the
feature's objective is drafted in the brainstorm and travels through `about.md` and `plan.md` to the
reviewer, and one approval can carry a delivery unattended up to the PR question. Today the objective
is lost after the brainstorm, every stage asks for an approval that decides nothing, and bounded
convergence lives in a separate command — `add.plan-to-ready` — that this change removes.

**When this build is done:** an installed project can run `/add.brainstorm`, pick "deliver
automatically", and reach `/add.build`'s PR question with no further input unless a deciding stop
fires; the objective is a named section in every document on the way and a reviewer dimension at the
end; and no artefact, test or doc in the product layer still names `add.plan-to-ready`.

## Context

Three internal-layer deliveries of 2026-09-16 proved the mechanisms on this repository's own pipeline
and deferred the product layer explicitly.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-16T203401-product-pipeline-parity.md` | The design: the seven parts of the solution, the fragment stop table, alternatives, Key Decisions with `Serves`, Ecosystem Impact with callers |
| `docs/brainstorming/2026-09-16T203401-product-pipeline-parity-intent.md` | `path: architectural`, `delivery: automatic`, sixteen closed decisions, `## Open` = `None` |

Ported from: `docs/changelog/2026-09-16T072716-refactor-pipeline-ceremony-rebalance.md`,
`docs/changelog/2026-09-16T144210-feat-objective-as-anchor.md`,
`docs/changelog/2026-09-16T151938-refactor-the-pipeline-chains.md`. The internal counterparts to read
while porting: `.claude/skills/add-framework--brainstorm/SKILL.md` (STEPS 2, 4, 7),
`.claude/skills/add-plan-authoring/SKILL.md` (The Delivery Mode, The Plan Preview),
`.claude/agents/plan-review-agent.md` (dimension `Objective fit`).

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Never write a raw `.codeadd/` path; use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}` — scripts excepted, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- The product plan-review skill names no internal command: `add-plan-review/SKILL.md` contains no `add-framework--` (cli/tests/review-no-loops.test.js, L3.9) — applies to every product artefact touched here: port by meaning, never copy internal names
- `structuredQuestions` is `true` for `claude` only (framwork/provider-map.json:8); every structured question keeps its option-table fallback
- Absent `delivery:` means `confirm` — the fall is toward waiting (.claude/skills/add-plan-authoring/SKILL.md, The Delivery Mode)
- `/add.done` is never reached unattended (intent file, Decided)
- Review loop cap: at most two `add.review` runs per delivery unit in automatic mode, then `add.build` STEP 17 (intent file, Decided)
- The checkpoint tag name stays `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done`, because `status.sh:358-360` and `done.sh:468-479` read it by that name
- Local cli suite rewrites the sidecars while it runs; attribute a failure by running the single test file; CI is the verdict (memory: project_cli_suite_unstable_local)

## Problem

1. **The objective is lost after the brainstorm** — the product `brainstorm` schema bans final decisions, the `feature` and `feature-plan` schemas carry no objective, and `add-plan-review` has eight dimensions, none asking what the work is for.
2. **Every stage transition waits** — no `delivery:` field exists; `add.build` STEP 17 and every confirmation screen stop regardless of whether anything is left to decide.
3. **Two routes to convergence** — `add.plan-to-ready` (958 lines) duplicates what a chained pipeline does, and it is the sole owner of three capabilities the chain needs: the checkpoint tag, the `@consistency-agent` dispatches, and the epic-wide gate.
4. **The product brainstorm conducts exploration less strictly than the internal one** — no drafted objective, no section checklist, no "repository wins", document only on request.

## Proposal

Port the three internal mechanisms by meaning, in the order their consumers need them: first the rule
and the schemas every stage reads, then the stages along the chain, then the removal once every
capability `add.plan-to-ready` owned has a new owner, then tests and the internal sweep.

**Rulings taken at planning, from analysis the design did not have** (each is a derivable adaptation,
recorded here rather than asked):

| Ruling | Why | Cost if wrong |
|---|---|---|
| The product `brainstorm` schema is rewritten as a design document (Objective, decisions, scope) | Its current hard ban on final decisions contradicts the approved "always write the spec, then approve" flow | Existing brainstorm docs in user projects stay in the old shape; nothing re-validates them |
| `Serves` lives in the brainstorm document and the intent file's `## Decided`, not in `about.md` | The `feature` schema has no decisions table; `feature-about-template.md` is retired and is not touched | A reader of `about.md` alone sees the objective but not which decision serves which part |
| `brainstorm-intent` gains `## Objective` | On `bounded` no brainstorm document exists, so the intent file is the only carrier to `about.md` | One more section in a one-screen file |
| `@consistency-agent` FULL pass moves to `add.plan` (epic, after consolidation); DELTA pass and the epic-wide `converge-gates.sh` run move into `add.build`'s checkpoint sequence | `add.plan-to-ready` is their only dispatcher. `add.plan` already declares the agent and its STEP 9.5 consumes FULL-pass findings (`add.plan.md:22,634-655`), but it does not dispatch; removing the command orphans the dispatch | A cross-SF contradiction reaches the PR undetected |
| The checkpoint sequence stays epic-only | It is epic-only today (`add.plan-to-ready.md:350-353`) | A simple feature has no resume tag, as today |
| `add.review` STEP 1.1 staging question is confirming (auto-stage, as `--yolo` does); spec-audit non-compliance, tree-modified self-check and implementation-incomplete stay deciding | Staging decides nothing once `add.build` commits per task; the others are findings no approval covered | A spec-audit stop halts the automatic chain more often than a finding would |

## Scope

### Includes

#### Phase 1 — The rule and the schemas

- **F1** [product] — `framwork/.codeadd/skills/add-delivery-mode/SKILL.md` (new) + `framwork/provider-map.json`: the single owner of the delivery mode for the product pipeline — the two values and their carriers (intent file `delivery:` read by `add.new` and `add.plan` → plan.md `Delivery` header read by `add.build` and `add.review`; `epic.md` `delivery:` note for the epic run), absent means `confirm`, deciding vs confirming by state, "does not wait never means does not print", doubt falls to deciding, the stops deciding in every state (`add.build` STEP 17 with no PR; the fix-agent breaker; every stop in `add.done`), how a command hands off (read and follow `{{cmd:NEXT}}` — plain markdown every provider reads), and the review-loop round rule: `add.build` STEP 1, on the first entry of a delivery unit in automatic mode, records the highest existing `review-NNN` as a baseline line in the build ledger; only `review-NNN.md` numbered above that baseline count as rounds; cap two. Register in `provider-map.json` for all five providers. Must not restate any command's own stop table. Ref: design § Proposed Solution 6; internal model `.claude/skills/add-plan-authoring/SKILL.md` § The Delivery Mode.
  - **Produces:** skill `add-delivery-mode`; carriers `delivery: confirm|automatic` and `> **Delivery:**`; stop kinds `deciding` / `confirming`
- **F2** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` + `SKILL.md`:
  - `brainstorm` schema rewritten as a design document — sections `TL;DR · Objective · Discovery · Problem · Candidate Directions · Scope · Key Decisions · Ecosystem Impact · Trade-offs & Risks · Open Threads`; Key Decisions columns `Decision | Serves | Rationale`; Candidate Directions carries the recommendation and the named source; Ecosystem Impact carries a `Used by` column (`NOT VERIFIED` never blank); Open Threads reads `None`. The ban on final decisions goes; the bans on code and implementation steps stay.
  - `brainstorm-intent`: frontmatter gains `delivery: confirm|automatic`; sections gain `Objective` first; `Decided` bullets name the part of the objective they serve.
  - `feature`: sections gain `Objective` after `TL;DR`, depth floor "copied from the intent file's `## Objective`; with no intent file, drawn from the conversation and marked `[from conversation, no brainstorm]`".
  - `feature-plan`: sections gain `Objective` after `TL;DR` (copied verbatim from `about.md`, plus one line on what is true once built); frontmatter or header carries `Delivery`.
  - `epic`: the `checkpoint` column rule names `/add.build` as the writer; `new-feature.md:216` and `SKILL.md:306` stop naming `add.plan-to-ready`.
  - Must not lose: the brainstorm-intent narrowing declaration and the one-screen cap.
  - **Produces:** section `## Objective` in schemas `brainstorm`, `brainstorm-intent`, `feature`, `feature-plan`; frontmatter key `delivery`
- **F3** [product] — `framwork/.codeadd/skills/add-plan-review/SKILL.md` + `framwork/.codeadd/agents/plan-reviewer-agent.md`: ninth dimension `Objective fit` — fails when a scope item, task or requirement cannot be traced to the document's `## Objective`, or the document states none; distinguished from `Gold-plating` in one line. The agent's "eight mandatory dimensions" wording becomes nine. `add-plan-review/SKILL.md:17,28` stop naming `add.plan-to-ready`. Ref: `.claude/agents/plan-review-agent.md` dimension 9.
  - **Consumes:** section `## Objective` in schemas `brainstorm`, `brainstorm-intent`, `feature`, `feature-plan` (F2)

#### Phase 2 — The stages along the chain

- **F4** [product] — `framwork/.codeadd/skills/add-feature-specification/SKILL.md`: extracts `## Objective` from the intent file into `about.md`'s `## Objective` without asking; with no intent file, drafts one and has the user correct it. Drops the description of being loaded by `/add.brainstorm`'s offer (that offer is removed in F5). Must not lose: Phase 2's no-re-ask extraction and the three-fact test.
  - **Consumes:** section `## Objective` in schemas `brainstorm`, `brainstorm-intent`, `feature`, `feature-plan` (F2)
- **F5** [product] — `framwork/.codeadd/commands/add.brainstorm.md`:
  - STEP 2 opens with the drafted objective the user corrects, before any other question; then the refining questions.
  - Section checklist scaled by path (architectural all; bounded Scope, Ecosystem Impact, Key Decisions; spike none).
  - Outside practice: WebSearch kept, the source is named, "repository wins" on conflict.
  - Ecosystem Impact asks who uses each changed area through `add-knowledge-discovery`'s GRAPH step; `NOT VERIFIED` when no graph.
  - STEP 3 writes the document **always** on `architectural` (no longer "only if user requests"), then a self-review checklist (objective present, Open Threads `None`, `Serves` filled, no contradiction) — no agent dispatch.
  - STEP 5 ends on one structured question with three options (confirm each stage / deliver automatically / keep discussing), classified deciding; writes `delivery:` and `## Objective` into the intent file; on automatic, prints the handoff and reads and follows `{{cmd:add.new}}` with the intent file. The inline "write `about.md` now" offer is removed, and so is the loading of `add-feature-specification` from this command.
  - The NO-INVOKE gate gains the one authorised chain, mirroring the internal skill; `/add.diagnose` and `/add.hotfix` routes stay text-only; `spike` writes nothing and is asked no three-option question.
  - Must not lose: the three paths, one-way ratchet, "approval never scales", red-flag table, INDEX/GRAPH prior-work load, the brainstorm-intent validation gate.
  - **Consumes:** skill `add-delivery-mode` (F1); frontmatter key `delivery` (F2); section `## Objective` in schemas `brainstorm`, `brainstorm-intent`, `feature`, `feature-plan` (F2)
- **F6** [product] — `framwork/.codeadd/commands/add.new.md`:
  - STEP 1.1 reads `delivery:` (absent → `confirm`) and `## Objective`.
  - STEP 4 confirmation screen: confirming when `## Open` is `None`, deciding otherwise.
  - STEP 5 decomposition: each proposed SF states in one line how it serves the feature objective; an SF that cannot STOPs naming the two readings without picking. On `automatic`, after the split is accepted, one deciding question: continue automatic (every pending SF in dependency order, PR question once at the end) or semi-automatic (stop between SFs). The answer is recorded in `epic.md` (a `delivery:` line under `## Notes`) so `add.build` reads it without memory.
  - Completion: the next-command suggestion is unchanged on `confirm`; on `automatic`, reads and follows `{{cmd:add.plan}}` with the feature id.
  - Must not lose: id allocation, `init.sh`, the schema gate, STEP 8's full-path reviewer.
  - **Produces:** `epic.md` `## Notes` line `delivery: automatic|semi-automatic`
  - **Consumes:** skill `add-delivery-mode` (F1); frontmatter key `delivery` (F2)
- **F7** [product] — `framwork/.codeadd/commands/add.plan.md`:
  - Reads the delivery mode from the intent file named by `about.md`'s context or the latest `brainstorm-intent` whose `id` matches, else `confirm`; on an epic SF, the `epic.md` `delivery:` note takes precedence.
  - plan.md gets `## Objective` copied verbatim from `about.md` plus the "when built" line, and `Delivery` in its header (STEP 9.1).
  - Plan preview (objective, phases/areas, order and why, risk per area, excluded) printed before STEP 9 writes the plan, inside an existing stop; confirming.
  - **Epic mode:** after consolidation and review, dispatch `@consistency-agent` `mode: FULL` against converged siblings, acting on findings as `add.plan-to-ready.md:544-590` does today; 9.5's text now names `/add.plan` as the dispatcher.
  - Stops classified: `feature_identified`, `docs_loaded`, `coverage_validated`, blocked review = deciding.
  - STEP 13 next command: `/add.build`; on `automatic`, reads and follows `{{cmd:add.build}}`. The `add-ecosystem` lookup naming `plan-to-ready` goes.
  - **Consumes:** skill `add-delivery-mode` (F1); section `## Objective` in schemas `brainstorm`, `brainstorm-intent`, `feature`, `feature-plan` (F2); `epic.md` `## Notes` line `delivery: automatic|semi-automatic` (F6)
- **F8** [product] — `framwork/.codeadd/commands/add.build.md`:
  - STEP 1 reads `Delivery` from plan.md (absent → `confirm`) and, on the first entry of a delivery unit in automatic mode, records the review-round baseline in the ledger per `add-delivery-mode`.
  - **The Checkpoint Sequence** moves here from `add.plan-to-ready.md:337-486`, whole and in order (step 0 Fix-Routing blocker pre-check, row flip + checkpoint cell, guarded staging, commit carrying the six gate lines from `converge-gates.sh`, annotated tag, push of branch and tag), epic only. It runs when an SF's review loop ends. On the last SF it is preceded by the `@consistency-agent` `mode: DELTA` dispatch and followed by the epic-wide `converge-gates.sh` run requiring `GATE_EPIC=ok` (from `add.plan-to-ready.md:287-333`).
  - STEP 16.3 rewritten: `add.build` is the one tag owner, and only inside the sequence; STEP 16.4 keeps flipping `status` and now writes `checkpoint` only through the sequence.
  - STEP 18 on `automatic`: after development or a correction round, reads and follows `{{cmd:add.review}}`.
  - Between SFs on an epic: `automatic` continues to the next pending SF's `/add.plan`; `semi-automatic` stops (deciding) showing what the SF delivered and what the next one will do.
  - STEP 17 classified by state: deciding when no PR exists (the terminus), confirming once one exists; prints the remaining `## Fix Routing` rows of the last review before asking.
  - STEP 3's "all SFs complete → suggest /add.done" stays deciding.
  - Must not lose: STEP 12's two outcomes as they are — build still red after `MAX_ATTEMPTS = 3` is a deciding stop; findings still open after the attempts are ruled into the ledger and the session does NOT stop, in every delivery mode. Also the ledger rules and "never merges".
  - **Produces:** `add.build` owns `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done`
  - **Consumes:** skill `add-delivery-mode` (F1); `epic.md` `## Notes` line `delivery: automatic|semi-automatic` (F6)
- **F9** [product] — `framwork/.codeadd/commands/add.review.md`: on `automatic` (read from plan.md), STEP 1.1's staging question is confirming (auto-stage, as `--yolo`); after STEP 11.3, count this delivery unit's review rounds per `add-delivery-mode`: round 1 with unresolved routable `## Fix Routing` rows → read and follow `{{cmd:add.build}}` (CORRECTION MODE is detected there from the rows); round 1 clean, or round 2 either way → read and follow `{{cmd:add.build}}` at its loop end (checkpoint on epic, then STEP 17 or next SF). Stops at STEP 1.2, 3 and 7.5 stay deciding. Must not lose: read-only guarantee and self-check; `review-NNN.md` numbering.
  - **Consumes:** skill `add-delivery-mode` (F1); `add.build` owns `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done` (F8)
- **F10** [product] — `framwork/.codeadd/fragments/qa-pipeline/add.build.md` + `framwork/.codeadd/fragments/tdd-pipeline/add.build.md`: classify each stop per the design's fragment table — QA "present and CONFIRM before fixing" is confirming (prints, then fixes every routable row); manual routes, capability-invalid routes, uncited `@ux-agent` rows and missing `## Fix Routing` are deciding; TDD "still failing after 3 iterations" is deciding. The fragments' `<!-- uses: -->` declare `add-delivery-mode`. Also check `fragments/*/add.plan.md` and `add.review.md` and `plugins/*/fragments/` for any user-facing stop; classify any found (discovery found none beyond WAIT-ALL).
  - **Consumes:** skill `add-delivery-mode` (F1)

#### Phase 3 — Remove `add.plan-to-ready`

- **F11** [product] — delete `framwork/.codeadd/commands/add.plan-to-ready.md`; remove its entry at `framwork/provider-map.json:77`; remove every product reference: `commands/add.md:13,162` (router row becomes "or choose automatic delivery in `/add.brainstorm`"), `commands/add.done.md:15,931` (tag creator is `/add.build`), `commands/add.build.md` leftovers, `commands/add.plan.md:34,644,762` leftovers, `scripts/converge-gates.sh:14` (comment names `/add.build`), `scripts/log-jsonl.sh:11` (drop the enum value only if nothing else logs it), `agents/consistency-agent.md:3` (dispatched by `/add.plan` and `/add.build`), skills `add-claude-md-style:131`, `add-commit:85,125`, `add-cross-sf-consistency:23,28,35,41,75`, `add-delivery-validation:10,65`, `add-ecosystem` (~48 hits: command table, agent roster, dependency index, Main Flows "Autonomous" row becomes brainstorm → new → plan → (build ⇄ review ≤2) → PR question, routing rows l.304/306), `add-feature-readback:39,272`, `add-knowledge-discovery:32`, `add-resource-path-convention:16`, `add-review-discipline:19,116`, `add-tasks-checklist:13,27,173,182,186,260,271,276,285`. Each replacement names the new owner, never just deletes the sentence.
  - **Produces:** `add.plan-to-ready` absent from the product layer
  - **Consumes:** `add.build` owns `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done` (F8)

#### Phase 4 — Tests and the internal sweep

- **F12** [product] — `cli/tests/`: new `product-pipeline-parity.test.js` carrying L1 below (written RED first); update `inventory.test.js:73-154` (sort-order test drops `add.plan-to-ready`), `loop-consolidation-0070.test.js:325-327,486` (L5.2 now asserts absence), `product-close-out-parity.test.js:37,690,789` (L14.5 guard moves to `add.build`'s checkpoint sequence), `qa-reachability.smoke.test.js:567-578` (drop `add.plan-to-ready` from the resolver list), `test-terminal-states-qa-boundary.test.js:577,600` (L4.2/L4.4 assert `add.build` only), comments in `build.test.js:271` and `graph-query.test.js:304`.
  - **Consumes:** skill `add-delivery-mode` (F1); `add.build` owns `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done` (F8); `add.plan-to-ready` absent from the product layer (F11)
- **F13** [internal] — `CLAUDE.md` inventory regenerated with `node scripts/inventory.js` (never hand-edited; adds `add-delivery-mode`, drops `add.plan-to-ready`); `scripts/inventory.js:79` and `scripts/smoke-test.sh:47` comments; `.claude/commands/add-framework--sync.md:211`; `.claude/skills/add-framework-development/SKILL.md:229`; `README.md:94,112` (flow text and the mermaid edge); text references in `web/src/pages/docs.astro:233,393,491` and its graph node/edges `982-1126`.
  - **Consumes:** `add.plan-to-ready` absent from the product layer (F11)

### Does NOT Include (important!)

- Umbrella / SET documents in the product brainstorm — the epic split is the product's set
- Changes to `status.sh`, `done.sh`, `converge-gates.sh` beyond comments — the tag name is unchanged on purpose
- `web/public/*.svg` and `artefact-graph.mmd` — regenerated by `/add-framework--sync` before release
- `add.diagnose`, `add.hotfix`, `add.qa-setup` joining the chain
- An agent review of the brainstorm document
- `feature-about-template.md` — retired; not revived
- A migration for existing brainstorm docs in user projects — nothing re-validates them; the installer already removes obsolete command files on update (`cli/src/installer.js:299-315`)
- `add.review --yolo` — untouched

## Validated Decisions

All sixteen decisions under `## Decided` in the intent file, plus the six planning rulings in Proposal.

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Who owns the delivery-mode rule | New skill `add-delivery-mode` | Intent, Decided |
| Loop shape | build → review, ≤2 reviews, then STEP 17 with remaining findings | Intent, Decided |
| Epic in automatic mode | Question at split: automatic or semi-automatic | Intent, Decided |
| Checkpoint owner | `add.build` | Intent, Decided; design § Proposed Solution 4 |
| Brainstorm review | Self-review, no agent | Intent, Decided |
| `@consistency-agent` home | FULL in `add.plan`, DELTA in `add.build` | Proposal, rulings |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One approval carries a feature to the PR question | The user sees no code until that question in automatic mode |
| One unattended route | `add.plan-to-ready`'s third review round and its `3 × N_SF` global backstop |
| The objective is checked at review | One more dimension that can fail a document |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A capability of `add.plan-to-ready` is lost in the move (pre-check, epic-wide gate, DELTA judge, resume) | Med | F8 moves the section whole; L1.7–L1.9 assert each piece exists in `add.build`; L2.3 asserts `consistency-agent` is not an orphan |
| A stop left unclassified blocks the automatic chain | Med | F10 walks every fragment; L1.12 asserts the fragment classifications; L3 scenario 6 walks the fragments enabled |
| A stale `plan-to-ready` reference survives | Med | L1.2 greps the product tree and `cli/src`; F13 covers the internal files the graph cannot see |
| Command-follows-command behaves differently across providers | Med | Handoff is "read and follow `{{cmd:}}`" — plain markdown; no provider tool; L1.10 |
| The round counter miscounts after a manual `/add.review` | Low | F1 and F8 record a baseline at `add.build` STEP 1; L1.13; L3 scenario 7 |
| Copying internal wording trips L3.9 | Low | Global Constraints; L2.4 runs `review-no-loops.test.js` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add-delivery-mode/SKILL.md` | product | create | F1 |
| `framwork/provider-map.json` | product | modify | F1 register, F11 remove |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | F2, F11 |
| `framwork/.codeadd/skills/add-plan-review/SKILL.md` | product | modify | F3, F11 |
| `framwork/.codeadd/agents/plan-reviewer-agent.md` | product | modify | F3 |
| `framwork/.codeadd/skills/add-feature-specification/SKILL.md` | product | modify | F4 |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F5 |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F6 |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F7, F11 |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F8, F11 |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F9 |
| `framwork/.codeadd/fragments/qa-pipeline/add.build.md` | product | modify | F10 |
| `framwork/.codeadd/fragments/tdd-pipeline/add.build.md` | product | modify | F10 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | product | remove | F11 |
| `framwork/.codeadd/commands/add.md`, `add.done.md` | product | modify | F11 |
| `framwork/.codeadd/scripts/converge-gates.sh`, `log-jsonl.sh` | product | modify (comment / enum) | F11 |
| `framwork/.codeadd/agents/consistency-agent.md` | product | modify | F11 |
| `framwork/.codeadd/skills/{add-claude-md-style,add-commit,add-cross-sf-consistency,add-delivery-validation,add-ecosystem,add-feature-readback,add-knowledge-discovery,add-resource-path-convention,add-review-discipline,add-tasks-checklist}/SKILL.md` | product | modify | F11 |
| `cli/tests/product-pipeline-parity.test.js` | product | create | F12 |
| `cli/tests/{inventory,loop-consolidation-0070,product-close-out-parity,qa-reachability.smoke,test-terminal-states-qa-boundary,build,graph-query}.test.js` | product | modify | F12 |
| `CLAUDE.md` | internal | modify (generated) | F13 |
| `scripts/inventory.js`, `scripts/smoke-test.sh` | internal | modify (comment) | F13 |
| `.claude/commands/add-framework--sync.md`, `.claude/skills/add-framework-development/SKILL.md` | internal | modify | F13 |
| `README.md`, `web/src/pages/docs.astro` | internal | modify | F13 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write L1 in `cli/tests/product-pipeline-parity.test.js` before F1 lands and
verify each assertion fails against the current tree.

### L1 — Static contract (RED → GREEN)

1. `framwork/.codeadd/skills/add-delivery-mode/SKILL.md` exists and `provider-map.json` registers it. *RED: file absent.*
2. `add.plan-to-ready.md` absent; `provider-map.json` has no `add.plan-to-ready`; zero `plan-to-ready` hits under `framwork/.codeadd/` (excluding the gitignored `artefact-graph.json`) and `cli/src/`. *RED: 60+ hits.*
3. `add-plan-review/SKILL.md` lists nine dimensions including `Objective fit`; `plan-reviewer-agent.md` says nine. *RED: eight.*
4. `new-feature.md`: `brainstorm`, `brainstorm-intent`, `feature`, `feature-plan` Sections lines each include `Objective`; `brainstorm-intent` frontmatter includes `delivery:`; `brainstorm` names `Decision | Serves | Rationale` and no longer bans final decisions. *RED: none present.*
5. `add.brainstorm.md` names the three options, drafts the objective before questions, has no "write the feature documentation now" offer, and declares `add-delivery-mode`. *RED.*
6. `add.new.md`, `add.plan.md`, `add.build.md`, `add.review.md` and both `add.build` fragments declare `- skill: add-delivery-mode` in `<!-- uses: -->`. *RED.*
7. `add.build.md` contains the checkpoint sequence: Fix-Routing blocker pre-check, `git tag -a` on `checkpoint/${FEATURE_ID}-${EPIC_CURRENT_SF}-done`, `converge-gates.sh`, and `GATE_EPIC=ok` before the last checkpoint; 16.3 no longer forbids tag creation by ownership elsewhere. *RED.*
8. `add.plan.md` carries a `DISPATCH` statement for `@consistency-agent` with `mode: FULL` and the sibling roster (not only the agent name, which it already declares); `add.build.md` declares the agent and carries a `DISPATCH` with `mode: DELTA`. *RED: neither file dispatches today.*
9. `add.new.md` asks automatic vs semi-automatic at the epic split and requires a serves-line per SF. *RED.*
10. Every handoff in the five stage commands reaches the next through `{{cmd:` — no Skill-tool wording in product source. *RED: no handoffs exist.*
11. `add-feature-specification/SKILL.md` states that `## Objective` is extracted from the intent file into `about.md` without asking, and no longer names `/add.brainstorm`'s offer. *RED: no objective, offer named.*
12. `fragments/qa-pipeline/add.build.md` classifies "present and CONFIRM before fixing" as confirming and the manual/invalid/uncited routes and missing `## Fix Routing` as deciding; `fragments/tdd-pipeline/add.build.md` classifies the 3-iteration failure as deciding. *RED: no classification.*
13. `add-delivery-mode/SKILL.md` names the review-round baseline recorded at `add.build` STEP 1 and the cap of two. *RED: file absent.*

### L2 — Build and graph

1. `node scripts/build.js` exits 0, no new warning.
2. `NODE_OPTIONS= node scripts/graph.js impact add-delivery-mode --depth 1` lists `add.brainstorm`, `add.new`, `add.plan`, `add.build`, `add.review` and both fragments.
3. `graph.js orphans` does not list `consistency-agent` or `add-cross-sf-consistency`.
4. The whole `cli` suite passes (`npm test` in `cli/`), attributing any local failure by running its file alone; CI is the verdict. Includes `review-no-loops.test.js` (L3.9 isolation guard).
5. `node scripts/inventory.js` leaves `CLAUDE.md` with `add-delivery-mode` and without `add.plan-to-ready`.

### L3 — Behavioural acceptance (walked by the build against the final text, recorded in the ledger)

For each scenario, follow the text of the chain with `delivery: automatic` and record every stop hit, its kind, and where the run ends:

1. Simple feature, review round 1 clean → ends at `add.build` STEP 17 (deciding, no PR), no other wait.
2. Simple feature, round 1 has routable findings → build CORRECTION → review round 2 with findings → STEP 17 printing the remaining rows; no third review.
3. Epic, two SFs, `automatic` chosen at split → SF01 loop → checkpoint (tag, row, cell) → SF02 plan → loop → DELTA judge → checkpoint → `GATE_EPIC=ok` → STEP 17 once.
4. Epic, `semi-automatic` → stops (deciding) between SF01's checkpoint and SF02's plan.
5. `delivery:` absent anywhere → every confirming stop waits (the `confirm` fall).
6. Simple feature with `qa-pipeline` and `tdd-pipeline` enabled, round 1 has routable QA rows and one manual `env-boot` row → the QA confirm screen prints and fixing continues; the `env-boot` row stops (deciding).
7. A `review-003.md` already exists from a manual run before the automatic build → the baseline is 003; `review-004` and `review-005` are the two rounds.

**RED expectations against the current tree:** all of L1; L2.2 (node absent), L2.5. L2.3 is green today and must stay green.
**GREEN = all levels pass after F1–F13.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12 → F13

- **L1 test file first**, RED, before F1.
- **F1–F3 first** because every stage points at the rule and the schemas.
- **F8 before F11** because the removal is only safe once the checkpoint sequence, the DELTA judge and the epic-wide gate have their new owner; **F7 before F11** for the FULL judge.
- **F12 after F11** because the old tests assert the command's presence until it is gone.
- Working-state boundaries: after F3 (additive only); after F10 (both routes exist, nothing removed); after F12 (suite green). A build that must stop stops at one of these.
- Per-F-block: run `node scripts/build.js` after every product F-block; run the single affected test file after F3, F8, F11.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, validation levels covering it with pass state, any departure from the design with the section it departs from.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 assertion was never RED.
2. A sentence in the ~60 removed references that was deleted instead of re-pointed at the new owner.
3. A stop in `add.new`, `add.plan`, `add.build` or `add.review` with no kind — grep every `STOP`/`WAIT`/ask in the four files and check each against `add-delivery-mode`.
4. The checkpoint sequence in `add.build` missing a step of `add.plan-to-ready.md:337-486` (step 0 especially).
5. Internal wording (`F-block`, `add-framework--`, `ledger` in its internal sense) copied into a product artefact.

## References

- Design set: `docs/brainstorming/2026-09-16T203401-product-pipeline-parity.md`, `docs/brainstorming/2026-09-16T203401-product-pipeline-parity-intent.md`
- Prior art: `2026-09-15T224612-PLAN--pipeline-ceremony-rebalance` (intent file, spec skill), `2026-09-16T144210-PLAN--objective-as-anchor`, `2026-09-16T170340-PLAN--the-pipeline-chains`, `2026-09-11T014333-PLAN--product-close-out-parity` (merge route already ported)

---

## Next Steps

/add-framework--build product-pipeline-parity

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-16 | Initial creation |
| 2026-09-16 | Implemented in commits bb3b760..d12753a on feat/product-pipeline-parity |
| 2026-09-16 | Review fix-then-ok applied: F4 and F10 gained L1.11/L1.12; L1.8 asserts real dispatch statements; round baseline made operational (F1, F8, L1.13, L3.7); STEP 12's two outcomes split; F11 Produces; fragments scenario L3.6; readback line cite fixed |

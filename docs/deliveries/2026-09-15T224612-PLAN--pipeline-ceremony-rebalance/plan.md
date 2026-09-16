# Plan: Pipeline Ceremony Rebalance — the classification travels, and review scales with it

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-15

---

## Context

Both planning pipelines re-ask what the stage before them already decided, and both pay a review cost nobody had summed. A product feature walking `add.brainstorm → add.new → add.plan` pays six document-level agent dispatches before a line of code exists. The internal pipeline pays fewer dispatches but runs a five-section questionnaire unconditionally, even when the brainstorm it just read guarantees zero open questions.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-14T230018-pipeline-ceremony-rebalance.md` | The intent file's shape and lifecycle, the routing tables for both layers, the three-fact test, the review-trim decisions, the accepted `bounded` risk, the layer asymmetries, and 27 validated decisions |

⛔ **The design document's Ecosystem Impact caller lists predate commits `f1199ca`, `36af434`, `aabb316` and `af3a742`, which landed while it was being written.** `af3a742` removed the owner/product onboarding, taking `add-product-discovery` with it and shifting `add.plan`'s steps down by one. **This plan's Current State table is the authoritative caller map**; where the two disagree, the design is stale and this plan is right. Nothing about the design's *decisions* changed — only the counts it quoted.

Four facts post-date the design and are settled here, not there:

1. `mcp/types.mjs` is a declared type registry, delivered live by `2026-09-14T215936-PLAN--the-document-model-the-mcp-reads`. A new document type belongs in it. `brainstorm-intent` is `work-item`, not `attachment` — an attachment declares an owner mode, and on the `bounded` path there is no owner document in the directory to resolve to.
2. `mcp/reference.md` is generated from that registry and `cli/tests/mcp-document-model.test.js` asserts the two agree, so registering a type without regenerating the reference fails the suite.
3. `add-framework--done` STEP 6.1 already delegates its member list to `add-plan-authoring`'s **The Delivered Home**, so it needs one sentence, not a rewrite.
4. `add-plan-review`'s Input Contract declares `kind` — `feature` | `brainstorm` | `feature-plan`. The kind that survives is spelled `feature`, not `feature-about`.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- HTML comments are stripped at build; injection markers and `<!-- uses: -->` blocks rely on it (CLAUDE.md, Pipeline)
- `mcp/` takes **no dependency at all, `yaml` included**, and its files are `.mjs` (CLAUDE.md, Product Layer — `mcp/`)
- `mcp/` is `[product]` despite sitting at the repository root (CLAUDE.md, Product Layer — `mcp/`)
- `add.brainstorm` and `add.new` both carry `Responses max 20 words. Tables and lists are exceptions` in their own headers — every line this plan adds to either obeys it, and the closing report stays exempt
- `structuredQuestions` is `true` only where the tool was verified against the real provider; unverified providers ship `false` (design doc, Risks)

## Problem

1. **The product handoff is a dead end** — `brainstorm` appears in zero lines of `add.new.md` and `add.plan.md`. The brainstorm writes a document and prints a bare command name; the next command never opens it.
2. **The product light path is keyword-driven** — `SIMPLE` comes from a word list and only skips one step. A one-field change still pays a five-section questionnaire, a reviewer and a readback.
3. **The consultative posture sits one command too late** — `add.new` requires a recommendation under every option table; `add.brainstorm` forces a choice without stating one.
4. **Review cost is cumulative** — six document-level dispatches per product feature; two readbacks read the same directory.
5. **The internal planner re-asks a design it just read** — `add-framework--plan` STEP 4 runs unconditionally, and has no size branch anywhere in STEP 1-7.

## Proposal

The brainstorm of each layer emits a short **intent file** carrying the path it classified and the decisions it closed. The command after it extracts without asking and routes its ceremony on that path. Review survives where the document it judges is load-bearing, and is removed where the intent file replaced its job.

Sequencing logic: the carriers land first (schema, registry, capability flag), then the writers, then the readers, then the skills that describe what the writers and readers now do. Product completes before internal; the two halves share no artefact.

## Current State

| Artefact | Layer | Dependants at depth 1 | Today |
|---|---|---|---|
| `add.brainstorm` | product | 3 — `add`, `add-plan-review`, `add-review-discipline` | Dispatches `@plan-reviewer-agent` + `@readback-agent` at STEP 5; handoff at STEP 6 prints a bare command name |
| `add.new` | product | 11 — `add`, `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `plugins/gitnexus/fragments/add.new.md` (`INJECTS_INTO`), `add-doc-schemas`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline` | Dispatches both agents at STEP 8 on every path; `SIMPLE`/`STANDARD` by keyword at lines 61-62; benchmark duty at line 398 |
| `add.plan` | product | 21 (incl. 3 `INJECTS_INTO`) | Dispatches both agents at **STEP 12**; untouched by this plan |
| `add-plan-review` | product | 8 | Kinds `feature` \| `brainstorm` \| `feature-plan`; 8 dimensions; caps 8/8/5 |
| `add-review-discipline` | product | 5 | Verdict + divergence tables for five sites |
| `add-doc-schemas` | product | 21 | Schema Index by category |
| `mcp/types.mjs` | product | not a node — CLI source, like `cli/src/` | `brainstorm` registered; no intent type |
| `provider-map.json` | product | not a node — the provider registry `build.js` reads | `hooks`, `agentDispatch`, `mcp`, `slashCommands` |
| `add-framework--brainstorm` | internal | 0 — entry point | Routes all three paths to the planner; no per-question recommendation |
| `add-framework--plan` | internal | 2 | STEP 4 unconditional; no size branch |
| `add-plan-authoring` | internal | 3 | Delivered Home has 5 members |
| `add-framework--done` | internal | 0 — entry point | STEP 6.1 delegates its member list |

## Scope

### Includes

#### T1 — The carriers (ref: design § The Intent File, § Key Decisions)

- **F1** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` and `SKILL.md`: add the `brainstorm-intent` schema beside `brainstorm`, and its Schema Index row. It states its narrowing of the Universal Document Requirements explicitly. It must NOT acquire `## TL;DR`, TOC, `related` or `tags` — the one-screen cap is the artifact's purpose, and the skill permits the narrowing in its own words.
  - **Produces:** `brainstorm-intent` — frontmatter `id`, `type`, `created`, `path`, `topic`, `doc`; sections `## Decided`, `## Open`, `## Prior art`, `## Rejected`
- **F2** [product] — `mcp/types.mjs` and `mcp/reference.md`: register `brainstorm-intent` as `kind: 'work-item'`, `requires: ['id']`, and regenerate the reference from the registry. It must NOT be an attachment — no owner document exists on the `bounded` path.
  - **Consumes:** `brainstorm-intent` — frontmatter `id`, `type`, `created`, `path`, `topic`, `doc`; sections `## Decided`, `## Open`, `## Prior art`, `## Rejected` (F1)
- **F3** [product] — `framwork/provider-map.json`: add `structuredQuestions` to `providers.{name}.capabilities` for all five providers, `true` for `claude` only.
  - **Produces:** `providers.{name}.capabilities.structuredQuestions`

#### T2 — The product writer and reader (ref: design § Proposed Solution A/B/C, § How add.new Routes)

- **F12** [product] — `framwork/.codeadd/skills/add-feature-specification/SKILL.md`: becomes the **single writer of `about.md`**, reached from two entry points. It gains the intent-file resolution rule, the extract-without-asking prohibition, the three-fact test and the confirmation screen — everything that decides what goes into the document. It must NOT gain the ID allocation, `init.sh`, the directory creation, the schema gate or the reviewer dispatch: those are orchestration and stay in the command.

  **What happens to the skill's four existing phases, stated so the merge is not left to judgement:**

  | Today | After |
  |---|---|
  | Phase 1 — Check State (documental cache) | Survives unchanged |
  | Phase 2 — Strategic Questionnaire, with its own `## Quick Validation` template | **Superseded.** Questioning is intent-driven now: `## Decided` is extracted, `## Open` is asked, and an empty `## Open` yields the confirmation screen. The `Quick Validation` template goes with it |
  | Phase 3 — Structure Documentation, carrying a full inline `about.md` template (lines 98-177) | **Replaced by a load of the `feature-about` schema from `add-doc-schemas`**, which already owns that shape. This also clears a standing violation of the framework's own rule that templates are never inlined |
  | Phase 4 — Validate and Persist | The persist survives; its validation **defers to the command's schema gate**, per this F-block's exclusion list |
  | Checklist | Survives, rewritten against the phases above |

  ⛔ **The three-fact test lives here as the RULE; `add.new` APPLIES it.** F5's STEP 3 branches on the result to gate its discovery-agent dispatch — the classification is authoring input, the dispatch is orchestration, and neither file restates the other's half.
  - **Consumes:** `brainstorm-intent` — frontmatter `id`, `type`, `created`, `path`, `topic`, `doc`; sections `## Decided`, `## Open`, `## Prior art`, `## Rejected` (F1)
  - **Produces:** `add-feature-specification` writes `about.md` for both entry points
  - **Produces:** the three-fact test's classification, applied by the command to gate discovery

- **F4** [product] — `framwork/.codeadd/commands/add.brainstorm.md`: writes the intent file at the STEP 6 handoff on `bounded` and `architectural`, names its path verbatim in the handoff line, states a concrete recommendation under every set of candidate directions, gains the product-benchmark duty, and drops both agent dispatches from STEP 5 and from its `<!-- uses: -->` block.

  **STEP 6 also offers to continue.** After the handoff line, it asks whether to write the feature documentation now. On yes it loads `add-feature-specification` and writes `about.md` in place; on no it stops, and the printed command stays the alternative.

  **Three places in the same file lock STEP 6 to text-only and must all move together, or the file contradicts itself:**

  | Location | Change |
  |---|---|
  | `⛔ HARD GATE — READ-ONLY + NO-INVOKE` | Add the sentence it already meant: **no command may be invoked, and loading a skill is not invoking a command.** Without it a later reader reconciles the two and deletes the offer |
  | `STEPS IN ORDER`, the STEP 6 row — today `TEXT-ONLY suggestion [HARD STOP]` | Restate as the conditional form: offer, then branch |
  | `Correct handoff shape (the ONLY allowed form the handoff itself may take)` | It locks one fixed template. Extend it to carry both forms — the offer and the printed command |
  | `## Rules` → `NEVER` → *"Invoke another command (Skill tool or slash-command) — handoff is text-only, on every path"* | Drop `Skill tool` from the bullet. The HARD GATE now owns that distinction, and leaving it here is a standing contradiction |

  It must NOT lose the three-path classification, the one-question cadence, or the ban on invoking another command.
  - **Consumes:** `brainstorm-intent` — frontmatter `id`, `type`, `created`, `path`, `topic`, `doc`; sections `## Decided`, `## Open`, `## Prior art`, `## Rejected` (F1)
  - **Consumes:** `providers.{name}.capabilities.structuredQuestions` (F3)
  - **Consumes:** `add-feature-specification` writes `about.md` for both entry points (F12)
  - **Produces:** `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md`
  - **Produces:** no dispatcher remains for `add-plan-review` `kind: brainstorm`
- **F5** [product] — `framwork/.codeadd/commands/add.new.md`: **delegates the authoring of `about.md` to `add-feature-specification`** instead of carrying the rules inline, so both entry points produce the same document from the same rules.

  **What is removed from the command, by name — the enumeration is the instruction:**

  | Block | Fate |
  |---|---|
  | **STEP 4** — Present Consultant Questionnaire, its five-section template, the Insights section and the response template (~90 lines) | **Removed.** The skill owns what is asked; the command keeps only the `[STOP]` around it |
  | **STEP 6** — Document, including the `## Relations` / `tags:` routing rules (~45 lines) | **Removed.** The skill owns what goes into the document |
  | `SIMPLE` / `STANDARD` keyword list (lines 61-62) and the STEP 3 branch that reads it (lines 90-91) | **Removed.** STEP 3 branches on the three-fact test's classification instead |
  | Product-benchmark duty (line 398) | **Removed.** F4 gains it, so leaving it here duplicates rather than moves it |
  | `@readback-agent` dispatch at STEP 8 | **Removed** |

  It keeps what is orchestration: the ID allocation, `init.sh`, the directory, the `[STOP]`, the schema gate, the conditional STEP 8 reviewer, and the STEP 3 discovery-agent dispatch. ⛔ **It must NOT lose the `<!-- plugin:gitnexus:graph-map -->` anchor pair at lines 128-129** — it sits inside STEP 3, which this F-block keeps, and that is why no injection change is needed anywhere in this plan.
  - **Consumes:** `add-feature-specification` writes `about.md` for both entry points (F12)
  - **Consumes:** the three-fact test's classification, applied by the command to gate discovery (F12)
  - **Consumes:** `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md` (F4)
  - **Consumes:** `providers.{name}.capabilities.structuredQuestions` (F3)
  - **Produces:** no dispatcher remains for `readback-agent` at `add.new`

#### T3 — The product skills that describe the new behaviour (ref: design § Scope)

- **F6** [product] — `framwork/.codeadd/skills/add-plan-review/SKILL.md`: remove the `brainstorm` kind from the Input Contract and the Kind-Specific Extras, and remove the nit tier from Severity, Verdict, Caps and the Output Format. It must NOT touch the eight dimensions or the `feature` / `feature-plan` kinds. Its "When to Use" list also cites `/add.plan` **STEP 12**, which `af3a742` renumbered — correct it while here.
  - **Consumes:** no dispatcher remains for `add-plan-review` `kind: brainstorm` (F4)
- **F7** [product] — `framwork/.codeadd/skills/add-review-discipline/SKILL.md`: add the scoped re-review (ADDRESSED / NOT ADDRESSED per finding plus new breakage in the fix diff only), the round cap with adjudication at the cap, the single fix dispatch carrying the whole findings list, and the upstream-escalation rule; drop the divergence rows for the two removed readback sites. ⛔ It must NOT be reconciled with its internal sibling — the divergence is the intended outcome.
  - **Consumes:** no dispatcher remains for `add-plan-review` `kind: brainstorm` (F4)
  - **Consumes:** no dispatcher remains for `readback-agent` at `add.new` (F5)

#### T4 — The internal layer (ref: design § The Internal Layer)

- **F8** [internal] — `.claude/skills/add-plan-authoring/SKILL.md`: add the internal intent file's shape and naming, the short-plan shape for a `bounded` design, and an `intent.md` member in **The Delivered Home** sourced from the `docs/brainstorming/` intent file the plan's Context table names, present when the plan cites one. It must NOT weaken the byte-for-byte copy rule that governs every member.
  - **Produces:** the internal intent shape — `path:` frontmatter and a `## Open` section, named `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md`
- **F9** [internal] — `.claude/commands/add-framework--brainstorm.md`: writes that intent file at the STEP 7 handoff on `bounded` and `architectural`, names its path in the handoff, adds the per-question recommendation rule to STEP 4.2, asks through the structured-question tool, and stops routing `spike` to the planner at STEP 7.3. It must NOT lose the one-way ratchet or the approval gate.
  - **Consumes:** the internal intent shape — `path:` frontmatter and a `## Open` section, named `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` (F8)
  - **Produces:** `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md`
- **F10** [internal] — `.claude/commands/add-framework--plan.md`: extends STEP 1.2's read requirement to the intent file with the extraction rule, makes STEP 4 conditional on `## Open`, adds the size branch keyed on `path:` ahead of STEP 3, and falls back to the full unconditional questionnaire when the file is missing, absent a `## Open`, or unparseable. It must NOT lose the graph gate, the delivery-index question or the critical posture.
  - **Consumes:** `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` (F9)
- **F11** [internal] — `.claude/commands/add-framework--done.md`: extend STEP 6.1's design-source sentence to name the intent file as a second source resolved the same way. One sentence — the member list itself stays owned by `add-plan-authoring`.
  - **Consumes:** the internal intent shape — `path:` frontmatter and a `## Open` section, named `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` (F8)

### Does NOT Include (important!)

- `add.plan` STEPS 1-12 and its five injection anchors. Its STEP 13 keeps both dispatches unchanged.
- `add.plan-to-ready` and `add.build`, which dispatch the same two agents at their own sites.
- `add-framework--build` entirely — its STEP 4 readback and its STEP 7 per-artefact quality review both stay, because STEP 7 is the only check in either pipeline that reads finished work rather than a document about it.
- The internal `add-review-discipline`, `plan-review-agent`, `plan-readback-agent` and `prompt-review-agent`.
- A `structuredQuestions` flag on internal commands — single provider, so the tool is used directly.
- A validation gate for the internal intent file — `add-doc-schemas` does not reach `.claude/`; the fallback-to-questionnaire rule covers a bad file instead.
- `CLAUDE.md`. No command, skill or agent is created or removed, so the generated inventory is unchanged, and the sentence describing `provider-map.json` capabilities stays true with a sixth key — `capabilities` already carries five (`hooks`, `agentDispatch`, `mcp`, `nativeFormat`, `slashCommands`), and no schema constrains which keys it may hold.
- Making `add.new` optional. It stays the mandatory door; it gets cheap, not skippable.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Does `add.new` become a skill? | No — `add-feature-specification`, which already writes `about.md`, becomes the single writer, and `add.new` delegates to it | The skill already exists and already owns that document. Converting the command would change an artefact 11 things depend on, break every installed `/add.new`, and move the gitnexus anchor out of a kind the injection system supports |
| Can the brainstorm continue straight into writing the spec? | Yes — it offers, and on confirmation loads the skill | The hard gate bans invoking a **command**; loading a skill is what every command already does. F4 makes that distinction explicit so it is not "fixed" later |
| Does injection need to target skills? | No | The `plugin:gitnexus:graph-map` anchor stays on `add.new`, which keeps the discovery dispatch. Nothing in `cli/` or `scripts/build.js` changes |
| How does the classification survive between commands? | A short intent file, in both layers | Design § Key Decisions, rows 1 and 12 |
| What kind is `brainstorm-intent` in the MCP registry? | `work-item` | Forced: an attachment declares an owner mode, and `bounded` writes no owner document into the directory |
| Does the internal layer get its own intent file? | Yes, the same one | Its design-document pointer exists only on `architectural`; `bounded` writes nothing at all |
| What happens on a missing or malformed intent file? | Product: the three-fact test. Internal: the full unconditional questionnaire | A missing signal reads as "not closed", never as "closed" — design § The signal the planner tests |
| Which review sites survive in the product layer? | `add.new`'s reviewer on the heavy path, and `add.plan`'s reviewer plus the single readback | Design § Proposed Solution B |
| Does `about.md` keep a verdict-bearing review on the `bounded` path? | No, and the risk is accepted | Design § Trade-offs & Risks, row 4 — the user accepted it with the schema gate, the confirmation screen and the three-fact test as the compensating controls |
| Is the review trim applied to the internal layer too? | No | Its document review is two dispatches, and its volume sits in the build's per-artefact quality check, which reads finished work |
| Do the two `add-review-discipline` skills stay equal? | No — they diverge deliberately | Same rule `CLAUDE.md` records for `add-final-report` |
| How are questions asked? | Through the provider's native tool where a `structuredQuestions` capability says one exists; markdown option table otherwise | Design § Key Decisions, rows 10-12 |
| One plan or two? | One, with F-block layer tags | `add-plan-authoring` — never split a topic by layer |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A small product change costs zero agent dispatches and zero repeated questions | `about.md` on the `bounded` path gets no verdict-bearing review at all |
| Both pipelines stop re-asking what the stage before closed | Two more artifacts to keep in sync, one per layer |
| Routing is measured and auditable | The three-fact test needs judgement where a keyword list needed none |
| The brainstorm of each layer says what it would do | A stated recommendation can anchor a user who would have reasoned differently |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| F5 rewrites the STEP 3 that holds the gitnexus injection anchor and the anchor is lost | High | L1.3 asserts the anchor end-state map for all three commands; it is a regression guard that is GREEN today and must stay GREEN |
| F2 registers the type without regenerating `mcp/reference.md` | High | L1.4 runs `cli/tests/mcp-document-model.test.js`, which asserts the reference equals what the registry renders |
| F6 lands before F4 and strips a kind a live command still dispatches | Medium | Encoded as a Produces/Consumes pair, so the execution order is a dependency, not a preference |
| The intent file is written but nothing reads it between F4 and F5 | Certain, and harmless | An unread file is inert. Stated in Execution Order as a safe boundary |
| `structuredQuestions` is set `true` for a provider whose tool was never tested | Medium | Global Constraint: `true` only for `claude`; L2.4 asserts the other four are `false` |
| The two `add-review-discipline` siblings get "fixed" into agreement | Medium | F7 carries the prohibition in its own text, and L2.5 asserts the internal sibling is byte-unchanged |
| A `bounded` internal delivery reaches `main` with no record of its reasoning | Certain if F8 is skipped | `docs/brainstorming/` is gitignored and `bounded` writes no design document, so F8's `intent.md` member is the only thing that carries it — L3.3 asserts the member is declared |
| Removing dispatch edges orphans an agent | Low | L2.3 asserts `orphans` gains no new entry; both agents keep seven other callers |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | product | modify | F1 — the schema body |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | F1 — the Schema Index row |
| `mcp/types.mjs` | product | modify | F2 — the registry entry |
| `mcp/reference.md` | product | modify | F2 — regenerated from the registry |
| `framwork/provider-map.json` | product | modify | F3 — the capability flag |
| `framwork/.codeadd/skills/add-feature-specification/SKILL.md` | product | modify | F12 — single writer of `about.md` for both entry points |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F4 — writer, recommendation, benchmark, dispatches removed, offer-to-continue |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F5 — delegates authoring to the skill (STEPS 4 and 6 removed), keeps orchestration, readback removed, benchmark duty moved out |
| `framwork/.codeadd/skills/add-plan-review/SKILL.md` | product | modify | F6 — kind and nit tier removed |
| `framwork/.codeadd/skills/add-review-discipline/SKILL.md` | product | modify | F7 — cost rules in, two divergence rows out |
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | modify | F8 — intent shape, short-plan shape, archival member |
| `.claude/commands/add-framework--brainstorm.md` | internal | modify | F9 — writer, recommendation, spike routing |
| `.claude/commands/add-framework--plan.md` | internal | modify | F10 — reader, conditional questionnaire, size branch |
| `.claude/commands/add-framework--done.md` | internal | modify | F11 — one sentence on the intent source |
| `cli/tests/` | product | modify | New assertions for L1 and L2; file chosen by the build |

No file is created, renamed or removed. `CLAUDE.md` is unchanged — see Does NOT Include.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against the current tree — that is the proof the tests bite. Then drive them GREEN.

⛔ **Seven checks are deliberate regression guards that are GREEN today and must never go RED: L1.1, L1.3, L1.6, L2.3, L2.5, L2.6 and L3.6.** They are not exempt from being written — each is written and run before any F-block lands, exactly like a RED one. What differs is only the expected starting colour. A guard nobody ran is not a guard.

**EXPECTED END-STATE MAP — injection anchors.** This plan rewrites a step containing one. Assert the complete map, not merely that injection still works:

| Resource | Namespace : section | Count |
|---|---|---|
| `add.new.md` | `plugin:gitnexus:graph-map` | 1 |
| `add.brainstorm.md` | — | 0 |
| `add.plan.md` | `feature:qa-pipeline:step-list`, `feature:tdd-pipeline:step-list`, `plugin:gitnexus:graph-plan`, `feature:tdd-pipeline:step9`, `feature:qa-pipeline:qa-spec` | 5 |

Total across the three: **6**, unchanged by this plan.

### L1 — Build side (RED → GREEN)

1. `node scripts/build.js` exits 0 and emits no warning absent from the pre-change baseline. *GREEN today — regression guard.*
2. `brainstorm-intent` resolves through the Schema Index to `references/new-feature.md`. *RED today: the schema does not exist.*
3. `injection-points.json` carries exactly the end-state map above, asserted by resource and by namespace:section — not by count alone. *GREEN today — regression guard, and the one F5 is most likely to break.*
4. `cli/tests/mcp-document-model.test.js` passes, so `mcp/reference.md` equals what `renderTypeTable()` emits. *RED after F2's registry edit until the reference is regenerated.*
5. `lookup('brainstorm-intent')` returns `{ kind: 'work-item' }` and `typesOfKind('work-item')` contains it. *RED today.*
6. `mcp/` still imports nothing — no `require`, no `import` of any package, `yaml` included. *GREEN today — regression guard on a Global Constraint.*

### L2 — Graph and registry

1. `add.brainstorm` has no `DISPATCHES` edge to `plan-reviewer-agent` and none to `readback-agent`. *RED today: both edges exist.*
2. `add.new` has no `DISPATCHES` edge to `readback-agent`, and still has one to `plan-reviewer-agent`. *RED today on the first half.*
3. `orphans` returns no entry absent from the pre-change baseline. *GREEN today — regression guard.*
4. `provider-map.json` declares `structuredQuestions` for all five providers, `true` for `claude` and `false` for the other four. *RED today.*
5. `.claude/skills/add-review-discipline/SKILL.md` is byte-identical to its pre-change state. *GREEN today — regression guard against reconciling the siblings.*
6. No `<!-- uses: -->` target dangles after F4 drops two agent declarations. *GREEN today — the build already gates this.*

### L3 — Document assertions (mechanical string checks, not judgement)

1. `add.brainstorm.md` contains neither `@plan-reviewer-agent` nor `@readback-agent`. *RED today.*
2. `add.new.md` contains no `@readback-agent`, still contains `@plan-reviewer-agent`, contains neither `SIMPLE` nor `STANDARD` as a complexity label, and **no longer names the product-feature benchmark** — which `add.brainstorm.md` now does instead. Assert both halves: the string leaves one file and appears in the other. *RED today.*
3. `add-plan-authoring/SKILL.md`'s Delivered Home table contains an `intent.md` row naming `docs/brainstorming/` as its source; its File Naming section declares the internal intent file's name; and it declares the short-plan shape for a `bounded` design. *RED today — three separate assertions, one per thing F8 adds.*
4. `add-plan-review/SKILL.md` contains no `brainstorm` kind and no `nit` tier; still contains all eight dimensions and both surviving kinds (`feature`, `feature-plan`); and its "When to Use" cites `/add.plan` STEP 12. *RED today.*
5. `add-framework--brainstorm.md` STEP 7.3 no longer routes `spike` to `/add-framework--plan`; STEP 4.2 requires a recommendation per question; and STEP 7 writes the intent file on `bounded` and `architectural` and names its path in the handoff. *RED today — four assertions, one per thing F9 adds.*
6. `add.brainstorm.md` and `add.new.md` still carry their 20-word `OUTPUT RULE` headers with the closing-report exemption. *GREEN today — regression guard.*
7. `add-framework--done.md` STEP 6.1 names the `docs/brainstorming/` intent file as a second archival source, resolved the same way as the design document. *RED today — this is F11's only cover.*
8. `add-review-discipline/SKILL.md` (product) contains all four cost rules — the scoped re-review, the round cap with adjudication, the single fix dispatch, and the upstream-escalation rule — and no longer carries divergence rows for the `add.brainstorm` and `add.new` readback sites. *RED today — F7's cover, asserted rule by rule rather than as one check.*
9. `add-framework--plan.md` STEP 1.2 names the intent file among what it must read, and a size branch keyed on `path:` exists ahead of STEP 3. *RED today — F10's structural cover, separate from L4.3's fallback check.*
10. `add-feature-specification/SKILL.md` carries the intent-file resolution rule, the extract-without-asking prohibition, the three-fact test and the confirmation screen; carries none of the orchestration (no ID allocation, no `init.sh`, no schema gate, no reviewer dispatch); and carries **no inline `about.md` template** — Phase 3 loads the `feature-about` schema instead. *RED today — F12's cover, asserted in both directions so the split does not drift.*
11. `add.new.md` and `add.brainstorm.md` both load `add-feature-specification` to author `about.md`, and neither restates its rules inline. Assert specifically that `add.new.md` no longer contains the five-section questionnaire template or the `## Relations` / `tags:` routing rules. *RED today — the two-entry-point property, which is the whole point of F12.*
12. `add.brainstorm.md` is internally consistent about STEP 6 across all four locations: the hard gate states that loading a skill is not invoking a command, the STEPS IN ORDER row describes the conditional form, the handoff-shape block carries both forms, and the `NEVER` bullet no longer says `Skill tool`. *RED today — assert all four, because any one left behind is a file that contradicts itself.*

### L4 — Behavioural acceptance

1. Given an intent file whose `## Open` reads `None`, `add.new`'s STEP 4 presents a confirmation screen and asks zero questions — verified by reading the command's own routing table and its prohibition block, which must forbid asking anything already in `## Decided`.
2. Given no intent file, `add.new` runs the three-fact test and reaches the full questionnaire — the fallback path is present and reachable.
3. Given an intent file with no `## Open` section at all, `add-framework--plan` runs the full unconditional questionnaire. The unsafe direction — treating a missing signal as "closed" — must be absent from the command.
4. `add.brainstorm`'s handoff line names the intent file path verbatim, on both paths that write one.

**RED expectations against the current tree:** L1.2, L1.5, L2.1, L2.2, L2.4 and all of L3 except L3.6 fail today. L1.4 goes RED the moment F2 edits the registry and returns GREEN when the reference is regenerated.
**GREEN = all levels pass after F1–F11.**

**Coverage map — every F-block reaches at least one level:**

| F-block | Covered by |
|---|---|
| F1 | L1.2 |
| F2 | L1.4, L1.5, L1.6 |
| F3 | L2.4 |
| F12 | L3.10, L3.11 |
| F4 | L2.1, L3.1, L3.2 (the receiving half), L3.11, L3.12, L4.4 |
| F5 | L1.3, L2.2, L3.2, L3.11, L4.1, L4.2 |
| F6 | L3.4 |
| F7 | L3.8 |
| F8 | L3.3 |
| F9 | L3.5, L2.1 |
| F10 | L3.9, L4.3 |
| F11 | L3.7 |

---

## Execution Order

F1 → F2 → F3 → **F12** → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11

- **F1 first** because F2 registers the type the schema defines, and F4 and F5 both write and read against its section names.
- **F2 before F4** so the registry knows the type before any command writes a document of it.
- **F3 before F4 and F5** because both consume the capability flag.
- **F12 before F4 and F5** — it is the single writer both entry points load. Built after either of them, one entry point ships pointing at rules that are not there yet.
- **F4 before F5** — the writer before the reader, so the reader is never built against a file nothing produces.
- **F6 after F4** — F4 removes the only dispatcher of `kind: brainstorm`. Reversed, the skill loses a kind a live command still sends.
- **F7 after F5** — it describes the sites F4 and F5 removed.
- **F8 before F9, F10 and F11** — all three consume the shape it declares.
- **F9 before F10** — writer before reader, same reason as F4/F5.

**Working-state boundaries**, for a build that must stop:

- After **F3** — three carriers exist and nothing uses them. Inert and safe.
- After **F5** — the product writer and reader agree. Safe.
- After **F7** — the product half is complete. Safe.
- After **F11** — the internal half is complete. Safe.

⛔ Stopping between **F4 and F5** leaves `add.brainstorm` writing an intent file `add.new` does not read. Harmless — an unread file is inert — but it is not a delivery boundary, and the build should carry on to F5.

⛔ Stopping between **F8 and F10** leaves `add-framework--plan` unable to read a file `add-framework--brainstorm` now writes. Same shape, same harmlessness, same instruction: carry on.

**Per-F-block validation beyond the layer default:** F5 must run L1.3 immediately after its edit, before the build moves on. It is the only F-block that rewrites a step containing an injection anchor, and a lost anchor produces no error at build time.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. **The gitnexus anchor in `add.new`.** F5 rewrites the step that contains it. Confirm L1.3 asserts the anchor by `namespace:section`, not by counting anchors — a rewrite that drops `graph-map` and adds an unrelated marker keeps the count and breaks the plugin.
3. **`mcp/reference.md` regenerated rather than hand-edited.** The registry is the source; a hand-copied table is the exact drift the registry exists to stop.
4. **The two `add-review-discipline` siblings.** Confirm only the product one changed, and that the internal one is byte-identical. A build that "helpfully" synced them has broken a deliberate divergence.
5. **The fallback direction in both readers.** Confirm a missing or malformed intent file lands on MORE ceremony, never less. The unsafe direction is the one that silently produces a document from decisions nobody made.
6. **What the commands must NOT have lost** — the three-path classification and one-question cadence in both brainstorms, the graph gate and critical posture in `add-framework--plan`, the byte-for-byte copy rule in `add-plan-authoring`.

## References

- Design set: `docs/brainstorming/2026-09-14T230018-pipeline-ceremony-rebalance.md`
- Prior art this plan builds on: `2026-09-14T215936-PLAN--the-document-model-the-mcp-reads` — established `mcp/types.mjs` as the declared type registry and `mcp/reference.md` as its generated output, which is why F2 exists at all.
- Prior art: `2026-09-14T215437-PLAN--post-merge-checks-five-where-one-would-do` — last touched `add-framework--done` STEP 6, and is why F11 is one sentence rather than a rewrite.

---

## Next Steps

/add-framework--build pipeline-ceremony-rebalance

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-15 | Initial creation |
| 2026-09-15 | Review `fix-then-ok` applied: L3.7 added as F11's only cover; L3.8 and L3.9 added for F7 and F10; L3.3 and L3.5 split into per-item assertions; a coverage map added so a gap is visible rather than inferred; F5 given a `Produces` and F7 pointed at it; F8's `Produces` changed from a path to a shape and F9 given the path, so F10 and F11 cite the right producers; F5 now removes the benchmark duty rather than leaving it duplicated; `feature-about` corrected to `feature`; the regression-guard summary corrected from two to the seven it names |
| 2026-09-15 | F12 added: `add-feature-specification` becomes the single writer of `about.md`, and `add.brainstorm` STEP 6 offers to continue into it on confirmation. F5 recast from carrying the authoring rules inline to delegating them. No new skill, no injection change, no `cli/` change — the skill already existed and the gitnexus anchor stays on the command |
| 2026-09-16 | Implemented on branch refactor/pipeline-ceremony-rebalance. F1-F12 as planned, plus F13-F20 from the STEP 7 review: Relations/tags moved to the skill, the intent file gated, six downstream artefacts brought current, the blocked-item gap closed, and seven test guards retargeted |
| 2026-09-15 | Delta review `fix-then-ok` applied: F12 now states the fate of each of the skill's four existing phases, so the merge is not left to judgement — Phase 2 superseded, Phase 3's inline `about.md` template replaced by a load of the `feature-about` schema, Phase 4's validation deferred to the command's gate. F5 now names STEP 4 and STEP 6 as removed rather than implying it. F4 now names all four places in `add.brainstorm.md` that lock STEP 6 to text-only. The three-fact test's ownership split stated: the skill holds the rule, the command applies it to gate discovery. L3.10-L3.12 sharpened and reordered; Impact row reworded |
| 2026-09-15 | Re-measured against the current tree after `f1199ca`, `36af434`, `aabb316` and `af3a742` landed mid-session: `add-product-discovery` removed as a caller of `add.brainstorm` and `add.new`; caller counts corrected to 3, 11 and 21; `add.plan`'s plan review renumbered STEP 13 → 12; `add.new`'s benchmark line corrected to 398 |

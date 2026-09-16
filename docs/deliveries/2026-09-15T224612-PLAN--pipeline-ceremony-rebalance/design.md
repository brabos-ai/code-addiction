# Brainstorm: Rebalancing ceremony across both planning pipelines

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-14
> **Type:** command
> **Layer:** both — product (`framwork/.codeadd/`, `framwork/provider-map.json`) and internal (`.claude/`)

The two layers carry the same defect in different shapes, and the fix diverges where the layers
genuinely differ. Product is covered first, internal from **The Internal Layer** onward.

## Discovery

- **`add.brainstorm`** (`framwork/.codeadd/commands/add.brainstorm.md`) — classifies spike/bounded/architectural (imported from superpowers, credited at line 335), explores, and optionally writes `docs/brainstorm/<ts>-<slug>.md`. Its handoff at line 306 prints `Run: /add.new` and nothing else. Its convergence step (line 203) presents 2-3 candidate directions with pros, cons and open issues and *"force[s] the user to choose"* — it never requires the command to say which one it recommends.
- **`add.new`** (`framwork/.codeadd/commands/add.new.md`) — 413 lines, 8 steps. Classifies SIMPLE/STANDARD by keyword (lines 61-64); SIMPLE only skips STEP 3. Dispatches `@plan-reviewer-agent` and `@readback-agent` at STEP 8 on every path. It carries two duties the target split puts one command upstream: the mandatory recommendation under every option table (lines 190, 197, 199, 396-397) and the product benchmark (line 399).
- **`add.plan`** (`framwork/.codeadd/commands/add.plan.md`) — 817 lines, 14 steps, 4-5 sequential specialists at STEP 8, then coverage gate, schema gate, interface pair check, reviewer and readback.
- **`add-plan-review`** (`framwork/.codeadd/skills/add-plan-review/SKILL.md`) — the shared rubric: 8 mandatory dimensions, three kinds (`feature-about`, `brainstorm`, `feature-plan`), caps of 8 blockers / 8 attention / 5 nits.
- **`add-framework--brainstorm`** (`.claude/commands/add-framework--brainstorm.md`) — STEP 7.3 requires the design path be named verbatim in the handoff, and its rules require no open questions before handing off. It routes all three paths to the planner, including `spike`. Its STEP 4.2 question loop asks until each section is clear but never requires it to state a recommendation.
- **`add-framework--plan`** (`.claude/commands/add-framework--plan.md`) — STEP 1.2 requires reading `docs/brainstorming/`: *"a design the planner never opened is a set of decisions re-made from scratch."* STEP 4 then presents a five-section questionnaire and STOPs unconditionally, and the prohibition block forbids writing the plan until it is answered. No size branch exists anywhere in STEP 1 through STEP 7.
- **`add-framework--build`** (`.claude/commands/add-framework--build.md`) — STEP 4 dispatches `@plan-readback-agent` once, and STEP 7 dispatches `@prompt-review-agent` once per `.md` artefact written. The second is the largest dispatch count in the internal layer and the only check in either pipeline that reads finished work rather than a document.

**External research** (verified against repository sources):

- **BMAD-METHOD v6** — the exploration skills emit two artifacts: a full session record nobody downstream reads, and a short intent file whose only job is to feed the next skill (*"if it reads like a document, it is too long"*). The consuming skill then opens with *"rich input is extracted with no questions."* Its build step routes on three measured facts — intent gaps, irreversible actions, footprint — and *"a design clean on all three takes the light path."* Its review stop rule: non-trivial findings on a third pass mean the defect is upstream, in the spec.
- **superpowers** — the re-review after a fix is scoped to ADDRESSED / NOT ADDRESSED per finding plus new breakage in the fix diff only; round cap with adjudication at the cap; one fix dispatch carrying the complete findings list, never one fixer per finding.
- **GSD (`open-gsd/gsd-core`)** — `discuss-phase` carries as an explicit success criterion *"no re-asking decided questions"*, and `plan-phase --prd <file>` parses decisions straight in and skips discussion.
- **GSTACK** — review as a fixed panel ordered cheap→expensive; one-file fixes skip ideation entirely.

## Context & Motivation

The three commands were designed independently and each grew its own review discipline. Nobody summed the total. A feature that walks the full pipeline now pays **six agent dispatches** on documents before a single line of code exists: three `@plan-reviewer-agent` and three `@readback-agent`. Two of those readbacks read almost the same directory.

At the same time the pipeline has no memory between its own stages. The brainstorm converges on decisions, writes them down, and the next command cannot see them.

## Problem / Opportunity

Three measured defects.

**1. The brainstorm → add.new handoff is a dead end.** The string `brainstorm` appears in zero lines of `add.new.md` and zero lines of `add.plan.md` (grep-verified). `add.brainstorm` writes a document and prints a bare command name; `add.new` has no instruction to open `docs/brainstorm/` and never does. Every decision the brainstorm closed is re-asked from scratch. This is not an over-eager questionnaire — it is a command that cannot see what came before it.

**2. The light path in `add.new` is shallow and keyword-driven.** SIMPLE is inferred from a word list (`"add field"`, `"fix"`, `"adjust"`, `"bug"`, `"remove"`) and only skips STEP 3. A one-field adjustment still pays the 5-section questionnaire with its `[STOP]`, a full `about.md`, the schema gate, a reviewer dispatch and a readback dispatch. A keyword match is not a measurement of risk.

**3. The consultative posture sits one command too late.** `add.new` requires a concrete recommendation under every option table and treats `Ok` as acceptance of all of them. `add.brainstorm` requires neither: it presents directions and forces a choice without ever stating which one it would take. The result is that the command whose job is to help the user decide stays neutral, and the command that opines does so about questions the brainstorm should already have closed. Every question that reaches `add.new` is a question the brainstorm did not finish.

**4. Review cost is cumulative and uncounted.** Six document-level agent dispatches per feature, on top of `add.plan`'s 4-5 sequential specialists. The `add.new` readback and the `add.plan` readback both read `docs/features/${FEATURE_ID}` — the same cold read, run twice. The shared rubric permits up to 21 findings per pass, of which up to 5 are nits that by the skill's own verdict table can never change the outcome.

## Proposed Solution

Three mechanisms, decided in conversation and validated by the user.

**A — The classification travels.** `add.brainstorm` emits a short intent file alongside (or instead of) its document. That file carries the path it classified, the decisions it closed, the questions it left open, the prior art it found, and the directions it rejected. `add.new` reads it first and extracts without asking. Only `## Open` items become questions. With no intent file, `add.new` classifies itself on three measured facts.

*Alternatives considered:* composable ceremony flags (`--discuss`, `--validate`, `--full`, GSD's model) — rejected because it moves the burden of remembering onto the user, and the classification already exists one command upstream. A purely mechanical test with no upstream input (BMAD's build router alone) — rejected because it throws away the brainstorm's work, which is the exact defect being fixed.

**B — Review scales with the path, and one readback survives.** The brainstorm loses both dispatches: the intent file now carries the handoff contract, and adversarially reviewing an exploratory document that is a draft by design returns little. `add.new` keeps the reviewer only on the heavy path. `add.plan` keeps its reviewer and the single readback of the whole flow, at the last stop before code.

*Alternatives considered:* review only at `add.plan` — rejected because a weak `about.md` would then surface only after it had become a plan. Keep all three sites and make each cheaper — rejected as the smaller win; it leaves six dispatches standing.

**C — The brainstorm converges, and an empty `## Open` is the target.** `add.brainstorm` becomes the command that helps the user decide: one question per turn, and under every set of candidate directions a concrete recommendation stating which one it would take and why. It does not hand off while a question it could have closed is still open. `## Open` therefore reads `None` in the normal case, and a non-empty `## Open` is a signal that the brainstorm exited early rather than a routine field.

When `## Open` is empty, `add.new` asks nothing at all. Its `[STOP]` survives, because the approval gate never scales — but it becomes a one-screen confirmation of the decisions being extracted, which the user corrects or waves through, instead of a five-section questionnaire about decisions already made.

*Alternatives considered:* forbidding `## Open` outright and making the brainstorm loop until everything closes — rejected because some questions genuinely need data the conversation does not have, and a command that cannot exit is worse than one that reports what it could not close. Extracting the recommendation rule into a shared skill — rejected as over-engineering: `add.new` still asks the residual `## Open` items and needs its own copy, and a three-line rule does not earn a skill.

## Type of Artefact

Command — three existing product-layer commands and two skills. No new command, none removed.

## Scope

### Includes

- A `brainstorm-intent` schema in `add-doc-schemas`, placed in `references/new-feature.md` beside the `brainstorm` schema it pairs with, listed in the Schema Index, with its validation gate and an **explicitly stated narrowing** of the Universal Document Requirements: it keeps `id` (reusing `BRN-<slug>`), `type`, `created` and its own `path` / `topic` / `doc` fields, and relaxes `related`, `tags`, `## TL;DR` and the TOC rule, because the one-screen cap is the artifact's whole purpose.
- `add.brainstorm`: writes the intent file at handoff on the `bounded` and `architectural` paths; names its path verbatim in the handoff line; loses its reviewer and readback dispatches; gains the market-benchmark duty; gains the mandatory recommendation under every set of candidate directions; does not hand off while a question it could close is open.
- `add.new`: resolves and reads the intent file first; extracts closed decisions without asking; asks only `## Open` items, and nothing at all when that section reads `None`; its `[STOP]` becomes a confirmation of the extracted decisions rather than a questionnaire; replaces the SIMPLE/STANDARD keyword list with the three-fact test; runs zero agent dispatches on the light path; keeps the reviewer on the heavy path; loses its readback dispatch.
- `add-plan-review`: the `brainstorm` kind is removed; nits are removed from the rubric and its caps.
- `add-review-discipline`: the scoped re-review, the round cap with adjudication, the single fix dispatch and the upstream-escalation rule.
- Moving the product-benchmark duty from `add.new`'s execution rules (`add.new.md:399`) to `add.brainstorm` STEP 2.
- **Internal layer:** an intent file written by `add-framework--brainstorm` on the `bounded` and `architectural` paths, carrying `path:` and `## Open`; the per-question recommendation rule and the structured-question tool in the same command; a questionnaire conditional on `## Open`, a size branch keyed on `path:`, and the fallback-to-questionnaire rule in `add-framework--plan`; the intent file's shape and the short-plan shape in `add-plan-authoring`; and `add-framework--brainstorm` no longer routing `spike` to the planner.
- A `structuredQuestions` capability flag in `framwork/provider-map.json` → `providers.{name}.capabilities`, and the rule that both commands ask through the provider's native question tool when it is present and fall back to the markdown option table they use today when it is not.

### Does NOT Include

- `add.plan` STEP 1-12. Its specialists, gates and interface check are untouched. Only its STEP 13 is affected, and only by keeping what it already has.
- `add.plan-to-ready` and `add.build`, which dispatch `@plan-reviewer-agent` and `@readback-agent` at their own sites. Both stay as they are; changing them is a separate decision.
- Making `add.new` optional. It stays the mandatory door. It gets cheap, not skippable.
- Composable ceremony flags on any command.
- **`add-framework--build` in full.** Its STEP 4 readback and its STEP 7 per-artefact quality review are untouched, deliberately — see The Internal Layer.
- **A `structuredQuestions` flag on internal commands.** Single provider, so the tool is used directly.
- **A validation gate for the internal intent file.** `add-doc-schemas` is product-layer; internally the fallback-to-questionnaire rule covers a bad file instead.
- The internal `add-review-discipline`, `plan-review-agent`, `plan-readback-agent` and `prompt-review-agent`, none of which changes.

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| `add.brainstorm` emits a short intent file, separate from the brainstorm document | The document is written only on the architectural path and only on request, so a block inside it would leave the bounded path — the case that matters most — with nothing for `add.new` to read | ✅ |
| The intent file is written at the handoff moment | That is when the user is told to run `/add.new`, so it is the consent moment; it resolves the command's existing "never create documents without user consent" rule with a narrow carve-out for a handoff artifact | ✅ |
| Nothing is written on the `spike` path | A spike's output is a recommendation, and the existing rule already says keeping it is a new request with its own classification | ✅ |
| The classification travels in the intent file; `add.new` does not re-derive it | The brainstorm already measured it against the repository; re-measuring can only disagree | ✅ |
| Closed decisions are extracted, never re-asked | This is the defect being fixed; the prohibition is explicit, not implied | ✅ |
| `add.brainstorm` states a concrete recommendation under every set of candidate directions | Today it forces a choice without opining; the command whose job is to help the user decide has to say what it would do | ✅ |
| `## Open` reads `None` in the normal case | The brainstorm's job is to close questions, not to forward them. A non-empty `## Open` means it exited early, and that is information | ✅ |
| With `## Open` empty, `add.new` asks nothing and its `[STOP]` becomes a confirmation screen | The approval gate never scales, but the interrogation does. The user corrects an extract; they do not re-answer settled questions | ✅ |
| The recommendation rule is duplicated in both commands, not extracted into a skill | `add.new` still asks residual `## Open` items and needs its own copy; a three-line rule does not earn a skill | ✅ |
| Questions are asked through the provider's native structured-question tool where one exists | A rendered option list with a marked recommendation is answered in one click; a markdown table is answered by typing `3.1b, 3.2a` and getting it wrong | ✅ |
| That routes through a new `structuredQuestions` capability flag, not a hard-coded tool name | `provider-map.json` already carries `hooks`, `agentDispatch`, `mcp` and `slashCommands` per provider; naming one provider's tool inside a distributed command breaks the other four | ✅ |
| The markdown option table stays as the fallback | It is what every command uses today, so the fallback costs nothing to keep and is already proven | ✅ |
| `brainstorm-intent` is a full schema with an explicitly narrowed frontmatter, not a Format Reference | `add.new` extracts decisions from it without asking, so it needs a validation gate, and a Format Reference gets none. `add-doc-schemas` already permits the narrowing: *"Do NOT override unless the schema explicitly relaxes them"*, and the gate's own note says *"a schema may narrow that"* | ✅ |
| The `bounded` path ships with no verdict-bearing review of `about.md`, and that residual risk is accepted | The three-fact test already excludes irreversible actions and large footprints from this path, the schema gate still runs, and the failure still surfaces one step later at `add.plan`. Keeping a blocking check here would cost the zero-dispatch property that is the whole point of the path | ✅ |
| It is placed in the `new-feature` category, beside the `brainstorm` schema it pairs with | That category file already owns `brainstorm`; a new top-level file would violate the skill's one-category-one-file rule | ✅ |
| Both layers are fixed in one pass, not one after the other | They carry the same defect, and one planning command tags F-blocks by layer precisely so a single plan can execute both. Splitting would write the same reasoning twice and let the two halves drift | ✅ |
| The internal layer gets the **same** intent file the product layer gets | Its design-document pointer exists only on the `architectural` path — `bounded` writes nothing at all, so on the one path the size branch serves there is no header to ride and nothing survives the session | ✅ |
| A missing or malformed intent file falls back to the full questionnaire | The internal layer has no validation gate, so the routing rule has to be safe under a bad file. A missing signal reads as "not closed", and the failure mode is today's ceremony rather than a plan built on decisions nobody made | ✅ |
| `add-plan-authoring` owns the internal intent file's shape | `add-doc-schemas` is product-layer and does not reach `.claude/`; that skill already records the internal brainstorm's naming convention to stop the two from drifting | ✅ |
| `add-framework--plan`'s questionnaire becomes conditional rather than being removed | It is the only consultative surface on the internal side when no design preceded the plan, which is a normal way to invoke it | ✅ |
| `add-framework--build` STEP 7's per-artefact quality review is untouched | It is the largest dispatch count in the internal layer and the only check in either pipeline that reads the finished work instead of a document about it | ✅ |
| `add-framework--brainstorm` keeps its reviewer, unlike its product sibling | The internal design document is the contract the plan references and does not restate; the product brainstorm document is exploratory and its contract moved to the intent file | ✅ |
| `add-framework--brainstorm` stops routing `spike` to the planner | A spike's terminal state is its recommendation; routing it to a full planning pass contradicts the command's own ratchet rule | ✅ |
| With no intent file, `add.new` routes on three measured facts | Intent gaps, irreversible actions, footprint. Auditable; a keyword list is not | ✅ |
| `add.brainstorm` loses its reviewer and its readback | The intent file carries the handoff contract, and an exploratory document is a draft by design | ✅ |
| `add.new` keeps the reviewer on the heavy path only | `about.md` is the contract `add.plan` consumes; that is worth one dispatch when the work is large | ✅ |
| Exactly one readback survives, at `add.plan` | Its target is `docs/features/${FEATURE_ID}`, which already includes `about.md` — nothing goes unread, it is read once instead of twice | ✅ |
| Nits are removed from the rubric | By the skill's own verdict table, "only nits → ok" — they cost tokens and cannot change an outcome | ✅ |
| The market-benchmark duty moves to `add.brainstorm` | It currently sits in `add.new`'s execution rules, one command away from the exploration it serves | ✅ |
| Surviving review passes get the scoped re-review, a round cap, one fix dispatch and the upstream-escalation rule | Adapted from superpowers and BMAD; a per-finding fix wave costs more than the work it reviews | ✅ |

## The Intent File

Shape, deliberately capped. If it does not fit one screen, the conversation did not converge.

```markdown
---
path: bounded            # spike | bounded | architectural
topic: <slug>
doc: <brainstorm document path, or none>
---

## Decided
- <decision> — <one-line rationale>

## Open
None

## Prior art
- <id> <status> — <what it was>

## Rejected
- <direction> — <why>
```

`## Prior art` is filled from the INDEX and GRAPH steps `add.brainstorm` STEP 1 already runs, so `add.new` does not re-run them for anything the file already names.

### Lifecycle

| Question | Answer |
|---|---|
| Where | `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md`. It reuses the brainstorm document's timestamp verbatim when one was written, so the pair sorts adjacent; on the `bounded` path, where no document is written, it takes its own timestamp and stands alone |
| Written by | `add.brainstorm` only, at the STEP 6 handoff, on the `bounded` and `architectural` paths |
| Identity | It reuses the brainstorm's existing `BRN-<slug>` id. No new ID prefix, and no call to `status.sh next-id` |
| Resolved by | `add.new`, matching its argument as a **substring** of the basenames of `docs/brainstorm/*-intent.md` — the same rule `add-plan-authoring` already uses for plan arguments. `/add.new <slug-fragment>` is added as a fourth invocation mode; a full basename always works |
| Exactly one match | That is the file |
| More than one match | ⛔ STOP. Print every candidate basename and ask which. **NEVER guess** — writing another exploration's decisions into `about.md` is worse than asking |
| No match, or no argument | Match the description's keywords against the basenames. Nothing credible → proceed with the three-fact test and no intent file. Do NOT pick the newest file because it is the newest |
| Staleness | Solved by construction: an intent file is **consumed once**. `add.new` records the path it consumed in `about.md`, and never reads the intent file again. Continue Mode reads `about.md`, which from that point is the source of truth |
| Cleanup | None. The file stays where it was written. It is the provenance `about.md` cites, and deleting it would destroy the record of why a decision was made |

⛔ **`## Open` reads `None` in the normal case, and that is the target.** The brainstorm closes questions; it does not forward them. A question reaches this section only when the conversation could not close it — it needs data nobody in the room has, or it depends on a spike that has not run. Writing a question here that one more turn of conversation would have settled is the failure this design exists to prevent, because it lands in `add.new` as exactly the redundant questionnaire being removed.

## How add.new Routes

| Input | What runs | Questions asked | Agent dispatches |
|---|---|---|---|
| `path: bounded`, `## Open` = None | INDEX/GRAPH check, compact `about.md`, schema gate, confirmation screen | 0 | 0 |
| `path: architectural`, `## Open` = None | Discovery agents, decomposition, `about.md`, schema gate, confirmation screen, reviewer | 0 | 1 |
| Either path, `## Open` non-empty | The same, plus the listed open items — and only those | one per `## Open` item | 0 or 1 |
| No intent file | The three-fact test, then one of the rows above, with the full questionnaire | as needed | 0 or 1 |

The confirmation screen is not a questionnaire. It restates the decisions being written to `about.md` in one screen and stops, so the user can correct an extraction error. The approval gate survives on every row; what disappears is being asked again about decisions already made.

The three-fact test: are there intent gaps a builder would have to guess, irreversible actions (migration, data deletion, public contract change, external integration), or a footprint beyond a handful of files or into an area no delivered feature has touched? Clean on all three takes the light path. Any flag takes the full one. The one-way ratchet already in `add.brainstorm` applies: `add.new` may upgrade mid-run, never downgrade.

## Ecosystem Impact

### Product layer

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add.brainstorm` | `add`, `add-plan-review`, `add-product-discovery`, `add-review-discipline` | Writes the intent file; loses both dispatches; gains the benchmark duty and the mandatory recommendation; converges to an empty `## Open` | Rewrite STEPS 2, 3, 5, 6 |
| `add.new` | `add`, `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add.init`, `plugins/gitnexus/fragments/add.new.md` (INJECTS_INTO), `add-doc-schemas`, `add-id-convention`, `add-plan-review`, `add-product-discovery`, `add-qa-migration`, `add-review-discipline` | Reads the intent file; routes on path; drops the readback | Rewrite STEPS 1, 2, 3, 4, 5, 8 |
| `add.plan` | `consistency-agent`, `test-agent`, `ux-agent`, `ux-flow-agent`, `add`, `add.diagnose`, `add.new`, `add.plan-to-ready`, `add.review`, `fragments/qa-pipeline/add.plan.md` (INJECTS_INTO), `fragments/qa-pipeline/add.review.md`, `fragments/tdd-pipeline/add.plan.md` (INJECTS_INTO), `plugins/gitnexus/fragments/add.plan.md` (INJECTS_INTO), `add-architecture-discovery`, `add-cross-sf-consistency`, `add-delivery-validation`, `add-doc-schemas`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline` | Keeps both dispatches; nothing is removed | None |
| `add-plan-review` | `plan-reviewer-agent`, `add.brainstorm`, `add.new`, `add.plan`, `add-cross-sf-consistency`, `add-doc-schemas`, `add-feature-readback`, `add-review-discipline` | `brainstorm` kind loses its only dispatcher; nits removed | Remove the kind and the nit tier |
| `add-review-discipline` (product) | `add.brainstorm`, `add.build`, `add.new`, `add.plan`, `add.plan-to-ready` | Divergence table loses the brainstorm and add.new readback rows; gains the four cost rules | Update |
| `add-doc-schemas` | 23 artefacts, including every command in the pipeline | Gains the `brainstorm-intent` schema and its gate | Additive |
| `readback-agent` | `plan-reviewer-agent`, `add.brainstorm`, `add.build`, `add.new`, `add.plan`, `add.plan-to-ready`, `add-feature-readback`, `add-review-discipline` | Loses two dispatch sites; the agent itself is unchanged | None to the agent |
| `plan-reviewer-agent` | `add.brainstorm`, `add.new`, `add.plan`, `add.plan-to-ready`, `add-cross-sf-consistency`, `add-feature-readback`, `add-plan-review`, `add-review-discipline` | Loses one site, one becomes conditional; the agent itself is unchanged | None to the agent |
| `framwork/provider-map.json` | Not a graph node — no artefact declares it, and `build.js` reads it as the provider registry | Gains a `structuredQuestions` capability per provider | Add the flag; verify per provider |
| `add-knowledge-discovery` | `conformance-agent`, `add.brainstorm`, `add.diagnose`, `add.hotfix`, `add.new`, `add.plan`, `add.review`, `add-feature-discovery` | Still runs on both paths; it is the cheap check that stays | None |

### Internal layer

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-framework--brainstorm` | none — it is an entry point, and the graph confirms zero dependants | Writes the intent file on `bounded` and `architectural`; per-question recommendation; structured-question tool; stops routing `spike` to the planner | Rewrite STEPS 3, 4.2, 7.3; add the write to STEP 7 |
| `add-framework--plan` | `add-framework--brainstorm` (HANDS_OFF_TO), `add-framework--build` (HANDS_OFF_TO) | Reads the intent file; questionnaire conditional on `## Open`; size branch keyed on `path:`; falls back to the full questionnaire on a missing or malformed file | Rewrite STEPS 1.2, 4; add the branch ahead of STEP 3 |
| `add-framework--build` | `add-framework--done`, `add-framework--plan`, `building-commands` | None — its readback and its per-artefact quality review both stay | None |
| `add-plan-authoring` | `add-framework--build`, `add-framework--done`, `add-framework--plan` | Gains the internal intent file's shape and naming, and the short-plan shape for a `bounded` design | Update |
| `plan-review-agent` (internal) | `add-framework--brainstorm`, `add-framework--plan`, `add-plan-authoring`, `add-review-discipline` | None — both internal dispatch sites survive | None |
| `plan-readback-agent` | `add-framework--build`, `add-review-discipline` | None | None |
| `prompt-review-agent` | `add-framework--build`, `add-framework--plan`, `add-review-discipline` | None | None |
| `add-framework--done` | none — it is an entry point, and the graph confirms zero dependants | STEP 6 archives the new `intent.md` member | Update STEP 6 |
| `add-review-discipline` (internal) | `add-framework--brainstorm`, `add-framework--build`, `add-framework--plan`, `add-plan-authoring` | None — no internal review site is removed, so its verdict and divergence tables stand unchanged | None |

⛔ **The two `add-review-discipline` skills diverge here, and that is intended.** The product one gains four cost rules and loses two divergence rows; the internal one is untouched. This is the same deliberate duplication `CLAUDE.md` already records for `add-final-report` — do not add a check that keeps the siblings equal.

Every `Called by` cell is a depth-1 graph answer. No fragment injects into any internal command — the feature and plugin injection system is product-layer only, and the graph confirms no `INJECTS_INTO` edge on the three internal commands, so the fragment rule has nothing to reach here. The three fragments that inject into `add.plan` and the one that injects into `add.new` were queried separately, as the fragment rule requires: each declares one `USES_SKILL` target (`add-qa-spec`, `add-test-specification`, `add-gitnexus`) and adds no review dispatch of its own, so none of them is affected by the trim.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A small adjustment costs zero agent dispatches instead of two | The brainstorm document no longer gets an adversarial read |
| Decisions closed once are never re-asked | One more artifact to keep in sync (the intent file) |
| `add.new` runs with zero questions in the normal case | The brainstorm carries the whole burden of converging, and a lazy brainstorm now degrades the command after it |
| The brainstorm says what it would do instead of only listing options | A stated recommendation can anchor a user who would have reasoned differently on their own |
| Six document-level dispatches become three on a large feature, zero on a small one | A weak `about.md` on the light path is caught at `add.plan` rather than at `add.new` |
| Routing is measured and auditable instead of keyword-matched | The three-fact test needs judgement where the keyword list needed none |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The intent file drifts from the brainstorm document | Medium | One writer (`add.brainstorm`), one reader (`add.new`). The document is a keepsake; only the intent file is read downstream |
| The light path takes a change that deserved the full one | Medium | The three-fact test flags irreversible actions explicitly, and the one-way ratchet lets `add.new` upgrade mid-run |
| Dropping the `about.md` **readback** loses a real catch | Low | The surviving readback at `add.plan` targets `docs/features/${FEATURE_ID}`, which includes `about.md`. For the readback specifically, the read is moved, not removed — it issues no verdict and could never block |
| On the `bounded` path, `about.md` receives **no verdict-bearing review at all** | Certain — accepted | This is a real removal, not a move, and it must not be confused with the readback row above: `add.new` no longer dispatches `@plan-reviewer-agent`, and `add.plan`'s surviving reviewer runs `kind: feature-plan`, which `add-plan-review` bars from reading `about.md`. Accepted by the user on the grounds that the schema gate still runs, the confirmation screen catches extraction errors, the three-fact test already excludes irreversible actions and large footprints from this path, and a weak `about.md` still surfaces at `add.plan` in the verdict on the plan derived from it |
| `add.new` is invoked with no intent file because the user skipped the brainstorm | High — and expected | The three-fact test is the designed path for it, not a fallback |
| The brainstorm over-converges — it pushes the user onto its recommendation to empty `## Open` | Medium | The recommendation is stated as a recommendation, one question per turn, and the existing rule that the user chooses is unchanged. An empty `## Open` reached by pressure is a worse document than an honest open item |
| `## Open` becomes a dumping ground for questions one more turn would have closed | Medium | The section defaults to `None` and the prohibition is explicit in the schema. A non-empty `## Open` is the exception, and it is visible to the user at handoff |
| `structuredQuestions` is set `true` for a provider whose tool does not actually behave like one | Medium | Only `claude` is known to carry a native structured-question tool today. The flag starts `false` everywhere it has not been verified against the real provider — an unverified `true` degrades silently into a question nobody is asked |
| The two layers' fixes are built as one plan and one half regresses the other | Medium | The F-block layer tag already separates them, and no artefact is shared between the two halves — the only same-named skills (`add-review-discipline`, `add-final-report`) are deliberate siblings, and only the product one is touched |
| A `bounded` internal delivery reaches `main` with no record of its reasoning | Certain if unhandled — closed | `docs/brainstorming/` is gitignored, and on `bounded` no design document exists, so the intent file is the only record. `add-plan-authoring` gains an `intent.md` archival member and `add-framework--done` STEP 6 copies it |
| The conditional questionnaire in `add-framework--plan` silently skips a decision the design never actually closed | Medium | The brainstorm's own rules already forbid handing off with an open question, and the planner restates what it extracted for confirmation rather than assuming it. A design that arrives with gaps takes the unconditional path |
| The structured tool caps options and option-label length, so a nuanced fork gets flattened | Medium | The recommendation and its rationale carry the nuance, and a fork that genuinely needs more than a handful of options is a sign the question should be split across turns — which the one-question-per-turn cadence already requires |
| `add.plan-to-ready` still pays its own reviewer and readback | Certain | Named as a scope boundary. An epic consolidating subfeatures still pays; changing it is a separate decision |

## The Internal Layer

The internal pipeline is `/add-framework--brainstorm` → `/add-framework--plan` → `/add-framework--build`. It carries the same core defect and a different cost profile, so the fix is not a copy.

### The pointer that only half exists

`add-framework--brainstorm` STEP 7.3 requires the design path be named in the handoff verbatim, and `add-framework--plan` STEP 1.2 requires reading it: *"a design the planner never opened is a set of decisions re-made from scratch."*

⛔ **That pointer exists on the `architectural` path only.** STEP 3's routing table says of `bounded`: *"**Skipped entirely.** Nothing is written to `docs/brainstorming/`"*, and STEP 7.3 confirms *"On `spike` and `bounded` there is no file, so the `Design:` line is omitted."* On the one path a size branch exists to serve, there is no document — so there is no header on which a classification could ride, and nothing at all survives the session.

**The internal layer therefore gets the same intent file the product layer gets.** Same mechanism, same two carriers (`path:` and `## Open`), different vocabulary and a different directory. The layers differ in provider count and in review weight; they do not differ here, and an earlier draft of this design assumed they did.

### What it already has, and must not be given twice

- **The recommendation discipline is already strong in the planner.** `add-framework--plan` carries a MANDATORY CRITICAL POSTURE block with banned phrases and *"Mark the probable option when one is clearly better."* Only `add-framework--brainstorm` lacks the per-question form of it.
- **Only one provider.** Internal artefacts ship to `.claude/` alone, so the structured-question tool is used directly. ⛔ No `structuredQuestions` flag, no markdown fallback — both would be dead weight in a single-provider layer.
- **No schema registry.** `add-doc-schemas` is a product-layer skill and does not reach `.claude/`. The internal intent file's shape is owned by `add-plan-authoring`, which already records the internal brainstorm's naming convention for exactly this reason: *"a reader comparing the two set conventions would otherwise find the rule for one and not the other, which is how they drift."*

### The defects

**1. The planner's questionnaire is unconditional.** `add-framework--brainstorm` guarantees a design with zero open questions — its rules require *"Confirm no open questions before printing the next-command suggestion"* and STEP 4.4 requires every section answered with no "maybe" and no "TBD". `add-framework--plan` STEP 4 then presents a five-section questionnaire and STOPs regardless, and its own prohibition block forbids writing the plan until that questionnaire is answered. The pointer is read and the decisions are still re-asked.

**2. The planner has no size branch at all.** STEP 1 through STEP 7 run for every idea. `add-framework--brainstorm` STEP 7.3 routes **all three paths** to it — a spike that found a real problem and a two-line bounded fix both arrive at the full consultant, with its graph gate, its delivery-index lookup, its questionnaire STOP and its reviewer.

**3. The brainstorm converges without opining.** Its STEP 4.2 question loop asks until each section is clear but never requires it to say which option it would take. Only the written document's template asks for a recommended option, which is one step too late to help the person answering.

### What changes

- `add-framework--brainstorm`: writes `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` at the STEP 7 handoff on the `bounded` and `architectural` paths, and names its path in the handoff line. On `architectural` it sits beside the design document and reuses its timestamp; on `bounded`, where no design document is written, it is the only artifact and takes its own. STEP 4.2 gains the per-question recommendation rule. Questions are asked through the structured-question tool.
- `add-framework--plan`: STEP 1.2's read requirement extends to the intent file, and gains the extraction rule — a decision the intent file already closed is restated for confirmation, never re-asked.
- `add-framework--plan`: STEP 4's questionnaire becomes **conditional on `## Open`**. Empty → the section is a confirmation screen. Non-empty → those items, and only those, are asked.
- `add-framework--plan`: gains a size branch keyed on the intent file's `path:`. A `bounded` design gets a short plan — the F-blocks, their validation and the graph gate — without the full consultant questionnaire. `architectural` is unchanged.
- `add-framework--brainstorm` STEP 7.3: stops routing `spike` to the planner. A spike's terminal state is its recommendation, and it writes no intent file.
- `add-plan-authoring`: gains the internal intent file's shape and naming, the short-plan shape for a `bounded` design, and an `intent.md` member in its Delivered Home table — sourced from the `docs/brainstorming/` intent file the plan's Context table names, present whenever the plan cites one.
- `add-framework--done` STEP 6: copies that member into `docs/deliveries/<plan-basename>/`, byte for byte, like every other member.

⛔ **`docs/brainstorming/` is gitignored** (`.gitignore:146`), exactly as `docs/plans/` is. On a `bounded` delivery the intent file is the **only** record of what was decided and why — no design document exists. Without the archival member, that delivery reaches `main` carrying a plan whose reasoning points at a file no one else will ever have.

### The signal the planner tests

⛔ **The internal layer has no validation gate.** `add-doc-schemas` does not reach `.claude/`, so nothing mechanically checks the intent file before the planner reads it. The routing rule therefore has to be safe under a malformed file, not merely correct under a well-formed one:

| What `add-framework--plan` finds | What it does |
|---|---|
| `## Open` reads `None` | Confirmation screen. No questions |
| `## Open` lists items | Those items become questions. Nothing else is asked |
| `## Open` absent, unparseable, or the file is missing | **The full unconditional questionnaire runs**, exactly as today |

**A missing signal is read as "not closed", never as "closed".** That is the whole safety property: the failure mode of a bad intent file is the ceremony that exists today, not a plan written from decisions nobody made.

### What does NOT change internally

⛔ **`add-framework--build` STEP 7's per-artefact quality review stays exactly as it is.** It dispatches `@prompt-review-agent` once per `.md` artefact written, so it is the largest dispatch count in the internal layer — and it is the only thing in either pipeline that reads the **finished work** rather than a document about it. Cutting it would trade the one check that measures output for a saving on the one layer whose review was never the complaint.

⛔ **`add-framework--brainstorm`'s reviewer stays.** The product brainstorm lost its reviewer because its document is exploratory and the intent file carries the contract. The internal design document is the opposite: `add-plan-authoring` requires the plan to *reference it and not restate it*, and routes the contract, the schema and the worked example into it. It is load-bearing, so it keeps its one verdict-bearing read.

⛔ `add-framework--build` STEP 4's readback, and `add-framework--plan` STEP 3.4's audit, both stay.

## Next Steps

Run: `/add-framework--plan pipeline ceremony rebalance`

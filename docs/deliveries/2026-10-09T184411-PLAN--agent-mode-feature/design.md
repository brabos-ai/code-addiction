# Brainstorm: agent-mode feature — commands that talk to a bot instead of a human
> **Status:** final (ready for /add-framework--plan) · **Date:** 2026-10-09 · **Type:** product (feature) + workflow (internal cadence)
## Objective
A bot that drives Claude Code headless (`claude -p` + `--resume`) can run the whole product pipeline without hanging and without wasted round trips: every stop that needs an answer becomes ONE turn with all questions numbered, each with a recommendation and why; no interactive tool is ever called; and every run ends saying what changed, what needs a decision and which command comes next. With the feature off, the installed commands behave exactly as today. In the internal pipeline (`workbench/`), every stop that asks sends all its questions at once, numbered, with a recommendation — always, with no feature (one documented exception: brainstorm 8.1, which deliberately does not pick).
## Discovery
- `framwork/.codeadd/agent-mode/README.md` + `result.schema.json` (0031B) — the bot guide and the 12-field result contract (`status` done/stopped/needs-approval/failed, `reason`, `next_step`). It changed no prompt; machine output comes from `--json-schema`, not from prompt text.
- Non-interactive installer (0036B) — `codeadd install|modify --enable-feature X` already works with no TTY. Turning a new feature on from a bot costs nothing new.
- Slots with fallbacks (0007B/0014B) —  `<!-- slot:ID fallback="fallbacks/x.md" -->` . When no member contributes, the fallback text renders; when one does, the fallback is gone. `add-plan`'s `plan-specs` slot already uses a non-empty fallback. **Slots are accepted only in commands and agents** (`collectInjectionPoints` in `scripts/build.js` takes `'command'|'agent'`), never in skills.
- `add-plan.clarify` already asks in the target format: numbered `### N.`, options `a)/b)`, `RECOMMENDED`, answered `1a, 2b` or `recommended`.
- **No single "human interaction" skill exists today.** The human-only rules are spread across `add--delivery-mode` (continuation-offer eligibility, `chat-continuation-eligibility-v1`), `add--final-report` (the two-turn yes/no handoff, `chat-continuation-output-v1`) and `add--feature-specification` (one question per turn, structured-question tool). Each of those skills also carries generic rules a bot needs (delivery modes, the stopping rule, the seven blocks).
- Plan `2026-10-07T220115-PLAN--result-block-json-schema` (0030B) — moved machine output out of prompt text. This design keeps that: it changes conversation behaviour, not the output shape.
- Contradiction found: the agent-mode guide says "`/add-done` always stops before the merge"; the command merges automatically after the preview, by design.
## Context & Motivation
Maicon runs the framework through a bot that calls `claude -p` and resumes sessions. Every command was written for a person at a terminal: one question per turn, a structured-question tool, a yes/no continuation offer after every report, waits on stops that only confirm. For a bot each of these is either a hang (an interactive tool in headless mode — NOT VERIFIED whether `AskUserQuestion` hangs under `-p`; forbidding it removes the question) or a paid round trip that carries no decision.
## Problem / Opportunity
- Serial questions: brainstorm, new and feature-specification ask one per turn — N questions cost N bot calls.
- Structured-question tool / option table: brainstorm, feature-specification, new (epic run mode), and `add-review` calls `AskUserQuestion` by name with no capability check (a bug on 4 providers).
- Continuation offer: 12 commands end with "ask ONCE whether to receive instructions" — a false stop for a bot, which starts the next session itself from `next_step`.
- Confirming stops that wait (new confirmation screen, plan preview, review staging consent, build checkpoints) cost a round trip that decides nothing.
- `/add-done` runs `gh pr checks --watch`, which can outlive a `claude -p` call.
- The guide is wrong about `/add-done`, does not say how to answer a stop, and does not say how to turn the mode on.
- Internal: `add-framework--brainstorm` (and plan, build, done, release, backlog, commit) ask one at a time or through a structured tool; Maicon prefers one numbered batch everywhere.
## Proposed Solution
**Product: an optional feature **agent-mode**, off by default, that swaps human-only passages for agent ones through slots, plus a pair of interaction skills selected by those slots.**
1. **Two skills hold what is GENERIC** — how to communicate — because many commands point at it:
  - `add--human-interaction` (new) — the human-only rules extracted from the three skills above, unchanged in meaning: one question per turn, the structured-question tool keyed on `structuredQuestions`, confirming stops wait on `confirm`, the continuation-offer eligibility and the two-turn handoff contract.
  - `add--agent-interaction` (new) — the bot rules, one section per kind of pause:
    - **Questions** — every open question in one message, `### N.` + options `a)/b)/c)` + `RECOMMENDED: x — why`; answers accepted as `1a, 2b`, `recommended`, or free text per number; a partial answer re-asks only what is left. Never call a structured-question tool.
    - **Approval / deciding stop** — the same format with one or more items; the turn ends there.
    - **Confirming stop** — print everything it would have shown, then continue (as the `automatic` mode already does).
    - **Error stop** ("inform the user and STOP") — unchanged behaviour; the closing names the command that unblocks it.
    - **Closing** — the seven blocks of `add--final-report`, then one line per open decision, then the next command as the last line. No continuation offer, no yes/no.
  - `add--delivery-mode` and `add--final-report` keep everything generic (modes, stopping rule, same-session handoff on `automatic`, seven blocks) and lose the sections that moved. Where they used to state an offer or a cadence rule they carry a **mode-neutral pointer** — "the interaction skill the command loaded" — never the name of one of the two skills, because a skill renders the same in both modes. **No interaction skill loaded means human**, mirroring "absent means `confirm`". `add--backlog`, a skill with no slot, therefore keeps the human offer when invoked at top level; nested inside a command it never offers (unchanged). That is a documented limit. `add--feature-specification` keeps WHAT to ask and points to "the interaction skill the command loaded" for HOW. `discovery-agent` also loads it but asks no user anything — agents never talk to the user — so the pointer does not reach it and the agent stays out of scope.
2. **Commands select the skill through a slot.** Each command that asks or closes gets ONE `agent-mode.interaction` slot, placed before its first stop or, when it has none, at its closing step — commands such as `add-review`, `add-pull-request`, `add-audit` and `add-wiki` load no interaction rule today, so the slot adds the load there: fallback loads `add--human-interaction`, the agent-mode member loads `add--agent-interaction`. Skills cannot carry slots, which is exactly why the choice sits in the command.
3. **What is SPECIFIC to one command stays in that command, in its own slot.** Rule: a passage becomes an `agent-mode.*` slot when a bot following it would hang, take a wrong action, or spend a round trip that decides nothing. Its fallback file holds today's text verbatim; the agent member holds the agent version. **A member never holds nothing**: `composeSlot` (`cli/src/injection-core.js`) renders the fallback whenever no member contributes text, so an empty member brings the human text back. A passage marked "→ removed" below gets a one-line neutral member instead — e.g. "Agent mode: no continuation offer; the closing names the next command." "Inform the user and STOP" passages are NOT slotted — a bot handles them as `stopped` + `next_step` under the generic skill.
4. **Registration:** `agent-mode` in `cli/src/features.js` `FEATURES` (default false, the commands in the table below), fragments in `framwork/.codeadd/fragments/agent-mode/<command>.md`, fallbacks in `framwork/.codeadd/fallbacks/`.
5. **The guide** (`agent-mode/README.md`) gains: turn the feature on (`--enable-feature agent-mode`), the answer format, a corrected `/add-done` line (it merges automatically after its gates), and the note that an `automatic` delivery may run several stages in one call (the result's `stage` says which ended it). The schema does not change.
**Internal: no feature.** One rule, always on: every stop that asks sends all its questions at once, numbered, each with a recommendation and why, answered `1a, 2b` or `recommended`. It lives in ONE new small internal skill, `add-interaction`, which the internal stages and commands point to; the structured-question and option-table wording is removed from them.
### Per-command inventory (product) — what becomes a slot
| Command | `agent-mode.interaction` | Specific slots and their agent version |
| --- | --- | --- |
| `add-brainstorm` | yes | 20-word reply cap (17, 210, 260) → removed; one-question loop (259, 551) → batch; three-option approval (449-472) → one numbered item, `delivery` options; objective draft (217-226) → item 1 of the first batch; continuation offer (521-535) → removed |
| `add-new` | yes | 20-word cap (25) → removed; feature picker (89, 418) → numbered item with recommendation; confirmation screen wait (248-260) → print and continue when nothing is open; decompose yes/no (277-293) and epic run mode (319-325) → items of the same batch; offer (456-464) → removed |
| `add-plan` | yes | feature picker (178-181) → numbered item; preview wait (614-617) → print and continue; offer (871-887) → removed. Clarify (222-224) already uses the format — no slot |
| `add-build` | yes | feature picker (146, 197, 257) → numbered item; publish question (1448-1505) → one numbered item with recommendation; semi-automatic checkpoint (1277) stays a deciding stop in batch format; checkpoint offer (1278-1282) and closing offer (1589-1601) → removed |
| `add-review` | yes | staging consent via `AskUserQuestion` (237, 251-267): the slot wraps exactly that consent passage. Its **fallback** is today's text corrected to key the tool on `structuredQuestions` (option table otherwise) — that is the bug fix every human gets. Its **agent member** stages without asking, as `--yolo` already does (staging is reversible and the bot invoked review on purpose). The staging command itself stays outside the slot; offer (941-957) → neutral member |
| `add-done` | yes | merge-route ASK (869-898) → one numbered item with recommendation; QA yes/no (295-297) and recovery "which delivery" (228) → batch items; `gh pr checks --watch` (914) → one non-watching check, and pending CI ends `stopped` with `next_step` `/add-done` (the Resume route already handles the re-run); offer (1048-1074) → removed. **The merge stays automatic — no new stop** |
| `add-diagnose` | yes | "do you agree with this diagnosis" HARD STOP (277-285) → one numbered item; offer (348-367) → removed |
| `add-hotfix` | yes | related-feature confirm (289-293) and root-cause confirm (336-352) → batch items; offer (574-589) → removed |
| `add-qa-setup` | yes | interactive values (53, 315) → one batch; feature/migrate/install confirms (67, 74, 228-229, 259, 294) → batch items; offer (469-485) → removed |
| `add-pull-request` | yes | offer (358-374) → removed |
| `add-audit` | yes | offer (238-255) → removed |
| `add-wiki` | yes | offer (812-829) → removed |
| `add-help`, `add-ux` | no | nothing human-only that blocks a bot (`add-help`'s install confirm is a deciding stop the generic rule covers) |
Line numbers are from the discovery pass on 2026-10-09 and are a starting point; the plan re-reads each site. **Fragments of other features cannot carry slots** (e.g. `qa-pipeline/add-build.md` 24-30 "CONFIRM before changing any code"): the agent skill's confirming-stop rule covers them, and that is a known limit, not an omission.
### Per-artefact inventory (internal) — always on
| Artefact | Change |
| --- | --- |
| `add-framework--brainstorm` | 2.1.1 draft objective becomes item 1 of the first batch; 2.1.2 "one per message", 4.2 question loop, 3.2/3.3 decomposition offer, 4.4 summary approval, 6.2 blockers, 7.3 approval and the Rules line → batch format; the structured-tool / option-table paragraphs (4.2, 7.3) are removed. 8.1 keeps its deliberate "the command does not pick" — numbered, with an explicit line saying why there is no recommendation. "What do you want to explore?" stays a single free-text question |
| `add-framework--plan` | STEP 4 questionnaire → batch; the recommendation becomes mandatory, not "when clearly better"; candidate pickers → numbered |
| `add-framework--build` | STEP 2 design approval and STEP 9 push question → numbered item; "Present that finding alone and WAIT" (525-527) → all such findings in one batch |
| `add-framework--done` | plan pick (107) and per-deletion question (449) → one batch |
| `add-plan-authoring`, `add-build-ledger`, `add-review-discipline` | their stops (candidate pickers, the four hard stops, `blocked`) point to `add-interaction` |
| `add-framework--release` | STEPs 2-3 type + bump merged into one batch; "Create this release?" → numbered item |
| `add-framework--backlog`, `add-commit` | candidates / type confirm → numbered |
| `building-commands` | one pattern block so new commands are written with the batched stop |
| `add-final-report/references/result-block.schema.json` | "the question" → "the numbered question batch" (description text only) |
### Alternatives considered
| Option | Why not |
| --- | --- |
| One section in `add--delivery-mode` read in both modes | Skills cannot carry slots, so the human-only text would still render with the feature on, and the two rules would contradict each other in the same file |
| Additive fragments that say "ignore the rule above" | Both rules stay in the file; nothing guarantees the model follows the second |
| Runtime env var instead of a feature | Tried in 0028B and replaced in 0030B |
| Inline all generic text in each command's fragment | The same ~30 lines in 12 commands; one skill is one place to change |
| A new schema field for open decisions | Breaking `v` bump plus the workbench mirror test; `reason`, `next_step` and the text already carry it |
## Type of Artefact
product feature (2 new skills, 1 new feature registration, fragments, fallbacks, guide) + internal workflow change (1 new internal skill, edits to the pipeline skills and commands).
## Scope
### Includes
- [product] `agent-mode` feature: `FEATURES` entry in `cli/src/features.js` (default false, its `commands` list = the 12 commands above), `fragments/agent-mode/<command>.md`, slots in those commands, fallbacks named `fallbacks/agent-mode.<command>.<slot>.md` or, for text shared across commands, `fallbacks/agent-mode.<slot>.md` — both match the build's safe-path rule `^fallbacks/[A-Za-z0-9][A-Za-z0-9._-]*\.md$`.
- [product] The two new skills registered in `framwork/provider-map.json`, so the build distributes them.
- [product] New skills `add--human-interaction` and `add--agent-interaction`; extraction of the human-only sections out of `add--delivery-mode`, `add--final-report`, `add--feature-specification`.
- [product] `add-review` structured-question call keyed on the capability for every user (bug fix, independent of the feature).
- [product] `add-done` CI check that cannot outlive a headless call, under agent-mode.
- [product] Guide fixes in `agent-mode/README.md` (enable, answer format, `/add-done` merges, chained stages) and `add-help`'s bot pointer if it restates any of that.
- [product] Tests, three named checks: (1) **command off-render** — each command, per provider, equals the pre-change render except the `agent-mode.interaction` line, which now loads `add--human-interaction`; (2) **extracted sections** — the sections moved out of `add--delivery-mode`, `add--final-report` and `add--feature-specification` are byte-compared with their copy in `add--human-interaction`; (3) **on-render** — with agent-mode on, every slot renders its agent member and no fallback text appears, including every "→ removed" slot. Plus the registry entry and its default.
- [product] One manual live run, brainstorm → new → plan through `claude -p` + `--resume` with `--json-schema`, recorded in the delivery. It passes when: every stop that waits arrives as one numbered batch with a recommendation per item; no `AskUserQuestion` call appears in the transcript; no continuation yes/no is asked; every result has a valid `status`, and a waiting stop returns `needs-approval`; each closing ends on the next command; the answer `recommended` is accepted.
- [internal] New skill `add-interaction` and the per-artefact edits above; registered in `workbench/provider-map.json`.
- [internal] `AGENTS.md` Feature Injection table gains the `agent-mode` row.
### Does NOT Include
- Any change to `result.schema.json` or its workbench mirror.
- Making `/add-done`'s merge a stop.
- A feature flag in the workbench.
- Removing `structuredQuestions` from either provider map (nothing internal reads it after this, but removal needs its own check of `cli/` and `build.js`).
- Slots inside fragments of other features or inside skills.
- The two side contradictions found: `add-diagnose` 43 ("no stop") vs 382 ("confirm the reformulation"), and `add-qa-setup` 191 ("installs, confirm-then-execute") vs `add--dev-environment-setup` (the user runs installs by hand). Separate tickets.
- README / web docs refresh — `/add-framework--sync` does it before a release.
- Support for providers other than Claude Code in the guide's JSON contract (the feature text ships to all providers; only the `claude -p` contract is documented and tested).
## Key Decisions
| Decision | Serves | Rationale | Validated |
| --- | --- | --- | --- |
| A feature named `agent-mode`, off by default, enabled at install | "with the feature off, behave exactly as today" | Installer already takes `--enable-feature`; one name for the folder, the guide and the feature | ✅ |
| Human-only text moves into slot fallbacks, swapped by the agent member | "with the feature off, behave exactly as today" | Replacing beats stacking an override; off-render is unchanged outside the interaction line, and that is testable | ✅ |
| Generic rules in a skill pair selected by an `agent-mode.interaction` slot; specific ones in per-command slots | "all questions numbered … no interactive tool" | Many commands point at the generic rule; skills cannot carry slots, so the choice sits in the command | ✅ |
| Extract human-only sections from `add--delivery-mode`, `add--final-report`, `add--feature-specification` into `add--human-interaction` | "behave exactly as today" with the feature off | No dedicated human skill exists; those skills also hold generic rules a bot needs, so they cannot simply be swapped | ✅ |
| Slot only what hangs, misleads or costs a pointless round trip | "without wasted round trips" | Keeps the slot count to what changes behaviour; "inform and STOP" is already bot-safe | ✅ |
| Confirming stops pass through; deciding stops end the turn in batch format | "every stop that needs an answer becomes ONE turn" | Reuses the existing deciding/confirming classification | ✅ |
| Answers `1a, 2b` / `recommended` / free text per number | "every stop … ONE turn" | `add-plan` already documents it | ✅ |
| No continuation offer under agent-mode; closing ends on open decisions + next command | "ends saying what changed, what needs a decision and which command comes next" | The bot starts the next session from `next_step` itself | ✅ |
| Schema unchanged | the closing half | A new field forces a `v` bump and the mirror test for data the text and `reason` already carry | ✅ |
| `/add-done` merge stays automatic; the guide is corrected | "without hanging" | The merge IS the command's purpose; the guide was wrong | ✅ |
| `/add-done` CI check does not watch under agent-mode; pending CI → `stopped`  • re-run | "without hanging" | `--watch` can outlive a headless call; the Resume route already re-runs | ✅ |
| `add-review` staging consent auto-stages under agent-mode | "without wasted round trips" | Staging is reversible; `--yolo` already stages without asking | ✅ |
| `add-review`'s `AskUserQuestion` keyed on the capability for everyone | none of the objective — a bug found on the way | Broken today on 4 providers; small, and the slot work touches the same lines | ✅ |
| Internal: always batch, one new skill `add-interaction` | the internal half of the objective | No feature system in `workbench/`; Maicon prefers batches; one rule many stops point to | ✅ |
| Internal 8.1 keeps "no recommendation", stated explicitly | the internal half | Both readings have been true at once; a recommendation there would bias a decision the skill deliberately leaves open | ✅ |
| `automatic` delivery keeps following the next command in the same call | "without wasted round trips" | Fewer calls; the guide documents it instead of the command changing | ✅ |
## Ecosystem Impact
Layer: [P] product, [I] internal. `Called by` from `scripts/graph.js impact <name> --depth 1` on 2026-10-09; fragment rows (`INJECTS_INTO`) included.
| Component | Layer | Called by | Impact | Action |
| --- | --- | --- | --- | --- |
| `add--human-interaction` (new) | P | none yet — new | Holds the extracted human-only rules | Create; selected by the fallback of every `agent-mode.interaction` slot |
| `add--agent-interaction` (new) | P | none yet — new | Holds the bot rules per pause type | Create; selected by the agent-mode member |
| `add--delivery-mode` | P | add-audit, add-brainstorm, add-build, add-diagnose, add-done, add-hotfix, add-new, add-plan, add-pull-request, add-qa-setup, add-review, add-wiki, fragments qa-pipeline/add-build, tdd-pipeline/add-build | Loses the continuation-offer eligibility section | Move it; leave a one-line pointer |
| `add--final-report` | P | the 12 commands above, add--backlog, add--delivery-mode, add--subagent-driven-development | Loses `chat-continuation-output-v1` | Move it; `add--backlog`'s top-level offer reads it from the human skill |
| `add--feature-specification` | P | add-new, discovery-agent | Loses HOW to ask; keeps WHAT | Point to the loaded interaction skill |
| `add-brainstorm` | P | add-help, add-new, fragment board/add-brainstorm | Slots per table | Add slots + fallbacks |
| `add-new` | P | add-audit, add-brainstorm, add-build, add-diagnose, add-help, fragments board/add-new, gitnexus/add-new, add--doc-schemas, add--feature-specification, add--id-convention, add--plan-review, add--qa-migration, add--review-discipline | Slots per table | Add slots + fallbacks |
| `add-plan` | P | consistency-agent, test-agent, ux-agent, ux-flow-agent, add-build, add-diagnose, add-help, add-new, add-review, fragments board/tdd/qa/gitnexus add-plan, qa-pipeline/add-review, add--architecture-discovery, add--cross-sf-consistency, add--delivery-validation, add--doc-schemas, add--id-convention, add--plan-review, add--qa-migration, add--review-discipline | Slots per table | Add slots + fallbacks |
| `add-build` | P | consistency-agent, ux-agent, add-done, add-help, add-new, add-plan, add-qa-setup, add-review, fragments board/qa/tdd/gitnexus add-build, qa-pipeline/add-review, add--architecture-discovery, add--code-review, add--commit, add--cross-sf-consistency, add--id-convention, add--qa, add--qa-migration, add--review-discipline | Slots per table | Add slots + fallbacks |
| `add-review` | P | consistency-agent, e2e-agent, qa-agent, ux-agent, add-build, add-done, add-help, add-plan, add-qa-setup, fragments qa/tdd/playwright add-review, add--delivery-validation, add--id-convention, add--qa, add--qa-migration | Slots + capability fix | Add slots + fallbacks; fix `AskUserQuestion` |
| `add-done` | P | add-build, add-help, add-plan, add-pull-request, add-review, fragments board/docs-pruning/gitnexus add-done, qa-pipeline/add-review, add--delivery-validation, add--doc-schemas, add--qa | Slots per table; merge unchanged | Add slots + fallbacks |
| `add-diagnose` | P | add-brainstorm, add-help, add-hotfix, fragment gitnexus/add-diagnose, add--investigation | Slots per table | Add slots + fallbacks |
| `add-hotfix` | P | add-brainstorm, add-diagnose, add-done, add-help, fragments board/tdd/gitnexus add-hotfix, add--doc-schemas, add--investigation | Slots per table | Add slots + fallbacks |
| `add-qa-setup` | P | add-build, add-review, fragment qa-pipeline/add-review, add--qa, add--qa-migration, add--setup-contract | Slots per table | Add slots + fallbacks |
| `add-pull-request` | P | add-done, add--doc-schemas | Offer slot | Add slot + fallback |
| `add-audit` | P | add-help, add--doc-schemas | Offer slot | Add slot + fallback |
| `add-wiki` | P | conformance-agent, add-build, add-diagnose, add-done, add-hotfix, add-new, add-plan, add-review, fragment gitnexus/add-wiki, add--agents-md-style, add--architecture-discovery, add--knowledge-discovery, add--project-scaffolding, add--resource-path-convention, add--tasks-checklist, add--wiki-maintenance | Offer slot | Add slot + fallback |
| `cli/src/features.js` | P | NOT VERIFIED — not a graph node | New `FEATURES` entry | Register `agent-mode` |
| `agent-mode/README.md` | P | NOT VERIFIED — not a graph node; add-help Type H points to it (grep) | Guide corrections | Edit |
| `add-interaction` (new) | I | none yet — new | The batch rule | Create; register in `workbench/provider-map.json` |
| `add-framework--brainstorm` | I | none (entry point) | Cadence and approval format | Edit |
| `add-framework--plan` | I | add-framework--brainstorm, add-framework--build | Questionnaire format | Edit |
| `add-framework--build` | I | add-framework--done, add-framework--plan, building-commands | Approval, push, findings | Edit |
| `add-framework--done` | I | add-framework--build | Pickers | Edit |
| `add-plan-authoring` | I | add-framework--brainstorm, --build, --done, --plan | Pickers | Point to `add-interaction` |
| `add-build-ledger` | I | add-framework--build, add-framework--done | Hard stops | Point to `add-interaction` |
| `add-review-discipline` | I | add-framework--brainstorm, --build, --plan, add-plan-authoring | `blocked` stop | Point to `add-interaction` |
| `add-framework--release` | I | add-framework--sync | Two round trips merged | Edit |
| `add-framework--backlog` | I | none (entry point) | Candidate picker | Edit |
| `add-commit` | I | add-build-ledger, add-framework--done, add-framework-development | Type confirm | Edit |
| `building-commands` | I | NOT VERIFIED — not queried | Pattern block | Edit |
| `AGENTS.md` | I | NOT VERIFIED — not a graph node | Feature table row | Edit |
## Trade-offs & Risks
| We Gain | We Give Up |
| --- | --- |
| A bot runs the pipeline in one turn per decision, never hangs on a tool | Human text moves from command bodies into fallback files — reading a command source no longer shows it inline |
| Off-render provably unchanged outside the interaction line | ~12 commands gain 2+ slots each; more slot ids to keep stable |
| One place for HOW to talk, per audience | Three skills shrink and a fourth/fifth appear — callers that cite the moved sections must be repointed |
| Maicon gets batches in the internal pipeline too | The internal 8.1 stop is the one documented exception to "every question has a recommendation" |

| Risk | Probability | Mitigation |
| --- | --- | --- |
| The model still asks one at a time with the feature on | Med | The human rule is no longer in the rendered file; the live run proves it |
| A human-only passage is missed and still blocks a bot | Med | The generic skill's per-pause rules cover unslotted stops; the live run walks brainstorm → new → plan |
| A citation of `chat-continuation-*-v1` keeps pointing at the old skill | Med | `impact` on both skills before the move; grep the contract ids |
| Fragments of other features keep human stops | Low | Covered by the confirming-stop rule; documented limit |
| Off-render drifts from today beyond the interaction line (a fallback newline, a lost sentence) | Med | Test compares the off-render to the pre-change render per provider, with the interaction line as the only allowed difference; the moved skill sections are compared as text |
## Next Steps
Run: `/add-framework--plan docs/brainstorming/2026-10-09T145554-agent-mode-feature.md`

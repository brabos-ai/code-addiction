# Plan: agent-mode feature — commands that talk to a bot instead of a human

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-09
> **Delivery:** confirm
> **Ticket:** 0038B

---

## Objective

A bot that drives Claude Code headless (`claude -p` + `--resume`) can run the whole product pipeline without hanging and without wasted round trips: every stop that needs an answer becomes ONE turn with all questions numbered, each with a recommendation and why; no interactive tool is ever called; and every run ends saying what changed, what needs a decision and which command comes next. With the feature off, the installed commands behave exactly as today. In the internal pipeline (`workbench/`), every stop that asks sends all its questions at once, numbered, with a recommendation — always, with no feature (one documented exception: brainstorm 8.1, which deliberately does not pick).

**When this build is done:** `codeadd install --enable-feature agent-mode` installs the 12 product
commands with their human-only passages replaced by bot instructions and their generic HOW-to-talk
rules taken from `add--agent-interaction`; with the feature off, the installed render differs from
today's only on the three allowed lines; the guide tells a bot how to turn the mode on and how to
answer; and every internal stage asks in one numbered batch through `add-interaction`.

**Ticket done when:** Com a feature agent-mode habilitada, os comandos instalados trazem as instrucoes para bots (perguntas em lote, numeradas, com recomendacao, fechamento com o proximo comando) no lugar dos trechos so-humanos; o pipeline interno manda perguntas em lote; npm test passa.

## Context

A bot calls `claude -p` and resumes sessions. Every product command was written for a person at a
terminal — one question per turn, a structured-question tool, a yes/no continuation offer after every
report, confirming stops that wait — so for a bot each is either a hang or a paid round trip that
decides nothing. The internal pipeline asks the same way, and Maicon prefers one numbered batch there
too.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-09T145554-agent-mode-feature.md` | The feature shape, the two-skill split, the slot rule, the per-command and per-artefact inventories, the guide changes, the three render checks, the live-run pass criteria, the rejected alternatives |
| `docs/brainstorming/2026-10-09T145554-agent-mode-feature-intent.md` | `path: architectural`, the 13 closed decisions, `## Open: None`, `delivery: confirm`, `ticket: 0038B` |

**The design's line numbers were re-read on 2026-10-09 against `main` at `eca6703`** (after PR #125 /
0037B). Current State carries the corrected map; the build still re-reads each site before editing.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline; add-framework-injection, Validation)
- No command, skill or agent source mentions `json-schema` or `result block` (`cli/tests/agent-mode.test.js` L1.5)
- No agent-mode text — skill, fragment member or fallback — names a result `status` value or a schema field; `needs-approval` lives in the schema's `status` description only (`docs/deliveries/2026-10-08T193103-PLAN--product-agent-mode-claude-code/plan.md`, Validated Decisions "Where `needs-approval` lives")
- `framwork/.codeadd/agent-mode/result.schema.json` is unchanged; its workbench mirror changes in `description` text only (design, Does NOT Include; STEP 4 answer 7)
- Every fallback path matches `^fallbacks/[A-Za-z0-9][A-Za-z0-9._-]*\.md$` (`scripts/build.js:118`)
- A slot marker sits on a whole line, never inside a markdown table or a fenced code block, and never around a `STEP` heading; no product STEP ID changes (add-framework-injection, Declare a slot / STEP IDs)
- Every `agent-mode.*` slot holds exactly one member, `feature:agent-mode`, and no member section is empty — an empty member brings the fallback back (`cli/src/injection-core.js:371-392`, `composeSlot`)
- `## Materializes` in `add-qa-setup.md` (line 89 onward) is not touched — `contracts.json` hashes it (AGENTS.md, Setup Contracts)
- `/add-done`'s merge stays automatic after its gates; no new stop (intent, Decided)
- Edit `workbench/`, never the built `.claude/`, `.opencode/`, `.agents/`, `.codex/` copies (AGENTS.md, Internal Layer)
- Tests run through `scripts/run-tests.js` (AGENTS.md, Key files); a test name removed needs a `Test-Removed:` trailer (`scripts/test-loss-guard.cjs`)

## Problem

1. **Serial questions** — brainstorm, new and feature-specification ask one per turn: N questions cost N bot calls.
2. **Interactive tool** — brainstorm and feature-specification ask through the structured-question tool; `add-review` calls `AskUserQuestion` by name with no capability check, broken on the four providers that declare `structuredQuestions: false`.
3. **False stop after every report** — 12 commands end with a yes/no continuation offer that a bot does not need.
4. **Confirming stops that wait** — new's confirmation screen, plan's preview, review's staging consent and the closings cost a round trip that decides nothing.
5. **A wait that can outlive the call** — `/add-done` runs `gh pr checks --watch`.
6. **The guide is wrong and incomplete** — it says `/add-done` stops before the merge; it does not say how to turn the mode on or how to answer a stop.
7. **Internal** — the four stages and their helpers ask one at a time or through a structured tool.

## Proposal

The design's Proposed Solution, unchanged, plus the five rulings STEP 4 added (Validated Decisions,
rows marked *STEP 4*). Work runs in five phases, each leaving the repository green:

- **A — Render base.** Make a fallback resolve `{{cmd:}}`/`{{skill:}}` the way a member already does,
  lint fallbacks at build, register the feature. Nothing renders differently yet.
- **B1 — Skills.** Create the two interaction skills; the human-only sections are copied into
  `add--human-interaction`.
- **C — Commands.** One F-block per command: the `agent-mode.interaction` slot, the specific slots,
  their fallbacks (today's text) and the agent-mode fragment (the bot text).
- **B2 — Extraction.** Only once every command loads the new owner, the sections leave the three old
  owners and mode-neutral pointers take their place. The Scope lists F5–F7 under Phase B for reading
  order; Execution Order runs them here.
- **D — Guide, ecosystem, tests that freeze the slot map.**
- **E — Internal.** `add-interaction` and the batch format in every internal stage.

Then the proofs: the one-time off-render diff, the permanent render tests, the full suite and the
manual live run.

## Current State

### What a slot does today

The build reads a fallback file raw (`scripts/build.js:410-415`, `readProductFallback`) and embeds its
bytes in `injection-points.json`; the build output itself carries an EMPTY slot region. At install,
`reconcileSlots` renders each slot from the saved baseline: members contribute their section text
resolved per provider (`cli/src/injection-core.js:521`), and with no member the fallback text is used
**as is** (`:388`). So a fallback holding `{{skill:...}}` reaches the user unresolved today — no
fallback has needed one until now (`fallbacks/empty.md` is empty, `fallbacks/plan-specs.md` has no
placeholder).

`cli/tests/build-injection-points.test.js:152-170` and `cli/tests/fixtures/slot-membership-map-v2.json`
freeze **71 memberships in 64 slots, one nonempty fallback**. `add-framework-injection` states the
same rule in words.

### Current line map (product commands)

| Command | Passage | Lines now |
|---|---|---|
| `add-brainstorm` | 20-word cap; cap restated for all paths; objective drafted first; one-question cadence; structured-question paragraph; approval asked through the tool; continuation offer; Rules lines (objective first, one per turn) | 17-19; 210-211; 215-227; 259-260; 327-329; 451-453; 521-535; 550-551 |
| `add-new` | 20-word cap; confirmation-screen wait; closing stop kind + mode table; offer (after the `handoff` heading) | 25-27; 248-260; 446-451; 458-464 |
| `add-plan` | confirming-stop rule in the gates prose; preview wait; closing stop kind + mode table; offer | 67-70; 614-617; 871-876; 880-887 |
| `add-build` | epic checkpoint table + paragraph; closing stop kind; offer | 1276-1286; 1594-1596; 1600-1610 |
| `add-review` | prohibition row naming `AskUserQuestion`; staging consent (stop kind, the tool call, the prompt, the yes/no branches — the `git add` lines 274-275 stay outside); closing stop kind; offer | 237; 251-280; 939; 943-957 |
| `add-done` | CI watch and its result reading; offer | 918-937; 1056-1080 |
| `add-diagnose` | offer | 350-367 |
| `add-hotfix` | offer | 576-589 |
| `add-qa-setup` | per-prerequisite install confirmation; interactive config values; offer | 258; 316; 470-485 |
| `add-pull-request` / `add-audit` / `add-wiki` | offer | 360-374 / 240-255 / 814-829 |

The "do you agree" stop in `add-diagnose` (277-285), the pickers (`add-new` 57, 89, 418; `add-plan`
59, 178-181; `add-build` 146, 197, 257; `add-qa-setup` 197-199; `add-done` 228), the `add-done` QA
yes/no (293-298) and merge-route ASK (875-904), the `add-hotfix` confirms (289-293, 336-352), the
`add-new` decompose and epic-run-mode questions (277-293, 319-330), the `add-build` publish question
(1452-1512) and the `add-qa-setup` feature-gate and migration asks are **plain deciding stops**: their
text says "ask" and "wait", and neither names a cadence, a tool, a reply cap nor a wait on a
confirming stop. They take no slot — the loaded interaction skill formats them (Validated Decisions,
*slot rule made checkable*).

### Current owners of the human-only rules

| Skill | Section | Lines |
|---|---|---|
| `add--delivery-mode` | `## Handing Off to the Next Command` — the offer parts: eligibility `chat-continuation-eligibility-v1`, the no-next-activity block, carrier-absent means `confirm`, a deciding stop is never replaced by the offer | 121-166 (offer parts only); Rules line 221 |
| `add--final-report` | `## The Second Response — chat-continuation-output-v1` (two turns, what the block holds, who never offers) | 98-183 |
| `add--feature-specification` | 2.2 — one question per turn; ask through the structured-question tool | 91; 98-101 |

Other citations of the two contract ids: the 12 commands' offer paragraphs, `add--ecosystem`
322-323, and `cli/tests/chat-continuation-handoff.test.js`, which pins `FINAL_REPORT` and
`DELIVERY_MODE` as their owners.

### Risk (`impact --depth 1`, 2026-10-09)

| Artefact | Layer | Direct callers | Risk |
|---|---|---|---|
| `add--delivery-mode` / `add--final-report` | P | 14 / 15 | HIGH |
| `add--feature-specification` | P | 2 | MEDIUM |
| `add-plan`, `add-build` | P | 22 each | HIGH |
| `add-review`, `add-wiki`, `add-done`, `add-new`, `add-hotfix`, `add-qa-setup`, `add-diagnose`, `add-brainstorm` | P | 16, 16, 13, 13, 9, 6, 5, 3 | HIGH |
| `add-pull-request`, `add-audit` | P | 2 each | MEDIUM |
| `add--ecosystem` | P | 6 | HIGH |
| `add-framework--build`, `add-plan-authoring`, `add-review-discipline`, `add-commit`, `building-commands`, `add-final-report`, `add-framework-injection` | I | 3, 4, 4, 3, 5, 9, 4 | HIGH |
| `add-framework--plan`, `add-framework--done`, `add-build-ledger`, `add-framework--release` | I | 2, 1, 2, 1 | MEDIUM |
| `add-framework--brainstorm`, `add-framework--backlog` | I | 0 | LOW |
| `cli/src/features.js`, `cli/src/injection-core.js`, `scripts/build.js`, `agent-mode/README.md`, `AGENTS.md` | P/I | not graph nodes | NOT VERIFIED |

`history`: no artefact here was shipped and dropped. `add-framework--brainstorm`'s one `superseded`
entry is the native-scripts migration, unrelated.

## Scope

### Includes

#### Phase A — render base

- **F1** [product] — `cli/src/injection-core.js`: a slot that renders its fallback resolves the
  fallback's `{{cmd:}}`, `{{skill:}}` and `{{addpath:}}` with `resolvePlaceholders` for the target
  provider, exactly as a member body already is (`:521`). An empty fallback stays zero bytes; the
  `plan-specs` line renders byte-identical. `composeSlot` (`:371`) has no provider parameter today, so
  it gains one and **both** callers pass it: `reconcileSlots` (`:543`, `target.provider`) and
  `renderInstalledResource` (`:471`, the provider resolved from `providerKey`). L1.1 covers both render
  paths. Ref: STEP 4 answer 2.
  - **Produces:** `fallback text resolved per provider`
- **F2** [internal] — `scripts/build.js`: `lintResourcePaths` runs on every fallback file the build
  reads, so a raw `.codeadd/` path in a fallback warns like it does in a command.
- **F3** [product] — `cli/src/features.js`: `FEATURES['agent-mode']`, `default: false`, `commands` =
  the 12 commands of the design's product inventory, with a comment naming the design. Ref: design,
  Proposed Solution 4.
  - **Produces:** `FEATURES['agent-mode']`

#### Phase B — skills

- **F4** [product] — `framwork/.codeadd/skills/add--human-interaction/SKILL.md` (new) + registration in
  `framwork/provider-map.json`: holds the sections listed under *Current owners*, moved **byte for byte**,
  plus a short header saying it is the human rule set a command loads through its
  `agent-mode.interaction` fallback. The two contract ids `chat-continuation-*-v1` are owned here from
  now on. Ref: design, Proposed Solution 1.
  - **Produces:** `add--human-interaction` (owner of `chat-continuation-eligibility-v1` and `chat-continuation-output-v1`)
- **F5** [product] — `add--delivery-mode/SKILL.md`: the offer parts of 121-166 and Rules line 221 leave;
  what stays — the modes, the stopping rule, `automatic`'s same-session handoff, *Following the next
  command*, *Where the Automatic Path Ends* — is untouched. Where an offer rule stood, a mode-neutral
  pointer: "the interaction skill the command loaded; when none was loaded, `add--human-interaction`".
  `uses:` gains the new skill. Ref: STEP 4 answer 9.
  - **Consumes:** `add--human-interaction` (owner of `chat-continuation-eligibility-v1` and `chat-continuation-output-v1`) (F4)
- **F6** [product] — `add--final-report/SKILL.md`: 98-183 leaves; the seven blocks, banned phrasings,
  continuation line and self-check stay. Same pointer as F5.
  - **Consumes:** `add--human-interaction` (owner of `chat-continuation-eligibility-v1` and `chat-continuation-output-v1`) (F4)
- **F7** [product] — `add--feature-specification/SKILL.md`: 2.2 keeps WHAT to ask; the cadence (91) and
  the tool paragraph (98-101) move to F4 and become the same pointer. `discovery-agent`, its other
  caller, asks no user and is untouched.
  - **Consumes:** `add--human-interaction` (owner of `chat-continuation-eligibility-v1` and `chat-continuation-output-v1`) (F4)
- **F8** [product] — `framwork/.codeadd/skills/add--agent-interaction/SKILL.md` (new) + registration: one
  section per pause — Questions, Approval / deciding stop, Confirming stop, Error stop, Closing — per
  the design's Proposed Solution 1. It describes behaviour only: no status name, no schema field, no
  `json-schema`, no `result block` (Global Constraints).
  - **Produces:** `add--agent-interaction`
- **F9** [product] — `cli/tests/chat-continuation-handoff.test.js`: the owner constants and the F1/F2
  describe blocks point at `add--human-interaction`; the adapter checks read each command's offer
  through its source **plus** the fallback files its slots name. No test name is removed; if one has to
  be, its commit carries `Test-Removed:`.
  - **Consumes:** `add--human-interaction` (owner of `chat-continuation-eligibility-v1` and `chat-continuation-output-v1`) (F4)

#### Phase C — commands (one F-block per command)

Each F-block below does the same five things to its command, and nothing else:

1. Wraps each passage listed for it in *Current line map* in its own slot `agent-mode.<subject>`, with
   fallback `fallbacks/agent-mode.<command>.<subject>.md` holding that passage's text verbatim — except
   the offer paragraph's owner pointer, which now names `add--human-interaction` (allowed difference b).
2. Adds ONE `agent-mode.interaction` slot before the command's first stop — at its closing step when it
   has none — with the shared fallback `fallbacks/agent-mode.interaction.md` (load
   `add--human-interaction`). The first F-block to land creates that shared file.
3. Writes `fragments/agent-mode/<command>.md` with one section per slot: `interaction` loads
   `add--agent-interaction`; each other section holds the agent version from the design's per-command
   table; a "→ removed" passage gets a one-line neutral member, never an empty one.
4. Adds `skill: add--human-interaction` to the command's `uses:` block, and `skill: add--agent-interaction`
   to the fragment's.
5. Splits a passage that spans a `STEP` heading, a table or a fenced code block into separate slots
   around it — a whole table or a whole fence goes inside one slot, never half of it — and records the
   split as a ruling; the end-state map below then gains that slot.
6. Adds its own slots to `cli/tests/fixtures/slot-membership-map-v2.json` and bumps the two counts in
   `build-injection-points.test.js`, in the same commit, so the frozen map is green after every
   F-block (F24 has already made the nonempty-fallback assertion accept `agent-mode.*` slots).

- **F10** [product] — `add-brainstorm.md`: subjects `interaction`, `output-cap`, `cap-scope`,
  `objective-draft`, `cadence`, `structured-ask`, `approval-ask`, `offer`, `rules-cadence`. The agent
  version of `objective-draft` makes the drafted objective item 1 of the first batch; `approval-ask`
  makes the three-option approval one numbered item with the `delivery` options.
  - **Consumes:** `fallback text resolved per provider` (F1), `FEATURES['agent-mode']` (F3), `nonempty fallbacks = plan-specs + agent-mode.*` (F24, run in Phase A), `add--human-interaction` (owner of `chat-continuation-eligibility-v1` and `chat-continuation-output-v1`) (F4), `add--agent-interaction` (F8)
- **F11** [product] — `add-new.md`: `interaction`, `output-cap`, `confirm-wait` (agent: print the
  confirmation screen and continue when `## Open` is `None`), `closing-route`, `offer`.
  - **Consumes:** same four as F10
- **F12** [product] — `add-plan.md`: `interaction`, `stop-kinds`, `preview-wait` (agent: print the
  preview, continue), `closing-route`, `offer`. The clarify format (224) is untouched.
  - **Consumes:** same four as F10
- **F13** [product] — `add-build.md`: `interaction`, `checkpoint-route` (agent: the `confirm` row drops
  the offer; `semi-automatic` stays a deciding stop in batch format), `closing-route`, `offer`.
  - **Consumes:** same four as F10
- **F14** [product] — `add-review.md`: `interaction`, `staging-consent`, `closing-route`, `offer`. The
  `staging-consent` **fallback** is today's text with the tool call made conditional in the wording
  `add-brainstorm.md` 327-329 already uses — the provider's structured-question tool where the
  `structuredQuestions` capability declares one, an option table otherwise. A fallback is static text,
  so the condition is read by the model, as it is in `add-brainstorm` today. That is the bug fix every
  human gets (allowed difference c); its **agent member**
  stages without asking and prints one line naming what was staged, as `--yolo` does. Row 237 is
  edited in place to point at STEP `add-review.setup`'s consent rule instead of naming the tool (same
  allowed difference c). The `git add` lines stay outside the slot.
  - **Consumes:** same four as F10
- **F15** [product] — `add-done.md`: `interaction`, `ci-watch`, `offer`. The `ci-watch` agent member
  runs `gh pr checks` once, without `--watch`; with any check pending it stops, says CI is pending and
  names `/add-done` as the next command, which the Resume route (134-196) re-runs once the entry is on
  the branch. A failed or passing check is read exactly as today. No merge stop is added.
  - **Consumes:** same four as F10
- **F16** [product] — `add-diagnose.md`: `interaction`, `offer`.
  - **Consumes:** same four as F10
- **F17** [product] — `add-hotfix.md`: `interaction`, `offer`.
  - **Consumes:** same four as F10
- **F18** [product] — `add-qa-setup.md`: `interaction`, `install-confirm` (agent: every missing
  prerequisite's exact command in one numbered batch; after the answer, run each confirmed set one at a
  time, as today), `config-values` (agent: every project-specific value asked in one batch), `offer`.
  `## Materializes` is not touched.
  - **Consumes:** same four as F10
- **F19** [product] — `add-pull-request.md`: `interaction`, `offer`.
  - **Consumes:** same four as F10
- **F20** [product] — `add-audit.md`: `interaction`, `offer`.
  - **Consumes:** same four as F10
- **F21** [product] — `add-wiki.md`: `interaction`, `offer`.
  - **Consumes:** same four as F10

#### Phase D — guide, ecosystem, frozen map

- **F22** [product] — `framwork/.codeadd/agent-mode/README.md`: turn the feature on
  (`--enable-feature agent-mode`, both `install` and `modify`), the answer format (`1a, 2b`,
  `recommended`, free text per number), the corrected `/add-done` line in section 3 (it merges
  automatically after its gates — line 54 today says the opposite), and that an `automatic` delivery
  can chain several stages in one call. Ref: design, Proposed Solution 5.
- **F23** [product] — `add--ecosystem/SKILL.md`: the `agent-mode` row in `## Features` (218-223), the two
  new skills in the skills tables, and 322-323 naming `add--human-interaction` as the owner of both ids.
  - **Consumes:** `FEATURES['agent-mode']` (F3), `add--agent-interaction` (F8)
- **F24** [product] — `cli/tests/build-injection-points.test.js` — **runs in Phase A, right after F3**
  (Execution Order): the nonempty-fallback assertion becomes "`plan-specs` plus every `agent-mode.*`
  slot", which holds with zero agent-mode slots; its title loses the counts ("freezes the slot
  membership map and its nonempty fallbacks"), so the counts can move without renaming it again. The
  old title is a removed test name: the commit carries `Test-Removed:` naming it. The fixture and the
  counts are then updated by each Phase C F-block (rule 6). Ref: STEP 4 answer 3.
  - **Produces:** `nonempty fallbacks = plan-specs + agent-mode.*`

#### Phase E — internal

- **F25** [internal] — `workbench/skills/add-interaction/SKILL.md` (new) + `workbench/provider-map.json`:
  the batch rule — every stop that asks sends all its questions in one message, `### N.`, options
  `a)/b)/c)`, `RECOMMENDED: x — why`, answered `1a, 2b`, `recommended` or free text per number; a
  partial answer re-asks only what is left; never a structured-question tool; and the one named
  exception (brainstorm 8.1). It does not restate the stopping rule `add-plan-authoring` owns.
  - **Produces:** `add-interaction`
- **F26** [internal] — `workbench/skills/add-framework--brainstorm/SKILL.md`: 2.1.1 (174-196) the draft
  objective becomes item 1 of the first batch; 2.1.2 (198-209), 4.2 loop (380-440), 3.2/3.3 (337-351),
  4.4 (450-467), 6.2 (677-687), 7.3 (724-764) and Rules 930 point to `add-interaction`; the
  structured-tool and option-table paragraphs (428-436, 733-735) leave; 8.1 (859-874) stays numbered
  with an explicit line saying why it carries no recommendation; "What do you want to explore?" stays
  one free-text question.
  - **Consumes:** `add-interaction` (F25)
- **F27** [internal] — `add-framework--plan/SKILL.md`: STEP 4 (376-439) asks through `add-interaction`;
  line 419 becomes a mandatory recommendation per question.
  - **Consumes:** `add-interaction` (F25)
- **F28** [internal] — `add-framework--build/SKILL.md`: STEP 2 (204-223) and STEP 9 (630-635) ask one
  numbered item; 524-528 collects every such finding into one batch instead of one at a time.
  - **Consumes:** `add-interaction` (F25)
- **F29** [internal] — `add-framework--done/SKILL.md`: the plan pick (107, 150-152) and the per-deletion
  question (449) go out as one batch.
  - **Consumes:** `add-interaction` (F25)
- **F30** [internal] — `add-plan-authoring/SKILL.md`: the candidate pickers (629, 644-649) point to `add-interaction`.
  - **Consumes:** `add-interaction` (F25)
- **F31** [internal] — `add-build-ledger/SKILL.md`: the four hard stops (147-162) present in batch format.
  - **Consumes:** `add-interaction` (F25)
- **F32** [internal] — `add-review-discipline/SKILL.md`: a `blocked` verdict's blockers (194-195) go out as one batch.
  - **Consumes:** `add-interaction` (F25)
- **F33** [internal] — `workbench/commands/add-framework--release.md`: STEP 2 type (76) and STEP 3 bump
  (107, 113) merged into one batch; "Create this release?" (218-220) one numbered item.
  - **Consumes:** `add-interaction` (F25)
- **F34** [internal] — `workbench/commands/add-framework--backlog.md`: candidate handling (49-53,
  128-136) numbered; the no-confirm rule (61-63) is kept.
  - **Consumes:** `add-interaction` (F25)
- **F35** [internal] — `workbench/skills/add-commit/SKILL.md`: the ambiguous-type confirm (56) and
  `--confirm` (83) as one numbered item.
  - **Consumes:** `add-interaction` (F25)
- **F36** [internal] — `workbench/skills/building-commands/SKILL.md`: one pattern block in `## Gate
  Implementation` (150-185) so a new command's stop is written in batch format.
  - **Consumes:** `add-interaction` (F25)
- **F37** [internal] — `workbench/skills/add-final-report/references/result-block.schema.json`:
  `description` text only — "the question" → "the numbered question batch" (14, 89, 97). STEP 4 answer 7.
- **F38** [internal] — `workbench/skills/add-framework-injection/SKILL.md`: the nonempty-fallback rule
  and its validation line become "`plan-specs` and the `agent-mode.*` slots"; it gains one line saying a
  fallback's placeholders are resolved per provider at install.
  - **Consumes:** `fallback text resolved per provider` (F1)
- **F39** [internal] — `AGENTS.md`: the Feature Injection table gains `agent-mode` (disabled, the 12
  commands) and the missing `board` row; *Where the details live* gains "How an internal stop asks →
  `add-interaction`" and "How a product command talks to a human or a bot → `add--human-interaction` /
  `add--agent-interaction`". The generated inventory line is left to `node scripts/inventory.js`.
  - **Consumes:** `FEATURES['agent-mode']` (F3), `add-interaction` (F25)

### Does NOT Include (important!)

- Any change to `result.schema.json`, or to its workbench mirror beyond `description` text (F37).
- Making `/add-done`'s merge a stop.
- A feature flag in the workbench.
- Removing `structuredQuestions` from either provider map.
- Slots inside fragments of other features or inside skills — `qa-pipeline/add-build.md` 24-31's
  "CONFIRM" stays, covered by the agent skill's confirming-stop rule (documented limit).
- A slot for a plain deciding stop or picker (Current State, last paragraph of the line map).
- `add-help` and `add-ux`: `add-help` reads the guide at answer time (198-202) and restates nothing.
- README / web docs refresh — `/add-framework--sync` does it before a release.
- Any provider other than Claude Code in the guide's JSON contract.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Feature, skills, slot rule, stop handling, schema, `/add-done` merge, `add-review` fix, internal rule, 8.1, proof | As the intent file's `## Decided` | Intent file; design Key Decisions |
| How the off-render is proven unchanged | *STEP 4* — one-time base-vs-branch diff of the **installed** render during the build, recorded in the ledger, plus permanent render tests; no frozen copy of 72 files | A frozen copy breaks on every future command edit; the base build is reachable once, at build time |
| The allowed off-render differences | *STEP 4* — (a) the `agent-mode.interaction` line per command; (b) the owner pointer in each offer paragraph and `add--ecosystem` 322-323, now naming `add--human-interaction`; (c) `add-review`'s capability fix, lines 237 and 257 | (b) avoids a stale pointer to a section that moved; (c) is the design's bug fix |
| Fallback placeholders | *STEP 4* — the CLI resolves them per provider (F1); the build lints them (F2) | Today `composeSlot` uses fallback bytes raw; the offer passages carry `{{skill:}}` |
| Frozen slot rules | *STEP 4* — fixture, test (F24) and `add-framework-injection` (F38) updated | Both state "one nonempty fallback" |
| Status names in bot text | *STEP 4* — Global Constraint: behaviour only | 0031B; L1.5 |
| Live run | *STEP 4* — install with the local CLI in a temporary project outside the checkout | The build output's slot regions are empty until `codeadd install` renders them |
| Pickers `add-new:57`, `add-qa-setup:197-199`, pending CI | *STEP 4* — covered by the generic rule; F15's member names the Resume re-run | Found after the design |
| Slot rule made checkable | Plan ruling — a passage is slotted only when its text names a one-question cadence, a structured-question tool, a reply cap or a continuation offer; makes a confirming stop wait; runs something that can outlive a headless call; or forces confirmations one at a time. A plain "ask which / ask and WAIT" stays unslotted. **Departs from the design's table** for the pickers, the `add-diagnose` agreement, the `add-done` QA/recovery/merge-route asks, the `add-hotfix` confirms, `add-new` decompose and epic run mode, and `add-build` publish | The design's own rule ("slot only what hangs, misleads or costs a pointless round trip"): none of those texts does any of the three once the interaction skill formats the ask; slotting them would add ~15 slots whose agent member restates the generic rule |
| How a skill pointer finds the human rules when no command loaded one | Plan ruling — the pointer reads "the interaction skill the command loaded; when none was loaded, `add--human-interaction`" | The design wants `add--backlog` at top level to keep the human offer; a pointer naming neither skill gives it nowhere to read it. Under agent-mode the command always loaded `add--agent-interaction`, so the default clause never applies there |
| `AGENTS.md` feature table | *STEP 4* — add `agent-mode` and the missing `board` | Same table, same edit |
| One plan or a set | *STEP 4* — one plan with checkpoints | One ticket, one `work_id` (`add-plan-authoring`, The Ticket) |
| The `add-diagnose` and `add-qa-setup` side contradictions | Already fixed by 0037B (PR #125, `8810660`); out of this plan | User correction at STEP 4 |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A bot runs the pipeline in one turn per decision and never calls an interactive tool | Human text moves from command bodies into ~40 fallback files; reading a command source no longer shows it inline |
| Off-render proven unchanged outside three named differences | The proof of byte-equality is one-time; later drift is caught by the render tests, not by a byte compare |
| One place for HOW to talk, per audience | Three skills shrink and two appear; every citation of the moved sections must follow |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Off-render drifts beyond the three allowed differences (a newline, a lost sentence) | Medium | L2.1 one-time installed-render diff per provider |
| A fallback with a placeholder renders unresolved | High without F1 | F1; L1.1 |
| The model still asks one at a time with the feature on | Medium | The human text is absent from the on-render (L1.6); L3 live run |
| A citation of `chat-continuation-*-v1` keeps pointing at the old owner | Medium | F9; L1.4 grep over `framwork/.codeadd` and `cli/tests` |
| A missed human-only passage still blocks a bot | Medium | The slot rule above; the generic skill covers every unslotted stop; L3 walks brainstorm → new → plan |
| An agent-mode slot merges with a neighbouring slot of another feature | Low | Global Constraint (one member per agent-mode slot); L1.3 |
| Bot text drifts toward the rejected prompt-driven output contract | Low | Global Constraints; L1.5 extended to the new skill and the fragment dir |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/src/injection-core.js` | product | modify | F1 |
| `scripts/build.js` | internal | modify | F2 |
| `cli/src/features.js` | product | modify | F3 |
| `framwork/.codeadd/skills/add--human-interaction/SKILL.md` | product | create | F4 |
| `framwork/.codeadd/skills/add--agent-interaction/SKILL.md` | product | create | F8 |
| `framwork/provider-map.json` | product | modify | F4, F8 |
| `framwork/.codeadd/skills/add--delivery-mode/SKILL.md` | product | modify | F5 |
| `framwork/.codeadd/skills/add--final-report/SKILL.md` | product | modify | F6 |
| `framwork/.codeadd/skills/add--feature-specification/SKILL.md` | product | modify | F7 |
| `cli/tests/chat-continuation-handoff.test.js` | product | modify | F9 |
| `framwork/.codeadd/commands/add-{brainstorm,new,plan,build,review,done,diagnose,hotfix,qa-setup,pull-request,audit,wiki}.md` | product | modify | F10–F21 |
| `framwork/.codeadd/fragments/agent-mode/<the 12 commands>.md` | product | create | F10–F21 |
| `framwork/.codeadd/fallbacks/agent-mode.interaction.md` and `agent-mode.<command>.<subject>.md` | product | create | F10–F21 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F22 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F23 |
| `cli/tests/fixtures/slot-membership-map-v2.json`, `cli/tests/build-injection-points.test.js` | product | modify | F24 |
| `cli/tests/agent-mode-feature.test.js` | product | create | L1 levels |
| `workbench/skills/add-interaction/SKILL.md`, `workbench/provider-map.json` | internal | create / modify | F25 |
| `workbench/skills/add-framework--{brainstorm,plan,build,done}/SKILL.md` | internal | modify | F26–F29 |
| `workbench/skills/{add-plan-authoring,add-build-ledger,add-review-discipline}/SKILL.md` | internal | modify | F30–F32 |
| `workbench/commands/add-framework--{release,backlog}.md` | internal | modify | F33, F34 |
| `workbench/skills/{add-commit,building-commands}/SKILL.md` | internal | modify | F35, F36 |
| `workbench/skills/add-final-report/references/result-block.schema.json` | internal | modify | F37 |
| `workbench/skills/add-framework-injection/SKILL.md` | internal | modify | F38 |
| `AGENTS.md` | internal | modify | F39 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

**Expected end-state map — agent-mode slots (namespace `feature:agent-mode`, one member each):**

| Command | Slots | Count |
|---|---|---|
| `add-brainstorm` | interaction, output-cap, cap-scope, objective-draft, cadence, structured-ask, approval-ask, offer, rules-cadence | 9 |
| `add-new` | interaction, output-cap, confirm-wait, closing-route, offer | 5 |
| `add-plan` | interaction, stop-kinds, preview-wait, closing-route, offer | 5 |
| `add-build` | interaction, checkpoint-route, closing-route, offer | 4 |
| `add-review` | interaction, staging-consent, closing-route, offer | 4 |
| `add-done` | interaction, ci-watch, offer | 3 |
| `add-qa-setup` | interaction, install-confirm, config-values, offer | 4 |
| `add-diagnose`, `add-hotfix`, `add-pull-request`, `add-audit`, `add-wiki` | interaction, offer | 2 each |
| **Total** | | **44 slots, 44 memberships** → frozen map **108 slots, 115 memberships** |

A split recorded under Phase C rule 5 raises both totals by one per split; the ledger names each.

### L1 — Build and render (RED → GREEN), in `cli/tests/agent-mode-feature.test.js` unless noted

1. A slot with no contributing member renders its fallback with `{{skill:}}` and `{{cmd:}}` resolved for each provider, equal to what `resolvePlaceholders` gives the same text as a member; `plan-specs` and `empty.md` render byte-identical to today. *RED today: `composeSlot` returns `slot.fallback` raw.*
2. `FEATURES['agent-mode']` exists, `default: false`, `commands` equals the 12-command list. *RED: no entry.*
3. The emitted sidecar carries exactly the end-state map above: every `agent-mode.*` slot has one member, `feature:agent-mode`, and its fallback path matches the safe-path rule (F24 updates the frozen fixture to the same map). *RED: no such slot.*
4. **Extracted sections**, in three parts that go green at different F-blocks. *RED: the skill does not exist.*
   - **(a)** each section listed under *Current owners* exists in `add--human-interaction` byte-equal to its text at the base commit (the test carries those texts as fixtures copied at F4) — green at F4;
   - **(b)** each of those sections is absent from its old owner — green at F5, F6, F7 respectively;
   - **(c)** no file under `framwork/.codeadd/` or `cli/tests/` names `add--delivery-mode` or `add--final-report` as owner of a `chat-continuation-*-v1` id — green at F23, the last F-block that removes such a citation. F4–F21 do not run (c).
5. L1.5 of `agent-mode.test.js` extended to `fragments/agent-mode/` and `fallbacks/`; and no file in the agent-mode fragment dir or `add--agent-interaction` contains `needs-approval`, `stopped`, `next_step` or `structured_output`. *RED for the new paths: they do not exist.*
6. **On-render** — in a temporary install with every feature on, every agent-mode slot of every provider renders its member text and no fallback text of any `agent-mode.*` slot appears in any installed command, including every "→ removed" slot. *RED: no feature.*
7. **Off-render, permanent half** — in a temporary install with default features, each `agent-mode.*` slot renders its resolved fallback and no member text appears. *RED: no slots.*
8. `node scripts/build.js` exits 0 with no new warning, and a fallback holding a raw `.codeadd/` path warns (F2). *RED: fallbacks are not linted.* The baseline is the warning list of `node scripts/build.js` on the base commit, recorded in the ledger before F1 lands; "no new warning" is checked against that list.

### L2 — Integration (one-time, recorded in the ledger)

1. **Off-render diff.** Build the base commit (`git worktree` at the plan's base SHA) and the branch; install each into a fresh temporary project outside the checkout with the local CLI and default features; diff every installed file of the 12 commands, per provider. The only differences allowed are (a), (b) and (c) of Validated Decisions; the ledger records the diff summary per provider. Any other difference is a hard stop.
2. `chat-continuation-handoff.test.js` and `build-injection-points.test.js` pass with F9 and F24.
3. The full suite through `scripts/run-tests.js` (framework default, then `all`) passes; `scripts/test-loss-guard.cjs` passes.
4. `npm run build:workbench` exits 0, and the built `.claude/skills/add-interaction/SKILL.md` exists.

### L3 — Combination matrix

1. **All toggle states** — `agent-mode` × `board` × `tdd-pipeline` × `qa-pipeline` × `docs-pruning` on the commands they share: every expected section once, every unexpected one absent.
2. **Shared-anchor non-collision** — no agent-mode slot shares a slot with another feature's member (L1.3 already asserts one member each).
3. **Partial disable** — disabling `agent-mode` with the others on leaves their slots byte-untouched.
4. **Order independence** — enabling `agent-mode` first or last gives identical bytes.
5. **Full round-trip** — enable all, disable all: bytes equal the default-features render.

### L4 — Behavioural acceptance

1. **Live run (manual, once).** Build; in a temporary git project outside the checkout run `codeadd install --providers claude --enable-feature agent-mode` from the local CLI; run brainstorm → new → plan through `claude -p` + `--resume` with `--output-format json --json-schema` holding the product schema. It passes when, per the design: every stop that waits arrives as one numbered batch with a recommendation per item; no `AskUserQuestion` call appears in the transcript; no continuation yes/no is asked; every result has a valid `status`, and a waiting stop returns `needs-approval`; each closing ends on the next command; the answer `recommended` is accepted. Record each envelope's `status` and `session_id` and the transcript check in the ledger. A failed criterion is a hard stop: report it, do not edit a prompt to make it pass inside the same run.
2. **Internal batch.** Each of F26–F36 is checked by reading the built copy: no "one question" / "one per message" / structured-tool wording remains, and each asking stop points to `add-interaction`; 8.1's no-recommendation line is present.

**RED expectations against the current tree:** L1.1–L1.8 fail; L2.1 has nothing to compare; L3 has no feature; L4 cannot run.
**GREEN = all levels pass after F1–F39.**

---

## Execution Order

0. Before F1: record the base `node scripts/build.js` warning list in the ledger (L1.8).
1. **Phase A:** F1 [product] → F2 [internal] → F3 [product] → F24 [product]. F1 first: every fallback written later depends on it. F24 here so the frozen-map assertion already accepts agent-mode slots when Phase C adds them. *Checkpoint — green; nothing renders differently.*
2. **Phase B1:** F4 [product] → F8 [product]. The two skills exist; the sections are **copied** into `add--human-interaction` and still present in their old owners, so nothing points at a gap. *Checkpoint — green.*
3. **Phase C:** F10 → F21 [product], one command per commit, each carrying its own fixture update (rule 6). F10 creates the shared interaction fallback. From here every command loads `add--human-interaction` through its interaction fallback. *Checkpoint — green.*
4. **Phase B2:** F5 → F6 → F7 → F9 [product]. Only now do the sections leave their old owners — after every command already loads the new owner, so the human rule is never a dangling pointer. F9 moves the test's owner constants in the same phase. *Checkpoint — green.*
5. **Phase D:** F22 → F23 [product]. F23 closes L1.4(c). *Checkpoint — run L2.1, L2.2, L3.*
6. **Phase E:** F25 [internal] → F26 → … → F36 → F37 → F38 → F39 [internal]. *Checkpoint — L2.3, L2.4, L4.2.*
7. **L4.1** live run, last.

Each phase boundary leaves the repository green, and so does each F-block commit; a build that has to stop stops there.

Per-F-block validation beyond the layer default: F10–F21 each run L1.3, L1.6 and L1.7 scoped to that command before commit; F4 runs L1.4(a); F5, F6 and F7 run L1.4(b) for their own skill; F23 runs L1.4(c).

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched with the F-block id, the validation levels that cover it and their state, and any decision deferred or altered with the design section it departs from.

Gaps a reviewer must hunt:

1. An F-block marked done whose validation level was never RED.
2. A fallback that is not byte-equal to its base passage beyond allowed difference (b) — L2.1's diff is the only place this shows.
3. A Phase C slot that wraps a `STEP` heading or sits inside a table.
4. Any agent-mode text naming a status, a schema field, `json-schema` or `result block`.
5. A plain deciding stop that turned out to name a cadence or a tool and was left unslotted — grep the 12 commands' on-render for `AskUserQuestion`, `structured-question`, `one question`, `20 words` and `Offer the continuation`; every hit must sit inside a fallback.
6. An internal stop still asking one question at a time after Phase E.

## References

- Design set: `docs/brainstorming/2026-10-09T145554-agent-mode-feature.md`, `docs/brainstorming/2026-10-09T145554-agent-mode-feature-intent.md`
- Prior art: `2026-10-08T193103-PLAN--product-agent-mode-claude-code` (0031B — guide, schema, no output instructions in prompts); `2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids` (slots and fallbacks); `2026-10-04T185331-PLAN--optional-chat-continuation-handoff` (the contracts that move); `2026-10-09T105631-PLAN--non-interactive-installer` (0036B — `--enable-feature` without a TTY)

---

## Next Steps

/add-framework--build docs/plans/2026-10-09T184411-PLAN--agent-mode-feature.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-09 | Initial creation |
| 2026-10-09 | Review `fix-then-ok` applied: F1 names both `composeSlot` callers; L1.4 split into (a)/(b)/(c) by the F-block that turns each green; F24 moved to Phase A with a count-free title and `Test-Removed:`, fixture updated per Phase C F-block; extraction (F5–F7, F9) moved after Phase C so the human rule never dangles; F14 names how the capability is read; slots never inside a fenced block; base warning list recorded before F1; gap 5 given a grep |
| 2026-10-09 | Implemented on feat/agent-mode-feature, commits a14dd45..61c5472 (see the ledger for rulings) |

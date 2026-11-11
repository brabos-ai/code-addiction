# Plan: agent-mode efficiency — error stops with no alternative, add-build live under the other features, CLI warning on providers without injection

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-10-11
> **Delivery:** confirm
> **Ticket:** 0039B

---

## Objective

[from conversation, no design document — the ticket 0039B is the specification]

Cut the extra rounds agent-mode still costs a bot: an error stop ends on the reason and the command that
unblocks it, with no alternative offered; `/add-build` is proven live with agent-mode + qa-pipeline +
tdd-pipeline; the CLI warns when a feature is enabled on a provider where it does nothing; the
"Offer the continuation" STEP titles are evaluated and the decision recorded.

**When this build is done:** `add--agent-interaction` forbids an alternative at an error stop and says a
failed prerequisite gate is an error stop even where the command's gate table calls it deciding; the CLI
prints one warning naming Codex, Antigravity and ZCode when a feature is explicitly enabled with any of
them installed; a recorded live run shows `/add-build` under the three features with no hang and no extra
round, and shows the `docs_loaded` stop closing with no alternative; the title decision is in the ledger.

**Ticket done when:** Um stop de erro sob agent-mode termina com motivo e comando que destrava, sem alternativa; o /add-build roda ao vivo com agent-mode + qa-pipeline + tdd-pipeline sem travar nem custar rodada extra; o CLI avisa ao habilitar agent-mode em Codex, Antigravity e ZCode; item 4 avaliado e decisao registrada.

## Context

All four items are gaps the live run of `2026-10-09T184411-PLAN--agent-mode-feature` recorded and left
open (its `ledger.md`, L4.1 lines). Item 1 cost one extra call (c6): `/add-plan` stopped at `docs_loaded`
and the closing offered "plan with about.md only". Item 2 was never exercised: only agent-mode was on and
`/add-build` was not run. Item 3: `framwork/.codeadd/agent-mode/README.md` §7 already says the flag changes
nothing on Codex, Antigravity and ZCode, but the CLI says nothing at enable time.

**Root cause of item 1, read from the code.** `add-plan.md` classifies `docs_loaded` as **deciding** in
its GATES table. `add--agent-interaction` § Approval and deciding stops tells the bot to put a deciding
stop as numbered items with options — so the bot turned a missing file into a choice. § Error stops says
what to name, never what NOT to offer. The fix belongs in the skill, which every agent-mode fragment loads
(12 dependants), not in each command's gate table.

No design or intent file exists. Source documents: ticket 0039B on the board; `.tmp/agent-mode-efficiency.md`
(same four items).

## Global Constraints

- Menor esforco, sem over-engineering (ticket 0039B, notes)
- Command STEP ids and headings stay stable: `injection-points.json` stores heading text as anchors (`framwork/.codeadd/injection-points.json`, e.g. `"text": "### STEP add-build.handoff Offer the continuation — \`confirm\`"`)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Tests run only through `node scripts/run-tests.js` in the container, never `npx vitest` in `cli/` (project memory, feedback_testes_no_container)
- The live run installs into a scratch project outside the checkout; nothing is written in the checkout by it (L4.1 ruling, agent-mode-feature ledger)

## Problem

1. **An error stop offers a way around itself** — under agent-mode a failed prerequisite gate marked
   `deciding` is rendered as a choice, and the bot spends a call taking it.
2. **`/add-build` under agent-mode with qa-pipeline and tdd-pipeline is unverified** — its fragments
   (qa-pipeline's confirmation gate, the tdd gate) never ran under a bot.
3. **The CLI enables a feature silently where it does nothing** — Codex, Antigravity and ZCode install
   commands as skills (`commandsSubdir: null` in `cli/src/providers.js`), and feature injection only
   targets providers with a `commandsSubdir` (`cli/src/injection-core.js` `resolveResourceTargets`).
4. **"Offer the continuation" titles stay in both modes** — 11 commands; it is unknown whether the
   heading pushes a bot to offer one.

## Proposal

One rule in the shared skill for item 1. One warning helper in `cli/src/features.js`, called at the three
explicit-enable entry points, for item 3. One live run in a scratch project that covers items 1, 2 and 4
together, with any defect it shows fixed in the smallest place it lives. Item 4 is decided by that run's
evidence: keep the titles unless the run shows a continuation offer.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/skills/add--agent-interaction/SKILL.md` § Error stops: add that an
  error stop asks nothing and offers no alternative, exception or workaround — only what failed, why, and
  the one command that unblocks it; and that a gate stopping on a missing prerequisite (a file, a document,
  a setup) is an error stop here even when the command's gate table classifies it `deciding`. § Closing
  item 2 (open decisions) writes none for an error stop. Add the matching line to § Rules NEVER. Must NOT
  change the § Questions format or the deciding-stop rule for real choices. § Approval and deciding stops
  gets one line: an error stop outranks the command's own stop-kind label. Same F-block, second file:
  `framwork/.codeadd/fragments/agent-mode/add-plan.md` `section:stop-kinds` — its line "Every gate above
  that stops is deciding — each presents a failure or a choice" is the agent-mode text injected next to
  `docs_loaded` and tells the bot the opposite; reword it so a gate that fails on a missing prerequisite
  is an error stop under `add--agent-interaction`. It is the only agent-mode fragment carrying that line
  (grep). The fallback `fallbacks/agent-mode.add-plan.stop-kinds.md` is the human (feature-off) text and
  stays as it is.
  - **Produces:** the error-stop rule "no alternative" in `add--agent-interaction`
- **F2** [product] — `cli/tests/agent-mode-feature.test.js`: a text-contract test under the L1.5 describe
  asserting § Error stops forbids an alternative and covers a prerequisite gate classified deciding, and
  that the agent-mode `add-plan` fragment's `stop-kinds` section no longer calls a failed prerequisite
  gate a deciding choice. Written RED before F1.
  - **Consumes:** the error-stop rule "no alternative" in `add--agent-interaction` (F1)
- **F3** [product] — `cli/src/features.js`: export `warnUninjectedProviders(cwd, featureKey)`. It reads
  the manifest at call time (providers and scope, through `resolveSelected` as `injection-core.js` does)
  and logs ONE `log.warn` naming
  the feature and the labels of every provider with no `commandsSubdir`, saying they install commands as
  skills and receive no feature injection, so the feature has no effect there. Silent when none is
  installed. Called from: `features enable <name>`, the interactive `features` menu for each newly enabled
  feature, `modify --enable-feature` (`cli/src/modify.js`, the `diff.features.enable` loop) and
  `install --enable-feature` (`cli/src/installer.js`, only for names in `requested.features` set true —
  never for registry defaults such as `tdd-pipeline`). Call order: in `modify.js` after the provider
  change (`applyAdd`/`applyRemove`), in `installer.js` after `writeManifest`, so the manifest read sees
  the final providers. Every call passes the canonical key, never a retired alias (`canonical` in
  `features.js`). Applies to every feature, not only agent-mode (see
  Validated Decisions). Must NOT change enable behaviour, exit codes or the manifest.
  - **Produces:** `warnUninjectedProviders` exported from `cli/src/features.js`
- **F4** [product] — `cli/tests/features.test.js`, `cli/tests/modify.test.js` and `cli/tests/installer.test.js`: tests that enabling a
  feature with codex installed warns once, naming Codex; with antigrav and zcode names both; with only
  claude/cursor/opencode stays silent; a default-enabled feature on install does not warn. Written RED
  before F3.
  - **Consumes:** `warnUninjectedProviders` exported from `cli/src/features.js` (F3)
- **F5** [product] — live run, no file in the checkout unless a defect is found. Build the product, render
  it into a scratch git project outside the checkout with agent-mode + qa-pipeline + tdd-pipeline on (the
  `C:/tmp/render.mjs` route of the agent-mode-feature L4.1 ruling: copy built `framwork/.codeadd` and
  `framwork/.claude`, run `captureBaselines` and `applyEnabledFeatures`), tiny fixture app. Drive
  `claude -p` headless with `--resume`, stream-json and `--json-schema` = `framwork/.codeadd/agent-mode/result.schema.json`:
  `/add-new` → `/add-plan`. The light path of `/add-new` writes no discovery.md (agent-mode-feature ledger,
  c5 and "FINDING OUTSIDE THIS DELIVERY"), so `/add-plan` stops at `docs_loaded`: record that closing — it
  is the item-1 check. The commands it names loop back to the same stop, so the run does NOT take them:
  the build hand-places a minimal `discovery.md` in the scratch feature folder (a ruling in the ledger),
  then runs `/add-plan` again → `/add-build` → answers its publish question `no`. Record per call in the ledger: status, turns, cost, AskUserQuestion count, continuation-offer
  wording count, extra rounds. Budget ceiling: stop the run at about $5 and record where it stopped.
  - **Consumes:** the error-stop rule "no alternative" in `add--agent-interaction` (F1)
- **F6** [product] — conditional on F5: each defect the run shows (a hang, an extra round, an interactive
  tool call, a continuation offer) is fixed in the smallest artefact that owns it — the fragment of the
  feature whose text caused it (`framwork/.codeadd/fragments/{qa-pipeline,tdd-pipeline,agent-mode}/add-build.md`)
  or the skill — one ruling per defect in the ledger, then the failing call is re-run once. No defect → F6
  is a ledger line saying so, and no file changes.
- **F7** [product] — item 4 decision, recorded as a ledger ruling: keep the "Offer the continuation"
  headings when F5 shows zero continuation offers at every closing (the agent-mode `offer` section already
  overrides the body, and renaming breaks the anchors in Global Constraints); if F5 shows an offer at a
  handoff, the fix is the `offer` section of that command's agent-mode fragment, not the heading.

### Does NOT Include (important!)

- Fixing `/add-new`'s light path writing no discovery.md, which makes `docs_loaded` stop a bounded
  delivery (agent-mode-feature ledger, "FINDING OUTSIDE THIS DELIVERY"). Different problem; its own ticket.
- Changing the `deciding` label in any command's GATES table — F1 handles it in the one shared skill.
- Renaming any STEP heading or id.
- The board feature in the live run — the ticket names agent-mode + qa-pipeline + tdd-pipeline; board
  needs a `board` branch in the scratch project and adds cost for no item of this ticket.
- Making features work on Codex, Antigravity or ZCode.
- A warning when a provider without injection is ADDED to a project that already has features on.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does the error-stop fix live? | `add--agent-interaction` only | It is what turned a deciding gate into a choice; 12 fragments load it; editing 12 gate tables costs more and leaves the next gate exposed |
| Warn for agent-mode only, or every feature? | Every feature, explicitly enabled | Injection never reaches `commandsSubdir: null` providers for any feature (`injection-core.js`); same code, and a true message for all. Defaults stay silent so a normal install is not noisy |
| How is `/add-build` tested live? | Scratch project + `claude -p`, as the agent-mode-feature L4.1 run did | Proven route; the installer downloads a release ZIP and cannot carry the branch |
| Item 4 | Keep the headings unless the live run shows an offer | Anchors depend on heading text; the body is already overridden |
| Ticket asks the CLI to warn "ao habilitar" | `features enable`, interactive menu, `install` and `modify` flags | Every explicit-enable route found by reading `cli/src` (the graph does not model it) |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The live run costs more than planned | Medium | F5 budget ceiling of ~$5, stop point recorded |
| The unblocking command loops back to `docs_loaded`, so the run cannot reach `/add-build` by it | High | F5 hand-places a minimal discovery.md after recording the stop; the loop itself is out of scope (Does NOT Include) |
| A warning on install for default features adds noise | Low | F3/F4: only names in `requested.features`; F4 asserts defaults stay silent |
| F6 touches a fragment and changes the injected end state | Low | F6 re-runs the build and the full cli suite (L2) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add--agent-interaction/SKILL.md` | product | modify | F1. Graph: 12 direct dependants (the agent-mode fragments) — HIGH; additive rule, no contract they read changes |
| `framwork/.codeadd/fragments/agent-mode/add-plan.md` | product | modify | F1, `section:stop-kinds` |
| `cli/tests/agent-mode-feature.test.js` | product | modify | F2 |
| `cli/src/features.js` | product | modify | F3. NOT VERIFIED by the graph (it does not model `cli/src`); callers found by reading: `modify.js`, `installer.js` |
| `cli/src/modify.js` | product | modify | F3 call site |
| `cli/src/installer.js` | product | modify | F3 call site |
| `cli/tests/features.test.js`, `cli/tests/modify.test.js`, `cli/tests/installer.test.js` | product | modify | F4 |
| `framwork/.codeadd/fragments/{qa-pipeline,tdd-pipeline,agent-mode}/add-build.md` | product | modify only if F5 finds a defect | F6 |
| `docs/changelog/` | internal | create | build STEP 8 |

Delivery index: `history add--agent-interaction --layer product` — 1 live entry, 0 dead. Nothing was
shipped and dropped. `AGENTS.md` is not changed.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.**

### L1 — Unit / text contracts (RED → GREEN)

1. F2: § Error stops of `add--agent-interaction` states no alternative is offered and that a
   prerequisite gate classified deciding is an error stop. *RED today: the section names the unblocking
   command only.*
2. F4: enabling a feature with codex installed emits exactly one warning naming `Codex (OpenAI)`; with
   antigrav + zcode it names both labels; claude/cursor/opencode only → no warning; `install` with no
   `--enable-feature` → no warning even though tdd-pipeline is enabled. *RED today: no warning exists.*

### L2 — Integration

1. `node scripts/build.js` exits 0, no new warning.
2. `node scripts/run-tests.js cli` passes (container), with the new tests included.

### L3 — Behavioural acceptance (live, F5)

1. `/add-build` with agent-mode + qa-pipeline + tdd-pipeline reaches its closing: 0 AskUserQuestion
   calls, 0 continuation offers, no call spent on a question that was not needed, every result a valid
   `status`.
2. The `docs_loaded` stop closes with the reason and the command that unblocks it, and offers no
   alternative, exception or question.
3. Every closing across the run: 0 continuation-offer wording (F7 evidence).

**RED expectations against the current tree:** L1.1 and L1.2 fail. L3.2 failed in the earlier live run (c5).
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

F2 (RED) → F1 → F4 (RED) → F3 → L2 → F5 → F6 → F7

- **F1 before F5** because the live run checks the new error-stop rule.
- **F3 before F5** is not required; it goes first only to keep the cheap, deterministic work together.
- After F3 the repo is in a working state; F5–F7 add evidence and at most fragment fixes.
- After F6 changes any file, re-run L2 before F7.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched with the F-block id, the validation level
and its state, and any decision altered.

Gaps a reviewer must hunt:

1. An F-block marked done whose test was never RED.
2. F5 recorded as complete with `/add-build` never reaching its closing — the run must show the closing,
   or record where it stopped and why.
3. F3 warning firing for default features on a plain install.

## References

- Prior art: `2026-10-09T184411-PLAN--agent-mode-feature` — the live-run method and the four findings.
- `2026-10-08T193103-PLAN--product-agent-mode-claude-code` — the guide and the result schema.

---

## Next Steps

/add-framework--build docs/plans/2026-10-11T150730-PLAN--agent-mode-efficiency.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-11 | Initial creation |
| 2026-10-11 | Review fix-then-ok: F5 hand-places discovery.md after recording `docs_loaded` (B1), L3.2 and the risk row reworded; F1 also rewords the agent-mode add-plan `stop-kinds` section and adds the outranking line (A1); F3 signature and call order fixed, canonical key (A3, A4); installer test named in F4 (A2); decision row softened (N1) |
| 2026-10-11 | Implemented on feat/agent-mode-efficiency; commits be468ed..HEAD (F1-F4, F8) |

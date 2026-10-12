# Plan: Agent mode session and worktree rule — always `--resume <session_id>`, one worktree per agent

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-12
> **Delivery:** confirm
> **Ticket:** 0050B

---

## Objective

[from conversation, no design document] The agent-mode guide and the workbench result-block doc tell a
bot to always resume with the `session_id` from the envelope and to run each agent in its own git
worktree. Neither offers `claude -c` any more. The public docs site explains agent mode.

**When this build is done:** a bot reading either guide has one way to continue a run
(`--resume <session_id>`) and one way to run in parallel (one worktree per agent). The `claude -c`
fallback is gone from both docs, from the workbench schema and from the tests that used to require it.
`web/src/pages/docs.astro` has an Agent Mode section, reachable from the sidebar and from an
`agent-mode` card in Optional Features.

**Ticket done when:** README and result-block.md remove every claude -c mention; both state the rules always --resume <session_id> from the envelope, never -c/--continue, never newest .jsonl, always one git worktree per agent, never switch branches in a shared checkout; web docs.astro has an Agent Mode sidebar entry and section covering enablement, bot behavior and the session_id/worktree rule, and the web build passes

## Context

Both guides offer `claude -c` as an option ("use it only when no other run started there since").
That option is unsafe when several bots share a directory. `-c` picks the most recent session there, so
it can pick another bot's session. The same goes for a bot that finds its session by reading the newest
`.jsonl`. Several bots in one checkout also switch branches under each other.

The board is not affected. It lives in its own clone, outside every checkout (ticket note).

No design document and no intent file. The decisions come from ticket 0050B and the user's answers in
this session (Validated Decisions).

## Global Constraints

- Docs-only: no command, skill, agent, fragment or script under `framwork/.codeadd/` changes behaviour (ticket 0050B notes: "docs-only; framework commands untouched")
- The web section describes only the current version (ticket 0050B notes: "Describe only the current version.")
- Existing test names stay unchanged. Assertions inside them flip; no `Test-Removed:` trailer is needed (`scripts/test-loss-guard.cjs`)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- The web build passes: `npm run build` inside `web/` (ticket 0050B `done_when`)

## Problem

1. **`claude -c` is offered as a safe-enough option** — README section 2 and result-block.md line 46. With two runs in one directory it resumes the wrong session.
2. **No rule on parallel agents** — nothing says one worktree per agent. Nothing forbids switching branches in a shared checkout.
3. **The tests lock the unsafe text in** — `scripts/tests/result-block.test.cjs` requires `claude -c` in the schema `status` description and in result-block.md.
4. **The workbench schema drifted from the product schema** — its `status` description says "claude -c or --resume". The product one already says "--resume <session_id>".
5. **The docs site has no agent-mode section** — and Optional Features has no `agent-mode` card, though the feature ships.

## Proposal

State the same two rules in both guides. Remove every `claude -c` mention. Flip the tests that required
it, and add a README test. Then add the web section. Each F-block pairs a doc with the test that holds it.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/agent-mode/README.md` and `cli/tests/agent-mode.test.js`.
  README section 2 ("Resume a stopped run"): replace the `claude -c` bullet with the rules. Always
  `--resume <session_id>` with `.session_id` from the envelope. Never `-c` / `--continue`. Never pick the
  newest `.jsonl` file. Always one git worktree per agent. Never switch branches in a shared checkout.
  Add one line saying the board is not affected because it lives in its own clone. Keep the section
  numbers: section 3 and section 5 point at "section 7" and "section 6". Keep everything else in the
  guide. Test: add one new `it` named `L1.8 the guide states the resume and worktree rules and no claude -c` in the `product agent mode` describe. It reads the guide and asserts no
  `claude -c`, and the anchors `--resume <session_id>`, `.jsonl` and `worktree` are present.
- **F2** [internal] — `workbench/skills/add-final-report/references/result-block.md`,
  `workbench/skills/add-final-report/references/result-block.schema.json` and
  `scripts/tests/result-block.test.cjs`. result-block.md line 46: replace the `claude -c` sentence with
  the same rules as F1, in the same order. Schema: in `properties.status.description`, replace the
  clause "the caller answers in the same session with claude -c or --resume" with the product schema's
  clause, verbatim: "the caller answers in the same session with --resume <session_id>". The other
  description differences (workbench command names, "numbered question batch") stay, because they are
  deliberate. Test: in the two existing tests at lines 154 and 160, keep the names and flip the
  assertions. `claude -c` must be ABSENT. The replaced clause keeps the substring `--resume`. `--resume` (status) and `--resume`, `session_id`, `worktree`
  (doc) must be present.
- **F3** [internal] — `web/src/pages/docs.astro`. Add a sidebar entry "Agent Mode" → `#agent-mode` in
  the Deep Dive group, right after Optional Features. Add a `<section id="agent-mode">` right after the
  `#features` section, in the same markup and classes as `#features` and `#plugins`. It covers what agent
  mode is (bots run commands headless through `claude -p` and read a JSON result, as an example other
  providers can reproduce); how to enable it (`npx codeadd install --providers claude --enable-feature
  agent-mode`, and `modify ... --force --enable-feature agent-mode`); what changes for bots (one numbered
  question batch, no continue offer, it takes effect on Claude Code, Cursor and OpenCode only); and the
  session_id / one-worktree-per-agent rule from F1. The enablement commands, the bot behaviour and the provider list are taken from README sections 6 and 7, not written fresh. It points at `.codeadd/agent-mode/README.md` for the
  full guide. Also add an `agent-mode` card to Optional Features, in the same shape as the `board` card:
  "disabled by default", the 12 commands it is injected into (AGENTS.md feature table), and a link to
  `#agent-mode`.

### Does NOT Include (important!)

- Any change to commands, fragments, `add--agent-interaction` or scripts — docs-only.
- Renumbering the README sections.
- Aligning the schema descriptions beyond the `status` resume clause.
- The landing page (`index.astro`), the top nav of `docs.astro`, README.md at the repo root — `/add-framework--sync` regenerates those at release.
- Any board change. The board lives in its own clone.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| The `claude -c` checks in result-block.test.cjs | 1a — flip them: `claude -c` must be absent. Also align the workbench schema with the product schema | User answer 1a. The tests are what locked the unsafe text in |
| A test for the product README | 2a — a new `it` in `cli/tests/agent-mode.test.js` | User answer 2a. It is the existing home of the static agent-mode checks |
| Link from Optional Features | 3a — add an `agent-mode` card that links to `#agent-mode` | User answer 3a. The feature ships and has no card today |
| Where the rules sit in the README | Section 2, with no renumbering | Section 2 is the resume section. Sections 3 and 5 point at sections 7 and 6 by number |
| How much of the schema to align | Only the resume clause of `status` | The other differences are deliberate: workbench command names, the internal numbered batch |
| Layer of `web/` | `[internal]` | Root path, not `mcp/` (add-plan-authoring, Layer Tags) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F1 — the rules replace the `-c` bullet. Not a graph node. Read at runtime by `add-help` and pointed at by `add-wiki`; both read the whole file, so no caller depends on the old text. Risk LOW (checked by hand, NOT VERIFIED by graph) |
| `cli/tests/agent-mode.test.js` | product | modify | F1 — new README test |
| `workbench/skills/add-final-report/references/result-block.md` | internal | modify | F2 — 1 direct caller (`add-final-report`, USES_SKILL). Risk MEDIUM |
| `workbench/skills/add-final-report/references/result-block.schema.json` | internal | modify | F2 — description text only. `cli/tests/agent-mode.test.js` L1.2 compares the schemas with every description removed, so it stays green |
| `scripts/tests/result-block.test.cjs` | internal | modify | F2 — two assertions flipped |
| `web/src/pages/docs.astro` | internal | modify | F3 — sidebar entry, section, feature card. Not a graph node. `cli/tests/graph-mermaid.test.js` and `loop-consolidation-0070.test.js` read this file; neither checks the new content |

Delivery index: no `gone` or `superseded` entry for `product/feature/agent-mode` or for the result block's
resume text. The live entries (product agent mode, workbench run safety) are what this plan revises.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write each test change before its doc change and see it fail on the current tree.

### L1 — Static reads (RED → GREEN)

1. `cli/tests/agent-mode.test.js`, new `L1.8`: the guide has no `claude -c` and has `--resume <session_id>`, `.jsonl` and `worktree`. *RED today: line 56 has `claude -c`; no `worktree`, no `.jsonl`.* (F1)
2. `scripts/tests/result-block.test.cjs`, status test: the schema `status` description has `needs-approval` and `--resume` and NO `claude -c`. *RED today: it says "claude -c or --resume".* (F2)
3. `scripts/tests/result-block.test.cjs`, call doc test: result-block.md has `--resume`, `session_id` and `worktree`, and NO `claude -c`. *RED today: line 46.* (F2)
4. `cli/tests/agent-mode.test.js` existing L1.2 (schema equality) stays green after F2 — schemas still equal without descriptions. (F2)

### L2 — Build and suites

1. `node scripts/build.js` exits 0 with no new warning. (F1)
2. `node scripts/run-tests.js` — the framework default — passes, the test-loss guard included. (F1, F2, F3)
3. `npm run build` inside `web/` exits 0 (`npm ci` first if `node_modules` is missing). (F3)

### L3 — Behavioural acceptance

1. A sweep for `claude -c` over `framwork/.codeadd/`, `workbench/` and `web/src/` returns no match. The only allowed hits in the repo are the absence assertions in `cli/tests/agent-mode.test.js` and `scripts/tests/result-block.test.cjs`. (F1, F2, F3)
2. In the built `web/dist/docs/` page: a sidebar link `href="#agent-mode"`, one element `id="agent-mode"`, and an `agent-mode` card in `#features` that links to `#agent-mode`. (F3)
3. The README and result-block.md each state all five rules: `--resume <session_id>` from the envelope, never `-c`/`--continue`, never the newest `.jsonl`, one worktree per agent, no branch switch in a shared checkout. Read by hand against the ticket's `done_when`. (F1, F2)

**RED expectations against the current tree:** L1 items 1-3 and L3.1 fail. L3.2 fails (no `#agent-mode`).
**GREEN = all levels pass after F1–F3.**

---

## Execution Order

F1 [product] → F2 [internal] → F3 [internal].

- **F1 first** because it is the source of the rule text. F2 copies the same rules in the same order, and F3 summarises them.
- Each F-block leaves the repo green on its own: test and doc land in the same commit.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the L-levels that cover it and their state, and any decision it changed.

Gaps a reviewer must hunt:

1. An F-block whose test was never RED — a test written after the doc proves nothing.
2. The README and result-block.md stating the rules differently, or one missing a rule.
3. The web section describing something the guide does not say — anything beyond the current version.
4. A test name changed in result-block.test.cjs — the test-loss guard reads it as a removed test.

---

## Next Steps

/add-framework--build docs/plans/2026-10-12T194640-PLAN--agent-mode-session-id-and-worktree.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-12 | Initial creation |
| 2026-10-12 | Review fix-then-ok: L3.1 sweep excludes the two test files; new test named L1.8; web copy sourced from README sections 6 and 7; status clause keeps `--resume` |
| 2026-10-12 | Implemented in F1 d5efbc3..0b8a8d5, F2 0b8a8d5..8ce3d43, F3 8ce3d43..3bc3fe2; review fix after F1 |

# Plan: agent-mode-notion — agent mode can track work in Notion, through two instruction-only skills

> **Status:** implemented
> **Layers:** both
> **Type:** skill
> **Created:** 2026-10-30
> **Delivery:** confirm

---

## Objective

[from conversation, no design document] After `remove-board` the framework has no tracker. Agent mode
gets an optional Notion integration: Notion is the single source of the project's cards and of the
workflow rules (columns, labels, how to fill a card), which are defined with the user and kept in
Notion itself. The framework ships only markdown instructions — no script, no API client, no sync —
and agents call the Notion MCP the user configured.

**When this build is done:** a user running `/add-setup` with agent mode on is offered `notion`
(recommended yes); accepting it walks them through creating the Notion database and the "Como
funciona" page and through configuring the Notion MCP for their provider, without any token touching
a file. A PM or engineer agent that loads `add--notion` reads that page first and moves cards along
the pipeline milestones. Without Notion, agent mode works exactly as today, with no tracker.

## Context

Ticket 0076B (the id is a label only: the intent carries `ticket: none` and the board that held
tickets was removed by `remove-board`, so no stage writes a ticket). Follows `remove-board`
(delivered, `docs/deliveries/2026-10-29T223023-PLAN--remove-board/`), and depends on it: the board
fragments, scripts, `add--backlog` skill and the agent-mode "Mirror the board" section are already
gone on `main` (`44251d2`).

**Every decision here was taken and reviewed in the document below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-29T112200-agent-mode-notion-intent.md` | `path: bounded`, decisions 1-14 (Notion single source, two skills, setup flow, agent workflow and fallback mapping, `/add-setup` row, README and roles text, tests, out of scope), `## Open: None` |

The delivery index holds one earlier Notion artefact: the "agent-mode Notion example" in
`agent-mode/README.md` (`2026-10-10T152531-PLAN--board-awaiting-release-and-agent-mode-examples`),
which `remove-board` removed with the board section. That example mirrored a board into Notion; this
plan replaces the board with Notion, so nothing of it is restored.

## Global Constraints

- Backward compatibility for consumers goes through migration `0006-retire-board`, which never deletes `board.json`, the board branch or the clone. This plan adds no migration and does not change `0006` (invocation)
- No secrets in code, commits, logs or docs (invocation; intent decision 7: "It never asks for, prints, writes or logs a token")
- No deploy, rollout, publish or release task (invocation)
- Examples stay stack-agnostic (invocation)
- Every behaviour change is strict TDD red-green: a failing test first, then the implementation (invocation)
- Edits are anchored by quoted text, not line numbers (invocation)
- No tracker code in the framework: no script, no API client, no sync; nothing is added to `cli/src/features.js` (intent decision 3)
- Skills are named `skills/add--<name>/SKILL.md` and registered in `framwork/provider-map.json` → `skills` (intent decision 4)
- No repo file stores the Notion database or page URL; the only repo trace is `tracker: <card URL>` in a feature's `about.md` (intent decisions 2, 8)
- Naming in Notion and in every message is `<id>-<slug>` (intent decision 10)
- The agent-mode guide and the two role files keep failing on `/board/i`, and the role files on `/ticket|shaped/i` (`cli/tests/agent-mode.test.js` L2.4 and T1.5, from `remove-board`) — the new text says "card" and "Kanban view", never those words
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **No tracker after the board removal** — agent teams (PM + engineers) have no shared place to see
   what is being shaped, planned, built or reviewed. The handoff is only the intent file and the
   feature folder on `main`.
2. **The workflow rules have no home** — columns, labels and fill rules differ per user; hard-coding
   them in a skill forces one flow on everyone, and storing them in the repo brings back the drift the
   board removal fixed.

## Proposal

Two markdown skills, both shipped to every provider:

- `add--notion-setup` — one-time, with the user: checks the Notion MCP answers, proposes the database
  properties and columns in one batch, creates the database (or prints the exact property list when
  the MCP cannot), creates the "Como funciona" page beside it, and prints both URLs for the user to
  paste into the agents' own instructions. MCP configuration is pointed at, per provider, by linking
  that provider's official MCP doc and Notion's; auth stays in the provider's own flow.
- `add--notion` — what an agent does every time: read "Como funciona" first (it wins), find the card by
  URL or Slug, and apply the fallback milestone mapping only where the page has no rule.

`/add-setup` offers `notion` as an optional item (recommended yes with `agent-mode`), recorded in the
`setup` record. The agent-mode guide gets a section 10 and each role file one paragraph. Order: the
two skills first (everything else points at them), then the inventory, then the settings schema, the
setup command that uses it, and the guide and roles last.

## Scope

### Includes

Every F-block starts with its test, run and seen failing, before any file it changes. The new tests
live in one file, `cli/tests/agent-mode-notion.test.js`; changed assertions stay in the file that owns
them today.

- **F1** [product] — new `framwork/.codeadd/skills/add--notion-setup/SKILL.md`, its entry in
  `framwork/provider-map.json` → `skills` (no provider restriction, so it builds to all six), and a row
  in the `## Skills` table of `framwork/.codeadd/skills/add--ecosystem/SKILL.md` (Used By `add-setup`)
  plus a `## Dependency Index` row (`add--notion-setup` → `add-setup (STEP add-setup.execute)`).
  The skill carries intent decisions 5, 6, 7 and 8:
  - first, the MCP check (one search call); not answering → stop, and the stop prints the
    per-provider MCP links table (below) and "configure the Notion MCP, restart the session, run
    again" — so configuration guidance reaches the user on the very run that finds no MCP;
  - the database proposal in ONE batch, which also asks the Notion parent page that will hold the
    database and the page (no default: the user names it) and the database name (default: the
    repository folder name, editable) — properties Title (starts with the slug), Slug, Feature ID,
    Status (default columns Ideia, Refinando, A fazer, Planejado, Em andamento, Em revisão, Feito,
    Descartado), Labels (no default set: the user supplies them, and an empty set is allowed), Type
    (Feature / Hotfix / Chore / Bug), Priority, Link, Attachments; create
    through the MCP when it can, else print the exact property list for the user;
  - the "Como funciona" page (title in the user's language) in the same parent: columns and meaning,
    the milestone that moves a card into each, labels and when to use each, fill rules, who owns which
    column;
  - MCP configuration: one row per provider in `framwork/provider-map.json` (all six: claude, codex,
    antigrav, opencode, cursor, zcode) linking the `docs` entry that is that provider's MCP doc, plus
    Notion's official MCP doc (`https://developers.notion.com/docs/mcp` — the build opens it and
    corrects the URL if it moved); auth is the provider's own OAuth or env var flow; the never-a-token
    rule stated as a prohibition;
  - when a `## Setup answers` block is in the session (from `/add-setup`), it reads the columns and
    labels from it and asks nothing it covers;
  - the close prints the database URL and the page URL for the user to paste into the agents'
    instructions, and writes them to no repo file.
  Must NOT carry any token-like literal, `backlog-` or `board.json`.
  - **Produces:** skill id `add--notion-setup`; page title `Como funciona`
- **F2** [product] — new `framwork/.codeadd/skills/add--notion/SKILL.md`, its `provider-map.json`
  entry, an `add--ecosystem` `## Skills` row (Used By: the agent-mode role files) and a
  `## Dependency Index` row (`add--notion` → the two agent-mode role files). Carries intent
  decisions 9 and 10 and the find rule of decision 2:
  - step one every time: find and read "Como funciona" by title search; the page wins over the skill;
    no page → point at `add--notion-setup` and continue with no tracker;
  - find a card by the `tracker:` URL in `about.md` (or the intent frontmatter), else search the Slug;
  - the fallback milestone table, used only where the page has no rule: brainstorm → card created in
    Refinando with Slug; new → Feature ID filled and `tracker: <card URL>` written in `about.md`; plan →
    Planejado; build → Em andamento, then Em revisão with Link (PR); done → Feito; hotfix → Type Hotfix,
    same path;
  - ownership: PM creates, refines, prioritises; engineer moves plan, build and done;
  - naming: always `<id>-<slug>`; title starts with the slug; Feature ID and Slug as separate properties.
  Must NOT carry any token-like literal, `backlog-` or `board.json`.
  - **Consumes:** skill id `add--notion-setup` (F1); page title `Como funciona` (F1)
  - **Produces:** skill id `add--notion`
- **F3** [internal] — `AGENTS.md`: regenerate the inventory block with `node scripts/inventory.js`, so
  the `skills` array lists `add--notion` and `add--notion-setup`. No hand edit.
  - **Consumes:** skill id `add--notion-setup` (F1); skill id `add--notion` (F2)
- **F4** [product] — `framwork/.codeadd/skills/add--settings/SKILL.md`: the `setup.offered.<item>` row
  names `notion` beside `qa-setup`, `wiki` and `version-record` (anchor: the cell text "plus `qa-setup`,
  `wiki` and `version-record`"), and the example `offered` object carries a `"notion"` key. The `qa`
  section and every receipt rule stay untouched.
  - **Produces:** `setup.offered.notion`
- **F5** [product] — `framwork/.codeadd/commands/add-setup.md`:
  - `<!-- uses: -->` gains `- skill: add--notion-setup`;
  - "Classify every item" names `notion` in the item list (anchor: "and `qa-setup`, `wiki` and
    `version-record`"), and one sentence says `notion` has no manifest key, so it is only ever **new**
    or **decided**, never **on** or **drift**;
  - the `### Recommendations` table gets a `notion` row: yes when `agent-mode` is accepted or already
    on, else no; always offered (every provider has MCP today, and the command reads no provider
    capability);
  - `### Values the sub-commands would ask` adds: for accepted `notion`, the parent page (no default),
    the database name (default: the repository folder name), the columns (the skill's eight defaults
    recommended) and the labels (no default);
  - the `STEP add-setup.batch` line of the STEP list ("one numbered item per feature, plugin, qa-setup,
    wiki, version-record") gains `notion`;
  - `add--ecosystem` `## Commands` row `add-setup` adds `add--notion-setup` to its Skills Loaded cell;
  - `STEP add-setup.execute` gets a new sub-step right after the one `codeadd modify` call and before
    `gitnexus setup`: load `{{skill:add--notion-setup/SKILL.md}}` and run it with the `## Setup answers`
    block in the session. Its MCP stop does not stop the run: the item is recorded `failed`, the other
    items go on, and the report carries the skill's stop output (the per-provider MCP links and the
    "configure the Notion MCP, restart the session, run again" text) and the next action: `/add-setup`
    with `revisit notion`. The later sub-steps are renumbered and the MCP checkpoint's "STOP after step 4"
    follows the new number;
  - the STEP list line for `add-setup.execute` names the Notion setup.
  Must NOT lose: the fixed order of the other sub-steps, the gitnexus MCP checkpoint, "Wiki last".
  - **Consumes:** `setup.offered.notion` (F4); skill id `add--notion-setup` (F1)
- **F6** [product] — `framwork/.codeadd/agent-mode/README.md`: new `## 10. Track work in Notion
  (optional)` after section 9 (the intent's "old section 9" line range no longer exists — section 9
  is now the team section). It says: Notion is optional; run `/add-setup` and accept `notion`, or ask an
  agent to load `add--notion-setup`; paste the two printed URLs into each agent's instructions; agents
  load `add--notion` and follow "Como funciona"; without Notion the handoff is the intent file and the
  feature folder (section 9). No "board" word, no token, no stack-specific example.
  - **Consumes:** skill id `add--notion-setup` (F1); skill id `add--notion` (F2)
- **F7** [product] — `framwork/.codeadd/agent-mode/roles/product-pm.md` and `roles/chief-engineer.md`:
  one short paragraph each, under `### Handoff to the engineer` and `### Where you pick up the work`
  respectively: "If the project tracks work in Notion, load `add--notion` and follow the 'Como
  funciona' page; otherwise the handoff is the intent + `docs/features/<id>-<slug>/` only." The four
  role headings and every T1.x anchor stay.
  - **Consumes:** skill id `add--notion` (F2); page title `Como funciona` (F1)

### Does NOT Include (important!)

- Any script, API client, CLI flag, feature flag or sync (intent decision 3)
- A new migration, or any change to `0006-retire-board` (Global Constraints)
- Migrating existing `board` branches to Notion — done once by agents, outside the framework (intent decision 14)
- Other trackers (Linear, Jira) (intent decision 14)
- Any test that calls Notion (intent decision 13)
- `README.md`, `web/`, SVGs and the root `CHANGELOG.md` — `/add-framework--sync` regenerates them before a release; the delivery changelog is `/add-framework--done`'s
- Any deploy, rollout, publish or release step
- Ticket writes: there is no board

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Tracker shape, skill names, setup flow, agent flow, `/add-setup` row, roles and README text, tests, out of scope | As intent decisions 1-14 | `docs/brainstorming/2026-10-29T112200-agent-mode-notion-intent.md` |
| Which providers the setup links | All six in `framwork/provider-map.json`, and the test derives them from it | Intent decision 7 says "today claude, opencode, codex", which is the workbench map; the product map ships to six, all `mcp: true`. Deriving from the map makes a seventh provider fail the test instead of being silently missed |
| Where the README section goes | New section 10, after section 9 | The intent's `:197-232` range was the board section, removed by `remove-board`; section 9 is now the team section and the roles point at it by number |
| How the guide test changes | L2.4 keeps `not /board/i` on the whole guide and allows `Notion` only from `## 10.` on | The old ban on `Notion` was written to prove the board's Notion example was gone; the board ban is what still matters |
| Where Notion's questions are asked under `/add-setup` | In the one batch, as sub-command values, the way `qa-setup` values are; the skill reads `## Setup answers` | `/add-setup` is one batch, one wait; a second wait inside a sub-step breaks that rule |
| Where Notion runs in `add-setup.execute` | Right after `codeadd modify`, before `gitnexus setup` | Intent says after modify; running before the gitnexus checkpoint means that checkpoint's STOP never skips Notion |
| Notion MCP not answering inside `/add-setup` | Item `failed`, run continues, report says restart and `revisit notion` | One external MCP should not cancel QA setup and wiki; `failed` is already in the `offered` vocabulary |
| Notion's place in the classify groups | Only new or decided | It has no manifest key, so on and drift cannot be computed |
| Ticket header line | Omitted; 0076B named in Context only | Intent carries `ticket: none`, and the board that would receive writes is removed |
| Token-like literal, for the grep test | `secret_` or `ntn_` followed by 20+ alphanumerics, `Bearer ` followed by 16+ token characters, and a `NOTION_TOKEN=`/`NOTION_API_KEY=` assignment whose value is not empty and does not start with `<`, `$`, `{` or `YOUR_` | The two Notion token prefixes plus the generic shapes; naming an env var, or showing it with a placeholder, stays allowed |
| Notion inputs with no default | Parent page and labels have no default; database name defaults to the repository folder name | A parent page is the user's workspace, unknowable from the repo; labels are the user's flow (intent decision 1) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add--notion-setup/SKILL.md` | product | create | F1. No caller yet; graph risk LOW |
| `framwork/.codeadd/skills/add--notion/SKILL.md` | product | create | F2. No caller yet; graph risk LOW |
| `framwork/provider-map.json` | product | modify | F1, F2 — two `skills` entries. Not a graph node; read by `scripts/build.js` |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F1, F2 — two Skills rows and two Dependency Index rows; F5 — `add-setup` Commands row gains `add--notion-setup`. Graph: 7 direct callers (add-audit, add-diagnose, add-done, add-help, add-hotfix, add-setup, add-wiki) → HIGH; additive rows only |
| `AGENTS.md` | internal | modify | F3 — inventory regeneration. Not a graph node; `cli/tests/inventory.test.js` holds it |
| `framwork/.codeadd/skills/add--settings/SKILL.md` | product | modify | F4. Graph: 5 direct callers (add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract) → HIGH; the change is one vocabulary key in the `setup` section, which no script reads |
| `framwork/.codeadd/commands/add-setup.md` | product | modify | F5. Graph: 2 live direct callers (add-help, add--settings) → MEDIUM (the graph sidecar still lists a stale `add--backlog` edge from before `remove-board`; it disappears on the next build) |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F6. Not a graph node; `cli/tests/agent-mode.test.js` holds it |
| `framwork/.codeadd/agent-mode/roles/product-pm.md` | product | modify | F7. Not a graph node |
| `framwork/.codeadd/agent-mode/roles/chief-engineer.md` | product | modify | F7. Not a graph node |
| `cli/tests/agent-mode-notion.test.js` | product | create | F1, F2, F4, F5, F6, F7 — the new assertions |
| `cli/tests/agent-mode.test.js` | product | modify | F6 — L2.4 and T1.6 change as stated in the Validation Matrix; T1.6 slices section 9 up to the `## 10.` heading |
| `cli/tests/add-setup.test.js` | product | modify | F5 — L1.6 order gains the Notion sub-step |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first, per F-block.** Each F-block writes or edits its assertions, runs them and sees
them fail for the stated reason, then implements and sees them pass. Tests run only through
`node scripts/run-tests.js`; no test writes in the checkout and none calls Notion.

### L1 — Content and registration (RED → GREEN)

1. **F1** `add--notion-setup` exists, its frontmatter `name` equals the folder, and `provider-map.json`
   `skills` lists it with no provider restriction. *RED: the file and entry do not exist.*
2. **F1** For every provider in `provider-map.json`, the skill contains that provider's MCP doc — the
   `docs` entry matching `/mcp|model-context-protocol/` — and it contains Notion's MCP doc URL. Expected
   end state: six provider URLs + one Notion URL. *RED: no file.*
3. **F1** The skill names the nine properties, the eight default columns, `Como funciona`, `## Setup
   answers`, and the MCP stop text "configure the Notion MCP". *RED: no file.*
4. **F2** `add--notion` exists and is registered as in 1; it names `Como funciona`, `tracker:`,
   `<id>-<slug>`, `add--notion-setup`, and the fallback rows brainstorm, new, plan, build, done,
   hotfix with Refinando, Planejado, Em andamento, Em revisão, Feito, Hotfix. *RED: no file.*
5. **F1, F2, F5** `add--ecosystem`: the `## Skills` table and the `## Dependency Index` each have
   exactly one row whose first cell equals `add--notion-setup` and one whose first cell equals
   `add--notion` (exact cell match, never a prefix); the `add-setup` Commands row lists
   `add--notion-setup`. *RED: no rows.*
6. **F1, F2, F7** Over both skills and both role files: no token-like literal (the regex in Validated
   Decisions), no `backlog-`, no `board.json`. *RED for the skills: the files do not exist, so the
   test first asserts existence. The role files pass already; that part is a guard, not a RED.*
7. **F3** `cli/tests/inventory.test.js` passes with the two skills on disk. *RED between F1 and F3: the
   block lists 41 skills, the disk holds 43 — the build accepts that one F-block window.*
8. **F4** `add--settings` names `notion` in the `setup.offered.<item>` row and in the example `offered`
   object; the existing `add-settings-skill.test.js` and `add-setup.test.js` F1 assertions stay green.
   *RED: no `notion`.*
9. **F5** `add-setup.md` names `skill: add--notion-setup` in `uses:`, `notion` in the item list and in a
   Recommendations row mentioning `agent-mode`, and the `failed` + `revisit notion` handling. L1.6's
   order array becomes `Install the external tools`, `codeadd modify`, `skill:add--notion-setup`,
   `gitnexus setup`, `cmd:add-qa-setup`, `cmd:add-wiki`. L1.7 stays green (no `DISPATCH`, no
   `git add`). *RED: none of it present.*
10. **F6** Guide: `## 10. Track work in Notion (optional)` exists and names `add--notion-setup`,
    `add--notion`, `Como funciona` and `/add-setup`; T1.6 slices section 9 from its heading up to the
    `## 10.` heading (today it slices to the end of the file, so its not-contain rules would read
    section 10) and its loop checks sections 1 to 9; L2.4 still
    fails on `/board/i` and on `Mirror the board|backlog-cli|backlog-commit|board-management|awaiting-release`
    anywhere, and on `Notion` only before `## 10.`. *RED: no section 10.*
11. **F7** Each role file names `add--notion` and `Como funciona` and the "otherwise the handoff is the
    intent" sentence; T1.1-T1.5 stay green. *RED: no paragraph.*

### L2 — Build and install

1. `node scripts/build.js` exits 0 with no new warning; both skills appear in each of the six providers'
   skill output paths (`dir` + `skills` pattern), asserted by the same mechanism `cli/tests/build.test.js`
   uses for an existing skill.
2. The artefact graph after the build has nodes `add--notion-setup` and `add--notion`; `impact
   add--notion-setup --depth 1` lists `add-setup`; no `uses:` target is unresolved. `add--notion`
   reporting in `orphans` is expected: its readers are the role files, which are not graph nodes,
   the same as other unreferenced skills such as `add--tdd`.
3. `cli/tests/board-removed.test.js` stays green (F8 grep over every shipped root).
4. `cli/tests/migrations.test.js` stays green and the migration list still ends at `0006-retire-board`.

### L3 — Behavioural acceptance (read-through, no Notion call)

1. A cold read of `add--notion-setup` alone tells an agent: check MCP first and, when it does not
   answer, print the configuration guidance on that same stop; ask once (parent page, database name,
   columns, labels); create or print properties, create the page, print two URLs, write no file,
   never touch a token.
2. A cold read of `add--notion` alone tells an agent what to do at each milestone when "Como funciona"
   has no rule, and that the page wins when it has one.

**RED expectations against the current tree:** L1.1-L1.5 and L1.8-L1.11 fail (nothing exists);
L1.6 fails on existence; L1.7 is green until F1 and red until F3. L2 and L3 have no RED: they guard
what is already true or read the result.
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [internal] → F4 [product] → F5 [product] → F6 [product] → F7 [product]

- **F1 before F2:** `add--notion` points at the setup skill and its page title.
- **F3 right after F2:** it closes the inventory gap the two new skills open; the tree is fully green
  again at the F3 boundary.
- **F4 before F5:** the command records a key the schema must already define.
- **F6 and F7 last:** they point at both skills and at the setup row.

Working-tree boundaries: after F3, after F5 and after F7 the full suite is green. Between F1 and F3
only `inventory.test.js` is red, by design.

Per-F-block beyond the layer default: F1 and F2 run `node scripts/build.js` and check no new warning;
F5 runs `cli/tests/add-setup.test.js` and `add-settings-skill.test.js` in full.

## Reviewer Handoff

For each F-block the build leaves, in its ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state, with the RED run named.
- **Any decision deferred or altered**, with the intent decision it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. A token-like string, a real workspace URL or a real database id anywhere in the two skills, the
   README, the roles, the tests or the commits.
3. A Notion URL or page id written to a repo file other than the `tracker:` line rule.
4. The provider list in `add--notion-setup` hand-typed and not matching `provider-map.json`.
5. `add-setup`'s renumbered sub-steps leaving a stale "step N" reference — grep `add-setup.md` for
   "step 4" and "step 5" after F5, and check the batch STEP list line names `notion`.
6. The word "board" or "ticket" slipping into the guide or the roles (Notion's "board view" — write
   "Kanban view").

---

## Next Steps

/add-framework--build docs/plans/2026-10-30T003247-PLAN--agent-mode-notion.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-30 | Initial creation |
| 2026-10-30 | Review fix-then-ok applied: ecosystem Commands and Dependency Index rows (A1); notion always offered, no capability read (A2); parent page, database name and label defaults decided (A3); MCP stop prints the configuration links (A4); T1.6 slice bounded at section 10 (A5); batch STEP list line and stale step-number grep (A6); placeholder rule for the token regex (A7); exact-cell match and expected orphan (N1, N2) |
| 2026-10-30 | Build executed: status implemented (commits on feat/0076b-agent-mode-notion) |

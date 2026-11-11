# Plan: add-setup — a guided onboarding command that offers every feature and plugin per item and runs the existing setup pieces for the accepted ones

> **Status:** implemented
> **Layers:** both
> **Type:** command
> **Created:** 2026-10-25
> **Delivery:** confirm
> **Ticket:** 0067B

---

## Objective

[from conversation, no design document — drawn from the intent file's D1–D3, `docs/brainstorming/2026-10-25T051501-add-setup-intent.md`] After `codeadd install` (or `codeadd update`) a user runs one
command, `/add-setup`, that diagnoses the project, presents every feature and plugin with its benefit
and a yes/no recommendation in one batch, and — for the items the user accepts, and only those —
installs the external tools, runs one `codeadd modify`, then runs `/add-qa-setup` and `/add-wiki`
inline. It records every decision and its reason in the `setup` section of `.codeadd/settings.json`,
so a re-run asks only what is new, drifted or named to revisit. It reimplements none of the pieces it
runs.

**When this build is done:** a new product command `add-setup` is registered and built for every
provider; the benefit of each feature and plugin has one source (a `Benefit` column in
`add--ecosystem`); `add--settings` documents the `setup` section; `/add-qa-setup` and `/add-wiki`
take their answers from a `## Setup answers` block when one is in the session; the install and update
outros, `/add-help`, the routing table, `README.md` and the web docs all point a new user at
`/add-setup`; and `cli/tests/add-setup.test.js` holds every one of those facts.

**Ticket done when:** commands/add-setup.md exists and is registered in provider-map.json; one diagnosis + one batch that presents every feature and plugin with its benefit (read from the new Benefit column in add--ecosystem Features/Plugins), a yes/no recommendation with the detected reason and its install commands, answered per item in one reply; only accepted items run; fixed order installs → single codeadd modify → gitnexus setup/analyze → /add-qa-setup → /add-wiki, with an MCP checkpoint that ends on /add-setup; add-qa-setup.md and add-wiki.md honor a `## Setup answers` block with one paragraph each and the add-qa-setup shape is unchanged; greenfield ends on /add-brainstorm; writes the `setup` section of .codeadd/settings.json (setup-shape "none", framework-version, offered.<item>, one log entry per decided item with its reason) at the end of every run, merging only `setup`, and add--settings documents the section; the batch offers version-record for .codeadd/settings.json (recommended yes; no = the line appended after # END ADD); re-run asks only items whose name is absent from offered or that drifted, lists decided items without re-asking, never re-asks a declined item unless revisited, notes removed items; codeadd update outro and the add--ecosystem `codeadd update` routing row point to /add-setup; board is enabled only with an existing .codeadd/board.json; installer and updater outros say run /add-setup; add-help suggests it and still runs only `codeadd --help`; plugins.json and AGENTS.md wording allow conversational installs; add--ecosystem, docs.astro and README list it; cli/tests/add-setup.test.js added; build, inventory --check and test:all pass.

## Context

Onboarding gap: after `codeadd install` the outro says only "run: /add-help", and a new user does not
know which of the five features and three plugins to turn on, nor that `/add-qa-setup` and `/add-wiki`
exist. Every piece already exists separately; nothing strings them together.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive
them — it points at them.** The intent file is `bounded`, `## Open: None`; its decisions are cited by
number (`D<n>`) throughout.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-25T051501-add-setup-intent.md` | Path `bounded`, 26 closed decisions (flow, diagnosis signals, recommendations, CLI call, install rule, execution order + MCP checkpoint, batch shape, `## Setup answers`, closing, registration, tests, `setup` record schema, re-run flow, version-record), acceptance criteria (a)–(q), risks, out-of-scope. `## Open: None` |

**What changed since the intent was verified (on `d354f5dc`):** `qa-settings` (0066B, PR #157) merged.
It created `.codeadd/settings.json`, the `add--settings` skill and the CLI gitignore/survival handling
this plan depends on (D23, D25). The intent's line numbers are stale — **every edit below is anchored
by quoted text, never by line number.**

**One conflict the intent did not see, resolved here (derivable, recorded in Validated Decisions):**
`add--settings` today bans "A `setup-shape` value that is not a bare `sha256:` + 16 hex", its log rule
says each entry carries the `shape` in force, and `/add-qa-setup`'s validation gate (check 7, "Hard
bans absent") reads those bans over the file it just wrote. D23's `setup-shape: "none"` and its
four-field log entry would therefore fail `/add-qa-setup`'s own gate on any project where `/add-setup`
ran first. F1 amends the ban and the log rule so `"none"` is the one legal non-hash value, for a
section whose command has no `## Materializes`, and a log entry in such a section carries no `shape`.

## Global Constraints

- `add-setup.md` contains no `DISPATCH` (`cli/tests/dispatch-rules.test.js`, `dispatchingCommands()` matches `/\bDISPATCH\b/`; D10)
- `add-setup.md` carries no `agent-mode.*` slot and `add-setup` is not added to `FEATURES['agent-mode'].commands` (D14)
- `add-setup` has no `## Materializes` block and no entry in `contracts.json` (D18, D23)
- The `## Materializes` block of `add-qa-setup.md` is byte-unchanged; its `shape: sha256:5a8b5405851bf4d8` line stays (D12; `add-qa-setup.md` `## Materializes`)
- `/add-help` still runs no `codeadd` command but `--help` — its prohibition "The only `codeadd` command this command runs is `codeadd --help`" stays verbatim (D7; `add-help.md` PROHIBITIONS)
- `add-setup.md` hardcodes no benefit text; it reads `Purpose`/`Description` + `Benefit` from `add--ecosystem` at run time (D22)
- `.codeadd/settings.json` is always written read → merge → write, only the `setup` section, and is always named in full (`add--settings`, Read → Merge → Write; Location and Ownership)
- No `cli/src/plugins.js`, `features.js`, `injection-core.js`, `status.cjs` or new script change (D18)
- `node scripts/build.js` exits 0 and emits no new `lintResourcePaths` warning (AGENTS.md, Pipeline)
- Tests run only through `node scripts/run-tests.js` (`npm test`, `npm run test:all`) — never `npx vitest` in `cli/` (AGENTS.md, `scripts/run-tests.js` header)
- Every example in the shipped artefacts is stack-agnostic — no framework, language or vendor named as the user's stack (invocation constraint; `agnostic-dev-skills` suite)
- No deploy, rollout, publish or release task anywhere in this plan (invocation constraint)
- Every edit is anchored by quoted text, not line numbers (invocation constraint)

## Problem

1. **No onboarding path** — the install outro points at `/add-help`, which explains features one at a
   time and by design turns nothing on. A new user never learns that QA, the code graph or the wiki
   apply to their project.
2. **No memory of setup decisions** — nothing records that a user declined a plugin, or why, so every
   prompt that offers it again starts from zero, and a new release's new feature has no way to reach
   an existing user.
3. **Benefit text has no home** — the catalog descriptions say what an item *does* in CLI-list terms,
   never what the user gains, and they ship only in the npm package.

## Proposal

One thin orchestrator command, `/add-setup`, built strictly on what exists (D1–D3): a silent
read-only diagnosis (D4), one numbered batch asking per item (D12), and — after one reply — execution
of only the accepted items in the fixed order of D11, then its record (D13, D23). Around it, the
minimum supporting edits: a `Benefit` column (D22), the `setup` schema in `add--settings` (D23), a
`## Setup answers` paragraph in the two commands it runs inline (D12), and pointers from the outros,
`/add-help`, the routing table and the docs (D15, D16).

**Sequencing:** the three things `add-setup.md` reads (the `setup` schema, the `Benefit` column, the
`## Setup answers` contract) land first, then the command, then everything that points at it.

## Scope

### Includes

#### Checkpoint A — the contracts the command reads

- **F1** [product] — `framwork/.codeadd/skills/add--settings/SKILL.md`: add `## Section \`setup\``
  next to `## Section \`qa\``, carrying D23's schema — the generic receipt fields
  (`framework-version`, `first-run`, `last-run`), `setup-shape: "none"`, `offered.<item>` with the
  vocabulary `enabled | already-on | declined | unavailable | failed`, and `log[]` entries
  `{ date, item, decision, reason }`; one stack-agnostic JSON example (D23's, kept as is — it names
  no stack). Also: the `setup-shape` row in **Receipt Fields** gains "or the literal `"none"` for a
  section whose command declares no `## Materializes`"; the hard ban "A `setup-shape` value that is
  not a bare `sha256:` + 16 hex." becomes "…that is neither a bare `sha256:` + 16 hex nor `"none"` in
  a section whose command has no contract."; the log rule "**One entry per decision**, with the
  `setup-shape` in force when it was taken." gains "— a section with `setup-shape: "none"` carries no
  `shape` key". **Location and Ownership**: the line "`/add-qa-setup` writes `qa`." gains
  "`/add-setup` writes `setup`." **How Scripts Read It**: one line — no script reads `setup`.
  The `uses:` line `- command: /add-setup` is NOT written here — it lands in F4's commit (see
  "Edges to `/add-setup` land with F4" below). Description frontmatter: "the `qa` section schema"
  → "the `qa` and `setup` section schemas".
  Must NOT lose: any existing `qa` field, rule or ban; the "MUST be `null` for `owner: shared`" rule.
  - **Produces:** `setup` section schema (`setup-shape: "none"`, `offered.<item>` vocabulary, `log[] {date, item, decision, reason}`)
- **F2** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: (a) a `Benefit` column
  appended to the `## Features` table (header row starting `| Feature | Default | Injects into | Purpose |`)
  and to the `## Plugins` table (header `| Plugin | Type | Description | Injects into | Plugin skill |`),
  one user-facing line per row, no marketing, filled for all 5 features and 3 plugins (D22).
  `docs-pruning`'s line says it deletes feature scaffolding; `board`'s says it needs an existing
  `.codeadd/board.json`. (b) A `## Commands` row for `add-setup` after the `add-qa-setup` row, its
  Purpose cell the command's frontmatter `description` (F4 writes the same sentence: "Guided
  onboarding — diagnoses the project, offers each feature and plugin with its benefit in one batch,
  and runs the setup pieces for the accepted items"), its skills column `add--delivery-mode, add--dev-environment-setup, add--ecosystem, add--final-report, add--settings`.
  (c) `- mention: /add-setup` in the `uses:` block (D16) — written in F4's commit, not here. (d) **Used By** cells: `add-setup` added to
  `add--dev-environment-setup` (Skills row "Detect OS, diagnose missing tools…" and Dependency Index
  row "add-help (environment triage), add-qa-setup (runner install)"), `add--final-report` (Skills row
  and the Dependency Index row ending "— every command that finishes work."), `add--settings` (Skills
  row "…the `qa` section schema and the receipt fields | add-qa-setup" and Dependency Index row
  "add-qa-setup (STEP add-qa-setup.config, …)"), `add--delivery-mode` (Skills row starting "| add--delivery-mode | The two delivery modes" and
  Dependency Index row starting "| add--delivery-mode | add-brainstorm, add-new, add-plan,"),
  `add--ecosystem` (Skills row "| add--ecosystem | Consolidated ecosystem view (source of truth) |"
  and Dependency Index row starting "| add--ecosystem | add-help (loses full view),"), and `status.cjs` (Dependency Index row "| status.cjs | add-help, …").
  (e) `## Command Next-Steps Routing`: new rows `codeadd install | always | /add-setup`;
  `add-setup | greenfield | /add-brainstorm`; `add-setup | stopped at the MCP checkpoint | /add-setup`;
  `add-setup | done | /add-new` (or `/add-brainstorm` with no idea yet). The existing row
  "| codeadd update | `.codeadd/wiki/` exists | `/add-wiki update` |" is **rewritten in place, not
  duplicated** (first-match table) per D16: Condition "always; when `.codeadd/wiki/` exists also the
  wiki refresh", Next "`/add-setup` (reviews what is new since the setup record), then
  `/add-wiki update` when `.codeadd/wiki/` exists".
  Must NOT lose: the `cli/tests/add-help.test.js` regex `^\|\s*`?codeadd update`?\s*\|[^\n]*\.codeadd\/wiki\/[^\n]*\|[^\n]*`\/add-wiki update`` still matches; the Features-note paragraph "The split is canonical in add--qa's…".
  - **Produces:** `Benefit` column in `## Features` and `## Plugins`
- **F3** [product] — `framwork/.codeadd/commands/add-qa-setup.md` and `framwork/.codeadd/commands/add-wiki.md`:
  one short paragraph each, placed immediately after the line `<!-- /slot:agent-mode.interaction -->`
  and before `## Required Skills`, carrying D12's rule: when the session holds a `## Setup answers`
  block from `/add-setup` (the `{{cmd:add-setup}}` link is added in F4's commit), every stop that block covers takes its answer from it and is not
  asked again (feature gate, install confirm, config values, migration decision — the `add-wiki`
  paragraph names only that it asks nothing the block covers); a declined item is recorded as
  declined; an uncovered stop asks as usual, on both the human and the agent-mode path; the closing
  offer is skipped because `/add-setup` owns the closing; on any failure stop and return to
  `/add-setup`. No slot, fallback or fragment is added.
  Must NOT lose: the `## Materializes` block of `add-qa-setup.md` byte for byte (Global Constraints).
  - **Produces:** `## Setup answers` block contract

**Edges to `/add-setup` land with F4.** `scripts/build.js`'s artefact-graph gate fails the build on
a declared edge to a missing node (dangling reference). So every `uses:` line and every
`{{cmd:add-setup}}` that names the new command — in `add--settings` (F1), `add--ecosystem` (F2),
`add-qa-setup.md` and `add-wiki.md` (F3) — is written in F4's commit, after the command file exists.
F1–F3 write plain text only (table cells, routing rows, the paragraph with `/add-setup` as text), which
no gate resolves. That is what keeps Checkpoint A green.

#### Checkpoint B — the command

- **F4** [product] — `framwork/.codeadd/commands/add-setup.md` (create) and `framwork/provider-map.json`
  (`commands` gains `"add-setup": { "description": "<the command frontmatter description>" }`, next to
  the `"add-qa-setup"` entry). Written with the `building-commands` ruler: standard frontmatter, the
  LANG line verbatim from `add-qa-setup.md`, STEPs `add-setup.<name>` in the four-stop flow of D3, a
  sequential-execution block and a prohibitions table. `uses:` block (D16, plus `add--delivery-mode`
  and `add--ecosystem`, which it reads): commands `/add-qa-setup`, `/add-wiki`, `/add-brainstorm`,
  `/add-new`; skills `add--delivery-mode`, `add--dev-environment-setup`, `add--ecosystem`,
  `add--final-report`, `add--settings`; script `status.cjs`. The body, per decision:
  - diagnosis signals of D4 — `node .codeadd/scripts/status.cjs` (`WIKI`, `WIKI_STALE_COUNT`,
    `SETUP_QA`, `SETUP_QA_STALE`), `.codeadd/manifest.json` project-then-home read the way `/add-help`
    Type G reads it, the greenfield rule **by reference** to `{{cmd:add-brainstorm}}`'s "Greenfield
    check" (not copied), frontend judged from manifests/source tree or, with no code, from the
    `## Stack Conventions` table (or `### Stack Conventions` in a folded `index.md`), `gitnexus --version`;
  - greenfield stop → next command `/add-brainstorm` (D6);
  - recommendation rules of D5, the board rule (enable only with `.codeadd/board.json`, else
    `unavailable`), agent-mode and docs-pruning recommended no, tdd-pipeline keep-on;
  - the batch of D12: diagnosis first; one numbered item per feature/plugin + `qa-setup`, `wiki`,
    `version-record` (D26); each with its `Purpose`/`Description` + `Benefit` read from
    `{{skill:add--ecosystem/SKILL.md}}`, a project clause, recommendation + reason, exact install
    commands and CLI flag, and "use it? (yes/no)"; already-on items listed once; `playwright` and
    `qa-setup` offered only when `qa-pipeline` is accepted or on; replies per item or "all recommended";
    the sub-command values (`baseUrl` from the dev script, never a production URL; `bootHint`;
    `authSeed`; migration decision only when `/add-qa-setup`'s scan list finds tooling, by reference);
  - the `## Setup answers` block printed before execution (Consumes F3);
  - the fixed order of D11 restricted to accepted items: installs (D8, `add--dev-environment-setup`
    discipline; sudo/interactive → shown for the user to run, then verified) → ONE
    `codeadd modify --enable-feature … --enable-plugin …` (`--disable-feature tdd-pipeline` only when
    turned off; `--global` when only the home manifest exists; `npx --yes codeadd …` fallback) →
    `codeadd features list` / `plugins list` → `gitnexus setup` / `gitnexus analyze` → re-read the
    installed command files from disk and run `/add-qa-setup` inline → MCP checkpoint → `/add-wiki`
    inline last. Inline per `{{skill:add--delivery-mode/SKILL.md}}`'s same-session rule (D10). A named
    exception paragraph says this command alone may run `codeadd modify` / `features list` /
    `plugins list` (D7);
  - re-run flow of D24 — new items by name absent from `offered`, decided items one line each,
    `revisit <names>`, drift re-asked, removed items noted; never compares `framework-version`;
  - the record of D13/D23 written at the end of every run (also on no-accept, MCP checkpoint and
    failure), loading `{{skill:add--settings/SKILL.md}}`, merging only `setup`, then the
    `add--settings` JSON check; unparsable file → report and STOP, never overwrite (Consumes F1);
  - version-record of D26 (yes → listed as a file to commit, no git command run; no → the line
    `.codeadd/settings.json` appended after `# END ADD`; no managed block → report `git check-ignore`);
  - failure: stop, name the failing command, its output and what already ran; no rollback;
  - closing via `{{skill:add--final-report/SKILL.md}}`, one next command per D13.
  Must NOT contain: `DISPATCH`, an `agent-mode.*` slot, `## Materializes`, benefit text, a copy of the
  greenfield rule, `git add` / `git commit`, any stack-specific example.
  - **Consumes:** `setup` section schema (`setup-shape: "none"`, `offered.<item>` vocabulary, `log[] {date, item, decision, reason}`) (F1); `Benefit` column in `## Features` and `## Plugins` (F2); `## Setup answers` block contract (F3)
  F4's commit also carries: the four deferred edges above (F1's `- command: /add-setup`, F2's
  `- mention: /add-setup`, F3's `{{cmd:add-setup}}` in both paragraphs), and the `AGENTS.md`
  inventory block regenerated by `node scripts/inventory.js` — a **named cross-layer exception**: the
  block is generated output, never hand-edited, and without it `cli/tests/agent-mode-feature.test.js`
  ("the generated inventory block … is current") fails from F4 on. F7 keeps the `AGENTS.md` wording
  change and the `--check`.
  The execution order is written under one heading, `## STEP add-setup.execute`, so the L1 order
  assertion has a section to read.
  - **Produces:** product command `add-setup` registered in `provider-map.json`

#### Checkpoint C — everything that points at it

- **F5** [product] — `framwork/.codeadd/commands/add-help.md`: `- command: /add-setup` in its `uses:`
  block (alphabetical, after `- command: /add-review`); one Suggestion Table row after
  "| Does not know where to start | `/add-brainstorm` | Explore ideas |": "codeadd just installed, or
  features/plugins never chosen | `/add-setup` | Guided onboarding"; Type G gains one sentence after
  item 3 ("**How to turn it on:** …"): to set several up at once, run `/add-setup`.
  Must NOT lose: "The only `codeadd` command this command runs is `codeadd --help`", the NEVER line
  "Run a `codeadd` command other than `--help`", and the Type G line "For a plugin, add nothing about
  installing the external tool."
  - **Consumes:** product command `add-setup` registered in `provider-map.json` (F4)
- **F6** [product] — `cli/src/installer.js`: the outro text "`  1. Open your AI editor and run: /add-help\n`
  + `  2. Ask what you want to build\n\n`" becomes step 1 "Open your AI editor and run: /add-setup",
  step 2 "Questions? run: /add-help", then the unchanged Docs line (D15). `cli/src/updater.js`: the
  call `outro('ADD updated successfully!');` gains the line "Next: open your AI editor and run
  /add-setup to review what is new in this version." `cli/src/plugins.json`: `$schema-doc.description`
  "codeadd owns utilization, never installation." → D8's sentence "The CLI owns utilization, never
  installation: it detects the tool and never installs it. The conversational setup commands
  (/add-setup, /add-qa-setup) may install a tool after the user confirms."
  Must NOT lose: the success line "ADD installed successfully!" / "ADD updated successfully!", any
  plugin entry field.
  - **Consumes:** product command `add-setup` registered in `provider-map.json` (F4)
- **F7** [internal] — `AGENTS.md`: the Plugin System sentence "codeadd owns utilization, never
  installation: it validates the tool is present, …" gets the same clause as F6 (the CLI never
  installs; `/add-setup` and `/add-qa-setup` may, after the user confirms); the inventory block is
  not regenerated here — F4 did it; `node scripts/inventory.js --check` confirms it is still current. `README.md`: after the sentence beginning "Not sure which command to run next?
  `/add-help` answers…", one sentence pointing new users to `/add-setup`.
  `web/src/pages/docs.astro`: one `/add-setup` card in the Utilities group (the `<h3 …>Utilities</h3>`
  block), copying the markup of its `/add-help` card. Ecosystem SVGs, `ecosystem.md` and the docs
  graph node list stay with `add-framework--sync` (D16).
  - **Consumes:** product command `add-setup` registered in `provider-map.json` (F4)

#### The test file, grown F-block by F-block

`cli/tests/add-setup.test.js` (new, text checks in the style of `cli/tests/add-help.test.js`) is
created in F1 and extended in every F-block. **Each F-block first adds its assertions and runs them
RED against the tree, then makes the change GREEN** — the levels below say which assertion belongs
to which F-block.

### Does NOT Include (important!)

- Creating a board (`board.json` + orphan branch) — the product cannot today (D18).
- Detecting codebase tools other than gitnexus (D18).
- Running `/add-brainstorm` inline (D6, D18).
- Any new CLI subcommand or script; any change to `plugins.js`, `features.js`, `injection-core.js`, `status.cjs` (D18).
- CLI or script code that reads or writes the `setup` section (D18).
- `.codeadd/settings.json` infrastructure, gitignore exception, install/update/uninstall survival — delivered by `qa-settings` (D25).
- Auto-installing Python; rollback on failure; `git add` / `git commit` from setup (D18).
- A `## Materializes` contract for `/add-setup`; adding it to agent-mode (D14, D18).
- Regenerating SVGs, `ecosystem.md` or the docs graph node list — `add-framework--sync`'s job (D16).
- Any deploy, rollout, publish or release step.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Everything the intent closed | Carried as settled | Intent D1–D26, `## Open: None` |
| `setup-shape: "none"` vs the `add--settings` hard ban on a non-hash value | Amend the ban and the log rule in F1: `"none"` is legal only in a section whose command has no `## Materializes`, and such a section's log entries carry no `shape` | Without it `/add-qa-setup`'s check 7 fails on a file `/add-setup` wrote first. Derived, not a user question |
| Does `add-setup.md` list `add--delivery-mode` and `add--ecosystem` in `uses:`? | Yes, both | It follows `add--delivery-mode`'s same-session rule (D10) and reads `add--ecosystem`'s tables (D22); D17 already requires it to name `add--delivery-mode`. An undeclared read is an edge the graph cannot see |
| Frontend detection on a folded (tiny) wiki | Read `### Stack Conventions` in `index.md` when `conventions.md` is absent | `spine-analyzer.md` FOLD mode writes the table there; D4 only named `conventions.md` |
| Placement of the `## Setup answers` paragraph | After `<!-- /slot:agent-mode.interaction -->`, before `## Required Skills` | D12; outside `## Materializes`, so the shape cannot move |
| One plan or a set | One plan, three checkpoints, one branch | `add-plan-authoring` The Ticket: a set would move 0067B back through the phases per plan |

## Impact

| Artefact | Layer | Action | Reason | Risk (depth-1 callers) |
|----------|-------|--------|--------|------|
| `framwork/.codeadd/skills/add--settings/SKILL.md` | product | modify | F1 — `setup` section, ban amendment | HIGH — 4 (add-qa-setup, add--doc-schemas, add--qa, add--setup-contract) |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F2 — `Benefit`, rows, routing | HIGH — 6 (add-audit, add-diagnose, add-done, add-help, add-hotfix, add-wiki) |
| `framwork/.codeadd/commands/add-qa-setup.md` | product | modify | F3 — `## Setup answers` paragraph | HIGH — 7 (add-build, add-review, its agent-mode fragment, qa-pipeline/add-review fragment, add--qa, add--qa-migration, add--setup-contract) |
| `framwork/.codeadd/commands/add-wiki.md` | product | modify | F3 — `## Setup answers` paragraph | HIGH — 17 (8 commands, 2 fragments, 6 skills, conformance-agent) |
| `framwork/.codeadd/commands/add-setup.md` | product | create | F4 | LOW — new, none |
| `framwork/provider-map.json` | product | modify | F4 — registration | NOT VERIFIED — not a graph node (the registry is build input) |
| `framwork/.codeadd/commands/add-help.md` | product | modify | F5 | LOW — none |
| `cli/src/installer.js`, `cli/src/updater.js` | product | modify | F6 — outros | NOT VERIFIED — `cli/src/` has no graph nodes |
| `cli/src/plugins.json` | product | modify | F6 — wording | NOT VERIFIED — not a graph node |
| `cli/tests/add-setup.test.js` | product | create | F1–F7 | NOT VERIFIED — tests are not graph nodes |
| `AGENTS.md` | internal | modify | F4 — inventory regen (generated); F7 — Plugin System wording | NOT VERIFIED — `AGENTS.md` is not a graph node; checked by hand |
| `README.md` | internal | modify | F7 | NOT VERIFIED — not a graph node |
| `web/src/pages/docs.astro` | internal | modify | F7 | NOT VERIFIED — not a graph node |

The HIGH grades come from dense callers, not from the depth of the edit: F2 adds a column and rows,
F1 adds a section and widens one ban, F3 adds one paragraph per file outside any contract. None
removes or renames anything a caller reads. Delivery index (`history`, product layer): `add-help` has
one live entry (`add-help-guide`); `add--settings` and `add--ecosystem` none; `add-setup` has no node
yet. The only onboarding precedent, `remove-owner-product-onboarding` (`/add.init`, `superseded`), was
a different feature (an owner profile) and was dropped because its writer and readers never agreed —
F1 + F4 + the L1 record assertions bind the one `setup` schema to its one writer for that reason.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Each level is written in the F-block named next to it, run RED against the
tree, then driven GREEN by that F-block. Every run goes through `node scripts/run-tests.js` (container).

No injection map changes: `add-setup` carries no marker or slot, so `injection-points.json` and the
frozen slot-membership and baseline-count suites (`build-injection-points`, `loop-consolidation-0070`)
must pass **unchanged** — any change to their expected numbers is a defect, not an update.

### L1 — Source text checks in `cli/tests/add-setup.test.js` (RED → GREEN)

1. (F1) `add--settings` has a `setup` section naming `setup-shape`, `"none"`, `offered`, each of `enabled`, `already-on`, `declined`, `unavailable`, `failed`, and `log`; its hard ban admits `"none"` only for a section with no contract. *RED: no `setup` section.*
2. (F2) Every row of `## Features` and `## Plugins` has a non-empty `Benefit` cell, and the name sets equal `Object.keys(FEATURES)` from `cli/src/features.js` and the keys of `cli/src/plugins.json` minus `$schema-doc`, one to one. *RED: no `Benefit` column.*
3. (F2) `## Command Next-Steps Routing` has exactly one `codeadd update` row, it names `/add-setup` and still matches `add-help.test.js`'s wiki regex; a `codeadd install` row names `/add-setup`; `add-setup` rows exist for greenfield (`/add-brainstorm`), MCP checkpoint (`/add-setup`) and done (`/add-new`). *RED: rows absent.*
4. (F3) `add-qa-setup.md` and `add-wiki.md` each contain `## Setup answers`, positioned after `<!-- /slot:agent-mode.interaction -->` and before `## Required Skills`; the `add-qa-setup.md` `## Materializes` block still carries `shape: sha256:5a8b5405851bf4d8`. *RED: paragraph absent.*
5. (F4) `add-setup.md` exists and names `status.cjs`, `manifest.json`, `gitnexus --version`, `codeadd modify`, `add--dev-environment-setup`, `add--delivery-mode`, `## Setup answers`, `Benefit`. *RED: file absent.*
6. (F4) It asks per item (`yes/no`), states only accepted items run, and states the order installs → `codeadd modify` → `gitnexus setup`/`analyze` → `/add-qa-setup` → `/add-wiki` (asserted by index order of the five strings inside the `## STEP add-setup.execute` section only, never over the whole file) and the MCP checkpoint.
7. (F4) It does not contain `DISPATCH`, `<!-- slot:agent-mode`, `## Materializes`, `git add` or `git commit` as a command it runs.
8. (F4) It writes the `setup` section of `.codeadd/settings.json` with `setup-shape`, `"none"`, `framework-version`, `offered`, `log`; says one `log` entry per decided item; detects new items by name absent from `offered`; does not re-ask a `declined` item unless revisited; merges only `setup`; stops on an unparsable file.
9. (F4) It offers `version-record`, recommended yes, and on no appends `.codeadd/settings.json` after `# END ADD`.
10. (F4) `provider-map.json` `commands` has `add-setup`, and `FEATURES['agent-mode'].commands` does not.
11. (F5) `add-help.md` names `/add-setup` in its `uses:` block and its Suggestion Table, and still contains "The only `codeadd` command this command runs is `codeadd --help`". *RED: `/add-setup` absent.*
12. (F6) `cli/src/installer.js` outro text contains `run: /add-setup` and `run: /add-help`; `cli/src/updater.js` contains `/add-setup`; `cli/src/plugins.json` `$schema-doc.description` contains "may install a tool after the user confirms". *RED: none present.*
13. (F7) `AGENTS.md` Plugin System paragraph contains `/add-setup`; `README.md` and `web/src/pages/docs.astro` contain `/add-setup`. *RED: absent.*

### L2 — Build and existing suites

1. `node scripts/build.js` exits 0, emits `add-setup` for every provider's commands dir, and prints no new `lintResourcePaths` warning.
2. `framwork/.codeadd/contracts.json` holds no `add-setup` contract, and the `add-qa-setup` entry's `shape` is unchanged; `cli/tests/build-contracts.test.js` passes unchanged.
3. The artefact graph has `product/command/add-setup`; `impact add-setup --depth 1` lists `add-help` (F5); `dependencies add-setup` lists the four commands, five skills and `status.cjs` of F4's `uses:` block, each resolving.
4. `node scripts/inventory.js --check` passes after F7.
5. `npm run test:all` passes — including `dispatch-rules`, `chat-continuation-handoff`, `plain-language-rule`, `agnostic-dev-skills`, `add-help`, `agent-mode-feature` and the injection suites, none with an edited expectation.

### L3 — Behavioural acceptance (read-through by the build's audit, against intent (b)–(q))

1. Brownfield with UI, no QA, no gitnexus, no wiki: the command text leads to one diagnosis + ONE batch covering every feature, plugin, `qa-setup`, `wiki` and `version-record`, and to nothing executed before the reply (intent (b)).
2. "all recommended" accepts exactly the items marked yes; a "no" item runs none of its commands and is reported as declined (c2).
3. The MCP checkpoint stops before `/add-wiki` and ends on `/add-setup`; the second run proposes only `/add-wiki` (d).
4. Fully set project: proposes nothing and says so (e). Greenfield: proposes nothing, ends on `/add-brainstorm` (f). No `board.json`: board item `unavailable`, feature stays off (g). Failing step: stop with the failing command and what ran (h).
5. Re-run same version: one summary line per decided item, nothing asked unless revisited (m). Version bump adding a row: only the new item asked; removed item noted; `framework-version` moves; old `log` entries kept (n). Revisit change: `offered` updated, a NEW `log` entry (o).
6. A `.codeadd/settings.json` holding a `qa` section and a `setup` section written per F1's example passes both `/add-qa-setup`'s check 7 and `/add-setup`'s JSON check (the F1 ban amendment) (l).

**Accepted limit:** L3 is a read-through of the command text by the build's audit, not an executed
run. The re-run flow (D24) is held by L1.8's text assertions and that read-through; no suite drives
a real second run. This matches every other conversational product command.

**RED expectations against the current tree:** all of L1 fails (no section, column, paragraph, command, pointers). L2.3 and L2.4 fail (no node, stale inventory).
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

**F1 → F2 → F3** (Checkpoint A) → **F4** (Checkpoint B) → **F5 → F6 → F7** (Checkpoint C).

- **F1, F2, F3 first** because F4 consumes all three: the record schema it writes, the column it reads, the block contract the two sub-commands honor.
- **F4 before F5–F7** because every pointer names a command that must already be registered and built.
- Each checkpoint leaves the repo green — because the edges to `/add-setup` and the inventory regen ride F4's commit (Scope, "Edges to `/add-setup` land with F4"): after A the new section, column and paragraph are inert (nothing reads them yet); after B the command exists and is reachable by name; after C every entry point leads to it.
- Per F-block: add its L1 assertions, run them RED, make the change, run them GREEN, one commit. After F4 and after F7 run `node scripts/build.js`. After F4 run `node scripts/inventory.js`; after F7 run `node scripts/inventory.js --check`, then `npm run test:all` in the container.
- F4 is written under `building-commands` and gets the build's prompt-quality pass as a new artefact.

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, the L1/L2 items covering it and their
RED and GREEN state, and any departure from an intent decision with its D-number and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 assertions were never RED — a test written after the change proves nothing.
2. Benefit text, a copied greenfield rule, or a stack-specific example inside `add-setup.md` (Global Constraints, D22).
3. The `codeadd update` routing row duplicated instead of rewritten — the table is first-match, so the old row would shadow the new one.
4. The `## Setup answers` paragraph drifting into or near `## Materializes` and moving the `add-qa-setup` shape.
5. The word `DISPATCH` reaching `add-setup.md` in any casing that matches `\bDISPATCH\b`.
6. The F1 ban amendment missing, so a project where `/add-setup` ran first fails `/add-qa-setup`'s check 7.
7. An expected count in the injection or agent-mode suites edited to make the run pass.

## References

- Intent: `docs/brainstorming/2026-10-25T051501-add-setup-intent.md`
- Prior art: `2026-10-25T053315-PLAN--qa-settings` (`.codeadd/settings.json`, `add--settings`); `2026-10-07T111102-PLAN--modify-installation-providers` and `2026-10-09T105631-PLAN--non-interactive-installer` (`codeadd modify` with flags, no TTY); `2026-10-09T092025-PLAN--add-help-guide` (the `--help`-only rule kept here); `2026-10-24T190124-PLAN--brainstorm-greenfield`, `2026-10-24T191107-PLAN--design-plugin`, `2026-10-24T183514-PLAN--wiki-stack-conventions`; `2026-09-14T215223-PLAN--remove-owner-product-onboarding` (the cautionary precedent)

---

## Next Steps

/add-framework--build docs/plans/2026-10-25T063045-PLAN--add-setup.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-25 | Initial creation |
| 2026-10-25 | Review fix-then-ok: edges to `/add-setup` (F1–F3 `uses:` lines, `{{cmd:add-setup}}`) and the inventory regen moved into F4's commit so Checkpoint A builds; `add-setup` Commands-row Purpose given; Used-By rows for `add--delivery-mode`/`add--ecosystem` quoted; order assertion scoped to `## STEP add-setup.execute`; Objective source cited; L3 limit stated |
| 2026-10-25 | Implemented in commits af8bed9..HEAD on feat/0067b-add-setup (F1-F7 plus review fixes); see the ledger |

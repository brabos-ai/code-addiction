# Plan: add-help guide — rename the `add` gateway to `add-help` and make it answer from real sources

> **Status:** implemented
> **Layers:** both
> **Type:** command
> **Created:** 2026-10-09
> **Delivery:** confirm
> **Ticket:** 0012B

---

## Objective

[from conversation, no design document] `/add-help` answers, read from the real sources, which command
to use and in what order; what each feature and plugin is, whether it is on in this project and how to
turn it on; how to run the framework from a bot; and the CLI lifecycle — none of which `/add` covers
today beyond flows.

(Copied from the intent file's first `## Decided` line; the name is corrected per Validated Decisions.)

**When this build is done:** the product ships one help command, `add-help`, in all six providers and no
command named `add`. It answers the four new question families from files that already exist in an
install (`.codeadd/manifest.json`, `.codeadd/agent-mode/README.md`, `add--ecosystem`) or from the CLI's
own `--help`. The command-name gate in `scripts/build.js` carries no exception at all. Nothing in the
product, the CLI, the README or the web docs still points at `/add`.

**Ticket done when:** `npm run build` emits the gateway as `add--help` and no provider output still holds a command named `add`; `/add--help` explains how the framework works and correctly answers 'how do I enable QA' and 'what is GitNexus and how do I enable it'; a grep for a bare `/add` reference across `framwork/.codeadd/`, README and web docs returns none; and an install that had the old `add` command has no dangling reference to it.

> Read every `add--help` in the line above as `add-help` (see Validated Decisions). The intent adds two
> answers to it — "how do I run this from a bot" and "what do I run after `codeadd update`".

## Context

`add.md` is a router. It knows the flows and the next command, and nothing about features, plugins,
headless runs or the CLI. Users ask exactly those questions (ticket 0012B). The answers already exist in
an install; the command just never reads them.

**Every decision here was taken in the document below. This plan does not re-derive them — it points at
it.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-09T091035-add-help-guide-intent.md` | Path `bounded`; the twelve closed decisions (types A/G/H/I, sources, the no-question overview, the one routing row, the sweep, the proof); `## Open` reads `None` |

## Global Constraints

- Command names match `^add-[a-z0-9]+(?:-[a-z0-9]+)*$` with **no exception**; skill names match `^add--[a-z0-9]+(?:-[a-z0-9]+)*$` (`scripts/build.js` `assertProductNames`, after F7)
- No `/add` alias — the installer's `pruneObsolete` removes the old file (intent, `## Decided`)
- Never write a raw `.codeadd/` path in an artefact except scripts (`.codeadd/scripts/`); use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}` (AGENTS.md, Pipeline). Runtime files the command READS in the user's project (`.codeadd/manifest.json`, `.codeadd/agent-mode/README.md`) are named as such, the same way `add-wiki` already names `.codeadd/agent-mode/README.md`
- `lintResourcePaths` flags only `.codeadd/commands/` and `.codeadd/skills/` (`scripts/build.js`), so the two runtime paths stay literal — do NOT turn them into `{{...}}` tokens
- Plugin install steps are NOT copied into the command — `codeadd plugins enable` prints `installHint` / `postEnableHint` from `cli/src/plugins.json` (intent, `## Decided`)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **The gateway cannot answer setup questions** — "how do I enable QA", "what is GitNexus and how do I
   turn it on", "how do I run this from a bot", "what do I run after `codeadd update`" have no type in
   `add.md` and no source it reads.
2. **The name hides the purpose** — `add` says nothing; the user does not know it is the help.
3. **`add.md` carries stale references** — `/health-check` (not a command), `dev-environment-setup`
   (no `add--` prefix), "STEP add.classify-6" / "STEP add.detect-3 of skill" (left over from an old ID
   sweep; `add--dev-environment-setup` numbers its steps STEP 1–6), and a Claude-only path
   `.claude/commands/add-[command].md`.
4. **The build gate keeps a one-name exception** — `name !== 'add'` in `assertProductNames`, mirrored by
   a filter in `cli/tests/product-resource-names.test.js`. With the rename it has no reason to exist.

## Proposal

Rename first (F1), so the rewrite lands in the new file. Rewrite the command (F2) against the
`add--ecosystem` routing row added in F3. Sweep the remaining name sites (F4, F5), then remove the gate
exception and its test filter (F6, F7) once no command named `add` is left. The new source test (F8) is
written RED before F1 and turns GREEN at F2/F3.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/commands/add.md` → `add-help.md` (git mv) and
  `framwork/provider-map.json` key `add` → `add-help` (description updated to "help guide"). Rename every
  internal STEP ID `add.*` to `add-help.*`. Must not lose the existing types A–F or the Suggestion
  Table. Nothing injects into this command (graph: 0 dependants, `injection-points.json` has no entry),
  so no marker moves.
  - **Produces:** `framwork/.codeadd/commands/add-help.md`; STEP ID prefix `add-help.`
- **F2** [product] — `framwork/.codeadd/commands/add-help.md`: the help-guide rewrite, per the intent's
  `## Decided`:
  - Type A also reads `add--ecosystem` → `Main Flows` and `Command Next-Steps Routing`.
  - New Type G (features and plugins): what each is from `add--ecosystem` → `Features` / `Plugins`;
    whether it is on from `manifest.json` → `features` / `plugins`, read-only, looked up first at the
    project's `.codeadd/manifest.json`, then at `~/.codeadd/manifest.json` (a `--global` install,
    `cli/src/cli.js:60`); how to turn it on is `codeadd features enable <name>` /
    `codeadd plugins enable <name>`.
  - New Type H (bot / agent mode): read `.codeadd/agent-mode/README.md` (project first, then home) at
    answer time and answer from it — never summarise it into the command.
  - New Type I (CLI lifecycle): run `codeadd --help` when the binary exists on PATH, and
    `npx --yes codeadd --help` only as the fallback (user ruling at build approval, 2026-10-09). `--yes`
    keeps npx from stopping on an "Ok to proceed?" prompt the agent cannot answer. If it cannot run (no npx,
    offline), say so and tell the user to run it. For "what after `codeadd update`", read
    `Command Next-Steps Routing`.
  - No question: a short overview — the framework in two lines, the `Main Flows` table, the topics one
    can ask (flows, features, plugins, bot, CLI, environment).
  - The four stale references (Problem 3), each fixed: `/health-check` → `/add-audit`;
    `dev-environment-setup` → `add--dev-environment-setup`; the two mangled STEP references → the skill's
    real step names (STEP 3 REPORT for the diagnostic-only path, STEP 1–6 for the full flow); the
    `.claude/commands/` path → `{{cmd:add-[command]}}`-style wording that resolves on every provider.
  - The `<!-- uses: -->` block keeps its current entries and gains `- command: /add-audit`, which the
    Suggestion Table names once `/health-check` is replaced.
  - **Consumes:** `framwork/.codeadd/commands/add-help.md`; STEP ID prefix `add-help.` (F1);
    routing row `After codeadd update` (F3)
- **F3** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: `description` ("Loaded by
  /add-help"); the `add` row in `Commands` → `add-help` with a help-guide purpose; `- mention: /add` →
  `/add-help`; the `add--final-report` row of `Dependency Index` drops `add` from its consumer list (the
  same row already calls it exempt) and renames the exemption to `add-help`; the exemption paragraph under
  `Command Next-Steps Routing` names `add-help`. Add ONE routing row: After `codeadd update`, condition
  `.codeadd/wiki/` exists → `/add-wiki update`. Must not touch the `Features` / `Plugins` tables.
  - **Produces:** routing row `After codeadd update`
- **F4** [product] — `cli/src/installer.js:364` install outro "run: /add" → "/add-help";
  `cli/src/release-copy.js:30` example comment `add.md` → `add-help.md`.
- **F5** [internal] — `web/src/pages/docs.astro:296` and `web/public/commands.svg:117`: `/add` →
  `/add-help`. README carries no bare `/add` today (checked at planning); the grep in L1.3 proves it stays so.
- **F6** [product] — `cli/tests/product-resource-names.test.js`: drop `toContain('add')` and the
  `n !== 'add'` filter, assert every command key matches the command regex with no exception and that no
  key `add` exists. `cli/tests/chat-continuation-handoff.test.js:90`: `EXEMPT` names `add-help.md`.
  - **Consumes:** `framwork/.codeadd/commands/add-help.md` (F1)
- **F7** [internal] — `scripts/build.js` `assertProductNames`: remove the `name !== 'add'` exception. A
  key `add` must now throw `Invalid product command name: add`.
  - **Consumes:** `framwork/.codeadd/commands/add-help.md` (F1)
- **F8** [product] — new `cli/tests/add-help.test.js`, written RED before F1:
  - `add-help.md` exists and `add.md` does not;
  - it names its sources: `manifest.json`, `agent-mode/README.md`, `codeadd --help`, and the
    `add--ecosystem` sections `Main Flows`, `Command Next-Steps Routing`, `Features`, `Plugins`;
  - it carries no `STEP add.` ID and none of the four stale strings from Problem 3;
  - `add--ecosystem` carries a routing row whose `After` cell names `codeadd update`;
  - `pruneObsolete` (`cli/src/release-copy.js`), given a prior manifest listing
    `.claude/commands/add.md` and a written list without it, removes that file — the "old install keeps
    no dangling file" half of the ticket. A second case does the same for `.agents/skills/add/SKILL.md`,
    the old file on codex/zcode (antigrav's `.agent/skills/add/SKILL.md` is the same shape).
  - **Consumes:** `framwork/.codeadd/commands/add-help.md` (F1); routing row `After codeadd update` (F3)

### Does NOT Include (important!)

- An `/add` alias or redirect file — decided against; the rename goes in the release note via this
  delivery's changelog.
- Copying `USAGE` from `cli/src/cli.js` into `add--ecosystem` — it would drift.
- Copying plugin install steps into the command.
- The test fixtures in `config.e2e`, `doctor.*`, `installer.test`, `install.e2e` and `build.test` that
  use `add.md` / `name: 'add'` as an arbitrary file or name — they assert nothing about the real tree.
- `AGENTS.md` inventory — generated; `/add-framework--done` regenerates it from disk.
- Running `/add-framework--sync` — F5 edits the two web sites directly; a later sync starts from them.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Command name | `add-help`, not `add--help` | STEP 4 answer (2026-10-09). `add--help` failed `assertProductNames` and the name test, and on codex/antigrav/zcode commands share the `skills/` folder with skills, where `--` is the only marker of a skill. Overrides the intent's `add--help` and the ticket's wording |
| Keep the gate's root exception? | No — remove it | STEP 4 answer "sem exceção"; with no command named `add` it guards nothing |
| Stale refs in `add.md`, global-install lookup, `npx --yes`, the `EXEMPT` test, the `add--ecosystem:245` row, `commands.svg` | Fixed in this delivery | STEP 4 section 4, accepted by the user |
| Types A/G/H/I, sources, overview, routing row, no alias, proof | As in the intent | Intent `## Decided` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/commands/add.md` → `add-help.md` | product | rename + modify | F1, F2 |
| `framwork/provider-map.json` | product | modify | F1 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F3 |
| `cli/src/installer.js` | product | modify | F4 |
| `cli/src/release-copy.js` | product | modify (comment) | F4 |
| `web/src/pages/docs.astro` | internal | modify | F5 |
| `web/public/commands.svg` | internal | modify | F5 |
| `cli/tests/product-resource-names.test.js` | product | modify | F6 |
| `cli/tests/chat-continuation-handoff.test.js` | product | modify | F6 |
| `scripts/build.js` | internal | modify | F7 |
| `cli/tests/add-help.test.js` | product | create | F8 |

Risk (STEP 3.2, `impact --depth 1`): `add` LOW (0 dependants); `add--ecosystem` HIGH (6 dependants —
add, add-audit, add-diagnose, add-done, add-hotfix, add-wiki — the edit is table text and one added row,
no section renamed). `scripts/build.js`, `cli/src/*`, `provider-map.json`, tests and web files are not
graph nodes: NOT VERIFIED by the graph, checked by hand at planning. Delivery index: no prior delivery
for `add` or `add--ecosystem` in the product layer.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write F8 and the F6 test changes BEFORE F1 and confirm they fail on the
current tree.

### L1 — Build and tree (RED → GREEN)

1. `node scripts/build.js` exits 0 with no new warning. Every provider tree holds the command under its
   own pattern — `framwork/.claude/commands/add-help.md`, `.opencode/commands/add-help.md`,
   `.cursor/commands/add-help.md`, `.agents/skills/add-help/SKILL.md` (codex, zcode),
   `.agent/skills/add-help/SKILL.md` (antigrav) — and none holds `commands/add.md` or `skills/add/`.
   *RED today: only `add` is emitted.*
2. A temporary `provider-map.json` copy with a key `add` makes `assertProductNames` throw
   `Invalid product command name: add` (run against a scratch copy, never the checkout). *RED today: the
   exception lets it through.*
3. `grep -rnE '(^|[^A-Za-z0-9_-])/add([^A-Za-z0-9_.-]|$)'` over `framwork/.codeadd/`, `cli/src/`,
   `README.md`, `web/src/`, `web/public/` returns nothing. *RED today: 5 hits (ecosystem ×2,
   installer, docs.astro, commands.svg:117).* The `.` in the trailing class excludes the legacy
   `/add.xxx` names in the web SVGs; they are out of scope and F5 does not touch them.
4. `grep -n 'STEP add\.' framwork/.codeadd/commands/add-help.md` returns nothing.

### L2 — Tests

1. `cli/tests/add-help.test.js` (F8) passes. *RED today: no `add-help.md`.*
2. `product-resource-names.test.js` and `chat-continuation-handoff.test.js` (F6) pass. *RED today after
   the F6 edit: a key `add` exists and `add-help.md` does not.*
3. The full suite through `node scripts/run-tests.js` is green, with `scripts/test-loss-guard.cjs`
   clean (no test name lost without a `Test-Removed:` trailer).

### L3 — Graph and behavioural acceptance

1. After the build: `graph.js impact add-help --depth 1` returns 0 dependants; `dependencies add-help`
   lists `add--ecosystem`, `add--dev-environment-setup` and `add-audit`; no node `product/command/add` exists.
2. Trace, by reading `add-help.md` against a release tree, each question to a Type and a source file that
   exists there: "how do I enable QA" → G → `Features` + `manifest.json`; "what is GitNexus and how do I
   enable it" → G → `Plugins` + `manifest.json`; "how do I run this from a bot" → H →
   `.codeadd/agent-mode/README.md`; "what do I run after `codeadd update`" → I → the F3 row; "how do I
   uninstall" → I → `codeadd --help`. Each trace is written in the ledger.

**RED expectations against the current tree:** L1.1–L1.3 and L2.1–L2.2 fail.
**GREEN = all levels pass after F1–F8.**

---

## Execution Order

1. **F8** [product], **F6** [product] — tests first, confirmed RED.
2. **F1** [product] — rename; the tree now builds `add-help`.
3. **F3** [product] — the routing row F2 reads.
4. **F2** [product] — the rewrite.
5. **F4** [product], **F5** [internal] — the remaining name sites.
6. **F7** [internal] — the gate exception goes last, once no `add` key is left.

Every boundary after F1 leaves the build green. F7 before F1 would break the build, so the order is fixed.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the validation levels that cover it and
their state, and any departure from the intent with its reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A stale reference fixed by a mechanical `add.` → `add-help.` replace instead of by reading — e.g.
   "STEP add-help.classify-6" would pass L1.4 and still point at nothing.
3. Type G/H reading only the project's `.codeadd/` and missing the `--global` home path.
4. Plugin install steps or `USAGE` text copied into the command.

---

## Next Steps

/add-framework--build docs/plans/2026-10-09T092025-PLAN--add-help-guide.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-09 | Initial creation |
| 2026-10-09 | Review fix-then-ok: L1.3 grep excludes `/add.xxx` (B1); F2 adds `/add-audit` to `uses:` (A1); lint-scope constraint (A2); F8 second `pruneObsolete` case (A3); correction note trimmed (N1) |
| 2026-10-09 | User approval at build: Type I runs `codeadd --help` when the binary exists, `npx --yes codeadd --help` only as fallback |
| 2026-10-09 | Implemented on feat/add-help-guide: F1-F8 as planned (F1+F3 one commit); F9-F12 added by ruling (suite fallout, regenerated diagram, review fixes, building-commands prose). See the ledger for commits and rulings |

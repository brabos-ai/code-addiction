---
path: bounded
topic: add-setup
doc: none
delivery: confirm
ticket: 0067B
---

## Decided

1. Problem: onboarding. After `codeadd install` a new user does not know what to turn on. Every piece already exists separately: `codeadd features enable|disable` (tdd-pipeline, qa-pipeline, docs-pruning, board, agent-mode; `cli/src/features.js`), `codeadd plugins enable|disable` (gitnexus, playwright, design; `cli/src/plugins.json`), `/add-qa-setup`, `/add-wiki`, the greenfield branch of `/add-brainstorm` and the skill `add--dev-environment-setup`. The install outro only says "run: /add-help" (`cli/src/installer.js:437-443`). This card adds `/add-setup`, a thin orchestrator command that analyzes the project, proposes the whole configuration in one batch, and runs the existing pieces. It reimplements none of them. Verified on main `d354f5dc` (v1.6.0), where `wiki-stack-conventions` (#153), `design-plugin` (#155) and `brainstorm-greenfield` (#156) are already merged. Paths below are under `framwork/.codeadd/` unless stated otherwise.
2. Name: `/add-setup`, new file `commands/add-setup.md`. Not `init`, because that reads like `codeadd install`, which copies the files.
3. Flow, in four stops: diagnose (silent, read-only) → one batch that presents every feature and plugin and asks, per item, whether the user wants it (decision 12) → one reply in which the user answers each item → execute ONLY the accepted items, in the fixed order of decision 11. This is a per-item opt-in, not one confirmation of a pre-built bundle. Nothing is installed or enabled before the reply, and an item the user did not accept is never run.
4. Diagnosis reuses existing signals and adds no new script:
   - `node .codeadd/scripts/status.cjs` for `WIKI:present|absent` (`scripts/status.cjs:802,839`) and `SETUP_QA:present|stale|absent` plus `SETUP_QA_STALE` (`status.cjs:843-868`).
   - Current features and plugins from `.codeadd/manifest.json`, project first and then home, read exactly as `/add-help` Type G does (`commands/add-help.md:181-190`; absent feature key = the `Default` column of the `add--ecosystem` Features table; absent plugin key = off). When only the home manifest exists, every CLI call in decision 7 carries `--global` and the batch says so.
   - Greenfield: the same rule `/add-brainstorm` evaluates (`commands/add-brainstorm.md:117-122`: no root `AGENTS.md`, and nothing left in `git ls-files --cached --others --exclude-standard` after dropping dot paths, `docs/`, root `*.md` and `LICENSE*`). `add-setup.md` points at that definition and does not copy it.
   - Frontend present: the code serves a UI in a browser (judged from the package manifests and source tree), or, on a repo with no code yet, the `## Stack Conventions` table in `.codeadd/wiki/conventions.md` (written by the greenfield brainstorm, `skills/add--architecture-discovery/spine-analyzer.md:116`) names a frontend stack.
   - Codebase-analysis tool: only `gitnexus --version` (the plugin's own `detect`, `cli/src/plugins.json` gitnexus entry). No alternatives are probed.
5. Brownfield recommendations. Every item of decision 12 is asked; the rules below decide only each item's RECOMMENDATION (yes/no) and the detected reason shown next to it (an item already on is shown as on and not asked again, see decision 9):
   - Frontend present and no QA (`SETUP_QA:absent`) → enable feature `qa-pipeline` and plugin `playwright`, then run `/add-qa-setup`. Proposed proactively, with the reason "guarantees the quality of UI deliveries". `SETUP_QA_STALE:yes` → re-run `/add-qa-setup` only.
   - `gitnexus --version` fails and the repo has code → recommend gitnexus; if accepted, install it after the reply: `npm install -g gitnexus`, `gitnexus setup`, `gitnexus analyze` (from the repo root), then enable plugin `gitnexus`. Same steps as the plugin's `installHint`/`postEnableHint` (`cli/src/plugins.json` gitnexus). On a repo with no code yet it is not proposed: there is nothing to index.
   - Frontend present → propose plugin `design`. If `ui-ux-pro-max` is not installed, the install line is the provider-neutral route of its `installHint`: `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai <provider>` (Python 3 is a soft requirement, as the plugin's `postEnableHint` already says). The CLI's `detect` stays the authority: if enable fails, setup reports it (decision 12). The `design-plugin` card has landed (#155), so it is included now.
   - `board` and `agent-mode` are asked, not inferred, because they depend on how the user works. Board: setup enables the feature only when `.codeadd/board.json` exists (the board resolver's only config, `scripts/backlog-board.cjs:16-23,67`). When it does not, the item says a board cannot be created from the product today (`backlog-cli.cjs:395-397` tells the user to ask the framework maintainer) and leaves the feature off. Agent-mode: asked as "will a bot drive the commands headless?", recommended off for a person at a terminal (`features.js` agent-mode comment).
   - `.codeadd/wiki` missing (`WIKI:absent`) → run `/add-wiki`, last. `WIKI_STALE_COUNT` above zero → a line in the report recommending `/add-wiki update`, not run.
   - `tdd-pipeline` (default on) is asked as keep on / turn off, recommended keep on. `docs-pruning` is asked and recommended no: it deletes user documentation and is the user's call (`features.js` docs-pruning comment).
6. Greenfield (`GREENFIELD=yes`): setup has no analysis of its own. It stops before the batch and ends on `/add-brainstorm` as the next command, which takes its greenfield branch and decides the stack (card `brainstorm-greenfield`). After the foundations are written the user runs `/add-setup` again. The repo is then no longer greenfield (it has `AGENTS.md`), the wiki already exists, and frontend detection reads the `decided` Stack Conventions rows (decision 4).
7. The CLI is run by setup itself after the reply, in ONE call that carries only the accepted items (and `--disable-feature tdd-pipeline` only if the user turned it off): `codeadd modify --enable-feature <a,b> --enable-plugin <c,d>` (no prompt with these flags, `cli/src/cli.js:120-125`). Using `modify` rewrites the command files once instead of once per item. When `codeadd` is not on the PATH, setup runs `npx --yes codeadd …`, the same fallback `/add-help` uses for `--help` (`add-help.md:212`). It then confirms the result with `codeadd features list` and `codeadd plugins list`. This is an explicit exception for `/add-setup` only. `/add-help` keeps its rule of running no `codeadd` command besides `--help` (`add-help.md:53-54,216,273`). Precedent: `/add-qa-setup` already runs `codeadd features enable qa-pipeline` after confirmation (`commands/add-qa-setup.md:73,235-238`, and its named CLI exception at `:83`).
8. Installing with confirmation. Setup installs the external tools of the ACCEPTED items itself after the reply (the per-item yes is the install confirmation, because the batch showed the exact install commands), reusing `add--dev-environment-setup`'s detect → diagnose → confirm → install → verify discipline (`skills/add--dev-environment-setup/SKILL.md:14-16`). Anything that needs `sudo` or an interactive installer (for example a global `npm install -g` that fails on permissions, or `gitnexus setup` if it prompts) is shown for the user to run and then verified, exactly as `/add-qa-setup` does (`add-qa-setup.md:271`). After each install setup runs the tool's trivial check (`gitnexus --version`). The rule "codeadd owns utilization, never installation" stays true for the CLI. Reword it so it does not contradict this: `cli/src/plugins.json:3` `$schema-doc.description` → "The CLI owns utilization, never installation: it detects the tool and never installs it. The conversational setup commands (/add-setup, /add-qa-setup) may install a tool after the user confirms." Apply the same clause to `AGENTS.md:229` (Plugin System paragraph).
9. Idempotent and re-runnable. Every run starts by showing what is already on (manifest, `SETUP_QA`, `WIKI`, `gitnexus --version`) and proposes only what is missing or stale. When nothing is missing it says so and ends. This makes it the command to run after `codeadd update` too (decision 24). What is ON comes from the manifest, `SETUP_QA` (read by `status.cjs` from `.codeadd/settings.json` → `qa` after `qa-settings`) and the wiki; what was DECIDED and why comes from the `setup` section of `.codeadd/settings.json` (decision 23). A declined item is not re-asked, in the same run or in later runs, unless the user names it to revisit (decision 24).
10. Execution model: inline, same session. Setup runs `/add-qa-setup` and `/add-wiki` by reading each command file and following it from its first step, in the same session. This is the same rule `add--delivery-mode` already uses for an automatic handoff (`skills/add--delivery-mode/SKILL.md:142-155`: same agent, same session, read the next command and run it from its first step; no subagent, no new context). Not in a subagent: `/add-wiki` dispatches parallel analyzer subagents (`add-wiki.md:252`, STEP add-wiki.dispatch) and a Claude Code subagent cannot spawn subagents. Not via an external `claude -p`: that ties setup to one provider, needs a second login and spends tokens again. Plain markdown, so it works on every provider. `add-setup.md` itself dispatches nothing, so it must not contain the word `DISPATCH` (`cli/tests/dispatch-rules.test.js:18-23` would then require the dispatch-rules reference).
11. Execution order is fixed, because enabling a feature or plugin rewrites the installed command files:
    1. Install the external tools (gitnexus, ui-ux-pro-max) and verify them.
    2. The single `codeadd modify` call (decision 7), then `features list` / `plugins list`.
    3. `gitnexus setup` (if not wired) and `gitnexus analyze` from the repo root.
    4. Re-read the installed command files from disk (never a copy read before step 2) and run `/add-qa-setup`.
    5. `/add-wiki` last, so the wiki is generated with the graph slots filled.

    
    MCP checkpoint: a newly wired MCP server (gitnexus after `gitnexus setup`) is usually loaded only by a new session, and `/add-wiki`'s gitnexus slots call its tools (`plugins/gitnexus/fragments/add-wiki.md`, `list_repos`). Before step 5, when gitnexus is enabled, setup checks the MCP answers in this session. If it does not, setup stops after step 4 and tells the user to restart the session (or reload MCP) and run `/add-setup` again. Thanks to decision 9 the second run proposes only `/add-wiki`.
    
12. Questions: one batch, like agent mode but internal, answered in one reply. The batch opens with the diagnosis, then one numbered item per feature and plugin (`tdd-pipeline`, `qa-pipeline`, `docs-pruning`, `board`, `agent-mode`, `gitnexus`, `playwright`, `design`) plus the `/add-qa-setup` and `/add-wiki` runs. Each item shows:
    - what it is and its concrete benefit, read at run time from the single source of decision 22 (never written into `add-setup.md`), plus one clause tying it to this project when detection supports it (e.g. "your repo has a React frontend");
    - the recommendation, yes or no, with the detected reason (decision 5);
    - the exact install commands and CLI flag it implies if accepted;
    - the question "use it? (yes/no)".

    
    Items already on are listed once as on and not asked. Dependent items are paired so a single answer covers them: `playwright` and the `/add-qa-setup` run are only offered when `qa-pipeline` is accepted or already on (the plugin only adds live driving to the judge the feature supplies, `add--ecosystem` Features note). The reply may be per item (`1 yes, 2 no, …`) or "all recommended". The batch also carries the values the sub-commands would otherwise ask for, asked only for accepted items:
    

    - `/add-qa-setup`: the prerequisite installs (`add-qa-setup.md:264-284`), the QA config values `baseUrl`, `bootHint`, `authSeed` (`:323-336`; setup recommends `baseUrl` from the dev script and never a production URL, `:334`), and the migration decision only when its scan list finds existing tooling (`:290-291`; setup applies that list by reference, it does not copy it).
    - `/add-wiki`: nothing to ask (its only input is the user-owned `wiki/INSTRUCTIONS.md`, `add-wiki.md:239-249`).
    - Board and agent-mode (decision 5).

    
    Setup prints the per-item answers (accepted, declined) and the values as a `## Setup answers` block before executing. How sub-commands receive them, with the smallest change: one short paragraph in `commands/add-qa-setup.md` and one in `commands/add-wiki.md`, placed right after the `agent-mode.interaction` slot (`add-qa-setup.md:32-35`, `add-wiki.md:23-26`). The paragraph says: when this session holds a `## Setup answers` block from `/add-setup`, every stop that block covers takes its answer from it and does not ask again (feature gate, install confirm, config values, migration decision); a declined item is recorded as declined, not asked again; a stop it does not cover asks as usual; skip the closing offer, because `/add-setup` owns the closing; on any failure stop and return to `/add-setup`. Both the human and the agent-mode text paths honor it. The paragraph sits outside `add-qa-setup`'s `## Materializes` block, so the contract `shape` hash does not move (`add-qa-setup.md:96-118`). No slot, fallback or fragment is added. On failure, setup stops and reports which step failed, the command's output, and what already ran. It does not roll back.
    
13. Closing. Before the report, setup writes its record, the `setup` section of `.codeadd/settings.json` (decision 23), also when nothing was accepted (declines are decisions too) and also when it stops at the MCP checkpoint or on a failure (items that ran are recorded; items that did not run keep their previous `offered` value). Setup loads `add--final-report` (it finishes work, and that skill covers "every command that finishes work", `skills/add--ecosystem/SKILL.md:243`). The report lists what was enabled, installed, generated, declined, and what is left for the user. It ends on one next command: `/add-new` (or `/add-brainstorm` when the user has no idea yet), `/add-brainstorm` on greenfield (decision 6), or `/add-setup` again after the MCP checkpoint (decision 11).
14. Agent mode: `add-setup` is NOT added to `FEATURES['agent-mode'].commands` (`cli/src/features.js:104`). It carries no `agent-mode.*` slot. Its single numbered batch with a recommendation per item already works for a person and for a bot. Adding it would need a slot, a fragment and new counts in `cli/tests/agent-mode-feature.test.js:246-262` and the slot fixtures, all for no behavior change. The `agent-mode` rows in `add--ecosystem:220` and `AGENTS.md:225` stay as they are.
15. `codeadd install` outro (`cli/src/installer.js:437-443`) becomes: step 1 `Open your AI editor and run: /add-setup`, step 2 `Questions? run: /add-help`, then the Docs line. `codeadd update`'s outro (`cli/src/updater.js:173`, today only `ADD updated successfully!`) gains the same pointer: `Next: open your AI editor and run /add-setup to review what is new in this version.` The installer and updater keep no knowledge of the record; they only print the line.
16. Registration and references (the minimum the build, the graph and the help need):
    - `framwork/provider-map.json` `commands`: `"add-setup": { "description": "<the command frontmatter description>" }`. An unregistered command fails the build (`workbench/skills/add-framework-product-layer/SKILL.md:101-105`).
    - `add-setup.md` gets the standard frontmatter, the LANG line, and a `<!-- uses: -->` block: commands `/add-qa-setup`, `/add-wiki`, `/add-brainstorm`, `/add-new`; skills `add--dev-environment-setup`, `add--final-report`, `add--settings`; script `status.cjs`. Written with the `building-commands` ruler.
    - `skills/add--ecosystem/SKILL.md`: the `mention: /add-setup` line in `uses`; a row in `## Commands` (`:117-136`); a one-line `Benefit` column in `## Features` (`:214-220`) and `## Plugins` (`:226-232`) per decision 22; add `add-setup` to the Used By of `add--settings` (the row `qa-settings` adds) and of `add--dev-environment-setup` (`:154`, `:264`) and `add--final-report` (`:160`, `:243`) and to `status.cjs` (`:282`); routing rows in `## Command Next-Steps Routing` (`:318`): `codeadd install` → `/add-setup`; the existing `codeadd update` row (`:372`, the post-update routing `/add-help` Type I reads, `add-help.md:214`) is rewritten, not duplicated, because the table is first-match: Condition `always; when \`.codeadd/wiki/\` exists also the wiki refresh`, Next activity `\`/add-setup\` (reviews what is new since the setup record), then \`/add-wiki update\` when \`.codeadd/wiki/\` exists`. It keeps both `.codeadd/wiki/`and`/add-wiki update`, so `cli/tests/add-help.test.js:62-63`still passes unchanged;`add-setup`greenfield →`/add-brainstorm`; `add-setup`done →`/add-new`; `add-setup`stopped at the MCP checkpoint →`/add-setup\`.
    - `commands/add-help.md`: one Suggestion Table row (`:226-239`), "codeadd just installed, or features/plugins never chosen → `/add-setup` — Guided onboarding", and `- command: /add-setup` in its uses block (`:3-16`). Type G (`:181-196`) adds one sentence: to set several up at once, run `/add-setup`.
    - `web/src/pages/docs.astro` Utilities group (`:291-304`): a `/add-setup` card. `README.md:145`: one sentence pointing new users to `/add-setup`. The docs graph node list and `ecosystem.md` are left to `add-framework--sync` at release.
    - `AGENTS.md` inventory block (`:23`): regenerate with `node scripts/inventory.js`; never edit it by hand.
17. Tests: a new `cli/tests/add-setup.test.js` (text checks, same style as `cli/tests/add-help.test.js`):
    - `add-setup.md` names its sources: `status.cjs`, `manifest.json`, `gitnexus --version`, `codeadd modify`, `add--dev-environment-setup`, `add--delivery-mode`, `## Setup answers`, and the `Benefit` column of `add--ecosystem`.
    - It asks per item (yes/no) and runs only accepted items.
    - Every row of `add--ecosystem` `## Features` and `## Plugins` has a non-empty `Benefit` cell, and the feature and plugin names in those tables match `cli/src/features.js` and `cli/src/plugins.json` one to one (so a new feature or plugin cannot ship without a benefit line).
    - It states the order of decision 11 and the MCP checkpoint.
    - It does not contain `DISPATCH`.
    - `add-qa-setup.md` and `add-wiki.md` each contain the `## Setup answers` paragraph.
    - `add-help.md` still forbids every `codeadd` command but `--help`.
    - `add-setup.md` writes the `setup` section of `.codeadd/settings.json` (`setup-shape: "none"`, `framework-version`, `offered`), appends one `log` entry per decided item, detects new items by name absent from `offered`, does not re-ask a `declined` item, and merges only `setup` (a `qa` section in the fixture is left unchanged).
    - `add--settings` documents the `setup` section (`offered` vocabulary, `setup-shape: "none"`).
    - `add-setup.md` offers the `version-record` item for `.codeadd/settings.json`, recommended yes, and on "no" appends `.codeadd/settings.json` after the `# END ADD` line.
    - The CLI survival and gitignore tests for `settings.json` belong to `qa-settings`. This card adds none.
    - The updater outro names `/add-setup`.
    - The installer outro names `/add-setup`.
    - `provider-map.json` registers `add-setup`.

    
    The existing `build-contracts` tests prove the `add-qa-setup` shape did not move.
    
18. Out of scope:
    - Creating a board (`board.json` plus the orphan branch).
    - Detecting codebase tools other than gitnexus.
    - Running `/add-brainstorm` inline.
    - Any new CLI subcommand or script.
    - Changes to `plugins.js`, `features.js` or `injection-core.js`.
    - Auto-installing Python.
    - Rollback on failure.
    - Any CLI or `status.cjs` code that reads or writes the `setup` section (only `/add-setup` does).
    - Creating `.codeadd/settings.json`'s infrastructure, the `add--settings` skill, or the CLI gitignore, install and uninstall handling (card `qa-settings`).
    - Setup running `git add` / `git commit`.
    - A `## Materializes` contract or shape for `/add-setup`.
    - Adding `add-setup` to agent-mode.
19. Target: next release, priority Média. Its dependencies `wiki-stack-conventions` and `brainstorm-greenfield` are already merged (#153, #156), so it can be planned now.
20. Acceptance criteria:
    - (a) `npm run build` emits `add-setup` for every provider, and `npm run test:all` passes, with the new test and `node scripts/inventory.js --check` current.
    - (b) Brownfield with UI, no QA, no gitnexus, no wiki: `/add-setup` prints the diagnosis and ONE batch with one item per feature and plugin plus `/add-qa-setup` and `/add-wiki`. Each item shows what it is, its benefit (from the `add--ecosystem` `Benefit` column), a yes/no recommendation with the detected reason, its install commands, and a yes/no question. Nothing runs before the reply.
    - (c) After the reply, the run order is installs → one `codeadd modify …` → `gitnexus setup`/`analyze` → `/add-qa-setup` → `/add-wiki`, restricted to the accepted items. `/add-qa-setup` asks nothing the batch covered, and `codeadd features list` / `plugins list` show exactly the accepted items enabled.
    - (c2) Answering "no" to an item (e.g. gitnexus) means none of its commands run and it is listed as declined in the report; answering "all recommended" accepts exactly the items marked yes.
    - (d) When the gitnexus MCP is not reachable in the session, setup stops before `/add-wiki` and ends on `/add-setup`. A second run proposes only `/add-wiki`.
    - (e) A second run on a fully set project proposes nothing and says so.
    - (f) On a greenfield repo, setup proposes nothing and ends on `/add-brainstorm`.
    - (g) Without `.codeadd/board.json`, the board item says it cannot be created from the product and the feature stays off.
    - (h) A failing step stops the run with the failing command and what already ran.
    - (i) `codeadd install` ends with "run: /add-setup".
    - (j) `/add-help` suggests `/add-setup` after an install and still runs no `codeadd` command but `--help`.
    - (k) The `add-qa-setup` contract `shape` is unchanged.
    - (l) After a run, `.codeadd/settings.json` holds a valid `setup` section (passes the `add--settings` JSON check), and any `qa` section is unchanged. It has `framework-version` = the manifest version and one `offered` key per offered item (features, plugins, `qa-setup`, `wiki`). Each decided item has a `log` entry with its date and reason; declined items carry the user's reason or the detected one.
    - (m) Re-run on the same version: every item is already decided, so setup lists one summary line per item (decision + reason) and asks nothing, unless the user names items to revisit.
    - (n) Re-run after a version bump that adds a feature or plugin row to `add--ecosystem`: only the new item is asked, with its benefit. A `declined` item is not re-asked, and an item that left the tables is noted as removed. `framework-version` moves to the new version, and all earlier `log` entries stay. A bump that adds no item asks nothing.
    - (o) Changing a decision on revisit updates `offered.<item>` and appends a NEW `log` entry; the old entry is unchanged.
    - (p) The record's survival across update, modify and uninstall and its gitignore exception are proven by `qa-settings`. This card adds nothing there.
    - (p2) The batch carries `version-record`, recommended yes. "Yes" makes the report list `.codeadd/settings.json` as a file to commit, and setup itself runs no git command. "No" appends `.codeadd/settings.json` after the `# END ADD` line, so `git check-ignore` then matches it.
    - (q) `codeadd update` ends with a line pointing to `/add-setup`.
21. Risks:
    - Batch length: eight features/plugins plus two runs, each with benefit and commands. Mitigation: items already on are listed once and not asked (decision 9), dependent items are paired (decision 12), and "all recommended" is a valid one-word reply.
    - A global `npm install -g` needs elevated rights on some machines. Mitigation: show the command and let the user run it (decision 8).
    - `gitnexus setup` wiring differs per provider. Mitigation: the MCP checkpoint (decision 11) and the plugin's `postEnableHint` verify line.
    - Frontend detection is a judgment call. Mitigation: every proposal shows its reason, and the user can decline it in the batch.
    - Inline execution makes a long session (QA setup plus wiki). Mitigation: the MCP checkpoint and re-runs split it naturally; `/add-wiki` already runs its analyzers in their own subagents.
22. Single source of the benefit text: the `add--ecosystem` skill tables, the source `/add-help` Type G already reads for "what it is" (`commands/add-help.md:185`). Chosen over the catalog descriptions (`cli/src/features.js` `description`, `cli/src/plugins.json` `description`): those are terse CLI list lines ("QA pipeline (E2E authoring + agent QA validation)"), they live in the npm package and not in the user's project (only the CLI reads them), and adding a field there would touch JSON schema docs and CLI code. The existing `Purpose`/`Description` cells say what an item does, not what the user gains, so the minimal fix is ONE new column `Benefit` (one line, user-facing, no marketing) in `## Features` and `## Plugins` of `skills/add--ecosystem/SKILL.md`, filled for all 5 features and 3 plugins. `add-setup.md` reads `Purpose`/`Description` + `Benefit` at run time and hardcodes no benefit text. `/add-help` Type G may show the same cell; no change is required there. For the `/add-qa-setup` and `/add-wiki` items the source is the `## Commands` table `Purpose` cell.
23. Setup record: the `setup` section of `.codeadd/settings.json`. The file, its location (project root, also on `--global`), its ownership (each command writes only its own section, read → merge → write), its schema home (skill `add--settings`), its gitignore exception and its survival in the CLI are all owned by card `qa-settings` (decisions 3, 4, 5, 6, 11, 12 there). This card adds only the `setup` section. Only `/add-setup` writes it, at the end of every run (decision 13). It follows the content rule: values, short descriptions and decisions in JSON, and no prompt text.
    
    Why `.codeadd/`: Maicon's call. It keeps the framework's project config together, next to `board.json`. `manifest.json` stays out of it, because the CLI owns and rewrites it: update rebuilds it from a fixed key list (`cli/src/updater.js:137-144`), so an extra key would be dropped.
    

    
    Section fields: the generic receipt fields from `add--settings` (`framework-version`, `first-run`, `last-run`), plus:
    

    - `setup-shape: "none"`: `/add-setup` has no `## Materializes` contract. Adding one would put it into `contracts.json` and the build's shape hashing (`scripts/build.js:506-513`) for nothing. `add--settings` documents `"none"` as the value for a command with no contract.
    - `offered.<item>`: one key per item ever offered: each feature and plugin by its table name, plus `qa-setup`, `wiki` and `version-record`. Values are `enabled | already-on | declined | unavailable | failed`. `unavailable` covers, for example, board without `board.json`.
    - `log`: the append-only decision log, an array of `{date, item, decision, reason}`. It has one entry per item decided in a run, `declined` included, and a reversed decision is a NEW entry. `reason` is the user's reason, or the detected one when they gave none. Old reasons are never lost.

    
    The rest:
    

    - `framework-version` holds the manifest `version` at run time (`installer.js:82`). It is informational only and never compared.
    - `first-run` is never rewritten. `last-run` moves on every run.
    - `status.cjs` and `add--setup-contract` are untouched: there is no shape to compare.
    - This card adds the `setup` section schema (the three fields above) to `add--settings` next to `qa`.

    
    Example:
    

    ```json
    "setup": {
      "setup-shape": "none",
      "framework-version": "1.7.0",
      "first-run": "2026-10-25",
      "last-run": "2026-10-25",
      "offered": {
        "qa-pipeline": "enabled", "playwright": "enabled", "gitnexus": "declined", "design": "enabled",
        "board": "unavailable", "agent-mode": "declined", "tdd-pipeline": "already-on", "docs-pruning": "declined",
        "qa-setup": "enabled", "wiki": "enabled", "version-record": "enabled"
      },
      "log": [ { "date": "2026-10-25", "item": "gitnexus", "decision": "declined", "reason": "team already uses Sourcegraph" } ]
    }
    ```

    
    `add-setup.md` loads `add--settings` before writing, merges only `setup`, and runs the `add--settings` JSON check (the same gate `/add-qa-setup` runs after `qa-settings`). A missing `setup` section means a first run (decision 24). An unreadable `settings.json` is reported and never overwritten blindly. Setup stops and asks, because the file also holds `qa`.
    
24. Update and re-run flow. On every run, after the diagnosis, setup reads the record and compares it with the current `add--ecosystem` `## Features` / `## Plugins` rows, the commands it offers, and the manifest:
    - New items: names in the tables (plus `qa-setup` and `wiki`) that have no `offered` key, for example a feature added by the version `codeadd update` just installed. They are asked in the per-item batch with their benefit (decision 12). Newness is detected by the item NAME being absent from `offered`, never by comparing `framework-version`. A release that adds nothing stays silent. The batch header cites the recorded `framework-version` for context only.
    - Already decided items → one summary line each (`name — offered value — latest `log` reason — date`), not asked. The user may answer "revisit <names>" in the same reply, and those are then asked as normal items.
    - Drift: `offered` says `enabled`/`already-on` but the item is now off in the manifest (a fresh clone, or a manual `disable`) → asked again, showing both states. That is how a teammate re-applies the team's setup.
    - Removed items (an `offered` key no longer in the tables) → one note line ("no longer offered by this version"), not asked. The key stays.
    - No `setup` section → first-run behavior: everything not already on is asked.

    
    `codeadd update` points here through its outro (decision 15) and the rewritten routing row (decision 16). The stale-wiki line of decision 5 still applies on these runs.
    
25. CLI consequences: none in this card. Card `qa-settings` (decision 11 there) owns them all. It covers the managed `.gitignore` block (`!.codeadd/settings.json`), `addDirHoldsInstall` ignoring `settings.json`, the corrupted-manifest uninstall keeping it, and the facts that update, modify and install never touch it (`copyRelease` and `pruneObsolete` only handle release and manifest `files`), all with tests. `.codeadd/setup.md` is dropped: there is no such file, no gitignore line for it, and no extra entry in `addDirHoldsInstall` or the uninstaller.
26. Versioning recommendation: the batch always carries one item, `version-record`. It reads "Version `.codeadd/settings.json` with the project (recommended: yes): teammates and future updates see what was enabled and why, and the QA setup travels with it." When the file is already tracked (`git ls-files --error-unmatch .codeadd/settings.json` succeeds), it shows as already on and is not asked.
    - Yes: the report lists `.codeadd/settings.json` under files to commit. `/add-setup` runs no `git add` or `git commit`, the same rule `/add-brainstorm` follows (`add-brainstorm.md:135`).
    - No: setup appends the line `.codeadd/settings.json` AFTER the `# END ADD` line of `.gitignore`. The later pattern beats the block's `!` line, and lines after the block survive block rewrites because `writeGitignoreBlock` replaces the block in place (`gitignore.js:68-72`). The batch says this also keeps the `qa` section local.
    - Without a managed block (`--no-gitignore`), nothing ignores `.codeadd/` unless the user did, so the item only reports the current `git check-ignore` result.
    - The decision and its reason go into `offered.version-record` and `log` like any other item.

## Open

None

## Card dependency

Depends on `wiki-stack-conventions` (Stack Conventions rows read for frontend detection on a new repo) and `brainstorm-greenfield` (greenfield route), both merged in v1.6.0. Uses the `design` plugin from `design-plugin` (merged). Depends on `qa-settings` (`.codeadd/settings.json`, the `add--settings` skill, and the CLI gitignore, install and uninstall handling), so plan and merge it after that card. Blocks nothing.

## Board changes

- status: shaped
- title: /add-setup: guided onboarding that detects the project, presents each feature and plugin with its benefit, asks per item in one batch, and runs the existing setup pieces for the accepted ones
- tldr: new thin command /add-setup. It diagnoses the project (status.cjs, manifest, greenfield rule, frontend, gitnexus --version), presents every feature and plugin with its benefit (from a new Benefit column in add--ecosystem) and a recommendation, asks per item in one batch, and for the accepted items installs tools, runs one `codeadd modify`, then runs /add-qa-setup and /add-wiki inline in the same session, passing the answers through a `## Setup answers` block. Writes its record as the `setup` section of .codeadd/settings.json (framework-version, offered.<item> decision, an append-only log of {date, item, decision, reason}) and recommends versioning settings.json (a batch item; the gitignore, install and uninstall handling come from qa-settings); on re-runs, including after `codeadd update`, it asks only items whose name is not yet in `offered`, lists decided items in one line each, re-asks drifted ones and notes removed ones. Greenfield routes to /add-brainstorm. The install and update outros point to it.
- done_when: commands/add-setup.md exists and is registered in provider-map.json; one diagnosis + one batch that presents every feature and plugin with its benefit (read from the new Benefit column in add--ecosystem Features/Plugins), a yes/no recommendation with the detected reason and its install commands, answered per item in one reply; only accepted items run; fixed order installs → single codeadd modify → gitnexus setup/analyze → /add-qa-setup → /add-wiki, with an MCP checkpoint that ends on /add-setup; add-qa-setup.md and add-wiki.md honor a `## Setup answers` block with one paragraph each and the add-qa-setup shape is unchanged; greenfield ends on /add-brainstorm; writes the `setup` section of .codeadd/settings.json (setup-shape "none", framework-version, offered.<item>, one log entry per decided item with its reason) at the end of every run, merging only `setup`, and add--settings documents the section; the batch offers version-record for .codeadd/settings.json (recommended yes; no = the line appended after # END ADD); re-run asks only items whose name is absent from offered or that drifted, lists decided items without re-asking, never re-asks a declined item unless revisited, notes removed items; codeadd update outro and the add--ecosystem `codeadd update` routing row point to /add-setup; board is enabled only with an existing .codeadd/board.json; installer and updater outros say run /add-setup; add-help suggests it and still runs only `codeadd --help`; plugins.json and AGENTS.md wording allow conversational installs; add--ecosystem, docs.astro and README list it; cli/tests/add-setup.test.js added; build, inventory --check and test:all pass.
- paths: framwork/.codeadd/commands/add-setup.md (new), framwork/provider-map.json, framwork/.codeadd/commands/add-qa-setup.md, framwork/.codeadd/commands/add-wiki.md, framwork/.codeadd/commands/add-help.md, framwork/.codeadd/skills/add--ecosystem/SKILL.md, framwork/.codeadd/skills/add--settings/SKILL.md (setup section), cli/src/installer.js, cli/src/updater.js, cli/src/plugins.json, AGENTS.md, README.md, web/src/pages/docs.astro, cli/tests/add-setup.test.js (new)
- labels: product
- notes: Priority Média. Plan after qa-settings (depends on it for .codeadd/settings.json and add--settings). wiki-stack-conventions and brainstorm-greenfield are already merged (v1.6.0, #153 and #156). Uses the design plugin from design-plugin (#155). No agent-mode slot by design (decision 14).

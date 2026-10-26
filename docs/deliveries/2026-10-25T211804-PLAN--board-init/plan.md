# Plan: board-init — enabling the `board` feature creates the board

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-25
> **Delivery:** confirm
> **Ticket:** 0070B

---

## Objective

[from conversation, no design document] Turning the `board` feature on creates a working board — `.codeadd/board.json`, the orphan `board` branch on origin and the clone under `~/.codeadd/<project-key>/board/` — through one shipped script that the CLI enable and `/add-setup` call, and no shipped text tells a user to "ask the framework maintainer" for the board.

**When this build is done:** a user on a project with an `origin` and a pushed main branch runs any of the three enable routes (or accepts `board` in `/add-setup`) and gets a board that the next ticket write lands on, with only `.codeadd/board.json` staged on the code side. A project that already has a board is left byte-for-byte as it was, and every failure (no git, no origin, empty remote, push refused) is one warning line while the enable itself still succeeds.

**Ticket done when:** In a new repo with origin and main pushed, npx codeadd install --enable-feature board leaves origin/board, the clone under ~/.codeadd/<key>/board/ and .codeadd/board.json staged with no code commit, and backlog-commit.cjs add then writes a ticket; a re-run or an existing board changes nothing (BOARD=ready); no origin or an empty remote pushes nothing and the enable still succeeds with a warning; no shipped text says framework maintainer for the board; npm run test:scripts and test:cli green.

## Context

Enabling `board` today only flips the manifest flag and reconciles the fragment slots (`enableFeature` in `cli/src/features.js`). A fresh project resolves to `none`, so every ticket write prints `REFUSED=board-not-configured` and — because a failed board write never fails a command — every ticket transition the pipeline makes is silently lost. The only creation route is the internal, never-shipped `scripts/migrations/migrate-board.cjs`, and `/add-setup` marks the item `unavailable` and points at the maintainer.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-25T121800-board-init-intent.md` | `path: bounded`, the 15 closed decisions (script behaviour per resolver state, config shape, base-branch order, root-commit trailers, clone, code side, output keys, CLI wiring incl. Maicon's automatic-push confirmation, `/add-setup`, message texts, migrate-board left alone, tests, docs), acceptance, risks. `## Open: None` |

Decision numbers below (`intent D<n>`) refer to that file's `## Decided` list.

## Global Constraints

- A shipped `.cjs` requires only a `node:` builtin, a bare builtin, or a `./` sibling `.cjs` in the same directory (`scripts/build.js`, `NATIVE_BUILTIN_RE` / `NATIVE_SIBLING_RE`); `board-init.cjs` requires `./backlog-board.cjs` and `./backlog-git.cjs` only (intent D2)
- The script pushes only the `board` branch; the code repository is never committed or pushed; the only code-side act is `git add -f -- .codeadd/board.json` (intent D6, D8)
- `.gitignore` is not edited (intent D8, `cli/src/gitignore.js` already carries `!.codeadd/board.json`)
- `scripts/migrations/migrate-board.cjs` and `scripts/tests/migrate-board.test.cjs` are not modified (intent D13)
- No test reads or writes `~/.codeadd/` or the repository checkout: every board test sets `CODEADD_BOARD_DIR` to a temp dir and uses a temp bare remote and a temp project (intent D14; prior art `2026-10-10T110912-PLAN--board-outside-code-branches`)
- Every behaviour change is strict TDD red-green: the failing test is committed in the same F-block before the implementation and is observed failing first (invocation)
- Edits are anchored by quoted text, never by line number (invocation)
- Examples written into any shipped text or doc stay stack-agnostic (invocation)
- The plan contains no deploy, rollout, publish or release task (invocation)
- Tests run through `node scripts/run-tests.js` (`npm run test:scripts`, `npm run test:cli`), never `npx vitest` inside `cli/` (project memory: tests do not write to the checkout)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **Enabling the feature creates nothing** — `enableFeature` flips a flag; `none`, `branch-missing` and `migration-required` all leave the user with no route of their own.
2. **Ticket writes are lost silently** — the board is a side-record, so `REFUSED=board-not-configured` never surfaces as a failure.
3. **Shipped texts send users to a person** — `backlog-commit.cjs`, `backlog-cli.cjs`, `add--backlog`, `add-setup` and the board app all say "ask the framework maintainer".

## Proposal

Ship `framwork/.codeadd/scripts/board-init.cjs`, which acts on `board.resolve()`'s state exactly as intent D3 tabulates. Then call it from one CLI helper, which all four enable sites route through, in project scope only and only when `.codeadd/board.json` is absent. `/add-setup` offers `board` like any item and reads the helper's result line. Every maintainer text is replaced by the board-init / README pointer. The script lands first because everything else names it or reads its output.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/board-init.cjs` (create) and `scripts/tests/board-init.test.cjs` (create; the native suite travels with the shipped script, so it is built under the product rules like its siblings). **RED first:** write the test file with the cases below, using the fixture style of `scripts/tests/migrate-board.test.cjs` (temp bare remote, temp project, temp `CODEADD_BOARD_DIR`), and observe every case fail because the script does not exist. **Then GREEN:** implement per intent D2–D9:
  - The header documents usage, the output keys and the exit codes, like every sibling script.
  - Not a git repository: `ERROR=not-a-git-repository`, exit 2. An unknown argument: exit 2.
  - `ready`: `BOARD=ready`, exit 0, no write of any kind.
  - `none`: discover the base branch with `discoverBase`, re-implemented (intent D13 accepts the duplication; the order is origin/HEAD, then main, then master). Then write the config, build and push the orphan root, resolve/clone, and stage. No `origin` gives `ERROR=no-remote`, nothing written. No base branch gives `ERROR=no-base-branch`, nothing pushed. A clone failure removes the config this run wrote and prints `ERROR=board-unavailable`.
  - `branch-missing`: the same base check, then create the branch on the remote named in the existing config, without rewriting the config, then clone, then stage board.json and print `CODE_CHANGES=staged` exactly as in `none` (intent D8: the code-side stage always runs).
  - `migration-required`: `ERROR=board-migration-required` plus the README Board pointer `https://github.com/brabos-ai/code-addiction#board`. `checkout-missing`: `ERROR=board-unavailable`.
  - Root commit message `Create the board`, trailers `Migrated-From: <origin/<base> sha>`, `Backlog-Blob: none`, `Definitions-Blob: none`. Contents: an empty `docs/backlog.jsonl` and no definitions file. A rejected push is treated as present and reported `BOARD_BRANCH_CREATED=raced`.
  - `git check-ignore` still ignoring the file prints `IGNORE_WARNING=board-json-ignored` and `IGNORE_RULE=<rule>`.
  - Exit codes are decided here, where intent D9 left them to state: `no-remote`, `no-base-branch`, `board-migration-required` and `board-unavailable` exit 1 (the environment is wrong, not the call). Exit 2 is reserved for `not-a-git-repository` and a bad argument, per D3 and D9.
  - Test cases (intent D14), each asserting the END state, not merely the exit code:
    1. `none` gives `BOARD=created`. `origin/board` exists, and its root commit carries all three trailers, `Migrated-From` naming the remote base sha. board.json is `{remote, branch:"board"}` and staged. `git log` on the code branch is unchanged. The code remote's refs other than `board` are unchanged.
    2. A second run gives `BOARD=ready`. The `board` sha on the remote is identical, and the project tree and index are byte-identical.
    3. `branch-missing`: board.json is pre-written, and the branch is created from it. board.json bytes are unchanged, the file is staged, and `CODE_CHANGES=staged` is printed.
    4. No `origin` gives `ERROR=no-remote` with exit 1. No board.json exists and nothing is staged.
    5. An empty remote gives `ERROR=no-base-branch` with exit 1. The remote has zero refs afterwards.
    6. `docs/backlog.jsonl` in the checkout gives `ERROR=board-migration-required`. Nothing is written or pushed.
    7. Not a git repository gives `ERROR=not-a-git-repository` with exit 2.
    8. After case 1, `backlog-commit.cjs add` with a record file writes a ticket that is readable through `backlog-cli.cjs get`. This is the acceptance link to the ticket's `done_when`.
  - It must NOT lose: `migrate-board.cjs` recognises a board-init root (the trailers exist for that reason, intent D6). Case 1 asserts the trailer text exactly.
  - **Produces:** `board-init.cjs` emits `BOARD=created|ready` or `ERROR=<reason>`, exit 0 / 1 / 2
- **F2** [internal] — `AGENTS.md`: regenerate the inventory block with `node scripts/inventory.js`; never hand-edit it. **RED:** after F1, the existing test `the generated inventory block was not hand-edited (it is current)` in `cli/tests/agent-mode-feature.test.js` fails because `board-init.cjs` is on disk and not in the `"scripts"` array. **GREEN:** run the generator; the array gains `board-init.cjs` and nothing else changes.
- **F3** [product] — `framwork/.codeadd/scripts/backlog-commit.cjs` and `framwork/.codeadd/scripts/backlog-cli.cjs`: replace the maintainer texts per intent D12. **RED first:** in `scripts/tests/backlog-commit.test.cjs` and `scripts/tests/backlog.test.cjs`, assert that a `branch-missing` project's output contains "Run `node .codeadd/scripts/board-init.cjs` (or /add-setup) to create it." Assert that `migration-required` points at `https://github.com/brabos-ai/code-addiction#board`. Assert that `none` on a write (`backlog-commit.cjs` only) carries the same board-init hint after "This project has no board". Assert that no output contains `framework maintainer`. **GREEN:** edit the strings anchored by `Ask the framework maintainer to migrate this project to the board branch.` (two occurrences per file, one per state) and by `This project has no board: there is no .codeadd/board.json and no docs/backlog.jsonl.` in `backlog-commit.cjs`. `REFUSED=` / `ERROR=` keys and exit codes stay unchanged; the `none` read path in `backlog-cli.cjs` (`BACKLOG_PRESENT=no`) stays silent.
  - **Consumes:** `board-init.cjs` emits `BOARD=created|ready` or `ERROR=<reason>`, exit 0 / 1 / 2 (F1) — the hint names the script F1 ships
- **F4** [product] — the CLI enable (intent D10). Create `cli/src/board-init.js` exporting one helper (for example `initBoardOnEnable(cwd, { scope, exec })`). Wire it at the four enable sites:
  - `cli/src/features.js`, the non-interactive branch anchored by `const { modified } = enableFeature(cwd, canonical);`
  - `cli/src/features.js`, the interactive menu branch anchored by `const { modified } = enableFeature(cwd, name);`
  - `cli/src/modify.js`, the loop anchored by `for (const name of diff.features.enable) {`
  - `cli/src/installer.js`, after the block anchored by `const featuresApplied = applyEnabledFeatures(targetDir);`, when the installed feature set has `board` on

  **Scope source:** `modify.js` and `installer.js` pass their local `scope`. The two `features.js` sites have none in hand (`features()` starts with `void scope;`), so the helper resolves it itself as `readManifest(cwd)?.scope ?? 'project'` (`readManifest` from `cli/src/injection-core.js`) when no scope is passed. **Test seam:** a module-level `setBoardInitExec(fn)` in `cli/src/board-init.js`, reset in `afterEach`. No exported signature of `enableFeature`, `features`, `modify` or `install` changes.

  The helper does nothing unless the feature being enabled is `board`, the scope is `project`, and `.codeadd/board.json` is absent. Otherwise it spawns `node .codeadd/scripts/board-init.cjs` with the project as cwd, through an injectable `exec`, in the same pattern as `syncBoardDefinitions` in `cli/src/migrations.js`. On exit 0 it logs the script's `BOARD=` line and the "commit .codeadd/board.json" line (the one-line rule below binds failures only). A missing script, a spawn error, a non-zero exit or any `ERROR=` gives ONE warning line that carries the `ERROR=` value when present and the command to run later (`node .codeadd/scripts/board-init.cjs`). The enable result is unchanged, and the process never exits non-zero because of it. Also rewrite the comment anchored by `// OFF by default because there is nothing to preserve: no project uses the` so it says the enable creates the board.

  **RED first** in `cli/tests/board-feature.test.js`, using an injected exec:
  1. The helper spawns once with the project cwd when board.json is absent.
  2. It does not spawn when board.json exists.
  3. It does not spawn in global scope.
  4. It does not spawn for any other feature name.
  5. An `ERROR=no-remote` result, a non-zero exit and a thrown spawn error each yield exactly one warning, and the enable still returns success.
  6. Each of the four entry points reaches the helper, observed through `setBoardInitExec`. The `features enable board` route on a manifest with `scope: global` does not spawn.
  7. One real-spawn case: a temp project with `framwork/.codeadd/scripts/*.cjs` copied into `.codeadd/scripts/`, a temp bare remote with main pushed and a temp `CODEADD_BOARD_DIR`. It shows the helper leaves `origin/board`, the clone and board.json staged.
  - It must NOT lose: `enableFeature`'s own contract (the flag plus the slot reconcile) and its return value. The existing `cli/tests/features.test.js` and `board-feature.test.js` cases stay green.
  - **Consumes:** `board-init.cjs` emits `BOARD=created|ready` or `ERROR=<reason>`, exit 0 / 1 / 2 (F1)
  - **Produces:** the CLI enable logs a `BOARD=<value>` line on success or a warning line carrying `ERROR=<value>` on failure
- **F5** [product] — `framwork/.codeadd/commands/add-setup.md` and `framwork/.codeadd/skills/add--settings/SKILL.md` (intent D11). **RED first** in `cli/tests/add-setup.test.js`:
  - Replace the assertion matching `` `board` recorded `unavailable` counts as **drift** once `.codeadd/board.json` exists `` with assertions of the new state. The `board` Recommendations row recommends yes when `agent-mode` is accepted or on, and shows the reason "creates the board branch on origin; needs origin with the main branch pushed". The command reads `BOARD=` or `ERROR=` from the `codeadd modify` output and records `enabled`, or `failed` with the reason. A recorded `unavailable` is treated as new. `add-setup.md` contains neither `unavailable` nor `framework maintainer`.
  - The test named `asks tdd-pipeline on a first run, re-offers a stale QA setup and a board that became available` is renamed to drop the board clause. That commit carries a `Test-Removed:` trailer naming the old title, because `scripts/test-loss-guard.cjs` fails otherwise.
  - In `add--settings`, assert that the `offered` vocabulary still names `unavailable`, as a legacy value that is read and never written. The existing `L1.1 names the setup-shape, the offered vocabulary and the log` keeps passing. Assert also that the worked example no longer shows `"board": "unavailable"`.

  **GREEN:**
  - In `add-setup.md`, edit the sentence anchored by `` `board` recorded `unavailable` counts as **drift** once `.codeadd/board.json` exists `` (and the "unavailable now" note that follows it). Replace the Recommendations row anchored by ``| `board` | yes only when `.codeadd/board.json` exists.`` Drop `unavailable` from the `## Setup answers` line anchored by `one line per item (accepted, declined, unavailable, already on)`. In STEP add-setup.execute, add a sentence after the `features list` check: read `BOARD=` / `ERROR=` for board. When `modify` printed neither (the helper skipped), record `enabled` if `.codeadd/board.json` exists, otherwise `failed` with the reason `no result`. The F5 RED test asserts this rule too.
  - In `add--settings`, change the example anchored by `"board": "unavailable"` to `"board": "declined"`. Reword the `unavailable` clause in the row anchored by `` `setup.offered.<item>` `` to "legacy, no longer written; an item recorded `unavailable` is offered again as new".
  - Rationale, decided here: removing the value from the schema outright would leave existing `settings.json` files holding a value the schema no longer names.
  - **Consumes:** the CLI enable logs a `BOARD=<value>` line on success or a warning line carrying `ERROR=<value>` on failure (F4)
- **F6** [product] — the remaining shipped texts (intent D12, D15). **RED first:** add one guard test to `cli/tests/board-feature.test.js`. It scans every file under `framwork/.codeadd/` (commands, skills, agents, scripts, fragments, agent-mode), `cli/src/` and `board/src/`, and asserts that none contains `framework maintainer`. It fails today on `add--backlog/SKILL.md` and `board/src/components/states.tsx`; F3 and F5 already cleared the others. Add assertions too:
  - `add--backlog`'s board-states table names `board-init.cjs` in the `branch-missing` row and in the no-board row's "Say" cell, and its `<!-- uses: -->` block lists `- script: board-init.cjs`.
  - `add--ecosystem`'s script table has a `board-init.cjs` row.
  - `agent-mode/board-management.md` section 1 says how the board is created.

  **GREEN:**
  - `framwork/.codeadd/skills/add--backlog/SKILL.md`: the row anchored by `` | `ERROR=board-migration-required` | `` gets the README Board pointer. The `branch-missing` and no-board rows get the board-init hint. The `uses:` block gains the script.
  - `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: add a script-table row after the row anchored by `| backlog-git.cjs |`, and a `- mention: board-init.cjs` next to `- mention: backlog-board.cjs`.
  - `framwork/.codeadd/agent-mode/board-management.md`: one line in section 1, after the bullet anchored by `` - `.codeadd/board.json` (`{remote, branch}`) is the only board file ``.
  - `board/src/components/states.tsx`: the bodies anchored by `Ask the framework maintainer to migrate it to the board branch.` and `Ask the framework maintainer to migrate the project.` get the README Board pointer and the board-init command respectively.
  - It must NOT lose: the state keys and titles in `states.tsx`. The board app's existing unit tests stay green (`node scripts/run-tests.js board`).
  - **Consumes:** `board-init.cjs` emits `BOARD=created|ready` or `ERROR=<reason>`, exit 0 / 1 / 2 (F1)
- **F7** [internal] — `README.md` and `CHANGELOG.md` (intent D15). In README `## Board`, add a "New project" paragraph after the line anchored by `npx codeadd features enable board` and its code fence. It says that enabling, or accepting `board` in `/add-setup`, creates the board; that the project needs an `origin` with its main branch pushed; and that you then commit `.codeadd/board.json`. The paragraph anchored by `**Migrate a project that still keeps` stays. In `CHANGELOG.md`, add an `### Added` entry under `## [Unreleased]`. This is documentation, not behaviour, so it has no RED test. Its validation is L3.3.

### Does NOT Include (important!)

- Any change to `scripts/migrations/migrate-board.cjs` or a module shared with it (intent D13: a `NEEDED` change would break 1.5–1.7 installs)
- Running board-init on `codeadd update` / `migrate`. Only the explicit enable is the consent (intent D10)
- Committing or pushing the code repository, or editing `.gitignore`
- `workbench/commands/add-framework--backlog.md`, `workbench/skills/add-plan-authoring/SKILL.md` (they name no maintainer, intent D12) and `web/` (it only lists the feature, intent D15)
- Distribution of the board app (subtopic 004)
- Any deploy, rollout, publish or release step

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Script behaviour per resolver state | As tabulated | intent D3 |
| Base branch and greenfield order | origin/HEAD → main → master; none → `no-base-branch`, nothing pushed | intent D5 — an empty GitHub repo makes the first pushed branch its default |
| Root commit trailers | `Migrated-From`, `Backlog-Blob: none`, `Definitions-Blob: none` | intent D6 — keeps migrate-board recognising it |
| CLI pushes `board` automatically | Yes, project scope, board.json absent, failure = one warning | intent D10, confirmed by Maicon 2026-10-25 12:15 BRT |
| Exit codes for environment refusals | 1; exit 2 only for not-a-git-repository and bad arguments | Decided in planning: D9 defines 2 as caller error, and a missing origin is the environment |
| Does `install` route through the helper | Yes, when the installed set has `board` on and scope is project | Decided in planning: D10 names `install --enable-feature board`, and install enables through `applyEnabledFeatures`, not `enableFeature` |
| `unavailable` in the `add--settings` schema | Kept as a legacy value, never written | Decided in planning: existing records hold it; D11 says it is read as new |
| Script's graph consumer | `add--backlog` declares `- script: board-init.cjs`, and the ecosystem lists it | Decided in planning: it is the skill whose texts tell users to run it; without it the node is an orphan |
| Inventory regeneration placement | F2, right after F1 | The existing inventory-currency test goes RED the moment F1 adds a script |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/board-init.cjs` | product | create | F1 |
| `scripts/tests/board-init.test.cjs` | product | create | F1 RED |
| `AGENTS.md` | internal | modify (generated block) | F2 |
| `framwork/.codeadd/scripts/backlog-commit.cjs` | product | modify | F3 |
| `framwork/.codeadd/scripts/backlog-cli.cjs` | product | modify | F3 |
| `scripts/tests/backlog-commit.test.cjs` | product | modify | F3 RED |
| `scripts/tests/backlog.test.cjs` | product | modify | F3 RED |
| `cli/src/board-init.js` | product | create | F4 |
| `cli/src/features.js` | product | modify | F4 (two sites + comment) |
| `cli/src/modify.js` | product | modify | F4 |
| `cli/src/installer.js` | product | modify | F4 |
| `cli/tests/board-feature.test.js` | product | modify | F4 RED, F6 RED |
| `framwork/.codeadd/commands/add-setup.md` | product | modify | F5 |
| `framwork/.codeadd/skills/add--settings/SKILL.md` | product | modify | F5 |
| `cli/tests/add-setup.test.js` | product | modify | F5 RED |
| `framwork/.codeadd/skills/add--backlog/SKILL.md` | product | modify | F6 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F6 |
| `framwork/.codeadd/agent-mode/board-management.md` | product | modify | F6 |
| `board/src/components/states.tsx` | product | modify | F6 |
| `README.md` | internal | modify | F7 |
| `CHANGELOG.md` | internal | modify | F7 |

**Graph (STEP 3.2, depth 1):**

| Artefact | Direct callers | Risk |
|---|---|---|
| `board-init.cjs` | none (new) | LOW |
| `backlog-commit.cjs` | 4 (fragment `board/add-new.md`, `add--backlog`, `add--id-convention`, `add--resource-path-convention`) | HIGH — mitigated: message text only, keys and exits pinned by F3 tests |
| `backlog-cli.cjs` | 2 | MEDIUM |
| `add--backlog` | 6 (all six `fragments/board/*`) | HIGH — mitigated: one table and the `uses:` block, F6 guard |
| `add--settings` | 5 | HIGH — mitigated: the vocabulary word is kept; F5 asserts `L1.1` still holds |
| `add--ecosystem` | 7 | HIGH — mitigated: one row added, nothing changed |
| `add-setup` | 2 (`add-help`, `add--settings`) | MEDIUM |
| `feature board` | 0 | LOW |
| `cli/src/*`, `board/src/*`, tests, `README.md`, `CHANGELOG.md` | not graph nodes | NOT VERIFIED by graph — covered by grep in this analysis and by L2 |
| `AGENTS.md` | not a node — changed (generated block only) | — |

**Delivery index (STEP 3.3):** for the product layer, `backlog-commit.cjs` has one `superseded` entry (native-node-backlog, replaced by native-node-framework-scripts). It is a shell-to-native migration, not a creation route that was dropped. `board-init` has never shipped. `add-setup` has no recorded delivery under that node.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Each F-block's tests are written and observed failing before its implementation lands, inside that same F-block.

### L1 — Script suite (`npm run test:scripts`) (RED → GREEN)

1. The eight `board-init.test.cjs` cases of F1. *RED today: the script does not exist.*
2. The F3 message assertions in `backlog-commit.test.cjs` and `backlog.test.cjs`. *RED today: the outputs say "Ask the framework maintainer".*
3. `migrate-board.test.cjs` stays green, untouched.

### L2 — CLI suite (`npm run test:cli`) (RED → GREEN)

1. The inventory-currency test after F1, until F2 runs. *RED: `board-init.cjs` is missing from the inventory.*
2. The F4 helper and entry-point cases, plus the real-spawn case. *RED today: no helper exists.*
3. The F5 `add-setup.test.js` assertions. *RED today: `add-setup.md` still holds the `unavailable` drift and the maintainer reason.*
4. The F6 maintainer guard and the registration assertions. *RED today: `add--backlog` and `states.tsx` name the maintainer, and nothing names `board-init.cjs`.*
5. `features.test.js` and `agents-md-only.test.js` stay green.

### L3 — Build and static

1. `node scripts/build.js` exits 0 with no new warning. The cross-layer and shipped-source gates admit `board-init.cjs` by the built-ins-only rule, not by an allowlist entry.
2. `node scripts/graph.js impact board-init.cjs --depth 1` lists `add--backlog`. `orphans` does not list `board-init.cjs`.
3. `README.md` has the "New project" paragraph and keeps the migration paragraph. `CHANGELOG.md` `[Unreleased]` has an `### Added` line. Checked by reading both.
4. `node scripts/run-tests.js board` (board app unit) stays green after F6.

### L4 — Behavioural acceptance

1. F1 case 8 plus F4 case 7 together prove the ticket's `done_when` on a temp project. The enable route creates `origin/board`, the clone and staged board.json with no code commit, and `backlog-commit.cjs add` then writes a ticket.
2. F1 case 2 proves a re-run is a no-op (`BOARD=ready`, the remote sha is unchanged).
3. F1 cases 4 and 5 plus F4 case 5 prove that no origin, or an empty remote, pushes nothing and the enable still succeeds with one warning.
4. The F6 guard proves that no shipped text says "framework maintainer".

**RED expectations against the current tree:** L1.1, L1.2, L2.2, L2.3 and L2.4 fail today. L2.1 fails between F1 and F2.
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

1. **F1** [product] — the script. Everything else names it or reads its output.
2. **F2** [internal] — inventory. F1 turns the inventory test red.
3. **F3** [product] — script messages. They name F1's script.
4. **F4** [product] — the CLI helper. It consumes F1's output keys.
5. **F5** [product] — `/add-setup` and `add--settings`. They consume F4's log line.
6. **F6** [product] — the remaining texts and the maintainer guard. It is last among the product blocks, so the guard is RED on only the two files F6 itself fixes.
7. **F7** [internal] — README and CHANGELOG. They describe what F1–F6 made true.

Every boundary from F2 onward leaves both suites green. F1 alone leaves L2.1 red by design; F2 follows in the same session. A build that must stop stops after F2, F4 or F6.

Beyond the layer defaults, F1, F3 and F4 run `npm run test:scripts` and `npm run test:cli` in full, because both suites read the shipped scripts. Run them in the container, per project memory.

## Reviewer Handoff

For each F-block the build must leave, in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state, with the RED run's failing output quoted.
- **Any decision deferred or altered**: any departure from the F4 seam (`setBoardInitExec`), and anything that departs from intent D3–D12.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. A test in F1 or F4 that touches the real `~/.codeadd/` or the repository checkout (no `CODEADD_BOARD_DIR`, or a project path inside the repo).
3. A board-init path that commits or pushes anything other than the `board` ref. Case 1 must assert the remote's other refs are unchanged.
4. An F4 failure path that makes the CLI exit non-zero, or that prints more than one line.
5. The `install` site wired so it also fires on `update`.
6. The F5 test rename shipped without its `Test-Removed:` trailer.

## Next Steps

/add-framework--build docs/plans/2026-10-25T211804-PLAN--board-init.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-25 | Initial creation |
| 2026-10-25 | Review fix-then-ok applied: F4 scope source and `setBoardInitExec` seam fixed, global-scope route test added; F5 no-result recording rule; F1 `branch-missing` stages board.json; F1 suite layer clause; F4 one-line rule scoped to failures |
| 2026-10-25 | Implemented in the 0070B build; commits on feat/0070b-board-init |

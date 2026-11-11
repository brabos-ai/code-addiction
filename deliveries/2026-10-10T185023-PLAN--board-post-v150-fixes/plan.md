# Plan: Board post-v1.5.0 fixes — standalone migration, release modes in the write entry, board docs, `--help` per subcommand

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-10
> **Delivery:** confirm
> **Ticket:** 0043B

---

## Objective

[from conversation, no design document] O `migrate-board.cjs` roda baixado sozinho num projeto com codeadd 1.5+
e deixa `.codeadd/board.json` rastreável qualquer que seja a forma do ignore de `.codeadd`; os scripts ganham um
jeito suportado de fechar os tickets em `awaiting-release` com a versão e de ligar o `release_flow`, com doc e
skill `add--backlog` concordando; há instrução de como subir a tela do board; `codeadd update --help` mostra a ajuda.

**When this build is done:** a person migrates a project with one downloaded file and the project's own installed
scripts; a release (product user or this repository) closes every waiting ticket with one write call; turning the
release step on is one write call instead of a hand edit; the README says how to do all three and how to open the
board today; and no CLI subcommand runs when asked for its help.

**Ticket done when:** O migrate-board.cjs roda baixado sozinho num projeto com codeadd 1.5+ instalado e o comando esta documentado; existe um jeito suportado pelos scripts de fechar tickets awaiting-release com a versao e de ligar release_flow, e a doc e a skill add--backlog concordam; ha instrucao de como subir a tela do board (ou decisao registrada); codeadd update --help mostra a ajuda; build e testes passam.

## Context

Ticket 0043B, from the migration of the internal projects and the review of the v1.5.0 guide. The My Shopify
migration only worked by running the script from a code-addiction clone with the target repository as cwd,
although the target already had `.codeadd/scripts/` installed at 1.5.0. The Organize My Finances migration left
`.codeadd/board.json` ignored: that project already ignored `.codeadd/*`, the script only rewrites the
`.codeadd/` and `/.codeadd/` forms, and the engineer added `!.codeadd/board.json` by hand.

No design document and no intent file. The decisions were taken at this plan's STEP 4 (all five recommended
options, plus the `.gitignore` finding added by the user) and are recorded under Validated Decisions.

Prior art: `2026-10-10T110912-PLAN--board-outside-code-branches` (created `migrate-board.cjs`, internal, never
shipped) and `2026-10-10T152531-PLAN--board-awaiting-release-and-agent-mode-examples` (created
`awaiting-release`, `release` and `release_flow`, and deliberately left the product closer and the opt-in
mechanism out — items 2 and 3 here).

## Global Constraints

- A shipped `framwork/.codeadd/scripts/*.cjs` requires only a `node:` built-in or a `./sibling.cjs` (`NATIVE_BUILTIN_RE` / `NATIVE_SIBLING_RE` in `scripts/build.js`)
- `backlog-commit.cjs` is the ONE write route; `backlog-cli.cjs` refuses every write mode with `ERROR=write-mode` (header of `backlog-cli.cjs`)
- `migrate-board.cjs` stays internal: not under `framwork/`, not in the npm package, the release ZIP, `provider-map.json` or the inventory (AGENTS.md, Key files → `scripts/migrations/`)
- The migration never commits or pushes the code repository: `CODE_CHANGES=staged` (header of `migrate-board.cjs`)
- Never write a raw `.codeadd/` path in a command or skill; scripts are the exception, always `.codeadd/scripts/` (AGENTS.md, Pipeline)
- Tests run through `scripts/run-tests.js` in the container, never `npx vitest` in `cli/` (memory: testes no container; AGENTS.md key files)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **The migration needs a clone** — `migrate-board.cjs:75-78` requires `backlog-board.cjs` and `backlog-git.cjs`
   from `<clone>/framwork/.codeadd/scripts/`; downloaded alone it dies with `MODULE_NOT_FOUND`.
2. **`board.json` can stay ignored** — `rewriteIgnore` handles `.codeadd/` and `/.codeadd/` only. A `.codeadd/*`
   (or `.codeadd`, `/.codeadd/*`, `.codeadd/**`) line without the negation is left as is, and the `git add -f`
   hides the problem until the next edit of the config.
3. **Nothing in the product closes `awaiting-release`** — only the internal `add-framework--release` does, with a
   per-ticket loop. A product user with `release_flow: true` sees tickets wait forever.
4. **Turning `release_flow` on means a hand edit the skill forbids** — `doc-schemas/references/backlog.md` and
   `phases.md` tell the user to edit `backlog.definitions.json`; `add--backlog` says the board is written only
   through the two entries.
5. **No instruction to open the board, and a false claim** — `release.yml` publishes no board asset, yet
   `web/src/pages/docs.astro:854` and the `features.js` comment say the app "ships as a separate release asset".
6. **`codeadd update --help` runs the update** — `cli/src/cli.js` honours `--help` only as the first argument.

## Proposal

Two new write modes in the publication entry — `release <version>` and `release-flow on|off` — as two new domain
operations in the core, parsed by the shared grammar and refused by the read entry like every write. The internal
release switches its loop to the new mode. The migration resolves its two modules from the target project first
and guarantees the ignore pair. The CLI answers `--help`/`-h` after any subcommand. The README gets a `## Board`
section that documents the migration, the two modes and how to open the board today, and the product skills stop
telling the user to hand-edit the definitions.

## Scope

### Includes

#### T1 — Release modes in the scripts

- **F1** [product] — `framwork/.codeadd/scripts/backlog-core.cjs`: two operations in `executeBacklog`.
  `release` (takes `version`): every ticket whose `status` is `awaiting-release` gets `release` = the version and
  `status` = `done` (and `updated_at`), in one file write; returns the ids changed, in board order; zero matches
  is a result, not a refusal. `release-flow` (takes `on`|`off`): `on` sets `release_flow: true` and, when the
  definitions file lacks them, appends the `awaiting-release` status and the `release` column with the seeded
  values (`DEFAULT_DEFS`); `off` sets `release_flow: false` and removes nothing. An absent definitions file is
  seeded first. A definitions file the core cannot parse is refused (`REFUSED=definitions-unreadable`), never
  overwritten. Refusals: `REFUSED=bad-version` (empty or containing whitespace), `REFUSED=bad-flag`.
  Must NOT lose: the existing modes' behaviour, the definitions file's other keys and their order, a status the
  user renamed (the check is by name: the status is added only when no status is named `awaiting-release`).
  - **Produces:** core modes `release` and `release-flow`; result field `ticketIds` (array) for `release`; result field `releaseFlow` (`on`|`off`) for `release-flow`
- **F2** [product] — `framwork/.codeadd/scripts/backlog-cli.cjs`: `parseInvocation` accepts `release <version>`
  and `release-flow on|off` (positional, no record); `WRITE_MODES` gains both, so the read entry refuses them with
  `ERROR=write-mode`; `USAGE` and the header list them. Must NOT lose: the rule that an option-looking target is
  never read as a flag.
  - **Consumes:** core modes `release` and `release-flow` (F1)
  - **Produces:** parsed invocation `{ mode: 'release', version }` / `{ mode: 'release-flow', flag }`
- **F3** [product] — `framwork/.codeadd/scripts/backlog-commit.cjs`: runs the two modes through the same route
  (lock, level, operation, commit, protect, push). Report: `TICKETS_RELEASED=<comma ids>` (empty when none) for
  `release`, `RELEASE_FLOW=yes|no` for `release-flow`, in place of `TICKET_ID`; commit messages
  `backlog: release <version> (<n> tickets)` and `backlog: release-flow on|off`. Nothing changed (no waiting
  ticket; flag already in that state) → `COMMITTED=no`, exit 0, no push. `USAGE` and header updated. Must NOT
  lose: any existing report key, exit code or degradation for the five ticket modes.
  - **Consumes:** parsed invocation `{ mode: 'release', version }` / `{ mode: 'release-flow', flag }` (F2); result field `ticketIds` (array) for `release`; result field `releaseFlow` (`on`|`off`) for `release-flow` (F1)
  - **Produces:** `backlog-commit.cjs release <version>` reporting `TICKETS_RELEASED=`; `backlog-commit.cjs release-flow on|off` reporting `RELEASE_FLOW=`
- **F4** [product] — native tests in `scripts/tests/backlog.test.cjs` (core) and
  `scripts/tests/backlog-commit.test.cjs` (route), plus `cli/tests/backlog-cli.test.js` for the refusal — cases
  L1.1–L1.5 and L2.2–L2.3. Written RED before F1–F3. Tagged [product] on purpose: the `scripts/tests/*.test.cjs`
  files are the native suites of the product scripts they test, and they change with them.

#### T2 — Standalone migration

- **F5** [internal] — `scripts/migrations/migrate-board.cjs`, module resolution: look for `backlog-board.cjs` and
  `backlog-git.cjs` first in `<code root>/.codeadd/scripts/` (code root from `git rev-parse --show-toplevel` of
  the cwd, since the board module is not loaded yet), then in `<this repository>/framwork/.codeadd/scripts/`.
  Neither → `ERROR=board-modules-missing`, exit 1, with a line saying codeadd 1.5.0 or later must be installed
  (`npx codeadd update`). After loading, check that every function and constant the script uses exists; a
  missing one → the same error naming it, before any change. Print `MODULES=<dir>` with the directory used.
  Header: usage becomes "download this one file, run it from the project root"; the dependency line names the
  resolution order. Must NOT lose: any step, key or exit code of the current script.
  - **Produces:** `migrate-board.cjs` prints `MODULES=<dir>`; `ERROR=board-modules-missing`
- **F6** [internal] — `scripts/migrations/migrate-board.cjs`, `rewriteIgnore`: guarantee `.codeadd/board.json`
  is not ignored. A directory form (`.codeadd`, `.codeadd/`, `/.codeadd`, `/.codeadd/`) is replaced by the pair, literally
  `.codeadd/*` + `!.codeadd/board.json` — or `/.codeadd/*` + `!/.codeadd/board.json` when the original line
  started with `/`;
  a contents form (`.codeadd/*`, `/.codeadd/*`, `.codeadd/**`, `/.codeadd/**`) gets the matching negation
  (`!.codeadd/board.json` or `!/.codeadd/board.json`) inserted on the next line. A file already holding a
  negation is left alone. After writing, `git check-ignore -q .codeadd/board.json`; still ignored (a rule the
  script does not recognise, e.g. a nested `.gitignore` or `info/exclude`) → `IGNORE_WARNING=board-json-ignored`
  with the rule `git check-ignore -v` names, migration continues. Must NOT lose: test `migrate-board#003` (a file
  holding the pair is not touched or staged).
  - **Produces:** `IGNORE_WARNING=board-json-ignored`
- **F7** [internal] — `scripts/tests/migrate-board.test.cjs`: the cases in L1.6–L1.9 and L2.4 — the script
  copied ALONE into a temp dir and run with the target as cwd, the target holding `.codeadd/scripts/` copied from
  `framwork/.codeadd/scripts/`; the missing-modules error; each ignore form. Written RED before F5–F6.

#### T3 — CLI help

- **F8** [product] — `cli/src/cli.js`: after the `mcp` route and before `resolveTarget`, when `args` contains
  `--help` or `-h`, print `USAGE` and exit 0 — no subcommand runs. Must NOT lose: `mcp` keeps its own argument
  handling (it is routed first and untouched); the top-level `--help`/`-h` still exits 0; an unknown subcommand
  still exits 1; no subcommand reads `-h` or `--help` as an option value today (checked: the only `-h` in
  `cli/src/` is the top-level test at `cli.js:245`), so none is intercepted wrongly — `config show` included.
- **F9** [product] — new `cli/tests/cli-help.test.js`: spawns `cli/bin/codeadd.js` for `update --help`,
  `install -h`, `uninstall --help` in an empty temp dir; asserts exit 0, the usage text on stdout, and that the
  temp dir is still empty (nothing installed or removed). Written RED before F8.

#### T4 — Documentation and skills

- **F10** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md`: replace "A project opts
  in by adding the `release` column, the `awaiting-release` status and `"release_flow": true` to its own file"
  with the `release-flow on` write (which adds both when missing); replace "Nothing in the product closes
  `awaiting-release`" with the `release <version>` write; the `RELEASE_FLOW` row stays.
  - **Consumes:** `backlog-commit.cjs release <version>` reporting `TICKETS_RELEASED=`; `backlog-commit.cjs release-flow on|off` reporting `RELEASE_FLOW=` (F3)
- **F11** [product] — `framwork/.codeadd/skills/add--backlog/references/phases.md`: the `awaiting-release` row and
  "Existing projects are not migrated" paragraph say the same as F10 (who releases runs `release <version>`;
  opt-in is `release-flow on`). `framwork/.codeadd/skills/add--backlog/SKILL.md`: the write-entry table and the
  mode list carry both modes; the ⛔ "DO NOT Write docs/backlog.definitions.json" block points at `release-flow`
  as the way to change the flag. Check `references/lifecycle.md` for the same claims and align any found.
  - **Consumes:** `backlog-commit.cjs release <version>` reporting `TICKETS_RELEASED=`; `backlog-commit.cjs release-flow on|off` reporting `RELEASE_FLOW=` (F3)
- **F12** [product] — `framwork/.codeadd/agent-mode/README.md` §9: the `release` bullet says a release fills it
  with `backlog-commit.cjs release <version>`. Nothing else in the file changes.
  - **Consumes:** `backlog-commit.cjs release <version>` reporting `TICKETS_RELEASED=` (F3)
- **F13** [internal] — `README.md`: a new `## Board` section, after `## Plugins`, short: (1) enable the feature;
  (2) migrate an existing project — download `scripts/migrations/migrate-board.cjs` from the repository and run
  `node migrate-board.cjs` at the project root with codeadd 1.5+ installed, then commit the staged changes; what
  `ERROR=board-modules-missing` and `IGNORE_WARNING` mean; (3) `release-flow on` and `release <version>`;
  (4) open the board today: clone code-addiction, `npm run setup`, `node board/server.mjs --root <project>`,
  with the note that a packaged board is not distributed yet (subtopic 004).
  - **Consumes:** `backlog-commit.cjs release <version>` reporting `TICKETS_RELEASED=`; `backlog-commit.cjs release-flow on|off` reporting `RELEASE_FLOW=` (F3); `ERROR=board-modules-missing` (F5); `IGNORE_WARNING=board-json-ignored` (F6)
- **F14a** [internal] — `web/src/pages/docs.astro:854`: "(separate release asset)" becomes "(not distributed yet)".
- **F14b** [product] — `cli/src/features.js` board comment: "the board app ships as a separate release asset" becomes
  "the board app is not distributed yet (subtopic 004)". Comment and label text only.

#### T5 — Internal release uses the mode

- **F15** [internal] — `workbench/commands/add-framework--release.md`, "Close the waiting tickets": the
  list-then-loop becomes one call `node framwork/.codeadd/scripts/backlog-commit.cjs release <NEXT_VERSION>`;
  report `TICKETS_RELEASED` in STEP 8. Keep: stable only, after the tag push, failures/refusals/degradations
  reported and never stop the release, nothing closed but `awaiting-release`. The scratch-file recipe goes away.
  Update the `add-framework--release` row in `workbench/skills/add-plan-authoring/SKILL.md` (The Ticket table)
  to say "one `release <tag>` write" instead of "one write per ticket". Run `node scripts/build-workbench.js`.
  - **Consumes:** `backlog-commit.cjs release <version>` reporting `TICKETS_RELEASED=` (F3)

### Does NOT Include (important!)

- Distributing the board app (release asset, `asset` feature, download) — subtopic 004, its own plan.
- A product release command (`/add-release`) — a script mode is enough.
- Rewriting existing projects' definitions files on install or update — opt-in stays per project, now by one write.
- Removing the `awaiting-release` status or `release` column on `release-flow off`.
- Shipping `migrate-board.cjs` in the product.
- A stable-vs-beta rule in the product mode — the caller decides when to run it.
- Pushing the code branch or opening a PR (user instruction for this delivery).

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| How does the migration run alone? | Modules from `<project>/.codeadd/scripts/` first, clone path second, clear error when neither | STEP 4 q1 = a. Keeps the script internal; the target already has the modules since 1.5.0 |
| `.gitignore` when `.codeadd/*` is already ignored | Guarantee the negation (or the pair), verify with `git check-ignore`, warn when still ignored | User, STEP 4 answer (Organize My Finances finding) |
| Official way for items 2 and 3 | Two modes in `backlog-commit.cjs`: `release <version>` and `release-flow on\|off` | STEP 4 q2 = a. Specific names, the one write route, no free edit of the definitions |
| `release-flow off` | Flips the flag only | Derived: waiting tickets must stay valid; removing a status in use would orphan them |
| Version format | Taken as given; refused only when empty or with whitespace | Derived: product users tag differently; the internal release passes `NEXT_VERSION` with its `v` |
| Batch commit | `release` changes every waiting ticket in ONE commit | Derived: one release is one board event; N commits were an artefact of the loop |
| Internal release | Uses `release <NEXT_VERSION>` | STEP 4 q3 = a |
| Where to document | README `## Board` + aligned product skills + agent-mode §9 bullet | STEP 4 q4 = a |
| Board UI | Document the clone route, mark 004 out of scope, fix the two false claims | STEP 4 q5 = a |
| `--help` | `--help`/`-h` anywhere after a non-`mcp` subcommand prints usage, exit 0 | Ticket item 5; `mcp` owns its stdout |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A script downloaded from `main` expects a function an older installed `.codeadd/scripts` lacks | Medium | F5 checks every used export before any change; L1.7 |
| Batch mode breaks a report key the five ticket modes rely on | Low | F3 keeps their path untouched; L2.1 runs the existing `backlog-commit` suite unchanged |
| `release-flow on` clobbers a hand-tuned definitions file | Low | F1 appends only when the name is absent, keeps key order, refuses an unparseable file; L1.3–L1.4 |
| An ignore form the rewrite does not know | Medium | F6 `git check-ignore` + `IGNORE_WARNING`; L1.9 |
| Docs and skill drift apart again | Medium | F10/F11 change both in one delivery; L3.2 greps for the old claims |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/backlog-core.cjs` | product | modify | F1 (graph: 1 direct dependant, MEDIUM) |
| `framwork/.codeadd/scripts/backlog-cli.cjs` | product | modify | F2 (2, MEDIUM) |
| `framwork/.codeadd/scripts/backlog-commit.cjs` | product | modify | F3 (4, HIGH) |
| `scripts/tests/backlog.test.cjs`, `scripts/tests/backlog-commit.test.cjs`, `cli/tests/backlog-cli.test.js` | product | modify | F4 |
| `scripts/migrations/migrate-board.cjs` | internal | modify | F5, F6 (not a graph node; no callers) |
| `scripts/tests/migrate-board.test.cjs` | internal | modify | F7 |
| `cli/src/cli.js` | product | modify | F8 (not a graph node) |
| `cli/tests/cli-help.test.js` | product | create | F9 |
| `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md` | product | modify | F10 (skill: 22 dependants, HIGH — text only) |
| `framwork/.codeadd/skills/add--backlog/SKILL.md`, `references/phases.md`, `references/lifecycle.md` (if it carries the claims) | product | modify | F11 (6, HIGH — text only) |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F12 |
| `README.md` | internal | modify | F13 |
| `web/src/pages/docs.astro` | internal | modify | F14a |
| `cli/src/features.js` (comment) | product | modify | F14b |
| `workbench/commands/add-framework--release.md`, `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F15 (release: 1, MEDIUM) |
| `AGENTS.md` | — | unchanged | the `scripts/migrations/` row stays true |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write L1 and L2 before F1–F3, F5–F6 and F8, and verify each fails on the current tree.

### L1 — Unit / script (RED → GREEN)

1. Core `release v1.2.3` on a board with two `awaiting-release`, one `in-review`, one `done`: exactly the two get `release: "v1.2.3"` and `status: "done"`; the other two rows are byte-identical; `ticketIds` lists the two in board order. *RED: unknown mode.*
2. Core `release` with no waiting ticket: ok, `ticketIds` empty, file bytes unchanged. Empty version and `"v 1"` → `REFUSED=bad-version`.
3. Core `release-flow on` on a definitions file without `awaiting-release` and `release`: the status and column are added with the seeded values, `release_flow: true`, every other key and its order unchanged. On the seeded file: only the flag changes.
4. Core `release-flow on` on a file where `awaiting-release` exists (any order/column): not duplicated. Unparseable file → `REFUSED=definitions-unreadable`, bytes unchanged. `off`: flag false, statuses untouched. `maybe` → `REFUSED=bad-flag`.
5. `backlog-cli.cjs release v1` and `backlog-cli.cjs release-flow on` → `ERROR=write-mode`, exit 2. *RED: today they are bad-mode errors, not write-mode.*
6. `migrate-board.cjs` copied ALONE to a temp dir, run with cwd = a target whose `.codeadd/scripts/` holds the framework scripts: `MIGRATED=done`, `MODULES=<target>/.codeadd/scripts`. *RED: `MODULE_NOT_FOUND` today.*
7. Same, target with no `.codeadd/scripts/` → `ERROR=board-modules-missing`, exit 1, no file written, nothing staged; target whose `backlog-board.cjs` lacks one used export → same error naming it.
8. Ignore forms, one test each: `.codeadd/*`, `/.codeadd/*`, `.codeadd/**`, `.codeadd`, `/.codeadd` → after the run `git check-ignore -q .codeadd/board.json` exits 1 and `.gitignore` is staged. *RED: `.codeadd/*` today leaves it ignored (the Organize My Finances case).*
9. A target whose `.git/info/exclude` ignores `.codeadd/` → `IGNORE_WARNING=board-json-ignored`, `MIGRATED=done`.
10. `codeadd update --help`, `install -h`, `uninstall --help`: exit 0, usage on stdout, temp dir still empty. *RED: `update --help` runs the update today.*

### L2 — Integration (the write route against a bare remote)

1. Existing `backlog-commit.test.cjs` and `migrate-board.test.cjs` cases pass unchanged (`migrate-board#003` included).
2. `backlog-commit.cjs release v9.9.9` with two waiting tickets: `TICKETS_RELEASED=<a>,<b>`, `COMMITTED=yes`, `PUSHED=yes`, exactly ONE new commit on remote `board` whose message is `backlog: release v9.9.9 (2 tickets)`. Run again: `TICKETS_RELEASED=` empty, `COMMITTED=no`, no new commit.
3. `backlog-commit.cjs release-flow on`, then `backlog-cli.cjs list` prints `RELEASE_FLOW=yes`; `off` → `RELEASE_FLOW=no`; `on` twice → second is `COMMITTED=no`.
4. The standalone migration (L1.6) followed by `backlog-commit.cjs add` from the target writes to the new board branch.

### L3 — Build and text

1. `node scripts/build.js` exits 0 with no new warning; `node scripts/build-workbench.js` exits 0; `node scripts/run-tests.js` (container, framework default) green.
2. `grep` over `framwork/.codeadd/` finds neither "Nothing in the product closes" nor "opts in by adding" nor "ships no release command"; `grep` over `cli/src/features.js` and `web/src/pages/docs.astro` finds no "separate release asset".
3. `add-framework--release.md` names `backlog-commit.cjs release` and no longer carries the per-id loop or `docs/.tmp-ticket.json`.

### L4 — Behavioural acceptance

1. Following only the README `## Board` section in a throwaway project with codeadd installed (the L1.6 fixture is enough), the migration completes from one downloaded file.
2. `node board/server.mjs --root <the L2.4 target> --no-open` prints `BOARD_URL=` and `/api/board` answers with the board — proves the README step 4 instruction.

**RED expectations against the current tree:** L1.1–L1.10 fail (unknown modes, `MODULE_NOT_FOUND`, `.codeadd/*` left ignored, update runs); L2.2–L2.4 fail; L3.2–L3.3 fail.
**GREEN = all levels pass after F1–F15 (F14a and F14b included).**

---

## Execution Order

1. **F4, F7, F9** [product/internal] — the RED tests.
2. **F1 → F2 → F3** [product] — core, then grammar, then route. Working state after F3.
3. **F5 → F6** [internal] — migration. Independent of T1; working state after F6.
4. **F8** [product] — CLI help. Independent.
5. **F10 → F11 → F12** [product] — skills and agent-mode text, after F3 so they describe what exists.
6. **F13 → F14a → F14b** [internal, internal, product] — README and the two false claims.
7. **F15** [internal] — internal release, last: it consumes F3 and then rebuilds the workbench.

Every numbered boundary leaves the repository building and testing green.

Per-F-block validation beyond the layer default: after F3, run `scripts/tests/backlog-commit.test.cjs` alone to
attribute a failure (the cli suite rewrites sidecars while it runs — memory: suíte cli instável local).

## Reviewer Handoff

For each F-block the build must leave, in the ledger: files touched, the L-levels covering it with their pass
state, and any decision altered with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. `backlog-commit.cjs` reporting `TICKET_ID` (or omitting `ROUTE`/`BOARD_DIR`) on the new modes — the report order contract.
3. `release-flow on` re-ordering or rewriting keys of a definitions file it only needed to extend.
4. The migration loading modules from the clone while a target copy exists (`MODULES=` must name the target).
5. A raw `.codeadd/` path added to a skill instead of `.codeadd/scripts/` or a `{{skill:}}` reference.

## References

- Ticket 0043B (board branch)
- Prior art: `2026-10-10T110912-PLAN--board-outside-code-branches` (migration script), `2026-10-10T152531-PLAN--board-awaiting-release-and-agent-mode-examples` (release status and flag), `docs/brainstorming/2026-09-21T112103-backlog-board-004-board-distribution.md` (excluded subtopic)

---

## Next Steps

/add-framework--build docs/plans/2026-10-10T185023-PLAN--board-post-v150-fixes.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-10 | Initial creation |
| 2026-10-10 | Review fix-then-ok: F4/F7 name their exact L-cases; F14 split into F14a [internal] and F14b [product]; F4 tag explained; F6 states the pair literally; F8 records that no subcommand uses `-h` as a value |
| 2026-10-10 | Implemented on feat/board-post-v150-fixes; changelog 2026-10-10T223500-fix-board-post-v150-fixes.md |

# Board after v1.5.0: standalone migration, release modes, board docs, `--help` per subcommand

## Outcome

A person migrates a project with one downloaded file and the project's own `.codeadd/scripts/`. A release closes every waiting ticket with one write, and turning the release step on is one write. The README says how to do both and how to open the board today. No CLI subcommand runs when asked for its help. Ticket 0043B.

## Why

The My Shopify migration only ran from a code-addiction clone. The Organize My Finances migration left `.codeadd/board.json` ignored because that project ignored `.codeadd/*`. Nothing in the product closed `awaiting-release`, and the docs told users to hand-edit the definitions file, which the `add--backlog` skill forbids. `codeadd update --help` ran the update.

## Changes

- `backlog-core.cjs`, `backlog-cli.cjs`, `backlog-commit.cjs`: two new write modes. `release <version>` closes every `awaiting-release` ticket (`release` = version, `status` = `done`) in one commit and reports `TICKETS_RELEASED=`. `release-flow on|off` flips `release_flow`; `on` also adds the status and the column when missing, before `done`. Nothing changed means `COMMITTED=no` and no push. The read entry refuses both with `ERROR=write-mode`. New refusals: `bad-version`, `bad-flag`, `definitions-unreadable`.
- `migrate-board.cjs` (internal): takes `backlog-board.cjs` and `backlog-git.cjs` from the project's `.codeadd/scripts/` first, a clone second, and stops with `ERROR=board-modules-missing` before any change. Prints `MODULES=`. Every ignore form of `.codeadd` ends with `board.json` un-ignored; a rule it does not know prints `IGNORE_WARNING=board-json-ignored`.
- `cli.js`: `--help` / `-h` after any subcommand prints the usage and runs nothing.
- Docs: the `add--doc-schemas` backlog reference, `add--backlog` skill and phases, agent-mode §9, a new README `## Board` section. The false "separate release asset" claim is gone from `docs.astro`, `features.js` and `add--ecosystem`.
- `add-framework--release` (internal) closes the waiting tickets with one `release <tag>` write instead of a per-ticket loop.
- Tests: RED first for the core, the route, the migration and the CLI help; the release-command test now pins the new recipe.

## Validation

Full `npm test` run: every suite green except one pinned-text test of the old release recipe, which was updated and re-run green. `node scripts/build.js` exit 0 with no new warning, `node scripts/build-workbench.js` exit 0. The board server answered `/api/board` for this repository.

## Left for later

Distributing the board app (subtopic 004). `AGENTS.md` still says the board ships "as a separate release asset" in future tense.

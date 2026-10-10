# The board lives on its own branch, outside every code branch

## Outcome

Every project has one copy of its board on the machine, in a clone of an orphan `board` branch. Agents, scripts and the board UI all read and write that clone. A board write never lands on `main` and starts no code CI.

## Why

The board was a file in the code repository, so each branch and worktree carried a copy as old as the branch. That gave stale reads (`--ref origin/main` was the patch), a fragile worktree write route, and a `chore(backlog)` commit plus a full CI run on `main` for every write. Ticket 0041B.

## Changes

- `framwork/.codeadd/scripts/backlog-board.cjs` (new): the resolver (`CODEADD_BOARD_DIR`, then `.codeadd/board.json`), the project key, the clone on first use, the lock, the throttled read sync and the `changes` diff.
- `backlog-commit.cjs`: one write route (`ROUTE=board`, `BOARD_DIR`). The base-branch, direct and `.worktrees/backlog` routes and `BASE_BRANCH` are gone. `backlog-git.cjs` keeps only the clone-side primitives and the recovery refs, and bounds its network calls.
- `backlog-cli.cjs`: reads only. A write mode exits 2 with `ERROR=write-mode`. `--ref` is gone. New read: `changes [--since <sha>]`.
- `backlog-id.cjs`, `status.cjs`, `next-id.cjs`, `init.cjs`: ticket ids are counted in the board clone. `status.cjs` prints one `BOARD=` line and its exit code does not change.
- `board/server.mjs`: reads the clone, syncs every 60 s without waiting on the lock, answers `GET /api/changes?since=<sha>`. Still read-only.
- `cli/src/gitignore.js` and `.gitignore`: `.codeadd/*` plus `!.codeadd/board.json`. The installer no longer treats a `.codeadd/` holding only `board.json` as an install, and the uninstaller never walks into board clones.
- `scripts/migrations/migrate-board.cjs` (internal, never shipped): moves a project to the board branch. Idempotent, never commits the code repository, accepts `--reimport`. Run on this repository.
- `scripts/board-files-guard.cjs` and a `ci.yml` step: fail when `.codeadd/board.json` and a board file are both tracked.
- Docs follow the code: `add--backlog`, `add--id-convention`, `add--doc-schemas`, `add--ecosystem`, `add--resource-path-convention`, `fragments/board/add-new.md` and `add-plan.md`, `agent-mode/README.md` (how a bot mirrors the board), `add-plan-authoring`, `add-framework--backlog`, `AGENTS.md`, `README.md`.

## Validation

`node scripts/run-tests.js all` green: CLI suite, 753 native script cases, package smoke, 134 board cases and 163 end-to-end cases. `node scripts/build.js` clean, `inventory.js --check` current, `test-loss-guard.cjs` pass, `board-files-guard.cjs` pass. The migration ran on this repository: `origin/board` holds the board of `main` at 459ea04, and a second run reports `MIGRATED=already`.

## Left for later

Other projects migrate by hand with the internal script; `codeadd update` does not rewrite their `.gitignore`. Run the migration script once more right before the merge.

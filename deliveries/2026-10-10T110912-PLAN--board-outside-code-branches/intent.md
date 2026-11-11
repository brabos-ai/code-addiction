---
path: architectural
ticket: 0041B
topic: board-outside-code-branches
doc: docs/brainstorming/2026-10-09T165114-board-outside-code-branches.md
delivery: confirm
---
## Decided
1. The board lives on an orphan branch `board` in the project's own remote, holding `docs/backlog.jsonl` and `docs/backlog.definitions.json` in today's layout.
2. One clone per project at `<home>/.codeadd/<project-key>/board/`, cloned `--single-branch`; `CODEADD_BOARD_DIR` overrides the path.
3. One board module, `backlog-board.cjs`, owns the resolver, the clone, the lock, the sync and the `changes` diff, on top of the git primitives in `backlog-git.cjs`. The CLI, the publication entry, `status.cjs`, `next-id.cjs` and the server all call it.
4. The resolver finds the code repo with `git rev-parse --show-toplevel` and reads the committed config. The project key comes from the config's `remote`, never from `origin`, normalised (no scheme, no `user@`, SSH `host:path` → `host/path`, no `.git`, lowercase host). The clone is created on first use. There is NO fallback to the in-repo board: no config and no file → no board (reads silent, writes `REFUSED=board-not-configured`); no config but the file → `ERROR=board-migration-required`; no remote branch → `ERROR=board-branch-missing`; offline with no clone → `ERROR=board-checkout-missing`. Outside a git repo there is no config, so there is no board.
5. `status.cjs` never fails on board state — it has 20 direct callers. It prints one `BOARD=` signal line and carries on.
6. Config is `.codeadd/board.json` (`remote`, `branch`), committed. The ignore line becomes `/.codeadd/*` + `!/.codeadd/board.json` in this repo and `.codeadd/*` + `!.codeadd/board.json` in `cli/src/gitignore.js`; a `!` line cannot reach inside an excluded directory.
7. The new layout is the product default. There is ONE write route. The `.worktrees/backlog` route, the direct-on-base route, the isolated index, `BASE_BRANCH`, `--ref`/`materializeRef` and every degradation or refusal value only the old route produces are removed. `ROUTE` stays with the single value `board`, and `BOARD_DIR` is added. Tests that pin only removed behaviour go with a `Test-Removed:` trailer. The recovery-ref contract, `get-main-branch.cjs` and the `.worktrees/` ignore line are kept.
8. Writes take an exclusive lock at `<clone>/.git/codeadd-board.lock` (PID + timestamp; a dead or old lock is reclaimed and reported), fast-forward, run `executeBacklog`, commit and push `board`. A rejected push rebases once and retries, then degrades with a recovery ref.
9. Every write pushes. `PUSHED=no` is retried by the next write or the next read's sync.
10. Reads sync, then read. Sync is skipped when the last one is under 30 s old. It runs under the write lock: behind → fast-forward; ahead → push; diverged → rebase once and push. A failed sync answers from the clone with `SYNC=degraded` and the reason; a lock held by a writer gives `SYNC=skipped`. A read is never blocked by sync.
11. `calculate(root, letter, { boardRoot })`: `docs/features/` under the code root, ticket ids under `boardRoot` (default `root`). The `add` id is allocated inside the lock, after the fast-forward. `status.cjs` and `next-id.cjs` pass the board module's root.
12. A `changes [--since <sha>]` read in `backlog-cli.cjs` and `GET /api/changes?since=<sha>` in the server, both through the board module. They return the ids added, updated or removed up to the REMOTE tip `origin/<branch>`, `HEAD=<remote tip sha>` as the next cursor, and `UNPUSHED=<n>` when the clone is ahead. No `--since` lists everything as added. A non-ancestor sha is `ERROR=cursor-unknown`.
13. The board UI stays READ-ONLY: no server writes, no token, no POST routes, one server per project launch. The server reads the clone through the board module, watches it, syncs every 60 s and on window focus with the same lock (skipping the tick when it is held), and serves `/api/changes`. `scripts/build-board-runtime.js` `FILES` becomes `backlog-core.cjs`, `backlog-storage.cjs`, `backlog-board.cjs`, `backlog-git.cjs`; the prune rule and the freshness check stay. The server's import rule widens from "the generated core" to "the generated runtime modules".
14. No Notion or tracker code in the framework. `framwork/.codeadd/agent-mode/README.md` gains a short section on how an assistant mirrors the board through `changes --since` + `get`.
15. History starts fresh on `board`. Its root commit carries `Migrated-From: <base sha>` and the source blob ids. The old history stays on `main`.
16. A new idempotent migration script, run once per installed project by its engineer agent:
  - config, then the `board` branch from the BASE branch's committed files (or empty), then the clone;
  - the divergence check against the trailer on `origin/board`'s root commit (`ERROR=board-unrecognised` when the trailer is missing);
  - `git rm` and staging on the code side, never a commit or a push;
  - removal of a clean leftover `.worktrees/backlog`; recovery refs are reported and never deleted.
  The rule is a freeze: no old-route write between the first run and the merge of the code side. `--reimport` applies base-only changes and records `Reimported-From`. A ticket changed on both sides is refused, listed, and fixed by hand. Exit 0 for done or `MIGRATED=already`, 1 for failure, 2 for caller error.
17. This repo's migration is a build-time bootstrap. The script is written in checkpoint 1 and run on this repo as checkpoint 1's last F-block, which commits the staged code side on the feature branch. It is re-run right before the merge.
18. A CI step fails when `.codeadd/board.json` is tracked together with either board file, on PR and on push.
19. Rule and doc updates: `add--backlog/SKILL.md`, `add--backlog/references/lifecycle.md`, `fragments/board/add-new.md` where it names the route, `add-plan-authoring` (The Ticket), `add-framework--backlog`, `AGENTS.md` (board section, server import rule), and `framwork/.codeadd/agent-mode/README.md`. The two new scripts are registered in `framwork/provider-map.json`, the `scripts/build.js` shipping gate and the inventory.
20. One plan, three checkpoints:
  - (1) the mechanism and the migration: board module, config, ignore change, single write route, lock, reads with sync, id allocator, `status.cjs`/`next-id.cjs`, removals, the migration script, tests and registration, ending with this repo's migration run;
  - (2) the CI guard and the rule and doc updates;
  - (3) the `changes` read, the server on the board module with timer sync and `/api/changes`, the runtime copier, the board suites, the agent-mode note, then the pre-merge re-run.
21. No CI stop-gap. The full fix ships in the current release, right after agent-mode.
22. Out of scope: server writes, tracker code, distributing the board UI (subtopic 004 of `backlog-board`), a multi-project server, carrying the old history over.
23. No ticket is created now. The engineer creates it when Maicon hands the work over.
## Open
None
```bash
/add-framework--plan docs/brainstorming/2026-10-09T165114-board-outside-code-branches-intent.md
```
## Board changes (for the Engineer, with status shaped)
- **title:** Board outside the code branches: orphan `board` branch, one fixed clone per project, single write route, migration script, read-only UI and `changes --since` read
- **status:** shaped
- **done_when:**
  - Every board read and write (CLI, publication entry, `status.cjs`, `next-id.cjs`, server) goes through `backlog-board.cjs` and the fixed clone at `~/.codeadd/<project-key>/board/`; no reader opens `docs/backlog.jsonl` in the code checkout.
  - A board write from any branch or worktree commits and pushes only to the `board` branch; `main` gets no `chore(backlog)` commit and CI does not run.
  - The `.worktrees/backlog` route, `BASE_BRANCH`, `--ref`/`materializeRef` and the old-route-only values are gone; `ROUTE=board` and `BOARD_DIR` are reported.
  - The migration script moves an installed project from `docs/backlog.jsonl` to the `board` branch and the clone, is idempotent (`MIGRATED=already` on re-run), never commits the code repo, and refuses on divergence with `--reimport` for base-only changes. It has run on this repo and on Maicon's two internal projects.
  - `backlog-cli.cjs changes [--since <sha>]` and `GET /api/changes?since=<sha>` return changed ids and `HEAD=<remote tip sha>`.
  - The board UI stays read-only and reads the clone, with sync every 60 s and on window focus.
  - The CI guard fails when `.codeadd/board.json` and a board file are both tracked.
  - The agent-mode guide has the mirror note; the rules and docs listed in Decided 19 are updated; native tests and board suites pass.
- **notes:** Ships in the current release, right after agent-mode. Only Maicon uses the board today (two internal projects). No server writes, no token, no POST routes, no Notion or tracker code. Freeze rule: no old-route board write between the first migration run and the merge. History restarts on `board` with a `Migrated-From` trailer. Notion card slug: `board-single-source`.
- **paths:**
  - design: `docs/brainstorming/2026-10-09T165114-board-outside-code-branches.md`
  - intent: `docs/brainstorming/2026-10-09T165114-board-outside-code-branches-intent.md`

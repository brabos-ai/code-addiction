> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-09
> **Type:** architecture
> **Release:** the current release, right after agent-mode
## Objective
Every project has one copy of its board on the machine, outside every code branch and worktree, still in git with its history. Every agent reads and writes that copy, and the board UI reads it, so a read is never stale because of the checkout it ran in, and a board write never lands on `main` or triggers code CI. A "changes since a sha" read exists so an assistant can mirror the board to an external tracker.
## Discovery
What the code on `main` shows:
- **`backlog-storage.cjs`** reads and writes `docs/backlog.jsonl` and `docs/backlog.definitions.json` under a `root` argument, with no git and no cwd. **The storage layer already accepts any root** — the move is a root-resolution change, not a rewrite. `backlog-core.cjs` (the seven operations) is unchanged too.
- **`backlog-cli.cjs`** — local reads and writes on the cwd root. Reads take `--ref <ref>`, which copies the two files out of `git show <ref>:docs/...` (`materializeRef`). That flag exists only because the board lives on code branches.
- **backlog-commit.cjs** + **backlog-git.cjs** — on the base branch, commit directly; anywhere else, a detached, locked `.worktrees/backlog` under the caller cwd, an isolated index, fetch, rebase, push to `origin/main`. Most of `backlog-git.cjs`'s 564 lines cope with "the caller stands on another branch of the same repo". Recovery refs live under `refs/codeadd/backlog-recovery/<sha>`.
- **`backlog-id.cjs`** — the one id allocator. One global number: max over `docs/features/[NNNN][L]-*` directory names AND the ids on `docs/backlog.jsonl`, both under one root. No concurrency protocol. `status.cjs` and `next-id.cjs` delegate to it; `backlog-cli.cjs` calls `calculate(root, 'B')`.
- **`status.cjs`** reads the pending backlog for the status stream.
- **`board/server.mjs`** — `--root` (default cwd), reads `<root>/docs/` through the generated core in `board/runtime/`, watches `docs/` with `fs.watch`, pushes `board-changed` over `/api/events`. GET only, 127.0.0.1, host header checked.
- **`cli/src/gitignore.js`** writes `.codeadd/` into every user project's `.gitignore`, and this repo ignores `/.codeadd/`. **A file inside an ignored directory cannot be re-included by a **!** line** (git does not descend into an excluded directory), so a committed `.codeadd/board.json` needs the pattern changed to `.codeadd/*` first.
- **CI** — `ci.yml` runs on every push to `main`/`master` and on every PR, with no `paths` filter. A push to any other branch triggers nothing.
- **Callers (graph, **impact --depth 1**):** `add--backlog` and `add--resource-path-convention` run `backlog-commit.cjs` and `backlog-cli.cjs`; `add--id-convention` runs `backlog-cli.cjs`; `fragments/board/add-new.md` runs `backlog-commit.cjs`; all six `fragments/board/*` use `add--backlog`. **Internal callers are not graph edges:** `workbench/commands/add-framework--backlog.md` and `workbench/skills/add-plan-authoring/SKILL.md` call `node framwork/.codeadd/scripts/backlog-*.cjs` by path (found by text search). The route keys `ROUTE`/`BASE_BRANCH` are documented in `add--backlog/SKILL.md` and `add-framework--backlog.md`; `--ref origin/main` in `add--backlog/references/lifecycle.md` and `add-plan-authoring`.
- **Delivery index:** `backlog-commit.cjs`/`backlog-git.cjs` came from `native-node-backlog`, which recorded "existing base/worktree policy, user approved continuity" — **this design reverses that, with Maicon's approval**. The `project-backlog` umbrella (design-002) chose `.worktrees/backlog` over git plumbing. `node-only-board` set "the server imports only the generated core". `backlog-board-002` set "the board is read-only" — **kept**. Subtopic 004 of `backlog-board` (distributing the board UI to users) is still open and is not delivered here. Nothing for moving the board out of the code repo was ever built and dropped.
- **Users:** only Maicon uses the board today, on two internal projects. No external user has the board. The product `board` feature is off by default (`cli/src/features.js`).
## Context & Motivation
The board is a file inside the code repository, so every branch and worktree carries its own copy, as old as the branch. Three symptoms follow:
1. **Stale reads.** `npm run board` reads the checkout it started in. Commands had to learn `git fetch` + `--ref origin/main` after a stale-read bug on PRs 120 and 121.
2. **Fragile writes.** A write from a feature branch builds a detached worktree, rebases and pushes to `main`. A leftover `.worktrees/backlog` refuses later writes (`REFUSED=worktree-locked`). Two worktrees have no lock between them; a conflict ends `DEGRADED`/`PUSHED=no` with exit 0.
3. **Noise and cost.** Every write is a push to `main` and a full CI run — 21 of the last 60 commits on `origin/main` are `chore(backlog)`.
## Problem / Opportunity
The board's lifecycle (minutes, many writers, no review) is mixed with the code's (days, reviewed, CI-gated), and every rule above is glue between the two. With no external user yet, this is the cheapest moment to replace the glue with one route instead of keeping both.
## Proposed Solution
### The mechanism
- **Storage in git:** an orphan branch `board` in the project's own remote, holding `docs/backlog.jsonl` and `docs/backlog.definitions.json` in the layout `backlog-storage.cjs` already reads.
- **Storage on disk:** one clone per project at `<home>/.codeadd/<project-key>/board/` (`os.homedir()`), cloned `--single-branch --branch board`. `CODEADD_BOARD_DIR` overrides the path (tests, unusual setups).
- **Config:** `.codeadd/board.json` in the code repo, committed: `{ "remote": "<url>", "branch": "board" }`. To make it committable, the ignore line becomes `.codeadd/*` plus `!.codeadd/board.json` — in this repo's `.gitignore` (`/.codeadd/*` + `!/.codeadd/board.json`, keeping the leading slash for the reason the comment there records) and in `cli/src/gitignore.js` for user projects; the migration script rewrites an existing `.codeadd/` line.
- **Project key:** from the config's `remote`, never from `origin`, normalised — drop the scheme and `user@`, SSH `host:path` → `host/path`, drop a trailing `.git`, lowercase the host. Every clone and worktree of a project computes the same key.
- **One board module** (`backlog-board.cjs`): resolver, clone, lock, sync and the `changes` diff live in it, built on the git primitives in `backlog-git.cjs`. The CLI, the publication entry, `status.cjs`, `next-id.cjs` and the server all call this one module, so they cannot answer differently.
- **Resolver:** finds the code repo root with `git rev-parse --show-toplevel` from the cwd (a worktree or a subdirectory resolves to its own top level, which carries the committed config), reads the config, computes the key, returns the clone path, clones it when absent. Order: `CODEADD_BOARD_DIR` → the config. Outside a git repository there is no config, which is the "no board" case below. **There is no in-repo fallback.**
  - No config and no `docs/backlog.jsonl` → no board: reads behave as `BACKLOG_PRESENT=no` does today (silently nothing); writes exit 2 with `REFUSED=board-not-configured`, naming the migration script.
  - No config but `docs/backlog.jsonl` present → `backlog-cli.cjs` and `backlog-commit.cjs` exit 1 with `ERROR=board-migration-required`, naming the migration script.
  - Config present but `origin/<branch>` does not exist → exit 1 with `ERROR=board-branch-missing`, naming the migration script.
  - Config present, no clone, no network → exit 1 with `ERROR=board-checkout-missing`, naming the key.
  - ⛔ **status.cjs** never fails on board state.** Twenty commands, skills and agents run it (graph, `impact --depth 1`). In every case above it prints one signal line (`BOARD=migration-required`, `BOARD=branch-missing`, …) and carries on, exit unchanged.
- **Writes — ONE route.** `backlog-commit.cjs`: resolve → take an exclusive lock file at `<clone>/.git/codeadd-board.lock` (PID + timestamp; a dead PID or a lock older than a fixed limit is reclaimed and reported) → fetch + fast-forward → allocate the id (for `add`) → `executeBacklog` → commit → push `board`. A rejected push re-fetches, rebases once and retries; a second failure degrades with a recovery ref in the clone. Push on every write; `PUSHED=no` is retried by the next write.
- **Reads — sync, then read.** `backlog-cli.cjs` syncs the clone, then reads it. Sync is skipped when the last one is under 30 s old (timestamp in the clone's `.git/`). Sync takes the same lock as a write, so it never moves the clone under a writer. Under the lock: fetch; clone behind → fast-forward; clone ahead (an earlier `PUSHED=no`) → push, which is the retry decision 7 promises; diverged → rebase once and push, the write route's own rule. A failed sync never blocks the read: it answers from the clone with `SYNC=degraded` and the reason (`fetch-failed`, `push-refused`, `rebase-conflict`). The lock is held longer by a writer → the read skips the sync and says `SYNC=skipped`.
- **Id allocation:** `calculate(root, letter, { boardRoot })` — `docs/features/` under `root` (the code repo), the raw-text id scan under `boardRoot` (default `root`). Inside the write lock, after the fast-forward, so two writers on one machine never compute the same max. `status.cjs` and `next-id.cjs` pass the resolver's root as `boardRoot`.
- **Changes read:** `backlog-cli.cjs changes [--since <sha>]` syncs, then lists the ticket ids added, updated or removed on `board` between `<sha>` and **the remote tip **origin/<branch>** — never the clone's local HEAD, which may hold an unpushed commit that a rebase later rewrites. It returns `HEAD=<remote tip sha>` as the next cursor, and `UNPUSHED=<n>` when the clone is ahead, so a mirror knows it is not seeing the newest local writes yet. No `--since` lists every ticket as added — the bootstrap. A `<sha>` that is not an ancestor of HEAD exits 1 with `ERROR=cursor-unknown`; the caller restarts from no `--since`. The server answers the same at `GET /api/changes?since=<sha>`.
- **Board UI stays READ-ONLY.** `server.mjs` resolves the board through the resolver (`--root` stays the code project, default cwd), reads and watches the clone, fetches every 60 s and on window focus, and serves `/api/changes`. No POST routes, no token. Its import rule widens from "the generated core" to "the generated runtime modules". `scripts/build-board-runtime.js` `FILES` grows from `backlog-core.cjs`, `backlog-storage.cjs` to those plus `backlog-board.cjs` and `backlog-git.cjs`; its prune rule (delete any other file in `board/runtime/`) and its freshness check stay as they are, over the longer list. The server's timer sync uses the same lock without waiting: lock held → skip this tick. It stays on Node built-ins plus the `git` binary.
- **External tracker mirror:** no Notion code in the framework. A short section in `framwork/.codeadd/agent-mode/README.md` says how an assistant mirrors the board: keep the last `HEAD` sha, call `changes --since <sha>`, then `get <id>` for each changed ticket, push those to the tracker, store the new `HEAD`.
### What is removed (only what existed for the old route)
- `backlog-git.cjs`: the base discovery used for routing, the direct route, the detached `.worktrees/backlog` route, the isolated index, the out-of-band base advance, and the degradation and refusal values only they produce — `worktree-failed`, `base-checked-out-elsewhere`, `caller-worktree-dirty`, `base-advance-failed`, `worktree-lock-failed`, `no-base-branch`, `REFUSED=worktree-locked`, `worktree-recovery-required`.
- `backlog-commit.cjs`: the `BASE_BRANCH` report key and the `direct`/`worktree` values of `ROUTE`. **ROUTE** stays, with the one value **board**, so a consumer reading it does not break; `BOARD_DIR` is added.
- `backlog-cli.cjs`: `--ref` and `materializeRef` — their only purpose was reading the board off another branch. (Round 1 Q12 said keep the flag for a legacy route; with no legacy route left it has no caller.)
- Every rule text about the old route: `--ref origin/main` and "what reaches `main` is only `docs/backlog.jsonl`" in `add-plan-authoring` and `lifecycle.md`; the `ROUTE`/`BASE_BRANCH` explanation in `add--backlog/SKILL.md` and `add-framework--backlog.md`.
- The tests that pin only the removed behaviour, each removal carried by a `Test-Removed:` trailer for `scripts/test-loss-guard.cjs`.
- **Kept:** the recovery-ref contract (now in the clone), `get-main-branch.cjs` (other callers), the `.worktrees/` ignore line (other users of the directory).
### Migration script
A new native entry (`board-migrate.cjs`, name for the planner), run once per installed project by that project's engineer agent, and on this repository. Idempotent: every step checks the state first and does nothing when it is already done; a re-run of a finished migration reports `MIGRATED=already` and exit 0.
1. **Config.** Absent → write `.codeadd/board.json` with `remote` = the `origin` URL. No `origin` → exit 1, `ERROR=no-remote`. Rewrite the `.codeadd/` ignore line as above when needed.
2. **Board branch.** Fetch. `origin/board` absent → build its first commit from the base branch's committed files (`git show origin/<base>:docs/...`, never the caller's working copy — a feature branch's copy is stale) or an empty board when the base has none, with a `Migrated-From: <base sha>` trailer and the source blob ids; push. A rejected push (another machine got there first) → continue as "present".
3. **Clone.** Ensure the fixed clone exists and is fast-forwarded.
4. **Divergence check.** The trailer is read from the root commit of `origin/board` (`git rev-list --max-parents=0`). A root commit without it means the branch was not made by this script → exit 1, `ERROR=board-unrecognised`, nothing changed. If the base branch still carries `docs/backlog.jsonl` and its blob differs from the recorded one, someone wrote through the old route after the migration → exit 1, `ERROR=board-diverged`, listing per ticket id whether it changed on the base only or on both sides; nothing on the code side changes.
  - **The rule is a freeze:** from the first run until the code side is merged, no write goes through the old route. The script prints this when it creates the branch.
  - **The recovery is **--reimport**:** it re-runs the check, applies every ticket changed on the base ONLY onto `board` as one commit, and moves the recorded blob forward with a `Reimported-From: <base sha>:<blob>` trailer, which step 4 reads in preference to the root's when present. A ticket changed on both sides is never merged by the script: it refuses with `ERROR=board-diverged` listing those ids, and they are fixed by hand with `backlog-commit.cjs` before re-running.
5. **Code side.** `git rm` the two files in the caller's tree when they are tracked, and stage the config and the `.gitignore` change. **The script never commits or pushes the code repo** — it reports `CODE_CHANGES=staged` and the paths; the engineer commits them in the normal flow.
6. **Leftovers.** A `.worktrees/backlog` that is clean and holds no unpushed commit is unlocked and removed; otherwise it is reported with `RECOVERY_PATH` and left alone. `refs/codeadd/backlog-recovery/*` in the code repo are counted and reported, never deleted.
Output `KEY=value`; exit 0 done or already done, 1 failure, 2 caller error.
**This repo's own migration — build-time bootstrap.** The internal pipeline runs the scripts from the branch's own tree (`node framwork/.codeadd/scripts/...`), so the moment the no-fallback resolver lands on the branch, a board read on that branch needs the config. Therefore the migration script is written in checkpoint 1, together with the resolver, and **run on this repo as the last F-block of checkpoint 1**: it creates `board`, the clone and the config, and stages the code side, which that F-block commits on the feature branch. Board writes made by the build before that F-block go through the old route on `main`; from it on, through the new one. The freeze starts there. Right before the merge, the script is re-run; `--reimport` covers a base-only write, and a both-sides change stops the merge until fixed by hand.
### Alternatives considered
| Option | Verdict |
| --- | --- |
| **A. Orphan branch in the same remote** | **Chosen.** No new repo or permissions; any host; `ci.yml` does not fire on it |
| B. Separate repository | Not the default. Reachable later: the config's `remote` can point anywhere |
| C. Keep the board on `main`  • `paths-ignore` | Rejected. Fixes CI cost only; no stop-gap either, since the full fix ships in the same release |
| D. A `board` ref written by git plumbing inside each clone | Rejected. Two clones on one machine diverge again |
| E. Keep the old route behind a config switch | Rejected by Maicon. One route; no external user to protect |
| Server without git / Notion as source of truth | Rejected before this design |
## Type of Artefact
architecture — changes to existing product scripts, the board server and its runtime copier, the installer's gitignore writer, product and internal skills and commands; one new resolver module and one new migration script.
## Scope
### Includes
- The resolver, the config file and the `.codeadd/*` ignore change (this repo and `cli/src/gitignore.js`).
- One write route in `backlog-commit.cjs`/`backlog-git.cjs`; removal of the old route as listed above.
- Reads from the clone with fetch freshness; removal of `--ref`.
- The id allocator's `boardRoot`; `status.cjs` and `next-id.cjs` through the resolver.
- The `changes` read in the CLI and `GET /api/changes` in the server.
- The read-only server reading the clone through the resolver, with the timer sync.
- The migration script, run on this repo in the build's last stage.
- The CI guard.
- Rule and doc updates: `add--backlog/SKILL.md`, `add--backlog/references/lifecycle.md`, `fragments/board/add-new.md` where it names the route, `add-plan-authoring` (The Ticket), `add-framework--backlog`, `AGENTS.md` (board section), `framwork/.codeadd/agent-mode/README.md` (mirror note).
- Registration of the two new scripts in `framwork/provider-map.json`, the `scripts/build.js` shipping gate for backlog modules, and the inventory.
- Native tests for every new behaviour under `scripts/tests/`, and board suites for the server change.
### Does NOT Include
- Server writes, a write token or POST routes — the UI stays read-only.
- Any Notion or tracker code.
- Distributing the board UI to users (subtopic 004 of `backlog-board`).
- A multi-project server. One server per project launch.
- Carrying the old board history into `board`; it stays reachable on `main`.
- Creating this work's ticket — the engineer creates it when Maicon hands the work over.
## Key Decisions
| # | Decision | Serves | Rationale | Validated |
| --- | --- | --- | --- | --- |
| 1 | Orphan branch `board` in the same remote | "still in git", "never triggers code CI" | No new repo; `ci.yml` only fires on `main`/`master`/PRs | ✅ |
| 2 | One clone per project at `<home>/.codeadd/<key>/board/`, `CODEADD_BOARD_DIR` override | "one copy per project on the machine" | Every worktree lands on the same clone | ✅ |
| 3 | Key from the config's `remote`, normalised; clone on first use; no in-repo fallback | "never stale because of the checkout" | A fallback is what would bring stale reads back | ✅ |
| 4 | Committed `.codeadd/board.json`; ignore line becomes `/.codeadd/*`  • `!/.codeadd/board.json` here, `.codeadd/*`  • `!.codeadd/board.json` in `cli/src/gitignore.js` | "every agent finds the same copy" | A `!` line cannot reach inside an excluded directory | ✅ |
| 5 | The new layout is the product default; ONE write route; the old route and its-only code are removed | "every agent reads and writes that copy" | Only Maicon uses the board; two routes is the glue this removes | ✅ |
| 6 | Lock file in the clone's `.git/`; cross-machine fetch + rebase-once + recovery ref | writers do not collide | One location makes a lock cheap | ✅ |
| 7 | Push on every write; `PUSHED=no` retried by the next write | "mirror to an external tracker" | The mirror reads the remote | ✅ |
| 8 | `calculate(root, letter, { boardRoot })`; id allocated inside the lock after fast-forward | keeps the one global counter | Moving the board otherwise splits the number space | ✅ |
| 9 | `changes --since <sha>` in the CLI and the server; sha cursor, `HEAD` returned | "changes since a sha" read | Git history is the change log | ✅ |
| 10 | Board UI read-only; resolver-based root; timer sync every 60 s + on focus, same lock, skip when held | "the board UI reads it" | Scope is the mechanism, not UI writes | ✅ |
| 11 | No tracker code; a mirror note in the agent-mode guide | "mirror to an external tracker" | Keeps the framework free of a vendor | ✅ |
| 12 | History starts fresh on `board`, `Migrated-From` trailer | "still in git with its history" | Rewriting history buys little | ✅ |
| 13 | `--ref` removed with the old route | "never stale because of the checkout" | Its only purpose was reading another branch | ✅ |
| 14 | Reads sync first under the write lock (ff, push if ahead, rebase once if diverged), skipped under 30 s; `SYNC=degraded` or `SYNC=skipped` never blocks the read; `changes` cursors on the remote tip | "never stale" | Same-machine writes are instant; cross-machine needs a fetch | ✅ |
| 15 | Idempotent migration script, never commits the code repo; freeze rule, `--reimport` for base-only changes, refusal on both-sides changes; trailer on the root commit | moves installed projects safely | Each engineer runs it once; re-runs must be harmless | ✅ |
| 15b | This repo migrates as the last F-block of checkpoint 1; re-run before the merge | build-time bootstrap | The branch's own scripts need the config from the moment the resolver lands | ✅ |
| 16 | CI guard on PR and push | "never lands on `main`" | Catches the file coming back | ✅ |
| 17 | One plan, three checkpoints (below) | delivery shape | `add-plan-authoring`: one ticket's work is one plan | ✅ |
| 18 | No CI stop-gap | — | The full fix ships in the same release | ✅ |
### Checkpoints for the plan
1. **Mechanism and migration:** `backlog-board.cjs` (resolver, clone, lock, sync) + config + ignore change, single write route, reads with sync, id allocator, `status.cjs`/`next-id.cjs`, removal of the old route and `--ref`, the migration script, native tests, registration and inventory — and, as its last F-block, this repo's migration run (see the build-time bootstrap above).
2. **Rules:** CI guard, and every rule and doc update listed in Scope.
3. **Readers and changes:** `changes` read in the CLI, server on the board module with the timer sync and `/api/changes`, runtime copier, board suites, agent-mode mirror note. Then the pre-merge re-run of the migration script.

## Ecosystem Impact
Layers: `framwork/.codeadd/*`, `cli/src/gitignore.js` and `board/` are **product**; `workbench/*`, `AGENTS.md`, `.gitignore`, `scripts/*`, `.github/workflows/ci.yml` are **internal**.
| Component | Called by | Impact | Action |
| --- | --- | --- | --- |
| `backlog-storage.cjs`, `backlog-core.cjs` | `add--resource-path-convention` (graph); imported by cli/commit and the board runtime | none | none |
| `backlog-cli.cjs` | `add--backlog`, `add--id-convention`, `add--resource-path-convention` (graph); by path: `add-framework--backlog`, `add-plan-authoring` | root from resolver, fetch, `changes`, `--ref` removed | change |
| `backlog-commit.cjs` | `add--backlog`, `add--resource-path-convention`, `fragments/board/add-new.md` (graph); by path: `add-framework--backlog`, `add-plan-authoring` | one route, lock, report keys | change |
| `backlog-git.cjs` | `add--resource-path-convention` (graph); imported by `backlog-commit.cjs`, `backlog-cli.cjs` | old route removed; clone fetch/push/rebase kept | change |
| `backlog-id.cjs` | `add--resource-path-convention` (graph); imported by `backlog-cli.cjs`, `next-id.cjs`, `status.cjs` | `boardRoot` option | change |
| `status.cjs` | 20 direct callers (graph): agents `fix-agent`, `test-agent`; commands `add-brainstorm`, `add-build`, `add-diagnose`, `add-help`, `add-hotfix`, `add-new`, `add-plan`, `add-qa-setup`, `add-review`, `add-ux`; skills `add--code-review`, `add--dev-environment-setup`, `add--doc-schemas`, `add--feature-discovery`, `add--id-convention`, `add--knowledge-discovery`, `add--setup-contract`, `add--subagent-driven-development` | board root from the board module; one `BOARD=` signal line, never a failure | change |
| `next-id.cjs` | `add--id-convention` (graph) | passes `boardRoot` | change |
| `backlog-board.cjs` (new), migration script (new) | new | — | add + register; `backlog-board.cjs` joins the board runtime copier's `FILES` |
| `board/server.mjs`, `scripts/build-board-runtime.js` | not graph nodes; `npm run board` | board-module root, timer sync, runtime `FILES` +2, `/api/changes` | change |
| `cli/src/gitignore.js` | not a graph node; installer, updater | `.codeadd/*`  • `!.codeadd/board.json` | change |
| `add--backlog` (+ `lifecycle.md`) | all six `fragments/board/*` (graph) | route and read rules | change |
| `fragments/board/add-new.md` | injected into `add-new` | route wording where named | change if it names the route |
| `add-plan-authoring`, `add-framework--backlog` | the four pipeline stages; user-invoked | drop `--ref`, route keys, "reaches `main`" | change |
| `framwork/.codeadd/agent-mode/README.md` | not a graph node | mirror note | change |
| `AGENTS.md`, `.gitignore`, `ci.yml` | not graph nodes | board section; ignore line; guard | change |
## Trade-offs & Risks
| We Gain | We Give Up |
| --- | --- |
| One board per project, never stale because of a checkout | The board is not visible by browsing `main` on GitHub |
| No `chore(backlog)` on `main`, no CI per write | A second clone per project on each machine |
| One write route instead of three | Board history restarts on `board` |
| A changes feed for any tracker | A config file and an ignore-pattern change in every project |

| Risk | Probability | Mitigation |
| --- | --- | --- |
| A reader still opens `docs/backlog.jsonl` directly | Med | Every reader through the resolver; the CI guard; a grep sweep of `workbench/`, `AGENTS.md` and the product skills (the graph does not see path-based callers) |
| A write lands on `main`'s old file between migration and merge | Med | Step 4 refuses on divergence; the script is re-run right before the merge |
| `.codeadd/*` change re-shows files in a user's `git status` | Low | Only `board.json` is re-included; the rest of `.codeadd/` stays ignored |
| A stale lock blocks writes | Med | PID + age reclaim, reported |
| Two machines append at once | Low | Rebase-once retry, then a recovery ref |
| Agent-mode slips and this release waits | Low | Only the mirror note touches the agent-mode guide; it can land with whichever ships second |
## Next Steps
Run: `/add-framework--plan docs/brainstorming/2026-10-09T165114-board-outside-code-branches-intent.md`

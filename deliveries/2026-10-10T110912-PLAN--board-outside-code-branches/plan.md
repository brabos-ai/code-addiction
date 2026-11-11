# Plan: Board outside the code branches — orphan `board` branch, one clone per project, one write route

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-10-10
> **Delivery:** confirm
> **Ticket:** 0041B

---

## Objective

Every project has one copy of its board on the machine, outside every code branch and worktree, still in git with its history. Every agent reads and writes that copy, and the board UI reads it, so a read is never stale because of the checkout it ran in, and a board write never lands on `main` or triggers code CI. A "changes since a sha" read exists so an assistant can mirror the board to an external tracker.

**When this build is done:** every board read and write in this repository goes through one module,
`backlog-board.cjs`, against the fixed clone of the `board` branch; `backlog-cli.cjs` only reads;
`backlog-commit.cjs` has one route; the old worktree/direct route and `--ref` are gone; this
repository is migrated (`.codeadd/board.json` tracked, `docs/backlog.jsonl` untracked on the feature
branch, `origin/board` created by the internal `scripts/migrations/migrate-board.cjs`); the board UI
reads the clone with a timer sync and answers `/api/changes`; a CI guard keeps the board files from
coming back next to the config.

**Ticket done when:** Toda leitura e gravacao do board (CLI, entrada de publicacao, status.cjs, next-id.cjs, init.cjs, server) passa por backlog-board.cjs e pelo clone fixo em ~/.codeadd/<project-key>/board/, e nenhum leitor abre docs/backlog.jsonl no checkout de codigo; backlog-cli.cjs so le e recusa gravacao com ERROR=write-mode apontando para backlog-commit.cjs; uma gravacao de qualquer branch ou worktree commita e faz push so na branch board, sem commit chore(backlog) na main e sem CI; a rota .worktrees/backlog, BASE_BRANCH, --ref/materializeRef e os valores so da rota antiga foram removidos, com ROUTE=board e BOARD_DIR reportados; o script interno de migracao scripts/migrations/migrate-board.cjs (fora do pacote e da release) move um projeto de docs/backlog.jsonl para a branch board e o clone, e idempotente (MIGRATED=already), nunca commita o repo de codigo, recusa divergencia e aceita --reimport, e rodou neste repo; backlog-cli.cjs changes [--since <sha>] e GET /api/changes?since=<sha> retornam os ids alterados e HEAD=<sha do remoto>; a UI continua so leitura, lendo o clone com sync a cada 60 s e no foco da janela; a guarda de CI falha quando .codeadd/board.json e um arquivo do board estao ambos versionados; o guia do agent-mode tem a nota de espelhamento, as regras e docs do item 19 do intent foram atualizadas, e os testes nativos e as suites do board passam.

## Context

The board is a file inside the code repository, so every branch and worktree carries its own copy,
as old as the branch: stale reads (`--ref origin/main` was the patch), a fragile worktree write route,
and a `chore(backlog)` push plus a full CI run on `main` for every write.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-09T165114-board-outside-code-branches.md` | The mechanism (storage, resolver, lock, sync, writes, reads, changes, server), the removal list, the migration steps 1–6, the build-time bootstrap, alternatives, risks |
| `docs/brainstorming/2026-10-09T165114-board-outside-code-branches-intent.md` | Decided 1–23, `path: architectural`, `delivery: confirm`, `ticket: 0041B`, Open: None |

## Global Constraints

- No fallback to the in-repo board: no config and no file → no board; no config but the file → `ERROR=board-migration-required` (intent, Decided 4)
- `status.cjs` never fails on board state; it prints one `BOARD=` line and carries on, exit unchanged (intent, Decided 5)
- ONE write route; `ROUTE` keeps the single value `board`; `BOARD_DIR` is added (intent, Decided 7)
- `backlog-cli.cjs` only reads; a write mode exits 2 with `ERROR=write-mode` naming `backlog-commit.cjs` (Maicon, STEP 4 answer 1a)
- `migrate-board.cjs` lives at `scripts/migrations/migrate-board.cjs` and never ships: not under `framwork/`, not in the npm package, not in the release ZIP, not in `provider-map.json`, `add--ecosystem` or the product inventory (Maicon, STEP 4 answer 2)
- Lock file `<clone>/.git/codeadd-board.lock`; read sync skipped when the last one is under 30 s old; server timer every 60 s (intent, Decided 8, 10, 13)
- The board UI stays read-only: no server writes, no token, no POST routes, 127.0.0.1, host header checked (intent, Decided 13; `AGENTS.md`, board section)
- `board/server.mjs` imports nothing but Node built-ins and the generated runtime modules under `board/runtime/` (intent, Decided 13)
- A shipped `framwork/.codeadd/scripts/*.cjs` requires only a `node:` builtin or a `./sibling.cjs` (`scripts/build.js`, `NATIVE_BUILTIN_RE` / `NATIVE_SIBLING_RE`)
- No test reads or writes `~/.codeadd/` or the repository checkout: every board test sets `CODEADD_BOARD_DIR` to a temp dir and uses a temp bare remote (design, "Storage on disk"; repository test policy)
- A test name removed from the branch carries a `Test-Removed:` commit trailer (`AGENTS.md`, `scripts/test-loss-guard.cjs`)
- Tests run through `node scripts/run-tests.js` (`AGENTS.md`, key files)
- `node scripts/build.js` exits 0 and emits no new warning (`AGENTS.md`, Pipeline)
- Exit codes on every new or changed entry: 0 result (a degraded one included), 1 failure, 2 caller error (design, migration script; existing backlog entries)
- Freeze: no write through the old route on `main` between the first migration run (F13) and the merge (design, migration step 4)

## Problem

1. **Stale reads** — a read answers from the checkout it runs in; commands had to learn `git fetch` + `--ref origin/main`.
2. **Fragile writes** — a feature-branch write builds a detached `.worktrees/backlog`, rebases and pushes to `main`; a leftover worktree refuses later writes; two worktrees share no lock.
3. **Noise and cost** — 21 of the last 60 commits on `origin/main` are `chore(backlog)`, each a full CI run.

## Proposal

Implement the design as written, in its three checkpoints (intent, Decided 20), with the two STEP 4
answers applied: the CLI becomes read-only, and the migration script is internal. Checkpoint 1 lands
the mechanism and ends by migrating this repository, because from the moment the no-fallback
resolver is on the branch, the branch's own scripts need the config. Checkpoint 2 brings every rule
and doc in line with code that already exists. Checkpoint 3 adds the `changes` read and moves the
server onto the board module, then re-runs the migration before the merge.

## Current State

| Artefact | Direct callers (graph, depth 1) | Today |
|---|---|---|
| `backlog-cli.cjs` | 3 — `add--backlog`, `add--id-convention`, `add--resource-path-convention`; by path: `add-framework--backlog`, `add-plan-authoring` | Reads and local writes on the cwd root; `--ref` + `materializeRef` |
| `backlog-commit.cjs` | 3 — `add--backlog`, `add--resource-path-convention`, `fragments/board/add-new.md`; by path: the same two internal ones | Direct / worktree / none routes; `ROUTE`, `BASE_BRANCH` |
| `backlog-git.cjs` | 1 — `add--resource-path-convention`; imported by commit and cli | 564 lines, mostly the caller-on-another-branch route |
| `backlog-id.cjs` | 2; imported by `backlog-cli.cjs`, `status.cjs:472`, `next-id.cjs:65`, `init.cjs:210` | One root for features and tickets |
| `status.cjs` | 21 | Reads the board only through `next-id` allocation |
| `init.cjs` | 2 — `add-new`, `add--feature-discovery` | Allocates `F` ids at `:210` |
| `board/server.mjs`, `scripts/build-board-runtime.js`, `cli/src/gitignore.js`, `ci.yml`, `agent-mode/README.md` | not graph nodes | — |

No workflow fires on a push to a branch named `board`: `ci.yml` is `pull_request` + push to
`main`/`master`, `deploy-web.yml` is push to `production` with `web/**`, `release.yml` is `v*` tags.

## Scope

### Includes

#### Checkpoint 1 — mechanism and migration (ref: design, "The mechanism", "What is removed", "Migration script")

- **F1** [product] — `framwork/.codeadd/scripts/backlog-id.cjs`: `calculate(root, letter, { boardRoot })` and `scanIds` take the feature directories under `root` and the ticket ids under `boardRoot`, default `root`. Must not lose: `allowOverflow`, the 9999 refusal, the raw-text scan. (intent, Decided 11)
  - **Produces:** `calculate(root, letter, { boardRoot })`
- **F2** [product] — `framwork/.codeadd/scripts/backlog-git.cjs`, **additive only**: add what the board module needs — clone `--single-branch --branch`, fetch/rebase-once/push of one named branch of a clone, ahead/behind against `origin/<branch>`, fast-forward, `git show <sha>:<path>`, root commit and trailer read — reusing `run`/`GitError`, the recovery-ref contract (`protectCommit`, `releaseOwnedRef`, `RECOVERY_NS`) and `isAncestor`. Nothing is removed here, so `backlog-commit.cjs` and `backlog-cli.cjs` keep working until F4/F5; the removal happens in F4.
  - **Produces:** the clone-side git primitives (clone, fetch, ahead/behind, fast-forward, rebase-once, push of one branch, show at a sha, root-commit trailer read, recovery ref)
- **F3** [product] — `framwork/.codeadd/scripts/backlog-board.cjs` (new): the resolver (`CODEADD_BOARD_DIR` → `.codeadd/board.json` at `git rev-parse --show-toplevel`), the project-key normalisation (intent, Decided 4), clone on first use, the lock (PID + timestamp; reclaimed when the PID is dead or the lock is older than 10 minutes, reported `LOCK_RECLAIMED=<pid>`; on a lock held by a live process a **read or a timer tick skips**, and a **writer waits up to 30 s, then exits 1 with `ERROR=board-locked`**, writing nothing), and the read sync (30 s stamp in the clone's `.git/`; under the lock: behind → fast-forward, ahead → push, diverged → rebase once and push; a held lock → skip). Header documents usage, states and exit codes. Requires only `node:` built-ins and `./backlog-git.cjs`, `./backlog-storage.cjs`.
  - **Produces:** resolver states `ready|none|migration-required|branch-missing|checkout-missing`; `SYNC=fresh|synced|skipped|degraded` with `SYNC_REASON=fetch-failed|push-refused|rebase-conflict` on `degraded`; `LOCK_RECLAIMED`; `ERROR=board-locked`
  - **Consumes:** the clone-side git primitives (F2)
- **F4** [product] — `framwork/.codeadd/scripts/backlog-commit.cjs`: one route — resolve → lock → fetch + fast-forward → allocate the id for `add` with `boardRoot` = the clone → `executeBacklog` → commit → push `board`; a rejected push rebases once and retries, then degrades with a recovery ref in the clone. Report: `ROUTE=board`, `BOARD_DIR`, `TICKET_ID`, `SHA`, `PUSHED`, `PERSISTED`, `COMMITTED`, `DEGRADED` (only the values the new route can produce), `RECOVERY_REF`; `BASE_BRANCH` removed. **The same F-block removes the old route from `backlog-git.cjs`** — routing base discovery, direct route, `.worktrees/backlog` route, isolated index, out-of-band base advance, and the values only they produce (design, "What is removed" list) — prunes `DEGRADED_PRIORITY` to the values the new route can produce, and rewrites both headers. States: `none` → `REFUSED=board-not-configured` exit 2; `migration-required` / `branch-missing` / `checkout-missing` → `ERROR=board-<state>` exit 1. Keeps: read modes refused by name, record file read before any git, `--record-file`/stdin grammar. Header rewritten.
  - **Produces:** `ROUTE=board`, `BOARD_DIR=<clone>`, `REFUSED=board-not-configured`, `ERROR=board-migration-required|board-branch-missing|board-checkout-missing`
  - **Consumes:** resolver states, `SYNC=`, `ERROR=board-locked` (F3); `calculate(root, letter, { boardRoot })` (F1); the clone-side git primitives (F2)
- **F5** [product] — `framwork/.codeadd/scripts/backlog-cli.cjs`: reads (`list`, `search`, `get`) resolve and sync through the board module, then read the clone, printing `BOARD_DIR` and `SYNC` (plus `SYNC_REASON`) before today's keys; `none` reads as today's `BACKLOG_PRESENT=no`; the three error states exit 1 as in F4. `--ref`, `REF_FLAG` and `materializeRef` are removed. Every write mode exits 2 with `ERROR=write-mode` and a line naming `backlog-commit.cjs`. Must not lose the exports `backlog-commit.cjs` imports (`parseInvocation`, `captureRecord`, `resolveNewId`, `renderOperation`, `USAGE`).
  - **Produces:** `ERROR=write-mode`; read output `BOARD_DIR`, `SYNC`
  - **Consumes:** resolver states, `SYNC=` (F3)
- **F6** [product] — `framwork/.codeadd/scripts/status.cjs`, `next-id.cjs`, `init.cjs`: allocation passes `boardRoot` from the board module. `status.cjs` main run resolves without sync and prints one `BOARD=<state>` line, never changing its exit; the `next-id` subcommand, `next-id.cjs` and `init.cjs` resolve with the throttled sync. In any state but `ready`, allocation counts the feature directories only (no in-repo fallback).
  - **Produces:** `BOARD=ready|none|migration-required|branch-missing|checkout-missing`
  - **Consumes:** resolver states (F3); `calculate(root, letter, { boardRoot })` (F1)
- **F7** [product] — `cli/src/gitignore.js`: write `.codeadd/*` + `!.codeadd/board.json` instead of `.codeadd/`, and rewrite an existing exact `.codeadd/` line into that pair, idempotent. `cli/tests/gitignore.test.js` updated to the new pair. (intent, Decided 6)
- **F8** [internal] — `.gitignore`: `/.codeadd/` → `/.codeadd/*` + `!/.codeadd/board.json`, keeping the leading-slash comment and adding one line on why a `!` line needs the `*` form.
- **F9** [product] — registration of `backlog-board.cjs`: `add--resource-path-convention` `<!-- uses: -->` block and its module-family text (`:83`); `add--ecosystem` `<!-- uses: -->` mention and one script-table row. The inventory regeneration in `AGENTS.md` is internal and happens in F9b. No `provider-map.json` entry (scripts ship by directory; the gate admits by rule). `migrate-board.cjs` is registered nowhere.
  - **Consumes:** `backlog-board.cjs` exists (F3)
- **F9b** [internal] — `AGENTS.md`: `node scripts/inventory.js` regenerates the inventory block; the scripts line gains `backlog-board.cjs` and never `migrate-board.cjs`.
  - **Consumes:** `backlog-board.cjs` exists (F3)
- **F10** [internal] — `scripts/tests/`: new `backlog-board.test.cjs` (key normalisation table, resolver states, lock reclaim, sync matrix, 30 s skip); `backlog.test.cjs` — `backlog#068` (`--ref`) removed with a `Test-Removed:` trailer, write-mode cases moved to call the core directly or `backlog-commit.cjs` over a fixture clone, and a new `ERROR=write-mode` case; `backlog-commit.test.cjs` `#003`/`#006` rewritten for the board route; `status.test.cjs`, `next-id.test.cjs` fixtures moved to `CODEADD_BOARD_DIR`, plus `BOARD=` state cases; `native-script-cases.json` brought in line.
  - **Consumes:** `ROUTE=board`, `BOARD_DIR=<clone>` (F4); `ERROR=write-mode` (F5); `BOARD=...` (F6)
- **F11** [product] — `cli/tests/`: `backlog-publication.test.js` — every case pinning only the removed route (base discovery, direct route, worktree route, worktree sweep, base advance, caller-tree degradation) removed with `Test-Removed:` trailers; the recovery-ref, fetch-failed, push-refused, rebase-conflict, no-op and entry-contract cases kept and moved onto a fixture clone of a bare remote; new cases: a write from a feature branch and from a linked worktree lands only on `origin/board`, two writers serialise on the lock, `add` allocates after the fast-forward. `backlog-cli.test.js` and `backlog-id.test.js` (`boardRoot` default keeps the L2 group green; one new `boardRoot` case) updated.
  - **Consumes:** `ROUTE=board`, `BOARD_DIR=<clone>` (F4); `ERROR=write-mode` (F5); `calculate(root, letter, { boardRoot })` (F1)
- **F12** [internal] — `scripts/migrations/migrate-board.cjs` (new) and `scripts/tests/migrate-board.test.cjs`: migration steps 1–6 of the design, run with the caller cwd in the target project and requiring the board module by path from `framwork/.codeadd/scripts/`. Idempotent; `MIGRATED=already`; `--reimport`; `ERROR=no-remote|board-unrecognised|board-diverged`; prints the freeze rule when it creates the branch; never commits or pushes the code repo (`CODE_CHANGES=staged`); never deletes a recovery ref; skips the `.gitignore` step when the line is already the pair. Exit 0/1/2. The product-side message for `migration-required` names no script path: users have none to run.
  - **Produces:** `MIGRATED=done|already`, `CODE_CHANGES=staged`, `--reimport`, `ERROR=no-remote|board-unrecognised|board-diverged`
  - **Consumes:** resolver states (F3); the clone-side git primitives (F2)
- **F13** [internal] — this repository's migration (build-time bootstrap, intent Decided 17): run `node scripts/migrations/migrate-board.cjs` on the feature branch; it creates `origin/board` from `origin/main`'s committed board, the clone and `.codeadd/board.json`, and stages the code side; this F-block commits the staged change on the feature branch. **The freeze starts here.** A push of `board` that does not report success, or any `ERROR=`, is a hard stop. That push is also the first real check of the unmeasured ruleset risk. On a stop nothing is committed on the code side (the script only stages): the build reports the staged paths and leaves them staged, and a re-run after the cause is fixed continues from the state it finds.
  - **Consumes:** `MIGRATED=done|already`, `CODE_CHANGES=staged` (F12)

#### Checkpoint 2 — CI guard and rules (ref: design, "Scope", intent Decided 18–19)

- **F14** [internal] — `scripts/board-files-guard.cjs` (new) + `scripts/tests/board-files-guard.test.cjs`; `.github/workflows/ci.yml` gains a step running it (the workflow already fires on PR and on push to `main`). It fails when `.codeadd/board.json` is tracked together with `docs/backlog.jsonl` or `docs/backlog.definitions.json`. A Node script, because the CI job rejects Bash.
- **F15** [product] — `framwork/.codeadd/skills/add--backlog/SKILL.md` and `references/lifecycle.md`: the route and refusal text (`:54`, `:71`, `:187-189`, `:230`, `:238-248`, `:262`; lifecycle `:71-76`, `:99-104`) replaced by the board route, the resolver states and their meaning, the `SYNC` line, `ERROR=board-locked`, the read-only CLI; no `--ref`.
  - **Consumes:** `ROUTE=board`, `BOARD_DIR=<clone>`, `REFUSED=board-not-configured`, `ERROR=board-migration-required|board-branch-missing|board-checkout-missing` (F4); `ERROR=write-mode` (F5); `SYNC=`, `SYNC_REASON`, `ERROR=board-locked` (F3)
- **F16** [product] — `framwork/.codeadd/fragments/board/add-new.md` `:27`: the write goes to the `board` branch through the clone, not "to the base branch through its own worktree".
- **F17** [product] — the other product docs that describe the old route or the CLI write: `add--ecosystem` script rows for `backlog-cli`/`backlog-commit`/`backlog-git` (`:300-303`); `add--id-convention` (`:114`, `:125`, `:130-133`, `:151` — `add` through `backlog-commit.cjs`, the ticket ids counted in the clone); `add--doc-schemas/SKILL.md` `:153` and `references/backlog.md` ("the local CLI never commits" → the CLI only reads; publication refusal names if listed); `add--resource-path-convention` family text.
  - **Consumes:** `ERROR=write-mode` (F5); `BOARD=...` (F6)
- **F18** [internal] — `workbench/skills/add-plan-authoring/SKILL.md`, The Ticket: drop the `--ref origin/main` read and its fetch (`get <id>` syncs on its own), replace "What reaches `main` is only `docs/backlog.jsonl`" and the route paragraph of "How a write is made" with the `board` route; the degradation table keeps `DEGRADED`, adds the resolver errors.
  - **Consumes:** `ROUTE=board`, `ERROR=board-migration-required|board-branch-missing|board-checkout-missing` (F4)
- **F19** [internal] — `workbench/commands/add-framework--backlog.md` (`:213`, `:216`, `:247` route keys; "commits and pushes it to main") and its description in `workbench/provider-map.json` (`:71-72`).
  - **Consumes:** `ROUTE=board`, `BOARD_DIR=<clone>` (F4)
- **F20** [internal] — `AGENTS.md`: the board section (the server reads the clone through the board module; the import rule widens from "the generated core" to "the generated runtime modules"; `docs/backlog.jsonl` no longer read in the checkout), the `add-framework--backlog` row ("pushed to the `board` branch"), one key-files row for `scripts/migrations/` (internal, never shipped), and a line on `.codeadd/board.json` being the one tracked file under `.codeadd/`.
- **F21a** [internal] — the sweep the graph cannot do, internal half: grep `docs/backlog.jsonl`, `--ref`, `.worktrees/backlog`, `BASE_BRANCH`, `worktree-locked`, `materializeRef`, `backlog-cli.cjs add|update|comment|move|remove` over `workbench/`, `AGENTS.md` and the repo-root files outside `mcp/`. Every hit is fixed or recorded in the ledger as correct.
- **F21b** [product] — the same sweep, product half: `framwork/.codeadd/{commands,skills,fragments,agents,agent-mode}`, `cli/src/`, `board/src/` (hits in `board/src/` left for F25 are recorded as such). Every hit is fixed or recorded in the ledger as correct (a format reference to the file name inside the clone is correct).

#### Checkpoint 3 — readers and changes (ref: design, "Changes read", "Board UI stays READ-ONLY", "External tracker mirror")

- **F22** [product] — `backlog-board.cjs` gains the `changes` diff, and `backlog-cli.cjs` the `changes [--since <sha>]` read: sync, then ticket ids added / updated / removed between `<sha>` and `origin/<branch>`, printed as `HEAD=<remote tip sha>`, `UNPUSHED=<n>` when the clone is ahead, `ADDED=`, `UPDATED=`, `REMOVED=` (comma-separated, empty when none). No `--since` → everything as added. A non-ancestor sha → `ERROR=cursor-unknown`, exit 1. Tests in `scripts/tests/backlog-board.test.cjs` and `backlog.test.cjs`.
  - **Produces:** `HEAD=`, `UNPUSHED=`, `ADDED=`, `UPDATED=`, `REMOVED=`, `ERROR=cursor-unknown`
  - **Consumes:** `SYNC=` (F3)
- **F23** [internal] — `scripts/build-board-runtime.js`: `FILES` = `backlog-core.cjs`, `backlog-storage.cjs`, `backlog-board.cjs`, `backlog-git.cjs`; prune rule and freshness check unchanged; header updated.
  - **Produces:** `board/runtime/backlog-board.cjs`, `board/runtime/backlog-git.cjs`
- **F24** [product] — `board/server.mjs`: `--root` stays the code project; the board is resolved through `runtime/backlog-board.cjs`; the server reads and watches the clone's `docs/`; `/api/board` runs the same throttled read sync as the CLI (which is what a window-focus refetch triggers); a 60 s timer syncs under the lock without waiting, skipping the tick when it is held; `GET /api/changes?since=<sha>` answers the F22 result as JSON; a non-`ready` state is answered as a JSON error naming the state. GET only; header and import-rule comment updated.
  - **Consumes:** `board/runtime/backlog-board.cjs`, `board/runtime/backlog-git.cjs` (F23); `HEAD=`, `UNPUSHED=`, `ADDED=`, `UPDATED=`, `REMOVED=`, `ERROR=cursor-unknown` (F22); resolver states (F3)
- **F25** [product] — `board/src/`: the user-facing text that says "docs/backlog.jsonl in the project selected with --root" (`components/states.tsx`, `components/app-shell.tsx`, `hooks/use-board-events.ts`) says the board's clone, and the non-`ready` states render a message naming the state.
- **F26** [product] — board suites: `board/test/server.test.ts` (`/api/changes`, a state error, the timer skip under a held lock, still no POST route), `board/test/native-backlog.test.ts`, `board/e2e/fixture.ts` and `native-backlog.spec.ts` moved to `CODEADD_BOARD_DIR`; `cli/tests/board-runtime.test.js` expects four runtime files (the `backlog-git.cjs`-absent assertion inverts).
  - **Consumes:** the `/api/changes` route (F24)
- **F27** [product] — `framwork/.codeadd/agent-mode/README.md`: a short section on mirroring the board — keep the last `HEAD`, call `changes --since <sha>`, `get <id>` per changed id, push to the tracker, store the new `HEAD`. No tracker named in code.
  - **Consumes:** `HEAD=`, `ADDED=`, `UPDATED=`, `REMOVED=`, `ERROR=cursor-unknown` (F22)
- **F28** [internal] — the pre-merge re-run of `node scripts/migrations/migrate-board.cjs` on this repository: `MIGRATED=already`, or `--reimport` for a base-only change; a both-sides change is a hard stop. The ledger records the `origin/main` sha the run compared against. The build report tells the close-out operator to run it once more immediately before `gh pr merge`; that last run is a manual step no gate enforces (see Risks).
  - **Consumes:** `MIGRATED=done|already`, `ERROR=board-diverged` (F12)

### Does NOT Include (important!)

- Server writes, a write token, POST routes.
- Any Notion or tracker code.
- Distributing the board UI to users (subtopic 004 of `backlog-board`).
- A multi-project server.
- Carrying the old board history into `board`.
- Shipping `migrate-board.cjs` in any form (Maicon, STEP 4 answer 2).
- Migrating Maicon's two internal projects — a manual post-release step, recorded as a comment on 0041B and out of `done_when`.
- Creating a ticket.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Decided 1–23 | Carried as settled | Intent file |
| What do the CLI write modes do? | Refused with `ERROR=write-mode`, exit 2, naming `backlog-commit.cjs` | Maicon, STEP 4 answer 1a — one route, one name, symmetric with `ERROR=read-mode` |
| Where does the migration script live? | `scripts/migrations/migrate-board.cjs`, internal, never shipped or registered | Maicon, STEP 4 answer 2 |
| The internal projects' migration | Manual post-release step; out of `done_when`; a comment on the ticket | Maicon, STEP 4 answer 2 |
| "Registered in `provider-map.json`" (Decided 19) | No entry: scripts ship by directory and the gate admits by rule; registration = `add--resource-path-convention` uses block, `add--ecosystem` row, inventory | Planner ruling — `scripts/build.js` `SHIPPED_SUBDIRS`; no script is in `provider-map.json` |
| `init.cjs` | Also passes `boardRoot` | Planner ruling — fourth caller of `calculate`, same rule as Decided 11 |
| Does `status.cjs` sync? | Main run: resolve only, one `BOARD=` line. `next-id` subcommand, `next-id.cjs`, `init.cjs`: throttled sync | Planner ruling — 21 callers stay fast; allocation still sees the newest ids |
| Lock age limit | 10 minutes, after the PID check | Planner ruling — the PID check is exact on one machine; age only covers PID reuse |
| CI guard shape | A Node script with its own test, run by a `ci.yml` step | Planner ruling — the CI job rejects Bash |
| Focus sync with no POST route | `/api/board` runs the throttled read sync; a focus refetch triggers it | Planner ruling — keeps the UI GET-only (Decided 13) |
| `changes` output keys | `HEAD`, `UNPUSHED`, `ADDED`, `UPDATED`, `REMOVED` | Planner ruling — KEY=value like every backlog entry |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One board per project, never stale because of a checkout | The board is not visible by browsing `main` on GitHub |
| No `chore(backlog)` on `main`, no CI per write | A second clone per project on each machine |
| One write route, one read-only CLI | Board history restarts on `board`; local CLI writes are gone |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A repository ruleset blocks pushes to `board` (not measured: the rulesets API call was denied) | Low | F13 requires the push to succeed; anything else is a hard stop before the code side is committed |
| A reader still opens `docs/backlog.jsonl` in the checkout | Med | F21 sweep; F14 guard; L4.3 |
| A write lands on `main`'s old file between F13 and the merge | Med | Freeze (Global Constraints); F28 re-run with `--reimport`, recording the `origin/main` sha it compared |
| A write lands on `main` between F28 and the merge (residual) | Low | Manual: the build report asks the operator to run the script once more right before `gh pr merge`; `/add-framework--done` has no gate for it, and L4.5 proves only the build-time run |
| The `.codeadd/*` change re-shows files in `git status` | Low | Only `board.json` is re-included; L2.9 |
| A stale lock blocks writes | Med | PID + age reclaim, reported (F3; L1.3) |
| Two machines append at once | Low | Rebase-once then recovery ref (F4; L2.4) |
| Exact-output tests break on the new `BOARD_DIR`/`SYNC`/`BOARD=` lines | Med | F10, F11, F26 update them; `run-tests.js` all suites green at each checkpoint |
| A test touches the real `~/.codeadd/` | Med | Global Constraint; L1.6 sets `HOME`/`USERPROFILE` to a temp dir in the board-module suite and asserts nothing was created there |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/backlog-id.cjs` | product | modify | F1 |
| `framwork/.codeadd/scripts/backlog-git.cjs` | product | modify | F2 |
| `framwork/.codeadd/scripts/backlog-board.cjs` | product | create | F3, F22 |
| `framwork/.codeadd/scripts/backlog-commit.cjs` | product | modify | F4 |
| `framwork/.codeadd/scripts/backlog-cli.cjs` | product | modify | F5, F22 |
| `framwork/.codeadd/scripts/status.cjs`, `next-id.cjs`, `init.cjs` | product | modify | F6 |
| `cli/src/gitignore.js`, `cli/tests/gitignore.test.js` | product | modify | F7 |
| `.gitignore` | internal | modify | F8 |
| `framwork/.codeadd/skills/add--resource-path-convention/SKILL.md` | product | modify | F9, F17 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F9, F17 |
| `AGENTS.md` | internal | modify | F9b (inventory), F20 |
| `scripts/tests/backlog-board.test.cjs` | internal | create | F10, F22 |
| `scripts/tests/backlog.test.cjs`, `backlog-commit.test.cjs`, `status.test.cjs`, `next-id.test.cjs`, `native-script-cases.json` | internal | modify | F10, F22 |
| `cli/tests/backlog-publication.test.js`, `backlog-cli.test.js`, `backlog-id.test.js` | product | modify | F11 |
| `scripts/migrations/migrate-board.cjs`, `scripts/tests/migrate-board.test.cjs` | internal | create | F12 |
| `.codeadd/board.json` | internal | create (by the script) | F13 |
| `docs/backlog.jsonl`, `docs/backlog.definitions.json` | internal | untrack (`git rm`) on the feature branch | F13 |
| `scripts/board-files-guard.cjs`, `scripts/tests/board-files-guard.test.cjs` | internal | create | F14 |
| `.github/workflows/ci.yml` | internal | modify | F14 |
| `framwork/.codeadd/skills/add--backlog/SKILL.md`, `references/lifecycle.md` | product | modify | F15 |
| `framwork/.codeadd/fragments/board/add-new.md` | product | modify | F16 |
| `framwork/.codeadd/skills/add--id-convention/SKILL.md` | product | modify | F17 |
| `framwork/.codeadd/skills/add--doc-schemas/SKILL.md`, `references/backlog.md` | product | modify | F17 |
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F18 |
| `workbench/commands/add-framework--backlog.md`, `workbench/provider-map.json` | internal | modify | F19 |
| `scripts/build-board-runtime.js` | internal | modify | F23 |
| `board/server.mjs` | product | modify | F24 |
| `board/src/components/states.tsx`, `app-shell.tsx`, `board/src/hooks/use-board-events.ts` | product | modify | F25 |
| `board/test/server.test.ts`, `native-backlog.test.ts`, `board/e2e/fixture.ts`, `native-backlog.spec.ts`, `cli/tests/board-runtime.test.js` | product | modify | F26 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F27 |
| any further internal hit of the sweep | internal | modify | F21a — recorded per file in the ledger |
| any further product hit of the sweep | product | modify | F21b — recorded per file in the ledger |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify it fails against the
current tree. Then drive it GREEN. Every board fixture: temp bare remote, temp code repo,
`CODEADD_BOARD_DIR` in a temp dir.

### L1 — Unit: the board module and the allocator (RED → GREEN)

1. Key normalisation: `https://github.com/A/b.git`, `git@github.com:A/b.git`, `ssh://git@GitHub.com/A/b` and `https://user@github.com/A/b` all give `github.com/A/b`. *RED: no module.* (F3)
2. Resolver states: no config + no file → `none`; no config + file → `migration-required`; config + no `origin/board` → `branch-missing`; config + no clone + unreachable remote → `checkout-missing`; config + clone → `ready`; outside a git repo → `none`; `CODEADD_BOARD_DIR` wins over the config. (F3)
3. Lock: with a live holder, a read reports `SYNC=skipped` and answers; a writer waits, and after 30 s exits 1 with `ERROR=board-locked` having written nothing; a lock with a dead PID or older than 10 min is reclaimed and reported `LOCK_RECLAIMED`. (F3)
4. Sync matrix: behind → fast-forward; ahead → push; diverged → rebase once and push; fetch failure → `SYNC=degraded` + `SYNC_REASON=fetch-failed` and the read still answers; lock held → `SYNC=skipped`; second read within 30 s → `SYNC=fresh` with no fetch. (F3)
5. `calculate(root, 'B', { boardRoot })` counts feature dirs under `root` and ticket ids under `boardRoot`; omitted `boardRoot` gives today's answer. *RED: option ignored.* (F1)
6. The board-module suite runs with `HOME`/`USERPROFILE` pointed at a temp dir and asserts no `.codeadd/` appears in the real home. (Global Constraint)

### L2 — Integration: the entries over a fixture clone

1. `backlog-commit.cjs add` from a feature branch and from a linked worktree: the ticket is on `origin/board`; `origin/main` and the caller's branch are unchanged; output has `ROUTE=board`, `BOARD_DIR`, no `BASE_BRANCH`. *RED: today it lands on main.* (F4)
2. Two concurrent `add` calls on one machine get different ids and both land. (F4, F1)
3. `none` → `REFUSED=board-not-configured` exit 2; `migration-required`/`branch-missing`/`checkout-missing` → `ERROR=board-…` exit 1, nothing written. (F4)
4. Push refused twice → `DEGRADED=push-refused`, `RECOVERY_REF` in the clone, exit 0; the next write pushes it. (F4)
5. `backlog-cli.cjs add|update|comment|move|remove` → `ERROR=write-mode`, exit 2, names `backlog-commit.cjs`, writes nothing. *RED: writes today.* (F5)
6. `backlog-cli.cjs get <id>` from a stale feature branch answers the clone's current ticket; `--ref` is an unknown argument. *RED: answers the checkout.* (F5)
7. `status.cjs` prints exactly one `BOARD=` line in each of the five states and keeps its exit code; `status.cjs next-id B`, `next-id.cjs B` and `init.cjs` allocate past a ticket that exists only in the clone. (F6)
8. `migrate-board.cjs`: on a project whose ignore line is `.codeadd/` it is rewritten to the pair and staged; on one already holding the pair the `.gitignore` is untouched and not staged; a fresh run creates `origin/board` with `Migrated-From:` on its root commit, the clone, the config, stages `git rm` + config + `.gitignore`, makes no code commit; a re-run → `MIGRATED=already`; a base-only change after the run → `ERROR=board-diverged`, then `--reimport` applies it with `Reimported-From:`; a both-sides change → refused, ids listed; a foreign root commit → `ERROR=board-unrecognised`; no `origin` → `ERROR=no-remote`; a clean leftover `.worktrees/backlog` is removed, recovery refs are counted and kept. (F12)
9. `gitignore.js` on a project with `.codeadd/`: the line becomes the pair, once; `git check-ignore .codeadd/board.json` fails and `git check-ignore .codeadd/manifest.json` succeeds. Same check on this repo after F8. (F7, F8)
10. `changes`: no `--since` → every id under `ADDED`; after an update and a remove → those ids under `UPDATED`/`REMOVED`, `HEAD` = `origin/board`; an unpushed local commit → `UNPUSHED=1` and not in the lists; a foreign sha → `ERROR=cursor-unknown` exit 1. (F22)

### L3 — Board server and suites

1. `/api/board` reads the clone, not `<root>/docs/`. *RED: reads root.* (F24)
2. `/api/changes?since=<sha>` returns the L2.10 result as JSON. (F24)
3. The timer tick skips when the lock is held; the server has no POST route and still rejects a foreign Host header. (F24)
4. `node scripts/build-board-runtime.js` leaves exactly the four files; `cli/tests/board-runtime.test.js` green. (F23, F26)
5. The board vitest and Playwright suites pass on `CODEADD_BOARD_DIR` fixtures. (F25, F26)

### L4 — Behavioural acceptance

1. After F13 on this repo: `git ls-files docs/backlog.jsonl docs/backlog.definitions.json` is empty on the feature branch, `.codeadd/board.json` is tracked, `origin/board` exists, and `node framwork/.codeadd/scripts/backlog-cli.cjs get 0041B` answers `TICKETS_RETURNED=1` from the clone. (F13)
2. `scripts/board-files-guard.cjs` exits non-zero on a fixture tracking both, zero on this branch after F13. (F14)
3. The F21a and F21b sweeps leave zero unexplained hits; the ledger lists each kept hit with its reason. (F15–F21b, F25)
4. Each doc F-block's text matches the code: the keys it names are the keys F4/F5/F6/F22 print (reviewer reads both). (F15–F20, F27)
5. F28 reports `MIGRATED=already` (or a `--reimport` that succeeded). (F28)

### L5 — Gates

1. `node scripts/build.js` exits 0 with no new warning; the shipping gate admits `backlog-board.cjs` with no allowlist entry; `scripts/migrations/` is in no build output and no release path. (F3, F9, F12)
2. `node scripts/inventory.js --check` exits 0; the scripts line carries `backlog-board.cjs` and not `migrate-board.cjs`. (F9b)
3. `NODE_OPTIONS= node scripts/graph.js impact backlog-board.cjs --depth 1` lists `add--resource-path-convention`. (F9)
4. `node scripts/test-loss-guard.cjs` passes: every removed test name has a `Test-Removed:` trailer. (F10, F11)
5. `node scripts/run-tests.js` all suites green at the end of each checkpoint. (all)

**RED expectations against the current tree:** L1 (L1.6 included: no module to run), L2.1,
L2.3–L2.10, L3.1–L3.2, L4.1–L4.2 fail today (no module, old route, writing CLI, `--ref`, no script, no
guard, no route). In L3.3 the timer-skip assertion is RED (no timer); the no-POST and Host-header
assertions already pass and stay as regression guards. L2.2 may pass by accident on one machine and
must be made to fail by removing the lock in a scratch run.
**GREEN = all levels pass after F1–F28.**

---

## Execution Order

1. **Checkpoint 1:** F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F9b → F10 → F11 → F12 → F13.
   - F1–F3 first and additive: every entry consumes them, and the tree stays green after each.
   - F4 removes the old route from `backlog-git.cjs` in the same commit that stops using it, so no
     commit imports a removed function. Between F4 and F10/F11 the old-route tests are red by design;
     the tests of each F-block it touches run on that F-block, and the full suite is the gate at F11.
   - F7/F8 before F12: the migration rewrites the ignore line and must find the writer's format.
   - F13 last: from the moment F4/F5 land, a board call on this branch needs the config. Between F5
     and F13 the build makes no board write and no board read through the branch's scripts.
   - **Boundary:** after F13 the repository works end to end on the new route.
2. **Checkpoint 2:** F14 → F15 → F16 → F17 → F18 → F19 → F20 → F21a → F21b. Text follows code that
   already exists. The two sweeps last, over everything before them. **Boundary:** docs match code.
3. **Checkpoint 3:** F22 → F23 → F24 → F25 → F26 → F27 → F28. F22 before the server that serves it;
   F23 before the server imports the new runtime files; F28 last. **Boundary:** ready for review.

Per-F-block validation beyond the layer default: F13 and F28 run on the real repository and are
hard stops on any `ERROR=` or a failed push of `board`.

## Reviewer Handoff

For each F-block the build leaves in the evidence file: what changed (files, F-block id), which
validation levels cover it and their pass state, and any decision deferred or altered with the design
section it departs from.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A reader that still opens `docs/backlog.jsonl` under the code root — `backlog-id.cjs` with no `boardRoot`, a test fixture, a doc sentence.
3. A `DEGRADED` value still listed in `DEGRADED_PRIORITY` or a doc that the new route can no longer produce.
4. `migrate-board.cjs` reachable from any shipped path, `release.yml`, the inventory or `add--ecosystem`.
5. A board test that writes outside its temp dirs.
6. `status.cjs` changing its exit code in any board state.
7. A `server.mjs` import outside `node:` and `./runtime/`.

## References

- Design set: `docs/brainstorming/2026-10-09T165114-board-outside-code-branches.md`, `…-intent.md`
- Prior art: `2026-10-04T004044-PLAN--native-node-backlog` (the route this replaces), `2026-10-03T122024-PLAN--node-only-board` (server import rule), `2026-09-21T145331-PLAN--backlog-board-002-board-app` (read-only UI, kept)

---

## Next Steps

/add-framework--build docs/plans/2026-10-10T110912-PLAN--board-outside-code-branches.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-10 | Initial creation, with STEP 4 answers 1a (read-only CLI) and 2 (internal migration script; internal projects out of `done_when`) |
| 2026-10-10 | Review fix-then-ok: F21 split into F21a [internal] / F21b [product]; inventory moved to new F9b [internal]; F2 made additive and the old-route removal moved into F4; writer lock rule (30 s wait, `ERROR=board-locked`); F28 records the compared `main` sha and the post-F28 window is a named residual risk; F12 Produces and F15 Consumes completed; F12 skips an already-correct `.gitignore`; F13 stop state stated; RED status of L1.6 and L3.3 stated |
| 2026-10-10 | Status draft to implemented. Built on feat/board-outside-code-branches (commits 459ea04..HEAD), changelog docs/changelog/2026-10-10T131506-refactor-board-outside-code-branches.md. New F-blocks opened by rulings: F3b (clone autocrlf), F2b (git stderr), F16b (add-plan fragment), R1 and R2 (review fixes) |

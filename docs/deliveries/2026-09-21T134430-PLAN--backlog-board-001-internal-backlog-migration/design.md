# Brainstorm: Internal backlog migration — this repository on the product backlog format

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-21
> **Type:** architecture
> **Umbrella:** `2026-09-21T112103-backlog-board-000-umbrella.md`

## Objective

Today the product backlog is structured (`docs/backlog.jsonl` + `backlog.sh`) and the internal one is a
markdown file edited by hand, and neither can be seen visually. When this is done, the framework's own
repository uses the same format and the same scripts as the product for its backlog, the internal pipeline
moves tickets through their lifecycle the way the product pipeline does, and a React board opens any
`docs/backlog.jsonl` for visual, read-only analysis — built and available by default in the workbench
(`npm run setup`), and an opt-in feature a user enables to get it under `.codeadd/` in their project — shaped from day one to grow into an activity-management app.

Serves the objective by moving this repository's board onto the product format and scripts, so every later
subtopic has one format and real data to work on.

## Discovery

- `workbench/commands/add-framework--backlog.md` — 9 steps: read `docs/backlog/index.md`, resolve
  add/update/remove, a bounded project check (no subagents, no graph), a surgical Edit, then commit, fetch,
  rebase (abort on conflict), push to `main`, report the sha. No confirmation gate by design.
- `framwork/.codeadd/scripts/backlog-commit.sh` already owns everything STEPS 5–8 of that command do by hand:
  direct commit on the base branch or a locked detached worktree elsewhere, rebase aborted on conflict, push,
  and a `DEGRADED` line when a step past the write fails.
- `framwork/.codeadd/scripts/backlog.sh` `add` builds the ticket from a fixed field list and **drops any
  other field**; `update` copies every field it receives. So a new field needs `add` changed, not `update`.
- `bash framwork/.codeadd/scripts/status.sh next-id B` returns `0001B` in this repository today — the global
  counter works here (no `docs/features/`, no board yet).
- `.worktrees/` is gitignored here, so `backlog-commit.sh`'s worktree route is safe in this repository.
- `docs/backlog/index.md` holds four items (1.2, 1.4, 2.1, 3.1) in three themes, each with **Scope**, **TLDR**,
  bullets and **Done when**. Item 1.2's text defers it behind 1.4.
- Grep for `docs/backlog` and `backlog/index` over `workbench/`, `scripts/`, `cli/`, `.github/` finds only the
  command and a historical comment in `cli/tests/build-artefact-graph.test.js`. **Design-004's claim that
  `/add-framework--plan` reads the file raw does not hold in the current skill text.**

## Context & Motivation

The two boards diverged the day the product one shipped. The internal board has no id counter, no status and
no script, and design-004 kept it that way on purpose because nobody had asked. The user now asks.

## Problem / Opportunity

- The internal command re-implements, in a prompt, the git route `backlog-commit.sh` already implements and tests.
- Internal items have no status, so "delivered" means "deleted", and the board cannot show progress.
- The product format has no way to carry the layer (`product` / `internal` / `both`) an internal item needs.

## Proposed Solution

1. **Extend the product format with an optional `labels` field** — an array of free strings, no registry,
   default `[]`, like `theme`. `backlog.sh add` accepts it; `update` already does. `search` does not match
   it (it matches title, tldr and notes, unchanged). The format reference gains the row; `backlog.bats` gains
   an assertion that `add` keeps `labels` and still drops an unknown field.
2. **Migrate the four items** with `backlog.sh add` calls, one per item, run once by the build. Mapping:
   `title` ← heading text; `theme` ← the `## N.` theme title; `tldr` ← **TLDR**; `notes` ← bullets, with a
   first note `Formerly item N.M of docs/backlog/index.md.`; `done_when` ← **Done when**; `labels` ← **Scope**
   (`product`, `internal` or `both`); `paths` ← **only** backtick-quoted text in the item that resolves to a
   file or directory existing in the repository, checked before the `add` call — a plan id, a retired
   template, a skill name or a command slug (`/add.build`) stays in `notes` and never enters `paths`;
   `grounded` ← `true` when that check kept at least one path, `false` otherwise, per item; `status: open`. **Order: 1.4, 1.2, 2.1, 3.1** — 1.4 first because 1.2's own text defers it behind 1.4, and
   line order is now the priority.
3. **Delete `docs/backlog/index.md`** in the same commit as the migrated board. `git log --follow` keeps it.
4. **Rewrite `add-framework--backlog`** over the scripts:
   - Reads through `bash framwork/.codeadd/scripts/backlog.sh list|search`.
   - Operations: add, update, comment, move, and **close** (update `status` to `done` or `dropped`).
     `remove` stays only for a ticket written by mistake — closing is how an item leaves the queue now.
   - Writes through `bash framwork/.codeadd/scripts/backlog-commit.sh`. STEPS 5–8 (commit, fetch, rebase,
     push) collapse into that one call, and its `ROUTE`, `SHA`, `PUSHED` and `DEGRADED` keys become the report.
   - Keeps: the bounded project check and its bans, no confirmation gate, never guessing a target.
   - Every add carries exactly one of `product`, `internal`, `both` in `labels`.
5. **Update `AGENTS.md`**: the internal-commands row points at `docs/backlog.jsonl`, and the description says
   it commits through `backlog-commit.sh`.

**Done when:** `bash framwork/.codeadd/scripts/backlog.sh list --all` in this repository returns four tickets
in the order 1.4, 1.2, 2.1, 3.1, each carrying one layer label and a `Formerly item N.M` first note, with
`TICKETS_TOTAL=4` and `DAMAGED_LINES=0`; `docs/backlog/index.md` no longer exists; `backlog.bats` passes with
the new `labels` assertion; and one `/add-framework--backlog` add run on `main` reports `ROUTE=direct`, a `SHA`
and `PUSHED=yes`.

Alternatives: keep markdown and build a converter for the board (rejected at the umbrella — a second
format reader); add a `scope` field (rejected — noise in every one-layer project, the reason the format
already gives); encode the layer in `theme` (rejected — loses the real theme grouping).

## Type of Artefact

A product script and format extension, an internal command rewrite, a data migration.

## Scope

### Includes
- `labels` in `backlog.sh add`, the format reference and `backlog.bats`
- The four items migrated, `docs/backlog/index.md` deleted
- `add-framework--backlog` rewritten over `backlog.sh` / `backlog-commit.sh`
- `AGENTS.md` row

### Does NOT Include
- Filtering `list` by label (the board filters client-side; the script's filters stay as they are)
- The lifecycle (003)
- Any change to `backlog-commit.sh`
- Editing `docs/deliveries/` or old changelogs that cite item numbers — they are history

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Supersede design-004's "the format stays markdown" | "uses the same format" | User request; the "read raw" reason is answered by `backlog.sh list` and the board, and no skill reads the markdown raw today | ✅ |
| Optional `labels: string[]` on the product format | carrying the internal layer without an internal-only field | Generic, useful to users, filterable on the board; `scope` was rejected by the format for good reason | ✅ |
| Internal command calls the product scripts by repository path | "the same scripts" | `add-framework--done` already calls `delivered.sh` this way; this repository is the scripts' source | ✅ |
| Migration order 1.4, 1.2, 2.1, 3.1 | a correct priority on day one | Line order is the priority now, and 1.2 defers itself behind 1.4 | ✅ |
| Old item numbers survive as a first note | old changelogs and commits stay traceable | They cite "item 1.2"; the new id is `0001B`-style | ✅ |
| Items leave the queue by status, not by deletion | the board shows progress | A `done` column is what the board and the lifecycle need; delete-on-delivery erased that | ✅ |
| Migration runs as one-off `backlog.sh add` calls in the build, not as a shipped script | no dead code | It runs once, over four items | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `workbench/commands/add-framework--backlog.md` (internal) | none (graph, depth 1) | Rewritten | rewrite |
| `framwork/.codeadd/scripts/backlog.sh` (product) | `add-backlog` (RUNS_SCRIPT) | `add` keeps `labels` | small change + bats |
| `add-doc-schemas/references/backlog.md` (product) | `add-backlog`, `add-doc-schemas` | New optional field row; the "no scope field" paragraph points at `labels` | edit |
| `framwork/.codeadd/scripts/tests/backlog.bats` (product) | not a node | New assertion | add |
| `framwork/.codeadd/scripts/backlog-commit.sh` (product) | `add-backlog` (RUNS_SCRIPT) | New caller, unchanged | none |
| `add-backlog` skill (product) | add.brainstorm, add.new, add.plan, add.build, add.done | May pass `labels`; not required | none |
| `docs/backlog/index.md` | not a node; only reader is the command | Deleted | delete |
| `docs/backlog.jsonl`, `docs/backlog.definitions.json` (internal data) | not nodes | Created | create |
| `AGENTS.md` | not a node — graph cannot see it | Row text | edit |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One tested git route instead of a prompt-driven one | Reading the board as a markdown document |
| Status and history per ticket | Item numbers as identity (they become notes) |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| `labels` makes a product ticket line differ from what other readers expect | Low | Optional, default `[]`; `delivered.sh`-style readers ignore unknown keys; bats pins it |
| A bullet with markdown formatting reads oddly as a note string | Low | Notes keep the markdown text verbatim; the board renders notes as markdown |
| Migration drops a bullet | Low | The build diffs bullet count per item against the old file before deleting it |

## Next Steps

Run: `/add-framework--plan docs/brainstorming/2026-09-21T112103-backlog-board-001-internal-backlog-migration.md`

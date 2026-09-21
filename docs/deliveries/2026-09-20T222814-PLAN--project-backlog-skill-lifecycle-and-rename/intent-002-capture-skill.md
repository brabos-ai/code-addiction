---
path: architectural
topic: project-backlog-002-capture-skill
doc: docs/brainstorming/2026-09-20T104517-project-backlog-002-capture-skill.md
delivery: confirm
---

## Decided

- Subtopic 002 of the set whose umbrella is
  `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`. The umbrella's objective is
  copied verbatim into the design; this subtopic serves it by making the write cheap enough to happen
  mid-flow. 001 is delivered and is consumed exactly as shipped — no file it produced is reopened.
- New product skill `framwork/.codeadd/skills/add-backlog/SKILL.md`, registered in
  `framwork/provider-map.json` under `skills` as `"add-backlog": {}` — the default distribution every
  other skill uses. One file, no `references/` subdoc; 003 adds the one it needs.
- **Two entry points, split by whether anything is committed.** Reads (`list`, `search`) call
  `backlog.sh` directly and run anywhere, a non-git directory included. Writes (`add`, `update`,
  `comment`, `move`, `remove`) go through a new script.
- New shipped script `framwork/.codeadd/scripts/backlog-commit.sh`. It **wraps** the write: resolves
  the base branch, puts itself on it, runs `backlog.sh` inside that tree, commits, rebases, pushes and
  cleans up — one process, one trap. `backlog.sh` is not touched, so its asserted "never commits"
  promise stands.
- **Route selection is one test:** `git rev-parse --abbrev-ref HEAD` equals the name
  `get-main-branch.sh` returned → direct route. Anything else, a detached HEAD included → worktree
  route. 003's `/add.done` hook depends on the direct route by name, so the test is fixed here, not
  left to the builder.
- The worktree is `.worktrees/backlog`, fixed name, never parallel, and `.worktrees/` is appended to
  `.gitignore` when absent — the same convention `build-setup.sh` already ships.
- **`git worktree lock` is held for the whole capture.** The stale sweep that runs before every write
  removes an **unlocked** `.worktrees/backlog` and, on a **locked** one, removes nothing and fails
  loud naming `git worktree unlock`. That is what keeps the sweep from deleting a live capture's tree.
  Removal is `git worktree remove` with no `--force`, matching `done.sh`.
- Staging is the two paths by name — `docs/backlog.jsonl` and `docs/backlog.definitions.json` — never
  `-A` and never `.`, because the commit goes to the base branch.
- **Four degradations, none of them a failure of the write:** `get-main-branch.sh` exit 1 (not a git
  repository) and exit 2 (no base branch) both leave the ticket in the working tree, uncommitted, with
  the report naming which; a refused push leaves the commit on the local base branch and reports the
  sha; a rebase conflict runs `git rebase --abort` and does the same. The repository is never left
  mid-rebase, and the write is never discarded.
- The commit sha is the confirmation gate. The skill writes and reports; it never asks first.
- The bounded project check is ported by meaning from `add-framework--roadmap` STEP 3: read the files
  the request names, plus `git grep` of its own terms over tracked files (which honours `.gitignore`
  for free). **Capped** — no subagent, no artefact graph or MCP, no reading plans or feature
  documents. It fills `paths[]`, `done_when` and `grounded`.
- `grounded: false` is a valid outcome. The ticket is recorded as the user stated it and the report
  says it is ungrounded.
- No flag grammar. The user says what they want and the skill resolves the mode. The **one stop** is
  an ambiguous target for `update`, `comment`, `move` or `remove`: list the candidates and ask.
- The `description` field is the whole trigger surface and gets the same care as a command name.
- New bats suite `framwork/.codeadd/scripts/tests/backlog-commit.bats`, picked up by `run-bats.js`'s
  fixed glob. It covers at least: the no-remote case, the refused push, a seeded rebase conflict, a
  capture launched from inside a linked worktree, and the locked-worktree refusal.
- Out of scope: `work_id` and every status transition (003), the five command hooks (003), any change
  to `backlog.sh`, `backlog.bats` or `references/backlog.md` (001), the internal layer (004).

## Delivery constraint

Built in a **separate git worktree**, not in the primary checkout. Carried from the umbrella intent,
where the user asked for it at approval time.

## Open
None

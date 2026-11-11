# Brainstorm: Project Backlog 002 — the capture skill

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** skill + script (product layer)
> **Umbrella:** `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`

## Objective

Today a user of the framework has nowhere to record "what to do next" inside their own project. The
idea dies in the chat, or it becomes a full plan far too early. When this is done, a **skill** writes
that intent into a file in the user's repository — with real paths and a check someone can actually
run — so that it still means something weeks later. The internal equivalent is renamed to
`add-framework--backlog` so both names match.

**Serves the objective by** making the write cheap enough to happen mid-flow, which is what stops the
intent dying in the chat. 001 built the place; this subtopic builds the thing that writes to it and
gets the write onto a branch that survives.

## Discovery

- **`framwork/.codeadd/scripts/backlog.sh`** (delivered by 001, read in full) — seven modes,
  `KEY=VALUE` output then raw JSONL, exit 0 / 1 / 2, `REFUSED=<name>` on a hard ban. Its header
  states twice that **it runs no git command at all**, and `backlog.bats` asserts it. Every decision
  below is bounded by that promise.
- **`framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`** (delivered by 001) — the
  thirteen ticket fields, the required three (`title`, `tldr`, `done_when`), `grounded`, and the
  write-refuses / read-reports split on an undefined status. This subtopic adds no field and changes
  no rule there.
- **`.claude/commands/add-framework--roadmap.md` STEP 3** — the bounded project check this design
  ports by meaning: read only what the request names plus a grep of its own terms, and explicitly
  **no subagent, no artefact graph, no plan reading**. Its stated reason is the one that carries over:
  a command that starts analysing here has stopped recording intent and started doing the work.
- **`.claude/commands/add-framework--roadmap.md` STEPs 5–8** — the git route ported by meaning:
  stage one path, commit it alone, fetch and rebase, report what else the push carries, push. Its
  "the sha is the undo, so there is no confirmation gate" argument is the one this skill reuses.
- **`framwork/.codeadd/scripts/build-setup.sh`** — the shipped worktree precedent. `.worktrees/<name>`,
  the directory appended to `.gitignore` when absent, `git worktree add -b <branch> <path> <base>`,
  and the existence check by `git worktree list --porcelain`.
- **`framwork/.codeadd/scripts/done.sh`** — `git worktree remove` without `--force`, so a dirty
  worktree fails loud instead of being discarded. Also the start guard that refuses to run from
  inside a linked worktree, which this design needs the inverse of.
- **`framwork/.codeadd/scripts/get-main-branch.sh`** — the base-branch resolver. Exit 0 with a name,
  **1 when not a git repository, 2 when no base branch is found** — and its header states it
  deliberately does not fall back to "main", because the caller needs to know.
- **`framwork/.codeadd/skills/add-commit/SKILL.md`** — the precedent for a product skill performing a
  mid-flow git action, and the source of the feature-scoped staging rule this design deliberately
  does **not** reuse (it stages two paths by name, never `-A`).
- **Delivery index** — `history backlog.sh` returns one `live` entry, the 001 delivery of
  2026-09-20. `history add-backlog` resolves no node: nothing under that name has ever shipped, and
  nothing was dropped.

## Context & Motivation

001 shipped a script with no caller. `backlog.sh` is installed in every project that updated, and
nothing in the framework calls it — a user who does not know it exists has a board they cannot reach.
This subtopic is what turns that script into a capability.

The moment being served is specific: the user is mid-build, notices something that should be done
later, and says so. The write has to cost one turn and has to land somewhere that survives the branch
being abandoned. Those two requirements pull against each other, and resolving that tension is most of
this design.

## Problem / Opportunity

Three things stand between the script and the moment:

1. **Nothing triggers it.** A skill is reached by its `description` matching what the user said. That
   field is the entire trigger surface.
2. **Nothing grounds it.** A ticket reading "fix the review thing" is worthless in three weeks. The
   ticket needs real paths and a runnable check, and getting them means reading the project — without
   turning capture into analysis.
3. **Nothing publishes it.** `backlog.sh` writes a file in the current working tree. Mid-build that
   tree is a feature branch, and a ticket on an abandoned feature branch is the one failure the
   artefact exists to prevent.

## Proposed Solution

A product skill, `add-backlog`, plus **a second shipped script that owns the git route**.

- Reads (`list`, `search`) call `backlog.sh` directly. Nothing is committed, so nothing else is needed.
- Writes (`add`, `update`, `comment`, `move`, `remove`) call a new `backlog-commit.sh`, which resolves
  the base branch, puts itself on that branch (directly or through a temporary worktree), runs
  `backlog.sh` **inside** that tree, commits the two files by path, rebases, pushes, and removes the
  worktree in a trap.

The skill owns *when* and *why*: the trigger, the bounded project check that fills the ticket, the
decision of which mode to run, and the report. The scripts own the mechanics.

### Alternatives considered

| Alternative | Why not |
|---|---|
| The skill runs the git commands itself, step by step | A trap is a shell feature and a skill has no process to hang one on. Six git commands in sequence is six places a run can stop and leave a worktree behind. The umbrella's own risk table asked for a trap and assigned it to 001 — but 001 shipped a script that runs no git, so the trap has nowhere to live unless a second script exists |
| One script: extend `backlog.sh` to commit | Directly contradicts what 001 delivered. Its header states the promise twice and `backlog.bats` asserts it, with the reason stated: a script that commits cannot be called from the middle of a build without disturbing that build's history. Reads would start committing, or the promise would become conditional |
| Two calls — a publish script that opens the worktree, then `backlog.sh` inside it | The trap would span neither call. A failure between them is exactly the leak the trap exists to prevent |
| No worktree: build the commit with plumbing (`git show <base>:docs/backlog.jsonl`, `hash-object`, `commit-tree`, `update-ref`) | Genuinely cleaner — nothing touches the working tree and there is nothing to leave behind. Rejected on cost: `backlog.sh` addresses `docs/backlog.jsonl` by fixed relative path and `backlog.bats` pins it, so the plumbing route means reopening a delivered script and its suite. The worktree route runs the shipped script unchanged |
| Write on the current branch and let `/add.done` carry the ticket to the base branch at merge | A ticket captured on a branch that is abandoned, or never merged, is lost — and those are the branches whose ideas most need recording |
| Ask the user before committing | The umbrella already settled it: the sha is the undo. Asking costs the turn the mid-flow capture was supposed to save |

## Type of Artefact

| Artefact | Layer | New or changed |
|---|---|---|
| `framwork/.codeadd/skills/add-backlog/SKILL.md` | product | new |
| `framwork/.codeadd/scripts/backlog-commit.sh` | product | new |
| `framwork/.codeadd/scripts/tests/backlog-commit.bats` | product | new |
| `framwork/provider-map.json` | product | one line — `"add-backlog": {}` under `skills` |

## Scope

### Includes

- The skill's `description` — its only trigger surface — and the `When to Use` / `When NOT to Use` pair.
- The bounded project check: what it reads, what it is forbidden from reading, and how its result
  fills `paths[]`, `done_when` and `grounded`.
- How the skill maps what the user said onto one of the seven modes, without a flag grammar.
- `backlog-commit.sh`: the base-branch resolution, the one test that picks the direct route over the
  worktree route, the worktree lock and the sweep that respects it, the trap, the staging-by-path
  rule, the rebase and its abort, the push, and every degradation.
- The report the skill emits, through the product `add-final-report`.
- Reading: `list` and `search`, including how `DAMAGED_LINE` and `UNDEFINED_STATUS` are surfaced.
- Registration in `provider-map.json`.

### Does NOT Include

- Any change to `backlog.sh`, `backlog.bats` or `references/backlog.md`. 001 is delivered and this
  subtopic consumes it as shipped.
- The `work_id` field and every status transition driven by a command. That is 003 — this skill
  writes `work_id: null` on `add` (which is what `backlog.sh` already does) and never touches it again.
- The hooks in the five commands. That is 003.
- Any change to the internal layer. That is 004.
- A reading interface. Excluded by the umbrella.
- Ticket creation without the user asking. Excluded by the umbrella.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| A **second script, `backlog-commit.sh`**, owns the git route — the skill calls it | the "write lands somewhere durable" half | A trap needs a process. This is also the only way to keep 001's asserted "never commits" promise intact while still committing | ✅ |
| `backlog-commit.sh` **wraps the write**: it opens the tree, runs `backlog.sh` inside it, commits, pushes, cleans up — one process, one trap | the "write lands somewhere durable" half | Splitting it into "open the tree" and "write" leaves a gap the trap does not span, which is the leak the trap exists to prevent | ✅ |
| **Reads never go through it.** `list` and `search` call `backlog.sh` directly | the "cheap to write to" half | A read commits nothing, so a route that resolves a branch and may open a worktree is pure cost. It also keeps the read path working in a directory that is not a git repository at all | ✅ |
| The **worktree route, not git plumbing** | the "write lands somewhere durable" half | Plumbing is cleaner and was rejected on cost only: it requires reopening `backlog.sh`'s fixed path and its delivered bats suite. The worktree runs the shipped script unchanged. Recorded here so a later reader knows it was weighed, not missed | ✅ |
| The worktree lives at **`.worktrees/backlog`**, and `.worktrees/` is appended to `.gitignore` when absent | the "write lands somewhere durable" half | Exactly what `build-setup.sh` already does, including the gitignore line. A second convention for the same directory is a second thing to learn | ✅ |
| **One worktree name, reused, never parallel.** A second capture while one is open fails loud | the "write lands somewhere durable" half | A per-capture unique name multiplies what a crash can leave behind, and nothing needs two concurrent captures | ✅ |
| The worktree is **locked with `git worktree lock` the moment it is created**, and unlocked immediately before it is removed | the "write lands somewhere durable" half | The lock is what tells a live capture apart from a leaked one. Without it the sweep below has no way to know, and a second capture would delete the first one's tree mid-commit — which is the silent loss this whole design is written against. `git worktree lock` is plain git and needs no lock file of our own | ✅ |
| **Stale means unlocked.** The sweep removes an unlocked `.worktrees/backlog`; on a **locked** one it removes nothing and **fails loud**, naming the path and `git worktree unlock` as the manual way out | the "write lands somewhere durable" half | This is what reconciles the sweep with "never parallel": the sweep only ever deletes a tree no process claims. A locked tree means either a live capture or a crash that died holding the lock, and a human decides which | ✅ |
| The worktree is removed with **`git worktree remove` and no `--force`** | the "write lands somewhere durable" half | `done.sh` already makes this call for the same reason: a dirty worktree fails loud instead of being silently discarded | ✅ |
| **The sweep runs on every write, before anything else** | the "write lands somewhere durable" half | The umbrella's mitigation named `list` as the reporter. A read is the wrong place — it is the path that does no git. The write already resolves git state, so the sweep costs nothing there |  ✅ |
| **The route is chosen by one test: `git rev-parse --abbrev-ref HEAD` equals the name `get-main-branch.sh` returned.** Equal → direct. Anything else, a detached HEAD included → worktree | the "write lands somewhere durable" half | 003's `/add.done` hook depends on this by name — post-merge the tree is on the base branch and must take the direct route. A test left to the builder is a test 003 cannot rely on. A detached HEAD is not the base branch, so it takes the worktree, which is the safe side of the only ambiguous case | ✅ |
| `get-main-branch.sh` **exit 1 and exit 2 both degrade, neither fails** | the "write lands somewhere durable" half | Exit 1 is "not a git repository", exit 2 is "no base branch found". Both are real states for a real project. The ticket is still written to the working tree, nothing is committed, and the report says which of the two it was. Never discard the write | ✅ |
| **A rebase conflict aborts the rebase and keeps the commit.** `git rebase --abort`, the commit left on the local base branch, and the report says the push did not land and why | the "write lands somewhere durable" half | `backlog-commit.sh` rebases with nobody present to resolve anything, and `move` rewrites the whole file, which is the shape most likely to collide. Leaving a repository mid-rebase is the one outcome worse than an unpushed commit. `add-framework--roadmap` carries the same "never resolve a rebase conflict" rule | ✅ |
| A **refused push degrades the same way**: the commit stays on the local base branch and the report says so, loudly | the "write lands somewhere durable" half | Protected branches and rulesets are common. A commit that is local is still durable across the session; a discarded write is not | ✅ |
| Staging is **the two paths by name**, never `-A` and never `.` | the "write lands somewhere durable" half | This commit goes to the base branch. `add-framework--roadmap` carries the same stop block for the same reason, and `add-commit`'s feature-scoped staging is deliberately not reused here | ✅ |
| **The commit sha is reported and is the whole undo.** No confirmation gate | the "cheap to write to" half | Carried from the umbrella. Asking would cost the turn that capture exists to save | ✅ |
| The bounded check uses **`git grep`** over tracked files | the "cheap to write to" half | It honours `.gitignore` for free, so `node_modules/`, build output and `.codeadd/` fall out without an exclusion list this skill would have to maintain per ecosystem | ✅ |
| The bounded check is **capped**: no subagent, no artefact graph or MCP, no reading plans or feature documents | the "cheap to write to" half | Ported verbatim in meaning from `add-framework--roadmap` STEP 3. Analysis here is how a one-turn capture becomes a session | ✅ |
| **`grounded: false` is a valid outcome, not a failure.** The ticket is written as the user stated it and the report says it is ungrounded | the "cheap to write to" half | 001 made `grounded` required precisely so a reader can tell the two apart. A skill that refused to record an ungrounded thought would lose the thought | ✅ |
| **No flag grammar.** The user says what they want and the skill resolves the mode | the "cheap to write to" half | Same call `add-framework--roadmap` makes — free text in, operation resolved from it. A user mid-build does not stop to look up a subcommand | ✅ |
| An ambiguous target for `update`, `comment`, `move` or `remove` **stops and lists the candidates** | the "work comes back out" half | The one stop this skill keeps. Writing a comment onto the wrong ticket is worse than one question, and it is the same ruling `add-framework--roadmap` STEP 2 makes | ✅ |
| The skill's whole trigger surface is its `description`, and it names the **words a user actually says** | the "cheap to write to" half | The umbrella graded "the skill is never triggered" a high risk. 003's hooks are the other half of the answer; this is the half that lives here | ✅ |
| The skill is **one file** — no `references/` subdoc | the "cheap to write to" half | The git route's mechanics live in `backlog-commit.sh`'s own header, which is where CLAUDE.md says a script's contract lives. 003 adds `references/lifecycle.md` because it has a procedure five commands share; this subtopic has no such thing | ✅ |

## Ecosystem Impact

`Called by` cells come from `impact <name> --depth 1` on the current graph, **except the two script
rows, which are marked and were read off disk** — see the note under the table. No command is changed
by this subtopic, so the fragment second-query rule has no subject here; it binds 003 instead, where
it is applied per command.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `add-backlog` (new skill) | nothing yet — 003's five hooks become its first callers | n/a | create, register in `provider-map.json` under `skills` as `{}` (the default distribution every other skill uses) |
| `backlog-commit.sh` (new script) | `add-backlog` only | n/a | create, ship verbatim, cover with bats |
| `backlog.sh` | **NOT FROM THE GRAPH — read off disk.** `impact backlog.sh --depth 1` returns zero, and that is true of every script here: the graph models no script-to-script call. On disk: nothing calls it today; `add-backlog` and `backlog-commit.sh` become its first callers | none — consumed exactly as delivered | none |
| `get-main-branch.sh` | **NOT FROM THE GRAPH — read off disk.** `impact get-main-branch.sh --depth 1` returns zero although `build-setup.sh` calls it. On disk: `build-setup.sh`, and `backlog-commit.sh` becomes a second caller | none | none |
| `add-final-report` (product) | 13 direct dependants: commands `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.pull-request`, `add.qa-setup`, `add.review`, `add.wiki`, and skill `add-subagent-driven-development` | `add-backlog` becomes a 14th caller; the skill itself does not change | none |
| `framwork/provider-map.json` | not a node | one registration | edit |
| `cli/src/installer.js` | not a node | none — it never touches `docs/`, which is what protects a user's board and definitions across a reinstall | verified, no change |
| `framwork/.codeadd/scripts/tests/` | not nodes — `cli/tests/` and `.bats` files produce no graph node | one new suite | create |

**What the graph cannot see here, and was checked by hand:**

- **Script-to-script calls are not edges at all.** `impact get-main-branch.sh --depth 1` returns zero
  dependants although `build-setup.sh` calls it, and `dependencies build-setup.sh` returns zero the
  other way. Both script rows above are therefore marked and were read off disk — a `RUNS_SCRIPT`
  edge exists only from a command, a skill or a fragment, never from another script.
- **`scripts/run-bats.js` discovers suites through a fixed glob**, so `backlog-commit.bats` is picked
  up with no registration. Top-level `scripts/` produces no nodes, so nothing would have reported it.
- **The product-parity test asserting zero `add-framework--` strings in product artefacts** (named in
  001's design and in plan `2026-09-16T205633-PLAN--product-pipeline-parity`) binds every file this
  subtopic writes. `cli/tests/` are not nodes; the constraint reaches the build from here or nowhere.
- **`.gitignore` is not a node.** `backlog-commit.sh` appends `.worktrees/` to it when absent, the way
  `build-setup.sh` already does, and nothing in the graph records that relationship.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A ticket that reaches the base branch regardless of which branch the user was standing on | A temporary worktree per write, and a dependency on the base branch being resolvable |
| 001's "never commits" promise survives intact, asserted by its own suite | A second script, and a second header to keep honest |
| Reads work anywhere, including outside a git repository | Two entry points into the same board, which a reader has to learn |
| Capture costs one turn and needs no flag grammar | A resolution step that can be ambiguous, and one stop where it is |

| Risk | Probability | Mitigation |
|---|---|---|
| The worktree is left behind by a crash between commands | Med | A trap in `backlog-commit.sh` unlocks and removes it, and every write starts with the sweep. Two independent chances, and the second runs even if the process died before the trap could |
| The sweep deletes a worktree a concurrent capture is actively using | Low | It cannot: the tree is locked for the whole capture, and the sweep removes only an unlocked one. A locked tree makes the second capture fail loud instead |
| A capture dies holding the lock, so every later write fails loud until a human intervenes | Low | The failure names the path and `git worktree unlock`. Loud-and-stuck is the correct trade against a sweep that can destroy a live tree, and the situation is one command to clear |
| `git worktree remove` fails because the worktree is dirty | Low | No `--force`, matching `done.sh`. It fails loud and the report names the path. A silent discard of someone's tree is the worse outcome |
| The fetch-and-rebase conflicts, with nobody present to resolve it | Med | `git rebase --abort`, the commit stays on the local base branch, and the report says the push did not land. The repository is never left mid-rebase. `backlog-commit.bats` covers it with a seeded conflict |
| The push is refused — protected branch, ruleset, or no remote | High | The commit stays on the local base branch, the report says the push did not land, and the sha is printed. `backlog-commit.bats` covers the no-remote case directly |
| The base branch cannot be resolved (`get-main-branch.sh` exit 1 or 2) | Med | The ticket is written to the working tree and nothing is committed. The report says which of the two it was. The write is never discarded |
| The user is already inside a linked worktree when they capture | Med | `get-main-branch.sh` still resolves, and the worktree route works from a linked worktree because `git worktree add` operates on the shared repository. `backlog-commit.bats` pins this case — `done.sh` refuses it and this must not |
| The skill is never triggered, because the user does not know to describe the thing they want | High | The `description` field gets the same care as a command name and names the words a user says. 003's hooks are the other half, and they are a separate subtopic precisely because this half is not enough on its own |
| Two captures race and collide on one worktree name | Low | The name is fixed and the second run fails loud rather than opening a parallel tree. Nothing in the flow needs two concurrent captures |
| The bounded check grows into analysis | Med | The cap is written as prohibitions, not advice, and names the three routes it forbids — subagent, graph, plan. This is the failure `add-framework--roadmap` STEP 3 already had to be written against |

## Next Steps

Run: `/add-framework--plan project-backlog-002-capture-skill`

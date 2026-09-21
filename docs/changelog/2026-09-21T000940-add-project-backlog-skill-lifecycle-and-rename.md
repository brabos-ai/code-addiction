# Project backlog — the capture skill, the ticket lifecycle and the internal rename

> **Date:** 2026-09-21
> **Plan:** `docs/plans/2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename.md`
> **Layer:** both

Subtopics 002, 003 and 004 of the project-backlog set, delivered as one plan. Subtopic 001 shipped
`backlog.sh` with no caller at all — every project that updated carried a board nobody could reach.
This gives it a caller, wires it into the pipeline, and makes the internal board use the same word.

## Added

- **`framwork/.codeadd/scripts/backlog-commit.sh`** — the git route for a board write. It wraps
  `backlog.sh` so a ticket reaches the **base branch** whatever branch the caller stood on. One test
  picks the route: the current branch equals the name `get-main-branch.sh` returned → direct;
  anything else, a detached HEAD included → a temporary worktree at `.worktrees/backlog`, created
  **detached** so it works even when the base branch is checked out in another worktree. The
  worktree is held under `git worktree lock` for the whole capture, and the sweep that runs before
  every write removes only an unlocked leftover — a locked one is refused, untouched. Every failure
  past the write degrades rather than failing: `not-a-git-repo`, `no-base-branch`, `no-remote`,
  `push-refused`, `rebase-conflict`, `base-checked-out-elsewhere`. A rebase conflict is aborted,
  never resolved. Reads are refused — they commit nothing and go straight to `backlog.sh`.
- **`framwork/.codeadd/scripts/tests/backlog-commit.bats`** — 18 assertions. Seventeen were written
  RED before the script existed; the eighteenth is below, under what the review caught.
- **`framwork/.codeadd/skills/add-backlog/`** — the skill a user reaches by saying "note this for
  later". It resolves the intent from their own words with no subcommand to learn, runs a capped
  project check (what the request names plus one `git grep` — no subagent, no graph, no plan read),
  and reports the `TICKET_ID` and the sha. There is no confirmation gate: the sha is the undo.
  Registered in `framwork/provider-map.json`.
- **`framwork/.codeadd/skills/add-backlog/references/lifecycle.md`** — the one procedure the five
  pipeline commands share. Declared, never inferred: a command acts on a ticket only because a
  document names its id. Only `add.build` and `add.done` write the board, and both already do git
  writes. Both read the ticket first and skip when it already holds the target status, so a resumed
  close-out writes nothing twice. No degradation ever stops a command.

## Changed

- **`add.brainstorm`** — resolves a ticket id (the literal pattern `[0-9]{4}B`) from the invocation,
  reads it as exploration input, and records `ticket:` in the files each path already writes. A spike
  writes no file, so it names the ticket in its report instead.
- **`add.new`** — reads `ticket:` from the intent file and copies it into `about.md` on the line
  after `branch:`. Nothing more: its READ-ONLY GUARANTEE stands, and `work_id` belongs to the build.
- **`add.plan`** — reads the ticket at STEP 4 and writes its `done_when` into `plan.md` under the
  objective, where the reviewer can check the plan against the user's own definition of finished.
- **`add.build`** — STEP 2, right after `build-setup.sh` returns: one write setting `work_id` and
  `doing`. The result reaches STEP 18's report.
- **`add.done`** — a new 8.3 closes the ticket once the merge has landed, on either route, and STEP 9
  reports it.
- **`add-doc-schemas/references/new-feature.md`** — `ticket:` joins the `about.md` frontmatter as an
  optional field, outside the validation gate's required set.
- **The internal board is renamed.** `workbench/commands/add-framework--roadmap.md` is now
  `add-framework--backlog.md`, with its registry entry, its `CLAUDE.md` row and the one test that
  asserted the old name, all in one commit. `docs/roadmap/index.md` is now `docs/backlog/index.md`.
  **The names match; the formats deliberately do not** — the internal board stays markdown with
  numbered items, because reading it raw is how it is used.

## Fixed

- **The internal board's own history citations.** `docs/backlog/index.md` tells its reader, twice, to
  run `git log` on it to find a delivered item's text. After a rename, plain `git log` stops at the
  rename — measured here, it sees 1 commit where `--follow` sees 20. All three citations now say
  `git log --follow`.

## What the review caught

One adversarial pass, four auditors, seven findings: five applied, two rejected.

**Four of the five applied findings had one shape.** A hook promised a fact at its own site and never
delivered it at the destination:

- `add.plan` read the ticket into `${TICKET}` "beside `${OBJECTIVE}`" — but the objective is copied
  into `plan.md` at STEP 9.1 and the ticket went nowhere.
- `add.build` promised the ticket result in STEP 18's report; STEP 18 had no line for it.
- `add.done` promised it in STEP 9; STEP 9 had no line for it.
- `add.brainstorm` told a spike to name its ticket in 5.1 — from inside 5.3, which a spike never runs.

Two different auditors found this independently. It was this build's systematic blind spot, and it is
the thing to check first on the next hook anyone adds: not whether the promise is made, but whether
the step it points at keeps it.

The fifth: the plan named "the refused push" among `backlog-commit.bats`' cases, and the first cut
covered only the no-remote one. L1.5b now drives a remote that refuses every push. Because the script
already existed it was written green, then proven to bite by breaking the `push-refused` branch on
purpose and watching it go red.

## Not included

- Any change to `backlog.sh` or `backlog.bats`. Subtopic 001 is delivered; the one line of it this
  plan touches is the sentence in `references/backlog.md` that told the two boards apart by a word
  that no longer does.
- Creating a ticket automatically, or matching work to a ticket by inference.
- The other seven product commands.
- Migrating the internal board to JSONL.
- **Re-anchoring the internal board's delivery history.** Both index entries for the 2026-09-09
  delivery of the old command carry the node `internal/command/add-framework--roadmap`, which this
  rename removed, so `history` finds them under neither name. A text search still does. The fix is an
  edit to `docs/delivered.jsonl`, which is the record and is not edited here — the close-out's verify
  step owns re-anchoring.

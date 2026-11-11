---
path: architectural
topic: project-backlog-003-ticket-lifecycle
doc: docs/brainstorming/2026-09-20T104517-project-backlog-003-ticket-lifecycle.md
delivery: confirm
---

## Decided

- Subtopic 003 of the set whose umbrella is
  `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`. The umbrella's objective is
  copied verbatim into the design; this subtopic serves it by letting the work come back out.
  **Depends on 002** — every board write goes through the script 002 creates.
- **One field, `ticket: <id>`**, carried by documents that already travel the pipeline: the brainstorm
  document, the brainstorm intent file, and `about.md` frontmatter. The same road `branch:` already
  takes. In `about.md` it is **optional** — a required field would fail every hand-written document in
  a project that never uses the board.
- **Declared, never inferred.** A command acts on a ticket only because a document names its id. No
  keyword matching, no similarity, ever. Carried from the umbrella's own exclusion list.
- **The invocation names a ticket by its id, matched as the literal pattern `[0-9]{4}B` anywhere in
  the argument string.** No flag, no prefix word, no new grammar. A `ticket:` naming an id that is not
  on the board is reported and the run continues with no ticket — an id is exact, so there is no
  ambiguity that would need a question.
- **Only two of the five commands write to the board, and both already do git writes:**

  | Command | Hook | Where | Writes the board? |
  |---|---|---|---|
  | `/add.brainstorm` | new sub-step STEP 1.1 resolves and reads the ticket; `ticket:` written at STEP 3 (document) and STEP 5.3 (intent file) | STEP 1.1, 3, 5.3 | no |
  | `/add.new` | STEP 1.1 reads `ticket:` from the intent file; STEP 2 copies it into the skeleton `about.md` frontmatter, on the same line as `branch:` | STEP 1.1, 2 | no |
  | `/add.plan` | reads `ticket:` from `about.md`, carries `done_when`, `notes[]`, `paths[]` into planning | STEP 4 | no |
  | `/add.build` | **one write** setting `work_id` to `FEATURE_ID` and `status` to `doing` | STEP 2, after `build-setup.sh` returns | yes |
  | `/add.done` | sets `status` to `done` | STEP 8, after the merge | yes |

- **`/add.new` writes no board state**, deliberately. It declares a READ-ONLY GUARANTEE twice ("NO git
  writes — branch is created later by /add.build"), and a board write travels through
  `backlog-commit.sh`, which commits and pushes. Rather than carve an exception into a shipped
  invariant, `work_id` moves to `/add.build` STEP 2 and rides the same `update` as `doing` — where
  `FEATURE_ID` is already in hand, and where one worktree serves both fields.
- **`/add.brainstorm` writes `ticket:` only where its path already writes something:** architectural →
  the document and the intent file; bounded → the intent file only; **spike → neither.** STEP 2's
  routing table and STEP 5.3 already say a spike produces no file, and a hook must not be the first
  thing in the command to break its own path table. On a spike the ticket is read for context and
  named in the final report.
- **Both board writes read the ticket first and skip when it already holds the target status.**
  Idempotent by construction, no Resume guard of its own. `/add.done` was rebuilt around a four-state
  `INDEX_ENTRY` cross with a Resume route whose sub-steps carry explicit "do not run this again"
  guards; reading first is cheaper than a sixth guard, and it covers a re-run `/add.build` too.
- **`/add.done` closes the ticket after the merge**, at STEP 8 — the moment the work is real, and the
  one moment the tree is already on the base branch, so 002's direct route applies and no worktree
  opens.
- **Hooks write the shipped default status names** (`doing`, `done`). A `REFUSED=unknown-status` from a
  user who renamed them is reported and passed over. Reading the definitions file's `order` field as a
  semantic is rejected: 001 defined `order` as the sort order `list` groups by, and nothing else.
- **No degradation is a stop.** Absent board, unknown id, refused status, unreachable base branch —
  each is one line in the command's final report and the command continues. The board is a
  side-record; a build that fails because a ticket could not be moved has inverted the relationship.
- The procedure lives in **one reference**, `framwork/.codeadd/skills/add-backlog/references/lifecycle.md`,
  plus its row in the skill's reference table. Each of the five commands carries **one line** pointing
  at it — the pattern `add-doc-schemas` already sustains across 21 callers.
- `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` gains `ticket:` as an optional
  field in the `about.md` frontmatter table.
- **Every hook's insertion point is checked against the fragments injecting into that command**, as a
  named build step per command. All five carry injection markers; a hook landing inside an anchor
  breaks feature injection at install time and no graph query or build gate reports it.
- Out of scope: creating a ticket (no command ever does), inference of any kind, the seven commands
  the umbrella did not name, any change to `backlog.sh` / `backlog-commit.sh` / `references/backlog.md`,
  a `BACKLOG_OPEN:` line in `status.sh`, and re-opening a `done` ticket.

## Delivery constraint

Built in a **separate git worktree**, not in the primary checkout. Carried from the umbrella intent,
where the user asked for it at approval time.

## Open
None

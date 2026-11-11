# Brainstorm: Project Backlog — a ticket board that lives in the repository

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** architecture (umbrella — a product skill, a script, a schema, a command-side lifecycle, and one internal rename)

## Objective

Today a user of the framework has nowhere to record "what to do next" inside their own project. The
idea dies in the chat, or it becomes a full plan far too early. When this is done, a **skill** writes
that intent into a file in the user's repository — with real paths and a check someone can actually
run — so that it still means something weeks later. The internal equivalent is renamed to
`add-framework--backlog` so both names match.

## Discovery

- **`.claude/commands/add-framework--roadmap.md`** — the internal writer this design ports by meaning.
  `impact --depth 1` returns **zero dependants**; its only outbound edge is `USES_SKILL →
  internal/skill/add-final-report`. The rename is graph-cheap.
- **`framwork/.codeadd/scripts/delivered.sh` + `docs/delivered.jsonl`** — the exact pattern this design
  reuses: a script with `write`/`read`/`verify` modes over a JSONL, whose *format* is declared outside
  the script in `add-doc-schemas/references/delivery-index.md`, covered by bats.
- **`framwork/.codeadd/skills/add-commit`** — the precedent for a product **skill** (not a command)
  that performs a mid-flow git action. It is reachable from inside a running command; a slash command
  is not.
- **Plan `2026-09-11T014333-PLAN--product-close-out-parity`** — established that the product layer must
  not borrow an internal `docs/` path shape, because the internal repo's directory layout does not
  exist in a user's project. It corrected `docs/changelog/CHG[NNNN].md` to `<feature-dir>/changelog.md`
  for that reason.
- **Plan `2026-09-16T205633-PLAN--product-pipeline-parity`** — "port by meaning, never copy internal
  names or wording", enforced by a build-time test asserting zero `add-framework--` strings in product
  artefacts.
- **Plan `2026-09-16T170340-PLAN--the-pipeline-chains`** — explicitly excluded `--roadmap` from the
  command-to-skill pipeline conversion: it stays a standalone command, not a pipeline stage. The
  rename in 004 does not change that.
- **Delivery index** — `history add-framework--roadmap` returns one `live` entry (2026-09-09, plan
  `2026-09-09T065116-PLAN--roadmap-command`). `history` on `roadmap`, `backlog`, `add.roadmap` and
  `add.backlog` resolves no node: nothing under either name has ever shipped in the product layer, and
  nothing was dropped.

## Context & Motivation

The framework has a pipeline for work that is **about to start** (`add.brainstorm` → `add.plan` →
`add.build` → `add.done`) and an index of work that is **finished** (`docs/delivered.jsonl`). It has
nothing for work that is **decided but not started**. The internal layer solved this for itself in
September 2026 with `add-framework--roadmap`; the product layer never got it.

The gap shows up in a specific way: mid-build, the user notices something that should be done later.
The two available moves are both wrong. Saying it in chat loses it at the end of the session. Opening
a plan for it stops the work in progress and produces a document far heavier than the thought
deserves.

## Problem / Opportunity

Three things are missing, and they are separable:

1. **A durable place.** A file in the repository, committed, that survives the session and the machine.
2. **A cheap way to write to it.** Something reachable from inside another command's run, in one turn,
   that does not derail the work in progress.
3. **A way for the work to come back out.** When a ticket is picked up, the commands that do the work
   should know they are working from a ticket, reference it, and close it.

## Proposed Solution

A **ticket board in the repository**: `docs/backlog.jsonl`, one JSON line per ticket, line order is the
priority. A shipped script `backlog.sh` owns the file. A product skill — not a command — writes and
reads through it. The existing commands gain one small hook each: if the work came from a ticket,
reference it and close it.

**Vocabulary, fixed for the whole set:** the **backlog** is the file; one entry is a **ticket**.

### Alternatives considered

| Alternative | Why not |
|---|---|
| A markdown file with numbered themes, mirroring the internal `docs/roadmap/index.md` | Rejected by the user in favour of a machine-readable format. A script can feed and query JSONL, and a reading interface can be built over it later; neither is true of headings and bullets. |
| A single `docs/backlog.json` holding an array | Any write re-serialises the whole array, so a one-ticket edit can produce a whole-file diff depending on the formatter. That is the exact defect `add-framework--roadmap` carries a stop block about ("DO NOT regenerate the file"), arriving through the back door. With JSONL, "one ticket changed means one line changed" is a mechanical check. |
| JSONL with an explicit numeric `rank` field | Inserting a ticket in the middle forces a rank change on everything below it — the rewrite the field was meant to avoid. Line order carries the same information for free. |
| A command `add.backlog` instead of a skill | A slash command is not reachable from inside a running `/add.build`, and mid-flow capture is the main use. Registered as a `command`, it would also build to `commands/{name}.md` on Claude/Cursor/OpenCode and `skills/{name}/SKILL.md` on Codex/Antigravity — two shapes for one artefact, for a reach that is not wanted. |

## Type of Artefact

Umbrella over five artefacts across both layers:

| Artefact | Layer | New or changed |
|---|---|---|
| `framwork/.codeadd/skills/add-backlog/SKILL.md` | product | new |
| `framwork/.codeadd/scripts/backlog.sh` | product | new |
| `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` | product | new reference under an existing skill |
| `add.brainstorm`, `add.new`, `add.plan`, `add.build`, `add.done` | product | changed — one hook each |
| `.claude/commands/add-framework--roadmap.md` renamed to `add-framework--backlog.md` | internal | renamed |

## Scope

### Includes

- `docs/backlog.jsonl` — one ticket per line, line order is the priority.
- `docs/backlog.definitions.json` — the status vocabulary: the possible statuses, what each means, and
  their order. Created on first use with defaults; user-editable from then on.
- `framwork/.codeadd/scripts/backlog.sh` — sole owner of both files. Modes covering add, update,
  remove, move, list and search.
- `framwork/.codeadd/skills/add-backlog/SKILL.md` — the skill the user triggers by description, and
  the skill a command loads when work comes from a ticket.
- A bounded project check before writing a ticket, so the entry names real paths.
- The git route to the base branch, including the temporary-worktree case.
- The ticket lifecycle in the five existing commands.
- The internal rename, `add-framework--roadmap` to `add-framework--backlog`.

### Does NOT Include

- A reading interface (web or TUI). The format is chosen so one can be built; building one is not this
  work.
- Any sync with an external tracker (Jira, Linear, GitHub Issues).
- Automatic ticket creation. A ticket is written because the user asked for one.
- Matching a finished delivery to a ticket by inference. `add.done` closes the ticket the work
  *declared*, never one it guessed.
- Migrating existing projects. A project with no `docs/backlog.jsonl` simply has an empty backlog.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| A **skill**, not a command | the "cheap to write to" half | Capture happens mid-flow, inside another command's run. A skill is loadable from there; a slash command is not. `add-commit` is the existing precedent for a product skill performing a mid-flow git action | ✅ |
| **JSONL**, one ticket per line, line order is the priority | the "durable place" half | A one-ticket edit is a one-line diff, which is mechanically checkable. A JSON array re-serialises wholesale — the defect the internal command already has a stop block against | ✅ |
| A **stable `id`** per ticket, never reused, separate from line order | the "durable place" half | The internal `N.M` is priority and identity at once, which is why its removal rule has to forbid renumbering. Splitting them removes the conflict instead of guarding it | ✅ |
| `status` field, with `open`/`doing`/`done`/`dropped` as the shipped default | the "work comes back out" half | A board without "what we decided not to do" loses the half that is worth keeping. In JSONL that costs one field on one line | ✅ |
| A **`docs/backlog.definitions.json`** the script validates against | the "work comes back out" half | The status vocabulary is the user's workflow, not the framework's. A definitions file the script does not enforce is decoration, so an unknown status is refused | ✅ |
| The definitions file is **created when absent and never rewritten** | the "durable place" half | It holds user customisation. It sits under `docs/`, which `cli/src/installer.js` never overwrites — it only touches `.codeadd/` and the provider dirs — so the protection is structural, not a rule someone must remember | ✅ |
| `comments: [{content, created_at}]` per ticket | the "work comes back out" half | A ticket picked up weeks later needs what was learnt since it was written. Appending a comment is an append to an array on one line | ✅ |
| A **script owns both files**; the skill never writes them directly | the "durable place" half | This is what makes the format testable with bats and what a future interface reads against. `delivered.sh` over `docs/delivered.jsonl` is the shipped precedent | ✅ |
| The **schema lives in `add-doc-schemas/references/backlog.md`**, not in the script | the "durable place" half | The same split `delivered.sh` declares in its own header: the script implements the reference, it does not extend it | ✅ |
| Commit and push to the **base branch**, via a temporary worktree when the user is elsewhere | the "durable place" half | A ticket stranded on an abandoned feature branch is the one failure the artefact exists to prevent. A worktree reaches the base branch without touching the user's working tree, and works on plain git — the framework cannot assume `gh`, which is why `add.done` keeps a local route | ✅ |
| The commit **is** the confirmation gate | the "cheap to write to" half | The same argument the internal command records: the sha is the undo, so the skill writes and reports instead of asking first. Asking would cost the turn the mid-flow capture was supposed to save | ✅ |
| **No `scope: internal or product` field** | the "durable place" half | That field exists because this repository has two layers. A user's project has one, so the field would be noise in every ticket | ✅ |
| The ticket lifecycle is **one small hook per command**, with the mechanics in the skill | the "work comes back out" half | Five commands each carrying the full procedure is five copies to drift. One line per command pointing at one skill is the framework's own pattern | ✅ |

## Ecosystem Impact

All `Called by` cells are filled from `impact <name> --depth 1`, and every command below was checked a
second time with `dependencies <fragment>` for each fragment injecting into it, per the fragment rule
in `add-artefact-graph`.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `add-backlog` (new skill) | nothing yet — the five commands in 003 become its first callers | n/a | create, register in `provider-map.json` under `skills` |
| `backlog.sh` (new script) | `add-backlog` only | n/a | create, ship verbatim, cover with bats |
| `add-doc-schemas` | 21 direct dependants: `plan-reviewer-agent`; commands `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.pull-request`, `add.qa-setup`, `add.review`, `add.wiki`; fragment `qa-pipeline/add.review.md`; skills `add-cross-sf-consistency`, `add-feature-specification`, `add-id-convention`, `add-qa`, `add-qa-spec`, `add-setup-contract`, `add-token-efficiency` | additive only — a new file under `references/` | add `references/backlog.md`, list it in the skill's reference table |
| `add.brainstorm` | `add` (HANDS_OFF_TO), `add.new` (HANDS_OFF_TO). **No fragment injects into it** | one hook: reference the ticket in the document when the work came from one | edit |
| `add.new` | `add`, `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, and skills `add-doc-schemas`, `add-feature-specification`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline` (all HANDS_OFF_TO). **Fragment:** `plugins/gitnexus/fragments/add.new.md` (INJECTS_INTO), which dispatches `plan-reviewer-agent` and uses `add-gitnexus` | one hook: reference the ticket in the feature document | edit |
| `add.plan` | 21 dependants incl. agents `consistency`, `test`, `ux`, `ux-flow`; commands `add`, `add.build`, `add.diagnose`, `add.new`, `add.review`. **Fragments:** `qa-pipeline/add.plan.md`, `tdd-pipeline/add.plan.md`, `plugins/gitnexus/fragments/add.plan.md` — all three dispatch the full agent set (`architecture`, `backend`, `consistency`, `database`, `discovery`, `frontend`, `plan-reviewer`, `qa`, `readback`, `ux`, `ux-flow`) | one hook: read the ticket as input when the work came from one | edit |
| `add.build` | 20 dependants incl. `add.done`, `add.plan`, `add.review`, `add.qa-setup`, agents `consistency`, `ux`. **Fragments:** `qa-pipeline/add.build.md`, `tdd-pipeline/add.build.md`, `plugins/gitnexus/fragments/add.build.md` — dispatching `backend`, `database`, `e2e`, `fix`, `frontend`, `test`, `readback`, `reviewer`, `ux` and running `status.sh` | one hook: move the ticket to `doing` | edit |
| `add.done` | `add`, `add.build`, `add.plan`, `add.pull-request`, `add.review`, `add-doc-schemas`, `add-qa`, and fragment `qa-pipeline/add.review.md` (HANDS_OFF_TO). **Fragments injecting into it:** `docs-pruning/add.done.md`, `plugins/gitnexus/fragments/add.done.md` — both running `converge-gates.sh`, `delivered.sh`, `done.sh`, `hotfix-gates.sh`, `qa-evidence.sh` | one hook: close the declared ticket | edit |
| `add-final-report` (product) | 13 dependants: commands `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.pull-request`, `add.qa-setup`, `add.review`, `add.wiki`, and skill `add-subagent-driven-development` | `add-backlog` becomes a 14th caller; the skill itself does not change | none |
| `.claude/commands/add-framework--roadmap.md` | **zero dependants** (`impact --depth 1`). Depends on `internal/skill/add-final-report` | renamed | rename file and node; sweep `CLAUDE.md` by hand — **the graph does not see `CLAUDE.md`** |
| `docs/roadmap/index.md` | not a node — not an artefact | renamed alongside the command | rename, and sweep every reference by grep |
| `framwork/provider-map.json` | not a node | two new registrations | edit |
| `cli/src/installer.js` | not a node | none — it never touches `docs/` | verified, no change |

**What the graph cannot see here, and was checked by hand:**

- `CLAUDE.md` is not a node. Its "Internal commands" table names `add-framework--roadmap` and its
  `docs/roadmap/index.md` path; 004 must grep and fix it, because no gate will.
- Top-level `scripts/` produces no nodes, so nothing reports what depends on `build.js`. The new
  script and skill are registered the normal way and need no change there.
- `cli/tests/` are not nodes. The build-time test asserting zero `add-framework--` strings in product
  artefacts binds 001–003 and is named in each subtopic.

## Decomposition Map

| Subtopic | Design Path | Serves the objective by | Purpose |
|---|---|---|---|
| Format and script | `2026-09-20T104517-project-backlog-001-format-and-script.md` | building the durable place, which is the half without which nothing else has anywhere to write | `docs/backlog.jsonl` and `docs/backlog.definitions.json`: the ticket fields, the status vocabulary and its ordering, the comment array, the id rule, the create-when-absent rule. `backlog.sh` and its modes, exit codes and bats suite. The schema reference under `add-doc-schemas` |
| The capture skill | `2026-09-20T104517-project-backlog-002-capture-skill.md` | making the write cheap enough to happen mid-flow, which is what stops the intent dying in the chat | `add-backlog/SKILL.md`: how it is triggered by description, the bounded project check that grounds a ticket in real paths, the git route to the base branch including the temporary worktree, the report shape, and `list`/`search` |
| The ticket lifecycle | `2026-09-20T104517-project-backlog-003-ticket-lifecycle.md` | letting the work come back out, so the board is part of the flow instead of a notebook beside it | The one hook each in `add.brainstorm`, `add.new`, `add.plan`, `add.build` and `add.done`, and the reference under `add-backlog` that carries the procedure so the five commands carry one line |
| The internal rename | `2026-09-20T104517-project-backlog-004-internal-rename.md` | making the two names match, so the internal artefact and the product one stop describing the same thing under different words | `add-framework--roadmap` to `add-framework--backlog`, `docs/roadmap/index.md` to its new path, the node rename, and the by-hand `CLAUDE.md` sweep the graph cannot gate |

## Dependencies & Relationships

- **001 first.** Nothing can be written before the file format and the script that owns it exist.
- **002 depends on 001.** The skill calls the script; it cannot be designed against modes that are
  still open.
- **003 depends on 001 and 002.** The five hooks read and write tickets through the same skill.
- **004 depends on nothing.** It is a rename in the internal layer and can be planned and delivered at
  any point in the set. It is placed last because it is the least valuable, not because it is blocked.

Recommended refinement order: 001, 002, 003, 004.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A durable, machine-readable board in the repository, with a script and a future interface both able to read it | Human readability of the raw file. The internal markdown roadmap is read directly; `docs/backlog.jsonl` needs `backlog.sh list` to be legible |
| Capture that costs one turn mid-flow, reachable from inside a running command | Discoverability. A skill triggered by description is never invoked by a user who does not know it exists. The five hooks in 003 are the partial answer |
| A ticket that arrives at the base branch regardless of where the user was standing | A temporary worktree per write, and a dependency on the base branch being pushable |
| The status vocabulary belongs to the user's workflow, not the framework's | A second file to keep consistent with the first, and a validation path in the script |

| Risk | Probability | Mitigation |
|---|---|---|
| The push to the base branch is refused — protected branch, ruleset, or no remote | High | The script degrades: it commits the ticket on the current branch instead and says so in the report, loudly. It never silently discards the write. 002 owns the exact fallback |
| The temporary worktree is left behind after a failure | Med | The script removes it in a trap, and `list` reports a stale worktree it finds. 001 owns this |
| The skill is never triggered, because the user does not know to describe the thing they want | High | The `description` field is the whole trigger surface and gets the same care as a command name. The five hooks in 003 surface the board from inside the flow the user is already in |
| A user edits `docs/backlog.definitions.json` into a state the existing tickets contradict — a status in use that is no longer defined | Med | The script reports such tickets on `list` rather than refusing to run. Refusing would lock the user out of their own board over a config edit |
| The JSONL is hand-edited and a line stops parsing | Med | `backlog.sh` reports the offending line number and continues with the rest, the way `delivered.sh read` tolerates a damaged index |
| 003's hooks drift apart across five commands | Med | The procedure lives in one reference under `add-backlog`; each command carries one line pointing at it. This is the pattern `add-doc-schemas` already uses across 21 callers |
| The rename in 004 leaves a stale pointer in `CLAUDE.md` | High | `CLAUDE.md` is not a node and no gate sees it. 004 carries an explicit by-hand grep step; it is named in the subtopic rather than left to the build to remember |

## Next Steps

This is an umbrella. `/add-framework--plan` runs per **refined subtopic**, never on the umbrella
itself — the precedent on disk is `2026-09-11T010158-product-close-out-parity`, whose `-001-` and
`-002-` members each carry their own `Status: final` line. Refine in the stated order:

```
/add-framework--brainstorm vamos refinar format and script -> ref: 2026-09-20T104517-project-backlog-000-umbrella.md
/add-framework--brainstorm vamos refinar capture skill -> ref: 2026-09-20T104517-project-backlog-000-umbrella.md
/add-framework--brainstorm vamos refinar ticket lifecycle -> ref: 2026-09-20T104517-project-backlog-000-umbrella.md
/add-framework--brainstorm vamos refinar internal rename -> ref: 2026-09-20T104517-project-backlog-000-umbrella.md
```

Each refinement writes its own design and its own intent file, and each one is what
`/add-framework--plan` is then given.

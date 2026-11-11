# Brainstorm: Internal ticket lifecycle — the internal pipeline moves tickets like the product one

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-21
> **Type:** workflow
> **Umbrella:** `2026-09-21T112103-backlog-board-000-umbrella.md`

## Objective

Today the product backlog is structured (`docs/backlog.jsonl` + `backlog.sh`) and the internal one is a
markdown file edited by hand, and neither can be seen visually. When this is done, the framework's own
repository uses the same format and the same scripts as the product for its backlog, the internal pipeline
moves tickets through their lifecycle the way the product pipeline does, and a React board opens any
`docs/backlog.jsonl` for visual, read-only analysis — built and available by default in the workbench
(`npm run setup`), and an opt-in feature a user enables to get it under `.codeadd/` in their project — shaped from day one to grow into an activity-management app.

Serves the objective by making `add-framework--brainstorm → plan → build → done` carry a declared ticket and
move it to `doing` and `done`, so the board in this repository changes as work happens instead of by hand.

## Discovery

- `framwork/.codeadd/skills/add-backlog/references/lifecycle.md` — the product procedure. Rules: a ticket is
  **declared, never inferred** (a `ticket:` field names it); **no command creates a ticket**; only build and
  done write, each **reading first and skipping when the ticket already holds the target**; build writes
  `status: doing` + `work_id` **in one write**, right after its setup returns; done writes `done` **after the
  merge**; `REFUSED=unknown-status` is reported and the command continues; no board failure stops a command.
  One ticket is read with `backlog.sh list --all | grep '"id":"<id>"'`.
- Internal carriers: the brainstorm design document (a blockquote header, no frontmatter), the intent file
  (frontmatter with `delivery:`), the plan document. Their shapes are owned by `add-plan-authoring`
  (`The Intent File`, plan naming).
- Graph, depth 1: `add-plan-authoring` is used by `add-framework--plan`, `--build`, `--done`; the brainstorm
  reads its `The Intent File` section by name. So all four stages already reach it.
- Internal work has no `[NNNN][L]` id. Its identity everywhere — ledger, delivery index, `docs/deliveries/` —
  is the plan basename.
- Build anchors: `STEP 1` loads the plan, `STEP 1.3` may create a worktree, `STEP 5.1` opens the ledger before
  the first F-block. Done anchors: `STEP 7` merges via `gh`, `STEP 8` cleans up, `2.4`/`2.5` are recovery and
  resume routes.

## Context & Motivation

After 001 the internal board has statuses, but only a human moves them. The product pipeline already solved
this with a small, idempotent procedure. The internal pipeline should follow the same rules so the board shows
the truth without anyone remembering to update it.

## Problem / Opportunity

- A ticket picked up by the internal pipeline stays `open` until someone edits it.
- Nothing links a ticket to the plan that delivered it.

## Proposed Solution

**Rules live in one place: a new `## The Ticket` section in `add-plan-authoring`.** It states the internal rows
below and the product's invariant rules in short form (declared never inferred; no stage creates a ticket;
read first, skip when already there; unknown status is reported, never worked around; a board failure never
stops a stage). An HTML comment (stripped at build) names `add-backlog/references/lifecycle.md` as the model.
Each stage carries one line pointing at the section — none restates it.

| Stage | Where | Does | Writes the board? |
|---|---|---|---|
| `add-framework--brainstorm` | STEP 1.1 resolves; 5.2 and 7.3 record | Matches `[0-9]{4}B` in the invocation, reads the ticket, uses its `title`, `tldr`, `notes`, `paths`, `done_when` as exploration input. Records `> **Ticket:** <id>` in the design header (architectural) and `ticket: <id>` in the intent frontmatter (bounded, architectural). Spike: names it in the report, writes nothing | no |
| `add-framework--plan` | when it reads the intent file | Copies `ticket:` into the plan document header and writes the ticket's `done_when` under the plan's objective | no |
| `add-framework--build` | STEP 5.1, right after the ledger is opened, before the first F-block | Reads the ticket; unless it already reads `doing` with `work_id` = this plan's basename, one write: `{"status":"doing","work_id":"<plan basename>"}` via `backlog-commit.sh update` | **yes** |
| `add-framework--done` | after STEP 7's merge, before STEP 8 — and on the 2.4 recovery route after its merge | Reads the ticket; unless it already reads `done`, writes `{"status":"done"}` via `backlog-commit.sh update` | **yes** |

- A direct build (no plan) carries no ticket and touches no board.
- **After the plan, the plan document is the only carrier.** Build and done read `ticket:` from it, never
  from the intent file.
- Board writes use `bash framwork/.codeadd/scripts/backlog-commit.sh`. From a feature branch that is the
  worktree route: the ticket reaches `main` without touching the build's branch history.
- **`work_id` holds the plan basename in this repository.** The format reference's `work_id` row gains:
  "or, in the framework's own repository, the plan basename". The script does not validate its shape, so
  nothing else changes.

**Done when:** a delivery started as `/add-framework--brainstorm <NNNN>B …` leaves `ticket:` in its intent
file and plan header; after its build passes STEP 5.1 the ticket reads `status: doing` with `work_id` equal to
the plan basename; after its close-out merges the ticket reads `done`; and re-running the close-out's resume
route writes no second commit to the board.

Alternatives: a new internal skill for the lifecycle (rejected — a new artefact that four stages would load,
where `add-plan-authoring` already reaches all four); pointing each stage straight at the product
`lifecycle.md` (rejected — its rows name product commands and product steps, and the internal reader would
translate them every run).

## Type of Artefact

workflow — four internal skill edits, one internal skill section, one product reference line.

## Scope

### Includes
- `## The Ticket` in `add-plan-authoring`
- One pointer line in each of the four stages, at the step in the table
- The intent file and plan header gain an optional `ticket:`
- The `work_id` row line in `add-doc-schemas/references/backlog.md`

### Does NOT Include
- Creating tickets from the pipeline — only the user, through `add-framework--backlog`
- Carrying the ticket id into `docs/delivered.jsonl`
- Any board change for direct builds or hotfix-style work outside a plan
- Changes to `backlog-commit.sh` or `backlog.sh`

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Same rules as the product lifecycle | "the way the product pipeline does" | They are tested in use; a second set of rules would diverge | ✅ |
| Rules live in `add-plan-authoring` | one place for four stages | It already owns the intent file and the plan document, and all four stages reach it | ✅ |
| `work_id` = plan basename | linking a ticket to its delivery | It is the internal work's identity in the ledger, index and deliveries folder | ✅ |
| Build writes at STEP 5.1, after the ledger opens | the board never says `doing` for a build that did not start | Mirrors the product's "after build-setup.sh returns" | ✅ |
| Done writes after the merge, on the normal and the recovery route | the board never says `done` for work that did not land | Mirrors the product; the read-first rule makes the resume route safe | ✅ |
| Design documents carry the ticket in the blockquote header | internal design docs have no frontmatter | Match the existing header lines rather than add frontmatter to one document type | ✅ |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-plan-authoring` (internal) | add-framework--build, --done, --plan | New `## The Ticket` section; intent file and plan header gain `ticket:` | edit |
| `add-framework--brainstorm` (internal) | none (graph, depth 1) | Resolve, read, record | edit |
| `add-framework--plan` (internal) | add-framework--brainstorm (HANDS_OFF_TO), add-framework--build (USES_SKILL) | Copy ticket and `done_when` | edit |
| `add-framework--build` (internal) | add-framework--done, add-framework--plan, building-commands | One board write at 5.1 | edit |
| `add-framework--done` (internal) | add-framework--build (HANDS_OFF_TO) | One board write after merge | edit |
| `add-doc-schemas/references/backlog.md` (product) | add-backlog, add-doc-schemas | `work_id` row line | edit |
| `add-backlog/references/lifecycle.md` (product) | add.brainstorm, add.new, add.plan, add.build, add.done, add-backlog | Model only | none |

None of the four stages has fragments injected into it (internal skills carry no feature markers), so the
depth-1 answers above are complete for them.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| The board moves as work moves | Two more git writes to `main` per ticketed delivery |
| A ticket links to the plan that delivered it | — |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A board write races another write to `main` | Low | `backlog-commit.sh` rebases and aborts on conflict, reporting `DEGRADED`; the stage continues |
| A resumed `done` writes twice | Low | Read first, skip when already `done` |
| The user renamed `doing`/`done` | Low | `REFUSED=unknown-status` reported, stage continues |

## Next Steps

Run: `/add-framework--plan docs/brainstorming/2026-09-21T112103-backlog-board-003-internal-ticket-lifecycle.md`

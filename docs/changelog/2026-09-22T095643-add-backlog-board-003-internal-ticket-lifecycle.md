# Internal ticket lifecycle — the internal pipeline moves tickets on the board

> **Date:** 2026-09-22
> **Plan:** `docs/plans/2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle.md`
> **Layer:** both

Third subtopic of the backlog-board set (`docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md`).
After 001 the framework's own board had statuses, but only a human moved them. Now a ticket named in a
brainstorm travels through the pipeline and the board follows the work: `doing` when the build starts,
`done` when the close-out merges. The rules are the product lifecycle's, applied to the internal stages.

## Added

- **`## The Ticket` in `add-plan-authoring`** — the one place the rules live: a ticket is declared, never
  inferred; no stage creates one; each write reads first and is skipped when the ticket already holds its
  target; an unknown status or a degraded write is reported and never stops a stage. It carries the
  per-stage table, how one ticket is read (`backlog.sh list --all | grep '"id":"<id>"'`) and the two
  `backlog-commit.sh update` writes.
- **`ticket:`** — an optional field in the intent file; **`> **Ticket:**`** and **`**Ticket done when:**`** —
  optional lines in the plan template.

## Changed

- **`add-framework--brainstorm`** — STEP 1.1 resolves a `[0-9]{4}B` id from the invocation and reads the
  ticket as exploration input; the design header and the intent file carry it; STEP 7.2 names it on every
  path, so a spike — which writes no file — still reports it.
- **`add-framework--plan`** — reads `ticket:` from the intent file and writes the plan's Ticket line and the
  ticket's `done_when`. It never writes to the board.
- **`add-framework--build`** — STEP 5.1, right after the ledger opens and before the first F-block, marks
  the ticket `doing` with `work_id` = the plan basename, in one write. A build that stops at its design gate
  leaves no claim on the board. STEP 10 reports the outcome.
- **`add-framework--done`** — the first act of STEP 8 marks the ticket `done`: the first point the normal,
  resume and recovery routes share once the delivery is on `main`, and before the local plan is removed.
  STEP 9 reports the outcome.
- **`add-doc-schemas/references/backlog.md`** — `work_id` may hold a plan basename in the framework's own
  repository.

## Removed

- Nothing.

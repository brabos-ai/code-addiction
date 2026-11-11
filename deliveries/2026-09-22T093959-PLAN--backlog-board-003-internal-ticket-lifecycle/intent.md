---
path: architectural
topic: backlog-board-003-internal-ticket-lifecycle
doc: docs/brainstorming/2026-09-21T112103-backlog-board-003-internal-ticket-lifecycle.md
delivery: confirm
---

## Decided
- Member 003 of the set `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md`; 001 and 002 are merged (PRs #87, #88), so the board and `labels` it depends on exist on `main`
- Everything under the design's Key Decisions and Proposed Solution stands as reviewed (plan-review verdict `ok`)
- Rules live in a new `## The Ticket` section of `add-plan-authoring`; each stage carries one pointer line, none restates them
- `work_id` holds the plan basename; the format reference's `work_id` row says so
- Build writes `doing` + `work_id` at STEP 5.1 after the ledger opens; done writes `done` after the merge on the normal and recovery routes; both read first and skip when already there
- The user asked for the plan now; the build is a separate invocation

## Open
None

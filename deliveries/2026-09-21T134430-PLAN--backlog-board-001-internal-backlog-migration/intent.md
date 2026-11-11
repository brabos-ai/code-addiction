---
path: architectural
topic: backlog-board-001-internal-backlog-migration
doc: docs/brainstorming/2026-09-21T112103-backlog-board-001-internal-backlog-migration.md
delivery: automatic
---

## Decided
- Member 001 of the set `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md`; plan 001 → 002 → 003 → 004, one plan and one PR each — this intent covers 001 only
- The internal board adopts the product format and scripts; design-004's "format stays markdown" is superseded — user request, and no skill reads the markdown raw today
- Optional generic `labels: string[]` added to the product format and to `backlog.sh add`; the internal board carries its layer there — `scope` stays rejected as noise in one-layer projects
- Four items migrated by one-off `backlog.sh add` calls in the order 1.4, 1.2, 2.1, 3.1, each with a `Formerly item N.M` first note — line order is the priority and 1.2 defers itself behind 1.4
- `paths` keeps only backtick text that resolves to an existing repository path; `grounded` is per item — true when that check kept a path
- `docs/backlog/index.md` is deleted in the migration commit
- `add-framework--backlog` is rewritten over `backlog.sh` (reads) and `backlog-commit.sh` (writes); items leave the queue by status (`done`/`dropped`), `remove` only for mistakes; no confirmation gate, bounded project check kept
- `AGENTS.md` internal-commands row updated

## Open
None

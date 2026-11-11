---
path: architectural
topic: project-backlog-001-format-and-script
doc: docs/brainstorming/2026-09-20T104517-project-backlog-001-format-and-script.md
delivery: automatic
---

## Decided

- Subtopic 001 of the set whose umbrella is
  `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`. The umbrella's objective is
  copied verbatim into the design; this subtopic serves it by building the durable place.
- New shipped script `framwork/.codeadd/scripts/backlog.sh`, owning `docs/backlog.jsonl` and
  `docs/backlog.definitions.json` in the user's project. Modelled on `delivered.sh`: `set -u` never
  `-e`, `node` a hard dependency checked first, `KEY=VALUE` output, exit 0 for probe results, 1 only
  on a refused write, 2 for caller error with `REFUSED=<name>`.
- `docs/backlog.jsonl` — one JSON object per line, UTF-8, LF, **line order is the priority**. Fields:
  `id`, `title`, `theme`, `tldr`, `notes[]`, `done_when`, `paths[]`, `grounded`, `status`,
  `created_at`, `updated_at`, `comments[{content, created_at}]`, `work_id`.
- Modes: `add` (pure append at the end), `update <id>`, `comment <id>`, `move <id>
  --top|--after <id>|--bottom` (the only reordering mode), `remove <id>`, `list`, `search <query>`.
  `add`/`update`/`comment` take the record as JSON on **stdin**, following `delivered.sh write`.
  The rest take their id or query positionally.
- Every write that is not `move` leaves all other lines byte-identical, and `backlog.bats` asserts it.
- Ticket ids are `[NNNN][L]` with letter `B`, from the **shared** counter. Both `next-id.sh` and
  `status.sh next-id` are changed, because `status.sh` reimplements the scan rather than calling
  `next-id.sh` and already diverges (allowlist `F|H|PRD|CHG`, exit 2 on anything else).
- The allocator **greps the raw file** for `[0-9]{4}[A-Z]`; it never parses JSON. Neither script gains
  a `node` dependency. A damaged JSONL line still yields its id, so allocation is never blocked by
  one.
- `backlog.bats` asserts both allocators return the same id for the same tree — with a backlog
  present and with none. This is the only gate holding the two implementations equal.
- `status.sh` is touched **only** in its `next-id` subcommand. No `BACKLOG_OPEN:` report line.
- `docs/backlog.definitions.json` holds the status vocabulary (`open`, `doing`, `done`, `dropped`,
  each with an `order` and a `means`). Created when absent, **never rewritten**; the rule is restated
  in the script header, the way `build-ledger.sh` and `task-brief.sh` each restate theirs.
- An unknown status on a **write** is refused. A status present in the log that the definitions no
  longer define is **reported by `list`**, never a reason to refuse reading.
- A damaged line is reported by number and skipped; the rest still answers.
- No atomic writes, no CRLF conversion — matching every other JSONL writer here.
- New reference `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`, opening by
  disclaiming the doc-schema conventions the way `delivery-index.md` does, plus its row in the skill's
  reference table.
- `framwork/.codeadd/scripts/tests/backlog.bats`, discovered by `run-bats.js` through its fixed glob.
- Out of scope here: the `add-backlog` skill (002), the command hooks (003), the git route and the
  worktree (002 — this script writes files and never commits).

## Delivery constraint

Built in a **separate git worktree**, not in the primary checkout. Carried from the umbrella intent,
where the user asked for it at approval time.

## Open
None

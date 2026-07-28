# Receipt Schemas

Docs in this category are **machine-first install receipts**: a command records what it materialized into the user's project, under which contract, and which decisions the user took. They exist so a later framework version can compute whether the project's state is current, and so a deliberate `no` is never mistaken for an unfinished install.

All machine state lives in frontmatter. The body carries only `## TL;DR` and `## Decision Log`, which keeps the H2 count at 2 — below the universal TOC threshold — so no rule in `SKILL.md` is relaxed for this category.

## Schema: `setup-receipt`

**Produced by:** any command that materializes state into the user's project. First consumer: `/add.qa-setup`.
**Path convention:** ``<command's doc root>/<command name without the `add.` prefix>.md`` — e.g. `add.qa-setup` writes `docs/qa/qa-setup.md`.
**ID:** `RCPT-<command name>` — e.g. `RCPT-add.qa-setup`. Slug-based, not sequenced.

### Frontmatter

```yaml
---
id: RCPT-add.qa-setup
type: setup-receipt
created: 2026-07-27
updated: 2026-07-27
related: []
command: add.qa-setup
setup-contract: 1
framework-version: 0.7.0
first-run: 2026-07-27
last-run: 2026-07-27
materialized:
  - path: docs/qa/config.json
    owner: setup
    hash: sha256:1f3a...
  - path: .claude/skills/qa-project/SKILL.md
    owner: setup
    hash: sha256:9c02...
  - path: docs/features/0001F-entries/_tests/screens.json
    owner: shared
    hash: null
prereqs:
  playwright-test: installed
  chromium: already-present
  playwright-mcp: declined
qa-pipeline-feature: enabled
migration:
  detected: [cypress]
  decision: declined
  decided-at: 2026-07-27
---
```

### Field rules

| Field | Rule |
|---|---|
| `id` | `RCPT-<command name>`, e.g. `RCPT-add.qa-setup`. Slug-based, never sequenced |
| `type` | Always the literal `setup-receipt` |
| `created` | ISO date the receipt file was first written. Never rewritten |
| `updated` | ISO date of the most recent write, advanced on every run — including a no-op |
| `related` | YAML list of related doc IDs. `[]` when none |
| `command` | The command that owns this receipt, e.g. `add.qa-setup`. One receipt per command; never merge two commands into one file |
| `setup-contract` | Integer. The contract version in force when the recorded state was materialized. Read by `status.sh` with a frontmatter-bounded grep — it MUST be a bare integer on its own line, never quoted, never inline-commented |
| `framework-version` | Informational only. Never compared to compute staleness — a release that did not touch the command must stay silent |
| `first-run` | ISO date of the first setup run. Never rewritten once set |
| `last-run` | ISO date of the most recent run, **including a verified-current no-op**. A run that changed nothing still advances this field — a verified-current run is information, not nothing |
| `materialized[].owner` | `setup` (this command is the sole writer) or `shared` (another command also writes it) |
| `materialized[].hash` | `sha256:<hex>` of the file content for `owner: setup`. **MUST be `null` for `owner: shared`** — hashing a co-owned file produces permanent false drift |
| `prereqs.<name>` | One of: `installed` (this run installed it), `already-present` (functionally verified before this run), `declined` (offered, user said no), `failed` (attempted, verification still fails), `not-offered` (never reached) |
| `qa-pipeline-feature` | One of: `enabled`, `already-enabled`, `declined`, `enable-noop` |
| `migration.detected` | YAML list of tooling ids, **sorted alphabetically**, from the STEP 5 scan. `[]` when nothing was found. This list IS the fingerprint — do not hash it |
| `migration.decision` | One of: `none-found`, `declined`, `migrated`, `not-offered` |
| `migration.decided-at` | ISO date the decision was taken. Absent when `decision: none-found` |

### Body

```markdown
## TL;DR

<What this receipt is (the install record for <command>), why it exists (so a later framework version can compute whether this project's state is current), and the headline state: contract vN, last run YYYY-MM-DD, and whether the project is current or behind.>

## Decision Log

| Date | Contract | Decision | Rationale |
|---|---|---|---|
| 2026-07-27 | 1 | Declined Playwright MCP wiring | Team runs QA in CI only; live driving not needed |
```

### Decision Log rules

- **Append-only.** Never edit or delete an existing row. A reversed decision is a NEW row, not an edit.
- **Decisions only, never instructions.** A row records a choice that changes behaviour: a declined prerequisite, a declined migration, an accepted upgrade, a backfill. Never step-by-step narration, never "next time do X" — that would make the log the changelog-interpretation mechanism this design exists to prevent.
- **One row per decision**, with the contract version in force when it was taken.
- **Backfill** (receipt reconstructed from pre-receipt state) is itself a row: `Backfilled receipt at contract 1 from existing materialized state`.

### Depth floors

| Section | Required facts |
|---|---|
| Frontmatter | Every field in the table above, in the declared vocabulary. No invented values |
| `## TL;DR` | The three facts listed in the body template: what the doc is, why it exists, current-vs-behind state |
| `## Decision Log` | Every behaviour-changing decision taken across all runs, oldest first |

### Hard bans

- Any `materialized` entry with `owner: shared` carrying a non-null `hash`.
- A `setup-contract` value that is not a bare integer.
- Editing or removing an existing Decision Log row.
- Narration, instructions, or aspirational language in any row.
- Rewriting `first-run`.

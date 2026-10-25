---
name: add--settings
description: Use when a command persists project configuration or a setup record — the project settings file .codeadd/settings.json, who owns it, how a command reads, merges and writes its own section, the content rule, the qa section schema and the receipt fields.
---

# Project Settings — `.codeadd/settings.json`

<!-- uses:
- command: /add-qa-setup
- script: qa-preflight.cjs
- script: status.cjs
- skill: add--setup-contract
- skill: add--doc-schemas
-->

## Overview

`.codeadd/settings.json` is the one project settings file. It is project-owned, versioned and committed to git. It holds one top-level section per command: the values the command scaffolded, its receipt state and its decision log. A command that needs to persist project configuration writes its section here and never invents a new file.

## When to Use

- A command stores project-specific values or a setup receipt.
- A script or agent needs to read those values.
- You are changing the shape of a section.

## When NOT to Use

- Feature and plugin toggles — they stay in `.codeadd/manifest.json`, which is CLI-owned, per machine and gitignored.
- Editor settings — those belong to the editor's own file, not to this one.

## Location and Ownership

- **Location:** always the project root's `.codeadd/settings.json`, also on a `--global` install, because settings are per project.
- **Top level:** `{ "schema": 1, "qa": {…}, "setup": {…} }`. One section per command; a section appears when its command first writes it.
- **Only commands write it**, each only its own section. `/add-qa-setup` writes `qa`; the future setup command writes `setup`.
- **Scripts only read it** (`qa-preflight.cjs`, `status.cjs`). A malformed file reads as `broken` or STALE, never as a crash.
- **The CLI writes it only through migration `0005-qa-settings`.** It never rewrites it on install, update or modify.
- **Always say `.codeadd/settings.json` in full.** The bare name is ambiguous with the editor's own settings file.

## Read → Merge → Write

```
IF A COMMAND WRITES ITS SECTION:
  ⛔ DO NOT: Write the file from a template, or replace the whole file
  ⛔ DO NOT: Drop a key you do not know — unknown keys inside any section are the user's
  ⛔ DO NOT: Touch another command's section
  ✅ DO: Read the file (absent = `{ "schema": 1 }`), merge your section key by key, write it back
```

- A file that does not parse is never overwritten. Report it and stop.
- Keys are written in the order the schema lists them. The file is pretty-printed with two spaces and ends with a newline, so a diff shows only what changed.

## Content Rule

Values, short descriptions and decisions go in `.codeadd/settings.json`. Only prompt-like or long guidance text goes in a `.md` file, referenced from the JSON by a relative path (for example `"notes": "settings/<name>.md"`). No prompts in JSON.

Nothing qualifies for an `.md` reference today: `bootHint` and `authSeed` are one-line hints, so they stay strings. No `.codeadd/settings/` folder exists yet, and none is created until a section needs one.

## Section `qa`

Written by `/add-qa-setup`. Value fields first, then receipt fields.

```json
{
  "schema": 1,
  "qa": {
    "baseUrl": "http://localhost:<port>",
    "viewports": { "desktop": [1440, 900], "tablet": [768, 1024], "mobile": [375, 812] },
    "bootHint": "<command that starts the app>",
    "authSeed": "<one line: how to sign in as a seeded user>",
    "setup-shape": "sha256:<16 hex>",
    "framework-version": "1.7.0",
    "first-run": "2026-07-27",
    "last-run": "2026-10-25",
    "materialized": [
      { "path": ".codeadd/settings.json", "owner": "shared", "hash": null },
      { "path": ".claude/skills/qa-project/SKILL.md", "owner": "setup", "hash": "sha256:<hex>" }
    ],
    "prereqs": { "playwright-test": "installed", "chromium": "already-present", "playwright-mcp": "declined" },
    "qa-pipeline-feature": "enabled",
    "migration": { "detected": ["cypress"], "decision": "declined", "decided-at": "2026-07-27" },
    "log": [
      { "date": "2026-07-27", "item": "playwright-mcp", "decision": "declined", "reason": "QA runs in CI only", "shape": "sha256:<hex>" }
    ]
  }
}
```

### Value fields

| Field | Rule |
|---|---|
| `qa.baseUrl` | URL the app answers on. Required for QA to run; the config probe reads it |
| `qa.viewports` | Map of viewport name to `[width, height]` |
| `qa.bootHint` | One line: the command that starts the app |
| `qa.authSeed` | One line: how to sign in as a seeded user |

Value fields follow the per-key merge rule in `{{skill:add--setup-contract/SKILL.md}}`: keys the user authored are kept.

## Receipt Fields

A receipt is the record a command leaves so a later framework release can compute whether the project's state is current, and so a deliberate `no` is never mistaken for an unfinished install. The receipt fields live in the command's section, next to its values. They are the generic part of the schema: any command with a section uses the same names.

| Field | Rule |
|---|---|
| `setup-shape` | The shipped shape hash in force when the recorded state was materialized: `sha256:` + 16 hex. Read by `status.cjs` and `qa-preflight.cjs` |
| `framework-version` | Informational only. Never compared to compute staleness — a release that did not touch the command must stay silent |
| `first-run` | ISO date of the first setup run. Never rewritten once set |
| `last-run` | ISO date of the most recent run, **including a verified-current no-op**. A run that changed nothing still advances it |
| `materialized[].path` | Path of a file the command wrote. For a section of this file, `.codeadd/settings.json` |
| `materialized[].owner` | `setup` (this command is the sole writer) or `shared` (another command also writes it). `.codeadd/settings.json` is always `shared` |
| `materialized[].hash` | `sha256:<hex>` of the file content for `owner: setup`. **MUST be `null` for `owner: shared`** — hashing a co-owned file produces permanent false drift |
| `prereqs.<name>` | One of: `installed` (this run installed it), `already-present` (functionally verified before this run), `declined` (offered, user said no), `failed` (attempted, verification still fails), `not-offered` (never reached) |
| `qa-pipeline-feature` | One of: `enabled`, `already-enabled`, `declined`, `enable-noop` |
| `migration.detected` | List of tooling ids, **sorted alphabetically**, from the scan. `[]` when nothing was found. This list IS the fingerprint — do not hash it |
| `migration.decision` | One of: `none-found`, `declined`, `migrated`, `not-offered` |
| `migration.decided-at` | ISO date the decision was taken. Absent when `decision: none-found` |
| `log[]` | Append-only decision log. Entry: `{ date, item, decision, reason, shape }` |

### Log rules

- **Append-only.** Never edit or delete an existing entry. A reversed decision is a NEW entry, not an edit.
- **Decisions only, never instructions.** An entry records a choice that changes behaviour: a declined prerequisite, a declined migration, a STALE re-materialize. Never step-by-step narration, never "next time do X".
- **One entry per decision**, with the `setup-shape` in force when it was taken.

### Hard bans

- A `materialized` entry with `owner: shared` carrying a non-null `hash`.
- A `setup-shape` value that is not a bare `sha256:` + 16 hex.
- Editing or removing an existing `log` entry.
- Narration, instructions or aspirational language in any `log` entry.
- Rewriting `first-run`.
- A value outside the declared vocabulary of a field.

## How Scripts Read It

- `qa-preflight.cjs` reads `qa.baseUrl` for `QA_CONFIG`, and `qa["setup-shape"]` with `qa["framework-version"]` for `QA_RECEIPT`.
- `status.cjs` reads `qa["setup-shape"]` for `SETUP_QA`.
- A file with no `qa` section reads as missing config and missing receipt. A file that does not parse reads as `broken` in `qa-preflight.cjs` and as STALE in `status.cjs`.

## Git

`.codeadd/*` is gitignored, so the managed `.gitignore` block adds exceptions: `!.codeadd/board.json`, `!.codeadd/settings.json` and `!.codeadd/wiki/`. The exception for `wiki/` works because `.codeadd/*` ignores only the direct children of `.codeadd/`. Commit `.codeadd/settings.json`.

## Related

- `{{skill:add--setup-contract/SKILL.md}}` — the shape comparison that reads the receipt fields.
- `{{skill:add--doc-schemas/SKILL.md}}` — the legacy markdown receipt category, now a pointer to this skill.

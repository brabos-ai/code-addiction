---
name: add--setup-contract
description: Use when a state-materializing command starts — compare the receipt setup-shape to the shipped sidecar shape and route FIRST-RUN / CURRENT / STALE. Consumed by /add-qa-setup STEP add-qa-setup.classify-receipt and STEP add-qa-setup.receipt.
---

# Setup Shape Comparison

<!-- uses:
- skill: add--settings
- mention: add--wiki-maintenance
- command: /add-qa-setup
- script: status.cjs
-->

## Overview

Procedure for comparing a project's materialized state with the shape the framework currently ships. It compares two hashes and routes. It never reads a changelog and never decides what to improve.

## When to Use

- A state-materializing command starts and must establish whether the project is first-run, current, or stale.
- The user passes `--upgrade` to such a command.
- A command finishes materializing and must write or refresh its receipt.

## When NOT to Use

- Corpus-derived staleness (the project wiki) — that is git-based and owned by `{{skill:add--wiki-maintenance/SKILL.md}}`. Two staleness mechanisms coexist deliberately: shape-based for materialized state, git-based for derived docs.
- Deciding *whether* a feature is worth adopting. This procedure takes no product decisions.

## Inputs

| Input | Source |
|---|---|
| `RECEIPT_PATH` | The command's section of `.codeadd/settings.json` — `add-qa-setup` → section `qa` |
| `RECORDED` | `qa["setup-shape"]` (`sha256:` + 16 hex) |
| `CURRENT` | `contracts.<command>.shape` in `{{addpath:contracts.json}}` |
| `SIGNAL` | `SETUP_QA:` / `SETUP_QA_STALE:` from `status.cjs` |
| `FORCE_UPGRADE` | `--upgrade` flag on the calling command |

## Procedure

### 1. Classify the project state

Materialized state is present when any `owner: setup` path declared in the command's contract exists.

| Receipt | Materialized state | Classification | Action |
|---|---|---|---|
| absent | absent | **FIRST-RUN** | Materialize normally, then write the receipt at `CURRENT` |
| absent | present | **STALE** | Re-materialize under the merge rules. Do not treat as FIRST-RUN |
| present | any | Compare at step 2 | |

⛔ Never treat a project that already holds an `owner: setup` path as FIRST-RUN.

### 2. Compare

| Condition | Action |
|---|---|
| `CURRENT` unreadable (no sidecar) | Pre-contracts install. Skip the compare, report it, continue. Never guess a shape |
| `RECORDED` unreadable | **STALE** |
| `RECORDED == CURRENT` and not `FORCE_UPGRADE` | **CURRENT**. Go to step 3 (drift check), then step 4 |
| `RECORDED != CURRENT` or `FORCE_UPGRADE` | **STALE**. Re-materialize, then step 3, then step 4 |

### 3. Re-materialize (STALE and `--upgrade`) + drift check

Apply the calling command's merge rules. For `add-qa-setup`:

- `qa-project` skill: always regenerate.
- The `qa` value fields (`baseUrl`, `viewports`, `bootHint`, `authSeed`): per-key merge. Keep every existing key, including extras. Fill missing declared keys with defaults. Never drop a user key. Drift-check applies: report a user-edited value that differs from the default; do not silently overwrite it.
- `screens.json`: leave it if it exists; write `{ "feature": "<id>", "screens": [] }` only when absent.
- `.gitignore`: idempotent `ensure-ignore`.
- Missing declared paths: create.

For every `materialized` entry with `owner: setup` that this run did not just regenerate:

| Result | Action |
|---|---|
| Hash match | Nothing to report |
| Hash mismatch | **Report the drift; do not silently overwrite.** Offer to regenerate, rewrite the recorded hash only after the user confirms which side wins |
| File missing | Report it as a gap; offer to re-materialize |

⛔ Entries with `owner: shared` carry `hash: null` and are checked for **existence only**.

### 4. Rewrite the receipt fields and `qa.log` — always

Rewrite the receipt on **every** run, including a verified-current no-op.

- `setup-shape` = `CURRENT` (the shipped hash).
- Advance `last-run` to today.
- Preserve `first-run` byte-identically.
- Refresh `framework-version` from the manifest (informational only).
- Refresh `owner: setup` hashes for any file this run rewrote.
- Append one `log` entry per behaviour-changing decision taken this run — never for the no-op itself.

Schema and field vocabulary: `{{skill:add--settings/SKILL.md}}`.

## Refusal Rules (hard)

| Situation | Response |
|---|---|
| `.codeadd/settings.json` is unparseable or the `qa` section holds no readable `setup-shape` | Treat as STALE. Do not invent a `setup-shape` |
| A merge item is ambiguous | Surface the item verbatim and ask. Do not improvise |

## Rules

ALWAYS:
- Rewrite the receipt on every run, including no-ops
- Treat `owner: shared` paths as existence-checked only
- Keep every existing `qa` value field on a STALE merge

NEVER:
- Read a changelog, release notes, or command diff to decide what to change
- Reconstruct a missing receipt at a historical integer
- Execute a versioned delta list
- Treat no-receipt-plus-state as FIRST-RUN
- Overwrite a user-authored `qa` value field with a default without confirmation
- Edit or remove an existing `log` entry

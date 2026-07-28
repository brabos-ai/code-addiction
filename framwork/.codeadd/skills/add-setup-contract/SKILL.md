---
name: add-setup-contract
description: Use when a state-materializing command starts or is asked to upgrade — reads the setup receipt, compares the recorded contract against the shipped one, executes the declared upgrade deltas sequentially, and rewrites the receipt even on a verified-current no-op. Consumed by /add.qa-setup STEP 1.5 and STEP 11.
---

# Setup Contract Reconciliation

## Overview

Procedure for reconciling a project's materialized state with the contract the framework currently ships. It compares two integers, executes a declared delta list, and refuses when the declaration is incomplete. It never reads a changelog and never decides what to improve — an agent interpreting prose produces a different upgrade on every run, which is the failure this procedure exists to prevent.

## When to Use

- A state-materializing command starts and must establish whether the project is first-run, current, behind, or unreceipted.
- The user passes `--upgrade` to such a command.
- A command finishes materializing and must write or advance its receipt.

## When NOT to Use

- Corpus-derived staleness (the project wiki) — that is git-based and owned by `{{skill:add-wiki-maintenance/SKILL.md}}`. Two staleness mechanisms coexist deliberately: contract-based for materialized state, git-based for derived docs.
- Deciding *whether* a feature is worth adopting. This procedure executes declared deltas; it takes no product decisions.

## Inputs

| Input | Source |
|---|---|
| `RECEIPT_PATH` | ``<command's doc root>/<command name without `add.`>.md`` — `add.qa-setup` → `docs/qa/qa-setup.md` |
| `RECORDED` | `setup-contract` in the receipt frontmatter |
| `CURRENT` | `contracts.<command>.version` in `{{addpath:contracts.json}}` |
| `RECIPES` | `contracts.<command>.recipes` — a path relative to the **active provider's resource root**, e.g. `.claude/skills/add-qa/references/setup-contract.md` on Claude Code. ⛔ NOT under `.codeadd/`: skills install into per-provider directories, and `.codeadd/` carries only scripts, fragments, templates, plugins and the sidecars |
| `SIGNAL` | `SETUP_QA:` / `SETUP_QA_CONTRACT:` / `SETUP_QA_BEHIND:` from `status.sh` |

## Procedure

### 1. Classify the project state

| Receipt | Materialized state | Classification | Action |
|---|---|---|---|
| absent | absent | **FIRST-RUN** | Materialize normally, then write the receipt at `CURRENT` |
| absent | present | **UNRECEIPTED** | Backfill: reconstruct the receipt from observed state at `setup-contract: 1`, change no other file, log the backfill. Then continue at step 2 |
| present | any | **RECEIPTED** | Continue at step 2 |

Materialized state is "present" when any `owner: setup` path declared in the command's contract exists.

⛔ Never treat an UNRECEIPTED project as FIRST-RUN. Re-materializing over an existing installation destroys the user's configuration.

### 2. Compare

| Condition | Action |
|---|---|
| `CURRENT` unreadable (no sidecar) | Pre-contracts install. Skip reconciliation entirely, report it, continue. Never guess a version |
| `RECORDED > CURRENT` | **REFUSE.** The framework was downgraded, or the receipt is corrupt. Report both values and stop — do not downgrade materialized state |
| `RECORDED == CURRENT` | Verified-current. Go to step 4 (drift check), then step 5 |
| `RECORDED < CURRENT` | Behind by `CURRENT - RECORDED`. Go to step 3 |

### 3. Execute the deltas (behind only)

1. Read `RECIPES`. Collect sections `## v(RECORDED+1)` through `## v(CURRENT)`, in order.
2. **If any section in that range is missing → REFUSE.** Report which version is absent and stop. Never skip a version, never jump straight to `CURRENT`, never infer a delta from the difference between two `### Materializes` tables.
3. Present the collected deltas to the user as one list, grouped by version, and **WAIT for explicit confirmation** — reconciliation is confirm-then-execute, like every other mutation these commands perform.
4. On confirmation, execute **sequentially, one version at a time**: apply every item of `v(N-1) → vN` before reading `vN → v(N+1)`. After each version, set `setup-contract: N` in the receipt. A run interrupted mid-chain leaves a truthful receipt at the last fully applied version.
5. On decline, stop. Record the decline as a Decision Log row and leave `setup-contract` unchanged.

### 4. Drift check

For every `materialized` entry with `owner: setup`, recompute the file hash and compare with the recorded one:

| Result | Action |
|---|---|
| Match | Nothing to report |
| Mismatch | **Report the drift; do not silently overwrite.** Offer to regenerate the file from the current contract, and only rewrite the recorded hash after the user confirms which side wins |
| File missing | Report it as a gap; offer to re-materialize |

⛔ Entries with `owner: shared` carry `hash: null` and are checked for **existence only**. They are co-owned by another command and a content difference is expected, not drift.

### 5. Rewrite the receipt — always

Rewrite the receipt on **every** run, including a verified-current no-op with no drift. A verified-current run is information, not nothing.

- Advance `last-run` and `updated` to today.
- Preserve `first-run` and `created` byte-identically.
- Refresh `framework-version` from the manifest (informational only).
- Refresh `owner: setup` hashes for any file this run rewrote.
- Append one Decision Log row per behaviour-changing decision taken this run — never for the no-op itself.

Schema and field vocabulary: `{{skill:add-doc-schemas/SKILL.md}}` → `references/receipt.md`.

## Refusal Rules (hard)

| Situation | Response |
|---|---|
| Recipe chain has a hole in `RECORDED+1 .. CURRENT` | Refuse, name the missing version, stop |
| `RECORDED > CURRENT` | Refuse, report both values, stop |
| Receipt frontmatter is unparseable | Refuse to guess. Offer to rebuild it as a backfill at contract 1, with user confirmation |
| A delta item is ambiguous | Refuse to improvise. Surface the item verbatim and ask |

An improvised upgrade is worse than no upgrade: it produces state no recipe describes, which no later version can reconcile.

## Rules

ALWAYS:
- Apply deltas sequentially, one contract version at a time
- Rewrite the receipt on every run, including no-ops
- Treat `owner: shared` paths as existence-checked only
- Confirm before executing any delta

NEVER:
- Read a changelog, release notes, or command diff to decide what to upgrade
- Skip a version or infer a delta not declared in the recipe file
- Overwrite a drifted `owner: setup` file without the user choosing which side wins
- Re-materialize over an UNRECEIPTED project as if it were first-run
- Edit or remove an existing Decision Log row

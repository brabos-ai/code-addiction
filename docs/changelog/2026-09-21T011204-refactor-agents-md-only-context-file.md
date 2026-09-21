# AGENTS.md only — the framework writes and reads one context file

> **Date:** 2026-09-21
> **Plan:** `docs/plans/2026-09-21T002449-PLAN--agents-md-only-context-file.md`
> **Layer:** both

Claude Code v2.1.277 reads `AGENTS.md` natively — but only when no `CLAUDE.md` exists in the working
directory or above. Antigravity reads it too, and lets a `GEMINI.md` override it. Codex, Cursor and
OpenCode already read it. So the framework stops writing three copies of one file: `AGENTS.md` is the
only context file it writes or reads, in a user's project and in this repository. Any `CLAUDE.md`,
`.claude/CLAUDE.md` or `GEMINI.md` left at a project root is folded into `AGENTS.md` and deleted, so
nothing hides the new file.

## Added

- **`framwork/.codeadd/scripts/migrate-context-files.sh`** — folds the three legacy files into
  `AGENTS.md`, in that order. With no `AGENTS.md` the first becomes it verbatim; a file `AGENTS.md`
  already contains carries nothing (the old `add.wiki` copies); anything else is appended whole under
  `## Migrated from <file>`. It writes through a temp file and deletes a candidate only after the
  write. `CLAUDE.local.md` is reported, never touched. Emits `MIGRATED:<file>:created|duplicate|appended`,
  `LEGACY_LOCAL:CLAUDE.local.md` and `CONTEXT_MIGRATION:none`. Its bats suite checks that every line of
  every candidate lands in `AGENTS.md` and that a second run is a no-op.
- **`LEGACY_CONTEXT:` in `init.sh`** — lists any legacy file left at the root; `add.new` tells the user
  `/add.wiki update` folds it in. A notice, never a block.
- **The `codeadd-shell` managed block** — the Windows shell policy, written in place in `AGENTS.md`
  with replace-or-append, so re-runs keep one copy.
- **Finding DOC-008** in the health check's documentation analyzer — a leftover legacy file.
- **`cli/tests/agents-md-only.test.js`** — `CLAUDE.md` is not an artefact-graph node, so no build gate
  saw a reader still naming it. This test searches the sources of both layers and fails on any file
  outside a short, reasoned allowlist.

## Changed

- **`add-claude-md-style` → `add-agents-md-style`** — renamed, rewritten for `AGENTS.md`, and it owns
  the Migration every writer runs before touching the file.
- **`add.wiki`** — STEP 6 migrates, resolves the shell block, then dispatches the updater against
  `AGENTS.md`. STEP 7 no longer copies to `CLAUDE.md` and `GEMINI.md`; it checks `AGENTS.md` is the
  only context file left and each managed block landed once. Step numbers are unchanged.
- **`add-architecture-discovery`** and its four analyzers write `AGENTS.md`, migrating first.
- **Every product reader** — commands, skills and agents that read `validation_gates`, the
  Architecture Contract or the stack — reads `AGENTS.md`, with no `CLAUDE.md` fallback.
  `conformance-agent`'s `RULE_SOURCE` value is now `agents-md+code`.
- **This repository** — `CLAUDE.md` is now `AGENTS.md`. `scripts/inventory.js` writes its block there,
  and every workbench stage and skill names it.

## Removed

- The `CLAUDE.md` → `AGENTS.md` / `GEMINI.md` copy step in `add.wiki`. No command generates
  `CLAUDE.md` or `GEMINI.md` any more.

## Accepted trade-offs

- Claude Code on Bedrock, Vertex or Foundry, before v2.1.277, with telemetry off or with the
  `agents-md` plugin disabled reads no project instructions. No `CLAUDE.md` shim is written — decided
  explicitly.
- A directly-read `AGENTS.md` does not appear in Claude Code's `/memory` or `/context`.

## Not included

- `README.md`, `web/` and the auto-generated `ecosystem.md` still name the old skill until the next
  `/add-framework--sync`.

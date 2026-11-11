---
path: architectural
topic: agents-md-only-context-file
doc: docs/brainstorming/2026-09-20T235642-agents-md-only-context-file.md
delivery: automatic
---

## Decided
- AGENTS.md is the only context file, both layers — Claude Code v2.1.277+ and Antigravity 1.20.5+ read it natively; Codex, Cursor, OpenCode already did
- No CLAUDE.md shim (`@AGENTS.md`) — user accepts losing Bedrock/Vertex/Foundry and pre-2.1.277 Claude Code
- Framework-managed CLAUDE.md and GEMINI.md are migrated into AGENTS.md and deleted — a leftover hides AGENTS.md (Claude Code) or overrides it (Antigravity)
- Files without a framework managed block are left in place and reported, never deleted
- Migration procedure lives once, in the renamed skill; both writers load it
- Rename `add-claude-md-style` → `add-agents-md-style`, full rename sweep; plan verifies the installer removes the old skill dir
- Readers get no CLAUDE.md fallback; `init.sh` emits a legacy-file signal instead (key name is the plan's choice)
- Internal layer: `git mv CLAUDE.md AGENTS.md`; `scripts/inventory.js` and `add-framework--done` target AGENTS.md
- Build runs in an isolated git worktree — user's instruction at approval
- Build STEP 9: open the PR at the end — the user answered this in advance at approval ("abertura de pr ao final")

## Open
None

---
path: architectural
topic: native-node-framework-scripts
doc: docs/brainstorming/2026-10-05T151140-native-node-framework-scripts.md
delivery: confirm
ticket: 0022B
---

## Decided
- Use Node for all active framework scripts on Windows, macOS and Linux, regardless of board enablement.
- Preserve public behavior; use shared cores and built-ins-only shipped modules.
- Audit all 22 shell entries; migrate useful ones, consolidate redundant capabilities, delete demonstrably useless entries, and ask the user about uncertain retirements.
- Map each script's behavior, preserve applicable old cases, and demonstrate native TDD Red/Green before removing the shell entry.
- Keep contract headers beside code and detailed descriptive native tests.
- Execute one plan with checkpoints on one branch in a dedicated Git worktree.
- Require Node >=22.19.0; recommend Node 24 LTS; native CI on both versions across Windows/macOS/Linux.
- Record before/after timings without an arbitrary duration limit; reuse manifest cleanup.
- User requests the full plan now and will execute it in a fresh context; stop after reviewed plan delivery. Build must stop before opening the PR and must not merge or publish releases.

## Open
None

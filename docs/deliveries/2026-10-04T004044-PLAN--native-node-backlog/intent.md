---
path: architectural
topic: native-node-backlog
doc: docs/brainstorming/2026-10-04T004044-native-node-backlog.md
delivery: automatic
ticket: 0019B
---

## Decided
- Make all backlog agent operations run on native Node and Git on Windows, Linux and macOS without Bash/WSL.
- Keep separate local and Git-publication Node entries over existing core/storage; retain Bash compatibility wrappers.
- Preserve base-branch/worktree routing, global ID calculation and existing output keys/exit codes; add persistence/recovery diagnostics.
- Support record files and stdin; a supplied file is authoritative and stdin is not consumed.
- Verify CLI operations, publication, installation/update and CLI-to-server/UI integration in one plan.
- User override: write and finish reviewing the plan, then STOP and notify the user so they can change models before development. Do not load build automatically in this run.

## Open
None

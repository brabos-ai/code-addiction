---
path: bounded
topic: build-end-to-end-non-claude
doc: none
delivery: automatic
---

## Objective

[from conversation, no design document] `/add.build` runs development from start to end and stops only
at the PR question, on OpenCode with a non-Claude model on Windows — the shell policy `add.wiki` writes,
`build-setup.sh` on a resumed build, and the `model` pinned on agents no longer break it.

## Decided
- `add.wiki` STEP 7.2 shell policy becomes shell-aware: when the tool's shell is already bash, run the command directly; only from PowerShell use `& "<bash.exe>" -lc "<command>"` — the `&` is a PowerShell call operator and is a syntax error inside bash (OpenCode)
- `scripts/build.js` `AGENT_DIALECTS`: opencode, cursor and codex stop emitting `model`; claude keeps its verbatim passthrough — `sonnet`/`haiku`/`inherit` are Claude-only names, and without the field OpenCode uses the session model
- `build-setup.sh` skips the dirty-tree guard when the current branch already equals the feature branch (in-place mode) — no checkout happens, so nothing can leak; off the branch it still exits 5
- `add.build` STEP 2's stop-on-non-zero-exit gate stays unchanged — the fix is in the script, not the gate
- Tests: `cli/tests/build.test.js` asserts only the claude dialect carries `model`; `build-setup.bats` adds "on the feature branch with tracked modifications → exit 0"
- Out of scope: the `MODEL: Use haiku` line in `add.pull-request` (guidance text, breaks nothing); repairing AGENTS.md already written in user projects (rerun `/add.wiki` after release)
- Callers checked on the graph: `build-setup.sh` ← add.build, add-doc-schemas, add-id-convention; `add.wiki` has 15 dependants, none reads the shell policy (gitnexus fragment included); `scripts/build.js` is not a node — NOT VERIFIED on the graph, consumed by `cli/tests/build.test.js` and `agent-capability.test.js`

## Open
None

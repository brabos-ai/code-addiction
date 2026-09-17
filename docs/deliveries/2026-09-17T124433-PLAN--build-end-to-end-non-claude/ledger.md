# Build ledger — plan: docs/plans/2026-09-17T124433-PLAN--build-end-to-end-non-claude.md

F1: Ruling: created branch fix/build-end-to-end-non-claude from main (46d38ed) before the first F-block — STEP 9 refuses to publish main and delivery is automatic — costs a branch rename if the user wanted another name
F2: Ruling: readback asked whether `model` is dropped by value or unconditionally; built unconditional removal on opencode/cursor/codex — the plan says "stop emitting model" and L2.1 asserts no key; no runtime reads it (grep cli/src, mcp) — costs a provider-native pin being dropped if a source ever carries one
F4: Ruling: readback flagged "six decisions" vs four Validated Decisions rows; built the four — the other two intent lines are the out-of-scope list and the graph callers, both already in the plan — costs nothing unless the intent file held a scope item the plan dropped
F1: complete (commits 5e6c30f..5e6c30f, build-setup.bats RED then 22/22, full bats 427 ok, build.js clean)
F2: complete (commits adf7607..adf7607, build.js clean, built opencode/cursor/codex agents carry no model, framwork/ clean)
F3: complete (commits 81183bf..81183bf, test RED on opencode before F2, cli suite serial 1487 passed 0 failed)
F4: complete (commits 4eba749..4eba749, bash -n rejects the old & line and parses the bash-direct form, build.js clean, built opencode add.wiki carries both forms, ruler items 1-3 ticked: no new names, no new refs, gate in IF/DO NOT shape)
GRAPH: build-setup.sh — add.build, add-doc-schemas, add-id-convention (named in the plan; exit-0 contract unchanged for them); no entry
GRAPH: add.wiki — 16 dependants, all HANDS_OFF_TO plus the gitnexus fragment; none reads STEP 7.2, none changed or needs change; no entry
GRAPH: NOT VERIFIED — scripts/build.js is not a graph node (add-artefact-graph: top-level scripts/ produce no nodes); its agent output is read by cli/tests/build.test.js and agent-capability.test.js, both green
F5: Ruling: opened F5 [internal] for the side-effects audit's low finding — .claude/skills/add-framework-development/SKILL.md said every agent keeps model, which F2 made wrong; the plan never named this file — costs one extra commit if the user wanted it left for later
F5: complete (commits 55f3608..55f3608, build.js clean, framwork/ porcelain empty)
F4: Ruling: rejected the diff audit's low finding that "Do not use WSL bash directly" was reworded to "from PowerShell" — the qualifier is the point: bash-direct is now allowed inside Git Bash, so the unqualified line would contradict the new first bullet — costs nothing unless a reader misses WSL being banned
F2: Ruling: rejected the conformance audit's low finding that L2.3/L4 were not executed — the audit was read-only; the build ran them (built opencode/cursor agents carry no model; bash -n rejects the old & line) — costs nothing
REVIEW: complete (3 findings, 1 applied, 2 rejected; add.wiki prompt review ok)

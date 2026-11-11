# Build ledger — plan: docs/plans/2026-10-12T203955-PLAN--headless-stop-status.md

F1: complete (commits c91b1b6..1ff2ef9, build.js clean, vitest agent-mode L1.2/L1.9 green; L1.10 RED until F2)
F1: Ruling: F1 and F4 schema text edited in one pass, committed separately — the edits are identical in shape — costs nothing; F4 still validated on its own
F2: complete (commits 1ff2ef9..b87f718, vitest agent-mode 266 pass, build.js clean)
F3: complete (commits b87f718..092e922, RED seen before F1/F2 then green; vitest agent-mode 266 pass)
V3: exit codes — bash stopped=1, bash done=0, PowerShell stopped=1, PowerShell done=0 (temp files deleted)
V3: Ruling: the V3 line above was written before the PowerShell run was valid (first attempts had a path quoting error); re-run correctly afterwards — PowerShell stopped=1, done=0 confirmed — costs nothing
F4: complete (092e922..0f62b04, build.js and build-workbench.js clean, L1.2 green)
F5: complete (0f62b04..0a8f78e, result-block.test.cjs 15 pass, RED seen first)
F6: Ruling: renamed the STEP 1.3 heading to 'Branch and Worktree' — it now holds a branch rule, not only a worktree recommendation; nothing references the old title — costs one heading revert if wrong
F6: complete (0a8f78e..3798f63, build.js and build-workbench.js clean, no warnings, framwork/ untouched)
F7: complete (3798f63..e17dc47, build-branch-on-main.test.cjs 2 pass, RED seen first)
GRAPH: add-framework--build — add-framework--done, add-framework--plan, building-commands (depth 1, same 3 the plan named; none reads STEP 1.3/9); no entry
GRAPH: add-final-report — 9 depth-1 callers (backlog, release, sync, brainstorm, build, done, plan, add-plan-authoring, building-commands), same as the plan; none parses result-block.md; one live entry, nothing gone/superseded
GRAPH: result.schema.json, agent-mode/README.md — NOT VERIFIED — not graph nodes; read by cli/tests/agent-mode.test.js and scripts/tests/result-block.test.cjs, both green
F6: Ruling: review fix — the STEP 7 findings were applied as two commits (e17dc47..7648d55) under the tags of the blocks they touch, not as new F-blocks — they edit F3–F7 artefacts only — costs a history split if the reader wants one commit
REVIEW: Ruling: rejected 'restates the status rule in the README' — the sentence names the schema and the plan wanted the exit check explained next to it — costs one sentence trimmed if wrong
REVIEW: Ruling: rejected splitting the STEP 9-adjacent NEVER item 'Push or open a PR without asking, or push main at all' — predates this delivery, outside the plan — costs nothing now
REVIEW: Ruling: rejected 'push-guard assertions pin pre-existing text' — they are intentional net for the plan's hard-stop-must-not-be-lost requirement — costs two redundant asserts
REVIEW: complete (9 findings, 6 applied, 3 rejected)

# Update: agent mode guides — always `--resume <session_id>`, one worktree per agent, and an Agent Mode section on the docs site

## Outcome

Both agent-mode guides give a bot one way to continue a run and one way to run in parallel. `claude -c` is gone from the guides, the workbench schema and the tests. `web/src/pages/docs.astro` has an Agent Mode section. Ticket 0050B.

## Changes

- `framwork/.codeadd/agent-mode/README.md` (section 2): five rules replace the `claude -c` bullet. Always `--resume <session_id>`. Never `-c` or `--continue`. Never the newest `.jsonl`. One git worktree per agent. No branch switch in a shared checkout. The board is not affected. No section renumbering.
- `workbench/skills/add-final-report/references/result-block.md`: the same rules in the same order.
- `result-block.schema.json`: the `status` description says `--resume <session_id>`, as the product schema does.
- Tests: new `L1.8` in `cli/tests/agent-mode.test.js`. The two result-block tests keep their names and now require `claude -c` to be absent.
- `web/src/pages/docs.astro`: sidebar entry, `#agent-mode` section, and an `agent-mode` card in Optional Features.

## Action for installed projects

None. Run `codeadd update` to get the new guide.

## Not covered

No test reads the web section. Its check is a read of the built page.

| Commit | F-block |
|---|---|
| d5efbc3..0b8a8d5 | F1 |
| 0b8a8d5..8ce3d43 | F2 |
| 8ce3d43..3bc3fe2 | F3 |

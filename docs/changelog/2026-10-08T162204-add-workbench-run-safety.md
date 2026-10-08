# Workbench run safety — test-loss guard, board writes in no-push runs, needs-approval resume

## Outcome

Build and done now stop when a test disappears from the branch without a note. A build told not to push still moves its ticket to `doing` and `in-review`. The result schema tells a headless caller that a waiting stop is `needs-approval` and how to continue the same session.

## Why

Ticket 0029B. Commit `4cccd00` dropped 3 tests and only a human review caught it. A "do not push" instruction was read as covering the board write, and `in-review` waited on a PR that a headless flow may open days later. A waiting run looked like a finished one.

## Changes

- `scripts/test-loss-guard.cjs` (new): compares test names between the merge-base with `main` and `HEAD`, statically. A `Test-Removed:` commit trailer covers a loss. Exit 0 pass, 1 fail, 2 error.
- `add-framework--build` STEP 9 runs the guard before the publish question. `add-framework--done` 2.2 gates on it, skipped on the recovery path (2.4).
- `add-plan-authoring` The Ticket: `in-review` is written whenever the build reaches STEP 10 with every F-block complete, and a "do not push" instruction never skips a board write.
- `result-block.schema.json`: the `needs-approval` and `next_step` descriptions. `result-block.md`: a section on resuming with `--resume` or `claude -c`.
- `AGENTS.md`: one Key files row.

## Validation

- Scripts suite 702/702 and cli suite 2026/2026 green in the container. `build.js` exit 0, no graph warning.
- Replay of `4cccd00`: `GUARD=fail`, `LOST=3`, exit 1.
- Headless smoke: the plan stage stopped with `needs-approval`, resumed with `--resume` on the same `session_id`, ended `stopped`. Both objects validate.
- **Open:** the no-push board write is covered by text tests only. It is proven by the first headless no-push build after this merges.

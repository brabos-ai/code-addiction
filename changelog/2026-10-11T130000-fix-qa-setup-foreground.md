# Fix: add-qa-setup boots the app as a managed process and reads dispatch-rules

## Outcome

`/add-qa-setup` no longer tells the agent to boot the app "in the background", which in headless mode ended the turn with work pending. The migration dispatch now reads `dispatch-rules.md`. Ticket 0046B.

## Changes

- `add-qa-setup`: the boot line in `## Materializes` says "managed process" (the step owns it and tears it down), in line with the Managed App Lifecycle carve-out of `dispatch-rules.md`. The migration dispatch reads `dispatch-rules.md`, and `uses` lists it.
- Contract: `shape` is now `sha256:25b937ee17628d6b` and `changed-in` is `1.5.2`.

## Action for installed projects

The contract shape changed: **run `/add-qa-setup` again** in every project that has it installed.

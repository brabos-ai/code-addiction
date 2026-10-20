# Add: the agent-mode board management guide

## Outcome

A team of agents has one place that says how the board works: where it lives, which commands write it, who mirrors each stage to an external tracker, and how concurrent writes behave. Ticket 0056B.

## Changes

- `framwork/.codeadd/agent-mode/board-management.md` (new): board location, automatic and manual writes, the moment/who/board/mirror table, concurrency, and the gaps (bug tickets, latest `assigned:` comment, handoff signal, no-PR deliveries, release flow owner, record files written with the file-write tool).
- `framwork/.codeadd/agent-mode/README.md`: section 9 no longer recommends a single mirror bot: mirroring is shared by stage owner and the `changes --since` loop is the basis for a future automatic sync; section 10 points to the new file.
- `framwork/.codeadd/agent-mode/roles/product-pm.md`, `roles/chief-engineer.md`: board detail replaced by a pointer; bug tickets no longer need `shaped` or `feature`; the `echo > assign.json` recipe is gone.

## Action for installed projects

None. Run `codeadd update` to get the new text.

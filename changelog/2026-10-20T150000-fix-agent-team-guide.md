# Fix: the agent-mode team guide matches the commands

## Outcome

The team roles no longer require `/add-review`, `/add-pull-request` or a PM check after the merge. An engineer runs `/add-plan`, `/add-build` (which reviews itself and opens the PR) and `/add-done`; a bug runs `/add-hotfix`, then `/add-done`. Ticket 0055B.

## Changes

- `framwork/.codeadd/agent-mode/roles/chief-engineer.md`: `/add-review` is optional (only with `qa-pipeline` on and screens declared); only `Final review: blocked N` stops `/add-done`, a `major` becomes a `Ruling:` line; pulls main before `/add-plan`; picks a ticket only when `shaped` with `feature` set; deploy out of scope; board rules point to section 10.
- `framwork/.codeadd/agent-mode/roles/product-pm.md`: no acceptance check; commits and pushes the intent and `docs/features/<id>/` before the handoff; closes waiting tickets with `backlog-commit.cjs release <version>`.
- `framwork/.codeadd/agent-mode/README.md`: main flows, team section and the automatic-mode sentence (stops at the build's publish stop; the duplicated "in one call" is gone).

## Action for installed projects

None. Run `codeadd update` to get the new text.

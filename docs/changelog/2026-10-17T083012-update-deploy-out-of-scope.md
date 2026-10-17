# Update: deploy is out of scope of a delivery, and the framework's examples stop naming a stack

## Outcome

A delivery is code, migration files and tests in one merge. `add--tasks-checklist` now owns one `## Delivery Boundary` rule: no task or Acceptance item applies migrations to, deploys to or publishes to a shared, staging or production environment, and every `Verify:` is a local check. The architect, the plan reviewer, the database agent and the plan step point to it. The examples that named one stack now use placeholders resolved from the project's `AGENTS.md`. Ticket 0053B.

## Changes

- `framwork/.codeadd/skills/add--tasks-checklist/SKILL.md`: new `## Delivery Boundary`; the two example `Verify:` lines are placeholders; `infra` means config files only; one line in the architect `## RULES`; one Validation Checklist item.
- `framwork/.codeadd/commands/add-plan.md`: a pointer in the tasks step, a delivery line in the `### Migration` template, a placeholder in the Global Constraints example.
- `framwork/.codeadd/commands/add-new.md`: work is split by user flow, never by deploy stage.
- `framwork/.codeadd/agents/database-agent.md`: migration tool from `AGENTS.md`; migrations validated on a local or test database only.
- `framwork/.codeadd/commands/add-build.md`, `add-review.md`, `.../persistent-logging-and-tasks.md`: stack names replaced by generic terms.
- `framwork/.codeadd/skills/add--plan-review/SKILL.md`: the `feature-plan` extra fails a plan that deploys or migrates a shared environment, under `Scope`. Still nine dimensions.
- `README.md`, `web/src/pages/docs.astro`: deploy runs after `/add-done`; `/add-done → deploy` is now `finalize & merge`.
- `cli/tests/delivery-boundary.test.js`: new, 22 text assertions.

## Action for installed projects

None. Run `codeadd update` to get the new text.

## Not covered

No gate or script checks the rule: it binds where tasks are written and where plans are reviewed, not at run time. `add--code-review` still names Kysely in its checklist, which is now out of step with `add-review`.

| Commit | F-block |
|---|---|
| 2a6a545..a0440ff | F10 |
| a0440ff..1d025bb | F1 |
| 1d025bb..621779a | F2 |
| 621779a..5f8bbc1 | F8 |
| 5f8bbc1..cdd7206 | F3 |
| cdd7206..ec91602 | F4 |
| ec91602..8aab504 | F5 |
| 8aab504..92b5be6 | F6 |
| 92b5be6..3ea3f90 | F7 |
| 3ea3f90..720da75 | F9 |

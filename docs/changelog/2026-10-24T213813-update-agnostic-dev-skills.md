# Update: dev skills and reviews follow the project's recorded conventions

## Outcome

The backend, database and frontend dev skills, the two review skills and the commands and agents that cite them no longer assume one stack. Tenancy by `account_id`, a DI container, barrel files, TypeScript-interface entities, a `toEntity` mapper, Zod and a fixed layer order now apply only when the project uses them. They read `wiki/conventions.md` → `## Stack Conventions` first, with `AGENTS.md` as fallback, and use short agnostic defaults when nothing is recorded. Ticket 0063B.

## Changes

- `add--backend-development`: new `## Project Conventions First` holds the seven defaults once (the database and frontend skills point to it). DI, repository, tenancy and layering sections are conditional on the recorded rows.
- `add--database-development`, `add--frontend-development`: entities, barrels, naming, migrations, forms and types are language-neutral; tenancy and mapper rules apply only when recorded. Names and `## Validation Checklist` are unchanged; the frontend design.md / ux-design rule is unchanged.
- `add--backend-architecture`, `add--frontend-architecture`: treat recorded conventions as the current state.
- `add--code-review`: §3 checks registration per the project's DI convention and scores `N/A` with full points when there is no container. `add--security-audit`: tenant checks run when the `Tenancy` row is yes. With tenancy on, a query missing the key is still critical.
- `add-plan`, `add-build`, `add-review`, `add-brainstorm`, `add-hotfix`, `add-ux` and the backend, database, frontend, ux and ux-flow agents: no hard-coded stack, tenancy, DI or CQRS rule; the wiki replaces `AGENTS.md` as the source of patterns.
- Bug fix: `add-build` (twice), `fix-agent` and `test-agent` loaded the dev skill as `add-<area>-development`, a name that matches no skill. They now load `add--<area>-development`.
- New `cli/tests/agnostic-dev-skills.test.js`: read-only guard for all of the above.

## Action for installed projects

**Warning:** if your project's wiki predates the `## Stack Conventions` section, run `/add-wiki update` once. It backfills the table. Until then, reviews and agents no longer carry the hard-coded `account_id` tenancy reminder, so a multi-tenant project would lose it. In the meantime they follow the nearest existing code.

`add-build`, `fix-agent` and `test-agent` now find the dev skill by its real name, so the validator sees the skill's `## Validation Checklist` again.

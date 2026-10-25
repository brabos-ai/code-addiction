# Add: a fixed Stack Conventions table in the project wiki

## Outcome

`/add-wiki` now always writes a seven-row `## Stack Conventions` table in `.codeadd/wiki/conventions.md` (folded as `### Stack Conventions` in `index.md` for tiny repos). Rows: Tenancy, DI, Barrels, Layering, Validation, ORM / data access, Entity language. Each row has `path:line` evidence or `none`, and a `detected` or `decided` Source. Commands and dev skills can read one stable place instead of hard-coding the stack. Ticket 0062B.

## Changes

- `add--architecture-discovery/SKILL.md`: new `## Stack Convention Signals`, the one place detection is defined (stack-agnostic searches and decision rules).
- `spine-analyzer.md`: always writes the table, carries `decided` rows forward, returns `STACK_CONVENTIONS:`. The backend and database analyzers point at the Signals for domain-local detail only.
- `add-wiki.md`: the spine prompt, the consolidate gate and the tiny-mode gate check the table. Tiny mode is not chosen when `conventions.md` already exists. AGENTS.md gets one `Multi-tenancy:` line, only when Tenancy is detected.
- `add--wiki-maintenance/SKILL.md`: `/add-wiki update` keeps the section fixed, never overwrites a `decided` row (it adds `drift:` and reports it), and backfills the section once into an older wiki. The "wiki already current" exit no longer applies while the section is missing.
- New `cli/tests/wiki-stack-conventions.test.js` pins all of it.

## Action for installed projects

**Note:** an existing wiki gets the table on the next `/add-wiki update` (one-time backfill). The AGENTS.md `Multi-tenancy:` line is written only by a full `/add-wiki` run, because `/add-wiki update` never regenerates the Architecture Contract. Re-run `/add-wiki` if you want that line.

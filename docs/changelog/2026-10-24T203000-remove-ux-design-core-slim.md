# Remove: add--ux-design keeps its design core and drops the bundled library docs

## Outcome

`add--ux-design` no longer bundles docs for shadcn, Tailwind v3, motion, recharts and TanStack. It ships the eight design-core files (about 84 KB instead of 1.6 MB). Agents now read component and library APIs from the project's own components and docs. Ticket 0061B.

## Changes

- `framwork/.codeadd/skills/add--ux-design/`: seven files deleted (`shadcn-docs.md`, `tailwind-v3-docs.md`, `motion-dev-docs.md`, `recharts-docs.md`, `tanstack-query-docs.md`, `tanstack-router-docs.md`, `tanstack-table-docs.md`). `SKILL.md` loses their `uses:` rows; Docs Lookup is now one rule pointing at the project's own docs.
- `ux-layout-agent`, `add-ux` (STEP `add-ux.docs`) and `add-build` (subagent prompt): read the project's component inventory and its own docs (`wiki/conventions.md`, else `AGENTS.md`) instead of bundled files.
- `add--resource-path-convention`, `add--ecosystem`, `web/src/pages/docs.astro`, `cli/tests/build.test.js`: no longer name a removed file; the ecosystem and docs descriptions drop the library names.
- New `cli/tests/ux-design-core.test.js`: pins the folder to the eight core files and keeps the pointers in place.

## Action for installed projects

**Warning:** `codeadd update` removes the seven bundled library docs from `add--ux-design` in your install. Local edits inside those files are deleted with them (`pruneObsolete`). Copy anything you want to keep before you update.

Agents now take component and library APIs from your project's own components and docs, as named in `wiki/conventions.md` or `AGENTS.md`. If your project relied on the bundled docs, record the libraries you use there.

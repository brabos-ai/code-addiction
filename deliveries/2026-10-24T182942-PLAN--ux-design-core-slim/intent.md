---
path: bounded
topic: ux-design-core-slim
doc: none
delivery: confirm
ticket: 0061B
---

## Decided

1. Problem: `framwork/.codeadd/skills/add--ux-design/` is 1,594,836 bytes (~1.6MB), the largest skill in the framework, and ~1.51MB of it is bundled third-party library docs that tie the UX layer to one stack (shadcn + Tailwind v3 + motion + recharts + TanStack). Verified on main `dfe98bb0` (v1.5.13).
2. Keep (design core, 84,160 bytes): `SKILL.md` (20,518), `design-contract.md` (3,972), `critique-rubric.md` (1,813), `ux-laws-principles.md` (12,159), `modern-patterns.md` (20,713), `ux-writing.md` (15,229), `design-direction.md` (5,819), `saas-patterns.md` (3,937). Their content is unchanged except the `SKILL.md` edits in decision 4.
3. Remove (1,510,676 bytes): `shadcn-docs.md` (484,117), `tailwind-v3-docs.md` (476,220), `motion-dev-docs.md` (430,314), `tanstack-router-docs.md` (39,953), `recharts-docs.md` (39,172), `tanstack-table-docs.md` (20,691), `tanstack-query-docs.md` (20,209).
4. `add--ux-design/SKILL.md`: drop the seven `skill:` rows for the removed files in the `<!-- uses: -->` block (:15, :16, :18, :19, :20, :21, :22 — mandatory: a declared row for a missing file is a dangling reference and fails `assertArtefactGraph`, `scripts/build.js:1423-1431`). Replace the `### Docs Lookup` table (:77-87) with a short rule: component and library APIs come from the project itself — its installed components and its own docs, as named in `{{addpath:wiki/conventions.md}}` / `{{addpath:wiki/domains/frontend.md}}` when present, else `AGENTS.md`; the skill no longer bundles library docs. Keep `### Recommended Libraries` (:89-95) as-is: it is the default `@ux-flow-agent` falls back to for a new project (`agents/ux-flow-agent.md`, Step 0.5, "use `add--ux-design` skill defaults"). The Support Files table (:65-75) stays.
5. `agents/ux-layout-agent.md:25`: replace "Load skill `add--ux-design` files `shadcn-docs.md`, `tailwind-v3-docs.md`, `motion-dev-docs.md`" with: use the component inventory in `design-context.md` (produced by `@ux-flow-agent` Step 0.3); when a component's API matters, read the project's own component sources/docs as pointed by `{{addpath:wiki/conventions.md}}` (+ `{{addpath:wiki/domains/frontend.md}}`) if they exist, else `AGENTS.md`; never assume a library the inventory does not show. The rest of the line (design-contract.md reference) stays verbatim.
6. `commands/add-ux.md` STEP `add-ux.docs` (:60-79): remove the seven library rows (:66-72); keep the three design-core rows (:73-75); add one line: for component/library APIs, read the project's own docs per `{{addpath:wiki/conventions.md}}` / `AGENTS.md`. Keep the STEP id `add-ux.docs` and its title-line in the STEP index (:20) — reword the index label only if it reads stale. STEP `add-ux.discover` (:47-58) is not touched.
7. `commands/add-build.md:700` ("Reference component docs as needed: shadcn, tailwind-v3, motion, recharts, tanstack") points at the removed files → replace with "Component/library APIs: follow the project's own docs per `{{addpath:wiki/conventions.md}}` / `AGENTS.md`". (Not in the card; found on re-verification.)
8. `skills/add--resource-path-convention/SKILL.md:119` (example in the "Correct" block): swap `{{skill:add--ux-design/shadcn-docs.md}}` for a file that still exists, e.g. `{{skill:add--ux-design/design-contract.md}}` ("For layout notation, Read …").
9. `cli/tests/build.test.js:648-649`: `resolveResourcePaths` is a pure string transform (`scripts/build.js:1704`), so the test would still pass, but swap `shadcn-docs.md` for `design-contract.md` so no test names a removed file.
10. Descriptions that advertise the removed docs: `skills/add--ecosystem/SKILL.md:192` and `web/src/pages/docs.astro:557` both say "Components, mobile-first, SaaS patterns, shadcn, Tailwind" → reword both identically to the design core (e.g. "Design direction, UX laws, layout contract, critique rubric, SaaS patterns, mobile-first"). The "loads" list on :192 and the graph edges in `docs.astro:1122-1242` are unchanged (the skill keeps its name and callers).
11. No migration script: `pruneObsolete` (`cli/src/release-copy.js:101`, called by `cli/src/updater.js:105`, `cli/src/installer.js:360`, `cli/src/modify.js:237`) deletes every prior-manifest file the new release does not write; skill files are not matched by `PRESERVE_PATTERNS` (`release-copy.js:17`). `framwork/provider-map.json:138` (`"add--ux-design": {}`) stays — the skill is kept. `cli/src/migrations.js` has no reference.
12. Unchanged: the planning pipeline — `add-plan` design step (flow → layout → critique → `design.md`), `@ux-flow-agent`, `@ux-agent`, `qa-agent`, the files they load (`design-contract.md`, `critique-rubric.md`, `add-plan.md:20`), and `cli/tests/qa-reachability.smoke.test.js:281-299`, which checks only kept files.
13. Scope out: stack-flavoured wording that is not a reference to a removed file — `add-hotfix.md:408` ("shadcn, Tailwind v3"), `ux-agent.md:142`, `ux-flow-agent.md:31,33`, `add-ux.md:50,52`, `add-review.md:529`, `add-plan.md:567`, `frontend-agent.md:41`, code examples inside `SKILL.md` / `modern-patterns.md` / `design-contract.md` → card `agnostic-dev-skills`. The ui-ux-pro-max integration → card `design-plugin` (this card blocks it). No rename of the skill or of any STEP id.
14. Target: next release.
15. Acceptance criteria: (a) the seven files are gone, the eight kept files are present, and `npm run build` passes (no dangling `uses:` row); (b) `rg --hidden "shadcn-docs|tailwind-v3-docs|motion-dev-docs|recharts-docs|tanstack-(query|router|table)-docs" framwork/ cli/ web/ workbench/ scripts/` returns nothing; (c) `npm run test:all` passes; (d) `ux-layout-agent.md`, `add-ux.md` and `add-build.md` point component APIs to the project's conventions (`wiki/conventions.md` / `AGENTS.md`), never to bundled docs; (e) the built `add--ux-design` folder for a provider is ~84KB; (f) the release note carries the warning in decision 16.
16. Risks: projects that relied on the bundled shadcn/Tailwind/etc. docs lose them on `update` (agents fall back to the project's own components and docs) → release note. Local edits inside the seven files are also deleted by `pruneObsolete`, same note. Layout quality for a greenfield project with no components now depends on `Recommended Libraries` defaults plus the model's own knowledge; acceptable, the design core and the `design-plugin` card cover it.

## Open

None

## Card dependency

Blocks `design-plugin`. Depends on nothing.

## Board changes

- status: shaped
- title: Slim add--ux-design to the design core (drop bundled library docs)
- done_when: the seven library-doc files (shadcn, tailwind-v3, motion-dev, recharts, tanstack-query/router/table) are gone from add--ux-design; the eight design-core files stay; SKILL.md uses-block and Docs Lookup, ux-layout-agent, add-ux, add-build, resource-path-convention, build.test, ecosystem index and docs.astro no longer reference them; component APIs point to the project's conventions (wiki/conventions.md / AGENTS.md); build and test:all pass; the release note warns that update removes the bundled docs.
- paths: framwork/.codeadd/skills/add--ux-design/{shadcn-docs.md,tailwind-v3-docs.md,motion-dev-docs.md,recharts-docs.md,tanstack-query-docs.md,tanstack-router-docs.md,tanstack-table-docs.md}, framwork/.codeadd/skills/add--ux-design/SKILL.md, framwork/.codeadd/agents/ux-layout-agent.md, framwork/.codeadd/commands/add-ux.md, framwork/.codeadd/commands/add-build.md, framwork/.codeadd/skills/add--resource-path-convention/SKILL.md, framwork/.codeadd/skills/add--ecosystem/SKILL.md, web/src/pages/docs.astro, cli/tests/build.test.js

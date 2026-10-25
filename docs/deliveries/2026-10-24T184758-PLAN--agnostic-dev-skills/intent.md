---
path: bounded
topic: agnostic-dev-skills
doc: none
delivery: confirm
ticket: 0063B
---

## Decided

1. Problem: the dev skills, and the commands, agents and review skills that cite them, impose one stack's rules on every project. The rules are: tenancy by `account_id` on every table and query, mandatory DI-container registration, mandatory barrel files, TypeScript-interface entities, a `toEntity` mapper, Zod as the form default, and a fixed Clean Architecture layer order. On top of that, a NestJS/Kysely review checklist runs everywhere, and `add-review` checks for these rules even in projects that do not use them. `add-plan` and `add-build` still list CQRS, which the skill already removed (`skills/add--backend-development/SKILL.md:201`). Goal: conventions and good practices, KISS/YAGNI, no over-engineering. Verified on main `dfe98bb0` (v1.5.13). All paths below are under `framwork/.codeadd/` unless stated otherwise.
2. One canonical reference sentence (the "conventions rule"), used with the same wording everywhere this card touches: "Project conventions: follow `{{addpath:wiki/conventions.md}}` → `## Stack Conventions` (+ `{{addpath:wiki/domains/<area>.md}}`); a one-line critical rule may live in `AGENTS.md`. If absent, apply the agnostic defaults and follow the nearest existing code; never impose tenancy, DI registration or barrels unless the project uses them." The order is wiki first, then AGENTS.md (`## Architecture Contract` / `## Technical Spec`) as fallback for stack facts. AGENTS.md is no longer called the "source of patterns/truth" for conventions.
3. Agnostic defaults (written once, in `add--backend-development` as a short `## Project Conventions First` section placed right after the intro; the other two dev skills link to it and do not copy it):
   - Tenancy: none. If a feature introduces tenant-scoped data in a project without tenancy, raise it as a planning question. Never add it silently.
   - DI: pass collaborators in (constructor/parameters) for testability. Register in a container only if the project has one (row `DI`).
   - Barrels: do not create new ones. If the folder already has one, add the export (row `Barrels`).
   - Entities: the project's language and the form used by neighbouring entity files (row `Entity language`).
   - Validation: validate at the boundary with the project's library (row `Validation`). Never add a new library. If there is none, flag it in the plan.
   - Data access: use a repository and mapper (`toEntity`) only when the project already uses them or persistence naming differs from domain naming (row `ORM / data access`).
   - Layering: follow `{{addpath:wiki/architecture.md}}` / row `Layering`. The default rule is only "keep HTTP/IO out of business logic".
4. Rewrite `skills/add--backend-development/SKILL.md` (327 lines) as stack-agnostic:
   - :22-24 "Stack resolution"/"Reference" → the conventions rule.
   - `## Clean Architecture` (:39-57): the layer table becomes "one common layering" (an example, not a mandate), with the project's layering winning.
   - `## Dependency Injection / IoC` (:117-128): drop "EVERY … MUST be registered" (:119). Registration applies only when row `DI` names a container.
   - `## Naming Conventions` (:132-156): the `.ts` file table and the `I` prefix become examples under "follow project naming".
   - `## Repository Pattern` (:193-199): conditional, as in decision 3.
   - Remove the CQRS comment at :201.
   - `## Multi-Tenancy` (:252-257): starts "Only when row `Tenancy` = yes". The rules (key from auth context, never from the body, cross-tenant access explicitly guarded) stay as the content.
   - `## Configuration` (:261-271): keep, without `process.env`/`Bun.env` as the only examples.
   - `## Validation Checklist` (:285-327): items for DI, Multi-Tenancy, barrels and the Clean Architecture order become conditional ("if the project uses …"). Remove "URL pattern follows `/api/v1/resource`" (:292) as a mandate; it becomes "follows the project's URL/versioning convention".
   - RESTful, SOLID, DTO, Services, Error Handling and KISS/YAGNI sections stay; they are already agnostic.
5. Rewrite `skills/add--database-development/SKILL.md` (207 lines):
   - Frontmatter description (:4): "Consult AGENTS.md for ORM" → "follow project conventions (wiki)".
   - :14 → the conventions rule.
   - `## Entities` (:18-42): language-neutral principles. The TS block becomes an illustration labelled as one stack. Drop "Use interfaces, not classes" and the mandatory barrel (:42). `accountId` only when Tenancy = yes.
   - `## Enums` (:46-61): drop "Export in `index.ts`" unless barrels are used.
   - `## Naming Convention` (:65-79): the snake/camel split and the `toEntity`/`toPersistence` mapper only when the naming differs. Column-type defaults (UUID, JSONB, tz timestamps) become defaults "unless the project differs".
   - `## Migrations` (:83-104): migration naming follows the existing files, and the `YYYYMMDDNNN_…` pattern is the default only when there are none. Remove `account_id` from the index and standard-columns lists (:94, :102) unless Tenancy = yes.
   - `## Repository Pattern` (:108-143): conditional. Drop "ALWAYS filter by account_id" (:142).
   - `## Barrel Exports (MANDATORY)` (:147-156) → `## Barrel Exports`, applied only when row `Barrels` = yes.
   - `## Multi-Tenancy` (:160-173): "Only when row `Tenancy` = yes". Inside it, the rules stay strict ("every query scoped by the key").
   - `## Validation Checklist` (:177-207): the same conditionals. The section title stays.
6. Rewrite `skills/add--frontend-development/SKILL.md` (177 lines):
   - :18, :20, :40, :72, :82 → the conventions rule (wiki first).
   - `## Types` (:62-64): "interfaces not classes" and "never use `any`" become language-neutral ("no untyped escape hatches").
   - :55 `types/` comment drops "TypeScript".
   - `## Forms` (:97): "Zod or equivalent" → "the project's schema/validation library".
   - `## Structure` (:38-58): marked as a default layout, with the project structure winning.
   - Routing "lazy-loaded" stays as a default where the framework supports it.
   - `## UX Design Integration (MANDATORY)` (:24-34) and its `uses:` row (:10) stay UNCHANGED, including "Never implement frontend without either design.md OR ux-design skill loaded".
7. Light pass on the two architecture consultants. They are already language-agnostic (`skills/add--backend-architecture/SKILL.md:19`, `skills/add--frontend-architecture/SKILL.md`):
   - add one line near the top: "When the project already has recorded conventions (`{{addpath:wiki/conventions.md}}` → `## Stack Conventions`), treat them as the current state; recommend changes against them, not from scratch."
   - Frontend Barrel strategy (:144) and FSD `index.ts` public API (:103) stay as design advice, with "if the project uses barrels" added at :103.
   - The `references/` files are not changed.
8. Keep every skill name and every heading that a consumer cites:
   - Skill names: `add--backend-development`, `add--database-development`, `add--frontend-development`, `add--backend-architecture`, `add--frontend-architecture`. Registry `framwork/provider-map.json:104,105,108,117,118` stays.
   - `## Validation Checklist` in each dev skill is load-bearing: `add-build.md:871` ("Extract '## Validation Checklist' from skill file").
   - Agent frontmatter `skills:` / `uses:` (`agents/backend-agent.md:5-13`, `database-agent.md:5-12`, `frontend-agent.md:5-12`, `architecture-agent.md:8-16`) and the citers `add-plan.md:4-12,474,523,923-925`, `add-build.md:4-13,556-557,740-746`, `add-review.md:523,565`, `skills/add--code-review/SKILL.md:9-11,51-53`, `skills/add--subagent-driven-development/SKILL.md:9-14,657-659`, `skills/add--resource-path-convention/SKILL.md:61-64,118` cite names only. They keep working.
   - Heading changes are limited to dropping "(MANDATORY)" from the database `## Barrel Exports` heading; nothing cites it.
9. Replace hard-coded stack rules in commands and agents with the conventions rule. Line numbers below were re-verified:
   - `commands/add-plan.md`:
     - :42 ARCHITECTURE REFERENCE → "Use the project wiki (`wiki/conventions.md`, `wiki/architecture.md`) as source of patterns; `AGENTS.md` for structure and commands".
     - :474 parenthetical → "(RESTful API, DTO naming, project conventions — tenancy/DI only when the project uses them)".
     - :502 event payload example `id,accountId` → `id` (+ tenant key when Tenancy = yes).
     - :567 hooks/stores example `TanStack Query`/`Zustand` → "[project data-fetching lib]"/"[project store]".
     - :672, :684 "TypeScript structures/interface" → "typed structure in the project's language".
     - :725, :734 "Worker/DI Registration" → "registration per the project's DI pattern (skip when there is no container)". Check title "Worker/DI Registration" kept so the three-check list stays three.
   - `commands/add-build.md`:
     - :736 "barrel exports" → "barrel exports (if the project uses them)".
     - :737-738 "module registration" → "registration per project DI convention".
     - :744 parenthetical → "(RESTful, DTOs, project conventions)": CQRS removed, "IoC, Multi-tenancy" replaced.
     - Guard: `cli/tests/delivery-boundary.test.js:180-194` requires this STEP to keep `MANDATORY: Load skill \`add--frontend-development\``, the three skill names, and no `Kysely|Knex|Zustand|NestJS|class-validator|app.module.ts|worker.module.ts\`.
   - `commands/add-review.md`:
     - :121 Architecture-reference row → Source "wiki `conventions.md` (+ area pages), `AGENTS.md` fallback". What: "config, DI, repo, naming, tenancy, security, structure — as the project defines them". CQRS removed.
     - :334-346 STEP `add-review.load-project-architecture`: read the Stack Conventions table first, AGENTS.md as fallback. Drop "CQRS patterns" (:340). DI/tenancy lines say "(as recorded; skip when none)". Replace "AGENTS.md is the source of truth" (:346) with "Recorded conventions are the source of truth; AGENTS.md is the fallback". The STEP id is unchanged.
     - :522, :564 hard-coded `apps/frontend/**` / `apps/backend/** OR libs/**` → "files in the frontend/backend area per the Architecture Contract".
     - Frontend checklist :529 "React patterns … TanStack Query" → "Framework patterns: composition, state and data fetching per project conventions". :531 "No `any` types" → "no untyped escape hatches (e.g. `any`)".
     - Backend checklist :572 → "DI/registration per project convention (barrels only if used), REST API …, DTOs …". :574 fixed layer order → "layer direction per `wiki/architecture.md` / Architecture Contract". :578 "account_id filtering (multi-tenancy)" → "tenant scoping when Tenancy = yes". :580 "No `any` types" as on :531.
     - Guard `delivery-boundary.test.js:175-178,196-200`: keep the `  ## VALIDATION CHECKLIST` + blank line + `  **Patterns` opening, with no stack names.
   - `commands/add-brainstorm.md:23` and `commands/add-hotfix.md:30` (same ARCHITECTURE REFERENCE line as add-plan:42) → same rewrite. Not in the card; found on re-verification.
   - `agents/backend-agent.md`: :3 description "Clean Architecture patterns" → "the project's architecture patterns". :24 → "Register dependencies per the project's DI convention (only if it uses a container)". :36 fixed layer order → "the project's layer structure (wiki/architecture.md)". :45 → "Tenancy: follow the recorded convention; never introduce it".
   - `agents/database-agent.md`: :23 → "Apply the project's tenancy pattern when it has one (RLS, key column, schema isolation)". :53 → "Tenancy pattern as recorded; never introduce it".
   - `agents/fix-agent.md:31`: `add-[AREA]-development` → `add--[AREA]-development`. The single-dash name matches no skill, so this is a one-character bug fix found on verification.
   - Nothing in `agents/architecture-agent.md` or `skills/add--subagent-driven-development/SKILL.md` imposes a stack; they are not changed.
10. Stack mentions deferred from `ux-design-core-slim` (re-verified, all → project conventions/design-system inventory):
    - `commands/add-hotfix.md:408` "Follow patterns (mobile-first, shadcn, Tailwind v3)" → "mobile-first, the project's component library and styling per conventions".
    - `agents/ux-agent.md:142` "Prefer standard patterns (shadcn, Tailwind)" → "Prefer the project's existing components and styling over custom implementations".
    - `agents/ux-flow-agent.md:31` "Analyze tailwind config files and CSS …" → "the styling config the project uses (e.g. Tailwind config, CSS custom properties, theme files)". :33 "shadcn status" → "component library in use (name, which components are installed)".
    - `commands/add-ux.md:50` "Tailwind config" → "styling/theme config". :52 `components/ui/` → "the UI components directory".
    - `commands/add-review.md:529`: covered in decision 9.
    - `commands/add-plan.md:567`: covered in decision 9.
    - `agents/frontend-agent.md:41` "(shadcn, MUI, etc.)" → "(as recorded in conventions / the design-system inventory)". :42 "(React Query, Zustand, Redux, etc.)" → "(as recorded in conventions)". :35 "TypeScript strict mode when applicable" stays.
    - Merge order: `ux-design-core-slim` edits other lines of `add-ux.md`/`add-build.md` first, so re-locate lines by text, not number.
11. Review skills that would still impose the rules. Not in the card; found on re-verification. Without these edits the review keeps checking `account_id`/IoC everywhere.
    - `skills/add--code-review/SKILL.md`:
      - §3 `IoC Configuration (CRITICAL)` (:123-150), a NestJS-only table (`@Injectable`, `app.module.ts`, `libs/app-database/...`): becomes "Registration per project DI convention". The NestJS table is reduced to one labelled example, or removed. When the project has no container the check is `N/A` with full score.
      - §5 :179 "Kysely handles automatically" → "the driver/ORM handles it".
      - §6 :190, :193-196 `account_id` rules → conditional on Tenancy = yes.
      - §9 :225 "Kysely types updated" → "generated query/ORM types regenerated (if the project uses them)".
      - §10 :235 `IConfigurationService` → "the project's config module".
      - Rules :303, :308 (IoC, `AppModule.imports[]`, barrels in `libs/`) → conditional.
      - :31 Reference → the conventions rule.
      - Section numbers/titles §1-§10, Phase 2 order and the `weights` keys (:243, including `ioc`) stay.
    - `skills/add--security-audit/SKILL.md`:
      - A01 :20-30 "Multi-tenant rules" → "When Tenancy = yes". The key is the recorded one, not the literal `account_id`. The greps become examples (`@Body()` is NestJS).
      - Process :175 the same. "Ownership validated" and "Guards" stay unconditional.
    - Unchanged: `add--health-check` (already conditional through `context-discovery.md:82`) and `agents/security-agent.md:39`, which flags a removed tenant filter and is still correct.
12. Ecosystem/docs: if a skill's frontmatter `description` changes, update the matching row in `skills/add--ecosystem/SKILL.md:150-167` and `web/src/pages/docs.astro:554-556,575` to the same text. The edge lists (`docs.astro:1122-1249`) do not change.
13. No migration script and no registry change: same files, same names. `pruneObsolete` is not involved. The guard tests that touch these files are:
    - `delivery-boundary.test.js` (decision 9);
    - `build-injection-points.test.js:214-253`: no numeric `STEP N` in commands/agents, and the slot markers in `backend-agent.md:31-34`, `database-agent.md:30-33`, `frontend-agent.md:29-32` and the commands are not moved;
    - `build.test.js:477-482`: agent → skill map.
14. NEW test `cli/tests/agnostic-dev-skills.test.js`:
    - (a) no `CQRS` in `commands/`;
    - (b) each of the three dev skills, `add--code-review` and `add--security-audit` contains `wiki/conventions.md` and `## Validation Checklist` (the latter where it exists today);
    - (c) `add-review.md`, `add-plan.md`, `add-build.md`, `backend-agent.md` and `database-agent.md` contain no unconditional `account_id`. Every match sits on a line that also has "Tenancy" or "tenancy";
    - (d) no `AGENTS.md` "source of patterns"/"is the source of truth" phrasing remains in `commands/`;
    - (e) the `frontend-development` UX Design Integration rule is intact.
15. Depends on `wiki-stack-conventions`: it defines the `## Stack Conventions` rows (`Tenancy`, `DI`, `Barrels`, `Layering`, `Validation`, `ORM / data access`, `Entity language`) that this card reads. It also assumes `remove-generic-skills` lands first, because that card removes the `add--project-scaffolding` mentions in `add--backend-development:13,35` and `add--backend-architecture:12,26`. Do not re-add them.
16. Scope out:
    - `add--health-check` analyzers.
    - The plan-backend template's `### Commands` block (`add-plan.md:498`). It is a section of the plan format, not a CQRS mandate, and renaming it would touch the plan schema.
    - `system-design-agent` CQRS advice (advisory).
    - `add--frontend-architecture/references/*` library examples.
    - The Technical Spec example in `add--architecture-discovery/SKILL.md:289`.
    - Greenfield decisions → `brainstorm-greenfield`.
17. Target: next release.
18. Acceptance criteria:
    - (a) On a single-tenant project without a DI container or barrels, `/add-plan`, `/add-build` and `/add-review` never ask for `account_id` filtering, container registration or barrel exports, and the review raises no finding for their absence.
    - (b) On a project whose Stack Conventions row says Tenancy = yes (key + enforcement), the review still flags a query missing the key as critical.
    - (c) With no wiki, agents follow existing code and the defaults (decision 3) without errors.
    - (d) `rg -n "CQRS" framwork/.codeadd/commands` returns nothing.
    - (e) `npm run build` and `npm run test:all` pass, including `delivery-boundary` and the new test.
    - (f) The three dev skills keep their names and `## Validation Checklist`, and frontend keeps the UX Design Integration rule.
19. Risks:
    - Existing multi-tenant projects whose wiki predates `wiki-stack-conventions` lose the hard-coded `account_id` reminder until the section exists. Mitigations: `/add-wiki update` backfills it (decision 9c of that card), and the agents' "follow nearest existing code" rule still applies. The release note tells users to run `/add-wiki update`.
    - Softer checklists can let real mistakes through in projects that use DI/barrels without recording them. Mitigation: when the row is `none`, the review falls back to neighbour-code consistency.
    - This card is large (5 skills, 2 review skills, 5 commands, 6 agents). Recommended plan split: skills first, then commands/agents/review.

## Open

None

## Card dependency

Depends on `wiki-stack-conventions` (and lands after `remove-generic-skills` and `ux-design-core-slim`, which edit nearby lines). Blocks nothing. `brainstorm-greenfield` goes after it.

## Board changes

- status: shaped
- title: Stack-agnostic dev skills (conventions from the project wiki, no imposed tenancy/DI/barrels)
- done_when: add--backend-development, add--database-development and add--frontend-development are stack-agnostic. They read project conventions from wiki/conventions.md (## Stack Conventions) with AGENTS.md as fallback, apply tenancy, DI registration, barrels, TS-only entities, the Zod default and toEntity only when the project uses them, and keep their names and ## Validation Checklist (the frontend design.md/ux-design rule unchanged). The two architecture skills defer to recorded conventions. add-plan, add-build, add-review, add-brainstorm, add-hotfix, add-ux and the backend/database/frontend/ux/ux-flow/fix agents carry no hard-coded stack, tenancy, DI or CQRS rule, and the wording deferred from ux-design-core-slim is resolved. add--code-review and add--security-audit check IoC and tenancy only when the project uses them. build and test:all pass, including delivery-boundary and the new guard test.
- paths: framwork/.codeadd/skills/add--backend-development/SKILL.md, framwork/.codeadd/skills/add--database-development/SKILL.md, framwork/.codeadd/skills/add--frontend-development/SKILL.md, framwork/.codeadd/skills/add--backend-architecture/SKILL.md, framwork/.codeadd/skills/add--frontend-architecture/SKILL.md, framwork/.codeadd/skills/add--code-review/SKILL.md, framwork/.codeadd/skills/add--security-audit/SKILL.md, framwork/.codeadd/commands/add-plan.md, framwork/.codeadd/commands/add-build.md, framwork/.codeadd/commands/add-review.md, framwork/.codeadd/commands/add-brainstorm.md, framwork/.codeadd/commands/add-hotfix.md, framwork/.codeadd/commands/add-ux.md, framwork/.codeadd/agents/backend-agent.md, framwork/.codeadd/agents/database-agent.md, framwork/.codeadd/agents/frontend-agent.md, framwork/.codeadd/agents/ux-agent.md, framwork/.codeadd/agents/ux-flow-agent.md, framwork/.codeadd/agents/fix-agent.md, framwork/.codeadd/skills/add--ecosystem/SKILL.md (only if descriptions change), web/src/pages/docs.astro (only if descriptions change), cli/tests/agnostic-dev-skills.test.js (new)

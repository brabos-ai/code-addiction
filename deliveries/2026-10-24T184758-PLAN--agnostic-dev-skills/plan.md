# Plan: Agnostic dev skills — conventions come from the project wiki, no imposed tenancy/DI/barrels

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-24
> **Delivery:** confirm
> **Ticket:** 0063B

---

## Objective

[from conversation, no design document] The dev skills, and the commands, agents and review skills that
cite them, stop imposing one stack's rules on every project. Tenancy by `account_id`, DI-container
registration, barrel files, TypeScript-interface entities, a `toEntity` mapper, Zod as the form default and a
fixed Clean Architecture layer order apply only when the project uses them. Project conventions are read from
`wiki/conventions.md` → `## Stack Conventions` (card 0062B), with `AGENTS.md` as fallback. Goal: conventions
and good practices, KISS/YAGNI, no over-engineering.

**When this build is done:** the five skills (three dev, two architecture) read the project's recorded
conventions first and carry one written set of agnostic defaults; `add-plan`, `add-build`, `add-review`,
`add-brainstorm`, `add-hotfix`, `add-ux` and six agents carry no hard-coded stack, tenancy, DI or CQRS rule;
`add--code-review` and `add--security-audit` check IoC and tenancy only when the project uses them, and still
flag a missing tenant key as critical when it does. The four places that load a dev skill by the wrong name
(`add-[AREA]-development` / `add-${AREA}-development`, a name that matches no skill) load the right one. A new
read-only guard test pins all of it. Every skill name, every cited heading and every STEP id stays.

**Ticket done when:** add--backend-development, add--database-development and add--frontend-development are stack-agnostic. They read project conventions from wiki/conventions.md (## Stack Conventions) with AGENTS.md as fallback, apply tenancy, DI registration, barrels, TS-only entities, the Zod default and toEntity only when the project uses them, and keep their names and ## Validation Checklist (the frontend design.md/ux-design rule unchanged). The two architecture skills defer to recorded conventions. add-plan, add-build, add-review, add-brainstorm, add-hotfix, add-ux and the backend/database/frontend/ux/ux-flow/fix agents carry no hard-coded stack, tenancy, DI or CQRS rule, and the wording deferred from ux-design-core-slim is resolved. add--code-review and add--security-audit check IoC and tenancy only when the project uses them. build and test:all pass, including delivery-boundary and the new guard test.

## Context

Card 4 of 6 in the `2026-10-24T18300*` set. It depends on 0062B (`wiki-stack-conventions`), which creates
the `## Stack Conventions` table this card reads, and lands after 0060B (`remove-generic-skills`) and 0061B
(`ux-design-core-slim`), which edit neighbouring lines of the same files. **This plan assumes all three are
merged.** Every edit below is anchored by quoted text from main `dfe98bb0`; where 0060B or 0061B rewrites a
nearby line, the overlap is named in **Cross-Card Overlaps**.

**Every decision here was taken and approved in the document below. This plan does not re-derive them — it
points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-24T183004-agnostic-dev-skills-intent.md` | `path: bounded`; decisions 1–19 (the conventions rule, the agnostic defaults, per-file edits for 5 skills, 2 review skills, 6 commands and 6 agents, names/headings that stay, guard tests, scope out, acceptance, risks); `## Open` = None |

Decisions this plan adds on top (no intent decision covered them; each is in Validated Decisions with its
reason): D-A the `add-${AREA}` bug has four sites, not one; D-B the tenancy-line test names the `Tenancy` row
case-sensitively; D-C the tiny-wiki location of the table is written once; D-D no ecosystem or `docs.astro`
edit; D-E `### 3. IoC Configuration (CRITICAL)` keeps its heading; D-F the two `IConfigurationService` lines in
`add--security-audit`; D-G one plan with checkpoints, not a split; D-H the `add-review.scope` area paths.

## Global Constraints

- The conventions rule, verbatim, wherever this plan says "the conventions rule": "Project conventions: follow `{{addpath:wiki/conventions.md}}` → `## Stack Conventions` (+ `{{addpath:wiki/domains/<area>.md}}`); a one-line critical rule may live in `AGENTS.md`. If absent, apply the agnostic defaults and follow the nearest existing code; never impose tenancy, DI registration or barrels unless the project uses them." (intent, decision 2)
- The seven row names, exactly as 0062B writes them: `Tenancy`, `DI`, `Barrels`, `Layering`, `Validation`, `ORM / data access`, `Entity language` (intent, decision 15; `2026-10-24T183514-PLAN--wiki-stack-conventions.md`, Global Constraints)
- The agnostic defaults are written ONCE, in `add--backend-development` `## Project Conventions First`; the other two dev skills link to it and never copy it (intent, decision 3)
- No skill rename, no STEP id change, no `provider-map.json` change, no migration script, no `uses:` change (intent, decisions 8, 13)
- Kept verbatim: every `## Validation Checklist` heading in the three dev skills (cited by `add-build.md` "Extract \"## Validation Checklist\" from skill file"); `## UX Design Integration (MANDATORY)`, its `uses:` row and "**RULE:** Never implement frontend without either design.md OR ux-design skill loaded." in `add--frontend-development` (intent, decisions 6, 8)
- `add--code-review` keeps section numbers and titles §1–§10, the Phase 2 order and the `weights` keys, `ioc` included (intent, decision 11)
- `add-build.md` STEP `add-build.area-specific-notes` keeps "MANDATORY: Load skill `add--frontend-development`" and the three skill names, and carries no `Kysely|Knex|Zustand|NestJS|class-validator|app.module.ts|worker.module.ts`; `add-review.md` keeps the `  ## VALIDATION CHECKLIST` + blank line + `  **Patterns` opening and its six categories (`cli/tests/delivery-boundary.test.js`, L1.5)
- `database-agent.md` keeps the string `AGENTS.md` (migration tool line) and the gitnexus slot markers (`cli/tests/delivery-boundary.test.js`, L1.4)
- No slot or injection marker is moved; no numeric `STEP N` text is written; an edited line that is an injection anchor carries no `{{cmd:}}`/`{{skill:}}`/`{{addpath:}}` variable (`cli/tests/build-injection-points.test.js`; `scripts/build.js` "@throws if a chosen anchor line carries a {{cmd:}}/{{skill:}}/{{addpath:}} variable")
- Do not re-add `add--project-scaffolding` anywhere (intent, decision 15; card 0060B removes it)
- Stack-agnostic: no edit adds a library, framework or stack name as a default; a stack name may appear only inside a line that labels it as one example (Maicon's binding rule for this plan)
- Anchor every edit by quoted text, never by line number (Maicon's binding rule for this plan)
- No deploy, publish, rollout or release task — the user note is changelog text only (Maicon's binding rule for this plan)
- `node scripts/build.js` exits 0 with no new warning; `npm run test:all` passes in the container per `scripts/run-tests.js` (intent, decision 18e; AGENTS.md, Pipeline)

## Problem

1. **One stack's rules run everywhere** — the dev skills mandate `account_id` tenancy, DI registration,
   barrels, TS-interface entities, `toEntity`, Zod and a fixed layer order; `add-review` and
   `add--code-review` check them (a NestJS/Kysely IoC table among them) in projects that use none of them.
2. **Stale CQRS mandate** — `add-plan` and `add-build` still list CQRS, which the skill already removed.
3. **AGENTS.md is called the source of patterns** — the wiki now has a fixed home for conventions (0062B)
   and nothing reads it.
4. **A dev skill loaded by a name that does not exist** — `add-build.md` (twice), `fix-agent.md` and
   `test-agent.md` load `add-${AREA}-development` / `add-[AREA]-development`. The skills are named
   `add--<area>-development`, so the implementer, the validator, the fixer and the test writer can miss the
   skill and, with it, the `## Validation Checklist` the validator extracts.

## Proposal

Write a read-only guard test first and record it RED. Fix the wrong-name bug next, as its own red-green pair.
Then rewrite the skills (the defaults land once, in `add--backend-development`), then the review skills, then
the commands, then the agents — each F-block turning its own assertions GREEN. One plan on one branch with
checkpoints: the skills phase leaves a tree that builds and passes every existing test before the commands
phase starts.

## Scope

### Includes

#### Phase A — the guard test

- **F1** [product] — NEW `cli/tests/agnostic-dev-skills.test.js` (vitest; reads `framwork/.codeadd/` source
  only, writes nothing). It asserts L1.1–L1.15 of the Validation Matrix. Header comment names this plan, says
  every non-GUARD assertion was RED before F2, and labels the GUARD assertions (L1.3, L1.6, L1.14 first half)
  that pass today and must keep passing. Run it against the current tree with
  `node scripts/run-tests.js cli agnostic-dev-skills` (container; never `npx vitest` in `cli/`) and paste
  the failing assertion names into the ledger.
  - **Produces:** `agnostic-dev-skills.test.js` (the RED suite F2–F16 turn GREEN)

#### Phase B — bug fix, red-green (D-A)

- **F2** [product] — the wrong dev-skill name, four sites (intent, decision 9 `fix-agent` bullet, widened by
  D-A). RED is L1.7, recorded in F1. Then:
  - `framwork/.codeadd/commands/add-build.md`: in `## MANDATORY: Load Development Skill`, the line
    "Read: skill add-${AREA}-development (patterns, validation, code style)" → `add--${AREA}-development`.
    In `## Self-Bootstrap (FIRST STEP)` of the validator prompt, "2. Read skill: add-${AREA}-development" →
    `add--${AREA}-development`. Nothing else on either line changes.
  - `framwork/.codeadd/agents/fix-agent.md`: "1. Load `add-[AREA]-development`" → `add--[AREA]-development`.
  - `framwork/.codeadd/agents/test-agent.md`: "1. Load the `add-[AREA]-development` skill by name" →
    `add--[AREA]-development`.
  - Must NOT touch the next line "- Reference component docs as needed: …" (0061B owns it; after 0061B it
    reads "- Component/library APIs: follow the project's own docs per …").
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

#### Phase C — the five skills

- **F3** [product] — `framwork/.codeadd/skills/add--backend-development/SKILL.md` (intent, decisions 3, 4):
  - The two lines starting "**Stack resolution:** Consult `AGENTS.md ## Architecture Contract`" and
    "**Reference:** Always consult `AGENTS.md` for general project standards." → the conventions rule.
  - NEW `## Project Conventions First`, right after the intro (after the `**Not for:**` line block, before
    the `---` that opens "## When NOT to Use"): the conventions rule's order (wiki first, then
    `AGENTS.md` `## Architecture Contract` / `## Technical Spec` for stack facts), the seven defaults of
    intent decision 3, each naming its row, and one line (D-C): in a tiny wiki the same table sits in
    `{{addpath:wiki/index.md}}` → `### Stack Conventions`.
  - `## Clean Architecture`: the layer table becomes "one common layering", an example; the project's
    layering (`{{addpath:wiki/architecture.md}}` / row `Layering`) wins.
  - `## Dependency Injection / IoC`: drop "**EVERY service, repository, and handler MUST be registered in
    the framework's DI container.**"; "Register all components in the framework's container/module system"
    applies only when row `DI` names a container. Constructor/parameter injection stays as the default.
  - `## Naming Conventions`: the `.ts` file table and the `I` prefix become examples under "follow project
    naming"; "check `tsconfig.json` paths" becomes "check the project's alias config (e.g. `tsconfig.json`
    paths)". `## Module / Feature Structure`: the tree is labelled one example layout (it names `.ts` files
    and `[feature].module.ts (or index.ts)`).
  - `## Repository Pattern`: conditional, per the "Data access" default.
  - Remove "<!-- CQRS section removed — flagged for future split into add-backend-cqrs skill -->".
  - `## Multi-Tenancy`: opens "Only when row `Tenancy` = yes"; the four rules stay as content, with the key
    named "the recorded tenant key (e.g. `account_id`)".
  - `## Configuration`: keep; "(`process.env`, `Bun.env`, etc.)" becomes language-neutral (e.g. "reading
    the environment directly").
  - `## Validation Checklist`: the `### Clean Architecture`, `### Dependency Injection` and
    `### Multi-Tenancy` items become conditional ("if the project uses …"); "URL pattern follows
    `/api/v1/resource`" → "follows the project's URL/versioning convention". Sub-headings stay.
  - Must NOT lose: the frontmatter `name`, the `uses:` block as 0060B left it, RESTful, SOLID, DTO,
    Services, Error Handling, KISS/YAGNI sections, `## Validation Checklist`.
  - **Produces:** `## Project Conventions First` (heading in `add--backend-development/SKILL.md`)
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F4** [product] — `framwork/.codeadd/skills/add--database-development/SKILL.md` (intent, decision 5):
  - Frontmatter `description`: "Consult AGENTS.md for ORM." → "Follow project conventions (wiki) for the
    ORM." The rest of the description stays.
  - "**Stack orientation:** Consult `AGENTS.md ## Architecture Contract` for the ORM" → the conventions rule
    plus a link to `add--backend-development` → `## Project Conventions First`.
  - `## Entities`: language-neutral principles; the TS block labelled as one stack's illustration; drop
    "Use interfaces, not classes" and "**MANDATORY:** Export in barrel file (`entities/index.ts`)."
    `accountId` only when row `Tenancy` = yes.
  - `## Enums`: "Export in `index.ts`" only when row `Barrels` = yes.
  - `## Naming Convention`: the snake/camel split and `toEntity` / `toPersistence` only when persistence
    naming differs from domain naming; UUID, JSONB, timezone timestamps become defaults "unless the project
    differs". `account_id` leaves the example column.
  - `## Migrations`: naming follows the existing files; `YYYYMMDDNNN_…` is the default only when there are
    none. `account_id` leaves the index list and the standard-columns table unless row `Tenancy` = yes.
  - `## Repository Pattern`: conditional; drop "ALWAYS filter by `account_id`/`tenant_id`".
  - `## Barrel Exports (MANDATORY)` → `## Barrel Exports`, applied only when row `Barrels` = yes.
  - `## Multi-Tenancy`: opens "Only when row `Tenancy` = yes"; inside, the rules stay strict (every query
    scoped by the recorded key).
  - `## Validation Checklist`: the same conditionals; the title and sub-headings stay.
  - **Consumes:** `## Project Conventions First` (heading in `add--backend-development/SKILL.md`) (F3);
    `agnostic-dev-skills.test.js` (F1)

- **F5** [product] — `framwork/.codeadd/skills/add--frontend-development/SKILL.md` (intent, decision 6):
  - "**Stack orientation:** Consult `AGENTS.md ## Architecture Contract`" and "**Reference:** Always consult
    `AGENTS.md`" → the conventions rule plus the link to `## Project Conventions First`. The "(see
    `AGENTS.md`)" pointers in `## Structure`, `## Data Fetching` and `## State Management` → "(see project
    conventions)".
  - `## Structure`: marked a default layout, the project structure wins; the `types/` comment "Shared
    TypeScript interfaces/types" → "Shared types".
  - `## Types (Mirror Backend DTOs)`: "interfaces not classes" and "never use `any`" become language-neutral
    ("no untyped escape hatches (e.g. `any`)"); same wording in the `### Types` checklist item.
  - `## Forms`: "schema-based validation (Zod or equivalent)" → "schema-based validation with the project's
    schema/validation library".
  - Routing "each route lazy-loaded" stays, as a default where the framework supports it.
  - Must NOT change: `## UX Design Integration (MANDATORY)`, its `uses:` row, its **RULE** line.
  - **Consumes:** `## Project Conventions First` (heading in `add--backend-development/SKILL.md`) (F3);
    `agnostic-dev-skills.test.js` (F1)

- **F6** [product] — the two architecture consultants (intent, decision 7):
  - `framwork/.codeadd/skills/add--backend-architecture/SKILL.md`: after the paragraph starting "Guide
    architectural decisions for backend projects.", one line: "When the project already has recorded
    conventions (`{{addpath:wiki/conventions.md}}` → `## Stack Conventions`), treat them as the current
    state; recommend changes against them, not from scratch."
  - `framwork/.codeadd/skills/add--frontend-architecture/SKILL.md`: the same line after "Guide structural
    decisions for frontend projects."; "Cross-feature imports go through `index.ts` public API only" gains
    "(if the project uses barrels)". The `**Barrel strategy**` row stays.
  - `references/` files are not changed. Must NOT re-add the `add--project-scaffolding` rows 0060B removed.
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

#### Phase D — the review skills

- **F7** [product] — `framwork/.codeadd/skills/add--code-review/SKILL.md` (intent, decision 11; D-E):
  - "**Reference:** Always consult `AGENTS.md` for general project standards." → the conventions rule.
  - `### 3. IoC Configuration (CRITICAL)`: the heading stays (D-E). The body becomes "registration per the
    project's DI convention (row `DI`)"; the NestJS `iocChecklist`, "Files to verify for IoC" and "Common IoC
    Errors" tables reduce to one block labelled as a single-framework example. When row `DI` names no
    container the check is `N/A` with full score.
  - §5 "Kysely handles automatically" → "the driver/ORM handles it".
  - §6: the `Access Control` row and the "Multi-tenant:" list become conditional on row `Tenancy` = yes,
    using the recorded key; when it is yes, a query missing the key stays a critical finding.
  - §9 "Kysely types updated" → "generated query/ORM types regenerated (if the project uses them)".
  - §10 "Use `IConfigurationService`, not `process.env`" → "use the project's config module, not direct
    environment access".
  - `**Don't:**` list: "Skip IoC validation" → "Skip DI validation when the project uses a container";
    "Forget to verify `AppModule.imports[]` or barrel exports in `libs/`" → "Forget to verify registration
    and barrel exports where the project uses them".
  - Must NOT change: §1–§10 numbers and titles, the Phase 2 order, the `weights` keys, the frontmatter
    `description`.
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F8** [product] — `framwork/.codeadd/skills/add--security-audit/SKILL.md` (intent, decision 11; D-F):
  - "**Reference:** Always consult `AGENTS.md` for general project standards." → the conventions rule, as in
    F7; the line ending "consult `AGENTS.md` for the project's stack and documented exceptions." → "consult
    the project's conventions (wiki), then `AGENTS.md`, for the project's stack and documented exceptions."
  - A01 "Multi-tenant rules:" → "When row `Tenancy` = yes:", key = the recorded one (e.g. `account_id`);
    "Ownership validated before UPDATE/DELETE" and "Guards on protected endpoints" stay unconditional. The
    two searches become examples ("e.g. `grep 'findAll|selectFrom'`", "e.g. a body decorator such as
    `@Body()`").
  - `## Process` step 1 "Read `security.md`, `AGENTS.md`" → also reads the conventions rule's sources; step 3
    "Multi-Tenant:" → only when row `Tenancy` = yes.
  - D-F: "`grep 'process.env'` → use `IConfigurationService`" and "`IConfigurationService` is correct" →
    "the project's config module".
  - Must NOT change: the frontmatter `description`, the other OWASP categories, the output template.
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

#### Phase E — the commands

- **F9** [product] — `framwork/.codeadd/commands/add-plan.md` (intent, decisions 9, 10):
  - "> **ARCHITECTURE REFERENCE:** Use `AGENTS.md` as source of patterns." → "> **ARCHITECTURE REFERENCE:**
    Use the project wiki (`wiki/conventions.md`, `wiki/architecture.md`) as source of patterns; `AGENTS.md`
    for structure and commands."
  - STEP `add-plan.backend`: the parenthetical "(RESTful API, IoC/DI, DTO naming, CQRS, multi-tenancy)" →
    "(RESTful API, DTO naming, project conventions — tenancy/DI only when the project uses them)"; the
    line `{"XxxCreatedEvent":{"payload":"id,accountId","consumers":"AuditWorker"}}` becomes
    `{"XxxCreatedEvent":{"payload":"id","consumers":"AuditWorker"}}`, followed by one line at the same
    indent: "(+ tenant key in the payload when Tenancy = yes)".
  - STEP `add-plan.frontend`: `"type":"TanStack Query"` → "[project data-fetching lib]"; `"type":"Zustand"`
    → "[project store]".
  - STEP `add-plan.validate-plan` "JSONB fields → detailed TypeScript structures" and STEP
    `add-plan.fill-gaps` "TypeScript interface with detailed field types" → "typed structure in the
    project's language".
  - STEP `add-plan.cross-sf-review`: "missing DI registration" → "missing registration per the project's DI
    pattern"; check 3 keeps the title "Worker/DI Registration" and its parenthetical becomes "(new services
    registered per the project's DI pattern; skip when there is no container)". The list stays three items
    and the phrase "these three, and only these three" stays.
  - Must NOT touch: the plan-backend `### Commands` block, STEP `add-plan.ux-design` (0065B adds a slot
    there), any slot marker.
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F10** [product] — `framwork/.codeadd/commands/add-build.md` STEP `add-build.area-specific-notes` (intent,
  decision 9):
  - "- **Database:** Entities, query types, migration file, Repository, barrel exports" → "… barrel exports
    (if the project uses them)".
  - "module registration" on the `**Backend:**` and `**Workers:**` lines → "registration per project DI
    convention".
  - "- Backend: skill `add--backend-development` (RESTful, IoC, DTOs, CQRS, Multi-tenancy)" → "(RESTful,
    DTOs, project conventions)".
  - Must NOT lose: "MANDATORY: Load skill `add--frontend-development` first" and the three skill names.
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F11** [product] — `framwork/.codeadd/commands/add-review.md` (intent, decisions 9, 10):
  - The `| Architecture reference | \`AGENTS.md\` | Config, DI, repo, CQRS, naming, multi-tenancy, security,
    file structure |` row → Source "wiki `conventions.md` (+ area pages), `AGENTS.md` fallback"; What
    "config, DI, repo, naming, tenancy, security, structure — as the project defines them".
  - STEP `add-review.load-project-architecture` (id unchanged): read the Stack Conventions table first
    (tiny wiki: `index.md` → `### Stack Conventions`, D-C), `AGENTS.md` as fallback; drop "- CQRS patterns
    (if applicable)"; "DI patterns" and "Multi-tenancy rules (if applicable)" say "(as recorded; skip when
    none)"; "**AGENTS.md is the source of truth** for validating code." → "Recorded conventions are the
    source of truth; `AGENTS.md` is the fallback." When a row is `none`, the reviewer falls back to
    consistency with the neighbouring code (intent, decision 19).
  - Frontend reviewer BOOTSTRAP "[list from FILES_TO_REVIEW with apps/frontend/** pattern]" and backend
    reviewer "[list from FILES_TO_REVIEW with apps/backend/** OR libs/** pattern]" → "files in the
    frontend/backend area per the Architecture Contract".
  - D-H: STEP `add-review.scope` "- **frontend**: `apps/frontend/**` detected" and "- **backend**:
    `apps/backend/**` OR `libs/**` detected" → the changed files fall in the frontend/backend area named by
    the Architecture Contract / `wiki/architecture.md`; with neither, judged from the file types. The
    `**owasp**` bullet stays.
  - Frontend `## VALIDATION CHECKLIST`: "React patterns: Hooks, composition, state management, TanStack
    Query" → "Framework patterns: composition, state and data fetching per project conventions"; "No `any`
    types" → "no untyped escape hatches (e.g. `any`)".
  - Backend `## VALIDATION CHECKLIST`: `**Patterns (Critical):**` "IoC/DI (providers, imports, barrel
    exports)" → "DI/registration per project convention (barrels only if used)"; `**Architecture:**`
    "Domain ← Repositories ← Services ← Controllers" → "layer direction per `wiki/architecture.md` /
    Architecture Contract"; `**Security (OWASP):**` "account_id filtering (multi-tenancy)" → "tenant scoping
    when Tenancy = yes (a missing key is critical)"; `**Code Quality:**` "No `any` types" as in the frontend
    list.
  - Must NOT lose: the `  ## VALIDATION CHECKLIST` + blank line + `  **Patterns` opening and the six bold
    categories (delivery-boundary L1.5).
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F12** [product] — `framwork/.codeadd/commands/add-brainstorm.md` and
  `framwork/.codeadd/commands/add-hotfix.md` (intent, decisions 9, 10):
  - Both: "> **ARCHITECTURE REFERENCE:** Use `AGENTS.md` as source of patterns." → the same rewrite as F9.
  - `add-hotfix.md` FRONTEND FIXES: "2. Follow patterns (mobile-first, shadcn, Tailwind v3)" → "2. Follow
    patterns (mobile-first, the project's component library and styling per conventions)".
  - Must NOT touch: `add-brainstorm.md` "- **ARCHITECTURE:** Read AGENTS.md and product.md (if exists)" and
    every line 0064B edits (the greenfield sub-step, the `uses:` block, the hard-gate table, the STEP index).
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F13** [product] — `framwork/.codeadd/commands/add-ux.md` STEP `add-ux.discover` (intent, decision 10):
  "- Tailwind config (`tailwind.config.*`)" → "- Styling/theme config the project uses"; "(`components/ui/`
  directory)" → "(the UI components directory)". STEP `add-ux.docs` is not touched (0061B rewrote it).
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

#### Phase F — the agents

- **F14** [product] — `framwork/.codeadd/agents/backend-agent.md` and
  `framwork/.codeadd/agents/database-agent.md` (intent, decision 9):
  - backend-agent frontmatter `description` "and Clean Architecture patterns" → "and the project's
    architecture patterns"; "- Register dependencies in IoC containers when applicable" → "- Register
    dependencies per the project's DI convention (only if it uses a container)"; "(routes → controllers →
    services → repositories)" → "(`wiki/architecture.md`)"; "- Multi-tenancy patterns must be consistent with
    existing implementation" → "- Tenancy: follow the recorded convention; never introduce it".
  - database-agent "- Handle multi-tenancy patterns (RLS, tenant_id, schema isolation)" → "- Apply the
    project's tenancy pattern when it has one (RLS, key column, schema isolation)"; "- Multi-tenancy pattern
    must be consistent with existing implementation" → "- Tenancy pattern as recorded; never introduce it".
  - Must NOT move: the gitnexus slot markers or their anchor lines ("2. Analyze existing codebase patterns
    …", "2. Analyze existing schema and migration patterns"); database-agent keeps its `AGENTS.md`
    migration-tool line.
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

- **F15** [product] — `framwork/.codeadd/agents/frontend-agent.md`, `ux-agent.md`, `ux-flow-agent.md`
  (intent, decision 10):
  - frontend-agent "(shadcn, MUI, etc.)" → "(as recorded in conventions / the design-system inventory)";
    "(React Query, Zustand, Redux, etc.)" → "(as recorded in conventions)". "TypeScript strict mode when
    applicable" stays.
  - ux-agent "- Prefer standard patterns (shadcn, Tailwind) over custom implementations" → "- Prefer the
    project's existing components and styling over custom implementations".
  - ux-flow-agent Step 0 item 1 "Analyze tailwind config files and CSS files with custom properties" → "the
    styling config the project uses (e.g. Tailwind config, CSS custom properties, theme files)"; item 3
    "shadcn status (yes/no, which installed)" → "component library in use (name, which components are
    installed)". **Item 3 is the anchor line of the `gitnexus.graph` slot**: it stays one line, directly
    above the slot, with no `{{…}}` variable; the anchor is regenerated by the build.
  - Must NOT touch: the slot markers in all three files, ux-flow-agent Step 0 items 4–6 and the line after
    item 6 (0065B inserts `design.direction` there), ux-agent Critique Mode items (0065B inserts
    `design.critique` there).
  - **Consumes:** `agnostic-dev-skills.test.js` (F1)

#### Phase G — close-out text

- **F16** [internal] — the delivery's changelog under `docs/changelog/` (written at build STEP 8; name per
  `add-plan-authoring`, verb `update`, slug `agnostic-dev-skills`): a user-facing note (intent, decision 19)
  — the dev skills and reviews no longer assume `account_id` tenancy, a DI container or barrels; they read
  `wiki/conventions.md` → `## Stack Conventions`; projects whose wiki predates that section run
  `/add-wiki update` to backfill it, otherwise multi-tenant projects lose the hard-coded tenancy reminder;
  `add-build`, `fix-agent` and `test-agent` now load the dev skill by its real name. Text only — no tag, no
  release, no publish.

### Does NOT Include (important!)

- `add--health-check` analyzers; `agents/security-agent.md` (its removed-tenant-filter check stays correct)
- The plan-backend template's `### Commands` block in `add-plan.md` (a plan-format section, not a CQRS mandate)
- `system-design-agent` CQRS advice (advisory)
- `add--frontend-architecture/references/*` and `add--backend-architecture/references/*`
- The Technical Spec example `{"identified":["CQRS","Repository","DI"]}` in `add--architecture-discovery/SKILL.md`
- `agents/architecture-agent.md`, `skills/add--subagent-driven-development/SKILL.md` (impose no stack)
- `skills/add--ecosystem/SKILL.md` and `web/src/pages/docs.astro` (D-D)
- `add-brainstorm.md` "- **ARCHITECTURE:** Read AGENTS.md and product.md" (0064B's context line)
- Greenfield stack decisions → card 0064B; the design plugin → card 0065B
- Any deploy, publish, rollout or release step

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Scope, wording, defaults, kept names | As intent decisions 1–19 | Approved by Maicon (intent `## Decided`) |
| D-A: fix only `fix-agent.md:31`? | No — all four sites: `add-build.md` (implementer prompt and validator Self-Bootstrap), `fix-agent.md`, `test-agent.md` | Same bug, same one-character fix. The validator site is the worst: it extracts `## Validation Checklist` from a skill that does not exist by that name |
| D-B: tenancy test (intent 14c) as written? | Every line matching `account_id`, `accountId` or `tenant_id` in the five files must contain the row name `Tenancy` (case-sensitive) | With "tenancy" lowercase the check is GREEN today ("account_id filtering (multi-tenancy)") and proves nothing; the row name ties the line to the recorded convention |
| D-C: tiny wikis fold the table into `index.md` (0062B D-A) | Keep the conventions rule verbatim; write the tiny-wiki location once in `## Project Conventions First` and in the `add-review.load-project-architecture` STEP | The approved sentence stays one wording; 0062B also writes the tenancy one-liner into `AGENTS.md` in FOLD mode, which the rule already reads |
| D-D: ecosystem / `docs.astro` rows (intent 12) | No edit | The only description that changes is `add--database-development`'s, and its ecosystem row ("Data architecture: entities, repositories, migrations, naming — stack-agnostic") and `docs.astro` entry carry neither "AGENTS.md" nor "multi-tenancy" — they already read true. Not touching them also avoids four other cards' edits to those rows |
| D-E: §3 heading of `add--code-review` | Keep `### 3. IoC Configuration (CRITICAL)`; change the body | Intent 11 keeps §1–§10 titles and the `ioc` weight; Phase 2 cites "**IoC Configuration** — see §3" |
| D-F: `IConfigurationService` in `add--security-audit` | Same rewrite as code-review §10 | Same NestJS-only name the intent removes from code-review; two lines |
| D-H: STEP `add-review.scope` area detection | Same rewrite as the two BOOTSTRAP lines | Intent 9 lists only the BOOTSTRAP lines, but this STEP decides whether a reviewer runs at all; on a project without `apps/frontend/**` acceptance 18a would fail with the frontend reviewer never dispatched |
| D-G: split into two plans (intent 19 risk 3)? | No — one plan, phases A–G, one branch | `add-plan-authoring` → The Ticket: a plan set breaks the `work_id` stop; the phases give the checkpoints |
| RESTful "Versioned: `/api/v1`" bullet in backend-dev | Stays | Intent 4: RESTful section stays; only the checklist mandate changes |
| Permanent test or one-off greps? | Permanent `agnostic-dev-skills.test.js`, RED first | A grep at build time proves nothing next release; five other cards edit these files |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/agnostic-dev-skills.test.js` | product | create | F1 |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F2, F10 — HIGH (26 depth-1) |
| `framwork/.codeadd/agents/fix-agent.md` | product | modify | F2 — HIGH (5) |
| `framwork/.codeadd/agents/test-agent.md` | product | modify | F2 — HIGH (3) |
| `framwork/.codeadd/skills/add--backend-development/SKILL.md` | product | modify | F3 — HIGH (5) |
| `framwork/.codeadd/skills/add--database-development/SKILL.md` | product | modify | F4 — HIGH (6) |
| `framwork/.codeadd/skills/add--frontend-development/SKILL.md` | product | modify | F5 — HIGH (6) |
| `framwork/.codeadd/skills/add--backend-architecture/SKILL.md` | product | modify | F6 — MEDIUM (1) |
| `framwork/.codeadd/skills/add--frontend-architecture/SKILL.md` | product | modify | F6 — MEDIUM (1) |
| `framwork/.codeadd/skills/add--code-review/SKILL.md` | product | modify | F7 — HIGH (6) |
| `framwork/.codeadd/skills/add--security-audit/SKILL.md` | product | modify | F8 — HIGH (3) |
| `framwork/.codeadd/commands/add-plan.md` | product | modify | F9 — HIGH (26) |
| `framwork/.codeadd/commands/add-review.md` | product | modify | F11 — HIGH (18) |
| `framwork/.codeadd/commands/add-brainstorm.md` | product | modify | F12 — HIGH (4) |
| `framwork/.codeadd/commands/add-hotfix.md` | product | modify | F12 — HIGH (12) |
| `framwork/.codeadd/commands/add-ux.md` | product | modify | F13 — LOW (0) |
| `framwork/.codeadd/agents/backend-agent.md` | product | modify | F14 — HIGH (6) |
| `framwork/.codeadd/agents/database-agent.md` | product | modify | F14 — HIGH (6) |
| `framwork/.codeadd/agents/frontend-agent.md` | product | modify | F15 — HIGH (6) |
| `framwork/.codeadd/agents/ux-agent.md` | product | modify | F15 — HIGH (12) |
| `framwork/.codeadd/agents/ux-flow-agent.md` | product | modify | F15 — HIGH (3); item 3 is a slot anchor |
| `docs/changelog/<ts>-update-agnostic-dev-skills.md` | internal | create | F16 — written at build STEP 8 |

**Risk (graph `impact --depth 1`, graph of 2026-10-12 — not rebuilt, the planning rule forbids a build):**
HIGH on most rows because these are hub artefacts. The change is text inside them: no name, `uses:` row,
heading cited by a consumer, STEP id or slot marker changes, so no edge in the graph changes. `AGENTS.md` is
not changed (no new artefact; the inventory stays). Delivery index (`history --layer product`): no delivery
recorded for the three dev skills, `add--code-review`, `add--security-audit`, `add-review` or `fix-agent`;
`test-agent` was last changed by `2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary`
(not about the skill name). Nothing here was tried and dropped before.

### Cross-Card Overlaps

| Card | Same file | What it edits | What this plan edits | Rule |
|---|---|---|---|---|
| 0060B | `add--backend-development/SKILL.md` | removes `- mention: add--project-scaffolding` and the pointer in "- **Project scaffolding** — use `add--project-scaffolding` for initial setup" | F3 adds `## Project Conventions First` just before the `---` that opens "## When NOT to Use", rewrites the Stack resolution/Reference lines | Insert by quoted text; the bullet stays "- **Project scaffolding**" with no pointer |
| 0060B | `add--backend-architecture/SKILL.md` | `uses:` row and "Project scaffolding / file generation" bullet | F6 one line after "Guide architectural decisions for backend projects." | Adjacent block, different lines |
| 0060B | `add--frontend-architecture/SKILL.md` | `uses:` row and the "**scaffold** a new project" checklist item | F6 one line after "Guide structural decisions…" and the `index.ts` public-API bullet | Different lines |
| 0060B | `add--ecosystem/SKILL.md`, `docs.astro` | five rows out | nothing (D-D) | No overlap |
| 0061B | `add-build.md` `## MANDATORY: Load Development Skill` | the line "- Reference component docs as needed: shadcn, …" | F2 the line directly above it, "Read: skill add-${AREA}-development …" | Adjacent lines; anchor by quoted text; the section keeps `wiki/conventions.md` and `AGENTS.md`, which 0061B's `ux-design-core.test.js` check 4 requires |
| 0061B | `add-ux.md` | STEP `add-ux.docs` table | F13 STEP `add-ux.discover` | Adjacent STEPs; 0061B hands this wording to 0063B (its "Does NOT Include") |
| 0061B | `add-hotfix.md`, `ux-agent.md`, `ux-flow-agent.md`, `add-review.md`, `add-plan.md`, `frontend-agent.md` | nothing (deferred to 0063B) | F9, F11, F12, F15 | 0061B's `ux-design-core.test.js` check 3 forbids `*-docs.md` names in `add-build.md`/`add-ux.md`; this plan adds none |
| 0062B | none of the files | `add-wiki.md`, `add--architecture-discovery`, `add--wiki-maintenance` | — | Dependency only: the seven row names and the `index.md` FOLD location (D-C) |
| 0064B | `add-brainstorm.md` | greenfield sub-step, `uses:` block, hard-gate table, STEP index line | F12 the "ARCHITECTURE REFERENCE" line only | 0064B cites this line as "reads AGENTS.md as its pattern source"; after this card it reads the wiki first, which is what 0064B's greenfield output writes |
| 0064B | architecture skills (read, not edited) | consults their over-engineering lists | F6 adds the "recorded conventions" line | 0064B depends on this card; no edit collision |
| 0065B | `add-plan.md` | slot `design.plan` in STEP `add-plan.ux-design` | F9 edits STEPs backend, frontend, validate-plan, fill-gaps, cross-sf-review | Different STEPs |
| 0065B | `ux-flow-agent.md` | slot `design.direction` after Step 0 item 6 | F15 items 1 and 3 (item 3 = gitnexus anchor) | Different lines; 0065B's slot fixture does not pin item 3's text (checked: no file under `cli/` contains "shadcn status") |
| 0065B | `ux-agent.md` | slot `design.critique` in Critique Mode after item 2 | F15 the `## Constraints (all modes)` bullet | Different sections |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 lands before any edit and runs against the current tree (0060B, 0061B, 0062B
merged). Record the output.

### L1 — `agnostic-dev-skills.test.js` (RED → GREEN)

1. No `CQRS` in any `commands/*.md`. *RED: `add-build.md` Skills Reference, `add-plan.md` STEP backend,
   `add-review.md` table row and STEP load-project-architecture.* Covers F9, F10, F11.
2. The three dev skills, `add--code-review` and `add--security-audit` contain `wiki/conventions.md`; the three
   dev skills and `add--code-review` contain "never impose tenancy, DI registration or barrels unless the
   project uses them". *RED: no match in any.* Covers F3, F4, F5, F7, F8.
3. GUARD: the three dev skills contain `## Validation Checklist`.
4. In `add-review.md`, `add-plan.md`, `add-build.md`, `backend-agent.md`, `database-agent.md`, every line
   matching `/account_id|accountId|tenant_id/` contains `Tenancy` (case-sensitive) (D-B). *RED:
   "account_id filtering (multi-tenancy)", `"payload":"id,accountId"`, "(RLS, tenant_id, schema isolation)".*
   Covers F9, F11, F14.
5. No `` Use `AGENTS.md` as source of patterns `` and no `/AGENTS\.md(\*\*)? is the source of truth/` in
   `commands/*.md`. *RED: 3 + 1.* Covers F9, F11, F12.
6. GUARD: `add--frontend-development` keeps `## UX Design Integration (MANDATORY)`, the `uses:` row
   `- skill: add--ux-design/SKILL.md` and the **RULE** line verbatim.
7. No `add-[AREA]-development` and no `add-${AREA}-development` in `commands/` or `agents/`; `add-build.md`
   contains `add--${AREA}-development` twice; `fix-agent.md` and `test-agent.md` contain
   `add--[AREA]-development`. *RED: four sites.* Covers F2.
8. `add--backend-development` has `## Project Conventions First` and no "MUST be registered" and no
   `add-backend-cqrs`; `add--database-development` has `## Barrel Exports`, no `## Barrel Exports (MANDATORY)`,
   no "Use interfaces, not classes", and contains `Project Conventions First`; `add--frontend-development`
   has no "Zod or equivalent" and contains `Project Conventions First`. In `add--database-development` the
   `## Repository Pattern` section does not match `/ALWAYS filter by/`; in `add--backend-development` and
   `add--database-development` the first non-blank line under `## Multi-Tenancy` contains `Tenancy`. *RED.*
   Covers F3, F4, F5.
9. `add--code-review` contains no `libs/app-database`, `Kysely`, `IConfigurationService` or "Skip IoC
   validation", keeps `### 3. IoC Configuration (CRITICAL)` and `"ioc":15`, and §3 contains `N/A`;
   `add--security-audit` contains no `IConfigurationService` and its A01 section contains `Tenancy`. *RED.*
   Covers F7, F8.
10. No `/shadcn|TanStack|Zustand|React Query|Tailwind v3/` in `add-hotfix.md`, `add-plan.md`, `add-review.md`,
    `ux-agent.md`, `ux-flow-agent.md`, `frontend-agent.md`; the STEP `add-ux.discover` section (heading to next
    `## STEP`) contains no `tailwind.config` and no `components/ui/`; `ux-flow-agent.md` contains no
    "Analyze tailwind config files". *RED: 7 lines in the six files, 2 in `add-ux.discover`, 1 in
    ux-flow-agent item 1.* Covers F9, F11, F12, F13, F15.
11. Both architecture skills contain `wiki/conventions.md`; `add--frontend-architecture` contains "if the
    project uses barrels". *RED.* Covers F6.
12. `add-review.md` contains no "React patterns", no "Domain ← Repositories ← Services ← Controllers", no
    `apps/frontend/**` and no `apps/backend/**`. *RED: STEP `add-review.scope` and both BOOTSTRAPs.*
    Covers F11.
13. `backend-agent.md` contains no "routes → controllers → services → repositories" and no "IoC containers",
    and contains `wiki/architecture.md`. *RED.* Covers F14.
14. `add-plan.md`: GUARD — contains "3. Worker/DI Registration" and "these three, and only these three"; RED
    half — no "TypeScript structures" and no "TypeScript interface". Covers F9.
15. `add-build.md` STEP `add-build.area-specific-notes` contains "barrel exports (if the project uses them)".
    *RED.* Covers F10.

### L2 — Build and existing guards

1. `npm run build` exits 0 with no new warning. Covers F2–F15.
2. The regenerated `framwork/.codeadd/injection-points.json` still holds one `gitnexus.graph` slot for
   `ux-flow-agent`, anchored on the rewritten item 3; slot counts per resource equal the counts before F1.
   Covers F14, F15.
3. `cli/tests/delivery-boundary.test.js`, `cli/tests/build-injection-points.test.js`, `cli/tests/build.test.js`
   pass. Covers F10, F11, F14, F15.
4. `npm run test:all` passes, in the container per `scripts/run-tests.js`. Covers F1–F15.
5. Graph: `NODE_OPTIONS= node scripts/graph.js impact add--backend-development --depth 1` (and the other
   two dev skills) prints the same dependants as before F1 — no edge changed. Covers F3–F5.

### L3 — Behavioural acceptance (read-through, recorded in the ledger)

1. Single-tenant project, no container, no barrels (intent 18a): reading the built `add-plan`, `add-build`,
   `add-review`, `add--code-review` and the three dev skills, no line asks for `account_id` filtering,
   container registration or barrel exports, and `add--code-review` §3 scores `N/A` with full points.
   Covers F3–F11.
2. Stack Conventions row Tenancy = yes (intent 18b): `add-review` backend checklist, `add--code-review` §6
   and `add--security-audit` A01 still make a query missing the key a critical finding. Covers F7, F8, F11.
3. No wiki (intent 18c): every changed skill and agent states the fallback — `AGENTS.md`, then the agnostic
   defaults and the nearest existing code. Covers F3–F6, F14, F15.
4. The changelog carries the `/add-wiki update` note and the skill-name fix. Covers F16.

**RED expectations against the current tree:** L1.1, L1.2, L1.4, L1.5, L1.7–L1.13, L1.14 (second half),
L1.15 fail; L1.3, L1.6, L1.14 (first half) pass as guards.
**GREEN = all levels pass after F1–F16.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12 → F13 → F14 → F15 → F16. One commit per
F-block. All `[product]` except F16 `[internal]`.

- **F1 first** so the RED state is recorded before any edit.
- **F2 next**, alone: it is the bug fix, so its red (L1.7) and green are shown back to back.
- **F3 before F4 and F5**: they link to `## Project Conventions First`.
- **Checkpoint after F8** (skills and review skills done): `npm run build` and the existing suites pass;
  only the command and agent assertions of L1 stay RED. A build that must stop stops here.
- **F9–F15** in any order among themselves; each turns its own L1 items GREEN. `test:all` is GREEN only
  after F15.
- F16 is the build's STEP 8 changelog.
- Per F-block beyond the layer default: after F14 and F15, run `build-injection-points.test.js` and
  `delivery-boundary.test.js` alone, because those files carry slot markers and pinned strings.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the L1 items it turned GREEN, and any
departure from the intent with the decision number.

Gaps a reviewer must hunt:

1. An F-block marked done whose L1 item was never RED — F1's RED run must be in the ledger before F2.
2. The agnostic defaults copied into the database or frontend skill instead of linked (Global Constraints).
3. A cited heading or name changed: any `## Validation Checklist`, `### 3. IoC Configuration (CRITICAL)`, the
   `ioc` weight, "Worker/DI Registration", a STEP id.
4. Tenancy weakened where it applies: with Tenancy = yes, the review must still make a missing key critical.
5. A slot marker or an anchor line moved in the agents, or `{{…}}` written on ux-flow-agent item 3.
6. An edit landed on a line 0060B, 0061B, 0064B or 0065B owns (see Cross-Card Overlaps), or
   `add--project-scaffolding` came back.
7. A stack name added as a default anywhere (allowed only as a labelled example).

---

## Next Steps

/add-framework--build docs/plans/2026-10-24T184758-PLAN--agnostic-dev-skills.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-24 | Initial creation |
| 2026-10-24 | Review fix-then-ok: A1 F8 rewrites the security-audit `**Reference:**` line and the stack-exceptions line; A2 L1.8 pins the dev-skill tenancy rewrites; A3 F1 names the `run-tests.js` command; A4 F9 gives the exact event-payload line. N1 not applied — the template requires the no-design-document marker on a `bounded` plan. N2 already covered by Reviewer Handoff (departure named with D-A) |
| 2026-10-24 | Implemented: F1-F15 plus review fixes (commits a1d0141..4af971f), changelog F16 |

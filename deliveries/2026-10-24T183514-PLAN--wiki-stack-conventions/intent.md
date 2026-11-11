---
path: bounded
topic: wiki-stack-conventions
doc: none
delivery: confirm
ticket: 0062B
---

## Decided

1. Problem: the framework already treats `.codeadd/wiki/conventions.md` as the canonical home for project-wide conventions (`skills/add--architecture-discovery/spine-analyzer.md:13,35-43`; read by `add-plan`, `add-build:304,680`, `add-review:321,521,563`, `add-hotfix:395`, `fix-agent:32`, `test-agent:35`, `conformance-agent:33`, `add--subagent-driven-development:380`). But no fixed place there records the stack decisions that agents need: tenancy, DI, barrels, layering, validation, ORM and entity language. The signals are spread out. Backend validation/ORM/DI go to `backend-analyzer.md:48-58,94`, RLS to `database-analyzer.md:63-66`, and barrels appear only as a loose example in `spine-analyzer.md:43`. No analyzer detects multi-tenancy as such. So commands hard-code these rules instead (card `agnostic-dev-skills`). Verified on main `dfe98bb0` (v1.5.13). All paths below are under `framwork/.codeadd/` unless stated otherwise.
2. Home of conventions: `{{addpath:wiki/conventions.md}}` (project-wide) plus `{{addpath:wiki/domains/<area>.md}}` (domain-local detail, which links back and never restates; existing rule `spine-analyzer.md:13`). AGENTS.md keeps at most ONE critical-rule line, and only for tenancy when Tenancy = yes. This follows `skills/add--agents-md-style/SKILL.md:73-74` ("Critical naming conventions", "Multi-tenancy critical rule (if applicable)"). No other convention is copied into AGENTS.md.
3. New fixed section `## Stack Conventions` in `conventions.md`, owned by the spine analyzer. It is ALWAYS written, even on a repo where every row is `none`, and it is exempt from "skip sections that don't apply" (`spine-analyzer.md:113,120`). It is one table with exactly these seven rows, in this order, using these exact row keys (consumers and tests match on them):
   <p>
   `| Convention | Value | Where / enforcement | Evidence | Source |`
   </p>

   - `Tenancy`: `yes` or `no`. When yes: key (e.g. `account_id`) + enforcement (repository filter, RLS policy, middleware/scope, schema-per-tenant).
   - `DI`: pattern (framework container, manual constructor injection, none) + where registration happens.
   - `Barrels`: `yes` or `no`. When yes: the scope (e.g. "package roots only", "every entities/ folder").
   - `Layering`: the layer order and import direction (summarised from `architecture.md`; link, do not restate).
   - `Validation`: library + where it runs (boundary/DTO/schema).
   - `ORM / data access`: library or raw driver + repository pattern yes/no.
   - `Entity language`: language + form (interface, class, dataclass, struct, schema).

   <p>
   Every row has Evidence = `path:line` (1-2 refs) or the literal `none`. Value `none` means "not detected / not used", and consumers apply agnostic defaults. A row is never omitted.
   </p>
4. `Source` column per row: `detected` (written by `/add-wiki` from code) or `decided` (written for a decision taken before code exists, used later by card `brainstorm-greenfield`). The marker is per row because a greenfield project starts all `decided` and moves to `detected` as code appears. The section's TL;DR line says that `decided` rows are intent, not evidence.
5. Detection lives in ONE place: a new section `## Stack Convention Signals` in `skills/add--architecture-discovery/SKILL.md`, next to the Wiki Page Contract (:187). It is shared by all analyzers and does not restate the contract. It holds the language-agnostic searches and the decision rule per row:
   - Tenancy: `tenant_id|tenantId|account_id|accountId|organization_id|org_id` in schema/migrations/entities, AND RLS (`ENABLE ROW LEVEL SECURITY|CREATE POLICY|current_setting(`) or a scoping filter on that key in data-access code. `yes` needs the key on 2+ tables/entities plus at least one filter or policy. A key column with no scoping gives `no`, with the evidence of what was seen (a single-tenant app can still have an `account_id` FK to its users).
   - DI: container/registration markers (`@Injectable|@Module(|providers:|container.(register|bind)|services.Add(Scoped|Singleton|Transient)|Depends(|fx.Provide|inversify|tsyringe|awilix`, etc.). If there are none but constructors receive collaborators, the value is `manual constructor injection`. Otherwise `none`.
   - Barrels: `index.(ts|js|tsx|mjs)` / `__init__.py` / `mod.rs` files whose non-blank lines are ONLY re-exports. `yes` when 3+ such files follow a consistent folder pattern. Evidence = one example + count.
   - Validation / ORM / Entity language: from manifests (`package.json`, `pyproject.toml`, `*.csproj`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`...) confirmed by one usage `path:line`.
   - Layering: from Phase 1 Architecture Contract (`SKILL.md:60-75`).
6. `spine-analyzer.md`:
   - "What to Discover — conventions.md" (:35-43): add the Stack Conventions bullet pointing to `SKILL.md → Stack Convention Signals`, and drop the loose barrel example at :43 (it is now a row).
   - "conventions.md sections" (:109): becomes "Stack Conventions (ALWAYS, first after TL;DR), Naming, Error Handling, Code Style, ID/Commit Conventions, Cross-Domain Patterns".
   - :113 CRITICAL: add the explicit exception for Stack Conventions.
   - FOLD mode (:11): the folded conventions section carries the Stack Conventions table verbatim. The table does not count toward the ≤15-line cap.
   - Return Contract (:129-135): add `STACK_CONVENTIONS: tenancy=<yes|no> di=<…> barrels=<yes|no>` (one line) so the coordinator can check it without re-reading the page.
   - frontmatter `sources` of `conventions.md` must cover every evidence path (existing contract rule `SKILL.md:199`, ≤8 globs).
7. `backend-analyzer.md` and `database-analyzer.md`: add the tenancy and barrel searches to "How to Search" (`backend-analyzer.md:104-124`, `database-analyzer.md:88-107`) by reference to `SKILL.md → Stack Convention Signals`, never as a copy. Use the findings for domain-local detail only. Backend: where the tenant key is taken from the auth context and applied, under "Project Conventions" (:90-97, :233-241). Database: the RLS policy and the key's FK/index pattern, under "Row-Level Security" (:63-66, :165-168) and "Database Conventions" (:76-82, :188-196). Each links to `../conventions.md#stack-conventions` instead of restating the table. Their "FORBIDDEN: sections with Not found/None" rules (`backend-analyzer.md:268`, `database-analyzer.md:225`) stay: the `none` literal is allowed only in the spine's Stack Conventions table. `frontend-analyzer.md` is not changed (the spine's repo-wide barrel search covers frontend barrels).
8. `commands/add-wiki.md`:
   - spine dispatch prompt TASK 2 (:461-463): add "including the fixed `## Stack Conventions` table (7 rows, evidence or none, Source column)"; Return (:467) adds `STACK_CONVENTIONS`.
   - FOLD note (:473): the table travels with the folded conventions section.
   - STEP `add-wiki.consolidate` gate checklist (:486-491): add "`conventions.md` (or the folded section in tiny mode) has `## Stack Conventions` with all seven row keys". This is a presence check, consistent with the coordinator not analysing code (:17, :112).
   - AGENTS.md updater prompt (:650-651 INPUTS, :659 item 2): read the Stack Conventions table. When Tenancy = yes and Source = detected, write ONE line under `## Architecture Contract`: `Multi-tenancy: every query is scoped by <key> (<enforcement>) — see .codeadd/wiki/conventions.md#stack-conventions`. Nothing else from the table goes into AGENTS.md.
   - Keep all STEP ids. No numeric `STEP N` text in commands (guard `cli/tests/build-injection-points.test.js:214-231`).
9. `/add-wiki update` keeps the section (`skills/add--wiki-maintenance/SKILL.md`, STEP 5 rules :64-73). Add three rules:
   - (a) `## Stack Conventions` is a fixed section. Edits change row cells in place and never drop or reorder rows.
   - (b) A `decided` row is never overwritten by detection. When code now contradicts it, report it as drift in STEP 9. A row flips to `detected` only when the code now provides evidence that matches the decision.
   - (c) One-time backfill: on the `/add-wiki update` trigger only (not add-done), if `conventions.md` exists without `## Stack Conventions`, add it using the Signals and bump that page's stamps. This is a bounded exception to diff-driven edits, written as such in the skill. Without it, existing projects never get the section and card `agnostic-dev-skills` would fall back to defaults for them.

   <p>
   The update path of AGENTS.md does not regenerate `## Architecture Contract` (`add-wiki.md:59`), so the tenancy line from decision 8 lands on a full `/add-wiki` only. That is accepted and noted in the release note.
   </p>
10. Build / graph / tests:
    - No new files and no new `{{skill:}}` targets. `spine-analyzer.md`, `backend-analyzer.md` and `database-analyzer.md` are already declared in the `uses:` block (`SKILL.md:13-16`), so `assertArtefactGraph` (`scripts/build.js:1415-1431`) and `provider-map.json` need no change.
    - `cli/tests/build.test.js:829-844` only checks that `{{addpath:wiki/domains/backend.md}}` resolves in `backend-analyzer.md`. Keep that token in the file.
    - `cli/tests/fixtures/slot-membership-map-v2.json` covers commands/agents injection markers. `add-wiki.md` markers are untouched, so no regeneration is needed.
    - `web/src/pages/docs.astro` does not need a change.
    - NEW test `cli/tests/wiki-stack-conventions.test.js`:
      - (a) `SKILL.md` has `## Stack Convention Signals`;
      - (b) `spine-analyzer.md` names `Stack Conventions`, the seven row keys and both `detected` and `decided`;
      - (c) the backend and database analyzers reference `Stack Convention Signals` and do not restate the grep regex;
      - (d) `add-wiki.md` consolidate gate mentions `Stack Conventions`;
      - (e) `add--wiki-maintenance` mentions the backfill and the `decided` rule.
11. Scope out:
    - Rewriting dev skills, commands and agents to READ the section → card `agnostic-dev-skills` (depends on this one).
    - Writing `decided` rows for a new project → card `brainstorm-greenfield`.
    - `add--health-check` tenancy discovery (`skills/add--health-check/context-discovery.md:60-82`) stays separate.
    - The `{"identified":["CQRS","Repository","DI"]}` example in the Technical Spec template (`SKILL.md:289`) is not changed here.
12. Target: next release.
13. Acceptance criteria:
    - (a) `/add-wiki` on a multi-tenant sample (key + filter or RLS) writes `## Stack Conventions` with Tenancy `yes`, the key, the enforcement and `path:line` evidence. AGENTS.md gets exactly one tenancy line.
    - (b) On a single-tenant sample, Tenancy is `no`, no AGENTS.md line is written, and the barrels/DI rows are `none` or detected values with evidence.
    - (c) A tiny repo (FOLD mode) carries the table in the folded section of `index.md`.
    - (d) `/add-wiki update` on an older wiki without the section adds it once. A second run is a no-op for the section.
    - (e) An update never overwrites a `decided` row and reports the conflict.
    - (f) `npm run build` and `npm run test:all` pass, including the new test.
14. Risks:
    - False positives on tenancy (an `account_id` FK in a single-tenant app). Mitigated by the "key + filter/policy" rule in decision 5. The Evidence column lets a human correct the value through `INSTRUCTIONS.md` steering.
    - Polyglot repos can disagree across apps. The spine records the dominant value plus a short per-app note in the Where cell, and domain pages carry detail.
    - The `sources` budget (≤8 globs) can get tight. Use broad globs (e.g. `**/migrations/**`).
    - Wording change in a generated page: projects that never re-run `/add-wiki` keep working, because consumers fall back to defaults (card `agnostic-dev-skills`).

## Open

None

## Card dependency

Depends on nothing. Blocks `agnostic-dev-skills`. Card `brainstorm-greenfield` writes `decided` rows into this section.

## Board changes

- status: shaped
- title: Fixed Stack Conventions section in the project wiki (tenancy, DI, barrels detection)
- done_when: /add-wiki writes a fixed `## Stack Conventions` table in wiki/conventions.md (seven rows: Tenancy, DI, Barrels, Layering, Validation, ORM / data access, Entity language; each with path:line evidence or none and a detected|decided Source). Detection is defined once in add--architecture-discovery (Stack Convention Signals), and the backend/database analyzers reference it for domain-local detail. The add-wiki consolidate gate checks the section, and AGENTS.md gets a single tenancy line only when tenancy is detected. /add-wiki update keeps the section, backfills it once and never overwrites decided rows. build and test:all pass with the new guard test.
- paths: framwork/.codeadd/skills/add--architecture-discovery/SKILL.md, framwork/.codeadd/skills/add--architecture-discovery/spine-analyzer.md, framwork/.codeadd/skills/add--architecture-discovery/backend-analyzer.md, framwork/.codeadd/skills/add--architecture-discovery/database-analyzer.md, framwork/.codeadd/commands/add-wiki.md, framwork/.codeadd/skills/add--wiki-maintenance/SKILL.md, cli/tests/wiki-stack-conventions.test.js (new)

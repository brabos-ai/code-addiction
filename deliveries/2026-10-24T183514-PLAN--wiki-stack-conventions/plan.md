# Plan: Wiki Stack Conventions — a fixed, detected `## Stack Conventions` table in the project wiki

> **Status:** implemented
> **Layers:** product
> **Type:** product
> **Created:** 2026-10-24
> **Delivery:** confirm
> **Ticket:** 0062B

---

## Objective

[from conversation, no design document] Give every project wiki one fixed place that records the stack
decisions agents need — tenancy, DI, barrels, layering, validation, ORM / data access and entity
language — as a seven-row `## Stack Conventions` table in `.codeadd/wiki/conventions.md`, detected from
code by `/add-wiki` with `path:line` evidence or `none`, marked `detected` or `decided` per row, kept by
`/add-wiki update`, and with detection defined in one place.

**When this build is done:** a full `/add-wiki` always writes the table (also in tiny/FOLD mode), the
consolidate gate checks it, AGENTS.md gets exactly one tenancy line only when tenancy is detected,
`/add-wiki update` backfills an older wiki once and never overwrites a `decided` row, and a guard test
pins all of it. Card `agnostic-dev-skills` (0063B) then has a stable section to read, and card
`brainstorm-greenfield` (0064B) has a format to write `decided` rows into.

**Ticket done when:** /add-wiki writes a fixed `## Stack Conventions` table in wiki/conventions.md (seven rows: Tenancy, DI, Barrels, Layering, Validation, ORM / data access, Entity language; each with path:line evidence or none and a detected|decided Source). Detection is defined once in add--architecture-discovery (Stack Convention Signals), and the backend/database analyzers reference it for domain-local detail. The add-wiki consolidate gate checks the section, and AGENTS.md gets a single tenancy line only when tenancy is detected. /add-wiki update keeps the section, backfills it once and never overwrites decided rows. build and test:all pass with the new guard test.

## Context

Commands hard-code stack rules (tenancy, DI, barrels) because the wiki has no fixed place for them.
The signals are spread over the backend and database analyzers, barrels exist only as a loose example
in the spine analyzer, and nothing detects multi-tenancy as such. This card creates the home; card
0063B makes the dev skills read it.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-24T183003-wiki-stack-conventions-intent.md` | Path `bounded`; decisions 1-14 (home, table shape and row keys, Source column, Signals section, per-file edits, update rules, tests, scope out, acceptance, risks); `## Open` = None |

Decisions this plan adds on top (no intent decision covered them; each is recorded in Validated
Decisions with its reason): D-A FOLD-mode heading and anchor, D-B backfill also for the folded
section, D-C backfill is not skipped by the cheap pre-check, D-D full regeneration keeps `decided`
rows, D-E Evidence and drift form on `decided` rows (aligned with 0064B), D-F tiny mode is not
used when `conventions.md` already exists.

## Global Constraints

- The seven row keys, exactly, in this order: `Tenancy`, `DI`, `Barrels`, `Layering`, `Validation`, `ORM / data access`, `Entity language` (intent, decision 3)
- Table header, exactly: `| Convention | Value | Where / enforcement | Evidence | Source |` (intent, decision 3)
- `Source` is `detected` or `decided`; Value `none` = not detected / not used; a row is never omitted (intent, decisions 3-4)
- The literal `none` is allowed only in the spine's Stack Conventions table; the analyzers' "FORBIDDEN: sections with Not found/None" rules stay (intent, decision 7)
- Detection lives ONLY in `## Stack Convention Signals` of `add--architecture-discovery/SKILL.md`; analyzers reference it, never copy it (intent, decisions 5, 7)
- Keep all STEP ids in `add-wiki.md`; no numeric `STEP N` text in commands (intent, decision 8; guard `cli/tests/build-injection-points.test.js` "commands, fragments, agents and plugins have no numeric STEP references")
- No new files except the test; no change to `provider-map.json`; the analyzer files need no `uses:` change (intent, decision 10). The ONE `uses:` change in this plan: `add--wiki-maintenance/SKILL.md` gains `- skill: add--architecture-discovery`, because F7 adds its first `{{skill:}}` reference and `scripts/build.js` fails on an undeclared reference ("artefact-graph: undeclared reference")
- `backend-analyzer.md` keeps the token `{{addpath:wiki/domains/backend.md}}` (intent, decision 10; `cli/tests/build.test.js` "add--architecture-discovery analyzer siblings have {{addpath:}} resolved literally")
- Stack-agnostic: every search names manifests and markers across languages, never one stack as the default (Maicon's binding rule for this plan)
- No deploy, publish, rollout or release task (Maicon's binding rule for this plan)
- Edits are anchored by quoted text, never by line number (Maicon's binding rule for this plan)
- `node scripts/build.js` exits 0 and emits no new warning; `npm run test:all` passes (intent, decision 13f; AGENTS.md, Pipeline)

## Problem

1. **No fixed home for stack conventions** — `conventions.md` is the canonical home for project-wide
   rules, but nothing in it records tenancy, DI, barrels, layering, validation, ORM or entity language,
   so commands and dev skills hard-code them.
2. **Detection is scattered** — validation/ORM/DI signals sit in `backend-analyzer.md`, RLS in
   `database-analyzer.md`, barrels only as an example line in `spine-analyzer.md`; tenancy is never
   detected as a fact.
3. **Existing wikis would never get it** — `/add-wiki update` is diff-driven, so without a bounded
   backfill an older wiki never grows the section.

## Proposal

Add one detection section (`## Stack Convention Signals`) to the architecture-discovery skill. Make the
spine analyzer always write the seven-row table into `conventions.md` (or the folded conventions
section in tiny mode) and return a one-line summary. Point the backend and database analyzers at the
Signals for domain-local detail only. Teach `/add-wiki` to dispatch, gate and use the table (one
tenancy line in AGENTS.md). Teach `add--wiki-maintenance` to keep the section fixed, protect `decided`
rows, and backfill once on `/add-wiki update`. A guard test is written first and is RED until the
edits land.

## Scope

### Includes

- **F1** [product] — `cli/tests/wiki-stack-conventions.test.js` (new): the guard test, written FIRST
  and run RED against the current tree. It reads the source files under `framwork/.codeadd/` (never
  the build output) and asserts L1.1-L1.9 of the Validation Matrix. Header comment names this plan,
  says every assertion was RED before F2, and labels the two GUARD assertions (L1.8, L1.9) that pass
  today and must keep passing.
  - **Produces:** `wiki-stack-conventions.test.js` (the RED suite F2-F6 turn GREEN)

- **F2** [product] — `framwork/.codeadd/skills/add--architecture-discovery/SKILL.md`: add a new section
  `## Stack Convention Signals`, placed right after the Wiki Page Contract block (after its
  "### Content Rules (all analyzers)" list, before "## Implementation Patterns Reference"). It opens
  with one line: shared by every analyzer, the spine owns the table, the section does not restate the
  Wiki Page Contract. It holds, per row, the language-agnostic searches and the decision rule exactly
  as intent decision 5 states them: Tenancy (key regex AND policy/filter; `yes` needs the key on 2+
  tables/entities plus at least one filter or policy; a bare FK gives `no` with the evidence seen),
  DI (marker list; else `manual constructor injection`; else `none`), Barrels (re-export-only
  `index.*` / `__init__.py` / `mod.rs`; `yes` at 3+ in a consistent folder pattern; Evidence = one
  example + count), Validation / ORM / Entity language (from the manifest list, confirmed by one usage
  `path:line`), Layering (from Phase 1 — Architecture Contract; link `architecture.md`, do not
  restate). It also states the polyglot rule (dominant value + short per-app note in the Where cell)
  and the `sources` budget hint (broad globs such as `**/migrations/**`, ≤8 per the contract). It must
  NOT change the Wiki Page Contract, the `uses:` block, or the Technical Spec example containing
  `{"identified":["CQRS","Repository","DI"]}` (intent, decision 11).
  - **Produces:** `## Stack Convention Signals` (heading in `add--architecture-discovery/SKILL.md`)

- **F3** [product] — `framwork/.codeadd/skills/add--architecture-discovery/spine-analyzer.md`
  (intent, decision 6, plus D-A, D-D, D-E):
  - Under "## What to Discover — conventions.md (type: reference)": add a Stack Conventions bullet
    that points to `{{skill:add--architecture-discovery/SKILL.md}}` → Stack Convention Signals; remove
    the barrel example from the bullet quoted as "Cross-domain patterns used consistently everywhere
    (e.g., "every package exposes a single index.ts barrel")" — keep the bullet, drop only the example.
  - Under "## Output Format": state the table contract — the header and the seven row keys from
    Global Constraints, Evidence = `path:line` (1-2 refs) or `none` on a `detected` row, the Source
    column, and a TL;DR line saying `decided` rows are intent, not evidence. On a `decided` row the
    Evidence cell names the decision record (e.g. `BRN-<slug>`) and may carry `drift: <path:line>`
    (D-E).
  - Replace the line quoted as "**conventions.md sections (skip what doesn't apply):** Naming, Error
    Handling, Code Style, ID/Commit Conventions, Cross-Domain Patterns." with the order "Stack
    Conventions (ALWAYS, first after TL;DR), Naming, Error Handling, Code Style, ID/Commit Conventions,
    Cross-Domain Patterns".
  - In the "**CRITICAL:** Skip sections that don't exist." paragraph and the MANDATORY rule "Only
    include sections that ACTUALLY apply": add the explicit exception — `## Stack Conventions` is
    always written, every row present, even when all are `none`.
  - In the "**FOLD mode (tiny repos):**" paragraph: the folded conventions section carries a
    `### Stack Conventions` sub-heading and the table verbatim; the table does not count toward the
    ≤15-line cap (D-A).
  - In "## FIRST: Gather Inputs": add an input — when `conventions.md` (or the folded section) already
    exists, read its Stack Conventions rows; a `decided` row is carried into the new page, never
    replaced by detection: code that matches flips it to `detected` with `path:line`, code that
    contradicts it keeps the row and adds `drift: <path:line>` to its Evidence and to the report, no
    code yet keeps it as is (D-D).
  - In "## Return Contract": add `STACK_CONVENTIONS: tenancy=<yes|no> di=<…> barrels=<yes|no>` (one
    line), plus one line per `decided` row in drift.
  - Keep the rule that frontmatter `sources` cover every evidence path (≤8 globs), by pointing at the
    Wiki Page Contract, not restating it.
  - **Consumes:** `## Stack Convention Signals` (heading in `add--architecture-discovery/SKILL.md`) (F2)
  - **Produces:** `## Stack Conventions` table contract (seven row keys, Source `detected|decided`);
    `STACK_CONVENTIONS:` return line; anchor `conventions.md#stack-conventions` (`index.md#stack-conventions` in FOLD mode)

- **F4** [product] — `framwork/.codeadd/skills/add--architecture-discovery/backend-analyzer.md`
  (intent, decision 7): in "## How to Search", add a line that runs the Tenancy and Barrels searches
  from `{{skill:add--architecture-discovery/SKILL.md}}` → Stack Convention Signals — by reference, with
  no regex copied. Under "### 10. Project Conventions" (discovery list) and the "## Project
  Conventions" output template: add where the tenant key is taken from the auth context and applied
  (domain-local only), with a link to `../conventions.md#stack-conventions` instead of restating the
  table. The FORBIDDEN rule "Sections with "Not found" or "None"" stays as is. Must keep
  `{{addpath:wiki/domains/backend.md}}`.
  - **Consumes:** `## Stack Convention Signals` (heading in `add--architecture-discovery/SKILL.md`) (F2); anchor `conventions.md#stack-conventions` (`index.md#stack-conventions` in FOLD mode) (F3)

- **F5** [product] — `framwork/.codeadd/skills/add--architecture-discovery/database-analyzer.md`
  (intent, decision 7): in "## How to Search", add the same by-reference line for the Tenancy search.
  Under "### 5. Row-Level Security (IF EXISTS)" and the "## Row-Level Security" output template: the
  RLS policy and its tenant key. Under "### 7. Database Conventions" and the "## Database Conventions"
  output template: the tenant key's FK/index pattern. Both link to `../conventions.md#stack-conventions`
  instead of restating. The FORBIDDEN rule "Sections with "Not found"" stays. `frontend-analyzer.md` is
  not touched.
  - **Consumes:** `## Stack Convention Signals` (heading in `add--architecture-discovery/SKILL.md`) (F2); anchor `conventions.md#stack-conventions` (`index.md#stack-conventions` in FOLD mode) (F3)

- **F6** [product] — `framwork/.codeadd/commands/add-wiki.md` (intent, decision 8, plus D-A, D-D):
  - STEP `add-wiki.spine-analyzer-new` prompt: TASK item 2 (quoted "WRITE .codeadd/wiki/conventions.md —
    project-wide naming/error-handling/style/ID rules") adds "including the fixed `## Stack Conventions`
    table (7 rows, evidence or none, Source column)"; `## INPUTS` adds "existing conventions.md Stack
    Conventions rows, if any (decided rows are kept)"; TASK item 4 (quoted "Return: FILES_WRITTEN,
    TOPICS count per page") adds `STACK_CONVENTIONS`.
  - The "**FOLD MODE (MODE=tiny" paragraph: the conventions section carries `### Stack Conventions`
    and the table verbatim, outside the ≤15-line cap.
  - STEP `add-wiki.consolidate` Gate Check Checklist: add two items. Standard mode: "`conventions.md`
    has `## Stack Conventions` with all seven row keys". Tiny mode: "the spine report's folded
    conventions section has `### Stack Conventions` with all seven row keys". Both: "the spine report
    carries `STACK_CONVENTIONS`". The fold into `index.md` happens later, so consolidate never looks at
    `index.md`. A presence check only — the coordinator still does not analyse code.
  - STEP `add-wiki.gate` checklist (tiny mode only): add "the folded `## Conventions` section of
    `index.md` carries `### Stack Conventions` with all seven row keys, copied verbatim from the spine
    report".
  - STEP `add-wiki.determine-mode-recorded`: tiny mode is not chosen when `.codeadd/wiki/conventions.md`
    already exists (e.g. written by `/add-brainstorm` greenfield, card 0064B); that run takes the
    standard path so the existing page and its `decided` rows keep one home (D-F).
  - STEP `add-wiki.dispatch-updater` prompt: `## INPUTS TO READ` adds the Stack Conventions table;
    TASK item 2 (`## Architecture Contract`) adds: when Tenancy = `yes` and Source = `detected`, write
    ONE line `Multi-tenancy: every query is scoped by <key> (<enforcement>) — see
    .codeadd/wiki/conventions.md#stack-conventions` (FOLD mode: `.codeadd/wiki/index.md#stack-conventions`);
    nothing else from the table enters AGENTS.md. The "IF invoked as `/add-wiki update`" block is not
    changed — the update path still never regenerates the Architecture Contract (accepted, intent
    decision 9).
  - No STEP id is renamed or added; no `STEP <number>` text is written; no injection marker is touched.
  - **Consumes:** `## Stack Conventions` table contract (seven row keys, Source `detected|decided`); `STACK_CONVENTIONS:` return line; anchor `conventions.md#stack-conventions` (`index.md#stack-conventions` in FOLD mode) (F3)

- **F7** [product] — `framwork/.codeadd/skills/add--wiki-maintenance/SKILL.md` (intent, decision 9,
  plus D-B, D-C, D-E). Add three rules to "### STEP 5 — SURGICAL EDITS (hard rules)":
  - (a) `## Stack Conventions` is a fixed section: edits change row cells in place, never drop or
    reorder rows. It is the named exception to "No formatting-only edits" only in the sense that a row
    is never removed — no other formatting change is allowed.
  - (b) A `decided` row is never overwritten by detection. Code that contradicts it → Evidence gets
    `drift: <path:line>` and STEP 9 reports it; Value and Source stay. It flips to `detected` only when
    code now provides matching evidence (D-E).
  - (c) One-time backfill, on the `/add-wiki update` trigger only (not add-done): when `conventions.md`
    exists without `## Stack Conventions` — or, in a tiny wiki, `index.md`'s folded conventions
    section lacks `### Stack Conventions` (D-B) — add it using `{{skill:add--architecture-discovery/SKILL.md}}`
    → Stack Convention Signals and bump that page's stamps. The scan is the Signals searches,
    repo-wide and read-only. The page's frontmatter `sources` is extended with broad globs covering
    every new evidence path, inside the ≤8-glob budget of the Wiki Page Contract, so the next update
    selects the page when that evidence changes. Written as a bounded exception to diff-driven edits,
    and the bullet names `add-done` as the trigger it does NOT run on.
  - `uses:` block: add `- skill: add--architecture-discovery` (the one `uses:` change, see Global
    Constraints).
  - In "### STEP 2 — EVIDENCE", the "**Cheap pre-check (manual trigger" line: the "wiki already
    current" exit applies only when the section is also present; a missing section sends the run to
    the backfill (D-C).
  - In "### STEP 9 — REPORT": add the backfill outcome and every `decided`-row drift line.
  - The WRITE BOUNDARY (never touches AGENTS.md) and the add-done trigger behaviour stay unchanged.
  - **Consumes:** `## Stack Convention Signals` (heading in `add--architecture-discovery/SKILL.md`) (F2); `## Stack Conventions` table contract (seven row keys, Source `detected|decided`) (F3)

### Does NOT Include (important!)

- Making dev skills, commands and agents READ the section → card `agnostic-dev-skills` (0063B)
- Writing `decided` rows for a new project → card `brainstorm-greenfield` (0064B)
- `add--health-check` tenancy discovery (`skills/add--health-check/context-discovery.md`) — stays separate
- The Technical Spec example `{"identified":["CQRS","Repository","DI"]}` in `add--architecture-discovery/SKILL.md`
- `frontend-analyzer.md`, `code-quality-analyzer.md`, `add--agents-md-style`, `provider-map.json`, `web/src/pages/docs.astro`, `cli/tests/fixtures/slot-membership-map-v2.json`
- Regenerating the AGENTS.md Architecture Contract on `/add-wiki update` (the tenancy line lands on a full `/add-wiki` only; the delivery changelog says so)
- Any deploy, publish, rollout or release step

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Home, table shape, row keys, Source column, Signals location, per-file edits, update rules, scope | As decided | Intent decisions 1-11, approved by Maicon |
| D-A: In FOLD mode, where does the table sit and what anchor does AGENTS.md link? | `### Stack Conventions` sub-heading inside the folded conventions section of `index.md`; the AGENTS.md line links `.codeadd/wiki/index.md#stack-conventions` | In tiny mode `conventions.md` does not exist, so a link to it would be dead; the slug stays `stack-conventions` in both modes |
| D-B: Does the one-time backfill also cover a tiny wiki? | Yes — the folded conventions section in `index.md` | Otherwise tiny projects never get the section and 0063B falls back to defaults for them, the exact gap decision 9c closes |
| D-C: The cheap pre-check exits "wiki already current" before any analysis. Does it skip the backfill? | No — the exit holds only when the section is present | Without this, an older wiki on a clean HEAD never reaches rule 9c, and acceptance 13d fails |
| D-D: A full `/add-wiki` rewrites `conventions.md`. Are `decided` rows lost? | No — the spine reads the existing rows first and applies the same three-way rule as update | Intent decision 4 says a greenfield project "moves to `detected` as code appears"; a regeneration that wipes the rows breaks that. 0064B decision 13 requires the same rule in both files |
| D-E: What is Evidence on a `decided` row, and how is drift shown? | Evidence names the decision record (e.g. `BRN-<slug>`); drift appends `drift: <path:line>` to Evidence; Value and Source never change on drift | Aligns with 0064B decisions 8 and 13 so that card writes into this format without changing it; keeps "never overwrite a decided row" true |
| D-F: A greenfield project (0064B) already has `conventions.md`; a later full `/add-wiki` classifies the repo tiny. Where does the table live? | Tiny mode is not chosen when `conventions.md` exists; that run takes the standard path | Folding would leave `conventions.md` unlinked (the hub bijection gate fails) or give the table two homes; deleting a page that holds user decisions is worse. One extra check at mode selection avoids both |
| How are behaviours with no automated runner proven? | L1 text guard (RED first) + L2 build/test:all + L3 cold walkthrough of each acceptance scenario recorded in the ledger | `/add-wiki` is an agent-driven command; the repo has no harness that runs it on a sample, and adding one is out of scope |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/wiki-stack-conventions.test.js` | product | create | Guard test, RED first (F1) |
| `framwork/.codeadd/skills/add--architecture-discovery/SKILL.md` | product | modify | `## Stack Convention Signals` (F2). Graph: 5 direct dependants (architecture-agent, system-design-agent, add-wiki, add--agents-md-style, add--tasks-checklist) → **HIGH**; the change is additive, no existing section changes |
| `framwork/.codeadd/skills/add--architecture-discovery/spine-analyzer.md` | product | modify | Table contract, FOLD, decided rows, Return line (F3). Sibling file of the skill above, same grade **HIGH**; its only dispatcher is `add-wiki` |
| `framwork/.codeadd/skills/add--architecture-discovery/backend-analyzer.md` | product | modify | By-reference tenancy/barrel search, domain-local detail (F4). Same skill, **HIGH** |
| `framwork/.codeadd/skills/add--architecture-discovery/database-analyzer.md` | product | modify | By-reference tenancy search, RLS/FK detail (F5). Same skill, **HIGH** |
| `framwork/.codeadd/commands/add-wiki.md` | product | modify | Spine prompt, FOLD note, consolidate gate, AGENTS.md tenancy line (F6). Graph: 17 direct dependants (all `HANDS_OFF_TO` or `INJECTS_INTO`; two fragments inject into it, markers untouched) → **HIGH** |
| `framwork/.codeadd/skills/add--wiki-maintenance/SKILL.md` | product | modify | Fixed section, decided rule, backfill, pre-check, one new `uses:` row `skill: add--architecture-discovery` (F7). Graph: 3 direct dependants (add-done, add-wiki, add--knowledge-discovery) → **HIGH**; add-done's trigger behaviour is unchanged |
| `AGENTS.md` | internal | none | Not changed by this plan |

Delivery index (product layer): `add-wiki` 3 live entries, 0 dead; `add--wiki-maintenance` 0 entries;
`add--architecture-discovery` none — nothing here was shipped and replaced before.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 writes every L1 assertion BEFORE F2 lands; run it and confirm L1.1-L1.7
fail against the current tree. Then drive them GREEN with F2-F7.

### L1 — Source guard (`cli/tests/wiki-stack-conventions.test.js`, RED → GREEN)

1. `add--architecture-discovery/SKILL.md` has the heading `## Stack Convention Signals`, and that
   section names all seven row keys and the tenancy policy markers (`ENABLE ROW LEVEL SECURITY`,
   `CREATE POLICY`). *RED today: heading absent.* (F2)
2. `spine-analyzer.md` contains `Stack Conventions`, the exact table header, the seven row keys in
   order, `detected`, `decided`, `STACK_CONVENTIONS`, and `Stack Convention Signals`. *RED today: none
   present.* (F3)
3. `spine-analyzer.md` no longer contains the example `every package exposes a single index.ts
   barrel`. *RED today: present.* (F3)
4. `backend-analyzer.md` and `database-analyzer.md` each contain `Stack Convention Signals` and
   `conventions.md#stack-conventions`, and neither contains any of these Signals strings:
   `tenant_id|tenantId` (the pipe form), `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`,
   `current_setting(`, `container.(register|bind)`. The existing single-token `tenant_id` in
   `database-analyzer.md` ("Pattern: by tenant_id, user_id, etc") is allowed and stays. F1 checks
   these strings are absent from today's files, so the only RED reason is the missing reference.
   *RED today: reference absent.* (F4, F5)
5. `add-wiki.md`: the text of STEP `add-wiki.consolidate` (from the line starting `## STEP
   add-wiki.consolidate` to the next line starting `## STEP `, matched at line start) mentions
   `Stack Conventions` and `STACK_CONVENTIONS`; the text of STEP `add-wiki.hub` (same rule) mentions
   `### Stack Conventions`; STEP `add-wiki.determine-mode-recorded` mentions `conventions.md`; the spine
   prompt mentions `STACK_CONVENTIONS`; the updater prompt contains `Multi-tenancy:` and
   `stack-conventions`. *RED today: absent.* (F6)
6. `add--wiki-maintenance/SKILL.md` mentions `Stack Conventions`, `decided` and `drift:`; it has a
   line containing both `backfill` and `add-done` (the trigger the backfill does not run on); its
   `uses:` block contains `skill: add--architecture-discovery`. *RED today: absent.* (F7)
7. `add--wiki-maintenance/SKILL.md`: the cheap pre-check text mentions `Stack Conventions` (D-C).
   *RED today: absent.* (F7)
8. GUARD — `backend-analyzer.md` still contains `{{addpath:wiki/domains/backend.md}}`, and its
   FORBIDDEN list still contains `Sections with "Not found" or "None"`. Passes today, must keep passing.
9. GUARD — `add-wiki.md` has no line matching `/\bSTEP \d/` and keeps every `## STEP add-wiki.` id it
   has today (the test lists them). Passes today, must keep passing.

### L2 — Build and full suite

1. `node scripts/build.js` exits 0 with no new warning (no dangling `uses:` row, no raw `.codeadd/`
   path warning from `lintResourcePaths()` in the four skill files and the command).
2. `npm run test:all` passes, including `build.test.js`, `build-injection-points.test.js` and the new
   suite — run in the container per the project's test policy.
3. The built `framwork/.claude/skills/add--architecture-discovery/SKILL.md` contains
   `## Stack Convention Signals` with `{{skill:}}`/`{{addpath:}}` resolved (no leaked placeholder).

### L3 — Behavioural acceptance (cold walkthrough, recorded in the ledger)

The build reads the edited text as the spine analyzer, the coordinator and the maintenance skill
would, for each scenario, and records in the ledger the quoted lines that produce the outcome:

1. Multi-tenant sample (key on 2+ tables + RLS or filter) → Tenancy `yes`, key, enforcement,
   `path:line`; AGENTS.md gets exactly one `Multi-tenancy:` line (intent 13a).
2. Single-tenant sample with an `account_id` FK and no scoping → Tenancy `no` with the evidence seen;
   no AGENTS.md line; DI/Barrels `none` or detected with evidence (intent 13b).
3. Tiny repo (FOLD) → the consolidate gate checks the spine report's folded section; the hub gate
   checks `index.md`'s folded conventions section carries `### Stack Conventions` and the table;
   AGENTS.md link targets `index.md#stack-conventions` (intent 13c, D-A). A tiny repo that already has
   `conventions.md` takes the standard path (D-F).
4. `/add-wiki update` on an older wiki with clean HEAD → backfill runs once (pre-check does not exit),
   and the page's `sources` covers every new evidence path within ≤8 globs; a second run makes no
   change to the section (intent 13d, D-C).
5. Update over a `decided` row contradicted by code → row Value/Source unchanged, `drift:` added,
   reported in STEP 9; a full `/add-wiki` keeps the row the same way (intent 13e, D-D, D-E).

**RED expectations against the current tree:** L1.1-L1.7 fail (the text does not exist); L1.8-L1.9
pass (guards). L2 passes today and must still pass after. L3 cannot pass today (no rule exists).
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product] → F5 [product] → F6 [product] → F7 [product]

- **F1 first** because it is the RED proof; it must fail before any text lands.
- **F2 before F3-F5** because they reference the Signals heading.
- **F3 before F6** because the command's prompt, gate and updater consume the table contract and the
  `STACK_CONVENTIONS` line the spine defines.
- **F7 last** because it consumes both the Signals and the table contract.
- Every boundary after F2 leaves the repo building; the suite is fully GREEN only after F7.
- Per-F-block: run the new suite after each of F2-F7 and record which L1 items turned GREEN; run L2
  once after F7; do L3 after L2.

## Reviewer Handoff

For each F-block the build must leave in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the intent decision or D-A..D-E it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 item was never RED — a test written after the edit proves nothing.
2. A regex or marker list from the Signals copied into `backend-analyzer.md` or `database-analyzer.md`
   (L1.4 checks two strings; a reviewer checks the rest).
3. A `STEP <number>` slipped into `add-wiki.md`, or a STEP id renamed.
4. The cheap pre-check still able to exit before the backfill (D-C).
5. A `none` literal allowed outside the spine's table (the analyzers' FORBIDDEN rules must stay).

---

## Next Steps

/add-framework--build docs/plans/2026-10-24T183514-PLAN--wiki-stack-conventions.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-24 | Initial creation |
| 2026-10-24 | Review fix-then-ok applied: B1 one `uses:` row added to `add--wiki-maintenance` (build gate on undeclared reference); B2 L1.4 matches copied Signals strings, not the existing `tenant_id` token; B3 consolidate gate split by mode, tiny check moved to STEP `add-wiki.gate`; A1 new D-F (tiny mode not chosen when `conventions.md` exists); A2 backfill scan scope and `sources` extension stated; N1/N2 L1.5-L1.6 made checkable |
| 2026-10-24 | Build: implemented in commits 934a0f0..F7 on feat/0062b-wiki-stack-conventions |

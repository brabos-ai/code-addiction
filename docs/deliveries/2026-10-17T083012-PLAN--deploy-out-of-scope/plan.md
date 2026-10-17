# Plan: Deploy out of scope — a delivery is code, migration files and tests; examples stop naming a stack

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-17
> **Delivery:** confirm
> **Ticket:** 0053B

---

## Objective

[from conversation, no design document] Deliveries never include deploy or applying migrations to
shared environments, and framework examples are stack-agnostic.

**When this build is done:** the product's task schema owns one Delivery Boundary rule that every
task author (the architect subagent writing `tasks.md`), the database agent and the feature-plan
reviewer apply, and the stack-specific tools named in the edited examples (`npm run migrate`, Kysely,
Knex, Prisma/Drizzle, NestJS, Zustand, class-validator, `npm` as the gate) are replaced by
placeholders that resolve from the project's own `AGENTS.md`. The user docs state in one line that
deploy runs after `/add-done` and is not part of a delivery. No gate, script, schema heading or STEP
ID changes.

**Ticket done when:** npm test passes with a new cli test asserting the Delivery boundary rule in add--tasks-checklist, its pointer in add-plan, the feature-plan extra in add--plan-review, and the absence of npm run migrate / Kysely / Knex in the edited lines.

## Context

The request came from the Notion card `deploy-out-of-scope`, recorded as ticket 0053B. No brainstorm
ran, so there is no design document and no intent file; every decision is carried inline below under
Validated Decisions, decided by the planner on the user's instruction not to ask.

The defect it fixes: the canonical `tasks.md` example in `add--tasks-checklist` teaches
`Verify: \`npm run migrate\`` (line 68). A `Verify:` line is something `add-build` actually runs, and
a migrate command runs against whatever database the environment points at. Nothing in the product
says that database must be local or test, and nothing stops a plan from adding "deploy to staging"
or "apply migration in prod" as tasks, or from splitting subfeatures by deploy stage. The same
examples name one stack (Node, Kysely, Knex, NestJS), which makes the framework read as
stack-bound to a user on any other.

## Global Constraints

- Text only; gates unchanged — no change to `converge-gates.cjs`, `task-brief.cjs`, `qa-preflight.cjs`, `status.cjs` or any other script (user request: "text only, gates unchanged")
- `add--plan-review` keeps exactly nine dimensions; the new check is a `feature-plan` Kind-Specific Extra, not a tenth dimension (user request; `cli/tests/plan-review-agent-speed.test.js:119`, `cli/tests/product-pipeline-parity.test.js:90`, `cli/tests/review-no-loops.test.js:195`)
- `tasks.md` keeps "6 sections in this exact order with these exact headings" (add--tasks-checklist, Canonical Structure)
- The `` `Verify:` tier rule `` text and the `wiki/workflows.md` / `Test Workflow` / `CI-tier` wording survive (`cli/tests/cut-review-and-build-loop-cost.test.js` L1.7)
- "Never write a raw `.codeadd/` path. Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`" (AGENTS.md, Pipeline)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js` in the container, never `npx vitest` in `cli/` (user memory: testes no container)

## Problem

1. **A task can deploy or migrate a shared database** — the schema's own example `Verify:` runs a
   migration with no environment bound, and no rule forbids deploy, publish or apply-in-staging/prod
   tasks or acceptance items.
2. **Work can be phased around deploys** — `add-new`'s decomposition gate splits by "independent
   flow" but never says a deploy stage is not a flow, so "migrate, then deploy, then switch on" reads
   as three subfeatures.
3. **The database agent validates migrations "run successfully" with no environment named**, and
   lists four Node ORMs as the migration tool.
4. **The examples name one stack** — `npm run migrate`, Kysely, Knex, NestJS, Zustand,
   class-validator and `npm run lint` appear as if they were the framework's assumption.
5. **The user docs say `/add-done → deploy`** (`web/src/pages/docs.astro:520`), the opposite of the
   rule.

## Proposal

One owner, many pointers. `add--tasks-checklist` gains a `## Delivery Boundary` section that owns the
rule (what a delivery is, what no task or acceptance item may do, what stays allowed, how `Verify:` is
chosen, the fallback). Every other artefact points to it in one line instead of restating it. The
architect prompt template inside the same skill names it in its RULES, because the architect subagent
only sees the template. The plan reviewer gets one `feature-plan` extra to catch a plan that breaks
the rule. The stack-specific examples become placeholders that resolve from `AGENTS.md`.

Alternatives considered and rejected:

- **Restate the rule in each consumer** (add-plan, add-build, database-agent). Rejected: seven copies
  of one rule drift, which is the failure the "owner + pointer" pattern of this repository exists to
  prevent.
- **Enforce it in a gate** (`converge-gates.cjs` scanning `tasks.md` for "deploy"/"migrate"). Rejected
  by the user ("gates unchanged"), and correctly: a word match flags "apply migrations to the test
  DB", which is allowed, and misses "promote the build", which is not.
- **Put the rule in `add-plan`**. Rejected: the schema skill is what the architect, the build's
  validators and `add-review` all load; `add-plan` is one of its five callers.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/skills/add--tasks-checklist/SKILL.md`: the rule and its
  examples.
  - New H2 `## Delivery Boundary`, placed between `## Canonical Structure` and `## Section Rules`.
    It states: (a) a delivery is code + migration files + tests, landing in one merge; (b) no
    Execution task and no Acceptance item applies migrations to, deploys to or publishes to a
    shared, staging or production environment, and no work is phased around an intermediate deploy
    — unless the user asked for it; (c) when the user asked, the deploy order is recorded as a note
    in `plan.md`, never as a task or acceptance item; (d) running the app, applying migrations to a
    local or test database, and local QA (functional, UX, Playwright) stay allowed and expected;
    (e) how `Verify:` is chosen — see the next bullet.
  - `Verify:` rule — extend the existing Section Rules bullet under `### \`## Execution\`` that reads
    "`Verify`: MANDATORY single line — a runnable command, curl, or browser check." (around line
    116), NOT the architect template's tier-rule paragraph. That bullet points to the Delivery
    Boundary section, which carries the text below; the tier rule stays where it is. `Verify:` uses the
    `AGENTS.md` `validation_gates` command scoped to the task's files, or another local check (a
    curl to the locally running app, a browser check); it never writes outside a local or test
    environment. **Fallback** when `AGENTS.md` has no `validation_gates`: the project's own test
    command scoped to the task's files, taken from the repository (its scripts, README or
    `wiki/workflows.md`), or a local browser/curl check — never an invented command. The existing
    `` `Verify:` tier rule `` in the architect template is kept unchanged and is compatible: it narrows
    *which* test file, this narrows *which environment*.
  - Example at line 68 (`Verify: \`npm run migrate\``) becomes exactly
    `` Verify: `<migration command from AGENTS.md>` against the local test database ``. Example at
    line 75 (`Verify: tests pass`) becomes exactly
    `` Verify: `<validation_gates.test>` scoped to `path/a.spec.ts` `` (the example's own test file).
    F7 reuses the line-68 string verbatim.
  - Line 111: `infra` stays an allowed service, defined as **config files only** (container, CI,
    environment templates) — never a step that deploys or publishes.
  - Architect Subagent Prompt Template, `## RULES`: one line telling the architect to follow the
    Delivery Boundary.
  - `## Validation Checklist`: one new item — no task or acceptance item deploys, publishes or
    applies migrations outside local/test unless the user asked, and every `Verify:` is local.
  - Must NOT lose: the six-section structure and headings, the Node example under Validation Gates
    with its "language-agnostic" note (it is labelled as one stack among several), the TypeScript
    signature examples (a signature needs some syntax), the `` `Verify:` tier rule `` text.
  - **Produces:** the H2 heading `## Delivery Boundary` in `add--tasks-checklist`
- **F2** [product] — `framwork/.codeadd/commands/add-plan.md`:
  - STEP `add-plan.tasks` (line ~688–709): one bullet pointing to the Delivery Boundary in
    `{{skill:add--tasks-checklist/SKILL.md}}` — the generated `tasks.md` must honour it.
  - Database section template, `### Migration` (line 441): one line stating the migration **file** is
    delivered in this branch and is applied to shared environments by the project's deploy process,
    after `/add-done` — not by a task.
  - Global Constraints example (line 661): the `npm run lint` / `npm run typecheck` example becomes a
    placeholder for the project's `validation_gates` commands, keeping the `(AGENTS.md
    validation_gates)` citation.
  - Must NOT lose: STEP IDs, the "Verbatim is load-bearing" rule, line 660's stack-pin example (see
    Does NOT Include).
  - **Consumes:** the H2 heading `## Delivery Boundary` in `add--tasks-checklist` (F1)
- **F3** [product] — `framwork/.codeadd/commands/add-new.md:266`: the "Independent flow" definition
  gains that work is split by user flow, never by deploy stage (migrate / deploy / switch-on are not
  flows). Must NOT lose: the STOP at N ≥ 2, the light-path skip.
- **F4** [product] — `framwork/.codeadd/agents/database-agent.md:36-37`: step 4 uses the migration
  tool `AGENTS.md` names for the project (following the existing migration files when it names
  none), dropping the Prisma/Drizzle/Knex list; step 5 validates migrations only on a local or test
  database, never a shared, staging or production one. Must NOT lose: the gitnexus slot markers at
  lines 29–32 (an injection slot — untouched), the numbered order.
- **F5** [product] — `framwork/.codeadd/commands/add-build.md`, STEP `add-build.area-specific-notes`
  (lines 733–746): the Area-Specific Notes and the Skills Reference lose stack names — Kysely, Knex,
  `app.module.ts`, `worker.module.ts`, Zustand — in favour of the generic part (entities, query
  types, migration file, repository; module registration; state store). The section already says
  "Consult AGENTS.md for exact locations and commands" and keeps it. Must NOT lose: the MANDATORY
  `add--frontend-development` load line, the three skill references.
- **F6** [product] — `framwork/.codeadd/commands/add-review.md`, the VALIDATION CHECKLIST (lines
  572–582): the stack-specific terms become generic — class-validator → the project's validation
  layer; "Kysely types updated", JSONB auto-parse/stringify → query types regenerated, no manual
  (de)serialisation the driver already does; "no critical npm vulnerabilities" → the project's
  dependency audit; NestJS exceptions → the framework's error types. Must NOT lose: every check
  category (Patterns, Architecture, Database, Security/OWASP, Code Quality, Error Handling) and every
  non-stack check in them.
- **F7** [product] —
  `framwork/.codeadd/skills/add--subagent-driven-development/references/persistent-logging-and-tasks.md:79`:
  the example row's `Verify` `npm run migrate` becomes the line-68 string F1 defines, verbatim.
- **F8** [product] — `framwork/.codeadd/skills/add--plan-review/SKILL.md`, `## Kind-Specific Extras`,
  the `feature-plan` bullet: one added check — fail (under the existing `Scope` dimension) when a
  task or acceptance signal in `plan.md` deploys, publishes or applies migrations to a shared,
  staging or production environment, or phases the work around an intermediate deploy, and
  `plan.md` does not record that the user asked for it. Declare the mention of `add--tasks-checklist`
  in the skill's `<!-- uses: -->` block per `add-framework-development` § 9. Must NOT lose: the nine
  dimensions table unchanged, the "Do NOT read about.md, tasks.md, or design.md" rule.
  - **Consumes:** the H2 heading `## Delivery Boundary` in `add--tasks-checklist` (F1)
- **F9** [internal] — user docs, one line each:
  - `README.md`, after line 141: one line — deploy is out of scope of a delivery and runs after
    `/add-done`, through the project's own deploy process.
  - `web/src/pages/docs.astro:520`: `/add-done → deploy` becomes `/add-done → finalize & merge`
    (matching the sibling scenarios at lines 479/493); and the `/add-done` card in the Delivery
    section (line 279) gains the same one-line statement.
- **F10** [product] — `cli/tests/delivery-boundary.test.js` (new): text assertions over the product
  sources, in the style of `cli/tests/cut-review-and-build-loop-cost.test.js`. Written and run RED
  before F1. See the Validation Matrix.
  - **Consumes:** the H2 heading `## Delivery Boundary` in `add--tasks-checklist` (F1)

### Does NOT Include (important!)

- Any gate or script change — `converge-gates.cjs`, `task-brief.cjs` and the rest stay byte-identical
  (user constraint).
- A runtime guard in `add-build` that refuses to run a non-local `Verify:`. The rule binds where tasks
  are written (architect, F1) and where plans are reviewed (F8); a runtime guard is a gate change.
- `add-plan.md:660` (`Node 20.x; no ^ or ~`). It illustrates the *stack-pin* category, which has to
  name some stack to show what "verbatim" means; it is cited as an AGENTS.md value, not as the
  framework's assumption.
- The TypeScript signatures and the Node-labelled Validation Gates example in `add--tasks-checklist`
  — kept, see F1.
- `add--database-development`, `add--backend-development`, `add--frontend-development`. They are
  stack-knowledge skills; neutralising them is a different ticket.
- `add-hotfix`. It closes through `/add-done` already; nothing in it deploys.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does the rule live? | `## Delivery Boundary` H2 in `add--tasks-checklist`; others point to it | One owner. It is the skill all five schema callers load (graph: add-build, add-plan, add-review, add--doc-schemas, add--subagent-driven-development) |
| Does the architect see it? | Yes — one line in the template's `## RULES` | The architect subagent only receives the template; a rule outside it never reaches the author of `tasks.md` |
| `Verify:` fallback with no `validation_gates` | The repo's own test command scoped to the task's files, or a local curl/browser check; never invented | Matches the existing "omit, never fabricate gate items" rule under `## Validation Gates` |
| `infra` service | Kept, config files only | Removing it breaks valid tasks (CI config, Dockerfile); narrowing it is enough |
| When the user asks for deploy | A note in `plan.md`, never a task or acceptance item | User request; a task would make the build execute it |
| Plan-review check: new dimension? | No — a `feature-plan` extra, scored under `Scope` | Three tests pin nine dimensions |
| Lines beyond those named in add-build / add-review | Included (F5 whole notes list, F6 whole checklist's stack terms) | The objective is "examples are stack-agnostic"; a half-neutral list fails it. Cost is a few words per line |
| `add-plan.md:660` | Excluded | See Does NOT Include |
| Docs layer | `[internal]` | `README.md` and `web/` are at the root, not `mcp/` (AGENTS.md anatomy) |
| Ticket label | `product` | The user scoped the work as product layer; the docs line is a pointer |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| All eight product artefacts grade HIGH (3+ callers at depth 1: tasks-checklist 5, add-plan 26, add-new 18, database-agent 6, add-build 26, add-review 18, subagent-driven-development 11, plan-review 7) | Medium | Changes are additive text inside existing sections; no heading, STEP ID, slot marker or anchor changes. L2 runs the full suite and the product build |
| An edit lands on an injection anchor and a fragment stops applying | Low | Checked: none of the replaced strings is in `injection-points.json`. L2.2 (`build-injection-points.test.js` in the full suite) and the build exit 0 prove it |
| The new Verify rule conflicts with the `` `Verify:` tier rule `` | Low | F1 states the two are orthogonal; L1.1 asserts both texts are present |
| The plan-review extra makes the reviewer read `tasks.md` | Low | F8 keeps "Do NOT read … tasks.md"; L1.6 asserts it |
| `add-framework--sync` later rewrites the README/docs line away | Low | F9's line becomes part of the README the analyzers diff against; noted in the reviewer handoff |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add--tasks-checklist/SKILL.md` | product | modify | F1 |
| `framwork/.codeadd/commands/add-plan.md` | product | modify | F2 |
| `framwork/.codeadd/commands/add-new.md` | product | modify | F3 |
| `framwork/.codeadd/agents/database-agent.md` | product | modify | F4 |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F5 |
| `framwork/.codeadd/commands/add-review.md` | product | modify | F6 |
| `framwork/.codeadd/skills/add--subagent-driven-development/references/persistent-logging-and-tasks.md` | product | modify | F7 |
| `framwork/.codeadd/skills/add--plan-review/SKILL.md` | product | modify | F8 |
| `README.md` | internal | modify | F9 |
| `web/src/pages/docs.astro` | internal | modify | F9 |
| `cli/tests/delivery-boundary.test.js` | product | create | F10 |

No `provider-map.json` change: no artefact is added, renamed or removed. `AGENTS.md` is not changed.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F10 writes every L1 assertion before F1 lands; run it and record each RED
in the ledger. Then drive them GREEN with F1–F9.

### L1 — Text assertions, `cli/tests/delivery-boundary.test.js` (RED → GREEN)

1. `add--tasks-checklist` has a `## Delivery Boundary` H2, and that section names: one merge; shared,
   staging or production; an intermediate deploy; "unless the user" asked; the deploy order as a
   note; local or test database; Playwright; `validation_gates`; a fallback when it is absent. It
   still contains `` `Verify:` tier rule `` and `CI-tier`. *RED today: no such section.*
2. `add--tasks-checklist` contains no `npm run migrate`, no `Verify: tests pass`; the `infra`
   service line says config files only; the architect template's `## RULES` names Delivery Boundary;
   `## Validation Checklist` has an item about deploy/migrations outside local/test. *RED today: all
   four are absent or opposite.*
3. `add-plan.md`: STEP `add-plan.tasks` names Delivery Boundary; the `### Migration` template block
   says the file is applied by the deploy process; the Global Constraints example contains no
   `` `npm run lint` ``. *RED today.*
4. `add-new.md` decomposition gate says "deploy stage" is not a split. `database-agent.md` names
   AGENTS.md for the migration tool, says local or test database, and contains no `Prisma`, `Drizzle`
   or `Knex`. *RED today.*
5. `add-build.md` Area-Specific Notes and `add-review.md` VALIDATION CHECKLIST contain no `Kysely`,
   `Knex`, `Zustand`, `NestJS`, `class-validator`, `app.module.ts`; `persistent-logging-and-tasks.md`
   contains no `npm run migrate`. *RED today.*
6. `add--plan-review`: the `feature-plan` extra mentions deploy and shared environment; the
   `## Dimensions` section still holds exactly the nine names; the "Do NOT read `about.md`,
   `tasks.md`" rule is still present. *First half RED today; second and third green by design — they
   guard what must survive, and are marked so in the test.*

### L2 — Integration

1. `node scripts/build.js` exits 0 with no new warning (no raw `.codeadd/` path).
2. The full suite via `node scripts/run-tests.js` (container) is green — in particular
   `product-pipeline-parity` L1.3, `review-no-loops` L1.9, `plan-review-agent-speed` L2.5,
   `cut-review-and-build-loop-cost` L1.7, `build-injection-points`, and `scripts/tests/task-brief`.
3. `scripts/test-loss-guard.cjs` reports no lost test name.

### L3 — Behavioural acceptance

1. Read the built `framwork/.claude/skills/add--tasks-checklist/SKILL.md` (build output) cold: a
   reader can answer "may a task run the migration against staging?" (no), "may it run it against the
   test DB?" (yes), "what does Verify use when AGENTS.md has no gates?" (the fallback) without
   reading any other file. Record the three answers in the ledger.
2. `web/src/pages/docs.astro` contains no `→ deploy`, and `README.md` carries the one-line statement.

**RED expectations against the current tree:** L1.1–L1.5 and the first half of L1.6 fail today.
**GREEN = all levels pass after F1–F10.**

---

## Execution Order

F10 (RED) → F1 → F2 → F8 → F3 → F4 → F5 → F6 → F7 → F9

- **F10 first** so every L1 assertion is seen RED.
- **F1 before F2 and F8** because both point at the heading F1 produces.
- F3–F7 are independent edits; any order. F9 last — it describes the finished rule.
- Every boundary after F1 leaves the repo working: each F-block is additive text in its own file.
- Per F-block: rebuild (`node scripts/build.js`) after F1, F2 and F8, the three that add a pointer
  or a `uses:` line.

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, the L-levels covering it and their
state, and any decision changed with its reason.

Gaps a reviewer must hunt:

1. An F-block marked done whose L1 assertion was never RED.
2. The rule restated in a consumer instead of pointed to — grep F2/F4/F8 for a second copy of (a)–(d).
3. A replaced example that now names a different stack (e.g. `pytest` in place of `npm`) instead of
   a placeholder.
4. The `` `Verify:` tier rule `` or the nine-dimension table edited in passing.

---

## Next Steps

/add-framework--build docs/plans/2026-10-17T083012-PLAN--deploy-out-of-scope.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-17 | Initial creation |
| 2026-10-17 | Review `ok` with two nits applied: F1 gives the literal replacement strings for lines 68/75 (F7 reuses line 68's); F1 names the Section Rules `Verify` bullet as where the environment rule hooks in, not the architect tier rule |
| 2026-10-17 | Built: status implemented; see docs/changelog/2026-10-17T083012-update-deploy-out-of-scope.md |

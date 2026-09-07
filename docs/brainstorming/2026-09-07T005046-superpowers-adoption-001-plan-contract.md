# Brainstorm: Superpowers Adoption 001 — Plan Contract

> **Status:** final (ready for `/add-framework--self-plan` + `/add-framework--plan`)
> **Date:** 2026-09-07
> **Type:** architecture
> **Umbrella:** `docs/brainstorming/2026-09-07T005046-superpowers-adoption-000-umbrella.md`

## Discovery

Measured against the live repo at `58e916d`:

- **`tasks.md` states order, not contract.** `add-tasks-checklist/SKILL.md` gives each `## Execution` task
  exactly four sub-bullets — `Service`, `Files`, `Deps`, `Verify` — and caps a task at 3 files.
  `Deps: T01` says *T01 runs first*. Nothing says *what T01 hands over*.
- **The `feature-plan` schema has no constraints section.**
  `add-doc-schemas/references/new-feature.md:115` fixes the sections as
  `TL;DR · Context · Architecture Decisions · Tasks · Risks · Validation`. Project-wide requirements
  (RNFs, stack pins, `validation_gates`, design tokens) have no declared home and end up scattered
  through prose or lost.
- **`add-planning` is orphaned and contradictory.** Registered at `provider-map.json:106`, shipped to all
  5 providers, loaded by **no command** — `plan.md` is written by `add.plan` STEP 10.1 against the
  `add-doc-schemas` schema. Its own template (`## Spec` JSON blocks, `## Detailed Tasks`, `## Batching`)
  diverges from that schema, and its `## Batching` section prescribes *"one semantic commit per batch"*,
  which `add.build.md:82` forbids. Prose references live at `add-code-review/SKILL.md:14`,
  `add-ecosystem/SKILL.md:64`, `add-feature-specification/SKILL.md:22`.
- **The artefact-graph gate is live and asymmetric.** `scripts/build.js:987` (`checkArtefactGraph`)
  **fails** on a declared reference (`{{skill:...}}`) to a missing artefact; it only **warns** on a prose
  mention. All three `add-planning` references are prose, so the deletion warns rather than fails —
  which means the warning must be treated as work, not noise.
- **Internal plan naming, measured:** 27 plans on disk, 20 tracked. `add-framework--plan.md:217` and
  `add-framework--self-plan.md:138` both instruct "find the next available plan number". A plan *set*
  shares one number (`0074-PLAN--autonomous-epic-convergence-000-umbrella` … `-004-epic-loop`).
  The convention appears in **76 references across 16 files** — 8 canonical under `.claude/`, 8 OpenCode
  adapters — plus `CLAUDE.md`.
- **`framework-discovery-agent` parses plan filenames.** It globs `docs/plans/*.md`, splits the basename
  into slug words for keyword scoring (`agents/framework-discovery-agent.md:38-42`), and reports hits as
  `[Plan NNNN]` (line 84).
- **Brainstorm filenames carry a date but no time.** Internal brainstorms are
  `docs/brainstorming/YYYY-MM-DD-<slug>.md` (22 references across `add-framework--plan.md`,
  `add-framework--shared-brainstorm.md` and their two OpenCode adapters). Product brainstorms are
  `docs/brainstorm/YYYY-MM-DD-<slug>.md`, declared at `add.brainstorm.md:36,46,106` and in the `brainstorm`
  schema at `add-doc-schemas/references/new-feature.md:181`, which calls the date prefix "mandatory for
  chronological tree ordering". Two brainstorms on the same day sort arbitrarily.
- **Windows forbids `:` in filenames.** The `HHMMSS` form without separators is a constraint, not a style
  choice — the primary working directory is `C:\github\xmaiconx\code-addiction`.

## Context & Motivation

Topic 002 replaces the executor with one that dispatches a fresh subagent per task and reviews each task's
own diff. That executor is only as good as what the plan declares.

Two of its seven mechanics have a hard dependency here:

- **The pre-flight conflict scan** must produce one row per pair of tasks that share a file or an interface,
  stating what one produces against what the other consumes. Today the plan declares no interfaces, so the
  scan would have nothing to read and would degrade into the model guessing.
- **The reviewer's attention lens** is a block of binding requirements copied verbatim from the spec. Today
  there is no such block to copy.

Neither can be bolted on afterwards without redoing them.

## Problem / Opportunity

**A subagent implementing T02 never sees T01's code.** It receives its own task and implements against a
name it has to invent. The neighbouring task invents a different one. Nothing catches the mismatch until the
build breaks — or, worse, until both compile and disagree at runtime.

**A reviewer with no constraints block reviews against its own taste.** Told only "review this diff", it
raises what it happens to notice. Handed *"list loads in under 200ms for up to 100 items (about.md RNF01)"*,
it checks that. The difference is entirely in what the plan wrote down.

**And a document nobody loads still talks.** `add-planning` ships to every provider carrying a plan template
that contradicts the real schema and a commit rule that contradicts `add.build`. Any agent that greps for
planning guidance can find it. It is the same duplicate-vocabulary failure the umbrella rejects for
superpowers — except this copy is ours, and it is already installed on every user's machine.

## Proposal

### Part 1 — `## Global Constraints` in `plan.md`

A new H2 in the `feature-plan` schema, placed directly after `Context`.

**Content:** every requirement that binds the whole plan, copied **verbatim** from its source — RNFs from
`about.md`, stack pins and `validation_gates` from `CLAUDE.md`, tokens from `design-system.md`. One line
each, exact value, source in parentheses.

```markdown
## Global Constraints

- List renders in under 200ms for up to 100 items (about.md RNF01)
- Node 20.x; no `^` or `~` in package.json (CLAUDE.md stack)
- `npm run lint` and `npm run typecheck` exit 0 (CLAUDE.md validation_gates)
- Spacing only through `--space-*` tokens (design-system.md)
```

**Why verbatim.** In topic 002 this block is handed to `@reviewer-agent` as its attention lens. A paraphrase
destroys the mechanism: *"fast enough"* cannot be reviewed, *"under 200ms"* can.

**Schema additions** (`add-doc-schemas/references/new-feature.md`, `feature-plan` entry):

- Sections become `TL;DR · Context · Global Constraints · Architecture Decisions · Tasks · Risks · Validation`.
- Depth floor: one line per constraint, exact value, cited source.
- Hard bans: paraphrase; vague ranges ("fast", "secure"); a constraint with no source.
- **Empty is explicit.** With no project-wide constraints the section reads `None`. An absent section is a
  question ("did the author forget?"); `None` is an assertion.

### Part 2 — `Consumes` / `Produces` per task in `tasks.md`

Two new sub-bullets in `## Execution`, beside `Service` / `Files` / `Deps` / `Verify`.

```markdown
- [ ] T02 Create UsersService.create
  - Service: backend
  - Files: `src/users/users.service.ts`
  - Deps: T01
  - Consumes: `UserRepository.insert(row: NewUser): Promise<User>` (T01)
  - Produces: `UsersService.create(dto: CreateUserDto): Promise<UserDto>`
  - Verify: `npm test -- users.service`
```

**Rules:**

- `Produces` — the exact signature of everything a later task will call. `-` when nothing.
- `Consumes` — the exact signature plus the producing task ID. `-` when nothing.
- Every `Consumes` must match, character for character, a `Produces` on an earlier task. This is checkable
  by machine, not by opinion, and `add.plan`'s validation gate checks it.
- **No tick rule.** An interface is a contract, not progress. Validators never tick these lines.

**Why in `tasks.md` and not `plan.md`.** The subagent reads its own task's brief and nothing else. Putting
the signature in another document adds an indirection it will skip. `Deps: T01` already lives here; the
signature belongs beside it.

**Why not duplicated into `plan.md`.** `plan.md` freezes at the end of `add.plan`; `tasks.md` absorbs change
during the build. A signature that shifts mid-build updates `tasks.md` and leaves `plan.md` silently lying.
The map a reviewer wants is **computed, not authored twice**: topic 002's pre-flight scan reads the pairs out
of `tasks.md` and writes the table into the ledger. A generated map cannot drift from its source.

### Part 3 — The same two ideas in the internal plan format

Internal plans (`docs/plans/…-PLAN--<slug>.md`, `…-SELF-PLAN--<slug>.md`) get:

- `## Global Constraints`, placed after `## Context`.
- `Consumes` / `Produces` per **F-block**. The interface here is not a function signature: it is the
  `KEY=STATUS` line a script emits, a sidecar key, a frontmatter field, an injection anchor name.

```markdown
F3 Produces: `converge-gates.sh` emits `GATE5=pass|fail|skip`
F7 Consumes: `GATE5` (F3)
```

`## Red-Green Validation Matrix` and `## Execution Order` are **not touched** — both are already stronger
than the superpowers equivalent.

Files: `.claude/commands/add-framework--plan.md` (`### Plan Structure`),
`.claude/commands/add-framework--self-plan.md`, and their two OpenCode adapters.

### Part 4 — Timestamped filenames for plans and brainstorms

One naming rule, applied to every planning artefact in both layers:

```
docs/plans/2026-09-07T005046-PLAN--<slug>.md              (internal, framework layer)
docs/plans/2026-09-07T005046-SELF-PLAN--<slug>.md         (internal, self layer)
docs/brainstorming/2026-09-07T005046-<slug>.md            (internal brainstorm)
docs/brainstorm/2026-09-07T005046-<slug>.md               (product brainstorm, in the user's repo)
```

`YYYY-MM-DDTHHMMSS`, local time, no separators in the time part (Windows forbids `:` in filenames).
Lexicographic sort equals chronological sort.

**Brainstorms carry no kind marker**, unlike plans. A plan's `PLAN` / `SELF-PLAN` marker exists so
`add-framework--build` and `add-framework--self-build` can tell their own plans apart inside one directory.
Brainstorms have no such ambiguity: internal ones live in `docs/brainstorming/` of this repo, product ones in
`docs/brainstorm/` of the user's repo. Different directories, different repositories — the marker would carry
no information.

**The product schema's rationale gets stronger, not weaker.** `new-feature.md:181` already calls the date
prefix "mandatory for chronological tree ordering". Today two brainstorms written the same day sort
arbitrarily; the time component is what makes that sentence true.

**What this fixes:** the "find the next available number" directory read disappears, and so does the
cross-branch collision — two plans drafted on two branches take the same `NNNN` today.

**What is deliberately kept:**

- **The layer marker.** `PLAN` vs `SELF-PLAN` is how `add-framework--build` and `add-framework--self-build`
  tell which plans are theirs from the name alone.
- **Set grouping.** A set allocates its timestamp **once, at the umbrella**, and every topic reuses it
  verbatim. This applies to brainstorm sets too — the shape this very document set uses:
  ```
  2026-09-07T005046-PLAN--<slug>-000-umbrella.md
  2026-09-07T005046-PLAN--<slug>-001-<topic>.md
  2026-09-07T005046-superpowers-adoption-000-umbrella.md
  2026-09-07T005046-superpowers-adoption-001-plan-contract.md
  ```

**Companion files** keep suffixing the plan basename: `…-PLAN--<slug>--evidence-v01.md`,
`…--review-v01.md`.

**Command arguments accept a unique slug substring.** A 24-character prefix is not typeable, so
`/add-framework--build plan-contract` resolves as long as exactly one plan matches; an ambiguous match lists
the candidates and stops. The full basename always works. The same resolution applies wherever a command
takes a brainstorm path.

**Existing files keep their names** — the 27 plans and the 15 internal brainstorms alike. They are historical
records, force-added on purpose, and `CLAUDE.md` cites several plans by number in prose. Both forms coexist;
only new artefacts use the new one.

### Part 5 — Deleting `add-planning`

| action | target |
|---|---|
| delete | `framwork/.codeadd/skills/add-planning/` |
| unregister | `provider-map.json:106` |
| clean prose | `add-code-review/SKILL.md:14`, `add-ecosystem/SKILL.md:64`, `add-feature-specification/SKILL.md:22` |
| salvage into topic 002 | the S/M/L sizing table, and `batch → one semantic commit` (which becomes commit-per-task) |
| verify | `node scripts/build.js` produces no new `artefact-graph` warning |

## Scope

### Includes

- `## Global Constraints` in the `feature-plan` schema and in both internal plan formats.
- `Consumes` / `Produces` in `tasks.md` `## Execution` and per internal F-block.
- A mechanical `Consumes` ↔ `Produces` check in `add.plan`'s validation gate.
- The timestamped filename rule for internal plans (76 references, 16 files), internal brainstorms
  (22 references, 4 files) and product brainstorms (`add.brainstorm.md:36,46,106` plus the `brainstorm`
  schema at `new-feature.md:181`), with slug-substring argument resolution.
- Deleting `add-planning` and cleaning its three prose references.
- Updating `framework-discovery-agent` to strip the leading `NNNN` or timestamp token before slug scoring,
  and to report plans by slug instead of `[Plan NNNN]`.

### Does NOT Include

- Any executor change — ledger, commits, review loop, model selection all belong to topic 002.
  Nothing in this topic makes `/add.build` behave differently.
- Retiring `GIT CLEAN` from `add.build.md:82` — decided, but it lands in 002 where the commits are made.
- Renaming existing files — the 27 plans and the 15 internal brainstorms keep their names; renaming
  invalidates `CLAUDE.md` prose and old commit references for no gain.
- Adding a kind marker to brainstorm filenames — the directory already disambiguates them.
- Touching `## Red-Green Validation Matrix` or `## Execution Order` — already stronger than the source.
- Fixing `add-skill-creator/testing-skills-with-subagents.md:13` — a real defect, but it belongs with the
  TDD material, not the plan contract.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Interfaces live only in `tasks.md` | One source; the subagent reads its task and nothing else | Mirroring them into `plan.md` — `plan.md` freezes while `tasks.md` keeps changing, so the copy goes stale silently |
| The interface map is computed, not authored | A generated map cannot disagree with its source | A hand-written `## Interfaces` table in `plan.md` |
| Global Constraints copied verbatim, with the source cited | It is handed to the reviewer as an attention lens; paraphrase makes it unreviewable | Summarising the constraints in the architect's own words |
| Empty Global Constraints reads `None` | An absent section is ambiguous; `None` is an assertion | Omitting the section when it is empty |
| Keep `PLAN` / `SELF-PLAN` in the plan filename | The two builders identify their own plans from the name | Bare `<ts>-<slug>.md` — the distinction would only be readable after opening the file |
| No kind marker on brainstorm filenames | Internal and product brainstorms live in different directories in different repositories; a marker would carry no information | Mirroring the plan marker for symmetry |
| A set shares the umbrella's timestamp — plans and brainstorms alike | Preserves the grouping the `NNNN` scheme gave plans for free, and gives brainstorm sets a grouping they never had | One timestamp per topic — the set stops being visible in the directory |
| Delete `add-planning` rather than rewrite it | It is loaded by nothing and contradicts both the schema and `add.build` | Rewriting it as the authoring guide — a second voice to keep in sync with `add-doc-schemas` |
| Internal format changes now, not with 002 | We are already editing both plan templates for the rename; one edit pass instead of two | Deferring the internal half into 002 |

## Accepted Trade-offs

- **The architect writes more.** Two extra sub-bullets per task and a constraints block per plan. Accepted:
  it is precisely the information the executor cannot reconstruct.
- **Two filename schemes coexist in `docs/plans/`.** Accepted: plans are records, and rewriting the old
  names would invalidate `CLAUDE.md` prose and old commit references.
- **Slug-substring resolution can be ambiguous.** Accepted: an ambiguous match lists candidates and stops,
  never guesses.
- **A 76-reference rename is mechanical but wide.** Accepted: 8 canonical files plus 8 OpenCode adapters
  that already mirror them.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| `Consumes` written as prose instead of a signature, defeating the check | Medium | High — 002's pre-flight scan silently degrades | The gate compares strings; a non-matching `Consumes` fails the gate with both texts printed |
| The OpenCode adapters drift from the canonical `.claude/` files during the rename | Medium | Medium | Both halves land in the same F-block; the plan names all 16 files explicitly |
| `add-planning`'s deletion leaves a broken prose reference | Low | Low | Three known sites, plus `node scripts/build.js` warns on any that were missed |
| The architect fills Global Constraints with restated functional requirements | Medium | Medium | Hard ban in the schema: a constraint must be project-wide and cite its source |
| `framework-discovery-agent` scores the timestamp digits as slug words | Low | Low | Strip the leading token before scoring — named explicitly in scope |

## Ecosystem Impact

**Product layer:**

- `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` — `feature-plan` schema
- `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md` — `## Execution` sub-bullets + section rules
- `framwork/.codeadd/commands/add.plan.md` — writes both new blocks; gate checks the interface pairs
- `framwork/.codeadd/commands/add.brainstorm.md:36,46,106` — brainstorm path gains the time component
- `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md:181` — `brainstorm` schema path rule
- `framwork/.codeadd/skills/add-planning/` — **deleted**
- `framwork/provider-map.json:106` — entry removed
- `add-code-review/SKILL.md:14`, `add-ecosystem/SKILL.md:64`, `add-feature-specification/SKILL.md:22` —
  prose references removed

**Internal layer:**

- `.claude/commands/add-framework--plan.md` — `### Path and Sequential Numbering` → timestamp;
  `### Plan Structure` gains `## Global Constraints` and per-F-block interfaces; brainstorm path references
- `.claude/commands/add-framework--self-plan.md` — same two changes
- `.claude/commands/add-framework--shared-brainstorm.md` — brainstorm path gains the time component
- `.claude/commands/add-framework--build.md`, `--self-build.md`, `--shared-review.md`, `--release.md`,
  `--sync.md` — plan-name references and slug-substring resolution
- `.claude/agents/framework-discovery-agent.md` — token stripping, report by slug
- `.opencode/` — the 8 mirrored adapters
- `CLAUDE.md` — the plan-naming line under Internal Layer

**Not touched:** `scripts/build.js` (the artefact-graph gate is consumed, not changed), `cli/`,
`add.build.md`, `add.plan-to-ready.md`.

## Next Steps

1. `/add-framework--self-plan` — internal half (Parts 3 and 4, `CLAUDE.md`, both layers of plan template).
2. `/add-framework--plan` — product half (Parts 1, 2 and 5).
3. Brainstorm topic 002 once this lands.

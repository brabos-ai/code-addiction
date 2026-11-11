# Plan: Board column recency — priority in Backlog, recent activity elsewhere

> **Status:** implemented
> **Layers:** product
> **Type:** product
> **Created:** 2026-10-06
> **Delivery:** confirm

## Objective

[from conversation, no design document]

Preserve the priority of work still in Backlog and highlight recently updated cards in every other board stage.

**When this build is done:** Backlog cards will retain canonical priority order. Every other kanban column will show the most recently updated cards first, with the same result on desktop and mobile.

## Context

The user first requested recent cards at the top of all columns, then explicitly kept priority ordering in Backlog and approved latest update time as the recency criterion elsewhere. Existing grouping preserves backlog JSONL line order everywhere. Canonical line order also supplies priority ranks and the priority list.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-06T114929-board-column-recency-intent.md` | Bounded path, approved ordering rules, tie-break rule, and the explicit pause after planning for a model switch |

The user approved creation of this plan now and wants the later build to continue through opening the PR. This planning run must stop after review. `Delivery: confirm` preserves that pause; the next model must read this context and obtain/honor the user's explicit build invocation. Do not merge the PR or invoke close-out.

Discovery identified the archived board-app, board-design-palette-and-hierarchy, board-pipeline-phase-statuses, board-layer-filter-flag, and node-only-board plans. They establish canonical priority order, cross-status columns, rank semantics, shared filtering, and a read-only API. This change deliberately departs from priority-based kanban placement outside Backlog only.

Graph coverage: `touched_by` returned no work items or pages for the three inspected board files. These TypeScript modules and tests are not artefact nodes; their callers/dependencies and risk grades are **NOT VERIFIED by the artefact graph**. Source inspection identifies `BoardView` as the runtime consumer of `groupByColumn`, with `filterTickets` feeding it and `groupByStatus` supplying column memberships. The graph's `product/feature/board` is pipeline injection, not the React application. The product-layer history lookup was unavailable (`script-missing`: MCP references the removed `delivered.sh`); it provides no evidence that this ordering was previously dropped. Optional strategy documents are absent. `AGENTS.md` is not changed.

## Global Constraints

- "entao deixe por ordem de prioridade no backlog mas nas outras colunas vamos deicar o mais recente no topo" (user instruction, this conversation).
- "crie o plano e assim que finalizar eu vou trocar o modelo para implementar ate abertura do PR.." (user instruction, this conversation).

## Problem

1. **Recent activity is buried** — a recently updated card remains at its historical priority position in shaping, planning, implementation, review, and completed columns.
2. **Priority must remain actionable** — sorting Backlog by recency would discard the ordering the user relies on when deciding what to work on next.

## Proposal

Implement the presentation rule in `groupByColumn`, after column memberships and cross-status ticket arrays are assembled. Identify the exception by the canonical column name `backlog`, never by display label, column order, or a status name such as `open`. Sort each other column's own ticket array by the parsed instant of `updated_at`, descending. Use a stable sort so equal instants retain incoming canonical priority order. Treat an empty or invalid timestamp as older than any valid instant and preserve incoming order among invalid timestamps; this is a deterministic resilience rule, not a new user-facing preference.

Sort the combined column ticket array, not the individual status groups. Preserve column/status metadata order and existing undefined/implicit/hidden handling. Do not mutate the incoming ticket array or ticket objects. Keep `groupByStatus`, `filterTickets`, `rankOf`, API ticket order, list order, and sheet navigation semantics intact.

Alternatives considered: sorting the API response would alter priority ranks and the list; sorting independently in renderers would duplicate behavior across layouts; creation-time ordering would not highlight old tickets that have just advanced stages. Column-local latest-update ordering meets the approved objective without changing canonical priority.

## Scope

### Includes

- **F1** [product] — `board/src/lib/tickets.ts` and `board/test/tickets.test.ts`: implement column-local ordering in `groupByColumn`, update its ticket-order documentation, and extend existing unit coverage with differing timestamps and realistic phased columns. Preserve Backlog priority, stable ties, pure input data, and cross-status grouping. Include missing/invalid timestamps and timezone-equivalent instants. Validation: L1 and L3.
- **F2** [product] — `board/test/routes.test.tsx`: extend mocked-route coverage to prove rendered Backlog order and descending activity order in a multi-status non-Backlog column, while priority numbers remain tied to the canonical unfiltered ticket order and `/list` retains that order. Use existing route-test helpers and scope card-order assertions to the intended column. Validation: L2 and L3.

No new inter-F-block data contract is introduced. F2 exercises the existing grouping API changed by F1.

### Does NOT Include

- A sort control, new API fields, a new activity timestamp, or a configurable Backlog exception.
- Backlog JSONL rewrites, server/core ordering changes, or modifications to reprioritisation behavior.
- List sorting, priority-rank numbering changes, or sheet previous/next navigation changes.
- Changes to framework prompts, provider registration, or artefact graph tooling.
- Implementation during this planning run, or merging/close-out during the subsequent build.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Which column keeps priority? | The column whose canonical name is `backlog` | User explicitly preserved priority in Backlog; labels are presentation metadata |
| What counts as recent? | Latest `updated_at` instant, descending | User approved latest-update ordering, including cards created earlier that have just moved |
| What breaks ties? | Incoming canonical priority order | Approved short design; deterministic placement without a second user preference |
| Which layouts use the rule? | Desktop and mobile through the shared grouping result | Both already consume the same column ticket arrays |
| What is the canonical priority? | Position in the unfiltered API ticket array | Existing rank and list contracts remain meaningful despite recency-based visual placement |
| When does implementation start? | After this plan is delivered and the user switches models | Explicit user request; no automatic handoff in this run |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `board/src/lib/tickets.ts` | product | modify | F1 changes column ticket placement and updates its contract comments |
| `board/test/tickets.test.ts` | product | modify | F1 proves priority exception, recency, ties, grouping, and input preservation |
| `board/test/routes.test.tsx` | product | modify | F2 proves rendered card order and canonical rank/list invariants |

Runtime consumer: `board/src/views/board-view.tsx` already renders `group.tickets` for both layouts and needs no planned code change. Graph risk grade for each modified file: **NOT VERIFIED**, because these files are outside artefact-node coverage. Source-level compatibility is checked by L1–L3 rather than a fabricated graph grade.

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write the new L1 and L2 behavioral assertions before implementing F1 and run the relevant tests against the unchanged grouping code. Recency cases must fail for the expected ordering difference. Existing/preservation cases may already pass; retain them as regression checks. Validation tests belong to their listed F-block commits even when authored before production changes.

### L1 — Grouping behavior (RED → GREEN; F1)

1. Backlog with intentionally conflicting timestamps retains input priority order; repeat after filtering. This is a preservation check.
2. A non-Backlog column containing at least three cards across `refining` and `shaped` produces one global newest-first sequence, not per-status blocks. **RED today:** it retains line order instead.
3. Equal timestamps preserve canonical input order; two ISO timestamps with different offsets representing the same instant also tie.
4. Empty/invalid timestamps follow valid ones and retain their mutual input order. **RED today:** a leading invalid timestamp is not relocated.
5. Verify incoming array order, ticket fields, status/column vocabulary order, and priority ranks are unchanged after grouping. Retain existing undefined/implicit/hidden tests and verify recency also applies to a trailing non-Backlog fallback column and a hidden column when included.
6. A Backlog display label change does not change its priority rule; a non-Backlog column labeled `Backlog` still uses recency. An implicit canonical `backlog` column retains priority.

### L2 — Rendered route behavior (RED → GREEN; F2)

1. Mock phased board data with multiple cards per tested column and timestamps deliberately opposed to canonical priority. On `/board`, assert Backlog card order is canonical and the combined shaping column is newest-first. **RED today:** shaping renders in canonical order.
2. Assert that card priority numbers still reflect the unfiltered API sequence even when recency changes placement, including after an existing supported filter is applied.
3. Navigate to `/list` with the same mocked dataset and assert canonical card order. This is a preservation check.
4. Use column-scoped DOM assertions so unrelated links, navigation elements, or duplicated headings cannot satisfy the ordering test.

### L3 — Build and responsive acceptance (F1–F2)

1. From `board/`, run `npm test` (typecheck plus existing Vitest suite) and `npm run build` (TypeScript plus Vite). Follow existing dependency setup only if needed.
2. With a controlled dataset whose priority and update order differ, inspect `/board` at desktop and mobile widths. On mobile select the relevant columns. Verify the same Backlog priority and non-Backlog newest-first sequences, with tied cards stable. Use an existing browser/E2E fixture mechanism; do not edit the live backlog for validation or add an otherwise unnecessary committed fixture file.

**RED expectations against the current tree:** L1.2/L1.4 and L2.1 fail on order. Preservation checks and existing tests may already pass. Build/responsive acceptance is GREEN-only verification.
**GREEN = all L1–L3 checks pass after F1–F2.** Do not claim checks passed when a dependency or browser is unavailable; report the specific blocker under the build's validation rules.

## Execution Order

1. Author the new L1/L2 tests and establish the recency failures against current behavior.
2. **F1 [product]** — implement grouping and unit coverage. Run focused grouping tests and the route recency tests to prove the shared behavior is correct. Commit F1 with its own test changes; F2 tests may remain pending until their commit.
3. **F2 [product]** — finish route assertions and commit the rendered-order coverage. Run the full board test/build commands and responsive acceptance.

F1 is the production behavior boundary; F2 completes its route-level proof. Each F-block receives one commit under the build ledger rules. No new shipped command/skill/agent registration or product artefact rebuild is caused by these React-only changes; run board validation in addition to any applicable pipeline gates.

## Reviewer Handoff

Record files changed, validation levels and their results, and any decisions altered in the build ledger. Return audit evidence in the workflow's existing report; do not create a review companion file.

Actively check:
1. Whether the implementer accidentally sorted the canonical API array, changing list or rank semantics.
2. Whether the exception uses `backlog` identity rather than a label, status name, or first-column position.
3. Whether recency is global across all statuses sharing a column.
4. Whether comparison uses timestamp instants, with deterministic ties and malformed-date fallback.
5. Whether the renderer uses the tested combined ticket array on desktop and mobile.
6. Whether RED failures proved the ordering change rather than unrelated setup errors.

## Next Steps

After the user switches models, run:

`/add-framework--build board-column-recency`

The user wants that build to proceed through opening the PR. Honor the build's PR/push decision gate using the user's explicit authorization at execution time; do not interpret this plan as merge approval. This planning session stops here.

To revise: `/add-framework--plan board-column-recency`.

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-06 | Initial bounded plan from approved conversation; explicit pause for model switch |
| 2026-10-06 | Implemented. Commits 40c3aac (F1) and 7cbf1d8 (F2). Status draft → implemented |

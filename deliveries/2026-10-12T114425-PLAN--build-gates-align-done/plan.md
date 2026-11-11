# Plan: Build gates aligned with done — `/add-build` runs the same convergence gates as `/add-done` on every mode, and the gate bugs found on OMF 0048F (v1.5.4) are fixed

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-10-12
> **Delivery:** confirm
> **Ticket:** 0049B

---

## Objective

[from conversation, no design document — drawn from ticket 0049B's `tldr`]
O add-build passa a rodar os mesmos gates do add-done em todo modo, e os bugs que faziam o gate errar sao corrigidos.

**When this build is done:** a simple-feature `/add-build` cannot report itself complete while
`converge-gates.cjs` would make `/add-done` block; the coverage gate counts only rows of a table that
carries the `Covered?` column; and the build ledger refuses a `Final review:` line no gate can parse.

**Ticket done when:** Teste de converge-gates com duas tabelas (so a primeira com Covered?/Status) nao conta linhas da segunda como uncovered; add-build de feature simples roda converge-gates.cjs e so fecha com GATE_REVIEW e GATE_COVERAGE ok; build-ledger.cjs sai com 2 para Final review sem (passed|ruled N|blocked N) (after review-NNN).

## Context

Ticket 0049B (board, `grounded: true`) is the specification. It came from real failures on the OMF
project's feature 0048F under v1.5.4: `/add-build` closed a simple feature, then `/add-done` blocked on
gates the build never ran, and the coverage gate reported uncovered requirements that were covered.
There is no brainstorm design and no intent file; the ticket's `notes` carry every decision, and this
plan carries them inline.

## Global Constraints

- Hotfix nao muda. (ticket 0049B notes)
- `converge-gates.cjs`: "Exit: always 0 — this is a diagnosis, never a gate. Exit 2 only on CLI misuse." (its header)
- The `Final review:` grammar is exactly `Final review: passed|ruled N|blocked N (after review-NNN)` (converge-gates.cjs header; add--review-discipline SKILL.md lines 189-191)
- Tests run only through `scripts/run-tests.js` / `npm test` at the root — never `npx vitest` in `cli/` (memory: testes não escrevem no checkout)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **The coverage reader never lets go of a table** — `readCoverage` in `converge-gates.cjs` latches
   `covIdx` on the first table with a `Covered?` header and never clears it when that table ends. Every
   `|` line of every later table in the same `plan.md` — header rows included — is then read as a
   coverage row, and almost all of them count as uncovered. `plan.md` routinely holds several tables
   (add-plan appends the subagent outputs, test spec first), so the gate fails on covered work.
2. **The aggregated result can also lose the table entirely** — the same variable `mode` is both the
   latch and the "a table was found" answer, and it is reset to `none` at the start of each file. On an
   epic-wide run over several subfeature plans, a last file with no table returns `mode=none`, which the
   caller reads as "no coverage table → ok", discarding the uncovered count of the earlier files. Same
   root cause as 1 (one variable doing two jobs), found while reading the function.
3. **Two different tables share the `Covered?` column name** — the requirements coverage table add-plan
   writes (`commands/add-plan.md` STEP add-plan.coverage, the one the gate exists for) and the test-spec
   "Coverage vs Requirements" table (`fragments/tdd-pipeline/add-plan.md:70`,
   `skills/add--test-specification/SKILL.md:48`), which add-plan appends to `plan.md` first. The gate
   cannot tell which is the requirements table.
4. **A simple feature closes without the gate** — `add-build.md` `## Loop End` step 1 sends a non-epic
   straight to Publish. `converge-gates.cjs` runs only in the epic Checkpoint Sequence and the epic-wide
   gate, so a simple feature finds its broken gates only at `/add-done`.
5. **The ledger accepts a malformed verdict** — `build-ledger.cjs` appends any one-line `Final review:`
   text. A line outside the grammar lands silently, and `converge-gates.cjs` later reports
   `GATE_REVIEW=broken` with "Malformed ledger line" at `/add-done`, far from the write that caused it.

## Proposal

Fix the three defects in the two scripts and the one column name in the test-spec format, then make
`## Loop End` run the same gate script on a simple feature that it already runs on an epic. Scripts
first, so the command's new gate call reads a correct gate.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/converge-gates.cjs`, `readCoverage`: split the two jobs
  `mode` does today. (a) The column latch (`covIdx`, plus the "in a coverage table" state) is cleared
  when the table ends — the first line that does not start with `|`. Only the FIRST `|` line after a
  non-`|` line (or at file start) is checked as a header; the other rows of a table whose header has no
  `Covered?` are skipped, never re-checked as headers, so a data cell reading `Covered` cannot latch
  mid-table. A later table is read only if its own header carries `Covered?`. (b) "A coverage table was
  seen" becomes a flag that is set once and never reset, across lines and across files, and is what the
  returned `mode` derives from. Legacy `## Cobertura de Requisitos` handling, the fence handling, the
  accepted values (`YES`, `EXCLUDED`, `N/A`, `✅`) and the per-file latch reset all stay as they are.
  Update the function's doc comment to say a table ends at the first non-`|` line.
  - **Produces:** `GATE_COVERAGE` counts only rows of tables whose header carries `Covered?`
- **F2** [product] — `framwork/.codeadd/fragments/tdd-pipeline/add-plan.md` (line 70) and
  `framwork/.codeadd/skills/add--test-specification/SKILL.md` (line 48): the test-spec "Coverage vs
  Requirements" table's third column is renamed `Covered?` → `Status`. Cell values (`✅`) and every
  other column stay. The requirements coverage table in `commands/add-plan.md` keeps `Covered?` — it is
  the table the gate reads, and `add-done.md`'s "Covered? cell" message stays correct.
  "Align the reader" (ticket note 2) needs no further code: after F1 the reader matches the `Covered?`
  header alone, so a `Status` table is skipped.
- **F3** [product] — `framwork/.codeadd/commands/add-build.md`, `## Loop End` step 1: a non-epic no
  longer goes straight to STEP add-build.publish. It first runs
  `node .codeadd/scripts/converge-gates.cjs "docs/features/${FEATURE_ID}"` (no `SFxx`) and reads its
  `KEY=VALUE` lines, never re-deriving a gate by hand. `GATES_OK=5/5` → the feature converged, go to
  Publish. Anything short → mirror the epic wording in `## The Checkpoint Sequence` ("exit BLOCKED
  naming each gate that is not `ok`"): exit BLOCKED naming each gate that is not `ok` (with
  `GATE_REVIEW_DETAIL` / `GATE_COVERAGE_DETAIL` when present), then go to Publish, which already prints
  "any gate `## Loop End` … reported as not `ok`" before its question. STEP add-build.complete states
  the build status as BLOCKED in its metadata's "build status" field, not complete. No new ledger line
  is added — the gate is a read-only diagnosis, as on the epic path. Update the `## The Checkpoint Sequence` intro sentence
  only if it would contradict the new step (it says a simple feature has no checkpoint tag, which stays
  true). Hotfix is untouched — it never reaches `## Loop End` with this script (`hotfix-gates.cjs` owns it).
  - **Consumes:** `GATE_COVERAGE` counts only rows of tables whose header carries `Covered?` (F1)
- **F4** [product] — `framwork/.codeadd/scripts/build-ledger.cjs`: a `LINE` that starts with
  `Final review:` must match `^Final review: (passed|ruled [0-9]+|blocked [0-9]+) \(after review-[0-9]{3}\)$`;
  otherwise exit 2 BEFORE any directory or file is touched, exactly like the newline check. stderr names
  the expected grammar in one line, then the usage. `Final review head: <sha>`, `Blocker suggestion: …`
  and every other line are unaffected (`Final review head:` does not start with `Final review:`).
  Update the header's Exit contract: exit 2 also covers a malformed `Final review:` line.

### Does NOT Include (important!)

- Hotfix — `hotfix-gates.cjs`, `add-hotfix.md` (ticket: "Hotfix nao muda").
- Renaming `Covered?` in the requirements coverage table, or teaching the reader a `Status` header — a
  generic `Status` column appears in other tables, and matching it would re-open problem 1.
- Migrating existing `plan.md` files that still carry a test-spec `Covered?` table. After F1 the reader
  reads that table on its own terms, and its `✅` cells count as covered.
- Changing the epic Checkpoint Sequence or the epic-wide gate.
- Stricter matching in `converge-gates.cjs`'s own `Final review:` parser (it allows trailing text) —
  F4 stops a bad line at the write; the reader is out of scope.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Ticket note 3 names `GATE_REVIEW` and `GATE_COVERAGE`; require only those, or all five? | All five: `GATES_OK=5/5` | The ticket's own `tldr` says "os mesmos gates do add-done"; `/add-done` blocks on all five, and the epic Checkpoint Sequence already requires `5/5` at the same point of the build. Requiring two would let a build close that `/add-done` then blocks — the failure the ticket reports. `5/5` contains the two named gates, so `done_when` holds |
| Reset `mode` to `none` at table end (ticket note 1 wording)? | No — reset the latch, keep a separate "table seen" flag | Resetting `mode` would make the function return `none` after a table was read, which the caller treats as "no coverage table → ok" and would drop the uncovered count. Same reason fixes problem 2 |
| Fold problem 2 into the ticket's scope? | Yes, inside F1 | Same function, same root cause, one-line change; leaving it would keep the coverage gate wrong on epics |
| Exit code for a malformed `Final review:` line | 2 | Ticket note 4; matches the script's existing misuse class (empty or multi-line `LINE`) |
| Where the simple-feature gate runs | `## Loop End` step 1, before Publish | Loop End is reached on every delivery mode after the final review — the same position the epic gate holds |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/converge-gates.cjs` | product | modify | F1 — table-end reset, separate "seen" flag. Depth-1 callers: add-build, add-done, add--commit → **HIGH** |
| `framwork/.codeadd/fragments/tdd-pipeline/add-plan.md` | product | modify | F2 — column rename. Injects into add-plan → **MEDIUM** |
| `framwork/.codeadd/skills/add--test-specification/SKILL.md` | product | modify | F2 — column rename. Depth-1 caller: the tdd-pipeline add-plan fragment → **MEDIUM** |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F3 — simple-feature gate in Loop End. 26 depth-1 dependants → **HIGH** |
| `framwork/.codeadd/scripts/build-ledger.cjs` | product | modify | F4 — refuse malformed `Final review:`. Depth-1 callers: add-build, qa-pipeline add-build fragment, add--review-discipline, add--subagent-driven-development → **HIGH** |
| `scripts/tests/converge-gates.test.cjs` | product (test) | modify | L1.1–L1.3b (L1.7 spans both native suites) |
| `scripts/tests/build-ledger.test.cjs` | product (test) | modify | L1.4–L1.6 (L1.7 spans both native suites) |
| `cli/tests/optional-review-build-final-review.test.js` | product (test) | modify | L2.1 and L2.2, as new cases in this one file |

`AGENTS.md` is not changed. The delivery index has no entry for `converge-gates.cjs` (product layer):
nothing here was tried and dropped before.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree.

### L1 — Script unit tests (native suites, RED → GREEN)

1. **(F1, ticket done_when)** `plan.md` with a requirements table (`| ID | Requirement | Covered? |`,
   all rows `YES`), a blank line, then a second table with no `Covered?` column (e.g.
   `| Area | Test File | Status |` with 2 rows) → `GATE_COVERAGE=ok`, `COVERAGE_UNCOVERED=0`.
   *RED today: the latched index reads the second table's header and rows as uncovered.*
2. **(F1)** Same layout, but the second table also carries `Covered?` with one `NO` row →
   `GATE_COVERAGE=broken`, `COVERAGE_UNCOVERED=1` (a later `Covered?` table is still read).
   *RED today: the second header row itself is counted, so the count is wrong.*
3. **(F1, problem 2)** Epic-wide run: the fixture has NO `<feature>/plan.md`, has
   `subfeatures/SF01-*/plan.md` with a `Covered?` table holding one `NO` row and
   `subfeatures/SF02-*/plan.md` with no coverage table, and the gate is called without `SFxx` (so
   `planSet` drives the multi-file path) → `GATE_COVERAGE=broken`, `COVERAGE_UNCOVERED=1`.
   *RED today: the per-file reset leaves `mode=none` and the gate reports ok.*
3b. **(F1, header-only latch)** A `Covered?` table (all `YES`), a blank line, then a second table whose
   header has no `Covered?` and one of whose DATA cells reads `Covered` → `GATE_COVERAGE=ok`,
   `COVERAGE_UNCOVERED=0`. *RED today: the latched index already counts the second table.*
4. **(F4, ticket done_when)** `Final review: passed` (no `(after review-NNN)`) → exit 2, stderr names
   the grammar, no `LEDGER=` on stdout, and the ledger file is not created. *RED today: exit 0, line appended.*
5. **(F4)** `Final review: ok (after review-001)` and `Final review: passed (after review-001) extra` →
   exit 2 each. *RED today: exit 0.*
6. **(F4, no regression)** `Final review: passed (after review-000)`, `Final review: ruled 2 (after review-003)`,
   `Final review: blocked 1 (after review-012)`, `Final review head: abc123` → exit 0 each, appended.
7. Every existing case in both suites stays green — especially converge-gates #021, #028, #038, #044.

### L2 — Command/skill text (cli suite)

1. **(F3)** The `## Loop End` section of `framwork/.codeadd/commands/add-build.md` names
   `converge-gates.cjs` with the un-scoped feature-dir call on the non-epic branch and `5/5`, and the
   non-epic step no longer reads "go to STEP add-build.publish" as its only action, and the non-epic
   branch carries the "exit BLOCKED naming each gate that is not `ok`" wording.
   *RED today: step 1 goes straight to Publish.*
2. **(F2)** Neither `fragments/tdd-pipeline/add-plan.md` nor `skills/add--test-specification/SKILL.md`
   contains `| Covered? |`; both contain `| RF/RN | Test Cases | Status |`. `commands/add-plan.md` still
   contains `| ID | Requirement | Covered? |`. *RED today: the two files carry `Covered?`.*
3. Existing assertions on `add-build.md` (`optional-review-build-final-review.test.js` L3.3, L3.4b,
   L3.4c; stable STEP IDs) stay green.

### L3 — Build

1. `node scripts/build.js` exits 0 with no new warning; the built `add-build` command in a provider
   output carries the new Loop End text.

### L4 — Behavioural acceptance

1. Running `converge-gates.cjs` on a fixture feature shaped like OMF 0048F (test-spec table first with
   `Status`, requirements table after, all covered, valid ledger) reports `GATE_COVERAGE=ok` and
   `GATES_OK=5/5`. Covered by L1.1 plus the existing ok-tree fixture.

**RED expectations against the current tree:** L1.1–L1.5 (3b included), L2.1, L2.2 fail. L1.6, L1.7,
L2.3 pass before and after. L3 and L4 have no RED step: L3 is a build-health check and L4 is covered by
L1.1.
**GREEN = all levels pass after F1–F4.**

---

## Execution Order

F1 → F4 → F2 → F3

- **F1 first** — F3 makes the build trust the coverage gate; it must be correct before anything reads it.
- **F4 second** — independent script fix; doing both scripts before the docs keeps the native suites as
  one RED/GREEN step.
- **F2 third** — the column rename only matters once F1 stops reading non-`Covered?` tables.
- **F3 last** — consumes F1.

Every boundary leaves the tree working: each F-block is self-contained and its tests go green with it.
Run the native suites for F1/F4 and the cli suite for F2/F3 through `scripts/run-tests.js` in the
container, plus `node scripts/build.js` after F3.

## Reviewer Handoff

For each F-block the build must leave, in the ledger: files touched with the F-block id, the
validation levels that cover it and their pass state, and any decision altered.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. F1 resetting `mode` itself at table end instead of a separate "seen" flag — L1.3 and a plan with
   one table followed by prose must both still report the table's uncovered count.
3. F3 requiring only `GATE_REVIEW` and `GATE_COVERAGE` instead of `5/5` — see Validated Decisions.
4. F4 rejecting `Final review head:` lines — L1.6 guards it.
5. F2 renaming the requirements table in `add-plan.md` by mistake — L2.2 guards it.

---

## Next Steps

/add-framework--build docs/plans/2026-10-12T114425-PLAN--build-gates-align-done.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-12 | Initial creation, from ticket 0049B |
| 2026-10-12 | Review fix-then-ok applied: F1 header-only latch + L1.3b; F3 names where BLOCKED is stated and L2.1 checks it; L1.3 fixture spelled out; L2.2 file named; L3/L4 RED note |
| 2026-10-12 | Implemented on branch build-gates-align-done (F1 41481e2, F4 5376269, F2, F3 + review fixes 3547380) |

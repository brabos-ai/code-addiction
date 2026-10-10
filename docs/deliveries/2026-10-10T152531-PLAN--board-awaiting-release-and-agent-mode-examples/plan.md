# Plan: Board awaiting-release and agent-mode examples — a release step on the board, a Notion mirror example, and a provider-neutral `claude -p` example

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-10
> **Delivery:** confirm
> **Ticket:** 0042B

---

## Objective

[from conversation, no design document] The board's default definitions gain an `awaiting-release` status,
an optional `release` field and suggested labels, all customisable; the done flows park a merged ticket in
`awaiting-release` when the project opts in, and the internal release closes those tickets with the version.
The agent-mode guide gains a short Notion mirror example and presents the `claude -p --json-schema` call as
an example other providers can reproduce from their own documentation.

**When this build is done:** a project that opts in sees merged work wait in a `Release` column until a
release names its version; a project that does not opt in behaves exactly as today; this repository's own
board is opted in and its stable release closes the waiting tickets; the guide no longer claims the
headless contract is Claude Code only.

**Ticket done when:** O padrao do board (DEFAULT_DEFS) tem o status awaiting-release, o campo release e labels sugeridas, personalizaveis pelo backlog.definitions.json, e os fluxos de done e release usam esse status e campo; o guia do agent-mode tem um exemplo curto de espelho no Notion usando esse status e campo, dizendo que o fluxo vale para qualquer app de gestao; o exemplo do Claude Code com --json-schema aparece como exemplo e o guia diz que outros providers podem fazer o mesmo consultando a documentacao; build e testes passam.

## Context

Requested by the maintainer on 2026-10-10 as ticket 0042B: three points, one execution. Point 2 (Notion) is
deliberately a short example, not a feature. No brainstorm ran; the six decisions below were taken at this
plan's STEP 4 and approved as `recommended`.

Prior art: `2026-09-23T193550-PLAN--board-pipeline-phase-statuses` (the nine statuses, seven columns and the
writes), `2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle` (internal done writes the
ticket), `2026-10-10T110912-PLAN--board-outside-code-branches` (the `board` branch and `changes --since`).

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- `board/server.mjs` stays on Node built-ins and the generated runtime modules (AGENTS.md, Product Layer — `board/`)
- Never write a raw `.codeadd/` path in an artefact; use `{{cmd:}}` / `{{skill:}}`; scripts are `.codeadd/scripts/` (AGENTS.md, Pipeline)
- A command acts on a ticket only because a document or the invocation names its id (add--backlog/references/lifecycle.md, The Rule That Comes First)
- "Sem codigo de Notion no framework." (ticket 0042B, note 2)
- No code push and no PR from this delivery's build; the `board` branch write in F7 is board data, approved at STEP 4 question 6 (maintainer, 2026-10-10)

## Problem

1. **Merged is not released** — a ticket reads `done` the moment its PR merges, so the board cannot show
   what is waiting for a release, nor which version shipped it.
2. **No label vocabulary** — `labels` is free text with no suggested set, so every project invents one.
3. **The guide over-claims exclusivity** — `framwork/.codeadd/agent-mode/README.md` says "Claude Code only
   for now. No other provider supports this yet." (lines 3-4, section 5), and section 9 names no example
   tracker, so a reader has no concrete picture of the mirror.

## Proposal

Add the status, the column, the field and the labels to `DEFAULT_DEFS`, plus one opt-in key,
`release_flow`, that the done flows read before choosing `awaiting-release` over `done`. The CLI surfaces
that key on every read so a command never parses the definitions file itself. Then wire the two done
flows, add a board step to the stable release, update this repository's board definitions, give the board
app a glyph and a `release` line, and finish with the guide edits that use the new status and field.

## Scope

### Includes

#### T1 — Core and format

- **F1** [product] — `framwork/.codeadd/scripts/backlog-core.cjs`, `framwork/.codeadd/scripts/backlog-cli.cjs`:
  `DEFAULT_DEFS` gains column `release` (label `Release`) between `review` and `done`; status
  `awaiting-release` (label `Awaiting release`, means "merged, waiting for a release") in that column;
  `done` and `dropped` columns and statuses renumbered after it; a `labels` array of suggested labels
  `feature`, `bug`, `improvement`, `docs`, `chore` (each `{ name, label, means }`); and
  `release_flow: false`. The `add` mode keeps a string `release` (else `null`) in the ticket it builds.
  Every read (`list`, `search`, `get`, including `--full` and `--ids`) prints `RELEASE_FLOW=yes|no`
  in the CLI's read block, right after `BACKLOG_PRESENT`: `yes` only when the definitions file is usable
  and carries `release_flow: true`, otherwise `no` — seeded, default, fallback and `BACKLOG_PRESENT=no`
  included. Tests updated in the same commit: `cli/tests/backlog-core.test.js` (counts, labels,
  `release`), `cli/tests/board-phase-writes.test.js` (NINE/SEVEN sets, L11.6) and
  `cli/tests/backlog-cli.test.js` (the confirmed key order gains `RELEASE_FLOW`). Labels stay unenforced: no write is refused for a label
  outside the list. Must NOT lose: the seeding/fallback provenance, the `unknown-status` refusal, the byte
  preservation of existing rows.
  - **Produces:** `RELEASE_FLOW=yes|no` on every backlog read; status `awaiting-release`; ticket field `release`
- **F2** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md`,
  `framwork/.codeadd/skills/add--backlog/references/phases.md`, `framwork/.codeadd/skills/add--backlog/SKILL.md`:
  the format reference documents the `release` field, the `labels` suggestion list (customisable, not
  enforced) and `release_flow`; the shipped definitions grow to ten statuses and eight columns everywhere
  the docs state a count; `phases.md` adds `awaiting-release` to the model table and the meaning table,
  and says who moves it to `done` (a release, or a person). States that existing projects are not
  migrated: they opt in by adding the status, the column and `release_flow: true` to their own file.
  - **Consumes:** `RELEASE_FLOW=yes|no` on every backlog read (F1); status `awaiting-release` (F1); ticket field `release` (F1)

- **F10** [internal] — `scripts/tests/backlog.test.cjs`: `NINE_STATUSES`/`SEVEN_COLUMNS` become the
  ten/eight sets of F1; backlog#008, #009, #028, #029 assert the new sets (renamed tests carry a
  `Test-Removed:` trailer). Lands in the commit right after F1.
  - **Consumes:** status `awaiting-release` (F1)

#### T2 — Flows

- **F3** [product] — `framwork/.codeadd/skills/add--backlog/references/lifecycle.md`,
  `framwork/.codeadd/fragments/board/add-done.md`: the `add-done` row writes `awaiting-release` when the
  ticket read prints `RELEASE_FLOW=yes`, and `done` otherwise. The Resume skip becomes "already reads
  `done` or `awaiting-release`". The fragment's report line says which status was written. Must NOT lose:
  the "only after the merge landed" rule and the non-blocking failure block. Also updates every status and
  column count `lifecycle.md` states (line 9 and lines 310-317); the "seven writes" wording stays only if
  the number of writes is unchanged.
  - **Consumes:** `RELEASE_FLOW=yes|no` on every backlog read (F1)
- **F4** [internal] — `workbench/skills/add-plan-authoring/SKILL.md` (The Ticket),
  `workbench/skills/add-framework--done/SKILL.md` (STEP 8, The ticket): the internal done writes
  `awaiting-release` when the read prints `RELEASE_FLOW=yes`, else `done`, with the same Resume skip; the
  "seven statuses" sentence in `add-plan-authoring` is corrected to the new count. The `--fix` track
  follows the same rule. `add-framework--backlog` manual close is untouched.
  - **Consumes:** `RELEASE_FLOW=yes|no` on every backlog read (F1)
- **F5** [internal] — `workbench/commands/add-framework--release.md`: a new sub-step at the end of STEP 7,
  after the "checkout `main`" line, **stable only**: `list --status awaiting-release`, then for each ticket
  one write through `backlog-commit.cjs` setting `release` to the tag name (`v` + the STEP 3 version) and
  `status` to `done`. A beta release skips it. The STEP list at the top of the file names the sub-step.
  STEP 8 reports the closed ids and any failure, and says the tickets were closed on tag push, not on
  pipeline success. Failures never undo the release. Acts only on tickets the status names — no
  inference.
  - **Consumes:** status `awaiting-release` (F1); ticket field `release` (F1)

#### T3 — Board app

- **F6** [product] — `board/src/components/ui.tsx`, `board/src/index.css`, `board/src/api/types.ts`,
  `board/src/views/ticket-sheet.tsx`: a glyph shape and hue for `awaiting-release` (shape distinct from
  `in-review` and `done`, light and dark palettes), `release?: string | null` on the ticket type, and one
  `release` line in the ticket detail when set. `server.mjs` is not touched.
  - **Consumes:** status `awaiting-release` (F1); ticket field `release` (F1)

#### T4 — This repository's board

- **F7** [internal] — `docs/backlog.definitions.json` on the `board` branch (clone at
  `~/.codeadd/github.com/brabos-ai/code-addiction/board/`): add the `release` column, the
  `awaiting-release` status and `release_flow: true`, renumbering as F1 does; keep the existing
  `product`/`internal` labels. One commit pushed to `board` only. Runs after F3–F5 land, so no flow writes
  `awaiting-release` before a release step exists to close it. It leaves no commit in the code checkout:
  the ledger records the `board` commit SHA as F7's evidence. On resume F7 is skipped when
  `backlog-cli.cjs get 0042B` already prints `RELEASE_FLOW=yes`.
  - **Consumes:** status `awaiting-release` (F1)

#### T5 — Agent-mode guide

- **F8** [product] — `framwork/.codeadd/agent-mode/README.md`: sections 1, 2 and 5 present the
  `claude -p --output-format json --json-schema` calls as an example of the contract, not the only route;
  remove "Claude Code only for now" / "No other provider supports this yet"; say Codex, OpenCode and
  other providers can run the same flow by consulting their own documentation for headless runs and
  structured output. Section 7's statement of where the feature injection takes effect stays as it is.
  - **Consumes:** none
- **F9** [product] — `framwork/.codeadd/agent-mode/README.md` section 9: a short Notion example after the
  four steps — one Notion database row per ticket, `status` mapped to a select (including
  `awaiting-release`), `release` to a text property — and one sentence that the same loop works for any
  project-management app. The closing line keeps "the framework ships no tracker code". At most 15 lines
  added.
  - **Consumes:** status `awaiting-release` (F1); ticket field `release` (F1)

### Does NOT Include (important!)

- Any Notion code, client or credential handling (ticket note 2).
- Migration of user projects' existing `backlog.definitions.json` — opt-in by hand, documented in F2.
- A release command in the product layer.
- Enforcing labels.
- Changing `add-framework--backlog`: a manual close still writes `done`.
- Code push or PR (maintainer instruction).

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| How the product done knows a release is pending | Opt-in key `release_flow: true` in the definitions; absent → `done` | Only option that leaves projects without releases unchanged (STEP 4 q1, 1a) |
| Where `awaiting-release` sits | New column `Release` between `Review` and `Done` | Seeing what waits for release is the point of the status (q2, 2a) |
| Suggested labels | `feature`, `bug`, `improvement`, `docs`, `chore`; internal board keeps `product`/`internal` | Common types, customisable (q3, 3a) |
| Which release closes tickets | Stable only | Beta does not go through `production` (q4, 4a) |
| Board app | Glyph + hue for the status, `release` line in detail | Hue alone fails a colour-blind reader (q5, 5a) |
| Internal definitions | Build updates and pushes them to `board` | Board data, same route as ticket writes (q6, 6a) |
| How a command learns the opt-in | `RELEASE_FLOW=yes|no` printed by every read | A command never parses the definitions file; one source |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Tests pinning "nine statuses / seven columns" break | High | F1 updates them in the same commit; L1.1 asserts the new set |
| Resume re-writes over a parked ticket | Medium | F3/F4 skip on `done` or `awaiting-release`; L2.2 |
| Internal board opted in before the release can close tickets | Medium | F7 runs last among flow blocks; Execution Order |
| Delivery abandoned after F7: the board is opted in with no release step on `main` | Low | Revert the F7 definitions commit on `board` (SHA in the ledger) |
| A project sets `release_flow: true` without defining the status | Low | Existing `unknown-status` refusal reports it; non-blocking per lifecycle; documented in F2 |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/backlog-core.cjs` | product | modify | F1 |
| `framwork/.codeadd/scripts/backlog-cli.cjs` | product | modify | F1 |
| `cli/tests/backlog-core.test.js` | product | modify | F1, L1 |
| `cli/tests/board-phase-writes.test.js` | product | modify | F1–F4, L1/L2 |
| `scripts/tests/backlog.test.cjs` | internal | modify | F10, L1 |
| `cli/tests/backlog-cli.test.js` | product | modify | F1, L1.5 |
| `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--backlog/references/phases.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--backlog/SKILL.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--backlog/references/lifecycle.md` | product | modify | F3 |
| `framwork/.codeadd/fragments/board/add-done.md` | product | modify | F3 |
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F4 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F4 |
| `workbench/commands/add-framework--release.md` | internal | modify | F5 |
| `board/src/components/ui.tsx`, `board/src/index.css`, `board/src/api/types.ts`, `board/src/views/ticket-sheet.tsx` | product | modify | F6 |
| `docs/backlog.definitions.json` on branch `board` | internal | modify | F7 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F8, F9 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.**

### L1 — Core (RED → GREEN)

1. `DEFAULT_DEFS` statuses are exactly `open, refining, shaped, planning, planned, doing, in-review, awaiting-release, done, dropped` (ten) and columns `backlog, shaping, planning, building, review, release, done, dropped` (eight); every status's `column` exists. *RED today: nine and seven.* (`cli/tests/backlog-core.test.js`, `scripts/tests/backlog.test.cjs` backlog#028/#029, `board-phase-writes.test.js` L11.6)
2. `DEFAULT_DEFS.labels` names are exactly `feature, bug, improvement, docs, chore`; `release_flow === false`. *RED: no keys.*
3. `add` with `"release":"v1.2.3"` keeps it; `add` without it stores `release: null`. *RED: the field is dropped.*
4. A write with a label outside the list succeeds. *GREEN today; guards against accidental enforcement.*
5. A read prints `RELEASE_FLOW=no` with default/seeded definitions and `RELEASE_FLOW=yes` when the file carries `release_flow: true`. *RED: key absent.*

### L2 — Docs and flows (static assertions)

1. `phases.md` and `lifecycle.md` name all ten statuses (backlog#009 updated). *RED: `awaiting-release` absent.*
2. The `add-done` row of `lifecycle.md`, `fragments/board/add-done.md` and `add-framework--done` STEP 8 each name `RELEASE_FLOW` and `awaiting-release`, and the Resume skip names both `done` and `awaiting-release`; `add-framework--done` states the `--fix` track follows the same rule. *RED.*
3. `add-framework--release.md` has a stable-only step naming `list --status awaiting-release`, `backlog-commit.cjs`, `release` and `done`. *RED.*
4. `agent-mode/README.md` no longer contains "Claude Code only" nor "No other provider supports this"; contains `Notion`, `awaiting-release` and `release` in section 9, and names Codex and OpenCode. *RED.*

### L3 — Build and suites

1. `node scripts/build.js` exits 0, no new warning; `node scripts/build-workbench.js` exits 0.
2. `npm run build:board` succeeds (type check covers the `release` field).
3. Full test run through `scripts/run-tests.js` in the container is green; `scripts/test-loss-guard.cjs` passes (renamed tests carry `Test-Removed:` trailers if any name changes).

### L4 — Behavioural acceptance

1. In a temp project with `release_flow: true` and the new defs: `update <id> {"status":"awaiting-release"}` succeeds; then `update <id> {"release":"v9.9.9","status":"done"}` succeeds and `get` shows both. With default defs (no opt-in) a read prints `RELEASE_FLOW=no`.
2. After F7: `backlog-cli.cjs get 0042B` in this repository prints `RELEASE_FLOW=yes`, and with `npm run board` running, `curl 127.0.0.1:<port>/api/board` lists `release` among `columns` and `awaiting-release` among `statuses`; the evidence file records the output.

**RED expectations against the current tree:** L1.1, L1.2, L1.3, L1.5, L2.1–L2.4, L4.2 fail.
**GREEN = all levels pass after F1–F10.**

---

## Execution Order

F1 → F10 → F2 → F3 → F4 → F5 → F6 → F8 → F9 → F7

- **F1 first**: every other block consumes the status, the field or `RELEASE_FLOW`. **F10** right after, so the internal suite is green on the new sets.
- **F2 before the flows**: the format reference is what F3/F4 point at.
- **F3–F5** wire writers and the closer together; the tree is consistent after F5.
- **F6** is independent once F1 lands.
- **F8, F9** last among file edits: F9 uses the status and field.
- **F7 last**: the internal board is opted in only after everything that writes and closes `awaiting-release` exists. It is the one block outside the code checkout; it commits and pushes to `board` only.

Working-tree boundaries: after F1 (tests green), after F5, after F9.

## Reviewer Handoff

For each F-block the evidence file records what changed, which levels cover it and their state, and any
departure from this plan.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A count ("nine", "seven") left stale in any doc or test after F1/F2 — grep the product and workbench trees.
3. F5 acting on a beta release, or on a ticket not in `awaiting-release`.
4. `board/server.mjs` gaining an import (it must not change).
5. F7 pushed before F5 landed, or touching tickets.

## References

- Ticket 0042B (board branch).
- Prior art: `2026-09-23T193550-PLAN--board-pipeline-phase-statuses`, `2026-10-10T110912-PLAN--board-outside-code-branches`, `2026-10-09T184411-PLAN--agent-mode-feature`.

---

## Next Steps

/add-framework--build docs/plans/2026-10-10T152531-PLAN--board-awaiting-release-and-agent-mode-examples.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-10 | Initial creation |
| 2026-10-10 | Review fix-then-ok: RELEASE_FLOW source and position (A1); F10 for the internal suite, `backlog-cli.test.js` in Impact (A2); `lifecycle.md` counts in F3 (A3); F5 tag-name value, position, STEP list, report wording (A4); F7 ledger evidence, resume skip, abandonment risk (A5); L4.2 checked via `/api/board` (A6); F9 hard cap (N1); `--fix` in L2.2 (N2) |
| 2026-10-10 | Built: commits e411431..612f91e on feat/board-awaiting-release; board commit 9c9b991; status implemented |

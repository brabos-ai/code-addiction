# Plan: Internal ticket lifecycle — the internal pipeline moves tickets the way the product one does

> **Status:** implemented
> **Layers:** both
> **Type:** workflow
> **Created:** 2026-09-22
> **Delivery:** automatic

---

## Objective

Today the product backlog is structured (`docs/backlog.jsonl` + `backlog.sh`) and the internal one is a
markdown file edited by hand, and neither can be seen visually. When this is done, the framework's own
repository uses the same format and the same scripts as the product for its backlog, the internal pipeline
moves tickets through their lifecycle the way the product pipeline does, and a React board opens any
`docs/backlog.jsonl` for visual, read-only analysis — built and available by default in the workbench
(`npm run setup`), and an opt-in feature a user enables to get it under `.codeadd/` in their project — shaped from day one to grow into an activity-management app.

Serves the objective by making `add-framework--brainstorm → plan → build → done` carry a declared ticket and
move it to `doing` and `done`, so the board in this repository changes as work happens instead of by hand.

**When this build is done:** a delivery started as `/add-framework--brainstorm 0003B …` carries `ticket:`
through the intent file into the plan header; its build marks the ticket `doing` with `work_id` = the plan
basename right after the ledger opens; its close-out marks it `done` after the merge — each write read-first
and skipped when the ticket already holds the target. The board of 002 shows the move with no hand edit.

## Context

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-21T112103-backlog-board-003-internal-ticket-lifecycle.md` | The per-stage table (where each stage resolves, records or writes), the invariant rules, `work_id` = plan basename, the rejected alternatives |
| `docs/brainstorming/2026-09-21T112103-backlog-board-003-internal-ticket-lifecycle-intent.md` | Path `architectural`, every decision closed, `## Open: None` |
| `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md` | The set's shared decisions |

## Global Constraints

- "A command acts on a ticket only because a document names its id" (`add-backlog/references/lifecycle.md`, The Rule That Comes First)
- "No command ever creates a ticket" (`add-backlog/references/lifecycle.md`, same section)
- "Both writes check the ticket's current state first and do nothing when it already holds the target" (`add-backlog/references/lifecycle.md`, Read First, Skip When Already There)
- "The board is a side-record. A build that fails because a ticket could not be moved has inverted the relationship" (`add-backlog/references/lifecycle.md`, Degradations)
- `uses:` targets resolve inside the declaring artefact's own layer, so a workbench artefact names a product script in prose and adds an HTML comment stating why it is deliberately NOT declared under `uses:` — a `- script:` entry there would resolve to a nonexistent `internal/script/...` node and fail the graph gate (`workbench/skills/add-framework--done/SKILL.md`, the comment under `uses:`)
- `node scripts/build.js` and `node scripts/build-workbench.js` exit 0 with no new warning (`AGENTS.md`, Pipeline)

## Problem

1. **The board does not move on its own** — a ticket the internal pipeline picks up stays `open` until someone edits it by hand.
2. **Nothing links a ticket to the plan that delivered it.**

## Proposal

Put the rules once, in a new `## The Ticket` section of `add-plan-authoring` (which all four stages already
reach), carry an optional `ticket:` through the intent file and the plan header, and give each stage one
pointer line at the step where it acts. Rules first, then the stages in the order a ticket travels.

## Scope

### Includes

#### Phase 1 — the rules and the carriers

- **F1** [internal] — `workbench/skills/add-plan-authoring/SKILL.md` and `references/plan-template.md`:
  a new `## The Ticket` section carrying the internal per-stage table and the invariant rules in short form
  (declared never inferred; no stage creates a ticket; read first, skip when already there; an unknown
  status is reported, never worked around; a board failure never stops a stage), how one ticket is read
  (`backlog.sh list --all | grep '"id":"<id>"'`), that writes go through `backlog-commit.sh update`, and that
  `work_id` is the plan basename. **The Intent File** shape gains an optional `ticket:` frontmatter field; the
  plan template gains an optional `> **Ticket:**` header line and a `**Ticket done when:**` line under the
  objective. An HTML comment names `add-backlog/references/lifecycle.md` as the model and states why the product
  scripts named in prose are deliberately not declared under `uses:`. The section sits after `### Legacy forms
  resolve for reading, never for writing`, before `## The Plan Preview`. (Design §Proposed Solution.)
  - **Produces:** the `## The Ticket` section, `ticket:` in the intent file, `> **Ticket:**` in the plan header
- **F2** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`: the `work_id` row adds
  "or, in the framework's own repository, the plan basename". Nothing else changes.

#### Phase 2 — the four stages, in the order a ticket travels

- **F3** [internal] — `workbench/skills/add-framework--brainstorm/SKILL.md`: STEP 1.1 matches `[0-9]{4}B` in the
  invocation and reads that ticket as exploration input; STEP 5.2's design header gains `> **Ticket:**`; the
  intent-file step writes `ticket:`. A spike names it in the report and writes nothing. One pointer to
  `## The Ticket` at each place, no restated rule.
  - **Consumes:** the `## The Ticket` section, `ticket:` in the intent file (F1)
- **F4** [internal] — `workbench/skills/add-framework--plan/SKILL.md`: STEP 1.2 reads `ticket:` from the intent
  file with `delivery:`; STEP 5 writes `> **Ticket:**` in the plan header and the ticket's `done_when` as the
  `**Ticket done when:**` line. Read-only on the board.
  - **Consumes:** `ticket:` in the intent file, `> **Ticket:**` in the plan header (F1)
- **F5** [internal] — `workbench/skills/add-framework--build/SKILL.md`: STEP 5.1, right after the ledger is
  opened and before the first F-block, reads `> **Ticket:**` from the plan and, unless the ticket already reads
  `doing` with `work_id` = this plan's basename, makes one `backlog-commit.sh update` write carrying both. A
  direct build has no plan and touches no board.
  - **Consumes:** `> **Ticket:**` in the plan header, the `## The Ticket` section (F1)
- **F6** [internal] — `workbench/skills/add-framework--done/SKILL.md`: after STEP 7's merge and before STEP 8 —
  and on the 2.4 recovery path, where STEP 7 is skipped, at the same point — reads `> **Ticket:**` and, unless
  the ticket already reads `done`, writes `{"status":"done"}` through `backlog-commit.sh update`. The report at
  STEP 9 names the ticket and the write's `SHA` or its `DEGRADED` reason.
  - **Consumes:** `> **Ticket:**` in the plan header, the `## The Ticket` section (F1)

### Does NOT Include (important!)

- Creating a ticket from any pipeline stage — only the user, through `/add-framework--backlog`
- Carrying the ticket id into `docs/delivered.jsonl`
- Board writes for direct builds or for work outside a plan
- Any change to `backlog.sh`, `backlog-commit.sh` or the product `lifecycle.md`

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where the rules live | `## The Ticket` in `add-plan-authoring` | Design §Key Decisions row 2 — all four stages already reach it |
| Same rules as the product? | Yes | Design §Key Decisions row 1 |
| `work_id` | The plan basename | Design §Key Decisions row 3 |
| When build writes | STEP 5.1, after the ledger opens | Design §Key Decisions row 4 |
| When done writes | After the merge, normal and recovery routes | Design §Key Decisions row 5 |
| Design-doc carrier | `> **Ticket:**` in the blockquote header | Design §Key Decisions row 6 |
| Audit (STEP 3.4) | Skipped | No existing artefact is the subject; the build's STEP 7 prompt review reads all five after they are written |
| Delivery mode | `automatic` — an accepted one-off exception: the intent file records `confirm`, and this plan does not rewrite it | The user answered STEP 4 with "write it, and go straight to the build". No documented path changes the mode after brainstorm 7.3, so the exception is recorded here rather than presented as the mechanism |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A board write races another write to `main` | Low | `backlog-commit.sh` rebases and aborts on conflict with `DEGRADED`; F5/F6 report it and continue (L2.3) |
| A resumed close-out writes `done` twice | Low | Read first, skip when already `done` (F6; L2.2) |
| A stage restates the rules and they drift | Med | One pointer line per stage; L1.3 greps the stages for restated rules; L3 prompt review item 5 |
| The prose names product scripts and fails the graph gate | Med | Name them in prose only, with the not-declared comment `add-framework--done` already carries — never a `- script:` line under `uses:` (F1, F5, F6; L1.1) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F1 |
| `workbench/skills/add-plan-authoring/references/plan-template.md` | internal | modify | F1 |
| `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` | product | modify | F2 |
| `workbench/skills/add-framework--brainstorm/SKILL.md` | internal | modify | F3 |
| `workbench/skills/add-framework--plan/SKILL.md` | internal | modify | F4 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F5 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F6 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — Artefacts

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` and `node scripts/build-workbench.js` exit 0, no warning absent from the baseline, after every F-block.
2. Grep: `## The Ticket` exists once, in `add-plan-authoring`; `ticket:` appears in The Intent File shape; `> **Ticket:**` appears in `plan-template.md`. *RED today: none exists.*
3. Grep: each of the four stages names `The Ticket` at its step, and none of them contains "declared, never inferred" or "read first" — the rules are not restated. *RED today: no stage names it.*
4. The `work_id` row in `references/backlog.md` names the plan basename. *RED today.*

### L2 — The commands the stages will run, executed in a throwaway repository

A temporary git repository with a bare remote, a board of two tickets written by `backlog.sh add`, and the
exact command lines `## The Ticket` prescribes:

1. Reading one ticket by id returns exactly its line; an id not on the board returns nothing.
2. The build write sets `status: doing` and `work_id: <plan basename>` in one commit; running the same read-first check again finds the target already held and makes no second commit.
3. The done write sets `done`; a second run makes no second commit; a rebase conflict reports `DEGRADED` and the write stays on disk.
4. A write with a status the definitions do not define reports `REFUSED=unknown-status` and changes nothing.

*RED today: `## The Ticket` does not exist, so there are no command lines to execute.*

### L3 — Quality

1. `@prompt-review-agent` delivery pass over the five `.md` artefacts returns no ❌ — item 5 (single owner) is the one this plan is most exposed to.

### L4 — Behavioural acceptance

1. A cold read of the four stages in order, with a ticket id in the brainstorm invocation, reaches: `ticket:` in the intent → `> **Ticket:**` in the plan → a `doing` write at build STEP 5.1 → a `done` write after the merge. No stage writes before build STEP 5.1.
2. The first real ticketed delivery after merge is the live check, recorded as deferred in the ledger.

**RED expectations against the current tree:** L1.2–L1.4 and L2 fail.
**GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 [internal] → F2 [product] → F3 [internal] → F4 [internal] → F5 [internal] → F6 [internal]

- **F1 first** — every stage points at the section it writes.
- **F2 next** — the format reference must allow a plan basename before a stage writes one.
- **F3 → F6** in the order a ticket travels through the pipeline.
- Every boundary leaves the tree working: a stage with no pointer yet simply ignores tickets.
- L2 runs once F1 exists (the command lines are in it) and again after F6.

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, the validation levels covering it and their
state, and any departure from the design with the reason.

Gaps a reviewer must actively hunt:

1. A stage that restates a rule `## The Ticket` owns.
2. A write placed before build STEP 5.1 or before done's merge.
3. The recovery path at done 2.4 left without its `done` write.
4. A `- script:` line for a product script added under a workbench `uses:` block, or a product script named in prose with no comment saying why it is not declared.

## References

- Design set: `docs/brainstorming/2026-09-21T112103-backlog-board-000-umbrella.md` and its `-003-` member
- Prior art: `2026-09-20T222814-PLAN--project-backlog-skill-lifecycle-and-rename` (the product lifecycle this mirrors); `2026-09-21T134430-PLAN--backlog-board-001-internal-backlog-migration` (the internal board it writes to)

---

## Next Steps

/add-framework--build backlog-board-003-internal-ticket-lifecycle

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-22 | Initial creation |
| 2026-09-22 | Review fix-then-ok: product scripts are named in prose with a not-declared comment, never declared (Global Constraints, F1, Risks, Handoff); the design's serves-line restored in the Objective; the delivery-mode exception recorded as one; `## The Ticket` insertion point named |
| 2026-09-22 | Implemented in b5e1769 + 3053852 (F1), 0839cbb (F2), ec0d7f9 + a4142d4 (F3), d037c21 + 48cc53d (F4), 5f6aae6 + a5efb1e (F5), acf99e7 + be59914 (F6) |

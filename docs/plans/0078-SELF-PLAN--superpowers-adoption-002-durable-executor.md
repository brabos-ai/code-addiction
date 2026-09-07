# Plan: Durable Executor — internal layer

> **Status:** implemented
> **Scope:** cross-cutting (2 builder commands + 1 planner command + 3 OpenCode adapters)
> **Created:** 2026-09-07

---

## Context

Internal twin of `0078-PLAN--superpowers-adoption-002-durable-executor`. Design doc:
`docs/brainstorming/2026-09-07T005046-superpowers-adoption-002-durable-executor.md`, Part 7.

The internal builders get the three mechanics that make sense for them — a ledger, a commit per F-block, and
rulings instead of per-item stalls. They deliberately do **not** get subagent dispatch, the review loop or
the pre-flight scan.

## Current State

**`add-framework--build` and `add-framework--self-build` execute inline, sequentially, with a human gate
between every item.** `add-framework--self-build.md:141` is literally *"Wait for checkpoint approval before
next item"*. There is no ledger, no commit boundary between F-blocks, and no record of a decision taken
mid-execution. A build interrupted after F4 of F9 leaves nothing on disk saying so.

**Both have a plan-level approval gate at STEP 2 (`Design [STOP]` → `Wait for Approval`).** That gate is the
human's real decision point and it is not in question.

**There is a live contradiction about who owns `CLAUDE.md`.** `add-framework--build.md:384` (STEP 6.3)
mandates recomputing the Project Anatomy counts, and STEP 6.4 mandates updating "the rest of `CLAUDE.md` for
what THIS build changed". But `add-framework--plan.md:395` tells every reader that
`/add-framework--build` *"reaches neither `CLAUDE.md` nor `.claude/`"*. One of the two is wrong, and a plan
author reading line 395 will route `CLAUDE.md` work into a self-plan that does not need to carry it.

## Proposed Changes

### S1 — The ledger

1. **`.claude/commands/add-framework--build.md`**, STEP 4: before the first F-block, create or resume
   `docs/plans/<plan-basename>--ledger.md`. Identity on the first line
   (`# Build ledger — plan: <plan file path>`). One line per F-block on completion, carrying the commit range.
   On resume, an F-block with a `complete` line is **never re-executed**.
2. **`.claude/commands/add-framework--self-build.md`**, STEP 4.1: the same ledger, same shape, same resume
   rule.

The ledger is **tracked**, for the same reason as the product one: it carries the rulings, and `docs/plans/`
is already where this repo force-adds the artefacts that must survive.

### S2 — A commit per F-block

3. **`.claude/commands/add-framework--build.md`**, STEP 4: record `BASE = git rev-parse HEAD` before an
   F-block and commit after it, once STEP 5's validation for that block passes. The ledger line carries
   `BASE..HEAD`. Message follows `{{skill:add-commit/SKILL.md}}`'s conventions with the F-block id as a
   trailer.
4. **`.claude/commands/add-framework--self-build.md`**, STEP 4.1: the same, per item of the execution order.

**Commit after validation, never before.** An F-block whose `node scripts/build.js` run failed does not get a
commit; it gets a ruling or a stop.

### S3 — Rulings instead of per-item stalls

5. **`.claude/commands/add-framework--self-build.md`**, STEP 4.1 item 4: *"Wait for checkpoint approval
   before next item"* is **replaced**. A conflict, an ambiguity or a plan defect is decided, recorded as
   `Ruling: <what was decided> — <why> — <what it costs if wrong>`, and execution continues.
6. **Both builders**, STEP 6 / STEP 7 (Completion): a **"Rulings I made"** section collecting every `Ruling:`
   line from the ledger, in the order made. Exhaustive — a ruling that stays in the ledger and never reaches
   the human is a decision made in secret.
7. **Both builders**: the four hard stops are stated explicitly — an irreversible or destructive operation; a
   security-sensitive action; a side effect outside this working tree that norms say you ask about first (a
   merge, a push to a shared branch, a publish); and a plan so broken that every path forward is a guess.
8. **Both builders**: the plan-level `Design [STOP]` gate at STEP 2 is **unchanged and explicitly reaffirmed**
   in the same edit, so a future reader does not read S3 as "all human gates removed".

### S4 — The `CLAUDE.md` ownership fix

9. **`.claude/commands/add-framework--plan.md:395`**: the claim is corrected to what is actually true —
   `/add-framework--build` does not reach `.claude/`, and it **does** reach `CLAUDE.md`, for the derived
   Project Anatomy counts (STEP 6.3) and for the prose describing what that build changed (STEP 6.4).
   Everything else in `CLAUDE.md` — policy paragraphs, the Internal Layer tables, the pipeline narrative —
   belongs to `/add-framework--self-build`.

### S5 — The adapters

10. **`.opencode/commands/add-framework--build.md`, `--self-build.md`, `--plan.md`** take every edit above
    that touches their canonical twin.

## Impact

| Artefact | Action | Reason |
|----------|--------|--------|
| `.claude/commands/add-framework--build.md` | modify | S1.1, S2.3, S3.6-8 |
| `.claude/commands/add-framework--self-build.md` | modify | S1.2, S2.4, S3.5-8 |
| `.claude/commands/add-framework--plan.md` | modify | S4.9 |
| `.opencode/commands/add-framework--build.md` | modify | S5 |
| `.opencode/commands/add-framework--self-build.md` | modify | S5 |
| `.opencode/commands/add-framework--plan.md` | modify | S5 |
| `docs/plans/*--ledger.md` | new artefact class | tracked, one per executed plan |

**Not touched:** every skill under `.claude/skills/`, `framework-discovery-agent`, `scripts/build.js`,
`cli/`, and the whole product layer.

## Execution Order

`S4 → S1 → S2 → S3 → S5`.

1. **S4 first**, and alone. It is a one-line correction with no dependency, and it is the finding most likely
   to be dropped if it rides at the end of a larger change. Landing it first also means every subsequent step
   in this plan is written against a file that states its own ownership correctly.
2. **S1 before S2** because the commit range is recorded *in* the ledger; commits with nowhere to be recorded
   are commits whose boundaries are lost.
3. **S3 after S2** because a ruling's cost is only auditable when the commit it rode in on is identifiable.
4. **S5 last, in one pass** — the adapters mirror the canonical files, and `.opencode/` is not built by
   `scripts/build.js`, so mirroring a moving target produces drift no gate catches.

**Verification, per step:**

- After S4: `grep -n 'reaches neither' .claude/commands/add-framework--plan.md` returns nothing, and the
  replacement sentence names STEP 6.3 and 6.4 explicitly.
- After S1: run `/add-framework--self-build` on a two-item scratch plan; a ledger file exists with two lines.
  Interrupt it after item 1 and re-run — item 1 is **not** re-executed.
- After S2: the same run produces two commits, and the ledger lines' hash ranges match `git log`.
- After S3: `grep -c 'Wait for checkpoint approval' .claude/` returns 0; a scratch plan containing a
  deliberate ambiguity produces a `Ruling:` line and completes without asking; and `Design [STOP]` still
  appears in both builders' STEP 2.
- After S5: `diff` each adapter against its twin; the only differences are the frontmatter-dialect ones that
  existed before this plan.

**Safe stopping points:** after **S4** (a one-line correctness fix, independent of everything else);
after **S2** (ledger and commits landed, per-item approval still in place — strictly better than today).

**Not a safe stop:** mid-**S3**. A builder that stopped asking for per-item approval but does not yet write
rulings has removed a human gate and put nothing in its place.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Do the internal builders get subagent dispatch and the review loop? | No | Internal builds are single-artefact edits already gated by `node scripts/build.js` and the test suite; a review seat per F-block would cost more than it catches |
| Do they get the pre-flight conflict scan? | No | It reads `Consumes` / `Produces` pairs across tasks that run in isolation from each other; internal F-blocks execute inline in one context that already sees all of them |
| Is the ledger tracked or scratch? | Tracked, in `docs/plans/` | It carries the rulings, and `docs/plans/` is already where this repo force-adds what must survive |
| Does the per-item human approval survive? | No — replaced by rulings | It was a stall, not a decision point. The real decision point is the plan-level `Design [STOP]`, which stays |
| Who writes the `CLAUDE.md` Pipeline entry for the three new product scripts? | `/add-framework--build`, during the product plan's STEP 6.4 | That is exactly the ownership S4 clarifies — using the corrected rule is the cheapest proof it is right |
| Does `MAX_ATTEMPTS` or a fix loop apply here? | No | There is no fix agent in the internal builders; a failing `build.js` run is a stop or a ruling, not a retry budget |

---

## Next Steps

/add-framework--self-build 0078-SELF-PLAN--superpowers-adoption-002-durable-executor

Then the `003` pair, product plan first.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `13bffe8` on branch `feat/superpowers-adoption` (PR #34) |

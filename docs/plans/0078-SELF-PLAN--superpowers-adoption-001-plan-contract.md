# Plan: Plan Contract — internal layer

> **Status:** implemented
> **Scope:** cross-cutting (2 planning commands + 5 consumer commands + 1 agent + 8 OpenCode adapters + CLAUDE.md)
> **Created:** 2026-09-07

---

## Context

Internal twin of `0078-PLAN--superpowers-adoption-001-plan-contract`. Design doc:
`docs/brainstorming/2026-09-07T005046-superpowers-adoption-001-plan-contract.md`, Parts 3 and 4.

Two things land here. The internal plan format gains the same contract the product layer gets — what binds
the whole plan, and what each unit of work hands to the next. And every planning artefact in the repo moves
to a timestamped filename.

## Current State

**The internal plan format has no constraints block and no interface declaration.**
`add-framework--plan.md`'s `### Plan Structure` runs Context → Problem → Proposal → Scope → Validated
Decisions → Accepted Trade-offs → Risks → Ecosystem Impact → Red-Green Validation Matrix → Execution Order →
Reviewer Handoff → References → Next Steps → Plan Changelog. F-blocks live under `## Scope` → `### Includes`.
`add-framework--self-plan.md`'s `### 4.2 Plan Structure` is the shorter Context → Current State → Proposed
Changes → Impact → Execution Order → Validated Decisions shape.

`## Execution Order` already declares T-boundaries and safe stopping points, and
`## Red-Green Validation Matrix` is already stronger than the `superpowers` equivalent. **Neither is touched.**

**Names are sequential and allocated by directory read.** `add-framework--plan.md:217` and
`add-framework--self-plan.md:138` both instruct "find the next available plan number".
`docs/plans/` holds 27 plans; a plan *set* shares one number (`0074-PLAN--…-000-umbrella` through `-004`).
The convention appears in **76 references across 16 files** — 8 canonical under `.claude/`, 8 OpenCode
adapters — plus `CLAUDE.md`. Two plans drafted on two branches collide on the same number.

**Brainstorms carry a date but no time.** `docs/brainstorming/YYYY-MM-DD-<slug>.md`, referenced 22 times
across `add-framework--plan.md`, `add-framework--shared-brainstorm.md` and their two adapters. Two written
the same day sort arbitrarily.

**`framework-discovery-agent` reads plan filenames.** It globs `docs/plans/*.md`, splits the basename into
slug words for keyword scoring (lines 38-42), and reports hits as `[Plan NNNN]` (line 84).

## Proposed Changes

### S1 — The internal plan contract

1. **`.claude/commands/add-framework--plan.md`**, `### Plan Structure`: insert `## Global Constraints`
   directly after `## Context` in the template, with the same rules the product schema gets — one line per
   constraint, exact value, source cited, `None` when there are none, and the three hard bans (paraphrase,
   vague range, no source). Sources here are `CLAUDE.md`, `provider-map.json` and the design doc, not
   `about.md`.
2. **Same file**, F-block shape: each F-block may declare `Consumes` and `Produces`. The interface is not a
   function signature — it is a `KEY=STATUS` line a script emits, a sidecar key, a frontmatter field, an
   injection anchor name. Example to carry in the template:
   `F3 Produces: converge-gates.sh emits GATE5=pass|fail|skip` / `F7 Consumes: GATE5 (F3)`.
   Every `Consumes` must name an earlier F-block that `Produces` it.
3. **`.claude/commands/add-framework--self-plan.md`**, `### 4.2 Plan Structure`: `## Global Constraints`
   after `## Context`, same rules. `## Proposed Changes` items gain the same `Consumes` / `Produces`
   declaration where one item hands something to a later one.

**Not touched:** `## Red-Green Validation Matrix`, `## Execution Order`, `## Reviewer Handoff`. All three are
already stronger than the upstream equivalent, and the design doc records that as a decision.

### S2 — Timestamped names

4. **`.claude/commands/add-framework--plan.md`**, `### Path and Sequential Numbering`: the section is renamed
   and rewritten. `docs/plans/YYYY-MM-DDTHHMMSS-PLAN--<slug>.md`, local time, no separators in the time part
   (Windows forbids `:` in a filename). The "find the next available number" instruction is deleted — there is
   nothing to look up. A plan **set** allocates its timestamp **once, at the umbrella**, and every topic
   reuses it verbatim.
5. **`.claude/commands/add-framework--self-plan.md`**, `### 4.1 Path and Naming`: same, with `SELF-PLAN`.
6. **`.claude/commands/add-framework--shared-brainstorm.md`**: the design-doc path becomes
   `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>.md`. **Brainstorms carry no kind marker** — internal ones
   live in this repo's `docs/brainstorming/`, product ones in the user's `docs/brainstorm/`; different
   directories in different repositories, so a marker would carry no information. Sets share the umbrella's
   timestamp here too.
7. **`.claude/commands/add-framework--plan.md`**: its own references to `docs/brainstorming/` paths follow
   item 6.
8. **Slug-substring resolution** in every command that takes a plan or brainstorm argument —
   `add-framework--build`, `--self-build`, `--shared-review`, `--release`, `--sync`, `--plan` (Continue Mode),
   `--self-plan` (Continue Mode). A 24-character prefix is not typeable, so the argument resolves when
   exactly one artefact matches the substring; an ambiguous match **lists the candidates and stops**, never
   guesses. The full basename always works, and both naming forms resolve.
9. **`.claude/agents/framework-discovery-agent.md`**: strip the leading token — `NNNN` or the timestamp —
   before splitting the basename into slug words, so `2026`, `09` and `07T004123` never score as topic
   keywords. The report line becomes `[Plan <slug>]` rather than `[Plan NNNN]`, since a number no longer
   identifies a plan.
10. **`CLAUDE.md`**: the Internal Layer table's Plans row states both forms — the new one for new artefacts,
    and that pre-existing files keep their names. **The `docs/` tracking-policy paragraph is left alone**: it
    cites plans `0056–0060`, `0069`, `0074` and `0075` by number, and every one of those files keeps its name.

### S3 — The adapters

11. **`.opencode/commands/`** — the 8 mirrored command adapters take every edit above that touches their
    canonical twin.
12. **`.opencode/agents/framework-discovery-agent.md`** — takes item 9.

## Impact

| Artefact | Action | Reason |
|----------|--------|--------|
| `.claude/commands/add-framework--plan.md` | modify | S1 items 1-2, S2 items 4, 7, 8 |
| `.claude/commands/add-framework--self-plan.md` | modify | S1 item 3, S2 items 5, 8 |
| `.claude/commands/add-framework--shared-brainstorm.md` | modify | S2 item 6 |
| `.claude/commands/add-framework--build.md` | modify | S2 item 8 |
| `.claude/commands/add-framework--self-build.md` | modify | S2 item 8 |
| `.claude/commands/add-framework--shared-review.md` | modify | S2 item 8 |
| `.claude/commands/add-framework--release.md` | modify | S2 item 8 |
| `.claude/commands/add-framework--sync.md` | modify | S2 item 8 |
| `.claude/agents/framework-discovery-agent.md` | modify | S2 item 9 |
| `.opencode/commands/*.md` (8) | modify | S3 item 11 |
| `.opencode/agents/framework-discovery-agent.md` | modify | S3 item 12 |
| `CLAUDE.md` | modify | S2 item 10 |
| `docs/plans/*` (27 existing) | **untouched** | historical records; `CLAUDE.md` cites several by number |
| `docs/brainstorming/*` (15 existing) | **untouched** | same reason |

## Execution Order

`S1 → S2 → S3`.

1. **S1 before S2** because the two planning commands are edited by both, and doing the contract first means
   the rename pass reads a template that is already final.
2. **Inside S2, item 8 comes last.** Slug resolution has to accept both naming forms, so it is written
   against the final wording of items 4-6 rather than against a moving target.
3. **S3 last, in one pass.** The 8 adapters mirror the canonical files; mirroring a file that is still
   changing produces drift that no gate catches — `.opencode/` is not built by `scripts/build.js`.

**Verification, per step:**

- After S1: `grep -c '## Global Constraints'` returns 1 in each of the two planning commands, and the F-block
  example naming `Consumes` / `Produces` is present in `add-framework--plan.md`.
- After S2: `grep -rn 'next available plan' .claude/` returns zero. `grep -rn 'YYYY-MM-DDTHHMMSS' .claude/`
  finds it in all three path-declaring sites. The 76-reference sweep is re-run and every surviving
  `[NNNN]-PLAN` mention is one that *describes the legacy form on purpose*, not a leftover.
- After S3: `diff` each `.opencode/` adapter against its `.claude/` twin and confirm the only differences are
  the frontmatter dialect ones that existed before this plan.

**Safe stopping points:** after **S1** (the templates ask for a section nothing yet validates — additive);
after **S2** (canonical layer coherent, adapters stale — a known, visible lag).

**Not a safe stop:** mid-**S2**. A command that writes `<ts>-PLAN--<slug>` while its sibling still resolves
`[NNNN]-PLAN--<slug>` produces plans no builder can find.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Does the internal plan keep `PLAN` / `SELF-PLAN` in the name? | Yes | It is how `--build` and `--self-build` tell their own plans apart inside one directory |
| Do brainstorms get a kind marker too? | No | Internal and product brainstorms live in different directories in different repositories; the marker would carry no information |
| How does a set stay grouped without a shared number? | The umbrella allocates the timestamp once; topics reuse it verbatim | Preserves the grouping `NNNN` gave for free, and gives brainstorm sets a grouping they never had |
| Are the 27 existing plans renamed? | No | Historical records; `CLAUDE.md` cites several by number in prose, and old commit messages reference them |
| Local time or UTC in the filename? | Local | The name is read by a human ordering their own work; DST is not worth the confusion of a name that disagrees with the clock |
| Does `## Red-Green Validation Matrix` change? | No | Already stronger than the upstream `writing-plans` equivalent |
| Who fixes the `CLAUDE.md` ownership contradiction (`--build.md:384` vs `--plan.md:395`)? | `0078-SELF-PLAN--…-002` | That plan edits `add-framework--plan.md` for other reasons; splitting the fix across two plans risks neither doing it |

---

## Next Steps

/add-framework--self-build 0078-SELF-PLAN--superpowers-adoption-001-plan-contract

Then the `002` pair, product plan first.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `38f5349 (canonical) + 8957a17 (OpenCode adapters)` on branch `feat/superpowers-adoption` (PR #34) |

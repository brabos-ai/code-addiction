# Plan: Plan Contract — what a task declares, what binds the plan, and what stops shipping

> **Status:** implemented
> **Type:** product (2 schema entries + 1 skill + 2 commands + 1 skill deletion + registry)
> **Created:** 2026-09-07
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Design doc: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-001-plan-contract.md`. It carries the
contract, the worked examples and the rejected alternatives; this plan names files and order and does not
repeat them.

Topic 002 replaces the executor with one that dispatches a fresh subagent per task and reviews each task's own
diff. Two of that executor's mechanics read things the plan does not currently write.

## Problem

**A subagent implementing T02 never sees T01's code.** `tasks.md` gives each task `Service`, `Files`, `Deps`
and `Verify`. `Deps: T01` states order. Nothing states the signature T02 must call, so T02 invents one and
T01 invents another.

**A reviewer with no constraints block reviews against its own taste.** The `feature-plan` schema
(`add-doc-schemas/references/new-feature.md:115`) has no home for project-wide requirements, so RNFs, stack
pins and `validation_gates` scatter through prose or vanish.

**And a skill nobody loads still talks.** `add-planning` ships to all 5 providers carrying a plan template
that diverges from the canonical schema and a rule — "one semantic commit per batch" — that
`add.build.md:82` forbids. It is the duplicate-vocabulary failure the umbrella rejects for `superpowers`,
except this copy is ours and already installed on every user's machine.

## Proposal

Four batches. The schema and the checklist define the contract; `add.plan` writes and gates it; the orphan is
removed.

## Scope

### Includes

#### T1 — The schema

- **F1** — `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md`, `feature-plan` entry: insert
  `Global Constraints` into the **Sections** line between `Context` and `Architecture Decisions`; add its
  depth floor (one line per constraint, exact value, source cited in parentheses); add three **hard bans** —
  paraphrase, a vague range, a constraint with no source; add the **empty rule**: with no project-wide
  constraints the section reads `None`, never absent. **Must NOT lose:** the existing six section names, the
  Compression rules, and the existing hard bans.
- **F2** — same file, `brainstorm` entry (line 181): the path becomes
  `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>.md`. The existing sentence already calls the date prefix
  "mandatory for chronological tree ordering"; the time component is what makes that sentence true, and the
  rationale is amended to say so rather than being replaced.

#### T2 — The task contract

- **F3** — `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md`: add `Consumes` and `Produces` to the
  `## Execution` task shape, in the canonical structure block and in the `### \`## Execution\`` section rules.
  Rules to state: `Produces` is the exact signature a later task will call, `-` when nothing; `Consumes` is
  the exact signature plus the producing task ID, `-` when nothing; **every `Consumes` must match, character
  for character, a `Produces` on an earlier task**; and **there is no tick rule** — an interface is a
  contract, not progress, and validators never tick these lines. The four-sub-bullet count in the section
  rules becomes six. **Must NOT lose:** the ≤10-word task description cap, the 3-file cap, the one-service
  rule, the existing tick rules for all six sections, and the derived-state rule for
  `## Requirements Coverage`.

#### T3 — The writer and the gate

- **F4** — `framwork/.codeadd/commands/add.plan.md`: the architect writes `## Global Constraints` into
  `plan.md` and `Consumes` / `Produces` into every `tasks.md` execution task. STEP 12's validation gate gains
  one **mechanical** check: every `Consumes` string matches a `Produces` string on an earlier task, and a
  mismatch fails the gate **printing both strings**. A `Consumes` written as prose fails this check, which is
  the point — the check is what stops 002's pre-flight scan from degrading into guesswork. **Must NOT lose:**
  the STEP 13 `@plan-reviewer-agent` verdict loop, the readback sub-step, and the prohibition on
  re-dispatching the UX subagents to satisfy a plan-review finding.
- **F5** — `framwork/.codeadd/commands/add.brainstorm.md`: the brainstorm path gains the time component at
  **all three sites** — line 36 (the write boundary), line 46 (the exception clause) and line 106 (the
  `**Path:**` line). Three sites, one format; a partial edit leaves the command contradicting itself about
  where it may write.

#### T4 — Removing the orphan

- **F6** — Delete `framwork/.codeadd/skills/add-planning/` and remove `"add-planning"` from
  `framwork/provider-map.json` (line 106). **Both halves land together**: `skillStrategy` warns rather than
  throwing on a registered skill with no source, so a registry entry left behind produces a
  `SKIP (not found)` line that a build log makes easy to miss — and the skill silently stops shipping without
  anything failing.
- **F7** — **Four `<!-- uses: -->` declarations name `add-planning` as a `mention:`** — in
  `add-code-review`, `add-ecosystem`, `add-feature-specification` and `add-tasks-checklist`. Every one is an
  `origin: declared` edge in `artefact-graph.json`, and `checkArtefactGraph` treats a declared edge to a
  missing node as a **FAILURE**. All four lines are removed in the same landing as F6, or the build goes red.
  Separately, rewrite the **prose** references so each stands on its own, never merely deleting them:
  `add-code-review/SKILL.md:14` and `add-feature-specification/SKILL.md:22` define their own scope by
  pointing at `add-planning` as the place planning happens — they must point at `add.plan` and the
  `feature-plan` schema instead. `add-ecosystem/SKILL.md:64` is a map row and is removed as a row.
  `add-tasks-checklist/SKILL.md:22` names it in a `When NOT to Use` bullet that must keep drawing its
  boundary against `add.plan`. The counts are a floor; L5's grep is what proves the sweep finished.

  > **Plan correction, 2026-09-07.** This F-block originally named three prose references and claimed the
  > deletion would only warn. The artefact graph — queried at execution time, before F1 — showed four
  > declared edges and a failing gate. Recorded in `docs/evidence/0078-build-ledger.md` as CONFLICT 1.

### Does NOT Include (important!)

- **Any executor change.** No ledger, no commits, no review loop, no model selection. Nothing here makes
  `/add.build` behave differently — it is topic 002 that consumes this contract.
- **Retiring `GIT CLEAN` from `add.build.md:82`.** Decided, but it lands where the commits are made.
- **Mirroring `Consumes` / `Produces` into `plan.md`.** `plan.md` freezes and `tasks.md` keeps changing; the
  copy would go stale silently. The map a reviewer wants is computed by 002's pre-flight scan, not authored
  twice.
- **Renaming existing files.** The 27 plans and 15 internal brainstorms keep their names.
- **The internal layer.** `0078-SELF-PLAN--superpowers-adoption-001-plan-contract` owns it.
- **`add-skill-creator/testing-skills-with-subagents.md:13`**, which dangles a `superpowers:` reference at
  users. Real defect, but it belongs with the TDD material, not the plan contract.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Interfaces live only in `tasks.md` | One source; the subagent reads its own task and nothing else | Mirroring into `plan.md` — it freezes while `tasks.md` changes |
| The `Consumes` ↔ `Produces` check is a string match, not a judgement | A judgement gate cannot be RED-tested; a string match can, and it forces the architect to write a signature instead of prose | An `@plan-reviewer-agent` finding |
| Empty Global Constraints reads `None` | An absent section is ambiguous; `None` is an assertion | Omitting the section when empty |
| `add-planning` is deleted, not rewritten | Loaded by nothing; contradicts both the schema and `add.build.md:82` | Rewriting it as the authoring guide — a second voice to sync with `add-doc-schemas` |
| The three prose references are rewritten, not deleted | Two of them define a skill's own scope by contrast; deleting the clause loses the boundary | Deleting the lines |

## Accepted Trade-offs

- **The architect writes more** — two sub-bullets per task and a constraints block per plan. Accepted: it is
  exactly the information the executor cannot reconstruct.
- **The mechanical check will reject plans that read fine to a human.** Accepted, and intended: a `Consumes`
  a machine cannot match is a `Consumes` 002's scan cannot use.
- **Deleting `add-planning` removes content with salvage value** (the S/M/L sizing table, batching). Accepted:
  topic 002 carries it forward where commits actually happen.

## Risks and Mitigations

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| `Consumes` is written as prose, defeating the check | Medium | High | F4's gate is a string match that prints both strings on failure; L4.2 tests it RED with a deliberately mismatched pair |
| Deregistering `add-planning` without deleting the tree — or the reverse — ships silently | Medium | Medium | F6 states both halves land together; L1.3 asserts the tree and the registry agree |
| Global Constraints is filled with restated functional requirements | Medium | Medium | Hard ban in F1: project-wide only, with a cited source |
| F5 is applied to one or two of the three sites | Medium | Medium | L2.3 greps for the old `YYYY-MM-DD-<slug>` form in `add.brainstorm.md` and expects zero hits |
| The six-sub-bullet task shape breaks a validator parsing four | Low | High | L3.2 confirms the tick rules name their sections by heading, not by sub-bullet count |

## Ecosystem Impact

| Artefact | Action | Reason |
|---|---|---|
| `add-doc-schemas/references/new-feature.md` | modify | `feature-plan` gains a section; `brainstorm` path gains time |
| `add-tasks-checklist/SKILL.md` | modify | the task shape gains two sub-bullets and their rules |
| `add.plan.md` | modify | writes both blocks; gate checks the pairs |
| `add.brainstorm.md` | modify | brainstorm path, 3 sites |
| `add-planning/` | **remove** | orphaned, divergent, self-contradictory |
| `provider-map.json` | modify | deregister `add-planning` |
| `add-code-review/SKILL.md`, `add-feature-specification/SKILL.md` | modify | rewrite the boundary clause |
| `add-ecosystem/SKILL.md` | modify | remove the map row |

Skill count falls 42 → 41; `/add-framework--build` STEP 6.3 recomputes it.

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below is written and confirmed failing against the current tree before
F1 lands.

### L1 — Build-side (RED → GREEN)

1. `node scripts/build.js` exits 0. *Green today; a preservation guard, not a RED level.*
2. `checkArtefactGraph` **fails loud** if F6 lands without F7: four declared edges would point at a deleted
   node. Prove it by running the build with F6 applied and F7 not, and capturing the failure; then apply F7
   and confirm green. *A gate that was never seen red is a gate nobody has tested.*
3. No node in `artefact-graph.json` has `id` `product/skill/add-planning`, no edge names it in `from` or
   `to`, and `provider-map.json` has no `add-planning` key. *RED today: 1 node, 5 edges, 1 key.*
4. The build log contains no `SKIP (not found)` line and no new warning against the pre-F1 baseline
   (`docs/evidence/0078-baseline-build.txt`, 0 warnings). *RED if F6 lands half-done.*

### L2 — Schema content (RED → GREEN)

1. The `feature-plan` **Sections** line names `Global Constraints` between `Context` and
   `Architecture Decisions`. *RED today.*
2. The `feature-plan` entry states the `None` rule and all three hard bans. *RED today.*
3. `grep -c 'YYYY-MM-DD-<slug>' add.brainstorm.md` returns 0, and `YYYY-MM-DDTHHMMSS-<slug>` appears three
   times. *RED today: 3 and 0.*
4. The `brainstorm` schema entry names the time-bearing path. *RED today.*

### L3 — Task contract (RED → GREEN)

1. `add-tasks-checklist/SKILL.md`'s canonical structure block shows a task with six sub-bullets including
   `Consumes` and `Produces`. *RED today: four.*
2. The `## Execution` section rules state the match rule and the explicit **no tick rule**, and every other
   section's tick rule is byte-identical to today. *RED on the first half, green guard on the second.*

### L4 — Command integration (RED → GREEN)

1. `add.plan.md` instructs the architect to write both blocks. *RED today.*
2. **The gate bites.** Given a `tasks.md` whose T02 `Consumes` names a signature no earlier task `Produces`,
   STEP 12's gate fails and prints both strings. Given a matching pair, it passes.
   *RED today: no such check exists, so the malformed input passes.*

### L5 — Dead-reference sweep (RED → GREEN)

1. `grep -rn 'add-planning' framwork/` returns zero hits across the whole product layer — not only the three
   known sites. *RED today: 4 hits (3 prose + the registry).*
2. `add-code-review/SKILL.md:14` and `add-feature-specification/SKILL.md:22` each still draw their boundary,
   now against `add.plan` / the `feature-plan` schema. A deleted clause fails this level.

### L6 — Behavioural acceptance (manual)

1. Run `/add.plan` against a scratch feature with a two-task plan where T02 depends on T01. The generated
   `tasks.md` carries a `Produces` on T01 and a matching `Consumes` on T02, and `plan.md` carries a
   `## Global Constraints` block sourced from `about.md` and `CLAUDE.md`.
2. Hand-edit the `Consumes` to a signature nothing produces and re-run the gate. It fails, naming both
   strings.

**RED expectations against the current tree:** L1.3, L1.4, L2.1–L2.4, L3.1, L3.2 (first half), L4.1, L4.2 and
L5.1 all fail today. **GREEN = every level passes after F1–F7.**

## Execution Order

`T1 → T2 → T3 → T4`, with the whole matrix written and confirmed RED before F1.

- **T1 before T3** because F4 makes `add.plan` write a section the schema must already define; a gate that
  validates against an undefined section is untestable.
- **T2 before T3** for the same reason on the task side.
- **F6 and F7 land together, and F6's two halves land together.** A registry entry surviving its source
  produces a `SKIP (not found)` warning nobody reads, and the skill stops shipping silently.
- **L1.2's graph-warning baseline is captured before F6.** Once the directory is gone the pre-change warning
  set is unrecoverable without a checkout.

**Safe stopping points:** after **T1** (the schema defines a section nothing yet writes — additive and
harmless); after **T2** (same on the task side); after **T3** (contract complete and enforced, the orphan
still shipping — the state we are in today plus a working contract).

**Not a safe stop:** mid-**T4**. A deregistered-but-present skill, or a present-but-unreferenced one with
three dangling prose clauses, is worse than either endpoint.

## Reviewer Handoff

`/add-framework--shared-review` must audit this without re-reading the design doc. For each F-block, the
evidence file carries:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, separating the RED-then-GREEN levels from the preservation guards
  (L1.1, L3.2's second half, L5.2) that were green throughout.
- **The L1.2 graph-warning baseline**, captured verbatim before F6, beside its post-change re-read.
- **The gate's RED run** — the actual failure output from L4.2's mismatched pair, not a claim that it failed.

Specific gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — particularly L4.2, where a check written
   after the fact proves nothing.
2. F7 done by deletion rather than rewrite. Two of the three references define a skill's scope by contrast;
   a reviewer must read the surviving sentences and confirm the boundary is still drawn.
3. The `## Execution` tick rules altered while adding the sub-bullets. The two new lines are explicitly
   **not** ticked; a tick rule that quietly grew to six items is a defect.

## References

- Design doc: `docs/brainstorming/2026-09-07T005046-superpowers-adoption-001-plan-contract.md`
- Umbrella: `docs/plans/0078-PLAN--superpowers-adoption-000-umbrella.md`
- Internal twin: `docs/plans/0078-SELF-PLAN--superpowers-adoption-001-plan-contract.md`
- Upstream: `superpowers@6.3.0` `writing-plans` (MIT, Jesse Vincent) — `Interfaces` and `Global Constraints`

## Next Steps

/add-framework--build 0078-PLAN--superpowers-adoption-001-plan-contract

Then, for the internal layer (`/add-framework--build` does not reach `.claude/`):

- `/add-framework--self-build 0078-SELF-PLAN--superpowers-adoption-001-plan-contract`

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `b436e2d` on branch `feat/superpowers-adoption` (PR #34) |

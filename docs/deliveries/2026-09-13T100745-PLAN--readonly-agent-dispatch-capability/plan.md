# Plan: Read-only agent dispatch capability — a read-only agent is never asked to write, and the build proves it

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-13

---

## Context

A framework run reported that `/add.plan` STEP 10.4 dispatches `@architecture-agent` to write
`tasks.md`, the agent is read-only, and it refuses — with no visible error, only the missing file.

The report is correct and understates the problem. `/add.plan` has **three** dispatch sites handing
a write to a `readonly: true` agent, and the reason none of them errors is structural rather than
local to any one site.

`scripts/build.js` translates `readonly: true` into whatever each provider enforces: OpenCode gets
`permission: edit: deny` (`build.js:1789`), Cursor gets `readonly: true` (`build.js:1796`). The
`claude` dialect (`build.js:1775`) emits **nothing** — it passes `tools` and `disallowedTools`
through verbatim and that is all. `architecture-agent` and `discovery-agent` declare neither. So on
Claude, the primary provider, the agent holds a full tool set and declines by the prose in its own
body. A prose decline is not an error: the command carries on and the file is simply absent.

The project already diagnosed this once. `framwork/.codeadd/agents/plan-reviewer-agent.md:8-9`
carries the comment: *"readonly alone ships to Claude as prose with nothing enforcing it.
disallowedTools is what has teeth there."* Nine of the twelve product read-only agents declare
`disallowedTools` by hand. Three do not: `architecture-agent`, `discovery-agent` and
`reviewer-agent`. Only the first two are ever dispatched to write, so the third has sat unenforced
on Claude with no symptom to report it. That is the shape of the defect: a manual latch someone has
to remember, which has now slipped three times and surfaced twice.

No design document precedes this plan. The decisions were taken in the `/add-framework--plan`
questionnaire and are recorded inline under **Validated Decisions**.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Agents build only for a provider declaring an `agents` pattern (provider-map.json → providers)
- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}` (CLAUDE.md, Pipeline)
- `tasks.md` has 6 sections in this exact order with these exact headings (validators parse by exact text) (add-tasks-checklist, Canonical Structure)
- `readonly: true` in the source frontmatter is the single declaration of a read-only agent (build.js:1834 comment)

## Problem

1. **A read-only agent is dispatched to write, and nothing catches it** — three sites in
   `/add.plan`: STEP 3 (`@discovery-agent` → `past-features.md`), STEP 10.4
   (`@architecture-agent` → `tasks.md`), STEP 10.5 (`@architecture-agent` → edits `plan.md`).
2. **On Claude the failure is silent** — `AGENT_DIALECTS.claude` renders no capability constraint,
   so `readonly: true` reaches the primary provider as text the agent may decline by. A decline is
   not an error; the run continues and the artefact is missing.
3. **The latch is manual and has already slipped** — nine of twelve read-only agents hand-declare
   `disallowedTools`; `architecture-agent`, `discovery-agent` and `reviewer-agent` do not. Nothing
   in the build or the test suite notices the gap.
4. **`/add.plan` and the canonical schema disagree on a section name** — `add.plan.md:611` requires
   `## Quality Gates` in `tasks.md`; `add-tasks-checklist` names it `## Validation Gates`, both in
   its Canonical Structure and in its own Architect Subagent Prompt Template. Validators parse by
   exact text, so a `tasks.md` written to the command fails the schema.
5. **STEP 10.5 never names its writer** — it calls itself "the in-place fixer", dispatches an agent
   for review in the same breath, and leaves the reader to guess which one edits `plan.md`.

## Proposal

Three stages, in this order, because the order is load-bearing.

**Stage 1 — correct the dispatch sites (F1–F5).** Every read-only agent returns its document in its
report; the coordinator writes the file. This is the pattern the codebase already uses and already
documents: `add-tasks-checklist:254` describes the per-area validator as writing directly in
`/add.build` "and under `/add.plan-to-ready` (emits report; coordinator writes)".

**Stage 2 — move the latch into the build (F6–F7).** `AGENT_DIALECTS.claude` emits
`disallowedTools: Write, Edit, NotebookEdit` whenever the source declares `readonly: true` and does
not declare `disallowedTools` itself; an explicit source declaration keeps winning, which preserves
the wider denials `feature-history-agent`, `git-history-agent` and `readback-agent` already carry.
Agent graph nodes start carrying `readonly`, so the relationship becomes queryable.

**Stage 3 — a gate that fails the suite on a regression (F8).** A test walks every `DISPATCHES` edge
into a read-only agent and fails when the dispatch block declares a file `Output:`.

Stage 1 must land before Stage 2. After F6 the build denies for real, so a dispatch site left
uncorrected turns a missing file into a hard tool denial in front of the user.

## Current State

| Artefact | Layer | Today | Dependants (`impact --depth 1`) |
|---|---|---|---|
| `framwork/.codeadd/commands/add.plan.md` | product | 3 write-dispatches to read-only agents; `## Quality Gates` drift | 20 — **HIGH** |
| `framwork/.codeadd/agents/architecture-agent.md` | product | `readonly: true`, no `disallowedTools` | 7 — **HIGH** |
| `framwork/.codeadd/agents/discovery-agent.md` | product | `readonly: true`, no `disallowedTools` | (dispatched from `add.plan` only) |
| `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md` | product | template's `## OUTPUT` tells the agent to write | 5 — **HIGH** |
| `scripts/build.js` → `AGENT_DIALECTS.claude` | internal | emits no capability constraint | — |
| `scripts/build.js` → `collectNodes` | internal | agent nodes carry no `readonly` | — |

`node scripts/graph.js history` reports no prior delivery for `add.plan`, `architecture-agent` or
`discovery-agent` on the product layer. This is new ground, not a relapse.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/commands/add.plan.md` STEP 3 (~line 135-142): the
  `@discovery-agent` dispatch stops declaring a file `Output:`. The agent returns the
  `past-features.md` content in its report; STEP 3 writes the file. State the writer in one
  sentence, so no reader has to infer it. **Must NOT lose:** the cache-detection rule that skips the
  dispatch entirely when `past-features.md` already exists, the "Extract and Apply" list that
  consumes the file, and the keyword fallback when there is no relevant match.
  - **Produces:** the phrase `the coordinator writes the file` marks a corrected dispatch site

- **F2** [product] — `framwork/.codeadd/commands/add.plan.md` STEP 10.4 (~line 602-617): the
  `@architecture-agent` dispatch stops declaring `**Output:** ${PLAN_DIR}/tasks.md`. The agent
  returns the whole document in its report; STEP 10.4 writes `${PLAN_DIR}/tasks.md`. **Must NOT
  lose:** the mandatory `add-tasks-checklist` load before dispatch, the exact-heading list, the six
  ordered metadata sub-bullets (`Service`, `Files`, `Deps`, `Consumes`, `Produces`, `Verify`), the
  character-for-character `Consumes`↔`Produces` rule STEP 12.1 checks mechanically, `plan.md` FROZEN
  after this step, and every checkbox starting `[ ]`.
  - **Consumes:** `the coordinator writes the file` (F1)

- **F3** [product] — `framwork/.codeadd/commands/add.plan.md:611`: `## Quality Gates` becomes
  `## Validation Gates`, matching `add-tasks-checklist`. Carry the conditional with it — the section
  is present only when `CLAUDE.md` exposes a `validation_gates` block, which the command's flat list
  of six mandatory headings currently hides. `add.plan.md:611` is the **last remaining writer** of the
  old heading in the repo; `add-tasks-checklist:301`'s backwards-compatibility note stays, because
  `tasks.md` files already on disk in users' projects still carry it. **Must NOT lose:** the
  parenthetical stating that validators parse by exact text.

- **F4** [product] — `framwork/.codeadd/commands/add.plan.md` STEP 10.5 (~line 619-635): name the
  writer. The dispatched `@architecture-agent` reviews and reports; STEP 10.5 — the coordinator —
  applies every edit to `plan.md`. **Must NOT lose:** the three in-place checks and the statement
  that they are the only three, the "consumed, never derived" rule for `@consistency-agent`
  dimensions 1 and 2, `NEVER create separate report file`, and the 150-line ceiling per `plan.md`.

- **F5** [product] — `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md`, the Architect Subagent
  Prompt Template (~line 201-233): its `## OUTPUT` block stops instructing the agent to write
  `${PLAN_DIR}/tasks.md` and instructs it to return the complete document in its report instead,
  writing no file. **Must NOT lose:** the exact section headings the template already lists
  (`## Validation Gates` included, already correct here), the complexity scoring thresholds, and the
  TDD service order.

- **F6** [internal] — `scripts/build.js` → `AGENT_DIALECTS.claude` (~line 1775-1783): when the
  source frontmatter declares `readonly: true` and declares no `disallowedTools`, emit
  `disallowedTools: Write, Edit, NotebookEdit`. A source that declares `disallowedTools` keeps its
  own value verbatim. **Must NOT lose:** the verbatim passthrough of `model`, `tools`,
  `disallowedTools`, `skills` and `memory`, which exists because re-serialising a multi-line YAML
  list from a scalar drops every entry.
  - **Produces:** every built `.claude/agents/<name>.md` whose source declares `readonly: true`
    carries a `disallowedTools:` line

- **F7** [internal] — `scripts/build.js` → `collectNodes` (~line 796-814) and the agent push sites
  (~line 886, ~line 990): agent nodes carry `readonly: true|false`, read from the source
  frontmatter. Update the `@returns` shape comment on `collectNodes` and the `SIDECARS` consumer
  expectations if the node shape is asserted anywhere. **Must NOT lose:** node identity as
  `<layer>/<kind>/<name>`, and the rule that a node is what the build can transform rather than what
  sits in the right folder.
  - **Produces:** `artefact-graph.json` agent nodes carry a `readonly` boolean

- **F8** [product] — new `cli/tests/agent-capability.test.js`, two assertions:
  (a) every built `.claude/agents/*.md` whose source declares `readonly: true` carries a
  `disallowedTools` line — **Consumes** F6's output;
  (b) no `DISPATCHES` edge into a `readonly` agent node has a file `Output:` in its dispatch block.
  The block is the lines following a line naming `@<agent>`, up to 8 lines or the next markdown
  heading, whichever comes first; a violation is an `Output:` bullet whose value **opens with a
  backticked token ending in `.md`**. On failure, print the source path, line number, agent name and
  the offending line verbatim. **Must NOT lose:** the tightened value shape — a looser `.*\.md`
  matches `add.plan.md:635`, whose `Output:` is a stdout summary that merely mentions `plan.md`.
  - **Consumes:** `every built .claude/agents/<name>.md whose source declares readonly: true carries a disallowedTools: line` (F6)
  - **Consumes:** `artefact-graph.json agent nodes carry a readonly boolean` (F7)

### Does NOT Include (important!)

- **No edit to `architecture-agent.md`, `discovery-agent.md` or `reviewer-agent.md`.** That is the
  point of F6 — the build fills the gap for Claude, OpenCode and Cursor already enforce, and Codex
  has no capability field at all. Hand-adding `disallowedTools` to these three would restore the
  manual latch this plan removes. `reviewer-agent` is covered as a class member, not as a reported
  symptom: it is never dispatched with a file `Output:`, so nothing was failing on it.
- **The nine hand-written `disallowedTools` declarations stay.** Three of them
  (`feature-history-agent`, `git-history-agent`, `readback-agent`) deny more than the default, so a
  sweep would have to keep them anyway and the cleanup would finish half-done.
- **Internal-layer agents are untouched.** Only one (`plan-readback-agent`) declares
  `readonly: true`, and `.claude/agents/` passes through no dialect, so the field is inert there.
  Making internal agents declare and enforce capability is a separate topic.
- **STEP 10.5 gets no gate coverage.** Its `Output:` is a stdout summary, not a file path, so F8's
  check cannot see it by design. F4 fixes it by wording, and the plan says so rather than implying
  the gate covers all five defects.
- **No change to `@architecture-agent`'s or `@discovery-agent`'s read-only identity.** What is
  asserted in writing, precisely: `add.diagnose:173` states it for `@architecture-agent` only;
  `add-subagent-driven-development:79` states it for both; each agent's own `description` states it.
  `add.hotfix` is **not** a citation here — it never names `@discovery-agent`, and its one
  `@architecture-agent` dispatch (line 272) carries no read-only qualifier, unlike the
  `[read-only, standard]` tags a few lines below it at 350-352.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Who writes `tasks.md` and `past-features.md`? | The agent reports, the coordinator writes | The pattern is already in the codebase and already documented at `add-tasks-checklist:254`. No agent changes identity, no consumer breaks. Cost is the document travelling through the coordinator's context (~100-200 lines) |
| Flip `architecture-agent` to read-write instead? | Rejected | Breaks four consumers that assert read-only in writing |
| A new `@tasks-agent` with write capability? | Rejected | A registered artefact, a dialect pass, tests and distribution for one consumer |
| Drop the subagent and have the coordinator author `tasks.md` inline? | Rejected | Cheaper, but loses the clean context that is the subagent's whole reason for being at 10.4 |
| Does the build own the read-only latch? | Yes — `AGENT_DIALECTS.claude` emits `disallowedTools` on `readonly: true` | Closes the class, not the two instances. An explicit source declaration still wins, so the three wider denials survive |
| Remove the nine manual declarations at the same time? | No | Three must stay regardless; the cleanup would be half a cleanup |
| A gate against regression? | Yes — `readonly` on the graph node plus a `cli/tests` check | The prototype run scores exactly the two real defects and zero false positives against the current tree |
| Does the `Quality Gates` / `Validation Gates` drift enter this plan? | Yes | Same step, same file, one line. The command is alone and wrong; validators compare exact text |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A read-only agent can no longer silently decline a write on Claude | Every `readonly: true` agent gets Write/Edit/NotebookEdit denied on Claude — if any of them relied on an undeclared write, it now fails hard |
| The dispatch-capability mismatch fails the test suite instead of the user's run | The gate is a bounded text heuristic over dispatch blocks, not a semantic check; it catches the `Output: <path>.md` shape and nothing subtler |
| `tasks.md` and `past-features.md` are written by the step that owns them | Both documents pass through the coordinator's context |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| F6 lands before the dispatch sites and `/add.plan` starts failing hard at STEP 3 and 10.4 | High if the order slips | Execution Order puts F1–F5 ahead of F6–F7, and the boundary after F5 is called out as a working state |
| Another `readonly: true` agent relied on an undeclared write and now gets denied on Claude | Low | L1 asserts the built header of every read-only agent; the twelve product read-only agents are enumerated and none declares a write dispatch outside `add.plan` (swept across `commands/`, `skills/`, `fragments/`, `plugins/`) |
| The gate's 8-line window misses a dispatch whose `Output:` sits further down | Medium | L2 asserts the two known defects are RED against the pre-F1 tree; the window is stated in F8 so a future site knows the shape it must not take |
| The gate false-positives on a stdout `Output:` mentioning a `.md` filename | Low | F8 pins the value shape to a leading backticked `.md` token. The looser form was run against the current tree and hit `add.plan.md:635`; the tightened form scores exactly 2 |
| `readonly` on the node changes a shape some consumer asserts | Low | L1 runs the existing `build-artefact-graph.test.js` and `mcp-engine.test.js` — the latter asserts `graph.js` and `mcp/` answer identically over the same sidecar |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F1 (STEP 3), F2 (10.4), F3 (line 611), F4 (10.5) |
| `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md` | product | modify | F5 — prompt template `## OUTPUT` |
| `scripts/build.js` | internal | modify | F6 (`AGENT_DIALECTS.claude`), F7 (`collectNodes` + agent push sites) |
| `cli/tests/agent-capability.test.js` | product | create | F8 — both gate assertions |
| `framwork/.codeadd/artefact-graph.json` | — | regenerated | F7 changes the agent node shape; sidecar is gitignored and emitted by the build |
| `framwork/.claude/agents/*.md` (and the other provider mirrors) | — | regenerated | F6 changes the Claude header for every `readonly: true` agent |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — Build-side unit (RED → GREEN)

1. After `node scripts/build.js`, every `framwork/.claude/agents/<name>.md` whose source declares
   `readonly: true` carries a `disallowedTools:` line. *RED today: `architecture-agent.md`,
   `discovery-agent.md` and `reviewer-agent.md` build with no such line.*
2. An agent whose source declares its own `disallowedTools` builds with **that exact value** —
   assert `feature-history-agent` keeps `Write, Edit, NotebookEdit, Bash, Grep` and
   `git-history-agent` keeps `Write, Edit, NotebookEdit, Glob, Grep`. *RED today: the branch that
   could overwrite them does not exist yet, so this pins F6's precedence before F6 is written.*
3. An agent with no `readonly` in its source builds with **no** `disallowedTools` line it did not
   declare — assert `backend-agent` and `frontend-agent`. *RED today: same reason as 2.*
4. `artefact-graph.json`: every node with `kind: "agent"` carries a boolean `readonly`.
   *RED today: the field is absent.*
5. `artefact-graph.json`: `product/agent/architecture-agent` and `product/agent/discovery-agent`
   have `readonly: true`; `product/agent/backend-agent` has `readonly: false`. *RED today: absent.*
6. `node scripts/build.js` exits 0 and emits no warning it does not emit today.
7. The existing `cli/tests/build-artefact-graph.test.js` and `cli/tests/mcp-engine.test.js` still
   pass — the node-shape change must not split the two graph interfaces.

### L2 — Dispatch-capability gate (RED → GREEN)

1. Walking every `DISPATCHES` edge into a `readonly` agent node and scanning each dispatch block
   (the lines after a line naming `@<agent>`, up to 8 lines or the next markdown heading), **no**
   `Output:` bullet opens with a backticked token ending in `.md`. *RED today: exactly two hits —
   `add.plan.md:607` (`@architecture-agent` → `${PLAN_DIR}/tasks.md`) and `add.plan.md:141`
   (`@discovery-agent` → `docs/features/${FEATURE_ID}/past-features.md`). Both verified by running
   the check against the pre-F1 tree.*
2. On failure the message prints source path, line number, agent name and the offending line
   verbatim — assert against a fixture, not against the live tree, so the test keeps its teeth once
   the tree is green.
3. The looser `.*\.md` form is **not** what ships: assert the check does not flag
   `add.plan.md:635`, whose `Output:` is a stdout summary mentioning `plan.md`.

### L3 — Document conformance

1. `add.plan.md` STEP 3, 10.4 and 10.5 each state, in words, that the coordinator writes the file
   and the dispatched agent does not.
2. `add.plan.md` contains no `## Quality Gates`; the `tasks.md` heading list it requires matches
   `add-tasks-checklist`'s Canonical Structure heading-for-heading, `## Validation Gates` included,
   and carries its conditional. `add-tasks-checklist:301`'s backwards-compatibility note is still
   present — it serves readers of files already on disk, and F3 removes its last writer, not the note.
3. `add-tasks-checklist`'s Architect Subagent Prompt Template `## OUTPUT` instructs the agent to
   return the document and write no file.
4. `node scripts/graph.js impact add.plan --depth 1` still reports its 20 dependants and
   `architecture-agent` its 7 — the edits change wording and must not drop a declared relationship.

### L4 — Behavioural acceptance

1. A `/add.plan` run reaching STEP 10.4 on Claude produces `${PLAN_DIR}/tasks.md` on disk, written
   by the coordinator, with the six canonical headings in order.
2. A `/add.plan` run reaching STEP 3 with no `past-features.md` cache produces that file on disk.
3. Regression shape: reintroducing a file `Output:` into the STEP 10.4 dispatch block makes
   `cli/tests/agent-capability.test.js` fail — the build must demonstrate this, not assume it.

**RED expectations against the current tree:** L1.1, L1.4, L1.5 and L2.1 fail today; L1.2 and L1.3
pin behaviour F6 has not written yet; L3 fails on every item.
**GREEN = all levels pass after F1–F8.**

---

## Execution Order

```
F1 → F2 → F3 → F4 → F5  →  [working state]  →  F7 → F6  →  F8
   ────── Stage 1 ──────                    ── Stage 2 ──   Stage 3
```

- **F1 first** because it produces the phrasing F2 consumes, and the two dispatch sites should read
  the same way.
- **F3 and F4 after F2** because all three edit STEP 10, and one commit per F-block reads more
  cleanly when they land in document order.
- **F5 after F2** because the skill's template and the command's dispatch block describe the same
  handoff; changing the command first makes the skill edit obvious.
- **F7 before F6** so the graph node carries `readonly` before F8 needs to read it, and so the two
  `build.js` commits stay separable — F7 is additive to the sidecar, F6 changes emitted headers.
- **F8 last** because both its assertions consume outputs F6 and F7 produce.

**Working states:** the tree is releasable after **F5** (every dispatch site corrected, build
unchanged) and after **F8** (latch and gate in place). The boundary after F5 is the one that
matters: stopping between F5 and F6 leaves the reported bug fixed and nothing tightened.

**Per-F-block validation beyond the layer default:** F6 and F7 each run
`node scripts/build.js` plus `cli/tests/build.test.js`, `cli/tests/build-artefact-graph.test.js` and
`cli/tests/mcp-engine.test.js` before their commit — a node-shape or dialect change that splits the
two graph interfaces must surface at its own F-block, not at F8.

## Reviewer Handoff

The review command must be able to audit this without re-reading anything else. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the section above it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves
   nothing. L2.1 in particular: its RED state is two specific line numbers, and those lines are
   edited by F1 and F2, so the RED run must be recorded **before** F1 lands.
2. F6 landing without F1–F5 — check the commit order, not just the final tree. A tree where all
   eight are present hides an intermediate state in which `/add.plan` was hard-broken.
3. The gate silently weakened to pass — if `agent-capability.test.js` ships with the loose
   `.*\.md` form, L2.3 must be the thing that fails. Confirm L2.3 exists and is not skipped.
4. An F-block that dropped a "Must NOT lose" item while rewording — each one names specific rules
   (the six sub-bullets, the character-for-character check, the three in-place checks, the verbatim
   frontmatter passthrough). Diff against them by name.
5. `disallowedTools` precedence inverted — F6 must let a source declaration win. If
   `feature-history-agent` or `git-history-agent` builds with the default three instead of its own
   five, the fix silently widened those agents' capability.

---

## Next Steps

/add-framework--build readonly-agent-dispatch-capability

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-13 | Initial creation |
| 2026-09-13 | Implemented in commits c4322db..c3effd8 (14 F-blocks: F1-F8 planned, F9-F14 from the STEP 7 review). Status draft -> implemented |
| 2026-09-13 | Review fixes: read-only agent count corrected to twelve and `reviewer-agent` named as the third undeclared one (Context, Problem 3, Does NOT Include, Risks, L1.1); `add.hotfix` dropped from the read-only citation and `add.diagnose:173` scoped to `@architecture-agent` (Does NOT Include); F3 and L3.2 record that `add.plan.md:611` is the last writer of `## Quality Gates` and that `add-tasks-checklist:301`'s note stays. Reviewer nit N1 (line 635 → 636) rejected — `grep -n` puts the stdout `Output:` line at 635 |

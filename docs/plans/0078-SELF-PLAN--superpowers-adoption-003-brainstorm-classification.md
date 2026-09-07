# Plan: Brainstorm Path Classification — internal layer

> **Status:** implemented
> **Scope:** command (1 canonical + 1 OpenCode adapter)
> **Created:** 2026-09-07

---

## Context

Internal twin of `0078-PLAN--superpowers-adoption-003-brainstorm-classification`. Design doc:
`docs/brainstorming/2026-09-07T005046-superpowers-adoption-003-brainstorm-classification.md`.

The internal command is a harder case than the product one, because it **already classifies** — on a
different axis, and in secret.

## Current State

`add-framework--shared-brainstorm.md` runs eight steps. Two of them already sort the request:

- **`### 2.2 Classification`** sorts by *type* (command / skill / script / workflow / product /
  architecture), *scope* (simple / complex) and *framework impact* (affects existing artefacts, or additive).
  It then states: **"Do NOT reveal classification explicitly yet."**
- **`### 3.1 Detect Scope`** sizes the same request again as umbrella-worthy or not, and `### 3.2` offers a
  decomposition when it is.

Neither answers *how much process this request needs*. Both paths end in a design document, a
`@plan-review-agent` dispatch (STEP 6) and a `[HARD STOP]` handoff (STEP 7).

**`### 4.1` is already credited** as *"Conversational Exploration (Adapted from superpowers:brainstorming)"* —
the exploration technique was ported at some point; the path classification was not.

## Proposed Changes

### S1 — The effort classification, announced

1. **`.claude/commands/add-framework--shared-brainstorm.md`, `### 2.2`**: add the effort classification —
   **spike**, **bounded**, **architectural** — alongside the existing type / scope / impact sizing.
   **The existing sizing is not removed.** It answers *which artefacts and how many topics*, feeds STEP 3's
   decomposition offer, and would leave STEP 3 with no input if deleted. The two classifications are asked at
   the same step and answer different questions; the section says so explicitly, so a future reader does not
   collapse them.
2. **Same section**: `"Do NOT reveal classification explicitly yet"` is **deleted and replaced**. The effort
   path is announced in one line, in its own turn, and the user may override it. The type/scope/impact
   sizing may stay internal — it is an implementation detail of STEP 3, not a decision the user needs to
   correct.
3. **Same file**: **bounded measures the repository, not familiarity.** In this command that has a concrete
   test — a change to a command, skill, agent or script **that already exists** is bounded; a new artefact of
   any kind is architectural, because there is no existing flow to read and modify.

### S2 — Path routing

4. **Same file**: **spike** — present the question and the probe in 2-3 sentences, get a nod, investigate
   (the `@framework-discovery-agent` dispatch at `### 1.2` is exactly the right probe tool and stays
   available), report a recommendation. STEPS 5 and 6 are skipped; nothing is written to
   `docs/brainstorming/`.
5. **Same file**: **bounded** — the clarifying questions that matter, then a short design **in chat**:
   which artefacts change, what changes in each, and how it is proved. STEPS 5 and 6 skipped.
6. **Same file**: **architectural** — STEPS 3 through 7 exactly as today, including the decomposition offer,
   the design document and the `@plan-review-agent` dispatch.
7. **Same file**: **STEP 7's `[HARD STOP]` handoff runs on all three paths.** A spike that found a real
   problem still routes to `/add-framework--plan` or `/add-framework--self-plan`; a bounded design still
   routes to one of them. What changes is whether a document precedes the suggestion.

### S3 — The rules and the credit

8. **Same file**: the **one-way ratchet** — hidden complexity discovered mid-conversation upgrades the path;
   nothing downgrades; a spike's answer is not permission to build.
9. **Same file**: the **approval gate never scales** — every path ends with the user approving the intent.
   What scales with simplicity is the artifact, never the approval.
10. **Same file**: a **red-flags table** naming the rationalisations — "too simple to need a design",
    "I'll call it bounded and skip the spec", "I know this codebase so it's bounded", "the spike worked so
    I'll keep it", "it grew but I'm almost done" — each with the reality that answers it.
11. **Same file**: a second MIT credit line for the path classification, beside the one `### 4.1` already
    carries.

### S4 — The adapter

12. **`.opencode/commands/add-framework--shared-brainstorm.md`** takes every edit above.

## Impact

| Artefact | Action | Reason |
|----------|--------|--------|
| `.claude/commands/add-framework--shared-brainstorm.md` | modify | S1, S2, S3 |
| `.opencode/commands/add-framework--shared-brainstorm.md` | modify | S4 |

**Not touched:** `### 1.2`'s discovery-agent dispatch, `### 3.1`/`### 3.2`'s decomposition, `### 4.1`'s
exploration technique and question loop, STEP 5's document schema, STEP 6's `@plan-review-agent` verdict
handling, STEP 7's hard stop, and STEP 8's Continue Mode. Nothing else in the repo.

## Execution Order

`S1 → S2 → S3 → S4`.

1. **S1 before S2** because the routing switches on a classification that must already exist and be
   announced.
2. **S3 lands with S2, not after it.** The ratchet stated without the table is the rule most easily talked
   around, and the routing without the ratchet has no rule for a conversation that grows.
3. **S4 last, in one pass.** `.opencode/` is not built by `scripts/build.js`, so mirroring a file that is
   still changing produces drift no gate catches.

**Verification, per step:**

- After S1: `grep -c 'Do NOT reveal classification' .claude/` returns 0; `### 2.2` names both classifications
  and states that they answer different questions; the type/scope/impact sizing still feeds `### 3.1`.
- After S2: three dogfood runs. A feasibility question announces **spike** and writes no document. A request
  for a brand-new agent announces **architectural**, not bounded. A request to add a step to an existing
  command announces **bounded**, presents a short design in chat, and stops.
- After S3: the ratchet, the approval rule, the table and both credit lines are present; a bounded
  conversation that turns out to need a new artefact upgrades mid-run.
- After S4: `diff` the adapter against its twin; the only differences are the frontmatter-dialect ones that
  existed before this plan.

**Safe stopping points:** none. Four steps against one file, and a command that classifies without routing
announces a decision it then ignores — worse than not classifying. Land S1-S3 together; S4 may lag by one
commit, visibly.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Does the existing type/scope/impact classification survive? | Yes, alongside | It answers "which artefacts, how many topics" and feeds STEP 3's decomposition; deleting it would leave that step with no input |
| Is the effort path announced? | Yes, in its own turn | A classification the user cannot see is one they cannot correct — and in this command they are the one who knows whether the artefact already exists |
| Is the type/scope/impact sizing announced too? | No | It is an implementation detail of STEP 3, not a decision the user needs to correct. Only the effort path is announced |
| What makes a request bounded here? | An artefact that already exists | A new command, skill, agent or script has no existing flow to read and modify, so it is architectural whatever its size |
| Does STEP 7's hard stop run on all paths? | Yes | A spike that found a real problem still needs somewhere to go |
| Do we port the visual companion? | No | It depends on a local server the framework does not ship |

---

## Next Steps

/add-framework--self-build 0078-SELF-PLAN--superpowers-adoption-003-brainstorm-classification

This is the last plan of set 0078. After it, the first plan written under the **new** naming convention
(`YYYY-MM-DDTHHMMSS-PLAN--<slug>.md`, introduced by the `001` pair) begins.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-07 | Initial creation |
| 2026-09-07 | Implemented in `26a746b` on branch `feat/superpowers-adoption` (PR #34) |

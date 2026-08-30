# Plan: Pre-delivery plan-reviewer agent for add.new / add.brainstorm / add.plan

> **Status:** draft
> **Type:** agent + skill + command
> **Created:** 2026-08-23
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Product commands that produce the feature contract (`about.md`, brainstorm, `plan.md`) must not declare the document delivered until an independent reviewer has tried to break it. `add.new` and `add.brainstorm` already run `@doc-reviewer-agent` (Gap / Clarity / Scope questions, no proposed fix). `add.plan` stops at the `feature-plan` schema gate and hands off.

`@doc-reviewer-agent` and `@reviewer-agent` are the wrong tools for this job: the first is a schema-lens stakeholder questionnaire; the second is post-implementation code review (OWASP / architecture / RF-RN vs files). The needed reviewer is a **fresh-context executability critic** that returns a verdict and required fixes. That agent must live in `framwork/.codeadd/agents/` so it ships to consumers.

The internal `@plan-review-agent` (`.claude/` / `.opencode/`) is a cousin, not a source to copy. Different layer, different schemas, not distributed.

## Problem

1. `add.plan` delivers `plan.md` after STEP 12 (`feature-plan` gate) with no independent read. A builder can inherit hidden assumptions, contradictions, and missing decisions.
2. `add.new` / `add.brainstorm` already review, but with a rubric that asks questions and forbids proposing the fix — the opposite of “fix the plan before delivery”.
3. Reusing `@reviewer-agent` at this phase reviews code that does not exist yet.

## Proposal

Create a product **skill + leaf agent** pair and wire it as the single pre-delivery reviewer on the three generator commands.

1. **Skill `add-plan-review`** — rubric, verdict contract, kind-specific extras, fallback procedure. Commands and the agent share one source.
2. **Agent `plan-reviewer-agent`** — read-only, fresh context, preloads the skill. Does not see the originating conversation. Does not edit files.
3. **Command loops** — after the schema gate, before completion: dispatch → apply non-inventing fixes → re-gate → re-review once. `blocked` stops for the user.

`@doc-reviewer-agent` stays in the product for other schema-bound docs and manual use. These three commands stop dispatching it.

## Scope

### Includes

- `framwork/.codeadd/skills/add-plan-review/SKILL.md` (new)
- `framwork/.codeadd/agents/plan-reviewer-agent.md` (new)
- `framwork/provider-map.json` — register skill + agent
- `framwork/.codeadd/commands/add.plan.md` — insert `## STEP 13: Plan Review` after STEP 12; renumber Completion to STEP 14; update STEPS IN ORDER; retarget every in-file “STEP 13 completion” pointer (including the QA axis self-check at ~line 503) to STEP 14; add GATES row (`blocked` or remaining blockers after the one re-dispatch → STOP, do not complete); add `{{skill:add-plan-review/SKILL.md}}` to Required Skills and Quick Skill Reference; only `plan.md`; `kind: feature-plan`
- `framwork/.codeadd/commands/add.new.md` — replace the entire STEP 8 body (dispatch, three-bucket present/resolve, informational-after-2-rounds) with the Command loop; swap STEP 1 skill load (`add-doc-reviewer` → `add-plan-review`); add inline fallback; after the one re-dispatch, complete unless `blocked` or blockers remain (leftover attention does not block); `kind: feature-about`
- `framwork/.codeadd/commands/add.brainstorm.md` — replace STEP 5; point fallback at `add-plan-review` (not `add-doc-reviewer`); drop “Non-Blocking” wording; do not run STEP 6 on `blocked` or remaining blockers; leftover attention does not block; `kind: brainstorm`
- `framwork/.codeadd/skills/add-ecosystem/SKILL.md` — agent, skill, command skill rows, dependency index, `doc-reviewer` “Dispatched by”
- `framwork/.codeadd/skills/add-doc-reviewer/SKILL.md` — When to Use no longer claims `add.new` / `add.brainstorm` as primary callers
- `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` — replace only the Validation Gate Block parenthetical with: “fresh-reader review via `add-plan-review` (`add.new` / `add.brainstorm` / `add.plan`) or `add-doc-reviewer` (other generators)”. Leave the fenced gate block untouched.
- `node scripts/build.js` after the source edits (provider dirs + sidecar)

### Does NOT Include (important!)

- Porting or duplicating internal `@plan-review-agent` into `.codeadd/`
- Cold-read of `design.md` or `tasks.md` (8.1 already has `@ux-agent` critique + `feature-design` gate)
- Changing `add.review`, `@reviewer-agent`, or `add-code-review`
- Deprecating `@doc-reviewer-agent` / `add-doc-reviewer`
- Wiring `add.hotfix`, `add.diagnose`, `add.audit`, `add.design`
- New slash command `/add.doc-review`
- Tests that execute the LLM reviewer (no harness for that)

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New product agent vs reuse | **Create** `plan-reviewer-agent` in `framwork/.codeadd/agents/` | Job is executability + required fix, not Gap/Clarity/Scope and not code review |
| Reuse `@doc-reviewer-agent` | **No** on these three commands | Wrong rubric; asking without proposing a fix does not close the plan |
| Reuse `@reviewer-agent` | **No** | Code / OWASP / RF-RN vs implementation. No code at this phase |
| Skill or agent-only | **Skill + agent** | Three commands + no-`agentDispatch` fallback need one rubric source |
| Which docs | `about.md` / brainstorm / `plan.md` only | User scoped the three commands; `design.md` already has a different reviewer |
| `add.plan` placement | After STEP 12 schema gate, before completion | Schema first (structure), then fresh-reader (executability). Order already stated in `add-doc-schemas` |
| Double review | **Replace** `doc-reviewer` dispatch on the three commands | Two reviewers on the same doc is token waste and conflicting instructions |
| Resolution loop | Verdict `ok` → deliver. `fix-then-ok` → apply Required fixes that do not invent a user decision, re-run schema gate, re-dispatch **once**. Remaining blockers → STOP for user. `blocked` → STOP. Nits never block | Same pressure as “always review before delivery” without an unbounded loop |
| Providers without agents | **Inline fallback** via `add-plan-review` (forget the conversation) | Agents currently ship only to providers with an `agents` pattern (Claude). Without fallback the step is a silent no-op on Codex / Cursor / OpenCode / Antigrav installs |
| Internal agent | Do not copy the file | Different layer and schemas; share the *job*, not the artefact |
| Plugin marker on the new agent | **None** | Same exclusion as `doc-reviewer-agent` — not a code-graph agent |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| `plan.md` cannot ship unreviewed | +1–2 agent turns at the end of an already long `add.plan` |
| One rubric for the three generators | `add.new` / `add.brainstorm` lose the Gap/Clarity/Scope questionnaire on the happy path |
| Fallback works where agents do not ship | Inline fallback is weaker isolation than a real subagent |
| `doc-reviewer` remains for other docs | Two doc-review species in the product; authors must pick the right one |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| New agent clones `doc-reviewer` under another name | Medium | Skill MUST ban “ask, do not propose” and MUST require verdict + Required fix + evidence. Manual check during `/add-framework--build` — not a `scripts/build.js` gate |
| `add.plan` latency / token spike | High | One target file (`plan.md`), cap 2 rounds, no re-open of STEPs 8–11 |
| Fallback “forgets” conversation poorly | Medium | Skill states the forget rule; command forbids reading chat to answer findings |
| Name clash with internal `plan-review-agent` | Low | Product name is `plan-reviewer-agent`. Ecosystem row states the distinction |
| Coordinator invents scope to clear `blocked` | Medium | Command prohibition: only apply fixes that do not invent a user decision; `Do not change` list is binding |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `add-plan-review` | create |
| `plan-reviewer-agent` | create; register in `provider-map.json` |
| `add.plan` | new STEP; load skill; dispatch + fallback + gate |
| `add.new` | replace STEP 8; add fallback |
| `add.brainstorm` | replace STEP 5; rename so review is mandatory before STEP 6 |
| `add-ecosystem` | update command / skill / agent / dependency tables |
| `add-doc-reviewer` | retarget When to Use |
| `doc-reviewer-agent` | none (description may still mention plans; do not treat as a caller) |
| `add.review` / `reviewer-agent` | none |
| `add-doc-schemas` | keep the gate as the previous STEP; replace only the parenthetical with “fresh-reader review via `add-plan-review` (`add.new` / `add.brainstorm` / `add.plan`) or `add-doc-reviewer` (other generators)”. Leave the fenced gate block untouched |

## Agent and skill contract (for `/add-framework--build`)

### Skill `add-plan-review`

- When to Use / When NOT to Use: NOT for code (`add-code-review`), NOT for schema compliance (`add-doc-schemas` gate), NOT a replacement for `@ux-agent` critique.
- Input: `path`, `kind` ∈ `feature-about` \| `brainstorm` \| `feature-plan`.
- Dimensions (all mandatory): scope, hidden assumptions, contradictions, dependencies, executability, testability, risks, gold-plating.
- Severity: `blocker` \| `attention` \| `nit`.
- Verdict (first match): user-decision blocker → `blocked`; fixable blocker/attention → `fix-then-ok`; else `ok` (nits only = `ok`).
- Output: Plan Review Report (verdict, Blockers / Attention / Nits tables with evidence + Required fix, Do not change). Empty tables = `None.`
- Caps: 8 blockers, 8 attention, 5 nits.
- ALWAYS cite evidence. NEVER edit files. NEVER invent scope.

Kind extras:

- `feature-about`: next command (`add.plan` / `add.build`) can proceed without guessing Problem, Users, Scope, or Success Metrics. Check RF/RN only when those sections appear in the doc.
- `brainstorm`: next command (`add.new` vs diagnose/hotfix) unambiguous; implicit open questions are blockers (explicit Open Threads are not).
- `feature-plan`: a builder can implement without inventing paths, contracts, or tasks. Architecture Decisions vs Tasks vs Validation must not contradict. Paths and acceptance signals must be findable in `plan.md` (Tasks bullets and/or JSON) — do not require a path/dep JSON object. Do not read `about.md`, `tasks.md`, or `design.md`.

### Agent `plan-reviewer-agent`

```
name: plan-reviewer-agent
model: sonnet
disallowedTools: Write, Edit, NotebookEdit, Bash
skills: [add-plan-review, add-doc-schemas]
memory: project
```

- Read only: the target doc, the skill, and — after resolving via the Schema Index — `{{skill:add-doc-schemas/references/new-feature.md}}` for the matching H3 (expected sections, not a second gate). No other category file.
- Do not open application source. Do not reconstruct the parent conversation.
- Leaf. No plugin injection marker.
- Description must say when to use (after those three commands write a doc, before delivery) and that it is not `@doc-reviewer-agent` / `@reviewer-agent`.

### Command loop (same shape, three files)

1. Schema gate PASS.
2. Do not present path / next-step as delivered.
3. DISPATCH `@plan-reviewer-agent` with path + kind. Fallback: apply the skill inline, forget the conversation.
4. Act on verdict as in Validated Decisions. After the one re-dispatch, complete unless `blocked` or blockers remain; leftover attention does not block.
5. After an applied fix: re-run **that doc’s** schema gate before re-review.
6. Keep each command’s existing Completion summary; append path, verdict, and one-line applied fixes.

`add.plan` only: do not re-dispatch UX/area subagents to satisfy a finding.

## References

- `framwork/.codeadd/agents/doc-reviewer-agent.md` — species to stay distinct from
- `framwork/.codeadd/agents/reviewer-agent.md` — code review; do not call
- `framwork/.codeadd/skills/add-doc-reviewer/SKILL.md`
- `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` — gate-before-fresh-reader order
- `framwork/.codeadd/commands/add.new.md` STEP 8 / `add.brainstorm.md` STEP 5 — loops to replace
- `framwork/.codeadd/commands/add.plan.md` STEP 12–13
- Internal `@plan-review-agent` — job inspiration only

---

## Next Steps

/add-framework--build 0069-PLAN--pre-delivery-plan-reviewer-agent

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-23 | Initial creation |
| 2026-08-23 | Pre-delivery review: B1 kind extras stay on `plan.md` headings; A1 named STEP/skill edits; A2 schema H3 path; A3 RF/RN only if present; A4 retarget `add-doc-schemas` parenthetical |
| 2026-08-23 | Pre-delivery review pass 2: unify terminal rule (attention does not block); replace full `add.new` STEP 8; retarget STEP 13 pointers; shared parenthetical; keep Completion bodies; path/acceptance findable without requiring JSON |

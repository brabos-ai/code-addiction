---
description: Audits an ADD plan against implementation using parallel subagents.
---

# ADD Shared-Review — Plan-vs-Implementation Auditor

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **INPUT:** $ARGUMENTS

Audits an existing plan in `docs/plans/` against actual repository state via 4 parallel read-only subagents. Produces a versioned review file alongside the plan. Used for both framework plans (`NNNN-PLAN--slug`) and self plans (`NNNN-SELF-PLAN--slug`).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Load plan + detect prior reviews   → parse plan, determine next vNN
STEP 2: Dispatch 4 audit subagents         → parallel, read-only, wait-all
STEP 3: Aggregate + verdict                → synthesize PASS | GAPS_FOUND | BLOCKED
STEP 4: Write review file                  → docs/plans/...--review-vNN.md
STEP 5: Completion                         → [HARD STOP] no fixes applied

**⛔ ABSOLUTE PROHIBITIONS:**

IF PLAN ARGUMENT MISSING OR PLAN FILE NOT FOUND:
  ⛔ DO NOT USE: Write on any file
  ⛔ DO NOT: Dispatch subagents
  ⛔ DO NOT: Guess which plan the user means
  ✅ DO: List available plans in `docs/plans/` and STOP

ALWAYS (this command is READ-ONLY for the codebase):
  ⛔ DO NOT USE: Edit on source code, commands, skills, agents, scripts
  ⛔ DO NOT USE: Write outside `docs/plans/` (review file is the only output)
  ⛔ DO NOT: Apply fixes for findings — review reports, it does not repair
  ⛔ DO NOT: Create branches, commits, or PRs
  ⛔ DO NOT: Run `node scripts/build.js` or any mutating command
  ⛔ DO NOT: Re-dispatch subagents to "double-check" — one parallel pass per invocation

---

## Operation Mode

```
/add-framework--shared-review NNNN                       → audit by plan number
/add-framework--shared-review NNNN-PLAN--slug            → audit by full slug
/add-framework--shared-review NNNN-SELF-PLAN--slug       → audit a self-plan
```

Re-invocation creates `--review-v02`, `--review-v03`, etc. Old reviews are never overwritten.

---

## STEP 1: Load Plan + Detect Prior Reviews

### 1.1 Resolve Plan File

Given the argument:
- If it matches `^\d{4}$` → glob `docs/plans/NNNN-*PLAN--*.md` (both PLAN and SELF-PLAN). If multiple match, STOP and list candidates.
- If it contains `-PLAN--` or `-SELF-PLAN--` → treat as full slug; locate exact file at `docs/plans/<arg>.md`.
- Otherwise (or if not found) → list available plans in `docs/plans/` and STOP.

### 1.2 Parse Plan Content

Read the plan file. Extract:
- **Frontmatter** — status, type, created
- **Scope** — Includes / Does NOT Include
- **Validated Decisions** — every row
- **Ecosystem Impact** — every row (these are the deliverables to check)
- **Plan Changelog** — last entry's date (and commit hash if recorded)

Capture the last changelog date/hash as `PLAN_AUDITED_AT` for the review frontmatter.

### 1.3 Detect Prior Review Versions

List existing files matching `<plan-basename>--review-v*.md` in `docs/plans/`. Determine next `vNN`:
- No prior reviews → `v01`
- Highest existing is `vNN` → next is `v(NN+1)`, zero-padded to 2 digits

---

## STEP 2: Dispatch 4 Audit Subagents

Each subagent receives the full plan content plus a scoped instruction. All four MUST run in parallel.

**DISPATCH 4 AGENTS IN PARALLEL:**

1. **Plan Conformance Auditor**
   - **Capability:** read-only (Glob, Grep, Read, Bash for `git log` / `git diff` / file inspection only — no Edit, no Write)
   - **Complexity:** standard
   - **Prompt:** "Audit every decision and scope item in this plan against the current repository. For each item: state whether it is implemented (cite file:line), partially implemented, or missing. Flag drift where the implementation differs from the decision. Output: structured findings table with severity (high/medium/low), file:line evidence, and verdict per item."

2. **Diff Completeness Auditor**
   - **Capability:** read-only
   - **Complexity:** standard
   - **Prompt:** "Walk `git diff` from the plan's creation date (or last changelog date) to HEAD file by file. For each modified file: confirm the change is accounted for by a plan decision. Flag files changed that are NOT in the plan's scope, AND plan-scope items with no corresponding diff. Output: per-file table (path, plan-scoped Y/N, change summary, gap)."

3. **Side-Effect Detector**
   - **Capability:** read-only
   - **Complexity:** standard
   - **Prompt:** "Scan untouched areas of the repo for regressions caused by the plan's changes. Focus on: cross-references that now point to renamed/removed artefacts, callers of modified functions, doc references to deprecated paths, and integration points between layers. Output: regression candidates with file:line and reasoning."

4. **Quality / Style Auditor**
   - **Capability:** read-only
   - **Complexity:** standard
   - **Prompt:** "Code-review the implementation against `.opencode/skills/building-commands/SKILL.md` patterns (for commands/skills) and general project conventions visible in neighboring files. Critique naming, structure, gate design, and prohibition format. Output: findings list with file:line, principle violated, suggested correction."

**WAIT-ALL** before proceeding to STEP 3.

⛔ DO NOT proceed past STEP 2 until all 4 subagent outputs are received.

### Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only here, in all 4 cases)
2. Read the **Complexity** hint (`standard` for all 4 subagents)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. Dispatch all 4 simultaneously (parallel mode)
5. Pass the plan file content as part of each prompt
6. Verify all 4 outputs received before proceeding past WAIT-ALL

You are the coordinator. You know your engine's capabilities. Map the intent (capability + complexity) to the best available mechanism.

---

## STEP 3: Aggregate + Determine Verdict

### 3.1 Aggregate Findings

Combine all 4 subagent reports into a single findings list. Deduplicate (same file:line + same issue from multiple agents → one entry, sources merged).

### 3.2 Classify by Severity

| Severity | Criteria |
|----------|----------|
| **high** | Plan decision unimplemented OR regression detected OR drift contradicting validated decision |
| **medium** | Partial implementation, missing edge case, style/structure violation impacting maintainability |
| **low** | Cosmetic, doc nit, naming preference |

### 3.3 Determine Verdict

Evaluate in this **strict precedence order** (first match wins) — buckets are otherwise non-disjoint:

| Order | Verdict | Trigger |
|-------|---------|---------|
| 1st | **BLOCKED** | Any regression detected by Side-Effect Detector (high) OR fundamental conformance failure: ≥30% of validated decisions unimplemented OR any **critical scope item** missing |
| 2nd | **GAPS_FOUND** | One or more remaining high-severity findings (after the BLOCKED check did not match) |
| 3rd | **PASS** | Zero high-severity findings |

**Critical scope item** = any row of the plan's **Ecosystem Impact** table whose action is `create new`, `rename`, or `remove` (i.e. structural changes whose absence breaks the plan's intent). Style updates and audit-only entries are not critical.

The 30% threshold is a heuristic: count rows under **Validated Decisions** that have no evidence of implementation; if ≥30% → BLOCKED. Lower it explicitly in the review's Summary if the missing decisions are individually critical.

### 3.4 Conflict Resolution

If subagents disagree on the same item:
- Conformance + Quality disagree on whether something is implemented → trust Conformance (it checked execution evidence)
- Side-Effect flags a regression that Conformance considers in-scope → keep both: regression severity stays high, but note the in-scope context in the finding

---

## STEP 4: Write Review File

### 4.1 Compute Output Path

`docs/plans/<plan-basename>--review-v<NN>.md` where `<plan-basename>` is the plan filename without `.md` extension (e.g., `0028-PLAN--restructure-internal-commands-and-add-review--review-v01.md`).

### 4.2 Review File Structure

Write to the path computed in 4.1:

```markdown
---
review_version: NN
plan: <plan-basename>
plan_changelog_audited: YYYY-MM-DD | <hash>
reviewed_at: YYYY-MM-DDTHH:MM:SSZ
verdict: PASS | GAPS_FOUND | BLOCKED
---

# Review v<NN>: <Plan Name>

> Verdict: **<VERDICT>**
> Plan audited at changelog entry: <YYYY-MM-DD>

## Summary
<2-3 lines stating what was reviewed and the headline result>

## Findings by Severity
| Severity | Count | Topic |
|----------|-------|-------|
| high     | N     | <one-line topic>, <one-line topic> |
| medium   | N     | ... |
| low      | N     | ... |

## Plan Conformance
<subagent 1 report — preserve table/list structure>

## Diff Completeness
<subagent 2 report>

## Side-Effect Detection
<subagent 3 report>

## Quality / Style
<subagent 4 report>

## Consolidated Action List
- [ ] <actionable item with file:line>
- [ ] <actionable item with file:line>

## Re-review
After applying corrections: `/add-framework--shared-review <plan-id>`
```

---

## STEP 5: Completion [HARD STOP]

Show: review file path, verdict, top 3 findings (by severity, then by file).

⛔ DO NOT proceed to apply fixes. DO NOT edit code. DO NOT create branches.
add-framework--shared-review ends here. Remediation is the user's decision and is executed via `/add-framework--build` or `/add-framework--self-build`.

---

## Rules

ALWAYS:
- Require a plan argument — never run standalone
- Dispatch all 4 subagents in parallel, never sequential
- Verify all 4 outputs received before aggregating
- Write the review file with auto-incremented `vNN` — never overwrite a prior review
- Record `plan_changelog_audited` in frontmatter so re-reviews show what changed since
- Apply conflict-resolution rules when subagents disagree

NEVER:
- Edit, Write, or otherwise mutate any file outside the single review output
- Apply fixes for findings — verdict reports the state, it does not change it
- Re-dispatch subagents within one invocation to "verify" — one parallel pass per run
- Overwrite, merge into, or delete a prior review file
- Skip writing the review file even when verdict is PASS

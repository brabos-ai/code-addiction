# Hotfix - Rapid Bug Fix Workflow

<!-- uses:
- skill: add-doc-schemas
- skill: add-ecosystem
- skill: add-final-report
- skill: add-id-convention
- skill: add-investigation
- skill: add-knowledge-discovery
- skill: add-ux-design
- agent: architecture-agent
- agent: conformance-agent
- agent: failure-analysis-agent
- agent: feature-history-agent
- agent: git-history-agent
- agent: security-agent
- command: /add.wiki
- script: delivered.sh
- script: status.sh
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).
> **ARCHITECTURE REFERENCE:** Use `CLAUDE.md` as source of patterns.
> **ID FORMAT:** Global sequential with type suffix (e.g., `0001H`, `0002H`)
> **STRUCTURE:** Docs in `docs/features/[NNNN]H-[slug]/`; relationships live in the `about.md` `## Relations` section

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1:  Run status.sh             → FIRST COMMAND
STEP 2:  Check branch              → IF main: STOP (step 3 required)
STEP 3:  Allocate ID + branch      → status.sh next-id H, branch, skeleton about.md
STEP 4:  Discover history (index + parallel agents) → delivery index (--no-verify) → @feature-history-agent ∥ @git-history-agent
STEP 5:  Synthesize history outputs → Confirm related features; retain blast radius for STEP 9
STEP 6:  Investigate code          → ONLY AFTER steps 1-5
STEP 7:  Confirm root cause        → BEFORE implementing; pin it RED when tdd-pipeline is on
STEP 8:  Implement fix             → drive the pinned test GREEN + verify build
STEP 9:  Delivery review (parallel judges) → @security-agent ∥ @conformance-agent ∥ @failure-analysis-agent
STEP 10: Triage + corrective pass  → verify citations, ONE pass, re-verify build
STEP 11: Write hotfix about.md     → schema hotfix-about, extractive, incl. ## Relations
STEP 12: Validation gate           → run gate block on about.md
STEP 13: Log iteration             → MANDATORY BEFORE informing user
STEP 14: Completion                → Inform user, awaiting /add.done
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on .ts/.tsx/.js files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation
  ⛔ DO NOT: Implementation
  ✅ DO: STEP 3-4 (template + branch creation)

IF SCHEMA NOT LOADED:
  ⛔ DO NOT USE: Write to create hotfix docs
  ✅ DO: Load the `hotfix-about` schema from {{skill:add-doc-schemas/SKILL.md}} FIRST

IF BRANCH NOT CREATED:
  ⛔ DO NOT: Proceed to investigation
  ✅ DO: Create hotfix/[NNNN]H-[slug] branch and docs/features/[NNNN]H-[slug]/

IF HISTORY AGENTS NOT DISPATCHED:
  ⛔ DO NOT USE: Grep on code
  ⛔ DO NOT USE: Read on code
  ✅ DO: Dispatch @feature-history-agent ∥ @git-history-agent (parallel) and wait for both reports

IF ROOT CAUSE NOT CONFIRMED:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT: Implementation
  ✅ DO: Present root cause to user and WAIT for confirmation

IF FIX IMPLEMENTED AND JUDGES NOT DISPATCHED:
  ⛔ DO NOT USE: Write to create about.md
  ⛔ DO NOT: Report the hotfix complete
  ✅ DO: Dispatch STEP 9's three judges and wait for all three

IF A FINDING'S CITATION IS NOT VERIFIED:
  ⛔ DO NOT: Present it as a blocker
  ⛔ DO NOT: Correct code for it
  ✅ DO: Read the cited lines yourself first (STEP 10.1)

IF A FINDING IS pre-existing:
  ⛔ DO NOT: Treat it as a blocker
  ⛔ DO NOT USE: Edit to widen the fix and resolve it
  ✅ DO: Record it as an observation in the `## Review` section

IF ABOUT TO RECORD A RELATIONSHIP:
  ⛔ DO NOT USE: Write on any related.md path — the schema is retired
  ⛔ DO NOT: Allocate a `[NNNN]H-related` id
  ✅ DO: Write it as a `## Relations` line in the about.md, typed `caused_by`
```

⛔ **An existing `related.md` in a brownfield project is a user file and is never deleted.** This
command stops writing new ones; `codeadd update` harvests the old ones and leaves them on disk.

---

## STEP 1: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

**AFTER EXECUTION, CHECK OUTPUT:**
- `BRANCH`: Current branch (main/hotfix/feature/other)
- `RECENT_CHANGELOGS`: Last 5 completed items (identify related features)
- `WIKI:present` / `WIKI_STALE_COUNT`: Knowledge base availability (used in STEP 8.1)

---

## STEP 2: Branch Check (HARD STOP)

**Look at script output. What is the BRANCH value?**

### IF `BRANCH:main` or `BRANCH:master`:

⛔ **TOTAL STOP** - You are on main branch.

**MANDATORY ACTION:** Execute STEP 3 NOW.

### IF `BRANCH:hotfix/*`:

✅ Branch OK. Skip to STEP 4.

---

## STEP 3: Allocate Hotfix ID + Create Branch

⛔ **GATE:** Branch must be created BEFORE investigation.

### 3.1 Allocate Next Hotfix ID

```bash
bash .codeadd/scripts/status.sh next-id H
```

Output: Next global hotfix ID in the form `[NNNN]H` (e.g., `0001H`). Store for the frontmatter write in STEP 11.

> **Skill:** Apply `{{skill:add-id-convention/SKILL.md}}` for ID/branch format.

### 3.2 Create Branch

```bash
git checkout -b hotfix/[NNNN]H-[hotfix-slug]
```

**[hotfix-slug]:** kebab-case descriptive (ex: `screenshot-delete-error`, `login-timeout`)

### 3.3 Create Doc Directory

```
docs/features/[NNNN]H-<slug>/
├── about.md    (schema: hotfix-about — written in STEP 11)
└── iterations.jsonl
```

DO NOT write doc contents yet — the schema is loaded and applied in STEP 11.

**⛔ CONFIRM:** Execute `git branch --show-current` and verify you're on `hotfix/*`

---

## STEP 4: Discover History via Parallel Agents

⛔ **CRITICAL:** Dispatch BOTH agents in a SINGLE message with TWO Agent tool calls (parallel execution).

### 4.1 Consult the delivery index (NO code access)

Load the **INDEX and GRAPH steps of `{{skill:add-knowledge-discovery/SKILL.md}}` ALONE** — steps 1 and 2 of its procedure, nothing below them. That skill's own *When NOT to Use* records this exemption: the wiki stays out of STEPs 4-6, the two document-record steps do not.

**`RELATED_WORK` destination:** it joins the ranked candidate list handed to the two history agents in 4.3, and its `touched_by` result over the changed files goes into the **blast radius STEP 5.2 retains for STEP 9**. A `caused_by` edge already recorded on a past hotfix is the cheapest answer to "has this broken before" this command can get.

Query `delivered.sh` with the bug's keywords and **`--no-verify`**:

```bash
bash .codeadd/scripts/delivered.sh read "<bug keywords>" --no-verify
```

```
IF THE INDEX READ OMITS --no-verify:
  ⛔ DO NOT: Run it
  ✅ DO: Add the flag — a verifying read greps source, and this command forbids reading code before the history agents are dispatched
```

`--no-verify` is what makes this step legal here. It returns the **stored** status — whatever the last verify established, not a guess — and opens no source file, so the no-code-access prohibition above stands untouched. The verifying read happens later, at STEP 8.1, once the root cause is known and a re-query is worth its cost. That is why this command reads the index twice.

**Index absent → note it once and continue.** Nothing here blocks on it.

### 4.2 Build the symptom brief

From the user's bug report plus `RECENT_CHANGELOGS` from STEP 1, write a short brief:
- One-sentence problem statement
- Affected area / keywords (component, route, entity)
- Optional window (default: 30 days)
- **The ranked index results from 4.1**, each with its id, name and status

### 4.3 Dispatch parallel

**DISPATCH AGENT: @feature-history-agent**
Prompt: "Find existing features whose docs (about.md, changelog.md, plan.md) plausibly relate to this bug. Brief: <brief>. Candidate ids already ranked by the delivery index, each with its status: <index results, or 'none — index absent or no match'>. Start from those, then scan `docs/features/`, score relevance, deep-read top-10. Return structured Feature History Report."

⛔ The candidate list changes the agent's **starting point, never its method**. It still scans, scores and deep-reads. Do NOT tell it to skip the scan, and do NOT restrict it to the listed ids — a `gone` entry names a feature whose docs still exist and still matter.

**DISPATCH AGENT: @git-history-agent**
Prompt: "Correlate recent git history with this bug. Brief: <brief>. Window: 30 days. Use git log/show/diff/branch (read-only) to surface suspicious commits and active branches. Return structured Git History Report."

**WAIT** for both reports before proceeding to STEP 5.

---

## STEP 5: Synthesize History & Confirm Related Features

### 5.1 Combine the two reports

- **Convergent signals** — features/files mentioned by BOTH agents (highest confidence)
- **Divergent signals** — surfaced by only one (still relevant)
- **Suspicious commits** — flagged by @git-history-agent in or adjacent to those features

### 5.2 Present to user

Present the top related features (with FEAT_IDs) + the top suspicious commits and ask:
- Confirm related features (yes / no / different one)
- Acknowledge suspicious commits (any context the user can add?)

**Store the confirmed feature relationships. ONE set, TWO destinations, and neither may lose it:**

| Destination | What it does with the set | Step |
|---|---|---|
| The `about.md` `## Relations` section | Each confirmed feature becomes `- caused_by [[<id>]] — <the one-line reason>` | STEP 11 |
| The **blast radius** `@failure-analysis-agent` judges against | Confirmed features plus the suspicious commits, unchanged from how STEP 9 has always read them | STEP 9 |

Retain them as identifiers with a one-line reason each — this set is confirmed context, and re-deriving it later loses the user's acknowledgement. **STEP 9's use is unchanged by the routing added here**: the set it reads is the same set, carrying the same fields.

### 5.3 Escalate to add-investigation (if needed)

If the agents' reports do NOT converge on a clear area OR the bug is vague/multi-layer, LOAD {{skill:add-investigation/SKILL.md}} and apply Phases 2-3 over the agent outputs before STEP 6. The agents already covered Phase 1 in agent-dispatched mode.

---

## STEP 6: Investigation (ONLY AFTER STEPS 1-5)

**PREREQUISITES VERIFIED:**
- [ ] Branch `hotfix/*` active (NOT main)
- [ ] @feature-history-agent + @git-history-agent reports received
- [ ] Related features confirmed with user

**NOW you can investigate code:**

Use Grep/Read to confirm what documentation indicated:
1. Entry point (controller, component)
2. Business logic (service, handler)
3. Data layer (repository, database)

### 6.1 Escalate to add-investigation skill (when root cause unclear)

⛔ **IF the bug symptom is vague, intermittent, crosses multiple layers, or the agent reports (STEP 4) + grep/read (STEP 6) do NOT converge on a clear cause:**

LOAD {{skill:add-investigation/SKILL.md}} and apply Phases 2-3 (Pattern Analysis, Differential Diagnosis) over the agent outputs plus a code-tracing dispatch to `@architecture-agent`. Phase 1 was already executed in agent-dispatched mode by STEP 4 — DO NOT redo it.

**Why:** Hotfixes that ship without rigorous RCA tend to fix symptoms instead of causes, causing the same bug to return. The Iron Law from add-investigation applies: NO FIX WITHOUT ROOT CAUSE.

**Skip this sub-step ONLY when:** the bug has a clear error message + stack trace + obvious cause, AND the agent reports + initial code read converge on it within the first pass.

---

## STEP 7: Confirm Root Cause (BEFORE implementing)

⛔ **GATE CHECK:** DO NOT implement without user confirmation.

**Present to user:**
- **Root Cause:** 1-2 sentences explaining the cause
- **Solution:** 1-2 sentences describing the fix
- **Files:** list of files to modify

**WAIT for explicit confirmation before proceeding.**

<!-- feature:tdd-pipeline:red-gate -->
<!-- /feature:tdd-pipeline:red-gate -->

---

## STEP 8: Implement Fix

**PREREQUISITES:**
- [ ] Root cause confirmed by user
- [ ] On branch `hotfix/*`

<!-- plugin:gitnexus:graph-impact -->
<!-- /plugin:gitnexus:graph-impact -->

### 8.1 Consult Knowledge Base

Load `{{skill:add-knowledge-discovery/SKILL.md}}` and run its procedure. **If `WIKI:present` (from STEP 1 script output):** SELECT `{{addpath:wiki/conventions.md}}` + the domain page for the affected area (`{{addpath:wiki/domains/<area>.md}}`), freshness-check both. Conventions govern HOW to fix — follow them in implementation. **If wiki absent:** note "knowledge base unavailable — /add.wiki generates it" and follow existing code patterns instead.

### 8.2 Implement

**DO:**
- Fix root cause (not symptom)
- Minimal and focused changes
- Follow existing patterns
- Test locally if possible

**FRONTEND FIXES:**
If bug in frontend:
1. READ skill `add-ux-design`
2. Follow patterns (mobile-first, shadcn, Tailwind v3)

**DO NOT:**
- Refactor unrelated code
- Add features
- Over-engineer

### 8.3 Verify Build

Verify build passes for affected apps (backend, frontend, or both).

---

## STEP 9: Delivery Review (PARALLEL JUDGES)

⛔ **GATE:** Fix implemented and build verified (STEP 8.3). The judges are READ-ONLY — they report, this command applies.

### 9.1 Assemble the shared input

All three judges receive the SAME input set:
- the change under review — this branch's diff against its base, and the paths it touches
- the confirmed root cause from STEP 7
- the **blast radius** retained in STEP 5.2 — related feature IDs and suspicious commits, as identifiers plus a one-line reason each. Pass identifiers, NEVER inlined document content
- the `WIKI:` fields from STEP 1

### 9.2 Dispatch

**DISPATCH 3 AGENTS IN PARALLEL:** single message, three calls. Each is independent.

1. **@security-agent** [read-only, standard] — OWASP axis
2. **@conformance-agent** [read-only, standard] — documented-rules axis
3. **@failure-analysis-agent** [read-only, standard] — failure-mode + blast-radius axis

**WAIT-ALL before STEP 10.**

⛔ Each judge owns ONE axis and reports the axes it did not judge. There is no dedupe step in this flow — non-overlapping axes are what replaces it.
  ⛔ DO NOT instruct a judge to fix anything
  ⛔ DO NOT accept a "Files Modified" section in a judge report
  ✅ DO collect the findings and triage them yourself in STEP 10

**Soft-degrade, evaluated per dispatch INDEPENDENTLY:** if a named agent is unavailable in this engine, dispatch a generic read-only subagent with that judge's directive plus its named skill. An axis that did not run is reported as not judged — never silently dropped.

---

## STEP 10: Triage + Corrective Pass

### 10.1 Verify every citation (BEFORE presenting anything)

For each finding a judge marked blocking, READ the cited lines yourself.

| Citation check | Action |
|---|---|
| The cited `path:line` supports the claim | Keep the finding |
| The lines do not say what the finding claims | Downgrade to observation, record the mismatch |
| The path or line does not exist | Discard, record the judge and the bad citation |

⛔ This is the false-positive gate. A hallucinated citation is the most common way an agent finding is wrong, and one read catches it.

### 10.2 Partition by disposition

| Disposition | Meaning | May block? |
|---|---|---|
| `introduced` | This diff introduced it, or made it newly reachable | Yes |
| `pre-existing` | Present and equally reachable before this change | **Never.** Observation only |
| `unverifiable` | The verification method did not run — WITH the reason | No |
| `accepted` | Real, and the user decides to ship anyway | No |

⛔ DO NOT widen the fix to resolve a `pre-existing` finding. It belongs in the `## Review` section as an observation, and in the `about.md` `## Observations` section (STEP 11) when it deserves to be findable later.

### 10.3 Corrective pass (AT MOST ONE)

Correct the `introduced` findings in severity order, under STEP 8.2's constraints — root cause, minimal, existing patterns.

⛔ ONE pass. A finding that survives it is reported open, never iterated on — the bounded correction loop is `{{cmd:add.review}}` ⇄ `{{cmd:add.build}}` on the feature path, not this command.

### 10.4 Re-verify (MANDATORY when 10.3 changed any file)

1. Re-run STEP 8.3's build verification.
2. IF `tdd-pipeline` is enabled AND a RED test was written: re-run it and confirm it is still GREEN.

⛔ IF the build fails or the pinned test is no longer GREEN:
  ⛔ DO NOT proceed to STEP 11
  ⛔ DO NOT report the hotfix complete
  ✅ DO report the regression the corrective pass introduced, and STOP

A correction that breaks the build or reopens the pinned bug is the failure a single unverified pass invites.

---

## STEP 11: Write Hotfix about.md (schema: hotfix-about)

EXECUTE schema `hotfix-about` from `{{skill:add-doc-schemas/SKILL.md}}`.

**Path:** `docs/features/[NNNN]H-<slug>/about.md`

**ID:** `[NNNN]H` from STEP 3. Write per `hotfix-about` schema. Extractive only.

The `## Review` section carries STEP 10's triaged outcome — one row per finding with its axis, severity, `path:line`, cited rule and disposition. A judged hotfix whose `about.md` omits it reads as unreviewed from a fresh clone. When a judge could not run, record that there too.

### 11.1 Write `## Relations`, `## Observations` and `tags:`

The set was confirmed with the user in STEP 5.2 and has been in hand ever since. **This routes it; it confirms nothing again.**

| Source already in hand | Becomes |
|---|---|
| Each feature the user confirmed as related in STEP 5.2 | `- caused_by [[<id>]] — <the one-line reason that set carries>` |
| The trigger, the measured impact and the safeguard that missed it, from STEP 7's root cause | `- [<category>] <text>` lines under `## Observations` |
| The domains the fix touched | `tags:` — bare lowercase words |

⛔ **A `caused_by` the user never confirmed does not get written.** STEP 5.2 is where a person acknowledged the connection; inventing one here is a relationship nobody can reproduce. A hotfix whose cause resolves to no recorded work item writes `## Relations` carrying the single word `None`.

**The same set still reaches STEP 9 unchanged.** Routing it here neither consumes it nor reshapes it.

---

## STEP 12: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` on the one doc written:
`hotfix-about` — `docs/features/[NNNN]H-<slug>/about.md`

⛔ DO NOT skip. DO NOT mark the command complete until the gate returns `PASS`. Gate check 7 covers the `## Relations` lines 11.1 wrote: an unresolved target is a FAIL, not a warning.

---

## STEP 13: Log Iteration (MANDATORY — PRD0031)

**BEFORE informing user, append entry to iterations.jsonl:**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/[NNNN]H-<slug>/iterations.jsonl" "fix" "/hotfix" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**Parameters:**
- `slug`: kebab-case identifier (ex: modal-confirm-btn, null-check-user)
- `what`: Brief description max 60 chars
- `files`: Array of affected file paths

---

## STEP 14: Hotfix Complete

⛔ **DO NOT commit** - branch ready for next phase.

**LOAD `{{skill:add-final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the hotfix ID, the branch and the next phase come after it.

Fill `What was delivered` with the fix itself, and `How it works` with the root cause and why this
fix removes it rather than hiding it. `⚠️ Needs your attention` names anything the fix touched
outside the reported symptom, because a hotfix is where that hurts most.

Then, after the seven blocks, state: hotfix ID, branch, problem, root cause, solution, modified
files, build status.

**Next Phase:** Hotfix ownership ends; merging is handled by ecosystem flow. Reference skill `add-ecosystem` Main Flows section for context-aware routing.

---

## Rules

**ALWAYS:**
- Use `status.sh next-id H` to allocate hotfix ID
- Create hotfix branch and docs in `docs/features/[NNNN]H-<slug>/`
- Load the `hotfix-about` schema from add-doc-schemas before writing
- Dispatch @feature-history-agent ∥ @git-history-agent (parallel) before investigating code
- Wait for both history reports before any Grep/Read on code
- Confirm root cause with user before implementing
- Fix root cause, not symptoms
- Keep changes minimal and focused
- Run the validation gate on about.md before completing
- Log iteration entry before informing user
- Verify build passes after implementing fix
- Dispatch all three judges, however small the fix

**NEVER:**
- Investigate code while on main branch
- Inline any doc template — ALWAYS load from add-doc-schemas
- Use abstractive summarization to fit word caps
- Grep or read code before the parallel history agents return
- Implement fix without user confirming root cause
- Refactor unrelated code during hotfix
- Add new features inside a hotfix
- Commit changes before user review
- Skip the validation gate
- Write a `caused_by` relation the user did not confirm in STEP 5.2
- Soften a judge's severity to avoid a corrective pass

---

## Example Flow

```
# User: "Screenshot validation bugada!"

# STEP 1-2: status.sh → BRANCH:main → STOP
# STEP 3: status.sh next-id H → H0001
#   git checkout -b hotfix/0001H-screenshot-delete-error
#   mkdir docs/features/0001H-screenshot-delete-error/
# STEP 4: Dispatch @feature-history-agent ∥ @git-history-agent (parallel)
#   → A.1 surfaces F0036 ai-screenshot-validation; A.2 flags commit abc123 as suspicious
# STEP 5: Confirm F0036 with user; retain {F0036, abc123} as the blast radius
# STEP 6: Investigate code
# STEP 7: Confirm root cause with user
# STEP 8: (tdd-pipeline on) RED test pins the bug → implement → GREEN → verify build
# STEP 9: Dispatch @security-agent ∥ @conformance-agent ∥ @failure-analysis-agent
#   → security: none; conformance: 1 pre-existing (observation);
#     failure: 1 introduced — null path reaches F0036's caller
# STEP 10: Verify citations → 1 introduced blocker → correct → re-run build + RED test (GREEN)
# STEP 11: Write about.md via hotfix-about schema, incl. ## Review
#   11.1 ## Relations: caused_by [[0036F]] — the validation path this fix corrects
# STEP 12: Validation gate — hotfix-about
# STEP 13: Log iteration
# STEP 14: Hotfix complete → ownership transfers to ecosystem
```

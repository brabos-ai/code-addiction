# Hotfix - Rapid Bug Fix Workflow

<!-- uses:
- skill: add--doc-schemas
- skill: add--doc-schemas/references/fix.md
- skill: add--ecosystem
- skill: add--final-report
- skill: add--id-convention
- skill: add--investigation
- skill: add--knowledge-discovery
- skill: add--ux-design
- skill: add--subagent-driven-development
- skill: add--subagent-driven-development/references/dispatch-rules.md
- agent: architecture-agent
- agent: feature-history-agent
- agent: fix-agent
- agent: git-history-agent
- agent: reviewer-agent
- command: /add-diagnose
- command: /add-wiki
- mention: /add-review
- script: delivered.sh
- script: hotfix-gates.sh
- script: status.sh
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.
> **ARCHITECTURE REFERENCE:** Use `AGENTS.md` as source of patterns.
> **ID FORMAT:** Global sequential with type suffix (e.g., `0001H`, `0002H`)
> **STRUCTURE:** Docs in `docs/features/[NNNN]H-[slug]/`; relationships live in the `about.md` `## Relations` section

---

## Required Skills

Load `{{skill:add--doc-schemas/SKILL.md}}` before STEP add-hotfix.context (schemas, IDs, universal doc rules).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP add-hotfix.context:  Run status.sh             → FIRST COMMAND; parse optional @docs/diagnose/*.md
STEP add-hotfix.branch-check:  Check branch              → IF main: STOP (step 3 required); validate diagnose report before branch creation
STEP add-hotfix.allocate:  Allocate ID + branch      → status.sh next-id H, branch, skeleton about.md
STEP add-hotfix.history:  Discover history (index + parallel agents) → delivery index (--no-verify) → @feature-history-agent ∥ @git-history-agent
STEP add-hotfix.synthesize:  Synthesize history outputs → Confirm related features; retain blast radius for STEP add-hotfix.review
STEP add-hotfix.investigate:  Investigate code          → ONLY AFTER steps 1-5
STEP add-hotfix.root-cause:  Confirm root cause        → BEFORE implementing; pin it RED when tdd-pipeline is on
STEP add-hotfix.implement:  Implement fix             → drive the pinned test GREEN + verify build
STEP add-hotfix.review:  Delivery review           → @reviewer-agent, conditional OWASP, citation verification
STEP add-hotfix.correct: Correction wave           → one @fix-agent wave, snapshot re-review, re-verify build
STEP add-hotfix.log: Log iteration             → MANDATORY BEFORE writing the receipt
STEP add-hotfix.receipt: Write hotfix about.md     → schema hotfix receipt, fingerprint, no later file changes
STEP add-hotfix.validate: Validation gate           → hotfix schema gate and review-validate
STEP add-hotfix.complete: Completion                → Inform user, awaiting /add-done
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF BRANCH = main:
  ⛔ DO NOT USE: Grep on .ts/.tsx/.js files
  ⛔ DO NOT USE: Read on code files
  ⛔ DO NOT: Code investigation
  ⛔ DO NOT: Implementation
  ✅ DO: STEP add-hotfix.allocate-4 (template + branch creation)

IF SCHEMA NOT LOADED:
  ⛔ DO NOT USE: Write to create hotfix docs
  ✅ DO: Load the `hotfix` schema from {{skill:add--doc-schemas/SKILL.md}} FIRST

IF BRANCH NOT CREATED:
  ⛔ DO NOT: Proceed to investigation
  ✅ DO: Create hotfix/[NNNN]H-[slug] branch and docs/features/[NNNN]H-[slug]/

IF HISTORY AGENTS NOT DISPATCHED AND NO VALID DIAGNOSE REPORT:
  ⛔ DO NOT USE: Grep on code
  ⛔ DO NOT USE: Read on code
  ✅ DO: Dispatch @feature-history-agent ∥ @git-history-agent (parallel) and wait for both reports

IF ROOT CAUSE NOT CONFIRMED AND NO VALID DIAGNOSE REPORT:
  ⛔ DO NOT USE: Edit on code files
  ⛔ DO NOT: Implementation
  ✅ DO: Present root cause to user and WAIT for confirmation

IF FIX IMPLEMENTED AND REVIEWER NOT DISPATCHED:
  ⛔ DO NOT USE: Write to create about.md
  ⛔ DO NOT: Report the hotfix complete
  ✅ DO: Dispatch STEP add-hotfix.review's reviewer and wait for the report

IF A FINDING'S CITATION IS NOT VERIFIED:
  ⛔ DO NOT: Present it as a blocker
  ⛔ DO NOT: Correct code for it
  ✅ DO: Read the cited lines yourself first (STEP add-hotfix.correct)

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

## STEP add-hotfix.context: Run Context Mapper (FIRST COMMAND)

```bash
bash .codeadd/scripts/status.sh
```

**AFTER EXECUTION, CHECK OUTPUT:**
- `BRANCH`: Current branch (main/hotfix/feature/other)
- `RECENT_CHANGELOGS`: Last 5 completed items (identify related features)
- `WIKI:present` / `WIKI_STALE_COUNT`: Knowledge base availability (used in STEP add-hotfix.implement)

### STEP add-hotfix.parse-diagnose Parse optional diagnose report

If the invocation carries `@docs/diagnose/<file>.md`, store that relative path as `DIAGNOSE_REPORT`. A conversational diagnosis with no file is not a fast path.
<!-- slot:board.ticket-resolve fallback="fallbacks/empty.md" -->
<!-- feature:board:ticket-resolve -->
<!-- /feature:board:ticket-resolve -->
<!-- /slot:board.ticket-resolve -->

---

## STEP add-hotfix.branch-check: Branch Check (HARD STOP)

### STEP add-hotfix.validate-diagnose-report Validate diagnose report before any branch change

If `DIAGNOSE_REPORT` is set:

1. Read the document. It must pass `diagnose-report` and carry a complete `## Hotfix Handoff`.
2. Run:

```bash
bash .codeadd/scripts/hotfix-gates.sh diagnosis-check <DIAGNOSE_REPORT>
```

3. Exit 2 or a missing/duplicate handoff field → STOP. Instruct `/add-diagnose` again. Do not parse pre-handoff reports.
4. Exit 3 (`diagnosed-commit` unavailable) → STOP. Instruct `/add-diagnose` again.
5. `OVERLAP=none` → the report is current. Continue.
6. `OVERLAP=present` → inspect the delta paths against each finding's path, symbol, cited hunk, and causal chain. Unrelated drift does not block. Relevant drift → STOP and instruct `/add-diagnose` again.

This gate runs before STEP add-hotfix.allocate creates or changes a branch.

**Look at script output. What is the BRANCH value?**

### IF `BRANCH:main` or `BRANCH:master`:

⛔ **TOTAL STOP** - You are on main branch.

**MANDATORY ACTION:** Execute STEP add-hotfix.allocate NOW.

### IF `BRANCH:hotfix/*`:

✅ Branch OK. Skip to STEP add-hotfix.history.

---

## STEP add-hotfix.allocate: Allocate Hotfix ID + Create Branch

⛔ **GATE:** Branch must be created BEFORE investigation.

### STEP add-hotfix.allocate-next-hotfix Allocate Next Hotfix ID

```bash
bash .codeadd/scripts/status.sh next-id H
```

Output: Next global hotfix ID in the form `[NNNN]H` (e.g., `0001H`). Store for the frontmatter write in STEP add-hotfix.receipt.

> **Skill:** Apply `{{skill:add--id-convention/SKILL.md}}` for ID/branch format.

### STEP add-hotfix.create-branch Create Branch

```bash
git checkout -b hotfix/[NNNN]H-[hotfix-slug]
```

**[hotfix-slug]:** kebab-case descriptive (ex: `screenshot-delete-error`, `login-timeout`)

### STEP add-hotfix.create-doc-directory Create Doc Directory

```
docs/features/[NNNN]H-<slug>/
├── about.md    (schema: hotfix — written in STEP add-hotfix.receipt)
└── iterations.jsonl
```

DO NOT write doc contents yet — the schema is loaded and applied in STEP add-hotfix.receipt.

**⛔ CONFIRM:** Execute `git branch --show-current` and verify you're on `hotfix/*`
<!-- slot:board.ticket-doing fallback="fallbacks/empty.md" -->
<!-- feature:board:ticket-doing -->
<!-- /feature:board:ticket-doing -->
<!-- /slot:board.ticket-doing -->

```
IF A VALID DIAGNOSE REPORT PASSED STEPS 1-2:
  ⛔ DO NOT: Run STEPS 4-6
  ✅ DO: Copy the accepted root cause, findings, relations, and boundaries into working context
  ✅ DO: Proceed to STEP add-hotfix.root-cause
```

---

## STEP add-hotfix.history: Discover History via Parallel Agents

⛔ **CRITICAL:** Dispatch BOTH agents in a SINGLE message with TWO Agent tool calls (parallel execution).

### STEP add-hotfix.history Consult the delivery index (NO code access)

Load the **INDEX and GRAPH steps of `{{skill:add--knowledge-discovery/SKILL.md}}` ALONE** — steps 1 and 2 of its procedure, nothing below them. That skill's own *When NOT to Use* records this exemption: the wiki stays out of STEPs 4-6, the two document-record steps do not.

**GRAPH question:** which delivered work items touch the area this symptom appears in? Resolve it in the skill's action table; do not name an action here. **`RELATED_WORK` destination:** the ranked candidate list handed to the two history agents in 4.3. A `caused_by` edge already recorded on a past hotfix is the cheapest answer to "has this broken before" this command can get.

⛔ **The question here is phrased over WORDS, never over paths.** STEP add-hotfix.history runs before the investigation and before the fix, so no file has changed and a question about paths has no input to take. The path-shaped question belongs at STEP add-hotfix.review, where the fix exists.

```
IF `RELATED_WORK` IS STILL BLANK AFTER THE GRAPH STEP:
  ⛔ DO NOT: Carry on as though the step ran
  ✅ DO: Fill it with the hits, with `none` when the graph answered and had no match,
         or with `NOT VERIFIED` plus the reason when the graph could not be reached
```

Query `delivered.sh` with the bug's keywords and **`--no-verify`**:

```bash
bash .codeadd/scripts/delivered.sh read "<bug keywords>" --no-verify
```

**Read `MATCHED_LIVE`, `MATCHED_DEAD`, `RETURNED_LIVE` and `RETURNED_DEAD`, not just the entries.** The read cuts in two buckets and the counts are what say whether it cut anything: `MATCHED_LIVE` above `RETURNED_LIVE` means candidates were left out, and a narrower query is the answer.

⛔ **Under `--no-verify` the dead bucket is nearly always empty, and that is not evidence of anything.** `gone` is COMPUTED at verification, never stored, so a read that skips verification can only ever see a `superseded` somebody declared by hand. Do not read `MATCHED_DEAD=0` here as "nothing was ever dropped in this area" — it means this call did not look.

```
IF THE INDEX READ OMITS --no-verify:
  ⛔ DO NOT: Run it
  ✅ DO: Add the flag — a verifying read greps source, and this command forbids reading code before the history agents are dispatched
```

`--no-verify` is what makes this step legal here. It returns the **stored** status — whatever the last verify established, not a guess — and opens no source file, so the no-code-access prohibition above stands untouched. The verifying read happens later, at STEP add-hotfix.implement, once the root cause is known and a re-query is worth its cost. That is why this command reads the index twice.

**Index absent → note it once and continue.** Nothing here blocks on it.

### STEP add-hotfix.build-symptom-brief Build the symptom brief

From the user's bug report plus `RECENT_CHANGELOGS` from STEP add-hotfix.context, write a short brief:
- One-sentence problem statement
- Affected area / keywords (component, route, entity)
- Optional window (default: 30 days)
- **The ranked index results from STEP add-hotfix.history**, each with its id, name and status

### STEP add-hotfix.dispatch-parallel Dispatch parallel

**Before any dispatch in this command:** read `{{skill:add--subagent-driven-development/references/dispatch-rules.md}}` — a fresh dispatch leaves the engine's resume and session fields empty; only an id an earlier dispatch returned is ever passed.

**DISPATCH AGENT: @feature-history-agent**
Prompt: "Find existing features whose docs (about.md, changelog.md, plan.md) plausibly relate to this bug. Brief: <brief>. Candidate ids already ranked by the delivery index, each with its status: <index results, or 'none — index absent or no match'>. Start from those, then scan `docs/features/`, score relevance, deep-read top-10. Return structured Feature History Report."

⛔ The candidate list changes the agent's **starting point, never its method**. It still scans, scores and deep-reads. Do NOT tell it to skip the scan, and do NOT restrict it to the listed ids — a `gone` entry names a feature whose docs still exist and still matter.

**DISPATCH AGENT: @git-history-agent**
Prompt: "Correlate recent git history with this bug. Brief: <brief>. Window: 30 days. Use git log/show/diff/branch (read-only) to surface suspicious commits and active branches. Return structured Git History Report."

**WAIT** for both reports before proceeding to STEP add-hotfix.synthesize.

---

## STEP add-hotfix.synthesize: Synthesize History & Confirm Related Features

### STEP add-hotfix.combine-two-reports Combine the two reports

- **Convergent signals** — features/files mentioned by BOTH agents (highest confidence)
- **Divergent signals** — surfaced by only one (still relevant)
- **Suspicious commits** — flagged by @git-history-agent in or adjacent to those features

### STEP add-hotfix.synthesize Present to user

Present the top related features (with FEAT_IDs) + the top suspicious commits and ask:
- Confirm related features (yes / no / different one)
- Acknowledge suspicious commits (any context the user can add?)

**Store the confirmed feature relationships. ONE set, TWO destinations, and neither may lose it:**

| Destination | What it does with the set | Step |
|---|---|---|
| The `about.md` `## Relations` section | Each confirmed feature becomes `- caused_by [[<id>]] — <the one-line reason>` | STEP add-hotfix.receipt |
| The **blast radius** `@reviewer-agent` reads | Confirmed features plus the suspicious commits | STEP add-hotfix.review |

Retain them as identifiers with a one-line reason each — this set is confirmed context, and re-deriving it later loses the user's acknowledgement. **STEP add-hotfix.review's use is unchanged by the routing added here**: the set it reads is the same set, carrying the same fields.

### STEP add-hotfix.escalate-add-investigation Escalate to add--investigation (if needed)

If the agents' reports do NOT converge on a clear area OR the bug is vague/multi-layer, LOAD {{skill:add--investigation/SKILL.md}} and apply Phases 2-3 over the agent outputs before STEP add-hotfix.investigate. The agents already covered Phase 1 in agent-dispatched mode.

---

## STEP add-hotfix.investigate: Investigation (ONLY AFTER STEPS 1-5)

**PREREQUISITES VERIFIED:**
- [ ] Branch `hotfix/*` active (NOT main)
- [ ] @feature-history-agent + @git-history-agent reports received
- [ ] Related features confirmed with user

**NOW you can investigate code:**

Use Grep/Read to confirm what documentation indicated:
1. Entry point (controller, component)
2. Business logic (service, handler)
3. Data layer (repository, database)

### STEP add-hotfix.escalate-root-cause Escalate to add--investigation skill (when root cause unclear)

⛔ **IF the bug symptom is vague, intermittent, crosses multiple layers, or the agent reports (STEP add-hotfix.history) + grep/read (STEP add-hotfix.investigate) do NOT converge on a clear cause:**

LOAD {{skill:add--investigation/SKILL.md}} and apply Phases 2-3 (Pattern Analysis, Differential Diagnosis) over the agent outputs plus a code-tracing dispatch to `@architecture-agent`. Phase 1 was already executed in agent-dispatched mode by STEP add-hotfix.history — DO NOT redo it.

**Why:** Hotfixes that ship without rigorous RCA tend to fix symptoms instead of causes, causing the same bug to return. The Iron Law from add--investigation applies: NO FIX WITHOUT ROOT CAUSE.

**Skip this sub-step ONLY when:** the bug has a clear error message + stack trace + obvious cause, AND the agent reports + initial code read converge on it within the first pass.

---

## STEP add-hotfix.root-cause: Confirm Root Cause (BEFORE implementing)

⛔ **GATE CHECK:** DO NOT implement without user confirmation.

**Present to user:**
- **Root Cause:** 1-2 sentences explaining the cause
- **Solution:** 1-2 sentences describing the fix
- **Files:** list of files to modify

```
IF A VALID DIAGNOSE REPORT PASSED STEPS 1-2:
  ⛔ DO NOT: Ask a second root-cause confirmation
  ✅ DO: Treat the handoff root cause, files, and required changes as already confirmed
  ✅ DO: Still run the injected TDD RED gate below
```

**WAIT for explicit confirmation before proceeding, unless a valid diagnose report already confirmed the root cause.**

<!-- slot:tdd-pipeline.red-gate fallback="fallbacks/empty.md" -->
<!-- feature:tdd-pipeline:red-gate -->
<!-- /feature:tdd-pipeline:red-gate -->
<!-- /slot:tdd-pipeline.red-gate -->

---

## STEP add-hotfix.implement: Implement Fix

**PREREQUISITES:**
- [ ] Root cause confirmed by user
- [ ] On branch `hotfix/*`

<!-- slot:gitnexus.graph-impact fallback="fallbacks/empty.md" -->
<!-- plugin:gitnexus:graph-impact -->
<!-- /plugin:gitnexus:graph-impact -->
<!-- /slot:gitnexus.graph-impact -->

### STEP add-hotfix.implement Consult Knowledge Base

Load `{{skill:add--knowledge-discovery/SKILL.md}}` and run its procedure. **If `WIKI:present` (from STEP add-hotfix.context script output):** SELECT `{{addpath:wiki/conventions.md}}` + the domain page for the affected area (`{{addpath:wiki/domains/<area>.md}}`), freshness-check both. Conventions govern HOW to fix — follow them in implementation. **If wiki absent:** note "knowledge base unavailable — /add-wiki generates it" and follow existing code patterns instead.

### STEP add-hotfix.apply-fix Implement

**DO:**
- Fix root cause (not symptom)
- Minimal and focused changes
- Follow existing patterns
- Test locally if possible

**FRONTEND FIXES:**
If bug in frontend:
1. READ skill `add--ux-design`
2. Follow patterns (mobile-first, shadcn, Tailwind v3)

**DO NOT:**
- Refactor unrelated code
- Add features
- Over-engineer

### STEP add-hotfix.implement Verify Build

Verify build passes for affected apps (backend, frontend, or both).

---

## STEP add-hotfix.review: Delivery Review

⛔ **GATE:** Fix implemented and build verified (STEP add-hotfix.implement). The reviewer is READ-ONLY — it reports, this command applies.

### STEP add-hotfix.review Assemble the shared input

- the change under review — this branch's diff against its base, and the paths it touches
- the confirmed root cause from STEP add-hotfix.root-cause or the diagnose handoff
- the **blast radius** retained in STEP add-hotfix.synthesize, or the handoff's confirmed relations when STEPS 4-6 were skipped
- **the file-overlap half of the graph.** The fix exists now, so a file list exists now. **GRAPH question:** which delivered work items touch the files this fix changed? It is phrased over PATHS. Run `add--knowledge-discovery`'s GRAPH step over this branch's changed paths, resolve the question in its action table, and add the work items it returns to the blast radius above, as identifiers with one line each. STEP add-hotfix.history could not ask this: it runs before the investigation and before the fix, so nothing had changed yet
- the `WIKI:` fields from STEP add-hotfix.context
- `reviewer:` starts as `named`

### STEP add-hotfix.review Dispatch @reviewer-agent

**DISPATCH AGENT: @reviewer-agent** [read-only, standard]
- **MODE:** `task`
- **Input:** STEP add-hotfix.review

If the named agent is unavailable, dispatch a generic read-only subagent with the same inputs and set `reviewer: generic`. If no read-only subagent exists, perform the same review inline and set `reviewer: inline`.

**WAIT** for the report.

### STEP add-hotfix.conditional-owasp Conditional OWASP

Dispatch `@reviewer-agent` again with `MODE: owasp` only when changed paths touch authentication, payment, upload, input handling, session, token, or another caller-identified sensitive area. Never by default. Use the same fallbacks as STEP add-hotfix.review.

### STEP add-hotfix.verify-every-citation Verify every citation

For each finding marked blocking, READ the cited lines yourself.

| Citation check | Action |
|---|---|
| The cited `path:line` supports the claim | Keep the finding |
| The lines do not say what the finding claims | Downgrade to observation, record the mismatch |
| The path or line does not exist | Discard, record the bad citation |

Map reviewer severity: `Critical` → `blocker`, `Important` → `major`, `Minor` → `minor`. Allocate `HF-R001` onward after sorting by severity, path, and line. Do not invent `polish` by downgrading `Minor`.

---

## STEP add-hotfix.correct: Correction Wave

### STEP add-hotfix.correct Partition by disposition

| Disposition | Meaning | May block? |
|---|---|---|
| `introduced` | This diff introduced it, or made it newly reachable | Yes |
| `pre-existing` | Present and equally reachable before this change | **Never.** Observation only |
| `unverifiable` | The verification method did not run — WITH the reason | No |
| `accepted` | Real, and the user decides to ship anyway | No |

⛔ DO NOT widen the fix to resolve a `pre-existing` finding. Record it in `## Review` and in `## Observations` (STEP add-hotfix.receipt) when it deserves to be findable later.

### STEP add-hotfix.one-whole-wave One whole-wave correction

If any `blocker` or `major` introduced finding remains:

1. Write the routed paths as path-hex, one per line.
2. Run `bash .codeadd/scripts/hotfix-gates.sh snapshot-wave <path-hex-file>` and store `SNAPSHOT`.
3. **DISPATCH AGENT: @fix-agent** [full-access, standard] with the diagnose report when present, `AREAS`, the full ordered `ROUTED_ROWS`, `ATTEMPT=1`, `MAX_ATTEMPTS=1`, and build errors verbatim. There is no second dispatch.
4. If `@fix-agent` is unavailable, a generic full-access subagent or the coordinator applies the same whole wave inline.

⛔ ONE pass. A finding that survives it stays open. Never send a hotfix to `{{cmd:add-review}}`.

### STEP add-hotfix.snapshot-re-review Snapshot re-review

If STEP add-hotfix.one-whole-wave changed files:

1. Run `bash .codeadd/scripts/hotfix-gates.sh diff-wave <SNAPSHOT> <package>`.
2. **DISPATCH AGENT: @reviewer-agent** `MODE: re-review` with the open findings and that correction-only snapshot package.
3. Use the same named/generic/inline fallback as STEP add-hotfix.review.

### STEP add-hotfix.re-verify-mandatory Re-verify (MANDATORY when STEP add-hotfix.one-whole-wave changed any file)

1. Re-run STEP add-hotfix.implement's build verification.
2. IF `tdd-pipeline` is enabled AND a RED test was written: re-run it and confirm it is still GREEN.

⛔ IF the build fails or the pinned test is no longer GREEN:
  ⛔ DO NOT proceed to STEP add-hotfix.log
  ⛔ DO NOT report the hotfix complete
  ✅ DO report the regression the corrective pass introduced, and STOP

Any `blocker` or `major` still `open` or `not-addressed` after re-review blocks completion.

---

## STEP add-hotfix.log: Log Iteration (MANDATORY — PRD0031)

**BEFORE writing the receipt, append entry to iterations.jsonl:**

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/[NNNN]H-<slug>/iterations.jsonl" "fix" "/hotfix" '"slug":"<SLUG>","what":"<WHAT max 60 chars>","files":["<file1>","<file2>"]'
```

**Parameters:**
- `slug`: kebab-case identifier (ex: modal-confirm-btn, null-check-user)
- `what`: Brief description max 60 chars
- `files`: Array of affected file paths

---

## STEP add-hotfix.receipt: Write Hotfix about.md (schema: hotfix)

EXECUTE schema `hotfix` from `{{skill:add--doc-schemas/SKILL.md}}` and `{{skill:add--doc-schemas/references/fix.md}}`.

**Path:** `docs/features/[NNNN]H-<slug>/about.md`

**ID:** `[NNNN]H` from STEP add-hotfix.allocate. Write per `hotfix` schema. Extractive only.
<!-- slot:board.ticket-frontmatter fallback="fallbacks/empty.md" -->
<!-- feature:board:ticket-frontmatter -->
<!-- /feature:board:ticket-frontmatter -->
<!-- /slot:board.ticket-frontmatter -->

Write the complete `## Review` receipt with `reviewed-tree: sha256:<PENDING>`. Fill `reviewer:` from STEP add-hotfix.review. Fill Findings from STEPS 9-10. An empty review still writes the table header.

### STEP add-hotfix.write-relations-observations Write `## Relations`, `## Observations` and `tags:`

On the normal path the set was confirmed in STEP add-hotfix.synthesize. On the report-backed path it was confirmed in `/add-diagnose`. **This routes it; it confirms nothing again.**

| Source already in hand | Becomes |
|---|---|
| Each confirmed `caused_by` work item | `- caused_by [[<id>]] — <the one-line reason>` |
| The trigger, the measured impact and the safeguard that missed it | `- [<category>] <text>` lines under `## Observations` |
| The domains the fix touched | `tags:` — bare lowercase words |

⛔ **A `caused_by` the user never confirmed does not get written.** A hotfix whose cause resolves to no recorded work item writes `## Relations` carrying the single word `None`.

### STEP add-hotfix.fingerprint Fingerprint

1. Run `bash .codeadd/scripts/hotfix-gates.sh review-manifest docs/features/[NNNN]H-<slug>/`.
2. Replace the Reviewed Paths fence with that manifest.
3. Run `bash .codeadd/scripts/hotfix-gates.sh review-fingerprint docs/features/[NNNN]H-<slug>/`.
4. Replace `sha256:<PENDING>` with the printed `REVIEWED_TREE` value. Replace only that field.

⛔ No hotfix-owned file changes after this replacement.

---

## STEP add-hotfix.validate: Validation Gate

Execute the validation gate from `{{skill:add--doc-schemas/SKILL.md}}` on:
`hotfix` — `docs/features/[NNNN]H-<slug>/about.md`

Then run:

```bash
bash .codeadd/scripts/hotfix-gates.sh review-validate docs/features/[NNNN]H-<slug>/
```

`HOTFIX_REVIEW` must be `ok`. Any other verdict STOPS.

⛔ DO NOT skip. DO NOT mark the command complete until the schema gate returns `PASS` and `review-validate` returns `ok`.

---

## STEP add-hotfix.complete: Hotfix Complete

⛔ **DO NOT commit** - branch ready for next phase.

**LOAD `{{skill:add--final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the hotfix ID, the branch and the next phase come after it.

Fill `What was delivered` with the fix itself, and `How it works` with the root cause and why this
fix removes it rather than hiding it. `⚠️ Needs your attention` names anything the fix touched
outside the reported symptom, because a hotfix is where that hurts most.

Then, after the seven blocks, state: hotfix ID, branch, problem, root cause, solution, modified
files, build status.
<!-- slot:board.ticket-report fallback="fallbacks/empty.md" -->
<!-- feature:board:ticket-report -->
<!-- /feature:board:ticket-report -->
<!-- /slot:board.ticket-report -->

**Next Phase:** Hotfix ownership ends; merging is handled by ecosystem flow. Reference skill `add--ecosystem` Main Flows section for context-aware routing.

---

## Rules

**ALWAYS:**
- Use `status.sh next-id H` to allocate hotfix ID
- Create hotfix branch and docs in `docs/features/[NNNN]H-<slug>/`
- Load the `hotfix` schema from add--doc-schemas before writing
- Dispatch @feature-history-agent ∥ @git-history-agent (parallel) before investigating code, unless a valid diagnose report already supplied that investigation
- Wait for both history reports before any Grep/Read on code, unless STEPS 4-6 were skipped
- Confirm root cause with user before implementing, unless a valid diagnose report already confirmed it
- Fix root cause, not symptoms
- Keep changes minimal and focused
- Run the validation gate and `review-validate` on about.md before completing
- Log iteration entry before writing the receipt
- Verify build passes after implementing fix
- Dispatch @reviewer-agent after the fix, with conditional OWASP and one @fix-agent wave

**NEVER:**
- Investigate code while on main branch
- Inline any doc template — ALWAYS load from add--doc-schemas
- Use abstractive summarization to fit word caps
- Grep or read code before the parallel history agents return, unless a valid diagnose report skipped STEPS 4-6
- Implement fix without a confirmed root cause
- Refactor unrelated code during hotfix
- Add new features inside a hotfix
- Commit changes before user review
- Skip the validation gate
- Write a `caused_by` relation the user did not confirm
- Soften a reviewer's severity to avoid a corrective pass
- Recommend or invoke `/add-review` for a hotfix

---

## Example Flow

```
# User: "Screenshot validation bugada!"

# STEP add-hotfix.context-2: status.sh → BRANCH:main → STOP
# STEP add-hotfix.allocate: status.sh next-id H → H0001
#   git checkout -b hotfix/0001H-screenshot-delete-error
#   mkdir docs/features/0001H-screenshot-delete-error/
# STEP add-hotfix.history: Dispatch @feature-history-agent ∥ @git-history-agent (parallel)
#   → A.1 surfaces F0036 ai-screenshot-validation; A.2 flags commit abc123 as suspicious
# STEP add-hotfix.synthesize: Confirm F0036 with user; retain {F0036, abc123} as the blast radius
# STEP add-hotfix.investigate: Investigate code
# STEP add-hotfix.root-cause: Confirm root cause with user
# STEP add-hotfix.implement: (tdd-pipeline on) RED test pins the bug → implement → GREEN → verify build
# STEP add-hotfix.review: Dispatch @reviewer-agent; OWASP only if the diff is sensitive
# STEP add-hotfix.correct: One @fix-agent wave with ATTEMPT=1 MAX_ATTEMPTS=1 → snapshot re-review → build + GREEN
# STEP add-hotfix.log: Log iteration
# STEP add-hotfix.receipt: Write about.md receipt, insert Reviewed Paths, replace sha256:<PENDING>
# STEP add-hotfix.validate: Validation gate + review-validate
# STEP add-hotfix.complete: Hotfix complete → /add-done
```

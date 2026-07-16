# Wiki Knowledge Base Generator

Discovery coordinator that dispatches specialized analyzer agents based on app classification. Does NOT analyze code itself - classifies apps, dispatches agents, and consolidates outputs into a portable project wiki (`.codeadd/wiki/`) with a derived hub, spine pages, and per-domain pages.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules).

---

## Invocation Modes

`/add.wiki` → full generation. Run STEP 1 through STEP 9 below.

`/add.wiki update` → skip the generation flow (STEP 2 through STEP 5):

```
IF {{addpath:wiki/index.md}} exists:
  Load skill {{skill:add-wiki-maintenance/SKILL.md}} and execute its full update
  discipline (evidence chain, computed candidates, impact plan, surgical edits,
  per-page stamp bumps, hub sync, .meta.json advance, report).
ELSE:
  No wiki exists yet — fall back to full generation (STEP 1 onward).
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Self-Bootstrap             → READ skill FIRST
STEP 2: Detect & Classify Apps     → EXPLORE + BUILD dispatch plan
STEP 2.5: Read User Brief          → INSTRUCTIONS.md scope/priorities (if present)
STEP 3: Dispatch Analyzers         → ALL IN PARALLEL (specialists + spine + quality)
STEP 4: Consolidate Pages          → WAIT-ALL before proceeding
STEP 5: Generate Hub + Gate        → DERIVE index.md + bijection/budget gate
STEP 6: Update CLAUDE.md           → DISPATCH agent (managed block)
STEP 7: Copy Context Files         → CLAUDE.md → AGENTS.md, GEMINI.md
STEP 8: Write .meta.json           → CORPUS STAMP + gitignore check
STEP 9: Report & Cleanup           → SUMMARY + backlog + next steps
```

**⛔ ABSOLUTE PROHIBITIONS:**

IF `{{addpath:wiki/INSTRUCTIONS.md}}` exists:
  ⛔ DO NOT USE: Write or Edit on INSTRUCTIONS.md
  ✅ DO: Read it once for scope/priority steering, nothing else

IF the STEP 5 bijection/budget gate has NOT passed:
  ⛔ DO NOT USE: Bash to delete `{{addpath:skills/project-patterns/}}` or `pattern-search.sh`
  ⛔ DO NOT: Proceed to STEP 6
  ✅ DO: Fix `index.md` or the pages until the gate holds, then retry

---

## Rules

ALWAYS:
- Classify apps using SKILL.md signals
- Dispatch all specialists, the spine analyzer, and the quality analyzer in parallel
- Derive every index.md link description from page frontmatter, never hand-write it
- Require frontmatter + TL;DR + TOC (if >100 lines) + Related footer on every wiki page
- Preserve coordinator/dispatcher pattern
- Verify the bijection/budget gate before touching CLAUDE.md
- Treat INSTRUCTIONS.md as read-only scope/priority steering when present

NEVER:
- Analyze code yourself (coordinator only)
- Write wiki pages directly (specialists/spine analyzer do this)
- Execute specialists sequentially (run parallel)
- Skip the STEP 5 bijection/budget gate
- Skip the code quality analyzer (always run)
- Bake structural facts (call graphs, import inventories, blast radius) into wiki pages
- Edit or overwrite `INSTRUCTIONS.md`
- Delete legacy `project-patterns`/`pattern-search.sh` before the STEP 5 gate passes

---

## Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. If your engine supports parallel dispatch and mode is `parallel`, dispatch all simultaneously
5. Verify output exists before proceeding past any WAIT or GATE CHECK

You are the coordinator. You know your engine's capabilities. Map the intent to the best available mechanism.

---

## STEP 1: Self-Bootstrap (READ FIRST)

Read skill `add-architecture-discovery`.

**Focus on:**
- `AppClassification` section → signals to identify app type (backend, frontend, cli, etc)
- `SpecialistRegistry` section → which analyzer to dispatch for each type, and the wiki page it now writes
- `GenericAppTemplate` section → template for apps without specialist
- The wiki page frontmatter and body format sections → the mandatory schema every dispatched analyzer (specialists, spine, generic template) must follow

**These sections contain the intelligence that drives classification, dispatch, and page format.**

---

## STEP 2: Detect & Classify Apps

### 2.0 Explore Project

Using native tools, gather the signals needed for classification:

```bash
# Detect monorepo tooling
ls turbo.json pnpm-workspace.yaml nx.json lerna.json 2>/dev/null

# List candidate app dirs
ls apps/ packages/ libs/ 2>/dev/null

# Read root config
cat package.json
```

Also check for non-node stacks: `requirements.txt`, `go.mod`, `Cargo.toml`, `composer.json`.

No temp file — use findings inline for classification below.

<!-- plugin:gitnexus:graph-classify -->
<!-- /plugin:gitnexus:graph-classify -->

### 2.1 Detect Apps

List all directories under `apps/`, `packages/`, `libs/`.

### 2.2 Classify Each App

**For each detected app:**

1. Read its `package.json`

2. MATCH dependencies against SKILL.md signals:
   ```
   AppClassification.signals:
   - backend: express, fastify, nestjs, hono, koa, @grpc/*, socket.io, @trpc/*
   - frontend: react, vue, svelte, solid-js, next, nuxt, @tanstack/react-*
   - database: prisma, drizzle-orm, kysely, typeorm, sequelize, knex
   - cli: commander, yargs, clack, inquirer, meow, oclif
   - worker: bullmq, bull, agenda, node-cron, bee-queue
   ```

3. ASSIGN specialist or generic template

4. NOTE recent churn per app (git evidence) — used by STEP 5.2 domain-selection priority if the domain count exceeds budget

### 2.3 Build Dispatch Plan

**Format:**
```
APPS_CLASSIFIED:
- apps/server    → backend   → backend-analyzer.md  → domains/backend.md
- apps/admin     → frontend  → frontend-analyzer.md → domains/frontend.md
- apps/cli       → cli       → generic template     → domains/cli.md

CROSS-APP:
- libs/database detected → database-analyzer.md → domains/database.md
```

### 2.3.1 Determine Mode (recorded in the dispatch plan)

```
MODE: standard | tiny

tiny = ~10 or fewer primary source items across all apps.
IF tiny:
  - Keep only the 1-2 most relevant domain analyzers in the dispatch plan
    (primary classification first); every other area → Backlog entry
  - The spine analyzer runs in FOLD mode (returns sections instead of
    writing files — see 3.6); no spine files are written
ELSE: standard — full plan as built in 2.3.
```

### 2.4 Create Output Directory

```bash
mkdir -p .codeadd/wiki/domains
```

---

## STEP 2.5: Read User Brief

```
IF {{addpath:wiki/INSTRUCTIONS.md}} exists:
  Read it. Treat its content as scope/priority steering for the dispatch plan (2.3)
  and for domain selection when over budget (STEP 5.2).
  ⛔ NEVER edit, rewrite, or overwrite this file — it is user-owned.
ELSE:
  Continue with no additional steering.
```

---

## STEP 3: Dispatch Analyzers (PARALLEL)

**DISPATCH ALL AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously — app specialists, the spine analyzer, and the code quality analyzer together.

### 3.1 Common Dispatch Pattern

<!-- plugin:gitnexus:graph-dispatch-common -->
<!-- /plugin:gitnexus:graph-dispatch-common -->

**For ALL analyzers** (app specialists + spine + database + code quality):

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Context:** Dispatch plan from STEP 2 (classified apps, paths, detected stack), INSTRUCTIONS.md brief from STEP 2.5 (if present)
- **Output format:** every wiki-writing analyzer follows the mandatory frontmatter + body format below; the code quality analyzer keeps its existing report format (unchanged, stays outside the wiki)

**Mandatory Wiki Page Frontmatter (every wiki-writing analyzer):**
```yaml
---
type: reference | how-to | explanation
area: backend | frontend | database | architecture | conventions | workflows | <domain>
description: <1-2 sentences, keyword-rich — what this page covers and when to read it>
sources: [<code paths this page derives from>]   # max 8 globs
commit: <short-sha at generation>
generated: <YYYY-MM-DD>
tags: [<grep targets: di, repository-pattern, error-handling>]   # max 6
---
```

**Mandatory Wiki Page Body Format:**
```markdown
# <Title>

## TL;DR
<2-4 lines: what this page is, why it exists, headline facts>

## TOC            ← required when page > 100 lines
- [Topic A](#topic-a) ...

## <Topic — topic sentence first>
<Extractive content. Every non-trivial claim carries a path:line ref. One code example per topic.>

## Related
- [domains/other.md](other.md): <why related>   ← 2-4 links max, relative paths
```

**Common Rules (ALL wiki-writing analyzers):**
- No questions — use best judgment
- Document ONLY what EXISTS in code
- Include real code examples with path:line references
- No structural facts baked in — call graphs, blast radius, and import inventories belong to the live code graph or fresh code reading; name entry points/boundaries only, point elsewhere for anything that rots
- Explain WHY the code exists, not only what it contains — write for the next editor agent
- Skip empty sections; no tutorial/narrative filler; current-state phrasing only
- Real file paths only — never wikilinks `[[page]]`
- Token-efficient format (context engineering compliant)

### 3.2 App Specialists (with specialist: backend, frontend)

<!-- plugin:gitnexus:graph-specialist -->
<!-- /plugin:gitnexus:graph-specialist -->

**DISPATCH FOR EACH APP WITH SPECIALIST:**

**Prompt:**
```
## ROLE
Analyze [APP_NAME] at [APP_PATH] (classified as [TYPE])

## SELF-BOOTSTRAP
Read: skill add-architecture-discovery file [TYPE]-analyzer.md
Follow ALL instructions.

## TASK
1. Analyze ONLY [APP_PATH] using [TYPE]-specific patterns
2. WRITE to .codeadd/wiki/domains/[TYPE].md
   - Frontmatter: type (reference), area ([TYPE]), description, sources, commit, generated, tags
   - Body: ## TL;DR, ## TOC (if >100 lines), topic-first ## chunks with path:line refs, ## Related footer (2-4 links)
   - No structural facts — name entry points/boundaries only, point to the code graph/code for anything that rots
3. Return: FILE_WRITTEN, TYPE, FRAMEWORKS, PATTERNS_FOUND, TOPICS count

## OUTPUT
Write {{addpath:wiki/domains/[TYPE].md}}
```

### 3.3 App Generic Template (without specialist: cli, worker)

**DISPATCH FOR EACH APP WITHOUT SPECIALIST:**

**Prompt:**
```
## ROLE
Analyze [APP_NAME] at [APP_PATH] (classified as [TYPE], no specialist)

## SELF-BOOTSTRAP
Read: skill add-architecture-discovery
Focus: GenericAppTemplate section

## TASK
1. Discover what this app does (via CODE, not folder name)
2. WRITE to .codeadd/wiki/domains/[TYPE].md
   - Frontmatter: type (reference), area ([TYPE]), description, sources, commit, generated, tags
   - Body: ## TL;DR, ## TOC (if >100 lines), App Nature, Structure, Entry Points, Dependencies, Configuration, Commands/Jobs, ## Related footer
3. Return: FILE_WRITTEN, APP_PURPOSE, ENTRY_POINT, KEY_DEPENDENCIES, TOPICS count

## OUTPUT
Write {{addpath:wiki/domains/[TYPE].md}}
```

### 3.4 Database Analyzer (if detected)

<!-- plugin:gitnexus:graph-database -->
<!-- /plugin:gitnexus:graph-database -->

**DISPATCH IF DATABASE FOUND:**

**Prompt:**
```
## ROLE
Analyze database patterns across the project

## SELF-BOOTSTRAP
Read: skill add-architecture-discovery file database-analyzer.md
Follow ALL instructions.

## TASK
1. Analyze database patterns
2. If database found: WRITE to .codeadd/wiki/domains/database.md
   - Frontmatter: type (reference), area (database), description, sources, commit, generated, tags
   - Body: ## TL;DR, ## TOC (if >100 lines), topic-first ## chunks with path:line refs, ## Related footer
3. If NO database: skip (do NOT write)
4. Return: FILE_WRITTEN, STACK, PATTERNS_FOUND, TOPICS count

## OUTPUT
Write {{addpath:wiki/domains/database.md}} (or NONE)
```

### 3.5 Code Quality Analyzer (always)

<!-- plugin:gitnexus:graph-quality -->
<!-- /plugin:gitnexus:graph-quality -->

**DISPATCH ALWAYS:**

**Prompt:**
```
## ROLE
Analyze code quality across the project

## SELF-BOOTSTRAP
Read: skill add-architecture-discovery file code-quality-analyzer.md
Follow ALL instructions.

## TASK
1. Analyze code quality (actual code, not just config)
2. WRITE to docs/code-quality-review.md
3. Return: FILE_WRITTEN, SOLID_SCORE, CLEAN_CODE_SCORE, TECH_DEBT, TOP_ISSUES (top 3)

## OUTPUT
Write docs/code-quality-review.md
```

`docs/code-quality-review.md` stays outside `.codeadd/wiki/` — it is a point-in-time report (scores, top issues), not durable knowledge; mixing report artifacts into the wiki would make staleness semantics incoherent.

### 3.6 Spine Analyzer (NEW — cross-cutting knowledge)

**DISPATCH ALWAYS, IN PARALLEL WITH THE OTHERS:**

**Prompt:**
```
## ROLE
Produce the project-wide spine pages: architecture, conventions, workflows.

## SELF-BOOTSTRAP
Read: skill add-architecture-discovery file spine-analyzer.md
Follow ALL instructions.

## INPUTS
- Dispatch plan from STEP 2 (classified apps, paths, detected stack)
- Root configs (package.json, turbo.json, tsconfig, etc.)
- Existing docs (README, docs/) as primary source material
- Validation Gates detection

## TASK
1. WRITE .codeadd/wiki/architecture.md — system shape, boundaries, layer rules (type: explanation)
2. WRITE .codeadd/wiki/conventions.md — project-wide naming/error-handling/style/ID rules (type: reference);
   canonical home for cross-cutting conventions — domain-local conventions stay in domains/<area>.md and link
   here instead of restating
3. WRITE .codeadd/wiki/workflows.md — dev workflows, validation gates, release, testing entry points (type: how-to)
   Every page: mandatory frontmatter (type/area/description/sources/commit/generated/tags) + TL;DR + TOC
   (if >100 lines) + topic-first ## chunks with path:line refs + ## Related footer. No structural facts baked in.
4. Return: FILES_WRITTEN, TOPICS count per page

## OUTPUT
Write {{addpath:wiki/architecture.md}}, {{addpath:wiki/conventions.md}}, {{addpath:wiki/workflows.md}}
```

**FOLD MODE (MODE=tiny from 2.3.1):** append to the spine analyzer's prompt: "TINY REPO — do NOT write files. Return three compact sections (architecture, conventions, workflows; ≤15 lines each, same content rules, path:line refs) in your report. The coordinator folds them into index.md at STEP 5."

**DISPATCH RULES:**
- RUN ALL analyzers IN PARALLEL
- Do NOT wait between dispatches
- Expect outputs: all app domain pages + database.md (if detected) + the 3 spine pages + code-quality-review.md

---

## STEP 4: Consolidate Pages (WAIT-ALL Before Consolidation)

**WAIT-ALL:** Verify ALL agent outputs exist before proceeding.

**Gate Check Checklist:**
- [ ] All `{{addpath:wiki/domains/*.md}}` files from the dispatch plan exist
- [ ] Spine — standard mode: `{{addpath:wiki/architecture.md}}`, `{{addpath:wiki/conventions.md}}`, `{{addpath:wiki/workflows.md}}` exist. Tiny mode (2.3.1): NO spine files expected; instead the spine analyzer's report contains the three folded sections
- [ ] `docs/code-quality-review.md` exists
- [ ] Every wiki page has complete frontmatter (type, area, description, sources, commit, generated, tags)
- [ ] All wiki pages contain the mandatory body sections (TL;DR, TOC if >100 lines, topic chunks, Related footer)
- [ ] Topic counts confirmed per page

**COLLECT reports:**
- Files written (list each wiki page)
- App classifications confirmed (type → framework)
- Frameworks/patterns discovered
- Code quality metrics
- Topic count per page

**Decision Point:**
- If ANY file missing, incomplete, or missing frontmatter → Wait/retry. Do NOT proceed.
- If ALL outputs verified → Proceed to STEP 5.

---

## STEP 5: Generate Hub + Gate

Derive `{{addpath:wiki/index.md}}` entirely from page frontmatter — never hand-write a link description.

**WRITE** `{{addpath:wiki/index.md}}`:

```markdown
# <Project Name> — Knowledge Base

> One-paragraph summary: what this project is, its stack, its shape.

Generated by /add.wiki at commit `<short-sha>` on <date>. Pages describe the repo
as of their own frontmatter `commit`. Staleness check for any page:
`git diff --name-only <page.commit>..HEAD -- <page.sources>` (non-empty ⇒ verify against code).

## Architecture & Rules
- [architecture.md](architecture.md): <description from architecture.md frontmatter>
- [conventions.md](conventions.md): <description from conventions.md frontmatter>
- [workflows.md](workflows.md): <description from workflows.md frontmatter>

## Domains
- [domains/[TYPE].md](domains/[TYPE].md): <description from that page's frontmatter>
[one line per domain page]

## Terminology
<canonical term per concept, ≤15 entries: "job (not task/worker-item)", ...>

## How to Search
- By topic: grep -i "<term>" .codeadd/wiki/ -r -l
- By metadata: grep -i "<term>" .codeadd/wiki/**/*.md — frontmatter descriptions/tags are the index

## Optional
- <links an agent may skip under context pressure: edge domains, low-traffic pages>

## Backlog
- <area> — <source anchor> — <one-line reason deferred>
```

### 5.1 Budgets

- Initial generation: **≤ 12 pages** (spine 3 + hub + up to ~8 domain pages)
- **Tiny-repo variant (MODE=tiny, decided in 2.3.1):** hub + at most 1-2 domain pages. The hub's "## Architecture & Rules" link list is REPLACED by the three folded sections (`## Architecture`, `## Conventions`, `## Workflows`) taken verbatim from the spine analyzer's FOLD-mode report. Everything cut → Backlog
- Page size: **300-line target, 500-line hard cap.** Over cap → split into a `domains/<area>/` directory (max depth 2), update the hub
- Hub: **150-line hard cap**
- First pass is anti-perfectionist: produce a strong, accurate, navigable first-pass wiki, then stop — refinement belongs to `/add.wiki update`

### 5.2 Domain Selection When Over Budget

When the domain count exceeds budget (monorepos with 10+ domains), priority order:
1. Areas named in `INSTRUCTIONS.md`
2. Domains with recent churn (git evidence from STEP 2.2)
3. Larger/central domains

Everything cut goes to the Backlog with its source anchor — never silently dropped.

### 5.3 GATE — Bijection & Budget Checklist

- [ ] Every link in `index.md` (excluding `INSTRUCTIONS.md` and non-`.md` files like `.meta.json`) resolves to an existing wiki page
- [ ] Every wiki `*.md` page (excluding `index.md` and `INSTRUCTIONS.md`) is linked from `index.md`
- [ ] Every page has complete frontmatter (type, area, description, sources, commit, generated, tags)
- [ ] Budgets respected (§5.1)
- [ ] Terminology has ≤ 15 entries

IF the gate fails → fix `index.md` or the pages. Do NOT proceed to STEP 6 until the bijection holds.

### 5.4 Migration Cleanup (full runs only, AFTER the gate passes)

- IF `{{addpath:skills/project-patterns/}}` exists → DELETE it, report the removal
- IF `.codeadd/scripts/pattern-search.sh` exists → DELETE it, report the removal
- NEVER perform this cleanup before the STEP 5 gate passes

---

## STEP 6: Update CLAUDE.md

<!-- plugin:gitnexus:graph-contract -->
<!-- /plugin:gitnexus:graph-contract -->

Read skill `{{skill:add-claude-md-style/SKILL.md}}` BEFORE dispatching the agent.

**DISPATCH AGENT:**
- **Capability:** read-write (must update CLAUDE.md)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are the CONTEXT FILES UPDATER.

## SELF-BOOTSTRAP
Read: skill add-architecture-discovery
Follow OUTPUT FORMAT and TEMPLATE sections.
Read: skill add-claude-md-style
Apply ALL content rules from that skill.

## INPUTS TO READ
1. .codeadd/wiki/index.md and every page it links (frontmatter descriptions)

## TASK
Update CLAUDE.md with these sections, in order:

1. **DELETE FIRST** any existing section referencing `project-patterns` or `pattern-search.sh`
   (legacy Implementation Patterns pointer) — migration cleanup, before writing anything else
2. **## Architecture Contract** — Apps table (`app | kind | path | entry`) + layer hierarchy rule
   + import rules (compact JSON)
3. **## Technical Spec** — compact JSON only, one object per line, max 10 words per value
4. **Project Knowledge Base managed block** — find markers `[//]: # (codeadd-wiki:start)` /
   `[//]: # (codeadd-wiki:end)`. If present, REPLACE the block between them. If absent, APPEND
   the block below with a blank-line separator. NEVER use HTML-comment syntax for these
   markers — only the exact bracket form shown. Write EXACTLY:

[//]: # (codeadd-wiki:start)

## Project Knowledge Base

`.codeadd/wiki/` holds this project's patterns, conventions, workflows, and architecture
rationale. Entrypoint: `.codeadd/wiki/index.md`.

- CONSULT BEFORE exploring source for: project conventions, established patterns,
  workflow/how-to questions, architecture rationale ("why is it built this way").
- Do NOT consult for live structural facts (callers, impact, dependencies) — derive those
  from the code graph or the code itself.
- Pages carry `commit` + `sources` frontmatter. If sources changed since (see index.md
  staleness check), verify against code before relying on the page.
- Do not hand-edit generated pages; run /add.wiki update instead. INSTRUCTIONS.md is
  user-owned and steers regeneration.

[//]: # (codeadd-wiki:end)

## CONSTRAINTS (from add-claude-md-style skill)
Target: 80-150 lines total.

DO NOT include:
- Frontend/backend/database patterns (already in the wiki)
- API route lists
- Component/directory trees
- Inline code examples
- Feature documentation or business flows
- Security implementation details
- Worker/job queue details
- Any section explaining a single concept in >5 lines

## OUTPUT FORMAT
- JSON minified one-line per object
- Max 10 words per description value
- Managed block copied verbatim from this prompt — do not paraphrase it

## REPORT FORMAT
Return summary:
- CLAUDE_MD_UPDATED: YES
- LEGACY_SECTION_REMOVED: [YES/NO]
- TOTAL_LINES: [count]
- SECTIONS_UPDATED: [list]
```

- **Output:** Update `CLAUDE.md`

WAIT: Do NOT proceed until CLAUDE.md has been updated.

---

## STEP 7: Copy Context Files to Other Engines

**Coordinator action (no subagent needed).**

**AFTER CLAUDE.md is confirmed updated:**

### 7.1 Copy to GEMINI.md

GEMINI.md ← identical copy of CLAUDE.md.

### 7.2 Copy to AGENTS.md

AGENTS.md ← copy of CLAUDE.md + conditionally append shell policy.

**Detect OS and Git Bash path before writing:**

```bash
uname -s
```

- If output is `Linux` or `Darwin` → skip shell policy, do NOT append anything
- If output contains `MINGW`, `CYGWIN`, or `MSYS` (Git Bash on Windows) OR env `OS=Windows_NT` is set → detect Git Bash path:

```bash
where bash 2>/dev/null || which bash 2>/dev/null
```

Common fallback paths to check if detection fails (in order):
1. `C:/Program Files/Git/bin/bash.exe`
2. `C:/Program Files (x86)/Git/bin/bash.exe`
3. `%LOCALAPPDATA%/Programs/Git/bin/bash.exe`

**If Windows + path detected:** append to AGENTS.md:

```
---

## Shell policy (Windows)
Always execute commands via Git Bash:
`& "[DETECTED_PATH]" -lc "<command>"`
Do not use WSL bash (`bash ...`) directly.
```

**If Windows + path NOT detected:** append a generic policy:

```
---

## Shell policy (Windows)
Always execute commands via Git Bash. Locate bash.exe first:
`where bash`
Then execute: `& "[PATH_TO_BASH]" -lc "<command>"`
Do not use WSL bash (`bash ...`) directly.
```

**DO NOT rewrite or regenerate content -- READ CLAUDE.md and WRITE.**
**GEMINI.md = exact copy. AGENTS.md = exact copy + shell policy append.**

Verify all 3 files exist before proceeding:
- [ ] CLAUDE.md exists
- [ ] AGENTS.md exists (with shell policy section at the end)
- [ ] GEMINI.md exists

---

## STEP 8: Write .meta.json

**WRITE** `{{addpath:wiki/.meta.json}}`:

```json
{"updatedAt":"<ISO-8601 timestamp>","command":"init","gitHead":"<short-sha>"}
```

This command always performs a full generation, so `command` is `"init"`. `/add.wiki update`
(via `{{skill:add-wiki-maintenance/SKILL.md}}`) advances this same file with `"update"`.

**Verify the wiki path is tracked, not gitignored:**

```bash
git check-ignore .codeadd/wiki/index.md
```

If this returns a match (exit 0) → the wiki path IS gitignored. Warn loudly in the final
report — the per-page freshness/staleness model requires the corpus to be committed and
shared with the team. Do NOT silently continue as if unaffected.

---

## STEP 9: Report & Cleanup

**Report to user:**
Include: context files updated, apps analyzed with types, code quality scores, wiki areas/pages
generated, Backlog entries (if any), gitignore warning (if triggered), migration cleanup performed
(if any — STEP 5.4).

**Include hub navigation guidance (replaces pattern-search usage):**
```bash
# Start at the hub — the only entrypoint
cat .codeadd/wiki/index.md

# Search by topic across the wiki
grep -ril "<term>" .codeadd/wiki/

# Search by metadata (frontmatter descriptions/tags are the index)
grep -ri "<term>" .codeadd/wiki/**/*.md
```

**Next Steps:** Reference skill `add-ecosystem` Main Flows section for context-aware next command suggestion.

---

## OUTPUT NAMING CONVENTION (CRITICAL)

> **Domain pages use lowercase area type as filename, under `wiki/domains/`. Spine pages are fixed filenames at the wiki root.**

### Formula

```
.codeadd/wiki/domains/{area-type}.md                     # per-domain pages
.codeadd/wiki/{architecture,conventions,workflows}.md    # spine pages (fixed names)
.codeadd/wiki/index.md                                   # hub (fixed name)

Where:
- area-type = lowercase classification (backend, frontend, database, cli, worker)
```

### Examples

| Classification | Output File |
|----------------|-------------|
| backend | `{{addpath:wiki/domains/backend.md}}` |
| frontend | `{{addpath:wiki/domains/frontend.md}}` |
| database | `{{addpath:wiki/domains/database.md}}` |
| cli | `{{addpath:wiki/domains/cli.md}}` |
| worker | `{{addpath:wiki/domains/worker.md}}` |
| architecture (spine) | `{{addpath:wiki/architecture.md}}` |
| conventions (spine) | `{{addpath:wiki/conventions.md}}` |
| workflows (spine) | `{{addpath:wiki/workflows.md}}` |

**Special:** Code Quality → `docs/code-quality-review.md` (stays outside the wiki — a point-in-time report, not durable knowledge).

---

## Example: Monorepo with Mixed Apps

**Classification:**
```
apps/server  → backend (nestjs)    → backend-analyzer.md
apps/admin   → frontend (react)    → frontend-analyzer.md
apps/portal  → frontend (react)    → frontend-analyzer.md (same output: domains/frontend.md)
apps/cli     → cli (commander)     → generic template
libs/database → prisma             → database-analyzer.md
```

**Dispatch (6 parallel):**
```
backend-analyzer  → apps/server     → domains/backend.md
frontend-analyzer → apps/admin      → domains/frontend.md (includes admin + portal patterns)
generic template  → apps/cli        → domains/cli.md
database-analyzer → libs/database   → domains/database.md
spine-analyzer    → project-wide    → architecture.md, conventions.md, workflows.md
quality-analyzer  → project-wide    → docs/code-quality-review.md
```

**Note:** When multiple apps share the same type (e.g., apps/admin + apps/portal both frontend), the analyzer covers both in a single `domains/frontend.md` file. Its frontmatter `sources` lists all paths.

**Result:** `index.md` hub + 3 spine pages + 4 domain pages in `{{addpath:wiki/}}`, each with frontmatter (type/area/description/sources/commit/generated/tags) + TL;DR + TOC + topic-first ## chunks + Related footer. `.meta.json` written last, only on success.

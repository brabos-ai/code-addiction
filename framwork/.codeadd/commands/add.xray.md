# Architecture Analyzer

Discovery coordinator that dispatches specialized analyzer agents based on app classification. Does NOT analyze code itself - classifies apps, dispatches agents, and consolidates reports into a portable project-patterns skill.

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Self-Bootstrap           → READ skill FIRST
STEP 2: Run Discovery Script     → VERIFY output exists
STEP 3: Detect & Classify Apps   → BUILD dispatch plan
STEP 4: Dispatch Analyzers       → ALL IN PARALLEL
STEP 5: Consolidate Reports      → WAIT-ALL before proceeding
STEP 6: Generate SKILL.md Index  → CREATE project-patterns skill index
STEP 7: Update CLAUDE.md         → DISPATCH agent
STEP 8: Copy Context Files       → CLAUDE.md → AGENTS.md, GEMINI.md
STEP 9: Report & Cleanup         → SUMMARY + remove temp files
```


## Rules

ALWAYS:
- Classify apps using SKILL.md signals
- Dispatch all specialists in parallel
- Generate SKILL.md index with area list and search instructions
- Use context engineering format (frontmatter + TL;DR + TOC + topic-first ## chunks)
- Preserve coordinator/dispatcher pattern
- Clean up temp files last

NEVER:
- Analyze code yourself (coordinator only)
- Write area files directly (specialists do this)
- Execute specialists sequentially (run parallel)
- Skip SKILL.md index generation (STEP 6)
- Skip code quality analyzer (always run)
- Modify specialist agent prompts
- Generate area files without frontmatter + TL;DR

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
- `SpecialistRegistry` section → which analyzer to dispatch for each type
- `GenericAppTemplate` section → template for apps without specialist

**These sections contain the intelligence that drives classification and dispatch.**

---

## STEP 2: Run Discovery Script

**Execute:**
```bash
bash .codeadd/scripts/architecture-discover.sh
```

Verify `.codeadd/temp/architecture-discovery.md` exists.

**IF script doesn't exist:**

CREATE discovery document manually:

1. Detect project type (monorepo vs single-app) — check for `turbo.json`, `pnpm-workspace.yaml`, `nx.json`
2. Identify stack from `package.json` and `tsconfig.json`
3. Map directory structure: `apps/`, `packages/`, `libs/`
4. WRITE findings to `.codeadd/temp/architecture-discovery.md`

---

## STEP 3: Detect & Classify Apps

<!-- plugin:gitnexus:graph-classify -->
<!-- /plugin:gitnexus:graph-classify -->

### 3.1 Detect Apps

List all directories under `apps/`, `packages/`, `libs/`.

### 3.2 Classify Each App

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

### 3.3 Build Dispatch Plan

**Format:**
```
APPS_CLASSIFIED:
- apps/server    → backend   → backend-analyzer.md  → backend.md
- apps/admin     → frontend  → frontend-analyzer.md → frontend.md
- apps/cli       → cli       → generic template     → cli.md

CROSS-APP:
- libs/database detected → database-analyzer.md → database.md
```

### 3.4 Create Output Directory

```bash
mkdir -p .codeadd/skills/project-patterns
```

---

## STEP 4: Dispatch Specialist Analyzers (PARALLEL)

**DISPATCH ALL AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

### 4.1 Common Dispatch Pattern

<!-- plugin:gitnexus:graph-dispatch-common -->
<!-- /plugin:gitnexus:graph-dispatch-common -->

**For ALL analyzers** (app specialists + database + code quality):

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Context:** Read `.codeadd/temp/architecture-discovery.md`
- **Output format:** Each file includes YAML frontmatter + ## TL;DR + ## TOC (if >3 sections) + topic-first ## chunks with code examples (path:line refs)

**Common Rules (ALL analyzers):**
- No questions — use best judgment
- Document ONLY what EXISTS in code
- Include real code examples with path:line references
- Token-efficient format (context engineering compliant)
- Skip empty sections

### 4.2 App Specialists (with specialist: backend, frontend)

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
2. WRITE to .codeadd/skills/project-patterns/[TYPE].md
   - Frontmatter: area, generated, app-path, framework
   - Sections: ## TL;DR, ## TOC, then topic-first ## chunks
3. Return: FILE_WRITTEN, TYPE, FRAMEWORKS, PATTERNS_FOUND, TOPICS count

## OUTPUT
Write {{addpath:skills/project-patterns/[TYPE].md}}
```

### 4.3 App Generic Template (without specialist: cli, worker)

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
2. WRITE to .codeadd/skills/project-patterns/[TYPE].md
   - Frontmatter: area, generated, app-path, framework
   - Sections: App Nature, Structure, Entry Points, Dependencies, Configuration, Commands/Jobs
3. Return: FILE_WRITTEN, APP_PURPOSE, ENTRY_POINT, KEY_DEPENDENCIES, TOPICS count

## OUTPUT
Write {{addpath:skills/project-patterns/[TYPE].md}}
```

### 4.4 Database Analyzer (if detected)

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
2. If database found: WRITE to .codeadd/skills/project-patterns/database.md
3. If NO database: skip (do NOT write)
   - Frontmatter: area, generated, app-path, engine
4. Return: FILE_WRITTEN, STACK, PATTERNS_FOUND, TOPICS count

## OUTPUT
Write {{addpath:skills/project-patterns/database.md}} (or NONE)
```

### 4.5 Code Quality Analyzer (always)

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

**DISPATCH RULES:**
- RUN ALL analyzers IN PARALLEL
- Do NOT wait between dispatches
- Expect outputs: all app area files + database.md (if detected) + code-quality-review.md

---

## STEP 5: Consolidate Reports (WAIT-ALL Before Consolidation)

**WAIT-ALL:** Verify ALL agent outputs exist before proceeding.

**Gate Check Checklist:**
- [ ] All `{{addpath:skills/project-patterns/*.md}}` files exist (each app/database type)
- [ ] `docs/code-quality-review.md` exists
- [ ] All files contain expected sections (frontmatter, TL;DR, TOC, topic chunks)
- [ ] Topic counts confirmed per area file

**COLLECT reports:**
- Files written (list each area file)
- App classifications confirmed (type → framework)
- Frameworks/patterns discovered
- Code quality metrics
- Topic count per area

**Decision Point:**
- If ANY file missing or incomplete → Wait/retry. Do NOT proceed.
- If ALL outputs verified → Proceed to STEP 6.

---

## STEP 6: Generate SKILL.md Index

Create the skill index file that ties all area files together with search instructions.

**Backup existing file (if present):**
```bash
[ -f .codeadd/skills/project-patterns/SKILL.md ] && cp .codeadd/skills/project-patterns/SKILL.md .codeadd/skills/project-patterns/SKILL.md.backup
```

**WRITE** `{{addpath:skills/project-patterns/SKILL.md}}`:

```markdown
---
name: project-patterns
description: Project-specific development patterns extracted from codebase — use pattern-search.sh for JIT loading by area/topic
---

# Project Patterns

Portable skill with extractive development patterns discovered from this codebase. Each area file documents real patterns with code examples. Use pattern-search.sh for efficient topic lookup.

## Areas

| Area | File | Topics | Framework |
|------|------|--------|-----------|
[DYNAMICALLY LIST each area file with topic count and detected framework]

## How to Use

### List mapped areas
bash .codeadd/scripts/pattern-search.sh --list

### Search topics in an area
bash .codeadd/scripts/pattern-search.sh backend

### Search specific topic
bash .codeadd/scripts/pattern-search.sh backend logging

### Load a specific pattern (JIT)
1. Run pattern-search.sh [area] [topic] → get LINES range
2. Read .codeadd/skills/project-patterns/[area].md offset:START limit:LENGTH

## Format Convention

Each area file follows context engineering principles:
- YAML frontmatter (area, generated, app-path, framework)
- ## TL;DR (extractive — what the doc is, why it exists, headline outcome; stop when those three are covered)
- ## TOC (flat anchor list)
- ## [Topic] chunks (topic sentence first, then extractive content; 1 code example with path:line; split by sub-heading when a chunk grows past a natural boundary)

## Generated

[DATE] by /add.xray
```

**Populate the Areas table dynamically** from the files written in STEP 4.

**Verify:** Check that SKILL.md exists and contains Areas table before proceeding.

---

## STEP 7: Update CLAUDE.md

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
1. .codeadd/temp/architecture-discovery.md
2. ALL files in .codeadd/skills/project-patterns/*.md (list dynamically)

## TASK
Update CLAUDE.md with ONLY these sections:

1. **## Architecture Contract** — Apps table (`app | kind | path | entry`) + layer hierarchy rule + import rules (compact JSON)
2. **## Technical Spec** — compact JSON only, one object per line, max 10 words per value
3. **## Implementation Patterns** — pointer to project-patterns skill only (no inline patterns)

## CONSTRAINTS (from add-claude-md-style skill)
Target: 80-150 lines total.

DO NOT include:
- Frontend/backend/database patterns (already in project-patterns skill)
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
- Implementation Patterns section = pointer block only (no inline content)

## REPORT FORMAT
Return summary:
- CLAUDE_MD_UPDATED: YES
- TOTAL_LINES: [count]
- SECTIONS_UPDATED: [list]
- AREAS_REFERENCED: [list area files]
```

- **Output:** Update `CLAUDE.md`

WAIT: Do NOT proceed until CLAUDE.md has been updated.

---

## STEP 8: Copy Context Files to Other Engines

**Coordinator action (no subagent needed).**

**AFTER CLAUDE.md is confirmed updated:**

### 8.1 Copy to GEMINI.md

GEMINI.md ← identical copy of CLAUDE.md.

### 8.2 Copy to AGENTS.md

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

## STEP 9: Report & Cleanup

**Report to user:**
Include: context files updated, apps analyzed with types, files generated, code quality scores, areas mapped in project-patterns skill, topic count.

**Include pattern-search usage example:**
```bash
# See what areas were mapped
bash .codeadd/scripts/pattern-search.sh --list

# Explore backend patterns
bash .codeadd/scripts/pattern-search.sh backend
```

**Next Steps:** Reference skill `add-ecosystem` Main Flows section for context-aware next command suggestion.

**Cleanup temp files:**
```bash
rm .codeadd/temp/architecture-discovery.md 2>/dev/null || true
```


## OUTPUT NAMING CONVENTION (CRITICAL)

> **Area files in project-patterns skill use lowercase area type as filename.**

### Formula

```
.codeadd/skills/project-patterns/{area-type}.md

Where:
- area-type = lowercase classification (backend, frontend, database, cli, worker)
```

### Examples

| Classification | Output File |
|----------------|-------------|
| backend | `{{addpath:skills/project-patterns/backend.md}}` |
| frontend | `{{addpath:skills/project-patterns/frontend.md}}` |
| database | `{{addpath:skills/project-patterns/database.md}}` |
| cli | `{{addpath:skills/project-patterns/cli.md}}` |
| worker | `{{addpath:skills/project-patterns/worker.md}}` |

**Special:** Code Quality → `docs/code-quality-review.md` (not in project-patterns skill).

---

## Example: Monorepo with Mixed Apps

**Classification:**
```
apps/server  → backend (nestjs)    → backend-analyzer.md
apps/admin   → frontend (react)    → frontend-analyzer.md
apps/portal  → frontend (react)    → frontend-analyzer.md (same output: frontend.md)
apps/cli     → cli (commander)     → generic template
libs/database → prisma             → database-analyzer.md
```

**Dispatch (5 parallel + 1 quality):**
```
backend-analyzer  → apps/server     → backend.md
frontend-analyzer → apps/admin      → frontend.md (includes admin + portal patterns)
generic template  → apps/cli        → cli.md
database-analyzer → libs/database   → database.md
quality-analyzer  → project-wide    → docs/code-quality-review.md
```

**Note:** When multiple apps share the same type (e.g., apps/admin + apps/portal both frontend), the analyzer covers both in a single frontend.md file. The frontmatter `app-path` lists all paths.

**Result:** SKILL.md index + 4 area files in `{{addpath:skills/project-patterns/}}`, each with frontmatter + TL;DR + TOC + topic-first ## chunks.

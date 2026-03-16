# Architecture Analyzer

Discovery coordinator that dispatches specialized analyzer agents based on app classification. Does NOT analyze code itself - classifies apps, dispatches agents, and consolidates reports.

> **KEY PRINCIPLE**: Classification drives dispatch. SKILL.md contains the intelligence. Coordinator only orchestrates.

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## Spec

```json
{"specialists":{"backend":"backend-analyzer.md","frontend":"frontend-analyzer.md","database":"database-analyzer.md","code_quality":"code-quality-analyzer.md","generic":"GenericAppTemplate"},"outputs":{".codeadd/project":"APP-*.md|LIB-*.md","docs":"code-quality-review.md","root":"CLAUDE.md|AGENTS.md|GEMINI.md"}}
```

---

## Rules

ALWAYS:
- Classify apps using SKILL.md signals
- Dispatch all specialists in parallel
- Use actual directory names in output files
- Preserve all agent prompt templates
- Preserve coordinator/dispatcher pattern
- Clean up temp files last

NEVER:
- Analyze code yourself (coordinator only)
- Write pattern files directly (specialists do this)
- Translate directory names in output files
- Execute specialists sequentially (run parallel)
- Skip database analyzer if database detected
- Skip code quality analyzer (always run)
- Modify specialist agent prompts
- Add or remove functionality

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

Read `.codeadd/skills/add-architecture-discovery/SKILL.md`.

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
- apps/server    → backend   → backend-analyzer.md  → APP-SERVER.md
- apps/admin     → frontend  → frontend-analyzer.md → APP-ADMIN.md
- apps/cli       → cli       → generic template     → APP-CLI.md

CROSS-APP:
- libs/database detected → database-analyzer.md → LIB-DATABASE.md
```

**CRITICAL: Use actual directory names in UPPERCASE:**
- `apps/backend` → `APP-BACKEND.md` (NOT `SERVER.md`)
- `apps/server` → `APP-SERVER.md` (NOT `BACKEND.md`)
- `apps/web-client` → `APP-WEB-CLIENT.md` (NOT `FRONTEND.md`)
- `libs/database` → `LIB-DATABASE.md`

---

## STEP 4: Dispatch Specialist Analyzers (PARALLEL)

**DISPATCH ALL AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

### 4.1 For Apps WITH Specialist (backend, frontend)

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are analyzing: [APP_NAME] at [APP_PATH]
Classification: [TYPE]

## SELF-BOOTSTRAP
Read: .codeadd/skills/add-architecture-discovery/[TYPE]-analyzer.md
Follow ALL instructions in that file.

## CONTEXT
Read: .codeadd/temp/architecture-discovery.md

## TASK
1. Analyze ONLY the app at: [APP_PATH]
2. Follow skill instructions for [TYPE] patterns
3. WRITE file to .codeadd/project/[PREFIX]-[DIR_NAME].md
   - PREFIX = APP (if in apps/) or LIB (if in libs/packages/)
   - DIR_NAME = actual directory name in UPPERCASE

## RULES
- No questions - use best judgment
- Document ONLY what EXISTS in code
- Include real code examples
- Token-efficient format

## REPORT FORMAT
Return summary:
- FILE_WRITTEN: .codeadd/project/[PREFIX]-[DIR_NAME].md (or NONE)
- TYPE: [TYPE]
- FRAMEWORKS: [discovered]
- PATTERNS_FOUND: [list]
```

- **Output:** Write `.codeadd/project/[PREFIX]-[DIR_NAME].md`

### 4.2 For Apps WITHOUT Specialist (cli, worker, generic)

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are analyzing: [APP_NAME] at [APP_PATH]
Classification: [TYPE] (no specialist - use generic template)

## SELF-BOOTSTRAP
Read: .codeadd/skills/add-architecture-discovery/SKILL.md
Focus on: GenericAppTemplate section

## CONTEXT
Read: .codeadd/temp/architecture-discovery.md

## TASK
1. Analyze ONLY the app at: [APP_PATH]
2. DISCOVER what this app does (don't assume from name)
3. Document using GenericAppTemplate sections:
   - App Nature (discovered)
   - Structure
   - Entry Points
   - Dependencies
   - Configuration
   - Commands/Jobs (if applicable)
4. WRITE file to .codeadd/project/[PREFIX]-[DIR_NAME].md
   - PREFIX = APP (if in apps/) or LIB (if in libs/packages/)
   - DIR_NAME = actual directory name in UPPERCASE

## RULES
- No questions - use best judgment
- Discover via CODE, not folder name
- Include real code examples
- Skip empty sections

## REPORT FORMAT
Return summary:
- FILE_WRITTEN: .codeadd/project/[PREFIX]-[DIR_NAME].md (or NONE)
- APP_PURPOSE: [discovered]
- ENTRY_POINT: [path]
- KEY_DEPENDENCIES: [list]
```

- **Output:** Write `.codeadd/project/[PREFIX]-[DIR_NAME].md`

### 4.3 Database Analyzer (Cross-App, Always Run if Detected)

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are the DATABASE ANALYZER for project discovery.

## SELF-BOOTSTRAP
Read: .codeadd/skills/add-architecture-discovery/database-analyzer.md
Follow ALL instructions in that file.

## CONTEXT
Read: .codeadd/temp/architecture-discovery.md

## TASK
1. Analyze database patterns across the project
2. If database found in a lib (e.g., libs/database): WRITE file to .codeadd/project/LIB-[DIR_NAME].md
3. If database is cross-app without dedicated lib: WRITE file to .codeadd/project/LIB-DATABASE.md
4. If NO database found: Do NOT write any file

## RULES
- No questions - use best judgment
- Document ONLY what EXISTS
- Do NOT document schema (dynamic)
- Token-efficient format

## REPORT FORMAT
Return summary:
- FILE_WRITTEN: .codeadd/project/LIB-[DIR_NAME].md (or NONE)
- STACK: [engine + ORM + migrations]
- PATTERNS_FOUND: [list]
```

- **Output:** Write `.codeadd/project/LIB-[DIR_NAME].md`

### 4.4 Code Quality Analyzer (Always Run)

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are the CODE QUALITY ANALYZER for project discovery.

## SELF-BOOTSTRAP
Read: .codeadd/skills/add-architecture-discovery/code-quality-analyzer.md
Follow ALL instructions in that file.

## CONTEXT
Read: .codeadd/temp/architecture-discovery.md

## TASK
1. Analyze code quality across the project
2. WRITE file to docs/code-quality-review.md

## RULES
- No questions - use best judgment
- Analyze actual code, not just config
- Focus on real issues found

## REPORT FORMAT
Return summary:
- FILE_WRITTEN: docs/code-quality-review.md
- SOLID_SCORE: [assessment]
- CLEAN_CODE_SCORE: [assessment]
- TECH_DEBT: [high/medium/low]
- TOP_ISSUES: [list top 3]
```

- **Output:** Write `docs/code-quality-review.md`

**DISPATCH RULES:**
- RUN ALL app analyzers IN PARALLEL
- Database analyzer runs in same batch (parallel)
- Code quality analyzer runs in same batch (parallel)

---

## STEP 5: Consolidate Reports (WAIT-ALL Before Consolidation)

**WAIT-ALL:** Verify ALL agent outputs exist before proceeding.
- [ ] All `.codeadd/project/*.md` files written by specialist agents
- [ ] `docs/code-quality-review.md` written by code quality agent

**COLLECT reports:**
- Files written (`.codeadd/project/*.md`)
- App classifications confirmed
- Frameworks/patterns per app
- Code quality metrics

**GATE CHECK: All agent outputs exist?**
- If NO → Wait. Do NOT proceed to STEP 6.
- If YES → Proceed to STEP 6.

---

## STEP 6: Update CLAUDE.md

**DISPATCH AGENT:**
- **Capability:** read-write (must update CLAUDE.md)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are the CONTEXT FILES UPDATER.

## SELF-BOOTSTRAP
Read: .codeadd/skills/add-architecture-discovery/SKILL.md
Follow OUTPUT FORMAT and TEMPLATE sections.

## INPUTS TO READ
1. .codeadd/temp/architecture-discovery.md
2. ALL files in .codeadd/project/*.md (list dynamically)

## TASK
Update CLAUDE.md with:

1. **## Architecture Contract** section
2. **## Technical Spec** section
3. **## Implementation Patterns** section (list all .codeadd/project/*.md)

## OUTPUT FORMAT
- JSON minified one-line
- Max 10 words per description
- List ALL .codeadd/project/*.md dynamically

## REPORT FORMAT
Return summary:
- CLAUDE_MD_UPDATED: YES
- SECTIONS_UPDATED: [list]
- PATTERNS_REFERENCED: [list .codeadd/project/*.md files]
```

- **Output:** Update `CLAUDE.md`

WAIT: Do NOT proceed until CLAUDE.md has been updated.

---

## STEP 7: Copy Context Files to Other Engines

**Coordinator action (no subagent needed).**

**AFTER CLAUDE.md is confirmed updated, copy to engine-specific context files (replace if exists):**

1. **GEMINI.md** ← Identical copy of CLAUDE.md
2. **AGENTS.md** ← Copy of CLAUDE.md + APPEND the following section at the end:

```
---

## Shell policy (Windows)
Always execute commands via Git Bash:
`& "C:\Program Files\Git\bin\bash.exe" -lc "<command>"`
Do not use WSL bash (`bash ...`) directly.
```

**DO NOT rewrite or regenerate content -- READ CLAUDE.md and WRITE.**
**GEMINI.md = exact copy. AGENTS.md = exact copy + shell policy append.**

Verify all 3 files exist before proceeding:
- [ ] CLAUDE.md exists
- [ ] AGENTS.md exists (with shell policy section at the end)
- [ ] GEMINI.md exists

---

## STEP 8: Report to User

Report to user including: context files updated, apps analyzed with types, files generated, code quality scores, next steps.

**Next Steps:** Reference `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows section for context-aware next command suggestion.

---

## STEP 9: Cleanup (FINAL)

**Execute:**
```bash
rm .codeadd/temp/architecture-discovery.md 2>/dev/null || true
```

---

## OUTPUT NAMING CONVENTION (CRITICAL)

> **File names MUST reflect the actual project structure, not semantic translations.**

### Formula

```
{PREFIX}-{DIRECTORY-NAME}.md

Where:
- PREFIX = APP (if in apps/) | LIB (if in libs/ or packages/)
- DIRECTORY-NAME = exact directory name in UPPERCASE
```

### Examples

| Actual Path | Output File |
|-------------|-------------|
| `apps/backend` | `APP-BACKEND.md` |
| `apps/server` | `APP-SERVER.md` |
| `apps/web-client` | `APP-WEB-CLIENT.md` |
| `libs/database` | `LIB-DATABASE.md` |
| `libs/shared-utils` | `LIB-SHARED-UTILS.md` |
| `packages/core` | `LIB-CORE.md` |

**Special:** Database cross-app → `LIB-DATABASE.md` or based on actual lib path. Code Quality → `docs/code-quality-review.md`.

**NEVER translate names:** `apps/backend` → `APP-BACKEND.md`, NOT `SERVER.md`

---

## Example: Monorepo with Mixed Apps

**Classification:**
```
apps/server  → backend (nestjs)    → backend-analyzer.md
apps/admin   → frontend (react)    → frontend-analyzer.md
apps/portal  → frontend (react)    → frontend-analyzer.md
apps/cli     → cli (commander)     → generic template
apps/site    → frontend (next)     → frontend-analyzer.md
libs/database → prisma             → database-analyzer.md
```

**Dispatch (6 parallel):**
```
backend-analyzer  → apps/server   → APP-SERVER.md
frontend-analyzer → apps/admin    → APP-ADMIN.md
frontend-analyzer → apps/portal   → APP-PORTAL.md
generic template  → apps/cli      → APP-CLI.md
frontend-analyzer → apps/site     → APP-SITE.md
database-analyzer → libs/database → LIB-DATABASE.md
```

**Result:** 6 pattern files, each named after actual project structure.

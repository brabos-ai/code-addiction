# ADD Sync - Ecosystem Consistency Validator

> **LANG:** PT-BR (texto) | EN (codigo, git)
> **OUTPUT:** Console report + ecosystem map regeneration

Scans the entire ADD framework ecosystem, validates consistency between commands/skills/wrappers across all providers, and regenerates the ecosystem map from real data.

**Run before `/add.release` to ensure ecosystem is consistent.**

---

## Spec

```json
{"role":"ecosystem-validator","gates":["scan_complete","cross_ref_done","dry_run_check"],"order":["scan","cross_reference","validate_providers","detect_inconsistencies","regenerate_map","auto_fix_wrappers","report"],"output":{"map":"framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md","wrappers":"framwork/.claude/commands/ + framwork/.agent/workflows/ + framwork/.agents/skills/"},"modes":{"full":"STEP 1-7","dry-run":"STEP 1-4 + STEP 7 (no writes)","map-only":"STEP 1-2 + STEP 5 + STEP 7"}}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Scan ecosystem          -> Read ALL dirs in framwork/
STEP 2: Build cross-reference   -> Map commands <-> skills dependencies
STEP 3: Validate providers      -> Check wrapper parity across providers
STEP 4: Detect inconsistencies  -> Orphans, missing context, gaps
STEP 5: Regenerate ecosystem map -> Rewrite SKILL.md from scan data
STEP 6: Auto-fix wrappers       -> Create missing provider wrappers
STEP 7: Report                  -> Console output with all findings
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF SCAN NOT COMPLETE:
  ⛔ DO NOT USE: Write on any file
  ⛔ DO NOT USE: Edit on any file
  ⛔ DO NOT: Generate report or map
  ✅ DO: Complete scan of all directories first

IF CROSS-REFERENCE NOT DONE:
  ⛔ DO NOT USE: Write on ecosystem map
  ⛔ DO NOT: Report inconsistencies
  ✅ DO: Complete dependency analysis first

IF MODE IS --dry-run:
  ⛔ DO NOT USE: Write on ANY file
  ⛔ DO NOT USE: Edit on ANY file
  ⛔ DO NOT: Create wrappers
  ⛔ DO NOT: Modify ecosystem map
  ✅ DO: Report only (console output)

ALWAYS:
  ⛔ DO NOT: Modify commands (only ecosystem map + wrappers)
  ⛔ DO NOT: Modify skills content (only ecosystem map)
  ⛔ DO NOT: Modify scripts
  ⛔ DO NOT: Create branches or commits
  ⛔ DO NOT: Run build/test commands
```

---

## Mode Detection

```
/add.sync              -> Full mode (STEP 1-7)
/add.sync --dry-run    -> Scan + report only (STEP 1-4 + STEP 7)
/add.sync --map-only   -> Regenerate map only (STEP 1-2 + STEP 5 + STEP 7)
```

---

## STEP 1: Scan Ecosystem (MANDATORY FIRST)

### 1.1 Scan Command Directories

**Read ALL files in these directories:**

```
framwork/.codeadd/commands/*.md    -> CodeADD commands (SOURCE OF TRUTH)
framwork/.claude/commands/*.md     -> Claude wrappers
framwork/.agent/workflows/*.md     -> Agent wrappers
```

**For EACH command file in `.codeadd/commands/`:**

1. Extract filename (e.g., `add.new.md`)
2. Read first 5 lines to get name and description
3. Search file content for skill references:
   - Grep for `.codeadd/skills/` paths
   - Grep for `SKILL.md` mentions
   - Grep for skill names in `skills:` JSON fields or "MANDATORY" sections
4. Search for `owner.md` reference (for consistency check)
5. Search for `feature-status.sh` reference (for consistency check)
6. Search for `product.md` reference (for consistency check)
7. Search for `code-addiction-ecosystem` reference (for next-steps check)
8. Search for `--yolo` support (for yolo check)

**Store as:**

```json
{
  "name": "add.new",
  "description": "Feature Discovery & Documentation",
  "skills_referenced": ["feature-discovery", "feature-specification", "documentation-style"],
  "has_owner_md": true,
  "has_feature_status": false,
  "has_product_md": false,
  "has_ecosystem_next_steps": false,
  "has_yolo": false
}
```

### 1.2 Scan Skill Directories

**Read ALL SKILL.md files in:**

```
framwork/.codeadd/skills/*/SKILL.md    -> CodeADD skills (SOURCE OF TRUTH)
framwork/.agents/skills/*/SKILL.md     -> Agent skill wrappers
framwork/.claude/skills/*/SKILL.md     -> Claude skill wrappers (if any)
```

**For EACH skill in `.codeadd/skills/`:**

1. Extract directory name (e.g., `backend-development`)
2. Read first 10 lines for name and description from frontmatter
3. Search for `## When to Use` or `Usada por` to identify which commands use it

**Store as:**

```json
{
  "name": "backend-development",
  "description": "Patterns NestJS, Clean Arch, DI, DTOs",
  "referenced_by_commands": []
}
```

### 1.3 Scan Scripts

**Read directory listing:**

```
framwork/.codeadd/scripts/*
```

**For EACH script:**

1. Extract filename
2. Read first 5 lines for description comment

### 1.4 Scan Templates

```
framwork/.codeadd/templates/*
```

**Mark scan as COMPLETE.**

---

## STEP 2: Build Cross-Reference Map

### 2.1 Commands -> Skills

For EACH command from STEP 1.1, populate `skills_referenced` by matching:
- Explicit paths: `.codeadd/skills/[name]/SKILL.md`
- Skill names mentioned in Spec JSON: `"skills":{"mandatory":"..."}`
- Skill names in text: `Load [skill-name] skill`

### 2.2 Skills -> Commands (reverse mapping)

For EACH skill from STEP 1.2, populate `referenced_by_commands`:
- Which commands reference this skill (from 2.1)?
- If `referenced_by_commands` is empty -> mark as **ORPHAN**

### 2.3 Compare with Current Ecosystem Map

Read existing `framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md`.

Identify DRIFT:
- Commands in map but NOT on disk -> **REMOVED** (map is stale)
- Commands on disk but NOT in map -> **MISSING** (map incomplete)
- Skills in map but NOT on disk -> **REMOVED**
- Skills on disk but NOT in map -> **MISSING**
- Skill references in map that differ from scan -> **CHANGED**

**Mark cross-reference as COMPLETE.**

---

## STEP 3: Validate Provider Parity

### 3.1 Command Wrappers

For EACH command in `framwork/.codeadd/commands/`:

| Check | Source | Expected Wrapper |
|-------|--------|-----------------|
| Claude | `.codeadd/commands/add-X.md` | `.claude/commands/add-X.md` |
| Agent | `.codeadd/commands/add-X.md` | `.agent/workflows/add-X.md` |

**Classify each:**
- `OK` - wrapper exists
- `MISSING` - wrapper does not exist
- `EXTRA` - wrapper exists but no source command (orphan wrapper)

### 3.2 Skill Wrappers

For EACH skill in `framwork/.codeadd/skills/`:

| Check | Source | Expected Wrapper |
|-------|--------|-----------------|
| Agent | `.codeadd/skills/X/SKILL.md` | `.agents/skills/X/SKILL.md` |

**Classify:** `OK` / `MISSING` / `EXTRA`

### 3.3 Validate Wrapper Content

For EACH existing wrapper, verify it follows the delegation pattern:

```markdown
---
description: [description]
---

⚠️ **Wrapper:** Command source in `.codeadd/commands/[name].md`

Read and execute `.codeadd/commands/[name].md`.
```

If wrapper content does NOT delegate to `.codeadd/` source -> flag as **BROKEN**

---

## STEP 4: Detect Inconsistencies

### 4.1 Orphan Skills

Skills with `referenced_by_commands == []`:

```
[ORPHAN] skill-name: not referenced by any command
```

### 4.2 Missing Context Loading

For EACH command in `.codeadd/commands/`, check:

| Check | Expected | If Missing |
|-------|----------|------------|
| `owner.md` | ALL commands | `[WARN] add-X: does not load owner.md` |
| `feature-status.sh` | Commands that operate on features* | `[WARN] add-X: does not use feature-status.sh` |
| `product.md` | `add.new` only | `[WARN] add.new: does not load product.md` |
| `code-addiction-ecosystem` at completion | ALL commands with completion step | `[WARN] add-X: no next-steps suggestion` |

*Feature-operating commands: `add.new`, `add.design`, `add.plan`, `add.build`, `add.autopilot`, `add.check`, `add.ship`, `add.test`, `add.hotfix`, `add.brainstorm`, `add.ux`, `add.pr`

### 4.3 Phantom References

Skills referenced by commands but NOT found on disk:

```
[ERROR] add-X references skill "phantom-skill" but framwork/.codeadd/skills/phantom-skill/SKILL.md does not exist
```

### 4.4 Summary Counts

```
Total commands: X
Total skills: Y
Total scripts: Z
Orphan skills: N
Missing wrappers: N
Broken wrappers: N
Missing context loading: N
Phantom references: N
```

---

## STEP 5: Regenerate Ecosystem Map

**⛔ SKIP if `--dry-run` mode.**

### 5.1 Read Current Map

```
Read framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md
```

### 5.2 Generate New Map from Scan Data

**Use the SAME format as the existing map.** Preserve structure:

```markdown
---
name: code-addiction-ecosystem
description: Visao consolidada do add-pro - commands, skills, relacoes e dependencias. Carregada pelo /add como source of truth.
---

# Ecosystem Map - add-pro

> **Source of Truth:** Mapa completo do ecossistema add-pro.

## Commands

| Command | Proposito | Skills que carrega |
|---------|-----------|-------------------|
[Generated from scan - sorted alphabetically]

## Skills add-pro

| Skill | Proposito | Usada por |
|-------|-----------|-----------|
[Generated from scan + cross-reference - sorted alphabetically]

## Dependency Index

| Se modificar... | Impacta... |
|-----------------|------------|
[Generated from cross-reference - only skills used by 2+ commands]

## Main Flows

[PRESERVE existing flows section - do not regenerate]

## Last Updated

YYYY-MM-DD - sync: regenerated ecosystem map via /add.sync
[PRESERVE previous entries below]
```

### 5.3 Show Diff

Before writing, show what changed:

```
## Ecosystem Map Changes

### Commands
- [ADDED] add.copy: SaaS copy generator (skills: saas-copy)
- [REMOVED] add-update: no longer exists on disk
- [CHANGED] add.build: skills updated (removed stripe reference)

### Skills
- [ADDED] saas-copy: SaaS copy framework
- [REMOVED] dev-environment-setup: deleted
- [REMOVED] using-git-worktrees: deleted

### Dependencies
- [ADDED] saas-copy -> add.copy
- [REMOVED] stripe -> add.build
```

### 5.4 Write Updated Map

Write the regenerated map to:

```
framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md
```

---

## STEP 6: Auto-Fix Wrappers

**⛔ SKIP if `--dry-run` mode.**
**⛔ SKIP if `--map-only` mode.**

### 6.1 Create Missing Command Wrappers

For EACH `MISSING` wrapper identified in STEP 3:

**Claude wrapper template** (`framwork/.claude/commands/add-X.md`):

```markdown
---
description: [description from source command]
---

⚠️ **Wrapper:** Command source in `.codeadd/commands/add-X.md`

Read and execute `.codeadd/commands/add-X.md`.
```

**Agent workflow template** (`framwork/.agent/workflows/add-X.md`):

```markdown
---
description: [description from source command]
---

⚠️ **Wrapper:** Command source in `.codeadd/commands/add-X.md`

Read and execute `.codeadd/commands/add-X.md`.
```

### 6.2 Create Missing Skill Wrappers

For EACH `MISSING` skill wrapper in STEP 3:

**Agent skill template** (`framwork/.agents/skills/add-X/SKILL.md`):

```markdown
---
description: [description from source skill]
---

⚠️ **Wrapper:** Skill source in `.codeadd/skills/[name]/SKILL.md`

Read and apply `.codeadd/skills/[name]/SKILL.md`.
```

### 6.3 Remove Extra Wrappers

For EACH `EXTRA` wrapper (no source):

```
[WARN] Extra wrapper found: framwork/.claude/commands/add-X.md (no source in .codeadd/)
→ Manual review recommended. Not auto-deleted.
```

**⛔ DO NOT auto-delete.** Only warn. User decides.

---

## STEP 7: Report

### Console Report Format

```markdown
## Ecosystem Sync Report

**Mode:** [full | dry-run | map-only]
**Date:** YYYY-MM-DD

---

### Ecosystem Map
- [UPDATED] code-addiction-ecosystem/SKILL.md
  - Added: [list of new entries]
  - Removed: [list of removed entries]
  - Changed: [list of changed entries]
- [NO CHANGES] (if nothing changed)
- [SKIPPED] (if --dry-run)

### Provider Parity
- Commands: [X/Y] have Claude wrappers, [X/Y] have Agent workflows
- Skills: [X/Y] have Agent skill wrappers

| Status | Type | Name | Action |
|--------|------|------|--------|
| [MISSING] | Claude wrapper | add-X | [CREATED] or [DRY-RUN] |
| [MISSING] | Agent workflow | add-X | [CREATED] or [DRY-RUN] |
| [EXTRA] | Claude wrapper | add-X | Manual review |
| [OK] | All | add.new | - |

### Orphan Skills
- [WARN] skill-name: not referenced by any command
- [NONE] (if all skills have references)

### Context Loading Gaps
- [WARN] add-X: does not load owner.md
- [WARN] add-X: does not use feature-status.sh
- [NONE] (if all consistent)

### Phantom References
- [ERROR] add-X references "phantom-skill" (not found on disk)
- [NONE] (if all references valid)

---

### Summary
| Metric | Count |
|--------|-------|
| Commands (source) | X |
| Skills (source) | Y |
| Scripts | Z |
| Templates | W |
| Wrapper parity issues | N |
| Orphan skills | N |
| Context gaps | N |
| Phantom references | N |
| **Auto-fixed** | N |
| **Requires manual attention** | N |
```

---

## Rules

```json
{"do":["Scan ALL provider directories before any analysis","Cross-reference commands with skills bidirectionally","Validate wrapper content matches delegation pattern","Show diff before writing ecosystem map","Preserve Main Flows section from existing map","Create wrappers using exact existing template pattern","Report EXTRA wrappers as warnings (do not delete)","Include date in Last Updated with action description"],"dont":["Modify command files (only map + wrappers)","Modify skill content files (only ecosystem map entry)","Delete any files (only create and update)","Write anything in --dry-run mode","Skip scanning any provider directory","Assume map is correct without comparing to disk","Auto-delete orphan wrappers"]}
```

# ADD Sync - Ecosystem Documentation Updater

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Computes diff since last release, regenerates the ecosystem map, dispatches 4 analyzer agents in parallel, and applies all documentation updates as a single writer. Leaves changes uncommitted for human review.

**Run before `/add.release` to ensure all public documentation is consistent.**

---

## Spec

```json
{"outputs":{"ecosystem_map":"framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md","reports":".tmp/sync/*.json","targets":["README.md","web/src/pages/docs.astro","web/src/pages/index.astro","web/public/*.svg"]},"payload":".tmp/sync/change-payload.json"}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Compute Change Payload    → git diff LAST_TAG..HEAD + ecosystem scan + inconsistency check
STEP 2: Regenerate Ecosystem Map  → deterministic from scan data (no agent)
STEP 3: Dispatch 4 Analyzer Agents → READ-ONLY, PARALLEL, each writes report to .tmp/sync/
STEP 4: Apply Edits               → coordinator reads all reports, applies via Edit tool (single writer)
STEP 5: Final Report              → files modified, [MANUAL] items, log iteration
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF CHANGE PAYLOAD NOT BUILT (STEP 1 not complete):
  ⛔ DO NOT USE: Write on any documentation file
  ⛔ DO NOT USE: Edit on any documentation file
  ⛔ DO NOT: Dispatch any agent
  ✅ DO: Complete STEP 1 first

IF AGENT REPORTS NOT ALL RECEIVED (STEP 3 not complete):
  ⛔ DO NOT USE: Edit on README.md, docs.astro, index.astro, or *.svg
  ⛔ DO NOT USE: Write on README.md, docs.astro, index.astro, or *.svg
  ⛔ DO NOT: Apply any edits
  ✅ DO: Wait for all 4 report files to exist in .tmp/sync/

ALWAYS:
  ⛔ DO NOT USE: Write on framwork/.codeadd/commands/ or framwork/.codeadd/skills/ (except ecosystem map in STEP 2)
  ⛔ DO NOT USE: Edit on framwork/.codeadd/commands/
  ⛔ DO NOT USE: Write on provider directories (framwork/.claude/, framwork/.agent/, framwork/.agents/, etc.)
  ⛔ DO NOT: Create commits or stage any files
  ⛔ DO NOT: Let agents apply edits directly — coordinator is the sole writer
```

---

## STEP 1: Compute Change Payload

### 1.1 Get Last Release Tag

Execute:
```bash
git fetch --tags
git tag --sort=-v:refname | head -1
```
**CRITICAL:** Without `git fetch --tags`, remote tags are invisible locally — command will compute wrong diff.

Store as `LAST_TAG`. If no tags exist, use the initial commit hash.

### 1.2 Get Changed Files Since Last Release

Diff `LAST_TAG..HEAD` to get list of changed file paths. Store as `CHANGED_FILES`.

### 1.3 Scan Current Ecosystem

Scan these directories and extract metadata from each file:

- `framwork/.codeadd/commands/*.md` → name + description (first lines / frontmatter)
- `framwork/.codeadd/skills/*/SKILL.md` → name + description + which commands reference each skill
- `framwork/.codeadd/scripts/*` → script names
- `framwork/` top-level dirs → provider names

### 1.4 Detect Changes vs LAST_TAG

For each path in `framwork/.codeadd/commands/` and `framwork/.codeadd/skills/`:

- File NOT present at `LAST_TAG` but present now → **ADDED**
- File present at `LAST_TAG` but NOT present now → **REMOVED**
- File present at both, description changed → **DESCRIPTION_CHANGED**
- File present at both, slug/name changed → **RENAMED**

Check presence at LAST_TAG: `git show LAST_TAG:<path>` (error = not present at that tag).

For providers: compare `framwork/` top-level dirs now vs at LAST_TAG.
For CLI: check if `CHANGED_FILES` includes `cli/` paths.
For flows: check if README.md "Main Flows" section appears in `CHANGED_FILES`.
For repo structure: check if new top-level dirs appeared in `CHANGED_FILES`.

### 1.5 Detect Ecosystem Inconsistencies

From scan data in STEP 1.3:

- **Orphan skills:** skills with no command referencing them
- **Phantom references:** commands referencing skills not found on disk

Store as `consistency_issues`.

### 1.6 Build and Write Change Payload

Write `.tmp/sync/change-payload.json` (create `.tmp/sync/` dir if needed):

```json
{
  "last_tag": "LAST_TAG",
  "diff_range": "LAST_TAG..HEAD",
  "commands": {
    "added": [{"name": "add.X", "description": "..."}],
    "removed": [{"name": "add.Y"}],
    "renamed": [{"from": "add.old", "to": "add.new", "description": "..."}],
    "description_changed": [{"name": "add.Z", "old_description": "...", "new_description": "..."}]
  },
  "skills": {
    "added": [{"name": "add-X", "description": "..."}],
    "removed": [{"name": "add-Y"}],
    "description_changed": [{"name": "add-Z", "old_description": "...", "new_description": "..."}]
  },
  "providers": {"added": [], "removed": []},
  "flows": {"changed": false},
  "cli": {"changed": false},
  "scripts": {"added": [], "removed": []},
  "repo_structure_changed": false
}
```

**Mark Change Payload as BUILT.**

If ALL dimensions are empty (no changes since last release) → inform user, STOP. Nothing to sync.

---

## STEP 2: Regenerate Ecosystem Map

Regenerate `framwork/.codeadd/skills/code-addiction-ecosystem/SKILL.md` from STEP 1.3 scan data.

Use the EXACT same format as the existing map:

```
## Commands — table: name | purpose | skills loaded (sorted alphabetically)
## Skills — table: name | purpose | used by (sorted alphabetically)
## Dependency Index — table: skills used by 2+ commands only
## Main Flows — PRESERVE from current file, do NOT regenerate
## Command Next-Steps Routing — PRESERVE from current file, do NOT regenerate
```

Before writing: show diff of what changed (added/removed/changed entries). Then write the file.

---

## STEP 3: Dispatch 4 Analyzer Agents (PARALLEL)

**DISPATCH 4 AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

1. **readme-analyzer** [read-only, standard]
   - **Prompt:** Read `.tmp/sync/change-payload.json` and `README.md`. Analyze all sections against the payload. Write Update Report to `.tmp/sync/readme-report.json`.
   - **Output:** `.tmp/sync/readme-report.json`

2. **web-docs-analyzer** [read-only, standard]
   - **Prompt:** Read `.tmp/sync/change-payload.json` and `web/src/pages/docs.astro`. Analyze commands grid, skills grid, flows section, providers table. Write Update Report to `.tmp/sync/web-docs-report.json`.
   - **Output:** `.tmp/sync/web-docs-report.json`

3. **web-index-analyzer** [read-only, standard]
   - **Prompt:** Read `.tmp/sync/change-payload.json` and `web/src/pages/index.astro`. Analyze all content claims (provider count, install command, flows, "Runs everywhere"). Write Update Report to `.tmp/sync/web-index-report.json`.
   - **Output:** `.tmp/sync/web-index-report.json`

4. **svg-analyzer** [read-only, standard]
   - **Prompt:** Read `.tmp/sync/change-payload.json` and `web/public/commands.svg`, `web/public/flows.svg`, `web/public/flowchart.svg`. Return text-only edits (within `<text>` nodes only). Layout changes go to manual_items. Write Update Report array to `.tmp/sync/svg-report.json`.
   - **Output:** `.tmp/sync/svg-report.json`

**WAIT-ALL before proceeding to STEP 4.**

⛔ GATE CHECK: All 4 reports exist?
- [ ] `.tmp/sync/readme-report.json` exists
- [ ] `.tmp/sync/web-docs-report.json` exists
- [ ] `.tmp/sync/web-index-report.json` exists
- [ ] `.tmp/sync/svg-report.json` exists

IF ANY MISSING:
  ⛔ DO NOT USE: Edit on any documentation file
  ✅ DO: Wait or re-dispatch the missing agent

---

## STEP 4: Apply Edits (Single Writer)

### 4.1 Read All Reports

Read all 4 report files. Each report follows this schema:

```json
{
  "target": "path/to/file",
  "edits": [
    {"action": "REPLACE", "old": "<exact text in file>", "new": "<replacement>"}
  ],
  "manual_items": [
    {"reason": "...", "detail": "..."}
  ]
}
```

**Note:** `svg-report.json` is an array of report objects (one per SVG file). Iterate over each element.

For insertions: `old` = anchor text already in file, `new` = anchor text + newline + new content.
For deletions: `old` = text to remove, `new` = "".

### 4.2 Collect and Order Edits

For each target file:
1. Collect ALL edits from all reports targeting that file
2. Order by position in file — **apply bottom-up** (last occurrence first) to preserve line positions for subsequent edits

### 4.3 Apply Each Edit

For each edit (in bottom-up order):
1. Verify `old` text exists verbatim in the file
2. If found → apply via Edit tool (one call per edit)
3. If NOT found → skip, add to `[MANUAL]` with reason: "Anchor text not found in file"

**Apply each edit as an individual Edit tool call. Do NOT batch.**

---

## STEP 5: Final Report + Completion

Show report (omit empty sections):

```
## Sync Report — LAST_TAG..HEAD

### Ecosystem Map
[UPDATED / NO CHANGES] — list added/removed/changed entries

### Files Modified
- README.md: N edits applied
- web/src/pages/docs.astro: N edits applied
- web/src/pages/index.astro: N edits applied
- web/public/commands.svg: N edits applied
[omit files with 0 edits]

### Manual Items Required
⚠️ [FILE] — [reason]: [detail]
[omit if none]

### Ecosystem Inconsistencies
[ORPHAN] skill-name: not referenced by any command
[PHANTOM] add-X references "missing-skill" (not found on disk)
[omit if none]

### Summary
| Metric | Count |
|--------|-------|
| Files auto-updated | N |
| Edits applied | N |
| Manual items pending | N |
| Consistency issues | N |

---
No commit was made. Run `git diff` to review changes before committing.
```

Log iteration:
```bash
bash .codeadd/scripts/log-iteration.sh "enhance" "add.sync" "auto-update docs from LAST_TAG..HEAD diff" "README.md,web/src/pages/docs.astro,web/src/pages/index.astro,web/public/*.svg"
```

---

## Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. If your engine supports parallel dispatch and mode is `parallel`, dispatch all simultaneously
5. Verify output file exists before proceeding past any WAIT or GATE CHECK

You are the coordinator. You know your engine's capabilities. Map the intent to the best available mechanism.

---

## Rules

ALWAYS:
- Execute `git fetch --tags` before reading tags (remote tags may be invisible locally)
- Write Change Payload to `.tmp/sync/change-payload.json` before dispatching agents
- Dispatch all 4 analyzer agents simultaneously (parallel)
- Verify WAIT-ALL gate before applying any edits
- Apply edits bottom-up per file to preserve positions after each edit
- Validate `old` text exists verbatim in file before each Edit call
- Preserve Main Flows and Command Next-Steps Routing from existing ecosystem map
- Report all [MANUAL] items explicitly — these require human action after review

NEVER:
- Apply edits before all 4 reports are received and verified
- Let agents write directly to README.md, docs.astro, index.astro, or SVG files
- Modify framwork/.codeadd/commands/ or skill files (except ecosystem map in STEP 2)
- Write to provider directories (framwork/.claude/, framwork/.agent/, etc.)
- Create commits or stage files — leave all changes uncommitted
- Batch multiple edits into a single Edit tool call
- Skip `old` text validation before applying any edit

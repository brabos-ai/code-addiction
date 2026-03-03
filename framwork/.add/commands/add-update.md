# ADD Update - Update ADD Templates

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Documents in user's language.

Updates all installed ADD templates and shows what changed.

---

## Spec
```json
{"gates":["templates_detected"],"order":["detect","update","analyze_output","diff_if_updated","output"],"outputs":{"updated":"diff + explanation + reminder","already_current":"simple message"}}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Detect templates       → add template status
STEP 2: Execute updates        → add template update <slug> for each
STEP 3: Analyze output         → Check IF there was an update
STEP 4: Capture diff           → ONLY IF there was an update
STEP 5: Final output           → Summary for the user
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF TEMPLATES NOT DETECTED:
  ⛔ DO NOT USE: Bash for add template update
  ⛔ DO NOT: Update templates
  ✅ DO: Execute add template status FIRST

IF UPDATE OUTPUT SAYS "already at latest version":
  ⛔ DO NOT USE: Bash for git diff
  ⛔ DO NOT: Analyze changes
  ✅ DO: Inform that template is already up to date

ALWAYS:
  ⛔ DO NOT: git commit (user decides)
  ⛔ DO NOT: git checkout (user decides)
```

---

## STEP 1: Detect Installed Templates (FIRST COMMAND)

**EXECUTE:**
```bash
add template status
```

**PARSE OUTPUT:**

| Field | Action |
|-------|--------|
| Listed templates | Extract slugs for update |
| "Total installations: 0" | Inform and STOP |
| Authentication error | Inform `add login` and STOP |

**IF no templates installed:**
```
## ADD Update

No ADD templates installed in this project.

To install: `add template install <slug>`
To list available: `add template list`
```
→ STOP HERE.

---

## STEP 2: Execute Updates (FOR EACH TEMPLATE)

**PREREQUISITE:** Templates detected in STEP 1.

**FOR EACH detected template, EXECUTE:**
```bash
add template update <slug>
```

**CAPTURE THE OUTPUT OF EACH EXECUTION.**

---

## STEP 3: Analyze Update Output (CRITICAL)

**ANALYZE the message returned by `add template update`:**

| Message in Output | Means | Next Action |
|-------------------|-------|-------------|
| "✓ You're already at the latest version!" | No update occurred | Mark as "no changes" |
| "✓ Template updated" or similar | Update occurred | Mark for capturing diff |
| Error / Failure | Failed | Report error |

**RULE:** Only execute git diff for templates that were ACTUALLY updated.

---

## STEP 4: Capture Changes (ONLY IF THERE WAS AN UPDATE)

**PREREQUISITE:** At least one template was actually updated in STEP 3.

**IF any template was updated, EXECUTE (IN ORDER):**
```bash
git status --short
git diff --name-status
git diff
git diff --cached
git diff --stat
```

**PARSE OUTPUT:**

| Command | Purpose | What it captures |
|---------|---------|------------------|
| `git status --short` | Complete status | `?? new.md` (ADDED), `M file.md` (MODIFIED), `D file.md` (DELETED) |
| `git diff --name-status` | Type of change | `A`, `M`, `D` for tracked files |
| `git diff` | Detailed diffs | Content of changes (modified + staged) |
| `git diff --cached` | Staged changes | Changes already marked for commit |
| `git diff --stat` | Visual summary | `file.md \| 50 +++---` (lines added/removed) |

**IMPORTANT:** The sequence ensures that **ALL** change types are captured:
- ✅ NEW files (untracked `??`)
- ✅ MODIFIED files (`M`)
- ✅ DELETED files (`D`)

**IF NO template was updated (all "already at latest version"):**
→ Skip to STEP 5 with simplified output.

---

## STEP 5: Final Output

### When NO template was updated:

```
## ADD Update

✓ All templates are already at the latest version.

| Template | Version |
|----------|---------|
| [slug] | v[version] |
```

### When there WERE updates:

```
## ADD Update

### Updated Templates
- [slug]: v[old] → v[new]
- [slug]: already at latest version

### What Changed

**Commands:**
- `[file]` - [1 line description]

**Skills:**
- `[file]` - [1 line description]

**Scripts:**
- No changes (or list)

**Other:**
- [if any]

---

⚠️ **Changes NOT committed.**

To keep: `git add . && git commit -m "chore: update add templates"`
To revert: `git checkout .`
```

---

## Execution Checklist

**CHECK EACH ITEM IN ORDER:**

### DETECTION
- [ ] STEP 1: `add template status` executed
- [ ] Templates identified (or informed that there are none)

### UPDATE
- [ ] STEP 2: `add template update` executed for each template
- [ ] STEP 3: Output analyzed - identified which were updated

### ANALYSIS (ONLY IF THERE WAS AN UPDATE)
- [ ] STEP 4: Git sequence executed (`git status --short`, `git diff --name-status`, `git diff`, `git diff --cached`, `git diff --stat`)
- [ ] Status, change type (A/M/D) and diffs captured
- [ ] Changes grouped by area
- [ ] Each change explained

### OUTPUT
- [ ] STEP 5: Summary presented
- [ ] STEP 5: Commit/rollback reminder included (if there were changes)

---

## Error Handling

| Error | Action |
|-------|--------|
| `add` not found | Inform: "ADD CLI not installed. Execute: npm i -g @brabos-ai/add-cli" |
| Not authenticated | Inform: "Execute `add login` to authenticate" |
| Specific template fails | Continue with others, report at the end |
| All templates fail | Report errors, do not diff |

---

## Rules

ALWAYS:
- Detect installed templates before updating any
- Analyze update output to determine if changes occurred
- Use complete git command sequence for capturing changes
- Capture additions, modifications, and deletions separately
- Run git diff only if an actual update occurred
- Continue updating remaining templates if one fails

NEVER:
- Use only git diff (loses untracked new files)
- Run git diff when output says "already at latest version"
- Run git commit (user decides when to commit)
- Run git checkout (user decides when to revert)
- Ignore the message returned by add template update

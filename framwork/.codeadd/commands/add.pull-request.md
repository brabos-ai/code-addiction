# Pull Request — Create or Update

> **MODEL:** Use `haiku` model
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Idempotent PR command for the current branch. Detects whether a PR already exists: creates a new one or appends an update section to the existing body. On feature branches, generates the permanent feature changelog before opening the PR so it ships as part of the diff.

---

## Required Skills

- Load `{{skill:add-commit/SKILL.md}}` — message generation logic for any commit this command makes (adaptive: ≤3 files single-line, >3 files list).
- Load `{{skill:add-doc-schemas/SKILL.md}}` — `changelog` schema for the feature changelog generated on feature branches.
- Load `{{skill:add-id-convention/SKILL.md}}` — branch type detection and `CHG[NNNN]` allocation.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**

```
STEP 1: Verify gh CLI                     -> RUN FIRST
STEP 2: Detect branch + PR state          -> Determine create vs edit, capture feature ID
STEP 3: Generate feature changelog        -> FEATURE BRANCH ONLY, idempotent
STEP 4: Stage + commit pending changes    -> Use add-commit skill, security gate
STEP 5: Push to origin                    -> with -u if no upstream
STEP 6: Build PR body                     -> Summary / Changes / Test Plan
STEP 7: Create or update PR               -> 7A new, 7B append-only edit
STEP 8: Completion summary                -> Report URL + post-merge guidance
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF gh CLI NOT INSTALLED:
  ⛔ DO NOT USE: Bash for any git or gh operations
  ⛔ DO NOT USE: Write to create any files
  ✅ DO: Show platform-appropriate install guidance and STOP

IF gh NOT AUTHENTICATED:
  ⛔ DO NOT USE: Bash for any git or gh operations
  ⛔ DO NOT USE: Write to create any files
  ✅ DO: Instruct user to run `gh auth login` and STOP

IF CURRENT BRANCH = main OR master:
  ⛔ DO NOT USE: Bash for git push or gh pr
  ⛔ DO NOT USE: Write to create any files
  ✅ DO: Inform user to switch to a feature branch and STOP

IF .env, *.key, secrets.*, *.pem, *.p12 APPEAR IN `git status --short`:
  ⛔ DO NOT USE: Bash for git add
  ⛔ DO NOT USE: Bash for git commit
  ⛔ DO NOT USE: Bash for git push
  ✅ DO: List sensitive files, warn user, STOP

IF BRANCH_TYPE = feature AND CHANGELOG NOT WRITTEN AND NOT ALREADY PRESENT:
  ⛔ DO NOT USE: Bash for git push
  ⛔ DO NOT USE: Bash for gh pr create
  ⛔ DO NOT USE: Bash for gh pr edit
  ✅ DO: Generate changelog FIRST (STEP 3)

IF PR ALREADY EXISTS for current branch:
  ⛔ DO NOT USE: Bash for gh pr create (would fail or duplicate)
  ⛔ DO NOT: Overwrite existing PR body — append-only update
  ⛔ DO NOT: Modify existing PR title
  ✅ DO: Use STEP 7B (gh pr edit with appended Update section)

ALWAYS:
  ⛔ DO NOT: Amend previous commits
  ⛔ DO NOT: Force push
  ⛔ DO NOT: Rebase
  ⛔ DO NOT: Rename branches
  ⛔ DO NOT USE: Bash for any non-existent script (no feature-pr.sh, no done.sh)
```

---

## STEP 1: Verify gh CLI

### 1.1 Check installation

```bash
command -v gh >/dev/null 2>&1 && echo "INSTALLED" || echo "MISSING"
```

If `MISSING` → show platform install guidance (`brew install gh`, `apt install gh`, or https://cli.github.com) and STOP.

### 1.2 Check authentication

```bash
gh auth status
```

If not authenticated → instruct user to run `gh auth login` and STOP.

---

## STEP 2: Detect Branch & PR State

### 2.1 Capture branch metadata

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

If `BRANCH` is `main` or `master` → STOP (see prohibitions).

### 2.2 Detect branch type

Use `{{skill:add-id-convention/SKILL.md}}` rules. Run:

```bash
bash .codeadd/scripts/get-branch-metadata.sh
```

Output captures: `BRANCH_TYPE` (feature | hotfix | other), `FEATURE_ID` (e.g. `0012F`), `FEATURE_DIR` (e.g. `docs/features/0012F-*`).

If branch metadata script is unavailable, fall back to regex:
- `^(feature|feat)/[0-9]{4}F-` → feature
- `^(hotfix|fix)/[0-9]{4}H-` → hotfix
- otherwise → other

### 2.3 Detect existing PR

```bash
PR_DATA=$(gh pr view --json number,url,title,body,state 2>/dev/null || echo "")
```

If empty → no PR exists → flow `CREATE`. If state is `OPEN` → flow `UPDATE`. If state is `CLOSED` or `MERGED` → STOP and inform user (do not reopen).

---

## STEP 3: Generate Feature Changelog (FEATURE BRANCH ONLY)

**⛔ Skip this STEP entirely if `BRANCH_TYPE` ≠ `feature`.**

### 3.1 Idempotency guard

Check if `${FEATURE_DIR}/changelog.md` already exists. If yes → skip generation, proceed to STEP 4.

### 3.2 Allocate changelog ID

```bash
bash .codeadd/scripts/status.sh next-id CHG
```

Captures `CHG[NNNN]`. Used in frontmatter `id:`. Frontmatter `related:` references the feature ID (`0012F` or equivalent).

### 3.3 Execute schema

EXECUTE schema `changelog` from `{{skill:add-doc-schemas/SKILL.md}}`. Write to `${FEATURE_DIR}/changelog.md`.

Source material:
- `git log main..HEAD --oneline` — commits on this branch.
- `git diff main...HEAD --stat` — file-level summary.
- `${FEATURE_DIR}/about.md` (if present) — scope reference for out-of-scope detection.

### 3.4 Validation gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `changelog`.

⛔ If gate returns anything other than `PASS` → fix and re-run. DO NOT proceed to STEP 4 with an invalid changelog.

---

## STEP 4: Stage & Commit Pending Changes

### 4.1 Security check

```bash
git status --short
```

If output contains `.env`, `*.key`, `secrets.*`, `*.pem`, `*.p12` → STOP (see prohibitions).

### 4.2 Determine if commit needed

```bash
git diff --quiet HEAD && echo "CLEAN" || echo "DIRTY"
```

If `CLEAN` AND no changelog was just generated → skip to STEP 5.

### 4.3 Generate commit message

Apply `{{skill:add-commit/SKILL.md}}` adaptive logic:

- Read `git diff HEAD` and `git diff --cached HEAD`.
- Infer Conventional Commits type (feat | fix | refactor | chore | docs | test | style).
- Count changed files. ≤3 → single-line `type(scope): summary`. >3 → list format with summary line + per-module bullets.

### 4.4 Stage and commit

**Feature-scoped staging** (stage all code changes + ONLY the current feature's docs; other features' untracked docs stay untracked — see `{{skill:add-commit/SKILL.md}}` Staging Rules):

```bash
git add -A -- . ':(exclude)docs/features/*'
[ -d "${FEATURE_DIR}" ] && git add -A -- "${FEATURE_DIR}"
git commit -m "<generated message>"
```

If staging anything sensitive (security check at 4.1 must already have STOPped) → never reach here.

---

## STEP 5: Push to Origin

### 5.1 Check upstream

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
```

If no upstream:

```bash
git push -u origin "$BRANCH"
```

Otherwise:

```bash
git push
```

---

## STEP 6: Build PR Body

### 6.1 Sections

Compose the body with three sections:

```markdown
## Summary

[1-3 sentences synthesising what this branch delivers. Read latest commit messages and changelog (if generated) for source material.]

## Changes

- type(scope): bullet describing change
- type(scope): bullet describing change
- type(scope): bullet describing change

## Test Plan

- [ ] [verifiable check, e.g. "lint passes"]
- [ ] [verifiable check, e.g. "feature flow on local dev"]
- [ ] [verifiable check, e.g. "no regressions in adjacent module"]
```

### 6.2 Title

Format: `type(scope): subject`. Source priority:

1. If feature changelog was generated → use its TL;DR or first Changes bullet.
2. Else → first commit message subject on this branch (`git log main..HEAD --format=%s | tail -1`).
3. Else → branch name humanised.

---

## STEP 7: Create or Update PR

### 7A: Create new PR (if no PR exists)

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
<body from STEP 6.1>
EOF
)"
```

Capture returned URL.

### 7B: Update existing PR (if PR exists, state OPEN)

⛔ Title is **never** modified. Body is **append-only**.

1. Fetch existing body from `PR_DATA` (already captured in STEP 2.3).
2. Build update section:

```markdown

---

## Update YYYY-MM-DD

### Changes
- [bullets for new commits since last update]

### Test Plan
- [ ] [verifiable check for the new changes]
```

Date is today's date (`date +%Y-%m-%d`).

3. Concatenate: `<existing body>\n\n<update section>`.
4. Apply:

```bash
gh pr edit <number> --body "$(cat <<'EOF'
<concatenated body>
EOF
)"
```

---

## STEP 8: Completion Summary

Report:

| Field | Value |
|-------|-------|
| Branch | `$BRANCH` |
| PR | URL (mark `(updated)` if STEP 7B was used) |
| Feature changelog | `${FEATURE_DIR}/changelog.md` (if generated) or `(skipped — already exists)` or `(skipped — not feature branch)` |
| Commits pushed | count from `git log @{push}..HEAD` before push, or 0 if clean |

Post-merge guidance: "After PR is merged on GitHub, run `/add.done` for branch cleanup."

---

## Rules

ALWAYS:
- Verify gh CLI installed AND authenticated before any other action
- Generate the feature changelog on feature branches before opening the PR
- Apply idempotency: skip changelog if file already exists; update existing PR rather than failing
- Use `{{skill:add-commit/SKILL.md}}` for any commit message this command writes
- Append updates to existing PR bodies as dated sections — preserve prior content
- Run `git status --short` before staging — abort if sensitive files appear
- Push with `-u` when no upstream is set

NEVER:
- Modify the title of an existing PR
- Overwrite an existing PR body
- Amend, force-push, or rebase
- Rename branches
- Auto-stage `.env`, `*.key`, `secrets.*`, `*.pem`, `*.p12`
- Reference scripts that do not exist in this repo (no `feature-pr.sh`)
- Update `CHANGELOG.md` at the repo root (that is `/add.release`'s responsibility)
- Generate the feature changelog twice — STEP 3.1 idempotency guard prevents this; `/add.done` mirrors the same guard

---

## Error Handling

| Error | Action |
|-------|--------|
| gh CLI not found | Show install guidance + STOP |
| gh not authenticated | Show `gh auth login` guidance + STOP |
| On main/master branch | Inform + STOP |
| Sensitive files staged | List + STOP, do not commit |
| PR state CLOSED or MERGED | Inform user + STOP, do not reopen |
| Schema validation failed | Show validation errors + STOP, do not push |
| `git push` fails | Show stderr + STOP, do not attempt PR creation |
| `gh pr edit` fails | Show stderr + STOP, do not retry with create |

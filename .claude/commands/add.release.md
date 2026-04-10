# Release Manager

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Coordinates release flow: version bump, `main -> production` merge (stable) or direct tag from main (beta), changelog generation, and tag/release creation.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 0: Check prerequisites        → gh CLI + auth
STEP 1: Read release pipeline      → detect PIPELINE_HANDLES_RELEASE
STEP 2: Validate source branch     → must be main
STEP 3: Ask release type            → stable | beta [STOP]
STEP 4: Detect + choose version    → fetch tags, pick bump type or next beta number
STEP 5: Update CLI version         → cli/package.json + commit + push main
STEP 6: Merge main into production → push production (SKIP if beta)
STEP 7: Changelog + preview        → generate, show, get approval [STOP]
STEP 8: Create tag/release         → conditional on PIPELINE_HANDLES_RELEASE
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF gh CLI missing or unauthenticated:
  ⛔ DO NOT USE: Bash for git merge, git tag, git push, gh release
  ✅ DO: Show install/auth instructions and STOP

IF branch is not main:
  ⛔ DO NOT USE: Bash for merge, tag, push, or gh release
  ✅ DO: Instruct user to switch to main and STOP

IF release type = beta:
  ⛔ DO NOT USE: Bash for git checkout production, git merge (into production), git push origin production
  ✅ DO: Skip STEP 6 entirely — beta tags are created from main, not production

IF merge to production failed or not completed (stable only):
  ⛔ DO NOT USE: Bash for git tag, git push (tag), gh release
  ✅ DO: Show merge error and STOP

IF preview not approved:
  ⛔ DO NOT USE: Bash for git tag, git push (tag), gh release create
  ✅ DO: Wait for confirmation or cancel

IF PIPELINE_HANDLES_RELEASE = true:
  ⛔ DO NOT USE: Bash for gh release create
  ✅ DO: Only create and push the tag — pipeline handles release creation
```

---

## STEP 0: Check Prerequisites

Verify gh CLI is installed and authenticated. If either fails → show instructions for user's platform and STOP.

---

## STEP 1: Read Release Pipeline

**PURPOSE:** Detect if a CI/CD pipeline creates GitHub releases on tag push — to avoid duplicate releases.

### 1.1 Find and read workflow files

Read all `.github/workflows/*.yml` files. If no workflows directory exists → set `PIPELINE_HANDLES_RELEASE = false`, skip to STEP 2.

### 1.2 Detect pipeline behavior

Set `PIPELINE_HANDLES_RELEASE = true` if ANY workflow meets ALL of these:
- Triggers on `push: tags: v*` (or similar tag pattern)
- Contains `gh release create` OR `softprops/action-gh-release` OR `goreleaser`

Also extract what the pipeline does beyond release creation (build ZIP, npm publish, deploy, etc.).

### 1.3 Inform user

Show: `PIPELINE_HANDLES_RELEASE = [true|false]` with reason. If true, warn that STEP 8 will only push the tag.

---

## STEP 2: Validate Source Branch

Verify current branch is `main`. If not → instruct user to switch and STOP.

---

## STEP 3: Ask Release Type [STOP]

Ask user: "Release type: **stable** or **beta**?"

- **stable** → full flow: version bump, merge to production, tag from production
- **beta** → lightweight flow: version bump with prerelease suffix, tag from main (no production merge)

Store as `RELEASE_TYPE`.

---

## STEP 4: Detect + Choose Version

### 4.1 Fetch and list tags

**CRITICAL:** Always fetch tags from remote before reading local tags.

```bash
git fetch --tags
git tag --sort=-v:refname
```

Without `git fetch --tags`, remote tags are invisible locally — this caused a real bug where the command assumed "first release" when tags existed.

Parse: `LATEST_TAG = first line` or `none` if no tags.

### 4.2 Choose version (stable)

**IF `RELEASE_TYPE = stable`:**

If `LATEST_TAG` exists (`vX.Y.Z` or `vX.Y.Z-beta.N`):
- `patch` → `vX.Y.(Z+1)` — fixes, small changes
- `minor` → `vX.(Y+1).0` — new commands/skills/features
- `major` → `v(X+1).0.0` — breaking changes

If first release → recommend `v1.0.0`.

Ask user to choose. Store as `NEXT_VERSION`.

### 4.3 Choose version (beta)

**IF `RELEASE_TYPE = beta`:**

Find the latest stable tag (`LATEST_STABLE` = latest tag without `-beta` suffix).
Find all beta tags for the next version.

Ask user which base version to beta (suggest next minor from `LATEST_STABLE`):
- If `LATEST_STABLE = v0.2.29` → suggest `v0.3.0-beta.1`
- If beta tags already exist for that version (e.g., `v0.3.0-beta.2`) → suggest `v0.3.0-beta.3`

Store as `NEXT_VERSION`.

---

## STEP 5: Update CLI Package Version

Update `cli/package.json` version field to `NEXT_VERSION` (without `v` prefix). Commit with message `chore: bump version to $NEXT_VERSION` and push to main.

---

## STEP 6: Merge Main Into Production

**IF `RELEASE_TYPE = beta`: SKIP this step entirely.** Beta releases tag directly from main.

**IF `RELEASE_TYPE = stable`:**

Merge main into production with `--no-ff`. Push production.

If merge fails → show error and STOP. Do not proceed to tag creation.

After merge, checkout main again to restore working branch.

---

## STEP 7: Changelog + Preview [STOP]

### 7.1 Collect commits between versions

```bash
# Stable — compare against production:
git log [LATEST_TAG]..production --pretty=format:"%h %s" --no-merges

# Beta — compare against main (no production involved):
git log [LATEST_TAG]..main --pretty=format:"%h %s" --no-merges

# If first release:
git log [TARGET_BRANCH] --pretty=format:"%h %s" --no-merges
```

Read each commit message. Classify commits by type using conventional commit prefixes or content analysis:
- `feat:` → Features
- `fix:` → Bug Fixes
- `docs:` → Documentation
- `chore:`, `build:`, `ci:` → Maintenance
- `refactor:` → Refactoring
- Other → group by best judgment

### 7.2 Collect file changes

```bash
# Stable:
git diff --stat [LATEST_TAG]..production
git diff --name-status [LATEST_TAG]..production

# Beta:
git diff --stat [LATEST_TAG]..main
git diff --name-status [LATEST_TAG]..main

# If first release:
git diff --stat --name-status $(git rev-list --max-parents=0 HEAD)..[TARGET_BRANCH]
```

Use file changes to enrich commit descriptions where commit messages are too terse. Provider dirs (`framwork/.claude/`, `framwork/.agent/`, etc.) are generated — exclude from individual listing, summarize as one line if changed.

### 7.3 PRD scan

If `docs/prd/` exists → read and include non-draft PRDs created/updated since `LATEST_TAG`.

### 7.4 Assemble release notes

Write human-readable release notes. Use commit descriptions as the primary source, enriched by file-level context. The notes must tell a user **what changed and why**, not just list files.

Format (omit empty sections):
```markdown
## What's New
- [Human-readable description of each feature, derived from commit messages and file changes]

## Bug Fixes
- [Description of each fix]

## Improvements
- [Refactors, performance, DX improvements]

## Maintenance
- [Build, CI, dependency updates]

## Statistics
X files changed, Y insertions(+), Z deletions(-)
```

For beta releases, prefix the notes with: `> ⚠ This is a pre-release version. It may contain bugs or incomplete features.`

Each bullet should be a concise sentence describing the change from the user's perspective, not a file path or raw commit hash.

### 7.5 Preview and confirm

Show release preview (tag, type [stable/beta], from branch, summary, changelog). Ask user: "Create this release?" If no → STOP.

### 7.6 Save release notes for tag

After approval, save the release notes content to a temp file. This content will be used as the annotated tag message in STEP 8, so the CI pipeline can extract it.

---

## STEP 8: Create Tag (+ Release if no pipeline)

### 8.1 Create and push annotated tag with release notes

**Stable:** from production branch. **Beta:** from main branch.

```bash
# Stable:
git checkout production
git tag -a [NEXT_VERSION] -F [TEMP_NOTES_FILE]
git push origin [NEXT_VERSION]
git checkout main

# Beta:
git tag -a [NEXT_VERSION] -F [TEMP_NOTES_FILE]
git push origin [NEXT_VERSION]
```

This embeds the release notes in the tag annotation, making them available to the CI pipeline.

### 8.2 Conditional release creation

**IF `PIPELINE_HANDLES_RELEASE = true`:**

DO NOT run `gh release create`. Inform user the tag was pushed with embedded release notes and the pipeline will create the release using those notes. For beta tags, the pipeline automatically marks the GitHub Release as prerelease and publishes to npm with `--tag beta`. Show what the pipeline will do (from STEP 1).

**IF `PIPELINE_HANDLES_RELEASE = false`:**

```bash
# Stable:
gh release create [NEXT_VERSION] --target production --title "[NEXT_VERSION]" --notes-file [TEMP_NOTES_FILE]

# Beta:
gh release create [NEXT_VERSION] --target main --title "[NEXT_VERSION]" --prerelease --notes-file [TEMP_NOTES_FILE]
```

Show release URL.

---

## Rules

ALWAYS:
- Fetch tags from remote before reading (`git fetch --tags`) — without this, remote tags are invisible
- Use annotated tags with release notes as the tag message (`git tag -a -F`)
- Generate changelog from commits AND file diff combined — commits are primary, file diff enriches
- Write release notes from the user's perspective (what changed, not which files)
- Treat provider dirs as generated — exclude from individual listing
- Omit empty changelog sections
- Use `--prerelease` flag when creating beta GitHub releases manually

NEVER:
- Run `node scripts/build.js` — that is the pipeline's job
- Commit generated provider files (`framwork/.claude/`, `.agent/`, etc.) — pipeline generates them
- Use lightweight tags — annotated tags carry the release notes for the pipeline
- Generate release notes only from file paths — use commit messages as primary source
- Create `CHANGELOG.md` files in this command
- Call `gh release create` when `PIPELINE_HANDLES_RELEASE = true`
- Merge to production for beta releases — beta tags come from main

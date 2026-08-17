---
description: Coordinates versioning, changelog generation, tagging, and ADD releases.
---

# Release Manager

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **INPUT:** $ARGUMENTS

Coordinates release flow: version bump, `main → production` merge (stable only), changelog generation, and tag push — CI pipeline handles GitHub release creation.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 0: Prerequisites          → gh CLI + auth
STEP 1: Validate branch        → must be main
STEP 2: Release type           → stable | beta [STOP]
STEP 3: Detect version         → fetch tags, choose bump [STOP]
STEP 4: Update CLI version     → cli/package.json + commit + push
STEP 5: Merge to production    → --no-ff + push (SKIP if beta)
STEP 6: Changelog + preview    → generate, confirm [STOP]
STEP 7: Push tag               → save notes + run script → pipeline handles the rest
```

**⛔ ABSOLUTE PROHIBITIONS:**

IF gh CLI missing or unauthenticated:
  ⛔ DO NOT USE: Bash for git merge, git tag, git push
  ✅ DO: Show install/auth instructions and STOP

IF branch is not main:
  ⛔ DO NOT USE: Bash for merge, tag, push
  ✅ DO: Instruct user to switch to main and STOP

IF release type = beta:
  ⛔ DO NOT USE: Bash for git checkout production, git merge, git push origin production
  ✅ DO: Skip STEP 5 entirely

IF merge to production failed (stable only):
  ⛔ DO NOT USE: Bash for git tag, git push (tag)
  ✅ DO: Show merge error and STOP

IF preview not approved:
  ⛔ DO NOT USE: Bash for git tag, git push (tag)
  ✅ DO: Wait for confirmation or cancel

---

## STEP 0: Prerequisites

Verify gh CLI is installed and authenticated. If either fails → show instructions for user's platform and STOP.

---

## STEP 1: Validate Branch

Verify current branch is `main`. If not → instruct user to switch and STOP.

---

## STEP 2: Release Type [STOP]

Ask user: "Release type: **stable** or **beta**?"

- **stable** → full flow: version bump, merge to production, tag from production
- **beta** → lightweight flow: version bump with prerelease suffix, tag from main (no production merge)

Store as `RELEASE_TYPE`.

---

## STEP 3: Detect Version [STOP]

**CRITICAL:** Always fetch tags from remote before reading local tags.

```bash
git fetch --tags
git tag --sort=-v:refname
```

Without `git fetch --tags`, remote tags are invisible locally — this caused a real bug where the command assumed "first release" when tags existed.

Parse: `LATEST_TAG = first line` or `none` if no tags.

### Stable

If `LATEST_TAG` exists:
- `patch` → `vX.Y.(Z+1)` — fixes, small changes
- `minor` → `vX.(Y+1).0` — new commands/skills/features
- `major` → `v(X+1).0.0` — breaking changes

If first release → recommend `v1.0.0`.

Ask user to choose. Store as `NEXT_VERSION`.

### Beta

Find the latest stable tag (`LATEST_STABLE` = latest tag without `-beta` suffix). Find all beta tags for the next version.

Ask user which base version to beta (suggest next minor from `LATEST_STABLE`):
- If `LATEST_STABLE = v0.2.29` → suggest `v0.3.0-beta.1`
- If beta tags already exist for that version (e.g., `v0.3.0-beta.2`) → suggest `v0.3.0-beta.3`

Store as `NEXT_VERSION`.

---

## STEP 4: Update CLI Version

Update `cli/package.json` version field to `NEXT_VERSION` (without `v` prefix). Commit with message `chore: bump version to $NEXT_VERSION` and push to main.

---

## STEP 5: Merge Main Into Production

**IF `RELEASE_TYPE = beta`: SKIP this step entirely.**

Merge main into production with `--no-ff`. Push production.

If merge fails → show error and STOP.

After merge, checkout main to restore working branch.

---

## STEP 6: Changelog + Preview [STOP]

### Collect commits

```bash
# Stable:
git log [LATEST_TAG]..production --pretty=format:"%h %s" --no-merges

# Beta:
git log [LATEST_TAG]..main --pretty=format:"%h %s" --no-merges

# If first release:
git log [TARGET_BRANCH] --pretty=format:"%h %s" --no-merges
```

Classify commits by conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`) or content analysis.

### Collect file changes

```bash
# Stable:
git diff --stat [LATEST_TAG]..production
git diff --name-status [LATEST_TAG]..production

# Beta:
git diff --stat [LATEST_TAG]..main
git diff --name-status [LATEST_TAG]..main
```

Use file changes to enrich terse commit messages. Provider dirs (`framwork/.claude/`, `framwork/.agent/`, etc.) are generated — exclude from individual listing, summarize as one line if changed.

### Plan scan

If `docs/plans/` exists → include non-draft plans created/updated since `LATEST_TAG`.

### Assemble release notes

Write human-readable release notes from the user's perspective — what changed and why, not file paths.

Format (omit empty sections):
```markdown
## What's New
- [Feature description]

## Bug Fixes
- [Fix description]

## Improvements
- [Refactor/DX/perf improvement]

## Maintenance
- [Build, CI, dependency updates]

## Statistics
X files changed, Y insertions(+), Z deletions(-)
```

For beta releases, prefix with: `> ⚠ This is a pre-release version. It may contain bugs or incomplete features.`

### Preview and confirm

Show release preview (tag, type, from branch, changelog). Ask: "Create this release?" If no → STOP.

---

## STEP 7: Push Tag

Save the approved release notes to `/tmp/release-notes-v[VERSION].md`.

Run:
```bash
./scripts/create-release-tag.sh
```

The script reads the version from `cli/package.json`, creates an annotated tag with the release notes, and pushes it to origin. The CI pipeline then builds the framework, packages the ZIP, creates the GitHub Release, and publishes to npm.

Monitor at: `https://github.com/brabos-ai/code-addiction/actions`

---

## Rules

ALWAYS:
- Fetch tags from remote before reading (`git fetch --tags`) — without this, remote tags are invisible
- Use annotated tags with release notes as tag message — pipeline extracts them for the GitHub Release
- Generate changelog from commits AND file diff — commits primary, file diff enriches
- Write release notes from the user's perspective (what changed, not which files)
- Treat provider dirs as generated — exclude from individual listing

NEVER:
- Run `node scripts/build.js` — pipeline's job
- Commit generated provider files (`framwork/.claude/`, `.agent/`, etc.)
- Merge to production for beta releases — beta tags come from main
- Create `CHANGELOG.md` files
- Call `gh release create` — pipeline handles release creation

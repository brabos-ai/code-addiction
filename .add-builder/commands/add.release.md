# Release Manager

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Coordinates release flow with mandatory `main -> production` merge, optional tag/release creation, and changelog generated from diff against the previous release.

---

## Spec

```json
{"gates":["response_lang_set","gh_authenticated","branch_is_main","pipeline_read","tag_choice_defined","version_confirmed_if_tag","preview_approved_if_tag","production_merge_completed"],"modes":{"create":"STEP 0-11","list":"STEP 0 + STEP 12"},"order":["prerequisites","read_pipeline","branch_check","ask_tag","detect_tag","choose_version","update_cli_version","merge_to_production","release_notes","preview","confirm","create_tag_or_release"]}
```

---

## MANDATORY SEQUENTIAL EXECUTION

FIRST ACTION: DETECT RESPONSE LANGUAGE
1. Read user's message and detect language.
2. Set `RESPONSE_LANG` from detected language (`pt-BR`, `en`, `es`, etc).
3. All responses from this point must use `RESPONSE_LANG`.
4. Tech terms, code, and git terms must stay in English.
5. Generated docs must use `RESPONSE_LANG`.

If language is not clear:
- Do not default to English.
- Set `RESPONSE_LANG = pt-BR`.

DETECT MODE:
- If argument contains `--list`: execute STEP 0 and STEP 12 only.
- If no `--list`: execute STEP 0-11 in order.

STEPS IN ORDER (create mode):
```
STEP 0:  Check prerequisites             -> gh CLI + auth
STEP 1:  Read release pipeline           -> detect PIPELINE_HANDLES_RELEASE + what pipeline does
STEP 2:  Validate source branch          -> must be main
STEP 3:  Ask tag creation                -> yes/no
STEP 4:  Detect latest tag               -> git fetch --tags + git tag
STEP 5:  Choose next version             -> patch/minor/major
STEP 6:  Update CLI Package Version      -> update cli/package.json + commit + push
STEP 7:  Merge main into production      -> push production
STEP 8:  Generate changelog              -> compare previous release vs production
STEP 9:  Preview                         -> show tag + changelog
STEP 10: Confirm release creation        -> explicit approval
STEP 11: Create tag (+ release if no pipeline) -> git tag + push [+ gh release create]
STEP 12: List Releases (--list mode)     -> list all releases
```

ABSOLUTE PROHIBITIONS:

If gh CLI is missing or not authenticated:
- Do not use Bash for `git merge`, `git tag`, `git push`, or `gh release`.
- Show install/auth instructions and stop.

If current branch is not `main`:
- Do not use Bash for merge, tag, push, or `gh release`.
- Instruct user to switch to `main` and stop.

If merge to `production` fails or was not completed:
- Do not use Bash for `git tag`, `git push` (tag), or `gh release`.
- Show merge error and stop.

If user chooses not to create tag:
- Do not use Bash for `git tag`, `git push` (tag), or `gh release`.
- Finish flow after merge with status message.

If preview is not approved:
- Do not use Bash for `git tag`, `git push` (tag), or `gh release create`.
- Wait for confirmation or cancel.

If `PIPELINE_HANDLES_RELEASE = true`:
- Do not use Bash for `gh release create` in STEP 11.
- Only create and push the tag — the pipeline handles release creation, ZIP upload, and npm publish.

---

## STEP 0: Check Prerequisites

### 0.1 Check gh CLI installation

Execute:
```bash
command -v gh >/dev/null 2>&1 && echo "OK" || echo "NOT_FOUND"
```

If `NOT_FOUND`, display:
```text
GitHub CLI (gh) not found.

Install:
Windows:
  winget install --id GitHub.cli
  or download: https://cli.github.com/

macOS:
  brew install gh

Linux:
  sudo apt install gh
  sudo dnf install gh
  sudo pacman -S github-cli

After install:
  gh auth login
```

Stop execution.

### 0.2 Check gh authentication

Execute:
```bash
gh auth status
```

If not authenticated, display:
```text
gh CLI is not authenticated.

Run:
  gh auth login
```

Stop execution.

---

## STEP 1: Read Release Pipeline

**PURPOSE:** Determine if a CI/CD pipeline handles `gh release create` on tag push — to avoid duplicate release conflicts — and understand what the pipeline does so the command aligns with it.

### 1.1 Find workflow files

Execute:
```bash
ls .github/workflows/ 2>/dev/null || echo "NO_WORKFLOWS"
```

If `NO_WORKFLOWS`: set `PIPELINE_HANDLES_RELEASE = false`. Skip to STEP 2.

### 1.2 Read each workflow file

For each `.github/workflows/*.yml` file found, Read the full file content.

### 1.3 Detect pipeline behavior

Set `PIPELINE_HANDLES_RELEASE = true` if ANY workflow file meets ALL of these:
- Triggers on `push: tags: v*` (or similar tag pattern)
- Contains `gh release create` OR `softprops/action-gh-release` OR `goreleaser`

Set `PIPELINE_HANDLES_RELEASE = false` if no workflow handles release creation.

Also extract what the pipeline does beyond release creation (e.g. build ZIP, npm publish, deploy).

### 1.4 Display result

```text
Pipeline scan:
  PIPELINE_HANDLES_RELEASE = [true|false]
  Reason: [which workflow + which step handles it, or "no release workflow found"]
```

If `PIPELINE_HANDLES_RELEASE = true`, also display:
```text
⚠️  Pipeline handles release creation. STEP 11 will only push the tag.
    Pipeline will: [list: create release, upload ZIP, publish npm, etc.]
```

---

## STEP 2: Validate Source Branch

Execute:
```bash
git branch --show-current
```

If branch is not `main`, display:
```text
You must run /add.release from main.

Current branch: [BRANCH]

Run:
  git checkout main
  git pull origin main
```

Stop execution.

---

## STEP 3: Ask Tag Creation

Ask user:
```text
Do you want to create a release tag after merging to production?
```

Options:
- Yes: continue to STEP 4.
- No: proceed with merge-only flow:
  - Execute STEP 7 (Merge main into production).
  - Display completion message.
  - Stop execution (no tag/release created).

---

## STEP 4: Detect Latest Tag

**CRITICAL:** Always fetch tags from remote before reading local tags.

Execute:
```bash
git fetch --tags
git tag --sort=-v:refname
```

Parse output:
- If tags exist: `LATEST_TAG = first line`.
- If no tags: `LATEST_TAG = none` (first release).

Display:
```text
Latest tag: [LATEST_TAG or "none (first release)"]
```

---

## STEP 5: Choose Next Version

If `LATEST_TAG` exists (`vX.Y.Z`):
- `patch` -> `vX.Y.(Z+1)` for fixes and small changes.
- `minor` -> `vX.(Y+1).0` for new commands/skills/features.
- `major` -> `v(X+1).0.0` for breaking changes.

If first release:
- Recommend `v1.0.0`.

Ask user to choose bump type (`patch`, `minor`, `major`) and store as `NEXT_VERSION`.

---

## STEP 6: Update CLI Package Version

**CRITICAL:** Before merging to production, the CLI package version must match the release tag.

### 6.1 Read current version

Execute:
```bash
cat cli/package.json | grep '"version"'
```

### 6.2 Update version in cli/package.json

Replace the version field with `NEXT_VERSION` (without the `v` prefix).

Execute:
```bash
VERSION_NUMBER=$(echo "$NEXT_VERSION" | sed 's/^v//')
sed -i "s/\"version\": \"[0-9.]*\"/\"version\": \"$VERSION_NUMBER\"/" cli/package.json
```

### 6.3 Verify the change

Execute:
```bash
cat cli/package.json | grep '"version"'
```

### 6.4 Commit and push the version bump

Execute:
```bash
git add cli/package.json
git commit -m "chore: bump version to $NEXT_VERSION"
git push origin main
```

On success, display:
```text
CLI package.json updated to [NEXT_VERSION] and pushed to main.
```

---

## STEP 7: Merge Main Into Production

Execute:
```bash
git checkout production
git pull origin production
git merge main --no-ff -m "Merge main into production for release [NEXT_VERSION]"
git push origin production
```

On success, display:
```text
Main merged into production successfully.
```

If merge fails:
- Display error message with conflict details.
- Stop execution.

---

## STEP 8: Generate Changelog

Use `production` as source of truth after STEP 7 merge.

### 8.1 File diff

If `LATEST_TAG` exists, execute:
```bash
git diff --name-status [LATEST_TAG]..production
```

If first release, execute:
```bash
git log production --name-status --pretty=format:""
```

Group files by:
- Commands (source): `framwork/.codeadd/commands/*.md`
- Skills (source): `framwork/.codeadd/skills/**`
- Scripts: `framwork/.codeadd/scripts/*`
- CLI: `cli/**`
- Docs: `docs/**`
- Other: everything else

Classify each file as Added (`A`), Modified (`M`), Deleted (`D`).

**Note:** Provider dirs (`framwork/.claude/`, `framwork/.agent/`, etc.) are generated files — group them under "Provider files regenerated" as a single line, not individually.

### 8.2 PRD scan

Read `docs/prd/` when directory exists.

Filter PRDs where:
- Status is not `draft`.
- Created/updated date is on or after `LATEST_TAG` date.
- If first release, include all non-draft PRDs.

### 8.3 Assemble changelog/release notes

Format (omit empty sections):
```markdown
## Commands
- Added: [list]
- Modified: [list]
- Removed: [list]

## Skills
- Added: [list]
- Modified: [list]

## Scripts
- Added: [list]
- Modified: [list]

## CLI
- [changes to cli/]

## PRDs Implemented
- PRDXXXX: [title]

## Statistics
X files changed, Y added, Z removed
```

---

## STEP 9: Preview

Display:
```text
Release Preview

Tag:    [NEXT_VERSION]
From:   [LATEST_TAG or "(first release)"]
Target: production

[Text summary about changes]

[ASSEMBLED CHANGELOG]
```

---

## STEP 10: Confirm Release Creation

Ask user:
```text
Create this release?
```

Options:
- Yes: continue to STEP 11.
- No: display `Release cancelled after preview.` and stop.

---

## STEP 11: Create Tag (+ Release if no pipeline)

### 11.1 Create and push annotated tag

Execute:
```bash
git checkout production
git pull origin production
git tag -a [NEXT_VERSION] -m "Release [NEXT_VERSION]"
git push origin [NEXT_VERSION]
```

### 11.2 Create GitHub Release (conditional on pipeline)

**IF `PIPELINE_HANDLES_RELEASE = true`:**

Do NOT run `gh release create`. The pipeline triggered by the tag push handles everything.

Display:
```text
Tag [NEXT_VERSION] pushed.
Pipeline triggered — monitoring:

  gh run list --limit 5

Pipeline will: [repeat what was detected in STEP 1]
```

**IF `PIPELINE_HANDLES_RELEASE = false`:**

Write changelog to temp file, then execute:
```bash
gh release create [NEXT_VERSION] --target production --title "[NEXT_VERSION]" --notes-file [TEMP_FILE]
```

Display:
```text
Release created.

Tag: [NEXT_VERSION]
URL: [RELEASE_URL]

View:
  gh release view [NEXT_VERSION]
```

---

## STEP 12: List Releases (`--list` mode)

Execute in parallel:
```bash
git tag --sort=-v:refname --format='%(refname:short) %(creatordate:short)'
```

```bash
gh release list
```

Display combined results in table format (`Version`, `Date`, `Title`) and total count.

If no releases exist, display:
```text
No releases found. Run /add.release to create the first one.
```

---

## Rules

```json
ALWAYS:
- Check gh CLI before any git/gh operation
- Stop if gh is missing or unauthenticated
- Read ALL release pipeline workflows in STEP 1 before anything else
- Set PIPELINE_HANDLES_RELEASE based on workflow scan
- Require execution from main branch
- Run git fetch --tags before reading tags (STEP 4)
- Update CLI package version before merging
- Commit and push version bump to main
- Merge main into production before creating tag
- Ask explicitly whether to create tag/release
- Generate changelog from source files only (framwork/.codeadd/, cli/, docs/)
- Treat provider dirs as generated — summarize as one line, not individual files
- Show preview before creating tag/release
- Use annotated tags
- If PIPELINE_HANDLES_RELEASE = true: only push tag, never call gh release create
- If PIPELINE_HANDLES_RELEASE = false: create release with --notes-file and --target production
- Omit empty changelog sections

NEVER:
- Run node scripts/build.js — that is the pipeline's job
- Commit generated provider files (framwork/.claude/, .agent/, etc.) — pipeline generates them
- Create tag/release before production merge
- Skip pipeline read (STEP 1)
- Skip user choice about tag creation
- Create release outside production
- Use lightweight tags
- Generate notes only from commit messages
- Proceed after merge failure
- Push tags without explicit approval
- Create CHANGELOG.md files in this command
- Call gh release create when pipeline already handles it
```

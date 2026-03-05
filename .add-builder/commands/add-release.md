# Release Manager

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Coordinates release flow with mandatory `main -> production` merge, optional tag/release creation, and changelog generated from diff against the previous release.

---

## Spec

```json
{"gates":["response_lang_set","gh_authenticated","branch_is_main","tag_choice_defined","version_confirmed_if_tag","preview_approved_if_tag","production_merge_completed"],"modes":{"create":"STEP 0-10","list":"STEP 0 + STEP 11"},"order":["prerequisites","branch_check","ask_tag","detect_tag","choose_version","update_cli_version","merge_to_production","release_notes","preview","confirm","create_release"]}
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
- If argument contains `--list`: execute STEP 0 and STEP 11 only.
- If no `--list`: execute STEP 0-10 in order.

STEPS IN ORDER (create mode):
```
STEP 0: Check prerequisites             -> gh CLI + auth
STEP 1: Validate source branch          -> must be main
STEP 2: Ask tag creation                -> yes/no
STEP 3: Detect latest tag               -> git tag
STEP 4: Choose next version             -> patch/minor/major
STEP 5: Update CLI Package Version      -> update cli/package.json + commit + push
STEP 6: Merge main into production      -> push production
STEP 7: Generate changelog              -> compare previous release vs production
STEP 8: Preview                         -> show tag + changelog
STEP 9: Confirm release creation        -> explicit approval
STEP 10: Create tag + GitHub Release    -> git tag + gh release create
STEP 11: List Releases (--list mode)    -> list all releases
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

## STEP 1: Validate Source Branch

Execute:
```bash
git branch --show-current
```

If branch is not `main`, display:
```text
You must run /add-release from main.

Current branch: [BRANCH]

Run:
  git checkout main
  git pull origin main
```

Stop execution.

---

## STEP 2: Ask Tag Creation

Ask user:
```text
Do you want to create a release tag after merging to production?
```

Options:
- Yes: continue to STEP 3.
- No: continue to STEP 6 (merge only, no tag/release).

If user chooses `No`, proceed with merge-only flow:
- Execute STEP 6 (Merge main into production).
- Display completion message.
- Stop execution (no tag/release created).

---

## STEP 3: Detect Latest Tag

Execute:
```bash
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

## STEP 4: Choose Next Version

If `LATEST_TAG` exists (`vX.Y.Z`):
- `patch` -> `vX.Y.(Z+1)` for fixes and small changes.
- `minor` -> `vX.(Y+1).0` for new commands/skills/features.
- `major` -> `v(X+1).0.0` for breaking changes.

If first release:
- Recommend `v1.0.0`.

Ask user to choose bump type (`patch`, `minor`, `major`) and store as `NEXT_VERSION`.

---

## STEP 5: Update CLI Package Version

**CRITICAL:** Before merging to production, the CLI package version must match the release tag.

### 5.1 Read current version

Execute:
```bash
cat cli/package.json | grep '"version"'
```

### 5.2 Update version in cli/package.json

Replace the version field with `NEXT_VERSION` (without the `v` prefix).

Execute:
```bash
# Extract version number without 'v' prefix
VERSION_NUMBER=$(echo "$NEXT_VERSION" | sed 's/^v//')
sed -i "s/\"version\": \"[0-9.]*\"/\"version\": \"$VERSION_NUMBER\"/" cli/package.json
```

### 5.3 Verify the change

Execute:
```bash
cat cli/package.json | grep '"version"'
```

### 5.4 Commit and push the version bump

Execute:
```bash
git add cli/package.json
git commit -m "chore: bump version to $NEXT_VERSION"
git push origin main
```

On success, display:
```text
CLI package.json updated to version [NEXT_VERSION]
Committed and pushed to main.
```

---

## STEP 6: Merge Main Into Production

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

## STEP 7: Generate Changelog

Use `production` as source of truth after STEP 6 merge.

### 7.1 File diff

If `LATEST_TAG` exists, execute:
```bash
git diff --name-status [LATEST_TAG]..production
```

If first release, execute:
```bash
git log production --name-status --pretty=format:""
```

Group files by:
- Commands (Claude): `framwork/.claude/commands/*.md`
- Commands (CodeADD): `framwork/.codeadd/commands/*.md`
- Workflows (Agent): `framwork/.agent/workflows/*.md`
- Skills (CodeADD): `framwork/.codeadd/skills/**`
- Skills (Agent): `framwork/.agents/skills/**`
- Scripts: `framwork/.codeadd/scripts/*`
- Docs: `docs/**`
- Other: everything else

Classify each file as Added (`A`), Modified (`M`), Deleted (`D`).

### 7.2 PRD scan

Read `docs/prd/` when directory exists.

Filter PRDs where:
- Status is not `draft`.
- Created/updated date is on or after `LATEST_TAG` date.
- If first release, include all non-draft PRDs.

### 7.3 Assemble changelog/release notes

Format (omit empty sections):
```markdown
## Commands
- Added: [list]
- Modified: [list]
- Removed: [list]

## Workflows
- Added: [list]
- Modified: [list]

## Skills
- Added: [list]
- Modified: [list]

## Scripts
- Added: [list]
- Modified: [list]

## PRDs Implemented
- PRDXXXX: [title]

## Statistics
X files changed, Y added, Z removed
```

---

## STEP 8: Preview

Display:
```text
Release Preview

Tag:    [NEXT_VERSION]
From:   [LATEST_TAG or "(first release)"]
Target: production

[ASSEMBLED CHANGELOG]
```

---

## STEP 9: Confirm Release Creation

Ask user:
```text
Create this release tag and GitHub Release?
```

Options:
- Yes: continue to STEP 10.
- No: display `Release cancelled after preview.` and stop.

---

## STEP 10: Create Tag and GitHub Release

Execute:
```bash
git checkout production
git pull origin production
git tag -a [NEXT_VERSION] -m "Release [NEXT_VERSION]"
git push origin [NEXT_VERSION]
```

Write notes to temp file, then execute:
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

## STEP 11: List Releases (`--list` mode)

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
No releases found. Run /add-release to create the first one.
```

---

## Rules

```json
{"do":["Check gh CLI first","Stop if gh is missing or unauthenticated","Require execution from main branch","Update CLI package version before production merge","Commit and push version bump to main","Merge main into production after version update","Ask explicitly whether to create tag/release","Generate changelog by comparing previous tag against production","Show preview before creating tag/release","Use annotated tags","Use gh release with --notes-file and --target production","Omit empty changelog sections"],"dont":["Create tag/release before production merge","Skip user choice about tag creation","Create release outside production","Use lightweight tags","Generate notes only from commit messages","Proceed after merge failure","Push tags without explicit approval","Create CHANGELOG.md files in this command"]}
```

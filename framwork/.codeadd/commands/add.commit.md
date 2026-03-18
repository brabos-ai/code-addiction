# Smart Commit

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Mid-workflow commit: analyzes the changeset and generates a Conventional Commits message adapted to the number of files changed.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Analyze changeset     → count files, security check
STEP 2: Read diff             → infer type and scope
STEP 3: Generate message      → adaptive (≤3 vs >3 files)
STEP 4: Stage files           → only if nothing staged
STEP 5: Commit                → git commit with generated message
STEP 6: Push (if --push)      → git push

**⛔ ABSOLUTE PROHIBITIONS:**

IF `.env`, `*.key`, `secrets.*`, `*.pem`, `*.p12` appear in `git status --short`:
  ⛔ DO NOT: Run git add -A
  ⛔ DO NOT: Stage any files
  ✅ DO: Warn user, list sensitive files, STOP

IF type is ambiguous AND `--confirm` flag is NOT set:
  ⛔ DO NOT: Commit silently with wrong type
  ✅ DO: Show inferred type, ask user to confirm before committing

---

## STEP 1: Analyze changeset

Run `git status --short`. Count ALL output lines as N — includes tracked modified (`M`, ` M`), staged (`A`, `M `), and untracked (`??`) files.

**⚠️ Security check (ALWAYS — even with --push):** If `.env`, `*.key`, `secrets.*`, `*.pem`, `*.p12` appear → STOP (see prohibitions above).

---

## STEP 2: Read diff

```bash
git diff HEAD           # unstaged tracked changes
git diff --cached HEAD  # staged changes
```

Use untracked file names from `git status --short` for additional context. Determine:

- **Type** — infer from diff content:

| Type | When to use |
|------|-------------|
| `feat` | New feature, new functionality |
| `fix` | Bug fix, error correction |
| `refactor` | Code restructure without behavior change |
| `chore` | Config, deps, scripts, tooling |
| `docs` | Documentation only |
| `test` | Test files only |
| `style` | Formatting, whitespace, lint fixes |

- **Scope** — main module/directory affected (optional, use when clear)

If type is ambiguous → show inferred type and ask user to confirm.

---

## STEP 3: Generate message

**≤ 3 files changed** — single-line:
```
type(scope): objective description in present tense
```

**> 3 files changed** — list format:
```
type: general summary

- context/module: what changed
- context/module: what changed
```

Default: commit immediately with generated message — no confirmation needed.

IF `--confirm` flag: show message and wait for user confirmation or adjustment before proceeding to STEP 4.

---

## STEP 4: Stage files

If staged changes exist → use as-is, skip to STEP 5.

If nothing staged → run `git add -A`.

IF `--confirm` flag: inform user before running `git add -A`.

---

## STEP 5: Commit

```bash
git commit -m "generated message"
```

---

## STEP 6: Push (if --push flag)

```bash
git push
```

---

## Completion

Commit done. Clarify: this is a mid-workflow commit — use `/add.done` to finalize the branch.

| Intent | Command |
|--------|---------|
| Keep developing | More commits → `/add.commit` |
| Finalize branch + push | `/add.done` |
| Create PR now | `/add.pr` |

---

## Rules

ALWAYS:
- Run `git status --short` first — count files and detect sensitive files
- Apply adaptive message format (≤3 files single-line, >3 files list)
- Warn about sensitive files before staging — regardless of any flag

NEVER:
- Amend previous commits
- Force push
- Create PRs (use `/add.pr`)
- Auto-stage `.env`, `*.key`, `secrets.*`, `*.pem`, `*.p12`
- Reference `/add-push` — does not exist; push is via `--push` flag or `/add.done`

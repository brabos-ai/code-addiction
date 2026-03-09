---
name: add-commit
description: "Use when committing changes mid-workflow with smart message generation. Triggers: commit, git commit, salvar progresso, checkpoint, conventional commits, push changes, commitar, fazer commit."
---

# add-commit — Smart Commit

Smart commit for mid-workflow progress: analyzes the changeset and generates a Conventional Commits message adapted to the number of files changed.

## When to Use

- Mid-workflow commits during feature development
- Saving progress checkpoints before risky changes
- Any `git commit` with automatic message generation
- Quick commits with optional `--push` in one step

## When NOT to Use

- **Finalizing a branch** → use `/add-done` instead
- **Creating a PR** → use `/add-pr`
- **Force push, rebase, or amend** → out of scope
- **Specific file staging** → stage manually first, then use this skill

## Adaptive Message Logic

The message format adapts to changeset size:

**≤ 3 files changed** — single-line message:
```
type(scope): objective description in present tense
```

**> 3 files changed** — list format:
```
type: general summary

- context/module: what changed
- context/module: what changed
- context/module: what changed
```

## Conventional Commits Type Detection

Infer the type from the diff content:

| Type | When to use |
|------|-------------|
| `feat` | New feature, new functionality |
| `fix` | Bug fix, error correction |
| `refactor` | Code restructure without behavior change |
| `chore` | Config, deps, scripts, tooling |
| `docs` | Documentation only |
| `test` | Test files only |
| `style` | Formatting, whitespace, lint fixes |

When ambiguous, show the inferred type and ask the user to confirm.

## Execution Flow

**STEP 1 — Analyze changeset:**
```bash
git diff --stat HEAD
git diff --stat --cached HEAD  # also check staged
```
Count total changed files (N). Read the diff to understand what changed.

**STEP 2 — Infer commit type and scope:**
Based on diff content, determine the Conventional Commits type.
Scope = the main module/directory affected (optional, use when clear).

**STEP 3 — Generate message:**
Apply adaptive logic (≤ 3 vs > 3 files).
Present the generated message to the user for confirmation or adjustment.

**STEP 4 — Handle staging:**
```bash
git status
```
- If staged changes exist → use them as-is
- If nothing staged → run `git add -A` and inform the user

**⚠️ Security check before staging:**
If `.env`, `*.key`, `secrets.*`, `*.pem`, `*.p12` appear in the diff, WARN the user before proceeding.
```
⚠️ Sensitive files detected: [list files]
Proceed with git add -A? (y/n)
```

**STEP 5 — Commit:**
```bash
git commit -m "generated message"
```

**STEP 6 — Push (if --push flag):**
```bash
git push
```

## Examples

**Few files (≤ 3):**
```
feat(auth): add JWT refresh token endpoint
```

**Many files (> 3):**
```
refactor: extract service layer from controllers

- auth: move login/register logic to AuthService
- user: extract UserService from UserController
- order: decouple OrderService dependencies
- shared: add BaseService abstract class
```

## Rules

ALWAYS:
- Show the generated message before committing — never commit silently
- Warn about sensitive files before `git add -A`
- Clarify to the user: this is for mid-workflow commits, use `/add-done` to finalize the branch

NEVER:
- Amend previous commits
- Force push
- Create PRs (that's `/add-pr`)
- Replace `/add-done` for branch finalization

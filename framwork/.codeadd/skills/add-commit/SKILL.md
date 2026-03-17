---
name: add-commit
description: "Knowledge reference for smart mid-workflow commits: adaptive Conventional Commits message logic, type detection, and staging rules."
---

# add-commit — Smart Commit

## When to Use

- Mid-workflow commits during feature development
- Saving progress checkpoints before risky changes
- Any `git commit` with automatic message generation
- Quick commits with optional `--push` in one step

## When NOT to Use

- **Finalizing a branch** → use `/add.ship` instead
- **Creating a PR** → use `/add.pr`
- **Force push, rebase, or amend** → out of scope
- **Specific file staging** → stage manually first, then use the command

---

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

---

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

---

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

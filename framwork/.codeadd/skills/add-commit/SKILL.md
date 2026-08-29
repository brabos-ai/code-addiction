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

- **Finalizing a branch** → use `/add.done` instead
- **Creating or updating a PR** → use `/add.pull-request`
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

## Staging Rules

Feature docs live **untracked** until their build starts, so a documental command run mid-development can leave **another feature's** `docs/features/<other>/` untracked in the working tree. NEVER sweep those into the current feature's commit.

**Canonical feature-scoped staging** (stage all code changes + ONLY the current feature's docs):

```bash
git add -A -- . ':(exclude)docs/features/*'
[ -d "${FEATURE_DIR}" ] && git add -A -- "${FEATURE_DIR}"
```

`${FEATURE_DIR}` is the current feature's `docs/features/[NNNN][L]-<slug>` dir. The exclude pathspec keeps every other feature's untracked docs out of the index; the second `add` re-includes only the current one.

---

## Checkpoint Trailer (autonomous runs only)

A commit made by `{{cmd:add.plan-to-ready}}` at a subfeature boundary carries the
convergence result as a **trailer**, so the checkpoint says why it was safe to
stop there. The commit hash then points at the work AND at the proof.

The trailer is `converge-gates.sh`'s **stdout, verbatim** — the same `KEY=STATUS`
lines the command read to decide convergence, appended below the Conventional
Commits body:

```
feat(0028F-SF02): persist receipt line total on duplicate

- backend: enforce RN03 on the duplicate path
- frontend: surface the persisted total in the header

GATE_REVIEW=ok
GATE_QA_BASELINE=ok
GATE_EPIC=ok
GATE_COVERAGE=ok
GATES_OK=4/4
```

⛔ DO NOT reformat, summarise, or re-word the gate lines. They are copied, not
authored — a reformatted trailer is indistinguishable from an invented one, and
the whole point is that `git log --grep=GATES_OK` reconstructs which
subfeatures converged and on what evidence, using nothing but git.

⛔ DO NOT write a trailer on a commit whose subfeature did not converge. That
commit does not exist: the checkpoint is gated on all four gates reading `ok`,
and the ABSENCE of a commit is itself the signal.

**No new state file.** The trailer lives in the commit message, which is why
this mechanism does not violate `{{cmd:add.plan-to-ready}}`'s NO NEW STATE
invariant — a commit message is not a second source of truth that can drift
from the tree, it is part of the object that carries the tree.

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

---
name: add-id-convention
description: Use when allocating feature/hotfix/refactor/chore/docs IDs or creating branches — canonical `[NNNN][L]` format that the scripts (next-id.sh, get-branch-metadata.sh, done.sh) expect
---

# ID & Branch Naming Convention

## Overview

Single source of truth for how feature/hotfix/refactor/chore/docs IDs and branches are formatted across the ADD ecosystem. The scripts enforce this format; commands that diverge (e.g., letter-first `H0001` instead of `0001H`) produce branches that `done.sh` cannot parse.

## When to Use

- Before allocating a new ID via `status.sh next-id`
- Before running `git checkout -b` for feature/hotfix/refactor/chore/docs branches
- Before writing `id:` in a doc frontmatter
- When writing `{{doc:ID}}` references

## When NOT to Use

- Scripts that already implement the convention (`next-id.sh`, `get-branch-metadata.sh`) — they are the authority, not this doc
- Unrelated IDs (e.g., `CHG[NNNN]` for changelogs — different namespace, no letter suffix)

## Canonical Format

```
[NNNN][L]
```

- `[NNNN]` — 4-digit zero-padded decimal (`0001`, `0042`, `1337`)
- `[L]` — single uppercase letter suffix identifying the work type

### Letter suffixes

| Letter | Type |
|--------|------|
| `F` | feature |
| `H` | hotfix |
| `R` | refactor |
| `C` | chore |
| `D` | docs |
| `P` | perf |
| `T` | test |

Must match the regex in `.codeadd/scripts/get-branch-metadata.sh` (`[0-9]{4}[A-Z]`).

### Branch format

```
[type]/[NNNN][L]-[kebab-slug]
```

Examples:
- `feature/0001F-auth-system`
- `hotfix/0001H-login-timeout`
- `refactor/0007R-extract-parser`
- `chore/0003C-bump-deps`
- `docs/0002D-readme-sync`

### Doc ID / frontmatter

```yaml
id: 0001H
```

### Cross-references

```
{{doc:0001H}}
```

## Allocation (MANDATORY)

Always via:

```bash
bash .codeadd/scripts/status.sh next-id <LETTER>
```

Examples: `status.sh next-id F` → `0001F`, `status.sh next-id H` → `0001H`.

Never hand-roll IDs. Never reuse an ID from another namespace.

## Forbidden Patterns

| Wrong | Right | Why |
|-------|-------|-----|
| `H0001` | `0001H` | Letter-first breaks `get-branch-metadata.sh` regex |
| `F42` | `0042F` | Must be zero-padded to 4 digits |
| `0001h` | `0001H` | Letter must be uppercase |
| `hotfix/H0001-x` | `hotfix/0001H-x` | Branch format follows ID format |
| `F[NNNN]` (in docs) | `[NNNN]F` | Placeholder follows canonical order |

## Validation Checklist

```
[ ] ID matches /^[0-9]{4}[A-Z]$/
[ ] Branch matches /^[a-z]+\/[0-9]{4}[A-Z]-[a-z0-9-]+$/
[ ] ID allocated via `status.sh next-id <LETTER>` (not hand-rolled)
[ ] Frontmatter `id:` uses the same format (no `L[NNNN]` variant)
[ ] `{{doc:...}}` references use `[NNNN][L]` order
```

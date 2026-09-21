---
name: add-id-convention
description: Use when allocating feature/hotfix/refactor/chore/docs/backlog IDs or creating branches — canonical `[NNNN][L]` format that the scripts (next-id.sh, get-branch-metadata.sh, build-setup.sh, done.sh) expect
---

# ID & Branch Naming Convention

<!-- uses:
- skill: add-doc-schemas
- command: /add.build
- command: /add.new
- command: /add.plan
- command: /add.review
- script: build-setup.sh
- script: done.sh
- script: get-branch-metadata.sh
- script: next-id.sh
- mention: init.sh
- script: qa-evidence.sh
- script: status.sh
-->

## Overview

Scripts enforce this format; commands that diverge (e.g., letter-first `H0001` instead of `0001H`) produce branches that `done.sh` cannot parse.

## When to Use

- Before allocating a new ID via `status.sh next-id`
- Before `/add.new` records `branch:` in about.md frontmatter, and before `/add.build`'s `build-setup.sh` runs `git checkout -b` for feature/hotfix/refactor/chore/docs branches
- Before writing `id:` in a doc frontmatter
- When writing `{{doc:ID}}` references

## When NOT to Use

- Scripts that already implement the convention (`next-id.sh`, `get-branch-metadata.sh`, `build-setup.sh`) — they are the authority, not this doc
- Unrelated IDs (e.g., `CHG[NNNN]` for changelogs — different namespace, no letter suffix)
- Provider-specific issue trackers (Jira/Linear) — they own their own ID schemes

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
| `B` | backlog ticket — decided, not started |

Must match the regex in `.codeadd/scripts/get-branch-metadata.sh` (`[0-9]{4}[A-Z]`).

⛔ **`B` IS THE ONE LETTER WITH NO BRANCH.** A ticket records work that has not started, so there is
nothing to check out. When the ticket becomes work, that work allocates its own id of the matching
type — `0007B` becomes feature `0012F`, not `feature/0007B-...`. The ticket keeps a `work_id` field
pointing at the id it became, and the two stay distinct.

```
IF A TICKET IS BEING PICKED UP:
  ⛔ DO NOT USE: Bash for git checkout -b on a B id
  ⛔ DO NOT: Reuse the ticket's number for the work — the counter is global and 0007 is spent
  ✅ DO: Allocate a new id of the work's own type, and record it on the ticket
```

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

### Usage in docs

Frontmatter `id:` and `{{doc:...}}` references both use the canonical format:

```yaml
id: 0001H
```

```
{{doc:0001H}}
```

## Allocation (MANDATORY)

Always via:

```bash
bash .codeadd/scripts/status.sh next-id <LETTER>
```

Examples: `status.sh next-id F` → `0001F`, `status.sh next-id H` → `0001H`,
`status.sh next-id B` → `0001B`.

Never hand-roll IDs. Never reuse an ID from another namespace.

### One counter, two sources, two implementations

The number is global across every letter. It is the max over **both** the
`docs/features/[NNNN][L]-*/` directories **and** the ids already on the backlog board,
`docs/backlog.jsonl` — counting only the first would hand out a number a ticket already holds.

⛔ **`status.sh next-id` DOES NOT CALL `next-id.sh`. It reimplements the scan.** Every command
allocates through `status.sh`; only `init.sh` calls `next-id.sh` directly. Nothing in the code holds
the two equal, and they have diverged before: `status.sh` matched four digits anywhere in the find
path, so a slug like `0001F-auth-2024` returned `2025F` where `next-id.sh` returned `0002F` — two
thousand ids burnt, silently, on the path every command uses.

```
IF CHANGING HOW AN ID IS ALLOCATED:
  ⛔ DO NOT: Change one allocator and leave the other — they answer the same question
  ⛔ DO NOT: Make either parse JSON to read the backlog — both are pure bash, and a node
             dependency here reaches every /add.new
  ✅ DO: Change `next-id.sh` and `status.sh` in the same commit
  ✅ DO: Run the NEXT_ID_AGREE assertions in `.codeadd/scripts/tests/backlog.bats` — they are
         the only gate that holds the two together
```

**Both read the backlog by grep, never by parse.** A line whose JSON is damaged still yields its id,
so a hand-broken board can never block an allocation. An absent board is a no-op: a project with no
`docs/backlog.jsonl` gets exactly the id it got before.

## Per-Scope Sequence IDs (qa-validation-NNN)

Not every artefact uses the global `[NNNN][L]` convention. QA validation reports (written by the QA judgement `qa-pipeline` adds to `/add.review`) use a **per-scope sequence** so each scope keeps its own local regression history.

- **Format:** `<feature-id>-qa-validation-NNN` (e.g. `0001F-qa-validation-003`), `NNN` zero-padded from `001`. Filename: `_tests/run-NNN/qa-validation-NNN.md` (the `id:` stem matches the filename).
- **Scope = the report's folder:** the subfeature folder when scoped to an SF, the feature folder otherwise. Two SFs of the same feature each have their own `qa-validation-001`.
- **Allocation:** run `bash .codeadd/scripts/qa-evidence.sh next "<scope-dir>"`. It takes the highest ID from working `_tests/run-NNN/` plus immutable `_tests/final/run-NNN/`, then adds 1. NOT via `status.sh next-id` (that allocator serves `[NNNN][L]` types only). The supported sequence ends at `run-999` and fails loud instead of wrapping.

Distinct from `[NNNN][L]`: `NNN` is a 3-digit per-scope run number, no letter suffix, NOT globally unique. See the `qa-validation` schema in `{{skill:add-doc-schemas/SKILL.md}}`.

## SF-Qualified IDs (subfeature-scoped docs)

An epic feature holds N subfeatures, and some docs are written **per subfeature** — notably `design.md`, which `/add.plan` STEP 7.1 writes into `${FEATURE_DIR}/subfeatures/SFxx-<slug>/`. All N files would otherwise carry the same `id: [NNNN]F`, so single-path ID resolution (`grep -rE "^id: <ID>$" docs/`, the validation gate's `{{doc:}}` reverse lookup) returns N hits and cannot name one document.

- **Format:** `[NNNN]F-SFxx` (e.g. `0042F-SF03`) — the feature ID, a hyphen, then the subfeature key exactly as `epic.md` spells it (`SF` + 2-digit zero-padded).
- **When:** the doc lives under `subfeatures/SFxx-*/`. A feature-level `design.md` (non-epic feature) keeps the plain `[NNNN]F`.
- **`related:`** still points at the plain feature ID: `related: [[NNNN]F]`. The suffix disambiguates the document, not the feature it belongs to.
- **Not a new namespace:** `-SFxx` is a qualifier on an existing ID, never allocated via `status.sh next-id`.

```yaml
id: 0042F-SF03         # docs/features/0042F-billing/subfeatures/SF03-invoices/design.md
type: feature-design
related: [0042F]
```

## Forbidden Patterns

| Wrong | Right | Why |
|-------|-------|-----|
| `H0001` | `0001H` | Letter-first breaks `get-branch-metadata.sh` regex |
| `F42` | `0042F` | Must be zero-padded to 4 digits |
| `0001h` | `0001H` | Letter must be uppercase |
| `hotfix/H0001-x` | `hotfix/0001H-x` | Branch format follows ID format |
| `F[NNNN]` (in docs) | `[NNNN]F` | Placeholder follows canonical order |
| `0042F-sf3` | `0042F-SF03` | SF key is uppercase and 2-digit zero-padded |
| Same `0042F` on every subfeature `design.md` | `0042F-SF01`, `0042F-SF02`, … | N docs with one ID break single-path ID resolution |

## Validation Checklist

```
[ ] ID matches /^[0-9]{4}[A-Z]$/ (or /^[0-9]{4}F-SF[0-9]{2}$/ for a subfeature-scoped doc)
[ ] Branch matches /^[a-z]+\/[0-9]{4}[A-Z]-[a-z0-9-]+$/
[ ] ID allocated via `status.sh next-id <LETTER>` (not hand-rolled)
[ ] Frontmatter `id:` uses the same format (no `L[NNNN]` variant)
[ ] `{{doc:...}}` references use `[NNNN][L]` order
```

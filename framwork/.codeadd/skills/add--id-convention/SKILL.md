---
name: add--id-convention
description: Use when allocating feature/hotfix/refactor/chore/docs/backlog IDs or creating branches — canonical `[NNNN][L]` format that the scripts (next-id.cjs, get-branch-metadata.cjs, build-setup.cjs, done.cjs) expect
---

# ID & Branch Naming Convention

<!-- uses:
- skill: add--doc-schemas
- command: /add-build
- command: /add-new
- command: /add-plan
- command: /add-review
- script: build-setup.cjs
- script: done.cjs
- script: get-branch-metadata.cjs
- script: next-id.cjs
- script: backlog-cli.cjs
- script: backlog-id.cjs
- mention: init.cjs
- script: qa-evidence.cjs
- script: status.cjs
-->

## Overview

Scripts enforce this format; commands that diverge (e.g., letter-first `H0001` instead of `0001H`) produce branches that `done.cjs` cannot parse.

## When to Use

- Before allocating a new ID via `status.cjs next-id`
- Before `/add-new` records `branch:` in about.md frontmatter, and before `/add-build`'s `build-setup.cjs` runs `git checkout -b` for feature/hotfix/refactor/chore/docs branches
- Before writing `id:` in a doc frontmatter
- When writing `{{doc:ID}}` references

## When NOT to Use

- Scripts that already implement the convention (`next-id.cjs`, `get-branch-metadata.cjs`, `build-setup.cjs`) — they are the authority, not this doc
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

Must match the regex in `.codeadd/scripts/get-branch-metadata.cjs` (`[0-9]{4}[A-Z]`).

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
node .codeadd/scripts/status.cjs next-id <LETTER>
```

Examples: `status.cjs next-id F` → `0001F`, `status.cjs next-id H` → `0001H`.

**A BACKLOG TICKET is the exception: allocation is native.** `backlog-id.cjs`, invoked through
`node .codeadd/scripts/backlog-cli.cjs add --record-file <ticket.json>`, computes the same global
counter at the operation root — the bash call above stays valid for B (the wrapper keeps answering),
but the route the agent runs for a ticket is the CLI add, and `10000B` refuses like the wrapper's
filter always did.

Never hand-roll IDs. Never reuse an ID from another namespace.

### One counter, two sources, one implementation

The number is global across every letter. It is the max over **both** the
`docs/features/[NNNN][L]-*/` directories **and** the ids already on the backlog board,
`docs/backlog.jsonl` — counting only the first would hand out a number a ticket already holds.

**`backlog-id.cjs` is the one allocator, and it is native.** It computes the max+1 from both
sources, anchored on the raw text, and every route delegates to it: `next-id.cjs` (one uppercase
A-Z letter, exit 1 on a bad argument), `status.cjs next-id` (named
prefixes F|H|PRD|CHG|B, exit 2 on a bad prefix), `backlog-cli.cjs add` and the `init.cjs` seed are
thin adapters that differ only in their public argument validation and exit codes. The local CLI
allocates for you
when `add` runs — `node .codeadd/scripts/backlog-cli.cjs add --record-file <ticket.json>` needs no
allocator call. `10000` overflows are refused (`ERROR=id-allocation-failed`) rather than emitted.

```
IF CHANGING HOW AN ID IS ALLOCATED:
  ⛔ DO NOT: Copy the scan into an entry — the old `next-id.sh` / `status.sh` pair did, and they
             diverged
  ⛔ DO NOT: Parse JSON to read the backlog — the core reads it by raw-text anchor, so a damaged
             line still yields its id
  ✅ DO: Change the scan only in `backlog-id.cjs`; every entry delegates there
  ✅ DO: Run the native allocator contract tests — `cli/tests/backlog-id.test.js` pins the
         canonical core, and `scripts/tests/status.test.cjs` pins `status next-id` against it
```

**The core reads the backlog by raw-text anchor, never by parse.** A line whose JSON is damaged
still yields its id, so a hand-broken board can never block an allocation. An absent board is a
no-op: a project with no `docs/backlog.jsonl` gets exactly the id it got before.

## Per-Scope Sequence IDs (qa-validation-NNN)

Not every artefact uses the global `[NNNN][L]` convention. QA validation reports (written by the QA judgement `qa-pipeline` adds to `/add-review`) use a **per-scope sequence** so each scope keeps its own local regression history.

- **Format:** `<feature-id>-qa-validation-NNN` (e.g. `0001F-qa-validation-003`), `NNN` zero-padded from `001`. Filename: `_tests/run-NNN/qa-validation-NNN.md` (the `id:` stem matches the filename).
- **Scope = the report's folder:** the subfeature folder when scoped to an SF, the feature folder otherwise. Two SFs of the same feature each have their own `qa-validation-001`.
- **Allocation:** run `node .codeadd/scripts/qa-evidence.cjs next "<scope-dir>"`. It takes the highest ID from working `_tests/run-NNN/` plus immutable `_tests/final/run-NNN/`, then adds 1. NOT via `status.cjs next-id` (that allocator serves `[NNNN][L]` types only). The supported sequence ends at `run-999` and fails loud instead of wrapping.

Distinct from `[NNNN][L]`: `NNN` is a 3-digit per-scope run number, no letter suffix, NOT globally unique. See the `qa-validation` schema in `{{skill:add--doc-schemas/SKILL.md}}`.

## SF-Qualified IDs (subfeature-scoped docs)

An epic feature holds N subfeatures, and some docs are written **per subfeature** — notably `design.md`, which `/add-plan` STEP 7.1 writes into `${FEATURE_DIR}/subfeatures/SFxx-<slug>/`. All N files would otherwise carry the same `id: [NNNN]F`, so single-path ID resolution (`grep -rE "^id: <ID>$" docs/`, the validation gate's `{{doc:}}` reverse lookup) returns N hits and cannot name one document.

- **Format:** `[NNNN]F-SFxx` (e.g. `0042F-SF03`) — the feature ID, a hyphen, then the subfeature key exactly as `epic.md` spells it (`SF` + 2-digit zero-padded).
- **When:** the doc lives under `subfeatures/SFxx-*/`. A feature-level `design.md` (non-epic feature) keeps the plain `[NNNN]F`.
- **`related:`** still points at the plain feature ID: `related: [[NNNN]F]`. The suffix disambiguates the document, not the feature it belongs to.
- **Not a new namespace:** `-SFxx` is a qualifier on an existing ID, never allocated via `status.cjs next-id`.

```yaml
id: 0042F-SF03         # docs/features/0042F-billing/subfeatures/SF03-invoices/design.md
type: feature-design
related: [0042F]
```

## Forbidden Patterns

| Wrong | Right | Why |
|-------|-------|-----|
| `H0001` | `0001H` | Letter-first breaks `get-branch-metadata.cjs` regex |
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
[ ] ID allocated via `status.cjs next-id <LETTER>` (not hand-rolled)
[ ] Frontmatter `id:` uses the same format (no `L[NNNN]` variant)
[ ] `{{doc:...}}` references use `[NNNN][L]` order
```

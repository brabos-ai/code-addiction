# add.qa-setup — Contract Versions & Upgrade Recipes

Per-version declaration of what `/add.qa-setup` materializes, plus the exact delta to move a project from one contract version to the next. `{{skill:add-setup-contract/SKILL.md}}` executes these deltas; it never interprets them.

The framework build FAILS when the version declared in `add.qa-setup`'s `## Materializes` block has no `## vN` section here, or when the chain `## v1 … ## vN` has a hole. A recipe cannot silently rot.

## Authoring rules

- One `## vN` section per contract version. Never renumber, never delete a shipped section.
- Every section carries `### Materializes` (what a project at this version holds) and `### Delta v(N-1) → vN`.
- Deltas are **imperative and path-scoped**: each item names one path, one operation (`add field`, `rename field`, `rewrite file`, `create file`, `delete file`, `no change`), and the exact target value. No prose that requires a judgement call.
- A delta that genuinely requires a user decision is written as an explicit CONFIRM item with the options enumerated — not as an open question.
- **A prose-only change reseals, it does not bump.** `shape` hashes the whole `## Materializes` block, including its explanatory blockquote — so fixing a typo there moves the hash and the build demands attention. When nothing *materialized* changed, paste the new `shape` and leave `version` alone. Bumping instead would assert a migration that does not exist and force a `## vN` section describing a no-op delta, which is exactly the recipe rot the version chain exists to prevent.

## v1

### Materializes

| Path | Owner | Written by |
|---|---|---|
| `docs/qa/config.json` | setup | STEP 7 |
| `<provider skills dir>/qa-project/SKILL.md` | setup | STEP 6 |
| `FEATURE_DIR/_tests/screens.json` | shared (co-owner: `add.plan` STEP 10.0) | STEP 8 |

Shapes are declared in `add.qa-setup`'s `## Materializes` block, which is the single source. This table records ownership only.

### Delta v0 → v1

Not applicable — v1 is the initial contract. A project holding materialized state with no receipt is **backfilled** at v1: write the receipt from the observed state, change no other file, and log the backfill in the Decision Log.

## v2

### Materializes

| Path | Owner | Written by |
|---|---|---|
| `docs/qa/config.json` | setup | STEP 7 |
| `<provider skills dir>/qa-project/SKILL.md` | setup | STEP 6 |
| `FEATURE_DIR/_tests/screens.json` | shared (co-owner: `add.plan` STEP 10.0) | STEP 8 |
| `.gitignore` | shared | STEP 9 |

Shapes are declared in `add.qa-setup`'s `## Materializes` block. The `.gitignore` entry carries `hash: null` in the receipt because users and installer logic co-own the file.

### Delta v1 → v2

1. EXECUTE `bash .codeadd/scripts/qa-evidence.sh ensure-ignore "."`; refuse the upgrade if it fails.
2. VERIFY the operation preserved user-authored lines and the installer-owned `# ADD - managed by code-addiction` block.
3. VERIFY exactly one QA evidence block exists and contains only `docs/features/**/_tests/run-*/`.
4. DO NOT add a `!final/` or `!approved/` exception.
5. RECORD `.gitignore` under `materialized` with `owner: shared` and `hash: null`.
6. APPEND the accepted upgrade to the receipt Decision Log; never edit an existing row.

# 2026-09-07 — Delivery index: a tracked, self-verifying record of what each feature shipped

Implements `docs/plans/2026-09-07T160328-PLAN--delivery-index.md` (product layer, F1–F14).
The internal layer (design docs `-05`–`-08`) is out of scope and routed to a companion
`/add-framework--self-plan`.

## Why

Generated documentation cites features that were discarded, and features that never reached
`main` because their branch died. The failure is live in this repository: `doc-reviewer-agent`
and the `add-doc-reviewer` skill are both deleted, yet 74 occurrences across 13 files survive —
the deleted skill is drawn in the ecosystem map and published on the documentation site.

Nothing recorded what a feature delivered. `docs/features/` accumulates one folder per feature
ever *started*, all weighted equally, so an agent in discovery cannot separate shipped from
abandoned from never-merged, and reads and cites them all.

## The record

`docs/delivered.jsonl` — tracked, one minified JSON object per line, one line per delivered
feature, written only after a merge is proven. Each entry carries searchable words, commit
hashes, and 1–5 public-surface items, each anchored to a source file by a **literal substring**.

The anchor is the part that is genuinely new. `find` is not a hash, not a line number and not a
structural query — it survives reformatting, reordering, refactoring and moving between files,
which is what breaks every alternative this repo already has. A file hash was rejected for the
reason the receipt schema recorded first: a hash over a file many features touch reports drift
on every healthy project.

**Every line is a complete snapshot and the last line for an id wins.** A delta log would make a
naive `grep` return an entry without its current status — the storage format itself would cause
the stale citation this design exists to prevent.

## The corpus rule, which is the whole design

> Every file git does not ignore (`git ls-files --cached --others --exclude-standard`), minus
> `docs/`, minus the index.

Two opposite failures, one rule. A **filesystem walk** finds build output and stale local copies
of deleted artefacts and reports a deleted thing alive — this repo has three such copies of a
deleted skill in the working tree right now, so a walk would fail on this design's own motivating
example. A **tracked-only scan** fails the other way: an uncommitted source file is not garbage,
and an anchor resolving into work created an hour ago would be reported `gone`.

Both are pinned by a RED pair in `delivered.bats`, written and confirmed failing before the
script existed.

## Scripts

- **Added:** `framwork/.codeadd/scripts/delivered.sh` — three modes, following `done.sh`'s
  mode-switched precedent. Bash owns args, corpus and exit codes; an embedded node program owns
  JSON parse, validation, search and emission.
  - `write < record.json` → `ENTRY=` / `CREATED=` / `LINES=`, plus `LOOSE=<find>` for an anchor
    matching 6–20 files
  - `read <query> [--layer] [--limit N] [--no-verify]` → `MATCHED=` / `RETURNED=` / `LIMIT=` /
    `SKIPPED_LINES=`, then the entries as JSONL, pre-sorted `live → changed → superseded → gone`
  - `verify [<id>] [--repair]` → `<id>=<status>` per entry plus `REPAIRED=`
  - Exit 0 for probe results, **1** only when the filesystem refuses a write, **2** for caller
    error. The two exit-2 causes stay distinguishable by output — `REFUSED=<ban>` for a record the
    format forbids, `ERROR=node-missing` for an unmet dependency — never by a fourth code the rest
    of the script family does not have.
- **Changed:** `done.sh` gains a deterministic merge-mode pre-check and a direct-commit mode.
  Staging needed no change: `done.sh:265` already stages `docs/delivered.jsonl`.

## Format reference

- **Added:** `add-doc-schemas/references/delivery-index.md` — every field, the `{what, at, find}`
  anchor, the four statuses and their decision rules, the corpus, the reading rules, the nine hard
  bans and the `REFUSED=` vocabulary (12 names over 9 bans).

It is a **format reference, not a doc schema**, and `add-doc-schemas/SKILL.md` lists it under a
new `## Format References (NOT Doc Schemas)` H2 rather than in the Schema Index by Category. A row
in that table would declare a minified machine log to be a Markdown document an agent authors, and
the validation gate would then run against something with no schema type.

## Commands

- **`add.done`** — STEP 6.8 authors the entry and leaves it in the working tree, the path the wiki
  edits already take. STEP 7 renders it in full: name, words, and every item with its `find`.
  Nobody is asked to confirm — `/add.done` forbids confirmation gates, and a wrong entry is
  corrected by appending a new line, which is what the format is for.
- **`add.hotfix`** — STEP 4 reads the index with `--no-verify` and carries ranked, status-labelled
  candidates into `@feature-history-agent`'s dispatch. The agent's method is unchanged; only its
  starting point.
- **`add.brainstorm`** — STEP 1's unranked `docs/features/` sweep is **replaced** by the ranked
  lookup plus an `about.md` deep-read on matched entries. The old sweep weighted abandoned work
  exactly like shipped work; that is the landfill read this index exists to eliminate.
- **`add.pull-request`** — one sentence: an index entry is still owed, and `/add.done` writes it.

## Skills

- **`add-knowledge-discovery`** — an INDEX step ahead of PRESENCE (7 steps → 8), **standalone-
  loadable** so `/add.hotfix` can reach it at STEP 4. Three pieces landed together, because any two
  without the third leave the skill self-contradictory or documenting an entry point as
  unreachable: the procedure step, the *When NOT to Use* amendment (the wiki stays out of hotfix
  STEPs 4–6; the index does not), and the *When to Use* entry point. Six commands now load it.

## Features

- **Added:** `docs-pruning`, **disabled by default** — deleting a user's documentation is their
  call. Prunes `discovery.md`, `tasks.md`, `epic.md` and `review-*.md`, the four files no command
  reads after the merge.

**This narrows the umbrella's original level-2 list.** `plan.md` and `iterations.*` are KEPT:
`plan.md` is `@feature-history-agent`'s named input and `/add.diagnose`'s drift-check basis, and
`/add.new` reads `iterations.jsonl` to avoid re-work — which is this index's own job. Deleting
either would degrade exactly the discovery this design was commissioned to improve. `design.md` is
kept as a recorded exception: no post-merge reader today, but a live UI contract for as long as the
UI exists.

Two hard refusals. **No entry written this run means no pruning at all** — deleting the scaffolding
before the record exists inverts the design. And nothing untracked is ever deleted, which is what
makes "it's all in git anyway" true rather than a slogan, and what makes an interrupted run
recoverable with `git checkout --`.

## Testing

- `framwork/.codeadd/scripts/tests/delivered.bats` — 53 tests, **written and confirmed RED before
  the script existed** (intra-T1 order: F4 → F1 → F3 → F2).
- `framwork/.codeadd/scripts/tests/done.bats` — three new tests reproduce the squash-merged PR end
  to end. The design specified that path as a test with a named fallback rather than a claim; it is
  now proven, not assumed.
- `cli/tests/delivery-index.test.js` — the L2/L3/L4 matrix, authored RED before F1 (37 of 40
  assertions failing; the 3 green were regression guards that had to be green both before and
  after).
- `injection-exclusivity` and `injection-roundtrip` already iterate generically over `FEATURES`, so
  registering `docs-pruning` enrolled it in every toggle combination automatically. No duplicates
  written.

Injection surface 39 → 40, with `add.done` carrying exactly two points — the pre-existing
`gitnexus:graph-reindex`, whose anchor still resolves, and `docs-pruning:prune`. Artefact graph 204
→ 207 nodes. `contracts.json` unchanged; this plan materializes nothing.

## Two corrections to the plan, made during the build

- **The merge pre-check needed two dots, not three.** `git diff main...branch` is merge-base
  relative, so on the `/add.pull-request` route it still reports the whole feature diff — it would
  be non-empty exactly when the check needs to be empty, making the direct-commit mode dead code.
  Two dots compare the trees, which is the question the design actually asks.
- **F13 landed before F12.** `cli/tests/features.test.js` asserts every registry key has a matching
  fragment directory and has no inverse assertion, so registry-first leaves a real test red at that
  commit.

## Not included

Backfill for features delivered before the index exists — absence must keep meaning "no `/add.done`
ran", and a partial backfill would make absence mean two things. Level 3 pruning (deleting the
whole feature folder). Any change to `gitnexus`, `/add.wiki`, `@feature-history-agent`'s method or
`@git-history-agent`. Fixing `ecosystem.md` and `web/src/pages/docs.astro`, which still draw the
deleted `doc-reviewer-agent` — that is `/add-framework--sync`, independent of this plan.

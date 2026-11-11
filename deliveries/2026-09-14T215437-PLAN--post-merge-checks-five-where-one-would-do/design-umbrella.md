# Brainstorm: Command Write/Read Mismatches

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-14
> **Type:** workflow
> **Layer:** product, with one exception — subtopic 3 is `both`. Its check-removal is `internal`
> (`.claude/commands/add-framework--done.md`, this repo's own close-out command), and it carries one
> `product` F-block adding a recorded-parity-gap note to `framwork/.codeadd/commands/add.done.md`.

## Discovery

Started from a different question than the one this ends up answering. The user asked to audit the
document-creation pipeline (brainstorm → plan → build → done, both layers) for documents created
inside a git worktree that could fail to survive to `main`, or that a later command might need but
find missing.

**That specific worktree-survival question turned out to be already closed.** Three prior deliveries
built and then hardened the mechanism:

- `2026-09-09T112557-PLAN--durable-delivery-history` — created `docs/deliveries/<plan-basename>/` as
  the archive home. `/add-framework--done` STEP 6 copies the plan, the ledger, the cited brainstorm
  design and any evidence there **before** committing, so the merge carries them to `main` before
  STEP 8 can remove the worktree that held the gitignored originals.
- `2026-09-10T203053-PLAN--close-out-hardening` — added the four-state merge gate (catching a resume
  that would otherwise write a duplicate `delivered.jsonl` entry) and the five post-merge checks that
  refuse every deletion in STEP 8 until `origin/main` is proven to hold a byte-identical copy.
- `2026-09-11T014333-PLAN--product-close-out-parity` — brought the product layer's `/add.done` to the
  same shape: a four-state cross, a `GATE_LEDGER` fifth convergence gate asking whether the build even
  finished, and a PR/local merge routing table.

`@framework-discovery-agent` and a full read of `add-framework--done.md` / `add-build-ledger/SKILL.md`
confirmed this: the internal layer's STEP 6 already refuses to archive if the plan or the ledger
cannot be read from the current working tree (*"a delivery archived without its ledger loses every
ruling it made"*), and the product layer's `docs/features/${FEATURE_ID}/` documents are tracked from
the moment a command writes them — they ride the branch's own commits, not a gitignored working copy.
Two candidate gaps surfaced in this space during the conversation — `build-setup.sh` only copying
untracked docs into a worktree at creation time, and the archive-refusal STOP having no backup behind
it — and the user judged both as expected behaviour and as too unlikely to be worth building for,
respectively, after seeing the concrete mechanism explained.

**What a full sweep of all 23 commands did surface** — dispatched as two parallel research passes over
the 16 product commands, plus a direct read of the 7 internal commands and `add-build-ledger` — is a
different, real pattern: three cases where one command writes a document or checks a path, and a
different piece of the pipeline reads it wrong, and nothing in between ever notices. Two more
candidates from the same sweep (`add.review`'s `plan.md`-missing/`tasks.md`-present path, and the
worktree doc-copy timing) were checked against the actual command text and found to not occur in
practice, or to be working as intended — recorded under **Does NOT Include** below rather than left
as loose threads.

`docs/roadmap/index.md` item **5.1** — *"The close-out's post-merge checks are five where one would
do"* — was already open before this brainstorm started and is pulled in as subtopic 3, at the user's
own request. ⛔ **Its first draft trusted an earlier read of that item and was wrong.** The roadmap
was updated, same day, with a dated operator decision reached independently of this conversation;
`@plan-review-agent` caught the drift during subtopic 3's own review, and the subtopic was rewritten
against the roadmap's current text before delivery. See that subtopic's own header note.

## Context & Motivation

The three findings below have nothing to do with each other's code, but the same shape: a writer and
a reader disagree about where a document lives, or in what format, and no command, script or test
catches the disagreement. Each was found in a different corner of the framework by the same sweep, so
grouping them under one umbrella records that they were found together and lets each one ship at its
own pace, rather than forcing an artificial shared mechanism between three unrelated files.

## Problem / Opportunity

### 1. The owner/product onboarding writes to paths nothing correctly reads

`/add.init` writes `docs/product/owner.md` (schema `owner`: frontmatter + sections) and, optionally,
`docs/product/product.md`. Two other readers of the owner profile look at `docs/owner.md` — no
`product/` segment — and a third, `status.sh`, looks at the right filename but the wrong directory
too, then greps for plain-text lines (`^Nome:`, `^Nivel:`, `^Idioma:`) that `add.init`'s schema-based
writer never produces. A fourth reader, `init.sh`, repeats the exact same broken path and format.

**13 of the 16 product commands** carry a line telling the assistant to adapt its detail level to the
owner's profile via `status.sh`. Because the read has never once succeeded, that adaptation has never
once happened — it silently falls back to `intermediate` / `en-us` on every run of every command that
claims to honor it.

`docs/product/product.md`, in contrast, **is** read correctly — by `add.new.md` and `add.brainstorm.md`,
both as an optional "if it exists" context source — so it is not broken in the same way owner.md is.
The user chose to remove it anyway, since `/add.init` is its only writer and the whole onboarding
command is going.

### 2. `add.diagnose.md` disagrees with itself about its own output filename

STEP 7.1 tells the user the report will be saved as `docs/diagnose/[NNNN]-[slug].md`. STEP 8.3 actually
writes `docs/diagnose/<slug>.md` — no number, matching what the schema authority
(`add-doc-schemas/references/review.md:44`) says. A user told one path gets the other. Neither form
matches the timestamp convention (`YYYY-MM-DDTHHMMSS-<slug>`) already used by `docs/brainstorming/`
and `docs/plans/`.

### 3. `/add-framework--done` runs five post-merge checks where the step order already proves three of them

Checks 3, 4 and 5 of STEP 8 each re-confirm something STEP 6 already guarantees by construction: it
commits the archive, the index entry and the changelog in one commit, and STEP 7 merges that same
commit — so a successful merge cannot exist without the archive existing. Check 3 also breaks outright:
it runs `git show origin/main:docs/deliveries/<id>/<file-member>`, stating the full path including the
`origin/main:` prefix, and inside a worktree deep enough that the combined string exceeds Windows' path
limit, git answers `fatal: … Filename too long`, exit 128 — read by the command as "this member is
missing." Measured on 2026-09-14 closing
`2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary`: one of four members reported
missing while `git ls-tree` proved all four were on `main`. The gate that reads these checks refuses
**every** deletion in STEP 8 on a single false negative.

**Operator decision, 2026-09-14, recorded in the roadmap itself:** cut STEP 8 to the fetch and the
merge check alone; fix check 5's one real case (a ledger appended to after the archive commit) by
reordering STEP 6 to assemble the archive last, instead of checking for the divergence afterward; and
have the product layer's `/add.done` — which never grew any of the five checks — carry a recorded
reason for that rather than silence.

A second, unrelated failure in the same roadmap item: a fresh worktree has no root `node_modules`, so
the bats gate's fallback exits **127** (`bats: No such file or directory`), which the command's own
text (`:225`) does not name — it only recognizes exit 2 as a refusal.

## Proposed Solution

Each finding gets fixed at its source, in its own subtopic, rather than under one shared mechanism —
they touch unrelated files and unrelated layers, and the only thing connecting them is where they were
found. Where a candidate fix existed that patched around a mismatch instead of resolving it (keeping
`owner.md`'s broken path but correcting the reader; keeping `add.diagnose`'s inconsistency but picking
one of its two existing wrong forms), the resolving option was chosen instead. Each subtopic document
carries its own alternatives considered.

## Type of Artefact

Workflow. One command is deleted, one skill is deleted, two scripts lose a self-contained block each,
roughly seventeen commands and skills lose one or more lines or stale references each, one command's
write path changes to fix a self-disagreement, and one internal command loses three checks and reorders
one step, with a one-line note added to its product-layer sibling. No new command is created.

## Scope

### Includes

- Deleting `/add.init`, `docs/product/owner.md`, `docs/product/product.md`, the `owner` and `product`
  doc schemas, the `add-product-discovery` skill, and every reference to any of them across the
  product layer (subtopic 1).
- Renaming `add.diagnose.md`'s report path to the framework's timestamp convention, in both the step
  that promises it and the step that writes it, plus the schema authority that documents it
  (subtopic 2).
- Deleting `/add-framework--done` STEP 8 checks 3, 4 and 5, keeping only the fetch and the merge check,
  reordering STEP 6 to assemble the archive last, adding a recorded-parity-gap note to `/add.done`, and
  naming exit 127 alongside exit 2 in the bats-gate fallback text (subtopic 3).

### Does NOT Include

- Any change to `build-setup.sh`'s worktree document copy, which only runs when a worktree is created.
  **Confirmed by the user as intended behaviour, not a defect** — a worktree that already exists is not
  meant to be resynced from the primary checkout.
- Any backup or incremental-commit mechanism for `docs/plans/<plan>--ledger.md` before
  `/add-framework--done` archives it. The STOP that refuses to archive without a readable ledger
  already exists and already prevents a silent loss from reaching `main`; the user judged the
  underlying scenario (a worktree destroyed before close-out) too unlikely to build additional
  machinery for.
- Any change to `/add.review`'s STEP 3.1 handling of a missing `plan.md`. Verified across all product
  commands: `tasks.md` is written only by `add.plan`, `add.plan-to-ready`, `add.build`, `add.review` and
  `/add.done` — never by `add.hotfix` or any other path — so the scenario of `tasks.md` present without
  `plan.md` does not occur in practice.
- Any check-level change to `done.sh`. Confirmed: its `do_cleanup` already matches the shape the
  internal layer is being cut down to (a fetch plus a merge-ancestry check, nothing per-file) — the
  only product-layer edit in subtopic 3 is a documentation note recording that on purpose.

## Key Decisions

| # | Decision | Rationale | Validated |
|---|---|---|---|
| 1 | Remove the owner/product onboarding entirely rather than fix its paths | The user judged it serves no real purpose; fixing four separate broken readers (`add.md`, `add.plan.md`, `status.sh`, `init.sh`) to match a feature nobody asked to keep is more work than deleting it | ✅ |
| 2 | `docs/product/product.md` is removed together with `owner.md`, even though it is read correctly | `/add.init` is its only writer; both of its readers (`add.new.md`, `add.brainstorm.md`) already treat it as optional ("if it exists"), so losing it changes no command's control flow | ✅ |
| 3 | `add.diagnose.md`'s report adopts `YYYY-MM-DDTHHMMSS-<slug>.md`, not either of its two current disagreeing forms | Matches the convention already used by `docs/brainstorming/` and `docs/plans/`, rather than picking one arbitrary side of an internal contradiction | ✅ |
| 4 | Subtopic 3 deletes checks 3/4/5 rather than repairing check 3's path resolution | Operator decision, 2026-09-14, recorded in the roadmap: byte-level checks re-prove what STEP 6's commit-then-merge order already guarantees, and cost time and tokens for no question a successful merge doesn't already answer | ✅ |
| 5 | `build-setup.sh`'s copy-once-at-creation is not in scope | User: expected behaviour | ✅ |
| 6 | No ledger-backup mechanism is in scope | User: scenario too unlikely to justify building for | ✅ |
| 7 | `add.review`'s undefined `plan.md`-missing path is not in scope | Verified: unreachable in practice, `tasks.md` has no writer independent of the `add.plan` family | ✅ |

## Ecosystem Impact

Full per-file detail lives in each subtopic. Rolled up by subtopic:

| Subtopic | Files touched | Layer | Verified via |
|---|---|---|---|
| 1 — Remove owner/product onboarding | ~20 (1 command deleted, 1 skill deleted, 2 schema files, 2 scripts, 2 bats suites, ~15 commands/skills losing one or more lines each, `provider-map.json`) | product | `node scripts/graph.js impact/neighbors` on `add.init`, `add-product-discovery`, `status.sh`, `init.sh`; an initial grep for a top-of-file pattern, **then a full `@plan-review-agent` pass that caught 7 more body-level references the initial grep's narrow pattern missed** — see that subtopic's own Discovery section |
| 2 — `add.diagnose` naming | 2 (`add.diagnose.md`, `add-doc-schemas/references/review.md`) | product | grep confirmed no other file, and no `cli/tests/` file, names `docs/diagnose` |
| 3 — Post-merge checks are five where one would do | 2 (`.claude/commands/add-framework--done.md`, `framwork/.codeadd/commands/add.done.md`), closes `docs/roadmap/index.md` §5.1 | both | roadmap text (re-read after `@plan-review-agent` caught this subtopic's first draft citing a stale version of it) plus a direct read of STEP 8; `done.sh` read to confirm product's shape already matches the target |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| One less broken, silently-degrading personalization feature; every command that cited it gets simpler, honest text | The idea of an owner-profile-adapted tone, if anyone wants to build that correctly later, starts from nothing |
| A `add.diagnose` report path a user can trust from the command's own text | One more filename convention change existing users' scripts (if any parse `docs/diagnose/`) would need to notice |
| A close-out that never gives a false "missing" verdict, at any worktree depth, because the check that could give one is deleted rather than patched | Three checks' worth of explicit "proved it" evidence in STEP 9's report, replaced by a step-order argument recorded once in the gate's place |

| Risk | Probability | Mitigation |
|---|---|---|
| Subtopic 1 misses a reference and leaves a dangling mention of `add.init` or `owner.md` | Medium | `@plan-review-agent` already found and subtopic 1 now lists 7 body-level references a first grep pass missed; its own Risk table names the wider re-grep the plan's validation should run |
| `CLAUDE.md`'s generated inventory block still lists `add.init`/`add-product-discovery` after the delete | Low | It is regenerated by `node scripts/inventory.js`, never hand-edited; the plan's F-block for subtopic 1 runs it as part of validation |
| Subtopic 3's roadmap citation goes stale again before the plan runs | Low | The roadmap item records a dated operator decision, not an open question; a further change would need its own new decision, which this subtopic's review would have to catch the same way it caught the first one |

## Decomposition Map

| Subtopic | Design Path | Purpose |
|---|---|---|
| 1 — Remove owner/product onboarding | `2026-09-14T211914-write-read-mismatches-001-remove-owner-profile.md` | Delete `/add.init`, `owner.md`, `product.md`, both schemas, `add-product-discovery`, and every reference across the product layer |
| 2 — `add.diagnose` naming | `2026-09-14T211914-write-read-mismatches-002-diagnose-timestamp-naming.md` | Adopt the framework's timestamp filename convention for diagnose reports |
| 3 — Post-merge checks are five where one would do | `2026-09-14T211914-write-read-mismatches-003-worktree-path-length.md` | Delete `/add-framework--done` STEP 8 checks 3/4/5, reorder STEP 6, note the parity gap in `/add.done`, per roadmap 5.1 |

Every row reuses this umbrella's timestamp verbatim, and the `NNN` ordinal carries no priority — the
three subtopics are independent.

## Dependencies & Relationships

All three are fully independent: different files, no shared artefact between any pair — subtopic 3's
one product-layer file (`add.done.md`) is not touched by subtopic 1 or 2 either. Any order works; they
can also be planned and built in parallel on separate branches.

Subtopic 1 carries the widest blast radius (~20 files) and is the only one that removes a
user-visible command, so it is the one most worth planning first if only one can be picked — not
because the others depend on it, but because it is the one where an incomplete Ecosystem Impact sweep
would be most costly to discover late.

## Next Steps

Independent; plan in any order:

```
/add-framework--plan write/read mismatches — remove owner/product onboarding
/add-framework--plan write/read mismatches — diagnose timestamp naming
/add-framework--plan write/read mismatches — post-merge checks are five where one would do
```

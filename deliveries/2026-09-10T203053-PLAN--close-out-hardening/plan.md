# Plan: Close-Out Hardening — the gate's fourth state, a merge proven on main, changelog files that sort, and a history verb that answers by node

> **Status:** implemented
> **Layers:** both
> **Type:** command
> **Created:** 2026-09-10

---

## Context

The close-out was exercised end to end for the first time on 2026-09-10, delivering
`prompt-quality-ruler` (PR #49). Four defects surfaced, three in `/add-framework--done` and one in a
tool that every plan's analysis depends on. All four were found by running the command, not by reading
it.

**This plan carries its decisions inline.** No design document precedes it: the four defects are
observations with evidence, not a design space that needed exploring.

| Source | What it established |
|---|---|
| `docs/deliveries/2026-09-09T112557-PLAN--durable-delivery-history/plan.md` | STEP 6 archives before the commit, `origin` is `docs/deliveries/<id>/`, the pre-merge `cmp` proof, and the STEP 8 "no durable copy → do not rm" prohibition this plan extends past the merge. It scoped `docs/changelog/` out and decided nothing about its filename |
| `docs/deliveries/2026-09-10T173216-PLAN--prompt-quality-ruler/plan.md` | The ruler and `@prompt-review-agent`, whose `audit` mode produced three of this plan's F-blocks |

The audit of `/add-framework--done` ticked five of eight ruler items and failed three. Those three are
F8, F9 and F10, each naming its item number.

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` — exit 0, no new warning (`add-framework--build` STEP 6)
- The cli suite runs serially: `cd cli && npx vitest run --no-file-parallelism` — "Never accept a green parallel run as proof." (`add-framework-product-layer`)
- **The bats suite runs per file locally and whole on CI.** `npx bats framwork/.codeadd/scripts/tests/delivered.bats` is the per-F-block check; `npm run test:scripts` takes over an hour on Windows and 63 seconds on CI (`add-framework--done` STEP 2.3), so the whole-suite verdict is CI's
- "No item measures size. Not characters, not lines, not words." (`building-commands` § The Ruler) — no F-block here introduces a numeric budget
- `uses:` targets resolve inside the declaring artefact's own layer (`add-framework-development`, "Declaring Relationships — the `<!-- uses: -->` Block")
- `/add-framework--done` keeps nine STEPs, its recovery path at 2.4 and its ledger gate at 2.2. **`cli/tests/review-no-loops.test.js` L3.7 pins two phrases by literal text** — a heading containing `ledger gate` and the sentence `unwritten code breaks no test` — and every F-block that rewrites a body those live in runs that suite
- Pre-existing files keep the names they were written with — the precedent `add-plan-authoring` set for plans, applied here to changelogs

## Problem

1. **Gate 2.1 has no row for "PR open and entry already present."** It crosses PR state with entry
   presence and covers three of four combinations. The fourth is what a close-out lands in whenever
   STEP 6 commits and STEP 7's merge is then refused — which `main`'s ruleset causes routinely, since
   `require_last_push_approval` means the pusher cannot approve. Resuming falls through to the normal
   path and writes a **second index entry for one delivery**. Observed on PR #49.
2. **STEP 8 states a rule it never shows how to check.** "IF A PATH HAS NO DURABLE COPY UNDER
   `docs/deliveries/<id>/` ON main: DO NOT rm" is the whole safety condition for three deletions, and
   the command supplies no command to evaluate it. The plan that wrote that sentence supplied none
   either. The `cmp` pattern that would answer it already exists at STEP 6.1, applied only before the
   merge.
3. **Changelog filenames do not sort by delivery order.** `docs/changelog/YYYY-MM-DD-<verb>-<slug>.md`
   is date-only, so a day with several deliveries alphabetises by verb. On disk today: seven files
   dated `2026-09-09`, five dated `2026-07-27`. Every other internal document directory already uses
   `YYYY-MM-DDTHHMMSS`.
4. **The changelog filename has two owners and no owning skill.** `/add-framework--done` STEP 4 and
   `/add-framework--build` STEP 8 both declare the pattern. Fixing one leaves them divergent.
5. **`graph.js history` cannot find an entry by node.** It asks `delivered.sh read` with the
   artefact's bare name, and `doRead` matches that text against `id`, `name`, `words`, `items[].what`
   and `items[].find` — never against `node` or `items[].at`. The `node` filter downstream can only
   narrow what the text search already found.

   **Measured over the whole index, not inferred.** Eight nodes carry entries. Six have exactly one
   delivery and the verb finds it. The two with more than one — `internal/command/add-framework--done`
   and `internal/command/add-framework--build` — each return one of two. So the verb works only while
   an artefact has a single delivery, which is exactly when "was this attempted before?" carries the
   least information. The entry it hides for this plan's own subject is `durable-delivery-history`, the
   prior art most relevant to it. `/add-framework--plan` STEP 3.3 and `/add-framework--build` STEP 7.2
   both rely on this verb.
6. **Three ruler items fail on the command.** Item 3: the top-of-file prohibitions block heads five `⛔ DO NOT`
   lines with a bare `ALWAYS:`, where the two commands whose block has the same job —
   `/add-framework--plan` and `/add-framework--roadmap` — qualify the label. **The bare `ALWAYS:` in
   `## Rules` is a different thing and stays**: `building-commands` item 3 mandates that pair, and all
   seven internal commands write it bare. Item 5: the command restates the ledger's `F<n>`,
   `S<n>`, `complete` and `Ruling:` schema without ever naming `add-build-ledger`. Item 7: every item
   in `## Rules` restates a rule already stated in a STEP body.

## Proposal

Tests first and RED, then the one product-layer fix, then the owner of the changelog format, then the
consumers, then the three audit items, then `CLAUDE.md`.

The `delivered.sh` fix leads the internal work because it is self-contained and because the verb it
repairs is the one every later plan's STEP 3.3 depends on. The changelog owner must exist before two
commands point at it by name.

## Current State

| Artefact | Role today | Dependants (`impact --depth 1`) |
|---|---|---|
| `.claude/commands/add-framework--done.md` | Gate 2.1's three-row table; STEP 6.1's pre-merge `cmp`; STEP 8's unverifiable prohibition; STEP 4's date-only path; the bare `ALWAYS:` at L78; the ledger schema restated at L126 and L155; nine `## Rules` items | **none — 0, LOW** |
| `.claude/commands/add-framework--build.md` | STEP 8 declares the same changelog pattern | `add-framework--done`, `add-framework--plan`, `building-commands` — 3, HIGH |
| `.claude/skills/add-plan-authoring/SKILL.md` | Owns `YYYY-MM-DDTHHMMSS` for `docs/plans/`, and The Delivered Home | `add-framework--done`, `add-framework--plan` — 2, MEDIUM |
| `framwork/.codeadd/scripts/delivered.sh` | `doRead`'s haystack omits `node` | not a graph dependant of anything that breaks; `graph.js history` shells out to it |
| `framwork/.codeadd/scripts/tests/delivered.bats` | Covers `read`, `write` and `verify`; nothing covers finding an entry by node | — |
| `docs/changelog/` | Date-only filenames, no machine reader anywhere in either layer | — |

## Scope

### Includes

- **F1** [product] — `cli/tests/close-out-hardening.test.js`: the content matrix, level L3 below, written
  first and observed failing. Copy the idiom of `cli/tests/prompt-quality-ruler.test.js`: one `P = {...}`
  object of literal paths, the frontmatter/body split, a `section()` helper located by title. Mark every
  assertion that passes on the pre-plan tree as a guard.

- **F2** [product] — `framwork/.codeadd/scripts/tests/delivered.bats`: a RED case proving `read` cannot
  find an entry by node today. The fixture is an entry whose `node` names an artefact and whose `id`,
  `name`, `words` and item text never spell that artefact's name — the shape that made
  `durable-delivery-history` invisible. Assert the entry comes back. Must NOT lose: any existing case.
  - **Produces:** a bats case named for read-by-node

- **F3** [product] — `framwork/.codeadd/scripts/delivered.sh`: add `node` to `doRead`'s haystack, beside
  `id`, `name` and `words`. Nothing else in the script changes, and the corpus rule, the hard bans and
  the `REFUSED=` vocabulary are untouched. Document in a comment why `node` belongs there and that
  `items[].at` deliberately does not — an `at` is a hint that a repair rewrites, so matching it would
  make a query hit on a stale pointer.
  - **Consumes:** the bats case named for read-by-node (F2)
  - **Produces:** `delivered.sh read <name>` finds an entry whose `node` carries that name

- **F4** [internal] — `.claude/skills/add-plan-authoring/SKILL.md`: own the changelog filename, in the
  section that already owns the plan's. Format `docs/changelog/YYYY-MM-DDTHHMMSS-<verb>-<slug>.md`,
  local time, `T` between date and time, no separators inside `HHMMSS` because Windows forbids `:`.
  **The verb survives** — the timestamp alone fixes the ordering, and the verb is information the
  existing files carry. State that pre-existing changelogs keep their names, the same way pre-existing
  plans do. Must NOT lose: the plan naming rules, The Delivered Home, the review dispatch.
  - **Produces:** the changelog filename convention, owned in one place

- **F5** [internal] — `.claude/commands/add-framework--done.md`, gate 2.1: a fourth row for **PR open
  and entry present**, routing to the resume state. What that row must say: STEP 3 and STEP 6 have
  already run, so neither runs again; the only work left is STEP 7's merge and then STEP 8. Add the
  gate that makes it enforceable — an entry for this plan already in the index with the PR still open
  means the writer must not write, and the command jumps to the merge. Must NOT lose: the three
  existing rows, or the recovery path at 2.4 that the bottom row grants.

- **F6** [internal] — `.claude/commands/add-framework--done.md`, STEP 8: the post-merge validation, and
  the fix suggestion. Four checks, each with its command, run before any deletion: the PR reports
  `MERGED` with a merge commit; every archived member is present on `origin/main`; the index entry is
  present on `origin/main`; and each member on `origin/main` is byte-identical to the local original it
  is about to authorise deleting, proven with `git show origin/main:<path> | cmp - <local>`. Any failure
  refuses the deletions, names which check failed, and **prints** `/add-framework--plan <description>`
  as text so the operator can open a fix. STEP 9 reports the validation result and the suggestion.
  ⛔ The command never invokes the planning command — the handoff is text, the way `/add-framework--brainstorm`
  hands off. Must NOT lose: the forced order of the three deletions, the worktree self-removal rule at
  8.1, or the non-fatal discipline. **`cli/tests/review-no-loops.test.js` reads STEP 8's wording**, so
  that suite runs on this block.

- **F7** [internal] — `.claude/commands/add-framework--done.md`, STEP 4 and its STEP map line: name no
  filename pattern of its own. Point at `add-plan-authoring` for the format, the way STEP 3 points at
  the delivery-index reference and STEP 6.1 points at The Delivered Home.
  - **Consumes:** the changelog filename convention (F4)

- **F8** [internal] — `.claude/commands/add-framework--done.md`, **ruler item 3**: the bare `ALWAYS:`
  in the **top-of-file prohibitions block** gains a qualifier, matching `/add-framework--plan` and
  `/add-framework--roadmap`, whose block has the same job. The five prohibitions themselves are
  unchanged. ⛔ **`## Rules` is out of scope and its bare `ALWAYS:`/`NEVER:` pair stays** —
  `building-commands` item 3 mandates it and all seven internal commands write it bare. Touching it
  would break the very convention this F-block exists to honour.
  - **Validation:** ruler item 3

- **F9** [internal] — `.claude/commands/add-framework--done.md`, **ruler item 5**: the ledger's `F<n>`,
  `S<n>`, `complete` and `Ruling:` schema stops being restated at STEP 1.3 and STEP 2.2, and is
  delegated to `add-build-ledger` by name. The gate itself — every F-block in the plan's Execution
  Order carries a `complete` line, and a missing one hard-stops — stays here, because the gate is this
  command's and only the schema is the ledger's. `uses:` gains the skill.
  **Must NOT lose two phrases a pre-existing suite pins by literal text:** the sub-step heading
  containing `ledger gate`, and the sentence `unwritten code breaks no test`.
  `cli/tests/review-no-loops.test.js` L3.7 asserts both, and this F-block rewrites the body they live
  in.
  - **Validation:** ruler item 5, plus `review-no-loops.test.js`

- **F10** [internal] — `.claude/commands/add-framework--done.md`, **ruler item 7**: `## Rules` is pruned
  to the items that survive `building-commands`' own test — "remove this rule; would the executor behave
  differently given the STEPs and the gates?" The section stays, because ruler item 3 requires it. An
  item whose content is already in a STEP body goes; an item carrying knowledge no STEP states stays.
  - **Validation:** ruler item 7

- **F11** [internal] — `.claude/commands/add-framework--build.md`, STEP 8: the changelog line points at
  `add-plan-authoring` instead of declaring a pattern. Nothing else in the command changes.
  - **Consumes:** the changelog filename convention (F4)

- **F12** [internal] — `CLAUDE.md`: the "Where the details live" row for `add-plan-authoring` also names
  the changelog filename, so a reader looking for it finds the owner. No other line changes; the
  generated inventory block is not touched by hand.

### Does NOT Include (important!)

- Renaming the existing changelog files. Pre-existing names stand, per F4's stated precedent.
- The product layer's own changelog. `add.done` writes `<feature-dir>/changelog.md` under the
  `CHG[NNNN]` schema — a different artefact sharing only a word, with no directory, schema, script or
  consumer in common.
- The divergence between `add-doc-schemas/references/history.md`, which documents the product
  changelog's path as `docs/changelog/CHG[NNNN].md`, and `add.done` STEP 6.3, which writes
  `<dir>/changelog.md`. Pre-existing, product-layer, and unrelated to these four defects.
- A `--node` flag on `delivered.sh read`, and any change to `graph.js`. F3 makes the existing text
  query node-aware, which is the smaller fix for the measured symptom. A flag that makes `history`
  stop being a text search at all is a better design and its own plan.
- Retrofitting `node` onto index entries that lack one, or rewriting any index line. Hard ban 6.
- The `docs-pruning` fragment, which protects the product changelog and never names the internal one.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| What does gate 2.1's fourth row do? | Routes to the resume state: skip STEP 3 and STEP 6, go to the merge and then cleanup | The entry and the archive are already committed; re-running the writer is what produces the duplicate |
| How much does the post-merge validation check? | All four: PR merged, members on `main`, entry on `main`, and each member byte-identical to its local original | The fourth is the one that catches a real case — a ledger appended to after the archive commit and not re-copied leaves the local original ahead of `main` |
| What happens when validation fails? | Refuse the deletions, name the failing check, print `/add-framework--plan <description>` as text | The close-out is not a planner. `/add-framework--brainstorm` already establishes the text-only handoff |
| Changelog filename | `docs/changelog/YYYY-MM-DDTHHMMSS-<verb>-<slug>.md` | Matches `docs/plans/` and `docs/brainstorming/`; the timestamp fixes the ordering the date alone could not |
| Does the verb survive? | Yes | Once the timestamp leads, the verb no longer affects order, and it is information the existing files carry. **One line in F4 changes this if the reader disagrees** |
| Existing changelog files | Keep their names | The precedent `add-plan-authoring` already set for plans. Renaming rewrites files no machine reads by name |
| Who owns the changelog filename? | `add-plan-authoring`, beside the plan's own convention | It already owns the timestamp format and The Delivered Home. Two commands declaring a format is ruler item 5 failing |
| The `history`-by-node fix | `node` into `doRead`'s haystack | The smallest change that fixes the measured symptom, in the script that owns the read |
| Does `items[].at` join the haystack? | No | An `at` is a hint a repair rewrites, so matching it would let a query hit a stale pointer |
| One F-block per failed ruler item | Yes — F8, F9, F10 | `/add-framework--plan` STEP 5 forbids folding failed items into one quality pass |
| Does `## Rules` survive the item-7 fix? | Yes, pruned | Ruler item 3 requires the section. Item 7 forbids restating STEPs. Both hold only if it is pruned rather than deleted |
| Which bats scope validates F3? | The single file locally, the whole suite on CI | The whole suite takes over an hour here and 63 seconds there |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A close-out that cannot double-write an entry after a refused merge | Two more rows of gate table to read |
| Deletions that are refused unless `main` actually holds the archive | Four git calls before cleanup |
| Changelog files that sort by delivery order | A filename form that differs from the eighteen already on disk |
| A `history` verb that answers about the artefact | A text query that now also matches node ids, so a query for a node id string finds its entry |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The fourth row is written so it also catches the normal path, and every close-out skips STEP 3 | Medium | L3.2 asserts the row is conditioned on the entry being present AND the PR open; L5 exercises the normal path end to end |
| `node` in the haystack over-matches, so a query returns entries that merely share a layer prefix | Medium | F2's bats case asserts the specific entry comes back; L4.2 asserts a query for an unrelated name still returns nothing |
| The post-merge `cmp` fails on a legitimately-edited local original and blocks a correct cleanup | Medium | That is the intended behaviour, and F6 requires the failure message to name the file and the remedy — re-copy and commit, or delete by hand |
| Pruning `## Rules` removes a rule that was load-bearing | Medium | L3.9 pins the items that must survive by name; the pruning test is stated in F10 rather than left to judgement |
| The bats suite's local cost tempts a skipped validation | High | Global Constraints names the per-file command, so the F-block has a fast check that is not the whole suite |
| `delivered.sh` is product and ships to users, so a read change reaches their projects | Low | The change is additive to a search haystack; no hard ban, no exit code and no output contract moves |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/close-out-hardening.test.js` | product | create | the content matrix (F1) |
| `framwork/.codeadd/scripts/tests/delivered.bats` | product | modify | the RED case for read-by-node (F2) |
| `framwork/.codeadd/scripts/delivered.sh` | product | modify | `node` into `doRead`'s haystack (F3) |
| `.claude/skills/add-plan-authoring/SKILL.md` | internal | modify | owns the changelog filename (F4) |
| `.claude/commands/add-framework--done.md` | internal | modify | gate 2.1 fourth row (F5), STEP 8 validation and handoff (F6), STEP 4 delegation (F7), ruler items 3, 5 and 7 (F8, F9, F10) |
| `.claude/commands/add-framework--build.md` | internal | modify | STEP 8 points at the owner (F11) |
| `CLAUDE.md` | internal | modify | one row names the changelog owner (F12) |

Expected after the build: `graph.js impact internal/skill/add-build-ledger --depth 1` gains
`internal/command/add-framework--done`, so it returns that plus `internal/command/add-framework--build`.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 and F2 are written before any implementation lands and each is verified
failing. Then F3 to F12 drive them GREEN.

### L1 — Build-side

1. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 with no warning absent from the baseline
   measured before F1.
2. `cd cli && npx vitest run --no-file-parallelism` green: every pre-existing suite plus
   `close-out-hardening.test.js`.
3. `npx bats framwork/.codeadd/scripts/tests/delivered.bats` green, per F-block. `npm run test:scripts`
   green on CI, read from the PR.

### L2 — Graph

1. `node scripts/graph.js impact internal/skill/add-build-ledger --depth 1` returns
   `internal/command/add-framework--build` and `internal/command/add-framework--done`. *RED today: only
   the build.*
2. `node scripts/graph.js orphans` lists no internal artefact it did not list before F1.
3. **The verb repaired by F3, exercised on both cases that expose it:**
   `node scripts/graph.js history add-framework--done --layer internal` returns both
   `delivery-index-internal` and `durable-delivery-history`; and
   `node scripts/graph.js history add-framework--build --layer internal` returns both
   `claude-md-inventory-block` and `unify-dev-commands`. *RED today: one of two on each.*
4. **No over-match:** `node scripts/graph.js history add-framework--roadmap --layer internal` still
   returns its one entry and no other. *Passes today; guards F3's haystack change.*

### L3 — Content assertions (`cli/tests/close-out-hardening.test.js`)

1. `add-framework--done` gate 2.1's table has four data rows, and one names both an open PR and a
   present entry. *RED today: three rows.*
2. That row's body, or the gate beside it, forbids re-running the entry writer and the archive step, and
   routes to the merge. *RED today.*
3. STEP 8 contains `git show origin/main:` and `cmp`, and a condition block that refuses the deletions
   when a check fails. *RED today.*
4. STEP 8 or STEP 9 prints `/add-framework--plan` as a suggestion, and no line in the command instructs
   invoking it. *RED today on the first clause; the second is a guard.*
5. Neither `add-framework--done` nor `add-framework--build` contains a date-only changelog pattern, and
   both name `add-plan-authoring` where the changelog is written. *RED today.*
6. `add-plan-authoring` states the changelog filename with `T` between date and time, says local time,
   says no separators inside the time, and says pre-existing files keep their names. *RED today.*
7. `add-framework--done`: the `ALWAYS` label in the top-of-file prohibitions block, before the first
   `## STEP`, carries a qualifier. **The `ALWAYS:` inside `## Rules` is asserted to stay bare**, because
   item 3 mandates that pair and every sibling writes it bare. *RED today on the first clause; the
   second is a guard.* **(ruler item 3)**
8. `add-framework--done` names `add-build-ledger` in prose and declares it in `uses:`, and states no
   `F<n>`/`S<n>` or `complete`/`Ruling:` schema of its own. *RED today.* **(ruler item 5)**
9. `add-framework--done` still has a `## Rules` section, and it no longer contains the verbatim
   duplicates the audit named — the SHA-comparison rule, the "grade the delivery" prohibition and the
   skipped-check rule — each of which stays in its STEP body. *RED today.* **(ruler item 7)**
10. `CLAUDE.md`'s "Where the details live" has a row naming `add-plan-authoring` and the changelog.
    *RED today.*
11. **Guard:** `add-framework--done` keeps nine STEPs numbered 1..9 with every heading present, keeps its
    recovery path at 2.4, keeps the ledger gate's hard stop, keeps the worktree self-removal rule, and
    keeps the two phrases `review-no-loops.test.js` pins — a heading containing `ledger gate` and the
    sentence `unwritten code breaks no test`. *Passes today; must survive F5 through F10.*
12. **Guard:** no line of `add-framework--done`, `add-framework--build` or `add-plan-authoring` matches a
    number followed by a size unit, outside a code fence. *Passes today; must survive every F-block.*

### L4 — Script behaviour (`delivered.bats`)

1. `read` returns an entry whose `node` carries the queried name and whose `id`, `name`, `words` and item
   text do not. *RED today.*
2. `read` with a name that appears in no entry's text and no entry's `node` still returns nothing.
   *Passes today; guards against the haystack over-matching.*
3. **Guard:** every pre-existing case in the file passes unchanged.

### L5 — Behavioural acceptance

1. **This plan's own close-out** exercises F5 through F7 and F12: gate 2.1 takes the normal path on the
   first run, STEP 8 runs the four post-merge checks and reports them, and STEP 4 writes a changelog
   whose filename carries a timestamp. Recorded in the ledger.
2. The fourth row of gate 2.1 is exercised only if this delivery's merge is refused. **If it is not,
   say so** — an untested branch reported as tested is the defect this plan exists to remove.

**RED expectations against the current tree:** L2.1, L2.3, L4.1 and every L3 item not marked *Guard*
fail today. L2.4, L3.11, L3.12, L4.2 and L4.3 pass today and exist to catch collateral damage.
**GREEN = all levels pass after F1–F12, with L5.2 conditional by construction.**

---

## Execution Order

1. **F1** [product] — the content matrix, RED.
2. **F2** [product] — the bats case, RED.
3. **F3** [product] — `delivered.sh`. Drives L4.1 green and repairs the verb every later plan's
   analysis uses.
4. **F4** [internal] — the changelog owner. Before anything points at it.
5. **F5** [internal] — gate 2.1's fourth row.
6. **F6** [internal] — STEP 8's validation and handoff.
7. **F7** [internal] — STEP 4 delegates.
8. **F8** [internal] — ruler item 3.
9. **F9** [internal] — ruler item 5.
10. **F10** [internal] — ruler item 7.
11. **F11** [internal] — the build command delegates.
12. **F12** [internal] — `CLAUDE.md`.

**F5 through F10 all edit one file.** They stay separate F-blocks because each is a distinct decision
with its own validation level, and three of them are named ruler items that `/add-framework--plan`
STEP 5 forbids folding together. One commit each.

**Working-state boundaries:** after F3 (the script is fixed, the internal layer untouched); after F4
(the owner exists, both commands still declare their own pattern — a duplicate, not a break); after F7
(the changelog change is complete end to end); after F12 (complete). A build that must stop stops
after F3, F4 or F7.

**Per-F-block validation beyond the layer default:** F1 — observed RED. F2 — observed RED, and
`npx bats .../delivered.bats` run. F3 — L4.1, L4.2, L4.3, L2.3, L2.4. F4 — L3.6. F5 — L3.1, L3.2. F6 —
L3.3, L3.4 **plus `npx vitest run --no-file-parallelism review-no-loops`**. F7 — L3.5. F8 — L3.7.
F9 — L3.8, L2.1 **plus the same targeted `review-no-loops` run**. F10 — L3.9. F11 — L3.5. F12 —
L3.10. L3.11 and L3.12 after every internal block.

**F6 and F9 are the two blocks that rewrite a body an existing suite pins by literal phrase**, which
is why they carry a targeted run rather than waiting for L1.2 at the end. A regression there would
otherwise surface after F10, F11 and F12 had landed on top of it.

## Reviewer Handoff

For each F-block the build must leave, in the ledger: what changed with the F-block id, which
validation levels cover it and their pass state, and any decision deferred or altered.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. Gate 2.1's fourth row written loosely enough to catch the normal path, so every close-out skips its
   own STEP 3 (F5).
3. A post-merge check that reports a pass it did not perform — in particular the `cmp`, which is silent
   on success and therefore easy to claim (F6).
4. A `## Rules` item removed whose content is in no STEP body (F10).
5. `node` added to the haystack in a way that also matches `items[].at`, which the plan excludes (F3).
6. The fix-suggestion handoff written as an invocation rather than as printed text (F6).

## References

- Prior art this plan builds on: `2026-09-09T112557-PLAN--durable-delivery-history` — STEP 6, the
  archive and the prohibition this plan makes checkable; `2026-09-10T173216-PLAN--prompt-quality-ruler`
  — the ruler and the audit that produced F8, F9 and F10.
- Evidence for every defect: the close-out of PR #49, recorded in
  `docs/deliveries/2026-09-10T173216-PLAN--prompt-quality-ruler/ledger.md`.

---

## Next Steps

/add-framework--build close-out-hardening

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-10 | Initial creation |
| 2026-09-10 | Evidence strengthened after measuring the whole index: the history defect hides an entry on both nodes that carry more than one delivery, not just one. L2.3 covers both, L2.4 added as an over-match guard |
| 2026-09-10 | Review (fix-then-ok): the "every sibling qualifies `ALWAYS:`" premise was false — F8 and L3.7 narrowed to the top-of-file block, and `## Rules` explicitly excluded because item 3 mandates its bare pair; F6 and F9 gained a targeted `review-no-loops` run because that suite pins two phrases in the bodies they rewrite; the CI bats duration corrected to 63 seconds |
| 2026-09-10 | Implemented in `6ead1d1..8600140`, 16 commits. Three F-blocks were added by the build and are absent from the Impact table above: F13 `scripts/graph.js`, a comment F3 falsified, which `### Does NOT Include` excludes by name; F14 `web/public/artefact-graph.mmd`, regenerated after F6 added two edges; F15/F16, the review fixes. The review's one HIGH finding needed a decision this plan never made — the timestamped filename removed the path collision that made two changelog writers land on one file — and `add-plan-authoring` now owns one-changelog-per-delivery |

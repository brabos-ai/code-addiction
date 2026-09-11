# ADD Done — Close-Out

<!-- uses:
- skill: add-commit
- skill: add-final-report
- skill: add-plan-authoring
- skill: add-build-ledger
- command: /add-framework--build
- mention: /add-framework--plan
- mention: /add-framework--brainstorm
-->

<!--
`delivered.sh` and `add-doc-schemas/references/delivery-index.md` are PRODUCT
nodes and are named in prose below on purpose. They are deliberately NOT
declared: `uses:` targets resolve inside the declaring artefact's own layer
(scripts/build.js), so `- script: delivered.sh` from here would resolve to
`internal/script/delivered.sh`, which does not exist, and the dangling gate
would fail the build. The prose sniff skips cross-layer names, so naming them
costs nothing.
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Closes out a delivered plan in **either layer**: gates it against CI's own four commands, writes the delivery-index entry and the changelog, merges the branch via `gh`, and cleans up.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Collect context           → branch, plan, ledger, diff, `gh auth status`
STEP 2: Gates                     → ledger complete + CI green on THIS sha [HARD STOP]
STEP 3: Author the index entry    → docs/delivered.jsonl, working tree only
STEP 4: Generate the changelog    → docs/changelog/, filename owned by add-plan-authoring
STEP 5: Preview                   → INFORMATIVE ONLY, never a stop
STEP 6: Archive, commit and push  → docs/deliveries/<id>/ + entry + changelog, one commit
STEP 7: Merge via gh              → re-check CI on the docs commit, then gh pr merge --squash
STEP 8: Cleanup                   → worktree, branch, this plan's archived originals — in that order, non-fatal
STEP 9: Completion                → what was written, merged, removed and skipped

**⛔ ABSOLUTE PROHIBITIONS:**

IF `gh auth status` FAILED (STEP 1 not complete):
  ⛔ DO NOT USE: Write on docs/delivered.jsonl
  ⛔ DO NOT USE: Write on docs/changelog/
  ⛔ DO NOT USE: Bash to run git commit
  ⛔ DO NOT: Author an entry that STEP 7 cannot merge
  ✅ DO: Report the auth failure and STOP before anything is written

IF ANY GATE AT STEP 2 FAILED:
  ⛔ DO NOT USE: Write on docs/delivered.jsonl
  ⛔ DO NOT USE: Write on docs/changelog/
  ⛔ DO NOT USE: Bash to run gh pr merge
  ⛔ DO NOT: Re-run the failing gate with different arguments to make it pass
  ⛔ DO NOT: Push another commit to make CI green without saying what it fixed
  ✅ DO: Report which gate failed, with its check URL, and STOP

IF CI HAS NOT CONCLUDED, OR CONCLUDED ON A DIFFERENT SHA:
  ⛔ DO NOT USE: Bash to run gh pr merge
  ⛔ DO NOT: Read an older green run as this commit is verdict
  ✅ DO: Wait for the run on this SHA, or report why it cannot run and fall back to the local four

NOTE: `gh pr create` is NOT prohibited here. CI triggers on `pull_request`, so the PR is what
makes the gate runnable at all — STEP 2.3 creates it before the gate can conclude.

IF THE INDEX CARRIES NO ENTRY FOR THIS PLAN:
  ⛔ DO NOT USE: Bash to run rm on anything
  ⛔ DO NOT USE: Bash to run git branch -d or git push --delete
  ⛔ DO NOT USE: Bash to run git worktree remove
  ✅ DO: Skip STEP 8 entirely

  **The condition is the entry's existence, never which STEP wrote it.** On the resume path at 2.5
  STEP 3 is skipped, so a rule keyed to "STEP 3 wrote one" would skip the cleanup of a delivery whose
  entry is committed, pushed and merged.

IF A FILE'S ONLY COPY IS THE LOCAL ONE:
  ⛔ DO NOT USE: Bash to run rm on it
  ✅ DO: Report it and leave it — "it's all in git" is false for a file nothing committed

  This is what STEP 6 changes and why it runs before STEP 8. The plan, the ledger, the design doc and
  this plan's evidence are gitignored, so they qualify — until STEP 6 copies them into
  `docs/deliveries/<id>/` and STEP 7 merges that copy. Any other untracked file never qualifies.

ALWAYS — THIS COMMAND ENDS WORK IT DID NOT START:
  ⛔ DO NOT USE: Bash to run node scripts/build.js as a fix — it is a gate, not a repair step
  ⛔ DO NOT: Audit the delivery here — `/add-framework--build` STEP 7 does that once, inside the build
  ⛔ DO NOT: Delete anything under docs/changelog/ or docs/deliveries/
  ⛔ DO NOT: Delete another plan's files under docs/plans/, docs/brainstorming/ or docs/evidence/ — only the closed-out plan's own
  ⛔ DO NOT: Create the branch or the worktree — the operator owns both

---

## Operation Mode

/add-framework--done [plan]     → Close out the branch implementing that plan (full basename or unique slug substring)
/add-framework--done            → Resolve the plan from the branch, or ask

**Examples:**
/add-framework--done 2026-09-07T162415-SELF-PLAN--delivery-index-internal
/add-framework--done delivery-index-internal

---

## STEP 1: Collect Context (MANDATORY)

### 1.1 Probe `gh`

Run `gh auth status`. If it fails → report it and STOP. Nothing below is written.

`gh` is a hard dependency here, not a degradation. Probing it now rather than at STEP 7 is the difference between stopping cleanly and stranding a branch with an entry committed on it and no PR.

### 1.2 Resolve the branch and the plan

Verify the current branch is **not** `main`. If it is → report and STOP: this command ends work someone else started on a branch, and it never creates one.

**One exception, and 2.1 is the only thing that grants it:** the recovery path at 2.4 runs on `main`, because the branch it would have run on is already merged and gone.

**Resolve `[plan]` the way `/add-framework--build` does.** The full basename always works; otherwise match `[plan]` as a **substring** of the basenames of `docs/plans/*PLAN--*.md` (excluding `--review-v*`, `--evidence-v*` and `--ledger` companions).

- **Exactly one match** → that is the plan.
- **More than one match** → print every candidate basename and ask which one. **NEVER guess.**
- **No match** → list the plans in `docs/plans/` and STOP.

When no `[plan]` was given, derive the candidate from the branch name and confirm it with the user before proceeding.

### 1.3 Collect the delivery facts

Collect, and carry forward to STEP 3:

- **The merge base and the diff** — `git diff --name-status main...HEAD` for the added, modified, deleted and renamed paths this branch introduced.
- **The commits** — `git log --oneline main..HEAD`, short hashes.
- **The ledger** — where it lives, what its lines look like and the legacy series a plan written before the layer split uses are all owned by `add-build-ledger`. Read it, and carry its per-block lines forward to the gate at 2.2.
- **The graph** — `framwork/.codeadd/artefact-graph.json`, for classifying paths at STEP 3.

**Three dots for the diff, two for the log, and neither is a typo.** Three-dot diff is merge-base-relative, which is exactly "what did this branch introduce" — a two-dot diff would also report, reversed, everything `main` gained since the branch point. Two-dot log is "commits on this branch and not on main", which is the question there. A sibling ruling in the product layer replaced a three-dot *pre-check* with two dots; that check asks the opposite question ("does main already have all of this?") and does not transfer here.

---

## STEP 2: Gates [HARD STOP]

**Run them in the order below and stop at the first failure.** A gate that fails is reported with its output; it is never re-run with different arguments to make it pass.

### 2.1 Already closed out, or merged without a close-out?

Run `gh pr view --json state,mergedAt` for the current branch, then check whether `docs/delivered.jsonl` already carries an entry whose `id` is this plan's basename.

**Cross the two facts. All four combinations are reachable, and each routes differently:**

| PR | Entry for this plan | Action |
|---|---|---|
| Open | no | Normal path. Continue |
| Open | **yes** | **Resume path — 2.5.** STEP 3, STEP 4 and STEP 6 already ran. Continue, and skip them |
| Merged | yes | Nothing to close out. Report and STOP |
| Merged | **no** | **Recovery path — 2.4.** Continue |

```
IF AN ENTRY FOR THIS PLAN IS ALREADY IN THE INDEX AND THE PR IS STILL OPEN:
  ⛔ DO NOT USE: Write on docs/delivered.jsonl
  ⛔ DO NOT USE: Write on docs/changelog/
  ⛔ DO NOT USE: Bash to run cp into docs/deliveries/<id>/
  ⛔ DO NOT: Re-run STEP 3, STEP 4 or STEP 6 to confirm what is already committed
  ✅ DO: Confirm the committed entry's `id` is this plan's basename, then continue THROUGH 2.2 and
         2.3 — 2.5 lists which STEPs are skipped, and the gates are not among them
```

**The second row is the state a refused merge leaves behind, and it is not rare.** STEP 6 commits the
entry, the changelog and the archive in one commit, and STEP 7 can then be refused — a review thread
still unresolved, an approval dismissed by the push, an unattributed change. The branch is left holding
a complete and correct entry. Falling through to the normal path writes a **second** entry for one
delivery, which is exactly what a three-row table did on PR #49.

**The third row is what makes a second run on the same branch safe:** the gates below would all still
pass, and without it the command would write a second entry for one delivery.

**The bottom row is the case the index exists for.** Work reached `main` and left no record. Stopping there would make the index quietly wrong about a delivery that shipped — the same lie as indexing work that never landed, in the other direction. It is recoverable, so recover it.

### 2.2 The ledger gate — BEFORE the four commands

**Every F-block in the plan's Execution Order must have a `complete` line in the ledger.** A block that recorded only a ruling is not complete.

**`add-build-ledger` owns those line shapes. This gate reads them and does not define them** — a second copy of a format drifts from the first, and the drift is invisible until the two disagree about what counts as delivered.

A build may add F-blocks the plan did not have — a ruling records why. Those are reported, never required: this gate asks whether the PLAN was delivered, not whether the build stayed inside it.

If any block is missing its `complete` line → report which ones and STOP.

**This runs first for a reason: unwritten code breaks no test.** A `/add-framework--build` run that stopped halfway passes all four commands below and would merge and index as fully delivered — the exact lie the index exists to prevent. **It is the only gate here that can catch that, which is why it is the one that stays.** The gate that used to sit beside it asked whether the delivery had been graded; this one asks whether it happened at all, and those are not the same question.

### 2.3 CI's four commands — read the run, do not re-run them locally

CI already runs the four commands this gate needs, on the four combinations this project supports:

```
test-cli (node 20)   node scripts/build.js  →  npm test  →  the package smoke test  [working-directory: cli]
test-cli (node 22)   the same, on the other supported major
test-scripts         npm run test:scripts   (bats)                                  [working-directory: root]
```

**Read that run. Do not execute them here.** Re-running them locally is not a stronger gate, it is a *second* gate that can disagree with the one that governs the merge — and the local copy is the weaker of the two: it runs on one machine, one Node version, and a developer's dirty environment. This repository has the receipts. **Forced down its native Windows path** — which `CODEADD_BATS_RUNNER=native` still reaches — `npm run test:scripts` is slow enough to be unusable and reports a `qa-preflight.bats` failure that exists on no other machine, because a `node_modules` above `TMPDIR` resolves a package the test asserts is absent. A local verdict that contradicts the merge gate is worse than no local verdict.

**By default that suite no longer takes either cost, and neither fact promotes it.** `npm run test:scripts` routes itself into a Linux container on Windows, where the whole suite runs in well under a minute and `qa-preflight` passes. That makes it usable for iteration, which is why a `.sh` F-block is now gated on it. It does not make it the authority: one machine is still one machine.

`ci.yml` triggers on `pull_request`, so **the PR must exist before this gate can pass.** Creating it is part of the gate, not part of STEP 7:

1. **Sync the `CLAUDE.md` inventory block — run it, commit it, push it.** `node scripts/inventory.js`. If it reports the block updated, `git add CLAUDE.md` (that path alone, never `-A`), commit it with a message per `.claude/skills/add-commit/SKILL.md`, and push. If it reports the block already current, say so and make no commit. **Exit 2 means an absent or malformed marker → report it and STOP.** A missing marker is a defect in `CLAUDE.md`, not permission to skip the sync.

   **`already current` is the expected outcome, not a sign this step is redundant.** `/add-framework--build` STEP 8 syncs before it offers to open the PR, so the block normally arrives here correct. This is the net under three cases where it cannot have: a build that hard-stopped before STEP 8, a hotfix that never ran a full build, and the recovery path at 2.4 where the merge came first.
2. **The working tree must be clean.** If it is not → report the dirty paths and STOP. A green run proves something about a commit; it proves nothing about uncommitted edits sitting beside it.
3. **Push the branch** if `git rev-parse HEAD` and `git rev-parse origin/<branch>` disagree. Item 1 already pushed when the block changed, so this finds them in sync — that is the expected outcome, not a redundancy to remove.
4. **`gh pr view`** → if no PR exists, `gh pr create`.
5. **Wait for the run**, e.g. `gh pr checks --watch --fail-fast`.
6. **Compare the SHA before reading the verdict** — see below.
7. Every required check concludes `success` → the gate passes. Anything else → report which check, with its URL, and STOP.

⛔ **Item 1 runs BEFORE item 2, and stages one path.** The order is what makes both work: a sync that writes and does not commit leaves the tree dirty, and item 2 hard-stops on it — the close-out would block on its own output. Staging `CLAUDE.md` alone is what keeps item 2 able to still catch every unrelated edit sitting beside it.

⛔ **A green check is evidence only for the commit it ran on.** Compare `gh pr view --json headRefOid` against `git rev-parse HEAD` and **refuse a verdict from any other SHA**. Without this the command reads yesterday's green run and calls today's untested code gated — the same class of lie as a gate that silently invokes a script that does not exist, and harder to see, because the output says `pass`.

⛔ **A skipped, queued, neutral or cancelled check is not a pass.** Only `success` is. A required check that never ran is the absence of evidence, which this gate treats exactly as it treats failure.

**The fallback is local, explicit and reported.** When `gh` is unavailable, the network is down, or the repository has no CI configured, run the four commands here instead — `node scripts/build.js`, `npm test`, `npm --prefix cli run test:package`, `npm run test:scripts` — and **say in the STEP 9 report that the gate ran locally and why**. A gate that quietly changes which evidence it accepted is worse than a slow one.

⛔ **In the fallback, `npm run test:scripts` exiting 2 is a REFUSAL to run, never a failing suite.** On Windows with no Docker daemon the runner declines rather than taking the slow native path, and prints why. Treat that exit as the bats gate being unavailable — say so in the STEP 9 report and resolve it from CI — never as a red suite. Reporting a refusal as a failure blocks a merge on evidence nobody produced.

`test:package` exists **only** in `cli/package.json`. In the fallback, invoked from the root without `--prefix cli`, it fails with "Missing script" — a *false* gate, which is worse than a failing one. CI avoids this by setting `working-directory: cli`; the fallback must attach the prefix by hand.

**If CI gains a job, this list follows it.** The whole point is that the gate and the merge cannot disagree about what green means.

### 2.4 The Recovery Path — merged, never indexed

Reached only from 2.1's bottom row. **Every gate above still applies in full** — a delivery is not
exempt from them because someone merged early. What changes is where the evidence lives and what is
left to do:

| Step | Normal | Recovery |
|---|---|---|
| 1.2 | Refuses to run on `main` | Runs on `main`; the branch is merged and may be gone |
| 1.3 | `git diff --name-status main...HEAD` | `git show --name-status <merge-commit>` — the squash IS the delivery |
| 2.2 | The ledger gate | Unchanged. It still hard-stops |
| 2.3 item 1 | Sync, commit and push the block on the branch | Same, on `main` — the block is still owed even when the merge came first |
| 2.3 | Read the PR's checks | Read the run on the **merge commit**, `gh run list --commit <sha>` |
| 6 | Commit on the branch, push | Commit on `main`, push |
| 7 | Merge the PR | **Skipped.** Already merged |
| 8 | Cleanup | The merged branch is still there to delete. Check 2 of the five reads the merge commit resolved at 1.3, not a PR |

```
IF THE MERGE COMMIT CANNOT BE RESOLVED:
  ⛔ DO NOT USE: Write on docs/delivered.jsonl
  ⛔ DO NOT: Reconstruct the diff from the plan instead of from git
  ✅ DO: Report it and STOP — an entry derived from a plan rather than a diff records intent, not delivery
```

⛔ **The ledger is local and gitignored.** A recovery run on a machine that did not execute the build
has no ledger to read, so gate 2.2 cannot pass and this path is unavailable there. That is correct:
without the ledger there is no evidence the plan was finished, only that something merged.

**Report in STEP 9 that the run took the recovery path, and why the entry landed after the merge
rather than before it.** An entry whose commit sits after the delivery it describes is fine; an entry
that hides how it got there is not.

### 2.5 The Resume Path — written, pushed, merge refused

Reached only from 2.1's second row. **Every gate above still applies in full**, exactly as they do on
the recovery path. What changes is that three STEPs already ran and must not run again:

| Step | Normal | Resume |
|---|---|---|
| 2.3 | Sync, push, wait for CI | Unchanged. The run to read is the one on the docs commit STEP 6 already pushed |
| 3 | Author the index entry | **Skipped.** The entry is committed on the branch |
| 4 | Generate the changelog | **Skipped.** Committed by the same STEP 6 commit |
| 5 | Preview | Shows what is already committed, so nothing is proposed |
| 6 | Archive, commit and push | **Skipped.** `docs/deliveries/<id>/` is assembled and committed |
| 7 | Merge the PR | The only work left |
| 8 | Cleanup | Unchanged |

⛔ **STEP 4 is skipped with the other two, and the reason is not symmetry.** The changelog filename
carries a timestamp, so a second STEP 4 does not overwrite the first — it writes a **second file** for
one delivery, and both then reach `main`. STEP 3's duplicate is at least visible as two lines sharing
an `id`; this one reads as two separate deliveries.

**What is left to do is find out why the merge was refused.** The branch state is correct and nothing
here repairs it. Report the refusal reason from `gh pr view --json mergeStateStatus,mergeable` in STEP
9, alongside which STEPs this run skipped.

---

## STEP 3: Author the Index Entry

Write **one** entry to `docs/delivered.jsonl` via `delivered.sh`. The record shape, the four statuses, the corpus rule and the hard bans are owned by `add-doc-schemas/references/delivery-index.md` — read it rather than re-deriving them.

The internal layer runs the product's own script here. That is dogfooding, not a layering breach: it is the only arrangement where the two layers cannot disagree about what a line in the index means.

### 3.1 Resolve existing entries first

Run `delivered.sh verify` (report-only, no `--repair`) before comparing anything, so every existing entry's items carry their **current** location. An item's `at` is a hint that goes stale; matching against a stale one produces false negatives.

```bash
bash framwork/.codeadd/scripts/delivered.sh verify
```

### 3.2 Derive the items — git supplies the diff, the graph classifies

**There is no prior graph to diff against** — it is rebuilt on every build and gitignored. So the derivation runs the other way: git says what changed, the graph says what each path is.

For each path in STEP 1.3's diff:

| Diff status | Becomes |
|---|---|
| Added **and** a graph node | An item — and the candidate for the entry's `node`, see below |
| Added and **not** a node (a top-level script, `CLAUDE.md`, `.gitignore`) | An item like any other. The graph does not model it, and nothing is synthesised |
| Deleted, matching an existing entry's item | Drives a supersession — see 3.3. **Never an item on this entry** |
| Renamed (`R###`) | **Never a deletion.** A `changed` item on the existing entry, whose `at` the repair fixes. Nothing is superseded |
| Modified | **Not an item on its own.** Name the behaviour it introduced, or it contributes nothing |

**An internal item is a created artefact, or a named behaviour introduced into an existing one.** The third kind is what makes a modification-only plan representable, and it is not a loosening: a behaviour worth indexing has a **name in the source** — a key, a flag, a function, a marker — and that name is what other documents cite and what goes stale. A change with no nameable surface belongs in the changelog, not the index.

**`node` is omitted, never faked.** Top-level `scripts/`, `CLAUDE.md` and `.gitignore` produce no graph nodes. A synthesised id would resolve to nothing in `graph.js` and is worse than an honestly absent field.

Entry fields:

- `layer`: **derived from the items, never hardcoded.** An item whose `at` sits under `framwork/`,
  `framwork/provider-map.json` or `cli/` is product; everything else is internal. The entry takes
  whichever side holds more items. A tie is a user question, the same way a supersession is.

  ⛔ **`cli/` is product, and no other rule here may imply otherwise.** This is the same three-path
  test `/add-framework--build` STEP 1.1 uses to derive a missing layer tag, and the same split
  `CLAUDE.md` documents. A narrower "under `framwork/` or else internal" reading indexes a
  `cli/`-heavy delivery as internal, and it then vanishes from `delivered.sh read --layer product`.

  ⛔ **Derive it from the item paths, NOT from the entry's `node`.** STEP 3.2 above records that
  top-level `scripts/`, `CLAUDE.md` and `.gitignore` produce no graph node, so `node` is legitimately
  absent on some entries — a rule keyed to it would have no answer for exactly the cross-layer
  deliveries one plan now produces. Item paths are always present.

  `delivered.sh` validates `layer` against `product | internal` and refuses anything else. A
  cross-layer delivery is therefore ONE entry carrying its dominant layer, never two entries and never
  a third value.
- `by`: `"done"`
- `id`: the plan's basename without extension, **verbatim** — never a slug
- `origin`: `docs/deliveries/<id>/` — the tracked directory STEP 6 assembles, **never** the gitignored `docs/plans/<id>.md`. The schema allows either a directory or a plan path; the internal layer narrows that to the directory, because only the directory survives STEP 8. The old value resolves to nothing in a fresh clone, which is the whole reason the directory exists. Entries already on disk keep whatever they were written with; the index never rewrites a line
- `node`: **on the ENTRY, set to this delivery's primary graph node** — the one artefact a reader would look this delivery up by

⛔ **`node` belongs to the ENTRY. An item is exactly `{what, at, find}`.** That is the schema — `add-doc-schemas/references/delivery-index.md` lists `node` in its record table and defines the item as those three fields — and `delivered.sh` implements it: a `node` submitted inside an item is normalised away, because it is not part of the shape. This is correct behaviour, not a writer defect, and **must not be "fixed"**: a build once read an internal design note as the authority here and reported the script as losing data. Tests in `delivered.bats` now pin both directions.

**One consequence, stated rather than discovered later:** one `node` per entry means a delivery that creates several artefacts is findable by its primary one only. Choose the artefact a reader would look the delivery up by, and author `words` so the others stay reachable by text.

### 3.3 Supersession is proposed, never written silently

A deleted artefact matching an existing entry's item is a **deletion, proven by git**. Whether this delivery *replaces* it or merely *removes* it is a judgement no script can make.

Match key, in order: **by `node` id when the item has one** (stable across file moves, exact), **by `find` presence when it does not**.

Ask the user, per deletion: *replaced by this delivery*, or *removed*?

- **Replaced** → the old entry gains `status: superseded` and `superseded_by: <this id>`
- **Removed** → the old entry gains `status: gone`, no `superseded_by`

Both answers are truthful records, and a wrong one is corrected by appending a line.

### 3.4 Write it

Pipe the record to `delivered.sh write` on stdin:

```bash
bash framwork/.codeadd/scripts/delivered.sh write < record.json
```

`v` and `ts` are generated by the script — **never supply them.** Every other required field comes from the record you authored.

It rejects a record that breaks a hard ban with `REFUSED=<name>` and exit 2 — **a refusal is a real finding, not something to work around by loosening the anchor.** Fix the record, or report and STOP.

⛔ **`find` is one contiguous token, byte-exact, and never anchored into `docs/` or into a path the project ignores.** A multi-word anchor is what a formatter wraps, and a wrapped anchor silently flips a live item to `gone`.

---

## STEP 4: Generate the Changelog

Write the human narrative record into `docs/changelog/`, in prose, matching the existing files in that directory. It carries **why**, which the index deliberately does not.

**The filename and the one-per-delivery rule are owned by `add-plan-authoring`** — read **File Naming** rather than re-deriving them here.

⛔ **`/add-framework--build` STEP 8 normally wrote one already.** Look for this delivery's changelog before writing anything: when one exists, EDIT it and keep its filename. Allocating a second timestamp puts two files on `main` for one delivery, each telling part of its story.

The index entry and the changelog are not redundant: one is a machine-readable claim about what exists, the other is the reasoning a future reader needs.

---

## STEP 5: Preview (INFORMATIVE ONLY)

Show the user, before committing: the entry as it will be written, any `LOOSE=` anchors the write reported, the supersession answers from 3.3, the changelog path, and what STEP 8 will remove.

**This is not a stop point.** It informs; it does not wait.

---

## STEP 6: Archive the Working Documents, Commit and Push

### 6.1 Assemble `docs/deliveries/<id>/`

**The working documents move BEFORE the commit, so the merge carries them to `main`.** The directory name, its members and which are load-bearing are owned by `add-plan-authoring` — read **The Delivered Home** rather than re-deriving them here.

Copy, never move: the originals stay on disk until STEP 8 removes them, and STEP 8 runs only after the merge.

**Every member is produced by a file copy. Nothing here is authored.**

```
IF PRODUCING ANY FILE UNDER docs/deliveries/<id>/:
  ⛔ DO NOT USE: Write on it
  ⛔ DO NOT USE: Edit on it
  ⛔ DO NOT: Summarise, trim, reformat, re-order, translate or tidy a document on the way in
  ⛔ DO NOT: Reconstruct a document from what you remember of it, from the plan's own text, or from this session
  ✅ DO: Copy the bytes — `cp <source> docs/deliveries/<id>/<member>` — and copy nothing you were not asked to
```

**Prove each copy, before staging anything:**

```bash
cmp "<source>" "docs/deliveries/<id>/<member>"   # silent = identical; ANY output → STOP
```

⛔ **A paraphrase that reaches `main` is worse than an empty directory.** The archive's whole value is that it is the document, not an account of it — a reader years from now cannot tell a faithful copy from a confident rewrite, and will trust either. An empty directory is at least honestly empty. The one place a difference is allowed is the filename, which **The Delivered Home** maps member by member. Contents never change.

```
IF THE PLAN OR THE LEDGER CANNOT BE READ FROM THIS WORKING TREE:
  ⛔ DO NOT USE: Bash to run git commit
  ⛔ DO NOT: Assemble a directory holding only the half that was readable
  ✅ DO: Report which document is missing and STOP — a delivery archived without its ledger loses every ruling it made
```

The design source is **the `docs/brainstorming/` file the plan's Context document table names**, and nothing else. `docs/brainstorming/` allocates its own timestamp, unrelated to the plan's, so that table cell is the only link between the two. A plan citing no design doc gets no `design.md`, and that is not a defect.

⛔ **Attribute an evidence file by its id prefix, and report what you cannot attribute.** `docs/evidence/` holds files from several plans at once. Sweeping the whole directory into one delivery files another plan's evidence as this one's — worse than leaving it behind, because it then reads as this delivery's own record.

### 6.2 Commit and push

Stage `docs/deliveries/<id>/` together with the entry and the changelog, and commit them as **one commit on the branch**, message per `.claude/skills/add-commit/SKILL.md`. Then push. **On the recovery path the branch is `main`.**

⛔ **Stage those three paths, never `-A`.** An unrelated edit swept into this commit rides the squash merge to `main` under a message that does not describe it.

The push re-triggers CI on the new commit. STEP 7 waits for that run before merging.

**The entry is committed before the merge, never after.** If the PR is never merged, the branch dies and the entry dies with it — which is correct. `main` must not acquire an entry for work that did not land, and writing the entry afterwards would need a pull and an extra commit on `main`.

---

## STEP 7: Merge via `gh`

**Recovery path: skip this STEP entirely.** The merge already happened; go to STEP 8.

The PR already exists — STEP 2.3 created it, because CI cannot run without one.

**STEP 6 pushed a commit CI has not tested.** The gate at 2.3 ran on the code; the entry and the changelog landed after it. Wait for the run on the new SHA before merging, applying the same SHA comparison 2.3 applies:

```bash
gh pr checks --watch --fail-fast
```

Then `gh pr merge --squash`.

Waiting again costs about a minute and closes the one hole a CI-read gate would otherwise leave: a delivery whose final commit was never tested. Where the repository has auto-merge enabled, `gh pr merge --squash --auto` is the same guarantee and is preferable — it lets the merge happen without holding the session open.

If the merge is refused → report it and STOP. The entry and the changelog stay on the branch, absent from `main`, which is the honest state. **DO NOT** proceed to STEP 8.

---

## STEP 8: Cleanup (NON-FATAL, IN ORDER)

**Run only if the index carries this plan's entry and STEP 7's merge succeeded.**

By STEP 8 the entry is already on `main`, so nothing here can invalidate the delivery. **Any sub-step that fails is reported and skipped — never rolled back, and never a reason to undo a completed merge.**

```
IF A PATH HAS NO DURABLE COPY UNDER docs/deliveries/<id>/ ON main:
  ⛔ DO NOT USE: Bash to run rm on it
  ✅ DO: Report it and leave it — every deletion below is safe only because STEP 6 copied first and STEP 7 merged that copy
```

### The five post-merge checks — BEFORE any deletion

That prohibition is the whole safety condition for the three deletions below, and nothing here used to
evaluate it. These five checks are how it is evaluated. **Run all five, then decide once.**

```bash
git fetch origin main                                               # 1. the ref every check reads
gh pr view --json state,mergeCommit                                 # 2. MERGED, with a merge commit
git show origin/main:docs/deliveries/<id>/<file-member>             # 3. every file member resolves
git show origin/main:docs/delivered.jsonl | grep '"id":"<id>"'      # 4. the entry is there
git show origin/main:docs/deliveries/<id>/<file-member> | cmp - <local-original>   # 5. byte-identical
```

⛔ **The fetch is check 1, not a preamble, and its failure refuses the deletions like any other.**
`origin/main` is a local ref and `gh pr merge` moves the branch on the server without moving it here,
so a fetch that fails — offline, expired auth, a revoked token — leaves the ref at the branch point
and checks 3 to 5 then pass against an archive `main` has never seen. Numbering it is what puts it
inside the gate below; a mandatory step outside the gate is the check nothing reports.

⛔ **Checks 3 and 5 run on FILES.** `git show` on a directory prints a listing and `cmp` against one
errors, so a delivery carrying an `evidences/` member would refuse its own cleanup. Expand that member
to the files inside it and check each.

⛔ **On the recovery path check 2 has no PR to read.** 2.4 runs on `main` and STEP 7 never ran there,
so `gh pr view` resolves nothing. Prove the merge from the merge commit 2.4 already resolved instead,
and say in STEP 9 which of the two proved it.

⛔ **Check 5 is the one that catches a real case, and `cmp` is silent on success.** A ledger appended
to after STEP 6's archive commit and never re-copied leaves the local original AHEAD of `main`: the
member is present, the entry is present, and the copy about to be deleted is the newer of the two.
Read the exit status. **Reporting a pass because nothing was printed is claiming a check that never
ran**, and this is the check where that is easiest to do.

```
IF ANY OF THE FIVE CHECKS FAILED:
  ⛔ DO NOT USE: Bash to run rm on anything
  ⛔ DO NOT USE: Bash to run git branch -d or git push --delete
  ⛔ DO NOT USE: Bash to run git worktree remove
  ⛔ DO NOT: Re-copy the file and delete the original in the same run — the archive on main is what
             the index entry points at, and repairing it is a change main has to receive
  ✅ DO: Name the failing check and the path it failed on, print the suggestion below, and go to
         STEP 9 with every deletion skipped
```

**The fix suggestion is printed as text, for the operator to act on.** Emit the line:

    /add-framework--plan <what failed, in a few words>

⛔ **The close-out is not a planner.** It prints that line and stops there, the same text-only handoff
`/add-framework--brainstorm` makes. A close-out that started a planning session of its own would turn
a skipped cleanup into work nobody asked for, on a branch that is already merged.

**A refused deletion is not a failed delivery.** The entry, the changelog and the archive are on
`main`; what is left behind is a local file and possibly a branch, and STEP 9 says so.

**Order is forced**, because a branch checked out in a worktree cannot be deleted:

1. **The worktree**, if one exists. **Its absence is the normal case, not an error** — work done on a branch in the main clone has none, and STEP 8 skips this silently.
2. **The branch**, local and remote.
3. **The local originals this delivery archived** — the plan, its ledger and any `--review-v*` companion in `docs/plans/`, the design doc in `docs/brainstorming/`, and this plan's files in `docs/evidence/`. **Every member `add-plan-authoring` lists, and nothing else.**

| Removed | Kept | Why |
|---|---|---|
| The worktree, if one exists | `docs/deliveries/<id>/` | The durable copy. It is on `main` and is never removed here |
| The merged branch, local and remote | `docs/changelog/` | The human narrative record; its retirement is out of scope |
| This plan's local originals in `docs/plans/`, `docs/brainstorming/` and `docs/evidence/` | `docs/plans/` files belonging to OTHER plans | Still in flight. Only the closed-out plan's own files go |

**No class survives close-out on a table cell alone.** These three directories are gitignored working artefacts, so this removes local files and touches no commit — which is exactly why the removal is safe only after STEP 6 archived them and STEP 7 merged that archive. `docs/changelog/`, `docs/delivered.jsonl` and `docs/deliveries/` are tracked and are never removed here.

### 8.1 When this command is running inside the worktree it would remove

`git worktree remove` cannot remove the working tree it is being run from. On a worktree build the branch is checked out only inside that worktree, so STEP 1.2's refusal to run on `main` puts this command there — and the first removal above has nothing it can do.

⛔ **Attempting it anyway does damage, measured rather than assumed.** Run from inside, the command **unregisters the worktree and then fails to delete the directory** — `error: failed to delete '<path>': Permission denied`, exit 255. What is left is an orphan directory git no longer knows about, so a second `git worktree remove` answers `is not a working tree` and the operator now needs `git worktree prune` plus a manual delete. A skipped sub-step costs one clean command later; this costs a repair.

```
IF THE CURRENT WORKING DIRECTORY IS INSIDE THE WORKTREE TO BE REMOVED:
  ⛔ DO NOT USE: Bash to run git worktree remove on it
  ⛔ DO NOT USE: Bash to run git branch -d or git push --delete for its branch
  ⛔ DO NOT USE: Bash to run rm -rf on the worktree directory as a substitute
  ✅ DO: Report both as skipped, name the worktree path, and continue to the third removal
```

**The branch is skipped with the worktree, not attempted after it.** `git branch -d` refuses a branch checked out in a live worktree — `error: cannot delete branch '<name>' used by worktree at '<path>'`, exit 1 — even when it is fully merged. Both are reported as skipped, with the two commands the operator runs from the primary checkout to finish by hand.

**Nothing here is a failure of the delivery.** By STEP 8 the entry, the changelog and `docs/deliveries/<id>/` are already on `main`. A worktree left behind costs one manual `git worktree remove` from the primary checkout; it costs no document, which is the whole point of STEP 6 running before this.

---

## STEP 9: Completion

**LOAD `add-final-report`.** It owns the seven blocks, the banned phrasings and the self-check. Emit
the report FIRST — the paths, the PR number and the gate results come after it.

Fill the blocks from this close-out:

- **`What was delivered`** — the feature that merged, and the archive and index entry that now record
  it.
- **`How it works`** — what the merged work does, for a reader who never opened the plan.
- **`Files touched`** — the archive members and the index line, split by verb. The Deleted row names
  what STEP 8 removed, and reads "none" when it removed nothing.
- **`⚠️ Needs your attention`** — anything STEP 8 skipped, and any gate that was not a clean pass.

Then, after the seven blocks and before the metadata, report always:

- The entry written, with its `id` and item count
- **Whether the inventory block changed**, and the commit that carried it. Say "already current" when it did not — silence is indistinguishable from not having run it
- Any supersessions declared, and which answer was given
- The changelog path
- The PR number and its merge state
- **The archive** — `docs/deliveries/<id>/` and which members it holds, plus any evidence file STEP 6.1 could not attribute to a plan
- **The five post-merge checks and their results, one line each**, whether they passed or refused the
  deletions, and whether check 2 read the PR or the merge commit. When one failed, name it, name the path, and print the `/add-framework--plan` suggestion
  STEP 8 composed — as text the operator runs, never as something this command ran
- What STEP 8 removed, and what it skipped and why. **When the worktree and its branch were skipped, print the two commands that finish the job from the primary checkout** — a skip reported without its remedy leaves the operator to work out what to run
- Every gate that ran, and its result
- **Which path 2.1 routed to.** On the resume path, which STEPs were skipped and the refusal reason
  `gh pr view --json mergeStateStatus,mergeable` reported for the merge that did not go through
- Whether the run took the recovery path, and why the entry landed after the merge

---

## Rules

ALWAYS:
- Say in the report which evidence the gate accepted, CI or local, and why

NEVER:
- Record a rename as a deletion or a supersession

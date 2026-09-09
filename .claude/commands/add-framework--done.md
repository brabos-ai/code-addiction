# ADD Done — Close-Out

<!-- uses:
- skill: add-commit
- mention: @framework-discovery-agent
- command: /add-framework--build
- command: /add-framework--review
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
STEP 2: Gates                     → ledger complete + review PASS + CI green on THIS sha [HARD STOP]
STEP 3: Author the index entry    → docs/delivered.jsonl, working tree only
STEP 4: Generate the changelog    → docs/changelog/YYYY-MM-DD-<verb>-<slug>.md
STEP 5: Preview                   → INFORMATIVE ONLY, never a stop
STEP 6: Commit on the branch      → entry + changelog, one commit, then push
STEP 7: Merge via gh              → re-check CI on the docs commit, then gh pr merge --squash
STEP 8: Cleanup                   → worktree, branch, evidence — in that order, non-fatal
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
makes the gate runnable at all — STEP 2.4 creates it before the gate can conclude.

IF THE BRANCH IMPLEMENTS A PLAN AND ITS REVIEW VERDICT IS NOT `PASS`:
  ⛔ DO NOT USE: Bash to run gh pr merge
  ⛔ DO NOT: Treat `GAPS_FOUND` as a soft pass
  ✅ DO: Report the verdict and STOP — findings are resolved before close-out, never after

IF STEP 3 WROTE NO ENTRY:
  ⛔ DO NOT USE: Bash to run rm on anything
  ⛔ DO NOT USE: Bash to run git branch -d or git push --delete
  ⛔ DO NOT USE: Bash to run git worktree remove
  ✅ DO: Skip STEP 8 entirely

IF A FILE IS UNTRACKED:
  ⛔ DO NOT USE: Bash to run rm on it
  ✅ DO: Report it and leave it — "it's all in git" is false for an untracked file

ALWAYS:
  ⛔ DO NOT USE: Bash to run node scripts/build.js as a fix — it is a gate, not a repair step
  ⛔ DO NOT: Produce a review verdict — this command reads one and never writes one
  ⛔ DO NOT: Delete anything under docs/plans/, docs/brainstorming/ or docs/changelog/
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

**Resolve `[plan]` the way `/add-framework--build` does.** The full basename always works; otherwise match `[plan]` as a **substring** of the basenames of `docs/plans/*PLAN--*.md` (excluding `--review-v*`, `--evidence-v*` and `--ledger` companions).

- **Exactly one match** → that is the plan.
- **More than one match** → print every candidate basename and ask which one. **NEVER guess.**
- **No match** → list the plans in `docs/plans/` and STOP.

When no `[plan]` was given, derive the candidate from the branch name and confirm it with the user before proceeding.

### 1.3 Collect the delivery facts

Collect, and carry forward to STEP 3:

- **The merge base and the diff** — `git diff --name-status main...HEAD` for the added, modified, deleted and renamed paths this branch introduced.
- **The commits** — `git log --oneline main..HEAD`, short hashes.
- **The ledger** — `docs/plans/<plan-basename>--ledger.md`, and every `S<n>:` line in it.
- **The review companion** — the highest `docs/plans/<plan-basename>--review-v*.md`, if one exists.
- **The graph** — `framwork/.codeadd/artefact-graph.json`, for classifying paths at STEP 3.

**Three dots for the diff, two for the log, and neither is a typo.** Three-dot diff is merge-base-relative, which is exactly "what did this branch introduce" — a two-dot diff would also report, reversed, everything `main` gained since the branch point. Two-dot log is "commits on this branch and not on main", which is the question there. A sibling ruling in the product layer replaced a three-dot *pre-check* with two dots; that check asks the opposite question ("does main already have all of this?") and does not transfer here.

---

## STEP 2: Gates [HARD STOP]

**Run them in the order below and stop at the first failure.** A gate that fails is reported with its output; it is never re-run with different arguments to make it pass.

### 2.1 Already closed out?

Run `gh pr view --json state,mergedAt` for the current branch. If it reports the PR **already merged** → there is nothing to close out. Report it and STOP.

This is what makes a second run on the same branch safe: the gates below would all still pass, and without this check the command would write a second entry for one delivery.

### 2.2 The ledger gate — BEFORE the four commands

**Every `S<n>` F-block in the plan's Execution Order must have a `complete` line in the ledger.** A block with a `Ruling:` line but no `complete` line is not complete.

If any block is missing its `complete` line → report which ones and STOP.

**This runs first for a reason: unwritten code breaks no test.** A `/add-framework--build` run that stopped halfway passes all four commands below and an existing favourable review, and would merge and index as fully delivered — the exact lie the index exists to prevent.

### 2.3 The review gate

If the branch implements a plan, a `--review-vNN.md` companion **must** exist. If it does not → STOP.

Read its verdict:

| Verdict | Action |
|---|---|
| `PASS` | Proceed |
| `GAPS_FOUND` | **HARD STOP** — its definition is unresolved high-severity findings |
| `BLOCKED` | **HARD STOP** |

Favourable means `PASS` and nothing else. Merging over `GAPS_FOUND` indexes the findings as delivered.

**Read the verdict; never produce one.** `/add-framework--review` owns the audit. A close-out that runs its own review is a command grading its own delivery.

### 2.4 CI's four commands — read the run, do not re-run them locally

CI already runs the four commands this gate needs, on the four combinations this project supports:

```
test-cli (node 20)   node scripts/build.js  →  npm test  →  the package smoke test  [working-directory: cli]
test-cli (node 22)   the same, on the other supported major
test-scripts         npm run test:scripts   (bats)                                  [working-directory: root]
```

**Read that run. Do not execute them here.** Re-running them locally is not a stronger gate, it is a *second* gate that can disagree with the one that governs the merge — and the local copy is the weaker of the two: it runs on one machine, one Node version, and a developer's dirty environment. This repository has the receipts. `npm run test:scripts` takes **over an hour** on Windows and **63 seconds** on CI, and the local run reports a `qa-preflight.bats` failure that exists nowhere but here, because a `node_modules` above `TMPDIR` resolves a package the test asserts is absent.

`ci.yml` triggers on `pull_request`, so **the PR must exist before this gate can pass.** Creating it is part of the gate, not part of STEP 7:

1. **The working tree must be clean.** If it is not → report the dirty paths and STOP. A green run proves something about a commit; it proves nothing about uncommitted edits sitting beside it.
2. **Push the branch** if `git rev-parse HEAD` and `git rev-parse origin/<branch>` disagree.
3. **`gh pr view`** → if no PR exists, `gh pr create`.
4. **Wait for the run**, e.g. `gh pr checks --watch --fail-fast`.
5. **Compare the SHA before reading the verdict** — see below.
6. Every required check concludes `success` → the gate passes. Anything else → report which check, with its URL, and STOP.

⛔ **A green check is evidence only for the commit it ran on.** Compare `gh pr view --json headRefOid` against `git rev-parse HEAD` and **refuse a verdict from any other SHA**. Without this the command reads yesterday's green run and calls today's untested code gated — the same class of lie as a gate that silently invokes a script that does not exist, and harder to see, because the output says `pass`.

⛔ **A skipped, queued, neutral or cancelled check is not a pass.** Only `success` is. A required check that never ran is the absence of evidence, which this gate treats exactly as it treats failure.

**The fallback is local, explicit and reported.** When `gh` is unavailable, the network is down, or the repository has no CI configured, run the four commands here instead — `node scripts/build.js`, `npm test`, `npm --prefix cli run test:package`, `npm run test:scripts` — and **say in the STEP 9 report that the gate ran locally and why**. A gate that quietly changes which evidence it accepted is worse than a slow one.

`test:package` exists **only** in `cli/package.json`. In the fallback, invoked from the root without `--prefix cli`, it fails with "Missing script" — a *false* gate, which is worse than a failing one. CI avoids this by setting `working-directory: cli`; the fallback must attach the prefix by hand.

**If CI gains a job, this list follows it.** The whole point is that the gate and the merge cannot disagree about what green means.

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

- `layer`: **derived from the items, never hardcoded.** An item whose `at` sits under `framwork/` is
  product; everything else is internal. The entry takes whichever side holds more items. A tie is a
  user question, the same way a supersession is.

  ⛔ **Derive it from the item paths, NOT from the entry's `node`.** STEP 3.2 above records that
  top-level `scripts/`, `CLAUDE.md` and `.gitignore` produce no graph node, so `node` is legitimately
  absent on some entries — a rule keyed to it would have no answer for exactly the cross-layer
  deliveries one plan now produces. Item paths are always present.

  `delivered.sh` validates `layer` against `product | internal` and refuses anything else. A
  cross-layer delivery is therefore ONE entry carrying its dominant layer, never two entries and never
  a third value.
- `by`: `"done"`
- `id`: the plan's basename without extension, **verbatim** — never a slug
- `origin`: `docs/plans/<id>.md`
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

Write `docs/changelog/YYYY-MM-DD-<verb>-<slug>.md` — the human narrative record, in prose, matching the existing files in that directory. It carries **why**, which the index deliberately does not.

The index entry and the changelog are not redundant: one is a machine-readable claim about what exists, the other is the reasoning a future reader needs.

---

## STEP 5: Preview (INFORMATIVE ONLY)

Show the user, before committing: the entry as it will be written, any `LOOSE=` anchors the write reported, the supersession answers from 3.3, the changelog path, and what STEP 8 will remove.

**This is not a stop point.** It informs; it does not wait.

---

## STEP 6: Commit on the Branch and Push

Commit the entry and the changelog as **one commit on the branch**, message per `.claude/skills/add-commit/SKILL.md`. Then push.

The push re-triggers CI on the new commit. STEP 7 waits for that run before merging.

**The entry is committed before the merge, never after.** If the PR is never merged, the branch dies and the entry dies with it — which is correct. `main` must not acquire an entry for work that did not land, and writing the entry afterwards would need a pull and an extra commit on `main`.

---

## STEP 7: Merge via `gh`

The PR already exists — STEP 2.4 created it, because CI cannot run without one.

**STEP 6 pushed a commit CI has not tested.** The gate at 2.4 ran on the code; the entry and the changelog landed after it. Wait for the run on the new SHA before merging, applying the same SHA comparison 2.4 applies:

```bash
gh pr checks --watch --fail-fast
```

Then `gh pr merge --squash`.

Waiting again costs about a minute and closes the one hole a CI-read gate would otherwise leave: a delivery whose final commit was never tested. Where the repository has auto-merge enabled, `gh pr merge --squash --auto` is the same guarantee and is preferable — it lets the merge happen without holding the session open.

If the merge is refused → report it and STOP. The entry and the changelog stay on the branch, absent from `main`, which is the honest state. **DO NOT** proceed to STEP 8.

---

## STEP 8: Cleanup (NON-FATAL, IN ORDER)

**Run only if STEP 3 wrote an entry and STEP 7's merge succeeded.**

By STEP 8 the entry is already on `main`, so nothing here can invalidate the delivery. **Any sub-step that fails is reported and skipped — never rolled back, and never a reason to undo a completed merge.**

**Order is forced**, because a branch checked out in a worktree cannot be deleted:

1. **The worktree**, if one exists. **Its absence is the normal case, not an error** — work done on a branch in the main clone has none, and STEP 8 skips this silently.
2. **The branch**, local and remote.
3. **`docs/evidence/` files for this plan.**

| Removed | Kept | Why |
|---|---|---|
| The worktree, if one exists | `docs/plans/` | Read by `@framework-discovery-agent` and by seven commands |
| The merged branch, local and remote | `docs/brainstorming/` | Read by the plan and brainstorm commands |
| `docs/evidence/` files for this plan | `docs/changelog/` | The human narrative record; its retirement is out of scope |

**`docs/evidence/` is the only class with no post-merge reader.** That is a thin harvest, and it should be. `docs/plans/`, `docs/brainstorming/` and `docs/evidence/` are gitignored working artefacts, so this removes local files and touches no commit; `docs/changelog/` and `docs/delivered.jsonl` are tracked and are never removed here.

---

## STEP 9: Completion

Report:

- The entry written, with its `id` and item count
- Any supersessions declared, and which answer was given
- The changelog path
- The PR number and its merge state
- What STEP 8 removed, and what it skipped and why
- Every gate that ran, and its result

---

## Rules

ALWAYS:
- Compare the CI run SHA against `git rev-parse HEAD` before reading its verdict
- Attach `--prefix cli` to `test:package` in the local fallback — the bare form is a false gate, not a failing one
- Say in the report which evidence the gate accepted, CI or local, and why
- Add a job here when CI gains one, so the gate and the merge cannot disagree

NEVER:
- Synthesise a `node` id for something the graph does not model
- Record a rename as a deletion or a supersession
- Loosen a `find` anchor to get past a `REFUSED=` result
- Produce a review verdict — a close-out that grades its own delivery proves nothing
- Accept a check that is skipped, queued, neutral or cancelled as a pass — only `success` is one

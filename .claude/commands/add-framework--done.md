# ADD Done — Internal Close-Out

<!-- uses:
- skill: add-commit
- mention: @framework-discovery-agent
- command: /add-framework--self-build
- command: /add-framework--shared-review
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

Closes out internal work: gates it against CI's own four commands, writes the delivery-index entry and the changelog, merges the branch via `gh`, and cleans up.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
STEP 1: Collect context           → branch, plan, ledger, diff, `gh auth status`
STEP 2: Gates                     → ledger complete + review PASS + CI's four   [HARD STOP]
STEP 3: Author the index entry    → docs/delivered.jsonl, working tree only
STEP 4: Generate the changelog    → docs/changelog/YYYY-MM-DD-<verb>-<slug>.md
STEP 5: Preview                   → INFORMATIVE ONLY, never a stop
STEP 6: Commit on the branch      → entry + changelog, one commit, then push
STEP 7: Merge via gh              → gh pr create (if absent) + gh pr merge --squash
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
  ⛔ DO NOT USE: Bash to run gh pr create
  ⛔ DO NOT USE: Bash to run gh pr merge
  ⛔ DO NOT: Re-run the failing gate with different arguments to make it pass
  ✅ DO: Report which gate failed, with its output, and STOP

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

**Resolve `[plan]` the way `/add-framework--self-build` does.** The full basename always works; otherwise match `[plan]` as a **substring** of the basenames of `docs/plans/*PLAN--*.md` (excluding `--review-v*`, `--evidence-v*` and `--ledger` companions).

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

**This runs first for a reason: unwritten code breaks no test.** A `/add-framework--self-build` run that stopped halfway passes all four commands below and an existing favourable review, and would merge and index as fully delivered — the exact lie the index exists to prevent.

### 2.3 The review gate

If the branch implements a plan, a `--review-vNN.md` companion **must** exist. If it does not → STOP.

Read its verdict:

| Verdict | Action |
|---|---|
| `PASS` | Proceed |
| `GAPS_FOUND` | **HARD STOP** — its definition is unresolved high-severity findings |
| `BLOCKED` | **HARD STOP** |

Favourable means `PASS` and nothing else. Merging over `GAPS_FOUND` indexes the findings as delivered.

**Read the verdict; never produce one.** `/add-framework--shared-review` owns the audit. A close-out that runs its own review is a command grading its own delivery.

### 2.4 CI's own four commands

Run all four, **with their working directories attached**:

```bash
node scripts/build.js
npm test
npm --prefix cli run test:package
npm run test:scripts
```

`test:package` exists **only** in `cli/package.json`. Invoked from the root without `--prefix cli` it fails with "Missing script" — a *false* gate, which is worse than a failing one.

These are CI's own commands rather than a bespoke internal gate, so **a green local gate and a green PR are the same statement** and cannot disagree. If CI gains a step, add it here.

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
| Added **and** a graph node | An item, `node` filled with `<layer>/<kind>/<name>` |
| Added and **not** a node (a top-level script, an `.opencode/` adapter, `CLAUDE.md`, `.gitignore`) | An item, `node` **omitted** — never synthesised |
| Deleted, matching an existing entry's item | Drives a supersession — see 3.3. **Never an item on this entry** |
| Renamed (`R###`) | **Never a deletion.** A `changed` item on the existing entry, whose `at` the repair fixes. Nothing is superseded |
| Modified | **Not an item on its own.** Name the behaviour it introduced, or it contributes nothing |

**An internal item is a created artefact, or a named behaviour introduced into an existing one.** The third kind is what makes a modification-only plan representable, and it is not a loosening: a behaviour worth indexing has a **name in the source** — a key, a flag, a function, a marker — and that name is what other documents cite and what goes stale. A change with no nameable surface belongs in the changelog, not the index.

**`node` is omitted, never faked.** Top-level `scripts/`, `CLAUDE.md`, `.gitignore` and `.opencode/` produce no graph nodes. A synthesised id would resolve to nothing and is worse than an honestly absent field.

Entry fields specific to this layer:

- `layer`: `"internal"`
- `by`: `"done"`
- `id`: the plan's basename without extension, **verbatim** — never a slug
- `origin`: `docs/plans/<id>.md`

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

**The entry is committed before the PR, never after.** If the PR is never merged, the branch dies and the entry dies with it — which is correct. `main` must not acquire an entry for work that did not land, and writing the entry afterwards would need a pull and an extra commit on `main`.

---

## STEP 7: Merge via `gh`

Run `gh pr view` for the current branch. If no PR exists → `gh pr create`. Then `gh pr merge --squash`.

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

**`docs/evidence/` is the only class with no post-merge reader.** That is a thin harvest, and it should be: the internal relief is retiring force-add, not deleting files. Plans stay on disk, gitignored, exactly as `.gitignore` already intends.

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
- Attach `--prefix cli` to `test:package` — the bare form is a false gate, not a failing one
- Add a command here when CI gains one, so the two cannot disagree

NEVER:
- Synthesise a `node` id for something the graph does not model
- Record a rename as a deletion or a supersession
- Loosen a `find` anchor to get past a `REFUSED=` result
- Produce a review verdict — a close-out that grades its own delivery proves nothing

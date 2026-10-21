# Plan: done-worktree — `/add-done` runs from the feature worktree, stages only the delivery, and build worktrees get the installed framework

> **Status:** approved
> **Layers:** both
> **Type:** script
> **Created:** 2026-10-20
> **Delivery:** confirm
> **Ticket:** 0058B

---

## Objective

[from conversation, no design document] `/add-done` works from the linked worktree checked out on the
feature branch for context, commit-push and the PR route, while the local `--merge` still needs the
primary checkout. Commit-push stages only what belongs to the delivery and refuses, without staging,
when other dirty files exist. A worktree made by `build-setup.cjs --worktree` carries the installed
framework. The agent-mode guide says both, plus the hook rule for `/add-done`.

**When this build is done:** an agent that lives in its own worktree can close its delivery through the
PR route without leaving it, can no longer sweep a stranger's dirty file into the delivery commit, and
starts every build worktree with `.codeadd/` and the provider folders already in place.

**Ticket done when:** /add-done commit-push and PR route pass inside the matching linked worktree, local --merge still requires the primary checkout, unrelated dirty files are listed and not staged, a new build worktree has .codeadd/ and provider folders, the guide carries the hook line; covered by tests.

## Context

Ticket 0058B came from running the agent team (agent-mode section 10): every agent works in its own git
worktree (section 2), but `done.cjs` refuses any linked worktree, so the close-out had to leave the
worktree. Inside the primary checkout `doCommitPush` runs `git add -A` on the whole tree except
`docs/features/`, so whatever another agent or the operator left dirty there went into the delivery
commit. And `git worktree add` brings only tracked files, so a new build worktree has no `.codeadd/` and
no provider folder: the commands the build is about to run are not there.

No design document and no intent file exist. Every decision below was taken in this planning session
from the ticket and the code, under the user's instruction to decide every open point and approve the
plan without asking.

## Global Constraints

- Do NOT touch `backlog-core.cjs` or any migrate file — `migrate-context-files.cjs`, `migrate-ids.cjs`, `cli/src/migrations.js`, `scripts/migrations/` (user instruction: "another branch is changing them")
- Node built-ins only in shipped scripts: "Dependencies: Node >= 22.19.0 built-ins, git" (`done.cjs` header); "Node built-ins only, git on PATH" (`build-setup.cjs` header)
- Backward compatible: every existing `done#NNN` and `build-setup#NNN` test name keeps passing; no test name is removed, so no `Test-Removed:` trailer is needed (`scripts/test-loss-guard.cjs`, AGENTS.md key files)
- Edit the source, never the built copy (AGENTS.md, "EDIT THE SOURCE, NEVER THE BUILT COPY")
- Never write a raw `.codeadd/` path in a command; scripts are the exception — always `.codeadd/scripts/` (AGENTS.md, Pipeline)
- No product STEP ID, `<!-- slot: -->` or `<!-- feature: -->` marker in `add-done.md` changes; the `add-done` entries of `injection-points.json` are identical before and after (AGENTS.md, Feature Injection System)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js` (AGENTS.md key files: "Owns supported test dispatch")

## Problem

1. **`done.cjs` refuses every linked worktree** — `done.cjs:636-642` fails with "Run /add-done from the
   primary checkout" before any mode runs, including context and commit-push, which do not need the
   primary checkout at all.
2. **Commit-push stages the whole tree** — `done.cjs:278` runs `git add -A -- . ':(exclude)docs/features/*'`,
   so any dirty or untracked file outside `docs/features/` enters the delivery commit, and a file staged by
   hand before the run is committed with no check at all.
3. **A build worktree has no installed framework** — `build-setup.cjs --worktree` copies only the
   feature docs; `.codeadd/` and the provider folders are gitignored, so `worktree add` leaves them out.
4. **The guide is silent on two things a bot needs** — that a hand-made worktree needs the framework
   copied or installed, and that a destructive-command hook must allow `git push` and `gh pr merge` for
   `/add-done`.

## Proposal

Three independent fixes in one plan, on this branch.

- **`done.cjs` worktree rule.** The start guard moves after branch detection and becomes: a linked
  worktree passes when its checked-out branch is a supported feature branch — not the main branch, a known
  type, a feature id. Any other linked worktree refuses. `--merge` refuses in every linked worktree before
  any write. `--cleanup` in a linked worktree does everything it can (fetch, both checks, checkpoint tags,
  remote branch) and defers the two things git cannot do from inside the worktree — remove it and delete
  its checked-out branch — printing the two commands to run from the primary checkout. Context mode prints
  `CHECKOUT=primary|linked` so `/add-done` routes before it runs `--merge`.
- **`done.cjs` scoped staging.** Before any `git add`, every pending path (modified, staged, deleted,
  untracked) is classified. In scope: a path the branch already touches in its commits since the merge
  base with main; an untracked path under a directory one of those paths sits in (the repository root does
  not count); the current delivery folder `DOCS_DIR`; and the close-out outputs `/add-done` writes itself.
  Out of scope: everything else, except other features' folders under `docs/features/`, which stay
  untracked and silent exactly as today. Any out-of-scope path stops the run with `STATUS=ERROR` and the
  list, before anything is staged. Context mode prints the same list without failing, so `/add-done` stops
  before it writes a single document.
- **`build-setup.cjs --worktree` carries the framework.** Right after a new worktree is added, the
  directories listed in the `# ADD - managed by code-addiction` block of the source checkout's
  `.gitignore` — `.codeadd/` and each provider `dest`/`agentsDest` the CLI wrote there — are copied into the
  worktree when they exist, are ignored by git, and only for files git does not track and the worktree does
  not already have.

## Scope

### Includes

#### T1 — `done.cjs` from the feature worktree

- **F1** [product] — `framwork/.codeadd/scripts/done.cjs` and `scripts/tests/done.test.cjs`: the worktree
  rule.
  - The start guard runs after main-branch and metadata detection. In a linked worktree (`--git-dir` ≠
    `--git-common-dir`, resolved physically as today), the run continues only when `CURRENT_BRANCH` ≠
    `MAIN_BRANCH`, `FEATURE_NUMBER` ≠ `''` and `BRANCH_TYPE` ≠ `unknown`. Otherwise it fails with
    `STATUS=ERROR`, an `ERROR=` that names a linked worktree not on a feature branch, and a `HINT=` to run
    from the feature branch's worktree or the primary checkout. The linked-worktree refusal fires before the
    generic "No feature/hotfix ID" refusal, so `done#031` (primary checkout) is unaffected.
  - Context mode prints `CHECKOUT=primary` or `CHECKOUT=linked` in its CONTEXT block.
  - `--merge` in a linked worktree fails before `doCommitPush` with `STATUS=ERROR`, an `ERROR=` saying the
    local squash onto main needs the primary checkout, and a `HINT=` naming the PR route. Nothing is
    committed, pushed or checked out.
  - `--cleanup` in a linked worktree: checks 1 and 2 unchanged; no `checkout`/`pull` of main
    (`CHECKOUT_MAIN=SKIPPED (linked worktree)`); checkpoint tags and the remote branch deleted as today;
    `WORKTREE_CLEANUP=DEFERRED` and `LOCAL_DELETE=DEFERRED`; one `HINT=` carrying, in order, the three
    commands to run from the primary checkout — `git pull origin <main>`, `git worktree remove <path>`,
    `git branch -d <branch>` (the pull first, or `-d` refuses a branch whose merge the local main has not
    seen); then `CLEANUP=OK`. The closing `CURRENT_BRANCH=` prints the branch the run is actually on.
  - The header's usage text says which modes run where. In the primary checkout nothing changes.
  - Tests: `done#023` keeps its name and is re-pointed at a linked worktree on a branch with no feature id
    (it still fails, now with the new message). New tests, numbered after the last existing `done#NNN`:
    context and `--commit-push` succeed in a linked worktree on `feature/0002F-wt`, the commit lands on that
    branch and is pushed; `--merge` refuses there and leaves `HEAD` and the branch tip unchanged; a linked
    worktree checked out on `main` refuses; `--cleanup <sha>` there exits 0 with both `DEFERRED` keys, the
    remote branch gone, the worktree directory and local branch still present.
  - **Must not lose:** the physical-path compare (so `done#024`, a subdirectory of the primary checkout,
    still passes), the cleanup proof order, and every key `done#034` asserts.
  - **Validation:** L1.1–L1.4, L1.7.
  - **Produces:** `CHECKOUT=primary|linked` (context mode); `WORKTREE_CLEANUP=DEFERRED`, `LOCAL_DELETE=DEFERRED` (`--cleanup` in a linked worktree); `HINT=` with the deferred cleanup commands (`--cleanup` in a linked worktree)

- **F2** [product] — `framwork/.codeadd/scripts/done.cjs` and `scripts/tests/done.test.cjs`: scoped
  staging.
  - One classifier, used by `doCommitPush` and context mode. Merge base: `git merge-base HEAD
    origin/<main>`, falling back to `git merge-base HEAD <main>`; when neither answers, commit-push fails
    with `STATUS=ERROR` and a `HINT=` to fetch main. Branch set: `git diff --name-only --no-renames
    <base> HEAD` — committed paths only, so a rename counts both sides and an uncommitted edit to an
    untouched file is NOT in the set.
  - Pending paths: `git diff --name-only` (modified, deleted), `git diff --cached --name-only` (staged —
    a file staged by hand is classified like any other), `git ls-files --others --exclude-standard`.
    **All four git calls — the branch set included — run with `-z` and are split on NUL**, and the two
    pending diffs also take `--no-renames`, so a quoted non-ASCII path or a staged rename compares equal
    to the branch set. A `DIRTY_UNRELATED=` line prints the raw path; a path holding a newline is printed
    with the newline as `\n`.
  - With no merge base, context mode skips the classification, prints `DIRTY_UNRELATED_COUNT=unknown`
    and still exits 0; the commit-push refusal above is where it stops.
  - In scope: in the branch set; untracked under the directory of a branch-set path (the root excluded);
    under `DOCS_DIR`; or one of the close-out outputs — the four paths `runMerge` already treats as STEP 6
    output (`docs/features` scoped to `DOCS_DIR`, `docs/delivered.jsonl`, `.codeadd/wiki`,
    `.codeadd/project/decisions.jsonl`), taken from ONE constant shared with `runMerge`'s two lists.
  - Rule for `docs/features/`: the shared constant lists `docs/features` whole, and the classifier
    special-cases that one entry — only `DOCS_DIR` is ever in scope there. Another feature's folder is
    neither staged nor reported, as today — even when a branch-set path sits directly in `docs/features/`.
  - Out of scope present → before any `git add`: `STATUS=ERROR`, `ERROR=` naming uncommitted files outside
    this delivery, `DIRTY_UNRELATED_COUNT=<n>`, one `DIRTY_UNRELATED=<path>` line per path, `HINT=` to commit
    or stash them and re-run; exit 1. In scope → each path is staged with `git add -A` through a literal
    pathspec (deletions included), then the existing `verifyFinalSnapshots` and commit run unchanged.
  - Context mode prints `DIRTY_UNRELATED_COUNT` and the `DIRTY_UNRELATED=` lines in PENDING_CHANGES and
    still exits 0.
  - Tests: `done#019` and `done#020` commit their `.gitignore` fixture on the branch before the run (names
    and assertions unchanged — the untracked root `.gitignore` is now out of scope by design). New tests: an
    untracked root file and a modified tracked file the branch never touched are listed as
    `DIRTY_UNRELATED`, exit 1, nothing staged (`git diff --cached` empty) and no new commit; a modified
    branch-set file, a deleted branch-set file, an untracked file beside a branch-set file, the delivery
    folder and `docs/delivered.jsonl` are all committed; a file staged by hand outside the set is refused;
    context mode lists the same paths and exits 0. `done#018` passes unchanged, and so does `done#013`
    (context mode, root `staged.txt`/`newfile.txt`): its count keys do not change.
  - **Validation:** L1.5, L1.7.
  - **Must not lose:** `COMMIT=SKIPPED` on a clean tree (`done#030`), the final-snapshot gates (`done#019`
    to `done#022`), and the direct/squash choice in `runMerge`.
  - **Produces:** `DIRTY_UNRELATED_COUNT=<n>` and `DIRTY_UNRELATED=<path>` (context and commit-push)

- **F3** [product] — `framwork/.codeadd/commands/add-done.md`: where `done.cjs` runs, and the two new
  outputs.
  - STEP add-done.collect: one short paragraph — `done.cjs` runs from the primary checkout or from the
    linked worktree checked out on the feature branch; only the local route's `--merge` needs the primary
    checkout. Two rows in the parse table: `CHECKOUT` (route input), and `DIRTY_UNRELATED_COUNT` > 0 → STOP
    before STEP add-done.document, list the paths, ask the user to commit or stash them, then re-run. A
    stop, **deciding** in every state.
  - STEP add-done.local-route / local-merge: when `CHECKOUT=linked`, `--merge` is not run — say the local
    squash needs the primary checkout and offer the PR route (`{{cmd:add-pull-request}}`) or a re-run from
    the primary checkout. The outcome table gains a row for `DIRTY_UNRELATED`, exit 1 (nothing staged:
    report the list, STOP).
  - STEP add-done.pr-merge: the same `DIRTY_UNRELATED` outcome for `--commit-push`; after `--cleanup`,
    `WORKTREE_CLEANUP=DEFERRED` means the worktree and local branch stay, and STEP add-done.complete reports
    the commands from the `HINT=` line. `DIRTY_UNRELATED_COUNT=unknown` in context is not a stop.
  - **Must not lose:** every STEP ID, the `agent-mode.ci-watch` and `board.ticket-close` slots and their
    `feature:` markers, byte for byte.
  - **Validation:** L2.2, L2.3, L3.2.
  - **Consumes:** `CHECKOUT=primary|linked` (F1); `WORKTREE_CLEANUP=DEFERRED`, `LOCAL_DELETE=DEFERRED` (F1); `HINT=` with the deferred cleanup commands (F1); `DIRTY_UNRELATED_COUNT=<n>` and `DIRTY_UNRELATED=<path>` (F2)

#### T2 — the build worktree carries the framework

- **F4** [product] — `framwork/.codeadd/scripts/build-setup.cjs` and `scripts/tests/build-setup.test.cjs`:
  copy the installed framework.
  - Candidates: the lines between `# ADD - managed by code-addiction` and `# END ADD` in the source
    checkout's `.gitignore`, negations (`!…`) dropped, `.codeadd/*` read as `.codeadd`, trailing `/`
    stripped. That block is what `cli/src/gitignore.js` writes from each provider's `dest` and
    `agentsDest`, so it lists exactly what the CLI installed — the script never imports the CLI. No block
    → nothing is copied.
  - The gate is per FILE, never per directory: for each candidate that is a directory in the source
    checkout, the files copied are exactly `git ls-files -z --others --ignored --exclude-standard -- <dir>`
    there — untracked AND ignored. A directory check would fail on `.codeadd/*`, which ignores the
    contents and not the directory (`git check-ignore -q .codeadd` exits 1). Tracked files are never in
    that list; they arrive with `worktree add`. A candidate with no such file is not reported as copied.
  - Per file: skipped when the destination file already exists in the worktree. Never overwrites.
  - Runs only when this run added the worktree (`STATE:created|existing`), next to the feature-docs copy.
  - Prints, on stdout and BEFORE the `BRANCH:` line, `COPIED=<dir>,<dir>` in candidate order, or
    `COPIED=none` when nothing was copied. **Printed only when this run added a worktree** — never in
    in-place mode and never on `STATE:current`, where the worktree is left untouched. The `BRANCH:` line
    stays the last stdout line, which is the header's parse contract. Header updated: the copy, the
    `COPIED=` line and when it is printed, the never-overwrite rule.
  - Tests: a fixture with an ADD block naming `.codeadd/*`, `!.codeadd/board.json` and `.claude/`, an
    untracked `.codeadd/manifest.json`, a tracked `.codeadd/board.json` and an untracked
    `.claude/commands/x.md`: after `--worktree`, `COPIED=.codeadd,.claude`, both untracked files are in
    the worktree, and the worktree's `board.json` equals the tracked version, not a changed copy left in the
    source. A fixture with no ADD block prints `COPIED=none`. A block entry whose files are all tracked is
    not copied and not listed. A second `--worktree` run (`STATE:current`) prints no `COPIED=` line.
    `build-setup#017` to `#020` pass unchanged.
  - **Validation:** L1.6.
  - **Must not lose:** exit codes 0/2/3/4/5, the feature-docs copy, the unregistered-destination refusal.
  - **Produces:** `COPIED=<dir>,<dir>|none` (stdout, `--worktree` only)

- **F5** [product] — `framwork/.codeadd/commands/add-build.md`: STEP add-build.branch item 4 reads the
  `COPIED=` line only when it is present — report what was copied; on `COPIED=none` say the worktree has
  no installed framework and that the user must copy `.codeadd/` and the provider folders or run
  `npx codeadd install` inside it before going on. No line (in-place mode, or a worktree that already
  existed) means nothing to report. One sentence; no STEP ID and no slot marker changes.
  - **Validation:** L2.2, L3.4.
  - **Consumes:** `COPIED=<dir>,<dir>|none` (F4)

#### T3 — the guide

- **F6** [product] — `framwork/.codeadd/agent-mode/README.md`:
  - Section 2, next to "Always run each agent in its own git worktree": one line — `build-setup.cjs
    --worktree` carries the installed framework into the new worktree; a worktree made by hand needs
    `.codeadd/` and the provider folders copied, or `npx codeadd install` run in it.
  - Section 3: one line — `/add-done` runs `git push` and `gh pr merge`, so a destructive-command hook
    used in autonomous runs must allow them for that step.
  - Nothing else in the file moves.
  - **Validation:** L3.3.
  - **Consumes:** `COPIED=<dir>,<dir>|none` (F4) — the line describes that behaviour

#### T4 — changelog

- **F7** [internal] — `CHANGELOG.md`: under `## [Unreleased]`, a `### Fixed` section (created, it does
  not exist yet) with one bullet per fix — done from the feature worktree, scoped staging with
  `DIRTY_UNRELATED`, build worktrees carry the framework, the guide's two lines. The per-delivery file in
  `docs/changelog/` is written by `/add-framework--build` STEP 8 as it owns, with the verb `fix`; this
  F-block does not write it.
  - **Validation:** L3.5.

**Layer tag of the test files.** `scripts/tests/done.test.cjs` and `scripts/tests/build-setup.test.cjs`
sit under `scripts/`, but they are the contract suites of two product scripts — AGENTS.md: "A script's
contract … that script's own header, plus its native `scripts/tests/<name>.test.cjs` suite". Each is
edited in the same `[product]` F-block as the script it tests, so the test and the fix land in one commit.

### Does NOT Include (important!)

- `backlog-core.cjs` and every migrate file — another branch owns them.
- Removing the feature worktree from inside itself. git refuses to delete a checked-out branch, and
  removing the directory the process runs in fails on Windows; the cleanup defers both and prints the
  commands.
- `--merge` from a linked worktree. It checks out main, which the primary checkout normally holds.
- A list of provider folders inside `build-setup.cjs`. The `.gitignore` ADD block is the source.
- Copying the framework into an already-registered worktree (`STATE:current`).
- The internal pipeline's `add-framework--done` skill and `workbench/`. This is the product close-out.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| What makes a linked worktree "matching"? | Its checked-out branch is a supported feature branch: not main, known type, feature id | A path rule (`.worktrees/<slug>`) would refuse the worktrees Claude Code and bots create elsewhere — the exact case the ticket is about. In a linked worktree the checked-out branch IS `CURRENT_BRANCH`, so the branch is the only thing to check |
| `--cleanup` in a linked worktree | Run every step git allows; defer worktree removal and local branch delete; print the two commands | The PR route ends with `--cleanup`, and the user asked for it in scope. Failing it entirely would leave tags and the remote branch behind too |
| Which merge-base ref? | `origin/<main>` first, local `<main>` as fallback | Matches what context mode already diffs against; the fallback keeps offline fixtures working |
| Uncommitted edits count toward the branch set? | No — committed paths only (`<base> HEAD`) | Diffing to the working tree would make any dirty file "touched" and defeat the rule |
| "Under paths the branch touches" | The directory of each branch-set path, subdirectories included, the root excluded | Counting the root would let any touched root file (README, package.json) pull every untracked root file in |
| Close-out outputs outside `DOCS_DIR` | In scope: `docs/delivered.jsonl`, `.codeadd/wiki`, `.codeadd/project/decisions.jsonl` | `/add-done` writes them before commit-push; leaving them out would make every close-out refuse itself. One constant shared with `runMerge`, so the two lists cannot drift |
| Other features' folders in `docs/features/` | Left untracked and NOT reported | Today's behaviour (`done#018`); in-flight features keep untracked docs there by design, so reporting them would block every close-out in a shared checkout |
| A file staged by hand outside the set | Refused | `git commit` would carry it whatever `git add` did |
| Should context mode pre-report? | Yes, `DIRTY_UNRELATED_COUNT` + lines, exit 0 | `/add-done` can stop before writing any document; finding it only at commit-push leaves the changelog and index entry half-written |
| Output format for the list | `DIRTY_UNRELATED_COUNT=<n>` then one `DIRTY_UNRELATED=<path>` per line | A path can contain a comma; one key per line is what the rest of the script does |
| How `build-setup` discovers provider folders | The `.gitignore` ADD block, filtered by "exists" and "ignored" | The script ships to user projects and cannot import `cli/src/providers.js`; the block is what the CLI wrote from those same `dest`/`agentsDest` values |
| Where `COPIED=` goes | stdout, before the `BRANCH:` line | The header promises `BRANCH:` is the last line; `add-build` parses it |
| Delivery mode | `confirm` | No intent file; absent means `confirm` (add-plan-authoring, The Delivery Mode) |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| No stranger's file in a delivery commit | A branch whose build left work uncommitted in a new top-level directory now stops and asks; before, it was swept in |
| One rule for primary checkout and worktree | `done#019`/`done#020` fixtures change their setup (names and assertions kept) |
| Cleanup works from the worktree | The worktree and local branch stay until the operator runs two commands |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A close-out output not in the shared constant makes `/add-done` refuse itself | Medium | F2 test commits `DOCS_DIR` and `docs/delivered.jsonl` through commit-push; the constant is the one `runMerge` already uses (F2) |
| Editing `add-done.md` shifts an injection anchor | Low | L1.6: `add-done` entries of `injection-points.json` equal before and after (F3) |
| `COPIED=` breaks a parser expecting `BRANCH:` last | Low | F4 prints it before; L1.5 asserts the last stdout line still starts with `BRANCH:` |
| Copy overwrites a tracked config (`.claude/settings.json`, `.codeadd/board.json`) | Medium | F4 skips tracked and existing files; L1.5 asserts the tracked `board.json` is the committed one |
| `--merge` partly runs in a worktree | Low | F1 refuses before `doCommitPush`; L1.2 asserts `HEAD` and tip unchanged |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/done.cjs` | product | modify | F1, F2 |
| `scripts/tests/done.test.cjs` | product (test of a product script) | modify | F1, F2 |
| `framwork/.codeadd/commands/add-done.md` | product | modify | F3 |
| `framwork/.codeadd/scripts/build-setup.cjs` | product | modify | F4 |
| `scripts/tests/build-setup.test.cjs` | product (test of a product script) | modify | F4 |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F5 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F6 |
| `CHANGELOG.md` | internal | modify | F7 |
| `docs/changelog/<ts>-fix-done-worktree.md` | internal | create | written by `/add-framework--build` STEP 8, not an F-block |

**Graph answers (STEP 3.2, `impact --depth 1`, graph emitted this session):**

| Node | Direct callers | Risk |
|---|---|---|
| `product/script/done.cjs` | 4 — add-build, add-done, add--id-convention, add--wiki-maintenance (all `RUNS_SCRIPT`) | HIGH |
| `product/script/build-setup.cjs` | 3 — add-build, add--doc-schemas, add--id-convention | HIGH |
| `product/command/add-done` | 16 — 5 commands, 4 injected fragments (agent-mode, board, docs-pruning, gitnexus), 3 hand-off fragments, 3 skills | HIGH |
| `product/command/add-build` | not re-queried; F5 adds one sentence to one item, no anchor touched | covered by L1.6 |
| `agent-mode/README.md` | not a node ("No node matches") | NOT VERIFIED — the graph does not model `agent-mode/` |
| `CHANGELOG.md` | not an artefact | none |

The four callers of `done.cjs` that are not `add-done` only name it (id format, the `CHANGED_FILES`
input to the wiki); none reads a key this plan changes. The `docs-pruning` fragment says
"`done.cjs --merge` commits" its deletions — they sit under `DOCS_DIR`, so they stay in scope. AGENTS.md
does not change. **Delivery index:** `history` returned "no delivery recorded" for `done.cjs`,
`build-setup.cjs` and `add-done` (layer `product`) — nothing was tried and dropped.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify each fails against the
current tree.

### L1 — Script tests (`node scripts/run-tests.js scripts`) (RED → GREEN)

1. Context and `--commit-push` in a linked worktree on `feature/0002F-wt` exit 0; the commit is on that
   branch and on the remote; context prints `CHECKOUT=linked`. *RED today: the start guard refuses.*
2. `--merge` in that worktree exits 1 with the primary-checkout message; `HEAD`, the branch tip and the
   remote are unchanged. *RED today for the wrong reason: the start guard's message — the test asserts the
   new message.*
3. A linked worktree on `main`, and one on a branch with no feature id (`done#023`), exit 1 with the
   linked-worktree-not-on-a-feature-branch message. *RED today: old message.*
4. `--cleanup <sha>` in the linked worktree exits 0 with `WORKTREE_CLEANUP=DEFERRED`,
   `LOCAL_DELETE=DEFERRED`, `CLEANUP=OK`; remote branch deleted; worktree dir and local branch present.
   *RED today: the start guard refuses.*
5. Scoped staging: unrelated untracked root file + modified untouched tracked file → exit 1, two
   `DIRTY_UNRELATED=` lines, `DIRTY_UNRELATED_COUNT=2`, `git diff --cached` empty, no new commit; a
   hand-staged unrelated file is refused the same way; branch-set modified + deleted file, untracked file
   beside a branch-set file, `DOCS_DIR` and `docs/delivered.jsonl` are all in the new commit; context lists
   the same paths and exits 0. *RED today: `git add -A` stages everything.*
6. build-setup: `COPIED=.codeadd,.claude` from a `.codeadd/*` block entry, both untracked files present
   in the worktree, tracked `board.json` equal to its committed bytes, no-block fixture prints
   `COPIED=none`, an all-tracked block entry is skipped, `STATE:current` prints no `COPIED=`, the last
   stdout line starts with `BRANCH:`. *RED today: no copy, no `COPIED=`.*
7. Every existing `done#NNN` and `build-setup#NNN` passes; `node scripts/test-loss-guard.cjs` reports no
   lost test name.

### L2 — Build and anchors

1. `node scripts/build.js` exits 0 with no new warning.
2. The `add-done` and `add-build` entries of `framwork/.codeadd/injection-points.json` are identical
   before F3/F5 and after (save a copy before the first edit, diff after the build).
3. `node scripts/run-tests.js cli` passes (the suite that reads command text).

### L3 — Behavioural acceptance

1. In a scratch clone with a linked worktree on a feature branch: `done.cjs` context, then
   `--commit-push`, push the branch to a bare remote, and `--cleanup` on a merge made on that remote — the
   whole PR-route sequence, minus `gh`, without leaving the worktree. Record the outputs in the ledger.
2. Reading F3's `add-done.md` text cold: a reader in a linked worktree knows not to run `--merge`, knows
   what to do on `DIRTY_UNRELATED`, and knows the two commands left after cleanup.
3. F6's two lines read as written in Scope and nothing else in `README.md` changed (`git diff --stat`
   shows only that file, a small line count).
4. Reading F5's sentence cold: a reader knows what to do on `COPIED=none` and that no line means nothing
   to report.
5. `CHANGELOG.md`'s `[Unreleased]` carries a `### Fixed` section with the four bullets, and no other
   section changed.

**RED expectations against the current tree:** L1.1–L1.6 fail. L1.7, L2 and L3 have no RED state; they
guard what must not break.
**GREEN = all levels pass after F1–F7.**

---

## Execution Order

1. **F1 [product]** — the worktree rule; F3 and F2's worktree tests depend on it.
2. **F2 [product]** — scoped staging; same file, after F1 so the start-guard move lands first.
3. **F3 [product]** — consumes F1 and F2's keys.
4. **F4 [product]** — independent of T1.
5. **F5 [product]** — consumes F4's `COPIED=`.
6. **F6 [product]** — describes F4.
7. **F7 [internal]** — last, it summarises the rest.

Each boundary leaves the repo working: after F2 the script is complete and `add-done.md` still describes a
subset of it; after F4 `add-build` ignores the new line until F5. Before F3, save
`injection-points.json` for L2.2.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the L-level that covers it and its RED and
GREEN state, and any decision it departed from.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. The close-out output constant in F2 and `runMerge`'s two lists are one constant, not three copies.
3. A pending path that is staged by `git add` before the out-of-scope check ran.
4. `COPIED=` printed after the `BRANCH:` line, or a tracked file overwritten in the worktree.
5. A changed STEP ID or slot marker in `add-done.md` or `add-build.md`.
6. Any edit to `backlog-core.cjs` or a migrate file.

## References

- Ticket 0058B on the board (`backlog-cli.cjs get 0058B`).
- Prior art: `done#018` (feature-scoped staging), `done#023` (start guard), `build-setup#019` (feature-docs
  copy), `cli/src/gitignore.js` (the ADD block writer).

---

## Next Steps

/add-framework--build docs/plans/2026-10-20T213806-PLAN--done-worktree.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-20 | Initial creation |
| 2026-10-20 | Review `fix-then-ok` applied: F4 copies per ignored file (`ls-files --others --ignored`), since `.codeadd/*` does not ignore the directory itself; `COPIED=` printed only when a worktree was added; cleanup `HINT=` pulls main first; `-z` and `--no-renames` on every path list; context with no merge base prints `unknown`; `HINT=` added to F1 Produces / F3 Consumes; a Validation line on every F-block, L3.4 and L3.5 added; test-file layer tag stated. Status set to approved |

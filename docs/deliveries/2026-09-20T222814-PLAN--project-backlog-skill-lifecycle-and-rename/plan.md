# Plan: Project Backlog — the capture skill, the ticket lifecycle and the internal rename

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-20
> **Delivery:** confirm

---

## Objective

Today a user of the framework has nowhere to record "what to do next" inside their own project. The
idea dies in the chat, or it becomes a full plan far too early. When this is done, a **skill** writes
that intent into a file in the user's repository — with real paths and a check someone can actually
run — so that it still means something weeks later. The internal equivalent is renamed to
`add-framework--backlog` so both names match.

**When this build is done:** the board that subtopic 001 shipped has a caller. A user mid-build can
say "record this for later" and one turn later the ticket is committed on the base branch, grounded in
real paths, whatever branch they were standing on. A ticket picked up becomes a feature that carries
its id, marks itself `doing` when the build starts and `done` when the merge lands. And the framework's
own board stops being called something else.

## Context

Subtopic 001 delivered on 2026-09-20 and shipped a script with **no caller at all** — that was its
stated scope, and its own design says so: *"The `add-backlog` skill. That is 002 — this subtopic ships
a script with no caller yet."* Every project that updated since carries `backlog.sh` and has no way to
reach it. This plan is what turns that script into a capability, and it covers the whole remainder of
the umbrella.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md` | the set's objective, the four-subtopic decomposition, the vocabulary (`backlog` is the file, a `ticket` is an entry) and the cross-cutting risk table |
| `docs/brainstorming/2026-09-20T104517-project-backlog-002-capture-skill.md` | T1's contract: the two-script split, the route test, the worktree lock and sweep, the four degradations, the bounded project check |
| `docs/brainstorming/2026-09-20T104517-project-backlog-002-capture-skill-intent.md` | T1's classified path, its closed decisions, the delivery constraint |
| `docs/brainstorming/2026-09-20T104517-project-backlog-003-ticket-lifecycle.md` | T2's contract: the `ticket:` field, which commands touch the board and which do not, the status transitions, the idempotence rule, every degradation |
| `docs/brainstorming/2026-09-20T104517-project-backlog-003-ticket-lifecycle-intent.md` | T2's classified path and its closed decisions |
| `docs/brainstorming/2026-09-20T104517-project-backlog-004-internal-rename.md` | T3's contract: every path, the `--follow` correction, what is deliberately left alone |
| `docs/brainstorming/2026-09-20T104517-project-backlog-004-internal-rename-intent.md` | T3's classified path and its closed decisions |

⛔ **The 004 design's Discovery was re-run against `origin/main` after PR #79 moved the internal layer
to `workbench/`.** An earlier pass targeted `.claude/`, which is now gitignored build output. Every
T3 path in this plan is from the current tree.

## Global Constraints

- Product artefacts contain **zero** `add-framework--` strings (plan `2026-09-16T205633-PLAN--product-pipeline-parity`, enforced by a `cli/tests/` assertion)
- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `node scripts/build-workbench.js` exits 0 (CLAUDE.md, Internal Layer)
- Nothing under `.claude/` or `.opencode/` at the repository root is edited by hand — they are gitignored build output (CLAUDE.md, Internal Layer)
- `backlog.sh`, `backlog.bats` and `add-doc-schemas/references/backlog.md` are **not reopened** — subtopic 001 is delivered (001 design, Scope)
- `backlog.bats` L1.5b must keep passing: `backlog.sh` never matches `git (add|commit|push|worktree|checkout)` (`framwork/.codeadd/scripts/tests/backlog.bats:227-230`)
- Every subtopic is built in a **separate git worktree**, not the primary checkout (umbrella intent, Delivery constraint)

## Problem

1. **The board has no caller** — `backlog.sh` is installed everywhere and reachable by nobody. A script with no caller is a feature that did not ship.
2. **A mid-build capture has nowhere safe to land** — the working tree is a feature branch, and a ticket on a branch that is abandoned is the one failure the artefact exists to prevent.
3. **Work never comes back out** — a ticket picked up has to be retyped into `/add.new` by hand, and closed by hand afterwards. Both depend on remembering, which is what a board replaces.
4. **One idea, two words** — the product layer says `backlog`, the internal layer says `roadmap`, and the translation survives exactly as long as the person who learned it.

## Proposal

Three topics, executed in order, in one delivery.

**T1** gives the board a caller: a skill plus a second script that owns the git route. The split is
forced rather than chosen — `backlog.bats` already asserts that `backlog.sh` runs no git verb, with
the comment *"the git route belongs to subtopic 002"*, so the shipped suite anticipated exactly this
shape.

**T2** wires the board into the pipeline through one field carried by documents that already travel
it. Only two of the five commands write to the board, and both already do git writes — that is the
constraint the hook table was built to satisfy, not a coincidence.

**T3** renames the internal artefact so both layers use one word.

## Current State

| Artefact | Today | Dependants (depth 1) |
|---|---|---|
| `framwork/.codeadd/scripts/backlog.sh` | seven modes over `docs/backlog.jsonl`; runs no git; **no caller** | 0 (read off disk — the graph models no script-to-script call) |
| `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` | the thirteen ticket fields, `work_id` declared and never filled | part of `add-doc-schemas` — 21 |
| `framwork/.codeadd/commands/add.brainstorm.md` | three paths, no ticket notion | 2 |
| `framwork/.codeadd/commands/add.new.md` | resolves an intent file at STEP 1.1; declares a READ-ONLY GUARANTEE twice | 12 |
| `framwork/.codeadd/commands/add.plan.md` | reworked 2026-09-13 around the dispatch-returns-doc shape | 21 |
| `framwork/.codeadd/commands/add.build.md` | reworked 2026-09-19 around `REVIEW_SOURCE` and Final-Review-before-Loop-End | 20 |
| `framwork/.codeadd/commands/add.done.md` | rebuilt 2026-09-11 around a four-state `INDEX_ENTRY` cross with a Resume route | 10 |
| `workbench/commands/add-framework--roadmap.md` | nine steps, audited `ok` on all eight ruler items | 0 |
| `docs/roadmap/index.md` | live items 1.2, 1.4, §5; cites `git log` on itself twice | not a node |

## Scope

### Includes

#### T1 — the capture skill (ref: design 002)

- **F1** [product] — `framwork/.codeadd/scripts/tests/backlog-commit.bats`: the suite, written FIRST and verified RED. Covers the route test, the locked-worktree refusal, the no-remote case, the refused push, a seeded rebase conflict, and a capture launched from inside a linked worktree. Must NOT relax `backlog.bats` L1.5b or touch it at all.
  - **Produces:** the RED baseline every T1 F-block is driven green against
- **F2** [product] — `framwork/.codeadd/scripts/backlog-commit.sh`: new script wrapping a board write — resolves the base branch via `get-main-branch.sh`, picks its route, runs `backlog.sh` inside the right tree, stages the two paths by name, commits, fetches, rebases, pushes, cleans up. One process, one trap. Must NOT commit anything but `docs/backlog.jsonl` and `docs/backlog.definitions.json`, and must NOT resolve a rebase conflict. Ref: design 002 § Key Decisions.
  - **Produces:** `backlog-commit.sh` emits `ROUTE=direct|worktree`, `BASE_BRANCH=<name>`, `SHA=<sha>`, `PUSHED=yes|no`, `TICKET_ID=<id>`, and on a degradation `DEGRADED=<reason>`
  - **Consumes:** the RED baseline (F1)
- **F3** [product] — `framwork/.codeadd/skills/add-backlog/SKILL.md`: the skill — its `description` (the whole trigger surface), `When to Use` / `When NOT to Use`, the mode resolution with no flag grammar, the capped bounded project check, the one stop on an ambiguous target, and the report through `{{skill:add-final-report/SKILL.md}}`. Reads go straight to `backlog.sh`; writes go through F2. Must NOT dispatch a subagent, open the artefact graph, or read a plan. Ref: design 002 § Scope.
  - **Consumes:** `ROUTE`, `BASE_BRANCH`, `SHA`, `PUSHED`, `TICKET_ID`, `DEGRADED` (F2). **`TICKET_ID` is the only way the user learns which ticket they just created** — on an `add` the id does not exist before the write, so a report that names only the sha has left them with nothing to address the ticket by
- **F4** [product] — `framwork/provider-map.json`: register `"add-backlog": {}` under `skills` — the default distribution, as every other skill uses. Must NOT add a per-provider override.

#### T2 — the ticket lifecycle (ref: design 003)

- **F5** [product] — `framwork/.codeadd/skills/add-backlog/references/lifecycle.md` and its row in the skill's reference table: the whole procedure the five commands share — the `ticket:` field, the `[0-9]{4}B` resolution, the per-command table, the two transitions, the idempotence rule and every degradation. Must NOT be restated in any command. Ref: design 003 § Proposed Solution.
  - **Produces:** the `ticket:` frontmatter field, and the rule that a board write reads the ticket first and skips when it already holds the target status
- **F6** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md`: `ticket:` added to the `about.md` frontmatter table as **optional**. Must NOT be added to the required list — the validation gate's Check 1 asserts presence of required fields, and a required `ticket:` would fail every document in a project that never uses the board.
  - **Consumes:** `ticket:` (F5)
- **F7** [product] — `framwork/.codeadd/commands/add.brainstorm.md`: a resolution sub-step at STEP 1 reading a `[0-9]{4}B` id from the invocation, and `ticket:` written at STEP 3 (document) and STEP 5.3 (intent file). **Writes nothing on the `spike` path** — that path produces no file, and the hook must not be the first thing in the command to break its own path table. Must NOT touch the board.
  - **Consumes:** `ticket:` (F5)
- **F8** [product] — `framwork/.codeadd/commands/add.new.md`: STEP 1.1 reads `ticket:` from the intent file; STEP 2 writes it into the skeleton `about.md` frontmatter, on the same line as `branch:`. Must NOT add any git write — the command's READ-ONLY GUARANTEE at lines 92-95 and 133 stays intact and unedited.
  - **Consumes:** `ticket:` (F5)
- **F9** [product] — `framwork/.codeadd/commands/add.plan.md`: STEP 4 reads `ticket:` from `about.md` and carries the ticket's `done_when`, `notes[]` and `paths[]` into planning as input. Read-only. Must NOT land inside the dispatch-returns-doc shape that plan `2026-09-13T100745` established.
  - **Consumes:** `ticket:` (F5)
- **F10** [product] — `framwork/.codeadd/commands/add.build.md`: STEP 2, immediately after `build-setup.sh` returns — **one** write setting `work_id` to `FEATURE_ID` and `status` to `doing`. Must NOT sit near the Final-Review-then-Loop-End ordering that plan `2026-09-19T122048` established.
  - **Consumes:** `ticket:` and the read-first rule (F5); `DEGRADED` (F2)
- **F11** [product] — `framwork/.codeadd/commands/add.done.md`: STEP 8, after the merge — sets `status` to `done`, reading first and skipping when it already reads `done`. Must NOT add a Resume guard of its own, and must NOT be placed where a retried close-out re-runs it blindly.
  - **Consumes:** `ticket:` and the read-first rule (F5); `DEGRADED` (F2)

#### T3 — the internal rename (ref: design 004)

- **F12** [internal] — `git mv workbench/commands/add-framework--roadmap.md` → `add-framework--backlog.md`, the word "roadmap" replaced throughout it, the `workbench/provider-map.json` key and `description` renamed, the `CLAUDE.md` internal-commands row updated, **and `cli/tests/review-no-loops.test.js` line 383 updated — all in ONE commit**. That test asserts the `CLAUDE.md` row exists under the old name and is the single gate the rename breaks; splitting it leaves a commit that fails CI for a reason unrelated to its own content. Must NOT drop the `uses:` block's `- skill: add-final-report` line.
  - **Produces:** the command name `add-framework--backlog` and the node `internal/command/add-framework--backlog`
- **F13** [internal] — `git mv docs/roadmap/index.md` → `docs/backlog/index.md`, the H1, and **the two in-file `git log` citations plus the header's generic claim rewritten to `git log --follow`**. Measured on this repository: plain `git log` on a renamed file returns 2 commits where `--follow` returns 6, so a bare citation would silently stop at the rename. Must NOT renumber, reword or reorder any item — 1.2, 1.4 and §5 come out byte-identical but for the word "roadmap" and the `--follow` additions.
  - **Consumes:** `add-framework--backlog` (F12)
- **F14** [internal] — `cli/tests/close-out-hardening.test.js` line 264 and `cli/tests/build-artefact-graph.test.js` lines 885-886 and 975-980: comment-only mentions updated for accuracy. Their assertions are about `add-framework--done` and about node and edge counts, neither of which a rename changes. Must NOT alter any assertion.
  - **Consumes:** `add-framework--backlog` (F12)
- **F15** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` line 71: the sentence explaining the absent `scope` field by contrasting it with "the framework's own roadmap" is reworded, because after F12 that contrast names nothing. **This is the only line of 001's delivery this plan touches, and the only cross-layer edit in T3.** It names neither the old command nor the old path, so the T3 grep sweep would miss it. Must NOT change anything else in that file, and must NOT introduce an `add-framework--` string into a product artefact.
  - **Consumes:** `add-framework--backlog` (F12)

### Does NOT Include (important!)

- Any other change to `backlog.sh`, `backlog.bats` or `references/backlog.md` — subtopic 001 is delivered, and F15 is one sentence made necessary by F12.
- Creating a ticket automatically. A ticket exists because the user asked for one.
- Matching work to a ticket by inference, keyword or similarity — banned by the umbrella, because a wrong match closes someone else's ticket and nothing downstream can detect it.
- `/add.hotfix`, `/add.review`, `/add.audit`, `/add.diagnose`, `/add.wiki`, `/add.pull-request`, `/add.qa-setup`. The umbrella named five commands.
- A `BACKLOG_OPEN:` line in `status.sh`. 001 decided against it, and every hook here reads a declared id rather than a list.
- Re-opening a `done` ticket, or any transition back out of it.
- A reading interface, and any sync with an external tracker — excluded by the umbrella.
- Migrating the internal markdown board to JSONL. The two layers match in name and deliberately not in format — the internal file is read raw by a human and by `/add-framework--plan`.
- Editing delivered changelogs, `docs/delivered.jsonl` or `docs/deliveries/` that say "roadmap". They are the record, and the item numbers they cite still resolve.
- Hand-editing anything under `.claude/` or `.opencode/` at the repository root, or `web/public/artefact-graph.mmd`. All are generated.
- `workbench/agents/readme-analyzer.md` line 24 — its "Roadmap" is a `README.md` heading, unrelated.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| One script or two? | Two — `backlog.sh` writes, `backlog-commit.sh` commits | `backlog.bats` L1.5b already asserts `backlog.sh` runs no git verb, commenting *"the git route belongs to subtopic 002"*. Also: a trap needs a process, and a skill has none. Design 002 § Alternatives |
| Worktree or git plumbing? | Worktree | Plumbing is cleaner and was rejected on cost: `backlog.sh` addresses `docs/backlog.jsonl` by fixed relative path and `backlog.bats` pins it. The worktree runs the shipped script unchanged. Design 002 § Alternatives |
| Worktree or commit in place, like `add-framework--roadmap`? | Worktree | In-place works there because the user is normally on `main`. A mid-build capture is on a feature branch, and that is the exact loss the artefact exists to prevent. Umbrella § Risks |
| What picks the direct route? | `git rev-parse --abbrev-ref HEAD` equals the name `get-main-branch.sh` returned. Anything else, detached HEAD included, takes the worktree | F11 depends on the direct route by name after the merge. A test left to the builder is a test T2 cannot rely on. Design 002 § Key Decisions |
| How is a leaked worktree told from a live one? | `git worktree lock` held for the whole capture; the sweep removes only an unlocked tree and fails loud on a locked one | Without it, a second capture's sweep deletes the first one's tree mid-commit — the silent loss the design is written against. Design 002 § Key Decisions |
| Who fills `work_id`? | `/add.build` STEP 2, in the same `update` as `doing` | `/add.new` declares a READ-ONLY GUARANTEE twice; a board write commits and pushes. `FEATURE_ID` is in hand at build STEP 2, and one write means one worktree. Design 003 § Key Decisions |
| How does a command learn it is working from a ticket? | A `ticket:` id declared in a document, matched as `[0-9]{4}B` in the invocation at `/add.brainstorm` | Declared, never inferred — the umbrella's own exclusion. `branch:` already travels this exact road |
| `ticket:` required or optional in `about.md`? | Optional | The validation gate's Check 1 asserts required-field presence. Nothing in `cli/` or `framwork/` rejects an unknown key, so additive is safe; required would fail every document in a project that never uses the board |
| `work_id` on the ticket versus `ticket` on `about.md` — unify the names? | No | Two conventions, each internally consistent: frontmatter uses bare names (`branch:`, `related:`, `tags:`), the JSONL uses `snake_case` (`created_at`, `done_when`, `work_id`). Unifying breaks one of them |
| How is a retried `/add.done` stopped from writing `done` twice? | Both board writes read the ticket first and skip when it already holds the target status | `/add.done` was rebuilt around a four-state `INDEX_ENTRY` cross with a Resume route whose sub-steps carry explicit re-run guards. Reading first is cheaper than a sixth guard, and it covers a re-run `/add.build` for free |
| Can a hook block a build? | No. Every degradation is one report line and the run continues | The board is a side-record. A build that fails because a ticket could not be moved has inverted the relationship between the work and the note about the work |
| Does the internal board migrate to JSONL? | No — names match, formats do not | The internal file is read raw, which JSONL would end, for a migration nobody asked for. Design 004 § Alternatives |
| Does `add-framework--roadmap` need a quality pass alongside the rename? | No | `@prompt-review-agent` audited it in `mode: audit` and returned **`ok`** on all eight ruler items with no findings. T3 is a rename and nothing else |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A ticket that reaches the base branch regardless of the branch the user stood on | A temporary worktree per write, and a dependency on the base branch being resolvable |
| 001's asserted "never commits" promise survives untouched | A second script, and a second header to keep honest |
| The board becomes visible from inside the flow the user is already in | Five hub commands now name a skill a given project may never use |
| One word for one idea across both layers | Five months of changelogs that say "roadmap", now slightly stale in wording |
| One delivery instead of three brainstorm→plan→build→done cycles | A single branch carrying ~15 F-blocks, where a stop mid-way leaves a partial delivery |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| A hook lands inside a fragment's injection anchor and breaks feature injection at install time | Med | Per-command anchor check in the Validation Matrix L2, and the expected end-state map asserted there. All five commands carry markers, and no graph query or build gate reports a broken one |
| The sweep deletes a worktree a live capture is using | Low | F2's lock, and F1's locked-worktree refusal test — written RED first |
| The fetch-and-rebase conflicts with nobody present | Med | F2 runs `git rebase --abort`, keeps the commit on the local base branch, reports `DEGRADED=`. F1 seeds a conflict and asserts it |
| The push is refused — protected branch, ruleset, or no remote | High | F2 degrades to a local commit and reports the sha. F1 covers the no-remote case directly |
| `cli/tests/review-no-loops.test.js` L3.5 fails CI after the rename | **Certain if not handled** | F12 carries it in the same commit as the rename, named by file and line |
| A stale pointer survives in `CLAUDE.md` after T3 | High | F12 carries the row, and Validation Matrix L3 greps for the old name across every live path |
| `F15`'s sentence is missed, because it names neither the old command nor the old path | Med | It is its own F-block rather than a line in the sweep, for exactly that reason |
| The two `git log` citations keep the bare form and silently stop at the rename | Med | F13 rewrites them to `--follow`, and L3 asserts no bare `git log docs/backlog/index.md` survives |
| A product artefact gains an `add-framework--` string via F15 | Low | Global Constraint, enforced by the existing `cli/tests/` parity assertion, re-run in L2 |
| The build stops mid-plan, leaving a partial delivery | Med | Execution Order names the two boundaries where the repo is in a working state, and the ledger's resume rule picks up from the last committed F-block |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/tests/backlog-commit.bats` | product | create | F1 — the RED baseline |
| `framwork/.codeadd/scripts/backlog-commit.sh` | product | create | F2 — the git route |
| `framwork/.codeadd/skills/add-backlog/SKILL.md` | product | create | F3 — the trigger surface and the capture procedure |
| `framwork/provider-map.json` | product | modify | F4 — registration |
| `framwork/.codeadd/skills/add-backlog/references/lifecycle.md` | product | create | F5 — the procedure five commands share |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | product | modify | F6 — `ticket:` as an optional frontmatter field |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F7 — resolve and record the ticket |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F8 — carry `ticket:` into `about.md` |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F9 — read the ticket as planning input |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F10 — `work_id` and `doing`, one write |
| `framwork/.codeadd/commands/add.done.md` | product | modify | F11 — `done`, after the merge |
| `workbench/commands/add-framework--roadmap.md` | internal | rename | F12 — to `add-framework--backlog.md` |
| `workbench/provider-map.json` | internal | modify | F12 — key and description |
| `CLAUDE.md` | internal | modify | F12 — the internal-commands row |
| `cli/tests/review-no-loops.test.js` | internal | modify | F12 — the one assertion the rename breaks |
| `docs/roadmap/index.md` | internal | rename | F13 — to `docs/backlog/index.md`, plus H1 and `--follow` |
| `cli/tests/close-out-hardening.test.js` | internal | modify | F14 — comment accuracy |
| `cli/tests/build-artefact-graph.test.js` | internal | modify | F14 — comment accuracy |
| `framwork/.codeadd/skills/add-doc-schemas/references/backlog.md` | product | modify | F15 — one sentence, made necessary by F12 |

**Not touched, and named so a reviewer does not hunt for them:** `.claude/`, `.opencode/` and
`web/public/artefact-graph.mmd` are generated; `backlog.sh` and `backlog.bats` belong to a delivered
subtopic; `docs/changelog/`, `docs/delivered.jsonl` and `docs/deliveries/` are the historical record.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level is written BEFORE its F-block lands and verified to fail against
the current tree. F1 is itself the RED baseline for T1 and is the first block executed.

**EXPECTED END-STATE MAP — injection anchors, asserted as a whole.** Feature and plugin injection
anchors on content in the five command sources, and T2 edits all five. The map below is the state
after F7-F11, and L2.3 asserts the total, not merely that each command still parses:

| Command | Fragments injecting into it | Anchors before | Anchors after |
|---|---|---|---|
| `add.brainstorm` | none | 0 | 0 |
| `add.new` | `plugins/gitnexus/fragments/add.new.md` | as emitted today | unchanged |
| `add.plan` | `qa-pipeline`, `tdd-pipeline`, `plugins/gitnexus` | as emitted today | unchanged |
| `add.build` | `qa-pipeline`, `tdd-pipeline`, `plugins/gitnexus` | as emitted today | unchanged |
| `add.done` | `docs-pruning`, `plugins/gitnexus` | as emitted today | unchanged |

**Total `injection-points.json` entries must equal the pre-build count exactly.** A hook that lands
inside an anchor changes that number, and nothing else in the pipeline reports it.

### L1 — Scripts, bats (RED → GREEN)

1. `backlog-commit.sh` on the base branch emits `ROUTE=direct` and no worktree is created. *RED today: the script does not exist.*
2. From a feature branch it emits `ROUTE=worktree`, the ticket lands on the base branch, and `.worktrees/backlog` does not exist afterwards. *RED today: same.*
3. From a **detached HEAD** it emits `ROUTE=worktree`. *RED today: same.*
4. A second invocation while `.worktrees/backlog` is locked exits non-zero, names the path and `git worktree unlock`, and **removes nothing**. *RED today: same.*
5. With no remote configured: `PUSHED=no`, `DEGRADED=` set, the commit present on the local base branch, exit reflects a result rather than a failure. *RED today: same.*
6. With a seeded conflicting commit on the remote: the rebase aborts, `PUSHED=no`, the repository is **not** left mid-rebase (`git rebase --abort` leaves no `.git/rebase-merge`). *RED today: same.*
7. `get-main-branch.sh` exit 1 and exit 2 each leave the ticket in the working tree, uncommitted, with the two reported distinguishably. *RED today: same.*
8. Launched from inside a linked worktree, the capture still succeeds — `done.sh` refuses this case and `backlog-commit.sh` must not. *RED today: same.*
9. Only `docs/backlog.jsonl` and `docs/backlog.definitions.json` appear in the commit, with an unrelated dirty file present in the tree. *RED today: same.*
10. **`backlog.bats` passes unchanged**, L1.5b included — `backlog.sh` still matches no git verb. *GREEN today and must stay so.*

### L2 — Build and registration (cli tests)

1. `node scripts/build.js` exits 0 and emits `add-backlog` to all five providers under each provider's skills pattern.
2. The product-parity assertion passes: **zero** `add-framework--` strings across every product artefact, F15 included.
3. **The injection end-state map above**, asserted as a total count against `injection-points.json` plus a per-command presence check. *RED expected only if a hook lands badly.*
4. `lintResourcePaths()` emits no new warning — no raw `.codeadd/commands/` or `.codeadd/skills/` path enters from F3, F5 or F7-F11.
5. `node scripts/build-workbench.js` exits 0 and emits `add-framework--backlog` to claude and opencode; **no file named `add-framework--roadmap` is emitted.**
6. `cli/tests/review-no-loops.test.js` passes under the new name, and its sibling rows for the other internal commands still assert.

### L3 — Graph and sweep

1. `impact add-backlog --depth 1` returns the five commands after T2 — **five, named**, not "some".
2. `dependencies add-backlog` resolves `backlog.sh`, `backlog-commit.sh`, `add-final-report` and `add-doc-schemas/references/backlog.md`, each to something that exists. No dangling target.
3. `internal/command/add-framework--backlog` resolves; `internal/command/add-framework--roadmap` resolves to nothing.
4. `dependencies add-framework--backlog` still returns exactly one edge, `USES_SKILL → internal/skill/add-final-report`.
5. **Grep sweep:** no live path — `workbench/`, `scripts/`, `cli/`, `CLAUDE.md`, `.github/`, `web/src/`, `web/public/*.astro`, `README.md`, `framwork/.codeadd/` — contains `add-framework--roadmap` or `docs/roadmap/`. `docs/changelog/`, `docs/delivered.jsonl`, `docs/deliveries/` and `docs/brainstorming/` are excluded as the record.
6. **No bare `git log docs/backlog/index.md`** survives in `docs/backlog/index.md`; every citation carries `--follow`.

### L4 — Behavioural acceptance

1. A capture from a feature branch, with the base branch pushable, puts the ticket on the base branch and reports **both the ticket id and the sha** — the user's working tree unchanged. On an `add` the id did not exist before the write, so a report carrying only the sha fails this assertion.
2. A ticket carried through `/add.brainstorm` → `/add.new` arrives in `about.md` frontmatter as `ticket:`, and the intent file carries it too.
3. `/add.build` on that feature sets `work_id` to the feature id **and** `status` to `doing` in **one** board write.
4. `/add.done` after the merge sets `status` to `done`, and a **second, resumed** run of `/add.done` writes nothing — no commit, no `updated_at` bump.
5. With `docs/backlog.jsonl` absent, all five hooks no-op silently and no command fails.
6. With `ticket:` naming an id not on the board, every hook reports it and the command completes.
7. With the user having renamed `doing` in `docs/backlog.definitions.json`, `/add.build` reports the refusal and the build completes.
8. A brainstorm classified `spike` that named a ticket writes **no** file and names the ticket in its final report.
9. `docs/backlog/index.md` opens under its new name with items 1.2, 1.4 and §5 at their original numbers.

**RED expectations against the current tree:** every L1 assertion except 10; L2.5 and L3.3, L3.4,
L3.5, L3.6; L3.1 and L3.2; every L4 assertion. L2.1-L2.4 and L1.10 pass today and are regression
guards.
**GREEN = all levels pass after F1-F15.**

---

## Execution Order

```
T1:  F1 → F2 → F3 → F4
T2:  F5 → F6 → F7 → F8 → F9 → F10 → F11
T3:  F12 → F13 → F14 → F15
```

- **F1 first**, before F2, because it is the RED baseline and a suite written after the script proves nothing.
- **F2 before F3**, because the skill consumes the script's `KEY=VALUE` contract and cannot be written against modes still open.
- **F4 before T2**, because an unregistered skill does not build, and T2's hooks name it.
- **F5 before F6-F11**, because all six consume the `ticket:` field and the read-first rule it declares.
- **F7-F11 in that order** — it is the pipeline's own order, so a reviewer reads the hooks in the sequence a user meets them.
- **F12 before F13-F15**, because all three consume the new command name.
- **T3 last** because it is the least valuable, not because it is blocked. The umbrella says so outright, and F15 is the only file T3 shares with T1/T2.

**Boundaries where the repository is in a working state**, for a build that must stop:

| After | State |
|---|---|
| **F4** | T1 complete. The skill works standalone — a user can capture, list and search. Nothing in the pipeline references it yet |
| **F11** | T2 complete. The full product feature works end to end. The internal rename is untouched and the old name is still consistent everywhere |
| **F15** | Everything |

⛔ **Do NOT stop between F12 and F15.** F12 renames the command while F13-F15 still name the old one, and F12's own commit is what keeps CI green — an intermediate stop inside T3 leaves a tree whose grep sweep fails by construction.

**Per-F-block validation beyond the layer default:**

- **F1-F2** — `npm run test:scripts` after each, not only at the end of T1.
- **F7-F11** — `node scripts/build.js` plus the L2.3 injection-count assertion after **each** command edit, never batched. A broken anchor found after five edits costs five bisections.
- **F12** — `npm test` in `cli/` in the same commit; it is the commit that would otherwise be red.
- **F13** — a `git diff --stat` showing only the H1 and the `--follow` lines changed beyond the rename itself.

## Reviewer Handoff

The review command must be able to audit this without re-reading the design docs. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing. F1 is the clearest case: a `backlog-commit.bats` committed alongside `backlog-commit.sh` rather than before it.
2. **A hook that quietly became a stop.** Every T2 degradation is a report line; a build that halts because a ticket could not be moved has inverted the relationship, and it will look like correct error handling in review.
3. **A board write added to `/add.new`.** Its READ-ONLY GUARANTEE is prose, not a gate — nothing fails if F8 writes to the board, it merely contradicts the command's own contract twice over.
4. **`/add.brainstorm` writing an intent file on the `spike` path.** Its path routing is prose too, enforced by no gate.
5. **F15 dropped as "out of layer."** It is the only product edit in T3 and the grep sweep cannot find it — it names neither the old command nor the old path.
6. **`backlog.bats` edited to accommodate `backlog-commit.sh`.** L1.5b is load-bearing and belongs to a delivered subtopic; a relaxed assertion there is the quietest way this plan could break 001.
7. **A `Consumes` naming a string no earlier F-block `Produces`.** T1's five keys and T2's `ticket:` are the interfaces; anything else crossing an F-block boundary was invented mid-build.

## References

- Design set: `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md` and its `-002-`, `-003-`, `-004-` members, each with its `-intent.md`
- Prior art this plan builds on: `2026-09-20T111051-PLAN--project-backlog-001-format-and-script` — the board format, the script that owns it, the `B` id letter, and the `backlog.bats` assertion that reserved the git route for T1
- Constraining recent deliveries: `2026-09-11T014333-PLAN--product-close-out-parity` (the `INDEX_ENTRY` cross and the Resume route F11 must not double-write), `2026-09-13T100745-PLAN--readonly-agent-dispatch-capability` (the dispatch-returns-doc shape F9 sits after), `2026-09-19T122048-PLAN--optional-review-build-final-review` (the Final-Review-before-Loop-End ordering F10 sits away from), `2026-09-16T205633-PLAN--product-pipeline-parity` (the zero `add-framework--` constraint)
- Audit: `@prompt-review-agent` on `internal/command/add-framework--roadmap`, `mode: audit` — verdict `ok`, eight of eight, no findings

---

## Next Steps

/add-framework--build project-backlog-skill-lifecycle-and-rename

[One command executes every F-block, whichever layer each is tagged. Do NOT route part of the plan to
a second command.]

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-20 | Initial creation |
| 2026-09-20 | Review `fix-then-ok` applied: `TICKET_ID` added to F3's `Consumes` — F2 produced it and nothing consumed it, so a capture report could have shipped without naming the ticket it created. L4.1 now asserts the id is reported alongside the sha |
| 2026-09-21 | Implemented on `feat/project-backlog-skill-lifecycle-and-rename`, commits `56665bc..4492a2c`: F1-F15 in 14 commits, 5 review fixes (`8cbcab0`, `4c1d6ca`, `efdec14`, `4ee4859`, `47dbdd7`), inventory sync `ae19742`, changelog `4492a2c`. Departures from this plan are rulings in the ledger |

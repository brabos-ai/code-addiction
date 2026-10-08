# Plan: Agent-friendly workbench — opt-in result block and a plan-less fix track on done

> **Status:** implemented
> **Layers:** internal
> **Type:** workflow
> **Created:** 2026-10-07
> **Delivery:** confirm
> **Ticket:** 0028B

---

## Objective

An agent driving the workbench through `claude -p` can read every `add-framework--*` run's outcome
from one documented, versioned JSON block instead of parsing free text — opt-in, with the current
report untouched by default — and a small fix that never had a brainstorm or a plan closes out through
`/add-framework--done` with the same changelog, index entry, archive, ticket write and `--merge` a
planned delivery gets.

**When this build is done:** `CODEADD_OUTPUT=json` (or `output.mode` in a new tracked
`workbench/settings.json`) makes every `add-framework--*` stage end — at its closing step and at every
stop — with one fenced `codeadd-result` block whose shape is pinned by a test; with no setting the
closing is byte-for-byte today's. `/add-framework--done --fix <slug> [--ticket <id>]` closes a plan-less
branch by generating a fix record from git and CI facts, and every planned close-out runs exactly as
before.

**Ticket done when:** All add-framework--* pipeline commands emit the documented result block, covered by tests; a plan-less fix closes through the standard close-out with a delivered-index entry and archive; existing plans close out exactly as before.

## Context

Agents now run the workbench as well as people, and get a seven-block report written for a human.
Separately, small fixes happen outside the pipeline (PR #112, 2026-10-07) and the only close-out that
writes the index, changelog and archive refuses them because it requires a plan and a ledger.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-07T190913-agent-friendly-workbench.md` | The result-block schema (field table), the mode table, the resolver contract and precedence, where the stop-rule line goes, the fix-track step-by-step table, the fix-record shape and its three-source resolution order |
| `docs/brainstorming/2026-10-07T190913-agent-friendly-workbench-intent.md` | Path `architectural`, the 16 closed decisions, `## Open` = None, `delivery: confirm`, `ticket: 0028B` |

## Global Constraints

- Default mode is `prose` and prints "Exactly today's report. No resolver output is shown and nothing else changes" (design, Part 1 — What each mode prints)
- Precedence "`CODEADD_OUTPUT` env > `output.mode` in `workbench/settings.json` > `prose`; invalid value skipped with a warning; resolver failure falls to `prose`" (intent, Decided)
- Fence info string `codeadd-result`, `v: 1`, "every key always present, `null` for unknown" (intent, Decided)
- "`--fix` with a `[plan]` argument is refused; without `--fix` done is unchanged" (intent, Decided)
- "`gh pr merge --merge` kept" on the fix track (intent, Decided)
- The root takes no dependency and is CommonJS — the resolver is a plain `.js` on Node built-ins (design, Part 1; root `package.json` has no `"type"`)
- "EDIT THE SOURCE, NEVER THE BUILT COPY" — edit `workbench/`, never `.claude/`, `.opencode/`, `.agents/`, `.codex/` (AGENTS.md, Internal Layer)
- Tests run only through `node scripts/run-tests.js <suite>`; "All local hosts use Linux Docker, never native fallback" (scripts/run-tests.js header)
- `node scripts/build-workbench.js` and `node scripts/build.js` exit 0 and emit no new warning (AGENTS.md, Pipeline)

## Problem

1. **No machine-readable outcome** — status, branch, commits, tests, PR, CI and the next step exist only
   inside text written for a person.
2. **A plan-less fix has no supported close-out** — it skips the index and archive, or someone writes a
   fake plan and ledger to pass gate 2.2.

## Proposal

Two independent tracks on one branch, result block first because it is self-contained and the fix
track's done edits land on a file the result block's stop-rule line also touches.

- **Result block:** a resolver script prints the mode; `add-final-report` alone owns the schema (in a new
  reference) and the emission rule; each of the seven `add-framework--*` artefacts gains one pointer
  line in its `ABSOLUTE PROHIBITIONS` block.
- **Fix track:** `add-plan-authoring` gains the fix-record naming, resolution, archive member and
  ticket-carrier clauses; `add-framework--done` gains `--fix`, branching at 1.2, 1.3, 2.2, 2.3, 2.4,
  STEP 4's lookup, 6.1, 8 and 9 exactly per the design's step table.

## Current State

| Artefact | Called by (graph, `impact --depth 1`, fresh build 2026-10-07) | Risk | History (`--layer internal`) |
|---|---|---|---|
| `add-final-report` | backlog, release, sync (commands); brainstorm, build, done, plan, add-plan-authoring, building-commands (skills) — 9; unbounded 14 | **HIGH** | `live` — `2026-10-07T144204-PLAN--next-step-command-carries-path` (The Continuation Line) |
| `add-plan-authoring` | brainstorm, build, done, plan — 4; unbounded 10 | **HIGH** | `changed` — `2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle` (The Ticket) |
| `add-framework--build` | done, plan (HANDS_OFF_TO), building-commands — 3; unbounded 10 | **HIGH** | none recorded |
| `add-framework--done` | build (HANDS_OFF_TO) — 1; unbounded 10 | MEDIUM | none recorded |
| `add-framework--plan` | brainstorm (HANDS_OFF_TO), build — 2; unbounded 10 | MEDIUM | none recorded |
| `add-framework--release` | sync (HANDS_OFF_TO) — 1; unbounded 12 | MEDIUM | none recorded |
| `add-framework--sync` | build (HANDS_OFF_TO) — 1; unbounded 11 | MEDIUM | none recorded |
| `add-framework--brainstorm` | none — 0 | LOW | `superseded` — `2026-09-16T170340-PLAN--the-pipeline-chains` by `2026-10-05T152826-PLAN--native-node-framework-scripts`; unrelated to this change |
| `add-framework--backlog` | none — 0 | LOW | none recorded |
| `scripts/output-mode.js`, `workbench/settings.json` | new; top-level `scripts/` and non-artefact files produce no graph node (`add-artefact-graph`, What the Graph Cannot See) | LOW | n/a |
| `AGENTS.md` | not a graph node; grepped by hand | — | n/a |

No `gone` or `superseded` entry names a prior result block or fix track. Nothing being added was tried
and dropped. The HIGH grades come from fan-in, not from the edit's size: every change to these three
skills is additive (a new section, a new row, a new clause), and the RED-first static tests below pin
that existing text is not lost.

## Scope

### Includes

#### T1 — The result block (ref: design, Part 1)

- **F1** [internal] — `scripts/output-mode.js` (new), `workbench/settings.json` (new),
  `scripts/tests/output-mode.test.cjs` (new): the resolver. Prints `OUTPUT_MODE=prose|json|both`, plus
  `OUTPUT_MODE_WARNING=<source>:<value>` when a source holds an invalid value; reads `CODEADD_OUTPUT`,
  then `output.mode` in `<root>/workbench/settings.json`, then `prose`. `<root>` defaults to
  `path.resolve(__dirname, '..')` — the worktree the script sits in — and `--root <dir>` overrides it so
  the suite runs against a temp dir. Unparseable JSON is an invalid source (`settings:unparseable`), not
  a crash. Exits 0 on every resolution; exports a pure `resolve({ env, settingsText })` for unit tests.
  Header documents usage and exit codes like the other root scripts. `settings.json` holds
  `{"output": {"mode": "prose"}}`. Must not: take any dependency, or print anything but the
  `KEY=VALUE` lines.
  - **Produces:** `OUTPUT_MODE=prose|json|both` and `OUTPUT_MODE_WARNING=<source>:<value>` on stdout of
    `node scripts/output-mode.js`
- **F2** [internal] — `workbench/skills/add-final-report/references/result-block.md` (new — the
  skill's first `references/` file; `build-workbench.js` already copies everything beside SKILL.md),
  `scripts/tests/result-block-schema.cjs` (new helper, not a `*.test.cjs`, so the runner does not pick
  it up on its own), `scripts/tests/result-block.test.cjs` (new): the schema exactly as the design's
  field table, a fenced example of each `status`, and the rules "every key always present", "`null`
  for unknown", "`needs_approval` is `true` exactly when `status` is `needs-approval`", "`reason`
  non-null when `status` is not `done`". The helper exports `validateResultBlock(text)` (finds the
  `codeadd-result` fence, parses, checks keys, types and the two cross-field rules) and `RESULT_KEYS`.
  The test validates inline valid fixtures (one per status) and invalid ones (missing key, extra key,
  `v: 2`, `needs_approval` mismatch, `reason: null` on `stopped`, wrong fence), and asserts the
  reference's field table names exactly `RESULT_KEYS` — the doc and the validator cannot drift.
  - **Produces:** `codeadd-result` block schema `v: 1`; `validateResultBlock` and `RESULT_KEYS` in
    `scripts/tests/result-block-schema.cjs`
- **F3** [internal] — `workbench/skills/add-final-report/SKILL.md`: new `## The Result Block` section
  — when the block is due (closing step and every stop), that the resolver runs once at that point
  (never at STEP 1), the mode table (`prose` / `json` / `both`), resolver failure → `prose`, a pointer
  to `references/result-block.md` for the shape, and how fields are filled (`next_step` is the
  Continuation Line verbatim, after its own `test -f` rule). **Also two clauses this analysis found
  the design did not see:** The Continuation Line's **Position** gains "in `both` mode the result block
  follows it and is the last thing printed; in `json` mode the line is not printed and travels as
  `next_step`"; and `OUTPUT_MODE_WARNING` is printed as one metadata line in `both` only — `prose`
  shows no resolver output (Global Constraints) and `json` prints only the block. The stop-rule
  sentence is stated here once, verbatim, as the text each artefact carries. Must not: change any of the
  seven blocks, the banned list or the self-check; restate the field table.
  - **Consumes:** `OUTPUT_MODE=prose|json|both` and `OUTPUT_MODE_WARNING=<source>:<value>` on stdout of
    `node scripts/output-mode.js` (F1); `codeadd-result` block schema `v: 1` (F2)
  - **Produces:** the stop-rule sentence — *"On any STOP, load `add-final-report` and run
    `node scripts/output-mode.js`; when the mode is not `prose`, emit the result block with `status`
    and `reason` set."* (The design's wording conditioned on an `OUTPUT_MODE` nothing had resolved yet
    at an early stop; this wording keeps its meaning and makes the resolver run the trigger.)
- **F4** [internal] — the `ABSOLUTE PROHIBITIONS` block of `workbench/skills/add-framework--brainstorm/SKILL.md`,
  `add-framework--plan/SKILL.md`, `add-framework--build/SKILL.md`, `add-framework--done/SKILL.md`,
  `workbench/commands/add-framework--backlog.md`, `add-framework--release.md`,
  `add-framework--sync.md`: one line each, byte-identical, placed as the first line directly after the
  `**⛔ ABSOLUTE PROHIBITIONS:**` marker (with the blank line the block already uses). All seven have
  the block (checked: lines 68, 48, 51, 48, 38, 28, 34), so the design's "directly above the closing
  step" fallback is not used. `scripts/tests/result-block.test.cjs` gains the static check: globs
  `workbench/skills/add-framework--*/SKILL.md` and `workbench/commands/add-framework--*.md` from disk,
  asserts the set is non-empty and contains the seven names, and that in each the first non-blank line
  after the marker is the sentence — adjacency, not "somewhere before the next `---`", which in done
  is 50 lines away. Deriving the set from disk is what makes a future `add-framework--*` artefact fail the
  test until it carries the line. Must not: touch anything else in those files.
  - **Consumes:** the stop-rule sentence (F3)

#### T2 — The fix track (ref: design, Part 2)

- **F5** [internal] — `workbench/skills/add-plan-authoring/SKILL.md`: File Naming gains the fix-record
  row `docs/plans/YYYY-MM-DDTHHMMSS-FIX--<slug>.md` (written only by done, never by hand) and the
  changelog lookup key `-fix-<slug>`; Argument Resolution gains a clause that `--fix <slug>` resolves
  `*-FIX--<slug>` through the design's three sources in order (index → `docs/deliveries/` → local
  record) and that a plan argument keeps matching `*PLAN--*` only — a fix record never resolves as a
  plan in build, plan or List Mode — and that when source 1 or 2 answered and no local record exists
  (a resume on a fresh clone or another worktree), the record read is the tracked
  `docs/deliveries/<id>/fix.md` on the branch; The Delivered Home gains the `fix.md` member,
  load-bearing on the fix track in place of `plan.md` + `ledger.md`, whose absence there is not a
  defect; The Ticket's
  carrier table names the fix record's `> **Ticket:**` line, written only from `--ticket`. Must not:
  change any existing row's meaning.
  - **Produces:** fix-record name `docs/plans/YYYY-MM-DDTHHMMSS-FIX--<slug>.md`; archive member `fix.md`
- **F6** [internal] — `workbench/skills/add-framework--done/SKILL.md`,
  `scripts/tests/fix-track.test.cjs` (new): Operation Mode gains `/add-framework--done --fix <slug>
  [--ticket <id>]` and one example; one statement that on the fix track "the plan" in this skill reads
  "the fix record"; 1.2 refuses `--fix` + `[plan]`, skips the derive-from-branch rule, resolves or
  writes the record (header + `## What changed`); 1.3 reads no ledger; 2.2 is replaced by the fix gate;
  2.3 writes `## Validation` after it passes; 2.4 is unavailable — report and STOP; 2.5 (resume) on the
  fix track reads the record from `docs/deliveries/<id>/fix.md` when no local copy exists, for the fix
  gate and for STEP 8's ticket read (F5's fallback); STEP 4 looks up `-fix-<slug>` and writes verb
  `fix`; 6.1 copies `fix.md` (`cmp`-proved); STEP 8 reads `> **Ticket:**` from the fix record, and the
  third removal's member list names the local fix record as the one original on the fix track; STEP 9
  names the track. **Every one of these is added as a separate `--fix` paragraph or `IF --fix` block
  beside the existing text — no existing IF block, paragraph or table row on the planned path is
  edited.** In particular 6.1 gains its own `IF --fix AND THE FIX RECORD CANNOT BE READ` stop; the
  existing plan + ledger stop stays byte-identical. The static suite asserts each of: the `--fix`
  Operation Mode line, the fix gate replacing 2.2, the `--fix` + `[plan]` refusal, the `fix.md`
  archive member, 2.4's unavailability, the resume fallback to `docs/deliveries/<id>/fix.md`, the
  STEP 8 removal of the local fix record, `--merge` still the only merge method, and that
  `add-plan-authoring` carries the `FIX--` naming row. **It also pins the planned path verbatim:**
  before F6 lands, the build copies into the test, byte for byte, the paragraphs F6 sits beside — the
  2.2 body, 1.2's Argument Resolution and derive-from-branch paragraphs, STEP 4's "Look for this
  delivery's changelog" paragraph, the 6.1 plan + ledger stop block, the STEP 8 ticket paragraph and
  the STEP 8 removal list — and asserts each is still present unchanged. Must not: change any
  behaviour of a run without `--fix`.
  - **Consumes:** fix-record name `docs/plans/YYYY-MM-DDTHHMMSS-FIX--<slug>.md`; archive member
    `fix.md` (F5)

#### T3 — Anatomy

- **F7** [internal] — `AGENTS.md`: Key files table gains `scripts/output-mode.js` (resolves the
  workbench output mode; `add-final-report` owns the contract) and `workbench/settings.json` (the
  repo's workbench config, tracked); the Internal Layer table gains the settings row. Outside the
  generated inventory block. Must not: add a count, or restate the schema or the precedence.
  - **Consumes:** `OUTPUT_MODE=prose|json|both` and `OUTPUT_MODE_WARNING=<source>:<value>` on stdout of
    `node scripts/output-mode.js` (F1) — the file it names must exist

### Does NOT Include (important!)

- Anything in 0029B: per-stage permission profiles, a needs-approval checkpoint marker, `--resume`, the
  test-loss guard. This plan only *reports* `needs-approval`
- The product-layer `add--final-report` — its divergence is deliberate
- Recovery-path (2.4) support for fixes
- A standalone `add-framework--fix` command
- Retro-indexing PR #112
- A prompt-quality audit of the touched artefacts (see Validated Decisions)

## Validated Decisions

Everything under the intent file's `## Decided` is carried as settled. The rows below are the
decisions this plan took on its own, non-interactively, where the analysis raised something the design
did not settle.

| Question | Decision | Rationale / Ref |
|---|---|---|
| Run `@prompt-review-agent` (STEP 3.4) on done and add-final-report? | **No** | No existing artefact is the subject being reviewed — the request adds a capability across seven. The user asked to keep to the design's scope, and every `❌` would become an F-block. The build's STEP 7 audits what this plan writes |
| `both` mode vs "the Continuation Line is the last line of the closing" | The block follows the Continuation Line in `both`; in `json` the line travels as `next_step` | The intent fixes `both` = report then block; The Continuation Line's Position clause is the one sentence that has to bend (F3) |
| Where `OUTPUT_MODE_WARNING` is shown | One metadata line in `both` only | `prose` must show no resolver output; `json` must print only the block |
| How the resolver finds `workbench/settings.json` | `path.resolve(__dirname, '..')`, overridable by `--root` | Same worktree as the script, whatever the cwd; `--root` lets the suite use a temp dir, so tests never write in the checkout |
| Malformed `settings.json` | Invalid source, warning `settings:unparseable`, fall to `prose`, exit 0 | The design's rule for an invalid value, extended to an unreadable file; the fall is toward today's behaviour |
| Where the schema validator lives | `scripts/tests/result-block-schema.cjs`, a helper module | The test and the L4 manual check share one validator; no new shipped script |
| How the stop-rule test finds the artefacts | Glob from disk, not a hardcoded list | Mitigates "stop-rule line missed in a future command" (design, Risks) |
| How a run of done without `--fix` stays unchanged | Every fix-track change is a branch keyed to `--fix`; existing text on the planned path is left as written | Ticket `done_when`: "existing plans close out exactly as before" |
| The design's "one documented manual close-out of a real fix branch, recorded in the build ledger" | **Split.** The build runs the two runtime refusals that write nothing (L4.2). The full close-out is **deferred to the first real fix after merge** and recorded in the ledger as pending, with 0028B's `done_when` noted as only partly proven. **This is the one decision the user must confirm before `/add-framework--build`** — `delivery: confirm` gives that moment | No unmerged fix branch exists (`git branch -r --no-merged origin/main` → `production` only), and the fix track's 2.3 opens a PR and STEP 7 merges to `main` — inventing a fix to merge is scope this plan does not have |
| The stop-rule sentence's wording | Run the resolver inside the sentence instead of conditioning on `OUTPUT_MODE` | At an early stop nothing has resolved the mode yet (plan review, A3) |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A parseable outcome for agent callers | A second output contract to keep in step with the report |
| Plan-less fixes reach the index and archive | done branches at nine points on `--fix` |
| One owner for schema and emission | Seven artefacts each carry one pointer line |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| An agent emits a malformed or partial block | Med | F2's validator and fixtures; L4 runs a real stage in `json` mode through the same validator |
| Stop-rule line missed in a future command | Med | F4's disk-derived static check fails on any `add-framework--*` artefact without it |
| A planned close-out changes behaviour | Low | F6 is keyed to `--fix`; L2 asserts the planned-path gate 2.2 text and plan + ledger stop are still present |
| `--fix` on a change with no nameable behaviour is refused at STEP 3 (`REFUSED=no-items`, `delivery-index-core.cjs:325`) | Med | Existing rule already reports and STOPs on a refusal; F6's STEP 9 names the track so the cause is readable. Proven or disproven by the deferred first real `--fix` close-out |
| Fix-track runtime never exercised before the ticket reads `done` | Med | Ledger records the deferred validation; the build's report lists it under ⚠️; the first real fix closes it |
| Duplicate fix entries on re-run | Low | F5/F6 three-source resolution before allocation; 2.1 resume row |
| Resolver shell-out blocked | Med | Resolver failure → `prose` (F3); permission profiles are 0029B |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `scripts/output-mode.js` | internal | create | F1 |
| `workbench/settings.json` | internal | create | F1 |
| `scripts/tests/output-mode.test.cjs` | internal | create | F1 |
| `workbench/skills/add-final-report/references/result-block.md` | internal | create | F2 |
| `scripts/tests/result-block-schema.cjs` | internal | create | F2 |
| `scripts/tests/result-block.test.cjs` | internal | create (F2), modify (F4) | F2, F4 |
| `workbench/skills/add-final-report/SKILL.md` | internal | modify | F3 |
| `workbench/skills/add-framework--brainstorm/SKILL.md` | internal | modify | F4 |
| `workbench/skills/add-framework--plan/SKILL.md` | internal | modify | F4 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F4 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F4, F6 |
| `workbench/commands/add-framework--backlog.md` | internal | modify | F4 |
| `workbench/commands/add-framework--release.md` | internal | modify | F4 |
| `workbench/commands/add-framework--sync.md` | internal | modify | F4 |
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F5 |
| `scripts/tests/fix-track.test.cjs` | internal | create | F6 |
| `AGENTS.md` | internal | modify | F7 |

`workbench/provider-map.json` needs no change: `add-final-report` is already registered and
`build-workbench.js` copies every file beside `SKILL.md`.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN. Every suite runs through `node scripts/run-tests.js scripts`
(container), never natively.

### L1 — Resolver and schema (RED → GREEN)

1. `output-mode.test.cjs`: no env, no file → `OUTPUT_MODE=prose`; file `json` → `json`; env `both`
   over file `json` → `both`; env `xml` + file `json` → `json` plus `OUTPUT_MODE_WARNING=env:xml`; both
   invalid → `prose` plus two warnings; unparseable file → `prose` plus `settings:unparseable`; file
   without `output.mode` → `prose`, no warning; stdout carries only `KEY=VALUE` lines; exit 0 in every
   case; the tracked `workbench/settings.json` resolves to `prose`. *RED today: the script does not
   exist.* (F1)
2. `result-block.test.cjs` schema group: every valid fixture passes `validateResultBlock`; every
   invalid fixture fails with a named reason; the reference's field table names exactly `RESULT_KEYS`.
   *RED today: neither the helper nor the reference exists.* (F2)
3. `result-block.test.cjs`: `add-final-report/SKILL.md` has a `## The Result Block` section naming
   `scripts/output-mode.js`, `references/result-block.md` and the three modes, and its Continuation
   Line Position names the `both` order. *RED today: no such section.* (F3)

### L2 — Static artefact checks (RED → GREEN)

1. `result-block.test.cjs` stop-rule group: the disk-derived `add-framework--*` set contains the seven
   names and each carries the sentence inside its `ABSOLUTE PROHIBITIONS` block. *RED today: no file
   carries it.* (F4)
2. `fix-track.test.cjs`: the six done assertions and the `add-plan-authoring` `FIX--` row listed in
   F6, plus `fix.md` named in The Delivered Home (F5). **And the planned path is intact:** done still
   carries the 2.2 ledger gate heading, the Argument Resolution load in 1.2 and the "IF THE PLAN OR
   THE LEDGER CANNOT BE READ" stop. *RED today: every fix-track assertion fails; the intact-path
   assertions pass and must stay green.* (F5, F6)
3. `AGENTS.md` names `scripts/output-mode.js` and `workbench/settings.json` — grepped by the build, not
   a test (AGENTS.md is not a node). (F7)

### L3 — Build gates

1. `node scripts/build-workbench.js` exits 0 and `.claude/skills/add-final-report/references/result-block.md`
   exists afterwards. (F2, F3)
2. `node scripts/build.js` exits 0 with no new warning; `node scripts/graph.js impact add-final-report --depth 1`
   still lists the same 9 callers. (F3–F6)
3. `node scripts/run-tests.js framework` passes in full — the existing `test-entrypoints.test.cjs`
   reads done's text and must stay green. (all)

### L4 — Behavioural acceptance

1. **Result block, real run, through a STOP:** run `/add-framework--backlog update 9999B` under
   `claude -p` with `CODEADD_OUTPUT=json`. The id does not exist, so the command lists the open tickets
   and STOPs without writing (its STEP 2 "names a ticket that does not exist" rule). The captured output
   is one `codeadd-result` block and nothing else, with `status: "stopped"` and a non-null `reason`, and
   it passes `validateResultBlock`. Run it again with the variable unset and confirm no block is
   printed. Recorded in the ledger. This exercises the stop-rule line, not only the closing step. (F1–F4)
2. **Fix track, runtime refusals (run in the build):** after `node scripts/build-workbench.js`, run
   under `claude -p` (a) `/add-framework--done --fix l4-probe agent-friendly-workbench` on the feature
   branch → refused for `--fix` + `[plan]` before anything is written; (b) `/add-framework--done --fix
   l4-probe` on `main` → refused by 1.2. After each, `git status --short` is unchanged and no
   `docs/plans/*-FIX--l4-probe.md` exists. Recorded in the ledger. (F6)
3. **Fix track, full close-out — deferred** (Validated Decisions): the first real fix branch after this
   merges closes with `/add-framework--done --fix <slug>`, producing an index entry with
   `id` ending `-FIX--<slug>`, `docs/deliveries/<id>/fix.md` and a `-fix-<slug>` changelog. The build
   records it in the ledger as pending, with its reason, and lists it under ⚠️ in its report. (F5, F6)

**RED expectations against the current tree:** L1.1–L1.3, L2.1 and the fix-track half of L2.2 fail.
**GREEN = all levels pass after F1–F7, with L4.3 recorded as pending.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7, all `[internal]`.

- **F1 before F3** because F3 points at the resolver's output lines.
- **F2 before F3** because F3 points at the reference and must not restate it.
- **F3 before F4** because F4 copies the sentence F3 fixes.
- **F4 before F6** because both edit done; F4's one line lands first so F6's diff is the fix track only.
- **F5 before F6** because done points at the naming and archive rules F5 writes.
- **F7 last** — it names files that must already exist.

Working-state boundaries: after **F1**, **F4** and **F6** the repository is consistent and the build
may stop. After F3 alone, `add-final-report` describes a rule no artefact points at yet — harmless,
but not a delivery.

Beyond the layer default, run `node scripts/build-workbench.js` after F3 and after F6 so the built
copies the running session reads are current.

## Reviewer Handoff

For each F-block the build must leave, in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. A run of done **without** `--fix` that reads differently after F6 than before — compare the planned-path text, not only the new clauses.
3. `prose` mode printing anything new — the resolver warning, a stray `OUTPUT_MODE=` line, or the block.
4. The field table copied into `add-final-report/SKILL.md` or into any of the seven artefacts.
5. L4.3 silently dropped instead of recorded as pending.
6. In `json` mode an invalid `CODEADD_OUTPUT` warning is never shown — by decision, but a caller who
   mistyped the value gets `prose`-shaped silence. Check F3 says so in one line.

## References

- Prior art: `2026-10-07T144204-PLAN--next-step-command-carries-path` — The Continuation Line, which
  F3 extends; `2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle` — The Ticket,
  which F5 extends.

---

## Next Steps

/add-framework--build docs/plans/2026-10-07T192430-PLAN--agent-friendly-workbench.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-07 | Initial creation |
| 2026-10-07 | Review `fix-then-ok` applied: resume fallback to `docs/deliveries/<id>/fix.md` (F5, F6); fix-track changes as separate blocks with the planned path pinned verbatim in the test (F6); stop-rule sentence runs the resolver itself (F3, F4); adjacency check for the stop-rule line (F4); STEP 8 removal list and 2.5 added to F6; L4.2 runtime refusals added, full close-out kept deferred and flagged for the user; F7 Consumes; json-mode warning noted |
| 2026-10-07 | Implemented in commits d29ec08..6fef6ca on feat/agent-friendly-workbench (changelog 2026-10-07T200810-add-agent-friendly-workbench) |

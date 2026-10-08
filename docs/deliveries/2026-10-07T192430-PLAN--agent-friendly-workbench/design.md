# Brainstorm: Agent-friendly workbench — result block and plan-less fix track

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-07
> **Type:** workflow
> **Ticket:** 0028B

## Objective

An agent driving the workbench through `claude -p` can read every `add-framework--*` run's outcome
from one documented, versioned JSON block instead of parsing free text — opt-in, with the current
report untouched by default — and a small fix that never had a brainstorm or a plan closes out through
`/add-framework--done` with the same changelog, index entry, archive, ticket write and `--merge` a
planned delivery gets.

## Discovery

- `add-final-report` (`workbench/skills/add-final-report/SKILL.md`) — owns the closing message of every
  finishing command: seven blocks, then command-specific facts, then metadata ending in the
  Continuation Line. Text search finds it loaded by all seven `add-framework--*` commands (brainstorm,
  plan, build, done, backlog, release, sync). It is the single place the result block can live.
- `add-framework--done` — requires a plan at five points: STEP 1.2 resolves `[plan]` (`:124-132`),
  gate 2.2 needs a `complete` ledger line per F-block (`:185-193`), STEP 3 uses the plan basename as
  the index `id` (`:361`), STEP 6.1 archives plan + ledger and stops when either is unreadable
  (`:424-454`), STEP 8 reads `> **Ticket:**` from the plan header (`:509-516`).
- `add-plan-authoring` — owns File Naming, Argument Resolution, The Delivered Home and The Ticket. All
  four assume a plan; the fix track adds one row or clause to each, it does not fork them.
- `add--doc-schemas/references/delivery-index.md:41` — the internal `id` is "the plan file's basename
  without extension, verbatim". `delivered.cjs` does not validate an id pattern (no `PLAN--` check), so
  a fix-record basename is accepted with no script change.
- PR #112 (`fix/test-transport-tar`, 2026-10-07) — the motivating case: a test-runner fix that had to
  bypass `/add-framework--done` because no plan existed.
- No workbench config file exists today. `workbench/provider-map.json` is a registry, and
  `.claude/settings.json` / `.codex/config.toml` are provider settings.
- Delivery-index `history` lookup: NOT VERIFIED — the artefact-graph MCP was denied by permission in
  this session, and so was shelling out to `node`.

## Context & Motivation

The workbench is now run by agents as well as people. A `claude -p` caller gets a report written for a
human reader — seven blocks of plain text — and has to guess status, PR number and next step from it.
Separately, small fixes keep happening outside the pipeline (PR #112), and the only close-out that
writes the index, changelog and archive refuses them because it requires a plan. Both gaps make the
record incomplete or unreadable to the caller that most needs it.

## Problem / Opportunity

1. No machine-readable outcome. Status, branch, commits, tests, PR, CI and the next step exist only
   inside text written for a person.
2. A plan-less fix has no supported close-out. It either skips the index and archive, or someone
   writes a fake plan and ledger to pass gate 2.2.

## Proposed Solution

### Part 1 — The result block

**Where it lives.** A new section `## The Result Block` in `add-final-report`, plus the schema in
`add-final-report/references/result-block.md`. No command restates the schema.

**How the mode is chosen.** A small resolver, `scripts/output-mode.js`, prints one line
`OUTPUT_MODE=prose|json|both`. It reads, in order:

1. Env var `CODEADD_OUTPUT` — per run. Wins when set to a valid value.
2. `output.mode` in `workbench/settings.json` — the repo default. A new tracked JSON file; absent file
   or absent key means `prose`.
3. Default `prose`.

An invalid value at either source is ignored, with a second line `OUTPUT_MODE_WARNING=<source>:<value>`,
and the next source is read. JSON, not YAML: the repository root takes no dependency. When the
resolver cannot run (denied, missing, non-zero exit), the mode is `prose` — the fall is always toward
today's behaviour.

**What each mode prints.**

| Mode | Closing message |
|---|---|
| `prose` (default) | Exactly today's report. No resolver output is shown and nothing else changes |
| `json` | Only the fenced result block. The seven blocks and metadata are not printed |
| `both` | Today's report in full, then the fenced result block as the very last thing |

**The block.** One fenced code block with info string `codeadd-result`, holding one JSON object:

| Field | Type | Meaning |
|---|---|---|
| `v` | int | Schema version, starts at `1`. A breaking change bumps it |
| `status` | `done` \| `stopped` \| `needs-approval` \| `failed` | `stopped` = a gate or hard stop ended the run on purpose; `failed` = an error the command did not plan for; `needs-approval` = the run is waiting on the user |
| `stage` | string | The command name, e.g. `add-framework--build` |
| `branch` | string \| null | Current branch |
| `commits` | string[] | Short SHAs this run created, in order. `[]` when none |
| `tests` | `{before, after}` \| null | Each `{passed, failed, skipped}` counts, or `null` per side when that run did not happen |
| `pr` | `{number, url}` \| null | |
| `ci` | `success` \| `failure` \| `pending` \| `none` \| null | The required-checks state on the head SHA, when the command read it |
| `ticket` | `{id, status, sha, pushed}` \| null | The last board write this run made; `sha: null, pushed: false` when it degraded |
| `next_step` | string \| null | The Continuation Line verbatim, or `null` when the command prints none |
| `needs_approval` | bool | `true` exactly when `status` is `needs-approval` |
| `reason` | string \| null | Required when `status` is not `done`: the gate, stop or question, in one line |

Every key is always present; unknown data is `null`, never an omitted key — an absent key and a null
one must not mean two things to a parser.

**When it is emitted.** At every terminal point of a command, not only its closing step:

- The closing step — `add-final-report` is already loaded there.
- Every `STOP` that ends the run early — a failed gate, a hard stop, a refused merge — and every stop
  that waits on the user. Each of the seven commands gains **one line** in its prohibitions block:
  *"On any STOP, when `OUTPUT_MODE` is not `prose`, load `add-final-report` and emit the result block
  with `status` and `reason` set."* The rule and the shape stay in the one shared place.
  **Where the line goes:** in the file's `ABSOLUTE PROHIBITIONS` block; in a file with no such block
  (check `add-framework--release` and `add-framework--sync` in `workbench/commands/`), directly above its
  closing step.

The resolver runs once, at the point the block is due. It is not run at STEP 1. It is called as
`node scripts/output-mode.js` from the repository root — in a worktree, that worktree's root, which
carries its own `scripts/` and `workbench/settings.json`. `.js`, like the other top-level scripts
(`build.js`, `graph.js`, `inventory.js`); the root is CommonJS.

### Part 2 — The fix track

**Invocation.** `/add-framework--done --fix <slug> [--ticket <id>]`. Without `--fix`, done behaves
exactly as today — including stopping when no plan resolves. With a `[plan]` argument and no flag,
nothing changes. `--fix` together with a `[plan]` argument is refused: one run closes one kind of work.

**The fix record.** `docs/plans/YYYY-MM-DDTHHMMSS-FIX--<slug>.md`, gitignored like a plan, generated by
done. Header lines: `> **Kind:** fix`, `> **Branch:**`, `> **PR:**`, and `> **Ticket:** <id>` only when
`--ticket` was passed (the ticket rule forbids inferring one). Two sections:

- `## What changed` — the branch's commits (`git log --oneline main..HEAD`) and diff
  (`git diff --name-status main...HEAD`), with one sentence per commit drawn from its message.
- `## Validation` — the CI run that gate 2.3 accepted: head SHA, run URL, each required check and its
  conclusion; or the local fallback and why.

It is written in two moves: STEP 1.2 writes the header and `## What changed`; gate 2.3 fills
`## Validation` after it passes. It is never hand-written and never edited after STEP 6.1 copies it.

**Resolving the record (resume-safe).** STEP 1.2 looks for an existing `id` ending in `-FIX--<slug>`,
in this order, and stops at the first source that answers:

1. `docs/delivered.jsonl` on the current branch — tracked, so it survives a fresh clone or another
   worktree.
2. `docs/deliveries/*-FIX--<slug>/` on the current branch — tracked, same reason.
3. `docs/plans/*-FIX--<slug>.md` — the local, gitignored record.

One match → reuse that `id` (and the local record when source 3 has it). None anywhere → allocate a
timestamp from the clock and write the record. More than one → STOP and list them. On a resume, 2.1's
row skips STEPs 3, 4 and 6, so a missing local record is not needed — only the `id` is.

With `--fix`, STEP 1.2's "no `[plan]` given → derive it from the branch name and confirm" rule does not
run. Operation Mode gains the `--fix <slug> [--ticket <id>]` line and one example.

**Changelog lookup.** STEP 4's "find this delivery's changelog first" keys on `-fix-<slug>` in
`docs/changelog/` on the fix track, since there is no plan slug.

**Ticket.** The Ticket's rules apply unchanged to the fix record's `> **Ticket:**` line: the id is used
only when declared, is read with `get <id>` first, and every degradation in that section is a reported
line, never a stop. The fix record is the carrier the plan header is on a planned delivery.

**Step by step, on the fix track:**

| Step | Fix track |
|---|---|
| 1.2 | Resolve or create the fix record. Still refuses to run on `main` |
| 1.3 | Diff and log unchanged. No ledger is read |
| 2.1 | Unchanged, keyed to the fix record's basename. Normal and resume rows apply |
| 2.2 | **Replaced** by the fix gate: the record has a non-empty `## What changed`, and the branch has at least one commit. There is no ledger to require |
| 2.3 | Unchanged — CI on the head SHA is the fix's real validation. Then `## Validation` is written |
| 2.4 | **Unavailable.** Recovery runs on `main` after the merge; a fix with no record and no branch has no evidence beyond the merge itself. Report and STOP |
| 3 | Unchanged. `id` = fix record basename, `by: "done"`, `origin: docs/deliveries/<id>/` |
| 4 | Unchanged. Normally no build wrote a changelog, so done writes it, verb `fix` |
| 6.1 | Archive holds `fix.md` (byte copy, `cmp`-proved). It replaces `plan.md` + `ledger.md` as the one load-bearing member; their absence is not a defect here |
| 7 | Unchanged. `gh pr merge --merge` |
| 8 | Ticket `done` write read from the fix record's `> **Ticket:**`. Third removal deletes the local fix record |
| 9 | The report names the track: `fix` |

**Why a flag on done and not a new command.** The fix track reuses every step from 2.3 to 9 unchanged;
only 1.2, 2.2 and 6.1 differ. A new `add-framework--fix` would duplicate the gates, the resume table and
the cleanup, and the two copies would drift — the same reason `add-plan-authoring` keeps one owner per
rule.

## Type of Artefact

workflow — changes to five existing internal artefacts, one new reference doc, one new script and one
new config file. All internal layer.

## Scope

### Includes
- `## The Result Block` in `add-final-report`; schema in `add-final-report/references/result-block.md`
  (a new `references/` directory — the skill has none today)
- `scripts/output-mode.js` resolver and its native test suite
- `workbench/settings.json` with `{"output": {"mode": "prose"}}`
- One stop-rule line in each of the seven `add-framework--*` artefacts
- `--fix <slug> [--ticket <id>]` on `add-framework--done`: STEP 1.2, 2.2, 2.4, 6.1, 8, 9 and Operation Mode
- `add-plan-authoring`: a fix-record row in File Naming, the `fix.md` member in The Delivered Home,
  `FIX--` in Argument Resolution, and the fix record as a ticket carrier in The Ticket
- Tests: resolver precedence and invalid values; a schema check over valid and invalid fixture blocks;
  a static check that all seven artefacts carry the stop-rule line; a static suite
  `scripts/tests/fix-track.test.cjs` checking that `add-framework--done` carries the `--fix` Operation
  Mode line, the fix gate replacing 2.2, the `--fix` + `[plan]` refusal and the `fix.md` archive member,
  and that `add-plan-authoring` carries the `FIX--` naming row. done is a skill, so its runtime path
  is proved by one documented manual close-out of a real fix branch, recorded in the build ledger

### Does NOT Include
- Anything in 0029B: per-stage permission profiles, the needs-approval checkpoint marker with
  `--resume`, the test-loss guard. This design only *reports* `needs-approval`; it adds no marker and no
  resume mechanism
- The product-layer `add--final-report` sibling — its divergence is deliberate
- Recovery-path (2.4) support for fixes
- A standalone `add-framework--fix` command
- Retro-indexing PR #112

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Result block is opt-in; default `prose` changes nothing | "current report untouched by default" | Given by the user; humans remain the main readers | ✅ |
| `CODEADD_OUTPUT` env wins over `output.mode` in the repo | "an agent driving `claude -p` can read" | A caller sets the env per run without editing a tracked file | ✅ |
| `json` prints only the block; `both` prints the report then the block | "read … instead of parsing free text" | A parser in `json` mode must not have to skip text; `both` order given by the user | ✅ |
| Schema and emission rule live only in `add-final-report` | "one documented, versioned JSON block" | Given by the user; one owner stops seven copies drifting | ✅ |
| Every key always present, `null` for unknown | "one documented, versioned" block | Absent and null meaning two things breaks parsers | ✅ |
| `v: 1` field, info string `codeadd-result` | "versioned" | Lets a caller find the block by fence and reject an unknown version | ✅ |
| Block is also emitted at early stops, via one line per command | "every run's outcome" | A run that stopped at a gate is exactly the one an agent must detect; one pointer line keeps the rule shared | ✅ |
| Mode resolved by `scripts/output-mode.js`, not by the agent reading env and file itself | "documented … block", testable | Precedence becomes testable and identical across providers | ✅ |
| Repo key lives in a new `workbench/settings.json` (JSON) | "opt-in" repo default | No config file exists; JSON keeps the root dependency-free | ✅ |
| Fix track is a `--fix` flag on done, not a new command | "closes out through `/add-framework--done`" | Steps 2.3–9 are reused unchanged; a second command duplicates them | ✅ |
| Fix record generated by done from git and CI facts, never hand-written | "same changelog, index entry, archive" | The archive copies a document; generating it from facts keeps it evidence, not recollection | ✅ |
| Fix record resolved by slug — index, then archive, then local file — before a new one is allocated | "same … index entry" (no duplicates) | The tracked sources survive a fresh clone; a second timestamp would write a second entry | ✅ |
| Gate 2.2 replaced by a fix gate; 2.3 CI stays the validation | "same … a planned delivery gets" | There is no ledger; CI on the head SHA is the real proof for a fix | ✅ |
| Recovery path 2.4 unavailable for fixes | none — a scope limit | Keeps the first version small; recovery needs evidence a merged fix lacks | ✅ |
| Ticket only via explicit `--ticket` | "ticket write" | The Ticket forbids inferring an id | ✅ |
| `--merge` kept | "`--merge` a planned delivery gets" | Given by the user | ✅ |

## Ecosystem Impact

| Component | Layer | Called by | Impact | Action |
|---|---|---|---|---|
| `add-final-report` | internal | NOT VERIFIED — graph route denied by permission this session | Gains the result-block section and its reference | Add section + `references/result-block.md` |
| `add-framework--done` | internal | NOT VERIFIED — graph route denied | Gains `--fix`; STEP 1.2, 2.2, 2.4, 6.1, 8, 9 branch on it | Edit; plus one stop-rule line |
| `add-plan-authoring` | internal | NOT VERIFIED — graph route denied | File Naming, Argument Resolution, Delivered Home, The Ticket each gain a fix clause | Edit |
| `add-framework--build` | internal | NOT VERIFIED — graph route denied | One stop-rule line | Edit |
| `add-framework--plan` | internal | NOT VERIFIED — graph route denied | One stop-rule line | Edit |
| `add-framework--brainstorm` | internal | NOT VERIFIED — graph route denied | One stop-rule line | Edit |
| `add-framework--backlog`, `add-framework--release`, `add-framework--sync` (commands) | internal | NOT VERIFIED — graph route denied | One stop-rule line each | Edit |
| `scripts/output-mode.js` | internal | none — new | New resolver. Top-level `scripts/` produce no graph node | Create + `scripts/tests/output-mode.test.cjs` |
| `workbench/settings.json` | internal | none — new | New repo config. Not an artefact, no graph node | Create |
| `delivered.cjs` | product | NOT VERIFIED — graph route denied | None: no id-pattern check exists | none |
| `AGENTS.md` | internal | not a graph node | Mentions the workbench key files | Add `workbench/settings.json` and the resolver to the anatomy; grep by hand |

Text search (not graph edges) finds `add-final-report` named in all seven commands, `prompt-review-agent`,
`building-commands`, `add-plan-authoring` and its plan template. The planner must re-ask the graph with
permission before grading risk.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A parseable outcome for agent callers | A second output contract to keep in step with the report |
| Plan-less fixes reach the index and archive | done gains a branch at three steps |
| One owner for schema and emission | Seven commands each carry one pointer line |

| Risk | Probability | Mitigation |
|---|---|---|
| An agent emits a malformed or partial block | Med | Schema check in tests over fixtures; every key required; info string fixed |
| Stop-rule line missed in a future command | Med | Static test fails when an `add-framework--*` artefact lacks the line |
| `--fix` used for work that needed a plan | Low | Flag is explicit and opt-in; the report names the track |
| Duplicate fix entries on re-run | Low | Fix record resolved by slug before allocation; 2.1 resume row |
| Resolver shell-out blocked by a permission profile | Med | Out of scope here (0029B); a blocked resolver falls back to `prose`, never to `json` |

## Next Steps

Run: `/add-framework--plan docs/brainstorming/2026-10-07T190913-agent-friendly-workbench-intent.md`

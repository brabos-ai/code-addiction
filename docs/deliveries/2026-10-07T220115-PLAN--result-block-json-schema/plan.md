# Plan: Result block via CLI `--json-schema` — remove the prompt-driven output mode

> **Status:** implemented
> **Layers:** internal
> **Type:** cross-cutting
> **Created:** 2026-10-07
> **Delivery:** confirm
> **Ticket:** 0030B

---

## Objective

[from conversation, no design document — drawn from ticket 0030B's `tldr` and `notes`]
Headless callers get structured results from Claude Code's `--json-schema`; the 0028B output-mode
machinery is removed from prompts, so no `add-framework--*` artefact carries JSON instructions.

**When this build is done:** the resolver, its setting and its stop line are gone from every prompt;
`add-final-report` is back to its last-step load rule; one JSON Schema file is the only contract for the
v1 result fields, a test checks it and derives the validator from it, and a short doc says how a caller
passes it to `claude -p`.

**Ticket done when:** No prompt, skill or command mentions CODEADD_OUTPUT, output-mode.js or codeadd-result fences; the schema file exists and a test checks it is valid JSON Schema matching the documented fields; the full suite is green with no unrelated test removed; one headless smoke run of /add-framework--backlog update 9999B with --json-schema returns an object that validates; the changelog notes the 0028B output mode was removed before release.

## Context

0028B (PR #113, merged as f9d2c6b) added an opt-in result block: `scripts/output-mode.js` resolves a
mode from `CODEADD_OUTPUT` or `workbench/settings.json`, and a stop line in seven artefacts tells the
agent to run it and print a fenced `codeadd-result` block. Two problems: every prompt carries the
instruction, and the 0028B L4 runs showed a prose-mode STOP can skip the resolver. Claude Code 2.1.292
already does this at the CLI: `-p --output-format json --json-schema '<schema text>'` makes stdout the
validated object (verified outside the repo, ticket notes). That part of 0028B is unreleased (latest
tag v1.3.2), so removing it breaks no consumer.

No design document and no intent file. **The ticket's `notes` and `done_when` are the approved
decisions**, per the invocation; this plan does not re-derive them.

## Global Constraints

- Keep: the --fix track and --ticket unchanged, add-final-report's prose report, and default prose output for humans. (ticket 0030B, notes)
- A file path is not accepted (`--json-schema is not valid JSON`). (ticket 0030B, notes)
- On PowerShell 5.1 the schema's double quotes must be escaped (`-replace '"','\"'`) when passed to the native exe. (ticket 0030B, notes)
- the full suite is green with no unrelated test removed (ticket 0030B, done_when)
- Edit `workbench/`, never the built `.claude/` copy, then run the workbench build (AGENTS.md, Internal Layer)
- `mcp/` and `scripts/tests/` code takes no new dependency — the root `package.json` has none (AGENTS.md; root `package.json`)

## Problem

1. **Every stage prompt carries output plumbing** — one stop line in seven artefacts, four
   `(before the result block, in both mode)` asides, a section in `add-final-report` and a STOP-time
   load exception in two skills. All of it exists only to print JSON a CLI flag already produces.
2. **The prompt route is unreliable** — a prose-mode STOP can skip the resolver (0028B L4 runs).
3. **The contract lives in a markdown table** a caller cannot pass to the CLI.

## Proposal

Remove first, then add. The removal goes in three F-blocks, each with the test edit that keeps the
suite green at its own boundary. Then the schema file with a validator derived from it, then the call
doc. The headless smoke run is **not** part of the build — the user runs it after the build, before
`/add-framework--done`.

## Scope

### Includes

- **F1** [internal] — the seven stage artefacts: `workbench/skills/add-framework--{brainstorm,plan,build,done}/SKILL.md`
  and `workbench/commands/add-framework--{backlog,release,sync}.md`. Delete the stop-rule line under
  `**⛔ ABSOLUTE PROHIBITIONS:**` in each. Delete the aside `(before the result block, in `both` mode)`
  — and the variant at plan SKILL.md:429 — wherever it appears (brainstorm :811, build :670, plan :429
  and :516), leaving each sentence grammatical. Must NOT touch the --fix track, `--ticket`, or any
  other line of the prohibitions block.
  `scripts/tests/result-block.test.cjs`: delete the test `every add-framework--* artefact carries the
  stop-rule line…` only — the `STOP_RULE` constant stays, because `add-final-report owns the emission rule…` still reads it until F2; add a test that no stage artefact contains
  `output-mode`, `result block` or `both` mode wording from 0028B (needles: `output-mode.js`,
  `result block`, `` `both` mode ``). Keep `no add-framework--* artefact restates the field table`.
- **F2** [internal] — `workbench/skills/add-final-report/SKILL.md` and `workbench/skills/building-commands/SKILL.md`.
  - `add-final-report`: restore the `description:` and the load guard to their form before 0028B
    (`git show 9e1bb79:workbench/skills/add-final-report/SKILL.md` — "Load at the last step, not at the
    first." and the `IF THE COMMAND IS NOT AT ITS CLOSING STEP` guard, both verbatim from 9e1bb79; the
    current `STILL WORKING` wording goes). Nothing else needs the
    STOP-time load once the result block is gone, so the ticket's condition holds. Delete
    `## The Result Block` whole. Delete the `both`/`json` sentence from **Position**. Add, in its place
    under the Continuation Line rules, a two-sentence pointer: no command prints a result block; a
    headless caller gets one from Claude Code's `--json-schema`, and `references/result-block.md` says
    how. Keep the `uses:` entry for `references/result-block.md` — the pointer is what justifies it.
  - `building-commands`: revert the three 05cf532 hunks (SKILL.md around :316–319 and the table row
    around :664) to their 9e1bb79 text.
  - `result-block.test.cjs`: delete `add-final-report states the prose-mode stop…`,
    `add-final-report owns the emission rule…` and `add-final-report never forbids an early load…`, and the `STOP_RULE` constant with them; add
    one test that the description contains `Load at the last step, not at the first.`, the guard
    contains no `early exit`, the skill has no `## The Result Block` heading, and `building-commands`
    contains no `any STOP or early exit`.
- **F3** [internal] — the resolver and its configuration.
  - Delete `scripts/output-mode.js` and `scripts/tests/output-mode.test.cjs`.
  - Delete `workbench/settings.json`: its only key is `output.mode` and `scripts/output-mode.js` is its
    only reader (grep of `scripts/`, `workbench/`, `cli/src`, `mcp/`, `board/server.mjs`).
  - `.claude/settings.json`: remove `"Bash(node scripts/output-mode.js)"` from `permissions.allow`;
    every other entry stays byte-identical.
  - `AGENTS.md`: remove the **Settings** row from the workbench table and the `scripts/output-mode.js`
    and `workbench/settings.json` rows from **Key files**. The `add-final-report` mention in
    **Where the details live** ("How a command closes its final report") stays.
  - `result-block.test.cjs`: delete `headless callers are told to allow the resolver…`; add a test
    that `scripts/output-mode.js` and `workbench/settings.json` do not exist and no `permissions.allow`
    entry in `.claude/settings.json` contains `output-mode`.
- **F4** [internal] — `workbench/skills/add-final-report/references/result-block.schema.json` (create)
  and `scripts/tests/result-block-schema.cjs` (rewrite).
  - The schema: draft 2020-12, one object, `additionalProperties: false`, all twelve v1 keys in
    `required` and `properties`, `$schema` exactly `https://json-schema.org/draft/2020-12/schema`, `title`
    required ("codeadd result v1"), (`v`, `status`, `stage`, `branch`, `commits`, `tests`, `pr`, `ci`,
    `ticket`, `next_step`, `needs_approval`, `reason`), same types and enums as today's
    `result-block.md` table, nested objects closed the same way. **Every property carries a
    `description`**; the four status meanings live in the `status` description, and the two
    cross-field rules (`needs_approval` true exactly when `status` is `needs-approval`; `reason`
    non-empty when `status` is not `done`) in the root `description`. Use only `$schema`, `title`,
    `description`, `type` (string or array form for nullable), `enum`, `const`, `properties`,
    `required`, `additionalProperties`, `items` — no `if`/`then`, no numeric bounds, so the CLI is
    least likely to reject it.
  - `result-block-schema.cjs`: loads the schema file. Exports `SCHEMA`, `RESULT_KEYS` (from
    `SCHEMA.required`), `STATUSES` (from the `status` enum), `checkSchema(schema)` — a structural check
    that it is valid JSON Schema within that keyword set (known `$schema` URI, only listed keywords,
    valid type names, `required` ⊆ `properties`, non-empty `enum`s, every property described) — and
    `validateResultBlock(text)`, which now takes the raw stdout JSON, parses it, walks the schema, then
    applies the rules the schema states only in `description`: the two cross-field rules, and that the
    `tests` counts and `pr.number` are integers `>= 0` (today's `isInt`; kept, not dropped, so no invalid
    fixture changes meaning). Those three rules are the only checks the walker carries outside the
    schema; the key list, types and enums come from the file. No fence handling, no dependency.
  - `result-block.test.cjs`: rewrite the fixture tests on raw JSON (drop the three fence cases), assert
    `checkSchema(SCHEMA)` passes, assert `RESULT_KEYS` equals the twelve keys listed above in order,
    and assert `checkSchema` fails on a broken schema (unknown keyword, `required` naming a missing
    property). Delete `the reference field table names exactly RESULT_KEYS` and `the reference carries
    one valid example per status` — F5 replaces what they guarded.
  - **Produces:** `result-block.schema.json`, and `validateResultBlock(text)` over raw JSON
- **F5** [internal] — `workbench/skills/add-final-report/references/result-block.md` (rewrite as the
  call doc) and the final tests.
  - The doc says: the schema file is the contract and this doc does not restate its fields; how to
    call — `claude -p "<prompt>" --output-format json --json-schema "<file content>"`, stdout is the
    object itself; a path is not accepted; the PS 5.1 escape; one bash and one PowerShell example
    reading the file from `workbench/skills/add-final-report/references/`; and that
    `node -e` with `require('./scripts/tests/result-block-schema.cjs')` validates a captured stdout.
    No `Headless callers` section, no `codeadd-result` fence, no `output-mode`.
  - `result-block.test.cjs`: assert the doc names `result-block.schema.json`, `--output-format json`,
    `--json-schema`, states the path is not accepted and carries the `-replace` escape; assert it has
    no `| \`v\` |` field table. Add the done_when gate: no `.md` file under `workbench/` contains
    `CODEADD_OUTPUT`, `output-mode.js` or `codeadd-result`.
  - **Consumes:** `result-block.schema.json`, and `validateResultBlock(text)` over raw JSON (F4)

### Does NOT Include (important!)

- The headless smoke run of `/add-framework--backlog update 9999B` with `--json-schema` — the user runs
  it after the build, before close-out (invocation).
- Any change to the --fix track, `--ticket`, the seven-block report, or the 0028B changelog and
  `docs/deliveries/` archive — history stays as written.
- A JSON Schema library. The check is structural over the keyword subset the schema uses.
- The product layer. Nothing under `framwork/`, `cli/` or `mcp/` changes. The new `.json` is not a
  graph node — `scripts/build.js:1175` walks only `.md` under a skill — so no count in
  `cli/tests/build-artefact-graph.test.js` shifts.
- The changelog and the 0028B index items: `/add-framework--done` writes the changelog line stating
  the 0028B output mode was removed before release, and marks the 0028B result-block items superseded.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Remove the 0028B output mode? | Yes, all of it except --fix and --ticket | Ticket notes; unreleased, so no consumer breaks |
| Keep the STOP-time load exception in `add-final-report`? | No — restore the last-step rule | It existed only to run the resolver at a STOP. Nothing else in the skill needs an early load |
| `workbench/settings.json` | Delete the file | Only key is `output.mode`, only reader is the resolver. An empty config file is a question with no answer |
| Keep `result-block.md`? | Yes, rewritten as the call doc | Keeps the `uses:` edge and the graph's reference count stable; the ticket asks for a short call doc |
| Where do status meanings and cross-field rules live? | In the schema's `description` fields | One contract. The doc points at it and restates nothing |
| Validate with a library? | No — structural check plus a small walker | Root takes no dependency (AGENTS.md); the subset is ten keywords |
| `validateResultBlock` input | Raw JSON text (CLI stdout) | No fence exists any more; stdout is the object |
| Changelog | The build's changelog states the 0028B output mode was removed before release | Ticket done_when |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The CLI rejects a schema keyword (e.g. type arrays) | Low | F4 limits keywords; the user's smoke run is the check. If it fails, swap nullable `type` arrays for `anyOf` — a schema-only follow-up |
| A test the removal needed to delete takes an unrelated test with it | Low | Each F-block names the exact tests it deletes; the build reports the test count before and after per F-block |
| `AGENTS.md` keeps a stale pointer — it is not a graph node | Medium | F3 greps `AGENTS.md` for `output-mode` and `workbench/settings.json` and expects zero hits |

## Impact

Graph answer, `impact --depth 1`:

| Artefact | Layer | Action | Depth-1 callers | Risk | Reason |
|----------|-------|--------|-----------------|------|--------|
| `workbench/skills/add-framework--brainstorm/SKILL.md` | internal | modify | 0 | LOW | F1 |
| `workbench/skills/add-framework--plan/SKILL.md` | internal | modify | 2 | MEDIUM | F1 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | 3 | HIGH | F1 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | 1 | MEDIUM | F1 |
| `workbench/commands/add-framework--backlog.md` | internal | modify | 0 | LOW | F1 |
| `workbench/commands/add-framework--release.md` | internal | modify | 1 | MEDIUM | F1 |
| `workbench/commands/add-framework--sync.md` | internal | modify | 1 | MEDIUM | F1 |
| `workbench/skills/add-final-report/SKILL.md` | internal | modify | 9 | HIGH | F2 |
| `workbench/skills/building-commands/SKILL.md` | internal | modify | 5 | HIGH | F2 |
| `scripts/output-mode.js` | internal | remove | not a node | NOT VERIFIED (top-level `scripts/` has no node; grep shows only its test, the stop lines and the docs above) | F3 |
| `scripts/tests/output-mode.test.cjs` | internal | remove | not a node | — | F3 |
| `workbench/settings.json` | internal | remove | not a node | — | F3 |
| `.claude/settings.json` | internal | modify | not a node | — | F3 |
| `AGENTS.md` | internal | modify | not a node | — | F3 — yes, this plan changes `AGENTS.md` |
| `workbench/skills/add-final-report/references/result-block.schema.json` | internal | create | — | LOW | F4 |
| `scripts/tests/result-block-schema.cjs` | internal | modify | not a node | — | F4 |
| `workbench/skills/add-final-report/references/result-block.md` | internal | modify | 1 | MEDIUM | F5 |
| `scripts/tests/result-block.test.cjs` | internal | modify | not a node | — | F1–F5 |

The high grades are wide reach, not deep change: every caller of `add-final-report` and
`building-commands` loads text that only shrinks back to its pre-0028B form.

**Delivery index:** `history` on `add-final-report` (internal) returns one live entry, the
continuation-line delivery — nothing gone or superseded. The 0028B entry
(`2026-10-07T192430-PLAN--agent-friendly-workbench`) carries no node on its items, so `history` does
not join it; `/add-framework--done` should mark its result-block items superseded by this delivery.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Each F-block's new assertion is written before its edit and seen failing.

### L1 — `scripts/tests/result-block.test.cjs` (RED → GREEN)

1. (F1) No stage artefact contains `output-mode.js`, `result block` or `` `both` mode ``. *RED today: all seven carry the stop line.*
2. (F2) `add-final-report` description has `Load at the last step, not at the first.`, its guard no `early exit`, no `## The Result Block`; `building-commands` has no `any STOP or early exit`. *RED today: 05cf532 text.*
3. (F3) `scripts/output-mode.js` and `workbench/settings.json` absent; no `output-mode` allow entry. *RED today: all present.*
4. (F4) `checkSchema(SCHEMA)` passes and fails on two broken schemas; `RESULT_KEYS` equals the twelve keys; valid fixtures per status pass, invalid ones fail with a named reason. *RED today: no schema file, `checkSchema` undefined.*
5. (F5) The doc names the schema file, both flags, the path rule and the escape, and has no field table; no `.md` under `workbench/` contains `CODEADD_OUTPUT`, `output-mode.js` or `codeadd-result`. *RED today: the doc carries the fence and Headless callers.*

### L2 — Build and suite

1. `node scripts/build-workbench.js` exits 0 after every F-block.
2. `node scripts/build.js` exits 0 with no new warning after F4 and F5 (graph emits; `add-final-report` keeps its `uses:` edge to `result-block.md`).
3. Full suite through `scripts/run-tests.js` green at the end. Test count reported before and after;
   the only removed tests are the ones named in F1–F4 plus the whole `output-mode.test.cjs`.

### L3 — Behavioural acceptance (outside the build)

1. The user's smoke run: `claude -p "/add-framework--backlog update 9999B" --output-format json
   --json-schema "<schema content>"` returns an object that `validateResultBlock` accepts. Run after
   the build, before `/add-framework--done`.

**RED expectations against the current tree:** L1.1–L1.5 all fail today.
**GREEN = L1 and L2 pass after F1–F5.** L3 is the ticket's last check and is not the build's.

---

## Execution Order

F1 [internal] → F2 [internal] → F3 [internal] → F4 [internal] → F5 [internal]

- **Removal first** (F1–F3), per the invocation, and each carries its own test edit so the suite is
  green at every boundary — the build can stop after any of them.
- **F4 before F5** because the doc and its test consume the schema file and the new validator.
- After F3 the repository has no output mode at all and no schema yet. That state is coherent: prose
  is the only output, which is already the default.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the L1 item covering it and its pass
state, and the test count before and after.

Gaps to hunt:

1. An F-block whose L1 item was never RED.
2. A deleted test not in F1–F4's named list — the done_when forbids removing an unrelated one.
3. A `both` mode aside left in a stage artefact that the needle list missed (grep `in \`both\``).
4. Schema and validator drifting — the validator must read the schema file, not carry its own key list;
   only the three description-stated rules in F4 live in code.
5. The changelog line and the superseded marks are `/add-framework--done`'s — check they landed at close-out.

---

## Next Steps

/add-framework--build docs/plans/2026-10-07T220115-PLAN--result-block-json-schema.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-07 | Initial creation |
| 2026-10-07 | Review fix-then-ok: `STOP_RULE` removal moved to F2; dropped the conditional `cli/` edit (the `.json` is not a node); close-out owns changelog and superseded marks; walker keeps `>= 0` integer checks; `$schema` URI and `title` named; asides count four; guard restored verbatim |
| 2026-10-07 | Build: implemented in commits 6fc9ffc, 98f6e95, b9caf6a, 2f69558, 00ed307 on feat/result-block-json-schema; F4 and validator simplified by the operator (see ledger) |

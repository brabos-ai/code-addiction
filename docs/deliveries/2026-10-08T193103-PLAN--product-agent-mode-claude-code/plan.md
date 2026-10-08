# Plan: Product Agent Mode for Claude Code — a shipped result schema and bot guide for headless runs

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-08
> **Delivery:** confirm
> **Ticket:** 0031B

---

## Objective

A bot (CI, a script or another agent) can run any command of the installed codeadd in Claude Code with nobody watching: it gets a JSON result validated by a schema it passes itself, it knows when the command stopped waiting for approval and resumes it with `--resume`, and a short guide — present in every installation and pointed to by `AGENTS.md` — explains how.

**When this build is done:** every install and update carries `.codeadd/agent-mode/` with a result schema
that tests hold structurally equal to the workbench one, and a five-part guide whose command names are
checked against the registry. `add-wiki` writes a one-line pointer to the guide into the user's
`AGENTS.md`. The release ZIP packages the directory. One real headless `/add-brainstorm` run has shown
`needs-approval` and resumed into a second schema-valid result.

**Ticket done when:** Running an installed command headless in Claude Code with json-schema returns a schema-valid result, a needs-approval stop resumes with the resume flag, and the installed AGENTS.md points to the bot guide.

## Context

The workbench can be driven headless since 0028B → 0030B → 0029B; the product cannot. A user driving
`add-plan`, `add-build` or `add-done` from CI today has to parse the seven-block report and guess whether
a run stopped on purpose, failed or is waiting. Claude Code's own `--json-schema` validation solves this
with no prompt change, so the cost is a contract file, a guide and one pointer.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-08T191240-product-agent-mode-claude-code.md` | The scope, the five parts of the guide, the verbatim `add-wiki` line, the test list, the smoke procedure, the rejected alternatives and the risks |
| `docs/brainstorming/2026-10-08T191240-product-agent-mode-claude-code-intent.md` | Path `architectural`, nine closed decisions, `## Open: None`, `delivery: confirm`, `ticket: 0031B` |

## Global Constraints

- No change to any command, skill or agent prompt beyond the one `add-wiki` line; no checkpoint marker, no output instruction (design, Does NOT Include; 0030B)
- The `add-wiki` line is verbatim: `Headless callers (claude -p): read .codeadd/agent-mode/README.md.` (design, Scope → Includes)
- The product schema carries no `$schema` key — the CLI rejects the 2020-12 meta-schema passed through `--json-schema` (`scripts/tests/result-block.test.cjs`, first test)
- Product and workbench schemas are equal once every `description` is removed, at every depth (STEP 4 decision, confirmed by the user)
- `--json-schema` takes the schema TEXT, not a path; the validated object is `.structured_output` of the envelope (`workbench/skills/add-final-report/references/result-block.md`, How to call)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js`, in the container, never `npx vitest` in `cli/` (memory: testes no container; testes não escrevem no checkout)
- Claude Code only; no other provider is touched (design, Does NOT Include)

## Problem

1. **No product schema** — a headless caller has nothing to pass to `--json-schema`.
2. **No guide** — nothing tells a bot how to call, read the result, or continue a stopped run.
3. **No pointer** — the installed `AGENTS.md`, the one file every agent session reads, says nothing about headless use.

## Proposal

A new installed directory `framwork/.codeadd/agent-mode/` with `result.schema.json` and `README.md`,
packaged by `release.yml` and copied by the existing `copyFromZip` on install and update. `add-wiki`'s
`codeadd-shell` block gains one pointer line. Tests are written first and fail against the current tree;
a manual headless run closes the build as the only proof that a product command really returns
`needs-approval`.

## Current State

| Artefact | Today | Dependants (depth 1) |
|---|---|---|
| `framwork/.codeadd/commands/add-wiki.md` | `codeadd-shell` block at lines 616–622 holds only the Runtime policy | 16: 15 `HANDS_OFF_TO` + `plugins/gitnexus/fragments/add-wiki.md` (`INJECTS_INTO`), which does not touch the block |
| `workbench/skills/add-final-report/references/result-block.schema.json` | 12 required keys, `v: const 1`, `additionalProperties: false` at every object | read by `scripts/tests/result-block-schema.cjs` |
| `scripts/tests/result-block-schema.cjs` | Exports `validateResultBlock`, hard-wired to the workbench schema | `scripts/tests/result-block.test.cjs` |
| `.github/workflows/release.yml` line 115 | `for subdir in .codeadd/scripts .codeadd/fragments .codeadd/templates .codeadd/plugins …` | not a graph node |
| `cli/tests/release-packaging.test.js` line 57 | Required list of four `.codeadd/*` dirs | not a graph node |

## Scope

### Includes

- **F1** [internal] — `cli/tests/agent-mode.test.js` (new): the spec for F3–F5, written RED. It asserts:
  the product schema parses and has no `$schema`; with `description` removed recursively from both, it
  deep-equals the workbench schema (so `required`, every `properties` key set, `type`, `enum`, `const`,
  `additionalProperties` and `title` are all compared); one sample object per `status` value passes
  `validateResultBlock` from `scripts/tests/result-block-schema.cjs` — valid because the equality above
  proves the two share one structure, so no second validator is written; every `/add-*` command named in
  `agent-mode/README.md` is a command in `framwork/provider-map.json`; the `codeadd-shell` block of
  `add-wiki.md` contains `.codeadd/agent-mode/README.md`; and no file under `framwork/.codeadd/commands/`,
  `skills/` or `agents/` contains `json-schema` or `result block` — a case-insensitive substring match
  over every file in those three trees, recursively, and nowhere else: never `agent-mode/`, fragments or
  built output. Static reads only. F1 and F2 together are the spec. Ref: design, Scope → Tests.
- **F2** [internal] — `cli/tests/release-packaging.test.js`: `.codeadd/agent-mode` joins the required list
  in "ships every post-install runtime .codeadd/* dir". Must not lose the four existing entries.
- **F3** [product] — `framwork/.codeadd/agent-mode/result.schema.json` (new): the workbench schema's
  structure, with product descriptions — `stage` example `add-build`; `ticket` is `null` when the `board`
  feature is off or the command made no board write; `ci` is `null` when the command did not read CI; the
  `status` description carries the `needs-approval` meaning, with `--resume` as the way to continue.
  Ref: design, Proposed Solution.
  - **Produces:** `framwork/.codeadd/agent-mode/result.schema.json`
- **F4** [product] — `framwork/.codeadd/agent-mode/README.md` (new): the bot guide, exactly the five parts
  the design lists (call in bash and PowerShell; resume; the one stop rule; the main flows one line each;
  "Claude Code only for now"), stating that Claude Code validates against the schema and that a bot reads
  `status`. No per-stop table. Ref: design, Scope → Includes, second item.
  - **Consumes:** `framwork/.codeadd/agent-mode/result.schema.json` (F3) — the guide's commands read it as `.codeadd/agent-mode/result.schema.json`
  - **Produces:** `.codeadd/agent-mode/README.md`
- **F5** [product] — `framwork/.codeadd/commands/add-wiki.md`: the verbatim line from Global Constraints
  added inside the `codeadd-shell` block in STEP add-wiki.resolve-shell-policy, as its own line directly
  after `No Bash, WSL or Git Bash is required; the entries are native CommonJS.` and before the blank line
  and the `[//]: # (codeadd-shell:end)` marker. Marker names, the replace-or-append rule and the
  verification list stay unchanged.
  - **Consumes:** `.codeadd/agent-mode/README.md` (F4)
- **F6** [internal] — `.github/workflows/release.yml`: `.codeadd/agent-mode` added to the `for subdir in`
  list of the "Package framework zip" step. Without it the `[ -d ]` loop ships nothing and nothing fails.
  - **Consumes:** `framwork/.codeadd/agent-mode/result.schema.json` (F3) — the directory must exist for the `[ -d ]` test to pass it
- **F7** [internal] — `AGENTS.md`: one sentence in the text of `### Product Layer — framwork/.codeadd/`,
  above the generated inventory block, naming `.codeadd/agent-mode/` as the headless guide and result
  schema. `scripts/inventory.js` and the generated block stay unchanged.
  - **Consumes:** `framwork/.codeadd/agent-mode/result.schema.json` (F3)

### Does NOT Include (important!)

- The test-loss guard for the product `add-build` and `add-done` — ticket 0032B.
- Codex, Cursor, Antigravity, OpenCode and ZCode — separate tickets.
- Any prompt change beyond F5. No checkpoint marker, no output instruction.
- A shipped validator script — `--json-schema` already validates.
- A CLI migration that edits the user's `AGENTS.md` — the installer never touches it.
- A plan-less fix track — the product already has `add-hotfix`.
- Changes to `add--ecosystem`, `add--delivery-mode` or `add--final-report`.
- Changes to `scripts/tests/result-block-schema.cjs` — F1 imports it as it is.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Which commands the schema covers | Any installed command; the caller passes it | Intent, Decided 1 |
| Where guide and schema live | `framwork/.codeadd/agent-mode/` | Intent, Decided 2 |
| Schema shape | Same keys, types and enums as the workbench, product descriptions, held equal by a test | Intent, Decided 3 |
| How schema equality is compared | Remove `description` at every depth, deep-equal the rest | STEP 4, confirmed — the design's list would miss `const` and `additionalProperties` |
| How the per-status samples are validated | The existing `validateResultBlock`, no second validator | STEP 4, confirmed — equality proves one structure |
| Where `needs-approval` lives | The schema's `status` description only | Intent, Decided 4 |
| Guide content | Five parts, one stop rule, command names checked by test | Intent, Decided 5 |
| `AGENTS.md` pointer | One verbatim line in `codeadd-shell` | Intent, Decided 6 |
| Shipped validator | None | Intent, Decided 7 |
| Proof | Automated tests plus one manual headless `/add-brainstorm` run with `--resume`; one attempt; a mismatch is a hard stop | Intent, Decided 8 |
| The banned-terms scan is green today | Kept as a regression guard; the build proves it bites by inserting a term temporarily | STEP 4, confirmed |
| Telling existing installs about the pointer | The delivery's changelog says: run `codeadd update` for the guide, then `/add-wiki` for the pointer — for the release notes to carry | STEP 4, confirmed; design Key Decisions row 7 |
| Ticket `done_when` | Copied from 0031B after its update in `35070a1` | STEP 4, P1 answer A |
| How the done-when's `AGENTS.md` clause is proven | L1.7: the line a fresh `/add-wiki` writes is in its managed block, which add-wiki copies verbatim. Existing installs get it on their next `/add-wiki` | Review A6; the installer never touches the user's `AGENTS.md` (intent, Decided 6) |
| The "Runtime policy managed block adds 5 more" figure in `add--agents-md-style` | Left unchanged | The 80-150 budget absorbs one line (design, Ecosystem Impact: action none); editing the skill breaks the no-prompt-edit constraint |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Headless use of every installed command with a validated result | A second schema file, held equal by a test |
| No prompt change, so no prompt drift | A bot learns a specific stop only from `reason` |
| One provider-independent path for later provider tickets | A new `.codeadd/` subdirectory that `release.yml` must list |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A product command does not return `needs-approval` at a stop under `-p` | Medium | L3 smoke; a mismatch is a hard stop of the build |
| `release.yml` stops packaging `agent-mode` in a later edit | Low | F2 (L1.6) |
| The two schemas drift | Low | F1 equality level (L1.2) |
| A command renamed later leaves a stale name in the guide | Low | F1 name level (L1.4) |
| Users on an old `AGENTS.md` never see the pointer | Medium | Guide exists after `codeadd update` regardless; changelog line for the release notes |
| A prompt later gains output instructions | Low | F1 banned-terms level (L1.5) |
| `codeadd update` prunes or skips `agent-mode/` | Low | `copyFromZip` copies every entry under `framwork/.codeadd`; `PRESERVE_PATTERNS` does not match it. L3 copies the tree the same way |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/agent-mode.test.js` | internal | create | F1 |
| `cli/tests/release-packaging.test.js` | internal | modify | F2 |
| `framwork/.codeadd/agent-mode/result.schema.json` | product | create | F3 |
| `framwork/.codeadd/agent-mode/README.md` | product | create | F4 |
| `framwork/.codeadd/commands/add-wiki.md` | product | modify | F5 — risk HIGH, 16 depth-1 dependants |
| `.github/workflows/release.yml` | internal | modify | F6 |
| `AGENTS.md` | internal | modify | F7 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 and F2 land before F3–F7 and are run against the current tree.

### L1 — Unit (`node scripts/run-tests.js cli`, in the container)

1. Product schema parses as JSON and has no `$schema`. *RED today: file absent.*
2. With `description` removed at every depth, the product schema deep-equals the workbench schema. *RED today: file absent.*
3. One sample per `status` value (`done`, `stopped`, `needs-approval`, `failed`) passes `validateResultBlock`, and the sample keys equal the schema's `status.enum`. *RED today: the level reads the product schema's enum, which is absent.*
4. Every `/add-*` name in `agent-mode/README.md` is a command in `framwork/provider-map.json`, and the guide names at least one. *RED today: file absent.*
5. No file in `framwork/.codeadd/commands|skills|agents/` contains `json-schema` or `result block`. *GREEN today — a regression guard. The build proves it bites: add `json-schema` to one command source, see the level fail, revert.*
6. `release.yml`'s packaging list contains `.codeadd/agent-mode` (F2). *RED today: not in the list.*
7. The `codeadd-shell` block of `add-wiki.md` contains `.codeadd/agent-mode/README.md`. *RED today.*

### L2 — Integration

1. `node scripts/build.js` exits 0 with no new warning.
2. `node scripts/run-tests.js framework` passes in the container, `plain-language-rule` L3.6/L3.7 included — the new line leaves the markers intact.

Packaging is covered by L1.6 (the list entry) plus the loop's own `[ -d ]` check (the directory exists after F3); no separate run of the YAML step.

### L3 — Behavioural acceptance (manual, once, needs a logged-in `claude`; not in CI)

1. Run `node scripts/build.js`. Copy `framwork/.codeadd/` and `framwork/.claude/` into a temporary git project outside the checkout — the same copy `copyFromZip` makes. In it run `claude -p "/add-brainstorm add a dark mode" --output-format json --json-schema "<text of the PRODUCT .codeadd/agent-mode/result.schema.json>"`. The topic is deliberately vague so the brainstorm's first clarifying question is a deciding stop. Check that `.structured_output.status` is `needs-approval`.
2. Answer with `claude -p "Keep it simple: one toggle in settings, saved locally." --resume <session_id> --output-format json --json-schema "<the same product schema text>"`. Check that the second `.structured_output` passes `validateResultBlock` — valid for the product schema because L1.2 proves the two share one structure.
3. One attempt. Any first result whose status is not `needs-approval` is the mismatch — even when the cause looks like the topic needed no question — and so is a second result that fails validation. A mismatch is a hard stop: report it, do not retry, do not change a prompt to make it pass. Delete the temporary project afterwards. Record both envelopes' `status` and `session_id` in the ledger.

**RED expectations against the current tree:** L1.1–L1.4, L1.6 and L1.7 fail; L1.5 passes (a guard, proven to bite as stated).
**GREEN = all levels pass after F1–F7, then L3 passes.**

---

## Execution Order

1. **F1 [internal] → F2 [internal]** — the spec first; run and record the RED state.
2. **F3 [product] → F4 [product]** — the guide's commands name the schema path. After F4, L1.1–L1.4 are green.
3. **F5 [product]** — the pointer names the guide path. L1.7 green.
4. **F6 [internal]** — needs the directory to exist. L1.6 green.
5. **F7 [internal]** — the anatomy sentence names what now exists.
6. **L2, then L3** — L3 needs the full build and runs last.

One commit per F-block. F1 and F2 commit tests that are RED on purpose; each commit's expected red levels are recorded in the ledger. The suite is fully green only after F6, so a build that stops before F6 must not open the PR.

The L1.5 bite check is a temporary edit reverted inside F1's work; it never reaches a commit.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, which L-levels cover it and their state, and any departure from the design with the section and the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. L1.2 comparing only some fields again — the equality must be "strip `description`, deep-equal", or `const` and `additionalProperties` can drift unseen.
3. L1.5 scanning more than the three source trees — a scan reaching `agent-mode/` fails on the guide itself.
4. The `add-wiki` line differing from the verbatim string by a character, or the marker lines changing.
5. L3 recorded as passed with no `session_id`, or retried after a mismatch.
6. Any prompt edit outside F5.

## References

- Design set: `docs/brainstorming/2026-10-08T191240-product-agent-mode-claude-code.md`, `…-intent.md`
- Prior art: `2026-10-07T220115-PLAN--result-block-json-schema` (0030B — schema as the only contract, no prompt instructions); `2026-10-08T155700-PLAN--workbench-run-safety` (0029B — `needs-approval` from the schema description, proven headless)

---

## Next Steps

/add-framework--build docs/plans/2026-10-08T193103-PLAN--product-agent-mode-claude-code.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-08 | Initial creation |
| 2026-10-08 | Review fix-then-ok applied: F5 states the line's position; F1 states the banned-terms match; Execution Order says F1–F2 are RED on purpose; L2.3 dropped (L1.6 + `[ -d ]` cover packaging); L2.2 runs `framework`; L3 fixes topic, answer and the product schema, and defines the mismatch; two decisions added (done-when `AGENTS.md` clause via L1.7; "5 more" figure left unchanged) |
| 2026-10-08 | Build complete: status implemented; commits b176a43..b683452 on feat/product-agent-mode |

# Plan: agent-mode-review-background — no turn ends with work pending, and a QA `broken` that says why

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-10
> **Delivery:** confirm
> **Ticket:** 0044B

---

## Objective

[from conversation, no design document] Under agent-mode (`claude -p --json-schema`), a command emits
its result only after every agent and long command it started has finished, so `/add-review` writes
its review instead of closing early; and a `QA_CONTRACT_MATCH=broken` tells the user why — receipt
shape, shipped shape, the version in which the shipped QA shape last changed, and `/add-qa-setup`.

**When this build is done:** the shared dispatch reference carries one foreground rule every
dispatching command already reads; the bot-facing interaction skill repeats it for agent-mode; a test
fails if the rule goes missing or any product artefact asks for `run_in_background`; the setup
contract carries a `changed-in` version next to its shape without moving the shape; and the QA
preflight, on `broken`, prints the two shapes, the receipt's version, the `changed-in` version and the
action, which `/add-review`'s QA block quotes.

**Ticket done when:** Em agent-mode, add-review (e qualquer comando que dispara agentes em background) so emite o resultado depois que todos os agentes terminam, e o review e escrito; ha teste ou checagem que cobre isso; o QA_CONTRACT_MATCH=broken pos-update foi explicado ou corrigido; build e testes passam.

## Context

Reported by the Organize My Finances (OMF) engineer on v1.5.0. `/add-review 0035F` headless with
`--json-schema` ran its gates and two spec-audit agents in the background, ended its turn to wait,
was forced into its final answer by the engine, and never dispatched the reviewers. No command asks
for background execution; the model chose it. The `broken` QA row was correct — OMF's receipt
carried shape `sha256:d599ad3ab3c9f345` from 1.2.4 — but said nothing about why.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-10T221800-agent-mode-review-background-intent.md` | The incident, the QA investigation, decisions 1-7, `## Open: None` |

## Global Constraints

- The shipped QA shape stays `sha256:2326519b34fdd1fe` (`framwork/.codeadd/commands/add-qa-setup.md:101`). No character inside `## Materializes` changes except the one added `changed-in:` line, which the hash excludes — any other edit there breaks every installed project's QA again
- The preflight comparison is unchanged: `broken` exactly when the receipt shape differs from the shipped shape (intent, decision 5)
- No product command, skill, agent, fragment or plugin text contains `run_in_background` (intent, decision 4)
- `dispatch-rules.md` names no provider and no provider parameter — banned: `opencode`, `claude`, `codex`, `cursor`, `antigravity`, `ses_`, `task_id` (`cli/tests/dispatch-rules.test.js:39-45`)
- No agent-mode text names a result field, a status or the schema flag — banned patterns include `json-schema`, `` `stopped` ``, `status ... stopped`, `result block` (`cli/tests/agent-mode-feature.test.js:144`, `CONTRACT_WORDS`)
- Smallest change possible; build and tests pass (intent, decision 7). Tests run through `node scripts/run-tests.js`, never natively
- No code push and no PR (operator instruction for this delivery). Board writes still happen (add-plan-authoring, The Ticket)

## Problem

1. **A turn ends with work pending** — a headless run that ends its turn to wait for background
   agents or commands is read by the engine as finished, and the result closes before the work does.
2. **`broken` without a reason** — `QA_CONTRACT_MATCH=broken` names neither the two shapes nor the
   version that changed the shape, so a user cannot tell an expected update step from a regression.
3. **No version on the shape** — `contracts.json` carries only the hash; nothing records when the
   shipped QA shape last changed (it was `v1.3.2`, commit `c2af602`).

## Proposal

Two independent tracks on one branch. Track A puts one engine-neutral rule in the shared dispatch
reference, one line in the agent-mode skill, two wording fixes in `add-audit`, and a test that pins
both. Track B adds a hand-declared `changed-in:` to the setup contract — excluded from the hash like
`shape:` is — emits it into `contracts.json`, and has the preflight print the diagnosis on `broken`;
`/add-review`'s QA row 9 quotes it.

## Scope

### Includes

#### T1 — Foreground rule (intent decisions 1-4)

- **F1** [product] — `framwork/.codeadd/skills/add--subagent-driven-development/references/dispatch-rules.md`:
  new section stating decision 1 — dispatch agents in the foreground; parallel agents go out as
  several calls in ONE message; long shell commands (gates, builds, tests) run in the foreground with
  a timeout that covers them; never end the turn or emit the result while an agent or command is
  pending. The section heading is exactly `## Foreground Only — No Turn Ends With Work Pending`, and
  the body carries these three substrings, lowercase-matched: `foreground`, `in one message`,
  `never end the turn`. Engine-neutral wording: "a background or asynchronous mode of the dispatch or shell tool",
  never a parameter name. **One carve-out, stated in the rule:** an app server a step boots on purpose
  (the `qa-project` Managed App Lifecycle) is not pending work — it is a process the step owns and
  tears down per that lifecycle. Must NOT lose the existing resume-field section.
- **F2** [product] — `framwork/.codeadd/skills/add--agent-interaction/SKILL.md`: one line under
  `## Closing` (decision 2): the closing is emitted only after every agent and command has finished,
  and ending a turn to wait is forbidden because in this mode the end of a turn IS the end of the run.
  Behaviour words only — no `json-schema`, no status name.
- **F3** [product] — `framwork/.codeadd/commands/add-audit.md`: the two `If NO → Do NOT proceed; wait
  or re-dispatch` lines (discovery and analysis gates) become "re-dispatch the missing agent" — the
  word "wait" there invites ending the turn. Decision 3's check found nothing else: `add-review`,
  `add-build` and `add-plan` already dispatch and wait in the foreground sense.
- **F4** [product] — `cli/tests/dispatch-rules.test.js`: two cases (decision 4). (a) the reference
  contains the exact heading F1 names, and its text after `toLowerCase()` — the normalisation the
  file's existing cases use — contains the three substrings F1 names; (b) no file under
  `framwork/.codeadd/{commands,skills,agents,fragments,plugins}` contains `run_in_background`.

#### T2 — QA `broken` that says why (intent decisions 5-6)

- **F5** [internal] — `scripts/build.js` (setup contracts): `parseContractDeclaration` reads an optional
  `changed-in:` field; `canonicalContractBody` drops the FIRST line matching
  `^changed-in:[ \t]*\S+[ \t]*$` and only that one, exactly as it drops `shape:` — a later column-0
  `changed-in:` line (inside an embedded template) stays hashed; the version check reads the YAML
  fence value from `parseContractDeclaration`, never a template line; a present value must be
  `MAJOR.MINOR.PATCH` or the build throws; the sidecar writes it as
  `changed_in`, placed after `shape`; the shape-mismatch error tells the author to set both `shape:`
  and `changed-in:` (the version that will ship the change).
  - **Produces:** `contracts["<command>"].changed_in` in `.codeadd/contracts.json`
- **F5b** [product] — `cli/tests/build-contracts.test.js` (and `cli/tests/build.test.js` where it pins the
  sidecar bytes): cases for L1.3, L1.4 and L1.8 — shape unchanged with or without the line, format
  check, emitted key order, a second column-0 `changed-in:` still moving the shape.
  - **Consumes:** `contracts["<command>"].changed_in` (F5)
- **F6** [product] — `framwork/.codeadd/commands/add-qa-setup.md`: add `changed-in: 1.3.2` on the line
  after `shape:` inside the `## Materializes` YAML. Nothing else in the block changes.
  - **Consumes:** `contracts["<command>"].changed_in` (F5)
- **F7** [product] — `framwork/.codeadd/scripts/qa-preflight.cjs`: on `QA_CONTRACT_MATCH=broken` only,
  print five more rows. Comparison untouched. Two new readers: `changed_in` is read with `JSON.parse`
  on the sidecar inside a try block (`contracts["add-qa-setup"].changed_in`, else `unknown`) — never by
  extending the unbounded line scan of `readCurrentShape`, which would pick up another contract's
  key; the receipt's `framework-version` is read by a frontmatter-bounded reader shaped like
  `readSetupShape` (else `unknown`).
  - **Consumes:** `contracts["<command>"].changed_in` (F5)
  - **Produces:** `QA_CONTRACT_RECEIPT_SHAPE=<sha256:…>`, `QA_CONTRACT_RECEIPT_VERSION=<receipt framework-version|unknown>`, `QA_CONTRACT_SHIPPED_SHAPE=<sha256:…>`, `QA_CONTRACT_CHANGED_IN=<version|unknown>`, `QA_CONTRACT_ACTION=/add-qa-setup`
- **F7b** [internal] — `scripts/tests/qa-preflight.test.cjs`: cases for L1.5, L1.7 and L1.9.
  - **Consumes:** `QA_CONTRACT_RECEIPT_SHAPE=<sha256:…>`, `QA_CONTRACT_RECEIPT_VERSION=<receipt framework-version|unknown>`, `QA_CONTRACT_SHIPPED_SHAPE=<sha256:…>`, `QA_CONTRACT_CHANGED_IN=<version|unknown>`, `QA_CONTRACT_ACTION=/add-qa-setup` (F7)
- **F8** [product] — `framwork/.codeadd/fragments/qa-pipeline/add-review.md`: row 9's block says
  "the QA setup changed in version `QA_CONTRACT_CHANGED_IN` (receipt written by
  `QA_CONTRACT_RECEIPT_VERSION`); run `/add-qa-setup`" and shows both shapes. Fragment body only — no
  marker, slot or section boundary moves.
  - **Consumes:** `QA_CONTRACT_RECEIPT_SHAPE=<sha256:…>`, `QA_CONTRACT_RECEIPT_VERSION=<receipt framework-version|unknown>`, `QA_CONTRACT_SHIPPED_SHAPE=<sha256:…>`, `QA_CONTRACT_CHANGED_IN=<version|unknown>`, `QA_CONTRACT_ACTION=/add-qa-setup` (F7)
- **F9** [internal] — `AGENTS.md`, Build-emitted sidecars table: the `contracts.json` row carries "the
  `shape` and `changed_in` of every `## Materializes` block" and lists `qa-preflight.cjs` as a reader
  next to `status.cjs` (it already reads the file; the row missed it).
  - **Consumes:** `contracts["<command>"].changed_in` (F5)

### Does NOT Include (important!)

- `status.cjs` `SETUP_QA_STALE` — decision 5 names the preflight only
- Any per-command edit beyond `add-audit` — decision 3's check found no other text suggesting background or waiting
- Edits to `add-brainstorm`, `add-done`, `add-pull-request`. They do not reach `dispatch-rules.md`, but they dispatch no agent (`dispatch-rules.test.js` requires every `DISPATCH` command to reach it), and in agent-mode F2 covers them
- An automatic `changed-in` (installer diff or release hook) — more machinery than decision 7 allows
- The live proof in OMF — manual, after merge and release (decision 4)
- Pushing code or opening a PR (operator)

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where the foreground rule lives | `dispatch-rules.md`, all commands, both modes | Intent, decision 1 |
| Agent-mode reinforcement | One line in `add--agent-interaction` | Intent, decision 2 — reason worded as behaviour, per `CONTRACT_WORDS` |
| Per-command edits | Only `add-audit` (two lines) | Intent, decision 3 — the check ran at planning time |
| Test | `dispatch-rules.test.js`, rule present + no `run_in_background` | Intent, decision 4; extends the existing pattern there |
| Comparison | Unchanged; only the signal improves | Intent, decision 5 |
| Where the version lives | `changed-in:` next to `shape:` in `## Materializes`, excluded from the hash, emitted as `changed_in` | Intent, decision 6 ("whichever is simpler"): no installer change, one reader |
| Its value today | `1.3.2` | `git log -G'^shape:'` — `c2af602` set `2326519b34fdd1fe`, first tag containing it `v1.3.2`; `v1.4.0` and `v1.5.1` carry the same shape |
| Sidecar without `changed_in` (pre-change install) | Preflight prints `QA_CONTRACT_CHANGED_IN=unknown` | Never guess a version (`add--setup-contract`: "Never guess a shape") |
| App servers booted in the background | Carved out of the rule | The QA lifecycle boots a server that never "finishes"; it is owned and torn down, not waited on |
| `path: fix` in the intent | Read as an unknown path: STEP 3 in full | `add-framework--plan` 2.3 knows `spike`, `bounded`, `architectural` only |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A version with no installer or release change | It is hand-declared — an author can move `shape:` and forget `changed-in:`. The mismatch error names both lines |
| One engine-neutral rule | The rule cannot name the exact parameter the model reaches for; F4's literal check covers the product text instead |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Adding `changed-in:` moves the QA shape and breaks every installed project | High if unhandled | F5 excludes the line from the hash; L1.6 asserts the built shape is still `sha256:2326519b34fdd1fe` |
| The F2 line uses a banned contract word | Medium | Global constraint; `agent-mode-feature.test.js` runs in L2 |
| The F1 rule names a provider | Medium | Global constraint; existing test `dispatch-rules.test.js:39` runs in L2 |
| The rule blocks the QA app server boot | Medium | F1's carve-out; L3.2 reads both QA boot sites against it |
| A test asserts the exact `contracts.json` bytes and breaks on the new key | Medium | F5 updates `build-contracts.test.js` / `build.test.js` where they pin the sidecar; L2 runs the full cli suite |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add--subagent-driven-development/references/dispatch-rules.md` | product | modify | F1 — read by 9 commands + 2 skills (graph depth 1: HIGH) |
| `framwork/.codeadd/skills/add--agent-interaction/SKILL.md` | product | modify | F2 — loaded by the 12 agent-mode fragments (HIGH) |
| `framwork/.codeadd/commands/add-audit.md` | product | modify | F3 — 3 dependants (HIGH) |
| `cli/tests/dispatch-rules.test.js` | product | modify | F4 |
| `scripts/build.js` | internal | modify | F5 — not in the graph; NOT VERIFIED by graph, read by hand |
| `cli/tests/build-contracts.test.js` (and `build.test.js` if it pins the sidecar) | product | modify | F5b |
| `framwork/.codeadd/commands/add-qa-setup.md` | product | modify | F6 — 7 dependants (HIGH); shape must not move |
| `framwork/.codeadd/scripts/qa-preflight.cjs` | product | modify | F7 — 2 dependants (MEDIUM) |
| `scripts/tests/qa-preflight.test.cjs` | internal | modify | F7b |
| `framwork/.codeadd/fragments/qa-pipeline/add-review.md` | product | modify | F8 |
| `AGENTS.md` | internal | modify | F9 — one table row |

Delivery index (`history`, layer product) for `add--subagent-driven-development` and `qa-preflight.cjs`:
no delivery recorded, nothing dropped or superseded.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree.

### L1 — Unit (RED → GREEN)

1. (F4a) `dispatch-rules.md` carries the foreground section and its phrases. *RED today: the file holds only the resume-field section.*
2. (F4b) No product file contains `run_in_background`. *GREEN today — prove it bites by adding the word to a scratch copy of one skill inside the test fixture, or by temporarily inserting it and seeing the case fail, then reverting.*
3. (F5) `contractShape` of a block with and without a `changed-in:` line is identical. *RED today: the line is hashed.*
4. (F5) `changed-in: 1.3` throws; `changed-in: 1.3.2` emits `changed_in: "1.3.2"` after `shape`. *RED today: the field is ignored.*
5. (F7) Receipt shape ≠ shipped shape → output holds `QA_CONTRACT_MATCH=broken` and the five new rows with the fixture's values; sidecar without `changed_in` → `QA_CONTRACT_CHANGED_IN=unknown`; receipt without `framework-version` → `QA_CONTRACT_RECEIPT_VERSION=unknown`. *RED today: none of the rows exists.*
6. (F5+F6) After `node scripts/build.js`, `framwork/.codeadd/contracts.json` → `contracts["add-qa-setup"]` has `shape: "sha256:2326519b34fdd1fe"` and `changed_in: "1.3.2"`. *RED today: no `changed_in`.*
7. (F7) Equal shapes → `QA_CONTRACT_MATCH=ok` and none of the five rows appears.
8. (F5) A block with a second column-0 `changed-in:` line (template content) hashes differently from the same block without it. *RED today only by accident of the line being hashed — re-run after F5 to prove only the first is dropped.*
9. (F7) A sidecar where another contract carries `changed_in` and `add-qa-setup` does not → `QA_CONTRACT_CHANGED_IN=unknown`. *RED today: the row does not exist.*

### L2 — Integration

1. `node scripts/build.js` exits 0 with no new warning.
2. `node scripts/run-tests.js framework` passes — includes `dispatch-rules.test.js`, `agent-mode-feature.test.js` (CONTRACT_WORDS), `build-contracts.test.js`, `qa-preflight.test.cjs`.

### L3 — Behavioural acceptance

1. (F2, F8) Read the built Claude output of `add--agent-interaction` and of `add-review` with `qa-pipeline` enabled: the closing line and the row 9 message are present and quote the right keys.
2. (F1) The two QA boot sites (`add-qa-setup.md:177`, `fragments/qa-pipeline/add-review.md:115`) do not contradict the rule — the carve-out covers them.
3. Manual, after release (not this build): re-run `/add-review 0035F` headless with `--json-schema` in OMF; `review-NNN.md` is written and the status is not stopped.

**RED expectations against the current tree:** L1.1, L1.3, L1.4, L1.5, L1.6 fail; L1.2 and L1.7 pass and are proven to bite by a deliberate break.
**GREEN = all levels pass after F1–F9 (F5b and F7b included).**

---

## Execution Order

F1 → F2 → F3 → F4 (track A, each commit leaves the tree green) → F5 → F5b → F6 → F7 → F7b → F8 → F9.

- **F5 before F6** because without F5 the new line is hashed and `build.js` refuses the shape.
- **F7 after F5/F6** because it reads `changed_in` from the built sidecar fixture shape.
- **F8 after F7** because it quotes F7's keys.
- Track A and track B are independent; a build that must stop can stop after F4 with a working tree.

Per F-block: F5 and F6 run `node scripts/build.js` before the commit and check the QA shape value.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file: files touched with the F-block id, the
validation levels covering it and their pass state, and any departure from the intent with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. Any diff inside `## Materializes` beyond the single `changed-in:` line.
3. The F1/F2 text naming a provider, a tool parameter or a schema word.
4. `qa-preflight.cjs` printing the new rows when the match is `ok`, or changing the comparison.

## References

- Prior art: `2026-10-09T184411-PLAN--agent-mode-feature` (the agent-mode skill and fragments), `2026-10-07T220115-PLAN--result-block-json-schema` (why the end of a turn is the answer), `2026-10-09T114527-PLAN--lighter-product-qa` (preflight rows 8-9)

---

## Next Steps

/add-framework--build docs/plans/2026-10-10T222216-PLAN--agent-mode-review-background.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-10 | Initial creation |
| 2026-10-10 | Review fix-then-ok: test files split into F5b [product] / F7b [internal] by layer; F7 names its two bounded readers (JSON.parse for `changed_in`, frontmatter for `framework-version`); F1/F4 pin the exact heading and substrings; F5 pins the `changed-in` drop regex and first-match-only rule; L1.8, L1.9 added. N1 rejected — "fix only those" in decision 3 is the verb, not a command |
| 2026-10-10 | Implemented in c91f6f3..0476c16 on feat/agent-mode-review-background; changelog 2026-10-10T223828-fix-agent-mode-review-background |

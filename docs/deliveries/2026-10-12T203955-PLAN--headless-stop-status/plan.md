# Plan: Headless stop status — a run that stops or refuses never reads as done, and the build stops landing on main

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-12
> **Delivery:** confirm
> **Ticket:** 0051B

---

## Objective

[from conversation, no design document — drawn from ticket 0051B]

A headless run of build or done that stops on a question or refuses ends with a status a bot can detect
— never `done`, never a silent exit 0 the chain reads as success — and a headless build creates its own
branch instead of asking for one.

**When this build is done:** both result schemas (product and internal) say, in the field the model
fills, that a STOP, a gate or a refusal is `stopped` with the reason, and a question is `needs-approval`
— never `done`. Both bot guides show the one line that turns that status into a non-zero exit. The
internal build, started on `main`, creates the feature branch from the plan slug and goes on, so the
close-out is never reached on `main`. Tests pin all three.

**Where this departs from the ticket's wording:** the ticket says `status=stopped` for a question too.
Here a question keeps `needs-approval`, because the resume contract hangs on it. The ticket's intent —
the stop is detectable and fails the chain — is met: `needs-approval` is never `done` and fails the
exit check.

**Ticket done when:** Headless/agent-mode run of build or done that stops on a question or refuses ends with result block status=stopped and a reason (and non-zero exit if feasible); headless build auto-creates the feature branch from the plan or ticket slug instead of asking; tests cover both

## Context

Seen in 0050B, which ran through the internal pipeline with `claude -p`: `/add-framework--build`
asked to create a branch and exited 0; `/add-framework--done` refused to run on `main` and exited 0.
The calling chain read both as success and went on.

No design document and no intent file exist. The ticket is the only input; every open point below was
decided by the planner (headless run, no questions), and each decision is in **Validated Decisions**.

What the analysis found on disk:

- **No command prints the result.** Claude Code fills `structured_output` from the schema passed with
  `--json-schema`, so the schema's `description` text is the only instruction the model reads when it
  picks `status`. `cli/tests/agent-mode.test.js` L1.5 forbids any command, skill or agent source from
  mentioning the result block — so the schema is the one lever, by design.
- **`claude -p` exits 0 whenever the model finishes a turn.** No command text can change that exit
  code. The exit code is the caller's to derive, from `structured_output.status`.
- **The product build already creates its branch.** `/add-build` STEP `add-build.branch` runs
  `build-setup.cjs`, which derives the branch when `about.md` has none (`DERIVED:true`, covered in
  `scripts/tests/build-setup.test.cjs`). The gap is the internal build: STEP 1.3 only *recommends* a
  branch, and STEP 9 states "This skill never creates a branch".
- **The internal done is right to refuse `main`** (STEP 1.2). The fix is to stop reaching it there.

## Global Constraints

- No command, skill or agent source mentions json-schema or the result block (`cli/tests/agent-mode.test.js` L1.5)
- The product schema equals the workbench schema once every description is removed, at every depth (`cli/tests/agent-mode.test.js` L1.2)
- `status` enum stays `["done", "stopped", "needs-approval", "failed"]` and `v` stays `1` (`scripts/tests/result-block.test.cjs`, "RESULT_KEYS and STATUSES come from the schema")
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **A stop can be reported as success.** The schema says what `stopped` and `needs-approval` mean,
   but never says a run ending at a STOP or a refusal is *not* `done`. A run whose report reads
   "refused, nothing to do" is easy to fill as `done`.
2. **The bot has no exit code to branch on.** The guides show how to read `status`, not how to fail the
   step when it is not `done`. A shell chain checking `$?` sees 0.
3. **The internal build lets work land on `main`.** It asks (or recommends) instead of creating the
   branch, and a headless run that answers nothing commits on `main` — which the close-out then refuses.

## Proposal

Three small edits, no new artefact, no new status.

1. Sharpen the `status` and `reason` descriptions in both schemas: a run that ends at a STOP, a gate
   or a refusal — refusing to run on `main` included — is `stopped`, with the refusal in `reason`; a
   run that ends on a question is `needs-approval`; neither is ever `done`.
2. Give both bot guides the one-line exit-code check, bash and PowerShell, right where they show how to
   read `status`.
3. Make the internal build create the feature branch itself when it starts on `main`.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/agent-mode/result.schema.json`: the `status` description
  adds that a run ending at a STOP, a gate or a refusal (refusing to run on `main` included) is
  `stopped` and a run ending on a question is `needs-approval`, and that neither is ever `done`. The
  `reason` description adds that on `stopped` it names the gate or refusal. Descriptions only — keys,
  types, enum and `v` untouched, so L1.2 still holds.
  - **Produces:** the phrase `never done` in the `status` description of a result schema
- **F2** [product] — `framwork/.codeadd/agent-mode/README.md` section 1: after "Read `status` from it",
  the envelope is saved to a file (the bot still needs its `session_id`) and checked. These two lines,
  verbatim apart from the command:
  - bash: `claude -p "<command>" --output-format json --json-schema "$(cat <schema>)" > out.json` then
    `jq -e '.structured_output.status == "done"' out.json > /dev/null`
  - PowerShell: `$out = Get-Content out.json -Raw | ConvertFrom-Json` then
    `if ($out.structured_output.status -ne 'done') { exit 1 }`

  One sentence says why: `claude -p` itself exits 0 whenever the model finishes, so the exit code is
  the caller's to set. Keep the README's provider-neutral wording.
  - **Consumes:** the phrase `never done` in the `status` description of a result schema (F1) — the
    guide's sentence points at the status rule F1 states and does not restate it
- **F3** [product] — `cli/tests/agent-mode.test.js`: two assertions — the product schema's `status`
  description contains `never done` and names the refusal on `main`; README section 1 carries the
  bash check (`jq -e '.structured_output.status == "done"'`), the PowerShell check
  (`ConvertFrom-Json` and `-ne 'done'`), and the sentence that `claude -p` exits 0.
- **F4** [internal] — `workbench/skills/add-final-report/references/result-block.schema.json` and
  `references/result-block.md`: the same description change as F1, and the same two exit-code lines as F2,
  verbatim, under **How to call**. Wording may differ from the product copy; structure may not (L1.2).
  - **Consumes:** the phrase `never done` in the `status` description of a result schema (F1)
- **F5** [internal] — `scripts/tests/result-block.test.cjs`: the same two assertions as F3, against
  the internal schema and `result-block.md`.
- **F6** [internal] — `workbench/skills/add-framework--build/SKILL.md`: STEP 1.3 gains a rule — when
  the current branch is `main`, create the feature branch before STEP 2 and go on, never ask. `main` is the literal name, as
  STEP 9 already uses it; a detached HEAD is out of scope. Name:
  `feat/<slug>`, the slug being the plan basename after `PLAN--` in planned mode, and the kebab-case
  name collected at 1.2 in direct mode. A branch of that name that already exists is switched to, not
  recreated. The recommendation of a worktree stays a recommendation. STEP 9's paragraph "This skill
  never creates a branch — STEP 1.3 only recommends one" is rewritten to match; the STEP 9 guard that
  refuses to push `main` stays, as a net. Must NOT lose: the hard stop on the first push, which is a
  different act (shared remote) from creating a local branch.
- **F7** [internal] — `scripts/tests/build-branch-on-main.test.cjs` (new): static read of the source
  `workbench/skills/add-framework--build/SKILL.md` — STEP 1.3 states the branch is created on
  `main` from the plan slug as `feat/<slug>`, and the file no longer contains `never creates a branch`.
  Writes nothing in the checkout.

### Does NOT Include (important!)

- **A new status, or a schema version bump.** `stopped` and `needs-approval` already exist; the gap is
  wording, not shape.
- **Turning a question into `stopped`.** The ticket's wording says `stopped` for both; a question stays
  `needs-approval` because that is the status the resume contract (`--resume <session_id>`) hangs on.
  Both are non-`done` and both fail the F2 exit check, which is what the objective needs.
- **Any edit to a product command or to `add--agent-interaction`.** L1.5 forbids naming the result
  block there, and the product build already creates its branch (`build-setup.cjs`, `DERIVED:true`).
- **Any edit to `/add-framework--done` or `/add-done`.** Refusing `main` is correct; F1/F4 make that
  refusal read as `stopped`, and F6 stops the internal pipeline from reaching it.
- **A wrapper script that runs `claude -p` and sets the exit code.** The guide says there is nothing to
  install; one `jq` line does the same job.
- **Reading the ticket slug for the branch name.** The plan header carries the ticket id, not a slug;
  the plan basename is always present in planned mode.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does the "stopped, not done" rule live? | In the `status`/`reason` descriptions of both schemas | It is the only text the model reads when it fills `structured_output`; L1.5 forbids it in commands |
| Non-zero exit — feasible? | Not from the command. Feasible from the caller: one `jq -e` line in each guide | `claude -p` exits 0 whenever the model finishes; nothing in a prompt changes that |
| A question: `stopped` or `needs-approval`? | `needs-approval`, as today | The resume contract depends on it; it is already non-`done` and fails the exit check |
| Branch creation: headless only, or always? | Always, whenever the internal build starts on `main` | The internal pipeline has no headless flag; a build that commits on `main` is never wanted, since done refuses `main` |
| Branch name | `feat/<plan slug>`; direct mode `feat/<name from 1.2>`; existing branch → switch | Matches the repository's branch names (`feat/agent-mode-session-worktree`); the plan basename always exists |
| Is creating the branch a hard stop? | No | It is local and reversible; the hard stop is the push to a shared remote, which STEP 9 keeps |
| Product build branch | No change | `build-setup.cjs` already creates or derives it, covered by `build-setup.test.cjs` |
| Audit of `add-framework--build` (STEP 3.4) | Not dispatched | The subject is headless stop reporting; the build skill is touched in one step, not the subject |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The two schemas drift in structure while their descriptions change | Low | L1.2 in `cli/tests/agent-mode.test.js` compares them without descriptions; F3 and F5 run beside it |
| The model still fills `done` on a refusal | Medium | F1/F4 put "never done" in the field it reads; F2/F4's exit line makes any non-`done` fail the chain anyway |
| A `feat/` prefix is wrong for a docs-only plan | Low | Branch type is cosmetic for the internal pipeline; done reads the plan, not the prefix |
| F7 proves the text, not that the model creates the branch | Medium | Accepted: F6 is a prompt-only change and a static read is the proof this repository uses for one. The next headless build run on `main` is the live check |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/agent-mode/result.schema.json` | product | modify | F1 — descriptions of `status`, `reason` |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F2 — exit-code line in section 1 |
| `cli/tests/agent-mode.test.js` | product | modify | F3 |
| `workbench/skills/add-final-report/references/result-block.schema.json` | internal | modify | F4 |
| `workbench/skills/add-final-report/references/result-block.md` | internal | modify | F4 |
| `scripts/tests/result-block.test.cjs` | internal | modify | F5 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F6 — STEP 1.3 and STEP 9 |
| `scripts/tests/build-branch-on-main.test.cjs` | internal | create | F7 |

**Graph answers (depth 1).** `add-framework--build`: 3 callers (`add-framework--done`,
`add-framework--plan`, `building-commands`) — **HIGH** by count; the change is local to STEP 1.3/9 and
alters no handoff or output any caller reads. `add-final-report` (owner of `result-block.md`): 9
callers — **HIGH** by count; the change is a reference page no caller parses. The two schema files and
the product `agent-mode/README.md` are not graph nodes (not commands, skills, agents, scripts or
fragments) — **NOT VERIFIED** by the graph; their readers are the two test files above. `AGENTS.md`
is not changed. Delivery index: `add-framework--build` (internal) has no entry; `add-final-report`
(internal) has one `live` entry, nothing `gone` or `superseded`; `agent-mode` (product) has none.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree.

### V1 — Static contract (RED → GREEN)

1. Product schema `status` description contains `never done` and names the refusal on `main`. *RED
   today: the description has neither.* (F1, F3)
2. Product README section 1 contains `jq -e` and states that `claude -p` exits 0. *RED today: absent.* (F2, F3)
3. Internal schema `status` description contains `never done` and names the refusal on `main`. *RED
   today.* (F4, F5)
4. `result-block.md` **How to call** contains `jq -e`. *RED today.* (F4, F5)
5. `add-framework--build/SKILL.md` STEP 1.3 states the branch is created on `main` as `feat/<slug>`
   from the plan slug, and the file does not contain `never creates a branch`. *RED today: STEP 9
   contains it.* (F6, F7)
6. The existing `agent-mode.test.js` test `L1.2` (schemas equal without descriptions) and the status-enum test stay green. (F1, F4)

### V2 — Build

1. `node scripts/build.js` exits 0 with no new warning; `node scripts/build-workbench.js` exits 0.

### V3 — Behavioural acceptance

1. Both checks from F2 — the bash `jq -e` line and the PowerShell `ConvertFrom-Json` line — run against a
   saved envelope whose `status` is `stopped` exit non-zero; against `done`, exit 0. Run once by hand in
   the build, with two hand-written envelope files in a temp dir deleted after; record the four exit
   codes in the ledger.

**RED expectations against the current tree:** V1.1–V1.5 fail; V1.6 and V2 pass.
**GREEN = all levels pass after F1–F7.** Suites through `node scripts/run-tests.js` (cli and scripts),
never `npx vitest` in `cli/`.

---

## Execution Order

- **F1 → F2 → F3** (product): schema first, guide points at it, test pins both.
- **F4 → F5** (internal): the twin of F1–F3.
- **F6 → F7** (internal): independent of the rest.

Each arrow-group leaves the repository working; a build that stops can stop between groups.

## Reviewer Handoff

For each F-block the build must leave: files touched with the F-block id, the validation levels that
cover it and their pass state, and any decision altered with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 assertion was never RED.
2. A schema edit that changed a key, a type, the enum or `v` — L1.2 and the enum test catch it; check
   they ran.
3. F6 dropping or softening the STEP 9 hard stop on the first push, or the guard against pushing `main`.
4. Any mention of json-schema or the result block slipping into a command, skill or agent source (L1.5).

---

## Next Steps

/add-framework--build docs/plans/2026-10-12T203955-PLAN--headless-stop-status.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-12 | Initial creation |
| 2026-10-12 | Review (approved-with-notes): exact exit-check lines for bash and PowerShell, both pinned and run; literal `main` and detached HEAD out of scope; ticket-wording departure stated in the Objective; matrix renamed V1–V3; static-proof risk recorded |
| 2026-10-12 | Implemented in commits c91b1b6..7648d55 on feat/headless-stop-status |

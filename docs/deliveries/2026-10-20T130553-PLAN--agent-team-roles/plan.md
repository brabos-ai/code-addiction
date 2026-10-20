# Plan: agent-team-roles — a team section in the agent-mode guide and two role files

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-20
> **Delivery:** confirm
> **Ticket:** 0054B

---

## Objective

[from conversation, no design document — copied from the intent file's `## Problem`] Onboarding a new agent (several PMs and engineers on the same
codebase) has no guide. The owner wants one sentence: "read role X and use this framework". Docs-only
change; product = `framwork/.codeadd/`. No command or script changes.

**When this build is done:** an owner can start a new agent with "read
`.codeadd/agent-mode/roles/<role>.md` and use this framework". The guide says how several agents share one
codebase and one board without stepping on each other, each of the two roles says what it runs, where it
stops and how it reports, and `/add-help` sends a bot question about teams to those files. Nothing a
command does changes.

**Ticket done when:** README agent-mode has the team section linking roles/product-pm.md and roles/chief-engineer.md (commands, boundaries, when to ask, summary format each); add-help.md points to the roles; npm run build passes and the installed package ships .codeadd/agent-mode/roles/; grep finds no claim that the board locks per ticket.

## Context

Bots already run codeadd commands one at a time through `.codeadd/agent-mode/README.md`. Section 2 of
that guide carries the session rules for one bot (`--resume <session_id>`, one worktree per agent). Nothing
says how a team of agents splits the work, who hands what to whom, or what to do when two of them hit the
board at once.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive them — it
points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-20-agent-team-roles-intent.md` | Path `bounded`, decisions 1–8 (section content, the `roles/` folder, the two roles, no reviewer role, board on/off handoff, one ticket per engineer, the `add-help` pointer, next release), scope, acceptance criteria. `## Open` reads `None` |

The intent file is named `2026-10-20-agent-team-roles-intent.md`, without the `THHMMSS` part the naming
rule asks for. It is read as written; nothing renames it.

## Global Constraints

- Out: any change to commands, scripts, fragments or the board; a reviewer role; per-ticket lock/claim (intent, Scope). `add-help.md` gets a pointer only (intent, Decided 7)
- Drift: the team section must point to section 2 rules, not copy them (intent, Risks)
- A grep finds no claim the board locks per ticket (intent, Acceptance criteria)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js`, which owns test dispatch (AGENTS.md, Key files)

## Problem

1. **No team guide** — the agent-mode guide is written for one bot. An owner running several PMs and
   engineers on one codebase has to explain the split, the handoff and the board rules by hand, every time.
2. **No role to point at** — there is no file an agent can be told to read that says what it owns, what it
   runs, and when it must stop and ask.

## Proposal

Add one numbered section to the guide, two role files in a new `agent-mode/roles/` folder, and one pointer
in `/add-help`. The tests come first and fail on today's tree; the role files come before the README section
that links them; the `add-help` pointer comes last.

**Shipping needs no code change.** `release.yml` zips `framwork/.codeadd/agent-mode` with `zip -r`, and
`copyRelease` in `cli/src/release-copy.js` copies every zip entry under the `framwork/.codeadd/` prefix,
at any depth. A new subfolder rides along. F1 proves it with a test instead of assuming it.

## Scope

### Includes

- **F1** [product] — `cli/tests/agent-mode.test.js` and `cli/tests/add-help.test.js`: add the checks in the
  Validation Matrix (T1.1–T1.7 and T2.1 in `agent-mode.test.js`, T1.8 in `add-help.test.js`). The `T` prefix
  is deliberate: `agent-mode.test.js` already names tests `L1.1`–`L1.10`, and a reused name would collide.
  They are written first and must fail on today's tree. They read files only, except T2.1, which installs
  into a temp dir it deletes at the end. Existing tests stay as they are.
  - **Produces:** the four role headings `## Commands`, `## Boundaries`, `## When to stop and ask`,
    `## Summary format`; the section heading `## 10. Work as a team of agents`
- **F2** [product] — `framwork/.codeadd/agent-mode/roles/product-pm.md` (new folder, new file): the product
  PM role, addressed to the agent that reads it. Carries decision 3's PM bullet: owns scope, release and
  priority; does code analysis grounded in the real code, never from memory; runs `/add-brainstorm` and
  `/add-new` up to `shaped` (intent written, `about.md` created); never implements; before user acceptance,
  checks the delivered result against the intent's acceptance criteria. Carries decision 6: hands one ticket
  to each engineer and records the assignee as a ticket comment through
  `node .codeadd/scripts/backlog-commit.cjs comment <id> --record-file <file>`, the record carrying the one
  field `content` (for example `{"content":"assigned: <engineer>"}`), and says this is a process rule —
  nothing on the board stops a second engineer. Without the board there is no ticket to record it on: the PM
  names which engineer takes which intent file in its summary to the user. Carries decision 5: handoff with the board (the ticket at `shaped`) and
  without it (the intent file under `docs/brainstorm/` and `docs/features/<id>/about.md`).
  - **Consumes:** the four role headings (F1)
  - **Produces:** `roles/product-pm.md`
- **F3** [product] — `framwork/.codeadd/agent-mode/roles/chief-engineer.md` (new file): the chief engineer
  role. Carries decision 3's engineer bullet: takes one ticket and owns it; runs `/add-plan`, `/add-build`,
  then `/add-review` — mandatory before `/add-done` or `/add-pull-request`; resolves every blocker and major;
  leaves minors to the normal deferred flow (`minor (deferred)` ledger lines and `### Known Issues`, plus the
  one deferred-minors ticket the build writes only when the board is on); decides within scope and asks the
  user when scope changes; ends with a summary to the user. Carries decision 5: where it picks the work up
  with the board (a `shaped` ticket assigned to it) and without it (the intent file and `about.md`).
  - **Consumes:** the four role headings (F1)
  - **Produces:** `roles/chief-engineer.md`
- **F4** [product] — `framwork/.codeadd/agent-mode/README.md`: append `## 10. Work as a team of agents`
  after section 9. Sections 1–9 keep their numbers and their text. Carries every rule of decision 1: one
  worktree and one session per agent, by pointing to section 2 (it names section 2 and does not restate its
  list); one ticket per engineer; board writes only through `node .codeadd/scripts/backlog-commit.cjs <mode>`;
  `ERROR=board-locked` means another write holds the board clone's lock, so wait and retry;
  `SYNC_REASON=rebase-conflict`, `push-refused` or `fetch-failed` means stop, report to the user, never
  resolve it, with the commit kept in the board clone under `RECOVERY_REF`; PM → engineer handoff through
  the intent file and the `shaped` status. Carries decision 4 as one line: for a critical or large PR another
  engineer may run `/add-review` in its own worktree. Links both role files. Section 10 sits inside the slice
  the existing `L1.6` test reads (from `## 9. Mirror the board` to the end of the file), so it must not name
  Notion's API (`notion.so`, `@notionhq`, `api.notion`).
  - **Consumes:** `roles/product-pm.md` (F2), `roles/chief-engineer.md` (F3), the section heading (F1)
- **F5** [product] — `framwork/.codeadd/commands/add-help.md`, Type H: one added sentence telling the
  answer to read `.codeadd/agent-mode/roles/` at answer time when the question is about a team of agents or
  a role, the same way it already reads the README. No other line of the command changes.
  - **Consumes:** `roles/product-pm.md` (F2), `roles/chief-engineer.md` (F3)
- **F6** [internal] — `CHANGELOG.md` at the root: one line under `## [Unreleased]` → `### Added` naming the
  agent team section and the two role files. Intent Scope lists "CHANGELOG/release note" as In. The file is
  barely maintained; the line is added anyway because the intent asks for it. The `docs/changelog/` entry
  the build writes at STEP 8 and the release note from `/add-framework--release` happen as usual.

### Does NOT Include (important!)

- Any change to commands (beyond the F5 pointer), scripts, fragments, the board, `release.yml` or
  `cli/src/` — intent Scope
- A reviewer role, and any per-ticket lock or claim — intent Scope
- An assignee field on the ticket — no code change is allowed, so the assignee goes in a comment
- `web/` docs and `README.md` at the root — `/add-framework--sync` regenerates them before the release
- Renumbering sections 3–9 of the guide

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where the team section goes | New `## 10.` at the end | The intent allows "after section 2 or a new numbered section". Inserting after 2 renumbers 3–9, which breaks "section 7" in section 3, "Section 6" in section 5, and the tests that slice on `## 1.`, `## 2.` and `## 9. Mirror the board` |
| How "point to section 2" is checked | Section 10 names section 2 and does not contain `--continue` or `.jsonl` | Those two are the detail of section 2's list. Naming them again is the copy the intent's drift risk warns about |
| How the PM records the assignee | A ticket comment through `backlog-commit.cjs comment <id>` | The ticket has no assignee field (`backlog-core.cjs` write modes), and code changes are out. A comment is an existing write mode |
| How shipping is proven | T2.1 installs the real `agent-mode/` files from an in-memory zip with `copyRelease` | `release.yml` already zips the folder with `-r`; the test proves the installer copies the subfolder instead of trusting the prefix logic |
| CHANGELOG / release note | One line in root `CHANGELOG.md` (F6), plus the usual `docs/changelog/` entry at build STEP 8 and the release note at release | Intent Scope lists it as In, and the ticket's `paths` names `CHANGELOG.md` |
| The "no per-ticket lock" check | A regex over every file under `agent-mode/` must find no lock-on-a-ticket wording | The lock is on the board clone (`backlog-commit.cjs` header, step 4). A denial phrased as "no per-ticket lock" would also fail the grep, so the files say what the lock covers instead |
| Ticket id | `0054B` | The invocation names it. The intent's `ticket:` reads `agent-team-roles`, which is the Notion slug, not an id |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/agent-mode.test.js` | product | modify | F1 — T1.1–T1.7, T2.1 |
| `cli/tests/add-help.test.js` | product | modify | F1 — T1.8 |
| `framwork/.codeadd/agent-mode/roles/product-pm.md` | product | create | F2 |
| `framwork/.codeadd/agent-mode/roles/chief-engineer.md` | product | create | F3 |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F4 — appends section 10 |
| `framwork/.codeadd/commands/add-help.md` | product | modify | F5 — one pointer in Type H |
| `CHANGELOG.md` | internal | modify | F6 — one `### Added` line |

Graph (depth 1): `product/command/add-help` has no dependants — **LOW**. `agent-mode/README.md` and the
new role files are not graph nodes: the graph models commands, skills, agents, scripts and fragments only.
Their readers, found by hand: `add-help.md` Type H, the `codeadd-shell` block of `add-wiki.md`, and
`cli/tests/agent-mode.test.js` / `add-help.test.js`. `add-wiki.md` is not touched. `AGENTS.md` is not
changed. Delivery index (layer `product`): `add-help` has one live entry
(`2026-10-09T092025-PLAN--add-help-guide`), nothing gone or superseded; the agent-mode guide has live
entries only (`2026-10-08T193103-PLAN--product-agent-mode-claude-code`, the session-id and headless-stop
plans), and no role or team file was ever shipped and dropped.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against the
current tree — that is the proof the tests bite. Then drive them GREEN.

### T1 — Static reads (RED → GREEN)

1. `agent-mode/roles/product-pm.md` and `agent-mode/roles/chief-engineer.md` exist, and each carries the four
   H2 headings `## Commands`, `## Boundaries`, `## When to stop and ask`, `## Summary format`, exactly once.
   *RED today: the folder does not exist.*
2. Every `/add-*` named in either role file is a command in `framwork/provider-map.json` (the rule the existing
   `L1.4` applies to the guide, extended to `roles/`). *RED today: no files to read, and the test asserts at least one name.*
3. `chief-engineer.md` contains `/add-plan`, `/add-build`, `/add-review`, `/add-done`, `/add-pull-request`,
   `blocker`, `major`, `minor (deferred)` and `Known Issues`, and states `/add-review` comes before
   `/add-done` and `/add-pull-request`. *RED today: no file.*
4. `product-pm.md` contains `/add-brainstorm`, `/add-new`, `shaped`, `acceptance criteria`, a sentence that it
   never implements, and `backlog-commit.cjs comment`. *RED today: no file.*
5. Both role files contain `shaped`, `-intent.md` and `about.md` — the with-board and without-board handoff.
   *RED today: no files.*
6. The guide has `## 10. Work as a team of agents`. Inside it: `section 2`, `backlog-commit.cjs`,
   `ERROR=board-locked`, `rebase-conflict`, `push-refused`, `fetch-failed`, `RECOVERY_REF`, `shaped`,
   `-intent.md`, `/add-review`, `roles/product-pm.md` and `roles/chief-engineer.md`; and NOT `--continue` or
   `.jsonl`. Sections `## 1.` to `## 9.` are still present with their current headings. *RED today: no
   section 10.*
7. No file under `framwork/.codeadd/agent-mode/` matches
   `/per-ticket (lock|claim)|locks? (the|each|one|a) ticket|ticket is locked|claims? (the|a) ticket/i`.
   *RED today: passes — it is a guard. RED is shown by adding one matching line to a temp copy of the README
   in the test run, checking the test fails, then removing it.*
8. `add-help.md` names `agent-mode/roles/` in its Type H block (between `### Type H` and `### Type I`).
   *RED today: absent.*

### T2 — Install

1. Build an `adm-zip` in memory holding every file under `framwork/.codeadd/agent-mode/` with its
   `framwork/.codeadd/...` entry name, run `copyRelease(zip, tmp, [])`, and assert
   `.codeadd/agent-mode/roles/product-pm.md` and `.codeadd/agent-mode/roles/chief-engineer.md` exist in
   `tmp` byte-equal to the source. The temp dir is deleted at the end. *RED today: no role files to put in
   the zip.*

### T3 — Build and suites

1. `node scripts/build.js` exits 0 with no warning beyond today's count (0).
2. `node scripts/run-tests.js` runs the cli suite with the existing tests green, L1.5 of
   `agent-mode.test.js` included (`add-help.md` must not mention `json-schema` or `result block`).

### T4 — Behavioural acceptance

1. A cold reader given only `roles/chief-engineer.md` and the guide can say which command runs before
   `/add-done`, what happens to a minor finding, and when it must ask the user. Checked by the build's
   readback and its final audit.
2. A cold reader given only `roles/product-pm.md` can say where its work stops, how it hands a ticket over
   with and without the board, and what it checks before user acceptance.

5. F6: `CHANGELOG.md` `## [Unreleased]` carries one line naming the agent team section and the role files.
   Checked by reading the diff; no test reads that file.

**RED expectations against the current tree:** T1.1–T1.6, T1.8 and T2.1 fail; T1.7 passes and is proven to
bite by the injected line. **GREEN = all levels pass after F1–F6.**

---

## Execution Order

1. **F1** [product] — tests first, run RED.
2. **F2** [product] — PM role.
3. **F3** [product] — engineer role.
4. **F4** [product] — guide section 10, which links F2 and F3.
5. **F5** [product] — `add-help` pointer.
6. **F6** [internal] — `CHANGELOG.md` line.

- **F2 and F3 before F4** because section 10 links both files; a link to a missing file is the first thing
  a reader would hit.
- Every boundary after F1 leaves the tree working: the build does not read these files, so a stop after F3
  ships two role files nobody links yet, which is harmless.
- After F4 and F5, run T3.1 (`node scripts/build.js`) as well as the suites.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the intent decision it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. Section 10 restating section 2's list instead of pointing to it, in words the T1.6 negative anchors do
   not catch.
3. A role file that tells the PM it may run `/add-plan` or `/add-build`, or tells the engineer it may skip
   `/add-review` "for a small change".
4. Wording that makes the assignee comment sound like a lock — the one-ticket rule is a process rule.
5. A line in `add-help.md` changed beyond the one Type H pointer.
6. A new test reusing an existing `L1.x` name in `agent-mode.test.js`.

---

## Next Steps

/add-framework--build docs/plans/2026-10-20T130553-PLAN--agent-team-roles.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-20 | Initial creation |
| 2026-10-20 | Review fix-then-ok: new tests take a `T` prefix (B1); the assignee comment names its `--record-file` form and the no-board case (A1); section 10 avoids the `L1.6` Notion patterns (A3); root `CHANGELOG.md` line added as F6, layers now `both` (A4); objective marker names its source (A2) |
| 2026-10-20 | Implemented in fd7f856..6625f76 (F1–F6 and one review-fix commit) |

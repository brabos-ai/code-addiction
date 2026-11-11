# Plan: scripts-via-file — long content goes to a file, never into an inline heredoc

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-25
> **Delivery:** confirm
> **Ticket:** 0009B

---

## Objective

[from conversation, no design document] Agents stop passing long scripts and multi-line bodies
inline in a shell call. Content longer than about 3 lines, or holding any quote, backslash, backtick
or `${}`, is written with the agent's file-write tool to `.codeadd/.temp/<random-slug>.<ext>`, passed
by path, and deleted after use. The framework itself stops prescribing the inline heredoc for PR bodies.

**When this build is done:** the one place the framework still prescribes an inline heredoc (the PR
body in `add-pull-request`) uses `--body-file` over a temp file. The build publish rows point at that
recipe. The rule reaches every agent in a user project through the shipped `codeadd-shell` block, every
agent in this repository through `AGENTS.md`, and every command author through `building-commands`.
A test keeps the heredoc from coming back.

**Ticket done when:** rg -n "<<'?EOF" framwork/.codeadd workbench returns no instruction that inlines a multi-line body; add-pull-request create and update use --body-file with a file under .codeadd/.temp/<random-slug>.md; add-build and add-framework--build publish rows say --body-file; the codeadd-shell block, repo AGENTS.md and building-commands carry the file-not-heredoc rule.

## Context

A ~120-line python script passed as an inline heredoc failed with "unexpected EOF while looking for
matching quote". The same content saved to a file and run as `python <file>` worked on the first try.
It keeps happening with regexes, nested quotes, backticks and `${}`. The framework prescribes the
fragile form itself in `add-pull-request`. The board half of the ticket is already solved by
`backlog-commit.cjs --record-file`.

**Every decision here was taken in the document below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-25T055500-scripts-via-file-intent.md` | Path `bounded`; decisions 1-10 (problem, out-of-scope board half, the rule wording, the `.codeadd/.temp/` location, each file's change, what is not touched); acceptance; `## Open` reads `None` |

## Global Constraints

- The rule, one wording reused everywhere: content longer than about 3 lines, or holding any quote, backslash, backtick or `${}`, is written with the file-write tool to `.codeadd/.temp/<random-slug>.<ext>`, passed by path, and deleted in the same step after use; short one-liners stay inline (intent, decision 3)
- The literal token `.codeadd/.temp/<random-slug>.<ext>` appears in each rule carrier — the `codeadd-shell` block, `building-commands`, `AGENTS.md` (intent, decision 3; asserted by L1)
- No artefact text — rule, recipe or ❌ BAD example — may contain a literal heredoc opener: `rg -n "<<'?EOF" framwork/.codeadd workbench` returns nothing (ticket `done_when`)
- Examples stay stack-agnostic: no language, runtime or project-specific name in the rule or its examples beyond the file extension placeholder `<ext>` (user instruction for this plan)
- No deploy, rollout, publish or release task in this plan (user instruction for this plan)
- Every edit is anchored by quoted text, never by line number (user instruction for this plan)
- The `codeadd-shell` block carries no framework artefact name, no `{{...}}` variable and no HTML comment (`add--agents-md-style`, "The block carries no framework artefact name")
- `node scripts/build.js` exits 0 and emits no new graph warning (AGENTS.md, Pipeline; `add-framework-development` § 9)
- `node scripts/build-workbench.js` exits 0 (AGENTS.md, Internal Layer)
- Tests run through `node scripts/run-tests.js` in the container, never natively (repo test policy, `scripts/run-tests.js` header)

## Problem

1. **The framework prescribes the fragile form** — `add-pull-request` builds the PR body as
   `--body "$(cat <<'EOF' ... EOF)"` on both create and update. A body with an apostrophe, a backtick
   or `${}` breaks the call, and the form does not run in PowerShell at all.
2. **No rule tells an agent what to do instead** — not in a user project's `AGENTS.md`, not in this
   repository's, and not in the authoring rules for commands. Each agent re-learns it by failing.

## Proposal

Fix the one prescribing site, point the two build publish rows at it, and state the rule once per
audience: the shipped runtime block (user projects), `AGENTS.md` (this repository), `building-commands`
(command authors). A test written first fails on today's tree and turns green as each F-block lands.

## Scope

### Includes

- **F1** [product] — `cli/tests/scripts-via-file.test.js` (new): the RED test, written and run before
  any other F-block. It asserts every row of L1 below. It must read files from disk, never snapshot
  them, and must not write into the checkout.
  - **Produces:** `cli/tests/scripts-via-file.test.js`
- **F2** [product] — `framwork/.codeadd/commands/add-pull-request.md`, sections
  "### STEP add-pull-request.publish-create" and "### STEP add-pull-request.publish-update": the body
  (the new body on create, the concatenated body on update) is written with the file-write tool to
  `.codeadd/.temp/<random-slug>.md`; the calls become `gh pr create --title "<title>" --body-file <file>`
  and `gh pr edit <number> --body-file <file>`; deleting the file is its own step right after the `gh`
  call, run whatever the call's exit code — stated as an intent ("delete the temp file"), not as a
  shell-specific command, so it holds on every shell. Replace the two blocks anchored by `gh pr create --title "<title>" --body "$(cat <<'EOF'`
  and `gh pr edit <number> --body "$(cat <<'EOF'`. **Must not lose:** "Title is **never** modified.
  Body is **append-only**.", the concatenation step, "Capture returned URL.", and the guards
  anchored by "IF PR ALREADY EXISTS for current branch:". (intent, decision 5)
  - **Consumes:** `cli/tests/scripts-via-file.test.js` (F1)
- **F3** [product] — `framwork/.codeadd/commands/add-build.md`, the publish table row anchored by
  "| Otherwise, the user says yes | `git push -u origin <branch>`, then `gh pr create`.": the row says
  `gh pr create --body-file <file>` and points at `{{cmd:add-pull-request}}`'s publish recipe instead of
  repeating it. Add `- command: /add-pull-request` to the `<!-- uses:` block at the top, because the
  build's prose gate fails on an undeclared artefact name. **Must not lose:** the ledger line
  `Publish: pr-opened <url>`, and the guard anchored by "IF THE USER HAS NOT ANSWERED:" — the body file
  is written only after the user said yes. (intent, decision 6)
  - **Consumes:** `cli/tests/scripts-via-file.test.js` (F1)
- **F4** [product] — `framwork/.codeadd/commands/add-wiki.md`, the block between
  `[//]: # (codeadd-shell:start)` and `[//]: # (codeadd-shell:end)`: add ONE line carrying the rule of
  Global Constraints, with no artefact name in it. And `framwork/.codeadd/skills/add--agents-md-style/SKILL.md`,
  the sentence anchored by "The Runtime policy managed block adds 6 more.": update the number to the
  block's new line count, counted between the markers the same way the current 6 is counted.
  `commands/add-brainstorm.md` copies the block verbatim from add-wiki and is NOT edited. **Must not
  lose:** the `.codeadd/agent-mode/README.md` pointer (asserted by `agent-mode.test.js` L1.7) and the
  bracket marker form (asserted by `plain-language-rule.test.js` L3.7). (intent, decision 7)
  - **Consumes:** `cli/tests/scripts-via-file.test.js` (F1)
- **F5** [internal] — `workbench/skills/add-framework--build/SKILL.md`, the row anchored by
  "| Yes | `git push -u origin <branch>`, then `gh pr create`. Report the PR URL |": it says
  `gh pr create --body-file <file>` and points at the publish recipe in
  `framwork/.codeadd/commands/add-pull-request.md` by path in backticks. **Do NOT declare it in a
  `uses:` block** — a cross-layer declaration dangles and fails the build (`add-framework-development`
  § 9, "Cross-layer names are skipped by the prose gate"). **Must not lose:** the guard anchored by
  "IF THE BRANCH HAS NO PR AND THE USER HAS NOT ANSWERED:". (intent, decision 6)
  - **Consumes:** `cli/tests/scripts-via-file.test.js` (F1)
- **F6** [internal] — `workbench/skills/building-commands/SKILL.md`, section
  "## Command Blocks: Intent Over Script": add the rule that a command never prescribes a heredoc or an
  inline multi-line body, and prescribes the file route of Global Constraints instead. If it adds a
  ❌ BAD / ✅ GOOD pair, the BAD side describes the heredoc in words and carries no literal opener.
  (intent, decision 9)
  - **Consumes:** `cli/tests/scripts-via-file.test.js` (F1)
- **F7** [internal] — `AGENTS.md`: a new short H2 `## Shell Calls`, placed immediately before
  `## Where the details live`, carrying the rule of Global Constraints in one or two lines and pointing
  at `building-commands` for the authoring side. No mechanics beyond the rule — the file is an overview.
  (intent, decision 8)
  - **Consumes:** `cli/tests/scripts-via-file.test.js` (F1)

### Does NOT Include (important!)

- The board half of the ticket — `backlog-commit.cjs --record-file` already solves it (intent, decision 2)
- `transforms/gemini/commands.md` — its `"""` is TOML syntax, not shell (intent, decision 10)
- Moving the existing `docs/.tmp-<slug>.json` scratch recipes in `workbench/commands/add-framework--backlog.md`
  and `workbench/skills/add-plan-authoring/SKILL.md` — they already use the file route (intent, decision 10)
- Any CLI or installer change — `.codeadd/*` is already gitignored in user projects and here; the agent
  creates `.codeadd/.temp/` when missing (intent, decision 4)
- The `gh pr edit` GraphQL failure some `gh` versions raise on repositories with classic Projects — a
  separate defect of the `gh` call, not of how the body travels. The file route is compatible with the
  REST fallback (`gh api ... -F body=@<file>`) if that is ever adopted
- Any deploy, rollout, publish or release step

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where temp files live | `.codeadd/.temp/<random-slug>.<ext>` | Gitignored everywhere, same path on every branch, slug avoids parallel collisions (intent, decision 4) |
| Rule wording | One wording, in three carriers | intent, decision 3 |
| Delete on failure too | Yes — "after the call, whether it succeeded or failed" | Derived: decision 3 says "in the same step after use"; a failed call is still a use, and a leftover file is harmless but noise |
| Where the rule sits in `AGENTS.md` | New `## Shell Calls` H2 right before `## Where the details live` | Decision 8 left the spot to the planner; a dedicated H2 is findable and keeps the overview sections untouched |
| How add-build points at the recipe | `{{cmd:add-pull-request}}` plus a `command:` uses entry | The prose gate fails on an undeclared name (`add-framework-development` § 9) |
| How add-framework--build points at it | Repo path in backticks, no `uses:` entry | Cross-layer declarations dangle and fail the build (same source) |
| Budget number in `add--agents-md-style` | Updated in the same F-block as the block | Discovery found this number drifted once before (5 vs 6); one commit keeps them equal |
| Where the guard test lives | One new file in `cli/tests/` | Several `cli/tests` files already read `workbench/` and `AGENTS.md`; one file mirrors the ticket's one acceptance |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/scripts-via-file.test.js` | product | create | F1 — the RED guard |
| `framwork/.codeadd/commands/add-pull-request.md` | product | modify | F2 — `--body-file` on create and update. Graph depth-1: 3 dependants → **HIGH** |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F3 — publish row and `uses:` entry. Depth-1: 26 → **HIGH** |
| `framwork/.codeadd/commands/add-wiki.md` | product | modify | F4 — one line in the `codeadd-shell` block. Depth-1: 17 → **HIGH** |
| `framwork/.codeadd/skills/add--agents-md-style/SKILL.md` | product | modify | F4 — the block's line count. Depth-1: 5 → **HIGH** |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F5 — publish row. Depth-1: 3 → **HIGH** |
| `workbench/skills/building-commands/SKILL.md` | internal | modify | F6 — authoring rule. Depth-1: 5 → **HIGH** |
| `AGENTS.md` | internal | modify | F7 — `## Shell Calls`. Not a graph node; checked by hand and by L1 |

The HIGH grades come from the threshold (3+ direct dependants). Every change is additive text inside
one section, and no dependant reads the changed lines as a contract except the two existing tests named
in F4, which L2 re-runs. `add-pull-request`'s fragment (`fragments/agent-mode/add-pull-request.md`)
was checked: it does not touch the publish steps. The delivery index has no `gone` or `superseded`
entry for any of these artefacts, in either layer.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 is written and run BEFORE any other F-block lands, and each assertion
below must fail against the current tree. Then F2-F7 drive them GREEN.

### L1 — Guard test, `cli/tests/scripts-via-file.test.js` (RED → GREEN)

1. No `.md` file under `framwork/.codeadd/` or `workbench/` has a line matching `<<'?EOF` (the ticket's
   `rg`, as a test). *RED today: `add-pull-request.md` has two.*
2. The `publish-create` section of `add-pull-request.md` contains `--body-file` and `.codeadd/.temp/`,
   and no `--body "$(`. *RED today: it holds the heredoc form.*
3. The `publish-update` section does the same, and still contains "Title is **never** modified" and
   "append-only". *RED today: heredoc form.*
4. The `add-build.md` table line starting `| Otherwise, the user says yes` contains `--body-file` and
   `add-pull-request`, and the `uses:` block declares `/add-pull-request`. Select the row by that
   prefix, never by `gh pr create` — the guard lines carry that string too. *RED today: neither.*
5. The `codeadd-shell` block in `add-wiki.md` contains `.codeadd/.temp/<random-slug>.<ext>` and still
   contains `.codeadd/agent-mode/README.md`. *RED today: no rule line.*
6. **Drift guard, green before and after F4 — the one L1 row that is not RED.** The number
   `add--agents-md-style` states for the Runtime policy block equals the block's line count in
   `add-wiki.md`. Count every line strictly between the two marker lines, blank lines included: today
   that is 6 (blank, heading, three text lines, blank), and after F4 it is 7. The ledger notes that this
   row was green at F1 by design.
7. The `workbench/skills/add-framework--build/SKILL.md` table line starting
   `| Yes | \`git push -u origin <branch>\`` contains `--body-file`. Select it by that prefix, never by
   `gh pr create` — the guard lines carry that string too. *RED today.*
8. The "## Command Blocks: Intent Over Script" section of `building-commands/SKILL.md`, and `AGENTS.md`,
   each contain `.codeadd/.temp/<random-slug>.<ext>`. *RED today.*

### L2 — Build and existing suites

1. `node scripts/build.js` exits 0, and its graph warning count is not higher than on `main` before F1.
2. `node scripts/build-workbench.js` exits 0.
3. The built `add-pull-request.md` in every provider output directory carries `--body-file` and no
   heredoc opener (the build strips nothing from those lines; this proves they ship).
4. `node scripts/run-tests.js framework` in the container is green — including `agent-mode.test.js` L1.7,
   `plain-language-rule.test.js` L3.7 and `brainstorm-greenfield.test.js`, which read the
   `codeadd-shell` block.

### L3 — Behavioural acceptance

1. `gh pr create --help` and `gh pr edit --help` both list `--body-file` — the recipe names a real flag.
2. Read-through: an agent following `publish-update` alone gets the order right — fetch the existing
   body, build the update section, write the concatenation to the temp file, call `gh pr edit
   --body-file`, delete the file. No step left implicit.

**RED expectations against the current tree:** L1.1-L1.5, L1.7 and L1.8 fail; L1.6 is a drift guard
and passes before and after F4.
**GREEN = all levels pass after F1-F7.**

---

## Execution Order

1. **F1** [product] — first, because every other F-block is proven by it. Run it; record the RED.
2. **F2** [product] — the recipe F3 and F5 point at must exist before they point at it.
3. **F3** [product]
4. **F4** [product] — block line and budget number in one commit.
5. **F5** [internal]
6. **F6** [internal]
7. **F7** [internal]
8. L2 and L3.

Every boundary after F2 leaves the repo in a working state: each F-block is additive text in one
section. A build that must stop after any F-block leaves only some L1 rows green, nothing broken.

Beyond the layer default, run L2.1 after F3 (the `uses:` entry is the one change the build gate judges).

## Reviewer Handoff

For each F-block the build must leave in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the intent decision it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 row was never RED — a test written after the fix proves nothing.
2. A ❌ BAD example in F6 that quotes a literal heredoc opener — it passes review by eye and fails L1.1.
3. The three rule carriers drifting apart in wording — compare F4, F6 and F7 against Global Constraints.
4. The F4 line naming a framework artefact — the block must name none.

---

## Next Steps

/add-framework--build docs/plans/2026-10-25T073302-PLAN--scripts-via-file.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-25 | Initial creation |
| 2026-10-25 | Review fix-then-ok: L1.4 and L1.7 select rows by their table prefix, not by `gh pr create` (A1); L1.6 fixes the line-counting rule (6 today, 7 after F4) and is stated as a drift guard (A2); F2's delete is its own shell-neutral step (N1) |
| 2026-10-25 | Implemented on feat/0009b-scripts-via-file: F1-F7 plus review fixes (commits e93304d..HEAD) |

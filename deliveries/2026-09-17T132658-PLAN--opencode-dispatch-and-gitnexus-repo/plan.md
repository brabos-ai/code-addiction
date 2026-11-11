# Plan: OpenCode Dispatch and GitNexus Repo — dispatch without an invented resume id, GitNexus with the right repo

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-09-17
> **Delivery:** automatic

---

## Objective

When `add.build` and the other product commands run in OpenCode, subagent dispatch and GitNexus calls
succeed on the first attempt: a subagent is created without an invented resume id, and GitNexus receives
the correct `repo` whenever more than one repository is indexed. Today both only succeed after failing.

The `repo` half applies to every provider — the failure depends on the GitNexus index, not on the engine.

**When this build is done:** every product command that dispatches a subagent reads one shared,
provider-neutral rule that forbids filling a resume or session field on a fresh dispatch; `add.build`
receives GitNexus guidance when the plugin is enabled; and every GitNexus fragment carries the repo
rule itself, so a session reaches it without loading `add-gitnexus`. Tests lock all three.

## Context

A `/add.build` run in OpenCode on a user project failed twice at `@backend-agent` dispatch
(`Expected a string starting with "ses", got "<uuid>"`) and once at `gitnexus_impact`
(`Multiple repositories indexed. Specify which one with the "repo" parameter`).

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-17T131724-opencode-dispatch-and-gitnexus-repo.md` | Discovery, alternatives rejected, marker placement, the `add.review` exclusion, ecosystem impact with callers |
| `docs/brainstorming/2026-09-17T131724-opencode-dispatch-and-gitnexus-repo-intent.md` | Path `architectural`, `delivery: automatic`, the closed decisions, `## Open` = None |

## Global Constraints

- The dispatch rule names no provider and no provider-specific parameter (intent file, Decided)
- Never write a raw `.codeadd/` path; use `{{skill:NAME/FILE}}` (CLAUDE.md, Pipeline)
- HTML comments are stripped at build; `<!-- uses: -->` declares every skill target (CLAUDE.md, Pipeline)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Agents excluded from gitnexus injection stay excluded: `feature-history-agent`, `git-history-agent`, `readback-agent` (`cli/tests/gitnexus-plugin.test.js`, `EXCLUDED_AGENTS`)

## Problem

1. **Fresh dispatch fills a resume field** — no dispatch site says a new dispatch leaves resume/session
   fields empty; a model that fills every optional field breaks OpenCode's task tool.
2. **The repo rule is one indirection away** — it lives only in `add-gitnexus`; `add.build` has no
   gitnexus fragment at all, and the fragments that exist only point at the skill.

## Proposal

Two independent additive changes, tests first. A small shared reference carries the dispatch rule and
seven commands point at it. The gitnexus plugin gains an `add.build` fragment and every gitnexus
fragment states the repo rule inline in one line.

## Scope

### Includes

#### T1 — Dispatch rule (ref: design, Proposed Solution Part 1)

- **F1** [product] — `cli/tests/dispatch-rules.test.js` (new): asserts (a)
  `framwork/.codeadd/skills/add-subagent-driven-development/references/dispatch-rules.md` exists and
  states that a fresh dispatch leaves resume/session fields empty and only an id returned by an earlier
  dispatch in the same session is passed; (b) every file under `framwork/.codeadd/commands/` containing
  `DISPATCH AGENT` references `{{skill:add-subagent-driven-development/references/dispatch-rules.md}}`
  and declares it in its `<!-- uses: -->` block; (c) the reference names no provider (`opencode`,
  `claude`, `codex`, `cursor`, `antigravity`, `ses_`, `task_id`, case-insensitive). Must be RED on the
  current tree.
  - **Produces:** `dispatch-rules.test.js`
- **F2** [product] — `framwork/.codeadd/skills/add-subagent-driven-development/references/dispatch-rules.md`
  (new): a few lines stating the rule. No provider named. `SKILL.md` body unchanged.
  - **Produces:** `references/dispatch-rules.md`
- **F3** [product] — `add.audit.md`, `add.build.md`, `add.diagnose.md`, `add.hotfix.md`, `add.plan.md`,
  `add.review.md`, `add.wiki.md` under `framwork/.codeadd/commands/`: one pointer line where the command
  introduces its dispatches (before its first `DISPATCH AGENT` block, or its existing dispatch-rules
  section where one exists), plus the `<!-- uses: -->` declaration. Must not alter any existing step.
  - **Consumes:** `references/dispatch-rules.md` (F2), `dispatch-rules.test.js` (F1)

#### T2 — GitNexus repo rule (ref: design, Proposed Solution Part 2)

- **F4** [product] — `cli/tests/gitnexus-plugin.test.js`: `injects exactly the six target commands`
  becomes seven, adding `add.build`; new test — every `.md` under
  `framwork/.codeadd/plugins/gitnexus/fragments/` (commands and `agents/`) states the repo rule
  (mentions `list_repos` and the `repo` parameter). Must be RED on the current tree.
  - **Produces:** `gitnexus-plugin.test.js` repo-rule assertion
- **F5** [product] — `framwork/.codeadd/commands/add.build.md`: new `<!-- plugin:gitnexus:graph-build -->`
  marker pair at STEP 10.0, before the first dispatch or edit, so the guidance lands before any caller
  lookup. `framwork/.codeadd/plugins/gitnexus/fragments/add.build.md` (new): one `section:graph-build`
  block following the shape of `fragments/add.plan.md`, with `<!-- uses: - skill: add-gitnexus -->`,
  and carrying the one-line repo rule from creation — F6 does not revisit this file.
  `cli/src/plugins.json` → `gitnexus.injects` gains `add.build`. The marker must not sit inside a
  `tdd-pipeline` or `qa-pipeline` section.
  - **Produces:** `plugin:gitnexus:graph-build`
  - **Consumes:** `gitnexus-plugin.test.js` repo-rule assertion (F4)
- **F6** [product] — the 15 pre-existing gitnexus fragments (6 under `plugins/gitnexus/fragments/`, 9 under
  `plugins/gitnexus/fragments/agents/`; `add.build.md` already has it from F5): one line inside each existing section — more than one repo
  indexed → call `list_repos` first and pass `repo` on every GitNexus call. The pointer to
  `add-gitnexus` stays.
  - **Consumes:** `plugin:gitnexus:graph-build` (F5), `gitnexus-plugin.test.js` repo-rule assertion (F4)

### Does NOT Include (important!)

- A gitnexus marker or fragment for `add.review` — its orchestrator never calls GitNexus; `@reviewer-agent` is covered by F6
- Any text naming a provider or its task-tool parameter
- Moving the "You are the coordinator" block out of `add.wiki`
- Changes to `add-gitnexus`'s protocol
- Build-time per-provider text injection

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does the dispatch rule live? | `add-subagent-driven-development/references/dispatch-rules.md` | One owner, no 595-line load — design, Key Decisions |
| Does it name a provider? | No | User decision — design, Alternatives |
| Which commands point at it? | Every command containing `DISPATCH` (eight — `add.new` added by build ruling) | F1(b) locks future commands too |
| Which commands get a new gitnexus fragment? | `add.build` only | Design, `add.review` exclusion |
| Where does the repo rule go? | Inline in all 16 gitnexus fragments, every provider | Design, Key Decisions |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A neutral rule is too vague to connect to a task tool's field | Medium | F2 words it around "resume" and "session id"; L3 acceptance re-run in OpenCode |
| The new `add.build` marker breaks existing injection anchors | Low | L2 injection-point test for `add.build` (existing loop in F4's file) + full `cli` suite |
| The 16 inline copies drift | Medium | F4 repo-rule assertion |
| A future dispatching command skips the pointer | Medium | F1(b) scans every command containing `DISPATCH AGENT` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/dispatch-rules.test.js` | product | create | F1 |
| `framwork/.codeadd/skills/add-subagent-driven-development/references/dispatch-rules.md` | product | create | F2 |
| `framwork/.codeadd/commands/add.audit.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F3, F5 |
| `framwork/.codeadd/commands/add.diagnose.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.hotfix.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F3 (build ruling) |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add.wiki.md` | product | modify | F3 |
| `cli/tests/gitnexus-plugin.test.js` | product | modify | F4 |
| `framwork/.codeadd/plugins/gitnexus/fragments/add.build.md` | product | create | F5 |
| `cli/src/plugins.json` | product | modify | F5 |
| `framwork/.codeadd/plugins/gitnexus/fragments/{add.diagnose,add.done,add.hotfix,add.new,add.plan,add.wiki}.md` | product | modify | F6 |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/{architecture,backend,database,discovery,frontend,reviewer,system-design,ux,ux-flow}-agent.md` | product | modify | F6 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 and F4 land before any other F-block and must fail against the current tree.

**Expected end-state map (plugin injection):** `plugin:gitnexus` injects into seven commands —
`add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.wiki` — and the nine
agents unchanged. `add.build` receives exactly one new section, `graph-build`.

### L1 — Unit (RED → GREEN)

1. `dispatch-rules.test.js` (a) reference exists with the rule. *RED today: file absent.*
2. `dispatch-rules.test.js` (b) all seven dispatching commands point at it. *RED today: no pointer.*
3. `dispatch-rules.test.js` (c) no provider named. *RED today: file absent.*
4. `gitnexus-plugin.test.js` injects equals the seven commands above. *RED today: six.*
5. `gitnexus-plugin.test.js` all 16 fragments carry the repo rule. *RED today: fragment for `add.build` absent, others lack the line.*

### L2 — Integration

1. `node scripts/build.js` exits 0 with no new warning; the `uses` gates resolve the new skill reference and the new fragment.
2. `add.build` resolves to `plugin:gitnexus` injection points (existing loop in `gitnexus-plugin.test.js`).
3. The full `cli` suite passes (CI is the verdict — local runs rewrite sidecars).

### L3 — Behavioural acceptance

1. In a project with `gitnexus` enabled, `codeadd plugins enable gitnexus` injects the `graph-build` section into the installed `add.build`, and disabling removes it byte-clean (covered by the existing plugin round-trip tests; confirm they include the new target).
2. Manual, post-merge: `/add.build` in OpenCode dispatches a subagent without a `task_id` error and calls GitNexus with `repo` on the first attempt, with two repos indexed. Recorded as a follow-up check, not a merge gate.

**RED expectations against the current tree:** L1.1–L1.5 fail.
**GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 → F4 → F2 → F3 → F5 → F6

- **F1 and F4 first** — RED proof before any artefact changes.
- **F2 before F3** — the pointer must resolve at build.
- **F5 before F6** — F5 creates `add.build.md` with the repo line; F6 adds it to the other 15, reaching 16.
- Working-tree boundaries: after F3 (T1 complete, L1.1–L1.3 GREEN) and after F6 (all GREEN).

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, validation levels covering it and their
state, and any departure from the design with its section.

Gaps a reviewer must hunt:

1. An F-block marked done whose validation level was never RED.
2. A dispatching command whose pointer sits after a `DISPATCH AGENT` block it should precede.
3. A fragment whose repo line landed outside its `section:` block and is therefore never injected.

## References

- Design set: `docs/brainstorming/2026-09-17T131724-opencode-dispatch-and-gitnexus-repo.md`, `-intent.md`
- Prior art: `2026-09-13T100745-PLAN--readonly-agent-dispatch-capability` — closing a gap silent on Claude; the current branch's `build-end-to-end-non-claude` — three other OpenCode failures fixed at one source

---

## Next Steps

/add-framework--build opencode-dispatch-and-gitnexus-repo

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-17 | Initial creation |
| 2026-09-17 | Review fix: F5 writes the repo line into the new `add.build.md` fragment; F6 scoped to the 15 pre-existing fragments, so the Impact table and the 16-fragment end state agree |
| 2026-09-17 | Implemented in edbe136..be8b041 (F1-F6 plus F7, the add-ecosystem table cell from review). Build rulings: `add.new` joined the dispatching commands; four count-lock tests moved |

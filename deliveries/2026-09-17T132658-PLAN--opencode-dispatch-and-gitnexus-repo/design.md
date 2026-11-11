# Brainstorm: Dispatch Without an Invented Resume Id, and GitNexus With the Right Repo

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-17
> **Type:** architecture

## Objective

When `add.build` and the other product commands run in OpenCode, subagent dispatch and GitNexus calls
succeed on the first attempt: a subagent is created without an invented resume id, and GitNexus receives
the correct `repo` whenever more than one repository is indexed. Today both only succeed after failing.

The `repo` half applies to every provider — the failure depends on the GitNexus index, not on the engine.

## Discovery

- `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/SKILL.md` — sole owner of the repo-resolution
  protocol (`list_repos`, pick this project, pass `repo` on every call). Reached only through a plugin
  fragment that says "load skill `add-gitnexus`".
- `cli/src/plugins.json` → `gitnexus.injects` — six commands: `add.new`, `add.plan`, `add.diagnose`,
  `add.hotfix`, `add.done`, `add.wiki`. **`add.build` and `add.review` carry no marker and no fragment**
  (graph-confirmed: no gitnexus `INJECTS_INTO` edge on either). The failure in the report happened in the
  `add.build` main session, which called `gitnexus_impact` on its own without ever reading the rule.
- Nine agent fragments (`plugins/gitnexus/fragments/agents/*.md`) — one-line pointers to `add-gitnexus`;
  the repo rule itself is not in them.
- `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` (595 lines) — says "use your
  platform's subagent mechanism" and nothing about a task tool's resume field.
- No artefact in `framwork/.codeadd`, `.claude` or `cli/src` mentions a task-tool resume or session id.
  Every `resume` hit is the build-ledger resume rule, a different mechanism.
- Seven product commands carry `DISPATCH AGENT` blocks: `add.audit`, `add.build`, `add.diagnose`,
  `add.hotfix`, `add.plan`, `add.review`, `add.wiki`. No shared dispatch-rules file is loaded by all of them.
- [Plan `build-end-to-end-non-claude`] — the current branch; fixed three other OpenCode-only failures by
  correcting a single source rather than each call site.
- [Plan `readonly-agent-dispatch-capability`] — precedent for closing a gap that is silent on Claude and
  load-bearing elsewhere.

## Context & Motivation

Running `/add.build` in OpenCode on a user project surfaced two failures in one session:

1. `gitnexus_impact` → `Error: Multiple repositories indexed. Specify which one with the "repo" parameter.`
   The model retried with `repo=` and succeeded — one wasted call per session, and a silent grep
   fallback on a model that does not recover.
2. Dispatching `@backend-agent` through OpenCode's task tool failed twice with
   `Expected a string starting with "ses", got "<uuid>"`. The model filled the task tool's optional
   resume field with an invented UUID on a fresh dispatch.

## Problem / Opportunity

- The repo rule lives one indirection away from every place that calls GitNexus. A session that never
  loads `add-gitnexus` — including a command with no gitnexus fragment at all — never sees it.
- No dispatch site says that a fresh dispatch leaves resume/session fields empty, so a model that
  fills every optional field breaks the dispatch.

## Proposed Solution

**Part 1 — dispatch rule, in a small shared reference.**
Create `add-subagent-driven-development/references/dispatch-rules.md`: a few lines, naming no provider.
The rule: a new dispatch never fills a resume or session field; pass only an id that an earlier dispatch
in this same session returned. The seven dispatching commands point at it with
`{{skill:add-subagent-driven-development/references/dispatch-rules.md}}` and declare it in their
`<!-- uses: -->` block.

**Part 2 — GitNexus repo rule where GitNexus is called.**
- Add a `graph` plugin marker and fragment to `add.build`; add it to `gitnexus.injects` in
  `cli/src/plugins.json`.
- Every gitnexus fragment — seven command fragments (six existing plus one new) and nine agent
  fragments — states the repo rule inline in one line: more than one repo indexed → call `list_repos`
  first and pass `repo` on every call. The pointer to `add-gitnexus` stays for the rest of the mechanics.

Marker placement (decided, derivable): `add.build` — the path where the main session edits code itself
(DIRECT strategy), before changing a function or signature.

`add.review` is deliberately NOT given a marker: its orchestrator has no step that calls GitNexus and
delegates all changed-code review to `@reviewer-agent`, whose own gitnexus fragment gains the repo line.

Alternatives considered:

| Alternative | Why not |
|---|---|
| `scripts/build.js` injects an OpenCode-only note into dispatching commands | User chose a shared, provider-neutral rule over build-time provider text |
| One neutral line repeated in each of the seven commands | Seven copies drift, and a new command forgets it |
| Load the whole `add-subagent-driven-development` in all seven | 595 lines per command for one rule |
| A new `add-agent-dispatch` skill | A reference file needs no `provider-map.json` entry and no new node |
| Repo rule only in existing fragments | Does not cover `add.build`, the command in the report |
| Name OpenCode's `task_id`/`ses_` in the rule | User chose a neutral rule with no provider named |

## Type of Artefact

architecture — one new skill reference, one new plugin fragment, edits to commands, fragments,
plugin catalog and tests.

## Scope

### Includes
- New `framwork/.codeadd/skills/add-subagent-driven-development/references/dispatch-rules.md` [product]
- Pointer + `uses` declaration in `add.audit`, `add.build`, `add.diagnose`, `add.hotfix`, `add.plan`,
  `add.review`, `add.wiki` [product]
- New marker in `add.build`; new `plugins/gitnexus/fragments/add.build.md` [product]
- `cli/src/plugins.json` `gitnexus.injects` gains `add.build` [product]
- One-line repo rule in all 16 gitnexus fragments [product]
- `cli/tests/gitnexus-plugin.test.js`: injects expectation becomes seven commands; new assertion that
  every gitnexus fragment carries the repo rule [product]

### Does NOT Include
- The "You are the coordinator" capability block in `add.wiki` — unchanged, not moved
- Any text naming a specific provider or its task-tool parameter
- Changes to `add-gitnexus`'s protocol itself
- Build-time per-provider text injection
- A gitnexus marker or fragment for `add.review` — no call site; covered through `@reviewer-agent`

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| Dispatch rule lives in one reference under `add-subagent-driven-development` | dispatch succeeds first time | One owner, loaded by path, no 595-line load | ✅ |
| The rule names no provider | dispatch succeeds first time | Holds for any engine whose task tool has a resume field | ✅ |
| All seven dispatching commands point at it | dispatch succeeds first time | Every `DISPATCH AGENT` site reaches the rule | ✅ |
| Only `add.build` gets a new gitnexus fragment | GitNexus receives the right `repo` | The reported failure came from `add.build`, which had none; `add.review` never calls GitNexus itself | ✅ |
| The repo rule is inline in every gitnexus fragment | GitNexus receives the right `repo` | The rule reaches a session that never loads `add-gitnexus` | ✅ |
| The repo rule applies to every provider | GitNexus receives the right `repo` | The error comes from the index, not the engine | ✅ |
| Marker placement in build on the DIRECT edit path | GitNexus receives the right `repo` | That is where the main session reads callers before editing | ✅ |

## Ecosystem Impact

| Component | Layer | Called by | Impact | Action |
|-----------|-------|-----------|--------|--------|
| `add-subagent-driven-development` | product | `add.build`, `add.qa-setup`, `add-qa-migration`, `add-review-discipline` | Gains a reference file; SKILL.md body unchanged | Add `references/dispatch-rules.md` |
| `add.build` | product | `add`, `add.done`, `add.new`, `add.plan`, `add.qa-setup`, `add.review`, `consistency-agent`, `ux-agent`, skills `add-architecture-discovery`, `add-code-review`, `add-commit`, `add-cross-sf-consistency`, `add-id-convention`, `add-qa`, `add-qa-migration`, `add-review-discipline`; fragments `tdd-pipeline/add.build.md`, `qa-pipeline/add.build.md` (inject), `qa-pipeline/add.review.md` | New marker + dispatch pointer | Edit; verify marker does not collide with tdd/qa sections |
| `add.review` | product | `add`, `add.build`, `add.done`, `add.plan`, `add.qa-setup`, `consistency-agent`, `e2e-agent`, `qa-agent`, `ux-agent`, skills `add-delivery-validation`, `add-id-convention`, `add-qa`, `add-qa-migration`; fragments `qa-pipeline`, `tdd-pipeline`, `playwright` (inject) | Dispatch pointer only | Edit |
| `add.audit` | product | `add-doc-schemas` | Dispatch pointer | Edit |
| `add.diagnose` | product | `add`, `add.brainstorm`, `add-investigation`; gitnexus fragment (inject) | Dispatch pointer | Edit |
| `add.hotfix` | product | `add`, `add.brainstorm`, `add.diagnose`, `add.done`, `add-doc-schemas`, `add-investigation`; `tdd-pipeline` and gitnexus fragments (inject) | Dispatch pointer | Edit |
| `add.plan` | product | `add`, `add.build`, `add.diagnose`, `add.new`, `add.review`, `consistency-agent`, `test-agent`, `ux-agent`, `ux-flow-agent`, 7 skills, `qa-pipeline`/`tdd-pipeline`/gitnexus fragments | Dispatch pointer | Edit |
| `add.wiki` | product | `add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.review`, `conformance-agent`, 7 skills, gitnexus fragment (inject) | Dispatch pointer | Edit |
| `add-gitnexus` | product | the 15 current gitnexus fragments + `plugin/gitnexus` (contains) | None to its body; gains one new caller | none |
| 15 existing gitnexus fragments | product | inject into their command/agent (graph edges above) | Add the one-line repo rule | Edit |
| `cli/src/plugins.json` | product | Not a graph node — NOT VERIFIED by graph; read by `cli/src/plugins.js` and `cli/tests/gitnexus-plugin.test.js` | `injects` grows to seven | Edit |
| `cli/tests/gitnexus-plugin.test.js` | product | Not a graph node | Expectation six → seven; new repo-rule assertion | Edit |

`add.qa-setup` also appears in the `add-subagent-driven-development` caller list but carries no
`DISPATCH AGENT` block today, so it is not in the seven. `CLAUDE.md`'s Plugin System section names no
command list and needs no change.

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Dispatch and GitNexus calls succeed first time on every provider | Seven commands grow by a pointer line each |
| Repo rule reaches sessions that never load the skill | The one-line rule is repeated in 16 fragments (guarded by a test) |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A neutral rule is too vague for a model to connect to its task tool's field | Med | Word it around "resume" and "session id", the terms task tools use; re-run `/add.build` in OpenCode to confirm |
| The new marker in `add.build` breaks existing injection anchors | Low | `cli` injection tests and `injection-points.json` build output |
| The 16 inline copies drift from `add-gitnexus` | Med | New test asserts the rule in every gitnexus fragment |

## Next Steps

Run: `/add-framework--plan opencode dispatch and gitnexus repo`

---
path: bounded
topic: next-step-command-carries-path
doc: none
delivery: confirm
ticket: 0024B
---

## Objective
When brainstorm, plan or build closes, its last line is the next command carrying the full relative path of the file it just wrote (`/<command> @<path>`), so the user copies one line and pastes it — no argument to assemble, no guessing which file of a same-timestamp set is meant.

## Decided
- The continuation-line rule lives once, in `workbench/skills/add-final-report/SKILL.md`; brainstorm, plan and build point at it — the three already load it at their closing step.
- Format `/<command> @<relative path>`; the path is the file the step itself wrote, checked with `test -f` before printing, never rebuilt from the slug — a plan set shares one timestamp, so a slug is ambiguous.
- Invocation spelling follows the provider's `slashCommands` capability (`/` on claude and opencode, the skill form on codex); `@<path>` is the same on all three. Where `@` does not attach the file, the path is still literal and the next stage reads it.
- Brainstorm STEP 7.3 prints `/add-framework--plan @<intent file>`; the `Design:` line stays as a reference on `architectural`; the design template's Next Steps follows the rule.
- Plan STEP 6 replaces `[slug]` with `/add-framework--build @docs/plans/<ts>-PLAN--<slug>.md` and `/add-framework--plan @<same>` to revise.
- Build STEP 10 prints `/add-framework--done @<the plan path>` — the plan, not the ledger, because Argument Resolution excludes `--ledger` companions. Build still never loads done.
- `add-plan-authoring` Argument Resolution strips `@`, the directory and `.md` before the basename match (serves plan, build and done). A path under `docs/brainstorming/` is a new-idea input read from that intent file; a path under `docs/plans/` is Continue Mode.
- Automatic delivery prints the same line before loading the next stage.
- Proof: the `test -f` check inside the step, plus a new `cli/tests/` test asserting the three closings point at the rule, none still prints `[slug]` / `[idea]` as the argument, and Argument Resolution accepts `@path` — the same text-assertion approach as product ticket 0018B's `chat-continuation-handoff.test.js`.
- Out of scope: product `framwork/.codeadd/skills/add--final-report/SKILL.md` (the ticket says not to change it), done as an emitter, any new script.
- All affected artefacts are `[internal]`.
- Graph callers: add-final-report ← backlog, release, sync, brainstorm, build, done, plan, add-plan-authoring, building-commands; add-plan-authoring ← brainstorm, build, done, plan. Brainstorm, plan and build: NOT VERIFIED — the shell route to `scripts/graph.js` was blocked by permissions in the brainstorm session; the plan's STEP 3 asks the graph.

## Open
None

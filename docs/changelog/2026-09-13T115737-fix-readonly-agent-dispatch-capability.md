# Read-only agent dispatch capability

A read-only agent is never asked to write, the build enforces that on Claude instead of merely
stating it, and a test stops the shape from coming back.

## The defect

`/add.plan` STEP 10.4 dispatched `@architecture-agent` to write `tasks.md`. The agent declares
`readonly: true`, so it refused — and on Claude the refusal is prose in the agent's own body, not an
error. The command carried on and the file was simply missing.

The reason was structural, not local. `scripts/build.js` renders `readonly: true` into whatever each
provider enforces: OpenCode gets `permission: edit: deny`, Cursor gets `readonly: true`. The Claude
dialect emitted nothing, so on the primary provider the constraint was text an agent could decline
by. Nine of twelve read-only agents hand-declared `disallowedTools` to compensate; three never did.

## What changed

**The dispatch sites.** Three in `/add.plan` — STEP 3 (`@discovery-agent` → `past-features.md`),
STEP 10.4 (`@architecture-agent` → `tasks.md`), STEP 10.5 (who edits `plan.md`). Each agent now
returns its document in its report and the step writes the file. An empty report stops the step
instead of creating an empty file.

**The skills those agents load.** `add-tasks-checklist`'s architect template and
`add-feature-discovery` Phase 1.5 both ordered a write. A skill reaches the agent through its own
frontmatter, so fixing the command alone left the contradiction intact one hop away.

**`/add.build`'s per-area validator.** `@reviewer-agent` is read-only and was ordered to write
`tasks.md` and to apply code fixes. It now emits a tick report; `add.build` merges and writes, and
`@fix-agent` corrects — the contract `/add.plan-to-ready` already ran. One behaviour, whichever
command dispatches.

**The build.** `AGENT_DIALECTS.claude` emits `disallowedTools: Write, Edit, NotebookEdit` when the
source declares `readonly: true` and declares none of its own. A source declaration still wins, so
the three agents denying `Bash`, `Grep` or `Glob` on top keep their wider list.

**The graph.** Agent nodes carry `readonly`, read through the same predicate the dialects use.

**The gate.** `cli/tests/agent-capability.test.js` asserts the emitted header for every read-only
agent, and walks every `DISPATCHES` edge into one looking for a file `Output:`. Its header states
what it cannot see, because a gate that overstates its reach stops the next reader looking.

## Also fixed

`/add.plan` required `## Quality Gates` in `tasks.md`; the canonical schema names it
`## Validation Gates`. Validators parse by exact text, so a `tasks.md` written to the command failed
the schema. `/add.plan` was the last writer of the old heading; the compatibility note stays, because
files already on disk in users' projects still carry it.

## Not covered

Behavioural acceptance. Every level here is static — rendered headers, graph shape, text scans. No
`/add.plan` or `/add.build` run was executed end to end, and the `add-feature-discovery` defect is
the concrete evidence that the gap costs something: it was found by reading, not by running.

Two instances of the pattern stay on disk by decision, both recorded: `add.new.md`'s past-features
dispatch names no `@agent`, so it resolves to a read-write generic subagent and nothing is broken;
and seven of eight internal agents are documented read-only without declaring it, so the new field
reads `false` for them and the gate is blind to `.claude/agents/`.

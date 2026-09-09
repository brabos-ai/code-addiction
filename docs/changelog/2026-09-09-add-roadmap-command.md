# 2026-09-09 — `/add-framework--roadmap`: the roadmap gets a writer

Implements `docs/plans/2026-09-09T065116-PLAN--roadmap-command.md` (internal layer, F1–F2).
One new command, one row in the `CLAUDE.md` map. Nothing else in either layer was touched.

## Why

`docs/roadmap/index.md` existed and was tracked, and nothing kept it fed. Adding an item meant a
hand-edit or an ad-hoc request, and both depend on remembering — which is the one thing a roadmap
exists to survive.

Nothing in either layer ordered or prioritised work before this. `docs/delivered.jsonl` carries
status with no ordering; `tasks.md` carries ordering scoped to a single feature. Both look backward.
The gap was the forward-looking one.

## The command

Nine steps: read the roadmap, resolve the operation and its target, check the project, apply the
edit, commit, reconcile with the remote, report what else is going up, push, report.

**Three operations, no subcommand grammar.** Add, update and remove, decided from the free text. The
user addresses an item the way they think of it — by number or by subject — and an unresolvable or
ambiguous target stops rather than guessing or falling back to adding a duplicate.

**No confirmation gate.** The reported commit sha is the undo. This was decided twice: an earlier
draft of the plan had update and remove behind a show-and-wait, and it was removed on the repository
owner's instruction. It is listed in the plan's reviewer handoff as a decision, so a future reviewer
finding it "missing" finds the decision rather than a gap.

**STEP 3 is the part that makes an entry worth keeping, and the part most likely to grow teeth.** It
reads what the request names plus a grep of its own terms, so the entry lands carrying real paths and
a `Done when:` line someone can actually run. It is capped in the command body, in the plan's scope
exclusions and in the reviewer handoff: no subagent dispatch, no artefact graph, no reading
`docs/plans/`. A capture command that starts analysing has become the thing the roadmap points at.

**It pushes straight to `main`.** No branch, no PR — the durability guarantee is that the write
reaches the remote in the same invocation that made it. This works in this repository because the
`main` ruleset's `pull_request` rule carries an `OrganizationAdmin: always` bypass and the owner is
an org admin. That dependency is recorded in the plan, and it is one of the reasons a product-layer
twin is out of scope: shipping push-to-main to users whose repositories grant no such bypass would
break on the first run.

STEP 6 fetches and rebases before pushing. Validation confirmed this is load-bearing rather than
defensive: with the remote ahead, a bare push is rejected non-fast-forward. A conflict there aborts
and reports — the command never resolves one, because the local commit is already safe and a bad
auto-resolution would lose the text the command exists to protect.

## The line-ending rule, which the plan did not ask for

Behavioural validation surfaced a defect the plan had not anticipated. On Windows the working copy is
CRLF. Writing LF back makes every line read as changed, so `git diff` reports a full-file rewrite for
a one-line edit — the regeneration the command forbids, arriving through the back door and passing
every prohibition in the file.

STEP 4 now detects the file's existing endings and writes them back, and says to verify with a diff
before committing. With the endings normalised, the update test's diff is exactly one line.

## Why it is a leaf

The command declares no `<!-- uses: -->` block and names no other command, skill or agent. The graph
confirms it: 211 nodes and 699 edges before, 212 nodes and **699 edges** after. A node, no edge.

That isolation is the constraint the owner set — "não quero afetar outros comandos" — expressed
structurally rather than promised in prose. The single highest-leverage coupling point available was
`add-knowledge-discovery`, which six commands load to consult durable context before acting; wiring
the roadmap into it would fan the dependency out across all six. It is named in the plan's scope
exclusions so the option is refused on the record rather than merely unused.

## What was deferred, with its trigger

One file per roadmap item was considered and deferred. The file is 97 lines with a 17-line maximum
item; splitting now costs the read-at-a-glance and creates a failure mode where an item file and its
index line drift apart. The trigger is written down: revisit when a single item passes roughly 40
lines, or when a third top-level theme appears. Splitting later is a script over predictable markdown
headers, so deferring does not make it expensive.

Item lifecycle stays out: no done section, no archive, no size cap, no status field. A completed item
is removed, and that is the whole lifecycle.

## Validation

All ten behavioural levels ran in a throwaway repository with its own bare remote, never against this
one — the command commits and pushes, and a pushed test commit on the real `main` cannot be undone by
restoring a file. The fixture carried real `.claude/` artefacts so the STEP 3 grounding check had
something true to find.

Build gates held at both F-blocks: `build.js` exit 0 with zero warnings against a zero-warning
baseline, the orphan list byte-identical to baseline at 24 with no command in it, and
`git status --porcelain framwork/` empty. The `CLAUDE.md` diff is one inserted line, outside the
generated `codeadd-inventory` markers.

Three of the ten levels are regression guards that pass before F1 by construction. They are recorded
as guards, not as evidence the work landed.

# Product close-out parity — the four repairs the product layer never got, and three ownership defects

**Date:** 2026-09-11
**Plan:** `2026-09-11T014333-PLAN--product-close-out-parity`
**Layer:** both (21 product blocks, 3 internal)

The internal layer was closed out repeatedly over three days and most runs repaired
something reading had not surfaced. Only one of those repairs, `final-report-shape`,
ever reached the product layer. This is the catch-up, plus what the catch-up
exposed.

## Why

Four of the internal repairs are about facts that hold in any repository, not about
anything specific to this one.

**A close-out that re-runs must not write its record twice.** `/add.done` had one
idempotency guard and it covered the changelog file. Nothing crossed the merge state
against the presence of an index entry, so a run that wrote the entry and then failed
left the branch holding a complete and correct entry — and a second run wrote a second
line for one delivery. The internal layer grew its fourth gate row after exactly this
shipped on PR #49.

**A merge gate must ask whether the build finished before it asks whether the delivery
was graded.** `converge-gates.sh` computed four gates. One asked whether the delivery
was graded, one read a table written at plan time, one returned `ok` unconditionally
on a feature with no `epic.md`. On a simple feature nothing asked whether `/add.build`
reached its last task. Unwritten code breaks no test.

**A deletion must prove the thing it is deleting exists somewhere else first.**
`done.sh` deleted the checkpoint tags, the worktree and the branch after pushing main.
It never fetched, so nothing in the script had looked at `origin/main` since the branch
point.

**A merge should go through the forge when the forge has rules.** `done.sh --merge`
squash-merged into local `main` and pushed it. No PR, no review, no CI read anywhere.

Three ownership defects surfaced while refining the design, and one more while
building.

## What changed

**The close-out routes before it writes.** `/add.done` 2.1 crosses merge state against
`INDEX_ENTRY` over four states — Normal, Resume, Closed out, Recovery. 2.2 picks the
merge route from `PR_STATE` against a `Publish:` record the build now leaves in the
ledger. The record's only job is telling *declined* apart from *never asked*, two
states that both look like "no PR" and need opposite behaviour; when neither is true,
8.0 asks, naming which of the three cases it is.

`MERGED_ON_MAIN=unknown` is not a merge. The plan crossed "merge state" against the
entry and left the third value unstated; routing it as merged would run Recovery — which
writes on `main` — because `origin/main` could not be read.

**`done.sh` splits into three modes.** `--commit-push` and `--cleanup` are extracted
from `--merge`'s own body, never re-implemented beside it, and `--merge` composes them.
The proof is the suite's diff: 92 insertions, zero deletions, all 28 pre-existing cases
byte-unchanged and green. `--cleanup` runs two numbered checks before any deletion, and
the fetch is check 1 rather than a preamble: `origin/main` is a local ref that a
forge-side merge never moves, so a fetch that fails leaves it at the branch point and
the ancestry test then passes against a main that has never seen the merge.

`--cleanup` takes the merge sha as an argument because a squash creates a new commit —
the branch tip is not an ancestor of main, and nothing can derive it locally.

**The push dry-run does less than the plan claimed, and now says so.** It catches a
stale local main, an unreachable remote and a transport auth failure, all before any
local write. It does NOT catch server-side branch protection: `git push --dry-run` is
client-side and never reaches the remote's pre-receive hook. Measured, pinned by a bats
case, and left as a limit rather than papered over — when main is protected the right
answer is the PR route, which the close-out takes whenever a PR exists.

**`GATE_LEDGER` is the fifth gate.** It reads the ledger, never `tasks.md`'s ticks,
because `add.build`'s own invariant is that the ledger outranks the tick. An absent
`tasks.md` is `ok` with the reason stated: outside TASKS MODE the ledger's lines are
keyed by area rather than task id, so there is nothing to cross-reference — gate 4's
own precedent for an absent coverage table.

**One PR flow instead of three.** `feature-pr.sh` existed at 432 lines with its own
suite, was declared in `/add.pull-request`'s `uses:` block, and the same command's body
asserted it did not exist and must not be called. That declaration was the only thing
keeping it off the orphan list. Deleted, with its suite and both stale references.

**The changelog schema owns its path, and the value it carried was wrong.** It said
`docs/changelog/CHG[NNNN].md` — this repository's own directory, which does not exist
in a user's project. Both live writers used the feature directory and agreed with each
other. One changelog per delivery is now a rule with its reason: **a skip is not
idempotency.** Skipping leaves the state the first run produced, correct only if
nothing changed since — and something always did, or the second run would not be
happening. That is how a feature whose PR opened mid-build merged with a changelog
describing only the work that existed when the PR opened.

**`add-review-discipline` is the single owner of how review is dispatched**, a
deliberate sibling of the internal skill, and the two reach opposite conclusions in two
places. This one allows one re-dispatch after `apply then re-gate`; that one allows
none, because the internal layer has no schema gate between the two reads. This one
permits two verdicts on disk, `review-NNN.md` and `qa-validation-NNN.md`, because
`qa-evidence.sh` and `converge-gates.sh` consume them deterministically; that one
permits none. Both files carry a note naming where they diverge and why, because "a
sibling exists" is an invitation to reconcile them.

**The build reads its plan cold.** `/add.build` reads the ledger on entry because a
compacted session looks exactly like a fresh start. The same argument applies to the
plan, and nothing checked it. 10.0.4 dispatches the readback before the first subagent.
It is not a gate: divergence becomes a ruling and the build continues.

**A brainstorm set gets the plan set's ordinal.** Nine sites named a brainstorm filename
and the SET form carried none, contradicting `add-plan-authoring` and the files already
on disk. Stated once now, with the other eight pointing at it — and two of the eleven
lines deliberately keep no ordinal, because a standalone brainstorm has no set to order.

## What this cost

**A regression, caught by the review and not by the gates.** F4's refactor indented the
commit-message string along with the code, putting four spaces before
`Co-Authored-By:`. An indented trailer is not a trailer. Nothing in `done.bats` looked
at a commit body, so eighteen blocks ran green through it. Two cases now cover it, and
the one that matters makes `git interpret-trailers --parse` read the line rather than
grepping for the words.

**Seven weak assertions, six found by someone else.** Two in F4 (an unrecognised flag
also errors on main, so `STATUS=ERROR` proved nothing), one in F13 (looked for
`Write to:` where the file says `Write to`), three the conformance auditor proved could
not fail, and one the mutation run exposed. The pattern is identical every time: the
expected string written from memory, or the absence of an old phrase standing in for
the presence of the new behaviour.

**The mutation level had been skipped.** The plan specified seven and the build ran
none. Run in full at review: seven mutations, seven caught — one only after the
assertion behind it was rewritten to require the behaviour instead of forbidding two
phrasings.

**One of the plan's own claims was wrong.** It said a cross-layer `uses:` on the
internal sibling would fail `build.js` with a dangling target. It does not: a node of
that name exists in that layer too, so the declaration resolves to the file itself and
the sniffer skips self-reference. The cli matrix is the only guard there.

**Eighteen findings were rejected**, each with a ruling. Most are pre-existing contract
drift in artefacts this delivery opened for one line — `@fix-agent`'s and
`@reviewer-agent`'s declared shapes, `add.build`'s missing `## Rules` section and its
restated Four Hard Stops, `add-wiki-maintenance` pointing at steps that do not exist.
Two were rejected because the fix would have broken the build: declaring a target whose
only prose mentions sit inside fenced blocks creates a phantom-edge warning. Two
auditors disagreed about exactly that, and the one that simulated the gate outranked the
one that asserted it would fire.

## Evidence

Twenty-four commits, `c430da5..86f8008`. Build clean on every block, zero graph warnings
against a zero baseline. The cli suite 1100 passing, 0 failing, up from 1017 — the 83
new assertions are this delivery's matrix. The scripts suite 410 passing, up from 386
with 11 removed by the deleted file and 35 added. Every block's gates measured against
a baseline captured in the worktree, after the first baseline was taken in the wrong
tree and corrected.

Three companion blocks were opened by the layer rule rather than by the plan: twice for
`CLAUDE.md`'s generated inventory and once for the checked-in graph diagram. A product
block cannot write either, and both go stale the moment the artefact set changes.

## Left undone, on purpose

**The PR route has never executed.** Nothing in this delivery merged through `gh`. The
four-state cross, the resume route and the recovery route are equally unexercised — the
same thing the internal close-out's own changelog said about its fourth gate row, which
is still true there. The tests assert each state against a fabricated tree; only a real
close-out proves the sequence.

**`L9.2` is not asserted.** "A second close-out run writes no second line to
`docs/delivered.jsonl`" is the behaviour this whole delivery exists to produce, and no
test covers it end to end. Recorded rather than implied.

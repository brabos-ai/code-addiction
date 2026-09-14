# Test terminal states and the QA feature boundary

Two boundaries the framework declared in one place and contradicted in another are now the same
boundary in both. A red test the test agent owns has an authorised ending, and QA judgement lives
under the feature that already owns its input.

## The two defects

**A red test had no authorised ending.** `@test-agent` was told to iterate until tests pass,
forbidden from touching application source, and forbidden from softening an assertion. When the test
is right and the production code is wrong, those three have no joint solution — and every outcome
still available to the agent reported success. The 2026-09-12 delivery closed the sibling case with
`KNOWN_FAILURES` and `CONCERNS`. It did not close the frequent one, where the agent's own correct
test catches a real bug, because the agent runs alongside the implementer and the source is
unfinished by construction.

**`add.review` promised judgement it could not deliver.** It stated that `qa-pipeline` gates QA
authoring and correction, "never judgement". Its evidence step had no fallback on the feature-off
branch, and its coverage step turned every uncaptured in-contract screen into a blocker. A project
that declined the feature did not keep its judgement — it got a coverage blocker per screen and two
judges reading an empty directory.

## What changed

### The test half

**`@test-agent` has three declared terminal states**, not one. Green; `BLOCKED`, naming the assertion
and the source symbol, when its own correct test caught a real bug; or out of attempts. `BLOCKED` is
a successful completion and does not consume an attempt — the agent established the red is not its
to fix, and retrying does not change that.

**`BLOCKED` does not exist in `CORRECTION` mode.** There the red test is the deliverable: the flow is
red → fix → green, so declaring the red an expected failure would make the suite pass and the
coordinator — which runs the test command itself to confirm RED — would conclude the root cause was
wrong. That collision was found by the review, not by the plan.

**The cap comes from the caller.** `ATTEMPT` and `MAX_ATTEMPTS` arrive in the dispatch, the way
`@fix-agent` already received them. A leaf agent cannot see its own history, so the retry budget
lives where the loop can see it.

**`@fix-agent` takes one dispatch per wave**, not one per area. The routing table sorts by severity
first and carries `Blocked by`; a per-area slice could honour neither, because the row that blocks
yours is in someone else's slice. The agent now works the rows in the table's own order, defers a
blocked row, continues, and returns to it when its predecessor lands.

**Implementers run one at a time.** Parallel implementers, a test agent per area and a fix agent per
area were several writers on one tree, each re-running the full build. Test generation is now
interleaved after each area's implementer — `DB → test:DB → Backend → test:Backend → …` — so coverage
is written against finished source, and the coordinator runs the test command itself at the wait-all
rather than trusting the reports.

### The QA half

**`qa-pipeline` gains `add.review`**, giving it the same four-command shape `tdd-pipeline` has. The
judgement steps move into a new fragment and arrive with the feature. Two gates, two questions: the
feature decides whether the steps exist, the `/add.qa-setup` receipt decides whether they can run.

**The ungated body no longer depends on steps the feature may not ship.** Twelve lines of
`add.review` that always ship pointed at the moved steps by number. The one that broke a document
rather than confusing a reader was the review scope: a mandatory frontmatter field whose only
resolution lived inside a conditional step. Review scope is the command's own and is resolved in its
ungated bootstrap.

**The live-driving block has an anchor of its own.** Its old anchor moved into the fragment, so the
`playwright` plugin re-resolved to a seam it shared with every QA section — and its position followed
whichever was enabled first. A seam line in the ungated body fixes the placement, and says in both
states that live driving enhances a judgement rather than replacing one.

## What a user notices

| With | Before | Now |
|---|---|---|
| `qa-pipeline` enabled | QA judgement in `add.review` | Unchanged |
| `qa-pipeline` disabled | A coverage blocker per screen, two judges reading an empty directory | Code review and spec-compliance audit, `⊘ FEATURE OFF` on the gate row, and the remedy named |
| The receipt present, the feature off | The same broken judgement | The same clear answer, with `/add.qa-setup` alone not offered as the fix |

**A project that declined the feature loses a path that did not work.** The remedy is stated in three
places a reader actually reaches: the fragment's governing statement, `add.qa-setup`'s feature-off
sentence, and `add-qa`'s canonical *Feature vs plugin* statement.

## What the review caught that the plan did not

The adversarial pass after the last F-block found 33 findings; 26 were applied in the same run.

**The shipped agent description is the registry's, not the agent file's.** `scripts/build.js` renders
`provider-map.json`'s `description`, so rewriting the source frontmatter reached no provider. Every
shipped `test-agent` went on advertising "runs them until green" and every `fix-agent` "ONE area",
directly above a body saying the opposite. Both registry entries now come from their source, and a
test pins the pair.

**One fix of a twelve-instance problem is not a fix.** The build had found and fixed a single dangling
pointer into the moved steps. Eleven more were still there.

**Four levels could not fail.** One asserted a word that appears six times in the file it was
checking; three F-blocks had no assertion at all, including the one the plan called its
highest-probability risk.

## Migration

None. Feature defaults are unchanged — `qa-pipeline` stays disabled, `tdd-pipeline` stays enabled. A
project with `qa-pipeline` off gets a clearer answer for behaviour it already had; a project with it
on sees no change to the judgement itself.

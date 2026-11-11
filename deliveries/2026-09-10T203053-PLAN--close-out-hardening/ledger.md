# Build ledger — plan: docs/plans/2026-09-10T203053-PLAN--close-out-hardening.md

Branch: feat/close-out-hardening, cut from main 6ead1d1.
Baseline before F1: `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exit 0, zero warnings.
Baseline before F1: `cd cli && npx vitest run --no-file-parallelism` — 42 files, 972 passed, 1 skipped.
Baseline RED confirmed before F1: L2.1 returns only add-framework--build; L2.3 returns one of two on
both nodes; L2.4 returns its single entry (guard, passes today).

Ruling: built the plan's Execution Order verbatim, F11 last, not the readback's paired F7+F11 — the
plan's Execution Order is the normative list and its Proposal prose is a summary of it — costs
nothing in the final tree if wrong, only a wider intermediate working state between F7 and F11.

Ruling: read the plan's "a build that must stop stops after F3, F4 or F7" as advisory, not as a rule
making F5-F10 atomic — every F-block commits independently under add-build-ledger, so any boundary is
resumable — costs a misread pause point if wrong, nothing in the delivered tree.

Ruling: F8 copies the sibling commands' FORM of the qualifier, `ALWAYS — <what this command is>:`,
not their literal text — /add-framework--plan says "THIS COMMAND DOES NOT EXECUTE" and
/add-framework--roadmap says "THIS COMMAND OWNS ONE FILE", both naming their own boundary, so a
verbatim copy would state something false about the close-out — costs a reworded label if wrong.

Ruling: the readback's "complete end to end after F7" objection is a defect in the plan's prose, not
in its Execution Order — after F7 the close-out side is delegated and /add-framework--build still
declares its own pattern until F11 — costs nothing, the tree after F12 is identical either way.

F1: complete (commits 6ead1d1..62bca4f, build.js clean, suite observed RED 10 of 12, the 2 green are
the L3.11 and L3.12 guards the plan predicted would pass today)
F1: Ruling: fixed a bug in the test file's own subStep helper before recording RED — the end-of-section
search used ^ under the m flag, which matched the heading's own hashes and returned a one-character
body — without it four assertions would have failed for the wrong reason — costs nothing, the helper is
test-local.

F2: complete (commits 62bca4f..712d499, build.js clean, npx bats delivered.bats run whole: 60 cases,
59 ok, the 1 failure is case 58 read-by-node, the intended RED; all 57 pre-existing cases still pass,
which is L4.3)
F2: Ruling: added a third case the plan did not list — an entry with no node at all stays readable by
its text — because `node` is optional by STEP 3.2 of the close-out and F3's haystack change must
tolerate its absence — costs one extra bats case if wrong, and it passes today so it is a guard.

F3: complete (commits 712d499..6ebf127, build.js clean, bats delivered.bats whole file 60/60 ok
which is L4.1 L4.2 L4.3, graph history returns both entries on add-framework--done and on
add-framework--build which is L2.3, roadmap still returns its one entry which is L2.4)
F3: Ruling: opened a new internal F-block F13 for scripts/graph.js instead of fixing it inside F3 —
its comment states the haystack NEVER matches node and F3 makes that false, but graph.js is internal
and F3 is tagged product, so the layer boundary forbids the edit here — costs one extra commit if
wrong, and leaving it would ship a comment that contradicts the code it documents.

F13: complete (commits 6ebf127..HEAD, build.js clean, git status --porcelain framwork/ empty,
graph-query and graph-mcp suites 42/42, history still returns both entries) [internal, added by this
build, not in the plan's Execution Order — see the F3 ruling above]

F4: complete (commits 311f9d7..HEAD, build.js clean, framwork/ lane empty, L3.6 green, L3.12 guard
still green)
F4: Ruling: the verb vocabulary is the four /add-framework--build declared plus `fix` — one file on
disk, 2026-09-09-fix-review-v01-remediation.md, already uses it, and an owner that cannot express an
existing name is not the owner — costs one surplus verb in a list if wrong.
F4: Ruling: added `- mention: /add-framework--build` to the skill's uses block — F4 names that command
in prose and the graph gate fails an undeclared name — costs nothing, it is the declaration the gate
requires.

F5: complete (commits a43453a..HEAD, build.js clean, framwork/ lane empty, L3.1 and L3.2 green,
L3.11 and L3.12 guards green, review-no-loops 43/43)
F5: Ruling: the resume path skips STEP 4 as well as STEP 3 and STEP 6, which the plan did not list —
after F4 the changelog filename carries a timestamp, so a second STEP 4 writes a SECOND file rather
than overwriting, and both would reach main — costs one extra skipped STEP if wrong, and running it
would produce a duplicate the index cannot even show.
F5: Ruling: re-keyed the top-of-file cleanup prohibition and STEP 8's own entry condition from "STEP 3
wrote an entry" to "the index carries this plan's entry" — the resume path skips STEP 3, so the old
wording would skip cleanup for a delivery already merged — costs a reworded condition if wrong, and
leaving it would have made F5's own path contradict a top-of-file gate.

F6: complete (commits 96cb177..HEAD, build.js clean, framwork/ lane empty, L3.3 and L3.4 green,
targeted review-no-loops 43/43, L3.11 and L3.12 guards green)
F6: Ruling: added `git fetch origin main` as a fifth command ahead of the plan's four checks — origin/
main is a local ref and gh pr merge does not move it, so without the fetch all four read the branch
point and report a clean pass on an archive main never received — costs one git call if wrong, and
omitting it would have made the whole check decorative.
F6: Ruling: declared /add-framework--plan and /add-framework--brainstorm as `mention:` rather than
`command:` — the handoff is printed text and the command never dispatches either — costs an edge type
if wrong; `command:` would claim a hands-off-to relationship the command explicitly forbids.
F6: Ruling: added STEP 9 a line reporting which path 2.1 routed to and the merge refusal reason,
closing a forward reference F5's 2.5 made to a STEP 9 list that did not carry it — costs one report
line if wrong, and leaving it would have been an instruction pointing at nothing.

F7: complete (commits e56a981..HEAD, build.js clean, framwork/ lane empty, no date-only pattern left
in add-framework--done, L3.5 now fails only on the add-framework--build half which F11 closes, L3.11
and L3.12 guards green)

F8: complete (commits 72e3d04..HEAD, build.js clean, framwork/ lane empty, L3.7 green including its
guard clause that ## Rules keeps the bare ALWAYS:, L3.11 and L3.12 guards green)

F9: complete (commits 53432df..HEAD, build.js clean, framwork/ lane empty, L3.8 green, L2.1 green
returning both add-framework--build and add-framework--done, targeted review-no-loops 43/43 with both
pinned phrases intact, L3.11 and L3.12 guards green)
F9: Ruling: also removed STEP 6.1's hand-written mapping of the two archive filenames — the line above
it already delegates the members to The Delivered Home, which owns the mapping, so the sentence was
the same item-5 defect one line later — costs one concrete example if wrong, and the point it made
about paraphrase survives in the sentence that carried it.

F10: complete (commits aa2ee0a..HEAD, build.js clean, framwork/ lane empty, L3.9 green, targeted
review-no-loops 43/43, L3.11 and L3.12 guards green)
F10: Ruling: pruned six of nine items rather than only the three the audit named — the plan's own
Problem 6 says EVERY item restates a STEP body, and F10's stated test is per item, not per named item
— costs three surplus deletions if wrong, each recoverable from this commit.
F10: Ruling: kept three items on the ground that no single STEP owns them, rather than emptying the
section — a strict reading of item 7 would remove all nine, and ruler item 3 mandates the ALWAYS/NEVER
pair, so the two items cannot both hold on an empty list — costs three items a reviewer may still
call filler; the tie-break is written above so it can be argued with.

F11: complete (commits a93a491..HEAD, build.js clean, framwork/ lane empty, L3.5 green now that both
halves are delegated, targeted review-no-loops 43/43, L3.11 and L3.12 guards green)

F12: complete (commits 65fd549..HEAD, build.js clean, framwork/ lane empty, L3.10 green, whole L3
matrix 12/12 green, L2.2 shows no internal orphan at all)

F14: complete (commits aeb3782..HEAD, build.js clean, framwork/ lane empty, graph-mermaid 11/11)
[internal, added by this build, not in the plan's Execution Order]
F14: Ruling: regenerated web/public/artefact-graph.mmd as its own F-block rather than folding it into
F6 — the full serial cli run found it AFTER F6 was committed, and a checked-in diagram that disagrees
with the emitted graph is a red build, not a ruling — costs one commit if wrong; the alternative was
shipping a failing suite.

REVIEW: complete (30 findings, 15 applied, 15 rejected)

Dispatched 3 + 3: plan conformance, diff completeness, side effects, plus @prompt-review-agent once
per .md artefact in the diff — confirm/items 3,5,7 on add-framework--done, delivery on
add-framework--build and on add-plan-authoring. Verdicts: ok, fix-then-ok, fix-then-ok.

REVIEW: Ruling: the one HIGH finding went to the user, per STEP 7.3 — F4's timestamp removed the path
collision that made two changelog writers land on one file, and choosing between "second writer edits
in place", "only the close-out writes" and "accept two files" is a decision the plan never made — the
user chose edit-in-place, now owned by add-plan-authoring.
REVIEW: Ruling: rejected the finding that add-plan-authoring L234 duplicates add-review-discipline —
review-no-loops.test.js L4.2 pins both prohibitions as a deliberate guard against exactly this
collateral deletion, and a pinned test from a prior delivery outranks a quality reading — I applied it
first, the suite caught it, and I restored the line — costs one duplicated prohibition if wrong.
REVIEW: Ruling: rejected the finding that add-framework--plan misattributes a rule to this skill —
pre-existing, in an artefact no F-block touches — costs a stale attribution if wrong; it is reported
to the user instead.
REVIEW: Ruling: rejected numbering STEP 8's new sub-step — the only free numbers renumber 8.1, which
the plan lists under Must NOT lose and L3.11 pins — costs one uncross-referenceable heading.
REVIEW: Ruling: rejected the haystack over-match finding on generic tokens like `internal` — the plan's
Accepted Trade-offs takes that trade in writing, and `node` is internal-only so user projects carry
none — costs noisier results for one-word queries in this repo.
REVIEW: Ruling: rejected removing the third surviving `## Rules` item — two auditors disagreed about it
and the more precise reading is that STEP 2.3 mandates that report line only for the local-fallback
branch, so the item adds the CI case — costs one item a reviewer may still call filler.
REVIEW: Ruling: ran the bats suites inside a linux/amd64 container against the mounted repo rather than
on the Windows host — delivered.bats went from over 12 minutes to 18.7s and the whole scripts suite
ran in 1m58s with 386 passing, and the qa-preflight false failure the close-out documents did not
occur because the container TMPDIR has no node_modules above it — costs nothing; it is the same Linux
the CI job uses, so it is stronger evidence than the Windows run, not weaker.

L1.1 build.js clean on every block. L1.2 full serial cli suite 43 files, 984 passed, 1 skipped.
L1.3 whole scripts suite 386 passed, 0 failed, on linux/amd64. L2.1-L2.4 green. L3 12/12. L4 green.
L5 is outstanding by construction: it is exercised by /add-framework--done, which has not run yet.

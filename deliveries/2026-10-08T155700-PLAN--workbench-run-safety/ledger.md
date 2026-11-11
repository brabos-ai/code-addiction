# Build ledger — plan: docs/plans/2026-10-08T155700-PLAN--workbench-run-safety.md

Setup: branch feat/workbench-run-safety created from main (build was on main); baseline build.js exit 0, 0 graph warnings
Setup: Ruling: created a branch locally — build started on main and STEP 9 forbids publishing from main — costs a branch rename if the operator wanted main
Ruling: the guard prints and matches names as inner text without quotes (plan L1 shows ::'a' but its own rule says outer quotes are removed) — the text rule is the one the script implements — costs a test-fixture edit if the quoted form was meant
Ruling: ticket-writes.test.cjs and the two new result-block tests are written RED first but committed with the F-block that turns them green (F6 and F8) — a commit before then would carry a red suite — costs nothing if wrong
F1: complete (commits b697a5e..4dbbec6, 11 L1 cases green in container, build.js exit 0 with 0 warnings, framwork/ clean; L4.1 replay: GUARD=fail LOST=3 exit 1 with 3 LOST_TEST lines on test-transport.test.cjs)
F2: complete (commits 4dbbec6..76bf067, build.js exit 0 with 0 warnings, framwork/ clean, workbench rebuilt, L2.3 green; remaining reds are F5-F8 tests)
F3: complete (commits 76bf067..6bb1624, same checks; 2.x section names unchanged)
F4: complete (commits 6bb1624..0185da8, one row added; inventory.js left no diff)
F5: complete (commits 0185da8..3aff36b, build.js exit 0 0 warnings, framwork/ clean, cli suite 79 files 2026 tests green incl L11.5, L2.1 green after F6)
F6: complete (commits 3aff36b..c110ddc, build.js exit 0 0 warnings, framwork/ clean, ticket-writes L2.1-L2.3 green RED-first; 'result block' phrase absent from stage skills)
F7: complete (commits c110ddc..bd44885, build.js exit 0 0 warnings, schema keys/types/enum unchanged, L3.1 green RED-first)
F8: complete (commits bd44885..179c0b0, L3.2 green RED-first, scripts suite 700/700 green)
L4.1: replay of 4cccd00 — GUARD=fail LOST=3 exit 1, three LOST_TEST lines on scripts/tests/test-transport.test.cjs
L4.2: first call (session 29befe89-f2cc-41cd-b562-aba7bb7563a6) structured_output validates, status needs-approval, needs_approval true, stage add-framework--plan, next_step "What should the one-line note in AGENTS.md actually say?"; second call --resume same session_id, validates, status stopped, reason "Cancelled by the user; nothing was written."; no new file under docs/plans/
L4.3: GUARD=pass on the finished branch (TESTS_BASE=3028 TESTS_HEAD=3045 LOST=0)
L4.4: deferred by the plan — no-push board write is proven only by the first headless no-push build after merge; OPEN, not met
GRAPH: add-framework--build — direct dependants add-framework--done, add-framework--plan, building-commands, none restate the changed STEP 9/10 or 5.1 text; history returned no live entry naming a dropped predecessor (MATCHED_DEAD=1, entries empty)
GRAPH: add-framework--done — direct dependant add-framework--build (hand-off only); no entry
GRAPH: add-plan-authoring — direct dependants add-framework--brainstorm, build, done, plan; grep of workbench/ finds no other copy of the in-review rule (single owner held); no entry
GRAPH: add-final-report — nine direct dependants, all load the skill for the closing report; only references/ text changed, no dependant names the new section; no entry
Ruling: accepted 13 review findings and fixed them in one commit (3cc7df6) — done 2.4 text and table now skip the test-loss gate, done STEP 2 summary lists it, --fix gets a next step, build STEP 9 says a guard STOP is a red validation (not a fifth hard stop) that ends the run before STEP 10 and that restore/trailer commits take no complete line, The Ticket loses 'reading STEP 9's answer' and 'as above' and notes the phases.md gap, guard reads a regex after return/typeof/etc, ::* covers only a file absent at head, internal errors exit 2, quotepath off, failed git show is an error, double space in result-block.md — costs a revert of that commit if wrong
Ruling: rejected 'method shorthand test(){} read as a test' (low) — symmetric across base and head so it makes no false loss — costs a wrong TESTS_* count in rare files
Ruling: rejected 'MOVED matches by name alone' as a code change (low) — it is the plan's literal rule; added a header warning instead — costs a hidden loss when a common name appears elsewhere
Ruling: did not edit product phases.md (medium: it says in-review means a PR is open) — plan 'Does NOT Include' forbids the product side — costs a board column whose meaning differs from the docs on this repository; the gap is recorded in The Ticket comment
REVIEW: complete (21 findings, 13 applied, 3 rejected)
Ruling: wrote the ticket 'doing' write after the last F-block instead of at STEP 5.1 — I missed it at the start — costs a board that showed 'planned' while the build ran; work_id and both writes are now on main
TICKET: doing+work_id SHA 20591863df42adbd0bda62b0095bf0e314a7383e; in-review SHA 1f1dd734c06232010f6706356cd132eb6cc6c738 (both pushed to main by backlog-commit.cjs only; the branch is not pushed)
STEP 9: not published — operator instruction, commits are local on feat/workbench-run-safety

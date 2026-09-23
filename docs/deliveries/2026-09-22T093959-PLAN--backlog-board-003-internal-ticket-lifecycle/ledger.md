# Build ledger — plan: docs/plans/2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle.md

F1: Ruling: readback matched goal, order and F-blocks; its gaps are closed as — a ticket already `doing` under a DIFFERENT work_id is written over, as the product lifecycle does (it skips only an exact match), and the stage reports the work_id it replaced; an id the brainstorm finds nowhere on the board is reported and the run continues with no ticket, never guessed; `> **Ticket:**` sits right after `> **Delivery:**` in the plan header and after `> **Type:**` in the design header; DEGRADED= and REFUSED= are backlog-commit.sh's KEY=VALUE output lines, reported as read — costs a conflict report later if overwriting another delivery's claim proves wrong
F1: Ruling: L2.3's rebase-conflict case (DEGRADED) was not reproduced in the throwaway repo — backlog-commit.bats already asserts DEGRADED=rebase-conflict and the aborted rebase, and the section only reports the key the script emits — costs nothing unless the script's output contract changes
F1: complete (commits 558ab52..b5e1769, L1.2 RED->GREEN; L2 in a throwaway repo with a bare remote: read-one 1/0, doing write worktree route +1 commit with work_id = plan basename, rerun skipped +0, done write +1, second run skipped +0, unknown status REFUSED with board unchanged; build.js clean vs baseline; build-workbench 0; framwork/ clean)
F2: complete (commits b5e1769..0839cbb, L1.4 RED->GREEN; build.js clean vs baseline)
F3: complete (commits 0839cbb..ec0d7f9, L1.3 brainstorm RED->GREEN (names The Ticket twice, restates no rule); build.js clean vs baseline; build-workbench 0; framwork/ clean)
F4: complete (commits ec0d7f9..d037c21, L1.3 plan RED->GREEN; build.js clean vs baseline; build-workbench 0; framwork/ clean)
F5: Ruling: added a STEP 10 report line for the ticket's outcome beyond the plan's STEP 5.1 pointer — The Ticket requires every outcome to reach the user through the stage's final report, and STEP 10's always-report list is where that lands — costs one line if the report shape changes
F5: complete (commits d037c21..5f6aae6, L1.3 build RED->GREEN; build.js clean vs baseline; build-workbench 0; framwork/ clean)
F6: Ruling: the done write sits at the head of STEP 8 rather than after STEP 7 — STEP 7 is skipped whole on the recovery path, and STEP 8's own condition (delivery on main) already covers the normal, resume and recovery routes; it is the same moment the plan named — costs a move if STEP 8 ever gains a pre-merge step
F6: complete (commits 5f6aae6..acf99e7, L1.3 all four stages name The Ticket and restate no rule; build.js clean vs baseline; build-workbench 0; framwork/ clean)
F5: Ruling: L1.3 was run in full only after F5 and F6 were committed, and it failed for both — each restated The Ticket's skip rule ("read first, skipped when…") instead of pointing at it; fixed in a follow-up commit per block; the remaining case-insensitive "READ FIRST" match in the build skill is STEP 1's pre-existing label (present on main at 558ab52), unrelated — costs nothing now; the lesson is to run the plan's own grep before each commit, not after the last
F5: complete (commits acf99e7..a5efb1e, L1.3 fix: pointer only, no restated rule; build.js clean vs baseline; build-workbench 0)
F6: complete (commits a5efb1e..be59914, L1.3 fix: pointer only, no restated rule; all four stages name The Ticket and restate no rule)
GRAPH: add-plan-authoring — add-framework--build, --done, --plan (all three changed in this delivery); no entry
GRAPH: add-plan-authoring/references/plan-template.md — add-plan-authoring (changed); no entry
GRAPH: add-framework--brainstorm — none; one live entry (2026-09-16T170340-PLAN--the-pipeline-chains), status changed, no supersession
GRAPH: add-framework--plan — add-framework--brainstorm (HANDS_OFF_TO), add-framework--build (both changed); no entry
GRAPH: add-framework--build — add-framework--done, add-framework--plan (changed), building-commands (neither changed nor named: it loads the build for dispatch rules, and the change adds one pointer at STEP 5.1 and one report line, altering nothing it reads); no entry
GRAPH: add-framework--done — add-framework--build (changed); no entry
GRAPH: add-doc-schemas/references/backlog.md — add-backlog, add-doc-schemas (neither changed; the edit widens the work_id row with one clause for this repository, no rule either reads changes); no entry
F1: complete (commits be59914..3053852, review fix: done's row reads STEP 8, first, before any deletion — prompt review item 4; build.js clean vs baseline)
F3: Ruling: accepted the prompt reviewer's blocked item 4 on brainstorm without asking the user — the decision it asked for (does a spike report its ticket) was already taken in the 003 design, 'Spike: names it in the report, writes nothing'; the gap was that STEP 7 never implemented it — costs a reversal if the design's row is wrong
F3: complete (commits 3053852..a4142d4, review fixes: 7.2 reports the ticket on every path — prompt review item 4; add-plan-authoring declared skill: — item 1; build.js clean vs baseline)
F4: complete (commits a4142d4..48cc53d, review fix: the carrier rule is a pointer, not a restatement — prompt review item 5; build.js clean vs baseline; build-workbench 0)
REVIEW: complete (4 findings, 4 applied, 0 rejected)

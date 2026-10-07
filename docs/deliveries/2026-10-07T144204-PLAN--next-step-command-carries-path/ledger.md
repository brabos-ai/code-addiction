# Build ledger — plan: docs/plans/2026-10-07T144204-PLAN--next-step-command-carries-path.md

Ruling: readback gap "test -f fails at a chat closing" — the continuation line is simply not printed, no STOP and no warning — the plan names no failure branch and a missing file means there is nothing to continue with — costs a rule line in F3 if a warning was wanted
Ruling: readback gap "design path with no intent pair" — the design is read as the design and STEP 4 runs in full, as F7(b) states — costs F7(b) rewording if the design should seed the idea instead
Ruling: readback gap "F5 line numbers drift after F3" — cut by quoted text, not by line number — the plan quotes the rule text with each number — costs nothing; a wrong cut shows in L1.9
F1: Ruling: official runner REFUSED (tar -c: GNU tar in Git Bash reads C: as a host), so L1 ran through a throwaway vitest stand-in in C:/tmp/ntest over the same file — the cli runner could not run here and a direct vitest in cli/ rewrites sidecars — costs nothing if CI is green; CI is the verdict
F1: complete (commits 14ac7fe..5ecba12, RED observed: 15 fail / 13 pass via stand-in, build.js clean 0 warnings, framwork/ clean)
F2: complete (commits 5ecba12..9fdd3c0, L1.4 green via stand-in, build.js clean 0 warnings, framwork/ clean)
F3: Ruling: added mention edges for add-framework--plan and add-framework--done to add-final-report uses block — the build.js prose gate flagged both names in the new section — costs two graph edges that carry no behaviour
F3: complete (commits 9fdd3c0..f66496b, L1.1 green via stand-in, build.js clean 0 warnings, framwork/ clean)
F4: complete (commits f66496b..340db69, build.js clean 0 warnings, framwork/ clean; ruler item 3 confirm at STEP 7)
F5: complete (commits 340db69..e226c5c, L1.9 green via stand-in, build.js clean 0 warnings, framwork/ clean; ruler item 7 confirm at STEP 7)
F6: complete (commits e226c5c..bdf59d7, L1.3 template green via stand-in, build.js clean 0 warnings, framwork/ clean)
F7: Ruling: L1.8 compares the Operation Mode text on collapsed whitespace — the sentence 'resolve the argument BEFORE reading anything else' wraps across two source lines and indexOf returned -1 — costs nothing; the F1 test file was edited in the F7 commit, not F1's
F7: complete (commits bdf59d7..eb79339, L1.2 plan/L1.3 plan/L1.5 plan/L1.8 green via stand-in, build.js clean 0 warnings, framwork/ clean)
F8: complete (commits eb79339..5bd6b65, L1.2 build/L1.5 build/L1.6 green via stand-in, build.js clean 0 warnings, framwork/ clean)
F9: complete (commits 5bd6b65..b0e261e, L1.2 brainstorm/L1.3 green via stand-in, build.js clean 0 warnings, framwork/ clean)
F10: complete (commits b0e261e..9c61bca, L1 28/28 green via stand-in, build.js clean 0 warnings, build-workbench exit 0, framwork/ clean)
F10: Ruling: npm test (framework gate) and the CLI suite could not run locally — same tar C: refusal as F1 — the plan's L2.2 is therefore NOT verified locally; L1 ran via the stand-in and build.js/build-workbench ran for real — costs a possible CI failure in a suite this change cannot reach (workbench text only, no framwork/ or cli/src change)
GRAPH: add-final-report — dependants add-framework--backlog, add-framework--release, add-framework--sync, building-commands untouched by this delivery (the three commands print no continuation line by design, L1.7 guards it; building-commands names no next-step form); no entry
GRAPH: add-plan-authoring — dependants brainstorm, plan, build, done all in this delivery; shipped before: 2026-09-22T093959-PLAN--backlog-board-003-internal-ticket-lifecycle (changed, not dropped — The Ticket section and template Ticket lines untouched here)
GRAPH: add-framework--plan — dependants brainstorm, build both in this delivery; no entry
GRAPH: add-framework--build — dependants done (in delivery) and building-commands (untouched, no wording of the build changed that it cites); no entry
GRAPH: add-framework--brainstorm — none; shipped before: superseded entry 2026-09-16T170340-PLAN--the-pipeline-chains (three-option approval and delivery mode, superseded by 2026-10-05T152826-PLAN--native-node-framework-scripts, neither named in this plan; the 7.3 edit keeps the three options, the intent file and the automatic path)
GRAPH: add-framework--done — dependant add-framework--build (in delivery); no entry
F11: Ruling: kept the two uses mention edges (conformance + diff-completeness findings) — build.js prose gate fails without them and the plan's 'no uses edge' line was wrong — costs two graph edges, plan Impact line stale
F11: Ruling: rejected the finding that L2.2 / L2.4 / L3.1 are unverified as a defect — the runner cannot run here (tar C:), L2.4 is this STEP 7 dispatch, L3.1 is the operator's by-hand acceptance after the build — costs an unverified CLI suite until CI
F11: Ruling: rejected 'F7 edited the F1 test' as a process defect — already ruled at F7 — costs nothing
F11: Ruling: rejected adding test -f to plan/build chat closings — F3 owns it once and they point at it; the build line names a plan already resolved on disk — costs a reader of the build skill alone not seeing it
F11: Ruling: rejected the build handoff:/uses line contradiction — plan lists it as recorded, not fixed — costs a HANDS_OFF_TO edge the body denies until its own ticket
F11: Ruling: rejected the [idea] free-text hit in plan Operation Mode — plan allows it by name (L1.3 exception) — costs nothing
F11: Ruling: rejected making the design template Next Steps agree with 7.3 — Validated Decisions row says the design points at its own path because the intent file does not exist yet — costs two different commands on architectural, both resolve through F7(b)
F11: Ruling: rejected handling a Windows backslash in Argument Resolution — plan decision is directory and .md only, and every printed line uses forward slashes — costs a No match STOP for a hand-typed backslash path
F11: Ruling: rejected the Rules-section note (side-effects #6) — plan F5 allowed it — costs nothing
F11: Ruling: rejected removing the plan STEP 7 / build STEP 10 lines that echo add-final-report (single-owner findings) — plan F7(c) and F8 specify those lines by name and they carry what is specific to each stage — costs a second place to edit if the rule changes
F11: Ruling: rejected deleting the build usage line docs/plans/<basename>.md — L1.5 asserts it in Operation Mode and it is the one worked example of a printed path — costs one repeated phrase
F11: Ruling: graph superseded entry for add-framework--brainstorm (2026-09-16T170340-PLAN--the-pipeline-chains, superseded by 2026-10-05T152826-PLAN--native-node-framework-scripts) judged not a finding — the three-option approval, intent file and automatic path it delivered are untouched by the 7.3 edit — costs a missed regression if the supersession dropped something this edit relied on
F11: complete (commits 9c61bca..9e1bb79, review fixes: build.js clean 0 warnings, build-workbench exit 0, L1 28/28 via stand-in, framwork/ clean)
REVIEW: complete (28 findings, 14 applied, 14 rejected)

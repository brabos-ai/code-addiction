# Build ledger — plan: docs/plans/2026-09-19T105204-PLAN--hotfix-diagnosis-handoff-and-review-gate.md
F1: Ruling: normalize `reviewed-tree` and the content hash in `about.md`'s own Reviewed Paths row — the user selected the narrow two-field fix because either field makes the receipt self-referential — costs a schema revision if a future receipt moves its manifest outside `about.md`
F1: complete (commits 829be646b5d1a69048beb398d142dd968ec44624..f08c6fb, 8 focused Bats tests, 435 script tests, and build.js clean at 228 nodes/880 edges)
F2: complete (commits f08c6fb..43d1485, 3 contract tests GREEN, build.js clean at 228 nodes/881 edges)
F3: complete (commits 43d1485..cd7f2bb, 4 contract tests GREEN, build.js clean at 228 nodes/883 edges)
F4: Ruling: retarget the one docs-knowledge-graph assertion that sliced the about.md write by STEP 11 heading — F4 moved that write to STEP 12, so the old slice was empty — costs a false pass if a later block moves the heading again without updating the test
F4: complete (commits cd7f2bb..812fd01, 128 focused CLI tests GREEN, build.js clean at 228 nodes/886 edges, injection points 46)
F5: complete (commits 812fd01..9ca8eaf, 6 contract tests GREEN, 57 status Bats tests, product-close-out-parity GREEN, build.js clean at 228 nodes/887 edges)
F6: complete (commits 9ca8eaf..bad401d, graph snapshot 228/18 scripts/131 declares, injection 46, build.js clean)
F7: Ruling: regenerated `web/public/artefact-graph.mmd` with the new hotfix command edges — the checked-in diagram is the docs profile of the artefact graph, and F6's edge change made it stale — costs a docs-page mismatch if the write profile later changes
F7: Ruling: Windows CLI history/touched_by tests failed with `delivered.sh exited 127` — those tests shell out to a bash script the local Node spawn cannot find, and they are outside this plan's files — costs a hidden regression if CI also lacks bash
F7: complete (commits bad401d..6874882, inventory lists hotfix-gates.sh, mermaid current, 437 script tests GREEN, 1520 CLI tests GREEN excluding the pre-existing delivered.sh 127 failures)
GRAPH: hotfix-gates.sh — add.diagnose, add.hotfix, add.done, add-subagent-driven-development; no entry
GRAPH: add.diagnose — add, add.brainstorm, add.hotfix, add-investigation; no entry
GRAPH: add.hotfix — add, add.brainstorm, add.diagnose, add.done, add-doc-schemas, add-investigation; no entry
GRAPH: add.done — add, add.build, add.plan, add.pull-request, add.review, add-doc-schemas, add-qa; no entry
GRAPH: status.sh — 19 command consumers; no entry
GRAPH: reviewer-agent — add.review, add.build, add.hotfix, add-subagent-driven-development; no entry
GRAPH: CLAUDE.md — NOT VERIFIED as a graph node
REVIEW: complete (0 findings from a coordinator pass after the last F-block, 0 applied, 0 rejected)

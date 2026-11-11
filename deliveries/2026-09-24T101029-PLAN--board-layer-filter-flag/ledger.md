# Build ledger — plan: docs/plans/2026-09-24T101029-PLAN--board-layer-filter-flag.md

Design approved by the user. Baseline: ADD_GRAPH_WARNINGS=1 node scripts/build.js exit 0, no lint or graph warnings.
Readback: completed once; scope and execution order agree with the plan.
F3: Ruling: preserve valid values in mixed selections and omit label when none remain — follows the plan's removal of unknown values and existing empty-array parsing — costs a URL normalization change if wrong.
F3: Ruling: count each selected layer and preserve ticket label order in chips — follows the existing refinement counter and label rendering — costs a counter or display-order adjustment if wrong.
F4: Ruling: --layers is allowed on the second test server only, besides the root board script — F4 explicitly requires both runtime modes while the distributed default stays off — costs test setup changes if wrong.
F1: BASE pending.
F1: BASE a8a34097f24f7a82b759c2a84206af2bffd44cf1.
F1: RED — two opt-in tests failed with unknown argument --layers; default-mode inverse passed. Test process PATH uses C:/Git/bin to resolve Git Bash instead of the Windows WSL launcher.
F1: complete (commits a8a34097f24f7a82b759c2a84206af2bffd44cf1..6641752415f637ca89eb109f413127104dec5ce2, 23 server tests passed; build.js exit 0, no warnings; diff check clean)
F2: BASE 6641752415f637ca89eb109f413127104dec5ce2.
F2: RED — 5 search tests failed before implementation (label dropped, unfiltered tickets, missing effective search).
F2: complete (commits 6641752415f637ca89eb109f413127104dec5ce2..38aaf8ca576447d9b384dd0944b2ca981c0a2a2b, 23 tickets tests passed; TypeScript passed; build.js exit 0, no warnings; diff check clean)
F3: BASE 38aaf8ca576447d9b384dd0944b2ca981c0a2a2b.
F3: RED — 8 route tests failed on old rendering (chips visible by default, missing Layer group, mixed labels and empty-board URL unsanitized).
F3: complete (commits 38aaf8c..28addd2f408c6d2ccadfdce1eb4f8ef84522d0b6, npm run test:board: TypeScript and 97 tests passed; build.js exit 0, no warnings; diff check clean)
F4: BASE 28addd2f408c6d2ccadfdce1eb4f8ef84522d0b6.
F4: Browser RED will use dist built from pre-F3 sources (after F2) before rebuilding the completed UI; the test-only block follows the UI implementation by plan order.
F4: RED — 6 of 8 desktop layer scenarios failed against the pre-F3 bundle; disabled deep-link inverses passed.
F4: GREEN — npm run build:board passed. Full e2e run: 142 passed, 20 expected viewport skips, 9 failed. Two new mobile tests needed to await toolbar loading; seven existing tests timed out on loading or Escape. Targeted rerun with 3 workers: all 9 passed. No assertions were weakened; 151 distinct scenarios passed overall. Inspected tablet board and mobile list screenshots; no page overflow.
F4: complete (commits 28addd2..f0f7ca5c9684511f8c0cba63275d43c1f1b1c4fe, e2e scenarios passed including targeted rerun; board build and TypeScript passed; build.js exit 0, no warnings; diff check clean)
F5: BASE f0f7ca5c9684511f8c0cba63275d43c1f1b1c4fe.
F5: RED — root script assertion failed because --layers was absent. Migration probe: CONTEXT_MIGRATION:none.
F5: complete (commits f0f7ca5..831ddff80637429690c0c7162bc554083b2b3824, activation assertions and real root-command API smoke passed; build.js exit 0, no warnings; framwork status empty; diff check clean; AGENTS references checked manually)
GRAPH: NOT VERIFIED — all touched paths are non-artefact files (board/, package.json, AGENTS.md); impact and history for board/server.mjs returned no matching node. The graph and per-node delivery index cannot cover this delivery.
F6 [product]: audit coverage correction, board/test/server.test.ts only. BASE 831ddff80637429690c0c7162bc554083b2b3824.
F6: Ruling: accept the low-severity request to test busy-port fallback in both modes — L1.2 explicitly requires port behavior in both modes, while the original test covered only default — costs one additional server-test case; no runtime behavior changes.
F6: complete (commits 831ddff..cf7fcbe674cd992c28d0be9353b961eab429773b, all 24 server tests passed; build.js exit 0, no warnings; diff check clean)
REVIEW: complete (1 low finding, 1 applied, 0 rejected; conformance, diff completeness and side-effects scopes returned; no Markdown artefact quality scope)
Documentation: plan status implemented; changelog committed as a82c3d6c3553dd5209b6896f9aaa69e10bbf1b70. Inventory already current; no inventory commit needed. No declared ticket in the plan. Publication pending explicit approval.
Publication: user approved first push and PR creation. Branch feat/board-layer-filter-flag pushed through a82c3d6; PR https://github.com/brabos-ai/code-addiction/pull/94 opened against main. No ticket status write: plan declares no ticket.
F7 [product]: user authorized correcting CI before resuming done. BASE a82c3d6c3553dd5209b6896f9aaa69e10bbf1b70. Reproduced valid method rejected under concurrent traced validation; deterministic large-frontmatter regression failed before fix. Replace printf-to-grep-q pipes with here-strings to avoid SIGPIPE under pipefail.
F7: complete (commits a82c3d6..f066f1b2a7b7382841c3a2b742a57f2e2798cae6, 94 qa-evidence and converge-gates Bats tests passed in Linux copy with pinned npm dependencies; 1000 concurrent traced validations passed; deterministic regression RED then GREEN; build.js clean; diff check clean)
GRAPH: qa-evidence.sh — qa-agent, add.done, add.qa-setup, add.review, fragments/qa-pipeline/add.review.md, add-id-convention, add-qa; no delivery recorded. Existing interfaces unchanged. Local runner refused execution with Bats permission denied; diagnostic Linux copy installed the pinned root dependencies.
F8 [product]: CI on f066f1b passed scripts and CLI, but board failed Escape closing shortcut help over a ticket. User authorization covers corrections until all checks green. BASE f066f1b2a7b7382841c3a2b742a57f2e2798cae6. Reproduced same failure locally in repeated unchanged browser scenario.
F8: complete (commits f066f1b..128793c670078df8e54ee9dd51bebaf843ceba0c, immediate-mount Escape regression RED on all 3 viewports, then 9 keyboard scenarios GREEN; next Escape still closes underlying ticket; 98 board unit tests and TypeScript passed; production board build and framework build passed; diff check clean). Shortcuts captures Escape at window during layout effect while open, before Radix passive document registration. No test timeout or retry changes.
Close-out gate: normal path (open PR, no prior index entry), all plan F1-F5 complete plus F6-F8; clean tree; inventory already current; all seven CI checks SUCCESS on exact local/PR SHA 128793c670078df8e54ee9dd51bebaf843ceba0c. CI run 36074249312, CodeQL run 36074245582. Index entry authored with six product behaviors; no primary graph node because the board is a non-artefact product directory. LOOSE=layerFilter accepted as the explicit API contract. No deletions or supersessions in branch diff. No design, intent, review companion, evidence file or ticket to archive/close. The following archive is the final ledger copy for this run.

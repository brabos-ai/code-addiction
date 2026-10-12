# Build ledger — plan: docs/plans/2026-10-12T114425-PLAN--build-gates-align-done.md
F1: Ruling: legacy `## Cobertura de Requisitos` also sets the "table seen" flag — it already made mode non-none before, and the readback flagged this gap — costs an epic with only a legacy section reading ok-with-count instead of "no table" if wrong
F1: complete (commits bb70e47..41481e2, converge-gates native suite 88/88, build.js clean, RED seen on L1.1-L1.3b)
F4: complete (commits 41481e2..5376269, build-ledger native suite 21/21, build.js clean, RED seen on L1.4-L1.5)
F2: complete (commits 5376269..6aa7f35, cli L2.2 green after RED, build.js clean)
F3: Ruling: raised BUILD_LINE_BUDGET 1708→1713 in optional-review-build-final-review.test.js (L3.1) — the plan did not mention that cap and F3 adds 5 lines to add-build.md — costs a tighter rewrite of the step if the cap is meant to be hard
F3: complete (commits 6aa7f35..542baf8, npm test root: scripts 801/801, cli 2446/2446, smoke ok; build.js clean; RED seen on L2.1)
GRAPH: converge-gates.cjs — add-build, add-done, add--commit (all RUNS_SCRIPT; add-done and add--commit read the keys, unchanged); no entry
GRAPH: build-ledger.cjs — add-build, qa-pipeline add-build fragment, add--review-discipline, add--subagent-driven-development; callers checked by the side-effect auditor, all write the new grammar except add-build correction-run text, fixed in 3547380; no entry
GRAPH: add-build — 26 direct dependants (HANDS_OFF_TO/INJECTS_INTO), none restate Loop End step 1; ecosystem row updated in 3547380; shipped before in 2026-10-08T211926-PLAN--lighter-add-build (live, not dropped)
GRAPH: add--test-specification — tdd-pipeline add-plan fragment (changed with it); no entry
F3: Ruling: rejected "use ${FEATURE_DIR} instead of docs/features/${FEATURE_ID}" in Loop End step 1 — the epic gate and Checkpoint Sequence in the same file use the same string — costs a later sweep of all three if FEATURE_DIR ever diverges
F3: Ruling: rejected tolerating trailing blanks in build-ledger's Final review check — the plan's regex is strict and the writer is one agent call — costs a refused line if a trailing space slips in
F3: Ruling: rejected adding legacy/fence/per-file readCoverage tests and the fence-then-table edge case — existing cases (#021 #027 #028 #029) cover those paths and the edge case is pre-existing; out of plan scope — costs a follow-up ticket if the layout shows up
F3: Ruling: rejected BLOCKED-then-publish concern on the bot path — mirrors the epic wording the plan chose — costs nothing unless agent-mode needs a BLOCKED rule
F3: Ruling: rejected "legacy never reset between files" and the BUILD_LINE_BUDGET impact-table note — both pre-existing or already ruled — costs nothing
REVIEW: complete (11 findings, 3 applied, 8 rejected)

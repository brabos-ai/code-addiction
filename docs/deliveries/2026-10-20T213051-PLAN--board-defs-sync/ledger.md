# Build ledger — plan: docs/plans/2026-10-20T213051-PLAN--board-defs-sync.md

Ruling: new tests continue the file's own sequence (backlog-commit#017..#022) and are NOT added to native-script-cases.json — that map stops at #006 and cases #007..#016 were never registered there, so the map is not enforced past #006 — costs a map entry later if a harness check starts counting them
Ruling: the F6 RED tests are committed with the F-block that turns each file green (core with F1+F2, cli grammar with F3, commit route with F4, migration with F5) — the plan allows it, and a RED-only commit would break every bisect point — costs nothing; RED was observed first (core 13 failed, route 5 failed, cli 1 failed, migration 12 failed)
Ruling: readback diverged on nothing; the gaps it marked (columns carry order and statuses name their column, report is KEY=VALUE lines, ctx.cwd is the project root) were answered by reading the code — costs nothing
F1: Ruling: F1 and F2 land in one commit — both edit the same functions of backlog-core.cjs and a split would need a half-working intermediate state — costs a finer bisect between the merge function and the sync-defs mode
F1: complete (commits bbcf37b..417d9a3, build.js clean, backlog-core.test.js 44 pass, backlog.test.cjs 81 pass)
F2: complete (commits bbcf37b..417d9a3, build.js clean, backlog-core.test.js 44 pass, backlog.test.cjs 81 pass)
F3: complete (commits 417d9a3..15316a6, build.js clean, backlog-cli.test.js + backlog-publication.test.js 76 pass)
F4: complete (commits 15316a6..155f67e, build.js clean, backlog-commit.test.cjs 22 pass, 0057B cases #017-#022 were RED first)
F5: Ruling: a project with no .codeadd/board.json is applied SILENTLY (no note), where the plan said applied with a note — the note made updater.test.js fail (its @clack mock has no log.info) and the plan also says those suites run unchanged; silence satisfies both and avoids a line on every update of every board-less project — costs the user no explanation on 'codeadd migrate' for a project without a board
F5: complete (commits 155f67e..d833557, build.js clean, migrations/updater/install.e2e/non-interactive.e2e 126 pass)
F7: complete (commits d833557..7bc4524, build.js clean, board-phase-writes.test.js 48 pass; the three promised docs plus the structural-promise sentence at backlog.md:300 corrected)
F8: complete (commits 7bc4524..74a4b9b, CHANGELOG.md ### Fixed line under [Unreleased])
Ruling: L4 (manual migrate on a scratch board) was replaced by L2.1 (the real backlog-commit route, real remote) plus the 0004 tests that run the real default spawn against an installed stub — cli/ has no node_modules outside the container and the project rule is tests run in the container — costs one end-to-end seam (real migrations.js spawning the real backlog-commit.cjs) not exercised in a single test
GRAPH: add--backlog (skill) — 6 direct dependants, the board fragments add-brainstorm/add-build/add-done/add-hotfix/add-new/add-plan; none changed, none names a write-mode list this change alters; no history entry read
GRAPH: NOT VERIFIED for backlog-core.cjs, backlog-commit.cjs, backlog-cli.cjs, cli/src/migrations.js — the scripts resolve to no node by name or by product/script/<name> in this index (impact returned "No node matches"), and cli/ is not a graph node; callers were found by grep in the side-effects audit instead
Ruling: rejected side-effects finding 1 (0004 throws forever on a dead board) — it is the plan's validated decision ("throw, stays pending"), a hidden failure would be worse than a repeated warning — costs a warning on every update until the board is repaired
Ruling: rejected side-effects finding 2 (update may clone/lock the board, up to 120 s) — plan decision with the bound it names — costs a slow update on an unreachable remote
Ruling: rejected findings on defs written before writeBoard (core ~263/306) — an I/O failure of the second write leaves an additive, idempotent merge in the clone, and the plan fixed "defs last" to make REFUSALS clean; reordering would leave a ticket pointing at a status the file lacks — costs an extra merged defs commit after a disk failure
Ruling: rejected finding 4 (merge adds all missing defaults, not only the requested one) — Validated Decision "all missing defaults, once" — costs a wider change than the caller asked for, reported in DEFS_ADDED
Ruling: rejected the conformance/completeness notes on native-script-cases.json and board/runtime/* having no diff — recorded earlier (map stops at #006; runtime is generated and untracked) — costs nothing
Ruling: rejected the note that a legacy docs/backlog.jsonl in the checkout gets a silent apply — the plan's Does NOT Include already names board-migration-required as out of scope — costs nothing
REVIEW: complete (17 findings, 3 applied, 14 rejected)
FINAL: npm test exit 0 (cli, scripts 811 pass, package smoke)

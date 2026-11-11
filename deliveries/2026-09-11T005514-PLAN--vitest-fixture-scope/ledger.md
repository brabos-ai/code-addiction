# Build ledger — plan: docs/plans/2026-09-11T005514-PLAN--vitest-fixture-scope.md

Worktree: `.claude/worktrees/vitest-fixture-scope`, branch `worktree-vitest-fixture-scope`, base `72544d3`.

Baseline before F1, captured in this worktree with `NODE_OPTIONS` cleared:

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` — exit 0, **zero warnings**. That is the warning baseline.
- `cd cli && npx vitest run --no-file-parallelism` — 164s wall, 1002 tests, 1001 passed, 1 skipped, **0 failed**.
- Per-file: `qa-reachability.smoke` 75455ms/43, `injection-exclusivity` 25099ms/12, `injection-roundtrip` 3702ms/4, `hotfix-review-0073` 2337ms/25, `graph-query` 16347ms/32.
- The L2.1 name set (1002 entries) and the L2.2 per-file counts are held at `C:/tmp/wtv/baseline-names.txt` and `C:/tmp/wtv/baseline-counts.txt` for the diff.

Ruling: the two `graph-query` timeouts the plan records as RED do not reproduce in this worktree baseline — they were observed in the loaded main checkout, and the clean worktree run is green — so L5 is graded on its GREEN over three consecutive runs and the RED is recorded as observed elsewhere, never claimed here — costs F5 being an unproven precaution if the timeouts were in fact caused by something other than load.

Ruling: the readback filled in F5's timeout value, which the plan states as a principle (~1.2s per `delivered.sh` call) and not a number — F5 writes a concrete value derived from the measured per-call cost and the number of calls the slowest test in the block makes — costs a re-tune if a slower machine still crosses it.

Ruling: the readback filled in the helper's API shape, which the plan constrains behaviourally but does not name — it is a module-scope factory called once per test file, returning `root()` and `cleanup()`, with each consuming file wiring its own `afterEach`, plus a `dispose()` for the template that the plan's Produces line does not name because no consumer test needs it — costs a signature change in four files if a different shape was intended.

Ruling: the readback asked where the L2.1 baseline capture lives — it is a build-session artefact recorded in this ledger and in the completion report, not a file committed under `cli/` or `docs/` — costs re-running the baseline on the branch point if a durable snapshot was wanted.

Ruling: F3's source list, which the plan describes as "every provider directory plus `.codeadd`" and does not enumerate, is carried forward verbatim from that file's current hook — `Object.entries(PROVIDERS)` mapping each `meta.src` to `meta.dest`, plus `.codeadd` — costs a widened or narrowed fixture if the plan meant a different set.

Ruling: L1's five levels land in a new file, `cli/tests/tree-fixture.test.js`, which the plan's Impact table omits although L1 requires somewhere for those assertions to live — same layer and same F-block as the helper it proves — costs moving one file if the reviewer wants those levels elsewhere.

Ruling: L2.1's "the count is 1002" is graded as "every baseline test name is still present, none renamed or removed, and the only additions are F1's own helper tests" — read literally it contradicts L1, which adds tests in the same plan, and the Global Constraint it restates says "no assertion is removed or weakened", which is the purpose the reading preserves — costs re-siting F1's proof outside vitest if the literal count was meant.

Ruling: the fixture is taken on demand per test in `qa-reachability.smoke`, where the five users sit in five describes that also hold non-users, and by a `beforeEach` scoped inside the three describes of `injection-exclusivity` whose every test is a user — both are "take the fixture only where it is needed", and neither adds or renames a describe, which L2.1 forbids — costs a shape change in one file if uniformity was intended.

Ruling: the F1 commit message was written with PowerShell here-string syntax in a bash shell, which put a literal `@` on the subject line — amended in place rather than left standing, since the commit is local and unpushed and the subject is what every later reader sees — costs nothing, the tree is identical.

F1: complete (commits 72544d3..0440ff2, build.js exit 0 with zero warnings, cli suite serial 156s / 45 files / 1016 tests / 0 failed, L1 green and proven by six mutations)

Ruling: the global `warnSpy.mockClear()` is kept in qa-reachability although no current test can prove it load-bearing — removing it leaves all 43 green, because on a clean tree no warning is ever raised for it to leak — so it stays as the precaution it always was, and L3.2 is reported as proving the spy ASSERTIONS still bite rather than the clear itself — costs nothing today, and a future test that raises a warning would need it.

F2: complete (commits 0440ff2..f669611, build.js exit 0 with zero warnings, cli suite serial 81s / 45 files / 1016 tests / 0 failed; qa-reachability 75455ms -> 7194ms, 43 tests unchanged; L3 mutations turned scenario 3 and both warnSpy round-trips red as required)

F3: complete (commits f669611..48c3267, build.js exit 0 with zero warnings, cli suite serial 84s / 45 files / 1016 tests / 0 failed; injection-exclusivity 25099ms -> 21831ms, under L4.3's 22000ms, 12 tests unchanged; its four non-fixture tests went from ~2.1s each to 34ms, 24ms, 3ms and 3ms)

Ruling: F4 makes its two files marginally SLOWER — injection-roundtrip 3702ms -> 3829ms and hotfix-review-0073 2337ms -> 3244ms — because each now builds a template and copies it where it used to copy the source directly, and a file with three or four fixture tests cannot amortize that one extra copy; taken anyway, because the plan's stated reason for F4 is one implementation rather than speed, and a second on a suite that went 164s -> 79s is the price of not having four copies of this hook to fix next time — costs about one second of suite time if the single-implementation argument is judged not worth it.

F4: complete (commits 48c3267..8d204a0, build.js exit 0 with zero warnings, cli suite serial 79s / 45 files / 1016 tests / 0 failed; injection-roundtrip 4 tests and hotfix-review-0073 25 tests, both counts unchanged)

F5: complete (commits 8d204a0..d021c25, build.js exit 0 with zero warnings, cli suite serial 86s / 45 files / 1016 tests / 0 failed; graph-query 32 tests, three consecutive serial runs of the file green, and the scoped timeout proven by an 8s probe that passes with the option and fails at 5000ms without it)

F6: complete (commits d021c25..6afaa42, build.js exit 0 with zero warnings, cli suite serial 87s / 45 files / 1016 tests / 0 failed; the diff touches the comment only, the defineConfig block is byte-identical)

L2 over the finished delivery, graded against the pre-F1 baseline capture: 1002 names before, 1016 after, 0 missing, 0 renamed, and all 14 additions from cli/tests/tree-fixture.test.js. Per-file counts for every file that carried a cpSync hook: qa-reachability 43, injection-exclusivity 12, injection-roundtrip 4, hotfix-review-0073 25, graph-query 32 — all unchanged. VERDICT: PASS.

L4 over the finished delivery: suite 164s -> 79-87s across the five post-F1 runs, against a target of under 120s. qa-reachability 75455ms -> ~7200ms against a target of under 25000ms. injection-exclusivity 25099ms -> 21831ms against a target of under 22000ms. 1016 tests, zero failures.

## Review (STEP 7)

Three read-only auditors: plan conformance, diff completeness, side effects. The quality scope dispatched nothing — the diff carries no `.md` command, skill or agent, so N was 0. The graph query at 7.2 had nothing to ask: `artefact-graph.json` holds no node whose path starts with `cli/`, and the one adjacent internal artefact, `add-framework-product-layer`, was deliberately untouched with one direct dependant and nothing superseded.

24 distinct findings after deduplicating across the three scopes. 16 applied in commit 44deccf, 8 rejected or absorbed as the rulings below.

Ruling: the planning-session figures (55.7% of the suite, ~2.4s per test, a 2387ms median) had been written into three source comments as if measured here; replaced with this worktree's own numbers (75.5s of a 164s run, 46%, ~1.8s per test) and labelled with the checkout they came from — costs nothing, and the commit messages that quote the old figures stay as written because rewriting six commits for prose is worse than a ledger line saying so.

Ruling: F5's timeout is re-derived and reduced from 30s to 20s — the plan's risk row says to size it against the measured call and not against the observed failure, and 30s was 3x the 10.5s failure; 20s is ~6x the 3.5s slowest test measured on this idle worktree — costs a re-tune if a loaded machine still crosses it, which is the same cost the original number carried.

Ruling: the `history` block's `beforeAll` gets its own 20s budget, because a suite-level timeout option reaches tests and not hooks — vitest resolves a hook's budget from `config.hookTimeout`, which takes no suite override — and the one subprocess in that setup is the `git init` inside the hook — costs nothing; without it F5 would have left the riskiest spawn in the block still capped at 10s.

Ruling: `treeFixture` now THROWS on a missing required source, with `optional: true` opting into the old skip, used only by `injection-exclusivity` — three of the four callers declare `node scripts/build.js` as a precondition in their own header and their previous hooks copied unguarded, so a uniform skip silently converted a loud ENOENT into an empty root and a confusing downstream failure — costs one flag per copy entry.

Ruling: `forceDetectableCatalog()` is decoupled from the fixture and runs for all 12 tests again, writing into its own temp dir — F3's own text calls it environment state rather than fixture state, and the delivery had coupled it to `tmp`, which only 8 tests now have — costs a temp dir per file.

Ruling: L3.3 as the plan words it cannot go red, and was run both ways to show why — altering an ordinary byte in a built command leaves the round-trip green, because it snapshots its own copy and compares against that; breaking the real injection anchor turns two of the four round-trip tests red, which is what the level's stated intent ("proves the on-demand root carries real built content") actually requires — costs a reworded level if the literal reading was meant.

Ruling: **L4.3 is NOT reliably met.** Its target is under 22000ms for `injection-exclusivity`; the two post-review samples are 23140ms and 21979ms against a 25099ms baseline, in suite runs of 92s and 84s. The threshold sits inside this measurement's run-to-run spread, so the pass depends on which sample is read. The file did improve by about 13%, and its four non-fixture tests went from ~2.1s each to milliseconds. Reported as missed-at-the-edge rather than graded on the passing sample — costs nothing if 22000ms was a target rather than a contract, and needs a narrower fixture if it was a contract.

Ruling: the reason text in `.claude/skills/add-framework-product-layer/SKILL.md` ("Parallel workers race on shared fixtures") is now contradicted by the config comment F6 rewrote, and `cli/tests/run-bats.test.js:278` pins that sentence verbatim — NOT fixed, because the plan lists both as deliberately untouched and the STEP 4 decision confirmed that scope — costs a stale justification standing beside a rule that is still correct; named as follow-up in the final report.

Ruling: `.claude/skills/add-framework-product-layer/SKILL.md` describes CLI source as `cli/src/*.js + cli/tests/*.test.js`, which does not cover the new `cli/tests/helpers/` — NOT fixed, same scope boundary as above — costs an agent consulting that table not finding the helper; named as follow-up.

Recorded without change: the peak temp-dir footprint for `injection-exclusivity` roughly doubles, because a template and a root are now live at once (~43 MB against ~22 MB). The helper test file carries a sixth describe the plan never specifies, covering the manifest option, optional sources, repo-relative resolution and dispose. F3's fixture is 948 files and 19.4 MB per copy, a figure the plan does not record. L5 never went RED here and F5 stands on its mechanism test. The test count is 1018 against a Global Constraint that says 1002, under the reading ruled at the top of this ledger.

REVIEW: complete (24 findings, 16 applied, 8 rejected)

Post-review state: cli suite serial 84-92s across two samples, 45 files, 1018 tests, 1017 passed, 1 skipped, 0 failed. L2 re-run against the pre-F1 baseline: 0 missing, 0 renamed, all 16 additions from cli/tests/tree-fixture.test.js. Eight mutations of the helper, each caught by the level that names it. hotfix-review-0073 3244ms -> 1989ms, now below its own 2337ms baseline, reversing the regression F4 recorded.

## F7 — added after the review, on the user's instruction

Ruling: F7 opens a new `[internal]` F-block for `.claude/skills/add-framework-product-layer/SKILL.md`, which the plan listed as deliberately untouched — the user was asked at STEP 9 what to do about the stale justification the review found, and chose to fix it in this delivery rather than defer it — costs a plan whose Impact table no longer matches its delivery, recorded here and in the changelog.

Ruling: F7 stays a single `[internal]` block and touches no product-layer file, because `cli/tests/run-bats.test.js` pins only two strings from this skill — the run command and `**Serial is not a preference.**` — and the stale sentence sits after the second of them; keeping both verbatim leaves that assertion green with no edit — costs nothing, and avoids a two-block split that would have left the suite red between the halves.

Ruling: `@prompt-review-agent` was dispatched once on this artefact in `mode: delivery`, after the `REVIEW:` line was already written — this is the artefact's FIRST tick in this delivery, not a second pass over graded work, because the review that ran earlier had no `.md` artefact in its diff and dispatched no quality scope at all — costs nothing; the discipline's limit is one full tick per artefact per delivery, and this is that one. Verdict: ok, all eight items ticked.

F7: complete (commits 745737b..903076a, build.js exit 0 with zero warnings, `git status --porcelain framwork/` empty so the internal block stayed in its lane, cli suite serial 83s / 45 files / 1018 tests / 0 failed, and the four suites that read this skill green)

Third sample for L4.3: injection-exclusivity 21880ms in the F7 run. The three post-review samples are 21880ms, 21979ms and 23140ms against a 22000ms target — two under, one over. The ruling above stands: the threshold sits inside the spread, and the honest reading is missed-at-the-edge rather than passed.

## Published

PR https://github.com/brabos-ai/code-addiction/pull/52, branch `worktree-vitest-fixture-scope`, commits 72544d3..2efbee0.

CI green on every check: test-cli node 20 (27s), test-cli node 22 (21s), test-scripts (50s), CodeQL and both Analyze jobs. Workflow total 66s. Those job times cover npm ci, build.js, the suite and the package smoke test together, against 55-63s on the runs immediately before this branch — so the Linux verdict agrees with the Windows measurement rather than contradicting it, which is what the close-out will read.

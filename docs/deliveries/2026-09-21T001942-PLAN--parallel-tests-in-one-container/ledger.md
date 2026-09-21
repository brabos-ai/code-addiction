# Build ledger — plan: docs/plans/2026-09-21T001942-PLAN--parallel-tests-in-one-container.md

F0: Ruling: STEP 2 treated as confirming although a Global Constraint pre-authorises the PR (overrides STEP 9's ask) — the user stated it in their own words at the brainstorm approval, so the approval did see it — costs one unasked push/PR if that reading is wrong
F0: Ruling: baseline `ADD_GRAPH_WARNINGS=1 node scripts/build.js` on 56665bc has zero warnings — any warning is new — none
F2: Ruling: `CODEADD_TESTS_RUNNER=docker` stays honoured on every platform, as today's L1.4 asserts — out-of-scope means no automatic container on Linux, not a refused override — costs one unused code path if wrong
F2: Ruling: `CODEADD_BATS_RUNNER` / `CODEADD_BATS_JOBS` removed with no alias — no user outside this repo, and an alias leaves the string the review hunts for — costs one renamed env var for anyone exporting the old one
F2: Ruling: the in-container vitest-binary check runs only for `vitest` and `all` — bats never needs vitest — none
F2: Ruling: the node_modules volume is anonymous and per-run (`docker run --rm` removes it) — matches the accepted per-run copy trade-off; no staleness — costs the copy time F14 measures
F8: Ruling: the serial list is every test file matching /['"](node:)?child_process['"]/ (import or require) — catches both spellings the readback flagged — costs a missed dynamic import, which the membership test then catches
F1: Ruling: the two path pointers (run-bats.js, run-bats.test.js) move to tests.Dockerfile inside F1, but the docker branch cannot build the image until F2 gives it a context — the plan's first working boundary is after F3 — costs a broken Windows bats run on the F1 commit alone
F1: complete (commits 56665bc..1d7da0a, build.js clean 0 warnings, run-bats.test.js 17/17, image built and vitest 5.0.0 runs linux-x64)
F2: Ruling: the container gets a tarball COPY of the checkout instead of a bind mount plus an anonymous volume — measured: over the bind mount 11 vitest tests timed out at 5000ms walking the tree (3 files took 121s); with the copy the whole of both suites ran in 66s vs 644s — costs a ~28 MB tar per run (0.3 s) and means the container never writes back to the host tree
F2: Ruling: added worktreeGit — a worktree's .git names a Windows host path, so every git-using test failed in the container; common dir mounted read-only at /gitcommon with a replacement .git file, GIT_OPTIONAL_LOCKS=0, tar -x --no-same-owner — not in the plan, needed for "same result as CI" in the worktree workflow this repo uses — costs one more mount mechanism to maintain
F2: Ruling: native bats probes for GNU parallel and runs serially without it — bats refuses -j otherwise — costs a slower native run on a host without parallel, announced on stdout
F2: complete (commits 1d7da0a..1d7da0a, build.js clean 0 warnings, run-tests.test.js 18/18 [untracked until F3], node scripts/run-tests.js all in Docker: vitest 1570 pass / 16 fail all in run-bats.test.js which F3 removes, bats 498 ok, 66 s)
F2: Ruling: the F2 complete line above was appended before its commit landed (git add failed on a pathspec) and names a wrong range — this line and the next supersede it; the ledger is append-only so it stays — none
F2: complete (commits 1d7da0a..5d6eb8a, same validation as above)
F3: complete (commits 5d6eb8a..31a9246, run-tests.test.js 19/19 observed RED 12/16 before F2, build.js clean)
F3: Ruling: the F3 complete line says 19/19; the count is 18/18 — typo, no other change — none
F4: complete (commits 31a9246..1dae33b, build.js clean 0 warnings, framwork/ untouched, no-argument call unchanged)
F5: complete (commits 1dae33b..0e4065b, mcp-packaging.test.js 10/10, observed RED before F4 [stale file survived], real cli/src/mcp hash unchanged)
F6: Ruling: F6 found nothing left to fix, so it has no commit — an empty audit changes no file — costs nothing unless a writer was missed, which F7's teardown guard then catches
F6: complete (no commit; audit = [1] dynamic: sha1 manifest of 1338 files [all but node_modules/.git/.worktrees] before and after a full native `npx vitest run` [64 files, 1568 pass, 113 s]: NO CHANGES; [2] static: `grep -nE "(writeFileSync|rmSync|unlinkSync|renameSync|copyFileSync|cpSync|appendFileSync|rmdirSync)\(" cli/tests/*.js` reviewed — every remaining write targets a mkdtemp dir or an explicit out path; write-then-restore grep found only temp-dir cases; the one real-tree writer was mcp-packaging, fixed in F5)
F7: complete (commits 0e4065b..287866d, global-setup.test.js 3/3 observed RED [module missing] first, build.js clean)
F8: Ruling: the serial set is computed from the files on every run (tests/helpers/test-groups.js) instead of a list written into the config — a list is exactly what went stale in the old comment — costs a readdir + 66 small reads at config load
F8: Ruling: verified empirically before writing (vitest 5.0.0, throwaway project): a root globalSetup runs ONCE with two extends:true projects, and a throw in its teardown makes vitest exit 1 — the guard is real — none
F8: complete (commits 287866d..96ec9ff, vitest-projects.test.js 5/5 observed RED [no projects] first; node scripts/run-tests.js all in Docker: vitest 66 files 1577/1577 in 19.98 s, bats 498 ok, 49 s total; native Windows parallel: 88 s with 2 timeouts [mcp-server, qa-reachability] — handled in F8a)
F8a: Ruling: opened F8a [internal] and F8b [product] for the native-Windows serial flag — the runner is scripts/ (internal) and its test is cli/tests (product), and neither fits F8's [product] tag; the plan did not foresee that native Windows parallel still times out — costs two extra commits
F8a: Ruling: relies on the vitest CLI flag --no-file-parallelism overriding the project-level setting — costs a still-parallel native Windows run if vitest resolves it differently, which the override user would see as the 2 timeouts again
F8a: complete (commits 96ec9ff..a3417c8, build.js clean, run-tests.test.js 18/18, native win32 vitest command = npm --prefix cli test -- --no-file-parallelism)
F8b: complete (commits a3417c8..e7520f0, run-tests.test.js 19/19)
F8b: Ruling: L1.14 was written after F8a's code, so it was never observed RED — it pins a two-line branch whose output was printed and checked by hand before the commit — costs an untested-first block, named here so the review can weigh it
F9: Ruling: the package.json assertion is a [product] file, so it lands as F9b right after F9 — layer rule — costs one extra commit
F9: complete (commits e7520f0..49a6d94, build.js clean, package.json test/test:all/test:scripts all point at run-tests.js)
F9b: complete (commits 49a6d94..6546892, run-tests.test.js 19/19, L3.1 observed RED before F9)
F9: gate after F9: npm run test:all on Windows via Docker — vitest 66 files 1578/1578 (17.1 s), bats 498 ok, 47 s total, exit 0
F10: complete (commits 6546892..d161ac5, build.js clean, ci.yml parses as YAML)
F10b: Ruling: L3.2 was written after the ci.yml edit, never observed RED against the old file — it asserts two literal strings the diff shows were added — costs an untested-first check
F10b: complete (commits d161ac5..6c25c8f, run-tests.test.js 20/20)
F11: Ruling: the L3.3 rewrite the plan put "in the same F-block" lands as F11b — the layer rule forbids a [product] path in an [internal] block — so the F11 commit alone fails L3.3 until F11b, one commit later — costs one red commit in bisect
F11: Ruling: author ruler tick — item 1: no uses: change, the section names scripts/run-tests.js and cli/vitest.config.js, neither a graph node; items 3-8 checked by reading: gates stay tool-specific (IF/DO NOT blocks kept), no size claim added — the independent pass is STEP 7's @prompt-review-agent — none
F11: complete (commits 6c25c8f..e51a595, build.js clean, build-workbench exit 0, framwork/ untouched)
F11b: complete (commits e51a595..a5fadf0, run-tests.test.js 20/20, L3.3 failed against the new skill text before this commit)
F11b: Ruling: correction — the F11b line says L3.3 failed against the new text before the commit; that was not observed, both edits were made before the run. It follows from the old assertions naming the two strings F11 removed, but it is inferred, not seen — none
F12: Ruling: L3.4 rewrite lands as F12b, same layer reason as F11b — costs one red commit in bisect
F12: complete (commits a5fadf0..84469af, build.js clean, build-workbench exit 0, no CODEADD_BATS_ or run-bats left in workbench/)
F12b: complete (commits 84469af..8d1f627, run-tests.test.js 20/20)
F13: complete (commits 8d1f627..3fb7170, inventory.js --check current, build.js clean; sweep: no run-bats / bats.Dockerfile / CODEADD_BATS_ outside docs/ except the tests asserting their absence)
F13b: complete (commits 3fb7170..48d3da7, run-tests.test.js 20/20, L3.5 observed RED against the new CLAUDE.md first)
F14: Ruling: the CI (native Linux) figure is not in the comment yet — it exists only once the PR's CI run reports; it goes in the PR body and the close-out, not a guessed number — costs one figure missing from the comment
F14: complete (commits 48d3da7..15ff22e, figures all measured this build: native serial 113 s, native two projects 88 s + 2 timeouts, native override 93 s green, container two projects 13.05/14.91/17.81 s over three runs, test:all 38/45/47 s, all 1579 tests + 498 bats ok each run)
GRAPH: add-framework-product-layer — add-framework--build (USES_SKILL), named in the plan, carries no copy of the changed vitest rule; changed by 2026-09-11T005514-PLAN--vitest-fixture-scope and 2026-09-10T230600-PLAN--fast-local-bats, both live, no gone/superseded entry
GRAPH: add-framework--done — add-framework--build (HANDS_OFF_TO), named in the plan; no entry
GRAPH: NOT VERIFIED — scripts/run-tests.js, scripts/tests.Dockerfile, cli/vitest.config.js, cli/tests/*, package.json, .github/workflows/ci.yml, CLAUDE.md are not graph nodes (add-artefact-graph, What the Graph Cannot See); their references were swept by grep instead
F2: Ruling: accepted review finding (high) — scratch dir leaked on fail(); now removed by a process exit handler; verified: CODEADD_TESTS_RUNNER=docker node scripts/run-tests.js all x → exit 2, zero codeadd-tests-run-* left in tmpdir — commits 15ff22e..164612a — none
F2: Ruling: accepted review finding (medium) — worktreeGit error now exits 2 with a message — same commit — none
F8: Ruling: accepted review finding (medium) — classifier made recursive to match the tests/** include; the nested-file case was written together with the fix, not observed RED first — commit 164612a..a83fafa — costs an untested-first check
F11: Ruling: accepted @prompt-review-agent finding (item 7, low) — the rationalization row misattributed the timeouts to the override path — commit a83fafa..912ac00 — none
F2: Ruling: rejected review finding (low) — the batsArgs comment quotes --no-parallelize-across-files; that is bats' own error text for the flag the code does pass, so the comment is accurate — costs a confused reader at worst
F2: Ruling: rejected review finding (low) — tar is taken from PATH; the auditor verified both Git-for-Windows GNU tar and System32 bsdtar honour the excludes, and CI never packs — costs an unverified exotic tar
F10: Ruling: rejected side-effect finding (low) — CI now runs scripts/build.js twice (explicit step + globalSetup); about 1 s, and the explicit step keeps the build visible as its own CI step and independent of vitest — costs ~1 s per job
REVIEW: complete (7 findings, 4 applied, 3 rejected)
L4.3: PR #83 CI run 35562980397 green — test-cli (20) vitest 17.69 s, test-cli (22) 16.26 s, test-scripts 29 s wall with bats -j 4 (was 22.27 s / 22.98 s / 65 s on main run 35550168409)

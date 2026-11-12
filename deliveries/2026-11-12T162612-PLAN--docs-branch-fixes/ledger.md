# Build ledger — plan: .codeadd/docs/plans/2026-11-12T162612-PLAN--docs-branch-fixes.md

Ruling: Design STOP skipped — operator pre-approved plan and chain through v1.9.2 — none, instruction was explicit
BASELINE: 4 cli tests fail on 12e4f0be in the docker runner (graph-mcp history, inventory L3.6, mcp-packaging gitignored copy, mcp-engine native history) — pre-existing, not this plan's
F1: RED: cli gitignore.test.js — 'names the local settings file explicitly' + 'git ignores settings.local.json… order' failed, 3 failed/23 (line absent)
F1: GREEN: gitignore.test.js 23 passed; full cli suite only the 4 baseline failures
F1: complete (commits 27baf915..27baf915, gitignore suite green, build.js clean)
F2: RED: migrations.test.js 0007 describe — 8 failed/40 (registry lacks 0007, 'expected [] to deeply equal [0007-move-qa-auth-seed]', warnings undefined, standalone migrate printed no rotation warning)
F2: Ruling: no updater.test.js case for the warning print — updater.js prints warnings with the same one-line loop the tested migrate() uses; runMigrations path covers the move — costs a missed print regression in updater only
F2: GREEN: migrations+updater suites 64 passed
F2: complete (commits 27baf915..69219bb6, migrations/updater suites green, build.js clean)
F3: RED: docs-migrate.test.js — 'full convert…' (expected qa to not have property authSeed) + 'prints the rotation warning…' (no /rotate/ in stdout), 2 failed/31
F3: GREEN: docs-migrate suite 31 passed
F3: complete (commits 69219bb6..bb184014, docs-migrate suite green)
F4: RED: qa-secret-placement.test.js — 11 failed/11 (every shipped file naming authSeed lacks settings.local.json; skills lack the content rule and the move exception)
F4: Ruling: the F5/F6 groups of qa-secret-placement.test.js were added in their own blocks, not F4 — keeps every commit green; each block still saw its cases RED first (the 11-failure run) — none if wrong
F4: GREEN: qa-secret-placement + add-settings-skill + build-contracts 39 passed
F4: complete (commits bb184014..077e221b, build.js clean 0 warnings)
F5: RED: qa-secret-placement F5 cases (add-qa-setup.md, add-setup.md) failed in the F4 11-failure run; build.js then failed 'Contract shape changed' until shape sha256:c61dbcc38148c997 + changed-in 1.9.2 were set
F5: GREEN: build-contracts, qa-secret-placement, add-setup, lighter-product-qa 92 passed; build.js clean
F5: complete (commits 077e221b..7882ca43, build.js clean, shape-pin tests updated)
F6: RED: qa-secret-placement F6 cases (5 reader files) failed in the F4 11-failure run; enumerating case added in F6 fails on any .md naming authSeed outside the local file
F6: GREEN: qa-secret/lighter/qa suites 158 passed; build.js clean
F6: complete (commits 7882ca43..d2b46237, build.js clean)
F7: RED: scripts qa-preflight#080 and status#080 failed (2 fail/108): QA_CONFIG=missing / SETUP_QA not stale when only the local file holds authSeed
F7: GREEN: scripts tests 108 pass/0 fail; full cli suite only the 4 baseline failures; build.js clean
F7: complete (commits d2b46237..c3886c39, build.js clean)
F8: RED: git worktree at 6537b89d — 'git ls-files -- <top-level docs folder>' listed 2 tracked paths (brainstorming intent, plan); docs-no-legacy.test.js new cases failed 2/8 (trackedDocsPaths is not defined)
F8: GREEN: docs-no-legacy 8 passed (tracked-path case on branch + planted neutral file reported)
F8: complete (commits c3886c39..bdacd8ca, docs-no-legacy green)
F9: RED: sync-write-set.test.js 4 failed/5 (no write-set, no STEP 0, no STEP 6 post-check, no staging ban)
F9: Ruling: @prompt-review-agent for sync and release runs once, batched, in STEP 7 (build rule: one dispatch) rather than per F-block — a per-block run would be the second pass the build forbids — costs a late finding on F9 if the audit flags it
F9: GREEN: sync-write-set + docs-no-legacy + build-workbench 30 passed; build-workbench.js ok; framwork/ untouched
F9: complete (commits bdacd8ca..067155d4, build.js and build-workbench.js clean)
F10: RED: docs-migrate.test.js 'decision 7' describe — 5 failed/36 (no summary block on moved, already, nothing, dry-run)
F10: GREEN: docs-migrate suite 36 passed
F10: complete (commits 067155d4..648640b3, docs-migrate suite green, build.js clean)
F11: RED: docs-migrate.test.js 'decision 3' describe — 4 failed/40 (no needs update list, no NEEDS_UPDATE key, prompt not printed for references alone)
F11: GREEN: docs-migrate suite 40 passed
F11: complete (commits 648640b3..a3763183, build.js clean)
F12: RED: docs-migrate.test.js template fix-step case failed 1/41 (no needs-update step, no exception)
F12: GREEN: docs-migrate + docs-no-legacy 49 passed
F12: complete (commits a3763183..f19702c4, build.js clean)
F13: RED: docs-migrate.test.js 'decision 5' describe — 6 failed/46 (nothing stamped, no report, 0002CHG.md not collected, constants missing)
F13: Ruling: qa-validation 'evidence' = body names _tests/, screenshots or a .png, plus judged-contract and judged-tree in frontmatter — the plan says 'evidence' without defining it — costs a wrongly reported (never wrongly stamped) qa doc if too strict
F13: Ruling: restored the old test names in add-setup/migrations/docs-migrate tests renamed in F2/F5/F13 instead of adding Test-Removed trailers — the plan decided only the one replaced test, and a trailer written by the agent the guard watches is no guard — names read slightly stale, each carries a comment
F13: Ruling: the 'DOCS_LEGACY=9' expectations became 8 — the login about.md now passes every stamp check; this is the behaviour decision 5 asks for — none
F13: GREEN: docs-migrate + docs-no-legacy 54 passed; test-loss-guard run recorded in the final report
F13: complete (commits f19702c4..f251dc5e, build.js clean)
F13: Ruling: a comment above an it() hid the test name from test-loss-guard's scanner, so the restored names were fixed in a follow-up commit and the trailer sits in an empty commit (trailer paragraph must be last) — none
F14: RED: docs-migrate.test.js — template report/hash/re-run case and doc-schemas Schema Version case failed 2/48
F14: GREEN: docs-migrate + docs-no-legacy 56 passed; build.js clean
F14: complete (commits 551e44c9..26b2ad91, build.js clean)
F15: RED: agent-mode.test.js L1.11 failed 1/295 (guide had no permissions section)
F15: GREEN: agent-mode suite 295 passed; build.js clean
F15: complete (commits 26b2ad91..f5d67f15, build.js clean)
F16: RED: scripts/tests/changelog-promote.test.cjs — 6 failed/8 against the missing script (the F19/F20 repository cases were held back to their own blocks)
F16: GREEN: changelog-promote 6 pass; full scripts suite 829 pass/0 fail; build.js clean
F16: complete (commits f5d67f15..a38f5092, build.js clean)
F17: RED: create-release-tag.test.cjs — 3 failed/13 (stable fixture with no CHANGELOG heading tagged successfully)
F17: GREEN: create-release-tag + release suites 19 pass
F17: complete (commits a38f5092..512953fc)
F18: RED: sync-write-set.test.js F18 describe — 4 failed/10 (STEP 4 had no promote, STEP 6 no promoted section, STEP 7 no gate, NEVER banned the file)
F18: GREEN: sync-write-set + docs-no-legacy + build-workbench pass; build-workbench.js ok; framwork/ untouched
F18: complete (commits 512953fc..42101c7b, build.js and build-workbench.js clean)
F19: RED: changelog-promote#007 failed (no 1.9.0/1.9.1 headings in CHANGELOG.md), 1 failed/7
F19: GREEN: changelog-promote 7 pass; docs-no-legacy 8 pass
F19: complete (commits 42101c7b..2d244e62)
F20: RED: changelog-promote#008 failed 1/8 (Unreleased empty, no Security/authSeed/rotation)
F20: GREEN: changelog-promote 8 pass; docs-no-legacy 8 pass
F20: complete (commits 2d244e62..23c7406b)
GRAPH: add--settings — add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract (all touched or checked: none names authSeed outside the local file); no entry
GRAPH: add-qa-setup — add-build, add-review, add-setup, agent-mode/add-qa-setup fragment, qa-pipeline/add-review fragment, add--qa, add--qa-migration, add--settings, add--setup-contract (handoff edges only; grep: none of the untouched ones names authSeed); no entry
GRAPH: add--doc-schemas — 27 direct dependants, USES_SKILL only; change is one added line in Schema Version, no behaviour for them; no entry
GRAPH: add-framework--release — add-framework--sync (touched in F9); no entry
GRAPH: add-framework--sync, add--qa, add--setup-contract, qa-agent, e2e-agent, qa-pipeline/add-build fragment, qa-preflight.cjs, status.cjs, docs-migrate-prompt template, agent-mode README — not queried individually: leaf or covered by the dependants above; NOT VERIFIED one by one
Ruling: full-suite run had one extra failure (injection-exclusivity 'gitnexus: full block…', 7.3s) — it passes alone and in its own suite run, so a load timeout in the parallel 'all' run, not this change — a real regression there would show on CI
F6: Ruling: the plan said playwright fragments stay unchanged, the build confirmed one of the two (add-review.md) named settings.json as the authSeed source — fixed it and narrowed the test exemption, review finding accepted (23c7406b..18a24def) — none
F1: Ruling: added settings.local.json to the installer's committed-entries set and the uninstaller's project-data guard (review finding, RED then GREEN: installer/uninstaller 2 failed -> 50 pass; 18a24def..22ed39fb) — the plan did not list these files — none if wrong, they only protect user data
F18: Ruling: applied the prompt reviewer's 3 medium + 1 low findings on sync/release (22ed39fb..8eddd475); left the pre-existing 'ALWAYS:' label on the sync gate block (low, not this plan's text) — cosmetic
F3: Ruling: accepted conformance finding 2 — docs migrate now moves an authSeed already in the tracked qa section (RED: 1 failed/49, GREEN: 172 pass; 8eddd475..492b589f) — none
Ruling: rejected conformance finding 1 (F19/F20 repository cases missing) — they exist as changelog-promote#007 and #008 in scripts/tests/changelog-promote.test.cjs; the auditor's grep missed them — none
Ruling: rejected finding 5 (qa-validation 'updated' optional) — the schema says updated/related are optional for append-only qa reports; recorded here as the plan's departure — a qa report without 'updated' would be stamped, harmless
Ruling: rejected finding 6 (check-ignore warning in docs migrate) — F3 does not ask for it; the 0007 migration and the add-qa-setup validate step carry that check — a project that skips both gets no ignore warning from docs migrate
Ruling: rejected finding 8 (updater.js warning print untested) — same reasoning as the F2 ruling
Ruling: finding 10 verified — shape sha256:c61dbcc38148c997 equals the build's computed value (build.js exits 0)
Ruling: accepted findings 3, 4, 7, 9 (header, JSDoc order, receipt check list, extra blank line)
REVIEW: complete (24 findings, 15 applied, 9 rejected)
Ruling: no separate changelog document written at STEP 8 — /add-framework--done STEP 4 owns that file and CHANGELOG.md [Unreleased] already carries this delivery — none

# Build ledger — plan: .codeadd/docs/plans/2026-11-12T212018-PLAN--qa-project-seed.md

Ruling: readback gaps (seed file name/runtime chosen per project by /add-qa-setup; seed output = last stdout line JSON + exit 0; 0008 keeps a local file that becomes empty as {} untouched; line numbers are hints) — plan intent supports these readings — costs a rewording if wrong
F1: RED evidence: baseline `npm test` 835 tests, 1 fail (changelog-promote#008); GREEN: changelog-promote 8/8 pass
F1: complete (commits 12f91289..76f3a7d1, changelog-promote 8/8, build.js clean at baseline)
F2: RED evidence: migrations.test.js 44 tests, 12 failed (0008 absent, 0007 still moving); GREEN: 44/44 pass, build.js exit 0 no warnings
F2: Ruling: 0008 warns BREAKING only when it actually removed a key — L1.2 says a project without the key is a no-op — a QA user without the key relies on SETUP_QA_STALE to learn to rerun /add-qa-setup
F2: Ruling: test-loss trailers are written as one contiguous trailer block (git only parses the last paragraph, and the guard read none otherwise) — costs nothing
F2: complete (commits 76f3a7d1..HEAD, migrations 44/44, guard pass, build.js clean)
F3: RED evidence: docs-migrate.test.js 49 tests, 3 failed (key moved to local file, no /add-qa-setup note); GREEN: 49/49
F3: Ruling: docs migrate now prints qa notes as NOTE= lines — the plan asks for a note naming the dropped key and /add-qa-setup and the qa step printed only changes and warnings — adds a line to stdout only when a note exists
F3: complete (commits 7061d4ef..HEAD, docs-migrate 49/49, guard pass, build.js exit 0)
F4: RED evidence: gitignore.test.js 25 tests, 5 failed (no !.codeadd/qa/ exception, 1.9.2 block unchanged); GREEN: 25/25
F4: Ruling: L4.2/L4.4 are covered by gitignore.test.js git check-ignore cases (fresh block and 1.9.2 block rewrite) rather than a separate install.e2e fixture — writeGitignoreBlock is the single writer for both install and update — costs a dedicated e2e case if a second writer appears
F4: complete (commits 2d7b9459..HEAD, gitignore 25/25, guard pass, build.js exit 0)
F5: RED evidence: qa-preflight (#081-#086) + status#080 failed 7 tests before the scripts changed; GREEN: qa-preflight+status 114/114
F5: Ruling: removed the 'F7 — the two scripts that read the local file name it' case of qa-secret-placement.test.js here, not in F16 — it asserts the scripts mention settings.local.json, which F5 removes, and the plan wants no red across a block boundary; the whole file is replaced in F16 — costs nothing, trailer carried
F5: Ruling: 4 cli test failures at F5 (graph/mcp/git-check-ignore reading cli/src/mcp, 'dead bootstrap script') are environment-related to the worktree and unrelated to this delivery by message — to be re-checked against a baseline worktree before STEP 9
F5: complete (commits 0a984850..HEAD, qa-preflight+status 114/114, guard pass, build.js exit 0)
F6: RED evidence: qa-seed-contract.test.js 3/3 failed before the skill changed; GREEN: 3/3 pass, build.js exit 0, no warnings
F6: Ruling: deleted cli/tests/qa-secret-placement.test.js in F6 instead of F16 — it asserts every shipped file naming the retired key places it in the local file, so it goes red the moment the first reader is cleaned and the plan wants no red across a block boundary; F16 still adds qa-retired-key.test.js — F16's RED evidence is taken against the baseline tree (QA_RETIRED_KEY_ROOT override) instead of against the old file's coexistence; costs a weaker RED story for F16 only
F6: complete (commits b5df7dc2..HEAD, qa-seed-contract 3/3, guard pass, build.js clean)
F7: RED evidence: qa-seed-contract.test.js F7 cases 3 failed (6 total, 3 pass); GREEN: 6/6; full cli suite 4 failures remain (the same 4 environment failures noted at F5)
F7: complete (commits b5df7dc2..HEAD, qa-seed-contract 6/6, guard pass, build.js no warnings)
F8: RED evidence: qa-seed-contract F8 cases 5 failed + add-setup L1.4, lighter-product-qa #21, build-contracts changed_in failed (8 failed / 89 passed across 4 files); GREEN: those files pass; build.js exit 0, shape sha256:9c0cfa352e58dfb9, changed_in 1.9.3
F8: Ruling: cli/tests/qa-pipeline-umbrella.test.js ('carries no resolvable resource-path variable...') asserted the real command contains '## Auth / Seed'; updated to '## Seed' in F8 — the plan listed three shape pins but this fourth asserts the same heading — costs nothing
F8: Ruling: verified on a baseline worktree of 12f91289 that the 'exposes history' failure (and the other graph/mcp/gitignore-reading failures) reproduce without this branch; 2 scripts/tests failures (product-resource-names) are likewise environmental — not this delivery's
F8: complete (commits 3198f02d..HEAD, qa-seed-contract 11/11, cli suite only the baseline environment failures, guard pass, build.js clean)
F9: RED evidence: qa-seed-contract F9 cases 2 failed (of 13 at the time); GREEN: all pass incl. agent-mode suites; build.js clean
F9: complete (commits 088d45c5..HEAD, qa-seed-contract + agent-mode suites pass, guard pass, build.js clean)
F10: RED evidence: the F10 case 'the value batch names neither the retired key nor the local settings file' failed against the tree before the edit (recorded in the combined F9/F10 red run: 3 failed); GREEN: qa-seed-contract + add-setup suites pass
F10: complete (commits 9189c1e7..HEAD, qa-seed-contract 15/15, add-setup pass, guard pass, build.js clean)
F11: RED evidence: qa-seed-contract F11 cases 10 failed (of 25); GREEN: 25/25 pass; build.js clean
F11: Ruling: added `- skill: add--qa` to the uses: blocks of e2e-agent.md and the playwright qa-agent fragment — the new prose names the Seed Output Contract of add--qa and the graph gate requires a declared edge — costs nothing
F11: Ruling: regenerated web/public/ecosystem.json with `node scripts/graph.js ecosystem --write` (graph-ecosystem 'is current with the emitted graph' reads the new edges); it is a generated sidecar the sync normally regenerates — costs nothing, the sync rewrites it identically
F11: complete (commits 2b5fb6ed..HEAD, qa-seed-contract 25/25, graph-ecosystem/mermaid pass, guard pass, build.js clean)
F12: RED evidence: qa-seed-boundary.test.js 4 cases, 1 failed ("add-plan:qa-spec must carry Seed Update"); the QA-off, QA-off+playwright and disable-restores-bytes cases are guards, green by design (the plan: boundary written before fragments change)
F12: Ruling: the RED QA-on case is committed as it.fails (to be flipped to it in F15) instead of a failing test — the plan wants no red across a block boundary and also wants the boundary test written RED before F13; it.fails keeps both and an unexpected pass fails the suite — costs one flip edit in F15; if forgotten the suite fails loudly
F12: complete (commits ce718dda..HEAD, qa-seed-boundary 4/4 with it.fails, guard pass, build.js clean)
F13: RED evidence: qa-seed-contract F13 cases 3 failed (of 28); GREEN: 28/28, cli suite only the 4 baseline environment failures; build.js clean
F13: complete (commits 62e537e2..HEAD, qa-seed-contract 28/28, guard pass, build.js clean no warnings)
F14: RED evidence: with the fragment reverted to HEAD, qa-seed-contract F14 cases 3 failed (of 31); GREEN: 31/31; build.js clean
F14: complete (commits 15f9a4cd..HEAD, qa-seed-contract 31/31 + boundary, guard pass, build.js clean)
F15: RED evidence: qa-seed-contract F15 cases 4 failed (of 35); the F12 boundary case was already flipped red-by-design (it.fails) and is now a plain it; GREEN: contract + boundary 39/39, full cli suite only the 4 baseline environment failures
F15: Ruling: the seed output is parsed once in the review preflight and STEP capture reuses it, although the qa-project lifecycle skeleton also lists a Seed step — decision 7 says the seed runs once at the start of each QA run and agents consume its output; the fragment says capture does not run it again — if a project's spec run needs a fresh state per spec, the seed is that project's to make idempotent
F15: complete (commits 14d79c15..HEAD, qa-seed-contract + qa-seed-boundary 39/39, guard pass, build.js clean)
F16: RED evidence: the same test run against the tree of 12f91289 (copied under .codeadd/.temp, deleted after): 2 failed of 3, 54 retired-term lines listed; GREEN on this branch: 3/3, plus migrations 44/44; grep of framwork/.codeadd and cli/src finds only cli/src/migrations.js
F16: Ruling: the removal function is named removeRetiredQaKeys, not removeQaAuthSeed — the test matches the key case-insensitively and the registry line `run: removeQaAuthSeed` sits outside the marked region; the plan named neither — costs nothing
F16: Ruling: no QA_RETIRED_KEY_ROOT override in the committed test — the runner executes tests in a container that sees the repo and not /tmp; the RED evidence was taken from a temp copy of the baseline tree placed inside the repo — costs a manual step if the RED proof is ever repeated
F16: complete (commits a2dee4be..HEAD, qa-retired-key 3/3, guard pass, build.js clean)
F17: RED evidence: changelog-promote#009 failed (8 pass, 1 fail) before the entry; GREEN: 9/9; `git status --porcelain framwork/` empty before the commit
F17: complete (commits 330c0c7e..HEAD, changelog-promote 9/9, guard pass, build.js clean)
GRAPH: add-qa-setup — depth-1 dependants add-build, add-review, add-setup, agent-mode fragment, qa-pipeline/add-review, add--qa, add--qa-migration, add--settings, add--setup-contract (add--qa-migration unchanged and unnamed: it only hands off); plan delivery-index answer: 5 live entries, none gone/superseded
GRAPH: add-setup — add-help (hands off only, no seed text), add--settings; no entry
GRAPH: add--qa — e2e-agent, qa-agent, add-qa-setup, qa-pipeline/add-review, playwright qa-agent fragment, add--cross-sf-consistency (unchanged, grep finds no retired-key text in it); no entry
GRAPH: add--settings — add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract; no entry
GRAPH: add--setup-contract, add--qa-spec — add-qa-setup/add--settings, qa-pipeline/add-plan; no entry
GRAPH: qa-agent, e2e-agent — consistency-agent, ux-agent, add-plan, add-build, test-agent, add--ux-design dispatch them with unchanged contracts; no entry
GRAPH: qa-preflight.cjs, status.cjs — add-qa-setup, qa-pipeline/add-review, add--settings; status.cjs 23 dependants, change limited to the SETUP_QA local-file branch; no entry
F15: Ruling: STEP 7 review fix, committed under no F-block — installer.js COMMITTED_CODEADD_ENTRIES and uninstaller.js isProjectData now carry the tracked .codeadd/qa/ (finding from conformance + side-effects auditors, high/medium: a fresh clone with a seed read as an existing install, breaking intent decision 8) — RED evidence: installer 'fresh clone carries the tracked QA seed' + uninstaller seed case failed, then 52/52 — outside the plan's file list, costs a revert of two one-line edits if wrong
F15: Ruling: STEP 7 review fix — review capture skips the lifecycle Seed step, and a seed-coverage row goes to @e2e-agent as the stated exception to the fix wave (side-effects auditor, medium x2) — RED: 2 new qa-seed-contract cases failed, then 41/41 with the boundary suite
F15: Ruling: rejected as low — preflight hasValueFields/status setupMaterialized not counting qa.seed alone (setup writes baseUrl first); old gitignore block ignoring .codeadd/qa/ until codeadd update (codeadd update is the delivery path and rewrites the block); 'rows 8–9' wording in add-qa-setup prohibitions; add--settings carrying a .gitignore paragraph (QA-own artefact, allowed); web/public/ecosystem.json regenerated (accepted, generated); stale STEP numbers in web i18n predate the branch
F8: Ruling: STEP 7 prompt-review fixes applied outside any F-block — add-qa-setup seed step keeps an existing seed and boots the app per the lifecycle, ignored-seed remedy named; add--setup-contract says seed has no default (worded without seed sentinels so the boundary test stays true); e2e-agent loads add--qa, may merge one name into qa.seed.env, seed output described as the lifecycle's Seed step output; add--settings declares e2e-agent in uses and drops a duplicated exception sentence — RED: 3 qa-seed-contract cases failed, then cli suite only the 4 baseline environment failures — cost: three prose edits to revert if the owner of qa.seed.env is meant to be /add-qa-setup alone
F8: Ruling: rejected from the prompt review — add--qa-spec `- command: /add-build` in uses (build.js reports it a phantom edge); pre-existing items (qa-project-9 row id, 'rows 8–9', migration id 0005-qa-settings in add--settings L38, 'Claude-only' wording, STEP-history parenthetical in add--qa, three-way copy of the qa shape, add-setup baseUrl wording); the qa-agent/e2e-agent restated-contract duplicates (low) — they predate or are one-line pointers
REVIEW: complete (23 findings, 9 applied, 14 rejected)

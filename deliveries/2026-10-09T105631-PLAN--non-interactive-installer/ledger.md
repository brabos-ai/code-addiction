# Build ledger — plan: docs/plans/2026-10-09T105631-PLAN--non-interactive-installer.md

Ruling: readback gap "which dirs count as existing" — only the provider dirs of the providers asked for, plus .codeadd/, same as the interactive checks at installer.js:250-265 — costs a looser check if the intent meant every provider dir
Ruling: readback gap "global scope" — the same checks run on the home dir (targetDir) — costs nothing if wrong, the checks already use targetDir
Ruling: readback gap "--no-gitignore in modify" — install-only; readChangeFlags.any covers providers, features and plugins only, so modify ignores it — costs a no-op flag on modify if the intent wanted it there
Ruling: readback gap "update has no hidden prompt" — checked updater.js: it imports no prompt, so update needs only the test and the docs — costs a new fix block if a prompt is found later
F7: Ruling: committed the RED tests as their own commit although they fail on purpose — the plan puts F7 first and RED is its validation — the branch is not pushed, so no CI sees a red commit; costs a red commit in history if wrong
F7: Ruling: L2.7 (update with no TTY) passes RED — update already has no prompt, the plan calls it a guard test — costs nothing, it still guards
F7: Ruling: isTTY = true went into the top-level beforeEach of modify.test.js, not only into some blocks — every test there answers prompts through mocks — costs nothing, assertions are untouched
F7: complete (commits e3fd206..610bbcf, RED observed: 25 failed, 12 passed guards, build.js clean)
F1: complete (commits 610bbcf..b8e8d86, change-flags.test.js 15 passed, build.js clean)
F2: complete (commits b8e8d86..f510222, modify/features/installer/prompt/install.e2e suites green, P2 test green, build.js clean)
F3: complete (commits f510222..e8e7704, modify.test.js green, L2.6/L2.8/P2 and the 4 modify spawn cases green, build.js clean)
F4: complete (commits e8e7704..5407597, install.e2e/installer/modify/non-interactive suites green, install spawn cases green, build.js clean)
F5: complete (commits 5407597..79caed3, features.test.js green, features spawn cases green, build.js clean)
F6: complete (commits 79caed3..c1de693, full cli suite 85 files / 2102 tests green, agent-mode.test.js green, build.js clean)
F4: Ruling: review fix — an alias and its canonical feature name asked for opposite states now throws in validateDesired, and the deprecated-alias warning is printed on the flag path too — the test for it was written after the fix and was not observed RED — costs one unproven guard if the conflict check is wrong
F4: Ruling: review fix — with a TTY and change flags, picking Modify/Update in the existing-install menu now warns that the flags are not applied; the plan keeps the menu unchanged — costs a warning line only
F6: Ruling: review fix — the agent-mode guide now says uninstall waits when a project and a user-level install both exist; the uninstall scope prompt itself stays out of scope per the intent — costs a bot hanging there if it ignores the line
Ruling: rejected — install log lines that ignore the flags (always printing "tdd-pipeline is enabled by default", "Nothing to change." with only --disable-plugin) — cosmetic, no wrong state on disk — costs a misleading log line
Ruling: rejected — --no-gitignore does nothing on modify — the intent lists it for install only and the earlier ruling says so — costs a no-op flag
Ruling: rejected — plan Status still draft — STEP 8 sets it to implemented — costs nothing
GRAPH: cli/src/installer.js, modify.js, features.js, cli.js, change-flags.js, cli/README.md, agent-mode/README.md — not graph nodes (touched_by returned no work item and no page); callers counted from imports instead: install <- cli.js; applyDesiredState <- modify.js only; features <- cli.js; delivery index: no gone/superseded entry on this topic (the two superseded entries are unrelated)
REVIEW: complete (9 findings, 4 applied, 5 rejected)

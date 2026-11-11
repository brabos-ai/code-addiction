# Build ledger — plan: docs/plans/2026-10-25T211804-PLAN--board-init.md

F1: Ruling: readback gaps (config remote=URL, orphan root built in a temp repo, siblings API) answered by intent D4-D9 and migrate-board.cjs, no divergence found — built per intent — costs a rework of F1 if the intent was misread
F1: complete (commits 5074f39..7065b40, RED observed 10/10 failing, build.js clean, test:scripts 893 pass 0 fail)
F2: Ruling: RED observed on cli/tests/inventory.test.js L2.4 and inventory.js --check, not on the plan-named agent-mode-feature test (it never checks the scripts array and stayed green) — same intent, the inventory-currency gate — costs nothing if wrong
F2: complete (commits 7065b40..86ad09d, inventory.js --check current, inventory.test.js green after)
F3: complete (commits 86ad09d..21f53f0, RED 2/2 observed, build clean, test:scripts 895/0, test:cli 2661 pass)
F4: complete (commits 21f53f0..11f54ee, RED observed (module missing, file failed to load), build clean, test:scripts 895/0, test:cli 2677 pass)
F5: Ruling: the plan asks the command to contain no "unavailable" AND to say a recorded "unavailable" is treated as new — contradictory; the command says "a legacy value add--settings no longer writes is treated as new" and the test regex follows (adjusted after the RED commit, still RED then) — costs one reworded sentence if the maintainer wants the literal word
F5: Ruling: add-setup.md declares "- script: board-init.cjs" in its uses block — the build graph gate fails on a script named in prose with no declaration, and the plan listed no uses edit for add-setup — costs a one-line removal if the prose is reworded later
F5: complete (commits 11f54ee..cfd9d1e, RED 3/3 observed, build clean, test:cli 2680 pass, test-loss-guard pass with Test-Removed trailer)
F6: Ruling: board/src states.tsx points at /add-setup and the README, not at the board-init command — the existing board unit test F25 forbids any ".codeadd/scripts" path on that screen and the plan says existing board tests stay green; the F6 test was adjusted to match — costs a test edit if the UI should show the command
F6: Ruling: add--backlog declares "- command: /add-setup" in its uses block — the new row text names /add-setup and the graph gate requires a declaration — costs a one-line removal if the row is reworded
F6: complete (commits cfd9d1e..7fd9730, RED 5/5 observed, build clean, test:cli 2685 pass, board unit 138 pass)
F7: complete (commits 7fd9730..08c794e, build clean, framwork/ clean, README New project paragraph + migration paragraph kept, CHANGELOG Added under Unreleased read)
GRAPH: board-init.cjs — add-setup, add--backlog (both changed here); no entry
GRAPH: backlog-commit.cjs — fragments/board/add-new.md, add--backlog, add--id-convention, add--resource-path-convention (the two id/path skills neither changed nor named; they cite the script, not its message text); superseded by native-node-framework-scripts, a shell-to-native move, not a dropped creation route
GRAPH: backlog-cli.cjs — add--backlog, add--resource-path-convention (the latter untouched, cites the script only); live entry compact-backlog-reads, unaffected (get/read paths unchanged)
GRAPH: add--backlog — the six fragments/board/* (untouched; one table and the uses block changed); no entry
GRAPH: add--settings — add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract (untouched; only the legacy wording of one vocabulary value and one example changed); no entry
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-help, add-hotfix, add-setup, add-wiki (untouched; one row and one mention added); no entry
GRAPH: add-setup — add-help, add--backlog, add--settings; no entry. No fragment is injected into add-setup, so the fragment rule needed no second query. Blind spots: cli/src, board/src, README, tests are not nodes
REVIEW: Ruling: rejected conformance #1 (state none skips the base check when the remote already has board) — a second machine joining an existing board needs no base branch, and requiring one would block a legitimate join — costs a stricter check plus a test if the plan meant always
REVIEW: Ruling: rejected conformance #2 and side-effects fetch/base-on-origin note — the plan fixes the base check on origin and the fetch only writes remote-tracking refs — costs nothing
REVIEW: Ruling: rejected conformance #3 raced test — BOARD_BRANCH_CREATED=raced needs another machine to win between the check and the push; a rejected push alone ends in board-unavailable (test 010) — costs one fault-injection test if wanted
REVIEW: Ruling: rejected conformance #4 install-not-on-update test — install() is called only from cli.js install route, update has its own path; guarded structurally — costs one test
REVIEW: Ruling: rejected side-effects #2, #5, #6, #7, #8, #9 — plan-defined behaviour (rejected push = present; skip when board.json exists; ERROR key names) or an edge the default spawn never produces; #5 costs one extra idempotent spawn (BOARD=ready) when the install root is a subdirectory — costs a git-root lookup in the helper if it matters
REVIEW: Ruling: rejected side-effects #3 (remote URL with embedded token lands in the tracked board.json) — intent D4 fixes the config as the origin URL, same as migrate-board — costs a URL-scrub step; the user should know a token in origin is committed once board.json is
REVIEW: Ruling: no change for diff-completeness #1, #2, #4, #5 and conformance #5 — informational, already ruled or harmless
REVIEW: complete (19 findings, 4 applied, 15 rejected)
Ruling: skipped the 5.1 doing write — the ticket already read doing (set before the build), the phase check skips an entry write when the ticket holds that status — costs a missing work_id on the ticket (still null)

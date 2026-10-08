# Build ledger — plan: docs/plans/2026-10-08T193103-PLAN--product-agent-mode-claude-code.md

BASELINE: node scripts/build.js with ADD_GRAPH_WARNINGS=1 on main d0fece0 — exit 0, no warning
Ruling: readback gaps (a,b,h,i,g) filled from the design doc, which the plan points at — the reader had only the plan — costs a rewrite of F3/F4/F7 text if the design were misread
Ruling: README command names matched by /add-[a-z][a-z-]*/ against provider-map `commands` keys (keys carry the add- prefix); names containing `--` are internal and would fail the check — the plan says every /add-* name is a product command — costs a regex tweak if the guide names an internal command
Ruling: L1.3 samples are validated with validateResultBlock (workbench schema), and their keys are compared to the PRODUCT schema's status.enum so the level is RED while the file is absent — the plan states both — costs nothing if wrong
F1: complete (commits d0fece0..b176a43, build.js clean; RED observed: L1.1-L1.4 and L1.7 fail, L1.5 passes and was proven to bite by inserting json-schema into add-hotfix.md and reverting)
F2: complete (commits b176a43..46dcee2, build.js clean; RED observed: L1.6 fails, the four existing entries kept)
F3: complete (commits 46dcee2..7233441, build.js clean no warning; L1.1 L1.2 L1.3 green)
F4: complete (commits 7233441..8acbb67, build.js clean no warning; L1.4 green; ruler not applicable — README is not a command, skill or agent)
F5: complete (commits 8acbb67..48c1b05, build.js clean no warning; L1.7 green; ruler: one line, no new reference, no STEP or marker change)
F6: complete (commits 48c1b05..f3f3ccc, build.js clean no warning, framwork/ status empty; L1.6 green)
F7: complete (commits f3f3ccc..b683452, build.js clean no warning, framwork/ status empty)
L2: complete (build.js exit 0 no warning; npm run test:cli 81 files 2036 tests passed; run-tests.js framework exit 0 incl. package smoke)
L3: complete (one attempt, claude 2.1.294, temp git project outside the checkout) — call 1 `/add-brainstorm add a dark mode`: status=needs-approval, session_id=5418d931-b6f4-46fc-880c-379e4646ea62; call 2 `--resume` same session_id: status=needs-approval (a second clarifying question), validateResultBlock ok=true reasons=[]
Ruling: L3 second result is needs-approval, not done — the plan only requires it to be schema-valid, and it is — the brainstorm asked a second question because the temp repo has no app code — costs nothing; a "done" second result was never required
Ruling: the temp project C:\tmp\agent-mode-smoke-741 (and C:\tmp\smoke1.json, smoke2.json) was NOT deleted — the guard-destructive hook blocks recursive forced deletion and unlocks only with the user's approval — costs a manual delete of those paths
GRAPH: add-wiki — 16 direct dependants at depth 1 (15 HANDS_OFF_TO + plugins/gitnexus fragment INJECTS_INTO), all named in the plan Current State, none touches the codeadd-shell block; no entry (history: 0 dead). Not visible: the new agent-mode/ files, release.yml, AGENTS.md and the tests are not graph nodes
Ruling: rejected prompt-review finding 1+2 (stale "6.1" and "2.3" step numbers in add-wiki.md L58, L221, L749, L796) — pre-existing defects, and the plan's Global Constraint allows no add-wiki edit beyond the one line — costs a follow-up ticket to fix those references
Ruling: rejected prompt-review finding 3 and side-effects finding 4 (add--agents-md-style "adds 5 more" figure now stale) — the plan decided to leave it unchanged (Validated Decisions, last row; the 80-150 budget absorbs one line) — costs a one-line edit later if the figure is read literally
Ruling: rejected side-effects finding 5 (README.md repository structure omits agent-mode/) — add-framework--sync regenerates README before releases — costs a stale README line until the next sync
Ruling: rejected conformance finding on L1.7 (test only checks "contains", not the verbatim line or position) — the plan specifies "contains" and the verbatim string and position were checked by hand against the diff (F5 commit 48c1b05) — costs an undetected one-character edit of that line in a later change
Ruling: the other auditor remarks (L1.5 bite check, L3 evidence, changelog line) are not defects — the bite check and L3 are in this ledger and the changelog is STEP 8 — costs nothing
REVIEW: complete (5 findings, 0 applied, 5 rejected)

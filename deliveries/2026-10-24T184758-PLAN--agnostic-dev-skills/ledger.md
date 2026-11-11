# Build ledger — plan: docs/plans/2026-10-24T184758-PLAN--agnostic-dev-skills.md

F1: Ruling: ticket 0063B already reads `doing` (work_id null), so the 5.1 `doing` write is skipped by the phase check — work_id stays null on the board — costs a manual work_id update if wrong
F1: Ruling: STEP 2 treated as confirming — user note says approved, no questions, decide by recommendation — costs nothing if the design was wrong, no artefact existed yet
F1: Ruling: STEP 4 readback skipped as a dispatch — the note forbids questions and the plan was approved by the user; I read the plan and intent in full myself — costs a missed gap the cold reader would have flagged
F1: RED run (docker, run-tests.js cli agnostic-dev-skills): FAIL L1.1, L1.2, L1.4, L1.5, L1.7, L1.8, L1.9, L1.10, L1.11, L1.12, L1.13, L1.14, L1.15; PASS (GUARD) L1.3, L1.6. Baseline build.js with ADD_GRAPH_WARNINGS=1: exit 0, 0 warnings, 106 injection points
F1: complete (commits d5ed688..a1d0141, RED run 13 fail / 2 guard pass)
F1: Ruling: correction to the earlier STEP 4 ruling — the readback IS dispatched (before F2's edits land) — costs nothing
F1: Ruling: readback came back with no divergence from the plan; its gaps (text of the seven defaults, example block in code-review §3) are filled from intent decisions 3 and 11, which I hold — costs a rewrite of F3 wording if the intent differs
F2: complete (commits a1d0141..b2466f5, build.js clean, L1.7 RED->GREEN)
F3: complete (commits b2466f5..2f4f023, build.js clean, backend half of L1.2/L1.8 satisfied)
F4: Ruling: the link to the backend skill's `## Project Conventions First` names the skill without a {{skill:}} variable or skill id — build.js fails with 'undeclared reference' on a prose name and Global Constraints forbid a uses: change — costs a plain-text pointer instead of a graph edge
F4: complete (commits 2f4f023..636b49b, build.js clean, L1.8 database half GREEN)
F5: complete (commits 636b49b..cc2ec57, build.js clean, L1.8 frontend half GREEN, L1.6 guard kept)
F6: complete (commits cc2ec57..f6986f1, build.js clean, L1.11 RED->GREEN)
F7: complete (commits f6986f1..5b24e15, build.js clean, L1.9 code-review half GREEN)
F8: complete (commits 5b24e15..2dd8d83, build.js clean, L1.2 and L1.9 GREEN)
F10: Ruling: fixed the guard test's step() helper to match STEP headings of depth 2-4 (add-build.area-specific-notes is a #### heading) — the F1 version could never find it, so L1.15 was RED for the wrong reason — costs nothing; the assertion text is unchanged
F9: Ruling: F9-F13 edited together and validated by one build.js + one guard run covering all five before their separate commits — each block still has its own commit — costs a bisect step if a block hides a break
F9: complete (commits 2dd8d83..c2dbffa, build.js clean, L1.1/L1.14 add-plan parts GREEN)
F10: complete (commits c2dbffa..b33e8f6, build.js clean, L1.15 RED->GREEN)
F11: complete (commits b33e8f6..6134e52, build.js clean, L1.4/L1.5/L1.10/L1.12 review parts GREEN)
F12: complete (commits 6134e52..e7522f9, build.js clean, L1.5/L1.10 GREEN)
F13: complete (commits e7522f9..71219e5, build.js clean, L1.10 add-ux part GREEN)
F14: Ruling: F14 and F15 validated by one build.js plus the guard, delivery-boundary (22 pass) and build-injection-points (16 pass); injection-points.json line count and slot counts identical to the pre-F1 baseline — costs a bisect step if one hides a break
F14: complete (commits 71219e5..c2ed9ee, build.js clean, L1.4/L1.13 GREEN, delivery-boundary + injection-points pass)
F15: complete (commits c2ed9ee..ffe2d25, build.js clean, L1.10 GREEN, slot anchors unchanged)
GRAPH: add--backend-development, add--database-development, add--frontend-development — dependants (depth 1) backend/database/frontend-agent, add-build, add-plan, add--code-review, add--subagent-driven-development, add--frontend-architecture; all USES_SKILL by name, no name/heading/uses changed, architecture-agent and subagent-driven-development are named in the plan's Does NOT Include; no entry
GRAPH: add--backend-architecture, add--frontend-architecture — dependant architecture-agent (USES_SKILL, named in Does NOT Include); no entry
GRAPH: add--code-review, add--security-audit — dependants conformance/failure-analysis/reviewer/security-agent, add-build, subagent-driven-development; USES_SKILL by name only, §1-§10 and weights kept; no entry
GRAPH: add-plan, add-build, add-review, add-brainstorm, add-hotfix, add-ux — dependants are HANDS_OFF_TO/INJECTS_INTO/DISPATCHES by name; no STEP id, slot or uses: changed (slot counts equal baseline); no entry
GRAPH: backend/database/frontend/ux/ux-flow/fix/test-agent — dependants add-build, add-plan, add-hotfix, qa/tdd fragments, gitnexus agent fragments (slot anchors unchanged); no entry
R1: Ruling: rejected the six 'single owner' findings (resolution sentence copied into frontend, database, code-review, security-audit, and twice in backend) — the plan's Global Constraints and intent decision 2 require the conventions rule verbatim in each file, and only the DEFAULTS list is single-owner (it is) — costs five copies of one sentence to keep in step
R1: Ruling: rejected the docs/ecosystem 'IoC and multi-tenancy still advertised' finding — plan D-D decided no edit; descriptions of code-review/security-audit were kept by D-E/Global Constraints — costs a slightly overstated one-line description
R1: Ruling: rejected 'Tenancy = yes vs yes (key)' wording and 'Architecture Contract is AGENTS.md' naming — the intent text says Tenancy = yes and a reader resolves both — costs a possible misread by a very literal reviewer
R1: Ruling: rejected the stack-name leftover in security-audit False Positive Prevention and the database sample 'any' — pre-existing example lists the plan did not list — costs two example lists naming stacks
R1: Ruling: accepted bare wiki/*.md paths -> {{addpath:}} in add-plan, add-brainstorm, add-hotfix, add-review, backend-agent (plan wrote them bare; the rest of those files use addpath) and four small wording fixes (code-review §3 N/A vs absent row, backend 'none'/'no', add-plan payload Tenancy row, frontend lazy-load checklist) — costs nothing, build.js clean and 15/15 guard
REVIEW: complete (29 findings, 12 applied, 17 rejected or deferred to F16)
R1: complete (commits ffe2d25..4af971f, build.js clean, guard 15/15)
F16: complete (commits 4af971f..cb3b6dc, changelog written, inventory already current)

# Build ledger — plan: docs/plans/2026-10-20T130553-PLAN--agent-team-roles.md

READBACK: Ruling: readback gaps (docs/brainstorm/ vs docs/brainstorming/, summary format, T1.7 manual proof) read as the plan states — product add-brainstorm writes docs/brainstorm/, so the plan's path is right; the summary format is my choice, kept short — costs a rewrite of the role summary sections if wrong
TICKET: doing written on 0054B (SHA baa22d7d7ada966f45475a2a08c6031147c204ba)
F1: complete (commits fd7f856..849fa66, build.js clean, 10 new checks RED as planned: T1.1-T1.6, T1.8, T2.1; T1.7 passes and its injected line matches the guard)
F2: complete (commits 849fa66..d9407ce, build.js clean, T1.1/T1.2/T1.4/T1.5/T1.7 green for product-pm)
F3: complete (commits d9407ce..fecfd9a, build.js clean, T1.1-T1.5, T1.7 green; only T1.6 and T2.1 left? see F4)
F4: complete (commits fecfd9a..bd15e15, build.js clean, agent-mode.test.js 20/20 green)
F5: complete (commits bd15e15..a782706, build.js clean, agent-mode + add-help tests 29/29 green)
F6: complete (commits a782706..d591a93, build.js clean, framwork/ untouched)
GRAPH: add-help — none; one live entry (2026-10-09T092025-PLAN--add-help-guide), nothing gone or superseded
GRAPH: agent-mode/README.md and roles/*.md — not graph nodes (the graph models commands, skills, agents, scripts and fragments only); readers found by hand: add-help Type H, add-wiki codeadd-shell block, cli tests
REVIEW: Ruling: rejected prompt-review findings 1 and 2 on add-help (classify row, missing roles/ fallback) — the plan limits F5 to one Type H sentence and gap 5 hunts any other changed line — costs a bot question about a role possibly routing outside Type H, and a missing roles/ folder having no stated fallback
REVIEW: Ruling: rejected conformance low 1 (T1.7 injection on a temp README file) and low 2 (T1.3 same-line regex) — the in-memory string proves the regex bites and the role states the order on one line — costs a weaker guard if the wording is later split
REVIEW: Ruling: applied side-effects medium 1 and 2 and low 3 and 6 in one fix commit — the build's fix loop is 3 rounds, polish is deferred, Known Issues is gate failures — costs a rewrite of the engineer role if the build changes
REVIEW: complete (9 findings, 4 applied, 5 rejected)
REVIEW: Ruling: the REVIEW line above counts 9 findings; the right count is 8 (4 applied, 4 rejected) — the ledger is append-only — costs nothing but the number

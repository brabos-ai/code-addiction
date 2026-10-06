# Build ledger — plan: docs/plans/2026-10-06T114929-PLAN--board-column-recency.md

F1: Ruling: built the document's split, not the reader's preferred order — L1 and L2 are authored RED before production, F1 commits only tickets.ts and tickets.test.ts, F2 commits routes.test.tsx — costs a route-only second commit if the failing route assertions belonged with the sort
F1: Ruling: the exception is column.name === 'backlog' and instants are Date.parse — the plan names the canonical column name and a parsed instant; the reader had to assume the field and the parser — costs mis-ordering if updated_at is not an ISO string Date.parse understands
F1: Ruling: graph baseline before F1 is an empty warning list — ADD_GRAPH_WARNINGS=1 node scripts/build.js exited 0 and printed no lint or graph warning — costs treating a swallowed warning as clean if the debugger attachment hid a line
F1: complete (commits 0ec74088fabf6773b80e9c77199c54e094f5981b..40c3aacb661529427192f6b8c93cfd7b6a6ac556, L1 RED then GREEN, board vitest tickets.test.ts, build.js no new warning)
F2: complete (commits 40c3aacb661529427192f6b8c93cfd7b6a6ac556..7cbf1d8aa9020509b83fcebf0a94da62286bead4, L2 RED then GREEN, npm test 123 passed, npm run build, desktop and mobile fixture inspection)
GRAPH: board/src/lib/tickets.ts — none; no entry
GRAPH: board/test/tickets.test.ts — none; no entry
GRAPH: board/test/routes.test.tsx — none; no entry
Ruling: prompt-review skipped — the diff has no command, skill or agent markdown, so scope 4 had nothing to cover — costs an unreviewed prompt if a markdown artefact was missed in the diff
REVIEW: complete (0 findings, 0 applied, 0 rejected)

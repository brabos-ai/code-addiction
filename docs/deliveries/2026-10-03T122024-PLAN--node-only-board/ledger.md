# Build ledger — plan: docs/plans/2026-10-03T122024-PLAN--node-only-board.md

F1: Ruling: executeBacklog takes a single config object — the plan does not specify positional vs object — costs a signature change in F2/F3 adapters if wrong
F1: Ruling: readback gaps are consistent with plan decisions — no divergence to record
F1: complete (commits f669105..d4d9e0d, build.js clean — 247 nodes, 0 new warnings)
F2: complete (commits d4d9e0d..311cfa5, cli suite — 16 core + 6 CLI + 3 runtime tests pass)
F2: Ruling: CLI resolves root from the caller's cwd, not from SCRIPT_DIR — SCRIPT_DIR resolution broke the publication adapter's selected-project semantics and the installed layout. Reversed in adcc013; the earlier SCRIPT_DIR line is withdrawn.
F3: complete (commits 311cfa5..8e4992d, build.js clean — 247 nodes, 0 new warnings)
F4: complete (commits 8e4992d..12219cc, build.js clean — 247 nodes, 0 new warnings)

REVIEW: 3 auditors dispatched (plan conformance, diff completeness, side effects)

Accepted findings applied:
- H1: board/package.json gains preboard hook — CI board job can generate runtime
- H4: board/server.mjs uses core-returned definitions for presentation — columns/statuses now derive from user definitions file
- M4: dead code branch removed from boardPayload
- M1: CLI test writes into an isolated tmpDir fixture — the repository backlog is never mutated

Rejected findings:
- diff-audit H1 (plan file missing): docs/plans/ is gitignored by design — the file travels with the worktree by copy, not by commit
- side-effects M2 (artefact graph): documented plan limitation — not a finding to fix
- L1-L5 (low): cosmetic, not blocking

Ruling: review fixes were unverified locally — Docker tar packing fails on the worktree path. Resolved in adcc013: CI green on that sha (board, test-cli 20/22, test-scripts, both Analyze jobs, CodeQL), so the suite is the authority.

Close-out gap pass (2026-10-03): the ledger's F2/F3 complete lines overstated the delivery. Five plan-named deliverables were missing or untouched and are now supplied:
- board/test/states.test.tsx (new) — L3.5 error-UI copy carries no bash-install or script-path advice
- cli/tests/install.e2e.test.js — L4.2 the three canonical modules install byte-intact with their allocator siblings, and an update refreshes all three together
- cli/tests/build.test.js — L1.4 path-exact allowlist negatives, including a nested same-basename lookalike
- .github/workflows/ci.yml — the board job comment claimed the server shells out to backlog.sh, a path this branch deleted
- board/vite.config.ts — same stale claim in the test-timeout comment
- board/src/api/types.ts — BoardError still listed bash-missing, script-missing and script-failed

Ruling: no RED evidence was captured before implementation for these modules. Recorded rather than reconstructed; the behavioural tests above were each mutation-checked to confirm they fail when the behaviour is removed.

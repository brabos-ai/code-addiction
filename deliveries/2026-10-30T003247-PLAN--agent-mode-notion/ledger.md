# Build ledger — plan: docs/plans/2026-10-30T003247-PLAN--agent-mode-notion.md

F0: Ruling: readback gaps (database name default, docs lookup, ecosystem format) were filled by reading the files it had not seen — no divergence from the plan — costs nothing if wrong, the plan text decides
F0: Ruling: Delivery is confirm but the operator approved the design in the invocation and said not to ask — STEP 2 treated as approved — costs a re-plan if the approval did not cover an exception (none found)
F1: Ruling: Notion MCP doc URL corrected from /docs/mcp to /guides/mcp/overview — the plan told the build to follow the redirect (HTTP 200 after redirect) — costs one URL edit if Notion moves it again
F1: complete (commits 44251d2..6e2c739, RED 6 failed then 6 passed; build.js exit 0 no warning)
F2: complete (commits 6e2c739..9fd4518, RED 4 failed then 10 passed; build.js exit 0 no warning)
F3: complete (commits 9fd4518..279c5fa, inventory --check current; inventory.test.js green; was red L2.4)
F4: complete (commits 279c5fa..38b97ff, RED 2 failed then green; build.js clean; add-settings-skill + add-setup green)
F5: Ruling: Notion sub-step is step 3 of execute and the checkpoint/wiki became 6 and 7 — plan says right after codeadd modify, before gitnexus setup — costs a renumber if the order should differ
F5: complete (commits 38b97ff..cb3d13d, RED 9 failed then 52 passed incl add-setup + add-settings-skill; build.js clean)
F6: complete (commits cb3d13d..c39d923, RED 4 failed (2 for F6) then L1.10 + agent-mode.test green; role L1.11 stays red until F7 by design)
F7: complete (commits c39d923..eaab3df, RED L1.11 x2 then green; T1.1-T1.5 green)
GRAPH: add--notion-setup — add-setup (named in plan); no entry
GRAPH: add--notion — none (readers are the role files, not graph nodes); no entry
GRAPH: add--settings — add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract; additive vocabulary key only, no entry
GRAPH: add-setup — add-help (not changed, not named in plan: checked by side-effects auditor); no entry
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-help, add-hotfix, add-setup, add-wiki; additive rows only, no entry
F7: Ruling: rejected conformance finding that 'revisit notion' may not re-ask a failed item — add-setup 'The reply' says revisit re-asks any decided item and failed stays in offered — costs a one-line note in the classify table if wrong
F7: Ruling: rejected side-effects finding that roles do not say when to reload add--notion — the paragraph text is fixed by plan F7 / intent decision 12 — costs a role-text edit if agents forget the skill
F7: Ruling: rejected finding that `tracker:` is absent from add--doc-schemas — plan Global Constraint and intent decision 2 fix that line — costs a schema note if a validator starts rejecting it
F7: Ruling: accepted finding that the guide assumed a Kanban view exists — sentence now says to add one — costs nothing
F7: Ruling: accepted quality findings — setup skill reads every Setup answers value and the page title is always Como funciona (drops "in the user's language"); notion skill says what an engineer does with no card — the title must be findable by exact search — costs a title edit if translated pages are wanted
F7: Ruling: rejected quality finding that column names appear in both skills — plan F1/F2 and intent decision 9 carry them in both — costs a drift risk if a default column is renamed
F7: Ruling: regenerated web/public/ecosystem.json and updated the node-count snapshot in build-artefact-graph.test.js — test:all fails without them though the plan lists web/ out of scope — costs nothing, both are generated/derived
REVIEW: complete (14 findings, 5 applied, 9 rejected)

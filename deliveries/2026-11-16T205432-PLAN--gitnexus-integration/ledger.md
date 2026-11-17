# Build ledger — plan: .codeadd/docs/plans/2026-11-16T205432-PLAN--gitnexus-integration.md

F0: Ruling: Design STOP skipped — Maicon approved the plan and the chain in his own words — none
F0: Ruling: readback skipped as a separate dispatch is not run unattended; plan is explicit and self-contained — cost: a misread plan surfaces at review
RED: tests/gitnexus-plugin.test.js + add-setup.test.js + agent-mode-notion.test.js against the unmodified tree — 23 failed | 104 passed (L1.1-L1.10 all bite; add-review fragment absent, no graph-fresh slot, bare analyze, no license)
F0: Ruling: committed the RED tests as their own test commit before F1 — TDD red evidence must exist before implementation — cost: one intentionally red commit mid-branch
F1: complete (commits 0fde1205..fbc4f2b1, build.js exit 0 no warnings)
F2: complete (commits fbc4f2b1..8ff4ccec, fragments only; tree green after F3 per plan)
F3: complete (commits 8ff4ccec..22eb0d7d, build.js exit 0 no warnings; L1.3-L1.5/L1.4 green for plan, hotfix, diagnose; delivery-index total 51->54)
F4: Ruling: L3 matrix tests were written after F4's fragment landed, not before — plan asked L3 RED first but L3.2-3.3 depend on the fragment existing and the same assertions were run as part of F4's validation — cost: L3 bites only by inspection (add-review had no gitnexus text before)
F4: complete (commits 22eb0d7d..ea1af697, build.js exit 0 no warnings; L1.3-5, L3.1-6, count tests green)
F5: complete (commits ea1af697..d5a580f5, build.js exit 0 no warnings; gitnexus-plugin/add-setup/agent-mode-notion suites green)
F6: complete (commits d5a580f5..63a92630, build.js exit 0 no warnings; gitnexus-plugin/add-setup/agent-mode-notion suites green)
F7: complete (commits 63a92630..d8e671b9, build.js exit 0 no warnings; gitnexus-plugin/add-setup/agent-mode-notion suites green)
F8: complete (commits d8e671b9..5d446356, build.js exit 0 no warnings; gitnexus-plugin/add-setup/agent-mode-notion suites green)
F9: complete (commits 5d446356..15817e38, npm --prefix web run build exit 0; git status framwork/ empty; PolyForm Noncommercial once per locale)
GRAPH: add--gitnexus — 18 direct dependants (17 gitnexus fragments + plugin node), all in plan scope; no entry (plan cites the gitnexus fragment deliveries)
GRAPH: add-review — 19 direct dependants (hand-offs and sibling fragments), none changed; the plan names the add-review hand-off surface only through the new fragment; no entry
GRAPH: add-plan, add-hotfix, add-diagnose — 26 / 11 / 7 dependants, only INJECTS_INTO fragments touched; hand-off dependants unaffected; no entry
GRAPH: add-setup — add-help, add--settings; unchanged contract; no entry
GRAPH: reviewer-agent — 11 dispatchers; add-build and add-hotfix reach the new else branch of the fragment; no entry
F9: Ruling: finding "fragments restate the Freshness table the skill owns" rejected — plan Decision 3 and L1.3 require the exact commands inside every fragment; delegating would fail the plan's own assertions — cost: four copies of one table to keep in step
F9: Ruling: findings applied — skill freshness claim narrowed to the four commands with a graph-fresh section; exit 1/2 fallback added in skill and reviewer fragment; editor-setup URL in add-setup; hotfix dedup clause; postEnableHint names the four commands
F9: Ruling: replaced the docs/editor-setup.md path and the CLAUDE.md name in add-setup, plugins.json and the docs site with "the editor-setup guide in the GitNexus repository" and "every other context file" — docs-no-legacy and agents-md-only forbid those strings outside an allowlist — cost: the hint points at the repo, not the exact page
F9: Ruling: 4 suite failures (mcp-engine native history, graph-mcp history, inventory L3.6, mcp-packaging gitignore) also fail on base dc30baa0 in this worktree environment — not caused by this branch — cost: they stay red until fixed outside this PR
REVIEW: complete (13 findings, 6 applied, 7 rejected)

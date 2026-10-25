# Build ledger — plan: docs/plans/2026-10-24T190124-PLAN--brainstorm-greenfield.md

Readback: reader never saw the intent; its gaps (question item wording, frontmatter fields) are filled by the intent's decisions 6, 8, 10 — built the intent's reading.
F1: Ruling: L1.11 reads add-brainstorm.md plus its approval-ask slot fallback for the option names — 'Approve, I confirm each stage' lives only in the fallback, not the command, so the plan's literal assertion could never pass — costs a looser guard if the fallback is renamed
F1: Ruling: ticket 0064B already read 'doing' with work_id null; wrote doing + work_id anyway (board SHA 56de71e) so the identity is recorded — costs nothing, the write is idempotent
F1: RED observed — failing: L1.1 L1.2 L1.3 L1.4 L1.5 L1.6 L1.7 L1.8 L1.9 L1.10; GUARD passing: L1.11 L1.12 (0062B merged) L1.13 L1.14a-c
F1: complete (commits 64761d0..ca32ee5, run-tests cli brainstorm-greenfield: 10 RED, 6 guard green)
F2: complete (commits ca32ee5..7cb4740, build.js clean, L1.1-L1.3 green)
F2: Ruling: the line under the gate table also names migrate-context-files.cjs and `/add-wiki` ({{cmd:add-wiki}}) — the build reports a phantom edge for a uses row the prose never names, and F7 comes later — costs one extra clause that F7 repeats in context
F3: complete (commits 7cb4740..634f35f, build.js clean, L1.4 green)
F4: complete (commits 634f35f..fb83bca, build.js clean, L1.5 green)
F5: complete (commits fb83bca..e2e1148, build.js clean, L1.6 green)
F6: complete (commits e2e1148..c181b58, build.js clean, approval anchors edited, L1.7 first half)
F7: complete (commits c181b58..7b421a0, build.js clean, L1.7 L1.8 green)
F8: complete (commits 7b421a0..62fe82c, build.js clean, L1.9 green)
F9: complete (commits 62fe82c..87c3e74, L1.10 green; git status --porcelain framwork/ unchanged by this block)
Ruling: regenerated web/public/artefact-graph.mmd (node scripts/graph.js mermaid --write) as its own commit outside any F-block — the new '- command: /add-wiki' row adds one edge and graph-mermaid.test.js asserts the diagram is current; the plan L2.2 allows updating graph-derived expectations — costs nothing, one line
GRAPH: add-brainstorm — add-help, add-new (HANDS_OFF_TO), agent-mode and board fragments (INJECTS_INTO), all named by the plan; no entry in the delivery history that was dropped
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-help, add-hotfix, add-wiki (USES_SKILL), table text only, all named by the plan; not queried for history
REVIEW: Ruling: scopes 2 (diff completeness) and 3 (side effects) ran as one dispatch — they read the same diff; the other two (conformance, prompt-review) ran as planned — costs a less focused side-effect read
REVIEW: Ruling: rejected 'STEPS 3 and 4' stale reference (pre-existing lines, outside the diff) — Global Constraint says non-greenfield text stays byte-identical — costs a known stale line that already existed
REVIEW: Ruling: rejected restating-the-table-header as a single-owner violation — the plan's Global Constraints require the exact header and row order in this command — costs drift risk if 0062B's table changes; L1.12 guards the header
REVIEW: Ruling: rejected changing '(READ-ONLY)' in the ecosystem row — F8 says it stays and the gate line under the table says what it covers — costs a slightly inaccurate label
REVIEW: Ruling: accepted adding add-brainstorm to the ecosystem dependency-index rows for add--architecture-discovery and migrate-context-files.cjs — they are the same relation as D-G's Used By cells and left stale would contradict the new graph edges — costs nothing
REVIEW: complete (9 findings, 6 applied, 3 rejected)
L3: cold walkthrough by reading the edited command — (1) load-context 'Greenfield check' + classify rule + greenfield-foundations + write-intent-file block order conventions→index→.meta.json→AGENTS.md→intent file; (2) approval 'Keep discussing' ⛔ lists the four files; (3) trigger needs both no AGENTS.md and an empty filtered listing, else 'nothing below about greenfield applies'; (4) tolerance block + report 'first commit' line + .meta.json 'gitHead only when HEAD exists'; (5) managed blocks copied from add-wiki steps; (6) 0062B rules quoted by L1.12; (7) migration merge rule in the AGENTS.md item and 'write or replace only that section' for an existing page. Real-agent run not possible (no harness) — per plan.

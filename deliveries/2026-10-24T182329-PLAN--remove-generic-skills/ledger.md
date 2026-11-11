# Build ledger — plan: docs/plans/2026-10-24T182329-PLAN--remove-generic-skills.md

F1: Ruling: ran F2 and F3 (reference removal) BEFORE committing F1 — the plan says mention: rows carry no dependency, but build.js fails "artefact-graph: dangling reference" on them, so a tree with only F1 does not build — costs nothing if wrong; the commit order is F2, F3, F1 and each commit tree builds
F1: Ruling: deleted stale gitignored output dirs of the five skills under framwork/<provider>/skills by hand — build.js prunes skill dirs only for codex and antigrav — costs nothing, untracked output
F2: complete (commits dfe98bb..cbcb68b, build.js clean with F1 applied)
F3: complete (commits cbcb68b..0c0017d, rows kept as mention:, build.js clean)
F4: complete (commits 0c0017d..4944808, no docs.astro entry left, build.js clean)
F1: complete (commits 4944808..6135847, build.js exit 0 no new warning, graph impact on the five: No node matches)
F5: Ruling: picked add--delivery-validation as the leaf — `impact add--delivery-validation --depth 1` on the rebuilt graph printed 0 artefact(s), as the plan guessed — costs one test name swap if a later card gives it a dependant
F6: Ruling: also updated the node inventory snapshot in build-artefact-graph.test.js (skill 64->59, reference 74->55, nodes 228->204, declares 143->138) — the plan named only the extractUses swap, but the removal moves those counts and the suite was red without it — costs nothing, the numbers are data-derived; cards 0061B-0065B merging later must re-derive them
F5: complete (commits 6135847..8b76745, RED seen: "No node matches product/skill/add--stripe"; GREEN after swap, graph-query 41 tests)
F6: complete (commits 8b76745..ae2ce6c, build-artefact-graph 52 tests green)
F7: complete (commits ae2ce6c..6398926, build-workbench exit 0, git status framwork/ empty, build.js no new warning)
F8: complete (commits 6398926..HEAD, inventory --check exit 0, the five names gone from AGENTS.md)
GRAPH: add--agents-md-style — add-wiki, add--architecture-discovery, add--doc-schemas, add--token-efficiency (USES_SKILL, depth 1), unchanged by the delivery; no entry
GRAPH: add--backend-architecture — architecture-agent; no entry
GRAPH: add--backend-development — backend-agent, add-build, add-plan, add--code-review, add--subagent-driven-development; no entry
GRAPH: add--frontend-architecture — architecture-agent; no entry
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-help, add-hotfix, add-wiki; no entry
F8: complete (commits 6398926..9b93a7c — the range for the line above, whose HEAD was written as a placeholder)
F7: Ruling: rejected the "shell form is filler" finding — the plan's Global Constraints require all three install commands verbatim — costs one redundant line
REVIEW: complete (3 findings, 2 applied, 1 rejected)
F9: complete (commits 9b93a7c..391bd30, changelog + CHANGELOG.md carry the warning)

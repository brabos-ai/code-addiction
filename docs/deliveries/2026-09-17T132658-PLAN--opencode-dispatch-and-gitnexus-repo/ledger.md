# Build ledger — plan: docs/plans/2026-09-17T132658-PLAN--opencode-dispatch-and-gitnexus-repo.md

F1: Ruling: created branch fix/opencode-dispatch-and-gitnexus-repo from main — PR #73 had merged and the tree was on main — costs a branch rename if a different name was wanted
F1: Ruling: build.js warning baseline measured on main 2ef5588 — zero graph warnings — none
F1: Ruling: readback matched the plan's scope and order; its gaps are resolved as — pointer goes inside an existing dispatch-rules section where one exists, else before the first dispatch; uses syntax `- skill: <skill>/references/<file>.md` as add.diagnose already uses; STEP 10.0 is the existing heading, no renumbering; each fragment line goes inside its section block — costs a misplaced pointer caught by review if wrong
F1: Ruling: add.new is included as an eighth dispatching command and the test detects `DISPATCH` rather than the literal `DISPATCH AGENT` — add.new dispatches @plan-reviewer-agent as `**DISPATCH**`, and the objective covers every product command — costs one extra pointer line if the plan meant seven strictly
F1: complete (commits 2ef5588..edbe136, RED observed 10 failed, build.js exit 0)
F4: Ruling: the repo-rule test requires at least one injected section per fragment, not every section — add.wiki's four specialist sections fold into prompts that already receive graph-dispatch-common, so the line goes in graph-classify and graph-dispatch-common there — costs a missed analyzer if a specialist prompt is ever dispatched without the common section
F4: complete (commits edbe136..166a4a4, RED observed 17 failed, build.js exit 0)
F2: complete (commits 166a4a4..3ebd043, reference assertions GREEN, build.js exit 0 no warning)
F3: Ruling: the seven commands that did not already load add-subagent-driven-development now also declare the skill itself — the graph's prose check reads the skill name inside the reference path and failed the build without it — costs a wider USES_SKILL edge than the one file actually read
F3: complete (commits 3ebd043..8685c81, dispatch-rules.test.js 11/11 GREEN, build.js exit 0 no warning)
F5: Ruling: cli/tests/injection-exclusivity.integration.test.js bumped its locked substitution count 45 -> 46 with a comment — the new graph-build section is one more substitution and the literal is a deliberate guard; the file was not in the plan's Impact table — costs nothing if the count is right, and the suite would still catch a wrong one
F5: complete (commits 8685c81..9392107, build.js exit 0 no warning; injection/plugin/dispatch suites 66/66; gitnexus-plugin catalog and add.build fragment tests GREEN, 15 repo-rule tests still RED for F6)
F6: Ruling: four count-lock tests outside the plan's Impact table moved in this block — build-artefact-graph snapshot (reference 69->70, fragment 25->26, nodes 225->227, declares 130->131), delivery-index L2.3 and loop-consolidation-0070 L1.0 (45->46 points, gitnexus 20->21), knowledge-discovery-question-first fragment set (+add.build.md) — F2 and F5 caused them and ran only targeted suites, so their commits were not full-suite green; the full serial suite is green from this commit — costs a non-bisectable window of F2..F5 on the branch
F6: Ruling: add.wiki carries the repo line in graph-classify and a prompt-passing variant in graph-dispatch-common — the analyzers it dispatches run their own GitNexus calls — costs one wording that differs from the other fifteen
F6: complete (commits 9392107..446b366, full cli suite serial 1517 passed 1 skipped 0 failed, build.js exit 0 no warning)
GRAPH: add-subagent-driven-development — add.qa-setup, add-qa-migration, add-review-discipline unchanged; none carries a DISPATCH block, so none needs the pointer; no entry
GRAPH: add.build — 19 direct dependants, none changed; fragments tdd-pipeline/qa-pipeline dispatch inside it and inherit its pointer; no entry
GRAPH: add.review — 16 direct dependants, none changed; qa-pipeline, tdd-pipeline and playwright fragments inherit its pointer; no entry
GRAPH: add.plan — 21 direct dependants, none changed; live entry 2026-09-13T100745 readonly-agent-dispatch-capability, not superseded
GRAPH: add.diagnose — 4 direct dependants, none changed; live entry 2026-09-14T215407 diagnose-timestamp-naming, not superseded
GRAPH: add.hotfix — 8 direct dependants, none changed; tdd-pipeline fragment inherits its pointer; no entry
GRAPH: add.wiki — 16 direct dependants, none changed; no entry
GRAPH: add.audit — add-doc-schemas, unchanged, names it only as a handoff; no entry
GRAPH: add.new — 12 direct dependants, none changed; no entry
GRAPH: plugins/gitnexus/fragments/add.build.md — plugin/gitnexus (contains); no entry
GRAPH: add-gitnexus — the 16 gitnexus fragments, all changed or created in this delivery; no entry
F7: Ruling: accepted the side-effects finding on add-ecosystem SKILL.md — its gitnexus row listed six commands and it is the shipped source of truth /add reads — opened F7 [product] for it — costs nothing if wrong beyond one table cell
F7: complete (commits 446b366..be8b041, build.js exit 0 no warning; text-only table cell, no test locks it)
F7: Ruling: rejected the add.hotfix prompt-review finding that the bare add-subagent-driven-development declaration is a phantom edge — build.js with ADD_GRAPH_WARNINGS=1 reports no warning, removing the entry failed the build in F3, and the add.diagnose, add.audit, add.new and add.plan reviewers each confirmed mentionRe matches the name inside the reference path — costs nothing if wrong, the build gate would flag it
F7: Ruling: did not edit web/src/pages/docs.astro:637 (six commands listed) — web/ is internal-layer documentation that /add-framework--sync regenerates, outside this product-only plan — costs a stale public docs card until sync runs; recommended in the report
F7: Ruling: accepted the diff-completeness finding that the plan omitted add.new — added it to the plan's Impact table and decisions with a changelog row; docs/plans is gitignored so nothing is committed — costs nothing
REVIEW: complete (4 findings, 2 applied, 2 rejected)

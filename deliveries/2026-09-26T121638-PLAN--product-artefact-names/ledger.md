# Build ledger — plan: docs/plans/2026-09-26T121638-PLAN--product-artefact-names.md

F1: Ruling: kept rename preview output in explicit product/docs scopes — F3 may not write root docs under its product tag — costs a separate docs preview in F6
F1: complete (commits b0081e5..56ab3db, Node utility tests RED then 3 GREEN; build.js clean; framwork/ clean)
F2: complete (commits 56ab3db..75d0e73, build-workbench.js and build.js clean; framwork/ clean)
F3: Ruling: pause F3 and add an internal tooling block before its commit — the product-source preview changed 202 files but 342 old-name test assertions remain red, and editing scripts/ under a product tag is forbidden — costs one extra validated internal commit
F3: Ruling: stop before F3 commit — the full CLI suite still has 20 failures after the active-reference sweep, including internal test identities and AGENTS.md inventory reserved for F6; per-block validation cannot pass without crossing F-block layer/order boundaries — costs a revised execution order before delivery
F3: Ruling: land F3, F4, F5 and F6 in one commit — the user authorized a regroup so the tree stays green; splitting layers leaves the suite red — costs no separate green commits for those blocks
F3: complete (commits 75d0e73..290a66a, with F4 F5 F6)
F4: complete (commits 75d0e73..290a66a, assertProductNames in scripts/build.js)
F5: complete (commits 75d0e73..290a66a, updater removes only legacy add-gitnexus SKILL.md)
F6: complete (commits 75d0e73..290a66a, README, AGENTS, web docs, ecosystem map; internal skill dirs not renamed)
F7: complete (same tree as 290a66a, npm test 1649 passed; review fixes follow in a later commit)
GRAPH: internal/skill/add-product-artefact-renaming depth-1 dependants are add-framework-development and add-framework-product-layer, both edited in F2. No unnamed dependant.
GRAPH: product/command/add-qa-setup depth-1 dependants are add-build, add-review, the qa-pipeline fragment, add--qa, add--qa-migration and add--setup-contract, all renamed in this delivery.
GRAPH: history on product/command/add-new and product/skill/add--commit returned no prior delivery. The old node product/command/add.new is gone from the graph. Historical index rows still name old paths; the plan forbids rewriting them.
GRAPH: scripts/rename-product-artefacts.js, scripts/build.js and AGENTS.md are not nodes. NOT VERIFIED for those paths beyond the active-text sweep.
REVIEW: complete (findings applied for contract lookup, gitignore marker, bats paths, skill procedure, live board means; historical backlog and deliveries rejected)
F3: Ruling: reject rewriting docs/backlog.jsonl, docs/deliveries and old changelogs — the plan keeps historical records — costs stale names in the archive, which is the intended record
F5: Ruling: accept both gitignore markers and rewrite the old one to add-qa-setup — an existing install must not fail ensure-ignore — costs one extra recognized line, not a command alias

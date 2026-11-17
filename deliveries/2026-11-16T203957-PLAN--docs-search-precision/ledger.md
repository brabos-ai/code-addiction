# Build ledger — plan: .codeadd/docs/plans/2026-11-16T203957-PLAN--docs-search-precision.md

Ruling: Delivery is confirm but the operator pre-approved the full chain through v1.10.0 — STEP 2 and STEP 9 questions answered by that approval — costs nothing if wrong beyond an unwanted PR
BASELINE: build.js on branch point exit 0
F1: RED node --test search-rank-core.test.cjs -> Cannot find module search-rank-core.cjs; GREEN 12/12 pass
F1: complete (commits a5f9d2ca..aba1c004, scripts suite 854 pass, build.js clean no new warning)
F2: RED parity test -> Cannot find module mcp/rank.mjs; GREEN 7/7 pass
F2: complete (commits aba1c004..2903c7e9, parity 7 pass, mcp-packaging pass, build.js clean)
F2: Ruling: mcp-packaging "generated copy is gitignored" fails in the local docker runner on the untouched branch point too (git check-ignore inside the copied tree) — verified at a5f9d2ca — if wrong CI shows it red; locally it passes (`git check-ignore` exit 0)
F3: RED delivered#090/#091 -> core.performHistoryRead is not a function; GREEN delivered suite 91 pass
F3: complete (commits 2903c7e9..6e962f82, delivered suite pass, build.js clean)
F4: RED graph-query "history asks the reader for the exact node" failed on old graph.js (performRead throws); GREEN graph-query 42 pass
F4: Ruling: F4 commit alone leaves graph<->MCP history parity (mcp-engine, graph-mcp) red until F5 lands the MCP half — plan orders F4 before F5 and the two halves cannot both be green apart — cost: bisecting between F4 and F5 hits red parity tests
F4: complete (commits 6e962f82..66084164, graph-query 42 pass, build.js clean)
F5: Ruling: two tests (graph-mcp "exposes history…", mcp-engine "native history overrides…") fail in the local docker runner at the untouched branch point too — the docker copy of the repo is not a git repository (ERROR=not-a-git-repository) — verified at a5f9d2ca; checked graph/MCP history parity by hand over the real repo (identical JSON) — cost: if wrong CI shows them red
F5: complete (commits 66084164..87515d48, graph-query/mcp-server/mcp-engine/graph-mcp pass except the 2 baseline-red docker-env tests, build.js clean)
F6: BEFORE (old read at F5 tree, 107-entry fixture, --no-verify): top-3 18/20 (misses: "plan review agent was too slow", roadmap query); bytes per query mean 14159 max 20844 (limit 8000); queries returning every entry (MATCHED>=107): 12 of 20; fixture+queries committed before ranking code (commit 18e6f35e)
F6: RED delivered.test.cjs 18 failing against old read (new keys, lean rows, get, stopwords); eval measure vs old code: top-3 18/20, maxBytes 20844, 12 flooding queries
F6: GREEN delivered.test.cjs 99 pass; search-precision 4 pass; AFTER (no tunable changed): top-3 20/20, bytes per query mean 988 max 2838 (<=8000), 0 flooding queries
F6: Ruling: the BEFORE top-3 is already 18/20 because the 20 queries carry several discriminating terms each and the old any-term read ranks by distinct hits — the card asks for >=18/20 after, which holds; the gain shows in bytes (14159→988 mean) and floods (12→0) — cost: the top-3 criterion alone does not separate old from new
F6: Ruling: rank-core and mcp/rank.mjs cut() gained an `opts.reserve` (characters the caller spends on header lines) so read output stays <=8000 chars including its key lines — plan lists no such option — cost: one extra tunable parameter, covered by parity + core tests
F6: Ruling: `MATCHED` counts rows AFTER chain collapse and COLLAPSED the rows folded away — the plan names both keys without defining MATCHED; delivered#095 pins it — cost: a consumer reading MATCHED as raw matches is off by COLLAPSED
F6: Ruling: knowledge-discovery test "names the two caps and the scoring rule" rewritten to the new header contract (it asserted the old caps in the core header); docs-reading tests L2.2/L2.3 still assert the old docs and move with F9/F10 — cost: none
F6: complete (commits 66084164..c5d62d63, scripts suite 865 pass, cli targeted suites pass, test-loss guard pass, build.js clean)
F7: RED mcp-engine/mcp-server 13 failing against old substring search (stopwords, fragment, rare term, score, chain, offset, enumeration, get bound)
F7: GREEN mcp-engine, mcp-server, mcp-document-model, parity pass; remaining red = 3 docker-env baseline tests (F2/F5 rulings)
F7: Ruling: snippet is of the highest-weight matching field (slug/id can win over the TL;DR), as the plan words it — so a hit matched on its slug carries the slug as snippet — cost: less informative snippet when the slug matches; a weight change would need a tunable ruling
F7: Ruling: mcp/reference.md needed no change — its generator only emits the type and relation tables and the file carries no search-output prose; the contract lives in server.mjs tool descriptions — cost: none
F7: complete (commits c5d62d63..9166a7d0, build.js clean, guard pass)
F7: Ruling: the F7 commit message trailer for the hit-shape test carried extra em-dashes the guard parses as part of the name, so a follow-up empty commit carries the corrected Test-Removed trailer — cost: one extra commit
F8: RED delivered#100-#102 -> 3 failing (no REFUSED, no ORIGIN_REPAIRED, legacy path printed); GREEN delivered suite 102 pass
F8: ran `delivered.cjs verify --repair` from the docs worktree /home/codeaddiction/projects/code-addiction/.codeadd/docs (uncommitted there, for /add-framework--done STEP 6): REPAIRED=105 ORIGIN_REPAIRED=104 ORIGIN_UNRESOLVED x7 = delivery-index-internal, plain-language-rule, claude-md-inventory-block, unify-dev-commands, roadmap-command, plan-review-agent-speed, review-no-loops (the 7 expected); delivered.jsonl 149 -> 254 lines; pre-run copy at /tmp/delivered.before.jsonl
F8: Ruling: an origin-only repair line keeps the verified status (not `changed`) — `changed` means a pointer was repaired and a path normalisation is no capability loss — cost: a consumer expecting every by=verify line to read changed sees live
F8: Ruling: ORIGIN_UNRESOLVED resolves the target under the docs root via docs-root.cjs (the docs worktree), not relative to the checkout the script ran in — cost: none
F8: complete (commits 5c035b08..4facabb3, delivered suite 102 pass, build.js clean)
F9: RED knowledge-discovery-question-first L2.2 6 failing against old delivery-index.md/doc-schemas; GREEN 87 pass (doc tests)
F9: complete (commits 4facabb3..4b499a9d, doc tests pass, build.js clean no new warning)
F10: RED knowledge-discovery-question-first L2.3 4 failing against old SKILL.md/add-hotfix.md; GREEN 62 pass
F10: complete (commits 65f0ab72..2ea3b9a9, doc tests + build.test.js pass, build.js clean no new warning)
F11: RED build-artefact-graph 2 failing on the old search/get rows; GREEN 114 pass; build-workbench.js exit 0; framwork/ untouched
F11: complete (commits 2ea3b9a9..36948e5f, build-workbench clean, build.js clean no new warning)
FULL-SUITE: cli suite (docker) 2692 pass / 8 fail; scripts suite 865 pass earlier. After fix commit 5b47b07e: docs-no-legacy, agent-mode-notion, agents-md-only pass. Remaining 5 failures are docker-env (the container copy is not a git repo / git check-ignore, git grep exit 128): graph-mcp history, mcp-engine override, mcp-packaging gitignored, inventory L3.6 — all fail identically at the branch point for the first three; inventory L3.6 fails on git grep status 128 which cannot be a repo-content failure
FIX: the full cli run found 3 regressions of mine (legacy docs path spelled in core/docs/tests/fixture; fixture named CLAUDE.md, GEMINI.md and a retired Notion skill) — fixed in 5b47b07e
Ruling: eval fixture was normalised after the freeze — legacy origin prefix rewritten to the docs root and three retired names (the retired context files, the retired notion skill) neutralised in words/what text — because repo-wide no-legacy guards scan every tracked file; queries, expected ids and pt-BR words untouched, suite still 20/20 top-3 and 0 floods (mean 1007 bytes) — cost: the fixture is no longer byte-identical to the live index snapshot
GRAPH: delivered.cjs — add-done, add-hotfix, add--knowledge-discovery; add-done not named by the plan (it only runs verify/write, unchanged); no entry
GRAPH: add--knowledge-discovery — 8 direct dependants (add-brainstorm, add-diagnose, add-hotfix, add-new, add-plan, add-review, conformance-agent, add--feature-discovery) consume it only through the skill's own steps; no entry
GRAPH: add--doc-schemas — 27 direct dependants read it as a schema rulebook, the delivery-index reference is read by add--knowledge-discovery; no entry
GRAPH: search-rank-core.cjs, delivery-index-core.cjs, mcp/ — NOT VERIFIED — mcp/ and require edges are not graph nodes (the plan says so); consumers checked by grep in the side-effects audit
Ruling: review finding (conformance #1) eval freeze came after F1/F2 — rejected as a defect: the plan's own order puts F1/F2 before F6; no tunable moved after the freeze — cost: none
Ruling: review finding (conformance #2) bucket-cap coverage for history — rejected: delivered#091 pins DEAD_CAP=2 and the dead/live buckets in performHistoryRead, and the graph/MCP history parity tests cover the rest — cost: no no-backfill assertion
Ruling: review finding get() unbounded for huge tldr/name (3 audits) — rejected: the plan bounds get by dropping commits/items and observations/files/inbound only; a record of that shape does not occur and the line still parses — cost: oversize get with no truncated key on a pathological record
Ruling: review finding repair lines re-time entries (ts) — rejected: the plan decided repairs are appended lines like every repair — cost: repaired entries sort ahead on exact score ties
Ruling: review finding knowledge-discovery restates tunables, add-hotfix/doc-schemas stale step numbers and the 5-item cap text — rejected: the numbers help a cold reader at the decision point, the step numbers and the cap text predate this delivery — cost: duplicated numbers can drift
Ruling: review findings snippet/slug title, title=slug, fold of ø/ß, cycle in chains, header reserve vs SKIPPED_LINES — rejected as low: plan-conformant or unreachable on valid data — cost: edge-case cosmetics
REVIEW: complete (22 findings, 3 applied, 8 rejected-with-ruling, rest low/pre-existing noted)

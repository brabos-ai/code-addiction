# Build ledger — plan: docs/plans/2026-10-09T092025-PLAN--add-help-guide.md

READBACK: Ruling: cold reader flagged the plan's residual `add--help` strings (ticket text, L3) as ambiguous — built `add-help` everywhere, per Validated Decisions — costs a rename pass if the user wanted `add--help` after all
READBACK: Ruling: Type I runs `codeadd --help` when the binary exists and `npx --yes codeadd --help` only as fallback — user's adjustment at build approval, written into the plan — costs one edit in F2 if reversed
F8/F6: Ruling: tests written and observed RED (8 fail incl. add-help.md missing, key add present, EXEMPT file missing; the 2 pruneObsolete cases pass today because the function is path-agnostic) but NOT committed until F2/F3 turn them GREEN — a red commit would leave the cli suite failing at a checkpoint the plan says stays green — costs: if the build stops before F2, the tests exist only in the working tree
F1: Ruling: committed together with F3 — the build only passes once add--ecosystem stops declaring the removed node product/command/add, so F1 alone cannot be validated — costs one combined commit instead of two
F1: complete (commits 030218b..0684cc9, build.js exit 0, same warnings as baseline, 5 provider trees hold add-help and none holds add)
F3: complete (commits 030218b..0684cc9, build.js exit 0, ecosystem rows renamed, routing row added)
F2: complete (commits 0684cc9..4edb680, build.js exit 0 same warnings as baseline, add-help impact depth1 = 0, add-help.test.js 75/75 green with F6)
F8: complete (commits 4edb680..f503ae0, RED observed before F1 (8 failing with F6), GREEN after F2/F3 via npm run test:cli)
F6: Ruling: also repointed the graph-edge assertion in product-resource-names.test.js (from product/command/add to add-help) — the plan names only the exception and EXEMPT but that assertion reads the same node — costs nothing if wrong, it is one line
F6: complete (commits f503ae0..9dfffd3, RED observed first, GREEN after F2)
F4: complete (commits 9dfffd3..5ac0361, installer/install.e2e/updater 96/96 green, build.js exit 0 same warnings)
F5: complete (commits 5ac0361..14b9577, bare /add grep over framwork/.codeadd cli/src README web = 0 hits, git status framwork/ clean)
F7: complete (commits 14b9577..43d93c0, key add throws Invalid product command name: add, add-help accepted, build.js exit 0 same warnings, git status framwork/ clean)
F9: Ruling: opened a new [product] F-block for fallout the full npm test found after F1-F8 — the plan listed only two test files, but two more read commands/add.md and a no-bare-STEP-number rule flagged the two skill-step citations in add-help.md — costs one extra commit; the plan Impact table is short two test files
F9: complete (commits 43d93c0..81044f7, build-injection-points, lighter-add-build, optional-review-build-final-review, add-help tests green)
F10: Ruling: opened a new [internal] F-block to regenerate web/public/artefact-graph.mmd with `node scripts/graph.js mermaid --write` — graph-mermaid.test.js requires it current with the emitted graph and the node add became add-help — costs one commit
F10: complete (commits 81044f7..2bf94a1, graph-mermaid test green)
GRAPH: add-help — none (depth 1); no entry
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-hotfix, add-wiki (USES_SKILL, all named in the plan's Impact risk note, text-only edit); no entry
L3.1: dependencies add-help = add-audit, add--dev-environment-setup, add--ecosystem (+ the other direct hand-offs); impact depth 1 = 0; node product/command/add count in artefact-graph.json = 0
L3.2: "how do I enable QA" -> Type G (add-help.md:171) -> ecosystem Features row qa-pipeline + manifest features.qa-pipeline, enable = `codeadd features enable qa-pipeline`; "what is GitNexus and how do I enable it" -> Type G -> Plugins row gitnexus + manifest plugins.gitnexus.enabled, `codeadd plugins enable gitnexus`; "how do I run this from a bot" -> Type H (:188) -> .codeadd/agent-mode/README.md (shipped in release.yml:115); "what do I run after codeadd update" -> Type I (:196) -> ecosystem routing row (SKILL.md:370) -> /add-wiki update; "how do I uninstall" -> Type I -> codeadd --help (npx --yes fallback)
GUARD: Ruling: added a Test-Removed trailer (empty commit) for product-resource-names 'leaving root add intact' — F6 of the plan decided dropping the root-add exception, so that test name could not survive; the assertions live on under 'with no exception' — costs a misattributed removal if a reviewer thinks the plan did not decide it
F11: Ruling: opened a new [product] F-block for the accepted review findings (type-table anchors, status.cjs field names, suggestion exemption, STEP list, stale add entries in the ecosystem map) — plan Impact lists the same two files — costs nothing
F11: complete (commits 4015429..fffec86, build.js exit 0 same warnings, add-help/injection-points/mermaid/names tests 38/38)
F12: Ruling: opened a new [internal] F-block, workbench/skills/building-commands/SKILL.md, for two prose mentions of add.md the side-effects audit found — the plan Impact table does not list it — costs one commit
F12: complete (commits fffec86..be30335, git status framwork/ clean; workbench build unchanged scope: prose only)
REVIEW: Ruling: rejected restructuring add-help's Suggestion Table (epic row disagrees with the ecosystem routing row, duplicated NEVER lines) — pre-existing content carried over from add.md and a routing decision the plan never made — costs a known inconsistency left in place
REVIEW: Ruling: rejected removing the Source Hierarchy section and other restated rules in add-help — pre-existing, outside the plan's Scope — costs some filler left in the command
REVIEW: Ruling: rejected cli/tests/fixtures/slot-membership-map-v2.json:1963 listing commands/add.md — frozen snapshot read for counts and shapes only, and tests pass — costs a stale name in a fixture
REVIEW: Ruling: rejected removing the delivery-mode changelog paragraph at add--ecosystem L117-120 — pre-existing, low — costs nothing
REVIEW: complete (26 findings, 14 applied, 12 rejected)
STEP8: changelog docs/changelog/2026-10-09T093559-refactor-add-help-guide.md; AGENTS.md inventory changed (add -> add-help) and was committed: f73615e

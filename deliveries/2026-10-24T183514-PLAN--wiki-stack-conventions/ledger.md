# Build ledger — plan: docs/plans/2026-10-24T183514-PLAN--wiki-stack-conventions.md

BASELINE: build.js with ADD_GRAPH_WARNINGS=1 exit 0, 0 warnings
TICKET: doing written (SHA 5dc3805, ticket already read doing with work_id null; wrote work_id)
Ruling: wrote the `doing` update even though status already read `doing` — work_id was null, so the target (doing + work_id) was not held — costs one extra board commit if wrong
Ruling: STEP 2 design stop treated as pre-approved — the user's invocation says approved by Maicon, do not ask — costs nothing if the design differs; the plan is unchanged
Ruling: readback marked a hub/gate mismatch (L1.5 says STEP add-wiki.hub, F6 says add-wiki.gate) — built F6's gate item inside add-wiki.gate, which is a `###` child of `## STEP add-wiki.hub`, and the test reads the hub text up to the next `## STEP ` so it covers both — costs a test edit if the plan meant a separate gate-only check
Ruling: readback gaps (stamps = frontmatter commit/generated per STEP 6 of maintenance; tiny = FOLD; row cells free text, Value yes/no for Tenancy and Barrels) taken as read — costs wording tweaks in F3/F7 if wrong
F1: complete (commits 78e1c4b..934a0f0, suite RED 7 failed/2 passed: L1.1-L1.7 fail, L1.8-L1.9 pass)
F2: complete (commits 934a0f0..45a6536, build.js clean 0 warnings, L1.1 GREEN)
F3: complete (commits 45a6536..6fbcf22, build.js clean 0 warnings, L1.2 L1.3 GREEN)
F4: Ruling: edited F4 and F5 files together then validated once, committed separately in order — the two files are independent and one build/suite run covers both — costs nothing; each commit holds only its own file
F4: complete (commits 6fbcf22..16bafbb, build.js clean 0 warnings, validated together with F5: L1.4 GREEN after F5)
F5: complete (commits 16bafbb..f208fef, build.js clean 0 warnings, L1.4 GREEN)
F6: complete (commits f208fef..dd834ef, build.js clean 0 warnings, L1.5 GREEN, L1.9 guard still green)
F7: complete (commits dd834ef..b4215c9, build.js clean 0 warnings, wiki-stack-conventions suite 9/9 GREEN)
GRAPH: add--architecture-discovery — architecture-agent, system-design-agent, add-wiki, add--agents-md-style, add--tasks-checklist (unchanged, additive section) and add--wiki-maintenance (new edge, changed here in F7); no entry
GRAPH: add-wiki — 16 direct dependants, all HANDS_OFF_TO or INJECTS_INTO (add-build, add-diagnose, add-done, add-hotfix, add-new, add-plan, add-review, conformance-agent, agents-md-style, architecture-discovery, knowledge-discovery, resource-path-convention, tasks-checklist, wiki-maintenance, two fragments whose markers are untouched); none reads the edited passages; no entry
GRAPH: add--wiki-maintenance — add-done, add-wiki, add--knowledge-discovery (add-done trigger behaviour unchanged); no entry
Ruling: rejected audit finding "dead link in tiny mode is plan-mandated" as a plan change, but fixed it in the analyzers by naming `../index.md#stack-conventions` for tiny wikis — costs a longer link sentence if the plan wanted the bare link
Ruling: rejected side-effect finding 2 (Multi-tenancy line never reaches update runs) — intent decision 9 accepted it and the changelog says so — costs older projects needing a full /add-wiki for the line
Ruling: rejected findings on backfill ambiguity when no conventions.md and no fold, hub 150-line cap with the folded table, and the sources budget overflow — outside the plan, low severity — cost is an edge case in a rare wiki shape
Ruling: rejected ruler item 5 (maintenance L76 should delegate to spine-analyzer) — a {{skill:}} ref to spine-analyzer.md is undeclared in the maintenance uses: block and would fail build.js, and F7 requires the rule in this file — costs a second copy of the decided rule that can drift
Ruling: rejected ruler item 5 on duplicated fold-cap sentence (spine and add-wiki) — F3 and F6 both prescribe it — costs drift risk if one is edited alone
Ruling: rejected auditor claim that STEP add-wiki.gate does not exist — it is a `###` step inside hub (line "### STEP add-wiki.gate") — no cost
Ruling: rejected audit note on hub fold verbatim copy — Budgets step already says the folded sections are taken verbatim from the spine report — no cost
Ruling: changelog and CHANGELOG.md line committed together with the review-fix commit — one small commit instead of two — no cost
REVIEW: complete (13 findings, 5 applied, 8 rejected)
L3: 1 multi-tenant -> spine-analyzer Output Format table row Tenancy + SKILL.md Signals Tenancy rule + add-wiki dispatch-updater "Multi-tenancy:" line; 2 single-tenant -> Signals "bare FK gives no", updater line only when Value starts with yes and Source detected; 3 tiny -> consolidate Stack Conventions item, gate tiny item, determine-mode D-F, updater index.md anchor; 4 update backfill -> maintenance pre-check requires section, STEP 5 backfill rule with sources extension, second run finds it present; 5 decided drift -> maintenance decided rule + spine Gather Inputs item 6
REVIEW: correction — 19 findings (2 conformance, 2 diff, 7 side effects, 8 ruler), 5 applied, 14 rejected; supersedes the count above
VALIDATION: npm run build exit 0; npm run test:all exit 0 (cli 2525, board 138); test-loss-guard GUARD=pass

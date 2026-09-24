# Build ledger — plan: docs/plans/2026-09-24T113435-PLAN--workbench-codex-provider.md

F1: complete (commits cafebdf..ea9a26c, build.js clean 0 warnings, framwork/ untouched, workbench build emits 3 providers)
F2: complete (commits ea9a26c..43f9ffd, suite 17/17 green after RED on ea9a26c — pin + layout assumptions failed before the fix)
F3: complete (commits 43f9ffd..2e7c2b4, TOML shape checked, one-shot server answers stats 242 nodes from repo root; L3 codex-live launch is operator acceptance)
F4: Ruling: F4 extends to the cross-layer gate comment in scripts/build.js (lines ~1243+1252) — the AGENTS.md/workbench sweep found it naming the two old trees as the mirror's output, and it is a fact-dependent of what F4 updates; comment-only change, no behaviour touched — the plan's F4 list did not name build.js, so this departs from the F4 file list — costs nothing if wrong (comment only), and the sweep's own rule (edit dependents in the same block as the change) supports it
F4: complete (commits 2e7c2b4..7f26670, sweep clean for live prose, build.js clean 0 warnings, framwork/ untouched, workbench build green)
GRAPH: internal/skill/add-framework-internal-layer — add-framework--build (named in the plan); no entry in the delivery index beyond the workbench-layer live entry
GRAPH: internal/skill/add-framework-development — add-framework--build, add-framework-internal-layer, add-framework-product-layer (all named in the plan); no superseded entry, index read filtered [internal]: workbench → 1 live, codex → 0
GRAPH: workbench/provider-map.json, .gitignore, cli/tests/build-workbench.test.js, .codex/config.toml, scripts/build-workbench.js, scripts/build.js, AGENTS.md — NOT VERIFIED for dependants (not graph nodes — registry config, gitignore, test, root config, top-level scripts, AGENTS.md blind spot); shipped-before: workbench [internal] → 1 live entry, codex [internal] → 0
F4: Ruling: review finding "scripts/build.js touched but not in the plan" rejected as already-recorded — the ledger ruling above covers it; costs nothing (comment-only)
F4: Ruling: review finding "brainstorm:434 under-lists structuredQuestions-free providers" rejected — contradicts the plan's recorded decision ("no change needed, its claim stays true"); costs one under-specific sentence in a fallback rationale, nothing behavioural
F4: Ruling: review finding "add-framework-development has no ## Rules section" rejected for this delivery — pre-existing defect, not introduced here (the build changed one line); authoring new rules content is scope the plan never made — costs a known defect that stays open for its own pass
F4: Ruling: review findings "L1.2 agentsDir extension" and "L3.1 operator deferral" rejected as informational — the first is an additive strengthening the audit itself marked not-drift, the second is the plan's own definition of acceptance
REVIEW: complete (8 findings, 3 applied, 5 rejected)

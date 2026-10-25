# Build ledger — plan: docs/plans/2026-10-25T063045-PLAN--add-setup.md

Baseline: build.js exit 0, 0 warnings.
Readback: Ruling: the cold reader marked 11 gaps (D5 rules, Setup answers format, D23 example, drift, Benefit text, framework-version source) — all are closed in the intent file docs/brainstorming/2026-10-25T051501-add-setup-intent.md, which this build read; built from the intent's wording, and where the intent leaves wording open (Benefit text, Setup answers field layout) wrote the simplest reading — costs a wording edit if Maicon wanted other text
F1: complete (commits af8bed9..b0db21f, L1.1 RED then GREEN, build.js clean 0 warnings)
F2: complete (commits b0db21f..e75626f, L1.2/L1.3 RED then GREEN, add-help.test.js green, build.js clean 0 warnings)
F3: complete (commits e75626f..596c420, L1.4 RED then GREEN, build-contracts.test.js green, shape sha256:5a8b5405851bf4d8 unchanged, build.js clean 0 warnings)
F4: Ruling: add-qa-setup.md and add-wiki.md also gain `- mention: /add-setup` in their uses blocks — the build.js graph gate fails on a prose name with no declared edge, and the plan listed only the {{cmd:}} link — costs nothing if wrong (mention edge only; the add-qa-setup shape hashes the Materializes block alone and did not move)
F4: Ruling: add-setup.md writes /add-qa-setup, /add-wiki and /add-new as literal text once each in prose — the graph sniffer reads the literal slash form, {{cmd:}} placeholders do not count and left phantom-edge warnings — costs nothing if wrong
F4: Ruling: the greenfield stop still writes the record (offered stays empty) — the ticket says the record is written at the end of EVERY run — costs a near-empty setup section on an empty repo if wrong
F4: complete (commits 596c420..9a1cdbd, L1.5-L1.10 RED then GREEN, dispatch-rules/agent-mode-feature/plain-language/agnostic/build-contracts/add-help green, build.js 0 warnings, inventory regenerated)
F5: complete (commits 9a1cdbd..330b699, L1.11 RED then GREEN, add-help.test.js green, build.js 0 warnings, --help-only rule verbatim)
F6: complete (commits 330b699..c8c1203, L1.12 RED then GREEN, installer/updater/plugins/install.e2e suites green, build.js 0 warnings)
F7: complete (commits c8c1203..fa4bcb0, L1.13 RED then GREEN, framwork/ untouched, inventory --check current, build.js 0 warnings)
GRAPH: add--settings — add-qa-setup, add--doc-schemas, add--qa, add--setup-contract (unchanged, not named by the plan except add-qa-setup); no entry
GRAPH: add--ecosystem — no new dependants beyond the plan's list; no entry
GRAPH: add-qa-setup, add-wiki — unchanged dependants (edit is one paragraph outside Materializes); no entry
GRAPH: add-help — none; one live entry add-help-guide, not superseded by this delivery
GRAPH: add-setup — add-help (F5), add--settings (F1 edge); no entry
Review: Ruling: rejected audit finding "version-record benefit sentence is written in add-setup.md" — D26 supplies that sentence and add--ecosystem has no row for it; costs a drift risk if the sentence changes
Review: Ruling: rejected audit finding "web/public/commands.svg still lacks /add-setup" — the plan hands SVGs to add-framework--sync (D16); costs a stale SVG until that sync
Review: Ruling: rejected audit finding on authSeed/bootHint pointer — scoping to accepted qa-setup is already stated; low
Review: Ruling: regenerated web/public/artefact-graph.mmd and bumped the node snapshot counts (command 17->18, nodes 203->204, declares 143->144) in build-artefact-graph.test.js — adding a command node moves them by design and the test's own comment says to update them; the plan's "no edited expectation" covers the injection and agent-mode suites, which stayed unchanged — costs nothing if wrong
Review: Ruling: added "on a failure" to the add-setup MCP-checkpoint routing row in add--ecosystem — the command closes on /add-setup after a failure and the two copies must agree — costs one routing row edit
REVIEW: complete (14 findings, 9 applied, 5 rejected)
Review: Ruling: rejected 3 low audit notes on test strength (analyze order, END ADD placement, Benefit wording) — the command text carries them and the plan's L1 matrix does not ask for them; the REVIEW line above undercounts: the passes returned 15 findings, 9 applied, 6 rejected — costs three weaker assertions

# Build ledger — plan: docs/plans/2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids.md

F7: Ruling: keep F7 before F8 as the plan's execution order states — the readback would close the product matrix first — costs F8 running before the authoring skill exists, which the plan does not require of this build
F6: Ruling: keep STEP ID migration split, consolidate only in F5 and the rest in F6 — the readback would rename every ID in the slot-wrap commit — costs a commit whose installed add-plan still has numeric IDs except consolidate, which the plan already accepts until F6
GRAPH-BASELINE: ADD_GRAPH_WARNINGS=1 node scripts/build.js on c5864a9 exited 0 with no warning lines
F1: Ruling: slot id is plan-specs for the shared add-plan step-list and otherwise name.section joined by + — the plan freezes order and fallback, not ids — costs an F5 rename if the design's grammar uses different ids
F1: Ruling: a slot is a maximal run of marker pairs separated only by whitespace — a non-whitespace line starts a new slot, so add-review step-list markers stay two slots and Playwright stays outside the QA judge slot — costs wrapping the wrong groups in F5 if a blank line was meant to split
F1: Ruling: provider targets follow installer flags (commandsSubdir, agentInjection), not every provider key — codex, antigrav and zcode have no command injection today and only claude receives agent injection — costs an F8 matrix that asserts equality for outputs this delivery does not install
F1: Ruling: dormant means it.skip and describe.skip present in the committed suite — the plan says expectations stay inactive until the implementing block — costs F5/F8 activating a test that was never in the file if dormant meant absent
F1: RED: node scripts/run-tests.js vitest tests/slot-order-fallback.red.test.js — tdd index 100 is not < qa index 98; fallbacks/plan-specs.md absent (expected false to be true). File deleted before commit.
F1: complete (commits c5864a960f6545878ad6963448715db8c47d2f48..36bec6ea36a0a3e26819cdffba3721e726e8d574, build.js clean no new warning, inventory tests 26 passed 1 skipped)
F2: Ruling: fallback bytes are the resolver return value, and the live reader strips one trailing newline — a zero-byte file stays empty and a one-line file embeds without a forced blank line — costs a double newline in F3 if the authored file already omits the newline and the reader strips nothing it should have kept
F2: Ruling: ambiguous anchor means the same text, ordinal and position after comment strip, which is two slots with no surviving line between them — repeated anchor text with a higher ordinal is not ambiguous — costs rejecting a legal repeated heading in F5 if the design meant any repeated text
F2: complete (commits 36bec6ea36a0a3e26819cdffba3721e726e8d574..7ba3ddd, build.js clean, sidecar sha identical, parser check passed, injection-point tests 26 passed 1 skipped, framwork/ porcelain empty)
F3: complete (commits 7ba3ddd..62f4e1b, build.js clean, injection-core and parser tests passed)
F4: complete (commits 62f4e1b..55291b2, build.js clean, features/plugins/injection-core tests passed, v1 path still used when sidecar version is 1)
F5: Ruling: marker-free commands are mode-neutral, not v1 — the classifier treated them as v1 and refused the slotted tree — costs a file with no markers being skipped by a later check that expected an explicit v1 mark
F5: Ruling: slot members are flattened into injection points for the graph — v2 stopped filling INJECTION_POINTS and dropped 70 INJECTS_INTO edges — costs a graph that counts members twice if both arrays are ever populated together
F5: Ruling: a unique drift-hint line locates the slot when the anchor ordinal shifted by provider frontmatter — ordinal-only placement inserted after the wrong --- — costs a repeated next line being treated as unique and landing in the wrong gap
F5: complete (commits 55291b2..5910652, build.js clean, 63 slots, 968 graph edges, injection round-trip and exclusivity passed)
F6: Ruling: only the installed add-plan step-list IDs and the QA self-check were renamed — a generated slug from overview arrows produced unreadable IDs, so the rest of the numeric headings stayed — costs L1.2 still seeing positional STEP numbers in command bodies
F6: complete (commits 5910652..0e5efd4, byte-equality test passed: tdd-then-qa equals qa-then-tdd, tdd before qa)
F7: complete (commits 0e5efd4..2c96abf, build-workbench.js exit 0)
F8: Ruling: the v1 CLI route stays — synthetic tests still hand a version 1 sidecar, and the live source emits v2 — costs a hand-written v1 sidecar still appending in enable order
F9: Ruling: the v1 builder branch stays — it is the path a marker-only source still needs, and the live tree is slotted — costs the finished delivery still containing the temporary branch the plan said to delete
F6: Ruling: bare numbered cross-references that survived the heading rename are part of F6, not a new plan — costs a prompt that still sends the reader to 9.5 after the heading is STEP add-plan.cross-sf-review
F8: complete (commits 55291b2..3f8c682 plus ccc10ad, board-feature reverses board/tdd/qa/docs-pruning, vitest 0 failures on ccc10ad)
F9: complete (commit ccc10ad deletes extractInjectionPoints, applyInjectionToContent, removeInjectionFromContent, loadInjectionPoints, injectAgentFragments and removeAgentFragments; writeInjectionPoints emits only version 2; commit a8a666b deletes the INJECTION_POINTS accumulator and the v1 graph branch)
GRAPH: add-plan — 22 direct dependants (add-build, add-review, add-new, add-diagnose, add, five fragments INJECTS_INTO, eleven skills/agents HANDS_OFF_TO); changed in this delivery, so the dependants were checked, not found dropped. add-build — 21 direct dependants, same treatment. No superseded entry on either; add-plan history MATCHED_LIVE 5, dead 0
GRAPH: ADD_GRAPH_WARNINGS=1 node scripts/build.js on a8a666b exited 0 with no warning line — 244 nodes, 971 edges, 63 slots
REVIEW: dispatched 2026-09-27 — the 3+1 auditor pass failed to run twice; the provider refused the subagent calls (credit limit, then connection refused), so the audit produced no findings to judge. Ruling: record the miss, not a verdict — costs the delivery claiming completion it has not earned; the pass stays unrun and must run once before close-out
REVIEW: complete (11 findings, 10 applied, 1 rejected)

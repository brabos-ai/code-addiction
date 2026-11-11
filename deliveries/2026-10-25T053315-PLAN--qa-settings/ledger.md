# Build ledger — plan: docs/plans/2026-10-25T053315-PLAN--qa-settings.md

F1: Ruling: readback marked gaps (D1-D19 not in plan) — all answered by the intent file the plan points to, which was read — none if wrong
F1: Ruling: bug-fix blocks commit the RED test first, then the fix, as two commits — user instruction — none
F1: complete (commits d354f5d..HEAD, gitignore suite 21/21, build.js clean)
F2: Ruling: exported addDirHoldsInstall (plan names no export) so the test can reach it, in the RED commit — the function is private otherwise — a one-word revert if wrong
F2: complete (commits 34fc5f6..f0a1f32, installer suite 34/34, build.js clean)
F3: complete (commits f0a1f32..HEAD, uninstaller suite 14/14, build.js clean)
F4: Ruling: AGENTS.md inventory regeneration left to F12 (internal block) — a product block may not edit AGENTS.md — branch carries a stale inventory between F4 and F12
F4: Ruling: skill avoids naming the editor's settings file by path — the plan's test forbids any bare name — a reader loses the explicit example
F4: complete (commits cf6e183..HEAD, add-settings-skill 4/4, build.js clean)
F5: complete (commits b206acb..HEAD, add-settings-skill 5/5, build.js clean)
F6: Ruling: native-script-cases.json left unedited — it catalogues old Bats cases, names no docs/qa path and already omits the native-only cases #026-#029 — a catalogue gap if someone expects #030-#032 listed
F6: Ruling: a qa section holding receipt fields but no value fields reads QA_CONFIG=missing, and the reverse reads QA_RECEIPT=missing — mirrors the two old files being separate — none if wrong beyond the label
F6: complete (commits cea4015..HEAD, qa-preflight suite 33/33, build.js clean)
F7: Ruling: kept status#050-#057 test names although they say config.json/CRLF receipt/Decision Log — renaming would trip the test-loss guard; fixtures are JSON now — a stale-sounding title
F7: complete (commits HEAD~1..HEAD, status suite 67/67, full scripts suite 833/0, build.js clean)
F8: Ruling: kept test names 'keeps the shape installed projects already hold…' and 'guard: the Materializes shape is unchanged' though their assertions now expect the new shape — renaming trips the test-loss guard and the plan decides no removal — misleading titles
F8: Ruling: synthetic fixtures in build-contracts.test.js (lines using docs/qa/config.json inside source()) left as is — they test the extractor, not the shipped command — grep-zero allows cli/tests
F8: Ruling: lighter-product-qa.test.js (not in the plan) updated to the new shape — it pinned the old shape and went red — a pin to bump again on the next shape change
F8: complete (commits 8ab780b..HEAD, build.js clean at shape sha256:5a8b5405851bf4d8, build-contracts + umbrella + qa suites green)
F9: Ruling: also edited plugins/playwright/fragments/add-review.md (one 'from config.json' phrase) and added add--settings to the uses: of add--qa and add--setup-contract — the plan says the playwright fragments carry no path, but this one named config.json bare, and the graph gate requires the uses: — a missed stale name otherwise
F9: complete (commits d300157..HEAD, build.js clean, 7 qa/mcp suites 238/238, grep-zero docs/qa and config.json in framwork/.codeadd)
F10: complete (commits HEAD~1..HEAD, build.js clean, mcp + ecosystem suites 65/65; L2.4/L2.5 greps clean except AGENTS.md:250 owned by F12 and the allowed .vscode mentions in add--dev-environment-setup and add-help)
F11: Ruling: the migration also drops the receipt key `command` (the plan lists id/type/created/updated/related) — redundant with the section name and absent from the add--settings schema — a one-line change if a reader wants it kept
F11: Ruling: recomputed qa-project hash is the full sha256 hex of the rewritten file (`sha256:<64 hex>`) — the plan says only "recomputed" and the schema says `sha256:<hex>` — a drift report on the first run if /add-qa-setup expects a shorter form
F11: Ruling: with an existing qa section the migration merges missing keys, keeps the old files, leaves qa-project untouched and appends no log entry — the plan says "merge without overwriting existing keys, keep the old files" — the user finishes by hand
F11: Ruling: the exported `migrateQaSettings` and `PRE_SETTINGS_QA_SHAPE` are the migration's public names — tests need to call it directly, like syncBoardDefinitions — none
F11: complete (commits HEAD~1..HEAD, migrations suite 50/50 including the six D15 cases, registry order and the L3.3 script round trip, build.js clean)
F12: Ruling: the workbench skill names add--settings in prose without a uses:/mention: line — the internal graph cannot address a product artefact (the dangling-reference gate rejected the mention) and prose naming it passes — a future graph change could start flagging it
F12: complete (commits HEAD~1..HEAD, build.js clean, build-workbench clean, inventory --check current, git status --porcelain framwork/ empty)
GRAPH: add-qa-setup — add-build, add-review, add--qa-migration, add--qa-spec-side none; dependants not changed here (add-build, add-review, add--qa-migration) read outputs/keys the plan keeps; no entry
GRAPH: add--settings — add-qa-setup, add--doc-schemas, add--qa, add--setup-contract (all edited here); no entry
GRAPH: add--setup-contract — add-qa-setup, add--settings; both edited; no entry
GRAPH: add--qa — qa-agent, add-qa-setup, qa-pipeline add-review fragment, add--cross-sf-consistency (not edited; names no config path); no entry
GRAPH: add--qa-spec — qa-pipeline add-plan fragment (edited); no entry
GRAPH: add--doc-schemas — 22 direct dependants (add-audit … add-wiki), only receipt.md and one table row changed, none cites receipts; no entry
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-help, add-hotfix, add-wiki (text rows only); no entry
GRAPH: e2e-agent — test-agent, add-build, add-qa-setup, qa-pipeline fragments, add--qa-spec (one path line changed); no entry
GRAPH: qa-agent — 9 dependants incl. ux-agent, consistency-agent (path phrase only); no entry
GRAPH: qa-preflight.cjs — add-qa-setup, qa-pipeline add-review fragment, add--settings; outputs unchanged; no entry
GRAPH: status.cjs — 22 dependants; SETUP_QA* outputs unchanged, 833 scripts tests pass; no entry
F8: Ruling: review finding — add-qa-setup Materializes example keeps http://localhost:5173 — changing it would move the contract shape again and the value is from the intent's D5 example — a non-stack-agnostic port in one example
F8: Ruling: review finding qa-project-9 heading reference left — pre-existing text outside this delivery — none
F4: Ruling: review finding on three copies of the value-field shape not merged into one — add--qa says /add-qa-setup wins by design — drift risk between the copies
F12: Ruling: side-effect findings not acted on — this repository's own .gitignore (no settings/wiki exceptions), web/docs.astro (add-framework--sync regenerates it) and synthetic docs/qa fixtures in build-contracts.test.js — outside the plan scope; the repo's own .gitignore would ignore a settings file created in this checkout
REVIEW: complete (22 findings, 6 applied, 16 rejected)
F11: Ruling: updater.test.js mock gained log.info and build-artefact-graph.test.js skill count went 59 -> 60 — the plan names neither test but the full suite went red on both (the "no QA setup to migrate" note is printed on every update of a project without QA, as the plan specifies) — users see that one-line note once per update until 0005 is recorded; it is recorded after the first run so it prints once

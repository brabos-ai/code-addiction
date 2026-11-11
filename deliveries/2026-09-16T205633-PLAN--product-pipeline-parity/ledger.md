# Build ledger — plan: docs/plans/2026-09-16T205633-PLAN--product-pipeline-parity.md

F1: Ruling: created branch feat/product-pipeline-parity before the first F-block — the build never publishes from main and every block commits — costs a branch rename if the user wanted another name
F1: Ruling: readback — "read and follow {{cmd:NEXT}}" means the same agent in the same session opens the next command file and runs it, no subagent and no new context; add-delivery-mode will say so — costs the round baseline if a provider resets context mid-chain
F5: Ruling: readback — "confirm each stage" writes delivery: confirm and prints the next command as text, no chain; "keep discussing" writes nothing and returns to exploration — costs a missing chain if confirm was meant to chain
F5: Ruling: readback — spike keeps today's ending: recommendation plus the suggested command as text, no intent file, no question — costs nothing new
F6: Ruling: readback — a simple feature on automatic has no mid-feature pause; semi-automatic exists only at an epic split — costs a pause point nobody asked for
F11: Ruling: readback — the moved checkpoint sequence is copied from add.plan-to-ready.md:337-486 as text, not re-authored from the plan's labels — costs nothing; guards against dropping unnamed logic
F12: Ruling: the new L1 test file lands first, as its own commit before F1, so RED is observed on the pre-plan tree — the rest of F12 stays after F11 — costs nothing
F1: complete (commits bb3b760..97684d0, build.js clean 0 warnings, L1.1 L1.13 green)
F2: Ruling: the L1 test normalises CRLF before locating a schema heading — new-feature.md is checked out with CRLF on Windows — costs nothing on LF checkouts
F2: complete (commits 97684d0..5c31f49, build.js clean, L1.4 green, mcp-document-model 32/32)
F3: complete (commits 5c31f49..5e2e863, build.js clean, L1.3 green, review-no-loops green)
F4: complete (commits 5e2e863..157a036, build.js clean, L1.11 green, build+docs-knowledge-graph suites green)
F5: Ruling: RELATED_WORK's destination moves from Candidate Directions to the document's Discovery section, and docs-knowledge-graph F20's anchor follows it — the brainstorm schema now has a Discovery section for exactly that — costs one test anchor if the old slot was wanted
F5: complete (commits 157a036..91cbed0, build.js clean, L1.5 green, docs-knowledge-graph 42/42, delivery-index + knowledge-discovery + close-out-parity suites green)
F6: complete (commits 91cbed0..b28be8e, build.js clean, L1.9 green, every suite naming add.new green)
F7: Ruling: the plan preview is its own confirming stop at STEP 9.0 — add.plan had no user stop before writing the plan for the preview to sit inside — costs one extra wait on confirm mode
F7: Ruling: dispatch written as **DISPATCH AGENT: @consistency-agent** — injection-exclusivity bans the "**DISPATCH AGENT:**" spelling in add.plan — costs nothing
F7: Ruling: dropped add-ecosystem from add.plan's uses — its only mention was the next-command lookup that named add.plan-to-ready, and build.js flagged the phantom edge — costs a missing edge if add-ecosystem was loaded elsewhere unnamed
F7: Ruling: build-artefact-graph snapshot, graph-mermaid and inventory L2.4 go red from F1's new skill node; they are fixed with the regenerated artefacts in F12/F13, not per block — costs three red tests between F1 and F13
F7: complete (commits b28be8e..7db2f5e, build.js clean, every suite naming add.plan green except the three F12/F13 regenerations)
F8: Ruling: the Checkpoint Sequence no longer pushes — the tag stays local and STEP 17 pushes branch and checkpoint tags together — a push mid-delivery would publish before the one publish question the user answers — costs a fresh-clone resume until the branch is published
F8: Ruling: on automatic, STEP 16.4 does not flip the epic row; the Checkpoint Sequence flips it after the loop — flipping at build end moves status.sh's EPIC_CURRENT_SF while the subfeature is still under review — costs nothing on confirm, where 16.4 is unchanged
F8: Ruling: add.review closes a delivery unit by following /add.build --loop-end [SFxx], a new pre-check at STEP 5.2 — the chain needs a way into the checkpoint without re-entering implementation — costs a new argument users can also type
F8: Ruling: a subfeature whose scoped gates are not 5/5 after the loop gets no tag and goes to the publish question with the failing gates printed, the epic does not advance — plan-to-ready halted the same way — costs an epic stopping on an unfixed finding
F8: Ruling: dropped add-ecosystem from add.build's uses — its only mention was the next-command lookup, replaced by an explicit table — costs a missing edge if it was loaded unnamed
F8: complete (commits 7db2f5e..07a186d, build.js clean, L1.7 L1.8 green, every suite naming add.build green except the F12 snapshot)
F9: Ruling: with no Delivery unit line in the ledger, add.review hands nothing on and stops as on confirm — a guessed baseline could run a third round — costs one manual step on a broken ledger
F9: Ruling: manual routes (data-seed, env-boot, citation-missing) count as no agent-routed row — the loop cannot fix them — costs a round-1 exit straight to the loop end
F9: complete (commits 07a186d..d9eca7b, build.js clean, L1.10 green, every suite naming add.review green except F12/F13 regenerations)
F10: complete (commits d9eca7b..f91eb6d, build.js clean, L1.6 L1.12 green, injection-exclusivity and every fragment suite green; no user stop found in the plan/review or plugin fragments)
F11: Ruling: the reference sweep was delegated to a read-write subagent with the file list and the re-pointing rule; the coordinator verified build, grep and L1 before committing — costs a reviewer-visible wording choice made by the subagent
F11: complete (commits f91eb6d..d32a7b3, build.js clean 0 warnings, zero plan-to-ready hits in framwork/.codeadd and cli/src, L1 13/13)
F12: Ruling: inventory.test.js keeps its add.plan-to-ready sort-order case — it runs on a synthetic fixture list, not on the tree, and still passes — costs a stale-looking name in a fixture
F12: Ruling: test updates for the four behaviour suites were delegated to a read-write subagent; the coordinator checked the report — costs a wording choice in test comments
F12: complete (commits d32a7b3..771a1fd, 6 edited suites 361/361, build-artefact-graph + mcp-server 85/85)
F13: Ruling: web/public/artefact-graph.mmd is regenerated here although the plan left diagrams to sync — graph-mermaid.test.js requires it current and it is generated, not drawn — costs nothing
F13: complete (commits 771a1fd..a8c860c, build.js clean, lane check empty, inventory + graph-mermaid + run-bats 62/62)
L3: walk 1 simple feature, round 1 clean — brainstorm(approval deciding) → new(STEP 4 confirming passes) → plan(9.0 confirming passes, STEP 12 verdict) → build(1.0.1 baseline) → [found: STEP 17 publish would run before the first review] → fixed → review 11.5 round 1 clean → build --loop-end → STEP 17 deciding. Ends at the PR question, no other wait
L3: walk 2 round 1 routed findings → build CORRECTION (5.2) → STEP 17 skipped → review round 2 → build --loop-end → STEP 17 prints the open Fix Routing rows. No third review: 11.5 forbids following build without --loop-end on round 2
L3: walk 3 epic automatic, two SFs — new writes epic Notes delivery: automatic; plan SF01 (12.3 skipped, no done sibling); build SF01 (16.4 skipped); review; loop-end SF01 → Checkpoint Sequence (gates 5/5, row+cell, tag, no push) → follow plan → SF02 (12.3 FULL vs SF01) → build SF02 (own baseline line) → review → loop-end SF02 → DELTA → checkpoint → GATE_EPIC=ok → STEP 17 once
L3: walk 4 epic semi-automatic — loop-end SF01 after checkpoint stops (deciding) showing SF01 delivered and SF02 next
L3: walk 5 no delivery anywhere — every carrier reads confirm; each confirming stop waits. [found: on confirm, 16.4 flips the last row so --loop-end on the last SF hit STEP 3's "all complete" stop] → fixed with the --loop-end SFxx exception
L3: walk 6 qa-pipeline + tdd-pipeline, round 1 with routable QA rows and an env-boot row — qa fragment step 2 prints rows and continues (confirming); env-boot row presented as a user decision (deciding) and waits
L3: walk 7 review-003 from a manual run — build writes "Delivery unit: FEATURE — review baseline 003"; review-004 is round 1, review-005 round 2
F8: Ruling: two chain gaps found by the L3 walk fixed as a second F8 commit — both are add.build text the F8 block owned — costs nothing
F8: complete (commits a8c860c..642f2a0, build.js clean, L3 walks 1 and 5 re-walked green)
L2: full cli suite 1481 passed, 5 failed in graph-mcp, impact-question-touched-by, mcp-server; the three files re-run alone 70/70 — the known local instability (the suite rewrites sidecars while it runs); CI is the verdict
L2: bats suite not run locally (~75 min); no script logic changed, only two comments — CI is the verdict
REVIEW: Ruling: scope 4 dispatches @prompt-review-agent on the six artefacts whose behaviour changed (add-delivery-mode, add.brainstorm, add.new, add.plan, add.build, add.review); the fifteen reference-sweep files are covered by the side-effects auditor — one dispatch per .md in the diff would be 26 agents for mostly one-line re-pointings — costs a ruler item missed in a swept file
GRAPH: add-delivery-mode — add.brainstorm, add.new, add.plan, add.build, add.review, qa-pipeline/add.build, tdd-pipeline/add.build (all named in the plan); no entry
GRAPH: add.build — direct dependants beyond the plan: add.qa-setup, add-qa, add-qa-migration, add-id-convention; checked by the side-effects auditor, none cites a moved STEP; no entry
GRAPH: add.plan, add.review, add.new, add.brainstorm — direct dependants beyond the plan: add-architecture-discovery, add-code-review; none cites a moved STEP; no gone or superseded entry
GRAPH: add-doc-schemas — 21 direct dependants; the schema changes are additive sections read by add.new, add.plan and the reviewer; no entry
GRAPH: add.plan-to-ready — removed; history reports no delivery entry, so nothing superseded is left pointing at it
F7: Ruling: accepted — the plan preview renamed 9.0.1, qa-pipeline injects its own 9.0 at the same spot — costs nothing
F7: Ruling: accepted — readback list renumbered 1-2 under 12.4 — costs nothing
F2: Ruling: accepted — the legacy-table paragraph no longer names 16.4 as the checkpoint writer — costs nothing
F6: Ruling: accepted — a subfeature about.md is written through add-feature-specification, the single writer — costs nothing
F8: Ruling: accepted — the DELTA dispatch sends the subfeature documents and what changed since the last verdict, per consistency-agent's contract — costs nothing
F1: Ruling: rejected — add-delivery-mode's Rules bullets flagged as filler; the Rules section is part of the mandatory form every product skill and command carries, and each bullet is the one-line index of a rule stated above — costs a few duplicated lines if the reviewer is right
F7: Ruling: rejected as out of scope — add.plan's Execution Rules table, the readback target/scope shape and the missing feature-plan section instructions all predate this delivery — costs three known defects left for a later plan
F6: Ruling: rejected as out of scope — add.new's uses: declares command /add.wiki where mention fits; predates this delivery — costs one over-counted edge
F8: Ruling: rejected as out of scope — add.build's log-jsonl.sh edge, missing Rules section, Task-tool wording, validator file-discovery source, roster/report field mismatches and the qa-fix marker placement all predate this delivery — costs seven known defects left for a later plan
F9: Ruling: rejected as out of scope — add.review's "Summary of Rules" heading predates this delivery — costs a cosmetic heading
F13: Ruling: rejected — docs.astro's hand-maintained graph lacks add-delivery-mode, as it lacks other skills; add-framework--sync regenerates it — costs a missing node until the next sync
REVIEW: complete (22 findings, 5 applied, 17 rejected)
F8: complete (commits 642f2a0..d12753a, review fixes, build.js clean, 193/193 across the parity, injection, close-out, reachability and docs-graph suites)
Publish: pr-opened https://github.com/brabos-ai/code-addiction/pull/72

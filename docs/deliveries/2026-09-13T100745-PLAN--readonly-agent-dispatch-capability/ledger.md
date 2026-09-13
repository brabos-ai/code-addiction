# Build ledger — plan: docs/plans/2026-09-13T100745-PLAN--readonly-agent-dispatch-capability.md

RED baseline, measured on the pre-F1 tree (commit a0c4713), before any edit:
- L2.1 gate: 2 hits — `framwork/.codeadd/commands/add.plan.md:607` (@architecture-agent), `:141` (@discovery-agent)
- L1.1 build: 3 read-only agents built with no `disallowedTools` — architecture-agent, discovery-agent, reviewer-agent
- L1.4 graph: 0 of 30 agent nodes carry a `readonly` field
- `ADD_GRAPH_WARNINGS=1 node scripts/build.js`: exit 0, zero warnings — this is the warning baseline

READBACK: complete (5 gaps marked, 4 ruled below, 1 confirmed as already correct)

Ruling: the returned report has no marker contract — the agent returns the complete document in its report and the step writes it verbatim — the plan left the shape open and the reader flagged it; the coordinator is a model reading a report, not a parser, so a delimiter would be ceremony — costs a rewrite of the three dispatch blocks if a future machine consumer needs to extract the document
Ruling: each corrected dispatch site states the writer in its own wording rather than repeating `the coordinator writes the file` verbatim — F1's Produces names the concept, L3.1 asks each step to state it "in words", and F4 in the plan itself already uses different phrasing — costs a grep-based conformance check if one is ever written against the literal string
Ruling: the removed `Output:` line becomes `**Returns:**` carrying what comes back, rather than being deleted outright — the reader is right that what the agent hands back is information a human wants, and `Returns:` cannot trip the F8 gate, which keys on `Output:` followed by a backticked `.md` — costs nothing; a later gate widened to any label would need this line read again
Ruling: F8's 8-line dispatch window counts every physical line, with no special case for a blank line or an HTML comment — that is the shape the RED baseline above was measured with, scoring exactly the 2 real defects and no false positive — costs a missed detection if a future dispatch block pads its `Output:` past line 8
Ruling: STEP 10.4 and STEP 3 stop and report when the agent's report carries no document, instead of writing an empty file — the plan scopes the writer but not the empty case, and writing an empty `tasks.md` is the same silent-failure class this plan exists to close — costs one extra sentence per dispatch block if judged out of scope

F1: complete (commits a0c4713..c4322db, build.js exit 0 / 0 warnings, gate hits 2->1)
F2: complete (commits c4322db..29de95e, build.js exit 0 / 0 warnings, gate hits 1->0 — both RED defects closed)
F3: complete (commits 29de95e..38a7adb, build.js exit 0 / 0 warnings, no `Quality Gates` left, headings match the canonical structure)
F4: complete (commits 38a7adb..55f31d7, build.js exit 0 / 0 warnings, L3.1 satisfied at all three sites)
Ruling: F5 named @architecture-agent in prose and the build failed on the undeclared-reference gate — declared it as `mention:`, not `agent:`, because the skill points AWAY from it (it names the agent to say it cannot write) and the dispatch lives in add.plan — costs a wrong edge type in the graph if a future reader expects the skill to dispatch it
F5: complete (commits 55f31d7..57e8c9f, build.js exit 0 / 0 warnings after the mention: fix, MENTIONS edge asserted present)
F7: complete (commits 57e8c9f..36685bb, build.js exit 0 / 0 warnings, L1.4 30/30 nodes carry readonly (RED 0), L1.5 spot check passes, framwork/ clean, 214 tests pass in build+build-artefact-graph+mcp-engine)
F6: complete (commits 36685bb..c093e3f, build.js exit 0 / 0 warnings, L1.1 all present (RED 3 missing), L1.2 wider denials survive verbatim, L1.3 non-readonly agents unchanged, opencode+cursor dialects unchanged, 214 tests pass)
Ruling: F8's tree-level dispatch scan asserts at least one agent node is marked read-only before scanning — without the guard it passed vacuously against the pre-F7 tree, where no node carried the field, so it would have gone green while checking nothing — costs one extra assertion if the field is ever made mandatory elsewhere
F8: complete (commits c093e3f..35e8506, RED confirmed at a0c4713 in a throwaway worktree — 3 tree assertions fail there naming architecture/discovery/reviewer; GREEN here: 9/9 in the new file, full cli suite 1338 passed / 1 skipped / 0 failed serially, build.js exit 0 / 0 warnings)

--- STEP 7 review: 5 auditors (plan conformance, diff completeness, side effects, ruler on add.plan, ruler on add-tasks-checklist) ---

Ruling: REJECTED the ruler finding that add-tasks-checklist must declare add.build and add.review — nodeMentionRe requires the slash form for a command node, so bare `add.build` in prose is not a mention by the gate's own definition; I added both as `mention:` and the build emitted two NEW warnings ("acknowledges X with mention: but its prose no longer names it"), against a baseline of zero, then reverted — costs nothing now; if the gate is ever changed to match the bare form, both entries become required
Ruling: ACCEPTED and fixed as F9 — add-feature-discovery Phase 1.5 ordered a write to an agent that declares readonly: true and loads that skill from its own frontmatter; four of five auditors found it independently — the original sweep read dispatch sites (command -> agent) and not instructions inside a skill reaching the agent over USES_SKILL, so the plan's risk table claim was too strong — costs the reported bug staying half-open if wrong
Ruling: ACCEPTED and fixed as F10, F11, F12 — the template's ## TASK still ordered a file, the precedence test covered one denial shape twice and the Glob shape not at all, the failure message was asserted by substring, and the gate's header comment overstated its reach — costs nothing; all four are corrections to work this delivery wrote
Ruling: OUT OF SCOPE, reported — add.new.md:98-102 carries the same `Output: past-features.md` shape, but its dispatch names no @agent, so it resolves to a generic read-write subagent and nothing is broken by this delivery; changing it means deciding whether that dispatch should become @discovery-agent, which the plan never decided — costs a second instance of the pattern staying on disk
Ruling: OUT OF SCOPE, reported — seven of eight internal agents are documented read-only but do not declare readonly: true, so the new graph field reads false for them and the gate is blind to the internal layer; the plan explicitly excluded internal agents because .claude/agents/ passes through no dialect — costs a wrong-looking field on those nodes until internal agents declare capability
Ruling: OUT OF SCOPE, reported — `readonly` is on the node but neither graph.js nor mcp/ projects it, so the Proposal's "becomes queryable" is not met even though F7's stated Produces is; adding it to one interface alone would break the assert-identical test between them — costs a follow-up to surface the field in both interfaces at once
Ruling: ACCEPTED as a stated limit, not fixed — L4 behavioural acceptance has no coverage: no /add.plan run reaching STEP 3 or 10.4 was executed here, so the delivery is proven at source and build level and unproven at run level; F9 is the concrete evidence that this gap costs something — costs an undetected runtime break until someone runs /add.plan on a real feature
Ruling: ACCEPTED and fixed as F13+F14, on the user's explicit decision at the STEP 7.3 stop — @reviewer-agent is add.build's per-area validator and was ordered to write tasks.md and to apply code fixes, so F6's denial turned a prose decline into a commit deadlock (SPEC_STATUS permanently INCOMPLETE, 11.3 gate 2 refusing); the user chose to standardise rather than drop F6, so add.build now runs the contract /add.plan-to-ready already ran — validator reports, dispatching command merges and writes, @fix-agent corrects — costs a behaviour change in add.build STEP 11 that no L-level here exercises at runtime
F9: complete (commit 4117851, build.js exit 0 / 0 warnings, skill sweep 2->0 write orders)
F10: complete (commit 62a06b5, build.js exit 0 / 0 warnings)
F11: complete (commit 720b929, 9/9 in the gate file, all three denial shapes asserted)
F12: complete (commit 474feea, 9/9, gate scope comment now matches what it checks)
F13: complete (commit ed1cfac, build.js exit 0 / 0 warnings, no write order left for the validator)
F14: complete (commit c3effd8, build.js exit 0 / 0 warnings, skill sweep 0 write orders, single tick contract)
REVIEW: complete (23 findings, 12 applied, 11 rejected or ruled out of scope)
Ruling: ACCEPTED a user finding after REVIEW closed and fixed as F15 — four passages this delivery wrote informed without instructing; the test applied was "does this change what the executor does", and scope statements (which commands a section covers, Phase 2 being a separate read-write dispatch) were kept because they do — costs nothing; the mechanism they explained is in the changelog and the commit messages, which is where a maintainer reads it
F15: complete (commit f4814f0, build.js exit 0 / 0 warnings, full cli suite 1338 passed / 1 skipped / 0 failed)

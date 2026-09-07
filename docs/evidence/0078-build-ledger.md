# Build ledger — plan set: docs/plans/0078-PLAN--superpowers-adoption-000-umbrella.md

Branch: feat/superpowers-adoption (from main @ c060fad)

## Preflight

Baseline: `node scripts/build.js` green — 202 nodes, 665 edges, 0 warnings. Saved to `0078-baseline-build.txt`.

Shared-file scan (umbrella L1.4): 5 files, 2 editors each, order correct. No third claimant. CLEAN.

Cross-topic fact ownership (umbrella L1.3): add-planning -> PLAN--001; CLAUDE.md ownership -> SELF-PLAN--002;
plan-to-ready:390 -> PLAN--002. All three owned. CLEAN.

CONFLICT 1 — artefact graph contradicts PLAN--001 F6/F7 and L1.2.
  Found: 4 `<!-- uses: --> mention: add-planning` declarations, not 3 prose refs.
  Sites: add-code-review:17, add-ecosystem, add-feature-specification:10, add-tasks-checklist:11.
  Severity: a `declared` edge to a missing node is a FAILURE in checkArtefactGraph, not a warning.
  Ruling: F7 grows to cover 4 declaration lines + the prose refs; L1.2 is rewritten from "warns" to
  "fails". Costs nothing if wrong; costs a red build on the F6 commit if left.

## Execution

CONFLICT 2 — the node-inventory snapshot test is not named by any plan.
  cli/tests/build-artefact-graph.test.js:850 hardcodes 202 nodes / 45 skills / 97 declaring.
  Deleting a skill moves all three. The test's own comment provides for it ("a deleted skill...
  update the numbers here and say so in the commit"), but PLAN--001 never named the file.
  Ruling: coordinator updates the three numbers in the same commit as F6 and says so in the
  message. Costs a red CI on the F6 commit if left. Mermaid diagram checked: unaffected
  (profile is kinds:[command], and a skill was deleted).

NOTE — bin-entrypoint.integration.test.js fails locally on "Debugger listening", from the
  VS Code js-debug bootloader in NODE_OPTIONS. Environmental, not code. All later runs clear it.

T1 PLAN--001 (product): complete (commits c060fad..b436e2d, build green 41 skills / 201 nodes,
  4 affected test files green, L1.2 gate captured RED then GREEN)

CONFLICT 3 — PLAN--002 T1 names three new scripts and their contracts (L2) but never says the
  proof is a .bats file. The repo runs `npm run test:scripts` as a CI job over
  framwork/.codeadd/scripts/tests/*.bats, and converge-gates.bats documents an explicit
  RED-FIRST convention ("the script under test does not exist yet — that failure IS the point").
  Ruling: T1 ships build-ledger.bats, task-brief.bats and review-package.bats, written RED
  before the scripts. Costs a CI job with no coverage for three new scripts if left.

NON-ISSUE (raised by agent 1, checked and dismissed) — "a user upgrading keeps the stale
  add-planning skill". False. cli/src/installer.js:296-313 prunes by manifest diff, which covers
  skills; and release.yml builds on a fresh checkout, so local stale build dirs never ship.
  What is real but harmless: pruneStaleOutputs in build.js covers commands+agents, not skills,
  so a LOCAL dev tree keeps stale skill dirs until cleaned. Gitignored, never packaged.
  Ruling: out of scope, recorded as follow-up. Costs nothing.

CONFLICT 4 — every line citation in the 0078 set was computed against the PRE-#33 tree.
  The artefact-graph merge (c060fad) added `<!-- uses: -->` blocks and shifted everything.
  Measured drift: add.build.md GIT CLEAN 54->82; checkpoint note 631-645->661-675;
  add.done.md claim 385->400; add.plan-to-ready.md signal 390->428, tag 414->446,
  staging block 361-372->399-410; new-feature.md feature-plan 120->115.
  Ruling: rewrote all seven citations across the 7 plans and 4 design docs by sed. Line numbers
  stay advisory — every F-block also carries the anchor text, which is what an agent greps.
  Internal-layer citations (add-framework--build.md:384, --plan.md:395) are NOT corrected here:
  agent 2 is editing those files now, so they will shift again. They get verified by anchor
  text at SELF-PLAN--002 time. Costs an agent editing the wrong line if left.

CONFLICT 5 — SELF-PLAN--001 item 8 overreached. It listed --release and --sync as commands
  taking a plan/brainstorm argument. Neither does: --release:179 is a naming-agnostic directory
  scan, --sync:191 is a prose citation of docs/plans/0022-PLAN--ecosystem-master-map.md (a real
  file keeping its name). Agent 2 declined to invent an argument and left both untouched.
  Ruling: agent 2 is right, plan item 8 is wrong. Verified both sites myself. Costs two
  commands gaining a resolver for an argument they never receive.
  Agent 2 also extended resolution to --shared-brainstorm STEP 1.0's ref: argument, which
  item 8 omitted but the design doc's "wherever a command takes a brainstorm path" covers.
  Ruling: accepted.

T2 SELF-PLAN--001 S1+S2 (canonical): complete (commits b436e2d..38f5349, 8 files,
  .opencode untouched, 11 legacy-form survivors all read-side, plan.md:395 claim left for 002)

T3 SELF-PLAN--001 S3 (adapters): complete (commits 38f5349..8957a17, 7 files, divergence baseline unchanged)

=== TOPIC 001 COMPLETE ===
CI GREEN on topic 001 (PR #34, draft): 6/6 checks pass — Analyze x2, CodeQL, test-cli 20, test-cli 22, test-scripts.
  Local bats slowness is a Windows/npx artefact, not a failure. CI is the authority.

CONFLICT 6 — PLAN--002 L1.1 said the scripts "appear in every providers scripts/ output".
  No provider has one. SHIPPED_SUBDIRS is not a copy list (only read by the lint gate,
  build.js:1327); scripts ship once, zipped from .codeadd/scripts by release.yml:102.
  Ruling: L1.1 rewritten to assert three new script nodes in the graph. Wording defect only.

Ruling: accepted agent 4 exit-1-on-write-failure deviation. "Exit 0 always" governs probe
  results, not IO failure. A ledger line that silently fails to land is the one case where
  exit 0 lies. Costs a caller treating a full disk as success if wrong.

T4 PLAN--002 T1 (scripts): complete (commits 8957a17..a8e7f98, 52 bats green, graph 201->204 nodes,
  edges unchanged, RED captured before the scripts existed)

CONFLICT 7 — the node-inventory snapshot went red a SECOND time (script 14->17, nodes
  201->204) when T1 added three scripts. Same root cause as CONFLICT 2: no plan names the file.
  Ruling: added a STANDING RULE to the umbrella plan binding every F-block that adds or deletes
  any artefact to update the snapshot in the same commit. Costs a red CI per artefact change.

FOLLOW-UP (out of scope, reported not fixed) — add-architecture-discovery/SKILL.md:41 tells the
  user to run .codeadd/scripts/architecture-discover.sh, which does not exist. It escapes the
  graph gate because a missing file is not a node. Agent 5 removed the same pointer from the
  SDD skill (which it owned) and reported this one. No plan in the set touches that skill.
  Ruling: leave it. Costs a user one failed command. Fixing an unrelated skill mid-set is the
  scope creep the plans exist to prevent.

T5 PLAN--002 T2+T3 (skill + agent): complete (commits 3848066..79050c3, nodes 204 unchanged,
  edges 663->669, all 6 MUST-NOT-LOSE items verified surviving, MODE: task byte-unchanged)

CI GREEN after T5 (6/6).

Anchors verified by text for SELF-PLAN--002 (line numbers moved again after T2):
  wrong claim        add-framework--plan.md:429 "reaches neither CLAUDE.md nor .claude/"
  what build does    add-framework--build.md:390 (6.3 counts) and :435 (6.4 the rest)
  per-item stall     add-framework--self-build.md:154 "Wait for checkpoint approval before next item"
  must survive       "Design [STOP]" appears exactly once in each builder

FINAL-REVIEW TODO 1 — add-subagent-driven-development/SKILL.md:332 and :373 invoke
  `review-package.sh BASE HEAD` without the `bash .codeadd/scripts/` prefix that lines 127/208
  and the reference block use. An agent reading only line 332 would run a name that is not on
  PATH. Cosmetic-adjacent but it is an executable instruction. Fix in the coherence pass.

T6 PLAN--002 T4+T5 (command + consumers): complete (commits 79050c3..3ba7fe4, GIT CLEAN=0,
  3 ordered DO-NOT-COMMIT gates before 11.3, F15 tag signal in, guards preserved,
  graph 204 nodes / 677 edges, build green)

COHERENCE FIXES by coordinator on top of T6 (all three were defects in my own T5 output):
  1. SKILL.md REPORT FORMAT asked the implementer for COMMITS while line 275 gave the commit to
     the coordinator. Implementer now returns FILES and is told explicitly not to run git.
  2. Breaker did not distinguish a red build from a review finding. Agent 6 made that call itself
     and flagged it. Ruling: accepted and written into the skill.
  3. FINAL-REVIEW TODO 1 closed (review-package.sh prefix), plus 2 stale bats block-14.3 refs.

=== TOPIC 002 PRODUCT COMPLETE ===

CONFLICT 8 — web/public/artefact-graph.mmd went stale when T6 added `command: /add.plan-to-ready`
  to add.build uses block. Diagram profile is kinds:[command] depth:1, so command->command edges
  move it and nothing else does. My CONFLICT-7 standing rule only covered artefact counts, so it
  did not catch this. Ruling: broadened the umbrella standing rule to name BOTH derived artefacts
  with the trigger that actually fires each. Costs a red CI per command-edge change.

T7 SELF-PLAN--002 (internal): complete (commits f715afc..13bffe8, 6 files +570/-39, Design [STOP]
  header unique in all 4, Rulings I made in both, ownership claim settled)
  Ruling: accepted agent 7 literal-path deviation. .claude/ is not built, so a {{skill:}} variable
  would ship raw. Verified both builders already use literal paths for building-commands.
  Coordinator fix: OpenCode --plan adapter cited STEP 6.3/6.4 of an adapter that has neither.
  Dropped the citation, kept the substance. Pre-existing adapter divergence, flagged not fixed.

=== TOPIC 002 COMPLETE ===

T8 PLAN--003 (product): complete (commits 13bffe8..26a746b, add.brainstorm 223->304 lines).
  Preservation verified INDEPENDENTLY by the coordinator, not taken on report: STEPS 3-6 and the
  25-line HARD GATE block both diff clean against b436e2d. Agent put all routing upstream so
  byte equality was possible — better than the plan asked for.
  L4 (four dogfood transcripts) NOT run: manual behavioural acceptance, nothing in the tree proves it.

COHERENCE PASS (coordinator, while T9 ran):
  - CLAUDE.md skills 42->41, three executor scripts added to Pipeline, plan set 0078 force-add
    justification written into the docs/ tracking policy (commit 8730b35)
  - add-ecosystem scripts table was missing all three new scripts. Added. Naming them in prose
    without a uses: declaration FAILED the build — the undeclared-reference gate is a hard
    failure, not a warning. Declared as mention:, matching converge-gates.sh (commit b85a99b)
  - diagram re-checked after T7 added skill: add-commit edges: still current. Confirms the
    CONFLICT-8 rule is precise — only command->command edges move it (677->679->682 all safe)
  - cross-layer vocabulary verified: Ruling:, build ledger, hard stops and the complete-line
    resume rule all present in BOTH the product skill and the internal builders

T9 SELF-PLAN--003 (internal): complete (commits b85a99b..e00939b, 2 files +212/-16).
  Preservation verified independently: STEPS 5-8 byte-identical, 215 lines each. My first check
  reported a false difference because the awk range ran to EOF and swept in the new Credits
  block and the Rules additions, both legitimately outside the preserved region.

=== ALL SIX PLANS IMPLEMENTED ===

FINAL REVIEW (adversarial, fresh context, whole-branch package from our own review-package.sh):
  9 real findings, 2 Critical. All addressed in d2e348e except one, ruled below.
  C1 skill/command disagreed on review-before-vs-after-commit. Command was right; skill reordered.
  C2 parallel-area commit contract could not execute (one BASE + git add -A). Per-batch anchor + stage by path.
  I1 review-package.sh called with 2 args, needs 3. My own earlier fix touched those exact lines.
  I2 all three SELF-PLAN changelogs cited the product twin commits (my python substring-key bug).
  I3 OpenCode --plan adapter claimed a CLAUDE.md sync its own --build adapter does not have.
  I4 ecosystem map misrouted 2 of 3 new scripts (my own addition).
  I5 *-PLAN--*.md glob also matches *-SELF-PLAN--*.md, so every paired set was ambiguous.
  Ruling: add.brainstorm STEP 1.5 fractional numbering NOT fixed. Real (banned at --build.md:650),
    but add.wiki.md:204 already carries STEP 2.5, and renumbering costs 36 reference updates for no
    behavioural gain. Costs one cosmetic inconsistency; fixing it risks a broken pointer.
  Reviewer confirmed correct: all 3 cross-topic facts owned, all 5 shared-file rows carry BOTH edits,
    add-planning fully gone, F17 sweep complete, MODE: task byte-unchanged, both preservation claims,
    counts agree across disk/registry/CLAUDE.md/snapshot, both layers agree on Ruling shape and hard stops.


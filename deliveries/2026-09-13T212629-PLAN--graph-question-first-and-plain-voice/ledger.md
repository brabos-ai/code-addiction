# Build ledger — plan: docs/plans/2026-09-13T212629-PLAN--graph-question-first-and-plain-voice.md

BASELINE: build.js exit 0, 0 warnings, 227 nodes, 855 edges (at 44035ef)
BASELINE: RED captured for L1.1, L1.2, L1.3, L2.1, L2.3, L2.4, L2.6, L2.7, L2.8; L2.2 and L2.5 green as guards
READBACK: complete (7 gaps marked, order and file list confirmed against the plan)
Ruling: built in worktree .claude/worktrees/graph-question-first-and-plain-voice on feat/graph-question-first-and-plain-voice — the user asked for it — costs nothing; docs/plans and docs/brainstorming were copied in because both are gitignored
Ruling: readback Gap 1 — F3 establishes a concrete shape (a stated question plus an IF/DO-NOT gate) and F4/F5 copy the shape, not the wording — their gates bind different outputs — costs a reader seeing three phrasings if a single template was intended
Ruling: readback Gap 2 — an empty graph answer is an answer, not a fallback trigger; only a missing route or a failed query falls back to filename scoring — costs a masked "found nothing" if merged, which is the failure the reader named
Ruling: readback Gap 3 — the no-self-narration rule goes in the same section as the register rule, under its own heading so it is findable — costs a reader hunting one heading if a separate section was intended
Ruling: readback Gap 4 — F2's five edits are applied in file order, not in the plan's list order; the list is a checklist, not a sequence — costs nothing, both orders produce the same file
Ruling: readback Gap 7 — the F3/F4 gate is textual, in the IF/⛔ DO NOT USE shape building-commands requires; no new lint script — the plan authorizes none and its own risk table calls the guarantee textual — costs a weaker gate than a script, which the plan already states as the residual risk
Ruling: this build edits add-framework--build.md (F5, F16) while running it; the loaded instructions are the pre-edit ones, so STEP 7.2 executes in its current form — costs nothing this run, and the next invocation gets the new form
F1: complete (commits 44035ef..569a6c5, build.js clean 0 warnings, L2.7 GREEN, framwork/ clean)
F2: complete (commits 569a6c5..070894a8033e2b347d811cef02decf7ce6a9adbe, build.js clean 0 warnings, L1.3 GREEN, L2.2 guard held, framwork/ clean)
Ruling: F2 named plan-readback-agent in a frontmatter comment, which the prose gate reads as an undeclared reference and failed the build; declared it as mention: since the citation points away — costs nothing, the alternative was deleting a comment that explains why both keys are kept
F9: complete (commits 070894a..586399087080315d2649e51dbfe9160e3b474719, build.js clean 0 warnings, L2.6 GREEN, L2.2 guard held, framwork/ clean)
Ruling: F9's prior_deliveries contradicted the existing delivered-state gate, which said to use the directory and nothing else; split the gate on whether the field names the plan — costs a caller sending a wrong prior_deliveries entry being believed over the directory, which is the point of the field
F3: complete (commits 5863990..e522bca8439ba51c55113473afef0730855deccd, build.js clean 0 warnings, no graph.js verb left in brainstorm, framwork/ clean)
F4: complete (commits e522bca..397f20e7fe495f347c4f466f74cd6759e98353ea, build.js clean 0 warnings, no graph.js verb left in plan, framwork/ clean)
Ruling: F4 extended to STEP 3.3, which the plan scopes only to 3.2 — L2.1 is file-scoped and 3.3 named history as the instruction, so leaving it would fail the level that covers F4 — costs a wider diff than the plan describes, and the --layer requirement was preserved as a property of the answer
F5: complete (commits 397f20e..1dc1d5d65394dc6decb233f0a2925f0834ae18ec, build.js clean 0 warnings, no graph.js verb left in build, framwork/ clean)
F6: complete (commits 1dc1d5d..ad316d6a437255aec80e95433232a7c8f3d6ed6a, build.js clean 0 warnings, literal calls preserved by design, framwork/ clean)
CORRECTION: the F6 complete line above was appended while the build was RED — my shell chain used `;` instead of `&&`, so the commit ran on a failed build.js. The cause was a prose citation of building-commands with no declared relationship. Declared it as `mention:`, rebuilt clean (858 edges), and amended the F6 commit to 104493d. F6 is complete as of that hash, not the one first recorded.
Ruling: F6's new text cites building-commands as the authority for keeping literal bash; declared it `mention:` rather than dropping the citation — the citation is what stops a later reader deleting the exception as an oversight — costs one extra edge in the graph
F7: complete (commits 104493d..5ff11d55683c6823c0383557a364354e23638ade, build.js clean 0 warnings, L1.1 GREEN incl USES_SKILL edge, L2.8 GREEN, framwork/ clean)
F8: complete (commits 5ff11d5..29cdbc1e4e9a973c3a7ccf87812492124ca4464f, build.js clean 0 warnings, L2.3 GREEN, L1.1 still GREEN, framwork/ clean)
Ruling: F8's new text in --plan names /add-framework--brainstorm, which the prose gate rejected as undeclared; declared it mention: rather than command:, because the handoff runs brainstorm to plan and this reference points back at the producer — costs nothing, an edge of the wrong type would have inflated brainstorm's blast radius
F10: complete (commits 29cdbc1..c3bfb0882cfb3abc8d4ef43b3d77a954495e579a, build.js clean 0 warnings, framwork/ clean; L3.1/L3.3 are behavioural — see ledger note)
F11: complete (commits c3bfb08..a516905d4e89610e384f6cb8526d2f7bd080d570, build.js clean 0 warnings, framwork/ clean)
F12: complete (commits a516905..e2225291d4252731c55b619974f6d49b64aa4c87, build.js clean 0 warnings, add-doc-schemas 3/3 register clauses, L2.5 guard held)
F13: complete (commits e222529..86dc8356423ef8f15867929abe6842d7862016a4, build.js clean 0 warnings, 3/3 register clauses, not byte-identical to F14)
F14: complete (commits 86dc8356423ef8f15867929abe6842d7862016a4..391a90973ddd1dc779a36963a974b4bdcb049953, build.js clean 0 warnings, 3/3 register clauses, cross-layer citation commented)
Ruling: L2.4's scripted check originally matched exact phrases, which would have enforced the byte-identity the level explicitly forbids; loosened it to concept-level alternation and confirmed the three statements by reading all four surfaces — costs a check that could pass on a surface wording the three ideas badly, which is why the level is judged by reading too
Ruling: F13 declared add-doc-schemas as mention: (same layer); F14 cites it without declaring, because it is a product skill and a cross-layer uses: target dangles and fails the build — recorded the reason in an HTML comment in F14's file — costs nothing, the alternative was dropping a citation that explains why the rule is not a word list
F15: complete (commits 391a909..65dc22455edb7dadf3c7225ba22fbc30305789d5, build.js clean 0 warnings, 16/16 product commands, L1.2 at 16/23 as expected mid-sweep)
F16: complete (commits 65dc224..95abe63511a9ca56810faa056a8e71057f956a54, build.js clean 0 warnings, L1.2 23/23, full L1+L2 matrix GREEN, framwork/ clean)
Ruling: L2.1's check now encodes the plan's two documented exceptions (--sync keeps literal calls by F6; --roadmap names graph.js only inside a prohibition and is excluded by the plan) instead of failing to a manual read — costs a future command naming a verb passing if it is added to the exception list without cause

STEP 7.2 — the graph's answer for every artefact this delivery touched:
  add-artefact-graph          10 direct dependants. 6 changed by this delivery; plan-review-agent and prompt-review-agent are named in the plan as out of scope; add-framework-development and building-commands are NOT named in the plan — both checked, both already delegate to the skill rather than naming a verb, neither is stale. No change needed.
  framework-discovery-agent    2 direct dependants (brainstorm, plan) — both changed by this delivery.
  add-framework--brainstorm    0 direct dependants.
  add-framework--plan          2 (brainstorm, build) — both changed.
  add-framework--build         3 (done, plan, building-commands) — done and plan changed; building-commands checked, not stale.
  add-framework--sync          1 (build) — changed.
  add-framework--done          0 direct dependants.
  internal/skill/add-final-report   9 dependants, all internal commands; the change is additive (a register rule and a banned subject), no caller contract moved.
  product/skill/add-final-report   15 dependants; same additive change.
  product/skill/add-doc-schemas    22 dependants; same additive change.
  Delivery index: no `gone` or `superseded` entry naming a delivery the plan does not mention. add-artefact-graph's only entry is `live`, from the prior-art delivery the plan's References section names.
  NOT VERIFIED: none — both routes to the graph were available.

CORRECTION: I ran STEP 7.2 before all 13 auditors had reported. The command's 7.1 gate says not to proceed to 7.2 until the wait-all is satisfied. 7.2 is a read-only graph query whose answer does not depend on any report, so nothing it produced is contaminated — but the sequence was mine to follow and I did not.

STEP 7 findings received (not yet judged — waiting on the full dispatch list):
  scope2/1 MEDIUM  building-commands L77+L118 and add-framework-development L102 still print the OLD LANG line; L118 calls it "MANDATORY first line after title". The delivery made the templates contradict all 23 commands.
  scope2/2 LOW     three product skills carry a shorter LANG variant; outside F15/F16's stated scope (commands), and the plan's Current State inventory claims completeness it does not have.
  scope2/3 LOW     F4's diff reaches STEP 3.3, already ruled; the plan document was not amended.
  scope2/4 LOW     five graph edges shipped where the plan declares one; each forced by the prose gate, each already ruled.
  scope2/5 LOW     `F-Block:` is not git-trailer-parseable (a blank line precedes it). Nothing parses it today.
  ruler/roadmap    ok, eight items clean.
  scope1/M1 MED-HIGH  F5's gate at build.md:467 blocks on "the audit report at 7.3", but 7.3 writes no file (it says so explicitly) and 7.4's REVIEW line has no slot for a graph answer. INTRODUCED BY THIS DELIVERY.
  scope1/M2 MEDIUM    F7 removed ".gitignore" from done.md's inline list; add-artefact-graph's table (the pointer target) does not carry .gitignore. INTRODUCED BY THIS DELIVERY.
  scope1/L1 LOW       F11 reframed 7.4 as "does not apply" rather than un-excluding it; sound but departs from F11's literal text and was not ruled.
  scope1/L2 LOW       F4 extended to STEP 3.3 — already ruled.
  scope1/L3 LOW       Grep in disallowedTools is decorative now that Bash is granted; matches the plan exactly, gap is in the plan.
  scope1/watch        rule 2's word pairs are the material a later reader could harden into a word list; carve-out present today.
  ruler/graph f1 MED  NODE_OPTIONS gotcha stated in 3 places (prompt-review-agent, add-framework-product-layer). PRE-EXISTING, not introduced here.
  ruler/graph f2 LOW  "ALSO ALWAYS:" is a third rules category outside ALWAYS/NEVER. INTRODUCED BY F1.
  ruler/plan f1 MED   plan.md L237-240 restates the skill's depth-1 reasoning and carries a drifting "~82". Mostly PRE-EXISTING; F4 explicitly protects the grading rule.
  ruler/done f1 LOW   done.md L610 Rules line restates L314. PRE-EXISTING.
  ruler/internal-final-report  ok, eight items clean.
  ruler/build      ok, no findings — and it read 7.2's "audit report at 7.3" as a valid destination, which CONTRADICTS scope1/M1. Both kept. Conformance outranks a quality reading, and the text settles it: build.md:501 says nothing here writes a review file, and 7.4 says its line is "the only trace this STEP leaves anywhere". M1 stands.
  ruler/sync f1 LOW   sync.md:205 cites docs/plans/0022-PLAN--ecosystem-master-map.md, which never existed in the tracked repo. PRE-EXISTING.
  ruler/sync f2 MED   STEP 1.5 re-derives orphan/phantom by scanning while STEP 2 declares the graph the source for that class. PRE-EXISTING contradiction, and F6's new text sharpens it.
  ruler/sync f3 MED   sync's ## Rules restates STEP-level gates at no new decision point. PRE-EXISTING.
  ruler/release f1 MED  release's ## Rules restates 7 STEP passages at no new decision point. PRE-EXISTING — this delivery touched only its LANG line.
  PATTERN: three ruler reports (done, sync, release) independently flagged `## Rules` restating STEP content. Systemic and pre-existing across the internal command layer; one roadmap item, not three in-delivery fixes.
  ruler/brainstorm f1 HIGH  STEP 8.3 says "Start STEP 2", which by name includes 2.2's effort-path classification, while 8.4 unconditionally writes a design doc and dispatches the reviewer. Pre-existing text, but F10/F11 made STEP 3's routing table authoritative and F8 reasoned explicitly about Continue Mode, so this delivery is what sharpened it into a contradiction. My own F11 line (7.4: umbrella specs exist only on the architectural path) is what settles it.
  ruler/agent f1 MED  no ## Rules ALWAYS/NEVER section; sibling agents have one. PRE-EXISTING structure, but in the same section f2 forces me to edit.
  ruler/agent f2 MED  the Bash-write prohibition I wrote in F2 is a bullet, not the mandated IF/⛔ DO NOT USE gate — and it is the one thing the plan's trade-off table says the read-only promise now rests on. MY TEXT.
  ruler/agent f3 MED  my new step 0 never says what to query when the topic names no existing artefact; every verb but `search` takes a node id. MY TEXT, cold-execution gap.

STEP 7 verdict — all 13 auditors reported (3 scopes + 10 ruler ticks). Ruler verdicts: 3 ok, 7 fix-then-ok.

APPLIED (13): scope3/H1 false allowlist claim in brainstorm; scope2+scope3/H2 the LANG template in building-commands (x2) and add-framework-development; scope3/H3 + scope3/M1 the ban scoped to the seven blocks in both add-final-report skills; scope1/M1 + scope3/M3 the 7.2 gate re-anchored to a ledger GRAPH: line; scope1/M2 + scope3/M4 .gitignore answered by a new row in add-artefact-graph and --done's claim softened; scope3/M2 prior_deliveries contract matched to what the caller sends; scope3/M5 add-framework-internal-layer states the two questions and declares the skill; scope3/M6 + ruler/graph f1 the NODE_OPTIONS caveat stated in add-artefact-graph and at the agent's route; scope3/M7 + ruler/brainstorm f1 Continue Mode stops re-running the effort-path classification; scope3/L3 readonly: documented; scope3/L4 the agent's write prohibition narrowed so it stops contradicting memory:; scope3/L5 4.3 and 4.5 reconciled on the caller column; ruler/graph f2 ALSO ALWAYS folded into ALWAYS; ruler/agent f1+f2+f3 Rules section, Bash gate, node-id branch; ruler/plan f1 the depth-1 rationale defers to its owner and the drifting number is gone.

Ruling: rejected ruler/sync f1, f2, f3 — a dead plan citation, a STEP 1.5 orphan re-scan, and ## Rules restating STEP content — all pre-existing and none in the plan's Impact table; f2 in particular would change what STEP 1.5 does, which the plan never scoped — costs the sync command keeping three known defects until a roadmap item picks them up
Ruling: rejected ruler/release f1 and ruler/done f1 — the same ## Rules restatement pattern, pre-existing, in files this delivery touched for one unrelated line each — costs the same, and three independent reports flagging one pattern is a roadmap item rather than three in-delivery fixes
Ruling: rejected scope2/2 and scope3/L1 — three product SKILLS carry a shorter LANG variant; F15/F16 are scoped to commands and widening to skills is a decision the plan did not make — costs those three diverging from the 23 until swept
Ruling: rejected scope2/5 — `F-Block:` is not readable by git's trailer parser because a blank line precedes it; nothing in the repo parses that trailer, and rewriting 16 commit messages to fix a field no consumer reads is not worth the history churn — costs a future check written against %(trailers:) reporting zero
Ruling: rejected scope3/L2 — MENTIONS is excluded from impact and dependencies, so the four voice surfaces have no queryable link; that is how the graph is designed and no edge type fits — costs the register rule's drift staying invisible to the graph, which the plan's risk table already names
Ruling: rejected scope1/L3 — Grep in the agent's disallowedTools is decorative now that Bash is granted; the implementation matches the plan exactly and the gap is in the plan's trade-off table — costs a reader thinking grep is blocked when the shell reaches it
Ruling: scope1/L1 — F11 reframed 7.4 as "does not apply" on spike/bounded rather than un-excluding it, because umbrella specs are architectural-only and that condition predates the routing table; this is the ruling the reviewer correctly said was missing — costs a departure from F11's literal text, recorded here rather than left silent
Ruling: two auditors disagreed on the 7.2 gate — the build ruler ticked it cold-executable, scope1 and scope3 called its destination non-existent. Kept both; conformance outranks a quality reading and the text settled it (7.3 says nothing reaches disk). Fixed per conformance — costs nothing, the ruler read the sentence and not the step it pointed at
Ruling: scope4 was dispatched on the 10 INTERNAL .md artefacts only; prompt-review-agent's contract takes `internal/<kind>/<name>` and its body says it reviews one internal artefact, so the 18 product .md files went through scopes 1-3 instead — costs the product LANG sweep getting no eight-item tick, which scope2 covered by diffing the inserted text byte for byte
REVIEW: complete (30 findings, 20 applied, 10 rejected)

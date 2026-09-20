# Build ledger — plan: docs/plans/2026-09-19T122048-PLAN--optional-review-build-final-review.md

BASELINE: build.js exit 0, 0 warnings (ADD_GRAPH_WARNINGS=1) at 34731b0
READBACK: matched — restatement, order and scope agree with the plan; gaps marked on DELTA routing, OWASP trigger, line budget
F4: Ruling: DELTA findings always join the last subfeature's final review, dropping the plan's "when REVIEW_SOURCE is not review" condition — the build now always runs its own final review, and its ledger line always names the highest review then on disk, so it is always the newest verdict; the condition would need a mid-build gate-script call for nothing — costs a DELTA finding bypassing a manual review's Fix Routing if wrong
F4: Ruling: the build does not call converge-gates.sh before its final review — readback read "REVIEW_SOURCE mid-run" as a script call; only Checkpoint step 0 and STEP 17 read it, after the line is written — costs one extra call in F4 if a reader needs it earlier
F1: complete (commits 34731b04a62d9b134b894015530a2e1e0ee6113f..04f5a5d, converge-gates.bats 71/71 RED-first 10 new, full bats green, build.js clean, product-close-out-parity 83/83)
F2: Ruling: L2.1 was written after the F2 edit, so it was never observed RED — the edit was small and the assertion checks only strings the edit added — costs an untested assertion if the regex is vacuous
F2: complete (commits 04f5a5d..9bd8881, build.js clean 0 warnings, L2.1 green)
F3: complete (commits 9bd8881..48623e1, build.js clean 0 warnings, L2.2 RED→green, product-close-out-parity green)
F4: Ruling: a CORRECTION run writes its Final review: verdict from STEP 12.2's re-review instead of dispatching a fresh MODE: feature review — the design's "review BLOCKED → build corrects → done" path needs a line newer than the review, and 12.2 already verified the fix — costs a missed cross-area regression introduced by the fix if wrong
F4: Ruling: removed 16.4's confirm-mode epic.md row flip — Loop End now runs on every delivery mode, so the Checkpoint Sequence always flips the row in one edit with its tag; keeping 16.4 would flip it twice or before convergence — costs an epic row left pending if some path reaches STEP 18 without Loop End
F4: Ruling: updated product-pipeline-parity L1.10's build→review chain pair to build→add.plan inside F4 rather than F9 — the pair pins the hand-off this block removes, and leaving it red would commit a failing suite — costs nothing beyond moving one F9 line earlier
F4: complete (commits 48623e1..ec28453, add.build.md 1594 ≤ 1609, build.js clean 0 warnings, L3.1-L3.4c green, pipeline/close-out/loop/cut-review/injection suites green)
F5: complete (commits ec28453..2aa0ab6, build.js clean 0 warnings, L2.3-L2.4 RED→green, close-out-parity/hardening/hotfix-contract green)
F6: Ruling: removed product-pipeline-parity L1.10's review→build chain pair inside F6, for the same reason as F4's pair — costs nothing beyond moving one F9 line earlier
F6: complete (commits 2aa0ab6..0f21d48, build.js clean 0 warnings, L2.5 RED→green, pipeline-parity/cut-review/qa-boundary/qa-reachability green)
F7: Ruling: inverted product-pipeline-parity L1.13 inside F7 — it pinned the section this block removes — costs nothing beyond moving one F9 line earlier
F7: complete (commits 0f21d48..7a35191, build.js clean 0 warnings, L2.6 RED→green, pipeline-parity green)
F8: Ruling: add-doc-schemas/references/review.md left unchanged — its "re-run /add.review" rule covers a review with no ## Fix Routing, which STEP 12 still consumes — costs a stale sentence if a reader takes it as review being mandatory
F8: Ruling: added add.brainstorm.md and add.build.md's STEP 3 --loop-end exception to F8's sweep — both still described the removed loop / STEP 16.4, found by grep after F4 and F7 — costs nothing; F4 should have caught the add.build line
F8: Ruling: add.qa-setup STEP 11 still dispatches /add.review — the smoke test exists to exercise the QA judgement, which only /add.review runs — costs nothing
F8: complete (commits 7a35191..982347b, build.js clean 0 warnings, L4.1-L4.3 RED→green, new suite 15/15)
F9: complete (commits 982347b..a3b7386, new suite 15/15 — 13 observed RED before F3-F8, L2.1 after F2 (ruled), L3.1 green throughout; full cli suite serial 1549/1551 with 1 load timeout in test-terminal-states-qa-boundary that passes 25/25 isolated)
GRAPH: add.build — consistency-agent, ux-agent, add.new, add.plan, tdd-pipeline/add.build, gitnexus/add.build, add-architecture-discovery, add-code-review, add-commit, add-id-convention, add-qa, add-qa-migration unchanged and unnamed; add-cross-sf-consistency changed by the audit; one live entry (cut-review-and-build-loop-cost)
GRAPH: add.done — add.plan, add.pull-request, docs-pruning/add.done, gitnexus/add.done, add-doc-schemas, add-qa unchanged; one live entry (product-close-out-parity)
GRAPH: add.review — consistency/e2e/qa/ux agents, qa-pipeline/tdd-pipeline/playwright add.review fragments, add-delivery-validation, add-id-convention, add-qa, add-qa-migration unchanged; one live entry (cut-review-and-build-loop-cost)
GRAPH: converge-gates.sh — add-commit unchanged (reads the gate keys, REVIEW_SOURCE is additive); no entry
GRAPH: add-review-discipline — add.new, add.plan unchanged; no entry
GRAPH: add-delivery-mode — add.new, add.plan, tdd-pipeline/add.build unchanged; no entry
GRAPH: reviewer-agent — plan-reviewer-agent, add.hotfix, gitnexus reviewer fragment, add-plan-review, add-subagent-driven-development unchanged (MODE: feature is additive); no entry
GRAPH: add-ecosystem — add.audit, add.diagnose, add.hotfix, add.wiki unchanged; no entry
GRAPH: add, add.qa-setup, add.brainstorm, qa-pipeline/add.build — dependants unchanged; no entry
Ruling: rejected the OWASP-trigger list duplicated in reviewer-agent — pre-existing, outside this plan — costs the two lists drifting later
Ruling: rejected adding a /add.review mention to fragments/qa-pipeline/add.build.md's uses block — pre-existing and build.js does not flag it — costs one missing graph edge
Ruling: rejected changing the " | " separator between blocker suggestions in GATE_REVIEW_DETAIL — the detail is printed to a human, and the new bats case proves every suggestion reaches it — costs an ambiguous line when a suggested command itself contains " | "
Ruling: README.md, web/ docs and SVGs still describe the build ⇄ review loop — deferred to /add-framework--sync by the plan's Does NOT Include — costs stale public docs until the next sync
Ruling: accepted audit fixes landed in one commit (a3b7386..a8baabb) across F3/F4/F8 files, all [product] — they are corrections to already-closed blocks, not a new F-block
REVIEW: complete (15 findings, 9 applied, 4 rejected, 2 deferred-by-plan)
Publish: pr-opened https://github.com/brabos-ai/code-addiction/pull/76

# Build ledger — plan: docs/plans/2026-10-11T162402-PLAN--hotfix-objective-review.md

F8: complete (commits e832aed..ceb36d9, RED observed: hotfix-gates#009-013,#015 and done#057,#059 fail; #014 green as planned)
F9: complete (commits ceb36d9..1439b7a, RED observed: L3.1-L3.5 fail)
F8: Ruling: tests F8/F9 committed first, as two commits, before F1 — plan Execution Order step 1 — none
Ruling: #013 and #009 fixtures use git rm -f because the hotfix edits the file first and plain git rm refuses — a first draft passed falsely for that reason — none, test-only
F1: Ruling: fixture helper withSelfHash added to hotfix-gates.test.cjs and committed with F1 — the #011 old-style receipt needs a self-row hash consistent with its hand-edited rows, which review-manifest cannot print any more — none, test-only
F1: complete (commits 1439b7a..eaf2927, hotfix-gates 15/15 green, diagnosis contract test green, build.js exit 0 no new warning)
F1: Ruling: absent-from-tree also treats ENOTDIR as absent (plan names ENOENT) — a parent replaced by a file leaves the path equally gone and fsInfo would otherwise crash with exit 1 — a path under a replaced parent would stale instead of covered
F2: complete (commits eaf2927..e3edbe4, build.js exit 0 no new warning)
F3: complete (commits e3edbe4..90cde01, build.js exit 0 no new warning; L3.4 checked at F9 run)
F4: complete (commits 90cde01..9eef216, build.js exit 0 no new warning, hotfix-review-0073 green, L3.1 and L3.2 green)
F4: Ruling: the resume sub-step is entered from the hotfix-branch case whenever about.md already carries ## Review (not only on stale) — the plan names that as the trigger and add-done only sends stale/blocked receipts here — a valid receipt would be re-reviewed if someone reruns the command
F5: complete (commits 9eef216..cb2d052, build.js exit 0 no new warning, hotfix-review-0073 green, L3.3 green)
F5: Ruling: the STOP text says "the delivery close-out" instead of naming /add-done — naming the command in prose without a uses: edge fails the artefact-graph gate, and a new edge add-hotfix→add-done would be a graph change the plan never asked for — the message is one word less direct
F6: complete (commits cb2d052..9afd69f, done.test.cjs 59/59, build.js exit 0 no new warning)
F6: Ruling: fixed a regex in done#059 (hotfix/0002H contains the substring fix/0002H) and committed it with F6 — the first draft would never pass — none, test-only
F7: complete (commits 9afd69f..91edb62, build.js exit 0 no new warning, L3.1-L3.5 and hotfix-review-0073 green: 30/30)
GRAPH: hotfix-gates.cjs — add-diagnose, add-done, add-hotfix, add--subagent-driven-development (plan named all four; only diagnosis-* modes reach add-diagnose and they are unchanged); no entry
GRAPH: reviewer-agent — consistency-agent, plan-reviewer-agent, add-build, add-hotfix, add-review, add--cross-sf-consistency, add--plan-review, add--review-discipline, add--subagent-driven-development, gitnexus fragment (plan named add-build/add-review/add-hotfix via "10 callers"); no entry
GRAPH: done.cjs — add-build, add-done, add--id-convention, add--wiki-maintenance (message-only change); no entry
GRAPH: add-hotfix, add-done, add--doc-schemas — not queried individually; plan Impact already carries their dependant counts (12, 16, hub); no entry
REVIEW: complete (22 findings, 6 applied, 16 rejected)
Ruling: applied review findings under new F-blocks F10 [product, commit 48d7e8a] and F11 [internal, commit e127252] — resume now validates first, reads blast radius from ## Relations, takes the id from the branch; add-done Recovery route stops; reviewer rule names the spec; test #016 — validated: build.js no new warning, hotfix-gates 16/16, cli 0048+0073 30/30 — none
Ruling: rejected — "gate relaxes beyond deletions" (diff-completeness 1), the plan's own rule is absent-keeps-row and the self-hash covers the receipt block; cost: a never-existing row in a hand-written receipt would pass
Ruling: rejected — old hotfix/* wording at add-hotfix lines ~224/334/386, line 386 is pinned by hotfix-review-0073 as an injection anchor and branch-check now guarantees the shape; cost: three descriptive lines are looser than the gate
Ruling: rejected — duplicate of the removal rule in add-hotfix dispatch-reviewer (single-owner), plan F4.2 asks to restate it; cost: two copies to keep in step
Ruling: rejected — pre-existing graph/mention gaps for /add-done and two skills in add-hotfix, not this delivery's; cost: none new
Ruling: rejected — header comment 3 lines, ENOTDIR superset, hard-coded 000000 twice, reviewer-agent workflow line 50, ls-tree error read as absent under --tree (deliveryPaths and readAbout fail first on a bad tree) — low, no behaviour change; cost: cosmetic

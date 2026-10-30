# Build ledger — plan: docs/plans/2026-10-30T122030-PLAN--agent-mode-notion-simplify.md

Ruling: STEP 2 design stop treated as confirming — the invocation says "Approved by Maicon. Do not ask questions; decide by recommendation" — costs a redo of the affected F-block if the approval did not cover the plan as written
Ruling: readback matched the plan, no divergence — its 8 filled gaps (skill written in English, test names kept when rewritten in place, graph counts read from RED) are built as read — costs a rewrite of F4 text if a different language was meant
F1: complete (commits 138f8dd..776d906, RED seen on 4 tests, release-copy+updater isolated green, build.js clean, cli suite 99 files green)
F2: Ruling: regenerated web/public/ecosystem.json in F2 as well as F7 — the add-setup edge disappears from the graph here and graph-ecosystem.test.js fails otherwise — costs nothing, F7 regenerates again
F2: Ruling: the Test-Removed trailers sit on the RED commit, where the nine old F5 tests were replaced — the guard reads base..head, so any commit works — costs nothing
F2: complete (commits 776d906..a1a12d7, RED 4 tests seen, build.js clean, cli suite green, guard pass)
F3: complete (commits a1a12d7..7f3ad83, RED 2 tests seen, build.js clean, cli suite green, guard pass)
F4: Ruling: regenerated AGENTS.md and web/public/ecosystem.json in a second, internal-tagged commit of F4 — adding the skill changes both, inventory.test.js, run-tests.test.js and graph-ecosystem.test.js fail otherwise, and F7 only lands later — costs nothing, F7 regenerates again
F4: Ruling: build-artefact-graph.test.js moves +1 here (skill 61->62, nodes 194->195, declaring 138->139) and -2 in F6 — the plan puts only the net in F6 but the suite must be green at the F4 boundary — F6 numbers are derived from RED anyway
F4: Ruling: board-removed.test.js F8 now skips skills/add--agent-notion/SKILL.md and agent-mode/README.md — the plan requires both to name board.json and the test (not listed in the plan) banned it across every shipped file — costs a wider hole in that ban if the two paths grow unrelated board text
F4: complete (commits 7f3ad83..f46fb00, RED 5 tests seen, build.js clean, cli suite 99 files green, inventory --check current)
F5: Ruling: fixed the dead regex in agent-mode.test.js L2.4 (backspace characters where \b was meant) as a plain /board/i over the text before section 10 — the plan asks for exactly that ban and the old line never matched — costs nothing
F5: Ruling: left T1.5 (agent-mode.test.js, role files) untouched — it carries the same backspace defect so its board/ticket ban never fires, the plan says T1.5 stays as it is, and fixing it may expose unrelated text — costs an inactive guard until someone repairs it
F5: complete (commits f46fb00..ce9b058, RED 4 tests seen, build.js clean, cli suite 99 files green, guard pass)
F6: Ruling: AGENTS.md and web/public/ecosystem.json regenerated in an internal-tagged second commit of F6 (not F7) — deleting the skills changes both and inventory.test.js, run-tests.test.js and graph-ecosystem.test.js fail otherwise — costs nothing, F7 only re-confirms
F6: Ruling: the acceptance scan (L1.10) skips the three build sidecars (artefact-graph.json, injection-points.json, contracts.json) — they are gitignored, regenerated per build and carry the old ids until it runs — costs a stale id in a sidecar going unseen by this test
F6: Ruling: did not delete the stale gitignored build output of the two retired skills under framwork/.claude, .cursor and .opencode — the guard-destructive hook refused rm -rf and needs Maicon's approval — costs L3.2 not being checked on those local folders; a fresh checkout or CI has none
F6: complete (commits ce9b058..7deebc7, RED seen on the scan test and counts, build.js clean, cli suite 99 files green, guard pass)
F7: Ruling: L1.10b was never seen RED — AGENTS.md and web/public/ecosystem.json were already regenerated in F4 and F6 to keep those boundaries green, so F7 only adds the guard and re-confirms inventory --check — costs an unproven RED for that one assertion; it was checked by hand that the files held the old ids before F6's regeneration (inventory.test.js L2.4 failed on them)
F7: complete (commits 7deebc7..9337a4e, inventory --check current, agent-mode-notion 19 tests green, no new hand edit of AGENTS.md)
F8: complete (commits 9337a4e..0efc3c9, changelog entry names neither retired id)
GRAPH: add-setup — add-help, add--settings (HANDS_OFF_TO), neither changed nor named; no notion text in either (grep of commands/ is empty); no entry
GRAPH: add--settings — add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract (USES_SKILL), none changed; the only edit is one vocabulary value no script reads; no entry
GRAPH: add--ecosystem — add-audit, add-diagnose, add-done, add-help, add-hotfix, add-setup, add-wiki (USES_SKILL), none changed; only table rows and mention lines moved; no entry
GRAPH: add--agent-notion — none (new node, linked from the guide and role files which are not nodes); no entry
GRAPH: add--notion, add--notion-setup — removed nodes, no longer resolvable; their only caller add-setup was edited in F2; history has no record of either (the 0076B entry is a delivery, not a node)
Ruling: rejected review lows on the skill's extra behaviour (offer to build the page when missing, PM-creates-card rule) and the eight-name default column set — they follow the plan's PM/engineer roles and "recommended default set" — costs nothing, both are inside decision 1
Ruling: rejected the six removeEmptiedDirs edge-case lows (backslash or ./ entries from a hand-edited manifest, depth-2 user-made empty folder, symlink or junction) — copyRelease only writes normalized slash paths and every failure path is caught and skipped — costs an empty depth-2 folder of the same name removed if a pruned file was its last content
REVIEW: complete (13 findings, 5 applied, 8 rejected)

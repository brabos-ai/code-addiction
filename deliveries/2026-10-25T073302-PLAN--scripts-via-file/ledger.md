# Build ledger — plan: docs/plans/2026-10-25T073302-PLAN--scripts-via-file.md

Ruling: readback gap — the plan gives no canonical rule sentence; wrote it myself from Global Constraints and reuse it verbatim in the 3 carriers — costs a rewording of 3 lines if the intended text differed
F1: Ruling: L1.6 drift guard was green at F1 by design (1 pass, 7 RED observed)
F1: complete (commits 81c0eb6..e93304d, scripts-via-file.test.js RED 7 fail / 1 drift-guard pass)
F2: Ruling: fixed the F1 test helper (section() ended at a fenced heading/--- inside the publish-update template) in the F2 commit — L1.3 had been RED before for the heredoc form too — costs nothing, helper only
F2: complete (commits e93304d..6eb546e, build.js exit 0 / 0 warnings, L1.1-L1.3 green)
F3: Ruling: named the command as plain `/add-pull-request` instead of the {{cmd:}} form — the prose gate only counts a command with its slash, the {{cmd:}} form left the uses: entry a phantom edge — costs nothing, resolves to the same command
F3: complete (commits 6eb546e..4cd52f8, build.js exit 0 / 0 warnings, L1.4 green)
F4: complete (commits 4cd52f8..2c125ab, build.js exit 0 / 0 warnings, L1.5 + L1.6 green, agent-mode / plain-language-rule / brainstorm-greenfield suites green)
F5: complete (commits 2c125ab..e9a8027, build.js exit 0 / 0 warnings, git status framwork/ empty, build-workbench ok, L1.7 green)
F6: complete (commits e9a8027..385c0ee, build.js exit 0 / 0 warnings, framwork/ clean, L1.1 green, BAD example carries no literal opener)
F7: complete (commits 385c0ee..f3e28e8, build.js exit 0 / 0 warnings, framwork/ clean, scripts-via-file 8/8 green)
Ruling: review finding add-build/add-framework--build rows not cold-executable — accepted, rows now name the temp path and the delete — costs nothing
Ruling: review finding uses: list not alphabetical — rejected, the list is not sorted and order carries no meaning — costs nothing
Ruling: building-commands says "about three lines" (words) while the other carriers say "3" — prompt-quality-ruler L3.3 bans a digit size criterion in that skill — costs a small wording drift between carriers; the token and rule match
Ruling: raised BUILD_LINE_BUDGET 1713 to 1714 with a comment, following the file's own per-plan convention, and regenerated web/public/artefact-graph.mmd — the plan required the uses: entry, which adds one line and one edge — costs a looser size guard by one line
REVIEW: complete (4 findings, 3 applied, 1 rejected)
GRAPH: add-pull-request — add-build (changed), add-done, add--doc-schemas, agent-mode fragment; none reads the publish body; no entry
GRAPH: add-wiki — 17 direct dependants incl. add-brainstorm (copies the block verbatim, not edited per plan); no entry
GRAPH: building-commands — prompt-review-agent, add-framework--build (changed), add-framework-development, both layer skills; no entry
Ruling: GRAPH lines are written after REVIEW: because the first append hung and was lost; the graph was queried before the review fixes — costs only line order in the ledger

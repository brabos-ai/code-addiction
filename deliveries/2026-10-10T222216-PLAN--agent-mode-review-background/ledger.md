# Build ledger — plan: docs/plans/2026-10-10T222216-PLAN--agent-mode-review-background.md

Ruling: wrote F4's tests first and saw (a) RED, then landed F1-F3 and committed F4 last — keeps plan order and each commit green — costs nothing if wrong (same files, same content)
Ruling: readback marked 9 gaps filled, none changing what is built (e.g. fragment row 9 layout, preflight ok-case) — built the plan's literal reading — costs a text rewrite in F8 if the layout expectation differs
F1: complete (commits c91f6f3..ccf1332, build.js clean, dispatch-rules + agent-mode-feature tests 267 pass, RED seen on F4a, bite proven on F4b)
F2: complete (commits ccf1332..6522857, build.js clean, agent-mode-feature CONTRACT_WORDS pass)
F3: complete (commits 6522857..653fbf8, build.js clean)
F4: complete (commits 653fbf8..ec6c523, dispatch-rules test pass)
F5: complete (commits ec6c523..2c03edf, cli build + build-contracts tests 172 pass, RED seen on 4 cases, build.js clean, shape unchanged)
F5b: complete (commits 2c03edf..7c1f88f, cli build + build-contracts tests 172 pass, RED seen on 4 cases, build.js clean, shape unchanged)
F6: complete (commits 7c1f88f..838a860, RED seen on real-file case, build.js clean, built shape sha256:2326519b34fdd1fe + changed_in 1.3.2)
Ruling: put the L1.6 real-file assertion in F6's commit, not F5b — it is RED until F6 lands and F5b must commit green — costs nothing, same test file
F7: complete (commits 838a860..891efbd, RED seen 3 of 4 new cases, scripts suite 776 pass, cli QA tests 54 pass, build.js clean)
F7b: complete (commits 891efbd..f8eb4ec, RED seen 3 of 4 new cases, scripts suite 776 pass, cli QA tests 54 pass, build.js clean)
F8: complete (commits f8eb4ec..7c39221, build.js clean, QA + agent-mode cli tests 308 pass)
F9: complete (commits 7c39221..0476c16, build.js clean, QA + agent-mode cli tests 308 pass)
GRAPH: add--subagent-driven-development (dispatch-rules.md) — 9 commands + add--qa-migration + add--review-discipline, all read the reference by design (rule applies to all); no entry
GRAPH: add--agent-interaction — 12 agent-mode fragments load it, covered by F2's one line; no entry
GRAPH: add-audit — add-help, agent-mode/add-audit fragment, add--doc-schemas hand off/inject only; no entry
GRAPH: add-qa-setup — add-build, add-review, qa-pipeline/add-review fragment, add--qa, add--qa-migration, add--setup-contract, agent-mode fragment; shape unchanged so none needs an edit; no entry
GRAPH: qa-preflight.cjs — add-qa-setup, qa-pipeline/add-review fragment (F8 edits the fragment); no entry
GRAPH: scripts/build.js and AGENTS.md — not graph nodes (NOT VERIFIED by graph; build.js read by hand, AGENTS.md edited by F9)
Ruling: rejected side-effects finding "add-qa-setup.md:178 and 3 other boot sites say 'boot in the background' against the new rule" — editing :178 is inside ## Materializes and would move the shape (plan Global Constraint), the carve-out in dispatch-rules.md names the Managed App Lifecycle explicitly, and patching only the fragments would leave the source line inconsistent — costs a headless QA run that boots the app in the foreground and blocks; fix is a pointer line plus a shape bump with changed-in in a later release
Ruling: rejected side-effects finding "add-qa-setup.md:97 wording slightly off about changed-in" — line is inside the Materializes block, any edit moves the shape — costs a slightly imprecise sentence
Ruling: rejected side-effects finding "build.js does not check changed-in against released versions" — plan decision 6 is a hand-declared value, no release lookup (decision 7: smallest change) — costs a wrong changed_in shown to a user if an author mistypes
Ruling: rejected prompt-review finding "dispatch-rules.md L24 bold line is filler" — the F4 test requires the substring "never end the turn" and the IF block does not carry it; the line sits where skipping is tempting — costs one repeated sentence
Ruling: rejected prompt-review finding "dispatch-rules.md 'timeout that covers it' near a tool parameter" — F1 of the plan words it that way and it names no parameter or provider — costs nothing functional
Ruling: rejected prompt-review finding "agent-interaction should point at dispatch-rules as owner" — plan F2 is one behaviour-only line; a pointer needs a new uses: edge, a change the plan did not decide — costs a rule restated at its decision point without a named owner
Ruling: rejected prompt-review finding "add-audit L103/L134 still say WAIT gate" — WAIT-ALL is the intended foreground wait inside the turn; the phrase is not the problem F3 fixes — costs nothing
Ruling: rejected prompt-review finding "add-qa-setup does not read dispatch-rules.md so the foreground rule misses its migrate dispatch" — plan Does-NOT-Include lists per-command edits beyond add-audit; add-qa-setup has no DISPATCH keyword and dispatch-rules.test.js does not list it — costs a headless /add-qa-setup migration run that is not covered by the rule; F2 still covers its closing in agent-mode; worth a follow-up ticket
Ruling: diff-completeness lows (build.test.js untouched; row 9 wording) recorded as non-issues — build.test.js passed unchanged in 172-test run, row 9 quotes the keys the plan names — costs nothing
REVIEW: complete (10 findings, 0 applied, 10 rejected)

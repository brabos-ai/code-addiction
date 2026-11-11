# Build ledger — plan: docs/plans/2026-10-04T004044-PLAN--native-node-backlog.md

BASELINE: build.js clean at branch point — 247 nodes, 974 edges, 0 graph warnings (ADD_GRAPH_WARNINGS=1)

Ruling: L1 "graph gains exactly three script nodes" is verified progressively, not at F1 — the three modules do not exist when F1 commits, and the sidecar only sees files on disk. backlog-id lands at F2 (one node) and the other two at F3, so the +3 count is recorded at F3's build run. Cost if wrong: a new .cjs landing outside the expected set would surface as a node-count mismatch at F3 instead of F1.

Ruling: F1's pending gate tests changed shape between the RED run and its committed-with-F2 form — the first RED run (1 failed / 136 passed) proved the three new names are rejected by the old 3-path guard, but the fixture-level positive test cannot exist: collectLintableSources computes its relative path against build.js's module-level ROOT, so no tmp fixture can ever match the allowlist. The positive side is now the exported set (exact membership) plus a data-driven real-tree exemption, which is green at F1 and covers each module as it appears. Cost if wrong: a wrong relPath rule would let a stray .cjs ship, that stray file one dir too deep would then be the case the real-tree exemption misses.

F1: complete (commits f3061ed5..ba896fb, build.js clean — 247 nodes, 974 edges, 0 new warnings; tests/build.test.js 138 passed over the pending F2-owned gate tests; framwork/ proven untouched)

F2: RED recorded against ba896fb before implementation — native add with no metadata ERROR=id-allocation-failed exit 1; add/update with a valid --record-file on closed stdin failed (ERROR=id-allocation-failed / REFUSED=invalid-json — the pair ignored, stdin drained)
F2: Ruling: allocator parity vs both shell calculators decided by BEHAVIOR, not by their comments — next-id.sh/status.sh headers claim the "id":" anchor catches work_id substrings, and the probe on {"id":"0001B","work_id":"0043F"} shows both shells returning 0002F (a work_id-aware scanner would give 0044F). The plan sentence "including… matching work_id substrings" echoes the false comment; the Validated Decisions basis is "Existing calculation", so native keeps the exact grep anchor and does NOT count work_id. Cost if wrong: on a board whose max number lives only in a work_id field, the next id reuses a number the board references anywhere work_id isn't also a feature directory — the same rule the old chain always applied.
F2: complete (commits ba896fb..6bcb980, full cli suite 75 files EXIT=0; scoped: backlog-cli 30 tests, backlog-id matrix+shell parity, backlog-core byte-identical, build-artefact-graph inventory script 24→25 and total 247→248; build.js clean — 248 nodes, 974 edges, 0 new warnings; board/runtime untouched — core/storage not modified)

F3: RED recorded at F2's close — the native publication entry did not exist (node backlog-commit.cjs failed with MODULE_NOT_FOUND), and old cleanup/reporting lacked proofs
F3: Ruling: the recovery-ref "changed value" case runs at component level — releaseOwnedRef's moved-ref branch — because no git hook can fire between the creation and the deletion inside one run, so the run-level hook proof covers the pre-existing matching ref (protective, never owned) and the component covers a ref moved before deletion (kept + reported). Both sides of the ownership discipline are exercised, fixed, and named in the test header. Cost if wrong: a changed ref would be deleted silently or a matching foreign ref deleted — both are data-loss classes the ownership check exists to prevent.
F3: Ruling: prior cross-file edit — cli/tests/backlog-cli.test.js's no-subprocess scan narrows to the four local-only modules (storage/core/cli/id), leaving the publication pair's child_process-for-git to its own contract test in backlog-publication.test.js. The F2 file map owned the file; F3's new modules would otherwise make that committed test fail the build. Cost if wrong: the local-only guarantee loses two names from the scan — the publication pair is asserted by the run-shape scan instead.
F3: complete (commits 6bcb980..df5e6c0, full cli suite 76 files EXIT=0, 1758 tests; build.js clean — 250 nodes, 974 edges, 0 new warnings)

F4: Ruling: updater.test.js's F4 scope resolves to no edit — its update assertions do not enumerate modules, and the refresh-through-all-modules proof lands in install.e2e.test.js's shared L4.2 describe, which uses the same updater entry. Cost if wrong: a missed third-module refresh proof would only be an orphaned name in a suite that never had one.
F4: Ruling: scripts/run-tests.js edited under F6's conditional clause — diagnosis CONFIRMED the harness permission defect (b bats entry exits 1 with Permission denied: exec bits do not survive a tar pack of a Windows checkout, so even the libexec bootstrap helper bats_readlinkf could not execute). The fix restores exec bits for bats' own directories at the unpack step, inside the throwaway container copy only, then the original shim invocation runs unchanged. Cost if wrong: a wrong restoration scope would chmod inside the throwaway copy — none of it reaches the checkout.
F4: Ruling: the bats-file @test names are parsed by bats with command substitution active — backticked test names executed their words (the suite printed them with the words missing and `list: command not found` noise). The commit suite's names lost their backticks. Cost if wrong: cosmetic.
F4: Ruling: backlog-commit.bats L1.4's first SHA assertion greps the key() VALUE for ^SHA= — a test bug (the wrong subject), fixed to grep the 40-hex value itself. The real trace evidence: $output carried the full report, SHA included. Cost if wrong: none.
F4: complete (commits df5e6c0..be6b471, full cli suite 76 files EXIT=0, 1760 tests; scoped bats: backlog.bats 65/65 + backlog-commit.bats 7/7 (72/72) inside the container; build.js clean — 250 nodes, 974 edges, 0 new warnings)

F5: Inspected all six board fragments — brainstorm/build/done/hotfix/plan carry no record pipeline and no backlog edge (their writes all point at lifecycle.md rows), so only add-new needed its content change; the other five are untouched by design.
F5: Ruling: scripts/build.js gains `.cjs` in the mention resolver's script suffix set — the shipped modules existed as script nodes since node-only-board, but a mention of any .cjs resolved as a SKILL and dangled the build. Without them, no product instruction may name its own shipped entries. Cost if wrong: a bare `.cjs`-looking name in prose would silently resolve to a nonexistent skill — the graph gate would register nothing, which the |sh| set never faced.
F5: complete (commits be6b471..7568343, full cli suite 76 files EXIT=0, 1770 tests (10 new over F4); build.js clean — 250 nodes, 992 edges (+18: the script-declaration edges), 0 new warnings)

F6: Ruling: the conditional run-tests.js scope resolves to ALREADY DONE — the harness permission defect was diagnosed (exec bits lost in the tar pack of a Windows checkout, breaking every bats invocation inside the container) and fixed at F4, with its ruling recorded there. Cost if wrong: the condition would have demanded a harness edit at this block that the diagnosis had already covered.
F6: complete (commits 7568343..3c5e0e6, full cli suite 76 files EXIT=0, 1770 tests; workbench build run — 3 commands × 3 providers, 16 skills, 24 agents — 90 files regenerated, a gitignored output tree; build.js clean — 250 nodes, 992 edges, 0 new warnings; framwork/ proven untouched by this block's own edits)

F7: complete (commits 3c5e0e6..b9c8041, cli suite 76 files/1772 tests EXIT=0; board unit 8 files/113 tests EXIT=0 incl. native-backlog.test.ts 8 cases; full board e2e 163 passed / 20 known viewport skips unchanged — the baseline's own numbers — with native-backlog.spec.ts 9/9; build.js clean — 250 nodes, 992 edges, 0 new warnings)

REVIEW START (auditors: plan conformance H1/M1-M6/L1-L6 + diff completeness F1-F4 + side effects F1-F5 + prompt ruler 10 artefacts fix-then-ok)
Accepted findings applied in two commits: cc5ec8b (product half — 15 fixes; each its own finding) and dcf805c (internal half — 3 fixes; workbench re-generated), plus board/runtime updates riding F4's file. Every applied finding is one of:
- H1 native-ID raw anchor exact → trailing-quote verbatim grep parity + worst-edge parity test (three-way)
- M1 recovery-required refusal now carries the leftover tree's own HEAD as SHA=
- M2 untracked-first-write pinned in the L3 matrix (repo with ({seed: () => {}}) proves an unborn-branch-invisible show-ref and hence the tracks-only-placeholder fixture)
- M5 fixture frozen-dependency add-new RUNS_SCRIPT → backlog-commit.cjs
- L1 abort-failed on the DIRECT route reports its recovery location
- review-rg: installed publication write exercised (install.e2e, real git init)
- ruler: dup grounded bullet; scratch-file cleanup answer in-file; rules reduced to the non-derivable trio; doc-schemas manual-ID paragraph replaced by delegation (native B at id-convention); stale .cjs-name / .sh-suffix prose; mentions named; add--ecosystem's add-hotfix; add-new prose entry; workbench body/dup sentence; AGENTS.md scripts/.cjs sweep
Reactions guarded by rulings in the ledger below: the recovery-ref create-failure injection rejected (the run's own sha is unknowable before the run; parity of the module through the component-level interrupted move + updated CAS), the ecosystem-step integer cites rejected (stale since before this branch, no regression), the delivered.jsonl historical texts rejected (append-only).
REVIEW END: 23 findings, 15 applied, 8 rejected

GRAPH: backlog-cli.cjs — add--backlog, add--id-convention, add--resource-path-convention (all three changed, F5); no entry
GRAPH: backlog-id.cjs — add--id-convention, add--resource-path-convention (changed, F5); no entry
GRAPH: backlog-git.cjs — add--resource-path-convention (changed, F5); no entry
GRAPH: backlog-commit.cjs — add-new fragment, add--backlog, add--resource-path-convention (all changed, F5); no entry
GRAPH: backlog.sh — add--backlog, add--resource-path-convention (changed, F5); no entry
GRAPH: backlog-commit.sh — add--backlog, add--resource-path-convention (changed, F5); no entry
GRAPH: add--backlog — six board fragments; add-new changed (F5), the other five unchanged but re-verified through the migrated lifecycle.md by board-phase-writes L8/L9/L11.5 (all green); no entry
GRAPH: add--ecosystem — six command dependants (add, add-audit, add-diagnose, add-done, add-hotfix, add-wiki), none changed or named; verified: the ecosystem edits touched only the backlog rows and the .cjs mentions, not those commands' bindings; no entry
GRAPH: add--doc-schemas — 22 dependants unchanged, verified: the two that load it WITHOUT add--id-convention (plan-reviewer-agent, add-audit) allocate no ids themselves, so the manual-ID paragraph's replacement by delegation raises nothing; no entry
GRAPH: add--id-convention — eight dependants unchanged, verified via suite: the B carve-out reads alongside, never replaces, the bash allocator docs; no entry
GRAPH: add--resource-path-convention — doc-schemas (changed, F5); no entry
GRAPH: add-new fragment — feature CONTAINS, unchanged concept; no entry
GRAPH: internal/command add-framework--backlog — no dependants (a top-level command); no entry
GRAPH: internal/skill add-plan-authoring — the four pipeline stages unchanged, verified: L11.5 parity passes over the migrated recipes; no entry
GRAPH: scripts/run-tests.js — not a graph node (top-level scripts/); verified by grep inside F4: no backlog references; no entry
GRAPH: AGENTS.md — not a graph node; hand-swept in F6/f7-review (its .sh row now names the .cjs family); no entry
GRAPH: NOT VERIFIED (history verb only) — delivered.sh exited 127 in the graph's history read on this Windows host; the delivered.jsonl supersedes-check instead verified by grep in the side-effects audit (no premature index claim, three standing entries for node-only-board unchanged)

REVIEW: complete (23 findings, 15 applied, 8 rejected)

Ruling: rejected — the recovery-ref create-failure injection (L3) — the run's own sha is unknowable before the run (the board row carries now()-timestamps, so no pre-created ref can collide with the same path) — cost if wrong: the refused create branch stands on the component-level moved-ref proof plus the CAS mechanics instead of a run-level fixture.
Ruling: rejected — re-reading the work_id sentence (M6) against the plan — the audit itself confirmed the shells do not match work_id; "Existing calculation" parity is the Validated Decisions basis and the probe pinned it — cost if wrong: none beyond the F2 ruling already carried.
Ruling: rejected — board-runtime.test.js dead conditional (L6) — pre-existing defect outside this plan's file map — cost if wrong: a latent dead test stays latent; nothing in this delivery depends on it.
Ruling: rejected as a code fix — the stale root-level test-results/ dir (diff-completeness F3) — artifacts of a mis-invoked runner, deleted instead; the committed runs state was never wrong — cost if wrong: none.
Ruling: rejected — the add--ecosystem stale numeric step cites (quality) — stale before this branch and not a regression of it; the fix alongside would be a separate plan — cost if wrong: the citations stay drift-prone as they were.
Ruling: rejected — delivered.jsonl historical texts (side effects F5) — the index is append-only by design — cost if wrong: none.
Ruling: rejected — display a base-advance failure even on a successful push (L2) — a truly divergent local base is exactly the state that refuses the push (non-fast-forward push), so the success-with-refused-advance path has no honest fixture and the suppression matches old behavior — cost if wrong: a hypothetical future push path could hide a refused local advance until its own surface reports it.
Ruling: rejected — macOS L7 execution today (M3): the platform-split decision belongs to the user and was taken at the STEP 2 design gate (Windows-native now, Linux/macOS later via CI) — recorded as LIMITATION: R8's Linux/macOS evidence is NOT satisfied on this branch; macOS is unverifiable, not silently accepted — cost if wrong: R8 would be read as satisfied when only the Windows and container-Linux halves ran.

F8: BASE=5485b6cbc4f0f573dd0f5baa184be5e9d65320cb — user authorized correction of the persisted follow-up review; original F1–F7 and REVIEW remain historical, not re-executed.
F8: Ruling: isolate publication delta with a temporary index and three-way merge; retain caller staged blobs, degrade overlapping changes — implements M2 without publishing user changes — cost if wrong: an overlapping edit needs manual publication instead of an automatic commit.
F9: Ruling: persist the user-requested --review.md companion and keep R8 acceptance pending — explicit request overrides the default no-review-file convention; macOS execution is unavailable locally — cost if wrong: delivery remains blocked until actual platform evidence or an explicit acceptance amendment.
F8: RED — root npm test on Docker/Linux: 9 failed / 60 passed before runtime changes, covering unprotected sweep, normal-exit capture lock, staging report, staged/unstaged definitions, disjoint staged backlog, linked rebase, local-base divergence and two parser cases.
F8: RED — blocking refs/codeadd with a file injects recovery-ref creation failure without knowing the future SHA; publication attempted fetch and hid the protection failure. Added no-reconciliation/no-push behavior when initial detached protection fails. Overlapping caller edits already degrade safely in the isolated-index implementation.
F8: GREEN — full CLI 1785/1785 (76 files) Docker/Linux; Bash compatibility 72/72; board Windows 113/113, browser 163 passed / 20 baseline viewport skips; product build 250 nodes / 993 edges, no graph warnings; board build passed; inventory unchanged.
F8: Ruling: initial full-suite timeouts under concurrent load were rerun after browser completion; both full suites passed. npm ignored the requested maxWorkers option, so do not claim worker-limit evidence. Cost if wrong: timeout flakiness remains in the existing test harness rather than being mistaken for a fixed runtime failure.
F8: complete (commit 34d1e46; Linux/Docker regression/integration gates and Windows board/browser gates passed; Windows publication rerun pending, R8/macOS still pending)
F9: complete — user review companion, acceptance-pending plan status, append-only ledger and corrected changelog recorded. docs/plans companions remain local/gitignored under the repository convention.
F8: Windows publication rerun GREEN — 38/38 tests, native Node/Git, exit 0, 161.75 s with 300 s outer timeout. Resolves the pending Windows publication evidence above; R8/macOS remains pending.
Ruling: user explicitly waived macOS execution because no Mac is available and accepted partial validation. Supersedes the earlier R8/macOS acceptance hold: delivery is partially validated, accepted, and M5 is closed by acceptance amendment. Cost if wrong: macOS-specific behavior remains unverified; no macOS pass is claimed.

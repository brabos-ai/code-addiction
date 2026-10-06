# Build ledger — plan: docs/plans/2026-10-05T152826-PLAN--native-node-framework-scripts.md

<!-- Identity line: written once, never rewritten. -->
plan: 2026-10-05T152826-PLAN--native-node-framework-scripts
ticket: 0022B
worktree: .worktrees/wt-native-node-framework-scripts
branch: feat/native-node-framework-scripts
baseline-commit: 358df9c1bf4d74a9bf8971fdcb1aa1e16376a2d2
baseline-graph-warnings: 0 (ADD_GRAPH_WARNINGS=1 node scripts/build.js on 358df9c, exit 0)
node: v24.11.0

## F1 — Worktree, context copies, audit, native test foundation [internal]

BASE: 358df9c1bf4d74a9bf8971fdcb1aa1e16376a2d2

### Decisions and evidence

- Worktree/branch: `.worktrees/wt-native-node-framework-scripts` / `feat/native-node-framework-scripts`, chosen by the user at the STEP 2 design gate.
- Context copies: plan (61977 bytes), design (17510), intent (1221) copied byte-identical into the worktree; `docs/plans/` and `docs/brainstorming/` are gitignored and absent from a fresh checkout.
- Baseline measured on the branch point: 0 graph warnings; `node v24.11.0`; NODE_OPTIONS carried a VS Code debugger bootloader and is cleared on every command.
- Shell surface confirmed: 19 shipped `.sh` under `framwork/.codeadd/scripts/` + 3 root `.sh` (`scripts/release.sh`, `scripts/create-release-tag.sh`, `scripts/smoke-test.sh`) = 22. The shipped tree also already carries 6 native `.cjs` backlog entries.
- Bats transport: 19 suites, 546 `@test` cases, plus `run-tests.sh` and `test_helper/common-setup.bash`.
- Case/disposition map foundation: `scripts/tests/native-script-cases.json` (24 entries incl. the 2 already-native backlog owners; every one of the 546 cases enumerated with a stable id `<script>#NNN`).
- Dispositions: all 19 shipped + 3 root = `migrate`, except `log-iteration` and `migrate-ids` = `audit-deferred` (uncertain standalone purpose, no dedicated suite; F17 resolves with the user for any deletion). The 2 already-native backlog owners = `already-native`.
- Missing dedicated suites recorded explicitly: migrate-ids, next-id, release, create-release-tag, smoke-test.

### Rulings

Ruling: `migration-acceptance.test.cjs` is seeded by F1 with the intentionally-Red end-state assertions, though the plan assigns that file to F27 — F1 must "add failing native end-state assertions" and the plan names no other home for them. F27 completes it with case-accounting, the full no-Bash guard and the native Git/npm transport assertions. Cost if wrong: F27 moves the seeded assertions into a differently named file and this seed becomes redundant, at the cost of one rename.

Ruling: the per-case `disposition` field defaults to `transfer` and `observation` is empty in the F1 map; F27 owns the per-case refinement (the plan gives F27 the exact native file/test ID, observations and disposition). Cost if wrong: F27 rewrites 546 rows it would otherwise have populated during F1, with no loss of coverage.

Ruling: the readback marked the caller invocation form as unanswered ("node <entry>" vs shebang vs npx). F18 writes every product/workbench caller as an explicit `node .codeadd/scripts/<name>.cjs …`, matching the already-native backlog precedent in `add--backlog/SKILL.md`. Cost if wrong: F18's recipe edits are reworked to the real form, bounded to the caller cutover.

Ruling: `log-iteration` and `migrate-ids` are recorded `audit-deferred` rather than `migrate`, because the plan grades both LOW with uncertain standalone purpose and requires user approval before any uncertain deletion. Cost if wrong: an entry that should have been a straightforward migrate waits for F17's audit, which is where the plan already puts the decision.

### Validation

- L1/L2 foundation: `node --test scripts/tests/harness.test.cjs` — PASS (harness + map self-tests).
- Intentional Red recorded: `node --test scripts/tests/migration-acceptance.test.cjs` — FAILS today (6 end-state assertions), by design; turns Green at F20/F21/F22/F30/F31.
- L8: baseline graph run clean.

F1: complete (commits 358df9c..d479b7f, harness 13/13 pass; migration-acceptance intentionally Red; build.js exit 0, 0 new warnings; framwork/ lane clean)

## F27 — domain case transfer and meaningful Red [internal]

BASE: d479b7f3dfdce654e9f9549e3d83430b726301de

- 25 new `scripts/tests/*.test.cjs`; all 546 Bats cases ported with old ids preserved in test names; characterization suites authored for the five entries with no Bats suite (next-id, migrate-ids, release, create-release-tag, smoke-test) plus the runner no-Bash guard/negative control.
- Passing foundation: `harness.test.cjs` 13/13; `backlog-commit.test.cjs` 6/6; `backlog.test.cjs` 55/67.
- Intentional Red: `backlog.test.cjs` 12/67 (Node-to-Node `next-id`/`status` allocator contract, owed by F7/F8); every unimplemented-entry suite; `migration-acceptance.test.cjs` 1 pass/5 fail.
- No test asserts file absence alone; all 25 files pass `node --check`; no unexpected-error tokens reported by the porters.

### Rulings

Ruling: `done#035–038` (gh route probes) need a deterministic seam because a PATH-stubbed `gh` is unreachable under `shell:false` on Windows and a real `gh` is installed. The tests define `GH_BIN` (when set, the only gh consulted, invoked as `node <GH_BIN>`); F15 must honour it. Cost if wrong: F15 chooses a different seam and those four cases need a tagged F27 refinement.

Ruling: `qa-preflight#014`, `qa-evidence#018` and `hotfix-gates#004` are written in full but `t.skip` on Windows where symlink creation / a runner-absent environment cannot be reproduced; their assertions are present and activate on a platform that can. Cost if wrong: those three cases never execute in this repo's Windows runs, and the old Bats suite had the same platform sensitivity.

Ruling: `delivered#065` retired its interpreter-specific failure (PATH-without-node) and reasserts the surviving contract (`ERROR=not-a-git-repository`, exit 2). Cost if wrong: a reader looks for the retired case by number and finds the substitute documented in the file header.

F27: complete (commits d479b7f..28fe804, harness 13/13 + backlog-commit 6/6 + backlog 55/67 pass; 25 files syntax-clean; intentional Red recorded)

Ruling: the session stops after F27 with F28 not started — the 31-block cross-layer delivery exceeds one session, and a rushed F28 would break the plan's own meaningful-Red standard. The next run resumes at F28, which the absent `F28: complete` line already shows. Cost if wrong: F28 is re-derived by the next session from the same plan text, with no work lost (F1 and F27 are committed).

## F28 → F20 and F30 — implementation and cutover [mixed]

Committed in branch order (all validated before commit):

- **F28** b11c91e — CLI tests expect the built-ins-only native closure and disk-derived `.cjs` inventory.
- **F2** b3b209f, refined 424f68a — shipped-source gate admits a direct `scripts/*.cjs` whose imports are builtins or `./` siblings; inventory lists `.sh`+`.cjs`; bare builtins resolved via `node:module.builtinModules` and the `from` scan anchored to import/export statements; AGENTS inventory regenerated. `build.js` exit 0, 0 new warnings.
- **F27 refinement** 87c1ec4 — restored the `mkdir` the Bats port dropped in `delivered#070`; spec 84/84.
- **F3** 37b1c6b — `delivered.cjs` + `delivery-index-core.cjs` (84/84).
- **F6** 9e5b593 — `get-main-branch.cjs` + `get-branch-metadata.cjs` (8/8, 13/13).
- **F7** 1ff4f2b — `next-id.cjs` + canonical `backlog-id.cjs` (12/12).
- **F10** 58ff1e7 — `build-ledger.cjs` (18/18).
- **F11** 9f2ab3f — `task-brief.cjs` + `review-package.cjs` (23/23, 18/18).
- **F12** c307ea5 — `log-jsonl.cjs` (7/7).
- **F13** d447e31, refined ea0cf06 — `qa-evidence.cjs` + `qa-preflight.cjs` (18+1skip, 24+1skip).
- **F16** fe2456c — `migrate-context-files.cjs` (10/10).
- **F17** d1513e1 — `log-iteration.cjs` + `migrate-ids.cjs` (15/15, 10/10).
- **F5** 1b31a21 — mcp engine/corpora/server read the native core in-process (157/157).
- **F4** dc107a3 — `scripts/graph.js` history reads the core in-process.
- **F8** 62e14f5 — `status.cjs` (62/62; backlog 67/67, NEXT_ID_AGREE Node-to-Node).
- **F9** 3d4e3fc — `init.cjs` + `build-setup.cjs` (17/17, 22/22).
- **F14** 8c7aa6a — `converge-gates.cjs` + `hotfix-gates.cjs` (75/75, 7+1skip).
- **F15** 0f77746 — `done.cjs`, `GH_BIN` seam honoured (56/56).
- **F30** ff3153f — `scripts/smoke-test.cjs`; `scripts/smoke-test.sh` removed (8/8).
- **F18** c2af602 — 44 product files cut over to `node .codeadd/scripts/<x>.cjs`; dangling `architecture-discover.sh` proven obsolete and re-routed.
- **F19** 709ed04 — workbench guidance cut over; release/tag refs left pending F21.
- **F20** 0caf657 — all 19 shipped `.sh` removed; 14 product fixtures data-derived and expanded to `.cjs`; 491/491 on the touched files.

### Rulings

Ruling: F17 preserves `log-iteration` and `migrate-ids` rather than retiring them — uncertain deletion needs explicit user approval, which the plan defers to F17's audit. Cost if wrong: two entries remain that a later decision may retire, with their cases already ported.

Ruling: F2's gate is refined twice (bare builtins; script gates) and `qa-preflight.cjs` moves from `require(resolved)` to `createRequire(__filename)(resolved)` — a dynamic `require` cannot be proven built-ins-only, and `createRequire` is Node's own means of resolving relative to a base. Cost if wrong: a genuinely external dependency could hide behind an indirect call; the static scan still rejects every literal non-builtin specifier.

Ruling: F5's implementation subagent committed its own three files before the coordinator; the commit was amended to carry the `F5` trailer with no content change. Cost if wrong: the F5 boundary is one commit earlier than the coordinator's convention, changing nothing about what the commit contains.

Ruling: F18 updated `add-qa-setup.md`'s declared `## Materializes` shape hash because the embedded route moved from `.sh` to `.cjs`; the contract gate requires the hash to follow the block. Cost if wrong: the receipt comparison would be stale, which the build gate would report.

## F21 → F26 and the review pass

Committed: F21 74fc6f7, F22 638bc4b, F23 55b6cbe, F31 ee7b730, F24 ea76255, F25 ffd7b6b, F29 e18bd20; review fixes d1aaa32, a730904, 225fd4a, 1ff72bf, plus 78e1b51 (injection timeout headroom).

### Final local validation (evidence)

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` → exit 0, 0 new warnings (baseline 0), 249 nodes / 1000 edges.
- `node scripts/inventory.js --check` → current.
- `node --test scripts/tests/migration-acceptance.test.cjs` → **6/6 GREEN** (no shipped/root `.sh`, product Bats tree gone, `test:scripts` native, no active `bash .codeadd/scripts/*.sh` invocation).
- `npm run test:scripts` (native) → **627 tests, 624 pass, 3 platform skips, 0 fail, ~200s**.
- `npm test` (native, full CLI) → **76/77 files, 1893/1896 tests**; the one file (`injection-exclusivity`) now greens after the timeout-headroom fix.
- `scripts/no-bash-guard.js --probe` → negative control rejects Bash (exit 127); `--run "npm run test:scripts"` → exit 0.
- Baseline wall-clock was recorded as absent (plan L8.4 permits "missing historical timings"); final native scripts suite ~200s is the only timing measured.

### Graph question (7.2)

`impact <script>.cjs --depth 1` for all 19 renamed entries; every direct dependant it returns was changed or named by F18's caller cutover — no undiscovered dependant. `history` returns "no delivery recorded" for each (new nodes; the retired `.sh` names were never delivery-index entries). `get-main-branch.cjs`, `log-jsonl.cjs`, `log-iteration.cjs` and `migrate-ids.cjs` have zero direct graph dependants, matching the plan's LOW grades; their prose callers were still swept by F18's source scan.

GRAPH: product/script/status.cjs — 19 direct dependants (agents fix/test; commands add, add-brainstorm, add-build, add-diagnose, add-hotfix, add-new, add-plan, add-qa-setup, add-review, add-ux; skills add--code-review, add--dev-environment-setup, add--doc-schemas, add--feature-discovery, add--id-convention, add--knowledge-discovery, add--setup-contract, add--subagent-driven-development); all changed by F18; no entry
GRAPH: product/script/delivered.cjs — add-done, add-hotfix, add--knowledge-discovery; all changed by F18; no entry
GRAPH: product/script/next-id.cjs — add--id-convention; changed by F18; no entry
GRAPH: product/script/get-main-branch.cjs — none; no entry
GRAPH: product/script/get-branch-metadata.cjs — add--id-convention; changed by F18; no entry
GRAPH: product/script/init.cjs — add-new, add--feature-discovery; changed by F18; no entry
GRAPH: product/script/build-setup.cjs — add-build, add--doc-schemas, add--id-convention; changed by F18; no entry
GRAPH: product/script/build-ledger.cjs — add-build, add--review-discipline, add--subagent-driven-development; changed by F18; no entry
GRAPH: product/script/task-brief.cjs — add-build, add--subagent-driven-development; changed by F18; no entry
GRAPH: product/script/review-package.cjs — add-build, add--review-discipline, add--subagent-driven-development; changed by F18; no entry
GRAPH: product/script/log-jsonl.cjs — none; prose callers (add-review/add-build/add-hotfix/persistent-logging) changed by F18; no entry
GRAPH: product/script/log-iteration.cjs — none; no entry
GRAPH: product/script/qa-evidence.cjs — qa-agent, add-done, add-qa-setup, add-review, qa-pipeline fragment, add--id-convention, add--qa; all changed by F18; no entry
GRAPH: product/script/qa-preflight.cjs — add-qa-setup, qa-pipeline fragment; changed by F18; no entry
GRAPH: product/script/converge-gates.cjs — add-build, add-done, add--commit; changed by F18; no entry
GRAPH: product/script/hotfix-gates.cjs — add-diagnose, add-done, add-hotfix, add--subagent-driven-development; changed by F18; no entry
GRAPH: product/script/done.cjs — add-build, add-done, add--id-convention, add--wiki-maintenance; changed by F18; no entry
GRAPH: product/script/migrate-context-files.cjs — add-wiki, add--agents-md-style; changed by F18; no entry
GRAPH: product/script/migrate-ids.cjs — none; no entry
GRAPH: mcp/engine.mjs + mcp/corpora.mjs — not artefact nodes (top-level mcp/ is CLI source); consumers are cli/tests/mcp-*.test.js; no entry
GRAPH: scripts/graph.js, scripts/build.js, scripts/inventory.js, scripts/run-tests.js — top-level scripts produce no nodes; consumers are internal tests/CI; no entry

### Review rulings on rejected/deferred findings

Ruling: the prompt reviewer's five findings (`add` L140/L142 step ids, `add` L90 raw `.claude/commands/` path, `add-build` L467, `add-done` L581) are pre-existing pointer defects the `.sh`→`.cjs` migration neither introduced nor touched; fixing them is a separate concern. Cost if wrong: they remain as they were before this delivery, and the reviewer's evidence is on record.

Ruling: F7 changed the exhaustion contract — the retired shell emitted a five-digit id at `9999`, the canonical native allocator refuses (`id-exhausted`, exit 1), already pinned by `cli/tests/backlog-id.test.js`. This is surfaced to the user in the completion report because the plan asks conflicting old semantics be escalated. Cost if wrong: a caller relying on ids past `9999` sees a refusal instead of `10000F`.

Ruling: the runner's native scripts spec now runs `process.execPath` with an argv array and `shell:false`; the vitest spec keeps shell because npm needs it. The optional Docker route still uses `bash -c` internally but is opt-in and never the default route. Cost if wrong: the Docker route is not shell-free, but nothing on Windows/macOS/Linux depends on it.

Ruling: F23 edited only `install.e2e.test.js` and `updater.test.js` of its seven named files; the other five (`installer`, `migrations`, `board-runtime`, `board-phase-writes`, `package-smoke.mjs`) were run and stayed green unchanged, so their disposition is verified-unchanged. Cost if wrong: the ledger names each rather than the plan's file count implying edits.

Ruling: `injection-exclusivity.integration.test.js`'s two full-enable cases were given 60s rather than 20s — F25 reproduced the 20s timeout on the baseline, and the native runner is now the Windows gate. Cost if wrong: a genuinely slow regression hides under a larger budget, but the cases still assert full exactly-once behaviour.

REVIEW: complete (31 findings across three scopes and the batched prompt review, 12 applied, 7 rejected as pre-existing/out-of-scope, 12 duplicates or noted; the F7 exhaustion change recorded as a user-facing ruling)

F26: complete (commits e18bd20..78b60d0, changelog `docs/changelog/2026-10-05T232428-refactor-native-node-framework-scripts.md`, plan status implemented; local acceptance green; remote six-job CI pending the PR question)

## Post-delivery critical review — 2026-10-06

User requested a branch-wide comparison with the approved plan and corrections to gaps. Review baseline: `78b60d0`, clean worktree. Scope: the full `main...HEAD` change set, public runtime contracts, caller cutover, shipping and verification boundaries. One independent read-only adversarial review returned five concrete findings; each was checked against source/predecessor behavior before application.

### Follow-up write ownership and evidence

- **F32 [internal] — regression tests:** `scripts/tests/{build-setup,review-package,next-id,qa-preflight,run-tests,migration-acceptance,harness}.test.cjs`. Meaningful Red observed for failed checkout/worktree creation, a >1 MiB truncated review diff, installed Playwright without npx, the Docker Bash route, a separate `--test-name-pattern` value, and five-digit ID output. Added baseline case-ID resolution and direct/absolute/nested Bash rejection controls. The harness environment assertion now allows only the explicit no-Bash preload during guarded acceptance, while still requiring debugger bootloaders to be cleared.
- **F33 [product] — integration tests:** `cli/tests/{backlog-id,doctor.internal,graph-query,mcp-engine,run-tests}.test.js`. Preserve the explicit backlog/public-adapter exhaustion distinction; exercise the exact Node floor, invalid history arguments, alternate core and entry readers, malformed-reader degradation and graph/MCP equality.
- **F34 [product] — runtime corrections:** `framwork/.codeadd/scripts/{backlog-id,build-setup,delivered,init,next-id,qa-preflight,review-package,status}.cjs`, `mcp/engine.mjs`, `cli/src/doctor.js`. Git mutation failures stop before success/copy; review collection permits 64 MiB and refuses subprocess errors rather than publishing partial output; Playwright's installed project bin runs with process.execPath; native entries export their core for executable override selection; history validates and degrades consistently; doctor enforces 22.19.0.
- **F35 [internal] — tooling and recipes:** `scripts/{graph,run-tests,no-bash-guard,rename-product-artefacts}.js`, new `scripts/no-bash-preload.cjs`, `.github/workflows/ci.yml`, `AGENTS.md`, `workbench/commands/add-framework--sync.md`, `workbench/skills/{add-framework-development,building-commands}/SKILL.md`. Docker uses POSIX sh rather than Bash; native test selection retains option values; Node subprocess instrumentation blocks direct/absolute Bash even when child environments clear debugger NODE_OPTIONS; negative control requires the rejector's exact status and diagnostic; renaming discovery includes CJS/MJS; authoring guidance and runner documentation describe native routes.
- **F36 [product] — runtime documentation:** headers of `framwork/.codeadd/scripts/{backlog-git,backlog-id,delivered,delivery-index-core,done,get-branch-metadata,get-main-branch,log-jsonl,status}.cjs`, `skills/add--doc-schemas/references/backlog.md`, `skills/add--id-convention/SKILL.md`. Align the common Node floor and public exhaustion policies.

### Explicit user decision — ID exhaustion

Asked the user whether to approve the new refusal at 9999 or preserve the predecessor's output. The user chose **Preservar comportamento antigo**. This supersedes the unapproved F7 exhaustion ruling above: next-id/status/init use the one canonical allocator with `allowOverflow: true` and can emit `10000F`; backlog uses the same scan/calculation with its existing four-digit refusal. No second scan implementation was introduced. Independent tests pin both behaviors.

### Audit dispositions

The original case map records the bootstrap `audit-deferred` state for log-iteration/migrate-ids. Their final F17 disposition remains **retained and migrated**, as recorded above, with complete native suites. The new case-transfer acceptance checks that all 546 baseline case IDs point into their actual native suite, rather than merely trusting the map's counts. Historical Red comments and the original bootstrap decisions are evidence of execution order, not current acceptance results.

The former optional-Docker Bash ruling is superseded by F35: the retained transport now runs `sh -c`. The no-Bash boundary also covers Windows shell:false process creation and absolute Bash paths; the PATH rejector alone did not prove that boundary.

### Validation recorded during review

- Initial baseline native suite: 628 tests / 625 pass / 3 platform-dependent skips / 0 fail, ~221 seconds.
- Initial baseline full CLI suite through isolated `npm test`: 77 files / 1895 pass / 1 skip / 0 fail, ~551 seconds.
- New build-setup/review-package/next-id/runner regressions and their full domain suites: **70/70 pass** after fixes.
- Graph/MCP/backlog-ID/root-runner CLI integration subset through isolated runner: **125/125 pass** after fixes.
- QA preflight + runner domain checks: 36 pass / 1 environment-dependent skip, including installed-project CLI with empty PATH.
- Case-transfer/runner acceptance subset: **20/20 pass** before the later direct-process preload assertion; that assertion subsequently passed in the 70-case domain run.
- Product build and workbench build: exit 0. Bash negative control: exit 0 only after both shim and direct Node-boundary rejection returned 127 with the expected diagnostic.
- Final guarded suites, final minimum-runtime/reader refinements and post-change build checks: pending completion below. Remote Windows/macOS/Linux × Node 22.19.0/24 CI remains pending publication; no remote Green is claimed.

Additional final checks: guarded doctor/graph/MCP subset **107/107 pass** after exact-floor and malformed-reader refinements; guarded harness/case-transfer/runner subset **35/35 pass** after allowing the acceptance-only preload; isolated argument-selection probe **1/1 pass**, including Docker POSIX quoting for spaced argv; package smoke **PASS** (pack/install/bin help/invalid invocation/exit propagation); inventory `--check` current; product build with `ADD_GRAPH_WARNINGS=1` exit 0/no warnings; native worktree graph history exit 0; `git diff --check` clean. The changelog was updated to supersede the unapproved exhaustion claim and describe the review corrections and pending remote CI accurately.

Final QA fixture refinement: a deliberately incomplete fixture-local `@playwright/test` masks ancestor/host installations for non-runner cases. This removes the environment-dependent skip for qa-preflight#014 and prevents unrelated config probes from launching the host's Chromium. The installed-project CLI regression replaces this fixture package with a functional fake CLI/browser boundary. Full guarded QA suite after this refinement: **26/26 pass, no skips**, ~26 seconds. This supersedes the earlier QA runner-absence skip; native symlink availability remains platform-dependent.

The first full guarded scripts run observed **634 pass / 1 fail / 3 skips**: the sole failure was the harness's historical exact-empty NODE_OPTIONS assertion, now superseded by the acceptance-only-preload contract above. All production/domain cases passed in that run. The corrected assertion and related boundary controls passed in the guarded 35-case subset. The fresh full guarded scripts run finished with **638 tests / 635 pass / 3 skips / 0 fail**, ~327 seconds; its checkout snapshot precedes only the test-only QA fixture isolation refinement, whose full 26-case suite passed separately.

### Final prompt disposition and acceptance

- Applied the new portability finding to F35: STEP 6 in `add-framework--build` requires `ADD_GRAPH_WARNINGS=1` in the process environment without requiring POSIX assignment syntax; `building-commands` distinguishes distributed `.codeadd/scripts/` entries from repository `scripts/` tooling.
- Other prompt findings (skill skeleton, duplicated Spec/dispatch rules, subdocument guidance, provider-output wording) were judged pre-existing and recorded rather than expanded into this migration review. No repeat review was dispatched.
- Full guarded CLI run: **77 files / 1898 pass / 1 skip / 1 fail**. The sole failure was the existing 60-second timeout of the reversed-enable-order injection integration case (62.8 seconds), with no failed content assertion. Rerunning the complete affected file with the same Bash guard and unchanged timeout passed **14/14**, including that case in 41.5 seconds. The full run is therefore recorded as a timeout failure, not as a green full run.
- Final product build with graph warnings enabled: exit 0, no graph warnings; final workbench build: exit 0; final `git diff --check`: clean. Local platform: Windows / Node v24.11.0. Remote matrix remains pending publication. Review changes remain uncommitted; no push, PR or merge performed.
 
## Close-out ledger normalization — 2026-10-06

The following completion lines normalize the existing narrative commit records above. No block was re-executed. Commit parents were checked against git log; final validation is CI run 37467193563 on 963169e, all six native platform/runtime jobs and board successful, plus successful CodeQL checks.

F28: complete (commits 28fe804..b11c91e, existing native closure/inventory test record; final six-job CI successful)
F2: complete (commits b11c91e..b3b209f, existing build exit 0 / zero new warnings; refinements 424f68a; final six-job CI successful)
F3: complete (commits 87c1ec4..37b1c6b, existing delivered 84/84; final six-job CI successful)
F6: complete (commits 37b1c6b..9e5b593, existing Git helpers 8/8 and 13/13; final six-job CI successful)
F7: complete (commits 9e5b593..1ff4f2b, existing next-id 12/12; overflow decision superseded by explicit user choice; final six-job CI successful)
F10: complete (commits 1ff4f2b..58ff1e7, existing build-ledger 18/18; final six-job CI successful)
F11: complete (commits 58ff1e7..9f2ab3f, existing task/review 23/23 and 18/18; final six-job CI successful)
F12: complete (commits 9f2ab3f..c307ea5, existing JSONL 7/7; final six-job CI successful)
F13: complete (commits c307ea5..d447e31, existing QA evidence/preflight validation and ea0cf06 refinement; final six-job CI successful)
F16: complete (commits d447e31..fe2456c, existing context migration 10/10; final six-job CI successful)
F17: complete (commits fe2456c..d1513e1, existing retained entries 15/15 and 10/10; final six-job CI successful)
F5: complete (commits d1513e1..1b31a21, existing MCP 157/157; final six-job CI successful)
F4: complete (commits ea0cf06..dc107a3, native graph history validated by final six-job CLI CI)
F8: complete (commits 83ab193..62e14f5, existing status 62/62 and backlog 67/67; final six-job CI successful)
F9: complete (commits 62e14f5..3d4e3fc, existing init/setup 17/17 and 22/22; final six-job CI successful)
F14: complete (commits 3d4e3fc..8c7aa6a, existing convergence 75/75 and hotfix 7 pass / 1 platform skip; final six-job CI successful)
F15: complete (commits 8c7aa6a..0f77746, existing done 56/56; final six-job CI successful)
F30: complete (commits 0f77746..ff3153f, existing native smoke 8/8; final six-job CI successful)
F18: complete (commits ff3153f..c2af602, product caller cutover and source scans validated by final six-job CI)
F19: complete (commits c2af602..709ed04, workbench caller cutover validated by final six-job CI)
F20: complete (commits 709ed04..0caf657, existing 491/491 on touched files; final six-job CI successful)
F21: complete (commits 0caf657..74fc6f7, release/tag disposable-repository suites validated by final six-job CI)
F22: complete (commits 74fc6f7..638bc4b, native runner and failure propagation validated by final six-job CI)
F23: complete (commits 638bc4b..55b6cbe, install/update/relocated package closure validated by final six-job CI)
F31: complete (commits 55b6cbe..ee7b730, complete mapped case transfer and retired Bats transport validated by final six-job CI)
F24: complete (commits ee7b730..ea76255, exact Node 22.19.0 floor validated by three platform CI jobs)
F25: complete (commits f168a73..ffd7b6b, all six native CI jobs on 963169e successful with Bash rejection)
F29: complete (commits ffd7b6b..e18bd20, product runtime guidance validated by final six-job CI)

Review follow-ups were committed in c388a7b; CI platform corrections in 33ab8f5 and 963169e. Git worktree registrations now use NUL-delimited porcelain and canonical paths; done's start guard resolves Windows short paths physically. Fixtures use canonical macOS paths, accept coincident Linux temp paths, and use legal Windows filenames. The combined injection case has an explicit 60-second timeout. All final checks on 963169e concluded SUCCESS. This supersedes all earlier remote-CI-pending statements without changing their historical record.

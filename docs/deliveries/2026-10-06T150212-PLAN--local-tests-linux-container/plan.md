# Plan: All local tests in Linux containers — extend PR #109's central runner

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-06
> **Delivery:** automatic

## Objective

Every local test invoked by an agent through the repository's supported test commands runs in a Linux container on every host OS. Prompts remain environment-agnostic: scripts own environment selection, isolation, filtering and refusal. Native local execution is prohibited.

**When this build is done:** Root and subproject test commands enforce the approved environment policy, preserve focused iteration and usable watch/report workflows, and supply framework, board and built-app browser evidence without changing host generated state. Explicitly authorized Linux GitHub Actions keeps its native test execution.

## Context

PR #109's existing `local-tests-linux-container` branch defaults to Docker only on Windows. It leaves native overrides and separate CLI/board entrypoints. This plan extends that branch rather than replacing its isolation and worktree implementation. Initial status shows no tracked modifications and one pre-existing untracked directory, `wt-compact-backlog-reads/`, which belongs to other work.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-06T144849-local-tests-linux-container.md` | Final reviewed objective, command contract, authorization predicates, isolation/watch/report behavior, risks and proof |
| `docs/brainstorming/2026-10-06T144849-local-tests-linux-container-intent.md` | Architectural path, closed decisions, automatic delivery; Open reads None |

The parent coordinator supplied prior discovery and retains all independent-agent dispatches. Parent plan review returned fix-then-ok; B1, B2 and A1 are applied in this revision without a second review. Planning performed read-only source/graph queries, no build or test execution. Strategy documents under `docs/strategy/` were absent; AGENTS.md, the product ecosystem and resource-path conventions supplied repository context. Docker's available daemon reports Linux, but no integration evidence has yet been produced.

## Global Constraints

- Every supported local test command runs in Linux Docker on all host OS — scripts enforce the policy. (intent, Decided)
- Prohibit local native overrides and fallback — missing Docker means tests were not run. (intent, Decided)
- Keep prompts environment-agnostic — ordinary npm commands dispatch centrally. (intent, Decided)
- npm test/framework selects CLI, scripts and package smoke; all adds board unit/typecheck and E2E — individual suites retain filters. (intent, Decided)
- Include watch synchronization and coverage/browser report export — preserve usable local workflows. (intent, Decided)
- Authorize native Linux GitHub Actions explicitly — generic CI/copy flags do not authorize local execution. (intent, Decided)
- Extend the work initiated by PR #109 — preserve isolation, worktree support and failure propagation. (intent, Decided)
- Deliver automatically through planning/build — merge and deciding stops still require user approval. (intent, Decided)
- No native local test run is used to validate this delivery. (design, Proof)
- Edit the source, never the built copy. (AGENTS.md, Internal Layer)

## Problem

1. **Policy bypasses** — platform defaults, native override, truthy CI/copy authorization and direct subproject test scripts allow local native execution.
2. **Incomplete selection** — framework default lacks scripts/package smoke; all lacks board/browser suites.
3. **Host-side preparation** — board npm pretest hooks generate runtime before any central dispatcher can isolate the checkout; Playwright config writes fixtures on import.
4. **Transport gaps** — static copies cannot support real watch; shell-joined Vitest arguments lose boundaries; current image lacks board dependencies and Chromium; reports disappear with containers.
5. **Contradictory guidance** — workbench recipes describe native paths, prescribe host dependency preparation or filters through a command whose scope will change.

## Proposal

Extend `scripts/run-tests.js` into the canonical public dispatcher and retain a separate authorized worker route. Keep shared authorization and deterministic suite selection in built-ins-only CommonJS modules. Tool execution uses argv rather than arbitrary filter interpolation in shell strings. Preparation happens in the worker before assertions and before mutation-bearing tool configs load.

Implement policy/workers first, then Linux dependencies and isolated transport, then internal prompt guidance, then product-local entrypoints/guards, then CI. Guidance lands before the first product full-suite gate so updated CLI assertions see the completed prose. The design's Command Contract and Execution Mechanism are authoritative. Implementation naming below defines the plan's concrete interface without prescribing file bodies.

Public selection: framework = CLI, scripts, package; all = framework, board typecheck/unit, board E2E. Preserve `vitest` for CLI and `bats` for scripts. CLI watch/coverage remain CLI-scoped. Groups reject extra arguments; package rejects filters; individual suites preserve tool-native argument boundaries and refuse or fail a zero-selected-test run.

**Receipt and leaf contract (A1):** The receipt at `/run/codeadd-tests/context.json` declares container context, canonical outer selection and its deterministic authorized leaves. Canonicalize aliases before constructing or checking it: vitest becomes cli, bats becomes scripts. The outer worker request must exactly match the receipt selection; the receipt leaves must exactly equal canonical expansion, not an arbitrary supplied allowlist. Propagate the validated outer selection and active leaf to each tool child. CLI global setup requires active leaf cli, package smoke requires package, board unit configuration requires board, and Playwright configuration requires board-e2e; each guard checks that leaf belongs to the validated selection and agrees with its own tool. Framework authorizes only cli/scripts/package; all adds board/board-e2e. A group receipt does not authorize an unrelated leaf or a different outer request. The same deterministic selection/active-leaf propagation applies to explicitly authorized CI workers, without a container receipt.

## Current State

| Component | Existing behavior | Source/relationship evidence |
|---|---|---|
| Runner and image | Windows Docker default, native elsewhere/override; CLI and scripts only; tar copy, read-only Git mounts, worktree remap | `scripts/run-tests.js`, `scripts/tests.Dockerfile`; outside graph coverage |
| Root commands | test = vitest; all = vitest + scripts; board bypasses runner | `package.json`; outside graph coverage |
| CLI | Direct Vitest run/watch/coverage and direct package smoke; global setup accepts truthy CI or copy | `cli/package.json`, `cli/tests/helpers/global-setup.js`; outside graph coverage |
| Board | Typecheck/Vitest and Playwright direct; pretest hooks generate runtime; Playwright config writes fixtures | `board/package.json`, `board/vite.config.ts`, `board/playwright.config.ts`; outside graph coverage |
| CI | Separate framework and board Ubuntu jobs; native override on test steps; package and board direct entrypoints | `.github/workflows/ci.yml`; outside graph coverage |
| Product-layer skill | Declares native routes, host dependency preparation and root npm test file filters | Direct caller: `add-framework--build`, USES_SKILL; MEDIUM |
| Done skill | CI evidence is authoritative but local prose names native override and old package scope | Direct caller: `add-framework--build`, HANDS_OFF_TO; MEDIUM |
| Renaming skill | CLI-local npm test recipe needs scope clarification | Direct callers: `add-framework-development`, `add-framework-product-layer`, USES_SKILL; MEDIUM |

Read-only artefact-graph queries covered depth-1 impact, transitive impact and dependencies for all three skills. Product-layer directly depends on renaming (path query confirmed). Renaming needs artefact-graph; product-layer also needs development and building-commands; done needs graph, ledger, commit, final-report, build and plan-authoring. Unbounded impact reaches the internal pipeline and is context, not a risk score. These skills have no injected command fragments requiring a second fragment query. AGENTS.md is changed manually outside graph coverage. No skill registry identities or declared relations change.

Layer-filtered history queries returned parallel-tests-in-one-container and superseded fast-local-bats for internal product-layer history, and vitest-fixture-scope for its product history. Done history returned no joined entries despite nonzero native-reader metadata; do not treat that as proof of no historical deliveries. Renaming history returned no entries. Parent discovery also identified native-node-framework-scripts and backlog-board-002-board-app; preserve their relevant contracts. Graph freshness was not regenerated during planning; parent discovery reported verified graph access, and the build must regenerate before grading new changes.

## Scope

### Includes

#### T1 — Authorized workers and canonical selection (design: Command Contract, Execution Mechanism)

- **F1** [internal] — Modify `scripts/run-tests.js`; create `scripts/test-context.cjs` and `scripts/test-worker.cjs`; create `scripts/tests/test-context.test.cjs` and `scripts/tests/test-worker.test.cjs`. Implement strict authorization, suite/group expansion, distinct internal worker execution, argv-safe tool requests, preparation/refusal diagnostics, no-match handling and first-nonzero aggregation. Preserve Git mapping and legacy selectors. Workers prepare framework output for package smoke, board runtime before board tools, and built board assets before E2E. Preparations return unavailable/refusal evidence, not assertion success. Add tests before each behavior change and run them RED in the existing isolated Linux image.
  - **Produces:** `test-context.cjs authorization: Linux container context + read-only receipt + matching suite, or explicit Linux github-actions context`.
  - **Produces:** `test-worker.cjs request: canonical suite + mode + argv; framework=[cli,scripts,package]; all=[cli,scripts,package,board,board-e2e]`.
  - **Validation:** L1.1–L1.6 with pure predicates and stub tools/preparations, plus L1.7 actual CLI and scripts filters/skipped-only cases, run through the retained bootstrap Linux transport. Real tools in F1 are limited to CLI and scripts provided by the old image. Package/group aggregation and board/E2E preparation are stubbed here; real package acceptance begins F2 and real board/browser preparation/no-match acceptance begins F2 and completes F5. No full-framework GREEN is claimed before F4 replaces obsolete CLI policy assertions.

#### T2 — Linux image, isolation, watch and artifacts (design: Execution Mechanism)

- **F2** [internal] — Modify `scripts/run-tests.js`, `scripts/tests.Dockerfile`, root `package.json` and `.gitignore`; create `scripts/test-transport.cjs`, `scripts/tests/test-transport.test.cjs` and `scripts/tests/test-entrypoints.test.cjs`. Route every root test command to the canonical dispatcher. Build/cache Linux CLI and board dependencies plus Chromium using all relevant manifests/locks and image inputs. Place receipts at a fixed container-only path outside `/code`, mounted read-only; never copy host dependencies over image modules. Preserve tar-copy/read-only Git/worktree isolation, unique per-run scratch/container identity and strict Docker refusal. Add asynchronous lifetime handling for watch, debounced serialized edit/add/delete synchronization into the container filesystem, exclusions for generated/dependency/Git/provider/report/temp/nested-worktree trees, manifest-change restart refusal, cancellation and cleanup. Export allowlisted coverage and browser output on success or failure to ignored suite/run-scoped `.test-artifacts/` destinations without restoring generated state to the host. Preserve suite exit status even if artifacts need diagnostic reporting.
  - **Consumes:** `test-context.cjs authorization: Linux container context + read-only receipt + matching suite, or explicit Linux github-actions context` (F1).
  - **Consumes:** `test-worker.cjs request: canonical suite + mode + argv; framework=[cli,scripts,package]; all=[cli,scripts,package,board,board-e2e]` (F1).
  - **Produces:** `scripts/run-tests.js public selectors: framework|cli|vitest|scripts|bats|package|board|board-e2e|all; CLI watch/coverage modes`.
  - **Produces:** `.test-artifacts/<suite>/<run-id>/ allowlisted coverage and browser reports`.
  - **Validation:** L2.1–L2.5 and root-only L3.1/L3.2 through updated Docker dispatch; real CLI/scripts/package worker smoke; real board typecheck/unit and Chromium preparation/no-match probes once the new image is available; watch fixtures, failed report export and cache-input changes. Product-local routes/guards remain explicitly assigned to F4/F5. Exclude the existing `wt-compact-backlog-reads/` through robust nested-checkout detection, not deletion or a user-directory-specific policy.

#### T3 — Agnostic guidance before product gates (design: Ecosystem Impact)

- **F3** [internal] — Modify `AGENTS.md`, `workbench/skills/add-framework-product-layer/SKILL.md`, `workbench/skills/add-framework--done/SKILL.md`, `workbench/skills/add-product-artefact-renaming/SKILL.md` and `scripts/tests/test-entrypoints.test.cjs`. Use ordinary suite-specific npm recipes, centralize mechanics in runner header, remove host-native overrides/platform choices/host dependency prescriptions, and distinguish unavailable preparation from assertions. Root filtered CLI recipes become `npm run test:cli -- ...`; root default framework and all scopes are accurately named. Keep done's authoritative current-SHA CI gate and explicit reported local evidence procedure; reflect framework and board evidence without reducing merge requirements. Regenerate workbench output through its build; do not edit providers. AGENTS.md keeps one concise runner row and generated inventory mechanics. Internal guidance tests cover these sources now; replacement CLI guidance assertions remain in F4's product commit, and CI integration assertions remain F6's checks. No internal commit edits product tests to make its checks pass.
  - **Consumes:** `scripts/run-tests.js public selectors: framework|cli|vitest|scripts|bats|package|board|board-e2e|all; CLI watch/coverage modes` (F2).
  - **Validation:** L5 source guidance assertions RED-to-GREEN in built-ins tests, author ruler for each skill, graph/build warnings baseline and workbench compilation. Run the focused internal entrypoint/guidance test file through Docker before commit. Product test/config comment assertions are staged for F4/F5 rather than claimed complete here. Parent dispatches one batched independent prompt review after delivery.
  - **Produces:** `completed agnostic guidance sources and source-guidance RED-to-GREEN evidence`.

#### T4 — Repository-local CLI and board boundaries (design: Scope, Command Contract)

- **F4** [product] — Modify `cli/package.json`, `cli/vitest.config.js`, `cli/tests/helpers/global-setup.js`, `cli/tests/global-setup.test.js`, `cli/tests/run-tests.test.js` and `cli/tests/package-smoke.mjs`. Route CLI-local run/watch/coverage/package scripts to the root dispatcher with their existing scope. Authorize global setup before building; guard direct package smoke before packing or creating mutable state. Replace obsolete runner/native-override and guidance assertions with approved policy/selection contracts without weakening isolation, sidecar teardown, worktree or first-failure regression coverage. Updated guidance assertions read the sources already committed in F3. Propagate and enforce the validated outer selection/active leaf for global setup and smoke. Remove stale environment recommendations in test/config comments. Tests under cli may import the root built-ins policy module for repository-local use; shipped CLI runtime must not acquire a dependency on root scripts.
  - **Consumes:** `test-context.cjs authorization: Linux container context + read-only receipt + matching suite, or explicit Linux github-actions context` (F1).
  - **Consumes:** `scripts/run-tests.js public selectors: framework|cli|vitest|scripts|bats|package|board|board-e2e|all; CLI watch/coverage modes` (F2).
  - **Validation:** CLI portions of L3.1–L3.3/L3.5, L1 receipt leaf integrations and replacement runner/global-setup assertions; CLI coverage export and functional CLI watch. Run root `npm test` full framework gate in Linux Docker before this product commit, including CLI guidance checks against F3, scripts and package smoke. Guidance's RED evidence belongs to F3 before prose implementation; F4 consumes that evidence and asserts the completed guidance rather than falsely claiming a new RED. Other new behavior assertions execute RED before their own fixes.
  - **Consumes:** `completed agnostic guidance sources and source-guidance RED-to-GREEN evidence` (F3).

- **F5** [product] — Modify `board/package.json`, `board/vite.config.ts` and `board/playwright.config.ts`; create `board/test/test-context.test.ts`. Route board-local test/E2E through central dispatch and remove host-mutating test lifecycle hooks. Keep normal build/runtime recipes functional. Guard mutation-bearing test configuration before Vite plugins or Playwright fixtures run; separate test-only authorization from ordinary Vite build/dev, which remain supported. Propagate and enforce validated outer selection/active leaf in board and Playwright configs. Preserve existing built-server fixture semantics, three viewport projects and isolated mutable native-operation fixtures. Configure report paths the transport can export, including retained failed-run traces.
  - **Consumes:** `test-context.cjs authorization: Linux container context + read-only receipt + matching suite, or explicit Linux github-actions context` (F1).
  - **Consumes:** `scripts/run-tests.js public selectors: framework|cli|vitest|scripts|bats|package|board|board-e2e|all; CLI watch/coverage modes` (F2).
  - **Consumes:** `.test-artifacts/<suite>/<run-id>/ allowlisted coverage and browser reports` (F2).
  - **Validation:** Board portions of L3.1–L3.5 and L1 group-leaf integrations RED-to-GREEN, real board/browser no-match and preparation behavior, TypeScript/unit and full built-app E2E, plus root `npm test` framework gate before this product commit. Direct unauthorized configs refuse without runtime/fixture writes; ordinary build/dev config still loads. Use F2's dependency/browser image, never old-image board acceptance.

#### T5 — Explicit CI integration (design: Key Decisions)

- **F6** [internal] — Modify `.github/workflows/ci.yml` and `scripts/tests/test-entrypoints.test.cjs`. Declare `CODEADD_TESTS_CONTEXT=github-actions` explicitly on both existing Ubuntu test jobs/steps, remove native override authority, and invoke canonical suite commands without recursive dispatch. Preserve no-bash guard, negative control, existing job IDs, pinned Node and independent board coverage. Ensure dependencies/browser installation and preparations satisfy workers; avoid duplicate suite execution after npm test changes scope. Test authorized Linux CI behavior in a Linux container with explicit environment and no container receipt; do not claim an actual hosted CI run until one exists.
  - **Consumes:** `test-context.cjs authorization: Linux container context + read-only receipt + matching suite, or explicit Linux github-actions context` (F1).
  - **Consumes:** `scripts/run-tests.js public selectors: framework|cli|vitest|scripts|bats|package|board|board-e2e|all; CLI watch/coverage modes` (F2).
  - **Validation:** L4.1/L4.2 RED-to-GREEN and full L6; workflow scope assertions, simulated authorized CI integration, missing opt-in/non-Linux refusal and no-bash compatibility. Full `npm run test:all` runs in Linux Docker before commit; no layer gate is waived.

### Does NOT Include (important!)

- A native local escape hatch or Docker-unavailable fallback.
- Arbitrary shell interception or an anti-spoofing security sandbox.
- Installed framework consumers' test-environment policies or CLI runtime imports of repository test helpers.
- Unrelated test assertions, dependency upgrades, board UI changes or changes to existing archived deliveries.
- Deletion/modification of `wt-compact-backlog-reads/` or other user work.
- Automatic done/merge. Publication follows build's actual PR state and applicable user constraints.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Who selects the environment? | Central scripts on every supported root/subproject entrypoint | Design, Proposed Solution; prompts stay agnostic |
| Local native override? | Refuse; no fallback | Intent, Decided |
| Default versus exhaustive scope? | Framework CLI/scripts/package; all also board typecheck/unit and built E2E | Design, Command Contract |
| Focused iteration? | Individual tool-native argv; groups/package reject unsupported filters; no-test run cannot pass | Design, Command Contract |
| Authorized execution? | Linux + explicit context; container requires dispatcher read-only receipt and matching request; CI requires GITHUB_ACTIONS=true, CI=true and explicit github-actions context | Design, Execution Mechanism, authorization predicates |
| Watch and reports? | Synchronized isolated copy; dependency-change restart; allowlisted suite/run-scoped export even after failure | Design, Execution Mechanism |
| Continuation? | Automatic plan/build with independent reviews; deciding/hard stops and merge still wait | Intent, Decided |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Consistent local Linux evidence and protected generated state | Native local fallback and dependency-free first test startup |
| Board/browser coverage under the same contract | Small CLI-only image |
| Useful watch and persistent failure evidence | Simple static-copy synchronous transport |

Prompt-only enforcement and Windows-only defaults were rejected in the approved design: both leave supported local native routes. Central dispatch implements the already-selected alternative; planning introduces no new environment choice.

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Recursive npm dispatch or prehooks mutate host | Medium | F1 distinct worker tools; F4/F5 routing; L3 marker-tool and generated-state checks |
| Group receipt authorizes wrong leaf or nested test process inherits wrong suite | Medium | F1 binds receipt to canonical worker request and validates selected group membership for tool guards; L1 includes mismatch and group cases |
| Watch loses deletes or races writes; stale dependencies | Medium | F2 serialized debounce/sync and manifest termination; L2 real edit/add/delete and restart evidence |
| Filter shell injection or zero-match false pass | Medium | F1 argv-native execution and tool-result no-match handling; L1 hostile/spaced arguments and skipped-only cases |
| Image/browser preparation unavailable | High initially | F2 cache all manifests/locks and image inputs; explicit unavailable status; no fallback; full L6 Docker evidence required |
| Export failure masks assertion failure or copies generated sources | Medium | F2 allowlist and status preservation; L2 failed-suite artifact tests, host state hashes and concurrent destinations |
| Strict guards reject normal board build/dev | Medium | F5 test-only guard boundary; L3 non-test config load smoke |
| CI generic flags unlock local workers | Medium | F1 exact predicates; F6 explicit job opt-in; L1/L4 negative controls |
| Updated tests accidentally weaken existing regression proof | Medium | F4 preserves sidecar/worktree/isolation/failure assertions; L6 full framework run |
| Internal/product block ordering leaves transient old policy tests red | Medium | F3 guidance commits before F4 replacement assertions and full framework gate; focused built-ins checks cover internal F1–F3, full framework gates cover product F4/F5, full all covers F6; no gates waived |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `scripts/run-tests.js` | internal | modify | F1 worker contract; F2 public selection and lifecycle transport |
| `scripts/test-context.cjs` | internal | create | F1 shared authorization |
| `scripts/test-worker.cjs` | internal | create | F1 direct authorized tool/preparation execution |
| `scripts/tests/test-context.test.cjs` | internal | create | F1 policy negative controls |
| `scripts/tests/test-worker.test.cjs` | internal | create | F1 suite/argv/aggregate proof |
| `scripts/test-transport.cjs` | internal | create | F2 image/copy/watch/export transport |
| `scripts/tests.Dockerfile` | internal | modify | F2 Linux dependencies and Chromium |
| `scripts/tests/test-transport.test.cjs` | internal | create | F2 synchronization/export/isolation proof |
| `scripts/tests/test-entrypoints.test.cjs` | internal | create/extend | F2 root routes; F3 recipes; F6 CI |
| `package.json` | internal | modify | F2 complete public command map |
| `.gitignore` | internal | modify | F2 suite/run-scoped report output |
| `cli/package.json` | product | modify | F4 subproject dispatch |
| `cli/vitest.config.js` | product | modify | F4 remove obsolete native recommendations, retain projects |
| `cli/tests/helpers/global-setup.js` | product | modify | F4 authorize before build, retain sidecar guard |
| `cli/tests/global-setup.test.js` | product | modify | F4 strict setup authorization |
| `cli/tests/run-tests.test.js` | product | modify | F4 approved runner contract, completed F3 guidance and preserved regressions |
| `cli/tests/package-smoke.mjs` | product | modify | F4 direct smoke authorization |
| `board/package.json` | product | modify | F5 dispatch and remove test prehooks |
| `board/vite.config.ts` | product | modify | F5 early test-only guard |
| `board/playwright.config.ts` | product | modify | F5 authorize before fixtures and configure browser report |
| `board/test/test-context.test.ts` | product | create | F5 board guard/normal config regression |
| `.github/workflows/ci.yml` | internal | modify | F6 explicit native Linux authorization and suite scope |
| `AGENTS.md` | internal | modify | F3 concise runner overview |
| `workbench/skills/add-framework-product-layer/SKILL.md` | internal | modify | F3 agnostic recipes; MEDIUM direct-caller risk |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F3 accurate evidence/refusal/scope; MEDIUM direct-caller risk |
| `workbench/skills/add-product-artefact-renaming/SKILL.md` | internal | modify | F3 CLI-scoped recipe; MEDIUM direct-caller risk |

Other rows are outside artefact-graph coverage, so their risk is NOT VERIFIED by that graph, not LOW. Source inspection confirms high integration sensitivity for dispatcher, guards, package scripts and CI; L1–L6 operationalize it. No removed or renamed source files. Locks are image inputs, not planned dependency edits. Generated provider/runtime/build outputs are not authored changes. Build close-out writes one changelog and ledger through its owning skill, outside these implementation F-blocks.

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Before each behavior implementation, add its meaningful assertions and run them against the current implementation in the existing isolated Linux Docker transport/image. Capture the named failures, then fix and rerun. Characterization cases already passing are recorded separately, never claimed RED. Tests invoking a stub command or pure decision function may simulate other host platforms; actual local test execution is always in Linux Docker.

**Bootstrap (B2):** Before editing F1, retain the baseline runner/transport outside the source tree in a unique scratch directory and record its existing image tag, exact tar exclusions, Docker argv and working-directory behavior in the ledger. First RED invocation uses baseline `CODEADD_TESTS_RUNNER=docker` with `node scripts/run-tests.js scripts scripts/tests/test-context.test.cjs` (or test-worker file). Retain an executable baseline transport harness accepting the current source root and focused file; it must not resolve REPO_ROOT relative to a relocated runner accidentally. It packs the current source into a new tar each invocation, extracts into `/code` in the old Linux image, preserves image CLI dependencies, maps ordinary `.git` read-only or uses existing `/gitcommon` worktree remap plus replacement `.git`, clears NODE_OPTIONS, and sets GIT_OPTIONAL_LOCKS=0. No host checkout bind mount or host test process is used.

Before strict F1 authorization lands, the baseline bootstrap executes the new focused Node tests inside that isolated container. After it lands, the retained harness additionally creates a valid canonical scripts selection receipt with leaves [scripts], mounts it read-only at `/run/codeadd-tests/context.json` outside `/code`, sets CODEADD_TESTS_CONTEXT=container and propagates outer scripts/active scripts to the worker/test process. CLI real-tool probes use a separate cli selection receipt and active cli. The baseline transport then remains executable independently of the modified dispatcher throughout F1/F2. Negative predicate tests inject invalid contexts internally; they do not bypass host policy. Record full expanded bootstrap argv, receipt and cleanup in the ledger before first implementation, and retain them until updated transport is GREEN. Do not set github-actions flags on the host. No tests run during plan revision.

### L1 — Authorization, selection and worker behavior (F1, RED → GREEN)

1. Local linux/darwin/win32 all select Docker; native override refuses; unknown overrides/contexts refuse. RED: Linux currently selects native and native override succeeds.
2. Direct workers accept only exact approved predicates. Reject generic CI, copy marker, incomplete/missing receipt, wrong suite, non-Linux, conflicting/unknown context and GitHub Actions without opt-in. Container ignores generic inherited CI flags but refuses an explicit conflicting context. RED: global setup currently accepts truthy CI/copy and shared context validator is absent.
3. Validate receipt canonical outer selection and exact deterministic leaves; worker outer request must match selection exactly. Test framework→cli/package and all→board/board-e2e child guards, wrong active tool leaf, unrelated leaf refusal, forged leaf list, wrong outer request, and vitest→cli/bats→scripts alias canonicalization. Propagate validated selection/active leaf to CLI setup, package smoke and board configs in F4/F5. F1 exercises these tool boundaries with stubs; F4/F5 exercise actual guards. Valid explicit Linux github-actions path succeeds without container receipt. These are policy behavior checks inside Docker, not host CI execution.
4. Assert exact framework/all suite lists and legacy aliases; reject group arguments with individual alternatives and package unsupported options. RED: only vitest/scripts/all exist.
5. Run fixture tools receiving spaced, apostrophe, Unicode and shell-metacharacter argv; compare decoded argv and prove no side-effect sentinel appears. Node valued flags stay before file paths. RED: Vitest uses plain text join.
6. Tool/preparation stubs prove preparation happens before configs/assertions, no recursion, every finite group member runs even after a failed assertion suite, first nonzero status wins, signals cannot pass, and preparation refusal is identified separately.
7. F1 real CLI zero-file/zero-name and scripts all-skipped selections cannot return a passing gate, using only tools available in the retained image. F1 board/browser cases use stubs. F2 real board/browser preparation and no-match probes use the expanded image; F5 completes guarded public board/browser acceptance. RED where the current tool path permits skipped-only success; passing tool-native no-file refusal is characterization, not an invented RED.

### L2 — Image and transport behavior (F2, RED → GREEN)

1. Hash identity changes with every root/CLI/board manifest and lock and Dockerfile/image input. Assert CLI/board Linux dependencies and Chromium are image-owned. RED: tag includes CLI inputs only; board/browser absent.
2. Actual copied worker sees edited/new files, then deletes disappear; generated/runtime/providers/deps/reports/Git/nested checkouts do not overwrite prepared state. Concurrent runs use distinct scratch, receipts, containers and output destinations. RED: current static tar copy never synchronizes.
3. Watch executes tool-native reruns after edit/add/delete; dependency manifest change stops with restart message; SIGINT/SIGTERM cancels sync, stops container and removes scratch. Use short-lived fixture tests with bounded waits and diagnostic timeouts, not manual observation alone.
4. Successful coverage and intentionally failing browser/fixture tool runs export only allowlisted reports; retain suite failure status; never export build/runtime/source state. RED: no exports exist.
5. Existing tar-copy/no-same-owner/read-only Git/worktree mapping and NODE_OPTIONS isolation remain characterization regression gates. Missing Docker/image/dependencies refuses without native child launch. Docker CLI stub verifies no fallback; actual Linux daemon is required for acceptance.

### L3 — Entrypoints and guard ordering (F2 root, F4 CLI, F5 board; RED → GREEN)

1. Assert root npm command map matches design exactly and each subproject test/watch/coverage/E2E/package command dispatches with correct scope and argv. Exercise scripts using marker tools in a copied fixture to detect recursion or direct native tool launch. RED: current defaults and subproject scripts differ.
2. Snapshot host generated/runtime/provider/sidecar/fixture state before root and subproject calls; state remains unchanged except allowlisted reports. Refusal before Docker availability check must also leave it unchanged. RED: board prehooks write host runtime.
3. CLI direct global setup/package smoke and board direct test configs reject unauthorized contexts before writes, then succeed under valid worker authorization. Sidecar teardown still detects deliberate drift. RED: generic flags authorize CLI, board configs lack guards.
4. Ordinary board build/dev config remains usable without test authorization; board unit filters retain TypeScript validation; E2E uses built assets and existing fixture servers/viewports.
5. CLI run/watch/coverage and board test/E2E work from their subdirectories as well as root. Existing legacy vitest/bats selector regressions remain green.

### L4 — Explicit CI authorization (F6, RED → GREEN)

1. Parse workflow jobs and assert both Ubuntu test contexts explicitly opt in, scope is complete without duplicate default framework execution, native override is absent, and no-bash/negative control/job IDs remain. RED: current workflow has native overrides and no context.
2. In an isolated Linux container, simulate native GitHub Actions worker context with exact flags, run focused suites through dispatcher, and show no nested Docker request. Repeat missing opt-in/CI/GITHUB_ACTIONS and non-Linux predicate negative controls. Simulated flags inside Docker are authorization evidence, not a claim of hosted CI.

### L5 — Guidance and graph consistency (F3 source guidance, F4/F5 product assertions; RED → GREEN)

1. Active affected skills use ordinary correct npm suite recipes; no native override, platform runner choice or host dependency prescription remains; file filters use individual CLI route. Done retains current-SHA CI evidence and reports unavailable versus actual assertion results. RED: current active prose contradicts this contract.
2. AGENTS.md has one concise runner row and current generated inventory. Existing comments in runner/image/configs/test headers agree with policy. Archived plans/designs are historical records, not cleanup targets.
3. Measure graph warnings once before F1; run `ADD_GRAPH_WARNINGS=1 node scripts/build.js` per F-block with no new warnings and compile workbench after F3. Parent independent auditors read all three skill changes in one batched delivery-mode dispatch; no self-audit substitutes for that pass. F3 internal tests assert source guidance; F4 updates CLI guidance assertions against that completed source before running its full framework gate. F5 completes board configuration/comment coverage. Assertions about not-yet-integrated product routes are not included in F3's focused check or reported GREEN early.

### L6 — Full behavioral acceptance (F1–F6 convergence)

1. `npm test` and `npm run test:framework` each expand to CLI, scripts and package smoke; `npm run test:all` adds board TypeScript/unit and built Chromium E2E. Full all execution passes in Linux Docker; equivalent group expansion is asserted without gratuitously repeating full suites.
2. Run each individual selector with a representative valid filter where supported, no-match filter, and group/package invalid filters. Compare actual exits and mutation state to L1–L3 contract.
3. Run CLI coverage, a controlled failing report-producing fixture, CLI watch edit/add/delete/cancel, manifest restart, ordinary checkout and temporary Git worktree execution; retain suite/run report locations and cleanup evidence. Fixture failure is expected proof, not a red delivery gate.
4. Run explicitly authorized CI-context proof inside Linux Docker and preserve ordinary suite status. Actual GitHub Actions is only reported after parent-approved publication and a hosted run on the tested SHA.

**RED expectations against current tree:** L1 policy/group/argv, L2 dependency/watch/export, L3 routes/guards/prehooks, L4 opt-in and L5 guidance fail today for the reasons named above. L6 is final acceptance, not a claim all full suites must be run failing before implementation. Existing isolation/sidecar/Git/built-server correctness is preserved characterization.

**GREEN = all applicable levels pass after F1–F6, including actual finite framework + board + Chromium execution and functional watch/export evidence in Linux Docker.** Missing Docker/preparation evidence never fulfills GREEN.

## Execution Order

1. **F1 [internal]** — establish authorization and worker contracts; focused L1 passes before commit.
2. **F2 [internal]** — consume workers for public root dispatch and transport; L2 and root L3 pass before commit.
3. **F3 [internal]** — align guidance before product full-suite gates; source-only L5 and focused internal tests plus workbench build pass before commit.
4. **F4 [product]** — route/guard CLI and replace policy/guidance assertions against committed F3 sources; CLI L1/L3, coverage/watch and full root npm test framework gate pass before commit.
5. **F5 [product]** — route/guard board; board L1/L3, real preparation/no-match, TypeScript/unit/E2E and full root npm test framework gate pass before commit.
6. **F6 [internal]** — opt existing CI into completed selection/policy; L4 and full L6 via npm run test:all pass before commit.

Each F-block includes its own tests; observe RED before its implementation, GREEN before its commit. No standalone committed RED-test F-block. Internal F1–F3 use their exact focused checks above while old CLI policy assertions await F4; do not describe those checkpoints as full-suite green. F3 commits guidance separately from F4 product assertions, so F4's required full root npm test has no dependency on later prose edits. F4 and F5 each run the product full-framework gate; after F5 all supported entrypoints converge, and F6 runs full all plus CI authorization integration. Layer-default gates apply without waiver; no global constraint overrides independent review, commit-validation or hard-stop rules.

Record one commit per F-block, precise validation results and rulings in the ledger. Internal blocks must leave no tracked `framwork/` changes; product tests remain repository-local and do not change installed-user policy. All local test checks, including build-adjacent assertion suites, execute in Linux Docker; ordinary build generation is not itself a test run.

## Reviewer Handoff

Parent's single plan review with `kind: plan`, `layer: both` returned fix-then-ok. Accepted B1/B2/A1 fixes are applied here; no rereview is dispatched. Parent dispatches cold readback before F1 and independent conformance/completeness/side-effects plus batched prompt audit once after the final F-block.

Build ledger/evidence must retain files per F-block, named RED/GREEN outcomes, Docker image and command, proof levels, reports and any departure/ruling with cost if wrong. Use the owning build/ledger mechanism rather than introducing a new review companion document.

Actively hunt:

1. A claimed RED-first assertion written only after the fix or executed natively on the host.
2. Board hook/config mutation before authorization; nested npm recursion or package smoke without built runtime.
3. Generic CI/copy/native override accidentally authorizing direct local workers.
4. Shell parsing of tool filters, group receipt mismatch and zero-selected/skipped-only false passes.
5. Watch on a static copy, missed deletes, stale manifest dependencies, process leaks or generated-state synchronization.
6. Missing failure reports, overwritten concurrent output, or exit status replaced by cleanup/export success.
7. Full framework gates skipped at product F4/F5, guidance delayed past F4, or old-image board acceptance claimed before F2 dependencies are available.
8. Claims of actual hosted CI based only on simulated environment; publication/merge beyond approval.

## References

- Design/intent pair in Context.
- `docs/deliveries/2026-09-21T001942-PLAN--parallel-tests-in-one-container/` — isolation, tar copy, worktree remap, sidecar guard and two projects.
- `docs/deliveries/2026-10-05T152826-PLAN--native-node-framework-scripts/` — native Node script harness and no-Bash boundary, not native local environment authority.
- `docs/deliveries/2026-09-11T005514-PLAN--vitest-fixture-scope/` — fixture isolation and focused validation.
- `docs/deliveries/2026-09-10T230600-PLAN--fast-local-bats/` — superseded history, no return to Bats.
- Parent discovery: backlog-board-002-board-app — built-app browser evidence and existing board/server contract.

## Next Steps

Parent: accepted review fixes are applied; emit required plan completion and hand off `/add-framework--build local-tests-linux-container` under automatic delivery. Dispatch cold readback before implementation. No build/test execution is authorized by this plan-only delegation.

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-06 | Initial draft for parent independent review; six layer-tagged blocks and Linux-only RED-first evidence |
| 2026-10-06 | Apply fix-then-ok B1/B2/A1: guidance F3 precedes product F4/F5 full gates; retain executable old-image isolated bootstrap with read-only strict-context receipts and staged real-tool coverage; define exact canonical outer selection and deterministic authorized active leaves. No rereview. |
| 2026-10-06 | Implemented F1–F6 plus F3a in 0f79083..e355b91; parent accepted audit corrections F7/F7a/F8/F9 in 8727010..69993ce. Final Linux Docker acceptance exit0: CLI1890, scripts654, package smoke, board126+typecheck, Chromium163 passed/20 viewport skips. Review24 findings:12 applied/12 pre-existing prompt items rejected; no reaudits. Changelog: docs/changelog/2026-10-06T183803-update-local-tests-linux-container.md. |

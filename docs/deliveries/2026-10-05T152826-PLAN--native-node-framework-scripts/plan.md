# Plan: Native Node Framework Scripts — remove Bash from runtime and verification

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-05
> **Delivery:** confirm
> **Ticket:** 0022B

## Objective

Everyone using Code-Addiction will use Node as the common runtime for framework scripts on Windows, macOS, and Linux. Agent workflows, board operations, and framework maintenance will preserve their existing behavior while removing their dependency on Bash.

**When this build is done:** Every useful framework-owned shell capability has a tested native Node route; redundant or useless entries have an evidenced disposition; installed agent workflows and repository test/release entry points run without Bash, WSL, or Docker as a requirement. Behavioral cases and Red/Green evidence make future changes auditable.

**Ticket done when:** Nenhum comando, skill, agente ou script do repositório executa um .sh: `grep -rn "bash .codeadd/scripts" framwork/.codeadd workbench` e `grep -rn "\.sh\b" scripts/*.js` não retornam nenhuma chamada ativa; cada .sh removido tem suíte Bats portada para o módulo Node correspondente com os mesmos casos (verificado por relatório de caso preservado/substituído/exclusivo), exatamente como o predecessor fez com backlog.bats; delivered.sh tem equivalente Node e scripts/graph.js e mcp/engine.mjs o alcançam sem spawn de shell, com `node scripts/graph.js history <artefact>` respondendo no Windows sem login shell e dentro de uma worktree; next-id.sh e status.sh convergem para uma implementação Node única e NEXT_ID_AGREE passa a comparar Node contra Node; e `npm test`, `npm run test:scripts` e `npm run release` passam numa máquina Windows sem Git-Bash e sem WSL no caminho.

## Context

Shell-mediated Node resolution and worktree path handling failed during recent deliveries. Bats process creation made Windows test runs exceed 30 minutes; current root test tooling defaults to Linux containers on Windows. Native backlog and board work already supplies the migration precedent.

Every design decision below comes from the reviewed documents. This plan operationalizes them rather than reopening them.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-05T151140-native-node-framework-scripts.md` | Objective, contracts, inventory/callers, usage retirement rule, TDD, runtime/platform policy, worktree/release constraints |
| `docs/brainstorming/2026-10-05T151140-native-node-framework-scripts-intent.md` | Architectural path, settled decisions, confirm delivery, ticket and fresh-context execution request |

No `docs/strategy/` documents were found. AGENTS.md, the product ecosystem/resource-path owners, archived deliveries and current source were used. Layer-filtered product/internal history queries failed (`delivered.sh exited 127`): historical status is NOT VERIFIED, not an empty result. Archived plans remain documentary evidence.

The user explicitly requested a full plan now, to execute in a fresh context until ready to open a PR. Do not build in this planning session. In the execution context, the user's build invocation may authorize proceeding through checkpoints, but uncertainty, intentional contract changes and existing hard stops still require decisions. Do not open a PR, merge or publish a release unattended.

## Global Constraints

- "Preserve public arguments, output fields and meaning, exit codes, persisted formats, defaults, and failure behavior." (Design, Proposed Solution)
- "Shipped runtime modules use Node built-ins only and require no project dependency install." (Design, Proposed Solution)
- "Node >=22.19.0 unified minimum; Node 24 LTS recommended; native Windows/macOS/Linux CI at the exact minimum and Node 24." (Design, Scope)
- "Implementation occurs in a dedicated development worktree on one branch." (Design, Worktree and Release Constraints)
- "Bring uncertain deletion candidates to the user before deciding." (Design, Usage Audit and Retirement Rule)
- "No dependency on Bash may remain in the final suite." (Design, Behavioral Mapping and TDD)
- "Tests alone do not prove useful production use. An empty graph answer is insufficient evidence for deletion." (Design, Usage Audit and Retirement Rule)
- "Edit the source, never the built copy." (AGENTS.md, workbench source/output rule)
- Scripts use literal `.codeadd/scripts/` paths; command/skill references use resource placeholders. (AGENTS.md, authoring rules; product resource-path owner)
- `mcp/` and shipped scripts are product; root tooling/workbench/AGENTS are internal. (AGENTS.md, anatomy)
- One commit per F-block and the build ledger's resume/hard-stop rules apply. (Internal build ledger owner)

## Problem

1. Native Node processes call Bash to reach existing embedded Node logic and delivery data.
2. Prompt/script helper calls are only partly visible in the artefact graph.
3. Multiple ID calculators and exact shell invocation assertions make a blind extension rename incorrect.
4. Bats, GNU parallel, container defaults and release scripts retain shell dependence after runtime conversion.
5. Unused standalone candidates and absent dedicated suites require explicit evidence rather than automatic preservation or deletion.

## Proposal

Use `.cjs` shipped entries and built-ins-only shared modules, preserving each command-line boundary. Root Node entries use `.cjs` to be unambiguous in root/CommonJS and subprocess tests. Tests use the built-in `node:test` runner under `scripts/tests/`, outside the shipped scripts subtree. Existing Vitest integration/source-contract tests remain and adapt to native boundaries. Shared test helpers use built-ins and temporary repositories; script processes use `process.execPath`, explicit cwd, argv arrays and `shell:false` where possible. Native Windows npm/tool resolution must be deliberately handled without a Bash bridge and verified, not assumed.

Introduce native entries alongside shells first. Transfer callers only when their replacement and mapped tests are Green. Old Bats suites become explicitly nonexecutable historical comparison material pending F31 removal; they are never a runnable passing acceptance route. Transfer and pass every applicable case before deleting its runtime source. No end-state shell compatibility wrappers. Do not indiscriminately alter historical archives, unrelated third-party installer URLs, or generic installer shell-file fixtures.

### Current State and Graph Risk

Risk grades use direct graph callers: LOW=0, MEDIUM=1–2, HIGH=3+. These are declared-caller grades, not deletion permission or implementation complexity. All 19 script dependency queries returned empty; executable helper dependencies are separately source-verified. Unbounded impact saturates near 99–100 dependants and is context only.

| Script | Direct graph callers | Grade | Extra executable/text evidence |
|---|---:|---|---|
| build-ledger | 3 | HIGH | Ledger body/fixtures |
| build-setup | 3 | HIGH | Calls main-branch helper |
| converge-gates | 3 | HIGH | Calls QA evidence; smoke caller |
| delivered | 3 | HIGH | Graph, MCP history/touched, internal done |
| done | 4 | HIGH | Main-branch/metadata helpers |
| get-branch-metadata | 1 | MEDIUM | init/status/done callers |
| get-main-branch | 0 | LOW | init/status/build-setup/done callers |
| hotfix-gates | 4 | HIGH | Embedded Node and exact-source tests |
| init | 2 | MEDIUM | Main-branch, metadata and allocator calls |
| log-iteration | 0 | LOW | Authoring example; standalone purpose uncertain |
| log-jsonl | 0 | LOW | Active build/hotfix/review logging instructions |
| migrate-context-files | 2 | MEDIUM | Wiki/context permissions |
| migrate-ids | 0 | LOW | Standalone modes; no dedicated suite |
| next-id | 1 | MEDIUM | init executable; allocation tests elsewhere |
| qa-evidence | 7 | HIGH | converge caller plus optional QA fragment |
| qa-preflight | 2 | MEDIUM | Optional QA fragment |
| review-package | 3 | HIGH | Reviewer package boundary |
| status | 20 | HIGH | smoke, allocation parity, setup signals |
| task-brief | 2 | MEDIUM | Task input consumed downstream |

The design contains the complete named direct-caller table. Planning queried dependencies of build/done/hotfix/qa-setup/id-convention/knowledge-discovery and QA review fragments. Graph paths directly connect build→ledger and QA fragment→preflight. There is no graph path init→next-id or status→main-branch despite real executable calls. Root scripts, arbitrary subprocess calls, package scripts, workflows, tests and AGENTS are outside graph coverage. Additional active pull-request and TDD plan instructions are source evidence, not invented edges.

## Scope

### Includes

#### T1 — Worktree, usage audit and native test foundation

**Exact path notation and write ownership:** Bare shipped entry/core names in F3 and F6–F17 expand only under `framwork/.codeadd/scripts/`. Bare CLI test names expand under `cli/tests/`; product skill/reference, command, agent and fragment paths in Impact expand under `framwork/.codeadd/{skills,commands,agents,fragments}/` respectively. Workbench skills expand under `workbench/skills/<name>/SKILL.md`. All native domain tests expand under `scripts/tests/` and are written ONLY by F27 or a separately numbered [internal] follow-up block before the affected implementation change. F3–F17 consume these tests and never write root tests. CLI tests/configuration are product writes owned by F28 or a separately numbered [product] follow-up before an affected internal implementation change. Every block is single-layer by changed PATH, irrespective of behavior ownership. F28 may refine product tests within later product blocks only when meaningful Red precedes code changes and the ledger names the paths/cases.

**Shared explicit Consumes rule:** Each of F3–F17 consumes `native-domain-tests-v1` (F27) and `native-cli-tests-v1` (F28), in addition to its listed dependencies. F18/F19/F20/F21/F22/F23/F24/F25/F26/F29/F30/F31 also consume both test foundations. This rule supplies the full handoff for every implementation/acceptance block without assigning it cross-layer writes.

F1's L1/L2/L8 acceptance is its passing foundation/map/baseline checks only; its future end-state assertions run as separately recorded intentional Red. F1 creates `scripts/tests/harness.test.cjs` with actual harness/map self-tests; executing an assertion-free helper module is not a passing validation. F27 additionally owns `scripts/tests/migration-acceptance.test.cjs` for inventory/case-accounting/final-state assertions, no-Bash guard/negative-control and native Git/npm transport assertions in `scripts/tests/run-tests.test.cjs`, plus built-ins test-boundary instrumentation in `scripts/tests/helpers.cjs`. These activate at their assigned checkpoints; final runner/CI proof activates after F22 and does not make F27 depend on a future implementation. The tracked case map and ledger updates remain internal writes, using separate internal follow-up blocks whenever a product implementation exposes a needed test/map refinement.

- **F27** [internal] — Before implementations, create the complete native domain case transfer and meaningful behavioral Red in `scripts/tests/delivered.test.cjs`, `get-main-branch.test.cjs`, `get-branch-metadata.test.cjs`, `next-id.test.cjs`, `status.test.cjs`, `init.test.cjs`, `build-setup.test.cjs`, `build-ledger.test.cjs`, `task-brief.test.cjs`, `review-package.test.cjs`, `log-jsonl.test.cjs`, `qa-evidence.test.cjs`, `qa-preflight.test.cjs`, `converge-gates.test.cjs`, `hotfix-gates.test.cjs`, `done.test.cjs`, `migrate-context-files.test.cjs`, `log-iteration.test.cjs`, `migrate-ids.test.cjs`, `backlog.test.cjs`, `backlog-commit.test.cjs`, `release.test.cjs`, `create-release-tag.test.cjs`, `smoke-test.test.cjs`, `run-tests.test.cjs`. Maintain tracked `scripts/tests/native-script-cases.json`: enumerate every old Bats case (including backlog/backlog-commit), missing-suite modes, exact native file/test ID, observations and disposition. Existing native backlog tests must execute and pass directly; implementation-dependent cases have recorded meaningful Red before their capability is activated. Harness/self/map checks pass separately from intentional future Red. Tests for release/tag/smoke/runner must preserve substantive seams, not merely missing-file assertions. Validation: L1/L2 with checkpoint selection below.
  - **Consumes:** `script-disposition-map-v1`, `native-test-harness-v1` (F1).
  - **Produces:** `native-domain-tests-v1` — complete case map and native tests, with per-capability activation and recorded Red; this is NOT a claim that future implementation tests pass.

- **F28** [product] — Establish early CLI integration Red and checkpoint-aware configuration in `cli/tests/{build,build-artefact-graph,inventory,review-no-loops,graph-query,impact-question-touched-by,knowledge-discovery-question-first,delivery-index,mcp-engine,mcp-server,mcp-migration,backlog-id,backlog-publication,hotfix-diagnosis-review-contract,qa-reachability.smoke,qa-pipeline-umbrella,loop-consolidation-0070,product-close-out-parity,product-pipeline-parity,optional-review-build-final-review,close-out-hardening,agents-md-only,docs-knowledge-graph,run-tests,install.e2e,updater,installer,migrations,board-runtime,board-phase-writes}.test.js`, `cli/tests/fixtures/slot-membership-map-v2.json`, `cli/tests/helpers/global-setup.js`, `cli/vitest.config.js`, `cli/tests/package-smoke.mjs`. These paths are exact brace expansions. Separate passing harness/map/config checks from future runtime, recipe, install and final runner assertions; record meaningful Red before implementations. Keep isolation/copy protection while enabling checkpoint subsets without requiring final npm transport. Validation: applicable L2/L3/L4/L6/L7 harness checks only; future assertions remain separately selected Red.
  - **Consumes:** `native-domain-tests-v1` (F27); `native-test-harness-v1` (F1).
  - **Produces:** `native-cli-tests-v1` — product test/config foundation and explicit checkpoint selection/activation, not end-state Green.

- **F1** [internal] — Create the dedicated worktree/feature branch and bootstrap this plan's ledger/evidence in that checkout; create `scripts/tests/helpers.cjs` and the migration case/disposition map `scripts/tests/native-script-cases.json`. Copy the exact plan/design/intent bytes into the worktree because they are gitignored and absent from a new checkout. Read the build owner before branch setup; preserve user changes and use one branch for all checkpoints. Inventory all 22 shell entries and any test-only shell harness, audit callers/purpose/alternatives, record migrate/consolidate/delete decisions and unresolved candidates. Characterize original inputs/outputs before implementation. Read all bodies, not only headers; carry every existing Bats case and add missing branch cases. Root release/tag/smoke and next-id/migrate-ids need cases despite missing dedicated Bats suites. Record available baseline timings without forcing another multi-hour run. Add failing native end-state assertions and a test harness runnable directly before `test:scripts` is switched. Validation: L1, L2, L8.
  - **Produces:** `script-disposition-map-v1` — each original entry has caller/purpose evidence, disposition, old-case→native-case mapping, and approved/deferred exceptions.
  - **Produces:** `native-test-harness-v1` — built-ins-only helpers for temporary repos, argv/cwd execution, observations, deterministic fixtures and test selection.
  - **Produces:** `migration-baseline-v1` — environment, available timings, missing baseline evidence and pre-change isolation observations.

- **F2** [internal] — `scripts/build.js`, `scripts/inventory.js`: permit the intended built-ins-only native runtime closure through the existing shipped-source gate without broadly allowing arbitrary JS; graph discovery already accepts immediate CJS files. Include canonical native entries/shared modules in generated inventory as they appear; assert disk-derived inventory rather than hard-coded counts. Maintain the gate's rejection of unrelated code and correct source-only error guidance. Run F28 build/inventory checks locally: future entries may be absent and final shell-free inventory is not required yet. Validation: activated L2/build subset of L6 only.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-cli-tests-v1` (F28).
  - **Produces:** `native-script-build-support-v1` — approved native runtime files pass shipping gates and are inventoried/discovered correctly.

#### T2 — Delivery index and native adapters (first runtime checkpoint)

- **F3** [product] — `delivered.cjs`, `delivery-index-core.cjs`: migrate read/write/verify/repair/touched behavior from `delivered.sh`, reusing its existing embedded Node logic where behavior permits. Preserve schema ownership, probe/write/caller-error exits, ranking/caps, corpus exclusions, anchor repair, absent/damaged index handling, and complete/curated touched semantics. Export a side-effect-free core boundary; keep command-line results unchanged except retired interpreter-specific failures recorded in the map. Validation: L1, L3.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-test-harness-v1` (F1); `native-script-build-support-v1` (F2).
  - **Produces:** `native-delivery-reader-v1` — native read/write/verify/touched entry, shared implementation and preserved protocol.

- **F4** [internal] — `scripts/graph.js`: switch history to the native delivery reader, preserving parsed shape, layer filters, unavailable semantics, repair hints and caller overrides with documented mapping of obsolete Bash overrides. Execute F28 native worktree/path tests without writing CLI files. Validation: L3.
  - **Consumes:** `native-delivery-reader-v1` (F3); `native-cli-tests-v1` (F28).

- **F5** [product] — `mcp/engine.mjs`, `mcp/corpora.mjs`, `mcp/server.mjs`, `cli/tests/mcp-engine.test.js`, `mcp-server.test.js`, `mcp-migration.test.js`, `delivery-index.test.js`: migrate both history and touched, repo/installed reader discovery and executable overrides. Maintain graph/MCP equality and degradation behavior; no shell spawning to reach the core. Installed resolution must not depend on repository-relative files absent from npm/release output. Validation: L3, L6.
  - **Consumes:** `native-delivery-reader-v1` (F3).

#### T3 — Shared Git context and allocation/status

- **F6** [product] — `get-main-branch.cjs`, `get-branch-metadata.cjs`: migrate Git helper behavior and shared built-in plumbing if needed. Preserve fallback order, detached/no-repository behavior, parsing and outputs. Extend existing `backlog-git.cjs` only if it actually provides the same semantics; do not force public interfaces to agree. Validation: L1, L4.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-test-harness-v1` (F1).
  - **Produces:** `native-git-context-v1` — preserved main-branch/metadata entry behavior usable by dependent scripts.

- **F7** [product] — `backlog-id.cjs`, new `next-id.cjs`, `cli/tests/backlog-id.test.js`, `backlog-publication.test.js`: use one canonical allocator and preserve raw damaged-JSON extraction, directory scans, global counter and exhaustion/read failures. Preserve distinct wrapper contracts: next-id single-uppercase-letter validation/exit 1 versus status named-prefix validation/exit 2. Do not silently normalize whitespace or count work_id contrary to existing canonical behavior. Escalate demonstrated conflicting old semantics for approval rather than selecting one arbitrarily. Validation: L1, L4.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-test-harness-v1` (F1).
  - **Produces:** `canonical-id-allocation-v1` — shared scan/allocation semantics with preserved public adapters and characterized boundaries.

- **F8** [product] — `status.cjs`, supporting built-ins-only status module(s) only if needed, `cli/tests/backlog-id.test.js`: migrate the full status surface including receipt staleness, feature/hotfix state, profile/context and ID outputs. Delegate allocation to the canonical core; preserve NEXT_ID_AGREE as Node-to-Node agreement and pair it with independent expected-result tests. Preserve frontmatter boundaries and absent/malformed state behavior. Validation: L1, L4.
  - **Consumes:** `canonical-id-allocation-v1` (F7); `native-git-context-v1` (F6); `native-test-harness-v1` (F1).
  - **Produces:** `native-status-protocol-v1` — all existing status fields and modes through Node, with shared allocation.

- **F9** [product] — `init.cjs`, `build-setup.cjs`: migrate setup/initialization with native helpers and allocator, preserving worktree/branch creation, validation, context materialization and mutation guards. Validation: L1, L4.
  - **Consumes:** `native-git-context-v1` (F6); `canonical-id-allocation-v1` (F7); `native-test-harness-v1` (F1).
  - **Produces:** `native-init-setup-v1` — preserved initialization/setup mutation and context contracts.

#### T4 — Build, logging, QA and close-out capabilities

- **F10** [product] — `build-ledger.cjs`: preserve duplicate rows, creation-only identity, read/append state, misuse exit 2 and refused-write exit 1. Internal ledger remains a separate owner. Validation: L1, L5.
  - **Consumes:** `native-test-harness-v1` (F1).
  - **Produces:** `native-ledger-protocol-v1` — preserved shipped ledger boundary.

- **F11** [product] — `task-brief.cjs`, `review-package.cjs`: preserve task scope and omitted/empty/populated arguments, packaging ranges and empty-commit handling. Test executable downstream inputs, not only source strings. Validation: L1, L5.
  - **Consumes:** `native-test-harness-v1` (F1).
  - **Produces:** `native-task-review-protocol-v1` — native task inputs and review packaging.

- **F12** [product] — `log-jsonl.cjs`: preserve append behavior, raw extra-field semantics, timestamp precision and output keys. Do not add validation/escaping as an unapproved behavior correction. Validation: L1, L5.
  - **Consumes:** `native-test-harness-v1` (F1).
  - **Produces:** `native-logging-protocol-v1` — preserved JSONL append contract.

- **F13** [product] — `qa-evidence.cjs`, `qa-preflight.cjs`: preserve evidence modes, containment/symlink rejection, promotion gates, receipt/probe output and exit distinctions. Characterize all mode branches, including ensure-ignore and working-baseline. Validation: L1, L5.
  - **Consumes:** `native-test-harness-v1` (F1).
  - **Produces:** `native-qa-protocol-v1` — native evidence/preflight operations retaining gates and receipt semantics.

- **F14** [product] — `converge-gates.cjs`, `hotfix-gates.cjs`: preserve gate outputs and mode-specific refusal/exit behavior; converge calls native evidence. Embedded Node is reusable but does not waive Red/Green evidence. Validation: L1, L5.
  - **Consumes:** `native-qa-protocol-v1` (F13); `native-test-harness-v1` (F1).
  - **Produces:** `native-gate-protocol-v1` — preserved convergence/hotfix gate results through Node.

- **F15** [product] — `done.cjs`: migrate context/default, commit-push, merge and cleanup modes. Preserve required merge SHA, linked-worktree start guard, staging boundaries and failure codes. Use disposable remotes for mutation tests. Validation: L1, L4, L5.
  - **Consumes:** `native-git-context-v1` (F6); `native-test-harness-v1` (F1).
  - **Produces:** `native-done-protocol-v1` — preserved close-out modes and guards.

- **F16** [product] — `migrate-context-files.cjs`: preserve ordered source selection, containment, write-before-delete, personal local-context treatment and partial-success rerun behavior. Validation: L1, L5.
  - **Consumes:** `native-test-harness-v1` (F1).
  - **Produces:** `native-context-migration-v1` — preserved context migration safety and reruns.

- **F17** [product] — `log-iteration.sh`, `migrate-ids.sh` and their selected native entries: execute their F1 dispositions. Retained entries become `log-iteration.cjs`/`migrate-ids.cjs`; consolidated entries transfer useful cases to the selected core/entry; demonstrably useless entries retire with ledger evidence. No uncertain deletion proceeds without user decision. A missing migrate-ids suite requires mode characterization, not an exemption. Validation: L1, L2, L5.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-test-harness-v1` (F1).
  - **Produces:** `native-audited-standalone-v1` — resolved standalone routes/dispositions with all useful cases preserved and passed before any deletion.

#### T5 — Atomic caller cutover and shell retirement

- **F18** [product] — Active commands, skills/references, agents and fragments listed in Impact: switch all script invocations/uses declarations/prohibitions to proven native boundaries. Keep safety/ownership and read-only permissions intact; update ID allocator descriptions and runtime requirements. Preserve optional feature/plugin slot identities and section membership. Inspect the dangling `architecture-discover.sh` instruction: prove whether it is obsolete and correct its route to the existing architecture discovery owner; if the intended capability is genuinely unknown, ask rather than invent a new twentieth shipped script. Validation: L6, L7.
  - **Consumes:** `native-delivery-reader-v1` (F3); `native-git-context-v1` (F6); `canonical-id-allocation-v1` (F7); `native-status-protocol-v1` (F8); `native-qa-protocol-v1` (F13); `native-gate-protocol-v1` (F14).
  - **Consumes:** `native-init-setup-v1` (F9); `native-ledger-protocol-v1` (F10); `native-task-review-protocol-v1` (F11); `native-logging-protocol-v1` (F12); `native-done-protocol-v1` (F15); `native-context-migration-v1` (F16); `native-audited-standalone-v1` (F17).
  - **Produces:** `native-product-recipes-v1` — all active product instructions/declarations use tested native routes, with original slot/toggle behavior.

- **F19** [internal] — Workbench sources listed in Impact: switch delivery-index and tag/runtime references, authoring examples, script gate guidance and test recipes. Preserve internal/product ownership distinctions and release approvals. Update inventory through its generator; do not edit root provider output. Validation: L6, L7.
  - **Consumes:** `native-product-recipes-v1` (F18); `native-delivery-reader-v1` (F3).
  - **Produces:** `native-workbench-recipes-v1` — native internal caller/guidance routes, with future final-runner recipes explicitly pending F22 activation.
  - Tag/release references for routes not yet implemented remain explicitly pending F21; do not activate an unproven invocation. F21 completes those internal caller changes before maintenance acceptance.

- **F20** [product] — Remove migrated/consolidated/retired `.sh` sources from `framwork/.codeadd/scripts/` only after ALL cases mapped from their Bats suites have transferred and passed through direct `node --test <exact native files>` and F3–F19/F30 applicable caller tests pass. Rebuild provider artefacts/graph and update product source-scanning/identity fixtures listed in Impact. Keep valid generic shell-byte fixtures; expand scanners to native files. Native tests remain outside distributed runtime; old Bats material is nonexecutable historical comparison pending F31. Validation: L1, runtime/install/recipe subsets of L6/L7 only; final L6 npm transport acceptance belongs to F22, not this gate.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-product-recipes-v1` (F18); `native-script-build-support-v1` (F2); `native-workbench-recipes-v1` (F19); `native-smoke-route-v1` (F30).
  - **Produces:** `native-runtime-cutover-v1` — no shipped shell entry and no active product/internal caller of retired runtime files.

#### T6 — Internal release, smoke and test transport

- **F30** [internal] — Execute BEFORE F20: create `scripts/smoke-test.cjs`, switch its internal callers and remove `scripts/smoke-test.sh` only after every original smoke assertion and mapped seam passes `node --test scripts/tests/smoke-test.test.cjs`. Consume native gates/status, preserve staging/pathspec refusal and subfeature plan placement, and use disposable repositories. Root smoke may not depend on a shipped shell surviving F20. No writes to root tests here; F27 owns them, with separate internal refinement blocks when needed. Validation: L1/L5 and applicable direct runtime/recipe subsets.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-gate-protocol-v1` (F14); `native-status-protocol-v1` (F8); `native-workbench-recipes-v1` (F19).
  - **Produces:** `native-smoke-route-v1` — mapped smoke behavior and caller route Green before runtime shell retirement.

- **F21** [internal] — New `scripts/release.cjs`, `scripts/create-release-tag.cjs`, root `package.json` release entry and `workbench/commands/add-framework--release.md`: migrate release/tag capabilities and remove `scripts/release.sh` and `scripts/create-release-tag.sh` after mapped Green. Preserve main/production transitions, branch restoration semantics, version/lock checks and annotated tag/notes/push. Translate `/tmp` notes handling to a portable temp convention while retaining a documented legacy-path adapter where applicable; classify platform-only paths in the case map. Do not call the user's real release remote. Execute F27 portable Git/gh/npm publication seam tests directly; root test changes need separate internal follow-up blocks. Validation: L1, L5, L8 applicable release subset.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-runtime-cutover-v1` (F20); `native-gate-protocol-v1` (F14); `native-status-protocol-v1` (F8); `native-test-harness-v1` (F1).
  - **Consumes:** `native-smoke-route-v1` (F30).
  - **Produces:** `native-maintenance-routes-v1` — native npm release/tag paths plus prior smoke proof verified against disposable repositories.

- **F22** [internal] — ONLY `scripts/run-tests.js`, root `package.json`, root `package-lock.json`, `scripts/tests.Dockerfile`: make `test:scripts` native and `test:all` run CLI plus native scripts with correct failure propagation. Preserve guarded isolated checkout copies, sidecar protection, test filtering and safe worktree Git handling. Windows defaults to native and does not probe/require Docker. Run F27 runner tests and F28 CLI isolation tests; no CLI/config or product transport-tree writes. Retire obsolete root Bats/GNU parallel/container configuration and deps only after the case map proves every original case transferred and passed, including `scripts/tests/backlog.test.cjs` and `scripts/tests/backlog-commit.test.cjs`. Retain generic optional Docker functionality only if independently useful, explicit and shell-free for these routes. Legacy selector `bats` may be a documented native alias if caller audit requires it; it must not execute Bats. Record intentional test-transport changes separately. Validation: L1, L2, L6, L8 local runner subset.
  - **Consumes:** `native-test-harness-v1` (F1); `script-disposition-map-v1` (F1); `native-runtime-cutover-v1` (F20); `native-maintenance-routes-v1` (F21).
  - **Produces:** `native-test-entrypoints-v1` — npm test/test:scripts/test:all work natively with isolation and nonzero forwarding.

- **F31** [product] — Remove `framwork/.codeadd/scripts/tests/*.bats`, `framwork/.codeadd/scripts/tests/run-tests.sh`, and `framwork/.codeadd/scripts/tests/test_helper/` only when the tracked case map proves complete transfer and direct native Green for every case, explicitly including backlog/backlog-commit. Remove other obsolete files in that product transport tree only after exact paths and dispositions are ledger-listed. No root runner/config writes. Recheck build/install assets exclude development tests and acceptance no longer references historical transport. Validation: L1/L2/L6/L7.
  - **Consumes:** `script-disposition-map-v1` (F1); `native-runtime-cutover-v1` (F20); `native-test-entrypoints-v1` (F22).
  - **Produces:** `native-test-transport-retired-v1` — complete proved case transfer with product Bats/helper tree removed.

#### T7 — Installation, runtime policy and final native proof

- **F23** [product] — `cli/tests/install.e2e.test.js`, `updater.test.js`, `installer.test.js`, `migrations.test.js`, `board-runtime.test.js`, `board-phase-writes.test.js`, `cli/tests/package-smoke.mjs`: prove fresh install, manifest-owned update/reinstall cleanup and relocated closure. Verify old managed shell scripts disappear, native entries/required cores are present, manual-file preservation remains, and no root development test dependency is needed for shipped script execution. Preserve installer/updater mechanism; modify production code only if a demonstrated migration defect requires it and record that scope explicitly. Validation: L6.
  - **Consumes:** `native-runtime-cutover-v1` (F20); `native-maintenance-routes-v1` (F21).

- **F24** [product] — `cli/package.json`, `cli/package-lock.json`, board and web package engine metadata/locks where needed: express the approved common Node floor and update visible CLI prerequisites coherently. Do not bump unrelated dependencies or framework version merely to change engines. Verify Node 22.19.0 actually installs/runs locked dependencies. Treat board/web as shipped product surfaces for package runtime declarations; their repository-only test workflow changes belong to F25. Validation: L6, L8.
  - **Consumes:** `native-test-entrypoints-v1` (F22).

- **F25** [internal] — `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/deploy-web.yml`, root engine metadata, `README.md`, `AGENTS.md`: all six Windows/macOS/Linux × exact Node 22.19.0/24 jobs run `npm ci` at root and `cli/`, required product/workbench builds, then root `npm test` AND `npm run test:scripts` through the guarded isolated native root runner. Include full applicable CLI integration/install/relocated runtime proof. Instrument framework/test subprocess boundaries to reject Bash while preserving native Git/npm transport; a negative control attempting Bash must be rejected. Do not achieve isolation by hiding required Git/npm. Align release/web/board jobs with the minimum without unnecessary browser matrix expansion. Update internal runtime/test instructions and regenerate AGENTS inventory. Execute prewritten no-shell guard checks and record timing; new test refinements require correctly tagged follow-up blocks. Validation: L6/L7 and local L8 configuration proof; actual six-job CI remains pending at PR question until authorized publication runs it.
  - **Consumes:** `native-test-entrypoints-v1` (F22); `native-runtime-cutover-v1` (F20); `migration-baseline-v1` (F1).
  - **Consumes:** `native-test-transport-retired-v1` (F31).
  - **Produces:** `native-ci-policy-v1` — six-job native matrix and internal policy documentation; remote execution status recorded separately.

- **F29** [product] — `cli/README.md`, `web/src/pages/docs.astro`, `web/src/pages/index.astro`: align product prerequisites and runtime/test recipes with the approved floor and proven native routes. Keep product docs coherent with internal CI policy; no workflow/root docs writes. Validation: L6/L7 applicable docs/build subset.
  - **Consumes:** `native-test-entrypoints-v1` (F22); `native-runtime-cutover-v1` (F20); `native-ci-policy-v1` (F25).
  - **Produces:** `native-product-runtime-docs-v1` — updated CLI/web runtime guidance.

- **F26** [internal] — Complete ledger/evidence and native end-state acceptance in the dedicated worktree. Run local gates once changes are stable, record all case dispositions and per-script Red/Green, compare available timings, and prepare the branch for PR. Request CI through the build owner's publication question; do not claim remote matrix Green before actual runs. If opening a PR is not authorized, report local completion and CI pending. Resume once authorized CI is available. No merge/real release or self-worktree removal. Validation: all L1–L8.
  - **Writes:** `docs/plans/2026-10-05T152826-PLAN--native-node-framework-scripts--ledger.md`; use this exact ledger for evidence unless the execution owner mandates another evidence location, which must be named there. No reviewer report file.
  - **Consumes:** `script-disposition-map-v1` (F1); `migration-baseline-v1` (F1); `native-runtime-cutover-v1` (F20); `native-maintenance-routes-v1` (F21); `native-test-entrypoints-v1` (F22).
  - **Consumes:** `native-test-transport-retired-v1` (F31); `native-ci-policy-v1` (F25); `native-product-runtime-docs-v1` (F29).

### Does NOT Include

- Redesigning public arguments/output/persisted schemas; explicit approval is needed for a discovered contract conflict.
- New board functionality or rewriting already-native backlog capabilities beyond shared allocator/test transport needs.
- Removing Git/npm/gh requirements or converting consumer application scripts.
- Blanket editing historical plans/deliveries or third-party shell installation URLs.
- Publishing tags/releases, opening a PR without permission, merging, deleting the executing worktree, or automatically closing 0021B.

## Validated Decisions

| Question | Decision | Ref |
|---|---|---|
| Runtime and platforms | Node >=22.19.0; recommend 24; Windows/macOS/Linux | Design, Key Decisions |
| Compatibility | Preserve public script contracts; shared internals | Design, Proposed Solution |
| How to understand outputs/regressions | Per-script map, contract header, native Red/Green cases | Design, Behavioral Mapping and TDD |
| Keep every script? | Audit purpose/callers; consolidate/delete with evidence; uncertain retirement asks | Design, Usage Audit |
| Delivery unit | One plan/branch, dedicated worktree, checkpoints | Intent and design |
| Installer cleanup | Existing manifest diff; test it | Design, Ecosystem Impact |
| Performance | Measure before/after; no arbitrary time limit | Design, Key Decisions |
| Execution now? | Plan only; fresh context executes up to PR question | User request and intent |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Native runtime and regression evidence | Node 18/20 and older Node22 support |
| Shared business logic | Independent duplicated shell calculators |
| Faster portable test execution | Bats as the required test transport |
| Audited retirement | A quick mechanical extension rename |

## Risks and Mitigations

| Risk | Probability | Operational mitigation |
|---|---|---|
| Implicit callers missed | High | F1, F18–F20; L6/L7 executable and instruction scans |
| Behavioral drift | High | Every runtime block L1 plus domain L3/L4/L5; map and Red before implementation |
| Shared allocator hides defects | Medium | F7/F8 L4 independent fixtures |
| Unjustified script deletion | Medium | F1/F17 disposition gate |
| Native Windows tool resolution | High | F21/F22 native executable fixtures and L8 |
| Release branch conflicts/publication | Medium | F21 disposable repos/remote stubs; L8 |
| Installed cores absent | Medium | F2/F5/F23 runtime closure and relocated package tests |
| Native suite mutates source | High | F22 preserves copy marker/sidecar safety; L6 |
| Claimed minimum untested | Medium | F24/F25 exact-floor CI/install tests |
| Long migration obscures resume | High | Per-block commits/ledger plus checkpoints F5, F9, F20, F22, F26 |

## Impact

This is the source-file map. Prefix shorthand denotes exact directory expansion; every candidate file below must receive an edit disposition in the ledger. Do not edit built mirrors. Additional supporting modules/tests discovered by F1 must be named before their owning block executes.

| Files | Layer | Action / block |
|---|---|---|
| All 19 immediate `.sh` under `framwork/.codeadd/scripts/` | product | Audit F1; native equivalents F3/F6–F17; remove F20 |
| Native shipped entries named in F3/F6–F17, `delivery-index-core.cjs`, `backlog-id.cjs`, optional explicitly ledger-listed supporting cores | product | Create/modify canonical runtime closure |
| `scripts/tests/helpers.cjs`, `scripts/tests/native-script-cases.json` | internal verification | F1 foundation; tracked map maintained F27 and separately tagged internal refinements |
| All exact `scripts/tests/*.test.cjs` expansions listed in F27 | internal verification | F27 case transfer/Red; separate internal follow-up before implementation refinements; runtime blocks consume only |
| `scripts/build.js`, `inventory.js` | internal | Modify F2 |
| `scripts/graph.js` | internal | Modify F4 |
| `mcp/engine.mjs`, `corpora.mjs`, `server.mjs` | product | Modify F5 |
| `scripts/release.sh`, `scripts/create-release-tag.sh`; `scripts/release.cjs`, `scripts/create-release-tag.cjs` | internal | Replace/remove F21; tests owned F27 |
| `scripts/smoke-test.sh`, `scripts/smoke-test.cjs` | internal | Replace/remove F30 BEFORE F20; tests owned F27 |
| `scripts/run-tests.js`, `scripts/tests.Dockerfile`, root package/lock | internal | Modify/retire F22, policy F25 |
| `framwork/.codeadd/scripts/tests/*.bats`, `framwork/.codeadd/scripts/tests/run-tests.sh`, `framwork/.codeadd/scripts/tests/test_helper/` | product source/test transport | Map F1/F27; all applicable cases pass before source deletion; remove tree F31, never F22 |
| Product commands: `add.md`, `add-brainstorm.md`, `add-build.md`, `add-diagnose.md`, `add-done.md`, `add-hotfix.md`, `add-new.md`, `add-plan.md`, `add-pull-request.md`, `add-qa-setup.md`, `add-review.md`, `add-ux.md`, `add-wiki.md` | product | Invocation/declaration/permission cutover F18 |
| Product skills' SKILL.md: `add--agents-md-style`, `add--architecture-discovery`, `add--code-review`, `add--commit`, `add--delivery-validation`, `add--dev-environment-setup`, `add--doc-schemas`, `add--ecosystem`, `add--feature-discovery`, `add--id-convention`, `add--knowledge-discovery`, `add--qa`, `add--resource-path-convention`, `add--review-discipline`, `add--setup-contract`, `add--subagent-driven-development`, `add--wiki-maintenance` | product | Cutover and corrected runtime assumptions F18 |
| Product references: `add--backlog/references/lifecycle.md`; `add--doc-schemas/references/{backlog,delivery-index,new-feature,receipt,review}.md`; `add--subagent-driven-development/references/persistent-logging-and-tasks.md` | product | Protocol owner references/active instructions F18 |
| Product agents: `fix-agent.md`, `test-agent.md`, `qa-agent.md` | product | Native invocations and permission descriptions F18 |
| Product fragments: `qa-pipeline/add-review.md`, `tdd-pipeline/add-plan.md`, `board/add-build.md`, `docs-pruning/add-done.md` | product | Native route names; stable injection slots F18 |
| `workbench/commands/add-framework--{backlog,release,sync}.md` | internal | Native recipe/ownership references F19/F21 |
| Workbench SKILL.md: `add-framework--done`, `add-build-ledger`, `add-framework-development`, `add-framework-product-layer`, `add-plan-authoring`, `add-review-discipline`, `building-commands` | internal | Source guidance/recipes F19 |
| `cli/package.json`, `cli/package-lock.json`, `board/package.json`, `board/package-lock.json`, `web/package.json`, `web/package-lock.json` | product runtime metadata | Common minimum F24 where needed |
| `.github/workflows/{ci,release,deploy-web}.yml` | internal | Native matrix and runtime alignment F25 |
| `README.md`, `AGENTS.md` | internal documentation | F25; inventory generated |
| `cli/README.md`, `web/src/pages/{docs,index}.astro` | product documentation | F29 |
| `cli/tests/{build,build-artefact-graph,inventory,review-no-loops}.test.js` | product verification | F28 Red; F2 consumes; F20 product fixture activation |
| `cli/tests/{graph-query,impact-question-touched-by,knowledge-discovery-question-first,delivery-index,mcp-engine,mcp-server,mcp-migration}.test.js` | product verification | F28 Red; F4 consumes only; F5 product activation |
| `cli/tests/{backlog-id,backlog-publication}.test.js` | product verification | F28 Red; F7/F8 product activation |
| `cli/tests/{hotfix-diagnosis-review-contract,qa-reachability.smoke,qa-pipeline-umbrella,loop-consolidation-0070,product-close-out-parity,product-pipeline-parity,optional-review-build-final-review,close-out-hardening,agents-md-only,docs-knowledge-graph}.test.js`; `cli/tests/fixtures/slot-membership-map-v2.json` | product verification | F28 Red; F18/F20 product activation; F25 consumes only |
| `cli/tests/run-tests.test.js`, `cli/tests/helpers/global-setup.js`, `cli/vitest.config.js` | product verification | F28 foundation; F22 consumes only; separate product follow-up for refinements |
| `cli/tests/{install.e2e,updater,installer,migrations,board-runtime,board-phase-writes}.test.js`, `package-smoke.mjs` | product verification | Native installed closure and managed cleanup F23 |
| Worktree plan/ledger and approved design/intent copies; evidence named by owner | internal local execution records | Byte-preserving copy F1; ledger/evidence F26 |

Script graph nodes are discovered from disk; do not invent a scripts registration section in provider-map. Existing command/skill/agent registration remains valid unless an identity actually changes. `uses:` script targets and build's exact native-source allowance must stay coherent across their ordered blocks. Layer tags follow every changed PATH: shipped sources, mcp/cli/board/web are product; scripts/workbench/AGENTS/root/workflows are internal. No block writes across layers. Extra test/code refinements require separately numbered correctly tagged blocks inserted before the affected code change; list dependencies, exact files and Red/Green evidence in the ledger and execution order before execution.

## Validation Matrix

**Discipline: RED first, checkpoint activation explicit.** F1/F27/F28 run passing harness/self/map/config checks separately from intentionally Red future migration assertions. F1 foundation checks use `node --test scripts/tests/harness.test.cjs`; F27 selects the exact domain files listed above, and records future Red independently of its passing foundation/case-map checks. Use `node --test --test-name-pattern='<recorded foundation or active case IDs>' <exact scripts/tests/file.test.cjs ...>` for selections; the ledger records actual patterns, files, omitted future cases and activation owner. Never select only trivial harness tests as an implementation gate: each runtime block activates and passes every mapped behavioral case for its capability via `node --test scripts/tests/<entry>.test.cjs` (multiple exact files for grouped entries). Backlog/backlog-commit already-native cases pass in F27 and remain required thereafter. F2 selects F28 local build/inventory Vitest checks that permit absent future entries; CLI integration/recipe/install subsets use `npm exec --prefix cli -- vitest run <exact cli/tests/file.test.js ...> -t '<recorded checkpoint cases>'` with F28 isolation configured. Final inventory, full recipes/install closure and final npm transport guards are activated only at their owning checkpoints. Every script has meaningful behavioral Red before implementation; absence alone is insufficient. Red/Green evidence belongs in the ledger. New assertions discovered later land in separately tagged test follow-up blocks before code changes. Final full suites run only when their capabilities are complete; early foundation Green never claims final-state acceptance.

### L1 — Per-script behavior and case accounting

1. Assert every original runtime/test case maps to a native case, approved change or shell-only retirement, with script, mode, expected output/exit/effects and test ID.
2. Assert defaults, invalid arguments, success, operational failures and side effects against deterministic fixtures. Native processes must use the intended Node entry.
3. Assert contract headers describe arguments, dependencies, emitted fields, mutation boundaries and exits; descriptive test names provide detailed reference.
4. Assert maps cover missing dedicated suites and audit outcomes; useful consolidated cases persist under their canonical owner.
5. **RED today:** new Node entries/native cases are absent and final case-accounting guards fail. **GREEN:** each mapped case passes or has an approved, reasoned disposition; no uncovered original case.

### L2 — Inventory, audit and shipping gates

1. Derive original inventory from the baseline commit; expect 19 shipped entries and 3 root entries as the current baseline, not a permanent inventory count.
2. Every entry has evidence-based disposition; uncertain retirement has explicit user approval before removal.
3. Shipping accepts only intended native closure, rejects unrelated JS, and graph/inventory reflect actual retained entries. No old runtime shell source remains at final acceptance.
4. **RED today:** gate excludes most proposed native files, inventory ignores CJS, disposition map absent.

### L3 — Delivery index and graph/MCP parity

1. Native read/write/verify/repair/touched match existing protocols: schema hard bans, ranking, live/dead caps, no backfill, index/corpus exclusions, probe/refusal exits and repair.
2. Graph history and MCP history/touched agree on deterministic fixtures and layer filters; repository and installed corpus roots work, including overrides and unavailable-reader conditions.
3. Query from a native Windows worktree with spaces in its path without Bash, login shell, WSL or path bridges. Available index results are not silently downgraded.
4. **RED today:** native reader absent and shell-only adapters fail no-Bash environment.

### L4 — Git context, allocator, setup and worktrees

1. Preserve main-branch fallback and branch-metadata output; detached/no-Git and special-character paths retain expected handling.
2. Allocation uses one core with independent expected values for raw damaged JSON, feature basenames, casing/whitespace, empty inputs, maximum IDs, exhaustion and unreadable sources. Preserve distinct next-id/status public validation/exits.
3. NEXT_ID_AGREE compares Node routes and passes; it is supplementary to independent expected-result tests.
4. Status retains full field/mode/receipt behavior. Initialization/setup/done worktree/branch mutations and guards are executed in temporary repos.
5. **RED today:** native boundaries and shared allocation missing.

### L5 — Workflow persistence, QA and maintenance contracts

1. Ledger duplicates/creation identity, task fourth-argument distinctions, review range/empty-commit packaging, JSONL raw extras/timestamps and context migration safety are preserved.
2. QA containment, symlinks, evidence/promotion/receipt states and all hotfix/convergence modes return expected outputs and exit codes; optional QA route invokes native helpers.
3. done modes preserve staging/merge/cleanup guards and required anchors.
4. Each retained standalone migration/logger has complete mode tests; retirement preserves applicable business cases.
5. Release/tag/smoke seam tests verify annotated tag publication, staging/pathspec refusal and subfeature plan placement as applicable; do not replace original smoke checks with a trivial success test.
6. **RED today:** native routes absent and native subprocess tests cannot reach these contracts.

### L6 — Installation, distribution and isolated test transport

1. Fresh release ZIP install, update from old manifest and reinstall remove old managed shell entries and retain manual/untracked preservation semantics. Native cores are present.
2. Relocate an installed runtime and run representative delivery/status/QA entries with no repository source or development node_modules. Packaged MCP reader resolution works.
3. `npm test`, `npm run test:scripts`, `npm run test:all` use native Node on each platform; filters and first nonzero result work, missing tools refuse clearly, NODE_OPTIONS handling remains deterministic.
4. Native runner preserves the checkout-copy/sidecar guard and detects worktree Git routing. Tests must not mutate real sidecars or source. Verify filesystem before/after and keep `CODEADD_TESTS_COPY` guarantees.
5. Bats/backlog cases are all transferred before removing old suites/helper shell/dependencies. Source scans inspect `.cjs` and native tests.
6. **RED today:** script suite requires Bats, Windows defaults to Docker, runtime closure/caller paths still use shells.

### L7 — Active recipe and optional injection matrix

1. Scan authored current sources, root tooling, MCP, package scripts and workflow routes for executable retired `.sh`/Bash references. Distinguish historical docs and third-party URLs; report a classified residual list rather than pretending broad grep must be empty.
2. Build product and workbench with no new warning/dangling script identity; compare graph IDs and exact-source fixtures.
3. Installed QA pipeline disabled/enabled: native preflight/evidence appear only where expected, exactly once; TDD plan status is native with its feature enabled. Test coexistence with board/docs-pruning fragments and disable round-trip using existing membership/round-trip suites. No injection marker/slot redesign.
4. Native permissions/read-only instructions preserve allowed probes and mutation gates.
5. **RED today:** active shell recipes/declarations remain; fixtures name old script nodes.

### L8 — Native platform/version, timing and PR readiness

1. CI matrix: all six Windows/macOS/Linux × exact Node 22.19.0/24 jobs perform root and cli `npm ci`, required product/workbench builds, then root `npm test` and `npm run test:scripts` through the guarded isolated root runner, including applicable full CLI integration/install/relocation checks. Hosted Bash availability must not mask fallback: instrument framework/test subprocess boundaries to reject Bash while preserving native Git/npm transport. Execute a negative control attempting Bash and assert rejection. Record installed runtime proof in each job.
2. Repository jobs using board/web/release align with the common floor and their own requirements; avoid unnecessary browser matrix expansion.
3. In a disposable worktree repository with main/production occupancy controlled, execute the native npm release route against a local remote and publishing stubs. Verify branch/tag semantics, error handling and process exits. Never run the real production release as acceptance.
4. Record baseline and final wall-clock duration, suite/case totals, OS/Node/hardware or runner, cold/warm/dependency setup inclusion, invocation and exit status. Separate script/CLI/board durations. Missing historical timings are explicitly absent; no arbitrary performance threshold or invented speedup.
5. At PR-question handoff: local gates and ledger complete; remote CI status accurately labeled passed/pending/unavailable. After authorized publication, all six native jobs must be Green before merge readiness.
6. **RED today:** native minimum/platform matrix absent; Windows no-Docker/no-Bash test routes fail. Timing collection itself may succeed as baseline and is not fabricated into a failing test.

**GREEN:** All local applicable levels pass; all cases are accounted for; platform CI passes once authorized execution is available. A plan audit/CI configuration assertion does not substitute for executed cross-platform evidence.

## Execution Order

1. F1 [internal] — Worktree, context copies, audit, passing foundation checks and separate future Red.
2. F27 [internal] — All domain case transfers and meaningful Red.
3. F28 [product] — CLI test/config foundation and checkpoint-specific Red.
4. F2 [internal] — Local build/inventory support, future entries permitted absent.
5. F3 [product] — Delivery core/entry.
6. F4 [internal] — Graph adapter; consumes product tests.
7. F5 [product] — MCP history/touched. **Checkpoint: native delivery lookup proved.**
8. F6 [product] — Git helpers.
9. F7 [product] — Canonical allocator/adapter.
10. F8 [product] — Full status.
11. F9 [product] — Init/build setup. **Checkpoint: native context/allocation proved.**
12. F10 [product] — Ledger.
13. F11 [product] — Task/review inputs.
14. F12 [product] — JSONL logging.
15. F13 [product] — QA evidence/preflight.
16. F14 [product] — Convergence/hotfix gates.
17. F15 [product] — Done operations.
18. F16 [product] — Context migration.
19. F17 [product] — Audited standalone dispositions.
20. F18 [product] — Product caller/fragment cutover.
21. F19 [internal] — Workbench caller/guidance handoff.
22. F30 [internal] — Root smoke migration and mapped Green BEFORE F20.
23. F20 [product] — Runtime shell retirement after full applicable case transfer; no final npm transport gate. **Checkpoint: native runtime complete.**
24. F21 [internal] — Release/tag routes.
25. F22 [internal] — Root native runner/package/docker only. **Checkpoint: native npm tests complete.**
26. F31 [product] — Product Bats/helper transport removal after complete transfer proof.
27. F23 [product] — Installed/update/relocation proof.
28. F24 [product] — Runtime package declarations.
29. F25 [internal] — Six-job CI/internal docs/timing wiring.
30. F29 [product] — CLI/web documentation.
31. F26 [internal] — Exact ledger, final local proof and PR question; actual CI status reported.

Before F20, old runtime shell entries may remain as baseline source comparison, but native entries and ALL mapped cases for each retired source must pass independently using direct Node files. Old Bats suites are explicitly nonexecutable historical material, not a runnable passing route; no outstanding case transfer may be postponed until F22. Each checkpoint is resumable using the ledger; file existence is not completion. Before F22 use direct native tests and applicable runtime/install/recipe subsets, never final npm runner acceptance. Record transitional layer-gate rulings with equivalent complete coverage. Numbered follow-up blocks, if needed, must be added explicitly with correct path layer and executed once before affected code changes.

### Fresh-context bootstrap

Read this plan, both context documents, AGENTS.md and `/add-framework--build`. Clear injected NODE_OPTIONS for deterministic tool output. Create/reuse only the dedicated branch/worktree belonging to this plan; inspect Git status and worktree list first. Copy the gitignored documents verbatim and establish the ledger in that worktree. Move the execution session there when supported. Install development dependencies at the verified Node floor/24 as appropriate; shipped script users do not install those dependencies.

Follow one commit per F-block. Keep Red/Green/case evidence in the ledger or owner-approved evidence locations; do not create stored reviewer verdicts. Invoke the build with this plan's basename. At the PR question, present proof and ask before opening it. The fresh user invocation can authorize checkpoint continuation; absent such authorization, confirm mode retains the build owner's confirmation stops. This plan never authorizes `/add-framework--done`.

## Reviewer Handoff

For every block, record changed files, validation levels/actual commands, expected Red reason and result, Green result, case IDs/dispositions, intentional departures and user decisions. Carry evidence in the ledger/allowed evidence, not a separate reviewer report file.

Actively hunt:

1. A translated entry with tests written only after implementation, or missing-entry Red with no meaningful behavioral assertion.
2. Cases lost when Bats transport or an unused entry is deleted.
3. Shell subprocesses hidden behind npm, helper functions, MCP touched, optional fragments, or Windows tool resolution.
4. Shared allocator tests comparing the implementation only against itself.
5. Generic source scanners silently ignoring `.cjs` after migration.
6. Shipping gate broadening that allows arbitrary JS or tests into runtime assets.
7. Native runner modifying real sidecars/worktree metadata or leaking temp repositories.
8. Runtime declared >=22.19.0 but tested only on latest22, or CI claimed passed before authorized push/PR.
9. Real remote tag/publication effects in release tests, branch occupancy changes disguised as transport migration, and self-worktree cleanup.
10. Uncertain retirement or behavior conflict resolved without the user's decision.

## References

- Reviewed design/intent in Context.
- `docs/deliveries/2026-10-04T004044-PLAN--native-node-backlog/plan.md` — native core, allocator characterization and installed closure.
- `docs/deliveries/2026-10-04T181131-PLAN--remove-backlog-shell-wrappers/plan.md` — behavioral case mapping and manifest-owned retirement.
- `docs/deliveries/2026-10-03T122024-PLAN--node-only-board/plan.md` — one native implementation with adapters.
- `docs/deliveries/2026-09-21T001942-PLAN--parallel-tests-in-one-container/plan.md` and `docs/deliveries/2026-09-10T230600-PLAN--fast-local-bats/plan.md` — performance motivation and isolation rules.
- Internal build ledger, product/internal layer owners and review discipline — execution gates, one commit per block and read-only review lifecycle.

## Next Steps

In a fresh context: `/add-framework--build native-node-framework-scripts` with this full plan and its context documents. Execute through local readiness and stop at the question before opening the PR. Use `/add-framework--plan native-node-framework-scripts` to revise the plan.

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-05 | Initial full cross-layer plan from approved design; fresh-context worktree execution, per-script TDD and native platform proof. |
| 2026-10-05 | Applied accepted one-time fix-then-ok findings: path-based layer splitting F27–F31, checkpoint-specific passing checks versus future Red, complete native case transfer before retirement, explicit caller capability handoffs, pre-cutover smoke migration, exact ledger/map paths and all-six-job isolated native CI with Bash negative control. No second review or stored reviewer report. |
| 2026-10-05 | Implemented: all 31 F-blocks landed on `feat/native-node-framework-scripts`, one commit per block. Changelog `docs/changelog/2026-10-05T232428-refactor-native-node-framework-scripts.md`. Local acceptance green: native scripts suite 624 pass/3 skip/0 fail, migration-acceptance 6/6, CLI suite 76/77 files (the last greens with the timeout fix). Remote six-job CI pending the PR question. |

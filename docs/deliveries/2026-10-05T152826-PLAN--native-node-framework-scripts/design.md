# Brainstorm: Native Node Framework Scripts

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-05
> **Type:** architecture
> **Ticket:** 0022B
> **Path:** architectural

## Objective

Everyone using Code-Addiction will use Node as the common runtime for framework scripts on Windows, macOS, and Linux. Agent workflows, board operations, and framework maintenance will preserve their existing behavior while removing their dependency on Bash.

## Discovery

- The native-node-backlog and remove-backlog-shell-wrappers deliveries established native entries, shared cores, case mapping, and existing manifest-owned pruning. The latter retained Bats; this delivery also makes test execution native.
- The node-only-board delivery removed a Node-to-Bash-to-Node boundary. The existing board/backlog Node runtime is precedent rather than functionality to rewrite.
- Parallel-tests-in-one-container and fast-local-bats explain existing isolation and container choices. Windows Bash test execution reportedly exceeded 30 minutes. Preserve isolation while removing the shell bottleneck.
- Delivery-history lookup failed with `delivered.sh exited 127` in the current Windows environment. Historical shipped/dropped status is NOT VERIFIED through that interface. Archived plans are available as documentary evidence, not a successful history query.
- Inventory: 19 shipped shell scripts and three root maintenance scripts. All shipped scripts were queried for direct graph callers. Graph absence does not establish lack of use.
- Locked CLI/board tooling requires Node 22.12; locked web undici requires 22.19. The agreed unified floor is Node 22.19.0, to be execution-tested, with Node 24 LTS recommended.

## Context & Motivation

Framework operations currently rely on shell selection, runtime lookup, and path translation. Windows exposed failures in delivery-index lookup and worktree operations. The goal applies equally to Linux and macOS: Node is the common prerequisite for agent scripts even when the optional board feature is disabled.

## Problem / Opportunity

Moving an executable alone is insufficient when its callers, test runner, or release recipe still require Bash. ID allocation has multiple implementations, status has broad consumers, and shell-based tests made native Windows verification impractically slow. The migration should establish readable behavioral contracts and executable regression evidence for future changes.

## Proposed Solution

Use native Node entry points with shared internal modules, preserving public arguments, output fields and meaning, exit codes, persisted formats, defaults, and failure behavior. Shipped runtime modules use Node built-ins only and require no project dependency install. Follow the existing `.cjs` shipped-entry convention. Root entry/module format follows its repository context. Invoke tools without a Bash bridge; handle Windows executable resolution deliberately and test it.

Alternatives considered:

| Alternative | Benefit | Cost | Decision |
|---|---|---|---|
| Native entries, preserved contracts, shared cores | Removes shell failures and duplication with directly comparable behavior | Requires caller and test migration | Selected |
| Redesign arguments/output formats during migration | Could standardize interfaces | Broad consumer changes obscure migration regressions | Deferred; record concrete problems separately |
| Retain shell wrappers or require Linux containers | Smaller immediate cutover | Retains the runtime dependency and Windows overhead | Rejected |

Implementation proceeds as one plan on one feature branch in a dedicated Git worktree, with checkpoints: delivery index first; allocation/status and their coupled helpers next; remaining workflow groups; maintenance and complete native verification. Dependencies may interleave checkpoints. This is not an umbrella or a set of independent plans.

## Type of Artefact

Cross-layer script/runtime architecture, executable entry points, test tooling, and associated artefact instructions.

## Scope

### Includes

- Audit all 22 shell scripts before deciding migrate, consolidate, or delete.
- Migrate every active framework-owned shell route and all active callers, including QA fragments, script-to-script calls, internal close-out, MCP history and touched operations, root graph lookup, test and release entries.
- Consolidate ID calculation around one canonical Node implementation; preserve accepted allocation semantics and the observable NEXT_ID_AGREE signal. Shared-core agreement is not independent correctness proof; characterization tests provide that proof.
- Contract headers beside implementations, descriptive native tests, and case mappings for each migrated/consolidated/retired script.
- Native test runner, fixtures, source assertions, dependency declarations, installer/update proof, CI and runtime documentation.
- Node >=22.19.0 unified minimum; Node 24 LTS recommended; native Windows/macOS/Linux CI at the exact minimum and Node 24.
- Before/after timings for script tests separately from CLI and board suites. Reuse available container baseline and native Windows evidence; record environment and missing evidence without inventing results.
- Existing manifest pruning, verified through install/update tests rather than a new cleanup mechanism.

### Does NOT Include

- General public-interface redesign, new board functionality, or changing persisted business formats.
- Replacing external Git, npm, gh, or application-specific test tools with Node implementations.
- Publishing a release as a migration test or automatically closing related ticket 0021B.
- Broadening all website or browser-test jobs to every platform merely because native script tests need that matrix.
- Keeping obsolete compatibility wrappers as a supported route.

## Behavioral Mapping and TDD

Before implementing each replacement, inspect the existing script and its branches alongside all relevant Bats/integration cases. Map arguments, defaults, success/error outputs, exit codes, reads/writes, subprocess effects and platform/worktree cases. Do not equate old test coverage with exhaustive behavior coverage.

For each replacement: write native tests targeting the intended Node boundary; demonstrate Red for the expected missing/incorrect behavior; implement to Green; compare old and new behavior where Bash is available; account for every mapped case; then cut callers over and retire the shell entry. A test failing solely because an entry is missing establishes the initial Red, but meaningful assertions must exercise the mapped behavior after implementation. No dependency on Bash may remain in the final suite.

Case dispositions are preserved, intentionally changed with explicit approval, or exclusively shell-specific and retired with a reason. Consolidation transfers useful cases to the canonical entry/core. Deletion must not erase a business case that still applies elsewhere. Missing dedicated suites, notably migrate-ids, require characterization from source and fixtures. Headers summarize the contract; native test names and assertions provide detailed executable behavior documentation. The delivery ledger/evidence carries the mapping and Red/Green results.

Tests cover spaces and platform paths, cwd/worktree handling, executable arguments, absent tools, error propagation, installed/relocated runtime closure, and existing isolation where applicable. Avoid real remote publication: release tests use disposable repositories and stubbed publishing boundaries.

## Usage Audit and Retirement Rule

For every script, check graph callers, actual executable references, active instructions, documented standalone capability, archived rationale, and equivalent existing entries. Generated mirrors are outputs, not authoritative callers. Tests alone do not prove useful production use. An empty graph answer is insufficient evidence for deletion.

- Migrate when an active caller or useful supported standalone capability exists.
- Consolidate when another native boundary preserves that capability; transfer callers and tests.
- Delete when there is neither an active caller nor supported standalone purpose, or demonstrated redundancy makes the entry unnecessary; document the evidence.
- Bring uncertain deletion candidates to the user before deciding. Do not classify an uncertain entry as useless merely to clear the inventory.

`log-iteration` and `migrate-ids` are audit candidates, not preapproved deletions. The final plan records one disposition for every entry.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Node required regardless of board toggle | common runtime for all agent workflows | Scripts extend far beyond board operations | Yes |
| Node >=22.19.0, recommend 24 | cross-platform runtime support | Align the common floor with locked dependencies; verify execution | Yes |
| Built-ins-only shipped runtime | readily executable installed scripts | No extra dependency installation for script use | Yes |
| Preserve public behavioral contracts | existing behavior | Separate transport migration from interface redesign | Yes |
| One allocator/shared delivery reader | reliable workflow behavior | Remove duplicated logic and shell-mediated data access | Yes |
| Per-script mapping and Red/Green | preserved behavior and future regression understanding | Expose outputs, branches and failures explicitly | Yes |
| One plan with checkpoints in a worktree | complete maintenance migration | Shared dependencies and coherent ticket/work history | Yes |
| Audit before retirement; uncertain deletions ask user | preserve useful capabilities | Neither empty graph nor existing tests proves usefulness | Yes |
| Native three-platform/two-version CI | cross-platform execution | Linux container success is not Windows-native evidence | Yes |
| Measure timings without arbitrary threshold | practical native verification | Establish an actual baseline before imposing a budget | Yes |
| Reuse manifest cleanup | clean upgraded installations | Existing install/update already prunes managed obsolete files | Yes |

## Ecosystem Impact

Notation: C = product command `add-*`; S = product skill `add--*`; A = product agent `*-agent`. All listed graph callers are verified direct RUNS_SCRIPT edges. These names identify current nodes; source paths will change at cutover.

| Component | Layer | Called by (graph) | Impact / action |
|---|---|---|---|
| build-ledger.sh | product | C build; S review-discipline, subagent-driven-development | Migrate ledger behavior and callers |
| build-setup.sh | product | C build; S doc-schemas, id-convention | Preserve worktree/setup behavior; migrate helper calls |
| converge-gates.sh | product | C build, done; S commit | Preserve gates and QA evidence call |
| delivered.sh | product | C done, hotfix; S knowledge-discovery | Native shared index access; preserve read/write contracts |
| done.sh | product | C build, done; S id-convention, wiki-maintenance | Preserve close-out behavior and helpers |
| get-branch-metadata.sh | product | S id-convention | Migrate shared helper and script callers |
| get-main-branch.sh | product | None returned | Actual callers exist; migrate helper |
| hotfix-gates.sh | product | C diagnose, done, hotfix; S subagent-driven-development | Preserve gate behavior |
| init.sh | product | C new; S feature-discovery | Migrate initialization and coupled helpers |
| log-iteration.sh | product | None returned | Audit standalone use and authoring example before disposition |
| log-jsonl.sh | product | None returned | Active prompt instructions exist; migrate logging |
| migrate-context-files.sh | product | C wiki; S agents-md-style | Preserve migration behavior |
| migrate-ids.sh | product | None returned | Audit standalone modes; characterize if retained |
| next-id.sh | product | S id-convention | Share allocator; init is actual executable caller |
| qa-evidence.sh | product | A qa; C done, qa-setup, review; S id-convention, qa; QA review fragment | Migrate evidence behavior and fragment route |
| qa-preflight.sh | product | C qa-setup; QA review fragment | Migrate preflight and optional injection |
| review-package.sh | product | C build; S review-discipline, subagent-driven-development | Preserve reviewer input packaging |
| status.sh | product | A fix, test; C add, brainstorm, build, diagnose, hotfix, new, plan, qa-setup, review, ux; S code-review, dev-environment-setup, doc-schemas, feature-discovery, id-convention, knowledge-discovery, setup-contract, subagent-driven-development | Preserve full status surface, not only IDs |
| task-brief.sh | product | C build; S subagent-driven-development | Preserve downstream task input |

### Graph Completeness and Additional Surfaces

The graph does not expose root scripts, arbitrary JS subprocess calls/imports, package recipes, workflows, tests, or AGENTS.md. Script-to-script calls and several prompt logging instructions were found by separate executable/text inspection; they are not graph-derived callers. Fragment completeness was checked via impact on add-review and dependencies of QA/TDD/Playwright review fragments; only the QA fragment directly runs these shell entries.

| Surface | Layer | Separately inspected evidence and required action |
|---|---|---|
| graph.js | internal | Executes delivered; migrate native reader route |
| mcp/engine.mjs and corpora.mjs | product | History and touched reader boundaries, repository/installed paths and overrides; preserve equality/degradation |
| workbench close-out | internal | Executes delivered; update native invocation |
| get-main-branch helper calls | product | init, status, build-setup, done execute helper |
| metadata helper calls | product | init, status, done execute helper |
| logging instructions | product/internal | build/hotfix/review and persistent-logging reference use log-jsonl; building-commands contains log-iteration example |
| scripts/release.sh | internal | Root npm release route; native replacement retains release operations |
| scripts/create-release-tag.sh | internal | Release owner mandates sole tag route; preserve validation, annotated tags and push semantics |
| scripts/smoke-test.sh | internal | Executes converge/status; migrate assertions |
| test runner, suites and CI | internal verification | 17 matching script Bats suites plus backlog suites and Vitest source/integration assertions; migrate complete coverage and native runners |
| installer/updater | product | Existing prior-manifest/new-files diff removes obsolete managed scripts; verify no new mechanism |
| provider registry/build/inventory | respective product/internal sources | Register/prune Node entry identities and dependencies; regenerate inventory and provider output from sources |
| AGENTS/README/web/runtime declarations | internal documentation and product package metadata | Update runtime requirements and active recipes consistently; preserve historical archives |

## Worktree and Release Constraints

Implementation occurs in a dedicated development worktree on one branch. Tests explicitly cover Git worktree paths and commands with explicit cwd. Release operations retain their existing main/production/tag semantics. Because release scripts switch branches, worktree verification must use a disposable repository arranged to avoid another worktree holding the target branch; do not change branch semantics silently or publish real tags for proof. The release command's own authorization remains required.

Close-out must retain its existing rule: do not remove the current worktree from inside itself. Report cleanup from the primary checkout rather than attempting destructive self-removal. The design does not authorize close-out or release execution.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| One native runtime and fast portable behavioral verification | Support for Node 18/20 and older Node 22 minors |
| Shared implementations and readable regression contracts | A quick translation without characterization |
| Consistent upgraded/fresh installed entries | Supported Bash wrapper invocation |

| Risk | Probability | Mitigation |
|---|---|---|
| Missing implicit caller | High | Graph plus executable/instruction audit, fragments and installed tests |
| Accidental behavior change | High | Case mapping, Red/Green, parity and approved exceptions |
| Removing useful standalone script | Medium | Evidence-based disposition; uncertain cases return to user |
| Platform-specific subprocess behavior | High | Native matrix, argument/cwd checks and Windows executable fixtures |
| Release branch conflicts or real publication during tests | Medium | Disposable repositories, controlled branch occupancy and publishing stubs |
| Shared allocator agreement hides a common bug | Medium | Independent characterized expected results and boundary fixtures |
| Exact runtime floor unsupported by tooling | Medium | Test Node 22.19.0 directly and validate package engine declarations |
| Broad migration increases duration | High | One coherent plan with ordered, independently proved checkpoints |

## Next Steps

After review and approval, invoke `/add-framework--plan` to formalize one implementation plan referencing this design and its approved intent. Planning determines exact file changes and validation levels, preserves this objective, and carries ticket 0022B. This design alone does not authorize implementation or publication.

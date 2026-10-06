# Brainstorm: All local tests in Linux containers

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-06
> **Type:** architecture
> **Path:** architectural

## Objective

Every local test invoked by an agent through the repository's supported test commands runs in a Linux container on every host OS. Prompts remain environment-agnostic: scripts own environment selection, isolation, filtering and refusal. Native local execution is prohibited.

## Discovery

PR #109 changes the existing runner's default to Docker on Windows, but retains native defaults elsewhere and a local native override. Its four changed files do not cover board, package smoke, watch or coverage entrypoints.

The existing runner copies the checkout, installs Linux CLI dependencies in an image, supports filtered CLI and scripts runs, preserves failure exits and maps worktree Git metadata. The current image does not provide board dependencies or Chromium.

Archived deliveries `parallel-tests-in-one-container`, `native-node-framework-scripts`, `fast-local-bats`, `backlog-board-002-board-app` and `vitest-fixture-scope` establish isolation, explicit refusal, built-app browser evidence and scoped validation. The fast-local-bats history entry is superseded by parallel-tests-in-one-container. Previously excluding board and non-Windows containers is explicitly superseded by this design.

## Context & Motivation

The user wants PR #109 to establish one reliable local test environment rather than depend on agents selecting Docker. Environment-specific prompt instructions are not the enforcement mechanism.

## Problem / Opportunity

Root and subproject npm scripts currently select different execution paths. Board pretest hooks generate runtime files before dispatch. CLI setup accepts a truthy CI or copy marker, which does not enforce container execution. Watch observes a static copy unless changes are synchronized. Docker Vitest arguments currently use plain shell text joining, which does not preserve arbitrary filters safely.

## Proposed Solution

Extend the existing runner into the canonical dispatcher for supported root and subproject test commands. Local entrypoints always dispatch to Linux Docker. Internal workers run directly only after recognizing the runner's container context or an explicitly authorized GitHub Actions test context. A generic CI flag or copy marker alone does not authorize native execution.

Alternatives: prompt-only enforcement is easy but leaves bypasses; Windows-only defaults preserve PR #109's narrow implementation but fail the all-host objective. Central dispatch is selected because ordinary commands enforce the policy without agent reasoning.

The implementation must validate the authorization context rather than treat the native override as authority. This is an execution-policy boundary for supported commands, not a security sandbox against a user editing the repository or deliberately spoofing its environment.

## Type of Artefact

Internal repository test infrastructure, with repository-local CLI and board test configuration changes. No installed framework user test policy is introduced.

## Scope

### Includes

- CLI Vitest, native Node script tests, package smoke, board TypeScript/unit tests and board Chromium E2E.
- Root and existing subproject npm test, watch, coverage and E2E entrypoints; existing direct-tool test setup guards are strengthened where available.
- Linux image dependencies, board runtime generation and built-app E2E preparation inside isolation.
- File/name filters, watch synchronization, report export, cancellation and refusal semantics.
- Explicit native CI authorization and environment-agnostic prompt cleanup.

### Does NOT Include

- A native local escape hatch or Docker-unavailable fallback.
- Arbitrary shell interception of every possible direct Node command.
- Changes to installed users' project test environments.
- New test assertions unrelated to execution policy or transport.

## Command Contract

| Root command | Selection |
|---|---|
| `npm test`, `npm run test:framework` | CLI + scripts + package smoke |
| `npm run test:cli` | CLI |
| `npm run test:scripts` | scripts |
| `npm run test:package` | package smoke |
| `npm run test:board` | board TypeScript check + unit tests |
| `npm run test:board:e2e` | built board Chromium E2E |
| `npm run test:all` | framework + board unit/typecheck + board E2E |

Preserve existing runner selectors, including the legacy scripts alias, where compatible. Existing CLI-local `test` remains CLI-scoped; board-local `test` remains board-scoped. Both dispatch through the root policy. Existing CLI watch and coverage entrypoints remain available with their current suite scope.

Individual commands accept tool-native arguments after `--`, preserving argument boundaries. Group commands reject filters with a message naming individual alternatives. Package smoke rejects unsupported filter options. A filtered run selecting no tests must not count as a passing gate. Board unit filtering retains its TypeScript check. Finite groups run their selected suites and return the first nonzero suite status, retaining current aggregate behavior.

## Execution Mechanism

Root and subproject scripts call the dispatcher. Internal tool execution uses distinct worker paths to avoid recursive npm dispatch. Board pretest/pretest:e2e generation moves inside the worker preparation path, so npm hooks do not mutate the host before container dispatch. CI workflows invoke the same suite contract with explicit native authorization, on their existing Linux runners; `CI=true` alone and `CODEADD_TESTS_RUNNER=native` alone are insufficient.

Retain copy isolation and safe Git/worktree mapping. The image owns Linux dependencies and Chromium. Cache identities include all package manifests/locks and relevant image inputs; host node_modules never replace image dependencies. E2E uses the existing built-app fixture/server contract. Avoid shared temporary paths between concurrent runs.

Concrete authorization predicates: a local direct worker requires Linux, `CODEADD_TESTS_CONTEXT=container`, and a runner-created context receipt at a fixed container-only path outside the copied source tree, mounted read-only by the dispatcher. The receipt declares container context and the selected suite and must match the worker request. Its presence alone or the copy marker alone is insufficient. Native CI workers require Linux, `GITHUB_ACTIONS=true`, `CI=true`, and explicit `CODEADD_TESTS_CONTEXT=github-actions` declared on the repository's test job/steps. Container workers ignore generic inherited CI flags; an explicit conflicting context is refused. Incomplete receipts, unknown contexts and local native override requests are refused. These predicates implement policy rather than an anti-spoofing security boundary.

Watch performs initial isolated preparation, then synchronizes source additions, edits and deletions from the host to the worker copy. Exclude dependencies, Git metadata, builds, provider outputs, generated runtime, reports and temporary trees. Debounce changes and serialize synchronization. Watch runs tool-native watch against the updated worker tree. Signals stop synchronization and container processes and clean temporary resources. Dependency manifest changes stop watch with an actionable restart message, so the next invocation resolves a matching image rather than continuing with stale dependencies.

Export only configured coverage and browser report paths to suite-scoped host output directories, including artifacts from failed runs. Do not copy generated source/build state back. Workers preserve tool exit statuses; preparation failures are explicitly identified as refusal/unavailable evidence, never passing or failing assertions. Missing Docker never dispatches a native substitute.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| All hosts use Linux containers locally | consistent local evidence | Windows-only defaults do not meet the objective | yes |
| Reject local native overrides | mandatory execution policy | An override would preserve the bypass | yes |
| Scripts select environments | environment-agnostic prompts | Agents use ordinary npm commands | yes |
| npm test selects framework; all adds board/E2E | useful routine scope | Browser work is separately selectable | yes |
| Individual suite filters | focused iteration | Node, Vitest and Playwright have different argument contracts | yes |
| Functional watch and report export | usable local workflows | Existing watch and coverage must not become native exits | yes |
| Explicit native GitHub Actions authorization | existing CI execution | Generic CI flags must not unlock local native execution | yes |

## Ecosystem Impact

| Component | Layer | Called by | Impact | Action |
|---|---|---|---|---|
| scripts/run-tests.js and image/test infrastructure | internal | Outside artefact graph coverage; root npm scripts verified on disk, subproject/workflow integration to be implemented | centralized dispatch | Extend policy, suite selection, filters, watch and artifacts |
| root package.json, AGENTS.md and workflows | internal | Outside artefact graph coverage | command contract and CI authorization | Update commands and environment summary |
| cli/package.json and CLI test setup/tests | product | Outside artefact graph coverage | repository-local test entrypoints | Route commands and enforce authorized worker setup |
| board/package.json and test configuration | product | Outside artefact graph coverage | board tests/preparation | Dispatch locally and prepare inside worker |
| add-framework-product-layer | internal | add-framework--build (USES_SKILL) | contradictory execution prose | Keep npm recipes, remove environment decisions |
| add-framework--done | internal | add-framework--build (HANDS_OFF_TO) | local fallback/CI evidence | Keep generic commands and accurate unavailable-result reporting |
| add-product-artefact-renaming | internal | add-framework-development and add-framework-product-layer (USES_SKILL) | test recipe | Align ordinary commands without environment-specific instructions |

Caller answers for skills come from framework-discovery-agent graph queries. Graph freshness was not independently verified. Root code/package/workflow callers are outside graph coverage, not claims of zero callers. Textual mentions and undeclared executable relations require source inspection during planning. Regenerate the workbench after prompt cleanup; do not edit generated provider copies.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| Consistent Linux execution without prompt logic | Native local fallback |
| Board/browser coverage under the same policy | Smaller image and cheaper first preparation |
| Watch with isolated dependencies | Simpler static-copy transport |

| Risk | Probability | Mitigation |
|---|---|---|
| Recursive dispatch or host prehooks | medium | Distinct internal worker route and prehook audit |
| Watch misses removals or uses stale dependencies | medium | Sync deletion tests and restart on manifest changes |
| Filters lose spaces or permit shell interpretation | medium | Preserve argv boundaries and test representative arguments |
| Reports or failures are lost | medium | Export on failed runs and assert aggregate exit propagation |
| CI/copy flags accidentally authorize local native | medium | Reject generic flags; test the explicit context contract |
| Large image slows first use | high | Cache dependency/browser installation by inputs |

## Proof

Meaningful runner tests cover every suite and group, authorization/refusal, subproject entrypoints, argument boundaries, no-match results, aggregate exits and no fallback. Integration evidence covers framework, board and built-app E2E in Linux containers; unchanged host generated state; report export on success/failure; watch edits/additions/deletions and cancellation; worktree Git mapping; explicitly authorized Linux CI. No native local test run is used to validate this delivery.

Authorization tests include valid Linux container receipt/context/suite and valid explicit Linux GitHub Actions context; missing receipt, mismatched suite, non-Linux workers, unknown/conflicting contexts, CI=true alone, copy marker alone, GitHub Actions without workflow opt-in and native override alone must all refuse direct execution.

## Next Steps

After design review and explicit delivery approval, formalize this design with `/add-framework--plan`, using its paired intent file. The current brainstorm does not implement PR changes.

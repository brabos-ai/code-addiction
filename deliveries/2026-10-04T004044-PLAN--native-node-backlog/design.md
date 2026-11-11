# Brainstorm: Native Node backlog entry points

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-04
> **Type:** architecture
> **Ticket:** 0019B
> **Layers:** both

## Objective

Determine why ticket registration failed in the agent's actual environment and verify backlog operations, Git publication, server reads and UI updates. Make the complete agent backlog flow work with native Node and Git on Windows, Linux and macOS, without requiring Bash or WSL.

## Discovery

- `backlog.sh` rejects the environment before CLI execution when `command -v node` fails. WSL non-login Bash finds only `/mnt/c/nvm4w/nodejs/node.exe`; login Bash finds `/home/fnd/.local/bin/node` v22.20.0 and reads successfully. Reproduced during this investigation. Nested-shell exit-code capture was unreliable; do not use that capture as proof of exact exit status.
- The guard predates the extraction. The delivered node-only-board plan retained shell entry points for agents while removing Bash from HTTP reads.
- `backlog-cli.cjs`, `backlog-core.cjs` and `backlog-storage.cjs` already supply the transport/domain/persistence split. Direct CLI add currently requires `BACKLOG_NEW_ID` from the shell wrapper.
- `backlog-commit.sh` owns base-branch selection, detached locked worktree routing and degraded publication outcomes. Preserve its observable policy rather than replacing it with a simple commit in the caller branch.
- `next-id.sh` and `status.sh next-id` calculate, rather than reserve, the global number across feature directory names and raw backlog ID fields, including recoverable IDs in damaged rows.
- Prior deliveries: project-backlog format/script, backlog-board app and node-only-board are live. The delivery index contains repeated node-only-board entries; these are historical evidence, not separate implementations.

## Context & Motivation

The user rejected requiring WSL. Selecting bare Bash on Windows can enter WSL even though native Node and Git are available. Fixing only Linux PATH would leave the structural dependency in place.

## Problem / Opportunity

The agent flow still relies on Bash for both ID calculation and publication. Direct Node operations alone cannot complete card creation/publication. Existing automated coverage passed for domain and dashboard behavior but does not prove the affected native agent route.

Investigation results: 25 core/CLI/runtime tests passed in Linux/Docker; board typecheck and 106 tests passed on Windows; browser tests against the existing built app passed 154 cases with 20 viewport-dependent skips. The attempted shell suites did not execute because the container runner reported `./node_modules/.bin/bats: Permission denied`. These results are baseline evidence, not complete native acceptance.

## Proposed Solution

Expose two Node entry points. `backlog-cli.cjs` performs local reads/writes without Git. New `backlog-commit.cjs` coordinates the same operation through the existing publication policy. Both use the existing core/storage and an adjacent Node allocator implementing the existing global calculation. Use only Node built-ins and native Git, preserving the Node 18+ runtime baseline.

Record modes accept `--record-file <path>` as well as stdin. Resolve and consume the record relative to the caller before selecting a worktree. When a file is supplied, use that file exclusively and do not read or inspect stdin; this avoids blocking on an open empty pipe supplied by an agent runner. Test interactive, closed empty, open empty and nonempty piped stdin with a file supplied. Without a file, consume stdin as today. Existing positional arguments and KEY=VALUE result contracts remain available. Reads do not invoke Git. Local add calculates its ID for the operation root; published add calculates against the selected publication root, preserving existing routing semantics. Allocation stays in the adapter, not the core. Legacy allocation metadata remains an explicitly tested compatibility path and is not required by new callers.

The Git adapter invokes Git with argument arrays and explicit cwd, without a shell. Preserve the existing base discovery, direct/worktree routes, locking, synchronization, conflict abort and degradation behavior. Preserve existing keys and exit codes while permitting additive persistence/publication/recovery diagnostics, explicitly approved by the user after review. Failures after persistence must report what exists locally and whether a commit/push succeeded. Cleanup must not discard persisted uncommitted data or leave an unpushed detached commit without a durable recovery route: retain the worktree when necessary or protect the commit with a recovery ref before removing it, and report the path/ref and SHA. The planner must select and specify the exact recovery mechanism and diagnostic names. Characterize commit failure, push refusal, rebase conflict and base checked out elsewhere; prove recoverability after cleanup. Do not promise general retry deduplication beyond existing semantics. Validate degraded reruns rather than claiming a new idempotency protocol.

Thin Bash compatibility wrappers delegate to Node entry points. They remain optional shell users' interfaces; native instructions never reach them. Preserve legacy script invocation/output contracts through characterization tests. Compatibility requires Node visible to that shell; this does not make Bash a native-flow dependency.

Alternatives considered:

| Option | Benefit | Cost / decision |
|---|---|---|
| Repair WSL runtime discovery only | Small change | Rejected by user: WSL must not be required |
| One CLI with `--publish` | One executable | Rejected in favor of explicit local/publication entry points |
| Two Node entries sharing domain and allocator | Native flow and existing responsibility boundary | Selected; requires Git-route migration and instruction/distribution updates |

## Type of Artefact

Product Node scripts and compatibility wrappers, product/internal instruction updates, distribution tooling and integration tests. No new workflow command or service is required.

## Scope

### Includes

- Seven backlog operations through native Node, record files/stdin, existing validation and outputs.
- Node global ID calculation with parity tests against both existing shell allocators; no independent persistent counter.
- Native Git publication preserving base branch/worktree/degradation policy.
- Product skill/fragments and internal backlog/lifecycle instructions migrated to Node; inventory text mentioning legacy routes updated where necessary.
- Exact shipped-source allowlist updates for new modules, installation/update closure and generated runtime checks. Board runtime still contains only core/storage.
- CLI-to-filesystem-to-server-to-UI acceptance and standalone server acceptance without Bash.
- Windows native, Linux and macOS acceptance; record skipped/unavailable platforms as unverified rather than passed.
- Repair or correctly invoke the existing shell test harness sufficiently to execute compatibility checks; diagnose the permission failure before deciding whether source changes are necessary.

### Does NOT Include

- Migrating unrelated framework scripts, including the broader delivered/history flow, away from Bash.
- Board mutation endpoints or UI editing.
- A new allocator reservation/locking/concurrency protocol.
- A new publication retry/deduplication protocol, UI redesign or mandatory running dashboard.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| Native Node and Git; no Bash/WSL requirement | Reliable native agent execution | Removes the interpreter selection failure | Yes |
| Two explicit Node entry points | Clear operation/publication behavior | Preserves the existing responsibility boundary | Yes |
| Publish on base, using worktree from other branches | Correct Git destination | Keeps backlog capture out of implementation commits | Yes |
| Preserve global ID calculation | Consistent card identity | No competing counter or new reservation semantics | Yes |
| Existing core/storage remain canonical | Consistent CLI/dashboard data | Reuses the delivered shared implementation | Yes |
| Bash wrappers remain compatibility interfaces | Existing caller continuity | Avoids forcing existing shell callers to migrate immediately | Yes |
| One design and one plan with checkpoints | Coherent correction and verification | Ticket lifecycle carries one work identity | Yes |

## Ecosystem Impact

| Component / layer | Called by | Impact | Action |
|---|---|---|---|
| `backlog-cli.cjs` / product | Graph returned no declared direct dependants; JavaScript/shell calls are not represented | Complete native operation entry | Extend CLI and test actual callers |
| `backlog.sh` / product | Discovery graph: `add--backlog`; shell-internal and cross-layer callers not represented | Optional compatibility facade | Delegate and preserve contracts |
| `backlog-commit.sh` / product | Graph depth 1: `add--backlog`, board `add-new` fragment | Publication implementation moves to Node | Delegate; migrate instruction consumers |
| New allocator and `backlog-commit.cjs` / product | New nodes; current callers do not exist | New shared runtime closure | Add exact distribution allowance and packaging proofs |
| `add--backlog`, board fragments / product | Reviewer graph findings: board fragments for `add-brainstorm`, `add-build`, `add-done`, `add-hotfix`, `add-new`, `add-plan` | Agent invocations change | Inspect the six fragments' dependencies and command injection relationships before finalizing instruction scope |
| Internal backlog command / internal | Reviewer graph findings: no declared direct dependants; undeclared textual/executable callers remain unverified | Invocation examples change | Migrate source instructions and sweep textual callers |
| Internal lifecycle instructions / internal | NOT VERIFIED at caller level | Invocation procedures change | Planner must query their callers before F-block scope is finalized |
| `board/server.mjs`, UI, tests, build/distribution tooling / product or internal according to file ownership | Not graph artefacts; caller completeness NOT VERIFIED by graph | Integration/closure verification | Source inspection and executable acceptance |

The graph does not model JS imports, shell-internal execution, non-artefact files or cross-layer prose references. Textual invocation search complements the declared edges; it must not be labelled graph evidence. Unverified callers are explicit planning prerequisites.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| Native agent execution without Bash | A smaller WSL-only patch |
| Existing publication policy on three platforms | Keeping publication logic solely in its current shell implementation |
| Explicit local versus publication entries | A single command with a publication flag |

| Risk | Probability | Mitigation |
|---|---|---|
| Git-route regression loses or misroutes a write | High | Characterize all existing routes/degradations; test disposable local/bare remotes and worktrees |
| ID calculation drifts | Medium | Shared fixtures compare Node with both shell allocators, including damaged rows and parent-path digits |
| Paths/record files change meaning after worktree switch | High | Read caller-relative record before routing; test spaces, Unicode, absolute script paths and alternate cwd |
| Installed modules are missing/stale | Medium | Actual install/update entry-point tests and byte/closure checks |
| Dashboard suite passes without proving agent integration | Medium | Native Node mutation observed by HTTP/SSE and browser; isolated standalone server with no Bash |
| Optional test conditions hide missing proof | Medium | Required acceptance checks fail or report unverified when prerequisites are absent; no conditional success claims |

## Next Steps

After delivery-mode approval, run `/add-framework--plan` with this design and its approved intent file, ticket 0019B and both layers. Produce one plan with CLI, Git, instructions/distribution and dashboard acceptance checkpoints. The planner must resolve the explicitly unverified caller rows before producing executable F-blocks.

## Review Resolution

Review verdict: fix-then-ok. Addressed file/stdin ambiguity with exclusive file precedence and no stdin inspection; obtained user approval for additive persistence/recovery diagnostics; incorporated reviewer graph caller evidence; named the next command explicitly. Exact recovery ref/path conventions and diagnostic names are implementation decisions to be specified and reviewed in the plan under the approved recoverability requirement.

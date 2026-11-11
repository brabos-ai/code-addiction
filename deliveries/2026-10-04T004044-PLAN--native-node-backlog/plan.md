# Plan: Native Node backlog — local operations and recoverable Git publication

> **Status:** implemented — partially validated (macOS not executed; accepted by user)
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-10-04
> **Delivery:** automatic
> **Ticket:** 0019B
> **Execution hold:** User explicitly requires this plan to be written and reviewed, then a stop for model selection before development. Do not load build from this planning session.

## Objective

Determine why ticket registration failed in the agent's actual environment and verify backlog operations, Git publication, server reads and UI updates. Make the complete agent backlog flow work with native Node and Git on Windows, Linux and macOS, without requiring Bash or WSL.

**When this build is done:** Agents can list, search, create, update, comment, move and remove backlog tickets using Node directly. Publication uses native Git with the existing base/worktree policy. Failed publication reports durable recovery information. Installed runtime closure and CLI-to-dashboard behavior are proven.

**Ticket done when:** Reproduzir em Windows/WSL Bash non-login com Node Linux disponível apenas no ambiente login e com node.exe acessível; verificar a solução escolhida para list/search e escrita por backlog-commit.sh em repositório descartável, incluindo caminhos/cwd; verificar Linux com node normal e Node realmente ausente; testes documentam os resultados e o erro orienta como corrigir o ambiente sem atribuir a falha ao parsing do board.

The approved design supersedes the ticket's WSL-centric remedy: native Node/Git is mandatory; WSL reproduction and shell compatibility remain characterization, not a user prerequisite.

## Context

The non-login Bash selected on Windows enters WSL and finds `node.exe` but no `node`; `backlog.sh` fails before CLI/core execution. Login Bash finds Linux Node and reads successfully. This guard predates node-only-board, whose HTTP adapter is already shell-free. Root cause is the agent's shell entry boundary, not proven corruption or a UI defect.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-04T004044-native-node-backlog.md` | Reviewed architecture, native access, compatibility, recovery and acceptance scope |
| `docs/brainstorming/2026-10-04T004044-native-node-backlog-intent.md` | Architectural path, automatic delivery and explicit stop before development |

Baseline investigation: 25 core/CLI/runtime tests passed in Docker/Linux; native Windows board typecheck and 106 tests passed; 154 browser cases passed with 20 viewport skips against the existing built UI. Shell suites never ran: Bats entry execution returned permission denied. Do not count these as new native-route proof. Strategy documents are absent. AGENTS.md, source inspection and prior backlog/board deliveries supply context.

## Global Constraints

- "nao vamos obrigar o usuario a utilizar wsl" — user; native backlog operations require only Node and Git, not Bash/WSL.
- Node >=18 and Node built-ins only for shipped backlog modules — approved design and existing CLI baseline.
- "THE STATUS VOCABULARY BELONGS TO THE USER." — backlog.sh; preserve vocabulary and refusal precedence.
- Preserve global calculation, not reservation; no new concurrency or deduplication protocol — user-approved design.
- Preserve existing output keys and exit codes; additive persistence/recovery diagnostics are approved — user confirmation.
- Preserve base-branch/worktree publication; no unrelated implementation files in a backlog commit — existing publication intent and user approval.
- "Edit the source, never the built copy" — AGENTS.md; workbench/provider output is generated.
- "grave o plano primeiro e apos finalizar, me avise que eu vou trocar de modelo" — user; this session ends after reviewed plan delivery.

## Problem

1. Agent creation and publication require Bash despite an existing Node core.
2. Direct CLI add cannot calculate an ID; it requires shell-provided metadata.
3. Publication cleanup can leave unpushed detached commits without a durable ref, or persisted uncommitted data without a reported recovery location.
4. Existing suite results do not prove native entry closure or CLI-to-UI updates.

## Proposal

### Entry contract

Keep `backlog-cli.cjs` for local operations and introduce `backlog-commit.cjs` for write/publication modes. Introduce `backlog-id.cjs` for global calculation and `backlog-git.cjs` for Git routing/recovery. All modules are adjacent, builtins-only CJS. Core/storage remain canonical and process/Git-free.

Native examples:

```text
node .codeadd/scripts/backlog-cli.cjs list --all
node .codeadd/scripts/backlog-cli.cjs add --record-file ticket.json
node .codeadd/scripts/backlog-commit.cjs update 0019B --record-file patch.json
```

Preserve existing positional grammar, ignored surplus arguments and stdout/stderr behavior except the explicit new file option. For record modes only, a trailing `--record-file <path>` pair supplies the record; no pair means stdin. Reject missing/repeated file options as caller errors. Do not interpret option-looking target IDs or search text as flags. File input is authoritative: do not inspect/read stdin when supplied. Read file in caller cwd before worktree routing. File-read failure exits 1 with `ERROR=record-read-failed` before Git setup/allocation/persistence; invalid record contents retain existing core refusal ordering. Non-record modes never consume stdin.

CLI exports reusable invocation/parsing/rendering functions guarded against import-time execution. The publication entry parses once, captures record text once, chooses an operation root, calls the same adapter/domain operation and renders publication results. It must not invoke the CLI as a subprocess or duplicate domain validation.

### ID contract

`backlog-id.cjs` calculates max+1 across immediate feature directory basenames and the exact raw-text ID expression used by existing shell allocators, including damaged rows and matching work_id substrings. Do not count quoted IDs in arbitrary title/note text or parent-path digits. Absent sources produce 0001; unreadable existing sources fail explicitly before persistence. Use the chosen operation root, not script location. No allocator import-time I/O.

If BACKLOG_NEW_ID is present, preserve valid four-digit B metadata as the legacy compatibility path; malformed/empty metadata explicitly supplied fails with the current allocation error. If absent, calculate natively. At max 9999 refuse with `ERROR=id-allocation-failed`, exit 1; never emit a five-digit ticket. This preserves the effective old wrapper+CLI rejection at exhaustion. Characterize all edges against both old allocators before wrapper cutover.

### Publication and recovery contract

Use native Git via argument arrays, shell:false and explicit cwd. Mirror base discovery: origin/HEAD, remote main/master, local main/master. Same base branch means direct; other branches/detached HEAD mean detached `.worktrees/backlog`. No repo/base or worktree creation failure still persists locally and reports existing degradation policy. Reads are rejected by publication entry as today.

Keep existing ROUTE, BASE_BRANCH, TICKET_ID, SHA, PUSHED, DEGRADED, ERROR/REFUSED keys and their current expected codes. Add `PERSISTED=yes|no`, `COMMITTED=yes|no`, `RECOVERY_PATH=<absolute path>` and `RECOVERY_REF=<ref>` when relevant. Codes: domain/caller failures as existing adapter; commit failure 1; completed writes with publication degradation 0; locked worktree 2. Preserve named existing degradation reasons; additional Git-stage failures use specific reasons rather than claiming push succeeded.

Commit only backlog/definitions changes. Preserve unrelated staged and unstaged caller work: use a path-scoped commit/index strategy validated with staged unrelated files and staged backlog changes; never commit the caller's entire index. Do not stage an absent definitions path on a refusal/read. Distinguish no-op mutation from a new commit in COMMITTED; SHA may identify existing HEAD as in current reports.

Recovery policy: for every successfully created worktree commit, immediately create and verify `refs/codeadd/backlog-recovery/<full-commit-sha>` before any rebase or cleanup. Create refs atomically with an expected absent value; track exactly which refs this invocation created. A pre-existing matching ref protects the commit but is not owned by this invocation and must not be deleted. Keep original ref through rebase; protect any rebased SHA before discarding the worktree. On unpushed outcomes report the protected current SHA/ref. After verified push, delete only refs actually created by this invocation, using expected-value verification; changed refs remain and deletion failure is reported. Never advance a checked-out base branch by out-of-band ref updates from the detached route. Normal commits in the direct route necessarily advance its checked-out branch and are allowed. Update an unchecked-out base only by verified fast-forward; divergence keeps a recovery ref and reports degradation.

Direct-route reconciliation must preserve caller bytes and staged intent. After a path-isolated backlog commit, if staged or unstaged caller changes make safe rebase impossible, do not stash/reset or rebase them: retain the commit, report `DEGRADED=caller-worktree-dirty`, `PUSHED=no`, and its SHA. With a clean caller tree, normal fetch/rebase may proceed. Assert caller state after success, safe refusal, conflict and abort failure; preserve a recovery location for any unresolved rebase. This is an explicit safety correction to the old script's unchecked reconciliation, not permission to discard staged work.

If persistence succeeded but staging/commit failed, keep the worktree with its data and report RECOVERY_PATH. Release its active capture lock on normal exit; before stale sweep, inspect any unlocked backlog tree. Never remove dirty, unmerged, rebasing or unprotected detached work. Refuse unsafe reuse with `REFUSED=worktree-recovery-required` and its path/SHA; give recovery instructions. Existing locked worktree behavior remains. A crashed locked tree is not auto-deleted. Cleanup may remove a clean tree only after protection/push verification. Cleanup failure reports its retained path.

Fetch must succeed before using FETCH_HEAD; failure reports fetch-failed and does not rebase/push based on stale state. Conflict is aborted; verify abort. Abort failure preserves the tree and reports recovery location. Check locking, staging, ref writes, rebase, base updates and cleanup explicitly. Before persistence, failures must not claim data exists. After persistence, never report a success that hides lost data. No automatic repeat of add after degradation and no new retry deduplication guarantee.

### Compatibility and dashboard

`backlog.sh` delegates to local CLI without calling status.sh; `backlog-commit.sh` delegates to publication entry. Preserve public shell syntax and Node-missing diagnostic, with actionable native Node invocation guidance. Missing Node in a shell remains an optional wrapper environment error; do not add node.exe fallback or implicit login shell. Existing next-id/status behavior remains broader-framework authority, not migrated.

Migrate product backlog instructions and internal lifecycle owner to Node record-file calls. Native lookup must not retain grep/printf shell pipelines: list output is JSONL plus metadata and is matched by exact ticket ID using agent parsing. Keep lifecycle status and work_id rules, phase equality and degraded-write reporting.

Server stays read-only and imports only generated core/storage. Add native mutation-to-HTTP/SSE/browser proof; do not add HTTP mutation routes or a server requirement for agents.

## Current State and Ecosystem Impact

| Node | Direct callers / needs | Grade and completeness |
|---|---|---|
| product/script/backlog.sh | add--backlog; no declared needs | MEDIUM; executable shell calls not modelled |
| product/script/backlog-commit.sh | add--backlog and board add-new fragment | MEDIUM; JS/shell edges not modelled |
| product/script/backlog-cli.cjs | No declared callers/dependencies | LOW declared impact; executable import edges not modelled |
| product/skill/add--backlog | Six board fragments; needs scripts, lifecycle/phases, schema, final report | HIGH; all six fragment dependencies and injection relationships inspected |
| internal/command/add-framework--backlog | No direct callers; needs internal final-report | LOW declared impact; product cross-layer references not modelled |
| internal/skill/add-plan-authoring | Four internal pipeline stages | HIGH; migrate The Ticket once, preserve consumers |

Discovery graph verified paths from all six fragments through add--backlog to backlog-commit.sh; add-new additionally has a direct script edge. New scripts have no existing nodes. Source-only require/import, top-level tooling, tests, board and AGENTS.md are NOT VERIFIED by graph; source sweeps and tests cover these edges. Prior backlog format, board app and node-only-board deliveries are live; no dropped replacement was identified in resolved history. AGENTS.md changes are explicit F6 scope.

## Scope

### Includes

- **F1 [internal]** — `scripts/build.js`: allow exactly three additional full paths `scripts/backlog-id.cjs`, `scripts/backlog-git.cjs`, `scripts/backlog-commit.cjs`. Keep nested lookalikes/unrelated sources rejected. Product gate tests belong to F2 ownership and must be prepared before F1.
  - **Produces:** native-backlog-source-allowlist.
  - **Validation:** L1 guard negative/positive cases and build policy.
- **F2 [product]** — `framwork/.codeadd/scripts/backlog-cli.cjs`, new adjacent `backlog-id.cjs`; `cli/tests/backlog-cli.test.js`, new `cli/tests/backlog-id.test.js`, `cli/tests/build.test.js`, `cli/tests/build-artefact-graph.test.js`: reusable local adapter, native allocation/file input and exact guard/node inventory tests. Core/storage behavior unchanged.
  - **Consumes:** native-backlog-source-allowlist (F1).
  - **Produces:** native-local-backlog-contract.
  - **Validation:** L1/L2.
- **F3 [product]** — new `framwork/.codeadd/scripts/backlog-git.cjs`, `backlog-commit.cjs`; new `cli/tests/backlog-publication.test.js`: migrate native publication and durable recovery with disposable repositories/remotes. No Bash subprocess.
  - **Consumes:** native-local-backlog-contract (F2).
  - **Produces:** native-publication-contract.
  - **Validation:** L3 route/failure/recovery matrix.
- **F4 [product]** — `framwork/.codeadd/scripts/backlog.sh`, `backlog-commit.sh`, tests `backlog.bats`, `backlog-commit.bats`; `cli/tests/installer.test.js`, `install.e2e.test.js`, `updater.test.js`, `board-runtime.test.js`: thin wrapper cutover and actual install/update closure. Do not edit installer/updater source unless failing evidence shows copying needs correction; that requires a plan file-map amendment first.
  - **Consumes:** native-publication-contract (F3).
  - **Produces:** installed-native-backlog-closure.
  - **Validation:** L4 and existing Bats suites.
- **F5 [product]** — `framwork/.codeadd/skills/add--backlog/SKILL.md`, its `references/lifecycle.md`; `add--doc-schemas/SKILL.md`, `add--doc-schemas/references/backlog.md`, `add--ecosystem/SKILL.md`, `add--id-convention/SKILL.md`, `add--resource-path-convention/SKILL.md`; six `framwork/.codeadd/fragments/board/add-{brainstorm,build,done,hotfix,new,plan}.md`; `cli/tests/board-phase-writes.test.js`, `board-feature.test.js`: update native instruction ownership and relationship declarations. Inspect all six; modify only those needing content changes. Do not change injection slots, section IDs, feature defaults or lifecycle semantics.
  - **Consumes:** installed-native-backlog-closure (F4).
  - **Produces:** native-product-backlog-instructions.
  - **Validation:** L5 built/installed invocation and unchanged lifecycle checks.
- **F6 [internal]** — `workbench/commands/add-framework--backlog.md`, `workbench/skills/add-plan-authoring/SKILL.md` The Ticket, `workbench/provider-map.json`, `AGENTS.md`: native examples and overview, same lifecycle/resume rules. Keep cross-layer scripts as prose rather than dangling internal declarations. Generated inventory remains generator-owned. `scripts/run-tests.js` is conditional scope only if diagnosis proves its Bats entry execution is responsible; otherwise fix invocation/file-mode setup without authored harness edits.
  - **Consumes:** native-product-backlog-instructions (F5).
  - **Produces:** native-internal-backlog-instructions.
  - **Validation:** L5 product/internal parity, workbench build and Bats runner diagnosis.
- **F7 [product]** — `board/test/server.test.ts`, new `board/test/native-backlog.test.ts`, new `board/e2e/native-backlog.spec.ts`, `board/playwright.config.ts`, `cli/tests/board-runtime.test.js`: CLI mutation visible through API/SSE and browser, isolated standalone runtime, no Bash sentinel invocation. Extend config testMatch for the new spec and isolate writable fixtures from parallel existing tests. Do not modify server/UI production logic unless evidence reveals a defect and the file map is amended before editing.
  - **Consumes:** installed-native-backlog-closure (F4).
  - **Validation:** L6/L7 and current board suites.

### Does NOT Include

- Migrating delivered.sh, history or general status/next-id workflows away from Bash.
- HTTP writes/UI editing, a dashboard daemon requirement, redesign or board release distribution subtopic 004.
- New locking/reservation semantics for ticket allocation or automatic add retry/deduplication.
- Feature injection grammar or STEP-ID changes.

## Validated Decisions

| Question | Decision | Basis |
|---|---|---|
| Runtime | Native Node/Git on three OSes | User rejected mandatory WSL |
| Entries | Separate local/publication CLI | User approved explicit boundary |
| Git destination | Existing base/worktree policy | User approved continuity |
| IDs | Existing calculation, no reservation | User approved parity |
| Failure output | Add persistence/recovery keys, retain existing codes/keys | User approved after design review |
| Build handoff | Stop after this reviewed plan for model switch | Explicit user override of automatic mode |

## Accepted Trade-offs

| Gain | Cost |
|---|---|
| Native cross-platform backlog | Migration of Git coordination and instructions |
| Durable failed-publication recovery | Recovery refs/retained paths need explicit lifecycle |
| Existing shell callers supported | Compatibility tests still require Bash in CI |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Lost unpushed or uncommitted work | High | F3 recovery refs/retained trees; L3 recover after cleanup and gc |
| Unrelated staged changes published | High | F3 path-isolated commits; L3 inspect commit tree and index |
| ID drift/exhaustion | Medium | F2 raw-scan parity and overflow refusal; L2 |
| Record path changes in worktree | High | F2/F3 read before routing; L2/L3 |
| Installed closure missing | Medium | F4 entry-point install/update tests; L4 |
| Native instructions retain shell pipeline | High | F5/F6 built/installed sweeps and lifecycle equality; L5 |
| Passing tests conceal untested native route | High | F7 cross-platform evidence and no-Bash sentinel; L7 |

## Impact — Complete Authored File Map

| Block | Layer | Files / action |
|---|---|---|
| F1 | internal | Modify `scripts/build.js` |
| F2 | product | Modify `framwork/.codeadd/scripts/backlog-cli.cjs`; create `framwork/.codeadd/scripts/backlog-id.cjs`; modify `cli/tests/backlog-cli.test.js`, `cli/tests/build.test.js`, `cli/tests/build-artefact-graph.test.js`; create `cli/tests/backlog-id.test.js` |
| F3 | product | Create `framwork/.codeadd/scripts/backlog-git.cjs`, `backlog-commit.cjs`, `cli/tests/backlog-publication.test.js` |
| F4 | product | Modify `framwork/.codeadd/scripts/backlog.sh`, `framwork/.codeadd/scripts/backlog-commit.sh`, `framwork/.codeadd/scripts/tests/backlog.bats`, `framwork/.codeadd/scripts/tests/backlog-commit.bats`; modify `cli/tests/installer.test.js`, `cli/tests/install.e2e.test.js`, `cli/tests/updater.test.js`, `cli/tests/board-runtime.test.js` |
| F5 | product | Modify `framwork/.codeadd/skills/add--backlog/SKILL.md`, `framwork/.codeadd/skills/add--backlog/references/lifecycle.md`, `framwork/.codeadd/skills/add--doc-schemas/SKILL.md`, `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md`, `framwork/.codeadd/skills/add--ecosystem/SKILL.md`, `framwork/.codeadd/skills/add--id-convention/SKILL.md`, `framwork/.codeadd/skills/add--resource-path-convention/SKILL.md`; inspect/modify `framwork/.codeadd/fragments/board/add-brainstorm.md`, `framwork/.codeadd/fragments/board/add-build.md`, `framwork/.codeadd/fragments/board/add-done.md`, `framwork/.codeadd/fragments/board/add-hotfix.md`, `framwork/.codeadd/fragments/board/add-new.md`, `framwork/.codeadd/fragments/board/add-plan.md`; modify `cli/tests/board-phase-writes.test.js`, `cli/tests/board-feature.test.js` |
| F6 | internal | Modify `workbench/commands/add-framework--backlog.md`, `workbench/skills/add-plan-authoring/SKILL.md`, `workbench/provider-map.json`, `AGENTS.md`; conditional modify `scripts/run-tests.js` only for confirmed harness permission defect |
| F7 | product | Modify `board/test/server.test.ts`, `board/playwright.config.ts`, `cli/tests/board-runtime.test.js`; create `board/test/native-backlog.test.ts`, `board/e2e/native-backlog.spec.ts` |

No authored deletions. Generated provider output and board/runtime are regenerated, not edited. Shared board-runtime.test.js changes are staged by their F4/F7 purpose. Root CI changes, installer/updater production changes or discovered server/UI defects require explicit plan amendment/file ownership before implementation.

The Impact table is the authoritative exact write-target list for each F-block. Scope prose names responsibilities; any abbreviated reference there resolves only to the full path in this table, never to a path inferred from cwd.

## Validation Matrix

Prepare new regression assertions before their owning implementation and record RED on current behavior. Existing preservation tests are baseline and need not be artificially failed. All mandatory outcomes require current-HEAD evidence in the build ledger; no conditional test bypass counts as passed.

| Requirement | Owner | Observable proof |
|---|---|---|
| R1 Native seven-mode entry | F2 | L2 persisted fixtures and outputs with Bash absent |
| R2 Global IDs | F2 | L2 Node/two-shell parity plus exhaustion refusal |
| R3 Base/worktree routing | F3 | L3 inspect branches, remote and commit contents |
| R4 Durable failure recovery | F3 | L3 recover data after cleanup/gc using reported path/ref |
| R5 Installed native closure | F1/F4 | L1/L4 install/update execute entries |
| R6 Native instructions/lifecycle | F5/F6 | L5 built/installed calls and phase equality |
| R7 Dashboard integration/standalone | F7 | L6 HTTP/SSE/browser after real CLI mutation |
| R8 Cross-platform and compatibility | F4/F6/F7 | L7 per-OS evidence and actual Bats results |

### L1 — Source and distribution gates

Allow exactly six canonical CJS paths (existing three plus new three). Reject nested same basenames and unrelated JS/CJS. Graph gains exactly three script nodes, with valid changed uses declarations and unchanged injection target map. Board copier closure remains exactly core/storage and byte-identical; unconditional source-presence assertions. RED: new paths rejected/modules absent.

### L2 — Native local adapter and allocator

All seven operations over disposable roots; preserve damaged rows, definitions provenance/seeding, refusal precedence, statuses, timestamps, fields and diagnostic ordering. File/stdin modes, alternate cwd, spaces/Unicode, option-looking IDs/search text, duplicate/missing file option and unreadable file. File plus interactive/closed-empty/open-empty/nonempty stdin never reads stdin or hangs. Local reads need no Git. Test no shell subprocess and no Bash available.

Allocator fixtures: absent/empty sources, mixed letters, immediate directories only, parent digits, slug years, damaged JSON, raw field whitespace matching parity, work_id substring, title/note false positives, unreadable sources, explicit valid/invalid/empty legacy metadata and 9999 exhaustion. Compare both shell calculators on readable fixtures before wrapper migration; compare native refusal at overflow with old wrapper+CLI behavior. RED: native add and file entry fail today.

### L3 — Native Git matrix and recovery

Disposable local repositories and bare remotes, no real repository mutation. Direct base, feature branch, detached HEAD and linked worktree; base checked out elsewhere; no repository/base/remote; locked/stale worktrees; worktree creation/lock failure; unrelated staged/unstaged files and staged backlog changes. Inspect commits and preserve caller index/worktree.

Inject staging/commit failure, fetch failure with stale FETCH_HEAD, rebase conflict/abort failure, push refusal, recovery-ref failure, base divergence/update failure, cleanup failure. Include a pre-existing matching recovery ref and a ref changed before deletion; neither may be deleted by this invocation. Combine direct routing and a remote requiring reconciliation with staged backlog content and unrelated staged/unstaged changes. Verify unchanged caller bytes/staged intent under successful commit and safe dirty-tree degradation; exercise conflict/abort failures on clean direct routes and verify recovery without destructive cleanup. Assert exact old keys/codes plus new persisted/committed/path/ref states. Recover uncommitted bytes using path; recover unpushed commit using ref after worktree removal and `git gc --prune=now`; confirm remote after successful push. Never sweep retained dirty/unprotected recovery work. Ref refusal happens before overwriting any old recovery state. RED: native entry absent and old cleanup/reporting lacks proofs.

### L4 — Compatibility and installed closure

Execute old wrapper commands and current Bats suites; valid contract parity including allocation, refusal and publication results, allowing approved additive diagnostics. Actual installer/update entry fixtures ship six CJS modules plus wrappers, preserve hashes/bytes and execute native local/publication entries in a different project without source-checkout imports. Update refreshes all runtime modules. Diagnose Bats permission error, record actual passing suite evidence. RED: new install entry closure absent.

### L5 — Instruction and lifecycle migration

Build product/workbench and inspect installed enabled-board instructions. No native backlog recipe uses bash, grep, printf, status.sh or shell redirection to supply records. Optional compatibility references are clearly marked. All six fragments retain injection sections and ticket lifecycle operations; add-new direct script edge becomes Node publication edge. Product/internal phase and work_id/resume/degradation equality remains tested. Resource convention accepts literal `.codeadd/scripts/*.cjs`; no raw command/skill paths. RED: current recipes require Bash.

### L6 — HTTP/SSE/browser and isolated closure

Launch Node server with no Bash executable and sentinel shell forbidden. Mutate an independent fixture via native CLI; assert API order/details and SSE event; browser card appears/updates without reload using bounded event waiting. Separate mutable fixture/server from fully-parallel existing tests; no writes to real backlog. Relocate only server, dist fixture and generated core/storage and verify API without CLI/source checkout. Keep read-only method rejection and absence of HTTP-created project files. Run build, typecheck, all board unit and browser suites on newly built app. RED: integrated native add cannot run today.

### L7 — Platform evidence

Windows native PowerShell Node/Git with Bash/WSL absent: seven modes, publication and server/UI cycle. Linux and macOS execute the same native behavior suite; shell compatibility separately. Record platform, versions, command, HEAD and outcome. Unavailable macOS is unverified and cannot silently satisfy R8: provision execution or stop delivery with missing evidence. Node truly absent: optional wrapper prints dependency error and native runtime requirement is documented. WSL login/non-login reproductions document the old failure but are not native prerequisites. Existing CI Linux/macOS runners may be used without expanding this plan to unrelated CI policy.

GREEN means R1–R8 have passing evidence, required layer builds/tests pass and one final audit is resolved. No regression-test source grep substitutes for operation/Git/recovery proof.

**Acceptance amendment — 2026-10-04:** the user explicitly accepts partial platform validation because no Mac is available. Windows-native and Linux/Docker evidence stand; macOS is not executed. This amendment supersedes the L7 stop-delivery requirement for unavailable macOS and the F9 requirement to keep acceptance pending. Delivery is accepted as partially validated; no macOS execution is required to close this work.

## Execution Order

1. F1 [internal]: exact source gate, with F2-owned gate tests prepared RED first. Those test edits remain uncommitted through the F1 implementation-only commit. Run F1 GREEN against the pending test edits and record evidence; commit the tests with F2. Do not stage F2 tests into F1.
2. F2 [product]: native local entry and allocator; old wrappers remain intact at this checkpoint.
3. F3 [product]: native publication and recovery; complete both Node routes before cutover.
4. F4 [product]: wrappers and install/update closure; existing callers work again through shared Node routes.
5. F5 [product]: native product instructions and lifecycle proof.
6. F6 [internal]: internal owner, overview and confirmed harness repair if needed.
7. F7 [product]: native dashboard integration and platform acceptance.

One commit per F-block under build ledger rules. Stop at failed evidence rather than record a scope waiver. Capture platform proof before declaring complete. User switches model before starting this sequence.

## Reviewer Handoff

Audit missing native boundaries (especially allocation/base discovery still shelling out), duplicate domain logic, caller-relative input, staged-file isolation, detached recovery durability, stale FETCH_HEAD use, unchecked cleanup, installed module closure, lifecycle graph declarations and conditional acceptance skips. For each F-block record files, RED/GREEN tests and current-HEAD requirement evidence in the ledger. No separate review/verdict file. Do not grade Docker proof as Windows acceptance or existing built UI as new integration proof.

## References

- `docs/deliveries/2026-10-03T122024-PLAN--node-only-board/plan.md` and ledger: shared core and validation gaps.
- `framwork/.codeadd/scripts/backlog-commit.sh`, `get-main-branch.sh`: publication policy authority.
- `framwork/.codeadd/scripts/next-id.sh`, `status.sh`: allocation parity authority.
- Approved design/intent in Context above.

## Next Steps

STOP after reviewed plan delivery. User changes model, then runs `/add-framework--build native-node-backlog`.

## Approved Review Follow-up — 2026-10-04

The user requested a persisted `--review.md` companion and authorized its corrections. The original F1–F7 remain complete; this follow-up does not rerun the prior audit or waive L7.

- **F8 [product]** — modify `framwork/.codeadd/scripts/backlog-git.cjs`, `backlog-commit.cjs`, `backlog-cli.cjs`, `framwork/.codeadd/skills/add--backlog/SKILL.md`, `cli/tests/backlog-publication.test.js`, `cli/tests/backlog-cli.test.js`, `board/e2e/native-backlog.spec.ts`, `board/playwright.config.ts`. Fix C1, M1–M4 and m1–m3. Use an isolated index and a three-way merge of the operation delta onto HEAD; preserve pre-existing staged blobs. Overlapping/unreadable caller state degrades without committing or changing the caller index. Capture locks are released on normal retained-tree exits. Validate RED-first regression cases, CLI suite, wrapper compatibility and board/browser checks.
- **F9 [internal]** — modify this plan, its existing ledger, `docs/plans/2026-10-04T004044-PLAN--native-node-backlog--review.md` and `docs/changelog/2026-10-04-native-node-backlog.md`. Preserve the original findings, record corrections/evidence and explicitly keep R8 pending until missing platform execution exists. A review companion is an explicit user deliverable, overriding the build's default of no review file.

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-04 | Initial plan from reviewed 0019B design; native entries, recovery, distribution/instructions and dashboard acceptance; explicit pre-build model-switch hold |
| 2026-10-04 | Review fixes: distinguish direct commits from detached ref updates; atomic recovery-ref ownership/deletion; safe dirty-caller reconciliation; gate-test commit ownership and exact write paths |
| 2026-10-04 | **implemented** on feat/native-node-backlog in F1–F7 (one commit per block) plus an adversarial audit pass; commits and the changelog row recorded in docs/changelog/2026-10-04-native-node-backlog.md |

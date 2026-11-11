# Plan: Node-only board — one backlog core, CLI and HTTP adapters

> **Status:** draft
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-10-03
> **Updated:** 2026-10-03
> **Delivery:** confirm

## Objective

[from conversation, no design document; revised by explicit user approval]

Centralize backlog reading and writing in one Node core consumed by the agent CLI and the board HTTP server. Make the board UI/server work without shell scripts while preserving the agents' current commands and behavior and keeping Git publication separate.

**When this build is done:** Ticket validation, operations and persistence have one authored implementation. Agents reach it through their existing shell commands and a Node CLI adapter; the board reaches it directly through its Node HTTP server. Agents do not need a running dashboard. The board remains read-only.

## Context

The Windows board launched its UI but failed its data request because `board/server.mjs` resolves bare `bash` to the WSL launcher. Separator conversion does not fix that interpreter mismatch. The original plan extracted only a reader. The user then explicitly approved the broader architecture: shared core/storage with CLI and HTTP adapters, rather than two places maintaining rules.

This revision replaces the reader-only proposal in place, retaining its basename and confirmation delivery mode. No design or intent document exists. Strategy documents were unavailable; AGENTS.md, the product ecosystem/resource-path owners, code inspection and archived backlog/board deliveries supply context.

The canonical operations currently live inside a JavaScript string in `backlog.sh`. `backlog-commit.sh` separately chooses the Git route and calls that script from the selected project/worktree. Preserve that meaningful boundary.

Zero npm dependencies permits adjacent local modules. CommonJS supports the existing Node 18 baseline and can be imported by the ESM board server. Root `board/` and `mcp/` are product. Board release distribution subtopic 004 is not implemented in this checkout and is outside this revision.

## Global Constraints

- "lets remove board sh script dependency (let it work with ui and server only node based)" (user approval).
- "for agents, lets keep it as how it is working today" (user approval).
- "Refaça o plano para refatorarmos como funciona o board para trabalhar desta forma que vc citou em \"3. A arquitetura que eu recomendo\"" (user approval of core/storage/CLI/HTTP architecture).
- "Dependencies: bash 3.2+, node >= 18" (`backlog.sh` header; existing agent baseline).
- "THIS SCRIPT WRITES FILES AND NEVER COMMITS." (`backlog.sh` header; preserve behavior through delegated operations).
- "THE STATUS VOCABULARY BELONGS TO THE USER." (`backlog.sh` header).

## Problem

1. The board's Node server launches Bash, which launches another Node process merely to read backlog data.
2. Extracting only reads leaves write rules trapped in the shell wrapper and does not establish a reusable domain boundary.
3. The existing no-import/shell-only-reader rule confuses transport with single ownership of business logic.
4. Generated runtime and installed agent files must carry the same canonical code without creating additional authored copies.
5. A shipped-source guard currently rejects the required runtime modules.

## Proposal

### Canonical sources and dependency direction

Use exactly three flat product modules under `framwork/.codeadd/scripts/`:

| Source | Responsibility | Dependencies |
|---|---|---|
| `backlog-storage.cjs` | Read raw ordered rows and definitions; seed missing definitions when explicitly requested; persist rows preserving existing bytes/serialization | Node built-ins only |
| `backlog-core.cjs` | Defaults, list/search/add/update/comment/move/remove, validation ordering, diagnostics and persistence orchestration | Adjacent storage and Node built-ins |
| `backlog-cli.cjs` | Existing positional grammar, stdin, allocation metadata, usage, stdout/stderr and exit codes | Adjacent core and Node built-ins |

`backlog.sh` becomes a compatibility wrapper: Node dependency guard, existing add-ID allocation through `status.sh next-id B`, and invocation of the adjacent CLI with original arguments. `backlog-commit.sh` remains the unchanged Git-publication adapter.

```text
Agent read → backlog.sh → Node CLI → core → storage → project files
Agent write → backlog-commit.sh → selected project/worktree
            → backlog.sh → Node CLI → core → storage → project files
            → backlog-commit.sh commits/synchronizes and reports

Board UI → GET /api/board → Node server → core.list(all) → storage → project files
Filesystem watch → server SSE → UI refetch
```

There is no mandatory agent HTTP client or running service. The HTTP server exposes existing read routes only; importing a write-capable core does not add mutation endpoints.

### Core/storage contract

The core exposes one `executeBacklog` operation interface taking an explicit absolute `root`, a normalized `mode`, mode-specific fields, raw record text for record modes and a supplied `newId` for add. The CLI normalizes its existing grammar; HTTP calls list-all directly. The core never accesses argv/stdin, renders output, exits, changes cwd, invokes shells/Git or discovers the global ID itself.

Success results distinguish reads and writes: read results include presence, total, returned ordered raw rows/parsed tickets, diagnostics and definitions provenance; write results include ticket ID and buffered diagnostics. Refusals and anticipated write failures use structured results carrying the existing refusal name or write-failure reason. Unanticipated read exceptions propagate to the adapter: HTTP returns bounded read-failure JSON; CLI leaves the filesystem error as an unhandled failure, as today, rather than inventing a new public error code.

Storage returns backlog presence and ordered `{ n, text, ticket|null }` rows. Definitions distinguish `absent`, `invalid` and `usable`; return usable raw definitions or null, plus diagnostic information distinguishing JSON/read failure from silent wrong-shape fallback. Core owns default definitions and chooses effective definitions. Storage seeds absent definitions only when core explicitly requests it in a write operation. No import-time reads/writes or initialization. Independent roots can be operated on in one process without shared mutable request state.

Keep the existing operation sequence and refusal precedence. In particular, load backlog before definitions, seed absent definitions for writes before record/target validation, and resolve update/comment targets before parsing their records. No new schema validation on reads. Default vocabulary remains defined once in core, not duplicated in storage, CLI or HTTP.

### CLI/wrapper contract

Keep agent commands verbatim: `bash .codeadd/scripts/backlog.sh <mode> ...` and the existing `backlog-commit.sh` routes. Move argument parsing, usage rendering and record consumption to CLI. Preserve ignored surplus arguments, nonempty-only ID checks, list default `open`, `--status "*"` all-filter behavior and move refusal names. Consume stdin only for add/update/comment.

Wrapper allocates an ID only when its first argument is exactly `add`, after checking Node. The current add grammar performs no additional positional validation before allocation. Pass the allocated ID as dedicated `BACKLOG_NEW_ID` environment metadata, not an agent positional argument. CLI reads it only for add; direct CLI add without a valid four-digit B ID returns the existing `ERROR=id-allocation-failed`, exit 1. Other operations do not allocate IDs. Resolve CLI from `SCRIPT_DIR`, independent of project cwd and paths with spaces.

CLI retains stdout/stderr ordering, repeated diagnostic keys, raw row output and codes 0/1/2. Successful writes print buffered diagnostics then `TICKET_ID`; refusals/write failures discard buffered diagnostics and print only their current failure line. `backlog-commit.sh` still extracts `TICKET_ID` and preserves write failures.

### Board runtime and API

Deterministically copy only core and storage to `board/runtime/`; server imports the adjacent core. The complete standalone runtime is `server.mjs`, `runtime/backlog-core.cjs`, `runtime/backlog-storage.cjs`, and `dist/`. No CLI or shell file is required. There is one authored source and generated byte-identical copies, not separately maintained implementations.

The board maps usable definitions from the core result using its existing allowlist/sort presentation adapter. It no longer independently parses definitions or ticket files. Retain statuses derived from tickets for absent/invalid definitions and suppression of undefined-status warnings in that case. Definitions-only presence requires usable project definitions, not fallback defaults.

Keep routes, layer opt-in, Host checks, localhost binding, port fallback, SSE and browser opening. Accept legacy `--scripts <value>` and ignore it without filesystem checks; maintained launchers stop passing it. Genuine read errors use `backlog-read-failed` with capped details. Missing backlog stays an empty state. Board now includes leading-whitespace object rows accepted by the canonical parser; this is an explicit correction to the old stdout adapter's accidental omission.

### Distribution and graph boundaries

Allow exactly `scripts/backlog-storage.cjs`, `scripts/backlog-core.cjs`, `scripts/backlog-cli.cjs` relative to the canonical shipped tree. Reject unrelated lintable files, nested basename lookalikes and broad directory/extension exceptions. Existing installer/updater/release copying already includes scripts siblings; prove entry-point installation/update correctness.

The existing graph collector indexes all three direct files as script nodes. Do not introduce a new dependency-marker language or graph kind. The graph does not model JavaScript require/import edges or internal shell calls; label that limitation and prove architecture edges through executable integration/packaging tests instead of claiming inferred graph completeness.

## Current State and Ecosystem Impact

| Component | Current dependency evidence | Impact / grade |
|---|---|---|
| `product/script/backlog.sh` | Graph depth 1: `product/skill/add--backlog`; no declared outbound dependencies | MEDIUM graph caller count; preserve public CLI |
| `product/script/backlog-commit.sh` | Graph callers: `product/skill/add--backlog` and board add-new fragment; source invokes backlog and branch resolver | Unmodified publication route; compatibility tested |
| `board/server.mjs` | Source: spawns Bash and parses stdout | Not a graph node; risk NOT VERIFIED by graph, behavioral tests required |
| `scripts/build.js` | Source: shipped-source rejection and script-node inventory | Not a graph node; guard regression tests required |
| New modules | Not present; runtime edges specified above | New nodes, callers not yet queryable |

The current artefact graph omits board/server, top-level build tooling and shell-internal calls. Product-layer history for backlog.sh is unavailable (`delivered.sh exited 127`); do not describe that as no prior delivery. Archived backlog-format and board-app plans establish compatibility context. No AGENTS generated inventory is hand-edited.

## Scope

### Includes

- **F1** [internal] — `scripts/build.js`, `scripts/build-board-runtime.js` (new), `.gitignore`: add exact three-file guard exceptions and a builtins-only copier for core/storage resolved relative to its own script. Copy to generated board runtime with freshness/replacement checks; fail clearly if source is missing. Prune only obsolete files within the explicitly generator-owned `board/runtime/` directory; investigate any pre-existing contents before claiming that ownership. Keep other shipped-source restrictions intact. Graph collector uses existing behavior with no declaration extension.
  - **Produces:** `board-core-runtime`: generated byte-identical core/storage at `board/runtime/`.
  - **Produces:** `backlog-runtime-allowlist`: only the three named canonical shipped CJS modules permitted.
  - **Validation:** L1 exact guard negatives; L4 preparation and copy closure. Missing source is an explicit intermediate state until F2. Product tests for this internal tooling live in F2.
- **F2** [product] — create `framwork/.codeadd/scripts/backlog-storage.cjs`, `backlog-core.cjs`, `backlog-cli.cjs`; modify adjacent `backlog.sh` and `tests/backlog.bats`; create `cli/tests/backlog-core.test.js`, `cli/tests/backlog-cli.test.js`, `cli/tests/board-runtime.test.js`; modify `cli/tests/build.test.js`, `cli/tests/build-artefact-graph.test.js`, `cli/tests/installer.test.js`, `cli/tests/install.e2e.test.js`, `cli/tests/updater.test.js`. Extract the complete operation implementation and CLI, preserving existing behavior, order and file side effects. Replace source-location tests for defaults/refusal literals with canonical-owner or behavioral assertions. Preserve global ID delegation and no-Git boundary; remove embedded operation code from wrapper. Use actual install/update entry points for fixture coverage, not helper-only tests.
  - **Consumes:** `backlog-runtime-allowlist` (F1).
  - **Produces:** `backlog-operation-contract`: root-explicit operations, structured results, raw-row durability, definitions provenance and no transport/Git side effects in core.
  - **Validation:** L1 domain/storage, L2 CLI/wrapper and L4 packaging. All seven modes remain supported; shell wrapper and Git adapter tests must prove unchanged public behavior.
- **F3** [product] — `board/server.mjs`, `board/package.json`, `board/playwright.config.ts`, `board/vite.config.ts`, `board/src/api/types.ts`, `board/src/components/states.tsx`, `board/test/server.test.ts`, `board/test/states.test.tsx` (new): directly call the generated core; eliminate backlog subprocess, stdout parser and independent definitions parser. Prepare runtime before build, unit tests and Playwright startup. Keep adapter/presentation behavior and read-only endpoints. Replace obsolete shell failure expectations and UI advice with data-read errors and legacy-argument compatibility checks.
  - **Consumes:** `board-core-runtime` (F1).
  - **Consumes:** `backlog-operation-contract` (F2).
  - **Validation:** L3 HTTP/UI and L4 isolated runtime acceptance.
- **F4** [internal] — `package.json`, `AGENTS.md`, `.github/workflows/ci.yml`: remove maintained `--scripts` launch argument, prepare runtime for `npm run board` through a lightweight preboard hook, and update anatomy/rules to one core with CLI/HTTP adapters and separate Git publication. Update stale board CI comments; rely on board package preparation hooks so tests-before-build works. Keep generated inventory unchanged. State all three authored sources and the two generated board copies clearly.
  - **Consumes:** `board-core-runtime` (F1).
  - **Validation:** L4 clean launch/setup and source guidance checks.

### Does NOT Include

- Mandatory HTTP access for agents or a daemon/service lifecycle.
- Board mutation endpoints, UI editing, or moving commit/push into HTTP/domain code.
- Refactoring `backlog-commit.sh`, `status.sh` or agent workflow instructions.
- Fixing unrelated Bash selection in graph CLI, MCP or add-wiki.
- Global-counter redesign, new locking/concurrency guarantees or changing file-write atomicity.
- Separate board release asset/installer (distribution 004), UI redesign or npm runtime dependencies.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Rules ownership | One core for all seven operations | User approved centralizing reads and writes |
| Agent access | Existing shell wrapper over Node CLI | No agent command migration or running service |
| Dashboard access | HTTP adapter imports core directly | Shell-free board with no second domain implementation |
| Persistence | One local storage module | One authority for row parsing and serialization |
| Git publication | Existing separate wrapper | Commit route is distinct from domain mutation |
| UI capabilities | Read-only | Current scope changes architecture, not product interaction |
| Source ownership | Canonical modules, generated local copies | Same code shipped in two closures, one place to maintain |
| Runtime baseline | Builtins-only CJS, Node 18+ | Works under ESM server and existing shell runtime |

## Accepted Trade-offs

| Gain | Cost |
|---|---|
| Centralized reads/writes | Broader extraction than the earlier reader-only fix |
| Agents independent of dashboard lifecycle | CLI and HTTP retain separate transport formatting |
| Board independent of shell/framework scripts | Generated core/storage copy must be refreshed |
| Preserved observable agent behavior | Existing quirks and concurrency limitations remain |

## Risks and Mitigations

| Risk | Probability | Operational mitigation |
|---|---|---|
| Changed validation/side-effect order | High | F2 and L2 characterization of refused writes, ID allocation and diagnostics |
| Two authored implementations emerge | Medium | F2/F3 executable parity; wrapper/HTTP contain only adapter logic; one canonical default vocabulary |
| Runtime copy missing or stale | Medium | F1/F3/F4 preparation hooks and L4 byte equality/isolated bundle |
| Broad source guard exception | Medium | F1 path-specific policy and L1 unrelated-source negatives |
| Importing core initializes/writes files | Medium | F2 import/no-write tests; F3 read-only API tests |
| Definitions fallback drift | Medium | F2 provenance contract and L3 presentation cases |

## Impact

| Block | Layer | Complete authored file set |
|---|---|---|
| F1 | internal | `scripts/build.js`, `scripts/build-board-runtime.js` (new), `.gitignore` |
| F2 | product | `framwork/.codeadd/scripts/backlog-storage.cjs`, `framwork/.codeadd/scripts/backlog-core.cjs`, `framwork/.codeadd/scripts/backlog-cli.cjs` (new); `framwork/.codeadd/scripts/backlog.sh`, `framwork/.codeadd/scripts/tests/backlog.bats`; `cli/tests/backlog-core.test.js`, `cli/tests/backlog-cli.test.js`, `cli/tests/board-runtime.test.js` (new); `cli/tests/build.test.js`, `cli/tests/build-artefact-graph.test.js`, `cli/tests/installer.test.js`, `cli/tests/install.e2e.test.js`, `cli/tests/updater.test.js` |
| F3 | product | `board/server.mjs`, `board/package.json`, `board/playwright.config.ts`, `board/vite.config.ts`, `board/src/api/types.ts`, `board/src/components/states.tsx`, `board/test/server.test.ts`, `board/test/states.test.tsx` (new) |
| F4 | internal | `package.json`, `AGENTS.md`, `.github/workflows/ci.yml` |

Generated output: `board/runtime/backlog-core.cjs`, `board/runtime/backlog-storage.cjs`. No authored file deletion. No reader-only helper was implemented; do not claim it is an existing file to remove.

## Validation Matrix

Prepare meaningful new regression tests before implementation and record RED failures. Existing compatibility tests are baseline protection and need not fail before extraction. Behavioral assertions take precedence over implementation-mirroring source greps.

### L1 — Domain/storage and distribution guard

1. Execute all seven operations through core with independent roots in one process. No argv/stdin/stdout, process exit, shell/Git invocation, cwd mutation or import-time I/O. List/search do not create files.
2. Characterize existing absent/empty backlog semantics: an existing empty file currently has one damaged empty row. Preserve line numbers, raw whitespace/CR, primitive/null/array rejection and permissive object reads. Undefined statuses are first-seen unique across all parsed rows, not only filtered hits.
3. Preserve default/custom definitions and absent/invalid/usable provenance, including invalid JSON diagnostic versus silent wrong-shape fallback. Default vocabulary has one canonical owner.
4. Guard permits exactly three full relative paths; unrelated CJS/JS files and nested same-basename files still fail. Existing graph inventory gains exactly three script nodes; unrelated nodes/edges unchanged. No claim of inferred require/import edges.

### L2 — CLI/wrapper/Git-route compatibility

1. Existing backlog bats and backlog-commit bats pass using the extracted implementation. Cover add allowlist versus update arbitrary fields, reserved fields, comment repair, timestamp precision, default definitions seeding and raw damaged-row preservation.
2. Refused writes preserve ordering: unknown target before invalid record; ID allocation before add record validation; absent definitions seeded before operation refusal; backlog read failure before seeding. Invalid JSON/reserved/required/status/duplicate precedence remains.
3. Preserve ignored extra args, option-looking IDs, `list ""`, `list --status "*"`, first search argument and move-after-self refusal. Non-record modes return without consuming open stdin. Node guard runs before any allocation/I/O.
4. Preserve diagnostic ordering and exact failure/success lines and codes. Buffered diagnostics disappear on refusal/write failure. Capture current shell output as characterization fixtures before replacement; compare records ignoring only explicitly variable timestamps/new global IDs.
5. Direct CLI add missing/bad `BACKLOG_NEW_ID` returns allocation failure; wrapper delegates to existing global allocator. Run wrapper from another cwd and a path with spaces. Existing allocator agrees; no new independent counter.
6. Compare direct core results with rendered CLI list/search outputs and resulting mutation files for equivalent fixtures. Verify `backlog-commit.sh` still receives TICKET_ID and propagates refusals without a running board server.

### L3 — HTTP and UI adapter

1. Existing server tests retain ordered tickets, flags, columns, definitions-only presence, absent/invalid definitions, damage/undefined-status reporting, Host validation, traversal protection, port fallback and SSE.
2. Launch via absolute Node with `--no-open`, PATH containing no Bash, and a missing legacy `--scripts` location: API succeeds. Fake Bash sentinel is never called. No CLI process is launched for reads.
3. HTTP maps usable definitions from core, not from a second file parser. Include leading-whitespace object rows; unknown statuses remain suppressed when deriving statuses without usable definitions.
4. Filesystem read failure becomes bounded `backlog-read-failed` JSON; corrected data can be read later without restarting server. Missing backlog stays empty. Mutating HTTP methods remain refused and no project files are created by reads.
5. Error UI describes data-read failure without Bash-install advice; current three-viewport Playwright flow passes.

### L4 — Packaging, standalone closure and native acceptance

1. Copier overwrites stale generated modules and leaves exactly core/storage in its owned directory, with byte equality to canonical sources. Missing canonical source fails clearly; arbitrary cwd does not change copy paths.
2. Install/update through actual entry-point fixtures packages all three modules, preserves bytes and manifest hashes, and runs installed shell modes against another project. Include allocator siblings for add. Updates refresh all related modules together.
3. Relocate only server + generated core/storage + dist fixture into an isolated temporary directory; use project backlog files without framework scripts, CLI or source checkout dependencies. Shell-free API succeeds.
4. Clean-checkout board tests before UI build, setup, build:board, preboard launch and Playwright each prepare runtime. Tests cannot pass by importing the canonical checkout source instead of the generated copy.
5. Native Windows board/server acceptance shows real tickets with no Bash available. Run targeted native board checks as well as required normal build/CLI/script gates; Linux/container-only results do not prove the original scenario.

**RED today:** no core/storage/CLI modules or local runtime, board spawns Bash, UI errors require scripts and shipped-source guard rejects new modules. **GREEN:** one canonical domain/persistence implementation, both adapters verified, existing shell contracts protected and standalone board shell-free.

## Execution Order

1. F1 [internal]: guard and runtime preparation tooling. Canonical modules are temporarily absent; board behavior remains existing.
2. F2 [product]: core/storage/CLI and shell cutover together. Product build and agent compatibility pass before dashboard cutover.
3. F3 [product]: board switches to local core and prepares runtime for its lifecycle. Dashboard becomes shell-free.
4. F4 [internal]: repository launcher and guidance describe the verified architecture.

One commit per F-block under build-ledger rules. F2 is the agent compatibility checkpoint; F3/F4 complete the standalone board. Prepare product test files for F1 coverage under F2's declared ownership before F1 changes. Intermediate checkpoints are explicit, not claimed final acceptance.

## Reviewer Handoff

Review the shared-core architecture as a revised subject, not another opinion on the old reader-only design. Audit accidental domain code left in shell/HTTP, duplicated defaults/parsers, core process side effects, ID/definition/refusal ordering, generated closure completeness, wrong layer tags, overly broad source allowances and unintended HTTP mutation routes. The graph does not certify JavaScript dependency edges.

The build ledger records changes and check outcomes. No review/verdict file is created.

## References

- `docs/deliveries/2026-09-21T145331-PLAN--backlog-board-002-board-app/plan.md`: API, read-only and single-reader intent.
- `docs/deliveries/2026-09-20T111051-PLAN--project-backlog-001-format-and-script/plan.md`: operation/format contract.
- `framwork/.codeadd/skills/add--doc-schemas/references/backlog.md`: ticket schema and diagnostics.
- `framwork/.codeadd/scripts/backlog-commit.sh`: unchanged publication boundary.
- `AGENTS.md`: product/runtime/workbench boundaries.

## Next Steps

`/add-framework--build node-only-board`

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-03 | Initial plan from user-approved Node-only board scope |
| 2026-10-03 | Review fixes to original reader-only proposal: layer tags, definitions provenance and explicit graph limits |
| 2026-10-03 | User-approved architecture revision: full shared core/storage, Node CLI and HTTP adapters; shell compatibility and separate Git publication; replaced reader-only extraction and dependency-marker extension |

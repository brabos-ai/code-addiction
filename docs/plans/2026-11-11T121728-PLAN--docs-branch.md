# Plan: docs-branch — every Code Addiction output lives on the `codeadd-docs` branch, at `.codeadd/docs/`

> **Status:** draft
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-11-11
> **Delivery:** confirm
> **Feature:** 0078F-docs-branch
> **Release:** minor (v1.9.0) — tagged by `add-framework--release`, not by this build

---

## Objective

[from conversation, no design document — the intent file is `architectural` with `doc: none`; the
objective below is its decision 1 + 2 + 3, restated without widening]

Every Code Addiction output stops being written into the user's code branch. It is written under
`.codeadd/docs/`, a git worktree of an orphan branch `codeadd-docs` in the project's own remote, so
docs no longer ride along in every PR and no branch carries its own stale copy. There is no flag, no
fallback and no mention of the previous location anywhere in the product or in this repository's
agent instructions; the one exception is the optional migrate command and its own tests.

**When this build is done:** one resolver owns the docs root; `status.cjs` prepares the docs worktree
on a fresh install, a fresh clone or a cloud agent; code worktrees see the same docs through a link;
every command writes and commits under `.codeadd/docs/`, `/add-done` pushes `codeadd-docs`, and the
code PR carries no Code Addiction doc; `docs-guard` silently moves a misplaced output; `codeadd docs
migrate` moves a legacy project idempotently and ends by printing a ready-to-paste prompt for the
user's own agent (D20); every generated artifact carries `schema: 1` in its frontmatter (or `v` on each
JSONL line), declared once and absent meaning legacy schema `0` (D21); this repository runs on its own
`codeadd-docs` branch; and a guard test proves that no old-path reference survives outside the
migration exception.

## Context

Every output (`features/`, `brainstorm/`, `diagnose/`, audits, health checks, `delivered.jsonl`,
`decisions.jsonl`) is hardcoded under the code checkout in ~330 product lines across 79 files plus
~10 duplicated constants in scripts and `mcp/`. Docs ride in every PR; each branch holds its own copy.

**Every decision here was taken in the document below. This plan does not re-derive them — it points
at them by number (`D1`…`D23`).**

| Document | Carries |
|---|---|
| `docs/brainstorming/0078F-docs-branch-intent.md` | Path `architectural`, `delivery: confirm`, decisions D1–D23 (storage, zero legacy, resolver, search line, setup, worktree link, commit/push policy, git handling, guard, no hooks, migrate, `touched` contract, ids, uninstall, this repo, release, **D20 migrate prompt**, **D21 schema version on every generated artifact**, D22 risks, D23 acceptance), `## Open: None`. D20 and D21 were added to this release's scope by Maicon on 2026-11-11; the former D20/D21 (risks, acceptance) are now D22/D23 |

**Prior art read** (delivery index, both layers):
- `2026-10-10T110912-PLAN--board-outside-code-branches` (live) — put the board on an orphan branch read
  through one clone **outside** the checkout, and rejected an in-repo worktree. What it rejected was a
  *detached per-write* `.worktrees/backlog` pushing to `main` (locks, `BASE_BRANCH`, `--ref`). This plan
  uses one *persistent* worktree of an orphan branch, never pushing to `main` — a different mechanism,
  but its lessons bind: identity fallback (its F11), a leftover worktree is clean only when its HEAD is
  contained in a ref (its F12), and tests must use a real separate remote, never one temp dir as both.
- `2026-10-29T223023-PLAN--remove-board` (live) — retirement never deletes a remote branch or user data.
  Same rule here for `codeadd-docs` (D17) and for the migrate command (D14).
- `2026-10-20T213806-PLAN--done-worktree` — `git worktree add` copies only tracked files and
  `doCommitPush` stages with `git add -A`; both shape F7 and F9.

## Global Constraints

- Docs root is the literal `.codeadd/docs/`; branch name is the literal `codeadd-docs` (intent D2)
- No feature flag, no fallback, no compatibility route, no "if the old path exists" logic, no mention of the old location outside the migration exception (intent D3; Maicon, 2026-11-11)
- The migration exception is exactly three paths: `cli/src/docs-migrate.js`, `cli/tests/docs-migrate.test.js`, `cli/tests/fixtures/docs-migrate/**` (intent D3/D14; Maicon's hard requirement — R2, R6). Nothing else is exempt: not `cli/src/migrations.js`, not `CHANGELOG.md`, not the guard test (it assembles its patterns from fragments so it never matches itself)
- No hooks of any provider — only scripts and instructions (intent D13)
- `status.cjs` never fails on the docs step; it prints one `DOCS=` line and carries on (intent D7)
- The `codeadd-docs` branch is never deleted by any command, uninstall or migration (intent D17, D14)
- `mcp/` takes no dependency and stays `.mjs` (AGENTS.md, Product Layer — `mcp/`)
- Never write a raw `.codeadd/` path for commands/skills; scripts are always `.codeadd/scripts/` (AGENTS.md, Pipeline) — the docs root is data, not an artefact path, so the literal `.codeadd/docs/` is allowed (R1)
- `node scripts/build.js` exits 0 and emits no new LINT warning (AGENTS.md, Pipeline)
- Native script tests pass on Linux and on Windows path semantics (intent D23)
- The doc schema version is declared once — `DOC_SCHEMA_VERSION` in `docs-root.cjs` — and reaches markdown only through the build variable `{{doc-schema}}`; no shipped markdown source carries a literal schema number (intent D21; R11)
- `codeadd docs migrate` never runs an agent and never stamps a version; it prints the prompt from its one template file (intent D20, D21)

## Problem

1. **Docs pollute the code branch** — every output lands in the user's code branch; every PR carries
   docs and every branch carries its own stale copy (D1).
2. **No central path** — the root is hardcoded in ~330 instruction lines and ~10 script constants
   (`status.cjs:69`, `feature-id.cjs:40`, `init.cjs:49`, `build-setup.cjs:59`, `migrate-ids.cjs:42-43`,
   `done.cjs:236-241`, `delivery-index-core.cjs:106,138,490`, `qa-evidence.cjs:502`,
   `get-branch-metadata.cjs:107`, `mcp/corpora.mjs:605`) (D1).
3. **`touched` depends on co-location** — `delivery-index-core.cjs:485-510` links an index entry to the
   code commit that introduced its line; once the index lives on another branch, that link is gone (D15).
4. **No doc format version** — a generated doc does not say which format it was written in, so a legacy
   doc cannot be told from a current one and a migrated project has no way to bring old docs up to the
   current standard (D20, D21).

## Proposal

Build bottom-up: a guard test first (RED), then one resolver and one git helper, then every script
onto them, then `mcp/`, then every agent instruction, then the CLI (install/update/uninstall and the
migrate command), then this repository's internal layer, and finally migrate this repository itself. The schema version
(D21) rides the same spine: its constant lands in the resolver (F2), its build variable right after
(F25), the frontmatter on every generated artifact once the instructions are rewritten (F26), and the
migrate prompt right after the migrate command (F27).
The guard turns GREEN only at the end, which is the proof that nothing was missed.

## Scope

### Includes

#### T1 — Zero-legacy guard (ref: D3, D23 zero-legacy bullet; Maicon's hard requirement)

- **F1** [product] — `cli/tests/docs-no-legacy.test.js` (new): reads every **tracked** file
  (`git ls-files`) as **whole-file text** (so a multi-line `path.join(` is seen) and fails on any hit of
  the L0 patterns outside the three exempt paths in Global Constraints, printing `file:line` per hit.
  The only normalisations are the closed ones L0 names (URL tokens stripped; the two non-path forms).
  Code-file exclusions for the MCP corpus *name* are an explicit `{file, regex}` list, and the test fails
  when an exclusion matches nothing, so the list cannot go stale or grow silently. Its patterns are
  assembled from fragments so the file never matches itself. A second case scans the built provider
  trees (`framwork/.claude`, `.agents`, … and root `.claude/`, `.opencode/`, `.agents/`, `.codex/`)
  when they exist. Written first and verified RED; see Execution Order for how the build carries it.
  - **Produces:** `docs-no-legacy` (the guard test name the build and done run)

#### T2 — Core scripts (ref: D2, D4, D7–D10, D12, D15, D16)

- **F2** [product] — `framwork/.codeadd/scripts/docs-root.cjs` (new): the single owner of the docs root.
  Exports `DOCS_ROOT` (`.codeadd/docs`), `DOCS_BRANCH` (`codeadd-docs`), `DOCS_LAYOUT` (output kind →
  sub-path: `features/`, `brainstorm/`, `diagnose/`, `audits/`, `health-checks/`, `qa/`, `hotfixes/`,
  `changelog/`, `analysis/` (`add-help`), `product/` (`add-new`), `delivered.jsonl`, `decisions.jsonl`,
  `design-system.md`, `code-quality-review.md`, the doc-type feature folder `migrate-ids` reads, and the
  frontmatter-`type:` → sub-path map docs-guard uses), and `docsPath(cwd, ...segments)` which resolves
  from `git rev-parse --show-toplevel`. When the root is absent it throws one explicit error
  (`DOCS_ROOT_MISSING: run .codeadd/scripts/docs-branch.cjs prepare`) — never a second location. Registered
  wherever product scripts are registered (provider-map / release packaging), inventory regenerated.
  Test: `scripts/tests/docs-root.test.cjs`, including Windows separators.
  **Extended for D21:** also exports `DOC_SCHEMA_VERSION` (`1` in v1.9.0; bumped only when the doc format
  changes, independent of the package version) and `docSchemaOf(text)` — the integer `schema:` of a
  markdown file's YAML frontmatter, and `0` (legacy) when there is no frontmatter, no `schema:` key or a
  non-integer value. It is the one place that decides "legacy". Same test file.
  - **Produces:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath`
  - **Produces:** `docs-root.cjs` exports `DOC_SCHEMA_VERSION`, `docSchemaOf`
- **F3** [product] — `framwork/.codeadd/scripts/docs-branch.cjs` (new): entry + core for the git side.
  `prepare` (D7: worktree present → `ready`; `origin/codeadd-docs` exists → fetch + `git worktree add` →
  `ready`; branch nowhere → orphan branch with one empty root commit carrying `.gitattributes`
  `* text=auto eol=lf` and a `.gitignore` for QA run outputs `features/**/_tests/run-*/` → push →
  `created`; inside a linked code worktree → link to the primary checkout's docs worktree via
  `git rev-parse --git-common-dir`, symlink or Windows junction → `linked`; no remote / offline →
  `missing` with a reason line). `commit "<msg>"` (retry while `index.lock` is held, identity fallback,
  `core.autocrlf=false` on the docs worktree). `push` (`GIT_TERMINAL_PROMPT=0`, bounded network timeout,
  one fetch + rebase on rejection; a ruleset/protection rejection keeps the local commit and reports it).
  Tests in `scripts/tests/docs-branch.test.cjs` use a **real separate bare remote** (board lesson) and
  cover all five `prepare` outcomes, lock retry, missing identity, rejected push.
  - **Consumes:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)
  - **Produces:** `DOCS=ready|created|linked|missing`, `DOCS_COMMIT=committed|clean|failed`, `DOCS_PUSH=pushed|rejected|offline|failed`, and the exported functions `prepareDocs`, `linkDocs`, `commitDocs`, `pushDocs`
- **F4** [product] — `framwork/.codeadd/scripts/docs-guard.cjs` (new): D12 verbatim — detection over
  files changed since the merge base plus pending files, by (a) registered frontmatter `type:`, (b) the
  layout/name patterns at any path, (c) the JSONL key signatures; moves each hit to its `DOCS_LAYOUT`
  place and removes it from the code index; never touches a file matching nothing. Rules are
  location-agnostic: it never names a legacy directory. Silent: no warning, no block. Its type list
  lives in `DOCS_LAYOUT` and a test asserts it equals the types registered in `mcp/types.mjs` — the whole
  registry, no fixed count, so the six types F26 adds are covered when they land (the
  two-files-kept-equal pattern; `mcp/` cannot be imported from a shipped script). The D21 `schema:` key
  is not a separate detection signal (R13). Test:
  `scripts/tests/docs-guard.test.cjs` — planted typed `.md`, feature-folder `tasks.md`, `delivered.jsonl`
  line, and a user doc that must stay put.
  - **Consumes:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)
  - **Produces:** `DOCS_GUARD=clean|moved:<n>`, exported `runDocsGuard`
- **F5** [product] — `framwork/.codeadd/scripts/status.cjs`: drops `DOCS_FEATURES` (`:69`) and the
  `REFUSAL_MESSAGE` text naming it; resolves through `docsPath`; calls `prepareDocs` and prints its
  `DOCS=` line without ever exiting non-zero for it; `next-id` scans the resolver; the changed-files
  filter (`:788`) drops its old-root exclusion — Code Addiction docs are no longer in the code tree, and a
  user's own documentation is a changed file like any other. Does NOT run docs-guard
  (R4). `PROJECT_DOCS:` (`:833`) is unchanged — `.codeadd/project/*.md` is not an output (D6 spirit).
  - **Consumes:** `DOCS=ready|created|linked|missing` (F3), `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)
- **F6** [product] — `feature-id.cjs`, `init.cjs`, `next-id.cjs`, `migrate-ids.cjs`: every features
  constant replaced by `docsPath(cwd, 'features')` (D16); `migrate-ids.cjs` (`:42-43`, `:88-95`) reads its
  type sub-folders from `DOCS_LAYOUT` and holds no root literal. Existing tests in `scripts/tests/` and
  `cli/tests/feature-id.test.js` move their fixtures to the new root in F19/F21.
  - **Consumes:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)
- **F7** [product] — `build-setup.cjs` (`:59`, `copyInstalled :149-170`) and `get-branch-metadata.cjs`
  (`:107`): `--worktree` calls `linkDocs` in the new code worktree; `copyInstalled` excludes
  `.codeadd/docs` (D8). Must not lose the existing copy of other ignored installed files.
  - **Consumes:** exported functions `prepareDocs`, `linkDocs`, `commitDocs`, `pushDocs` (F3)
- **F8** [product] — `delivery-index-core.cjs` (`:106`, `:138`, `:485-510`) and `delivered.cjs`: the index
  path comes from `docsPath(cwd, 'delivered.jsonl')`; the old-root subtraction filter on the corpus
  (`:138`) and the `:(exclude)` pathspec (`:508`) are deleted (docs are no longer in the code tree); the
  `item-in-docs` refusal (`:336`) refuses an `at` under `DOCS_ROOT` instead; `delivered.cjs` writes two new entry fields `code_sha`
  (the merged code commit) and `pr` (number or null); `touched` reads `code_sha` instead of walking
  first-parent history of the index file (D15). An entry lacking `code_sha` yields no `touched` rather
  than a guess. `add--doc-schemas/references/delivery-index.md` documents the two fields (in F12).
  - **Consumes:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)
  - **Produces:** delivery-index entry fields `code_sha`, `pr`
- **F9** [product] — `done.cjs` (`CLOSE_OUT_PATHS :230-241`, `doCommitPush`) and `hotfix-gates.cjs`
  (`:356`): `CLOSE_OUT_PATHS` keeps only `.codeadd/wiki`; `runDocsGuard` runs before the code commit;
  after the code commit `delivered.cjs` records `code_sha`/`pr`, then `commitDocs` + `pushDocs` run and
  their lines are emitted. `git add -A` can never stage the nested worktree (it is under the ignored
  `.codeadd/*`; the test asserts it). Hotfix gates classify `.codeadd/docs/**` the way they classified
  the old paths.
  - **Consumes:** `DOCS_GUARD=clean|moved:<n>` (F4), `DOCS_COMMIT=committed|clean|failed` (F3), `DOCS_PUSH=pushed|rejected|offline|failed` (F3), delivery-index entry fields `code_sha`, `pr` (F8)
- **F10** [product] — remaining scripts the guard lists under `framwork/.codeadd/scripts/`:
  `build-ledger.cjs`, `log-iteration.cjs`, `qa-evidence.cjs` (`:502`) — resolver only; and
  `framwork/.codeadd/sidecars`/build inputs if the guard lists any.
  - **Consumes:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)

#### T3 — `mcp/` (ref: D4)

- **F11** [product] — `mcp/corpora.mjs` (`:264`, `:430`, `:485`, `:604-606`): `roots` becomes
  `['.codeadd/docs', '.codeadd/wiki']`, `probe` becomes `.codeadd/docs`; the comments naming the old
  location are rewritten without it. The corpus **name** `docs` (the `--corpus=docs` argument) is not a
  path and stays. A test in `cli/tests/mcp-corpora.test.js` asserts the `mcp/` root constant equals
  `DOCS_ROOT` from `docs-root.cjs` (R3). `cli/src/mcp/` is regenerated by the build, never edited.
  - **Consumes:** `docs-root.cjs` exports `DOCS_ROOT`, `DOCS_BRANCH`, `DOCS_LAYOUT`, `docsPath` (F2)

#### T4 — Agent instructions (ref: D3, D4, D5, D9, D11)

- **F12** [product] — the three owner skills: `add--doc-schemas` (doc resolution `grep -rE "^id: ..."`
  now over `.codeadd/docs/`; a new short section **Docs Branch** owning: the root, the universal search
  line of D5 — always pass `.codeadd/docs/` explicitly to rg/Grep because they skip ignored paths — and
  the end-of-command rule: a command that wrote docs runs `docs-branch.cjs commit` before its final
  report; references/delivery-index.md gains `code_sha`, `pr`), `add--resource-path-convention`,
  `add--id-convention`.
  - **Consumes:** delivery-index entry fields `code_sha`, `pr` (F8), `DOCS_COMMIT=committed|clean|failed` (F3)
  - **Produces:** `add--doc-schemas` section `Docs Branch`
- **F13** [product] — every command under `framwork/.codeadd/commands/` that L0 lists: every output path
  to `.codeadd/docs/…`; `add-help`'s analyses and `add-new`'s product file read/write their `DOCS_LAYOUT`
  places; `add-brainstorm` (`:120`) drops the old root from its greenfield filter; `add-wiki` (`:462`)
  says "README and the project's own documentation files" instead of naming a directory; the branch-type
  row of `add-done` (`:131`) stays — it is a git branch prefix, covered by L0's closed non-path form; each command that writes docs points at `Docs Branch` for its closing commit;
  `add-done` pushes; `add-pull-request` adds one link line to the feature folder on `codeadd-docs` (D11,
  R5); `add-qa-setup`'s `## Materializes` moves the QA run-output ignore to the docs branch (its contract
  shape changes on purpose — see Risks).
  - **Consumes:** `add--doc-schemas` section `Docs Branch` (F12)
- **F14** [product] — every remaining skill under `framwork/.codeadd/skills/` that L0 lists: path
  rewrite plus a pointer to `Docs Branch` where a skill writes a doc; `add--architecture-discovery`
  (spine-analyzer) refers to the project's own documentation without naming a directory.
  - **Consumes:** `add--doc-schemas` section `Docs Branch` (F12)
- **F15** [product] — `agents/` (consistency, feature-history, readback, ux-flow), `fragments/`
  (agent-mode/add-diagnose, agent-mode/add-hotfix, docs-pruning/add-done, qa-pipeline/add-build,
  qa-pipeline/add-plan, tdd-pipeline/add-plan, tdd-pipeline/add-review), `plugins/` (design ×4,
  gitnexus/add-wiki), `fallbacks/` (agent-mode.add-diagnose.offer, agent-mode.add-hotfix.offer), and
  `framwork/provider-map.json` (`:160`, the `feature-history-agent` description the build copies into
  agent frontmatter). `docs-pruning/add-done.md` (`:46`) drops the "project gitignores the old root" case:
  pruning targets `.codeadd/docs/`, which is always tracked on `codeadd-docs`. Injection
  anchors that change are regenerated by the build; `injection-points.json` must still resolve every
  anchor (build test).
  - **Consumes:** `add--doc-schemas` section `Docs Branch` (F12)
- **F16** [product] — `agent-mode/README.md` (`:216` → "push `codeadd-docs` before handoff"),
  `agent-mode/roles/chief-engineer.md`, `agent-mode/roles/product-pm.md` (D9).
  - **Consumes:** `DOCS_PUSH=pushed|rejected|offline|failed` (F3)

#### T5 — CLI (ref: D7, D14, D17, D19; D20 in F27)

- **F17** [product] — `cli/src/installer.js`, `updater.js`: after writing `.codeadd/scripts/`, run the
  installed `docs-branch.cjs prepare` (one implementation, not a copy). `updater.js` and
  `uninstaller.js`: before touching `.codeadd/`, `commitDocs`, then `git worktree remove` + `git worktree
  prune`; the updater re-runs `prepare` after; neither ever deletes `codeadd-docs` (D17). A dirty docs
  worktree that cannot be committed blocks removal with an explicit message. `cli/src/features.js:93`
  comment rewritten so it cites no file under the old root. `gitignore.js` unchanged (the `.codeadd/*`
  line already covers the worktree; a test asserts it). CLI code that needs the root `require`s the
  installed `<target>/.codeadd/scripts/docs-root.cjs` — one implementation, no CLI copy.
  `cli/src/migrations.js` (R2): migrations 0002 and 0003 walk `DOCS_ROOT` instead of the old root;
  migration 0005 (QA config and receipt) leaves the registry and its body moves into
  `docs-migrate.js` (F18); after F17 the file holds zero L0 hits. `cli/tests/migrations*.test.js`
  follows: 0005 cases move to `docs-migrate.test.js`, the rest use the new root.
  - **Consumes:** `DOCS=ready|created|linked|missing` (F3), exported functions `prepareDocs`, `linkDocs`, `commitDocs`, `pushDocs` (F3)
- **F18** [product] — `cli/src/docs-migrate.js` (new) + `codeadd docs migrate [--dry-run]` in `cli.js` and
  its help: D14 verbatim — detect legacy outputs with the docs-guard rules plus the legacy root it alone
  knows, copy into the docs worktree (prepare first), one commit with trailer `Migrated-From: <base sha>`,
  `git rm` + stage on the code side, never commit or push the code side. Before the move it runs the
  former migration 0005 (QA config/receipt → `.codeadd/settings.json`); after the move it re-runs the
  content repairs 0002/0003 over the new root (both are idempotent). Re-run → `MIGRATED=already`;
  nothing found → `MIGRATED=nothing`. **Not** registered in `MIGRATIONS` (R2). It never adds or changes a
`schema:` key (D21: it only moves; stamping is the job of the F27 prompt). Tests:
  `cli/tests/docs-migrate.test.js` with `cli/tests/fixtures/docs-migrate/` against a real bare remote.
  - **Consumes:** `DOCS_GUARD=clean|moved:<n>` (F4), exported functions `prepareDocs`, `linkDocs`, `commitDocs`, `pushDocs` (F3)
  - **Produces:** `codeadd docs migrate` emitting `MIGRATED=moved:<n>|already|nothing`
- **F19** [product] — `cli/tests/` sweep: every suite L0 lists moves its fixtures and assertions to
  `.codeadd/docs/` (including `helpers/docs-corpus-fixture.js`, `feature-id.test.js`,
  `close-out-hardening.test.js`, `product-close-out-parity.test.js`). **Negative assertions** that name
  the old location to prove its absence (`add-settings-skill.test.js:49`,
  `chat-continuation-handoff.test.js:271`, `hotfix-diagnosis-review-contract.test.js:67`,
  `legacy-command-paths.test.js:13`, `product-close-out-parity.test.js:497`, and any other L0 lists) are
  deleted — `docs-no-legacy` subsumes them — each with a `Test-Removed:` trailer naming it; a test whose
  only purpose was the old path is deleted the same way. No other test name is dropped.
- **F20** [product] — `cli/README.md`: the docs branch, the `DOCS=` line, the guard, and a short
  migration guide for `codeadd docs migrate` — written **without naming the old location** (it says "the
  Code Addiction outputs in your code branch"), so the guide needs no exemption. **Extended for D20/D21:**
  the guide says the command ends by printing a prompt to paste into the user's own agent, which brings
  legacy docs (no `schema:`, i.e. schema `0`) to the current standard and stamps the version; and one
  short paragraph on `schema:` (what it is, that it is not the package version).
  - **Consumes:** `codeadd docs migrate` emitting `MIGRATED=moved:<n>|already|nothing` (F18)
  - **Consumes:** `DOCS_LEGACY=<n>` and the agent-prompt block (F27)

#### T6 — Internal layer (ref: D18, D19)

- **F21** [internal] — `scripts/`: `test-transport.cjs` `EXCLUDES` (`:9`), `smoke-test.cjs`
  (`:170`, `:262`, `:281`), and every `scripts/tests/*` suite L0 lists (fixtures to the new root;
  `native-script-cases.json` included). Same negative-assertion and test-loss rule as F19.
- **F22** [internal] — `workbench/` (14 files): `add-plan-authoring` (+`references/plan-template.md`),
  `add-framework--brainstorm`, `--plan`, `--build`, `--done`, `add-build-ledger`, `add-review-discipline`,
  `add-framework-development`, `building-commands`, `add-final-report/references/result-block.md`,
  `framework-discovery-agent`, `add-framework--sync`, `add-framework--release`. Every plan, ledger,
  brainstorming, evidence, changelog, deliveries and index path moves under `.codeadd/docs/`;
  `add-framework--done` commits and pushes `codeadd-docs` and no longer commits archives to `main`;
  the D5 search line goes into the stages that search those directories. Plans, brainstorming and
  evidence stay **untracked** — the docs branch's own `.gitignore` ignores them (R7).
  - **Consumes:** `DOCS_COMMIT=committed|clean|failed` (F3), `DOCS_PUSH=pushed|rejected|offline|failed` (F3)
- **F23** [internal] — `AGENTS.md` (Plans/Deliveries rows, the done row, and one style-block line
  carrying D5), `README.md` (`:175-176`), `CHANGELOG.md` (a v1.9.0 / Unreleased entry naming the docs
  branch, the guard, `codeadd docs migrate` and "re-run `/add-qa-setup`", without the old location; and
  the released line `:34` reworded to name the QA config and receipt without a path — R6),
  `web/src/pages/docs.astro` (`:739` project-structure tree shows `.codeadd/docs/`, plus a docs-branch +
  migrate section), `web/src/i18n/en.ts` `:457` and `pt-br.ts` `:458` (design-system path) plus the
  section copy as an EN/PT-BR pair, and any `web/public/*.svg` L0 lists. Root `.gitignore`
  loses its lines for the old internal directories. Run `add-framework--sync` analyzers only if the build
  needs them; this F-block names the edits. **Extended for D20/D21:** the CHANGELOG entry and the
  docs-site section (EN/PT-BR pair) also name the `schema:` field and the printed migrate prompt.
  - **Consumes:** `codeadd docs migrate` emitting `MIGRATED=moved:<n>|already|nothing` (F18)
  - **Consumes:** `DOCS_LEGACY=<n>` and the agent-prompt block (F27)
- **F24** [internal] — migrate **this repository** (D18), last: `npm run build` + the built CLI runs
  `codeadd docs migrate` on this repo; `codeadd-docs` is pushed to `origin` with the archives,
  changelogs, the index and a `.gitignore` for `plans/`, `brainstorming/`, `evidence/`; the local
  untracked `plans/` and `brainstorming/` files (this plan and its ledger included) are moved by hand into
  `.codeadd/docs/`; the code side's `git rm` is committed as this F-block; `npm run setup` rebuilds the
  workbench so the pipeline runs on the new paths. Then the guard (F1) must be GREEN. The migrate run
  prints its `DOCS_LEGACY=` line and agent prompt; the ledger records both, and the prompt is **not**
  acted on here — this repository's archives are internal records, moved byte-for-byte, and D21 scopes
  product-generated artifacts (see Does NOT Include).
  - **Consumes:** `codeadd docs migrate` emitting `MIGRATED=moved:<n>|already|nothing` (F18), `docs-no-legacy` (F1)

#### T7 — Schema version and migrate prompt (ref: D20, D21; D23 bullets on `schema`, the prompt and legacy `0`)

Numbered after F24 so no existing reference moves; **placed** in the Execution Order where its inputs exist.

- **F25** [product] — build variable `{{doc-schema}}` (R11): `scripts/build.js` `resolveResourcePaths`
  resolves `{{doc-schema}}` to `DOC_SCHEMA_VERSION`, read by `require`-ing
  `framwork/.codeadd/scripts/docs-root.cjs` (one constant, never a second copy); the value is
  provider-independent like `{{addpath:}}`. The anchor-line refusal (`build.js` `:158` — a chosen injection
  anchor may not carry a variable) and `lintResourcePaths` learn the new token. Every shipped markdown
  tree resolves it — provider outputs **and** the release-packaged `templates/`, `fragments/`,
  `plugins/` and fallbacks; where a packaged tree ships unbuilt today, the build resolves this one token
  there too. `add--resource-path-convention` documents the token next to `{{addpath:}}`. Test (new)
  `cli/tests/build-doc-schema.test.js`: zero `{{doc-schema}}` left in any built or packaged tree; each
  resolved occurrence equals `DOC_SCHEMA_VERSION`; zero `schema:\s*\d` literals in
  `framwork/.codeadd/**/*.md` source; the anchor refusal fires on a planted token.
  - **Consumes:** `docs-root.cjs` exports `DOC_SCHEMA_VERSION`, `docSchemaOf` (F2)
  - **Produces:** build variable `{{doc-schema}}`
- **F26** [product] — `schema:` on every generated artifact (D21):
  - `add--doc-schemas` **Universal Document Requirements**: `schema: {{doc-schema}}` joins the mandatory
    fields; a short **Schema Version** paragraph owns the rule — what the field is, bumped only on a
    format change and never with the package version, a doc without it is schema `0` (legacy), future
    doc migrations key off it, JSONL outputs carry a per-line `v` instead; the validation gate checks the
    key. Every frontmatter example in `add--doc-schemas/references/*.md` carries the line.
  - Formerly frontmatter-less outputs gain a minimal frontmatter of `type` + `schema`: `iterations.md`
    (`scripts/log-iteration.cjs`) and `build-ledger.md` (`scripts/build-ledger.cjs`) write it from
    `DOC_SCHEMA_VERSION` **when they create the file** and never rewrite an existing file's frontmatter;
    `tasks.md` (`skills/add--tasks-checklist`), the health-check reports (`skills/add--health-check`),
    `design-system.md` and `code-quality-review.md` (the commands, skills, agents and plugin fragments that
    write them — `add-plan`, `add-build`, `ux-flow-agent`, `add--architecture-discovery/code-quality-analyzer.md`,
    the design plugin fragments, and any further writer a grep for the filename lists) write it via
    `{{doc-schema}}`. Shipped `templates/` whose output is a generated doc gain the same line.
  - `mcp/types.mjs` registers the six new types — `iterations`, `build-ledger`, `tasks`, `health-check`,
    `design-system`, `code-quality-review` — kinds per R13; `mcp/reference.md` is regenerated from
    `renderTypeTable()` (its L4.1 equality test stays green). `DOCS_LAYOUT`'s type map gains the same six
    (F4's equality test then covers them).
  - `docs-guard` (F4): the `# Iterations` / `# Tasks:` header checks read the first heading **after** an
    optional frontmatter, so a stamped file is still detected.
  - JSONL (R12): `scripts/log-jsonl.cjs` adds `v` to every line from one `LOG_LINE_VERSION = 1` in that
    writer; `delivered.jsonl` keeps the `v: 1` it already writes (`delivery-index-core.cjs:219`) — the
    F8 fields `code_sha`/`pr` are additive and do not bump it. docs-guard's JSONL signature (c) matches
    with or without `v`.
  - Tests: `scripts/tests/log-iteration.test.cjs`, `build-ledger.test.cjs`, `log-jsonl.test.cjs` (extended),
    `docs-guard.test.cjs` (stamped-file cases), `cli/tests/mcp-document-model.test.js` (new types), and a
    new `cli/tests/doc-schema-coverage.test.js`: every reference schema example and every writer of the
    six formerly frontmatter-less outputs carries `schema: {{doc-schema}}`.
  - **Consumes:** `docs-root.cjs` exports `DOC_SCHEMA_VERSION`, `docSchemaOf` (F2), build variable `{{doc-schema}}` (F25), `add--doc-schemas` section `Docs Branch` (F12), `DOCS_GUARD=clean|moved:<n>` (F4)
  - **Produces:** `add--doc-schemas` section `Schema Version`; `mcp/types.mjs` types `iterations`, `build-ledger`, `tasks`, `health-check`, `design-system`, `code-quality-review`
- **F27** [product] — the migrate prompt (D20): `framwork/.codeadd/templates/docs-migrate-prompt.md`
  (new) — the prompt's **only** home: plain text, no markdown structure an agent would mis-render, no
  provider name, no slash command. It asks the user's agent to (1) review the migrated docs in
  `.codeadd/docs/`, (2) bring every legacy doc — no `schema:` or one lower than the current — to the current
  standard defined by the `add--doc-schemas` skill and its `references/`, named by skill name because the
  installed path differs per provider, (3) stamp `schema: {{doc-schema}}` on each file it adjusted, and
  (4) report what changed, file by file. It names no legacy location (L0 scans it; no exemption).
  `cli/src/docs-migrate.js`, after `MIGRATED=moved:<n>|already`: counts legacy docs under `.codeadd/docs/`
  with the installed `docSchemaOf` and prints `DOCS_LEGACY=<n>`; when `n > 0` it prints the installed
  template `<target>/.codeadd/templates/docs-migrate-prompt.md` verbatim (F25 already resolved the version)
  between the fixed lines `--- AGENT PROMPT ---` and `--- END AGENT PROMPT ---`. `--dry-run` and
  `MIGRATED=nothing` print no prompt. It spawns nothing but `git` — no agent CLI, ever. `cli.js` help
  names the printed prompt. The template is a `template` node in the graph and an inventory entry
  (inventory regenerated); `release.yml` already packages `templates/`. Tests in
  `cli/tests/docs-migrate.test.js`: stdout prompt equals the installed template byte-for-byte; no
  `{{` in it; child-process spy sees only `git`; no moved file gains `schema:`; `DOCS_LEGACY` equals the
  number of planted schema-less docs; a distinctive sentence of the template occurs in exactly one
  source file under `framwork/`, `cli/src/` and `mcp/`.
  - **Consumes:** `codeadd docs migrate` emitting `MIGRATED=moved:<n>|already|nothing` (F18), `docs-root.cjs` exports `DOC_SCHEMA_VERSION`, `docSchemaOf` (F2), build variable `{{doc-schema}}` (F25)
  - **Produces:** `DOCS_LEGACY=<n>` and the agent-prompt block

### Does NOT Include (important!)

- No hook of any provider (D13).
- No read-sync, no lock system, no app around the docs branch (D10).
- `.codeadd/wiki/`, `.codeadd/settings.json`, `.codeadd/manifest.json` and `.codeadd/project/*.md` do not move (D6).
- No change to migrations 0001, 0004 and 0006 (0002/0003 repoint and 0005 moves — R2).
- No rewrite of delivery archives: they move byte-for-byte to `codeadd-docs` and are not on the code branch, so L0 does not scan them.
- No version bump or tag — `add-framework--release` does that (minor, v1.9.0).
- docs-guard does not run in `status.cjs` (R4).
- `codeadd docs migrate` does not run, spawn or call any agent, and does not stamp `schema:` (D20, D21).
- No `schema` field in the artefact graph's index or query output — `docSchemaOf` in `docs-root.cjs` is the one reader (D21 needs recognition, not a graph facet).
- This repository's internal plans, ledgers, changelogs and delivery archives do not gain `schema:` — D21 scopes artifacts the product generates in a user's project.
- No stamping of existing legacy docs by any script — the D20 prompt, run by the user's agent, does it.

## Validated Decisions

D1–D23 are settled in the intent file and are not repeated. The rulings below close the choices the
intent left to the Engineer, decided by recommendation (no questions asked, per the invocation).

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| R1 — Instructions reference the root literally or via a build variable? (D4) | Literal `.codeadd/docs/…`, no variable | The path is identical on all six providers, unlike `{{cmd:}}`/`{{skill:}}`; a variable adds a resolver for a constant and makes the zero-legacy grep and an agent's own search harder |
| R2 — Where does the migrate command live, and what is the exception? (D14) | New `cli/src/docs-migrate.js`, subcommand `codeadd docs migrate`, NOT in `MIGRATIONS`. Exception = it, its test, its fixtures — nothing else. `migrations.js` 0002/0003 repoint to `DOCS_ROOT`; 0005 leaves the registry and its body moves into `docs-migrate.js`, which also re-runs 0002/0003 after moving | `updater.js` auto-runs pending `MIGRATIONS`, which would make the docs move non-optional. The strict reading of Maicon's rule ("the only exception is the migration command") wins over keeping 0005 auto-run: an un-migrated user loses nothing, because `docs migrate` runs it, and `/add-qa-setup` is stale for every QA user anyway (Risks) |
| R3 — How does `mcp/` use the resolver? (D4) | Own constant, asserted equal to `DOCS_ROOT` by a test | `mcp/` takes no dependency and runs from the npm package, where `.codeadd/scripts/` is not on its path (AGENTS.md); the equality-test pattern already holds `graph.js`/`engine.mjs` together |
| R4 — docs-guard in `status.cjs`? (D12 "may") | No — `done.cjs` and hotfix close-out only, plus the migrate command | `status.cjs` runs at the start of nearly every command; moving files silently mid-session surprises the agent that just wrote them. Close-out is where a misplaced doc would reach the PR |
| R5 — PR links to `codeadd-docs`? (D11) | Yes, one line | Without it reviewers lose the link to the spec entirely; cost is one line in one command |
| R6 — Released `CHANGELOG.md` entries | Not exempt. The one released line naming the old location (`:34`) is reworded to name the output without its path; the facts it records stay | "No mention anywhere" is the requirement; rewording one line keeps the record true and needs no exemption |
| R9 — Non-Code-Addiction uses of the literal (a git branch prefix, a user's own documentation, site routes) | Branch prefix and site routes are closed non-path forms L0 names; every mention of a user's own docs directory is reworded to "the project's own documentation"; the old-root filters in `status.cjs:788` and `add-brainstorm:120` are deleted | A branch name and a URL route are not file paths; everything else can lose the literal at no cost, which keeps L0 credible |
| R10 — How the build carries a guard that is RED until F24 | `docs-no-legacy` lands at F1 and is the one known failing test. Every F-block's gate runs the suite and accepts exactly that one failure, whose hit count the ledger records and which must not grow; any other failure is a hard stop. STEP 9 and `/add-framework--done` require zero failures. No env flag, no skip | A RED-first test that is silenced is no proof; one that is tracked and must shrink is |
| R7 — This repo's plans/brainstorming/evidence on the docs branch | Stay untracked via the docs branch `.gitignore`; deliveries, changelog and index are tracked there | Keeps today's semantics (local working files, archived at done) with the least workbench change |
| R8 — `audit/` vs `audits/` (both exist today) | One `audits/` in `DOCS_LAYOUT`; migrate maps both | Two names for one output is drift the resolver exists to end |
| R11 — How instructions reference the schema version (D21 "same resolver or build variable") | New build variable `{{doc-schema}}`, resolved by `resolveResourcePaths` from `DOC_SCHEMA_VERSION` in `docs-root.cjs`; scripts `require` the constant directly | R1 keeps the root literal because it never changes; the version is the one value that **will** change, so it is the one that earns a variable. Resolving at build means installed files, packaged templates and the migrate prompt carry the number with no runtime lookup |
| R12 — JSONL `v` (D21) | Per-writer line version: `log-jsonl.cjs` gains `LOG_LINE_VERSION = 1`; `delivered.jsonl` keeps its existing `v: 1`; `code_sha`/`pr` (F8) are additive and do not bump it | A JSONL line format and the markdown doc format evolve separately; tying both to `DOC_SCHEMA_VERSION` would bump one when only the other changed. Each still has exactly one declaration |
| R13 — Kinds for the six new types, and `schema:` as a guard signal (D21 "may") | `iterations`, `build-ledger`, `tasks` → `attachment`, `owner: 'dir'` (they live in a feature folder); `health-check`, `design-system`, `code-quality-review` → `page`, rooted at the docs root; all `requires: []`. docs-guard does **not** add `schema:` as a signal | The feature-folder files belong to their work item exactly like `feature-plan`; the three project-level files are things you look up. A registered `type:` already detects a file, and `schema:` + registered `type:` is a strict subset of that — a second signal would match nothing new |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Clean code PRs, one shared docs copy | Reviewers open docs on another branch (one link line mitigates) |
| One root, one resolver | Every doc-writing command gains a closing commit step |
| Zero legacy | Users must run `codeadd docs migrate` to keep reading old docs through the framework |
| `touched` from a recorded `code_sha` | Entries written before v1.9.0 carry no `touched` until migrated |
| A doc format that can be versioned and migrated (D21) | One more frontmatter line per doc; legacy docs stay schema `0` until the user pastes the D20 prompt into their agent |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| `touched` derivation breaks (D15) | High | F8 records `code_sha`/`pr`; L1.6 asserts `touched` from `code_sha` and no guess without it |
| Uninstall/update deletes the worktree with uncommitted docs (D17) | Medium | F17 commits, then `worktree remove`/`prune`, re-prepare; dirty-and-uncommittable blocks with a message; L2.5 |
| Ruleset/branch protection with `*` blocks the push | Medium | F3 `DOCS_PUSH=rejected` keeps the local commit and says so; L1.3 |
| Windows: junction, CRLF, long paths | Medium | F3 junction branch + `core.autocrlf=false` + `.gitattributes`; L1.2/L1.3 run Windows-path cases |
| Root-scanning tools (vitest, tsc, eslint, site globs) pick up `.codeadd/docs/` | Low | L2.7 asserts this repo's vitest/web globs exclude `.codeadd/`; md/json only |
| Agents miss docs because rg/Grep skip ignored paths (D5) | High | F12 `Docs Branch` search line; F22/F23 same line in workbench and AGENTS.md; L1.9 |
| `git clean -fdx` wipes uncommitted docs | Low | Commit at command end (F12/F13); worktree has its own `.git` file |
| `git add -A` in `done.cjs` stages the nested worktree | Medium | Ignored by `.codeadd/*`; F9 test asserts no gitlink is staged |
| `add-qa-setup` contract shape changes → every QA user sees `SETUP_QA_STALE` | Certain | Intended: the materialized ignore line really moved; F13 + CHANGELOG entry in F23 say "re-run `/add-qa-setup`" |
| CI has no docs worktree; a test reading this repo's real index fails | Medium | F19/F21 all tests use fixtures; L2.8 runs the suite in a clone without the worktree |
| The build runs on the workbench it is rewriting | High | F22 edits source only; the rebuild (`npm run setup`) and the repo migration happen together in F24, last; the ledger moves with the plan in F24 |
| A writer skips `schema:` (an agent hand-writes a doc) | Medium | F26 puts the key in the mandatory fields and in the validation gate; `doc-schema-coverage` test asserts every writer and schema example; L3.4 scans a real run |
| The version number drifts across files or a shipped file carries a stale one | Medium | One constant (F2) + one build variable (F25); `build-doc-schema` test fails on any literal `schema: <n>` in source or an unresolved token in output |
| docs-guard misses a stamped `iterations.md`/`tasks.md` (header now below frontmatter) | Medium | F26 makes the header checks frontmatter-aware; L1.12 |
| The migrate prompt is copied into a second file and drifts | Low | Exactly-one-source test in F27; L1.16 |
| The board lesson: an in-repo worktree was once rejected | Low | Different mechanism (persistent worktree of an orphan branch, never pushes to `main`); its F11/F12 lessons applied in F3 |

## Impact

Graph: depth-1 dependants from `node scripts/graph.js impact <n> --depth 1` (graph emitted 2026-11-11).

| Artefact | Layer | Action | Depth-1 / risk | F |
|----------|-------|--------|----------------|---|
| `cli/tests/docs-no-legacy.test.js` | product | create | new — n/a | F1 |
| `framwork/.codeadd/scripts/docs-root.cjs` | product | create | new — n/a | F2 |
| `framwork/.codeadd/scripts/docs-branch.cjs` | product | create | new — n/a | F3 |
| `framwork/.codeadd/scripts/docs-guard.cjs` | product | create | new — n/a | F4 |
| `framwork/provider-map.json` / release packaging, inventory | product | modify | — | F2–F4 |
| `scripts/status.cjs` (product) | product | modify | 23 — HIGH | F5 |
| `feature-id.cjs` / `init.cjs` / `next-id.cjs` / `migrate-ids.cjs` | product | modify | 2 / 2 / 1 / 0 — MEDIUM, MEDIUM, MEDIUM, LOW | F6 |
| `build-setup.cjs` / `get-branch-metadata.cjs` | product | modify | 3 / 1 — HIGH, MEDIUM | F7 |
| `delivery-index-core.cjs` / `delivered.cjs` | product | modify | 0* / 3 — LOW*, HIGH | F8 |
| `done.cjs` / `hotfix-gates.cjs` | product | modify | 4 / — — HIGH | F9 |
| `build-ledger.cjs` / `log-iteration.cjs` / `qa-evidence.cjs` | product | modify | qa-evidence 7 — HIGH | F10 |
| `mcp/corpora.mjs` | product | modify | not a node — NOT VERIFIED by graph; read by `scripts/graph.js` parity test | F11 |
| `add--doc-schemas` / `add--resource-path-convention` / `add--id-convention` | product | modify | 21 / 1 / — — HIGH, MEDIUM | F12 |
| 13 commands (incl. `add-done` 15, `add-pull-request` 4) | product | modify | HIGH | F13 |
| 31 remaining skills | product | modify | path text only | F14 |
| 4 agents, 7 fragments, 5 plugin fragments, 2 fallbacks | product | modify | path text only; anchors rebuilt | F15 |
| `agent-mode/README.md`, `roles/chief-engineer.md`, `roles/product-pm.md` | product | modify | — | F16 |
| `cli/src/installer.js`, `updater.js`, `uninstaller.js`, `features.js` | product | modify | not nodes | F17 |
| `cli/src/migrations.js` (0002/0003 repoint, 0005 removed) + `cli/tests/migrations*.test.js` | product | modify | not nodes | F17 |
| `framwork/provider-map.json` (`:160` feature-history-agent description) | product | modify | registry | F15 |
| `cli/src/docs-migrate.js`, `cli/src/cli.js` | product | create / modify | not nodes | F18 |
| 27 `cli/tests/*` suites + `cli/tests/docs-migrate.test.js` + fixtures | product | modify / create | not nodes | F18, F19 |
| `cli/README.md` | product | modify | not a node | F20 |
| `scripts/test-transport.cjs`, `scripts/smoke-test.cjs`, 22 `scripts/tests/*` | internal | modify | not nodes | F21 |
| 14 `workbench/` files | internal | modify | internal pipeline | F22 |
| `AGENTS.md`, `README.md`, `CHANGELOG.md`, `.gitignore`, `web/src/pages/docs.astro`, `web/src/i18n/en.ts`, `pt-br.ts`, `web/public/*.svg` | internal | modify | AGENTS.md: **yes, changes** (not a graph node; checked by hand) | F23 |
| this repository's tracked `docs/` tree → `codeadd-docs` | internal | move | — | F24 |
| `scripts/build.js` (`resolveResourcePaths`, anchor refusal, lint) + `cli/tests/build-doc-schema.test.js` | product | modify / create | every built file — HIGH (one token, provider-independent) | F25 |
| `add--resource-path-convention` (`{{doc-schema}}` row) | product | modify | 1 — MEDIUM | F25 |
| `add--doc-schemas` + `references/*.md` (mandatory `schema:`, Schema Version section) | product | modify | 21 — HIGH | F26 |
| `log-iteration.cjs`, `build-ledger.cjs`, `log-jsonl.cjs` | product | modify | — | F26 |
| `add--tasks-checklist`, `add--health-check`, `add-plan`, `add-build`, `ux-flow-agent`, `code-quality-analyzer.md`, design plugin fragments, doc-emitting `templates/` | product | modify | text only; anchors rebuilt | F26 |
| `mcp/types.mjs` (+6 types), `mcp/reference.md` (regenerated) | product | modify | not a node — NOT VERIFIED by graph; L4.1 equality test | F26 |
| `framwork/.codeadd/templates/docs-migrate-prompt.md` | product | create | new — n/a | F27 |
| `cli/src/docs-migrate.js`, `cli/src/cli.js` (prompt print, help) | product | modify | not nodes | F27 |

\* `delivery-index-core.cjs` reports 0 because the graph does not model `require()`; it is imported by
`delivered.cjs` and `done.cjs` (HIGH through them) and by `scripts/graph.js` `history`.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level is written before its F-block lands and verified failing.

### L0 — Zero-legacy verification (Maicon's hard requirement; F1, GREEN only after F24)

**The test `docs-no-legacy` is authoritative** — there is no second implementation. The build runs it
at every F-block gate (R10) and at STEP 9; `add-framework--done` runs it before merge. **Zero hits
outside the three exempt paths.**

Scope: every tracked file (`git ls-files`), read as whole-file text; plus the built provider trees when
present. Exempt paths: `cli/src/docs-migrate.js`, `cli/tests/docs-migrate.test.js`,
`cli/tests/fixtures/docs-migrate/**` — nothing else.

Normalisation before matching (closed; nothing may be added without a plan revision):
- URL tokens `https?://\S+` are removed — a URL is never a project path.
- Non-path form A, site routes: `/docs/` or `/pt-br/docs/` at a token start (after whitespace, a quote, `(` or a backtick).
- Non-path form B, the git branch-type prefix: `docs/` followed by `[NNNN]D-`, `NNNND-` or four digits and `D-`.

Patterns (a hit on any one fails):
1. Slash form, any file — `(?<![A-Za-z0-9_.-])(?<!\.codeadd/)docs/` — catches `docs/x`, `./docs/x`, `${root}/docs/x`, `repo/docs/x`; never `.codeadd/docs/`.
2. The old decisions log, any file — `\.codeadd/project/decisions\.jsonl`.
3. String-literal path element, code files (`.js .cjs .mjs .ts .json`) — `['"]docs['"]` anywhere, multi-line calls included, minus an explicit `{file, regex}` exclusion list for the MCP corpus **name** (`mcp/corpora.mjs`, `mcp/engine.mjs`, `mcp/server.mjs`, `cli/src/mcp-registration.js` and their tests) and the `rename-product-artefacts.js` scope name; an exclusion that matches nothing fails the test.
4. Pathspec form, any file — `exclude\)docs\b`.

1. *RED today:* hundreds of hits across `framwork/.codeadd/`, `cli/`, `mcp/`, `scripts/`, `workbench/`, `AGENTS.md`, `README.md`, `CHANGELOG.md`, `.gitignore`, `web/`.
2. The built provider trees carry zero hits after `node scripts/build.js` and `npm run setup` (catches an old path an injection or fragment reintroduces). Runs at STEP 9, after both builds.
3. Self-check: a planted hit of each pattern in a temp file is reported; a planted hit inside an exempt path is not.

### L1 — Unit (RED → GREEN)

1. `docs-root.cjs`: `docsPath` resolves under `<toplevel>/.codeadd/docs` from a subdirectory and from a linked worktree; absent root throws `DOCS_ROOT_MISSING`, never another path. *RED: file absent.*
2. `docs-branch prepare`: five outcomes `ready|created|linked|missing` (+ remote-only branch → `ready`) against a real bare remote; the orphan root commit carries `.gitattributes` and the QA `.gitignore`; Windows junction branch exercised with Windows path semantics. *RED: file absent.*
3. `docs-branch commit/push`: `index.lock` retry, identity fallback, rejected push → `DOCS_PUSH=rejected` with the local commit kept; `GIT_TERMINAL_PROMPT=0` set. *RED.*
4. `docs-guard`: moves a planted typed `.md`, a feature-folder `tasks.md` and a `delivered.jsonl` line; leaves a user `.md` with no type untouched; prints nothing but `DOCS_GUARD=`. Type list equals `mcp/types.mjs`'s 18. *RED.*
5. `status.cjs` emits exactly one `DOCS=` line and exits 0 when `prepare` returns `missing`. *RED: no line today.*
6. `delivery-index-core`: `touched` comes from `code_sha`; an entry without it yields no `touched`. *RED: derived from history today.*
7. `feature-id`/`next-id`/`init` allocate from `.codeadd/docs/features/` only. *RED.*
8. `mcp/corpora.mjs` root constant equals `DOCS_ROOT`. *RED.*
9. `add--doc-schemas` contains the `Docs Branch` section with the explicit-path search line; AGENTS.md carries the same line. *RED.*
10. `docs-root.cjs`: `DOC_SCHEMA_VERSION === 1`; `docSchemaOf` → `1` for `schema: 1`, `0` for no frontmatter, for frontmatter without `schema:` and for a non-integer value (D21, D23 legacy bullet). *RED: no export.*
11. Writers: a new `iterations.md` / `build-ledger.md` starts with frontmatter `type` + `schema: DOC_SCHEMA_VERSION`; appending to an existing file never rewrites its frontmatter; every `log-jsonl.cjs` line carries `v: 1`; `delivered.jsonl` lines keep `v: 1` with `code_sha`/`pr` (F26, R12). *RED: no frontmatter, no `v`.*
12. `docs-guard`: detects a stamped `iterations.md` and `tasks.md` (heading below frontmatter) and a typed `.md` of each of the six new types; a JSONL line with or without `v` matches signature (c); its type list equals the full `mcp/types.mjs` registry. *RED.*
13. `mcp/types.mjs` holds the six new types with R13 kinds; `mcp/reference.md` equals `renderTypeTable()` output (L4.1). *RED: types absent.*
14. `build-doc-schema`: no `{{doc-schema}}` left in any built or packaged tree; each resolution equals `DOC_SCHEMA_VERSION`; zero literal `schema:\s*\d` in `framwork/.codeadd/**/*.md`; anchor refusal fires on the token (F25, R11). *RED: token unknown.*
15. `doc-schema-coverage`: `add--doc-schemas` mandatory fields and validation gate name `schema`, the `Schema Version` section states the legacy-`0` rule, every `references/*.md` frontmatter example and every writer of the six formerly frontmatter-less outputs carries `schema: {{doc-schema}}` (F26). *RED.*
16. Migrate prompt template: exists once under `framwork/.codeadd/templates/`; asks for review in `.codeadd/docs/`, the `add--doc-schemas` standard and its `references/`, the stamp and a per-file report; names no provider and no slash command; after build carries no `{{`; a distinctive sentence of it occurs in exactly one source file (F27, D20). *RED: file absent.*

### L2 — Integration

1. Fresh install in a temp repo with a bare remote: `codeadd install` → `.codeadd/docs` worktree on `codeadd-docs`, branch pushed, `git status` of the code branch clean.
2. Fresh clone of that repo: first `status.cjs` → `DOCS=ready`, worktree present.
3. `build-setup.cjs --worktree`: the code worktree's `.codeadd/docs` is a link to the primary's; a file written through it appears in the primary; `.codeadd/docs` was not copied.
4. `done.cjs` close-out: code PR diff contains no file under `.codeadd/docs/`; `codeadd-docs` on the remote holds the new index line with `code_sha` and `pr`; no gitlink staged.
5. Update and uninstall on a repo with a dirty docs worktree: docs committed, worktree removed/re-prepared, `codeadd-docs` still on the remote.
6. `codeadd docs migrate` on a fixture legacy project: outputs on `codeadd-docs` in one commit with `Migrated-From:`; code side staged, not committed; QA config/receipt land in `.codeadd/settings.json` (former 0005); relations and type names repaired under the new root (0002/0003); second run `MIGRATED=already`. `codeadd update` on the same fixture does NOT move anything (not in `MIGRATIONS`).
7. This repo's vitest and web build globs do not read `.codeadd/docs/`.
8. Full suite (`node scripts/run-tests.js all`) in a fresh clone **without** a docs worktree: green — no test depends on the real docs branch.
9. `node scripts/build.js` exits 0, no new LINT; `injection-points.json` resolves every anchor; `npm run setup` builds the workbench.
10. `codeadd docs migrate` on the L2.6 fixture, prompt half (D20): stdout carries `MIGRATED=moved:<n>`, then `DOCS_LEGACY=<n>` equal to the planted schema-less docs, then the prompt between the two fixed marker lines, byte-equal to the installed template; no moved file gained `schema:`; a child-process spy sees only `git`; the re-run (`MIGRATED=already`) prints the prompt again while legacy docs remain; `--dry-run` prints none.
11. Generation after install (D21, D23 first new bullet): in the L2.1 fixture, the shipped writers run end to end (`log-iteration`, `build-ledger`, `log-jsonl`, and the L2.4 close-out's `delivered`) — every `.md` they create under `.codeadd/docs/` reads `docSchemaOf(...) === 1` and every JSONL line carries `v`.

### L3 — Behavioural acceptance (intent D23)

1. A full product run in a scratch project (`/add-new` → `/add-plan` → `/add-build` → `/add-done`): every output under `.codeadd/docs/`, PR clean, `codeadd-docs` pushed.
2. This repository after F24: `docs/` absent from `main`; `codeadd-docs` on `origin` holds deliveries, changelog and the index; `/add-framework--plan` and `/add-framework--done` read and write `.codeadd/docs/`.
3. L0 GREEN.
4. Every artifact generated after install carries the schema (D23): in L3.1's scratch run, every `.md` under `.codeadd/docs/` — `iterations.md`, `build-ledger.md`, `tasks.md` and any health-check, `design-system.md` or `code-quality-review.md` the run produced included — reads `schema: 1` via `docSchemaOf`, and every JSONL line carries `v`. A file reading `0` fails the acceptance.
5. `codeadd docs migrate` on a scratch legacy project prints the agent prompt read from its single template file and runs no agent (D23): the printed block equals `.codeadd/templates/docs-migrate-prompt.md` and no process but `git` was started. Pasting it into an agent is the user's act and not part of acceptance.
6. A doc without `schema` is recognized as legacy (D23): in the same scratch project `DOCS_LEGACY=<n>` counts exactly the migrated docs that carry no `schema:`, and `docSchemaOf` returns `0` for each.

**RED expectations against the current tree:** L0, all of L1, L2.1–2.6, L2.10, L2.11 and L3.4–3.6 fail. L2.7–2.9 pass today and must keep passing.
**GREEN = all levels pass after F1–F27.**

---

## Execution Order

F1 → F2 → F25 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12 → F13 → F14 → F15 → F16 → F26 → F17 → F18 → F27 → F19 → F20 → F21 → F22 → F23 → F24

- **F1 first**: the guard is the requirement's proof; it must exist and be RED before anything changes.
  From F2 to F23 it is the one accepted failure, its hit count logged per F-block and never growing (R10).
- **F2–F4 before any consumer**: every later block consumes the resolver or the git helper.
- **F25 right after F2**: the build variable needs only the constant, and every later instruction edit can write `{{doc-schema}}` instead of a number.
- **F8 before F9**: `done.cjs` records the fields `delivered.cjs` defines.
- **F26 after F16**: it stamps instructions F12–F16 have already rewritten and extends the guard (F4) and `mcp/` (F11) — one pass over each file, not two.
- **F27 after F18, before F20/F23/F24**: it extends the command F18 creates, and the guide, the site and this repo's migration describe or run its output.
- **F12 before F13–F16**: commands and skills point at the `Docs Branch` section.
- **F18 before F20, F23, F24**: the guide and this repo's migration need the command.
- **F24 last**: the build executes on the workbench F22 rewrites and keeps its ledger under the old
  internal directory until then; F24 moves plan + ledger, rebuilds the workbench and migrates in one step.

Working-state boundaries: after **F11** all shipped scripts and `mcp/` are consistent (instructions still
old; the D21 frontmatter lands in F26); after **F20** the product is complete and its tests green except L0; after **F24** everything,
L0 included, is green. A build that must stop stops at one of those three.

Per-F-block validation beyond the layer default: F3, F9, F17, F18 run their suites against a real bare
remote; F13–F15 run `node scripts/build.js` and the injection-points test; F19/F21 run the test-loss guard;
F25 and F26 run `node scripts/build.js` plus `build-doc-schema`, and F26 the `mcp-document-model` suite;
F27 runs `docs-migrate.test.js` against a real bare remote.

## Reviewer Handoff

For each F-block the build leaves, in the ledger: files touched, validation levels and pass state, any
ruling that departs from D1–D23 or R1–R13.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A hit removed by rewording into a **fallback** (e.g. "if `.codeadd/docs` is missing, read X") — L0 cannot see that; read every resolver caller for a second location.
3. An exemption, a normalisation or a code-file exclusion widened beyond what L0 lists, to get L0 green.
4. A command that writes docs but never reaches `Docs Branch`'s commit step.
5. `touched` falling back to history-walking for entries without `code_sha`.
6. Built provider trees reintroducing an old path through a fragment or a fallback.
7. A literal schema number in a shipped markdown file, or a second copy of the migrate prompt text (D20, D21).
8. A writer of the six formerly frontmatter-less outputs that still creates its file without `type` + `schema`.
9. `docs migrate` stamping `schema:` itself, or invoking anything but `git`.

## References

- Intent: `docs/brainstorming/0078F-docs-branch-intent.md` (D1–D23; D20/D21 added 2026-11-11)
- Prior art: `2026-10-10T110912-PLAN--board-outside-code-branches` (orphan branch, identity fallback, leftover-worktree rule), `2026-10-29T223023-PLAN--remove-board` (never delete branch/data), `2026-10-20T213806-PLAN--done-worktree` (worktree copy and `git add -A`)

---

## Next Steps

/add-framework--build docs/plans/2026-11-11T121728-PLAN--docs-branch.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-11-11 | Initial creation |
| 2026-11-11 | Review verdict `blocked` (5 findings), all judged valid. B1/B2 were decisions, not defects; per the invocation ("do not ask questions, decide by recommendation") they were decided as R2 (strict, exception = 3 paths; migrations 0002/0003 repoint, 0005 moves into `docs-migrate.js`), R6 (CHANGELOG `:34` reworded, not exempt) and R9 (closed non-path forms; user-docs mentions reworded; old-root filters deleted). B3: L0 rewritten — whole-file scan, 4 patterns incl. string-literal and pathspec forms, closed normalisations, self-check; the shell equivalent is dropped. B4: R10 — the guard is the one tracked accepted failure until F24. B5: `provider-map.json:160`, `features.js:93`, negative test assertions, `docs.astro:739`, i18n lines, `status.cjs:788`, `delivery-index-core.cjs:336/508`, `migrate-ids.cjs:88-95`, `add-help`/`add-new` outputs named in F-blocks; hard-coded counts replaced by "what L0 lists" |
| 2026-11-11 | Amendment for the refined intent (update mode, no re-review per invocation). New scope D20 (migrate prints a ready-to-paste agent prompt from one template, runs no agent) and D21 (`schema:` on every generated artifact, one `DOC_SCHEMA_VERSION`, legacy = `0`, JSONL `v`). Former D20/D21 renumbered to D22/D23; references updated. F2 extended (`DOC_SCHEMA_VERSION`, `docSchemaOf`); F4 type-equality test widened to the full registry; F18/F20/F23/F24 extended. New T7: F25 (`{{doc-schema}}` build variable), F26 (frontmatter on every generated artifact, six new types in `mcp/types.mjs`, frontmatter-aware guard headers, `log-jsonl` `v`), F27 (`templates/docs-migrate-prompt.md`, `DOCS_LEGACY=` + prompt print). Rulings R11–R13. L1.10–1.16, L2.10–2.11, L3.4–3.6 added for the three new D23 bullets; Execution Order places F25 after F2, F26 after F16, F27 after F18. Focused self-check: every D20/D21 clause and each new D23 bullet maps to an F-block and a test |

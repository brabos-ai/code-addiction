# Plan: docs-branch-fixes — patch v1.9.2: QA secret out of tracked settings, sync/zero-legacy path guard, honest `docs migrate`, headless permissions, changelog promotion

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-11-12
> **Delivery:** confirm
> **Release:** one PR, one patch release — v1.9.2
> **Approval note:** the plan, build, done, sync and release for this patch were approved by Maicon on 2026-11-12 without check-ins (operator instruction for this run). `Delivery: confirm` is copied from the intent file as the rule requires; the operator, not the plan, decides whether the build waits.

---

## Objective

[from conversation, no design document — the intent file is `bounded` and carries the decisions]

Fix the seven defects the Estanka upgrade to v1.9.1 exposed, in one patch: no QA secret ever lands in a
tracked file; the internal sync can never leave a tracked `docs/` again; `codeadd docs migrate` always
says what it did, lists every stale code reference and every document it could not stamp, and stamps
what it can without inventing hashes; the headless guide names the permissions a `claude -p` run needs;
and the release flow promotes `CHANGELOG.md` `[Unreleased]` on every release.

**When this build is done:** one PR on `main` carrying all eight decisions, every code fix proven by a
test that was RED on `12e4f0be` and is GREEN after its F-block, and a `CHANGELOG.md` with `1.9.0` and
`1.9.1` sections plus an `[Unreleased]` that the v1.9.2 release promotes (security note and rotation
warning first).

## Context

Findings come from the Estanka upgrade to v1.9.1 (xmaiconx/organize-my-finances PR #66) and from the
0078F docs-branch delivery (`2026-11-11T121728-PLAN--docs-branch`). The `authSeed` exposure is older:
`!.codeadd/settings.json` in the managed gitignore block came with 0066B (`2026-10-25T053315-PLAN--qa-settings`,
v1.7.0), which made `settings.json` committed and listed `qa.authSeed` in it. This plan reverses that
one part of 0066B. Triage evidence (file:line) is in the triage summary; the decisions are the intent's.

**Every decision here was taken in the documents below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/docs-branch-fixes-intent.md` | `path: bounded`, `delivery: confirm`, decisions 1–9 with acceptance criteria, `## Open: None` |
| `/home/codeaddiction/terminals/triage192-summary.md` (outside the repo, not archived) | Root causes with file:line, RED test ideas, and the triage suggestions the intent overruled |
| Notion card `docs-branch-fixes` (https://app.notion.com/p/416e0000aeae812ab748d3323ec7479e) | The approved card; release v1.9.2 |

## Global Constraints

- One PR, one patch release: v1.9.2 (operator instruction; intent decision 9)
- Order of work: decision 8 first, then 2 → 7 → 3 → 5 → 4 → 6 → 9 (operator instruction; intent decision 1 and triage "Plano TDD em lote")
- Every code fix is strict TDD: the test is written first and run RED against the tree, the RED output is recorded, then the fix lands and the GREEN output is recorded — both in the ledger row of that F-block (operator instruction)
- No tracked file outside `cli/src/docs-migrate.js`, `cli/tests/docs-migrate.test.js` and `cli/tests/fixtures/docs-migrate/` may name the previous docs location (`cli/tests/docs-no-legacy.test.js`, EXEMPT list; 0078F)
- `codeadd docs migrate` never rewrites project code (intent decision 3)
- Never invent a provenance hash (intent decision 5)
- No secret value is ever printed to stdout, written to a log, or copied into a test fixture as a real credential (intent decision 8; triage "Nenhum valor secreto foi lido ou impresso")
- The agent-mode guide does not recommend `bypassPermissions` as the default (intent decision 4)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Never write a raw `.codeadd/` path in product artefact prose; use `{{cmd:}}` / `{{skill:}}` — scripts excepted (AGENTS.md, Pipeline rules). A settings file path such as `.codeadd/settings.local.json` follows the existing `.codeadd/settings.json` precedent in the same files
- One commit per F-block (`add-build-ledger`)

## Problem

1. **QA secret in a tracked file (critical).** `cli/src/gitignore.js:16` keeps `.codeadd/settings.json` committed, and `qa.authSeed` ("how to sign in as a seeded user") lives in it. Users put test passwords there; `migrateQaSettings` (`cli/src/docs-migrate.js:106`) copies the legacy QA config — `authSeed` included — straight into it. Every project with QA since v1.7.0 is exposed.
2. **Sync can leave a tracked `docs/`.** Commit `6537b89d` (post-sync) carried `docs/plans/…` and `docs/brainstorming/…`; `2fe12985` removed them. `add-framework--sync` declares no write-set and no pre-check, and the zero-legacy guard only scans file *content*, so a tracked `docs/` path with neutral content passes.
3. **Migrate leaves broken code references silently.** After the move nothing scans the project; Estanka's `apps/e2e/src/catalog.ts` and `apps/api/scripts/mcp-bench.mjs` still read the old paths. The prompt confines the agent to `.codeadd/docs/`.
4. **Headless runs stop at permissions.** `agent-mode/README.md` has no permissions section; `/add-qa-setup` writes the provider skills folder and runs `node` scripts.
5. **Migrate skips documents silently.** The CLI stamps nothing by design; the agent stamped 419/768 Estanka docs and listed the rest only in chat. `0002CHG.md` without frontmatter is not even collected (`docs-migrate.js:311`).
6. **The changelog is never promoted.** `CHANGELOG.md` still reads `[Unreleased]` after v1.9.0 and v1.9.1; the release command never touches it and its NEVER list (`add-framework--release.md:311`) discourages it.
7. **Migrate is mute on a no-op.** `MIGRATED=nothing` prints no summary; `already` prints two keys.

## Proposal

Eight topics, one PR, in the operator's order. Security first because it is the only defect that leaks
data. Decision 7 lands before 3 and 5 because it builds the summary block those two extend. Each code
fix is a RED test, then the fix. Prompt and documentation changes get a static assertion test, RED first,
plus the prompt reviewer.

**The secret moves to a second file with the same shape.** `.codeadd/settings.local.json` is a gitignored
sibling of `settings.json` holding `{ "schema": 1, "qa": { "authSeed": "…" } }`. It is already ignored
by `.codeadd/*`; the managed block also names it explicitly so a later `!` rule or a hand edit cannot
un-ignore it silently. `codeadd update` moves an existing value through a run-once migration; the
`add-qa-setup` contract shape changes, so every existing QA project reads STALE and its next
`/add-qa-setup` run moves the value too. The env-var reference the intent allows as an alternative is not
built (see Does NOT Include).

## Scope

### Includes

#### T1 — Decision 8: secrets never in a tracked file (FIRST)

- **F1** [product] — `cli/src/gitignore.js` (+ `cli/tests/gitignore.test.js`): `CODEADD_PAIR` gains the line `.codeadd/settings.local.json`, written after the two `!` exceptions so last-match-wins keeps it ignored. Must not lose: the `!.codeadd/settings.json` and `!.codeadd/wiki/` exceptions, in-place block replacement, the bare-line drop. Update the module header comment (two committed entries, one explicit local file).
  - **Produces:** managed-block line `.codeadd/settings.local.json`
  - **RED:** a test asserting `getInstalledDirs([])` contains `.codeadd/settings.local.json`, and a git-backed test where `git check-ignore -q .codeadd/settings.local.json` exits 0 after `writeGitignoreBlock` — fails today (line absent; the second case may already pass through `.codeadd/*`, so the first case is the RED one). **GREEN:** both pass.
- **F2** [product] — `cli/src/migrations.js`, `cli/src/updater.js` (+ `cli/tests/migrations.test.js`): new registry entry `0007-move-qa-auth-seed`. It reads `.codeadd/settings.json`; when `qa.authSeed` exists it read-merge-writes it into `.codeadd/settings.local.json` → `qa.authSeed` (an existing, different local value is kept and the tracked one is still removed, with a note), deletes the key from `settings.json` leaving every other key and order intact, and never puts the value in `changes`, `notes` or any output. An unparsable `settings.json` is never overwritten — it is reported in `failed`. `runMigrations` gains a `warnings` array; both callers print it with `log.warn` — `updater.js` and the second caller inside `migrations.js` (the standalone migrate entry, about line 623), which today prints only `changes`, `notes` and `failed` and would otherwise drop the warning while recording 0007 as applied. The warning tells the user to check whether `.codeadd/settings.json` with `authSeed` was ever committed (`git log -S authSeed -- .codeadd/settings.json`) and, if so, rotate the test password; when `git check-ignore` does not match the local file (a project that opted out of the managed block) it adds a second warning naming the file to ignore. ⛔ `migrations.js` is not zero-legacy-exempt: its strings must not name the previous docs location.
  - **Produces:** migration id `0007-move-qa-auth-seed`; local-file shape `.codeadd/settings.local.json#qa.authSeed`; `runMigrations` result key `warnings`
  - **Consumes:** managed-block line `.codeadd/settings.local.json` (F1)
  - **RED:** fixture project with `settings.json` `{ schema:1, qa:{ baseUrl, authSeed:"<fixture-placeholder>" } }` → after `runMigrations`, `settings.json` has no `authSeed`, the local file has it, `warnings` names rotation, and no captured output contains the placeholder value — fails today (no migration). **GREEN:** passes; plus the no-`authSeed` fixture is a no-op, the unparsable fixture lands in `failed` with the file byte-identical, and a case through the second `migrations.js` caller shows the warning printed.
- **F3** [product] — `cli/src/docs-migrate.js` (`migrateQaSettings`) (+ `cli/tests/docs-migrate.test.js`, fixture under `cli/tests/fixtures/docs-migrate/`): the legacy QA config's `authSeed` goes to `.codeadd/settings.local.json` → `qa`, never to `settings.json`; the run prints the same rotation warning, here allowed to name the legacy config file because this file is exempt (its history is where Estanka's password sits). The existing 0005 test case that expects `authSeed` in `settings.json` (`docs-migrate.test.js:268,341`) is changed, not removed.
  - **Consumes:** local-file shape `.codeadd/settings.local.json#qa.authSeed` (F2)
  - **RED:** the full-convert case asserting `settings.json.qa` has no `authSeed`, the local file has it and stdout carries the rotation warning without the value — fails today. **GREEN:** passes.
- **F4** [product] — `framwork/.codeadd/skills/add--settings/SKILL.md`, `framwork/.codeadd/skills/add--setup-contract/SKILL.md`: the settings skill gains the local file — what it holds (`qa.authSeed` only, today), that it is gitignored and never committed, the same read → merge → write rule — and a content rule: no credential, password or token value in `settings.json`. `qa.authSeed` moves from the `qa` value-field table to the local file's table. The setup-contract re-materialize rule names `authSeed` as the one key that is *moved* to the local file rather than kept, as the exception to "never drop a user key".
  - **Consumes:** local-file shape `.codeadd/settings.local.json#qa.authSeed` (F2)
  - **RED/GREEN:** static test `cli/tests/qa-secret-placement.test.js` (new): for each shipped source file that names `authSeed`, the text places it in `settings.local.json`, and no example JSON block under a `settings.json` heading carries `authSeed`. This F-block adds the cases for its two files (RED today, GREEN after). Also extend `cli/tests/add-settings-skill.test.js` if it pins the field table.
- **F5** [product] — `framwork/.codeadd/commands/add-qa-setup.md`, `framwork/.codeadd/commands/add-setup.md`: `## Materializes` keeps `.codeadd/settings.json#qa` (its block loses `authSeed`) and adds `.codeadd/settings.local.json#qa` as a new path with its own step number (`owner: shared`, `hash: null` in the receipt — never hash a secret file); its `changed-in:` goes from `1.9.0` to `1.9.2` and the literal `shape:` line is updated to the value the build emits; the config step writes `authSeed` to the local file; the generated `qa-project` skill text reads it from there; the validate step adds a check that `settings.json` → `qa` holds no `authSeed`, and warns when `git check-ignore` does not match the local file; the prohibitions row allows writing the local file. `add-setup.md:145` routes the asked `authSeed` value to the local file. The new `shape` makes every existing receipt STALE — intended: the next run moves the value.
  - **Consumes:** local-file shape `.codeadd/settings.local.json#qa.authSeed` (F2)
  - **RED/GREEN:** `qa-secret-placement.test.js` cases for both commands, RED then GREEN. Update the tests that pin the literal shape — `cli/tests/add-setup.test.js:114` and `cli/tests/lighter-product-qa.test.js:224` — plus any other the full suite turns up.
- **F6** [product] — readers: `framwork/.codeadd/agents/qa-agent.md`, `framwork/.codeadd/agents/e2e-agent.md`, `framwork/.codeadd/skills/add--qa/SKILL.md`, `framwork/.codeadd/skills/add--qa/references/coordinator.md`, `framwork/.codeadd/fragments/qa-pipeline/add-build.md`: each reads `authSeed` from `.codeadd/settings.local.json` → `qa`; the `add--qa` example JSON drops `authSeed` from the `settings.json` block and shows the local file; the fragment's "name the `qa` field to fix" names the local file for `authSeed`. `plugins/playwright/fragments/*` name only "the `authSeed` hint" and stay unchanged — the build confirms.
  - **Consumes:** local-file shape `.codeadd/settings.local.json#qa.authSeed` (F2)
  - **RED/GREEN:** `qa-secret-placement.test.js` cases for these five files; after this F-block the test covers every shipped file naming `authSeed` (an enumerating case fails on any new file that names it outside the local file).
- **F7** [product] — `framwork/.codeadd/scripts/qa-preflight.cjs`, `framwork/.codeadd/scripts/status.cjs` (+ `scripts/tests/qa-preflight.test.cjs`, `scripts/tests/status.test.cjs`): "QA state materialized" (`hasValueFields`, `setupMaterialized`) also counts a `qa.authSeed` in the local file, so a project whose only value moved is not read as never set up; neither script ever prints a value. Headers updated.
  - **Consumes:** local-file shape `.codeadd/settings.local.json#qa.authSeed` (F2)
  - **RED:** fixture with no `settings.json` value fields and a local file holding `qa.authSeed` → `status.cjs` reports QA state as present (`SETUP_QA_STALE`/materialized) and preflight counts value fields — fails today. **GREEN:** passes.

#### T2 — Decision 2: sync writes only to the docs worktree

- **F8** [product] — `cli/tests/docs-no-legacy.test.js`: new describe `tracked paths` — `git ls-files -- docs` in the repository must be empty (any tracked path under top-level `docs/` fails, neutral content included), and a self-check that plants a tracked `docs/plans/x.md` with neutral content in a temp repo and sees the rule fire. The rule's pattern is assembled from fragments like the rest of the file, so the file never matches itself.
  - **RED:** the new tracked-path case, run in a `git worktree` at `6537b89d` (which tracked two files under the old folder), fails — recorded; and the self-check fails on the branch before the rule is written, because the rule it calls does not exist yet. **GREEN:** the tracked-path case passes on the branch and the self-check fires on the planted neutral file.
- **F9** [internal] — `workbench/commands/add-framework--sync.md`: declares its write-set (README, `web/`, `ecosystem.md`, the ecosystem skill, `.tmp/sync/`; any document output only under `.codeadd/docs/`); a new STEP 0, added to the command's ordered step list, that STOPs when `git ls-files -- docs` is not empty and takes a `git status --porcelain` snapshot; a STEP 6 post-check that `git ls-files -- docs` is empty and that the porcelain output gained nothing outside the write-set relative to that snapshot (a tree dirty before the sync does not fail it); a rule forbidding `git add -A` / `git add .` after a sync (stage the write-set paths by name). It still leaves changes uncommitted. ⛔ The prose writes `git ls-files -- docs` and "the top-level docs folder", never the slash form the zero-legacy guard matches; run the guard after this F-block.
  - **RED/GREEN:** static case in `cli/tests/build-workbench.test.js` (or a new `cli/tests/sync-write-set.test.js`) asserting the source carries the pre-check, the post-check and the staging ban — RED today. Plus `@prompt-review-agent` `mode: confirm` on the command.

#### T3 — Decision 7: migrate always prints a summary

- **F10** [product] — `cli/src/docs-migrate.js` (+ `cli/tests/docs-migrate.test.js`): every run — `moved`, `already`, `nothing`, and `--dry-run` worded as "would" — ends with a summary between `--- MIGRATION SUMMARY ---` and `--- END MIGRATION SUMMARY ---`: files moved (0 included), the reason when 0 (`already migrated: Migrated-From commit <sha> on codeadd-docs` / `nothing to move: no legacy outputs found`), the `delivered.jsonl` state (absent / already at `v: 1` / lines without `v`), and `DOCS_LEGACY`. Existing `KEY=` lines stay, unchanged, for bots. Header comment updated.
  - **Produces:** summary block markers `--- MIGRATION SUMMARY ---` / `--- END MIGRATION SUMMARY ---`
  - **RED:** second run on a migrated fixture and a run on a no-legacy fixture each print the block with `moved: 0` and the reason — fails today (`nothing` prints one key). **GREEN:** passes.

#### T4 — Decision 3: migrate lists stale code references

- **F11** [product] — `cli/src/docs-migrate.js` (+ test, fixture): after the move (and in `--dry-run`), scan `git ls-files -co --exclude-standard` outside `.codeadd/docs/`, skipping `.git`, `node_modules`, `dist/`, `build/`, `.next/`, `coverage/`, binaries and files over a size cap, for the moved legacy paths (`DIR_MAP`, `FILE_MAP`, `features/`, the QA config and receipt, the old decisions log — derived from the constants this file already owns). Each hit prints as `file:line` under a `needs update` heading inside the summary, plus `NEEDS_UPDATE=<n>`. The scan never writes a file. The prompt is printed when `DOCS_LEGACY > 0` **or** `NEEDS_UPDATE > 0`.
  - **Produces:** `NEEDS_UPDATE=<n>` and the `needs update` summary heading
  - **Consumes:** summary block markers `--- MIGRATION SUMMARY ---` / `--- END MIGRATION SUMMARY ---` (F10)
  - **RED:** fixture with `src/e2e.ts` reading the legacy QA config → summary lists `src/e2e.ts:<line>` under `needs update`, the file's bytes are unchanged, `node_modules/x.js` with the same string is not listed — fails today. **GREEN:** passes.
- **F12** [product] — `framwork/.codeadd/templates/docs-migrate-prompt.md`: a new step tells the agent to fix every file listed under `needs update` in the migration summary so it reads the new location, and the "touch only files under `.codeadd/docs/`" rule gains that one exception. ⛔ The template is not zero-legacy-exempt: it must not name the previous location — it points at the summary list instead.
  - **Consumes:** `NEEDS_UPDATE=<n>` and the `needs update` summary heading (F11)
  - **RED/GREEN:** test in `cli/tests/docs-migrate.test.js` that the installed template carries the fix step and the exception — RED today; the zero-legacy guard stays GREEN.

#### T5 — Decision 5: stamp what is possible, report the rest

- **F13** [product] — `cli/src/docs-migrate.js` (+ test, fixtures): (a) the changelog collector also takes `NNNNCHG.md` (`^[0-9]{4}CHG\.md$`), so it moves and is reported instead of being left behind; (b) after the content repairs and before the docs commit, every legacy doc (schema 0) under the docs root is classified. It is stamped `schema: <DOC_SCHEMA_VERSION>` only when every deterministic check passes: frontmatter present; `type` names a schema in the `add--doc-schemas` Schema Index; `id` matches that type's prefix rule; `created`/`updated` are ISO dates; `related`/`tags` present (an absent one is added as `[]`); `## TL;DR` present; a `qa-validation` carries `judged-contract`, `judged-tree` and evidence; a `feature-design` carries a `provenance: sha256:` value. Otherwise it is listed in `.codeadd/docs/migration-report.md` with its path and one reason from a closed set: `non-standard-id`, `unknown-type`, `incomplete-frontmatter`, `missing-tldr`, `qa-validation-without-evidence`, `design-without-hash`. A provenance hash is never computed or written. The report is rewritten on every run (idempotent), committed in the same docs commit, and deleted when nothing is left to report. Output: `DOCS_STAMPED=<n>`, `DOCS_UNSTAMPED=<n>`, `MIGRATION_REPORT=<path>|none`, all inside the summary. Two constants in this file carry what the checks need, each guarded by a test against the skill: the schema-type list (equal to the `add--doc-schemas` Schema Index table) and the per-type id-prefix map (equal to its ID Prefixes table for `feature`, `hotfix`, `prd`, `changelog`; `qa-validation` uses the stated pattern `<feature-id>-qa-validation-NNN`; every other type needs only a non-empty `id`). The `qa-validation` field names (`judged-contract`, `judged-tree`) and the design field `provenance` are read from `references/review.md` and `references/new-feature.md` and pinned by the same test. The module header comment ("does not add or change a `schema:` key") is rewritten to say what the command now stamps and reports. The current test `adds or changes no schema key on a moved file` (`docs-migrate.test.js:216`) contradicts this decision: it is replaced, and the commit carries `Test-Removed: adds or changes no schema key on a moved file` (`scripts/test-loss-guard.cjs`).
  - **Produces:** `.codeadd/docs/migration-report.md` with the reason set above; `DOCS_UNSTAMPED=<n>`
  - **Consumes:** summary block markers `--- MIGRATION SUMMARY ---` / `--- END MIGRATION SUMMARY ---` (F10)
  - **RED:** fixture with one conforming legacy feature doc, one `0002CHG.md` without frontmatter, one `qa-validation` without evidence, one design without `provenance`, one unknown type → the conforming doc gets `schema:`, the other four each appear in the report with the right reason, `0002CHG.md` was moved, the count is printed, no `provenance` was written — fails today. **GREEN:** passes; a second run changes nothing on the docs branch.
- **F14** [product] — `framwork/.codeadd/templates/docs-migrate-prompt.md`, `framwork/.codeadd/skills/add--doc-schemas/SKILL.md`: the prompt names `.codeadd/docs/migration-report.md` as the list to fix, keeps "stamp only what you brought to the standard", tells the agent never to invent a provenance hash (leave such a design in the report), and to re-run `codeadd docs migrate` to refresh the report. The doc-schemas **Schema Version** section gains one line: `codeadd docs migrate` stamps a legacy doc only when the deterministic checks of F13 pass, and lists every other one in the migration report — the narrow, stated case of "stamp what you applied". The prompt is printed also when `DOCS_UNSTAMPED > 0` (a one-line change in `docs-migrate.js`, in this F-block).
  - **Consumes:** `.codeadd/docs/migration-report.md` with the reason set above; `DOCS_UNSTAMPED=<n>` (F13)
  - **RED/GREEN:** template and skill assertions in `cli/tests/docs-migrate.test.js` — RED today. `@prompt-review-agent` is not required (product layer); the build's audit covers it.

#### T6 — Decision 4: headless permissions (docs only)

- **F15** [product] — `framwork/.codeadd/agent-mode/README.md` (+ `cli/tests/agent-mode.test.js`): a permissions subsection in section 1, beside the `claude -p` examples: a headless run needs write access to the provider skills folder (`.claude/skills/` in Claude Code) for `/add-qa-setup`, and `Bash(node:*)` for the scripts the commands and the migrate prompt run; the Claude Code example uses `--allowedTools` (with a permission mode named as the alternative); one provider-agnostic sentence for the others; an explicit line that `bypassPermissions` is not the recommended default.
  - **RED:** test asserting the guide names `--allowedTools`, the skills folder, `Bash(node:*)`, and contains no sentence recommending `bypassPermissions` — fails today (grep `permission|allowedTools|bypass` is empty). **GREEN:** passes.

#### T7 — Decision 6: release promotes `[Unreleased]`

- **F16** [internal] — `scripts/changelog-promote.cjs` (new) + `scripts/tests/changelog-promote.test.cjs` (new): `node scripts/changelog-promote.cjs <version> [--date YYYY-MM-DD]` moves the body of `## [Unreleased]` under a new `## [<version>] - <date>` placed right after it, leaving an empty `## [Unreleased]`. Exit 0 promoted (`CHANGELOG_PROMOTED=<version>`); exit 0 no-op when `[<version>]` already exists and Unreleased is empty (`CHANGELOG_PROMOTED=already`); exit 1 when Unreleased is empty and no version section exists, or the file has no `[Unreleased]`. Node built-ins only; header documents usage and exit codes like its siblings.
  - **Produces:** `CHANGELOG_PROMOTED=<version>|already`
  - **RED:** fixture changelog test — fails today (no script). **GREEN:** the version section holds the former Unreleased content, Unreleased is empty, other sections byte-identical.
- **F17** [internal] — `scripts/create-release-tag.cjs` (+ `scripts/tests/create-release-tag.test.cjs`): a gate before any tag is touched — a stable version whose `## [<version>]` heading is absent from `CHANGELOG.md` exits 1 with a message naming `changelog-promote.cjs`; beta versions are exempt. Header step list updated. Existing stable-version fixtures in `create-release-tag.test.cjs` gain a `CHANGELOG.md` with the matching heading so they keep passing.
  - **RED:** stable fixture without the heading tags successfully today. **GREEN:** exits 1 and creates no tag; with the heading it proceeds as before.
- **F18** [internal] — `workbench/commands/add-framework--release.md`: STEP 4 runs `node scripts/changelog-promote.cjs <version>` on stable releases and commits `CHANGELOG.md` with the two package files in the bump commit; STEP 6 builds the release notes from the promoted section (commits and deliveries enrich it, they no longer replace it); STEP 7 names the F17 gate; the NEVER line "Create `CHANGELOG.md` files" becomes "create a second changelog file". ⛔ No slash form of the old docs folder in the new prose; run the zero-legacy guard.
  - **Consumes:** `CHANGELOG_PROMOTED=<version>|already` (F16)
  - **RED/GREEN:** static assertions (same test home as F9) that STEP 4 runs the script and commits `CHANGELOG.md`, and the NEVER line no longer bans the file — RED today. Plus `@prompt-review-agent` `mode: confirm`.
- **F19** [internal] — `CHANGELOG.md`: backfill. The current `[Unreleased]` content becomes `## [1.9.0] - 2026-11-11`; a new `## [1.9.1] - 2026-11-11` records the release-CI fix (release tests before the `--package` build) and the removal of leftover plan and brainstorm files from the code branch (`2fe12985`) — worded without the slash form of the old folder, because `CHANGELOG.md` is not zero-legacy-exempt (run the guard). `[Unreleased]` is left empty for F20.
  - **RED/GREEN:** `scripts/tests/changelog-promote.test.cjs` gains a repository case: `CHANGELOG.md` has `## [1.9.0]` and `## [1.9.1]` headings — RED today.

#### T8 — Decision 9: changelog entry and release

- **F20** [internal] — `CHANGELOG.md` `[Unreleased]`: a **Security** subsection first — `authSeed` moved out of `.codeadd/settings.json`, `codeadd update` moves it, and the rotation warning (if it was ever committed, in `settings.json` or the old QA config file, rotate the test password — named in words, not by the old path, for the same guard reason as F19) — then **Fixed** entries for decisions 2, 3, 5, 7, **Changed** for 4 and 6. The release run promotes it to `[1.9.2]` (F16/F18); this PR does not bump the version.
  - **RED/GREEN:** repository case: `[Unreleased]` is non-empty and names `authSeed` and rotation — RED today.

**Test placement and layer tags.** Tests of shipped `.cjs` scripts live under `scripts/tests/` and tests of workbench sources under `cli/tests/` by repository convention. An F-block's tag follows the artefact under test, not the test file's directory — so F7 stays `[product]` with tests in `scripts/tests/`, and F9/F18 stay `[internal]` with tests in `cli/tests/`.

### Does NOT Include (important!)

- **The release itself** (version bump, merge to production, tag, publish). It runs after `/add-framework--done` with `/add-framework--sync` and `/add-framework--release`, already approved; its acceptance (`## [1.9.2]` on `main`) is checked there, not in this PR.
- **An env-var reference for `authSeed`.** The intent allows "a local file or env"; no reader resolves env indirection today, and the local file closes the leak. Users may still write a hint such as "password in `$QA_PASSWORD`" as the value.
- **Rewriting the git history of user projects or Estanka.** The warning tells users to rotate; it does not purge history.
- **A `needs-approval` product output for permission denials and an installer ban on writing `permissions`** (triage #2 suggestions) — decision 4 is documentation only.
- **The triage's `SETTINGS_SECRET_SUSPECT` heuristic and `legacy-upgrade: partial` stamp, and deferring schema work to v1.10.0** — overruled by the intent.
- **`workbench/skills/add-commit/SKILL.md`'s `git add -A`.** It is the vector of the 0078F leak, but the F8 guard now fails CI on any tracked `docs/`, and F9 forbids broad staging after a sync. Changing the commit skill's default is a separate decision.
- **Body-section conformance in the migrate stamp beyond `## TL;DR`.** Per-schema section lists are not duplicated in the CLI; see Validated Decisions.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Decisions 1–9 | As in the intent, settled | `docs-branch-fixes-intent.md` `## Decided`; not re-derived |
| Where does the secret go? | `.codeadd/settings.local.json`, same `{schema, qa}` shape, `authSeed` only | Intent decision 8 names it; one shape means one read-merge-write rule |
| How does `update` move it? | Run-once migration `0007-move-qa-auth-seed`, plus the contract shape change that makes `/add-qa-setup` move it on its next run | The migration registry is how `update` runs one-time state changes; the STALE path covers a value re-added later by an old command |
| Local file not ignored (project opted out of the managed block)? | Move anyway and warn; never edit the user's `.gitignore` outside the block | The block is opt-in; the warning makes the gap visible |
| Promotion hook placement | Script `changelog-promote.cjs` run in STEP 4's bump commit; STEP 6 reads the promoted section; F17 gates the tag | **Departure from the intent's wording "STEP 6":** STEP 6 runs on `production` after STEP 5's merge, so a commit made there would reach `main` but not the tagged merge. STEP 4 is the last commit on `main` before the merge (the triage's recommendation). The intent's goal — promotion at release, gated — is kept |
| What may the CLI stamp? | Only docs passing the deterministic checks in F13; everything else goes to the report with a closed reason | Intent decision 5 "stamps every doc it can, never inventing hashes", read against `add--doc-schemas` "never stamp a version you did not apply". The checks are the part a script can verify; F14 records the narrowing in the skill. **Reviewer: flag if this reading is wrong** |
| Schema-type list in the CLI | A constant in `docs-migrate.js`, tested equal to the skill's Schema Index | No machine-readable index exists; the test stops drift |
| Guard rule for tracked `docs/` | Any tracked path under top-level `docs/` fails in this repository | The repo has none since `2fe12985`; "with Code Addiction files" cannot be told apart by content, which is exactly the hole |
| Order | 8 → 2 → 7 → 3 → 5 → 4 → 6 → 9 | Operator instruction; 7 before 3 and 5 because they extend its summary |

## Impact

Risk grades are `impact --depth 1` from the artefact graph (built 2026-11-12, `framwork/.codeadd/artefact-graph.json`); history returned no prior delivery for any node, both layers queried. Files that are not artefacts have no node — their callers were found by import search and are labelled so.

| Artefact | Layer | Action | Reason / risk |
|----------|-------|--------|---------------|
| `cli/src/gitignore.js` | product | modify | F1. Not a node; imported by `installer.js`, `updater.js`, `uninstaller.js`, `modify.js` (import search) |
| `cli/src/migrations.js` | product | modify | F2. Not a node; imported by `updater.js`, `installer.js`, `docs-migrate.js` (import search) |
| `cli/src/updater.js` | product | modify | F2 — prints `warnings` |
| `cli/src/docs-migrate.js` | product | modify | F3, F10, F11, F13, F14. Not a node; imported by `cli.js` |
| `framwork/.codeadd/skills/add--settings/SKILL.md` | product | modify | F4 — **HIGH** (5 direct callers) |
| `framwork/.codeadd/skills/add--setup-contract/SKILL.md` | product | modify | F4 — MEDIUM (2) |
| `framwork/.codeadd/commands/add-qa-setup.md` | product | modify | F5 — **HIGH** (9, incl. fragment `agent-mode/add-qa-setup.md`, checked: it dispatches nothing touching `authSeed`). Contract shape changes → every receipt STALE (intended) |
| `framwork/.codeadd/commands/add-setup.md` | product | modify | F5 — MEDIUM (2) |
| `framwork/.codeadd/agents/qa-agent.md` | product | modify | F6 — **HIGH** (9) |
| `framwork/.codeadd/agents/e2e-agent.md` | product | modify | F6 — **HIGH** (6) |
| `framwork/.codeadd/skills/add--qa/SKILL.md`, `references/coordinator.md` | product | modify | F6 — **HIGH** (4) |
| `framwork/.codeadd/fragments/qa-pipeline/add-build.md` | product | modify | F6 — LOW (contained by feature `qa-pipeline` only) |
| `framwork/.codeadd/scripts/qa-preflight.cjs` | product | modify | F7 — **HIGH** (3) |
| `framwork/.codeadd/scripts/status.cjs` | product | modify | F7 — **HIGH** (23); change limited to the QA-materialized predicate |
| `framwork/.codeadd/templates/docs-migrate-prompt.md` | product | modify | F12, F14 — LOW (0; read by `docs-migrate.js` at run time, which the graph cannot see) |
| `framwork/.codeadd/skills/add--doc-schemas/SKILL.md` | product | modify | F14 — **HIGH** (27); one added line in Schema Version |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F15 — not a node: NOT VERIFIED by the graph; it is a shipped guide nothing parses |
| `workbench/commands/add-framework--sync.md` | internal | modify | F9 — MEDIUM (1: `add-framework--build`) |
| `workbench/commands/add-framework--release.md` | internal | modify | F18 — MEDIUM (1: `add-framework--sync`) |
| `scripts/changelog-promote.cjs` | internal | create | F16 — not a node (top-level script) |
| `scripts/create-release-tag.cjs` | internal | modify | F17 — not a node |
| `CHANGELOG.md` | internal | modify | F19, F20 |
| `cli/tests/gitignore.test.js`, `migrations.test.js`, `docs-migrate.test.js`, `docs-no-legacy.test.js`, `agent-mode.test.js`, `qa-secret-placement.test.js` (new), `build-workbench.test.js` or `sync-write-set.test.js` (new), `cli/tests/fixtures/docs-migrate/**` | product | modify/create | Tests of F1–F15, F18 |
| `cli/tests/build-contracts.test.js`, `lighter-product-qa.test.js`, `add-setup.test.js`, `add-settings-skill.test.js` | product | modify (if pinned) | F4/F5 shape and field-table pins |
| `scripts/tests/qa-preflight.test.cjs`, `status.test.cjs`, `create-release-tag.test.cjs`, `changelog-promote.test.cjs` (new) | internal | modify/create | F7, F16, F17, F19, F20 |
| `AGENTS.md` | internal | none | Checked by hand: no row names `authSeed`, the sync write-set or the changelog; the Setup Contracts row ("Receipt … `settings.json` → `qa`") stays true |

No new command, skill, agent or framwork script → no `provider-map.json` registration and no inventory change.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first, per code fix.** Each F-block's RED test is written and run against the tree
before its fix; the ledger records the failing output (test name + assertion message), then the GREEN
run. A test written after the fix proves nothing.

### L1 — Unit / script (RED → GREEN)

1. F1 — managed block carries `.codeadd/settings.local.json`; `git check-ignore` matches it. *RED: line absent.*
2. F2 — migration `0007` moves `authSeed`, warns, prints no value, leaves an unparsable file untouched. *RED: no migration.*
3. F3 — `migrateQaSettings` never writes `authSeed` to `settings.json`. *RED: it copies the whole config.*
4. F7 — preflight/status count a local-file `authSeed` as QA state. *RED: they read `settings.json` only.*
5. F10 — summary block on `moved`, `already`, `nothing`, dry-run. *RED: `nothing` prints one key.*
6. F11 — `needs update` `file:line`, file unchanged, `node_modules` skipped. *RED: no scan.*
7. F13 — stamp/report split with reasons; `0002CHG.md` moved; no provenance written; idempotent. *RED: nothing stamped, `0002CHG.md` not collected.*
8. F16 — promotion and its three exit paths. *RED: no script.*
9. F17 — stable tag refused without the version heading. *RED: tag created.*

### L2 — Static artefact assertions (RED → GREEN)

1. F4–F6 — `qa-secret-placement.test.js`: no shipped artefact places `authSeed` in `settings.json`; every one naming it names the local file. *RED: every shipped file naming `authSeed` today places it in `settings.json`.*
2. F8 — tracked `docs/` path fails the zero-legacy guard; self-check fires on a neutral planted file. *RED: content-only guard.*
3. F9, F18 — sync pre/post-check and staging ban; release STEP 4 promotion and NEVER line. *RED: absent.*
4. F12, F14 — prompt fix step, report pointer, no legacy path in the template; doc-schemas line. *RED: absent.*
5. F15 — guide names the permissions, no default `bypassPermissions`. *RED: no section.*
6. F19, F20 — `CHANGELOG.md` has `[1.9.0]`, `[1.9.1]` and a non-empty `[Unreleased]` naming rotation. *RED: neither section.*

### L3 — Build and suite

1. `node scripts/build.js` exits 0, no new warning; `contracts.json` carries the new `add-qa-setup` shape.
2. `node scripts/build-workbench.js` exits 0 (F9, F18).
3. `node scripts/run-tests.js all` GREEN; the zero-legacy guard GREEN (F12–F14 add no legacy path outside the exempt files).
4. `node scripts/test-loss-guard.cjs` passes — the one replaced test is covered by its `Test-Removed:` trailer (F13).
5. `@prompt-review-agent` `mode: confirm` on `add-framework--sync` and `add-framework--release` returns no `❌`.

### L4 — Behavioural acceptance (the intent's criteria)

1. Fresh install + `/add-qa-setup` scaffold path (simulated by its writer rules and F5 test): no secret in `settings.json`; `git check-ignore` matches the local file.
2. `codeadd update` on a fixture project with `authSeed` in `settings.json` (`cli/tests/updater.test.js`, through `runMigrations`): value moved, `settings.json` without it, rotation warning printed, value absent from stdout.
3. A planted tracked `docs/` file fails the guard; without it the guard passes; `git ls-files -- docs` empty on the branch.
4. Migrate second run on a migrated fixture prints the summary with `moved: 0` and the reason.
5. Migrate on the stale-reference fixture lists `file:line` under `needs update`, file unchanged, prompt carries the fix step.
6. Migrate on the mixed fixture stamps the stampable doc, reports each other with a reason, prints the count, prompt names the report.
7. Guide check (F15).
8. Fixture changelog promotion; `CHANGELOG.md` with `1.9.0` and `1.9.1` now, `1.9.2` after the release.

**RED expectations against `12e4f0be`:** every L1 and L2 item fails; L3 passes today and must still pass.
**GREEN = all levels pass after F1–F20.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 (T1, decision 8)
→ F8 → F9 (T2, decision 2)
→ F10 (T3, decision 7)
→ F11 → F12 (T4, decision 3)
→ F13 → F14 (T5, decision 5)
→ F15 (T6, decision 4)
→ F16 → F17 → F18 → F19 (T7, decision 6)
→ F20 (T8, decision 9)

- **F1 before F2** because the migration's ignore check reads the managed block line.
- **F2 before F3–F7** because it fixes the local-file shape they all consume.
- **F10 before F11 and F13** because both write inside its summary block.
- **F16 before F17 and F18**; **F19 before F20** because F20 writes the `[Unreleased]` F19 empties.
- **Safe stopping points** (repo green, release-safe): after F7 (the secret fix is whole), after F9, after F10, after F12, after F14, after F15, after F19. Stopping between F4 and F6 leaves artefacts disagreeing on where `authSeed` lives — do not stop there.
- **Per-F-block extra validation:** F5 runs the full build (contract shape) and the shape-pinning tests; F13 runs `test-loss-guard.cjs`; F9 and F18 run the workbench build.

## Reviewer Handoff

For each F-block the build leaves in the ledger:

- **What changed** — files touched, with the F-block id.
- **RED evidence then GREEN evidence** — the failing test name and assertion message before the fix, the passing run after.
- **Any decision deferred or altered**, with the intent decision it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose test was never RED — a test written after the fix proves nothing.
2. A secret value in any stdout capture, snapshot, log line or fixture — fixtures must use an obvious placeholder.
3. A legacy-path string added to a non-exempt file — `migrations.js`, `updater.js`, the prompt template, the doc-schemas skill, `add-framework--sync.md`, `add-framework--release.md`, `CHANGELOG.md`, and every new test file (`qa-secret-placement.test.js`, the sync/release static test, `changelog-promote.test.cjs`) — the guard's pattern matches the slash form after a backtick or a space. Run the zero-legacy guard after every F-block that writes prose.
4. A stamped doc that fails one of the F13 checks, or any `provenance` value the CLI wrote.
5. The release promotion committed anywhere but the STEP 4 bump commit.
6. A shipped artefact still describing `authSeed` as part of `settings.json` → `qa` (F4–F6 enumerating case).

---

## Next Steps

/add-framework--build docs/plans/2026-11-12T162612-PLAN--docs-branch-fixes.md

One command executes every F-block, both layers. Then `/add-framework--done`, `/add-framework--sync` and `/add-framework--release` (patch v1.9.2), as approved.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-11-12 | Initial creation from `docs-branch-fixes-intent.md` and the triage summary |
| 2026-11-12 | Review `fix-then-ok` applied: F5 names the Materializes paths, the `changed-in` bump and the two shape-pinning tests (A1); F2 covers the second `runMigrations` caller (A2); F9/F18 guard prose, STEP 0 in the step list, porcelain snapshot (A3); F13 id-prefix constant and header update (A4); test-placement note (A5); F8 RED definition (A6); updater test path and release-tag fixtures (N1, N2) |
| 2026-11-12 | Built: F1–F20 on branch fix/docs-branch-fixes (see the ledger for commits and rulings); status draft → implemented |

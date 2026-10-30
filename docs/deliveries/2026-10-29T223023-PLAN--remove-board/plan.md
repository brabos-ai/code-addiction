# Plan: remove-board — the framework stops shipping a backlog board

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-10-29
> **Delivery:** confirm
> **Ticket:** 0075B

---

## Objective

[from conversation, no design document — the intent file is `bounded` and writes none]

The framework stops having a board. It cares only about what is in the features
(`docs/features/<id>-<slug>/`); project management lives outside it. The board app, the backlog and
board scripts, the `board` feature with its fragments and slots, the `add--backlog` skill, the
agent-mode board docs and the internal ticket tooling are removed; ids are allocated from
`docs/features/` only, with no `B` letter; every report that names a feature prints `<id>-<slug>`.
Installs that had the feature on are moved off it by migration `0006-retire-board`, which never
deletes `.codeadd/board.json`, the `board` branch or the clone.

**When this build is done:** a fresh install and an updated install carry no board text, no board
script and no board feature; an install that had `board` on loses the flag, keeps its board data and
prints one note saying where that data is; `next-id` and `init` allocate from `docs/features/` alone;
the internal pipeline runs with no ticket step; this repository builds, tests and runs CI with no
board app.

**Ticket done when:** No shipped file under framwork/ references backlog-cli, backlog-commit or board.json (grep test passes); the board feature is gone from the CLI; migration 0006 removes the flag, prints the note and leaves board.json untouched (tested); ids are allocated from docs/features only, with no B; every command report and result block prints <id>-<slug>; CI is green.

## Context

The board drifts from the code branch, needs `board-init`, locks, push/rebase handling and a local
app, and only one person uses it. The intent closes all 19 decisions with `## Open: None`.

**Why a ticket header although the intent reads `ticket: none`:** the invocation of this plan named
ticket `0075B` explicitly, and that ticket's `tldr` is this card. The plan carries it so its
`done_when` is the check. It is the last plan to carry one: F13 removes ticket handling from the
internal pipeline, and the build's own STEP 10 write will hit the documented degradation (the script
is gone on the branch) — reported, not worked around.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-29T112200-remove-board-intent.md` | `path: bounded`, 19 closed decisions (what goes, what stays, migration 0006, the id letter, `<id>-<slug>`, slicing), `## Open: None` |

The line numbers the intent quotes were checked on `4813ef2`. **This plan anchors every edit by quoted
text**; the intent's line numbers are a map to find the text, never the anchor.

## Global Constraints

- Migration `0006-retire-board` never deletes `.codeadd/board.json`, the `board` branch or the clone (invocation; intent decision 7)
- No secrets in code, commits, logs or docs (invocation)
- No deploy, rollout, publish or release task in this plan (invocation)
- Examples in artefacts stay stack-agnostic (invocation)
- Every behaviour change is strict TDD red-green: a failing test first, then the implementation (invocation)
- Edits are anchored by quoted text, not line numbers (invocation)
- Old `00NNB` ids are not renamed anywhere — branches, `docs/changelog/*`, `docs/deliveries/*`, `docs/delivered.jsonl` stay as history (intent decisions 14, 18)
- This card adds no Notion text (intent decision 12)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Edit `workbench/`, never the built `.claude/`, `.opencode/`, `.agents/`, `.codex/` copies (AGENTS.md, Internal Layer)
- Tests run through `node scripts/run-tests.js` (AGENTS.md, Key files)

## Problem

1. **The framework ships project management it should not own** — a board on an orphan branch plus a
   clone in `~/.codeadd/<key>/board/`, seven shipped scripts, a feature with 24 slots (25 member pairs,
   counted with `grep` on the command sources) over six commands, a skill, a local app and CI jobs,
   all to keep a side-record that drifts from the code.
2. **Ids carry a letter for that side-record** — the allocator counts `docs/backlog.jsonl` and hands out
   `B`, so feature numbering depends on a file outside the features.

## Proposal

Remove from the outside in, so every F-block leaves the tree green: first a guard test whose
assertions start skipped; then the fragments and slots (nothing injects them any more); then the CLI
feature; then migration 0006; then the scripts together with every skill edge to them; then the
allocator (the one piece kept, by then required by nothing board-side); then the remaining product
text; then the internal tooling; then the docs. Each F-block writes its failing test first.

**How a red-until-later assertion is committed:** the guard file (F1) is committed with each assertion
as `skip` and the owning F-block id in its title. The owning F-block removes the `skip` first, runs
it RED, implements, runs it GREEN. No skip survives the plan (L2.4).

## Scope

### Includes

#### Phase A — the end-state guard

- **F1** [product] — `cli/tests/board-removed.test.js` (new). Five assertions, each committed skipped
  with its owner in the title: (1) no file under `framwork/.codeadd/` or the build's provider output
  dirs contains `backlog-commit`, `backlog-cli` or `board.json` — owner F8; (2)
  `framwork/.codeadd/fragments/board/` does not exist — owner F2; (3) no command under
  `framwork/.codeadd/commands/` carries `<!-- slot:board.` or `<!-- feature:board:` — owner F2;
  (4) `FEATURES` in `cli/src/features.js` has no `board` key — owner F3; (5)
  `framwork/provider-map.json` names no `add--backlog` and no `board-init` — owner F5. It never scans
  `docs/changelog/` or `docs/deliveries/` (history). Validation: the file runs, five skipped.
  - **Produces:** `board-removed.test.js` with five skipped assertions, each titled with its owner

#### Phase B — the injected text, then the CLI feature

- **F2** [product] — delete `framwork/.codeadd/fragments/board/` (6 files) and remove every
  `<!-- slot:board.… -->` block from `add-brainstorm`, `add-new`, `add-plan`, `add-build`, `add-done`,
  `add-hotfix` (24 slots, 25 member pairs; the `add-build` one is combined as
  `slot:board.ticket-in-review+board.deferred-minors`). Each block goes whole — opening slot marker to
  closing slot marker — leaving the surrounding text as the command reads with the feature off.
  `add-setup.md`: the row starting ``| `board` |`` and the line `- script: board-init.cjs` go.
  Delete `cli/tests/board-feature.test.js` and `board-phase-writes.test.js` (they test the deleted
  fragments; `Test-Removed:` trailer). RED first: unskip F1 (2) and (3), and update
  `cli/tests/fixtures/slot-membership-map-v2.json` and the injection suites to the end-state map.
  - **Consumes:** `board-removed.test.js` with five skipped assertions, each titled with its owner (F1)
  - **Expected end-state map:** zero slots whose id starts `board.`; zero `feature:board:` member
    pairs; every other slot and member unchanged; `injection-points.json` has no `board` entry and
    its point count drops by exactly 25 against the count the build records before this F-block.
- **F3** [product] — `cli/src/features.js`, `installer.js`, `modify.js`, `cli.js`, `gitignore.js`,
  `uninstaller.js`; delete `cli/src/board-init.js`. RED first: unskip F1 (4); in the existing
  features/modify/installer/gitignore/uninstaller suites: `normalizeFeatureStates({ board: true,
  'tdd-pipeline': true })` returns the states without `board`, `changed: true`, and does not throw;
  `codeadd features enable board` fails as an unknown feature; the `.codeadd/*` gitignore pair no
  longer carries `!.codeadd/board.json`; uninstall over a project holding `.codeadd/board.json` and a
  git clone under an ADD directory leaves both in place. Then implement: remove the `board` entry and
  the `initBoardOnEnable` import and call; `normalizeFeatureStates` treats `board` as a retired key and
  drops it; the `cli.js` help examples use another feature; drop `!.codeadd/board.json` from
  `CODEADD_PAIR` and its comments. **`uninstaller.js` keeps both protections** — `.codeadd/board.json`
  stays in `isProjectData` and a directory holding `.git` is still skipped — only the board wording in
  their comments is generalised.
  - **Consumes:** `board-removed.test.js` with five skipped assertions, each titled with its owner (F1)
  - **Produces:** `normalizeFeatureStates` drops the retired `board` key
- **F4** [product] — `cli/src/migrations.js` and the updater path. RED first, two suites:
  `cli/tests/migrations.test.js` — the registry ids read exactly `0001-prune-legacy-orphans`,
  `0002-harvest-relations`, `0003-retire-about-suffix`, `0005-qa-settings`, `0006-retire-board`; a
  ledger already holding `0004-sync-board-definitions` gives no error and no pending entry for it;
  `0006-retire-board` run with `board: true` in the manifest and `.codeadd/board.json` present returns
  `{ changes, notes }` with the flag gone from `manifest.features`, exactly one entry in `notes` (the
  note text of intent decision 7), `board.json` byte-identical, a local `board` branch still present
  and a clone directory under a temp `CODEADD_BOARD_DIR` still present; with no `board.json` the flag
  goes and `notes` is empty; a second run changes nothing. `cli/tests/updater.test.js` — updating an
  install whose manifest has `board: true` ends with `0006-retire-board` in the ledger, no `board` in
  `manifest.features`, no board text in any installed command, no member warning, and the note logged
  once through the existing `for (const note of migrationResult.notes ?? [])` loop in `updater.js`.
  Then implement: remove `syncBoardDefinitions` and the `0004` entry; add `retireBoard` as
  `0006-retire-board`, returning its note in `notes`. The migration does not touch slots: `updater.js`
  calls `runMigrations` before `applyEnabledFeatures`, which re-renders from the new baseline.
  - **Consumes:** `normalizeFeatureStates` drops the retired `board` key (F3)

#### Phase C — the scripts, then the allocator

- **F5** [product] — delete `framwork/.codeadd/scripts/backlog-board.cjs`, `backlog-cli.cjs`,
  `backlog-commit.cjs`, `backlog-core.cjs`, `backlog-git.cjs`, `backlog-storage.cjs`, `board-init.cjs`,
  and `framwork/.codeadd/skills/add--backlog/`, together with every artefact edge to them, so the build's
  graph gates stay green in one commit: their `framwork/provider-map.json` entries; their entries in
  `scripts/tests/native-script-cases.json`; `status.cjs` loses the `require('./backlog-board.cjs')`
  block, the `boardState` function, the line `` say(`BOARD=${boardState(cwd)}`); `` and the header
  block starting `THE BOARD LINE.`; the `backlog-commit.cjs` / `backlog-cli.cjs` / `board-init.cjs`
  references in `add--id-convention`, `add--resource-path-convention`, `add--ecosystem` and
  `add--doc-schemas` (its `references/backlog.md`, the `uses:`/`mention:` lines naming it and the
  backlog scripts, the line naming `backlog-commit.cjs add`, the references-table row). Their native
  suites go with them (`Test-Removed:` trailer): `cli/tests/backlog-cli|backlog-core|backlog-publication|board-runtime.test.js`,
  `scripts/tests/backlog-board|backlog-commit|backlog|board-init|ticket-writes.test.cjs` — those are
  product-script suites, which `add-framework-product-layer` treats as the script's own pin. RED first:
  unskip F1 (5); `scripts/tests/status.test.cjs` asserts the main run prints no `BOARD=` line.
  `backlog-id.cjs` stays here: after this block nothing board-side requires it.
- **F6** [product] — `framwork/.codeadd/scripts/backlog-id.cjs` → `feature-id.cjs` (`git mv`; renamed,
  not edited in place). RED first: `git mv cli/tests/backlog-id.test.js cli/tests/feature-id.test.js`
  and make it require the new module and assert (a) only `docs/features/[NNNN][L]-*` folders are
  counted; (b) a `docs/backlog.jsonl` with a higher id than any folder does NOT raise the next number;
  (c) the `boardRoot` option is gone; (d) the next number continues after the highest existing folder;
  in `scripts/tests/next-id.test.cjs` and `scripts/tests/status.test.cjs`, `status next-id B` exits 2
  like any unknown prefix and the accepted list reads `F|H|PRD|CHG`. Then implement: drop the backlog
  scan and `boardRoot`; update the callers `next-id.cjs`, `init.cjs`, `status.cjs`; every header
  comment naming `B`, `backlog-cli.cjs` or `backlog-id.cjs`; the `backlog-id.cjs` references in
  `add--id-convention` (and its "backlog IDs" `description:`), `add--resource-path-convention`,
  `add--ecosystem` (its `- mention: backlog-id.cjs` line and the table row describing `boardRoot`), and
  in `cli/tests/install.e2e.test.js`, `cli/tests/updater.test.js`, `cli/tests/build-artefact-graph.test.js`.
  `add--id-convention` also gains the rule of intent decision 13: a report names a feature as
  `<id>-<slug>`, never the bare id. Must NOT lose: the global counter across letters, minimum-width
  output, the `CURRENT:` folder-name output. Readers of an EXISTING id (branch names such as
  `feat/0070b-…`, delivery ids) keep accepting any letter — only allocation drops `B`.

#### Phase D — the rest of the product text

- **F7** [product] — skills: `add--doc-schemas` drops the `ticket:` field from `references/fix.md` and
  `references/new-feature.md`; **a legacy document carrying `ticket:` stays valid** — RED first: a
  doc-schema test feeding an `about.md` with `ticket: 0042B` passes validation. Board wording goes from
  `add--settings`, `add--ecosystem`, `add--qa-spec`, `add--health-check/*`, `add--human-interaction`
  (the "backlog operation nested inside another command" case). In `add--ux-design/*`,
  `add--frontend-*`, `add--architecture-discovery`, `add--backend-architecture`,
  `add--wiki-maintenance`, `add-wiki`, `security-agent`, `ux-flow-agent` and the agent-mode wiki
  fragment and fallback, "board"/"backlog" as a generic UI or English word STAYS; the build lists each
  hit and its verdict in the ledger.
- **F8** [product] — agent mode: delete `framwork/.codeadd/agent-mode/board-management.md`; in
  `agent-mode/README.md` remove the board lines, the section headed "Mirror the board" with its Notion
  example, and the board rules in section 10; in `roles/product-pm.md` and `roles/chief-engineer.md`
  the "with the board" branches go and the handoff is the intent file plus `docs/features/<id>-<slug>/`
  on main; `agent-mode/result.schema.json` drops the board-write field;
  `fallbacks/agent-mode.add-review.offer.md` loses its board text. RED first: unskip F1 (1); the
  result-schema test rejects a result carrying the board field. Any shipped hit F1 (1) still reports
  is a board mention and is removed here.
- **F9** [product] — the `<id>-<slug>` rule in the report, next-step and result-block text of
  `add-brainstorm`, `add-new`, `add-plan`, `add-build`, `add-done`, `add-hotfix`, `add-setup` and
  `agent-mode/result.schema.json`. `{FEATURE_ID}` already holds the folder name (`init.cjs` prints
  `CURRENT:<folder>`), so it stays. RED first: a test over those sections asserting no match of the
  bare-id pattern `\[NNNN\](\[L\]|[A-Z])?(?!-)` and no `<id>` not followed by `-<slug>`; then the text
  changes until it passes. Paths and globs that legitimately carry the bare pattern outside report,
  next-step and result-block sections are not in scope of the test.
- **F10** [product] — `cli/README.md`: the board feature, its enable flow and `board-init` go; the
  feature table loses its row; migration 0006 is described in one line. Validated by L2.2 and by
  `scripts/tests/web-site.test.cjs`-style grep in F15 not finding a board feature row.

#### Phase E — internal tooling

- **F11** [internal] — the board app: delete `board/`, `scripts/build-board-runtime.js`;
  `package.json` loses `build:board`, `preboard`, `board`, `test:board`, `test:board:e2e`, and `setup`
  becomes `node scripts/build-workbench.js`; `.github/workflows/ci.yml` loses the `board` and
  `board-e2e` jobs and the step `run: node scripts/board-files-guard.cjs` with its comment;
  `scripts/run-tests.js`, `test-context.cjs`, `test-transport.cjs`, `test-worker.cjs`,
  `scripts/tests.Dockerfile` lose the `board`/`board-e2e` selections; `scripts/build.js` generalises
  the comment that reads `the backlog modules qualify on their own merits`. RED first in the
  `run-tests` / `test-ci-policy` / `test-context` / `test-entrypoints` / `test-transport` /
  `test-worker` / `build-setup` suites: `run-tests.js board` is rejected as an unknown selection and
  `all` no longer includes a board stage.
- **F12** [internal] — delete `scripts/board-files-guard.cjs` and its test,
  `scripts/migrations/migrate-board.cjs` and its test, and the root `.codeadd/board.json` (this
  repository's own; never a consumer's). `Test-Removed:` trailer for both suites. Validation: L3.3.
- **F13** [internal] — workbench: delete `workbench/commands/add-framework--backlog.md` and its
  `workbench/provider-map.json` entry; `add-framework--release` loses the awaiting-release ticket
  close; `add-plan-authoring` loses the section `## The Ticket` and the `ticket:` line in The Intent
  File shape; its `references/plan-template.md` loses the `> **Ticket:**` and `**Ticket done when:**`
  lines; `add-framework--brainstorm`, `--plan`, `--build`, `--done` lose every ticket step and the
  `--ticket` flag of `--fix`; `add-framework-product-layer` loses its board text;
  `add-final-report/references/result-block.md` and `result-block.schema.json` drop the ticket/board
  fields. `add-product-artefact-renaming` is checked for its one ticket mention and kept if generic.
  RED first: `scripts/tests/result-block.test.cjs` rejects a result block carrying them. Then
  `node scripts/build-workbench.js` exits 0.
- **F14** [internal] — `AGENTS.md`: the `### Product Layer — board/` section, the `board/` key-file row,
  the `scripts/board-files-guard.cjs` row, the `board` row of the feature table, the
  `add-framework--backlog` row, and the board half of the `npm run setup` paragraph go; the inventory
  block is regenerated with `node scripts/inventory.js`, never hand-edited. Validation: `grep -n -i
  -E 'board|backlog' AGENTS.md` returns no hit about the removed board.

#### Phase F — docs and site

- **F15** [internal] — `README.md` (the Board section), `ecosystem.md` (its board and backlog hits),
  `CHANGELOG.md` (the unreleased `board-init` entry is deleted — it never shipped — and one removal
  entry names migration 0006 and where the user's data stays), `web/src/pages/docs.astro`,
  `web/src/i18n/en.ts` and `pt-br.ts` in one pass, `web/public/commands.svg`,
  `web/src/components/CommandLine.astro`, `web/src/styles/global.css` (each hit checked; generic UI uses
  stay); `web/public/ecosystem.json` and `artefact-graph.mmd` are regenerated by `scripts/graph.js`
  (`ecosystem --write`, `mermaid --write`). RED first: `scripts/tests/web-site.test.cjs` asserts no
  board section in either locale.

### Does NOT Include (important!)

- Any Notion text, skill or workflow — card `agent-mode-notion`, after this one (intent 12, 19)
- Moving existing `board` branches to another tracker — done once, outside the framework (intent 16)
- Renaming old `00NNB` ids anywhere (intent 18)
- Editing `docs/changelog/*`, `docs/deliveries/*` or `docs/delivered.jsonl` history (intent 14)
- Deleting a consumer's `.codeadd/board.json`, `board` branch or clone — from the migration or the uninstaller
- Any deploy, rollout, publish, tag or release step

## Validated Decisions

Taken here by recommendation, without asking, as the invocation ordered.

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Rename the allocator or edit it in place? | Rename to `feature-id.cjs` | The name must say what it counts. The updater's `pruneObsolete` removes the old manifest-tracked file on update. Intent 4 leaves it to the engineer |
| Does the uninstaller stop protecting `board.json` and clones? | No — both protections stay | Removing them would let uninstall delete user board data, against Global Constraint 1 |
| What about an applied `0004` in a ledger? | Tolerated, never re-run, tested | 0004 shipped; the ledger is a set of applied ids |
| Does migration 0006 rewrite slots? | No — it removes the flag; the updater re-renders from the new baseline | `updater.js` runs `runMigrations` before `applyEnabledFeatures`; intent 7(b) is met by that order, tested in F4 |
| `ticket:` in old feature docs | Dropped from the schema for new docs; old docs stay valid | History is not rewritten |
| The `board-init` CHANGELOG entry | Deleted, not marked removed | It is under `[Unreleased]`; v1.7.0 does not carry it (intent 17) |
| The internal pipeline's ticket handling | Removed with the board | Its only write route is `backlog-commit.cjs`, which F5 deletes; intent 1 |
| A product script's `scripts/tests/<name>.test.cjs` suite | Edited or deleted in the `[product]` F-block that changes the script | `add-framework-product-layer` names that suite as the script's own pin and its scoped run as what closes the block. Root build files (`scripts/build.js`) stay `[internal]` (F11) |
| Order: scripts before allocator | F5 deletes `backlog-cli.cjs` (the only board-side requirer of `backlog-id.cjs`) before F6 renames it | Keeps every F-block green |
| Order: fragments before the feature entry | F2 before F3 | No window where a fragment or marker names a feature the CLI no longer knows |
| The bare-id pattern for F9 | `\[NNNN\](\[L\]|[A-Z])?(?!-)` and `<id>` not followed by `-<slug>`, in report, next-step and result-block sections only | Deterministic at plan time; `{FEATURE_ID}` already holds the folder name |
| Sequencing | One plan, one branch, checkpoints per phase | A plan set would leave half-removed states on `main` |
| Audit of an internal subject (plan STEP 3.4) | Not run | No existing internal artefact is the subject being adjusted; the internal ones are removed or edited in passing |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/board-removed.test.js` | product | create | F1 (unskipped by F2, F3, F5, F8) |
| `framwork/.codeadd/fragments/board/*` (6) | product | remove | F2 |
| `framwork/.codeadd/commands/add-brainstorm|add-new|add-plan|add-build|add-done|add-hotfix|add-setup.md` | product | modify | F2, F9 |
| `cli/tests/fixtures/slot-membership-map-v2.json` + injection suites | product | modify | F2 |
| `cli/tests/board-feature.test.js`, `board-phase-writes.test.js` | product | remove | F2 |
| `cli/src/features.js`, `installer.js`, `modify.js`, `cli.js`, `gitignore.js`, `uninstaller.js` + their suites | product | modify | F3 |
| `cli/src/board-init.js` | product | remove | F3 |
| `cli/src/migrations.js`, `cli/tests/migrations.test.js`, `cli/tests/updater.test.js` | product | modify | F4, F6 |
| `framwork/.codeadd/scripts/backlog-{board,cli,commit,core,git,storage}.cjs`, `board-init.cjs` | product | remove | F5 |
| `framwork/.codeadd/skills/add--backlog/` | product | remove | F5 |
| `cli/tests/backlog-cli|backlog-core|backlog-publication|board-runtime.test.js`; `scripts/tests/backlog-board|backlog-commit|backlog|board-init|ticket-writes.test.cjs` | product | remove | F5 |
| `framwork/provider-map.json`, `scripts/tests/native-script-cases.json` | product | modify | F5 |
| `framwork/.codeadd/scripts/status.cjs`, `scripts/tests/status.test.cjs` | product | modify | F5, F6 |
| `add--id-convention`, `add--resource-path-convention`, `add--ecosystem`, `add--doc-schemas` (SKILL, `references/backlog.md` removed) | product | modify/remove | F5, F6, F7 |
| `framwork/.codeadd/scripts/backlog-id.cjs` → `feature-id.cjs`; `next-id.cjs`, `init.cjs` | product | rename/modify | F6 |
| `cli/tests/backlog-id.test.js` → `feature-id.test.js`; `scripts/tests/next-id.test.cjs`; `cli/tests/install.e2e.test.js`, `build-artefact-graph.test.js` | product | rename/modify | F6 |
| `add--doc-schemas/references/fix.md`, `new-feature.md`, `add--settings`, `add--qa-spec`, `add--health-check/*`, `add--human-interaction` (+ checked UI/wiki hits) | product | modify | F7 |
| `framwork/.codeadd/agent-mode/board-management.md` | product | remove | F8 |
| `agent-mode/README.md`, `roles/product-pm.md`, `roles/chief-engineer.md`, `result.schema.json`, `fallbacks/agent-mode.add-review.offer.md` | product | modify | F8, F9 |
| `cli/README.md` | product | modify | F10 |
| `board/` (whole), `scripts/build-board-runtime.js` | internal | remove | F11 |
| `package.json`, `.github/workflows/ci.yml`, `scripts/build.js` (comment), `scripts/run-tests.js`, `test-context.cjs`, `test-transport.cjs`, `test-worker.cjs`, `tests.Dockerfile` + their suites | internal | modify | F11 |
| `scripts/board-files-guard.cjs`, `scripts/migrations/migrate-board.cjs`, their tests, root `.codeadd/board.json` | internal | remove | F12 |
| `workbench/commands/add-framework--backlog.md` | internal | remove | F13 |
| `workbench/provider-map.json`, `add-framework--release.md`, `add-plan-authoring` (+ template), `add-framework--brainstorm|--plan|--build|--done`, `add-framework-product-layer`, `add-final-report/references/result-block.*`, `scripts/tests/result-block.test.cjs` | internal | modify | F13 |
| `AGENTS.md` | internal | modify | F14 |
| `README.md`, `ecosystem.md`, `CHANGELOG.md`, `web/src/**`, `web/public/commands.svg`, `ecosystem.json`, `artefact-graph.mmd`, `scripts/tests/web-site.test.cjs` | internal | modify | F15 |

Risk from `impact --depth 1` on the rebuilt graph: `status.cjs` 23, `add-plan` 27, `add-build` 26,
`add-new` 19, `add-done` 16, `add-hotfix` 12, `add-final-report` 9, `add--id-convention` 8,
`add--backlog` 6, `add-plan-authoring` 5, `add-brainstorm` 5, `backlog-commit.cjs` 4, `add-setup` 3 →
HIGH; `backlog-cli.cjs`, `board-init.cjs`, `backlog-id.cjs`, `init.cjs` 2, `backlog-core|board|git|storage.cjs`,
`next-id.cjs`, `add-framework--release` 1 → MEDIUM; the `board` feature node and
`add-framework--backlog` 0 → LOW. Every depth-1 caller of a removed artefact is itself removed or
edited in this plan. `AGENTS.md` changes (F14).

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Each F-block writes or unskips its test before its change and records the
RED run in the ledger.

### L1 — Unit (RED → GREEN)

1. Slot fixture and injection suites at the F2 end-state map. *RED: 24 board slots exist.* (F2)
2. features/modify/gitignore/uninstaller suites per F3. *RED: `board` is a feature; the pair carries `board.json`.* (F3)
3. `migrations.test.js` per F4: registry ids, tolerated `0004`, 0006 behaviour with data untouched, one note, idempotent. *RED: 0006 absent, 0004 present.* (F4)
4. `status.test.cjs`: no `BOARD=` line. *RED: printed today.* (F5)
5. `feature-id.test.js`, `next-id.test.cjs`, `status.test.cjs`: folders only, `docs/backlog.jsonl` ignored, no `boardRoot`, `B` exits 2. *RED: module missing, `B` accepted.* (F6)
6. Doc-schema legacy `ticket:` stays valid; the agent-mode and workbench result schemas reject the board/ticket field. *RED for the rejections: the field is accepted today.* (F7, F8, F13)
7. Bare-id pattern test over the report sections. *RED if any bare form is present.* (F9)
8. `run-tests.js board` rejected. *RED: it is a selection today.* (F11)

### L2 — Integration

1. Injection end-state map of F2: zero `board.*` slots, zero `feature:board:` pairs, every other slot unchanged, `injection-points.json` count down by exactly 25. (F2)
2. `node scripts/build.js` exits 0 with no new warning after every F-block; `node scripts/build-workbench.js` exits 0 after F13. (F1–F15)
3. `NODE_OPTIONS= node scripts/graph.js dependencies` on `add--id-convention`, `add--resource-path-convention`, `add--ecosystem`, `add-new`, `add-setup` resolves every target; `orphans` lists no new orphan from a dangling reference. (F5, F6, F7)
4. `board-removed.test.js` runs five assertions, none skipped, all GREEN. (F1, closed by F8)

### L3 — Behavioural acceptance

1. Update of an install with `board: true`: flag gone, `board.json`/branch/clone untouched, note logged once, no board text in installed commands, no member warning. (F4)
2. Fresh install with every other feature enabled: no board text, no backlog script, no `board` option in `codeadd features list`. (F2, F3, F5)
3. `node scripts/run-tests.js all` passes in the container, and CI on the PR is green with no `board`/`board-e2e` job. (F11–F15)

**RED expectations against the current tree:** L1.1–L1.8, L2.1, L2.4 and L3.1 fail today.
**GREEN = all levels pass after F1–F15.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11 → F12 → F13 → F14 → F15

- **F1 first**, committed with five skipped assertions, so each owner F-block unskips one and turns it GREEN.
- **F2 before F3** so no fragment or marker names a feature the CLI no longer knows.
- **F3 before F4** because 0006 relies on `normalizeFeatureStates` dropping `board`.
- **F5 before F6** because `backlog-cli.cjs` is the only board-side requirer of `backlog-id.cjs`; it is gone before the rename.
- **F13 after F5**: the internal pipeline's ticket steps call the deleted scripts; this build runs from the already-built copy, so editing the source mid-build is safe.
- Every F-block leaves the tree green. Named checkpoints: after F4 (CLI side done), after F8 (product layer clean — `board-removed.test.js` fully GREEN), after F10, after F12, after F15.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched with the F-block id, the RED run and
the GREEN run, and any ruling that departs from the intent with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose test was never RED — a test written after the change proves nothing.
2. A skip left in `board-removed.test.js`, or a shipped file naming `backlog-commit`, `backlog-cli` or `board.json` that F1 (1) does not reach (a provider output dir it forgot).
3. Migration 0006, the uninstaller or the gitignore change deleting or hiding a consumer's `board.json`, `board` branch or clone.
4. A slot removed with its surrounding blank lines wrong, so the installed command gains or loses a line versus an install with the feature off.
5. A generic "board"/"backlog" UI or wiki word removed by an over-wide sweep in F7/F15.
6. A reader of existing ids that stopped accepting `B` (F6 only drops it from allocation).

---

## Next Steps

/add-framework--build docs/plans/2026-10-29T223023-PLAN--remove-board.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-29 | Initial creation |
| 2026-10-29 | Review fix-then-ok applied: reordered so every F-block stays green (fragments before the feature entry, scripts before the allocator, updater test folded into the migration block); F1 assertions committed skipped and unskipped by their owner; test paths corrected to `scripts/tests/`; `add--ecosystem` and three test files added to the rename; `ecosystem.md` added to the docs block; deterministic bare-id pattern; the note's carrier named (`notes` → the updater loop); ticket header explained. Discarded: splitting product-script suites under `scripts/tests/` into internal blocks — `add-framework-product-layer` treats them as the script's own pin |
| 2026-10-30 | Status draft -> implemented; built on feat/0075b-remove-board (F1-F15) |

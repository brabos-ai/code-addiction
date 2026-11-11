# Plan: qa-settings — one project settings file, `.codeadd/settings.json`, with `/add-qa-setup` moved onto it

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-25
> **Delivery:** confirm
> **Ticket:** 0066B

---

## Objective

[from conversation, no design document — intent file decision 1]

Code Addiction has no central project settings file. This adds `.codeadd/settings.json`, a project-owned,
versioned file with one section per command. It moves `/add-qa-setup` onto it, documents the model in a
new product skill `add--settings`, and fixes two `.codeadd/` bugs found on the way.

**When this build is done:** a user project keeps its QA setup in `.codeadd/settings.json` → `qa`
(values, receipt state and an append-only decision log), committed to git, with nothing under `docs/qa/`.
`/add-qa-setup` writes that section and checks it with a JSON gate. `qa-preflight.cjs` and `status.cjs`
read it and print the same signals as before. A project on v1.6.0 is converted by migration `0005` on its
next `codeadd update`, without going STALE. The managed `.gitignore` block stops ignoring
`.codeadd/settings.json` and `.codeadd/wiki/`, a fresh clone carrying them installs without `--force`,
and an uninstall with a corrupted manifest keeps `board.json`, `settings.json` and `wiki/`.

**Ticket done when:** .codeadd/settings.json exists as the single project settings file. /add-qa-setup writes settings.json.qa (values, receipt fields, append-only log) and nothing under docs/qa/, and validates it with a JSON gate. qa-preflight.cjs and status.cjs read baseUrl and setup-shape from it with unchanged outputs. All QA readers (fragments, agents, add--qa, add--qa-spec, add--setup-contract) point to it. Migration 0005 converts docs/qa/config.json and qa-setup.md (Decision Log into log), deletes them, stamps the new shape only when the old one matched sha256:25b937ee17628d6b, is idempotent, and is tested. The add--settings skill is registered and holds the schema, and receipt.md points to it. CODEADD_PAIR adds !.codeadd/settings.json and !.codeadd/wiki/, addDirHoldsInstall ignores them, and the corrupted-manifest uninstall keeps board.json, settings.json and wiki/. Build, inventory --check and test:all pass.

## Context

Each setup command invents its own files today. `/add-qa-setup` writes `docs/qa/config.json` plus a
markdown receipt `docs/qa/qa-setup.md`, and the coming `/add-setup` (ticket `add-setup`) needs a record
too. `.codeadd/manifest.json` cannot hold it: it is CLI-owned, per machine, gitignored, and
`codeadd update` rebuilds it from a fixed key list. This plan must land before `add-setup`, which builds
its record on the `setup` section.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive them —
it points at them.** References of the form "D<n>" mean decision n of that file.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-25T051500-qa-settings-intent.md` | Path `bounded`, `## Open` = None. D1–D19: the content rule (D2), ownership (D3), location (D4), the `qa` section shape (D5), schema home (D6), the command refactor (D7), the readers (D8), the scripts (D9), migration `0005` (D10), the CLI and bug fixes (D11, D14), the new skill (D12), MCP (D13), tests (D15), scope (D16), acceptance (D18), risks (D19) |

**Line numbers in the intent file are from `main` at `d354f5dc`.** The build anchors every edit by the
quoted text named in each F-block, never by those numbers.

## Global Constraints

- The last pre-refactor `add-qa-setup` shape is `sha256:25b937ee17628d6b` (`framwork/.codeadd/commands/add-qa-setup.md`, `## Materializes`, `shape:` line; intent D10)
- Top level of the file: `{ "schema": 1, "qa": {…}, "setup": {…} }` (intent D3)
- Location: always the project root's `.codeadd/settings.json`, also on a `--global` install (intent D4)
- Only commands write `.codeadd/settings.json`, each only its own top-level section, always read → merge → write and never dropping a key; scripts only read it; the CLI writes it only through migration `0005` (intent D3)
- `.codeadd/settings.json` is `owner: shared` with `hash: null` in `materialized` (intent D5)
- Artefacts always say `.codeadd/settings.json` in full, never "settings.json" alone — `.vscode/settings.json` is already called "settings.json" in `add--dev-environment-setup` and `add-help` (intent D12)
- `CODEADD_PAIR` = `['.codeadd/*', '!.codeadd/board.json', '!.codeadd/settings.json', '!.codeadd/wiki/']` (intent D11)
- Script outputs `QA_CONFIG`, `QA_RECEIPT`, `QA_CONTRACT_*` and `SETUP_QA*` keep their names and values; a malformed `.codeadd/settings.json` prints `broken`, never crashes (intent D9)
- Every bug fix is TDD red-green: the failing test is written and seen failing before the fix (user instruction for this plan)
- Examples in artefacts stay stack-agnostic (user instruction for this plan)
- No deploy, rollout, publish or release task in this plan (user instruction for this plan)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **No project settings file** — every setup command invents its own files, and `manifest.json` is the wrong home: CLI-owned, per machine, gitignored, rebuilt on update.
2. **The wiki is gitignored** — `.codeadd/*` ignores `.codeadd/wiki/`, while `/add-wiki` requires it committed and warns when `git check-ignore` matches (intent D14a).
3. **A corrupted-manifest uninstall deletes user data** — its directory walk removes `.codeadd/board.json` and the whole `.codeadd/wiki/` (intent D14b).
4. **A fresh clone with committed `.codeadd/` content is refused** — `addDirHoldsInstall` treats anything but `board.json` as an install, so a clone carrying `settings.json` or `wiki/` needs `--force` (intent D11).

## Proposal

Three stages, in this order. First the CLI learns that `.codeadd/` holds committed project files
(gitignore, installer, uninstaller) — this carries both bug fixes and is TDD red-green. Then the schema
gets its home (`add--settings`) and the two scripts switch to JSON. Then the command and every reader
move to the new keys, and migration `0005` converts existing projects. The internal pointers close it.

## Scope

### Includes

#### Stage 1 — `.codeadd/` holds committed project files (bug fixes, TDD red-green)

- **F1** [product] — `cli/src/gitignore.js`, `cli/tests/gitignore.test.js`: bug fix 14a. **RED first:**
  update the block assertions that quote `'!.codeadd/board.json'` as the last pair line to expect the
  four-line pair, and add one git-backed case — a temp repo with the managed block, where
  `git check-ignore` exits 1 for `.codeadd/settings.json` and `.codeadd/wiki/index.md` and 0 for
  `.codeadd/manifest.json`. Run them and see them fail. **Then** set `CODEADD_PAIR` (the line
  `const CODEADD_PAIR = ['.codeadd/*', '!.codeadd/board.json'];`) to the Global Constraints value, and
  rewrite the comment starting `// .codeadd/ holds the installed framework AND one committed file,
  board.json,` and the JSDoc line `Always includes the .codeadd pair` so they name all three committed
  entries and say why `!.codeadd/wiki/` works (`.codeadd/*` ignores only direct children). Must not lose:
  the legacy bare `.codeadd/` line drop, and block idempotence. Ref: intent D11, D14a.
- **F2** [product] — `cli/src/installer.js`, `cli/tests/installer.test.js`: **RED first:** a case where `.codeadd/` holds only
  `board.json`, `settings.json` and `wiki/` and the install proceeds without `--force`, plus a case where
  `manifest.json` is also present and it is still refused. **Then** change `addDirHoldsInstall` (the body
  `fs.readdirSync(dir).some((name) => name !== 'board.json')`) to skip a set `board.json`, `settings.json`,
  `wiki`, and update its JSDoc paragraph starting `Does .codeadd/ hold an installation?`. Ref: intent D11.
- **F3** [product] — `cli/src/uninstaller.js`, `cli/tests/uninstaller.test.js` (it already carries a
  corrupted-manifest case; add to it): bug fix 14b. **RED first:** a corrupted `manifest.json`
  with `.codeadd/board.json`, `.codeadd/settings.json` and `.codeadd/wiki/index.md` present; after
  uninstall all three still exist and the other ADD files are gone. See it fail. **Then** make the
  corrupted-manifest branch (after `log.warn('Manifest is corrupted. Falling back to directory-based
  removal.');`) drop those three paths — `wiki/` recursively — from what `walkDir` returned before
  anything is removed. Must not lose: the existing "a git clone under an ADD directory is never listed"
  skip, and the normal manifest path, which already keeps them. Ref: intent D11, D14b.

#### Stage 2 — the schema home and the two scripts

- **F4** [product] — new `framwork/.codeadd/skills/add--settings/SKILL.md`, registered in
  `framwork/provider-map.json` `skills`, and a new text test `cli/tests/add-settings-skill.test.js`.
  The skill carries what intent D12 lists: purpose and location (D4), ownership (D3), read → merge →
  write and the content rule with the md-reference rule (D2), the `qa` section schema and the generic
  receipt fields with field rules, vocabularies and hard bans moved from `receipt.md` in JSON form
  (D5, D6), how scripts read it, and the gitignore fact (D11). The `qa` example is the D5 block. The
  test asserts: the skill file exists, `provider-map.json` lists it, it states the content rule and the
  shared/`hash: null` rule, and it never says "settings.json" without the `.codeadd/` prefix.
  - **Produces:** skill id `add--settings`; the key names `qa.baseUrl`, `qa.viewports`, `qa.bootHint`, `qa.authSeed`, `qa["setup-shape"]`, `qa["framework-version"]`, `qa["first-run"]`, `qa["last-run"]`, `qa.materialized`, `qa.prereqs`, `qa["qa-pipeline-feature"]`, `qa.migration`, `qa.log`
- **F5** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/receipt.md` shrinks to the
  pointer of intent D6 ("setup receipts are sections of `.codeadd/settings.json`; schema in
  `add--settings`"), dropping the path convention line `` **Path convention:** `` and the
  `- path: docs/qa/config.json` example. `framwork/.codeadd/skills/add--doc-schemas/SKILL.md`: the
  category row `` | `receipt` | `references/receipt.md` | setup-receipt | `` stays (it and the `uses`
  line `- skill: add--doc-schemas/references/receipt.md` keep resolving) and its schema-name column says
  the schema is legacy and lives in `add--settings`. The type-table row `` | `setup-receipt` | `work-item` ``
  stays — the MCP still indexes legacy md receipts (D13). **RED first:** add to
  `cli/tests/add-settings-skill.test.js` the assertion that `receipt.md` points to `add--settings` and no
  longer names `docs/qa/`; see it fail, then edit.
  - **Consumes:** skill id `add--settings` (F4)
- **F6** [product] — `framwork/.codeadd/scripts/qa-preflight.cjs`, `scripts/tests/qa-preflight.test.cjs`,
  `scripts/tests/native-script-cases.json`. **RED first:** move the fixtures (the helper that writes
  `path.join(base, 'docs', 'qa', 'qa-setup.md')` and the config fixture) to `.codeadd/settings.json`
  with a `qa` section, keep the asserted outputs, and add a malformed-JSON case expecting
  `QA_CONFIG=broken` and `QA_RECEIPT=broken`. **Then** the config probe (comment
  `// config.json — parse + require baseUrl`) reads `qa.baseUrl`; the receipt probe (the line
  `const receipt = path.resolve(process.cwd(), 'docs', 'qa', 'qa-setup.md');`) reads `qa["setup-shape"]`
  and `qa["framework-version"]`; `readSetupShape` and `readReceiptVersion` become one JSON read. A
  `.codeadd/settings.json` with no `qa` section reads as missing config and missing receipt, exactly as
  the absent files did. Header comment updated. `readCurrentShape` is untouched. Ref: intent D9.
  - **Consumes:** the key names `qa.baseUrl`, `qa["setup-shape"]`, `qa["framework-version"]` (F4)
- **F7** [product] — `framwork/.codeadd/scripts/status.cjs`, `scripts/tests/status.test.cjs`.
  **RED first:** move the receipt fixtures (`writeIn(r, path.join('docs', 'qa', 'qa-setup.md'), body)`
  and `'---\nsetup-shape: v1\n---\n'`) to `.codeadd/settings.json`, same asserted `SETUP_QA*` lines,
  plus a malformed-JSON case. **Then** the old "receipt file exists" test becomes "the `qa` section
  holds a receipt field (`setup-shape`, `first-run` or `last-run`)" — that branch keeps printing
  `SETUP_QA:present` and its STALE lines; `recordedSetupShape` reads `qa["setup-shape"]`;
  `setupMaterialized` (line `if (isFile(path.join(cwd, 'docs', 'qa', 'config.json'))) return true;`)
  returns true when a `qa` section exists with value fields only, or the file fails to parse —
  unreadable state means STALE, per `add--setup-contract`'s refusal rule; the receipt path line
  `const receipt = path.join(cwd, 'docs', 'qa', 'qa-setup.md');` points at the settings file; the header
  paragraph `FRONTMATTER IS BOUNDED.` is rewritten for JSON. `shippedSetupShape` is untouched.
  **Malformed `.codeadd/settings.json` → exactly** `SETUP_QA:stale`, `SETUP_QA_STALE:yes` and
  `SETUP_QA_HINT:QA state exists without a current receipt — /add-qa-setup` (the existing lines), with no
  stack trace. Ref: D9.
  - **Consumes:** the key name `qa["setup-shape"]` (F4)

#### Stage 3 — the command, the readers, the migration

- **F8** [product] — `framwork/.codeadd/commands/add-qa-setup.md`, `cli/tests/build-contracts.test.js`,
  `cli/tests/qa-pipeline-umbrella.test.js`. The refactor of intent D7, edit by edit:
  - `## Materializes`: `- path: docs/qa/config.json` / `owner: setup` → `.codeadd/settings.json#qa`,
    `owner: shared`; `changed-in: 1.5.2` → `changed-in: 1.7.0`; the `### docs/qa/config.json` example
    becomes the `qa` value fields. After editing the block, run `node scripts/build.js`: it fails and
    prints the computed shape (`Set shape: <computed> and changed-in: …`). Paste that value into the
    `shape:` line and rerun until it exits 0.
  - The intro line `scaffolds the **project-specific QA config** (\`docs/qa/config.json\`)` → the `qa`
    section of `.codeadd/settings.json`.
  - The step list lines `STEP add-qa-setup.config: Scaffold QA config       → docs/qa/config.json` and
    `STEP add-qa-setup.receipt: Write the receipt       → docs/qa/qa-setup.md`.
  - `Required Skills` and the `<!-- uses: -->` block add `add--settings`; the skill is loaded before
    STEP add-qa-setup.config.
  - The prohibitions row `Write only under \`docs/qa/\`` → adds `.codeadd/settings.json` (`qa` section
    only), drops `docs/qa/`.
  - The `qa-project` skeleton lines `(from \`docs/qa/config.json\`)`, `<boot command / config.json
    bootHint>` and `from config.json.authSeed` → `qa.baseUrl` / `qa.bootHint` / `qa.authSeed` in
    `.codeadd/settings.json`.
  - The STALE line `Re-materialize under the merge rules (per-key \`config.json\`` → per-key `qa`
    value fields.
  - STEP add-qa-setup.classify-receipt: `run the {{skill:add--setup-contract/SKILL.md}} procedure against
    \`docs/qa/qa-setup.md\`` → against the `qa` section; the retired-proxy line `the old
    \`docs/qa/config.json\`-presence proxy` keeps its meaning without the path.
  - The migration-gate line `Do NOT gate this step on whether \`docs/qa/config.json\` exists` → the
    `qa` section.
  - STEP add-qa-setup.config: the line `Target: \`docs/qa/config.json\` (git-tracked, project-wide).`
    names the `qa` section of `.codeadd/settings.json` as the target and says a file with no `qa`
    section counts as absent, so the agent-mode `config-values` fallback's opening "If it exists" and
    "If absent" both refer to the section; `Write the shape declared in \`## Materializes\` →
    \`docs/qa/config.json\`` follows. The slot markers between them stay byte-identical, and so do
    `fallbacks/agent-mode.add-qa-setup.config-values.md` and the agent-mode fragment.
  - STEP add-qa-setup.receipt: `Target: \`docs/qa/qa-setup.md\`. Schema: \`setup-receipt\` in
    {{skill:add--doc-schemas/SKILL.md}}` → receipt fields of the `qa` section, schema in `add--settings`,
    with the append to `qa.log`.
  - STEP add-qa-setup.validate: the markdown gate becomes the JSON check of intent D7 (parses, required
    keys, declared vocabularies, no hash on shared entries, `log` append-only against the previous file).
  - The closing table row `` | `docs/qa/qa-setup.md` | The receipt whose shape hash `` → the `qa` section.
  - The two tests switch to the new contract path and owner.
  - **Produces:** the `add-qa-setup` entry in `contracts.json` with path `.codeadd/settings.json#qa`, owner `shared`, and a new `shape`
  - **Consumes:** skill id `add--settings` (F4)
- **F9** [product] — the readers, path-only edits, no behaviour change (intent D8):
  - `fragments/qa-pipeline/add-review.md`: row 1 (`` `docs/qa/config.json` present + parseable + has
    `baseUrl` ``) and row 8 (``Receipt `docs/qa/qa-setup.md` present with readable `setup-shape` ``,
    becoming "receipt = `qa.setup-shape` in `.codeadd/settings.json`").
  - `fragments/qa-pipeline/add-plan.md`: `and docs/qa/config.json (viewport defaults)`.
  - `fragments/qa-pipeline/add-build.md`: ``Name the `docs/qa/config.json` field to fix — `authSeed` /
    `bootHint` `` and `the just-built component file paths; docs/qa/config.json; and \`CAPTURE_DIR\``.
  - `agents/e2e-agent.md`: `` `docs/qa/config.json` — viewports, `baseUrl`, `authSeed`, `bootHint`. ``;
    `agents/qa-agent.md`: ``Viewport list, `baseUrl`, and the `authSeed` hint from `config.json`.``
  - `skills/add--qa/SKILL.md`: the format block under `` `docs/qa/config.json` (project-wide; scaffolded
    by `/add-qa-setup`): ``, `viewports: <from docs/qa/config.json>`, the When-NOT line `scaffolding
    \`config.json\`/\`screens.json\``, `Viewports (v1, configurable in \`config.json\`)`, and the
    frontmatter `description:` phrase `the config.json/screens.json formats`.
  - `skills/add--qa-spec/SKILL.md`: `` `docs/qa/config.json` — default viewport set `` and `default from
    \`docs/qa/config.json\``.
  - `skills/add--setup-contract/SKILL.md`: Inputs rows `RECEIPT_PATH` → `.codeadd/settings.json` section
    `qa`, `RECORDED` → `qa["setup-shape"]`; the merge rule `` `docs/qa/config.json`: per-key merge `` →
    the `qa` value fields; the Rules lines `Keep every existing \`config.json\` key on a STALE merge` and
    `Overwrite a user-authored \`config.json\` key`; §4 `Rewrite the receipt — always` → the `qa`
    receipt fields and `qa.log`.
  - The playwright fragments and `ux-agent` mention `baseUrl` with no path and are not edited.
  - **Consumes:** the key names `qa.baseUrl`, `qa.viewports`, `qa.bootHint`, `qa.authSeed`, `qa["setup-shape"]`, `qa.log` (F4)
- **F10** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: a Skills row for
  `add--settings` (Used By `add-qa-setup`); the `add--doc-schemas` row's `(incl. the \`setup-receipt\`
  schema)` and the `add--qa` row's `config.json/screens.json` follow F5 and F9. `mcp/reference.md`: one
  note under the row `` | `setup-receipt` | `work-item` `` — current receipts live in
  `.codeadd/settings.json` and are not documents. `mcp/types.mjs` and
  `cli/tests/mcp-document-model.test.js` are not edited (D13) — that test's `docs/qa/qa-setup.md`
  fixture is a legacy md receipt on purpose, and L2.4 allows it.
  - **Consumes:** skill id `add--settings` (F4)
- **F11** [product] — `cli/src/migrations.js`, `cli/tests/migrations.test.js`: migration
  `0005-qa-settings`, appended to `MIGRATIONS` after `0004-sync-board-definitions`, exactly as intent D10
  specifies (the moves, what stays, the shape rule, idempotence, no commit, `changes`/`notes`). It reuses
  the file's `parseYaml` import and `readFrontmatter`. **The new shipped shape** is read from the target
  project's `.codeadd/contracts.json`, which `copyRelease` has just written. If that file is missing or
  unreadable, the migration copies the recorded shape unchanged and adds a note — the project goes STALE,
  which is the safe direction. **Tests first, all six D15 cases**, each seen failing before the
  function exists: full convert; no QA setup → note; second run → no change; shape stamped only on
  `sha256:25b937ee17628d6b`, copied otherwise; existing `qa` section → merge, nothing deleted; malformed
  old file → throws, nothing deleted. Plus: the registry test that `0005-qa-settings` sorts after `0004`
  and `allMigrationIds` includes it.
  - **Consumes:** the `add-qa-setup` entry in `contracts.json` with path `.codeadd/settings.json#qa`, owner `shared`, and a new `shape` (F8); the key names of F4

#### Stage 4 — internal pointers

- **F12** [internal] — `AGENTS.md`: the Setup Contracts row `` | Receipt in user project | `docs/qa/qa-setup.md` | ``
  → `.codeadd/settings.json` → `qa`, and the `Receipt schema` row → `add--settings`.
  `workbench/skills/add-framework-product-layer/SKILL.md`: one line — a command that persists project
  config uses `add--settings` and its section of `.codeadd/settings.json`, never a new file.
  - **Consumes:** skill id `add--settings` (F4)

### Does NOT Include (important!)

- Moving feature or plugin toggles out of `manifest.json` (D16)
- A `.codeadd/settings/` md folder or its gitignore exception — nothing needs it yet (D2, D16)
- The `setup` section — ticket `add-setup` (D16)
- Any change to `screens.json`, the QA-evidence `.gitignore` block or where `qa-project` lives (D16)
- A settings CLI subcommand (D16)
- Changes to update, modify or install beyond `addDirHoldsInstall` — `copyRelease` and `pruneObsolete` already leave the file alone (D11)
- The web docs and README — `/add-framework--sync` regenerates them
- Any deploy, rollout, publish or release step. `changed-in: 1.7.0` is a field value, not a release

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Every design decision | Carried as settled | Intent D1–D19, `## Open` = None |
| `changed-in` value | `1.7.0` | D7 says "the release that ships this"; D5's example already carries `framework-version: 1.7.0`, and a new project file is a minor change |
| Shipped shape not readable during migration | Copy the recorded shape, add a note | STALE is the safe direction — `/add-qa-setup` re-materializes; a wrong CURRENT would hide drift |
| `status.cjs` with an unparseable `.codeadd/settings.json` | Counts as materialized: prints the existing `SETUP_QA:stale` lines. `broken` is `qa-preflight.cjs` only (D9) | `add--setup-contract` already treats unreadable receipt state as STALE |
| `.codeadd/settings.json` without a `qa` section | Same outputs as the absent old files | Keeps D9's "outputs unchanged" true for a project that only has a future `setup` section |
| The agent-mode `config-values` slot | Slot, fallback and fragment byte-identical; only the surrounding Target line changes | The fallback's "If it exists" reads against the Target line, which still names the target |
| Bug-fix order | Stage 1 first, each RED before GREEN | User instruction; the three CLI changes are independent of the QA move |
| One plan, not a set | One plan, four stages, one branch | `add-plan-authoring` → The Ticket: one `work_id` per ticket |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/src/gitignore.js` | product | modify | F1 |
| `cli/tests/gitignore.test.js` | product | modify | F1 |
| `cli/src/installer.js` | product | modify | F2 |
| `cli/tests/installer.test.js` | product | modify | F2 |
| `cli/src/uninstaller.js` | product | modify | F3 |
| `cli/tests/uninstaller.test.js` | product | modify | F3 |
| `framwork/.codeadd/skills/add--settings/SKILL.md` | product | create | F4 |
| `framwork/provider-map.json` | product | modify | F4 |
| `cli/tests/add-settings-skill.test.js` | product | create | F4, F5 |
| `cli/tests/mcp-document-model.test.js` | product | unchanged | D13 — keeps its legacy receipt fixture |
| `framwork/.codeadd/skills/add--doc-schemas/references/receipt.md` | product | modify | F5 |
| `framwork/.codeadd/skills/add--doc-schemas/SKILL.md` | product | modify | F5 |
| `framwork/.codeadd/scripts/qa-preflight.cjs` | product | modify | F6 |
| `scripts/tests/qa-preflight.test.cjs` | product | modify | F6 |
| `scripts/tests/native-script-cases.json` | product | modify | F6 |
| `framwork/.codeadd/scripts/status.cjs` | product | modify | F7 |
| `scripts/tests/status.test.cjs` | product | modify | F7 |
| `framwork/.codeadd/commands/add-qa-setup.md` | product | modify | F8 |
| `cli/tests/build-contracts.test.js` | product | modify | F8 |
| `cli/tests/qa-pipeline-umbrella.test.js` | product | modify | F8 |
| `framwork/.codeadd/fragments/qa-pipeline/add-review.md` | product | modify | F9 |
| `framwork/.codeadd/fragments/qa-pipeline/add-plan.md` | product | modify | F9 |
| `framwork/.codeadd/fragments/qa-pipeline/add-build.md` | product | modify | F9 |
| `framwork/.codeadd/agents/e2e-agent.md` | product | modify | F9 |
| `framwork/.codeadd/agents/qa-agent.md` | product | modify | F9 |
| `framwork/.codeadd/skills/add--qa/SKILL.md` | product | modify | F9 |
| `framwork/.codeadd/skills/add--qa-spec/SKILL.md` | product | modify | F9 |
| `framwork/.codeadd/skills/add--setup-contract/SKILL.md` | product | modify | F9 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F10 |
| `mcp/reference.md` | product | modify | F10 |
| `cli/src/migrations.js` | product | modify | F11 |
| `cli/tests/migrations.test.js` | product | modify | F11 |
| `AGENTS.md` | internal | modify | F12 |
| `workbench/skills/add-framework-product-layer/SKILL.md` | internal | modify | F12 |
| `AGENTS.md` inventory block | internal | regenerate | `node scripts/inventory.js` adds `add--settings` (F4) |

Risk from `impact --depth 1` (graph emitted 2026-10-12, before the last commits on `main`; the hubs
below did not change since): `add-qa-setup` HIGH (7), `add--doc-schemas` HIGH (22, but only
`receipt.md` changes), `add--setup-contract` MEDIUM (1), `add--qa` HIGH (4), `add--qa-spec` MEDIUM (1),
`add--ecosystem` HIGH (6, text rows only), `qa-preflight.cjs` MEDIUM (2), `status.cjs` HIGH (21, outputs
unchanged), `e2e-agent` HIGH (6), `qa-agent` HIGH (9), each `qa-pipeline` fragment MEDIUM (1),
`add-framework-product-layer` MEDIUM (1), `add--settings` LOW (new). `cli/src/*`, `mcp/reference.md`,
tests and `AGENTS.md` are not graph nodes: NOT VERIFIED by the graph, covered by grep and the suites.
Delivery index: no delivery recorded for `add-qa-setup`, `add--doc-schemas`, `add--setup-contract` or
`qa-preflight.cjs`; nothing in this area was shipped and dropped.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify each fails against the
current tree. Then drive it GREEN. Tests run through `node scripts/run-tests.js` (AGENTS.md,
`scripts/run-tests.js` row).

### L1 — Unit (RED → GREEN)

1. `gitignore.test.js`: the managed block carries the four `CODEADD_PAIR` lines in order. *RED today: two lines.* (F1)
2. `gitignore.test.js`, git-backed: `git check-ignore` exits 1 for `.codeadd/settings.json` and `.codeadd/wiki/index.md`, 0 for `.codeadd/manifest.json`. *RED today: both are ignored.* (F1)
3. Installer: `.codeadd/` with only `board.json`, `settings.json`, `wiki/` → no install detected; with `manifest.json` added → install detected. *RED today: the first is detected.* (F2)
4. Uninstaller, corrupted manifest: `board.json`, `settings.json`, `wiki/index.md` survive; other ADD files are removed. *RED today: all deleted.* (F3)
5. `add-settings-skill.test.js`: skill exists, registered, content rule present, shared/`hash: null` rule present, no bare "settings.json". *RED today: no skill.* (F4). Added in F5: `receipt.md` points to `add--settings`. *RED until F5 lands.* (F5)
6. `qa-preflight.test.cjs`: same `QA_CONFIG`/`QA_RECEIPT`/`QA_CONTRACT_*` values from `.codeadd/settings.json` fixtures; malformed JSON → `QA_CONFIG=broken` and `QA_RECEIPT=broken`, exit without a stack trace. *RED today: script reads `docs/qa/`.* (F6)
7. `status.test.cjs`: same `SETUP_QA*` lines from `.codeadd/settings.json` fixtures; malformed JSON → `SETUP_QA:stale`, `SETUP_QA_STALE:yes` and the "exists without a current receipt" hint. *RED today: script reads frontmatter.* (F7)
8. `build-contracts.test.js`, `qa-pipeline-umbrella.test.js`: `add-qa-setup` contract path `.codeadd/settings.json#qa`, owner `shared`, `changed_in` `1.7.0`, shape differs from `sha256:25b937ee17628d6b`. *RED today: old path.* (F8)
9. `migrations.test.js`: the six D15 cases plus registry order and the unreadable-`contracts.json` note. *RED today: no `0005`.* (F11)

### L2 — Integration

1. `node scripts/build.js` exits 0 with no new warning; `contracts.json` and `injection-points.json` are regenerated; the `agent-mode.config-values` anchor now quotes the new Target line, and the fallback text is unchanged. (F8)
2. The cli suite's injection tests pass with agent-mode on and off: the `config-values` section lands right after the new Target line in both cases, and that Target line names the `qa` section and says a file with no `qa` section counts as absent. (F8)
3. `node scripts/inventory.js --check` passes after `node scripts/inventory.js` lists `add--settings`. (F4)
4. Grep-zero: no `docs/qa/config.json` and no `docs/qa/qa-setup.md` in `framwork/.codeadd/` sources or the regenerated sidecars, `AGENTS.md` or `mcp/`. The only allowed hits are `cli/src/migrations.js` and `cli/tests/`. A second grep finds no bare `config.json` left in the QA artefacts of `framwork/.codeadd/` (`add-qa-setup`, the `qa-pipeline` fragments, `e2e-agent`, `qa-agent`, `add--qa`, `add--qa-spec`, `add--setup-contract`, `add--ecosystem`). (F5–F12)
5. Grep: every new mention in `framwork/.codeadd/` says `.codeadd/settings.json`, never a bare `settings.json` that could be read as `.vscode/settings.json`. (F4–F10)
6. `npm run test:all` passes. (all)

### L3 — Behavioural acceptance (intent D18)

1. (b) `/add-qa-setup`'s write list names only `.codeadd/settings.json` → `qa`, `qa-project`, `screens.json` and the `.gitignore` block; its validate step is the JSON check. Checked by reading the built command. (F8)
2. (c) In a temp project with a current `qa` section, `qa-preflight.cjs a` prints `QA_CONFIG=ok`, `QA_RECEIPT=ok`, `QA_CONTRACT_MATCH=ok`, and `status.cjs` prints `SETUP_QA:present`. (F6, F7)
3. (d) A temp v1.6.0-shaped project (old files, receipt shape `sha256:25b937ee17628d6b`, a two-row Decision Log) run through `runMigrations` with the built `contracts.json`: old files deleted, both rows in `qa.log` plus the migration entry, then `status.cjs` prints no `SETUP_QA_STALE` and `qa-preflight.cjs` prints `QA_CONTRACT_MATCH=ok`. (F11 with F6, F7, F8)
4. (e) The same with another recorded shape stays STALE. (F11)
5. (f) A second run changes nothing. (F11)
6. (g)–(i) are L1.2, L1.3 and L1.4. (j) is L1.5 plus the `uses:` block of `add-qa-setup`. (F1–F5, F8)

**RED expectations against the current tree:** every L1 item fails today; L2.4 finds the paths listed under F5–F12; L3 fails at the first assertion.
**GREEN = all levels pass after F1–F12.**

---

## Execution Order

1. **F1 → F2 → F3** [product] — the bug fixes first. Each is independent, each RED before GREEN. The repo works after each.
2. **F4 → F5** [product] — the schema home before anything points at it.
3. **F6 → F7** [product] — the scripts read JSON. After F7 the scripts and the command disagree until F8; do not stop between F7 and F8.
4. **F8** [product] — the command and its contract; run `node scripts/build.js` here (L2.1, L2.2).
5. **F9 → F10** [product] — the readers follow the command.
6. **F11** [product] — the migration, which needs the new shape from F8.
7. **F12** [internal] — the internal pointers, then `node scripts/inventory.js`.

Working boundaries: after F3, after F5, after F10 and after F12. Between F6 and F8 the product is half-moved.

Beyond the layer default, run L2.4 and L2.5 after F10 and again after F12.

## Reviewer Handoff

For each F-block the build leaves, in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the intent decision it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing. F1–F3 above all, because they are the bug fixes.
2. A bare "settings.json" in a product artefact (Global Constraints) — it collides with `.vscode/settings.json`.
3. The agent-mode `config-values` render reading wrong after the Target line changed — the fallback's "If it exists" must still have a clear subject.
4. The migration stamping the new shape on a project whose recorded shape was NOT `sha256:25b937ee17628d6b`.
5. A `docs/qa/` path left in an artefact the intent did not list by line (add-qa-setup's step list, retired-proxy and closing-table lines; `add--qa` description; `add--setup-contract` Rules and §4; `status.cjs` header).

---

## Next Steps

/add-framework--build docs/plans/2026-10-25T053315-PLAN--qa-settings.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-25 | Initial creation |
| 2026-10-25 | Review fixes (fix-then-ok): F8 says how the `shape:` line is set from the build's output; F8 adds the intro, STALE-line and boot-line anchors; F9 quotes both `add-build.md` anchors; F2/F3 name `installer.test.js` and `uninstaller.test.js`; the `receipt.md` assertion moves from F4 to F5; F7 and L1.7 name the exact malformed-JSON lines for `status.cjs`; the Target line covers a file with no `qa` section; L2.4 also greps bare `config.json`; `mcp-document-model.test.js` listed as unchanged; the `changed-in` row cites D5/D7 |
| 2026-10-25 | Implemented on feat/0066b-qa-settings (d354f5d..HEAD) |

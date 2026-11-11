---
path: bounded
topic: qa-settings
doc: none
delivery: confirm
ticket: 0066B
---

## Decided

1. Problem: Code Addiction has no central project settings file. `.codeadd/manifest.json` is CLI-owned, per machine and gitignored, and `codeadd update` rebuilds it from a fixed key list (`cli/src/updater.js:137-144`). Each setup command invents its own files: `/add-qa-setup` writes `docs/qa/config.json` and the markdown receipt `docs/qa/qa-setup.md`, and `/add-setup` (card `add-setup`) needs a record too. This card adds `.codeadd/settings.json`, a project-owned, versioned file with one section per command. It migrates `/add-qa-setup` onto it, documents the model in a new product skill `add--settings`, and fixes two `.codeadd/` bugs found on the way. Verified on main `d354f5dc` (v1.6.0). Paths are under `framwork/.codeadd/` unless stated otherwise.
2. Content rule: values, short descriptions and decisions go in `settings.json`. Only prompt-like or long guidance text goes in a `.md` file, referenced from the json by a relative path (e.g. `"notes": "settings/<name>.md"`). No prompts in JSON. Today nothing qualifies: `bootHint` and `authSeed` are one-line hints (`commands/add-qa-setup.md:119-127`), so they stay strings. No `.codeadd/settings/` folder and no gitignore exception for it are created now. The md-reference rule lives in the `add--settings` skill for later use.
3. Ownership:
   - Only commands write `settings.json`, each only its own top-level section (`qa` written by `/add-qa-setup`, `setup` written by `/add-setup`), always read → merge → write and never dropping a key.
   - Scripts only read it (`qa-preflight.cjs`, `status.cjs`).
   - The CLI writes it only through migration `0005` (decision 10). It never rewrites it on install, update or modify.
   - Top level: `{ "schema": 1, "qa": {…}, "setup": {…} }`.
   - Feature and plugin toggles stay in `manifest.json` (out of scope).
4. Location: always the project root's `.codeadd/settings.json`, also on a `--global` install, because settings are per project.
5. Receipts move INTO settings.json. A command's section holds its setup values, its receipt state and its decision log. JSON keys keep the `setup-receipt` field names, so the schema and the migration map one-to-one. The `qa` section:
   ```json
   "qa": {
     "baseUrl": "http://localhost:5173",
     "viewports": { "desktop": [1440, 900], "tablet": [768, 1024], "mobile": [375, 812] },
     "bootHint": "npm run dev",
     "authSeed": "log in as seed@example.com / seed",
     "setup-shape": "sha256:…",
     "framework-version": "1.7.0",
     "first-run": "2026-07-27",
     "last-run": "2026-10-25",
     "materialized": [ { "path": ".codeadd/settings.json", "owner": "shared", "hash": null },
                       { "path": ".claude/skills/qa-project/SKILL.md", "owner": "setup", "hash": "sha256:…" } ],
     "prereqs": { "playwright-test": "installed", "chromium": "already-present", "playwright-mcp": "declined" },
     "qa-pipeline-feature": "enabled",
     "migration": { "detected": ["cypress"], "decision": "declined", "decided-at": "2026-07-27" },
     "log": [ { "date": "2026-07-27", "item": "playwright-mcp", "decision": "declined", "reason": "QA runs in CI only", "shape": "sha256:…" } ]
   }
   ```

   - `log` is append-only: one entry per behaviour-changing decision, and a reversed decision is a new entry. These are the existing Decision Log rules (`skills/add--doc-schemas/references/receipt.md` "Decision Log rules"), moved, not changed.
   - The md-only parts disappear: `id`, `type`, `created`, `updated`, `related`, `## TL;DR`. `first-run` and `last-run` keep the dates.
   - `settings.json` is `owner: shared` with `hash: null` in `materialized`. More than one command writes it, and the schema bans a hash on shared entries.
6. Schema home: the `setup-receipt` schema moves from `skills/add--doc-schemas/references/receipt.md` into the new skill `skills/add--settings/SKILL.md` (decision 12), in JSON form, with the same field rules, vocabularies and hard bans. `receipt.md` shrinks to a pointer: "setup receipts are sections of `.codeadd/settings.json`; schema in `add--settings`". It stays so the category row `add--doc-schemas/SKILL.md:296` and its `uses` line `:33` keep resolving, and that row's description is updated.
7. `/add-qa-setup` refactor (`commands/add-qa-setup.md`):
   - `## Materializes` (`:100-118`): the path `docs/qa/config.json` (owner setup) becomes `.codeadd/settings.json#qa` (owner shared). The `### docs/qa/config.json` example (`:119-127`) becomes the `qa` value fields. The shape changes, and `changed-in` moves to the release that ships this.
   - STEP add-qa-setup.config (`:323-336`): writes `settings.json.qa` value fields with the same per-key merge rule (`skills/add--setup-contract/SKILL.md:68`, reworded for the section).
   - STEP add-qa-setup.receipt (`:413-425`): writes the receipt fields and appends to `qa.log`.
   - STEP add-qa-setup.validate (`:427-458`): the markdown gate is replaced by a JSON check against the `add--settings` schema: the file parses, the required keys are present, values come from the declared vocabularies, there is no hash on shared entries, and `log` is append-only compared with the previous file. Its `Required Skills` line (`:45`) and step list (`:65`) say `add--settings`.
   - Prohibitions row (`:83`): the write allow-list adds `.codeadd/settings.json` (`qa` section only) and drops `docs/qa/`.
   - The `qa-project` skeleton lines (`:178,182,186`) say `settings.json` → `qa.baseUrl` / `qa.bootHint` / `qa.authSeed`.
8. The other readers switch to the new keys (path-only edits, no behavior change):
   - `fragments/qa-pipeline/add-review.md:105` (row 1) and `:112` (row 8: "receipt = `qa.setup-shape` in `.codeadd/settings.json`").
   - `fragments/qa-pipeline/add-plan.md:28` (viewports).
   - `fragments/qa-pipeline/add-build.md` (2 refs).
   - `agents/e2e-agent.md:21`, `agents/qa-agent.md:27`.
   - `skills/add--qa/SKILL.md:115-121,146`, `skills/add--qa-spec/SKILL.md:34,44`.
   - `skills/add--setup-contract/SKILL.md` Inputs (`RECEIPT_PATH` → `.codeadd/settings.json` section `qa`; `RECORDED` → `qa["setup-shape"]`) and its merge rule `:68`.
   - `skills/add--ecosystem/SKILL.md:155` and the `AGENTS.md:250` receipt row.
   - The playwright fragments and `ux-agent` mention `baseUrl` with no path and do not change.
9. Scripts read JSON instead of grepping frontmatter or `config.json`:
   - `scripts/qa-preflight.cjs`:
     - config probe `:271-300` → `settings.json` → `qa.baseUrl`;
     - receipt probe `:343-369` → `qa["setup-shape"]`, `qa["framework-version"]`;
     - `readSetupShape` and `readReceiptVersion` (`:200-236`) are replaced by one JSON read;
     - outputs `QA_CONFIG`, `QA_RECEIPT`, `QA_CONTRACT_*` and their values are unchanged.
   - `scripts/status.cjs`:
     - `recordedSetupShape` (`:383-392`) reads `qa["setup-shape"]`;
     - `setupMaterialized` (`:407-413`) checks for a `qa` section instead of `docs/qa/config.json`;
     - the `SETUP_QA*` lines (`:843-868`) are unchanged.
   - `contracts.json` reading (`readCurrentShape`, `shippedSetupShape`) does not change.
   - A malformed `settings.json` reports `QA_CONFIG=broken` / `QA_RECEIPT=broken`, never crashes.
10. Migration `0005-qa-settings` in `cli/src/migrations.js`. It runs from `codeadd update` after `copyRelease` and before `writeManifest` (`cli/src/updater.js:111-135`), and from `codeadd migrate`. A failure is reported, not recorded, and the next update retries it. A fresh install pre-stamps every id (`allMigrationIds`, `migrations.js:567`), so it never runs there. It reuses the file's `yaml` parser and `readFrontmatter` (`migrations.js:7,220`).
    - Moves:
      - `docs/qa/config.json` → the value fields of `settings.json.qa`. Unknown keys are kept as-is inside `qa` (the never-drop-a-user-key rule).
      - `docs/qa/qa-setup.md` frontmatter → the receipt fields (`id`, `type`, `created`, `updated`, `related` are dropped).
      - Its `## Decision Log` table rows (`Date | Shape | Decision | Rationale`) → `qa.log` entries `{date, item: "qa-setup", decision, reason, shape}`, in order.
      - The `materialized` entry for `docs/qa/config.json` → `{path: ".codeadd/settings.json", owner: "shared", hash: null}`.
      - In each installed provider's `qa-project/SKILL.md`, the string `docs/qa/config.json` → `.codeadd/settings.json` (\`qa\`), and that entry's recorded hash is recomputed, so the drift check stays quiet.
      - Then `docs/qa/config.json` and `docs/qa/qa-setup.md` are deleted, and `docs/qa/` too when it is empty.
    - Stays: per-feature `_tests/screens.json`, the `.gitignore` QA-evidence block, `qa-project` in the provider skills folder, and `prereqs`, `migration` and `qa-pipeline-feature` (moved as-is).
    - No STALE re-materialize: the migration holds the last pre-refactor shape constant `sha256:25b937ee17628d6b` (`commands/add-qa-setup.md:101`).
      - If the receipt recorded exactly that shape, it stamps `qa["setup-shape"]` with the new shipped shape, read from the freshly copied `.codeadd/contracts.json`. The project was current, and the migration did the re-materialize.
      - Otherwise it copies the recorded shape unchanged, so a project that was already stale stays STALE and `/add-qa-setup` still flags it.
      - Either way it appends one `log` entry `{item: "qa-setup", decision: "migrated to settings.json", reason: "migration 0005"}`.
    - Idempotent:
      - No `docs/qa/config.json` and no `docs/qa/qa-setup.md` → applied with the note "no QA setup to migrate".
      - `settings.json.qa` already present → merge without overwriting existing keys, keep the old files, and add a note.
      - A malformed old file → throw (reported, retried on the next update), nothing deleted.
    - It changes files only and never commits, the same as migration `0002` (`migrations.js:548`). It reports each change in `changes`.
11. CLI changes for `.codeadd/settings.json` plus the two bug fixes (decision 14):
    - `cli/src/gitignore.js:13` `CODEADD_PAIR` → `['.codeadd/*', '!.codeadd/board.json', '!.codeadd/settings.json', '!.codeadd/wiki/']`, and the comment `:8-11` is updated. Un-ignoring the `wiki/` directory works because `.codeadd/*` ignores only the direct children. Existing projects get the lines on their next `codeadd update` when `manifest.gitignore` is true (`updater.js:166-169`).
    - `cli/src/installer.js:172-180` `addDirHoldsInstall`: the entries that do NOT mean an install become a set: `board.json`, `settings.json`, `wiki`. Otherwise a fresh clone that carries the committed settings or wiki is refused without `--force` (`:226`, `:311`).
    - `cli/src/uninstaller.js`: the corrupted-manifest fallback walks every file under the ADD dirs (`:7,33-48,96-100`). It must skip `.codeadd/board.json`, `.codeadd/settings.json` and `.codeadd/wiki/**`. The normal path already keeps them, because it deletes only manifest `files` (`:165-183`).
    - Update, modify and install need no change. `copyRelease` writes only release entries, and the release root `framwork/.codeadd/` has no `settings.json` and no `wiki/`. `pruneObsolete` deletes only paths in the prior manifest's `files` (`cli/src/release-copy.js:101-116`).
12. New product skill `skills/add--settings/SKILL.md`, registered in `framwork/provider-map.json` `skills`. It holds:
    - the file's purpose and location (decision 4) and its ownership (decision 3);
    - the read → merge → write rules and the content rule (decision 2, the md-reference rule included);
    - the `qa` section schema and the generic receipt fields (decisions 5–6), with field rules, vocabularies and hard bans;
    - how scripts read it;
    - the gitignore fact (decision 11).

    
    It always says `.codeadd/settings.json` in full, never "settings.json" alone: `add--dev-environment-setup:16,38,178` and `add-help:177` already use "settings.json" for `.vscode/settings.json`. `/add-qa-setup` loads it before STEP add-qa-setup.config. `add--ecosystem` gets a Skills row and Used By entries, and the workbench `skills/add-framework-product-layer/SKILL.md` gets one line: a command that persists project config uses `add--settings`, never a new file.
    
13. MCP document model: `mcp/types.mjs:77` keeps `'setup-receipt'` and `cli/tests/mcp-document-model.test.js:146-151` stays. Unknown or legacy md receipts must still index, per the file's own rule (`types.mjs:58-63`). `mcp/reference.md:69` gains one note: current receipts live in `.codeadd/settings.json` and are not documents. No other MCP change.
14. Two bug fixes in this card, both found while grounding `.codeadd/`:
    - (a) `.codeadd/wiki/` is gitignored by `.codeadd/*`, while `/add-wiki` requires the wiki to be committed and warns when `git check-ignore .codeadd/wiki/index.md` matches (STEP add-wiki.meta, `commands/add-wiki.md:778-797`). Fixed by the `!.codeadd/wiki/` exception (decision 11).
    - (b) The corrupted-manifest uninstall deletes `board.json` and the whole wiki. Fixed by the skip list (decision 11), which also covers `settings.json`.
15. Tests:
    - `cli/tests/migrations.test.js` (new cases for `0005`):
      - full convert: values, unknown key, receipt fields, Decision Log rows into `log`, `qa-project` string and hash, old files deleted;
      - no QA setup → note;
      - second run → no change;
      - shape stamped only when the recorded shape equals the constant, copied otherwise;
      - existing `qa` section → merge, nothing deleted;
      - malformed old file → throws and deletes nothing.
    - `scripts/tests/qa-preflight.test.cjs` and `native-script-cases.json`: fixtures move to `settings.json`, the same outputs are asserted, plus a malformed-json case.
    - `scripts/tests/status.test.cjs:647,665-667,717`: fixtures move to `settings.json`.
    - `cli/tests/build-contracts.test.js:87,151,301,351` and `cli/tests/qa-pipeline-umbrella.test.js:155,212`: the new contract path.
    - `cli/tests/gitignore.test.js:26,38,52,230,245,255`: the four-line block; a git-backed case where `git check-ignore` exits 1 for `.codeadd/settings.json` and `.codeadd/wiki/index.md` and 0 for `.codeadd/manifest.json`.
    - Installer: `addDirHoldsInstall` is false for a `.codeadd/` holding only `board.json`, `settings.json` and `wiki/`.
    - Uninstaller: the corrupted-manifest path keeps those three.
    - A text test checks that `add--settings` exists, is registered, and states the content rule and the shared/hash rule, and that `receipt.md` points to it.
16. Out of scope:
    - moving feature or plugin toggles out of `manifest.json`;
    - a `.codeadd/settings/` md folder (nothing needs it yet);
    - the `setup` section (card `add-setup`);
    - any change to `screens.json`, the QA-evidence block or `qa-project`'s location;
    - a settings CLI subcommand.
17. Target: next release, priority Média, BEFORE `add-setup`, which builds its record on the `setup` section and depends on decisions 3, 4, 11 and 12.
18. Acceptance criteria:
    - (a) `npm run build`, `npm run test:all` and `node scripts/inventory.js --check` pass.
    - (b) A fresh `/add-qa-setup` writes only `.codeadd/settings.json` → `qa` (values, receipt fields, `log`) plus `qa-project`, `screens.json` and the `.gitignore` block, and nothing under `docs/qa/`. Its JSON gate passes.
    - (c) `qa-preflight.cjs a` and `status.cjs` report `QA_CONFIG=ok`, `QA_RECEIPT=ok`, `QA_CONTRACT_MATCH=ok` and `SETUP_QA:present` from `settings.json`.
    - (d) A project on v1.6.0 with a current QA setup runs `codeadd update`. Migration `0005` converts it, deletes `docs/qa/config.json` and `docs/qa/qa-setup.md`, keeps every Decision Log row in `qa.log`, and leaves `SETUP_QA_STALE` unset and `QA_CONTRACT_MATCH=ok`.
    - (e) The same with an already-stale receipt keeps it stale.
    - (f) Running `codeadd migrate` again changes nothing.
    - (g) In a git repo with the managed block, `.codeadd/settings.json` and `.codeadd/wiki/` are not ignored and `.codeadd/manifest.json` is.
    - (h) A fresh clone holding only `board.json`, `settings.json` and `wiki/` installs without `--force`.
    - (i) A corrupted-manifest uninstall keeps `board.json`, `settings.json` and `wiki/`.
    - (j) `add--settings` is registered and loaded by `/add-qa-setup`, and `receipt.md` points to it.
19. Risks:
    - Merge mistakes when two commands write the same file. Mitigation: one section per command, and read → merge → write.
    - A project edits `config.json` after the update but before running the migration. Mitigation: the migration runs in the same update that ships the new readers, and a retry merges without overwriting.
    - JSON loses comments that users may have added. Accepted: `config.json` was JSON already.

## Open

None

## Card dependency

Depends on nothing. Blocks `add-setup`, whose record becomes the `setup` section and whose `.codeadd/` file handling this card owns.

## Board changes

- status: shaped
- title: qa-settings: central project settings file .codeadd/settings.json, with /add-qa-setup migrated onto it
- tldr: new project-owned, versioned .codeadd/settings.json with one section per command. Values, short descriptions and decisions go in JSON; prompt-like text goes in a referenced md (none today). /add-qa-setup moves docs/qa/config.json and its md receipt into settings.json.qa (values, receipt fields, an append-only log), and qa-preflight/status read JSON. Migration 0005 converts existing projects on codeadd update without triggering STALE. The new add--settings skill holds the schema, and receipt.md points to it. The gitignore keeps settings.json and wiki/, the fresh-clone install check ignores them, and the corrupted-manifest uninstall keeps board.json, settings.json and wiki/.
- done_when: .codeadd/settings.json exists as the single project settings file. /add-qa-setup writes settings.json.qa (values, receipt fields, append-only log) and nothing under docs/qa/, and validates it with a JSON gate. qa-preflight.cjs and status.cjs read baseUrl and setup-shape from it with unchanged outputs. All QA readers (fragments, agents, add--qa, add--qa-spec, add--setup-contract) point to it. Migration 0005 converts docs/qa/config.json and qa-setup.md (Decision Log into log), deletes them, stamps the new shape only when the old one matched sha256:25b937ee17628d6b, is idempotent, and is tested. The add--settings skill is registered and holds the schema, and receipt.md points to it. CODEADD_PAIR adds !.codeadd/settings.json and !.codeadd/wiki/, addDirHoldsInstall ignores them, and the corrupted-manifest uninstall keeps board.json, settings.json and wiki/. Build, inventory --check and test:all pass.
- paths: framwork/.codeadd/skills/add--settings/SKILL.md (new), framwork/provider-map.json, framwork/.codeadd/commands/add-qa-setup.md, framwork/.codeadd/fragments/qa-pipeline/add-review.md, framwork/.codeadd/fragments/qa-pipeline/add-plan.md, framwork/.codeadd/fragments/qa-pipeline/add-build.md, framwork/.codeadd/agents/e2e-agent.md, framwork/.codeadd/agents/qa-agent.md, framwork/.codeadd/skills/add--qa/SKILL.md, framwork/.codeadd/skills/add--qa-spec/SKILL.md, framwork/.codeadd/skills/add--setup-contract/SKILL.md, framwork/.codeadd/skills/add--doc-schemas/references/receipt.md, framwork/.codeadd/skills/add--doc-schemas/SKILL.md, framwork/.codeadd/skills/add--ecosystem/SKILL.md, framwork/.codeadd/scripts/qa-preflight.cjs, framwork/.codeadd/scripts/status.cjs, cli/src/migrations.js, cli/src/gitignore.js, cli/src/installer.js, cli/src/uninstaller.js, mcp/reference.md, AGENTS.md, workbench/skills/add-framework-product-layer/SKILL.md, cli/tests/migrations.test.js, cli/tests/gitignore.test.js, cli/tests/build-contracts.test.js, cli/tests/qa-pipeline-umbrella.test.js, scripts/tests/qa-preflight.test.cjs, scripts/tests/native-script-cases.json, scripts/tests/status.test.cjs
- labels: product
- notes: Priority Média. Plan before add-setup (it blocks add-setup). Includes two bug fixes: the wiki was gitignored, and the corrupted-manifest uninstall deleted board.json and the wiki.

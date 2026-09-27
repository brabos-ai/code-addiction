# Product commands use one hyphen, skills use two

> **Date:** 2026-09-26
> **Plan:** `docs/plans/2026-09-26T121638-PLAN--product-artefact-names.md`
> **Layer:** both
> **Ticket:** 0010B

Product commands are now `add-<name>` and product skills are `add--<name>`. There are no aliases. The root command `add` and the internal workbench names stay as they were. Providers that emit a command as `SKILL.md` keep the command name (`add-new`), not the skill form.

## Added

- **`scripts/rename-product-artefacts.js`** — preview and apply for product command and skill renames. Apply refuses a stale or edited preview and writes nothing until every destination is free.
- **`workbench/skills/add-product-artefact-renaming`** — the internal procedure for that tool. It does not rename workbench identities.
- **`assertProductNames`** in `scripts/build.js` — the product build rejects a dotted command name or a single-hyphen skill name.

## Changed

- Product commands, skills, fragments and the GitNexus plugin skill moved to the new names. Active references in the CLI, README, web docs and internal examples moved with them.
- **Upgrade** (`cli/src/updater.js`) deletes only the legacy `add-gitnexus/SKILL.md` before plugin apply. It does not delete other files in that folder.
- **QA setup contract** lookups and the managed `.gitignore` marker use `add-qa-setup`. An old marker is rewritten to the new one so an existing install does not fail.
- **The graph gate** on the rename skill declares `- mention: add-commit`, the internal id its prose names as the old skill form.

## Unchanged

- Historical deliveries, changelogs and backlog tickets keep the names they were written with.
- `skills/add-skill-creator/render-graphs.js` stays on the old path on purpose. The updater still removes that one orphan file.

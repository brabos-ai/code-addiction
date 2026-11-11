# add-help guide

## Outcome

The `add` gateway is now `add-help`, a help guide. It answers which command to use and in what order, what each feature and plugin is and whether it is on, how to run the framework from a bot, and how the CLI works. It reads each answer from the real source instead of a copy.

## Why

`/add` only routed between commands. People asked it how to enable QA, what GitNexus is, how to run from a bot and what to run after `codeadd update`, and it had no source for any of them (ticket 0012B). The name also hid what the command does.

## Changes

- `framwork/.codeadd/commands/add.md` is now `add-help.md`; the provider-map key and the STEP ids follow (`add-help.*`). No `/add` alias: an update removes the old file through `pruneObsolete`.
- New question types in `add-help.md`: features and plugins (ecosystem tables plus `.codeadd/manifest.json`), bot mode (`.codeadd/agent-mode/README.md`, read at answer time) and CLI lifecycle (`codeadd --help`, with `npx --yes codeadd --help` only as fallback). With no question it prints an overview.
- Four stale references in the old command are fixed: `/health-check`, the unprefixed `dev-environment-setup` skill, two mangled STEP citations and the Claude-only commands path.
- `add--ecosystem` follows the rename and gains one routing row: after `codeadd update`, if `.codeadd/wiki/` exists, run `/add-wiki update`. Stale `add` entries in its consumer lists are corrected.
- `scripts/build.js` `assertProductNames` no longer has the `add` exception: a command key `add` now fails the build.
- `cli/src/installer.js` install outro says `/add-help`; `cli/src/release-copy.js` comment, `web/src/pages/docs.astro`, `web/public/commands.svg`, `web/public/artefact-graph.mmd` and `workbench/skills/building-commands/SKILL.md` follow.
- Tests: new `cli/tests/add-help.test.js` (sources named, routing row, old-install prune for the Claude and codex paths); `product-resource-names`, `chat-continuation-handoff`, `lighter-add-build` and `optional-review-build-final-review` follow the rename. The name-gate test was renamed ("...with no exception") and carries a `Test-Removed:` trailer.

## Release note

Anyone who typed `/add` now types `/add-help`. Run `codeadd update`; the old command file is removed.

# Product agent mode for Claude Code

## Outcome

A bot (CI, a script or another agent) can run any installed codeadd command with `claude -p`, get a JSON result checked by a schema it passes itself, see when a run stopped waiting for an answer, and continue it with `--resume`. Every install and update now carries `.codeadd/agent-mode/` with the schema and a short guide. Claude Code only.

## Why

The workbench could already be driven headless; the product could not. A caller had to parse the seven-block report and guess whether a run was done, stopped or waiting (ticket 0031B). Claude Code's own `--json-schema` check solves it with no prompt change.

## Changes

- `framwork/.codeadd/agent-mode/result.schema.json` is the product result schema: same structure as the workbench one, product descriptions, no `$schema` key.
- `framwork/.codeadd/agent-mode/README.md` is the bot guide: the call in bash and PowerShell, resume, the one stop rule, the main flows, and "Claude Code only for now".
- `framwork/.codeadd/commands/add-wiki.md` adds one line to the `codeadd-shell` block: `Headless callers (claude -p): read .codeadd/agent-mode/README.md.` No other prompt changed.
- `.github/workflows/release.yml` packages `.codeadd/agent-mode` in the release zip.
- `AGENTS.md` names `.codeadd/agent-mode/` in the product layer anatomy.
- `cli/tests/agent-mode.test.js` holds the two schemas equal once descriptions are removed, checks one sample per status, checks that every `/add-*` command named in the guide exists, checks the `add-wiki` pointer, and guards that no command, skill or agent mentions `json-schema` or `result block`. `cli/tests/release-packaging.test.js` requires the new directory in the packaging list.

## Existing installs

For the release notes: run `codeadd update` to get the guide and the schema, then `/add-wiki` to write the pointer into the project's `AGENTS.md`. The installer never edits that file.

## Validation

`node scripts/build.js` exit 0 with no warning. `npm run test:cli` 2036 tests passed; `node scripts/run-tests.js framework` passed. One real headless run of `/add-brainstorm` returned `needs-approval`, and the `--resume` call returned a second result that passes the schema validator.

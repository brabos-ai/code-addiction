# Result block via `--json-schema`: the 0028B output mode is removed

## Outcome

A headless caller gets a structured result from Claude Code's `--json-schema` flag. No `add-framework--*` artefact carries JSON instructions any more. The 0028B output mode (`CODEADD_OUTPUT`, `output.mode`, the `codeadd-result` fence) was removed before release, so no consumer is affected. Ticket 0030B.

## Why

Every stage prompt carried output plumbing for JSON the CLI already produces, and the prompt route could be skipped at a prose-mode STOP. The contract also lived in a markdown table a caller could not pass to the CLI.

## Changes

- The stop-rule line and the four "before the result block, in `both` mode" asides are removed from the seven stage artefacts.
- `add-final-report` is back to its last-step load rule; `## The Result Block` is gone. `building-commands` is back to its pre-0028B text. A two-sentence pointer says where a headless caller gets a result.
- Removed: `scripts/output-mode.js`, its test, `workbench/settings.json`, the `.claude/settings.json` allow entry and three `AGENTS.md` rows.
- Added: `references/result-block.schema.json` (JSON Schema draft 2020-12, the only contract for the twelve v1 fields). `scripts/tests/result-block-schema.cjs` reads it and validates raw JSON for keys, types and enums.
- `references/result-block.md` is now the call doc: how to pass the schema text to `claude -p`, the PowerShell 5.1 escape, and how to validate a captured stdout.

## Validation

`scripts` suite 683 tests, all green; cli vitest 79 files and board e2e green. Two simplifications from the operator: no hand-written JSON Schema keyword checker, and the validator drops the cross-field rules (they stay in the schema `description`). The headless smoke run of `/add-framework--backlog update 9999B` with `--json-schema` has not been run; it is the ticket's last check.

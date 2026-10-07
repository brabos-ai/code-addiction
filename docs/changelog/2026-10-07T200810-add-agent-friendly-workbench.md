# Agent-friendly workbench: opt-in result block and a plan-less fix track

## Outcome

An agent running an `add-framework--*` stage through `claude -p` can read the outcome from one fenced `codeadd-result` JSON block when `CODEADD_OUTPUT` (or `output.mode` in `workbench/settings.json`) asks for it. With nothing set, the closing is unchanged. `/add-framework--done --fix <slug> [--ticket <id>]` closes a branch that never had a plan.

## Why

Agents read the workbench's output too, and it was written for people. Separately, small fixes (PR #112) had no close-out that writes the index, changelog and archive, because done requires a plan and a ledger. Ticket 0028B.

## Changes

- `scripts/output-mode.js` resolves `prose`, `json` or `both` (env, then settings, then `prose`; invalid values warn and fall through; exit 0 always). `workbench/settings.json` holds `prose`.
- `add-final-report` gains `## The Result Block` and `references/result-block.md` (schema v1). Each of the seven `add-framework--*` artefacts carries one stop-rule line after its prohibitions marker.
- `add-plan-authoring` names the fix record (`*-FIX--<slug>.md`), its three-source resolution, the `fix.md` archive member and the ticket carrier.
- `add-framework--done` gains `--fix`: a fix gate in place of the ledger gate, no recovery path, `fix.md` archived, `--merge` kept. Every change sits beside the planned path, which a test pins byte for byte.
- `AGENTS.md` names the resolver and the settings file. The cli artefact-graph snapshot counts the new reference node.

## Validation

`scripts` suite 655 -> 687 tests, all green. Framework suite: 79 vitest files (2026 tests) and the 687, all green. Real `claude -p` runs (L4.1, L4.2) were not run in this build, and the first real `--fix` close-out (L4.3) is still to do. The end-to-end proof of the fix track and of `json` mode is therefore pending.

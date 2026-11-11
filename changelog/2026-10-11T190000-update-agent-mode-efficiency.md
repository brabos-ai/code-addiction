# Update: agent-mode efficiency — error stops end with no alternative, CLI warns on providers without injection

## Outcome

Under agent-mode, a stop on a failure ends on the reason and the one command that unblocks it, with no alternative offered. The CLI warns when a feature is explicitly enabled on Codex, Antigravity or ZCode, where it does nothing. `/add-build` was run live with agent-mode + qa-pipeline + tdd-pipeline and reached its closing with no hang and no extra round. Ticket 0039B.

## Changes

- `add--agent-interaction`: an error stop asks nothing and offers no alternative, exception or workaround; a gate that stops on a missing prerequisite is an error stop even when the command's gate table calls it `deciding`; an error stop outranks the command's stop-kind label and writes no open-decision line. A step that asks the user to approve the remedy (the `/add-qa-setup` install confirmation) stays deciding.
- `add--delivery-mode`: "deciding" means the stop waits, not that it offers a choice.
- agent-mode `add-plan` fragment (`stop-kinds`): a gate failing on a missing prerequisite is an error stop. The human fallback text is unchanged.
- `cli/src/features.js`: `warnUninjectedProviders(cwd, featureKey)`, called from `features enable`, the interactive menu, `modify --enable-feature` and `install --enable-feature` (only for names the user asked for, never registry defaults). Enable behaviour, exit codes and the manifest are unchanged.
- Tests: `agent-mode-feature.test.js` (error-stop text), `features.test.js`, `modify.test.js`, `non-interactive.e2e.test.js` (the warning).
- Live run (scratch project, about $3.1): `/add-plan` with `discovery.md` missing closed with the reason and the unblocking command only; `/add-build` ran to its publish question and closed on `/add-done`. Zero interactive-tool calls and zero continuation offers across the run. The "Offer the continuation" STEP headings stay.

## Action for installed projects

None. Run `codeadd update` to get the new rule text.

## Not covered

The qa-pipeline confirmation gate on the correction route (`/add-review` then `/add-build`) was not exercised live.

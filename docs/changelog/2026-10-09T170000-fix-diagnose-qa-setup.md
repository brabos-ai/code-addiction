# add-diagnose and add-qa-setup no longer contradict themselves

## Outcome

`add-diagnose` has one stop, the report. `add-qa-setup` says who runs each install.

## Why

`add-diagnose` had a Rules line asking to confirm the reformulation with the user before investigating, while its steps never stop there. `add-qa-setup` said it installs, but also pointed to a skill that only shows commands, so it was unclear who ran what. Ticket 0037B.

## Changes

- `framwork/.codeadd/commands/add-diagnose.md`: removed the "confirm the reformulation" rule.
- `framwork/.codeadd/commands/add-qa-setup.md`: new "Who runs the install" paragraph. `npm`/`npx` installs run in the command after confirmation. Installs that need `sudo` or an interactive installer follow `add--dev-environment-setup`.

## Validation

CI green on head `8810660`: native suites, board and CodeQL. PR #125.

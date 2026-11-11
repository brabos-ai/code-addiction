# Install, modify and update run from flags with no terminal

## Outcome

A bot, a CI job or an agent can install codeadd, change providers, features and plugins, and update, with stdin not a terminal. The command finishes, or exits 1 with a message naming the missing flag. It never waits for an answer. Run by a person in a terminal, with no flags, every command behaves as before.

## Why

0027B only made `install` fail without a terminal. That stopped the hang but left a bot with no way to install, `modify` ignored its arguments, and `features` opened a menu nobody could answer.

## Changes

- `cli/src/change-flags.js` (new): reads `--providers`, `--enable-feature`, `--disable-feature`, `--enable-plugin`, `--disable-plugin`, `--force` and `--no-gitignore`. Repeated flags and comma lists both work.
- `cli/src/installer.js`: without a terminal, `install` needs `--providers <a,b|none>`, checks every name and every overwrite before the download, and applies requested plugins last. With a terminal, each flag answers only its own prompt.
- `cli/src/modify.js`: `modify` with flags applies them through `applyDesiredState` with no prompt. `--providers` is the final set; feature and plugin flags are deltas. A removal with nobody to ask exits 1 unless `--force` is given, and so does `providers remove`. A requested plugin whose tool is missing fails after the rest is applied. Feature aliases that disagree with their canonical name are refused.
- `cli/src/features.js`: `features` and `features list` print the states and exit when there is no terminal.
- `cli/src/cli.js`, `cli/README.md`, `framwork/.codeadd/agent-mode/README.md`: the flags are in `codeadd --help`, the CLI README and a new section of the agent-mode guide.
- Tests: `cli/tests/change-flags.test.js`, `cli/tests/non-interactive.e2e.test.js`, new cases in `cli/tests/bin-entrypoint.integration.test.js`. `modify.test.js` and `features.test.js` only gained `isTTY = true` setup; the 0027B assertion in the bin test now checks the `--providers` message.

## Not done

`uninstall` with both a project and a user-level install still asks which one. No `--json` output, no reinstall flag, no version change through `modify`.

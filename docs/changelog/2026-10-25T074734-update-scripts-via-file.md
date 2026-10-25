# Update: long content goes to a file, never into an inline heredoc

## Outcome

`/add-pull-request` no longer builds the PR body as an inline heredoc. It writes the body to `.codeadd/.temp/<random-slug>.md`, passes it with `--body-file` and deletes the file after the call, on create and on update. A body with an apostrophe, a backtick or `${}` no longer breaks the call. The rule reaches every agent in a user project, every agent in this repository and every command author. Ticket 0009B.

## Changes

- `/add-pull-request`: create uses `gh pr create --title "<title>" --body-file <file>`, update uses `gh pr edit <number> --body-file <file>`. Title stays unmodified and the body stays append-only.
- `/add-build` and the internal `add-framework--build`: the publish row writes the body to a temp file, uses `--body-file` and points at the `/add-pull-request` recipe. `/add-build` declares `/add-pull-request` in `uses:`.
- The `codeadd-shell` managed block (`/add-wiki`) carries one more line with the rule. `add--agents-md-style` states the new block size (7 lines).
- `building-commands` states that a command never prescribes a heredoc or an inline multi-line body.
- `AGENTS.md` has a new `## Shell Calls` section with the rule.
- New test `cli/tests/scripts-via-file.test.js` keeps the heredoc opener out of `framwork/.codeadd` and `workbench` and checks each carrier. The `add-build` line budget goes from 1713 to 1714 for the new `uses:` entry, and the docs graph diagram is regenerated.

## Action for installed projects

**Note:** Run `/add-wiki update` to put the new rule line in your project's `AGENTS.md`. The block is replaced between its markers.

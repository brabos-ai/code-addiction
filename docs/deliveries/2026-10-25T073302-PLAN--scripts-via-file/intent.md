---
path: bounded
topic: scripts-via-file
doc: none
delivery: confirm
ticket: 0009B
---

## Decided

1. Problem: agents pass long scripts and multi-line bodies inline in a Bash call (heredoc `cat <<'EOF' ... EOF`, `--body "$(cat <<'EOF' ...)"`), which breaks on quotes, backslashes, backticks and `${}`. Seen with a ~120-line python script that failed with "unexpected EOF while looking for matching quote" and worked on the first try once saved to a file. The framework itself still prescribes the fragile pattern for PR bodies. Verified on main `d354f5dc` (v1.6.0). Paths are under `framwork/.codeadd/` unless stated otherwise.
2. Already solved, out of scope: the board half of the original ticket. `backlog-commit.sh` no longer exists; `scripts/backlog-commit.cjs` takes `--record-file`, and `skills/add--backlog/SKILL.md:70` already says "Records travel on files, not on pipes". The ticket's `paths` and `done_when` still cite `backlog-commit.sh` and are corrected on handoff.
3. The rule (one wording, reused everywhere): when the content passed to a command is longer than about 3 lines, or holds any quote, backslash, backtick or `${}`, write it with the agent's file-write tool to `.codeadd/.temp/<random-slug>.<ext>` and pass the path (`python <file>`, `node <file>`, `--body-file <file>`, `--record-file <file>`, `< <file>`). Delete the file in the same step after use. Short one-liners stay inline.
4. Location: `.codeadd/.temp/<random-slug>.<ext>` at the project root. `.codeadd/*` is already gitignored in user projects (`cli/src/gitignore.js` CODEADD_PAIR) and in this repo (`/.codeadd/*`, `.gitignore:193`), so a forgotten file never reaches a commit, and the path is the same on every branch (hotfix and chore branches have no feature folder). The random slug keeps parallel agents from overwriting each other. The agent creates the folder if missing; no CLI or installer change.
5. `commands/add-pull-request.md`:
   - STEP add-pull-request.publish-create (`:300-303`): the body is written to `.codeadd/.temp/<random-slug>.md` and the call becomes `gh pr create --title "<title>" --body-file <file>`.
   - STEP add-pull-request.publish-update (`:334-337`): the concatenated body goes to a temp file and the call becomes `gh pr edit <number> --body-file <file>`. Append-only and title-never-modified rules unchanged.
   - Both delete the file after the call.
6. `commands/add-build.md:1538` (publish table, `gh pr create`) and `workbench/skills/add-framework--build/SKILL.md:649`: say `gh pr create --body-file <file>` and point at the `add-pull-request` publish recipe instead of repeating it.
7. Product runtime rule: one line added to the `codeadd-shell` managed block text in `commands/add-wiki.md` STEP add-wiki.resolve-shell-policy (`:627-634`), so every agent in a user project gets it via AGENTS.md. Existing projects receive it on `/add-wiki update` (the block is replace-or-append on its markers). `commands/add-brainstorm.md:562` copies the block verbatim from add-wiki, so it follows with no edit. Keep within `skills/add--agents-md-style` line budget.
8. Internal runtime rule: the same line in this repo's `AGENTS.md` (workbench agents), in a short working-rules spot near `## Where the details live` or the section the Engineer finds most fitting.
9. Authoring rule: `workbench/skills/building-commands/SKILL.md` section `## Command Blocks: Intent Over Script` (`:262`) gets the rule that a command never prescribes a heredoc or inline multi-line body; it prescribes the file route of decision 3.
10. Not touched: `transforms/gemini/commands.md:41` (`"""` is TOML syntax, not shell). Existing backlog recipes that use other scratch locations (e.g. `docs/.tmp-<slug>.json` in `workbench/commands/add-framework--backlog.md:199`, `workbench/skills/add-plan-authoring/SKILL.md:328`) already use the file route and are not moved.

## Acceptance

- `rg -n "<<'?EOF" framwork/.codeadd workbench` returns no instruction that inlines a multi-line body.
- `add-pull-request.md` create and update both use `--body-file` with a file under `.codeadd/.temp/`.
- `add-build.md` and `add-framework--build` publish rows say `--body-file`.
- The `codeadd-shell` block, repo `AGENTS.md` and `building-commands` carry the rule; `add--agents-md-style` validation still passes.
- Existing tests green.

## Risks

- `cli/src/installer.js:178-180` `addDirHoldsInstall` treats any entry other than `board.json` as an install. A leftover `.codeadd/.temp/` only appears after an install, so no change; noted in case a test fixture trips on it.
- Agents may forget to delete the temp file. Harmless: it is gitignored.

## Open

None

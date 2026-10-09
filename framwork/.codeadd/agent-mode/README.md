# Agent mode — running codeadd commands without a person watching

A bot (CI, a script or another agent) can run any installed codeadd command through `claude -p` and
get a JSON result it can read. **Claude Code only for now.** No other provider supports this yet.

The contract is `.codeadd/agent-mode/result.schema.json`. It holds the twelve fields, their types and
what each status means. This guide does not repeat it. Claude Code itself checks the output against the
schema you pass, so there is nothing to install and no script to run.

## 1. Call a command

Pass the schema as **text**, not as a path. `--json-schema` with a path fails with
`--json-schema is not valid JSON`.

bash:

```bash
claude -p "/add-plan add a dark mode toggle" --output-format json \
  --json-schema "$(cat .codeadd/agent-mode/result.schema.json)"
```

PowerShell:

```powershell
$schema = (Get-Content .codeadd/agent-mode/result.schema.json -Raw) -replace '"','\"'
claude -p "/add-plan add a dark mode toggle" --output-format json --json-schema $schema
```

On Windows PowerShell 5.1 the double quotes inside the text must be escaped, as above, or the native
`claude` exe receives a broken argument.

Stdout is one JSON envelope. The result is its `.structured_output` field. Read `status` from it:
`done`, `stopped`, `needs-approval` or `failed`. `needs_approval` repeats the same fact as a boolean.

## 2. Resume a stopped run

A run that ends with `status: needs-approval` is waiting for an answer. Take `.session_id` from the
envelope and answer in the same session:

```bash
claude -p "<your answer>" --resume <session_id> --output-format json \
  --json-schema "$(cat .codeadd/agent-mode/result.schema.json)"
```

- `reason` says what the run asks. `next_step` carries the question or the next command.
- Pass `--json-schema` again on every call. The flag belongs to one call, not to the session, so a
  resumed call without it returns no `structured_output`.
- `claude -c` continues the most recent session in the directory. Use it only when no other run
  started there since. `--resume <session_id>` is always safe.

## 3. The stop rule

Every stop that waits on a decision returns `needs-approval`. That covers a question, an approval and
a push. `/add-done` always stops before the merge, so an unattended run never merges. Any other status
is final: `done` finished, `stopped` ended on purpose at a gate, `failed` hit an error nobody planned for.

The guide does not list the stops of each command. They change with the commands. Read `reason`.

## 4. The main flows

- Feature: `/add-new`, then `/add-plan`, `/add-build`, `/add-review` and `/add-done`.
- Hotfix: `/add-hotfix`, then `/add-done`.
- Idea still open: `/add-brainstorm`, then `/add-plan`.

Run one command per call. Each call returns its own result.

## 5. Provider support

Claude Code only for now. Codex, Cursor, Antigravity, OpenCode and ZCode do not use this contract yet.
That is the slash-command contract above. Section 6 is the `codeadd` CLI, which works for every provider.

## 6. Install and change the installation from a bot

This part is the `codeadd` command line, not a slash command. It works for every provider. When stdin
is not a terminal it never asks a question: it finishes, or it exits 1 with a message naming the flag
that is missing. `codeadd --help` lists every flag.

```bash
# install. --providers is required; "none" installs the core only
npx codeadd install --providers claude,codex --enable-feature board

# the project already has .codeadd/ or .claude/: overwriting needs --force
npx codeadd install --providers claude --force

# change an installed project. --providers is the FINAL set; feature and plugin flags are deltas
npx codeadd modify --providers claude --force --disable-feature tdd-pipeline

# update, and read the feature states
npx codeadd update
npx codeadd features list
```

- Exit 0 means it finished. Exit 1 means it refused and changed nothing, except for a plugin whose
  tool is not installed: everything else is applied first, then it exits 1 naming that plugin.
- `--force` confirms removing a provider and overwriting existing files. Without it those steps exit 1.
- Defaults with no terminal: project scope (`--global` for your home dir), the `.gitignore` block on
  (`--no-gitignore` turns it off), features at their registry defaults, no plugins.
- `--enable-feature`, `--disable-feature`, `--enable-plugin` and `--disable-plugin` change only the
  names you give. Repeat the flag or separate names with commas.
- An installation already there is not reinstalled. Use `modify` or `update`; to start over, run
  `uninstall --force` and then `install`. One exception: when a project install and a user-level
  install both exist, plain `uninstall` asks which one to remove, and with no terminal it waits.
  `--global` (or `--user`) picks the user-level one. There is no flag for the project one in that
  case, so do not use `uninstall` there from a bot.

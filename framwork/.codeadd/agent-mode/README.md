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

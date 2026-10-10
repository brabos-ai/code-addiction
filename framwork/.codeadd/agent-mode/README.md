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
a push. `/add-done` asks nothing before the merge: once its gates pass, it merges automatically, so a
bot that runs it to the end merges. With the agent mode on (section 7) it reads the CI checks once; when
any is still pending it ends with `stopped` and `/add-done` as the next command, and the next call
merges once they are green. Any other status is final: `done` finished, `stopped` ended on purpose at
a gate, `failed` hit an error nobody planned for.

The guide does not list the stops of each command. They change with the commands. Read `reason`.

## 4. The main flows

- Feature: `/add-new`, then `/add-plan`, `/add-build`, `/add-review` and `/add-done`.
- Hotfix: `/add-hotfix`, then `/add-done`.
- Idea still open: `/add-brainstorm`, then `/add-plan`.

Run one command per call. Each call returns its own result.

One exception: a delivery the user chose as `automatic` at `/add-brainstorm` hands each stage to the next
within the same call, so one call can run several stages in one call. The result's `stage` names the
command that ended it, and `next_step` says what to call next.

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

## 7. Make the commands talk to a bot

By default the installed commands are written for a person at a terminal: one question per turn, a
structured-question tool, a yes/no offer to continue after every report. A bot pays a whole call for
each of those. The `agent-mode` feature swaps them for bot wording. It is off by default and changes
nothing for a person.

```bash
# on a new install
npx codeadd install --providers claude --enable-feature agent-mode

# on a project that already has codeadd
npx codeadd modify --providers claude --force --enable-feature agent-mode
```

With it on, in the twelve commands it covers:

- Every question a step needs answered arrives in **one message**, numbered, each with a
  recommendation and the reason for it. No interactive tool is called.
- A stop that only repeats something already agreed prints what it would have shown and goes on.
- No command ends with an offer to continue. Each ends on what changed, what still needs a decision,
  and the next command as its last line.

The feature changes how the commands talk, not the result: the schema is the same.

It takes effect on Claude Code, Cursor and OpenCode. Codex, Antigravity and ZCode install the commands
as skills and cannot receive feature injection, so the flag changes nothing there: their commands keep
the human wording.

## 8. Answer a stop

A stop that waits ends the call with `needs-approval`, and `next_step` holds the numbered questions.
Answer all of them in the next call, in the same session:

| You send | Meaning |
|---|---|
| `1a, 2b` | Option `a` for question 1, option `b` for question 2 |
| `recommended` | The recommended option for every question |
| `2: use the shared helper` | Free text for question 2 |

A partial answer is applied, and only the questions left are asked again, with the same numbers.

With `--output-format stream-json`, a run that dispatches a subagent can print more than one result
event. The last one is the run's result; an earlier one can be written while the subagent is still
working.

## 9. Mirror the board to an external tracker

The project's board lives on its own `board` branch, in one clone per project on the machine. A bot that
keeps an outside tracker in step with it does not read the files: it asks the board what changed since the
last time it looked, with the same entry every command uses.

1. Keep the last `HEAD` you stored. The first time there is none.
2. Run `node .codeadd/scripts/backlog-cli.cjs changes --since <sha>` (no `--since` the first time: every
   ticket comes back under `ADDED`). It syncs the clone first, then prints `HEAD=<sha>`, and
   `ADDED=`, `UPDATED=` and `REMOVED=` as comma-separated ticket ids, empty when none.
3. For each id under `ADDED` and `UPDATED`, run `backlog-cli.cjs get <id>` for the full ticket and push it
   to the tracker. For each id under `REMOVED`, remove or close the tracker item.
4. Store the `HEAD` from step 2 as the next cursor.

`UNPUSHED=<n>` appears when the clone holds writes the remote does not have yet. Those are not in the
lists, and `HEAD` is the remote tip, so they arrive in a later call once they are pushed.

If the call exits 1 with `ERROR=cursor-unknown`, the stored sha is not on the board branch any more. Start
again without `--since` and treat every ticket as new.

Nothing here names a tracker: the framework ships no tracker code, and the sync itself is the bot's job.

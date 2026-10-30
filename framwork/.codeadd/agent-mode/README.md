# Agent mode — running codeadd commands without a person watching

A bot (CI, a script or another agent) can run any installed codeadd command headless and get a JSON result
it can read. The calls below use `claude -p` with `--json-schema` as the **example**: the contract is the
result schema, not the tool. Codex, OpenCode and other providers can run the same flow by consulting their
own documentation for headless runs and structured output.

The contract is `.codeadd/agent-mode/result.schema.json`. It holds the twelve fields, their types and
what each status means. This guide does not repeat it. In the example, Claude Code itself checks the output
against the schema you pass, so there is nothing to install and no script to run.

## 1. Call a command

The example is Claude Code. Another provider passes the same schema through its own flags: look them up in
its documentation.

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

A run that ends at a STOP, a gate or a refusal is `stopped`, and a run that ends on a question is `needs-approval`: the schema says neither is ever `done`. To fail a step on anything but `done`, save the envelope to a file (you still need its `session_id`) and check it. `claude -p` itself exits 0 whenever the model finishes, so the exit code is the caller's to set.

bash:

```bash
claude -p "<command>" --output-format json --json-schema "$(cat .codeadd/agent-mode/result.schema.json)" > out.json
jq -e '.structured_output.status == "done"' out.json > /dev/null
```

PowerShell:

```powershell
$out = Get-Content out.json -Raw | ConvertFrom-Json
if ($out.structured_output.status -ne 'done') { exit 1 }
```

## 2. Resume a stopped run

The resume flags below are Claude Code's. Another provider has its own way to continue a session; the rest of
this section (the fields, and passing the schema on every call) holds for any of them.

A run that ends with `status: needs-approval` is waiting for an answer. Take `.session_id` from the
envelope and answer in the same session:

```bash
claude -p "<your answer>" --resume <session_id> --output-format json \
  --json-schema "$(cat .codeadd/agent-mode/result.schema.json)"
```

- `reason` says what the run asks. `next_step` carries the question or the next command.
- Pass `--json-schema` again on every call. The flag belongs to one call, not to the session, so a
  resumed call without it returns no `structured_output`.

Rules for a bot, every time:

- Always resume with `--resume <session_id>`, where `session_id` is the `.session_id` of the envelope the
  run returned.
- Never use `-c` or `--continue`. They pick the most recent session in the directory, which can be
  another bot's.
- Never pick a session by the newest `.jsonl` file. It has the same flaw.
- Always run each agent in its own git worktree. `build-setup.cjs --worktree` carries the installed framework into the new worktree; a worktree made by hand needs `.codeadd/` and the provider folders copied, or `npx codeadd install` run in it.
- Never switch branches in a checkout that other agents share.

## 3. The stop rule

Every stop that waits on a decision returns `needs-approval`. That covers a question, an approval and
a push. `/add-done` asks nothing before the merge: once its gates pass, it merges automatically, so a
bot that runs it to the end merges. With the agent mode on (section 7) it reads the CI checks once; when
any is still pending it ends with `stopped` and `/add-done` as the next command, and the next call
merges once they are green. Any other status is final: `done` finished, `stopped` ended on purpose at
a gate, `failed` hit an error nobody planned for.

`/add-done` runs `git push` and `gh pr merge`, so a destructive-command hook used in autonomous runs must allow them for that step.

The guide does not list the stops of each command. They change with the commands. Read `reason`.

## 4. The main flows

- Feature: `/add-new`, then `/add-plan`, `/add-build` and `/add-done`. `/add-review` is optional: run it only when the `qa-pipeline` feature is on and the delivery declares screens. `/add-build` already reviews its own work.
- Hotfix: `/add-hotfix`, then `/add-done`.
- Idea still open: `/add-brainstorm`, then `/add-plan`.

Run one command per call. Each call returns its own result.

One exception: a delivery the user chose as `automatic` at `/add-brainstorm` hands each stage to the next
within the same call, up to the build's publish stop, so one call can run several stages. The result's `stage` names the
command that ended it, and `next_step` says what to call next.

## 5. Provider support

The examples in sections 1 and 2 are Claude Code's, and nothing in the contract ties it to Claude Code. Codex,
OpenCode and the other providers can run the same flow: read their own documentation for how to run a command
headless and how to ask for structured output, and pass `.codeadd/agent-mode/result.schema.json` the way they
take a schema. Section 6 is the `codeadd` CLI, which works for every provider.

## 6. Install and change the installation from a bot

This part is the `codeadd` command line, not a slash command. It works for every provider. When stdin
is not a terminal it never asks a question: it finishes, or it exits 1 with a message naming the flag
that is missing. `codeadd --help` lists every flag.

```bash
# install. --providers is required; "none" installs the core only
npx codeadd install --providers claude,codex --enable-feature qa-pipeline

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

## 9. Work as a team of agents

Several agents can work on one codebase: product PMs shape the work, engineers build it. To
start a new agent, tell it to read its role file and use this framework:

- `.codeadd/agent-mode/roles/product-pm.md` owns scope, release and priority, and shapes the work up to
  the intent file and the feature folder. It never implements.
- `.codeadd/agent-mode/roles/chief-engineer.md` takes one feature and runs it through `/add-plan`,
  `/add-build` and then `/add-done`. A bug runs `/add-hotfix`, then `/add-done`.

Each role file lists the commands the agent runs, its boundaries, when it stops and asks the user, and the
summary it ends with.

Rules for the team, every time:

- Every agent has its own git worktree and its own session. The rules for that are in section 2. They are
  not repeated here.
- One engineer takes one feature at a time. This is a process rule the product PM keeps: the PM says in its
  summary which engineer takes which intent file, and nothing stops a second engineer.
- The product PM hands work to an engineer with the intent file (`docs/brainstorm/<timestamp>-<slug>-intent.md`)
  and the feature folder `docs/features/<id>-<slug>/`, both on main.
- Commit and push the intent file and `docs/features/<id>-<slug>/` to the main branch before the handoff: `/add-new` makes no git write, and another worktree does not see an uncommitted file.
- `/add-review` is optional (section 4). Another engineer may run it in its own worktree.

## 10. Track work in Notion (optional)

A team can keep its cards in Notion. Notion is optional: the commands work the same without it.

- To start, tell the PM agent (or the engineer, when the team has no PM) to load the skill `add--agent-notion`
  and build the board with you. It asks you once for the database, the columns, the labels and how a card is
  filled, then writes a page named `How it works` beside the database. You own that page and may rename it.
- From then on agents keep the cards current by the rules on `How it works`. The page wins over any default.
  A card is always named `<id>-<slug>`.
- A project that had the old local board moves it in this order. Move only the in-progress and pending cards to
  Notion and check each one arrived. Then, after you say yes, delete `.codeadd/board.json`, the local folder
  `~/.codeadd/<key>/board/` and the remote `board` branch, the branch last. Done and dropped cards are not moved.

Without Notion, the handoff is the intent file and the feature folder, as in section 9.

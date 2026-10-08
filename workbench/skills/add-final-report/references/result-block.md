# The Result Block — how a headless caller gets it

A caller that drives a command through `claude -p` can get a structured result instead of parsing the
report. Claude Code does this itself: `--json-schema` puts the validated object in the `structured_output` field of the result envelope. No command
prints the object, and no command carries instructions for it.

The contract is `result-block.schema.json`, in this directory. It holds the twelve fields, their types,
the four status meanings and the two rules between fields. This file does not restate any of it.

## How to call

```bash
claude -p "<prompt>" --output-format json --json-schema "<file content>"
```

Stdout is the result envelope (one JSON object). The validated block is its `.structured_output` field. Two things about the flag:

- It takes the schema **text**. A path is not accepted: Claude Code answers `--json-schema is not valid JSON`.
- On Windows PowerShell 5.1 the double quotes inside the text must be escaped, or the native `claude`
  exe receives a broken argument. Use `-replace '"','\"'`.

bash:

```bash
claude -p "/add-framework--backlog update 9999B" --output-format json \
  --json-schema "$(cat workbench/skills/add-final-report/references/result-block.schema.json)"
```

PowerShell:

```powershell
$schema = (Get-Content workbench/skills/add-final-report/references/result-block.schema.json -Raw) -replace '"','\"'
claude -p "/add-framework--backlog update 9999B" --output-format json --json-schema $schema
```

## Resuming a stopped run

A run that ends with `status: needs-approval` stopped at a question, an approval or a push, and is waiting on the user. The schema's `status` description says what each status means; this section only says how to continue.

Read `.session_id` from the envelope, then answer in the same session:

```bash
claude -p "<answer>" --resume <session_id> --output-format json   --json-schema "$(cat workbench/skills/add-final-report/references/result-block.schema.json)"
```

`claude -c` in place of `--resume <session_id>` continues the most recent session in the same directory. Use it only when no other run started there since.

PowerShell:

```powershell
$schema = (Get-Content workbench/skills/add-final-report/references/result-block.schema.json -Raw) -replace '"','\"'
claude -p "<answer>" --resume <session_id> --output-format json --json-schema $schema
```

Pass `--json-schema` again on every call. The flag belongs to one call, not to the session, so a resumed call without it returns no `structured_output`.

## Checking a captured stdout

Save stdout to a file, then validate its `structured_output`:

```bash
node -e "const { validateResultBlock } = require('./scripts/tests/result-block-schema.cjs'); const out = require('fs').readFileSync('out.json', 'utf8'); console.log(validateResultBlock(JSON.stringify(JSON.parse(out).structured_output)))"
```

It prints `{ ok, reasons }`. The validator reads the schema file, so the two cannot drift. It checks
keys, types and enums. The rules between fields are in the schema's `description` and are not checked in code.

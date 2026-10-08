# The Result Block — how a headless caller gets it

A caller that drives a command through `claude -p` can get a structured result instead of parsing the
report. Claude Code does this itself: `--json-schema` makes stdout the validated object. No command
prints the object, and no command carries instructions for it.

The contract is `result-block.schema.json`, in this directory. It holds the twelve fields, their types,
the four status meanings and the two rules between fields. This file does not restate any of it.

## How to call

```bash
claude -p "<prompt>" --output-format json --json-schema "<file content>"
```

Stdout is the object itself. Two things about the flag:

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

## Checking a captured stdout

Save stdout to a file, then:

```bash
node -e "const { validateResultBlock } = require('./scripts/tests/result-block-schema.cjs'); console.log(validateResultBlock(require('fs').readFileSync('out.json', 'utf8')))"
```

It prints `{ ok, reasons }`. The validator reads the schema file, so the two cannot drift. It checks
keys, types and enums. The rules between fields are in the schema's `description` and are not checked in code.

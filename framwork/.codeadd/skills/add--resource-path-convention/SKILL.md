---
name: add--resource-path-convention
description: Use when writing commands or skills that reference other commands, skills, or scripts — ensures paths resolve correctly across all providers after installation
---

# Resource Path Convention

<!-- uses:
- command: /add-wiki
- script: backlog-cli.cjs
- script: backlog-commit.cjs
- script: backlog-id.cjs
- script: backlog-git.cjs
- script: backlog-core.cjs
- script: backlog-storage.cjs
-->

Commands and skills in `framwork/.codeadd/` are the source of truth. After build, they are placed in provider-specific directories (`.claude/commands/`, `.agents/skills/`, `.gemini/commands/`, etc.). Hardcoded `.codeadd/` paths to commands or skills break because these directories do not exist in the installed project. Use build-time variables to reference resources.

## When to Use

- Writing a command that references another command (e.g., add-build naming add-review)
- Writing a command or skill that references a skill file
- Reviewing existing commands/skills for broken path references
- Creating new commands in the product registry

## When NOT to Use

- Referencing scripts (`.codeadd/scripts/*.cjs` is always correct — fixed path)
- Referencing project files outside the framework (`docs/`, `src/`, etc.)
- Writing code in `build.js` or `cli/` (these operate on the build/install pipeline, not agent runtime)

## Variables

Build-time variables are available. `build.js` replaces them with the correct provider path during build.

**A fragment's variables are resolved at a different moment, by the same rule.** A fragment under
`fragments/` or `plugins/*/fragments/` is never built: it ships as authored, and the CLI injects it into
the installed commands when a feature or plugin is enabled. The CLI resolves each variable for the
provider of the file it is injecting into, with the rule `build.js` uses —
`cli/tests/fragment-placeholders.test.js` holds the two equal. **Write a fragment exactly as you write a
command.** Until that resolution existed, every variable in a fragment landed raw in the installed file.

### `{{cmd:NAME}}`

Resolves to the full path of a command file for the target provider.

```
{{cmd:add-plan}}

# Claude → .claude/commands/add-plan.md
# Gemini → .gemini/commands/add-plan.toml
```

### `{{skill:NAME/FILE}}`

Resolves to the full path of a skill file. Use `SKILL.md` for the main file, or any sub-file name.

```
{{skill:add--backend-development/SKILL.md}}

# Claude → .claude/skills/add--backend-development/SKILL.md
# Gemini → .gemini/skills/add--backend-development/SKILL.md
```

## .codeadd/scripts/ — literal, no variable

Everything the directory ships is reached by the literal path: `.codeadd/scripts/`.

### Scripts (no variable needed)

Node entries are reached by the literal path — the entries stay the same for every provider and for every install:

```
node .codeadd/scripts/status.cjs
node .codeadd/scripts/done.cjs
node .codeadd/scripts/backlog-cli.cjs
node .codeadd/scripts/backlog-commit.cjs
```

The shipped backlog entries are Node CommonJS modules: `backlog-cli.cjs` (the seven local modes —
`list`/`search` print a seven-field summary with `--full`/`--ids` opt-in projections, and `get <id>`
answers the exact detail read), `backlog-id.cjs` (global id allocation), `backlog-git.cjs` and `backlog-commit.cjs` (publication and
recovery), plus `backlog-core.cjs` and `backlog-storage.cjs` (the canonical core the board server
imports directly). Invoke the backlog entries with `node .codeadd/scripts/<entry>.cjs`.
Use the local CLI for reads and local operations; use the publication entry for writes that
must reach the base branch.

### `{{addpath:X}}`

Resolves to the literal `.codeadd/X` path — same across all providers. Use for **runtime paths** that exist in the user's installed project (the installer preserves `.codeadd/`), but are NOT distributed by the build pipeline.

Typical cases: artefacts generated at runtime by commands like `/add-wiki` (which writes `wiki/`), the manifest file, or any artefact materialized in the user's project after install.

```
{{addpath:wiki/domains/backend.md}}  # → .codeadd/wiki/domains/backend.md
{{addpath:manifest.json}}            # → .codeadd/manifest.json
```

**When to use `{{addpath:}}` vs `{{skill:}}`:**

| | `{{skill:NAME/FILE}}` | `{{addpath:skills/NAME/FILE}}` |
|---|---|---|
| Skill exists in the framework's skill source directory | ✅ | ❌ |
| Skill is generated at runtime in user project | ❌ | ✅ |
| Resolves per-provider | ✅ | ❌ (always `.codeadd/`) |

## Examples

### Correct

```markdown
## STEP 1: Load Context
1. Read {{cmd:add-plan}} — PRIMARY reference
2. Run: node .codeadd/scripts/status.cjs
3. Read {{skill:add--backend-development/SKILL.md}}
4. For components, Grep {{skill:add--ux-design/shadcn-docs.md}}
```

### Incorrect

```markdown
## STEP 1: Load Context
Read .codeadd/commands/add-plan.md          ← BROKEN: doesn't exist after install
cat .codeadd/skills/backend-development/SKILL.md  ← BROKEN: wrong path
node .codeadd/scripts/status.cjs             ← CORRECT: scripts are at .codeadd/
```

## Validation Checklist

```
[ ] No raw references to .codeadd/commands/ (use {{cmd:NAME}})
[ ] No raw references to .codeadd/skills/ (use {{skill:NAME/FILE}} for source skills, {{addpath:skills/NAME/FILE}} for runtime-generated skills)
[ ] Script references use .codeadd/scripts/ (literal, no variable)
[ ] Runtime artefacts in installed project use {{addpath:X}}
[ ] Command names match provider-map.json commands keys
[ ] Skill names match provider-map.json skills keys (with add- prefix)
[ ] Skill sub-files exist in the source skill directory
```

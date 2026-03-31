---
name: add-resource-path-convention
description: Use when writing commands or skills that reference other commands, skills, or scripts — ensures paths resolve correctly across all providers after installation
---

# Resource Path Convention

## Overview

Commands and skills in `framwork/.codeadd/` are the source of truth. After build, they are placed in provider-specific directories (`.claude/commands/`, `.agents/skills/`, `.gemini/commands/`, etc.). Hardcoded `.codeadd/commands/` or `.codeadd/skills/` paths break because these directories do not exist in the installed project. Use build-time variables to reference resources.

## When to Use

- Writing a command that references another command (e.g., autopilot loading add.plan)
- Writing a command or skill that references a skill file
- Reviewing existing commands/skills for broken path references
- Creating new commands via `/add.make`

## When NOT to Use

- Referencing scripts (`.codeadd/scripts/*.sh` is always correct — fixed path)
- Referencing project files outside the framework (`docs/`, `src/`, etc.)
- Writing code in `build.js` or `cli/` (these operate on the build/install pipeline, not agent runtime)

## Variables

Three build-time variables are available. `build.js` replaces them with the correct provider path during build.

### `{{cmd:NAME}}`

Resolves to the full path of a command file for the target provider.

```
{{cmd:add.plan}}

# Claude  → .claude/commands/add.plan.md
# Codex   → .agents/skills/add.plan/SKILL.md
# Gemini  → .gemini/commands/add.plan.toml
# Copilot → .github/agents/add.plan.md
# Kiro    → .kiro/prompts/add.plan.md
```

### `{{skill:NAME/FILE}}`

Resolves to the full path of a skill file. Use `SKILL.md` for the main file, or any sub-file name.

```
{{skill:add-backend-development/SKILL.md}}

# Claude → .claude/skills/add-backend-development/SKILL.md
# Codex  → .agents/skills/add-backend-development/SKILL.md
```

```
{{skill:add-ux-design/shadcn-docs.md}}

# Claude → .claude/skills/add-ux-design/shadcn-docs.md
# Codex  → .agents/skills/add-ux-design/shadcn-docs.md
```

### Scripts (no variable needed)

Scripts are always at `.codeadd/scripts/`. Use the literal path.

```
bash .codeadd/scripts/status.sh
bash .codeadd/scripts/done.sh
```

## Examples

### Correct

```markdown
## STEP 1: Load Context
1. Read {{cmd:add.plan}} — PRIMARY reference
2. Run: bash .codeadd/scripts/status.sh
3. Read {{skill:add-backend-development/SKILL.md}}
4. For components, Grep {{skill:add-ux-design/shadcn-docs.md}}
```

### Incorrect

```markdown
## STEP 1: Load Context
Read .codeadd/commands/add.plan.md          ← BROKEN: doesn't exist after install
cat .codeadd/skills/backend-development/SKILL.md  ← BROKEN: wrong path
bash .codeadd/scripts/status.sh             ← CORRECT: scripts are at .codeadd/
```

## Validation Checklist

```
□ No references to .codeadd/commands/ (use {{cmd:NAME}})
□ No references to .codeadd/skills/ (use {{skill:NAME/FILE}})
□ Script references use .codeadd/scripts/ (literal, no variable)
□ Command names match provider-map.json commands keys
□ Skill names match provider-map.json skills keys (with add- prefix)
□ Skill sub-files exist in the source skill directory
```

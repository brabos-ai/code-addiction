# Gemini CLI — Command Transform Reference

> **Source:** https://geminicli.com/docs/cli/custom-commands/
> **Last verified:** 2026-03-19

## Provider Spec

Gemini CLI custom commands use `.toml` files in `~/.gemini/commands/` (global) or `<project>/.gemini/commands/` (local).

### Required Fields

- `prompt` (String): The prompt sent to the model when the command is executed

### Optional Fields

- `description` (String): One-line description shown in `/help` menu

### File Naming

- File path determines command name: `add.plan.toml` → `/add.plan`
- Subdirectories create namespaced commands with colon separator: `git/commit.toml` → `/git:commit`

### Multiline Prompt

```toml
description = "Command description here"
prompt = """
Multi-line prompt content goes here.
Supports markdown formatting inside.
"""
```

### Features Available in Prompts

- `{{args}}` — replaced with user-provided arguments (auto shell-escaped in `!{...}` blocks)
- `!{shell_command}` — execute shell command, output injected into prompt
- `@{path/to/file}` — inject file content (supports images, PDFs, audio, video)

### Escaping Rules

- Inside `"""` heredoc: no escaping needed for quotes, backslashes, or special chars
- Triple quotes (`"""`) inside content: not supported — avoid in prompt text
- Balanced braces required inside `!{...}` blocks

## Transform Rules (for build.js)

1. Strip all HTML comments from source content
2. Collapse triple+ newlines to double
3. Trim leading/trailing whitespace
4. Wrap in TOML structure:
   ```
   # AUTO-GENERATED — source: framwork/.codeadd/commands/{name}.md
   description = "{description}"
   prompt = """
   {content}
   """
   ```
5. Output extension: `.toml`

---
name: add-token-efficiency
description: Use when creating commands, skills, or docs — defines generic compression patterns (minified JSON, abbreviations, glob patterns, single breaks). Load before any write where token density matters.
---

# Token Efficiency

## Overview

Every token counts. Resources must be compressed without losing clarity. This skill defines mandatory compression patterns for all ADD outputs (commands, skills, scripts, docs).

For doc-specific concerns (schemas, depth floors, output-length doctrine, validation gate), see `{{skill:add-doc-schemas/SKILL.md}}`. Output length is governed there — this skill covers compression *patterns* only.

## When NOT to use

- Output-length decisions (word/char caps, depth floors) → use `{{skill:add-doc-schemas/SKILL.md}}`
- CLAUDE.md style and content rules → use `{{skill:add-claude-md-style/SKILL.md}}`
- ID format / branch naming → use `{{skill:add-id-convention/SKILL.md}}`

---

## Mandatory Patterns

### 1. JSON Specs (Always Minified)

```markdown
# BAD - 156 chars
```json
{
  "type": "command",
  "trigger": "slash",
  "structure": "phases"
}
```

# GOOD - 48 chars
{"type":"cmd","trigger":"slash","structure":"phases"}
```

### 2. JSON = DATA. Markdown = INSTRUCTIONS.

JSON minified is exclusively for **data the agent looks up**: configs, specs, tech stack, path mappings, key-value pairs. Everything that orients behavior — rules, instructions, guidance, constraints, conventions — uses **markdown** (lists, tables, prose).

**Minified JSON — structured data:**
- Tech stack (`{"pkg":"npm","build":"turbo","lang":"typescript"}`)
- Path mappings (`{"domain":"libs/domain/src","api":"apps/backend/src"}`)
- Config values, detection rules, routing tables

**Markdown — rules, instructions, orientation:**
- Dependency rules, import constraints
- Behavioral guidance (do/dont, always/never)
- Architecture hierarchy and layer rules
- Naming conventions, placement rules
- Checklists, sequential steps

```markdown
# ❌ WRONG — rule inside JSON
{"hierarchy":"domain → backend → apps","rule":"inner never imports outer"}

# ✅ RIGHT — rule as markdown
domain → backend → apps. Inner never imports outer.

# ❌ WRONG — instruction inside JSON
{"note":"Use pattern-search.sh for JIT loading"}

# ✅ RIGHT — instruction as markdown
Use pattern-search.sh for JIT loading.

# ❌ WRONG — placement guidance as JSON
{"Entities":"libs/domain/src/entities","Repos":"libs/app-database/src/repositories"}

# ✅ RIGHT — placement as table (behavioral orientation)
| What | Where |
|---|---|
| Entities | libs/domain/src/entities |
| Repos | libs/app-database/src/repositories |

# ✅ CORRECT — data as JSON
{"pkg":"npm","build":"turbo","lang":"typescript"}
{"backend":{"framework":"NestJS","version":"10"}}
```

**Test:** "Is this something the agent looks up, or something the agent must follow?" Look up → JSON. Follow → markdown.

### 3. Glob Patterns

```markdown
# BAD
- .claude/commands/feature.md
- .claude/commands/plan.md
- .claude/commands/dev.md

# GOOD
.claude/commands/*.md
```

### 4. No Decorative Formatting

BAD: `────────` dividers wrapping `## Section Title`. GOOD: bare `## Section Title`.

### 5. Reference, Never Repeat

```markdown
# BAD (repeating workflow in 3 places)
Phase 1: Detect → Gather → Execute
[same content in Phase 2 intro]
[same content in summary]

# GOOD
Workflow: detect→gather→execute (see Phase 1)
```

### 6. Abbreviations (Use Consistently)

{"abbrev_table":{"command":"cmd","skill":"sk","script":"sc","config":"cfg","dependency":"dep","required":"req","optional":"opt","description":"desc","implementation":"impl","reference":"ref"}}

### 7. Single Line Breaks Only

```markdown
# BAD


## Section


Content here


# GOOD
## Section
Content here
```

### 8. Compress Examples

```markdown
# BAD (42 words)
**Example Scenario:** When the user asks you to create
a new feature, you should first analyze the request,
then understand the requirements, and finally...

# GOOD (15 words)
User: "create feature X"
Agent: analyze→understand→design→implement
```

---

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Verbose explanations | Compress to dense bullets |
| Repeated concepts | Reference first occurrence |
| Decorative formatting | Remove ASCII art, excessive dashes |
| Full words | Use abbrev table |
| Inline examples (large blocks) | Move to separate file |
| Redundant headers | Merge related sections |
| Tables in resources | JSON for data, tables only in final output |
| JSON for instructions | Use markdown lists for do/dont/rules |
| Length caps | Never publish `<N words` / `<N chars` on agent-generated content; output length is governed by depth floors in add-doc-schemas |

---

## Validation Checklist

Before finalizing ANY resource:

```
[ ] JSON specs minified?
[ ] JSON for data, markdown lists for instructions?
[ ] Tables only in final output to user?
[ ] Paths use glob patterns?
[ ] No decorative formatting?
[ ] Abbreviations applied?
[ ] Single line breaks?
[ ] Examples compressed?
[ ] No repeated content?
```

---

> **Output length is NOT governed here.** Numeric caps on agent-generated content (`<N words`, `<N chars`, `~N-N words`) are prohibited per `{{skill:add-doc-schemas/SKILL.md}}`. Use depth floors and density.

---

## Cross-references

- `{{skill:add-doc-schemas/SKILL.md}}` — **authority on output length and doc structure** (depth floors, density, validation gate, schemas by category). This skill covers compression *patterns* only; length is governed there.
- `{{skill:add-claude-md-style/SKILL.md}}` — CLAUDE.md generation rules
- `{{doc:PRD0009}}` — Documentation Context Engineering PRD
- `{{doc:PRD0019}}` — Documentation Standards Refactor (length-cap removal, schemas by category)

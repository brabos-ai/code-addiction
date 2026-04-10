---
name: add-token-efficiency
description: Use when creating commands, skills, or docs — defines generic compression patterns (minified JSON, abbreviations, glob patterns, single breaks). Load before any write where token density matters.
---

# Token Efficiency

## Overview

Every token counts. Resources must be compressed without losing clarity. This skill defines mandatory compression patterns for all ADD outputs (commands, skills, scripts, docs).

For doc-specific concerns (schemas, word caps per section, zone budgets, validation gate), see `{{skill:add-doc-schemas/SKILL.md}}`.

## Spec

{"abbrev":{"cmd":"command","sk":"skill","sc":"script","cfg":"config","dep":"dependency","req":"required","opt":"optional","desc":"description","impl":"implementation","ref":"reference","doc":"documentation","fn":"function","param":"parameter","ret":"return","err":"error","msg":"message","ctx":"context","val":"value","obj":"object","arr":"array","str":"string","num":"number","bool":"boolean"},"targets":{"skill_core":"<200 words","skill_ref":"<500 words","cmd":"<300 words core","changelog":"<150 words"},"compression":{"structured_data":"JSON minificado","human_instructions":"markdown lists (do/dont/rules)","tables":"APENAS output final","json":"minified, no spaces","code":"no decorative comments","paths":"glob patterns","examples":"1 excellent > 3 mediocre"}}

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

```markdown
# BAD
────────────────────────
## Section Title
────────────────────────

# GOOD
## Section Title
```

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

{"verbose_explanations":"compress to 1-2 sentences","repeated_concepts":"reference first occurrence","decorative_formatting":"remove ASCII art, excessive dashes","full_words":"use abbrev table","inline_examples":">5 lines = separate file","redundant_headers":"merge related sections","tables_in_resources":"JSON para dados, tabelas só em output final","json_for_instructions":"use markdown lists para do/dont/rules"}

---

## Validation Checklist

Before finalizing ANY resource:

```
[ ] JSON specs minified?
[ ] JSON para dados, markdown lists para instruções?
[ ] Tabelas só em output final ao usuário?
[ ] Paths use glob patterns?
[ ] No decorative formatting?
[ ] Abbreviations applied?
[ ] Single line breaks?
[ ] Examples compressed?
[ ] No repeated content?
```

---

## Word Count Targets

{"targets":{"skill_core":"<200","skill_max":"<500","cmd_core":"<300","cmd_max":"<500","changelog_core":"<100","changelog_max":"<150","script_header":"<50-100"}}

---

## Quick Compression Reference

{"text":"max 20 words/item, 100 words/paragraph","code":"inline if <10 lines, file if >10","json":"minified, para dados estruturados","instructions":"markdown lists para do/dont/rules","tables":"APENAS output final","examples":"1 per concept","headers":"no emojis","paths":"glob > explicit list"}

---

## Cross-references

- `{{skill:add-doc-schemas/SKILL.md}}` — schemas, word caps, zone budgets, validation gate (authority for all doc structure)
- `{{skill:add-claude-md-style/SKILL.md}}` — CLAUDE.md generation rules
- `{{doc:PRD0009}}` — Documentation Context Engineering PRD

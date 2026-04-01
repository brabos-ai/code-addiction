---
name: add-framework-development
description: "Internal skill for developing ADD framework artefacts (commands, skills, agents, scripts). Use when add.strategy analyzes viability of new framework features, when add.make implements framework artefacts, or when creating/modifying commands, skills, or agents. Always use this skill before proposing or implementing changes to the framework itself."
---

# Framework Development — Internal Reference

Operational knowledge for creating and modifying ADD framework artefacts. This skill is NOT distributed to users — it exists to ensure add.strategy can assess technical viability and add.make can implement correctly.

## Artefact Types

| Type | Source path | Format | Count |
|------|------------|--------|-------|
| Command | `framwork/.codeadd/commands/{name}.md` | Markdown with structured sections | 21 |
| Skill | `framwork/.codeadd/skills/{name}/SKILL.md` | Markdown with YAML frontmatter | 34 |
| Agent | `framwork/.codeadd/agents/{name}-agent.md` | Markdown with YAML frontmatter | 8 |
| Script | `framwork/.codeadd/scripts/{name}.sh` | Bash | variable |

Internal-only artefacts (NOT distributed): `.claude/skills/`, `.claude/commands/`

---

## 1. Command Structure

Commands are workflow orchestrators. They load skills, dispatch agents, enforce gates, and produce documents.

### Anatomy

```markdown
# [Command Title]

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

[One-line description]

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

STEP 1: [Action]    → [What happens]
STEP 2: [Action]    → [What happens]

## STEP 1: [Title]
### 1.1: [Subsection]

**GATE: [gate_name]** - MANDATORY before [condition]
**GATE CHECK:** [what must be true?] IF NO -> STOP.

**DISPATCH AGENT: @[agent-name]**
**WAIT:** [condition before continuing]

## Rules
ALWAYS:
- [imperative]
NEVER:
- [prohibition]
```

### Key Elements

**Frontmatter** — `> **KEY:** value` format (not YAML):
- `LANG`, `OWNER`, `ARCHITECTURE REFERENCE`, `DOCS`, `MODE`

**Tool Prohibitions** — `⛔⛔⛔ ABSOLUTE PROHIBITIONS` block:
```
⛔ DO NOT USE: [tool] for [context]
✅ DO: [correct alternative]
```

**Gates** — Named checkpoints that block execution:
- `**GATE: feature_identified**` — named gate
- `**GATE CHECK:** [condition]? IF NO -> STOP.` — inline check

**Subagent Dispatch** — Named agents with fallback:
```markdown
| Area | Named Agent | Fallback |
|------|-------------|----------|
| Database | @database-agent | Generic subagent + skill add-database-development |

**DISPATCH AGENT: @database-agent**
Prompt: [full prompt with ${FEATURE_ID}, output path, format template]
```

**Wait Points** — `**WAIT:** [condition]` blocks execution until artifact exists.

**Output Paths** — Always use `${FEATURE_ID}` variable:
- `docs/features/${FEATURE_ID}/plan.md`
- `docs/features/${FEATURE_ID}/design.md`
- Temp files: `plan-database.md`, `plan-backend.md`, etc.

**Yolo Mode** (optional) — `--yolo` flag skips all STOP points and gates.

**Completion** — Always reference `add-ecosystem` skill for next steps.

---

## 2. Skill Structure

Skills are knowledge packs loaded into context. They teach patterns, not execute workflows.

### Anatomy

```yaml
---
name: add-[kebab-case]        # REQUIRED, matches directory name
description: "Use when..."    # REQUIRED, action-verb trigger phrase
category: [meta|technique|reference|discipline]  # optional
---
```

```markdown
# [skill-name] — [Subtitle]

## When to Use
- [specific scenario 1]
- [specific scenario 2]

## When NOT to Use
- **[anti-pattern]** → use `/add.[other]` instead

## [Content Sections]

## Common Rationalizations (BLOCKED)
| Excuse | Reality |
|--------|---------|
| "[excuse]" | [why it's wrong] |
```

### Tiers

| Tier | Lines | Structure | Example |
|------|-------|-----------|---------|
| 1 (simple) | <100 | Single SKILL.md, basic sections | add-commit |
| 2 (medium) | 100-300 | JSON spec blocks, templates, checklists | add-planning |
| 3 (complex) | 300+ | SKILL.md dispatcher + reference subdocs | add-ux-design |

**Tier 3 modular pattern:**
```
add-ux-design/
  SKILL.md              ← dispatcher/index
  design-direction.md   ← concept doc
  ux-laws-principles.md ← reference doc
  shadcn-docs.md        ← library reference
```

### Conventions

- **Structured data:** Inline JSON `{"key":"value"}` for lookup tables, checklists, scoring
- **Anti-rationalization:** Tables with `Excuse | Reality` columns
- **Enforcement:** `⚠️ REGRA OBRIGATÓRIA`, `NEVER/MUST`, `**OBRIGATÓRIO**`
- **Cross-references:** `{{skill:add-[name]/[file]}}` for files, `/add.[name]` for commands
- **Token efficiency:** JSON minified, max 10 words per description, no decorative formatting

---

## 3. Agent Structure

Agents are specialized subagents with preloaded skills, tool restrictions, and persistent memory. Claude Code native feature.

### Anatomy

```yaml
---
name: [name]-agent
description: [1-2 sentences — what it does + when Claude should use it]
model: [inherit|sonnet|haiku|opus]
tools: [comma-separated tool list]
disallowedTools: [tools to deny]
skills:
  - add-[skill-1]
  - add-[skill-2]
memory: project
---

[System prompt — body becomes the agent's instructions]
[Include domain knowledge, patterns, output format expectations]
```

### Frontmatter Fields

| Field | Required | Values |
|-------|----------|--------|
| name | yes | `[name]-agent` (kebab-case) |
| description | yes | Trigger phrase — "use proactively" encourages auto-delegation |
| model | no | `inherit` (full reasoning), `sonnet` (balanced), `haiku` (fast/cheap) |
| tools | no | Allowlist: `Read, Glob, Grep, Bash, Write, Edit` |
| disallowedTools | no | Denylist: `Write, Edit, NotebookEdit` for read-only agents |
| skills | no | Array of skill names to preload into context |
| memory | no | `project` (`.claude/agent-memory/`), `user`, `local` |
| maxTurns | no | Limit agentic turns |
| permissionMode | no | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| hooks | no | Lifecycle hooks scoped to agent |
| mcpServers | no | MCP servers (inline or reference) |
| background | no | `true` to always run as background task |
| effort | no | `low`, `medium`, `high`, `max` |
| isolation | no | `worktree` for isolated git worktree |

### Constraints

- Agents CANNOT spawn other agents (leaf nodes only)
- Commands orchestrate; agents execute and return
- Agents don't inherit parent's skills — only what's in their `skills:` field
- Agent source filename: `{name}-agent.md`

### Design Guidelines

| Need | Model | Tools | Memory |
|------|-------|-------|--------|
| Exploration/discovery | haiku | Read-only | project |
| Code review/audit | sonnet | Read-only | project |
| Implementation | inherit | All | project |
| Architecture decisions | inherit | Read-only | project |
| Design proposals | sonnet | Read/Write | project |

---

## 4. Build Pipeline

### Why provider-map.json Governs Everything

The framework is distributed to **15 providers** (Claude, Codex, Gemini, Copilot, Cursor, Kiro, etc.). Each provider has different directory structures, file formats, and capabilities. A single source file in `.codeadd/` must produce correct output for ALL providers.

**Every decision when writing commands, skills, or agents must consider:**
1. Will the file paths resolve correctly across providers? (use `{{cmd:}}` / `{{skill:}}` variables)
2. Does this feature depend on a capability not all providers have? (check `capabilities`)
3. Will the format transform correctly? (md → toml for Gemini)

**provider-map.json is the single source of truth** — it determines where files go, how they're transformed, and what capabilities are available.

### Source → Provider Installation

```
framwork/.codeadd/          ← SOURCE OF TRUTH (you write here)
  ├── agents/               ← agent definitions
  ├── commands/             ← command definitions
  ├── skills/               ← skill modules
  └── scripts/              ← bash scripts

     ↓ node scripts/build.js (reads provider-map.json)
     ↓ per provider: lint → strip comments → resolve paths → transform format → write

framwork/.claude/           ← Claude Code output
framwork/.agents/           ← OpenAI Codex output
framwork/.gemini/           ← Gemini CLI output (TOML!)
framwork/.github/           ← GitHub Copilot output
[... 15 providers total]
```

### provider-map.json Structure

```json
{
  "providers": {
    "claude": {
      "dir": "framwork/.claude",
      "commands": "commands/{name}.md",      // ← output pattern for commands
      "skills": "skills/{name}/SKILL.md",    // ← output pattern for skills
      "agents": "agents/{name}.md",          // ← output pattern for agents (null if unsupported)
      "capabilities": {
        "hooks": true,          // lifecycle hooks support
        "agentDispatch": true,  // can dispatch subagents
        "mcp": true,            // Model Context Protocol
        "nativeFormat": "md",   // file format (md or toml)
        "slashCommands": true   // supports / commands
      }
    }
  },
  "commands": { "add.build": { "description": "..." } },  // registry
  "skills":   { "add-backend-development": {} },           // registry
  "agents":   { "backend-agent": { "description": "..." }} // registry
}
```

### How Output Paths Vary Per Provider

The same command gets installed to DIFFERENT paths depending on the provider:

| Provider | Commands pattern | Skills pattern | Agents pattern |
|----------|-----------------|----------------|----------------|
| Claude | `commands/{name}.md` | `skills/{name}/SKILL.md` | `agents/{name}.md` |
| Codex | `skills/{name}/SKILL.md` | `skills/{name}/SKILL.md` | — |
| Antigrav | `skills/{name}/SKILL.md` | `skills/{name}/SKILL.md` | — |
| KiloCode | `workflows/{name}.md` | `skills/{name}/SKILL.md` | — |
| Copilot | `agents/{name}.md` | `skills/{name}/SKILL.md` | — |
| Gemini | `commands/{name}.toml` | `skills/{name}/SKILL.md` | — |
| Kiro | `prompts/{name}.md` | `skills/{name}/SKILL.md` | — |
| Windsurf | `workflows/{name}.md` | `skills/{name}/SKILL.md` | — |

**When `agents` is null** → provider doesn't support agents → build.js skips agent installation for that provider.

### Format Transformers

Build.js transforms content based on `capabilities.nativeFormat`:

**`md` transformer** (most providers): Wraps content with YAML frontmatter:
```yaml
---
description: [from provider-map.json]
---
[original content]
```

If the output path contains `SKILL.md` (e.g., Codex commands → `skills/{name}/SKILL.md`), adds `name:` field:
```yaml
---
name: add.build
description: Development execution specialist...
---
```

**`toml` transformer** (Gemini only): Wraps content in TOML format:
```toml
# AUTO-GENERATED - source: framwork/.codeadd/commands/add.build.md
description = "Development execution specialist..."
prompt = """
[original content]
"""
```

**Agent passthrough**: Agents keep their own frontmatter (name, model, tools, skills, memory) — no wrapping applied.

### Resource Path Variables — When and How to Use

**The problem:** You write a command that references another command or skill. If you hardcode `.claude/commands/add.plan.md`, it breaks for Codex (which puts commands in `.agents/skills/add.plan/SKILL.md`).

**The solution:** Build-time variables that resolve per provider.

#### `{{cmd:NAME}}` — Reference a command

```markdown
<!-- IN YOUR SOURCE FILE (.codeadd/commands/add.build.md): -->
Read {{cmd:add.plan}} for the technical plan.

<!-- AFTER BUILD for Claude: -->
Read .claude/commands/add.plan.md for the technical plan.

<!-- AFTER BUILD for Codex: -->
Read .agents/skills/add.plan/SKILL.md for the technical plan.

<!-- AFTER BUILD for Gemini: -->
Read .gemini/commands/add.plan.toml for the technical plan.
```

#### `{{skill:NAME/FILE}}` — Reference a skill file

```markdown
<!-- IN YOUR SOURCE FILE: -->
Load {{skill:add-backend-development/SKILL.md}} before implementation.

<!-- AFTER BUILD for Claude: -->
Load .claude/skills/add-backend-development/SKILL.md before implementation.

<!-- AFTER BUILD for Copilot: -->
Load .github/skills/add-backend-development/SKILL.md before implementation.
```

#### Scripts — NO variable needed

Scripts live at `.codeadd/scripts/` and this path is the same for all providers:
```markdown
bash .codeadd/scripts/status.sh
```

### Provider Capabilities — What to Check When Writing Commands

Not all providers support all features. When a command uses a capability, it MUST consider providers that lack it:

| Capability | Providers WITHOUT it | Impact on commands |
|-----------|---------------------|-------------------|
| `agentDispatch` | Gemini, Shai, Windsurf | Cannot dispatch subagents — commands that dispatch `@agents` won't work |
| `hooks` | Antigrav, KiloCode, Bob, Qwen, Shai, Windsurf | No lifecycle hooks — pre/post tool hooks unavailable |
| `mcp` | Gemini | No MCP servers — agents with `mcpServers:` won't connect |
| `slashCommands` | Codex, Bob, Copilot | No `/command` invocation — must use natural language |

**When writing a command that dispatches agents:**
- The command works on providers with `agentDispatch: true`
- On providers without it, the command's content still loads but subagent dispatches will be ignored by the runtime
- Always include fallback guidance: "If agent dispatch is unavailable, execute inline"

### Build Process Step by Step (`scripts/build.js`)

1. **`readMap()`** — loads `framwork/provider-map.json`
2. **For each resource** (command/skill/agent):
   a. **Read source** from `.codeadd/`
   b. **`lintResourcePaths()`** — warns if raw `.codeadd/commands/` or `.codeadd/skills/` paths found (should use `{{cmd:}}` / `{{skill:}}`)
   c. **`stripHtmlComments()`** — removes `<!-- -->` comments + collapses blank lines (token savings)
   d. **`resolveResourcePaths()`** — replaces `{{cmd:NAME}}` and `{{skill:NAME/FILE}}` for each provider
   e. **Transform** — applies `md` or `toml` transformer based on provider's `nativeFormat`
   f. **Write** — outputs to provider directory
   g. **`postWrite`** — for skills: copies extra subdocs (reference files, scripts, etc.)

### Registering New Artefacts

**Every new command, skill, or agent MUST be registered in provider-map.json:**

```json
// New command:
"commands": { "add.mycommand": { "description": "What it does in one line" } }

// New skill:
"skills": { "add-my-skill": {} }

// New agent:
"agents": { "my-agent": { "description": "What it does in one line" } }
```

If not registered, `build.js` won't process the file and it won't be distributed to any provider.

### Selective Provider Distribution

By default, artefacts go to ALL providers. To restrict to specific providers, add a `providers` array:

```json
"commands": {
  "add.mycommand": {
    "description": "...",
    "providers": ["claude", "codex", "cursor"]  // only these 3
  }
}
```

### Pre-Build Validation Checklist

- [ ] No raw `.codeadd/commands/` references outside code blocks (use `{{cmd:NAME}}`)
- [ ] No raw `.codeadd/skills/` references outside code blocks (use `{{skill:NAME/FILE}}`)
- [ ] Script paths use `.codeadd/scripts/` literal (no variable needed)
- [ ] New artefact registered in `provider-map.json` (commands/skills/agents section)
- [ ] Command/skill names match `provider-map.json` keys exactly
- [ ] Skill directory names include `add-` prefix
- [ ] Agent filenames follow `{name}-agent.md` pattern
- [ ] If command dispatches agents: provider capability check considered
- [ ] HTML comments `<!-- -->` used for build-only notes (stripped from output)
- [ ] Run `node scripts/build.js` to verify no LINT warnings

---

## 5. Creating New Artefacts

### New Command

1. Create `framwork/.codeadd/commands/{name}.md` following command anatomy
2. Register in `framwork/provider-map.json` → `commands` section
3. Run `node scripts/build.js` to distribute
4. Update `add-ecosystem` skill with new command entry

### New Skill

1. Create `framwork/.codeadd/skills/{name}/SKILL.md` following skill anatomy
2. For Tier 3: add reference subdocs in same directory
3. Register in `framwork/provider-map.json` → `skills` section
4. Run `node scripts/build.js` to distribute
5. Update `add-ecosystem` skill with new skill entry

### New Agent

1. Create `framwork/.codeadd/agents/{name}-agent.md` following agent anatomy
2. Register in `framwork/provider-map.json` → `agents` section
3. Run `node scripts/build.js` to distribute
4. Update `add-ecosystem` skill with new agent entry
5. Update commands that should dispatch this agent (add `@{name}-agent` to dispatch table)

### Internal-Only Artefact

1. Create directly in `.claude/skills/{name}/SKILL.md` or `.claude/commands/{name}.md`
2. Do NOT register in provider-map.json
3. Do NOT add to framwork/.codeadd/
4. These are NOT distributed by build.js

---

## 6. Patterns to Enforce

### Token Efficiency

- JSON minified for structured data
- Max 10 words per description in technical specs
- No decorative formatting (ASCII art, excessive dashes)
- Reference don't repeat — use `{{skill:}}` syntax
- Compress examples (1 excellent > 3 mediocre)

### Anti-Rationalization

Every command/skill that controls agent behavior MUST include:
- Explicit tool prohibitions (`⛔ DO NOT USE:`)
- Gate checks that block progression
- "Common Rationalizations (BLOCKED)" table for complex skills
- NEVER/ALWAYS rules section

### Documentation Style Cache

Skills that produce documents MUST use the cache technique:
Read → Identify existing content → Preserve → Complement → Update metadata
NEVER recreate a document — always extend.

### Named Agent Dispatch (in commands)

Always include fallback for when agent is not installed:
```markdown
| Area | Named Agent | Fallback |
|------|-------------|----------|
| [area] | @[name]-agent | Generic subagent + skill add-[area]-development |
```

# Agent Dispatch Pattern

Commands that orchestrate multiple subagents MUST use intent-based dispatch instead of provider-specific syntax. This ensures portability across agent engines (Claude Code, Kilocode, OpenCode).

## Why Intent-Based Dispatch

Provider-specific dispatch (`Task()`, `subagent_type: "Explore"`, `model: "sonnet"`) creates:
1. **Coupling** to a single engine's API
2. **Capability bugs** (e.g., dispatching read-only agents for tasks that need to write files)
3. **Zero portability** across different agent engines

## Vocabulary

### Capability Levels

| Capability | Meaning | When to use |
|------------|---------|-------------|
| `read-only` | Search, read, analyze. Returns text to coordinator | Discovery, analysis, exploration |
| `read-write` | Can search, read, create and edit files | Generate reports, create plans, write docs |
| `full-access` | Includes terminal/bash execution | Build, test, deploy, scripts |

### Complexity Hints

| Hint | Meaning | When to use |
|------|---------|-------------|
| `light` | Simple, fast task | Quick search, short analysis |
| `standard` | Medium task | Implementation, review |
| `heavy` | Complex, long task | Planning, multi-file implementation |

### Execution Modes

| Mode | Meaning |
|------|---------|
| `parallel` | Dispatch multiple agents simultaneously |
| `sequential` | Wait for completion before dispatching next |
| `wait-all` | Wait for ALL parallel agents before proceeding |

## Dispatch Block Pattern

Use this pattern when a command needs to dispatch a subagent:

```markdown
**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Output:** Write `path/to/output.md`
- **Prompt:** [prompt content or skill reference]

⛔ DO NOT proceed until agent output file exists.
```

## Parallel Dispatch Pattern

Use this pattern when dispatching multiple independent agents:

```markdown
**DISPATCH N AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

1. **Agent Name** [capability, complexity]
   - **Output:** Write `path/to/output-1.md`
   - **Prompt:** [prompt or skill reference]

2. **Agent Name** [capability, complexity]
   - **Output:** Write `path/to/output-2.md`
   - **Prompt:** [prompt or skill reference]

**WAIT-ALL before proceeding to STEP N.**
```

## Wait/Verify Pattern

Use this pattern instead of provider-specific verification:

```markdown
**WAIT-ALL:** Verify ALL agent outputs exist before proceeding.
- [ ] `output-1.md` exists and contains mandatory sections
- [ ] `output-2.md` exists
- [ ] `output-3.md` exists

⛔ GATE CHECK: All outputs exist?
- If NO → Wait. Do NOT proceed.
- If YES → Proceed to STEP N.
```

## Agent Dispatch Rules (Include in Commands with Subagents)

Commands that dispatch subagents MUST include this instruction block:

```markdown
## Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. If your engine supports parallel dispatch and mode is `parallel`, dispatch all simultaneously
5. Verify output exists before proceeding past any WAIT or GATE CHECK

You are the coordinator. You know your engine's capabilities. Map the intent to the best available mechanism.
```

## Common Dispatch Mistakes

| Mistake | Fix |
|---------|-----|
| `subagent_type: "Explore"` for tasks that write files | Use `read-write` capability — engine picks the right type |
| `model: "sonnet"` hardcoded | Use complexity hint (`light`, `standard`, `heavy`) |
| `Task({...})` syntax in command | Use `DISPATCH AGENT` block with capability + complexity |
| `TaskOutput` for verification | Use `WAIT-ALL` with file existence checklist |
| `run_in_background: true` | Use execution mode `parallel` |

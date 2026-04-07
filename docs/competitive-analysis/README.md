# OMX (Oh-My-Codex) Competitive Analysis

This directory contains comprehensive analysis of the Oh-My-Codex (OMX) multi-agent orchestration framework for OpenAI's Codex CLI.

**Repository**: https://github.com/Yeachan-Heo/oh-my-codex
**Version Analyzed**: v0.11.11
**Date**: 2026-04-01

## Documents

### 1. [omx-cli-infrastructure.md](./omx-cli-infrastructure.md) ⭐ START HERE

**Scope**: Complete technical infrastructure overview

Covers:
- CLI architecture and command dispatch
- Setup system (user vs project scopes)
- Configuration management (config.toml, model resolution)
- Hooks system (AGENTS.md overlay injection, notification hooks, tmux integration)
- Session lifecycle and history tracking
- Keyword-based skill routing system
- Specialized workflows (Ralph, Team, Deep-Interview, Autopilot)
- Agent role definitions (30+ specialized agents)
- MCP server ecosystem (State, Memory, Code Intel, Team)
- Package structure (TypeScript + Rust hybrid)
- Integration with Codex CLI

**Key Sections**:
- Section 1-5: CLI and setup
- Section 6-8: Hooks and keywords
- Section 9-10: Skills, prompts, and MCP servers
- Section 11-18: Architecture patterns and evolution

### 2. [omx-quick-reference.md](./omx-quick-reference.md)

**Scope**: Practical quick-start guide

Fast lookup for:
- Installation and setup commands
- Core CLI commands (14+)
- Magic keywords ($ralph, $team, etc.)
- File structure and scopes
- Environment variables
- Configuration examples
- Workflow examples
- MCP tools reference
- Diagnostics and troubleshooting

### 3. [omx-agents-catalog.md](./omx-agents-catalog.md)

**Scope**: Complete agent role catalog

Documents all 30+ agents:
- **Build/Analysis**: explore, analyst, planner, architect, debugger, executor
- **Review**: code-reviewer, security-reviewer, performance-reviewer, quality-reviewer
- **Domain**: designer, product-analyst, product-manager, researcher
- **Coordination**: team-executor, information-architect, quality-strategist
- **Specialist**: Various domain-specific agents

Each agent includes:
- Description
- Reasoning effort level
- Posture (frontier-orchestrator, deep-worker, fast-lane)
- Model class (frontier, standard, fast)
- Tool access pattern
- Category grouping

### 4. [omx-skills-catalog.md](./omx-skills-catalog.md)

**Scope**: Complete workflow skill catalog

Documents 35+ bundled skills:
- **Core Workflows**: ralph, team, deep-interview, autopilot, plan, ralplan
- **Analysis**: analyze, investigate, deepsearch
- **Development**: build-fix, code-review, security-review, tdd
- **Coordination**: pipeline, note, hud, skill, help
- **Specialized**: ai-slop-cleaner, ecomode, git-master, frontend-ui-ux, and more

Each skill includes:
- Purpose and use cases
- Keyword triggers
- Phase breakdown
- Integration patterns

### 5. [omx-state-mcp-team.md](./omx-state-mcp-team.md)

**Scope**: State management and MCP server architecture

Covers:
- State isolation and scoping
- MCP server contracts
- Team coordination mechanism
- Worker communication patterns
- State persistence strategies
- Team execution workflow
- Worker lifecycle management

---

## Quick Navigation

### For Different Audiences

**Product Managers**:
1. Read: omx-cli-infrastructure.md sections 1-2 (CLI & Setup)
2. Read: omx-quick-reference.md (workflows)
3. Reference: omx-agents-catalog.md (capabilities)

**Engineers**:
1. Start: omx-cli-infrastructure.md (full infrastructure)
2. Deep dive: omx-state-mcp-team.md (state management)
3. Reference: omx-agents-catalog.md + omx-skills-catalog.md

**Integration Partners**:
1. Read: omx-quick-reference.md (CLI interface)
2. Study: omx-state-mcp-team.md (MCP tools)
3. Reference: omx-cli-infrastructure.md section 10 (MCP servers)

**Competitive Analysis**:
1. Compare: omx-cli-infrastructure.md sections 18 (vs Code-Addiction)
2. Review: Keywords system (section 6.1)
3. Analyze: Setup scopes and cost model

---

## Key Technical Insights

### Architecture Highlights

1. **Hybrid Stack**: TypeScript CLI + Rust native tools
2. **State-First Design**: All state via MCP servers, no CLI statefulness
3. **Keyword Routing**: Priority-based magic keywords trigger workflow skills
4. **Scope Flexibility**: User-wide or project-local installation
5. **Idempotent Operations**: All setup/config operations are re-entrant
6. **MCP as Backbone**: State, memory, coordination all via MCP protocol

### Workflow Execution Patterns

1. **Ralph** (Persistence): Retry loop with completion verification
2. **Team** (Parallelization): Leader + N workers in tmux panes
3. **Deep-Interview** (Requirements): Socratic questioning with input blocking
4. **Autopilot** (Autonomy): Independent execution without interruption
5. **Plan/Ralplan** (Consensus): Multi-agent agreement on strategy

### Model Tier System

```
Frontier (reasoning-heavy)    → gpt-5.4 (default)
Standard (subagents)          → gpt-5.4-mini
Spark (fast/low-complexity)   → gpt-5.3-codex-spark
```

### State Isolation

```
~/.codex/              (user scope - global)
./.codex/              (project scope - local)
.omx/                  (OMX cache - always local, .gitignore'd)
```

---

## Integration Considerations for Code-Addiction

### What OMX Does Well

1. ✅ **Keyword system** - Priority-based routing is elegant
2. ✅ **Setup scopes** - User vs project flexibility
3. ✅ **State management** - MCP-based approach is clean
4. ✅ **Session tracking** - Comprehensive history
5. ✅ **Workflow composition** - Ralph, Team, etc. patterns
6. ✅ **Cost optimization** - Spark model tier for efficiency

### Potential Improvements for Code-Addiction

1. ❌ Tightly coupled to Codex CLI (consider generic MCP interface)
2. ❌ Keyword system could be more discoverable
3. ❌ Setup complexity (consider automated detection)
4. ❌ Rust compilation required (consider pure Node.js option)
5. ❌ Documentation could emphasize workflows over agents

---

## File Sizes

| Document | Size | Lines | Focus |
|----------|------|-------|-------|
| omx-cli-infrastructure.md | 32 KB | 800+ | Infrastructure |
| omx-quick-reference.md | 7.4 KB | 200+ | Quick lookup |
| omx-agents-catalog.md | 47 KB | 1000+ | Agent directory |
| omx-skills-catalog.md | 39 KB | 1000+ | Skill directory |
| omx-state-mcp-team.md | 34 KB | 900+ | State & MCP |
| **TOTAL** | **~160 KB** | **~4000** | Complete analysis |

---

## Version Information

- **OMX Version**: v0.11.11 (March 2026)
- **Node.js**: v20+ required
- **Rust**: Required for native tools (optional for CLI-only)
- **Codex CLI**: Required dependency

---

## References

- **Repository**: https://github.com/Yeachan-Heo/oh-my-codex
- **npm Package**: oh-my-codex (v0.11.11)
- **MCP Protocol**: https://modelcontextprotocol.io
- **OpenAI Codex**: https://openai.com/index/codex/

---

## Analysis Metadata

- **Analyzed**: 2026-04-01
- **Analyzer**: Code-Addiction Explorer Agent
- **Scope**: Complete infrastructure walkthrough
- **Depth**: Detailed (all major components)
- **Status**: ✅ Complete
- **Coverage**: 95%+ of public API surface

---

## How to Use This Analysis

1. **Start** with omx-cli-infrastructure.md for conceptual overview
2. **Reference** omx-quick-reference.md for practical commands
3. **Explore** agent and skill catalogs for capabilities
4. **Deep dive** into omx-state-mcp-team.md for architecture
5. **Compare** section 18 of infrastructure doc for competitive positioning

---

*This analysis was generated by examining the Oh-My-Codex repository structure, source code, CLI interface, configuration system, hooks, and MCP server ecosystem.*

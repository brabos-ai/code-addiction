# Competitive Analysis: Agent Orchestration Frameworks

This directory contains deep-dive analyses of production agent orchestration systems.

## Documents

### omx-state-mcp-team.md

**Scope**: Oh-My-Codex state management, MCP servers, and team orchestration

**Length**: 1,254 lines | **Status**: Complete

**Key topics**:
- `.omx/` directory structure with multi-scoped state
- Four MCP servers (state, memory, code-intel, team runner)
- Team orchestration phase machine (plan → prd → exec → verify → fix)
- Pipeline architecture with composable stages
- HUD monitoring with real-time status
- Specialized subsystems (explore, sparkshell)
- Notification hook system for scalable updates
- Design patterns and integration points

**Best for understanding**:
- How to structure persistent agent state
- Race-condition safety in concurrent systems
- MCP server provisioning patterns
- Team-based multi-agent coordination
- Filesystem-first architecture
- Post-turn hooks for scalable updates

**Code references**: 30+ source files from oh-my-codex repository

---

## Quick Navigation

### State Management
- Directory structure (page ~50)
- Scope hierarchy (page ~65)
- Mode state structure (page ~75)
- Atomic writes (page ~250)

### MCP Servers
- State server (page ~120)
- Memory server (page ~160)
- Code intelligence server (page ~190)
- Team server (page ~220)
- Trace server (page ~280)

### Team Orchestration
- Architecture overview (page ~330)
- Phase state machine (page ~345)
- Worker architecture (page ~370)
- Communication patterns (page ~390)
- Mailbox system (page ~400)
- Dispatch queue (page ~420)

### Pipeline
- Purpose and stages (page ~480)
- Stage model (page ~495)
- Execution flow (page ~520)
- State persistence (page ~535)

### Monitoring
- HUD overview (page ~570)
- Rendering and presets (page ~600)
- tmux integration (page ~620)

### Notification Hook
- Architecture (page ~720)
- Sub-modules (page ~740)
- Key responsibilities (page ~760)
- Operational events (page ~850)

### Design Patterns
- Scope-aware resolution (page ~880)
- Atomic operations (page ~895)
- Write serialization (page ~910)
- State machines (page ~925)
- Async generators (page ~940)
- CLI tool wrapping (page ~955)
- Authority leasing (page ~970)
- Pluggable hooks (page ~985)

---

## Key Insights

### Architectural Principles

1. **Filesystem is the source of truth** - All state persisted to JSON/JSONL files
2. **Loose coupling** - Subsystems communicate via files + hooks, not direct calls
3. **Type safety** - TypeScript + Zod for validation
4. **Race-condition free** - Atomic writes + per-path serialization
5. **Pluggable** - Stages, modes, servers can be added/extended
6. **Backward compatible** - Scope fallbacks for smooth migrations
7. **Scalable notifications** - Post-turn hook decouples from main execution

### Design Patterns

- **Multi-scoped state**: Session-level + root-level with resolution hierarchy
- **Atomic writes**: Temp file + rename (nearly atomic on most filesystems)
- **Per-path write queues**: No global locks, queue per resource
- **State machines with validation**: TypeScript enums + runtime checks
- **CLI tool wrapping**: Parse stdout instead of embedding language servers
- **Authority leasing**: Prevent stale leaders in distributed coordination
- **Exclusive mode locks**: One mode per category at a time
- **Composable stages**: Pipeline with artifact accumulation

### Technology Stack

- **Language**: TypeScript (with Node.js runtime)
- **Persistence**: JSON/JSONL files (filesystem)
- **IPC**: MCP (Model Context Protocol) stdio servers
- **Session management**: tmux for multi-worker coordination
- **Runtime integration**: Codex CLI notify hook
- **Verification engine**: Ralph (built-in)
- **Code analysis**: CLI wrappers (tsc, ast-grep, ripgrep)

---

## How to Use This Analysis

### For Architecture Design
Read sections: **Executive Summary** → **State Management System** → **Design Patterns & Insights**

### For Building MCP Servers
Read sections: **MCP Servers Architecture** (understand all 5 servers in detail)

### For Team Coordination
Read sections: **Team Orchestration System** (phase machine + worker communication)

### For Pipeline Systems
Read sections: **Pipeline Architecture** (stages + artifact flow)

### For System Integration
Read sections: **Notification Hook System** + **Integration Points**

---

## Related Systems

- **Codex CLI**: https://github.com/anthropics/codex
- **Model Context Protocol**: https://modelcontextprotocol.io
- **oh-my-codex**: https://github.com/brabos-ai/oh-my-codex

---

**Last updated**: 2026-04-01
**Analyzer**: Claude Sonnet 4.6

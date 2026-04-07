# Oh-My-Codex: State Management, MCP Servers & Team Orchestration Analysis

**Date**: 2026-04-01
**Scope**: Analysis of oh-my-codex subsystems for state management, MCP servers, and team orchestration.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [State Management System (.omx/)](#state-management-system)
3. [MCP Servers Architecture](#mcp-servers-architecture)
4. [Team Orchestration System](#team-orchestration-system)
5. [Pipeline Architecture](#pipeline-architecture)
6. [HUD & Monitoring](#hud--monitoring)
7. [Specialized Subsystems (explore, sparkshell)](#specialized-subsystems)
8. [Notification Hook System](#notification-hook-system)
9. [Design Patterns & Insights](#design-patterns--insights)

---

## Executive Summary

Oh-My-Codex (OMX) is a sophisticated agent orchestration framework built on top of Codex CLI. It implements:

- **Multi-scoped state management**: Session-scoped and root-level `.omx/` directories with mode-specific state files
- **Four specialized MCP servers**: State, Memory, Code Intelligence, and Team runners
- **Team-based agent orchestration**: Multi-agent coordination via tmux sessions with leader-worker architecture
- **Pluggable pipeline**: Sequences planning, execution, and verification stages
- **Real-time HUD monitoring**: Terminal UI for tracking agent activity and state
- **Notification-driven updates**: Post-turn hooks that feed state updates, logs, and team dispatch events

The architecture exhibits **layered separation of concerns**:
- Persistent state (`.omx/`)
- MCP tool APIs (stdio servers)
- Business logic (modes, orchestrators, stages)
- Runtime integration (Codex CLI via notify hook)

---

## State Management System

### Directory Structure

```
project-root/
├── .omx/
│   ├── state/
│   │   ├── autopilot-state.json      # Mode state for autopilot mode
│   │   ├── team-state.json
│   │   ├── ralph-state.json          # Ralph verification state
│   │   ├── session.json              # Current session ID (session.json)
│   │   └── sessions/
│   │       ├── session-1/
│   │       │   ├── autopilot-state.json
│   │       │   └── team-state.json
│   │       └── session-2/
│   ├── project-memory.json           # Persistent project context
│   ├── notepad.md                    # Session notepad
│   ├── logs/
│   │   ├── turns-2024-01-15.jsonl   # Structured event log
│   │   └── turns-2024-01-16.jsonl
│   └── plans/
│       └── prd-*.md                  # Product requirement documents
```

### State Scope Hierarchy

**Resolution precedence (read operations)**:

1. **Explicit session_id** → Session-scoped directory only
2. **Implicit session** (from session.json) → Session directory first, then root as fallback
3. **No session** → Root directory only

**Code reference**: `src/mcp/state-paths.ts`

```typescript
// Scope resolution
export async function resolveStateScope(
  workingDirectory?: string,
  explicitSessionId?: string,
): Promise<ResolvedStateScope>

// Read scoped paths with precedence
export async function getReadScopedStatePaths(
  mode: string,
  workingDirectory?: string,
  explicitSessionId?: string,
): Promise<string[]>
```

**Validation rules**:
- Session IDs: `^[A-Za-z0-9_-]{1,64}$`
- Mode names: `^[A-Za-z0-9_-]{1,64}$`
- No path traversal (`..`, `/`, `\`)
- NUL byte rejection

### Mode State Structure

**File format**: `{mode}-state.json` (e.g., `team-state.json`)

**Base ModeState interface**:

```typescript
export interface ModeState {
  active: boolean;
  mode: string;
  iteration: number;
  max_iterations: number;
  current_phase: string;
  task_description?: string;
  started_at: string;
  completed_at?: string;
  last_turn_at?: string;
  error?: string;
  [key: string]: unknown;  // Extensions for specific modes
}
```

**Supported modes**:
- `autopilot` - Exclusive mode (blocks other exclusive modes)
- `autoresearch` - Exclusive mode
- `deep-interview` - Special mode for deep code analysis
- `ralph` - Verification engine (exclusive mode)
- `ultrawork` - Extended work mode (exclusive mode)
- `team` - Multi-agent coordination
- `ultraqa` - Quality assurance mode
- `ralplan` - Planning stage

**Exclusive modes**: `autopilot`, `autoresearch`, `ralph`, `ultrawork`
- Cannot run concurrently
- Enforced via `assertModeStartAllowed()` check

### Project Memory & Notepad

**Memory structure** (`.omx/project-memory.json`):

```typescript
interface ProjectMemory {
  techStack?: string;
  build?: string;
  conventions?: string;
  structure?: string;
  notes?: Array<{
    category: string;
    content: string;
    timestamp: string
  }>;
  directives?: Array<{
    directive: string;
    priority: string;
    context?: string;
    timestamp: string
  }>;
}
```

**Notepad sections** (`.omx/notepad.md`):
- `priority` - Critical context (≤500 chars)
- `working` - Current working notes
- `manual` - User-edited directives

**Tools**:
- `project_memory_read`, `project_memory_write`
- `project_memory_add_note`, `project_memory_add_directive`
- `notepad_read`, `notepad_write_priority`, `notepad_write_working`, `notepad_write_manual`

---

## MCP Servers Architecture

### Overview

Four stdio-based MCP servers provide tool access to agents. All are auto-started by `omx-state` bootstrap:

```
       Codex CLI Agent
            |
            v
    MCP Server Stdio
            |
    +-------+-------+-------+-------+
    |       |       |       |       |
    v       v       v       v       v
  State   Memory  CodeInt  Team   Trace
  Server  Server  Server  Server Server
    |       |       |       |       |
    v       v       v       v       v
  *.json   *.json  CLI     tmux   .jsonl
  files    files   tools   panes  logs
```

### 1. State Server (omx_state)

**Name**: `omx-state`
**Version**: 0.1.0
**Storage**: `.omx/state/{mode}-state.json`

**Core responsibility**: Read/write mode state files with atomic operations and serialization queues.

**Tools**:

| Tool | Purpose | Input |
|------|---------|-------|
| `state_read` | Read state for a mode | `mode`, `workingDirectory?`, `session_id?` |
| `state_write` | Write/update state | Mode + state fields (active, iteration, phase, etc.) |
| `state_clear` | Clear state file | `mode` |
| `state_list_active` | List active modes | - |
| `state_get_status` | Get current phase | `mode` |

**Key implementation details**:

- **Atomic writes**: Uses temporary files with PID+timestamp to prevent corruption
  ```typescript
  async function writeAtomicFile(path: string, data: string): Promise<void> {
    const tmpPath = `${path}.tmp.${process.pid}.${Date.now()}...`;
    await writeFile(tmpPath, data, "utf-8");
    await rename(tmpPath, path);  // Atomic on most filesystems
  }
  ```

- **Write serialization**: Per-path queue prevents concurrent writes
  ```typescript
  const stateWriteQueues = new Map<string, Promise<void>>();
  async function withStateWriteLock<T>(path: string, fn: () => Promise<T>)
  ```

- **Ralph phase validation**: Special normalization for ralph mode state
  ```typescript
  // Ensures ralph-specific fields are consistent
  function normalizeRalphModeStateOrThrow(state: ModeState): ModeState
  ```

- **Scope-aware reads**: Respects session hierarchy for reads, supports compatibility fallback

**Legacy team tools**: Server includes deprecated legacy team MCP tools via `LEGACY_TEAM_MCP_TOOLS` for backward compatibility.

### 2. Memory Server (omx_memory)

**Name**: `omx-memory`
**Version**: 0.1.0
**Storage**:
- `.omx/project-memory.json` (structured memory)
- `.omx/notepad.md` (markdown sections)

**Core responsibility**: Persistent project context and session notes.

**Tools** (8 total):

```
Project Memory:
  - project_memory_read(section?)
  - project_memory_write(memory, merge?)
  - project_memory_add_note(category, content)
  - project_memory_add_directive(directive, priority, context?)

Notepad:
  - notepad_read(section?)
  - notepad_write_priority(content)
  - notepad_write_working(content)
  - notepad_write_manual(content)
```

**Sections enum**:
- Memory: `all | techStack | build | conventions | structure | notes | directives`
- Notepad: `all | priority | working | manual`

**Features**:
- Merge mode for memory (append vs replace)
- Timestamp tracking for notes and directives
- Priority levels for directives: `high | normal`
- Notepad size constraints (e.g., priority ≤500 chars)

### 3. Code Intelligence Server (omx_code_intel)

**Name**: `omx-code-intel`
**Version**: 0.1.0
**CLI wrappers**: `tsc` (TypeScript), `ast-grep`/`sg` (AST search)

**Core responsibility**: LSP-like diagnostics, symbol search, pattern matching without full LSP.

**Tools**:

| Tool | Purpose |
|------|---------|
| `code_diagnostics` | Run tsc --noEmit, parse errors/warnings |
| `code_symbols` | Fuzzy search symbols via tsc |
| `code_pattern_find` | AST pattern matching via ast-grep |
| `code_grep_search` | Regex search with context lines |
| `code_ast_explain` | Explain AST structure for a pattern |

**Implementation approach**:

- **No persistent LSP**: Uses CLI tools instead of language servers
- **Pragmatic parsing**: Regex extraction from tool stdout
  ```typescript
  // tsc format: src/foo.ts(10,5): error TS2304: Cannot find name 'x'.
  const re = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
  ```
- **Timeout safeguards**: 30s default for diagnostics, 60s for full projects
- **Project detection**: Finds tsconfig.json or tsconfig.build.json

### 4. Team Server (omx_run_team_*)

**Name**: `omx-team` (implied)
**Version**: 0.1.0
**Storage**: `~/.omx/team-jobs/` (persisted across MCP restarts)

**Core responsibility**: Spawn and manage tmux-based multi-agent teams.

**Tools**:

| Tool | Purpose | Input |
|------|---------|-------|
| `omx_run_team_start` | Spawn team session | `teamName`, `agentTypes[]`, `tasks[]`, `cwd` |
| `omx_run_team_status` | Poll job status | `job_id` |
| `omx_run_team_wait` | Block until completion | `job_id`, `timeout_ms`, `nudge_*` options |
| `omx_run_team_cleanup` | Kill/teardown | `job_id`, `grace_ms` |

**Job lifecycle**:

```
START (get job_id)
  |
  v
RUNNING (spawn tmux session + workers)
  |
  v
WAIT (poll or block on completion)
  |
  +--> COMPLETED (stdout JSON parsed)
  +--> FAILED (stderr or exit code)
  +--> TIMEOUT (exceeds timeout_ms)
  |
  v
CLEANUP (kill panes, truncate logs, mark cleanedUpAt)
```

**Job state persistence**:

```typescript
interface OmxTeamJob {
  status: 'running' | 'completed' | 'failed' | 'timeout';
  result?: string;           // JSON stdout result
  stderr?: string;
  startedAt: number;
  pid?: number;
  paneIds?: string[];        // tmux pane IDs
  leaderPaneId?: string;
  teamName?: string;
  cwd?: string;
  cleanedUpAt?: string;
}
```

- **In-memory Map** + **file backup** (`{jobId}.json`)
- Survives MCP server restart via disk cache
- **Pane tracking**: `{jobId}-panes.json` stores pane IDs

**Nudge system** (auto-wake stalled workers):
- `nudge_delay_ms`: How often to nudge
- `nudge_max_count`: Max nudges before timeout
- `nudge_message`: Custom message
- `wake_on`: `'terminal'` (poll) or `'event'` (wait for team dispatch)

### 5. Trace Server (omx_trace)

**Name**: `omx-trace`
**Version**: 0.1.0
**Storage**: `.omx/logs/turns-{date}.jsonl`

**Core responsibility**: Parse and summarize agent turn logs for debugging.

**Tools**:

| Tool | Purpose |
|------|---------|
| `trace_timeline` | Last N turns with timestamps |
| `trace_summary` | Turn counts by type, time range |
| `trace_grep` | Search logs by regex or turn_id |

**Log format** (JSONL):

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "type": "agent-turn-complete",
  "thread_id": "main-thread",
  "turn_id": "turn-abc123",
  "input_preview": "...",
  "output_preview": "..."
}
```

**Features**:
- Streaming iteration (handles large logs)
- Timestamp sorting
- "Last N" efficient algorithm (min-heap on sorted entries)
- Deduplication by (thread_id, turn_id, event_type)

---

## Team Orchestration System

### Architecture Overview

```
              Leader (Main Agent)
              /        |        \
        +----+----+----+----+----+
        |    |    |    |    |    |
   Worker1 Worker2 Worker3 ... WorkerN
        |    |    |    |    |    |
        v    v    v    v    v    v
   Mailbox (state/messages/)
        ^    ^    ^    ^    ^    ^
        |____|____|____|____|____|
              |
              v
         (dispatch queue)
```

### Phase State Machine

**Defined in**: `src/team/orchestrator.ts`

**Phases**:

```
team-plan          → Formulate execution plan
  ↓
team-prd           → Product requirements document
  ↓
team-exec          → Execute plan via workers
  ↓
team-verify        → Verify results
  ↓
team-fix (loop)    → Fix issues, re-execute
  ↓
{complete|failed}  → Terminal
```

**Transition rules**:

```typescript
const TRANSITIONS: Record<TeamPhase, Array<TeamPhase | TerminalPhase>> = {
  'team-plan': ['team-prd'],
  'team-prd': ['team-exec'],
  'team-exec': ['team-verify'],
  'team-verify': ['team-fix', 'complete', 'failed'],
  'team-fix': ['team-exec', 'team-verify', 'complete', 'failed'],
};
```

**State structure**:

```typescript
export interface TeamState {
  active: boolean;
  phase: TeamPhase | TerminalPhase;
  task_description: string;
  created_at: string;
  phase_transitions: Array<{ from: string; to: string; at: string; reason?: string }>;
  tasks: TeamTask[];
  max_fix_attempts: number;
  current_fix_attempt: number;
}
```

### Worker Architecture

**tmux session layout**:

```
┌─────────────────────────────────┐
│ Leader Pane (main agent)        │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Worker 1 Pane                   │
├─────────────────────────────────┤
│ Worker 2 Pane                   │
├─────────────────────────────────┤
│ Worker N Pane                   │
└─────────────────────────────────┘
```

### Communication Patterns

#### 1. Mailbox System

**Storage**: `.omx/state/team/{jobId}/mailbox/`

```typescript
interface MailboxMessage {
  message_id: string;
  from_worker: string;  // 'leader' or 'worker-1'
  to_worker: string;
  body: string;
  created_at: string;
  delivered_at?: string;
  delivery_attempts: number;
}
```

**Lifecycle**:
1. Create message → `message_id` auto-generated
2. Poll in worker loop → `MarkMailboxNotified`
3. Worker processes
4. Mark delivered → `MarkMailboxDelivered`

#### 2. Dispatch Queue

**Storage**: `.omx/state/team/{jobId}/dispatch/`

```typescript
interface DispatchRecord {
  request_id: string;
  target: string;              // 'worker-1', 'worker-2', etc.
  status: 'pending' | 'notified' | 'delivered' | 'failed';
  created_at: string;
  notified_at?: string;
  delivered_at?: string;
  failed_at?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}
```

**Operations** (via notify hook):
- `QueueDispatch` → Create pending dispatch
- `MarkNotified` → Worker acknowledged
- `MarkDelivered` → Worker completed
- `MarkFailed` → Worker failed

#### 3. Idle Detection & Nudging

**File**: `src/team/idle-nudge.ts`

**Mechanism**:
- Track last event time per worker
- If no event > `IDLE_THRESHOLD_MS` (e.g., 30s)
- Send nudge message to worker
- Up to `nudge_max_count` nudges
- Then timeout

**Nudge types**:
- `default`: "Worker, are you still active?"
- `custom`: User-provided message
- `team-dispatch`: Pending task ready message

### Worker Bootstrap

**File**: `src/team/worker-bootstrap.ts`

**Environment variables**:
- `OMX_TEAM_WORKER={teamName}/{workerName}` - Identifies worker
- `OMX_TEAM_STATE_ROOT={jobId}` - Job state directory
- `OMX_TEAM_LEADER_PANE={leaderPaneId}` - Leader reference

**Worker loop**:

```
1. Initialize environment
2. Load config (cwd, agent type, models)
3. Spawn Codex CLI subprocess
4. Poll mailbox for messages
5. Update heartbeat in state
6. Handle stall detection
7. Wait for completion
8. Report results to leader
```

### Leader-Worker Synchronization

**Rust Runtime Bridge** (`src/runtime/bridge.ts`):

```typescript
export type RuntimeCommand =
  | { command: 'AcquireAuthority'; owner: string; lease_id: string; leased_until: string }
  | { command: 'QueueDispatch'; request_id: string; target: string; metadata? }
  | { command: 'MarkNotified'; request_id: string; channel: string }
  | { command: 'MarkDelivered'; request_id: string }
  | ...
```

**Authority lease system**:
- Leader acquires authority with lease expiry time
- Renews lease periodically
- Prevents stale leaders from corrupting state

**Dispatch replay**:
- `RequestReplay` → Get all pending dispatches
- Used for recovery after network partition

---

## Pipeline Architecture

### Purpose

Sequences execution stages (planning → execution → verification → fixing) with persistent state and artifact accumulation.

**File**: `src/pipeline/orchestrator.ts`

### Stage Model

```typescript
export interface PipelineStage {
  readonly name: string;
  run(ctx: StageContext): Promise<StageResult>;
  canSkip?(ctx: StageContext): boolean;
}

export interface StageContext {
  task: string;
  artifacts: Record<string, unknown>;        // From prior stages
  previousStageResult?: StageResult;
  cwd: string;
  sessionId?: string;
}

export interface StageResult {
  status: 'completed' | 'failed' | 'skipped';
  artifacts: Record<string, unknown>;        // To downstream stages
  duration_ms: number;
  error?: string;
}
```

### Implemented Stages

1. **RALPLAN** (`src/pipeline/stages/ralplan.ts`)
   - Generates high-level execution plan
   - Produces `plan` artifact

2. **TEAM-EXEC** (`src/pipeline/stages/team-exec.ts`)
   - Spawns multi-agent team workers
   - Polls for completion
   - Produces `execution_results` artifact

3. **RALPH-VERIFY** (`src/pipeline/stages/ralph-verify.ts`)
   - Verification and quality checking
   - Iterative fix loop (up to `maxRalphIterations`)
   - Produces `verification_report` artifact

### Execution Flow

```
PipelineConfig
  |
  v
runPipeline()
  |
  +-- Stage 1: ralplan
  |     |
  |     +-- context: { task, artifacts={} }
  |     +-- result: { status, artifacts={plan}, duration_ms }
  |
  +-- Stage 2: team-exec
  |     |
  |     +-- context: { task, artifacts={plan}, ... }
  |     +-- result: { status, artifacts={...results}, duration_ms }
  |
  +-- Stage 3: ralph-verify
  |     |
  |     +-- context: { task, artifacts={plan,results}, ... }
  |     +-- result: { status, artifacts={report}, duration_ms }
  |
  v
PipelineResult
  - status: 'completed' | 'failed'
  - stageResults: { ralplan, 'team-exec', 'ralph-verify' }
  - artifacts: merged from all stages
  - duration_ms: total time
```

### State Persistence

**Mode**: `autopilot` (via `src/modes/base.ts`)

**Extended state fields**:

```typescript
interface PipelineModeStateExtension {
  pipeline_name: string;
  pipeline_stages: string[];
  pipeline_stage_index: number;
  pipeline_stage_results: Record<string, StageResult>;
  pipeline_max_ralph_iterations: number;
  pipeline_worker_count: number;
  pipeline_agent_type: string;
}
```

**Checkpoint behavior**:
- After each stage transition, state is saved
- `current_phase` set to `stage:{stageName}`
- `pipeline_stage_index` incremented
- Results accumulated in `pipeline_stage_results`

### Configuration

```typescript
interface PipelineConfig {
  name: string;
  task: string;
  stages: PipelineStage[];
  cwd?: string;
  sessionId?: string;
  maxRalphIterations?: number;  // Default: 10
  workerCount?: number;         // Default: 2
  agentType?: string;           // Default: 'executor'
  onStageTransition?: (from: string, to: string) => void;
}
```

---

## HUD & Monitoring

### Overview

Real-time terminal UI for viewing agent state, phase transitions, and team status.

**File**: `src/hud/index.ts`, `src/hud/render.ts`

### Usage

```bash
omx hud                    # Single render
omx hud --watch            # Poll every 1s with clear
omx hud --json             # Raw JSON output
omx hud --preset=minimal   # minimal | focused | full
omx hud --tmux             # Inject into tmux split pane
```

### HUD Data Sources

```typescript
async function readAllState(
  cwd: string,
  config?: ResolvedHudConfig
): Promise<HudRenderContext>
```

**Reads from**:
1. Mode states (all modes in `.omx/state/`)
2. Team job tracking
3. Phase transitions
4. Breadcrumb logs

### Rendering

**Presets**:

| Preset | Shows |
|--------|-------|
| `minimal` | Current mode, phase, iteration |
| `focused` | Mode, phase, task, last 5 transitions |
| `full` | All state, team status, logs, authority |

**Color scheme** (`src/hud/colors.ts`):
- Active phase: **cyan**
- Completed: **green**
- Failed: **red**
- Idle: **grey**

### tmux Integration

**Flag**: `--tmux`

Automatically:
1. Detects active tmux session
2. Calculates pane split orientation
3. Opens HUD in split pane
4. Enters watch loop
5. Shows real-time updates

**Height constraint**: `HUD_TMUX_HEIGHT_LINES = 20` lines allocated

### Authority Ticking

**Function**: `runHudAuthorityTick()`

Periodic renewal of leader authority lease via Rust runtime bridge. Prevents HUD from causing authority conflicts.

---

## Specialized Subsystems

### 1. omx explore

**Purpose**: Lightweight code exploration with Spark Shell fallback.

**File**: `src/cli/explore.ts`

**Usage**:

```bash
omx explore --prompt "find files matching pattern"
omx explore --prompt-file hints.txt
run ls -la /path                    # Force shell routing
```

**Routing logic**:

```typescript
export function resolveExploreSparkShellRoute(
  prompt: string
): ExploreSparkShellRoute | undefined {
  // Shell disallowed patterns: [|&;><`$()]
  // Routes to Spark if: patterns match, "run" prefix, output > ~100 lines
  return { argv: [...], reason: 'shell-native' | 'long-output' };
}
```

**Spark shell fallback**:
- Invokes Spark binary for read-only operations
- Examples: `git log`, `find`, `grep`, `ls`
- Prevents AI from attempting shell injection

**Agent routing**:
- `OMX_EXPLORE_ROUTING_DEFAULT = '1'` enables routing
- `USE_OMX_EXPLORE_CMD` env var controls routing
- Registered in agent definitions

### 2. omx sparkshell

**Purpose**: Native binary runtime for safe shell command execution.

**Files**:
- `src/cli/sparkshell.ts` - Typescript wrapper
- `src/scripts/build-sparkshell.ts` - Build script

**Features**:
- Pre-compiled native binary (different per platform)
- Read-only git commands (log, diff, status, show)
- Output length detection
- Hydration on demand (unpacks from cache)

**Binary detection** (`src/cli/native-assets.ts`):

```
OMX_EXPLORE_BIN={path}              # Explicit override
~/.cache/oh-my-codex/sparkshell-*   # Cached binary
./dist/native/sparkshell-*          # Repository build
```

**Compatibility layer**:
- Platform detection (darwin/linux, x86_64/arm64)
- Fallback to Node version if native unavailable
- Hydration on-demand + caching

---

## Notification Hook System

### Architecture

**Entry point**: `.omx/notify-hook.js` (deployed from `src/scripts/notify-hook.ts`)

**Trigger**: Codex CLI fires after each agent turn via `notify` config key.

```toml
[config.toml]
notify = ["node", "/path/to/notify-hook.js"]
```

**Payload** (passed as JSON in argv):

```json
{
  "turn-id": "turn-abc123",
  "thread-id": "main-thread",
  "type": "agent-turn-complete",
  "cwd": "/project",
  "session_id": "session-1",
  "model": "claude-opus-4",
  "input_tokens": 5000,
  "output_tokens": 2000,
  "usage": { ... },
  "messages": [ ... ]
}
```

### Sub-modules

```
notify-hook/
├── utils.js               → Type coercion (asNumber, safeString)
├── payload-parser.js      → Extract turn/token/usage data
├── state-io.js            → Read/normalize state files
├── log.js                 → Structured JSONL event logging
├── auto-nudge.js          → Stall detection & nudge dispatch
├── tmux-injection.js      → Inject status into tmux prompt
├── team-dispatch.js       → Durable dispatch queue consumer
├── team-leader-nudge.js   → Notify leader of stale state
├── team-worker.js         → Worker heartbeat & idle signals
└── operational-events.js  → Signal extraction
```

### Key Responsibilities

#### 1. Turn Deduplication

Prevents double-processing when both notify hook and fallback watcher fire:

```typescript
const turnId = safeString(payload['turn-id'] || '');
const threadId = safeString(payload['thread-id'] || '');
const eventType = safeString(payload.type || 'agent-turn-complete');
const key = `${threadId || 'no-thread'}|${turnId}|${eventType}`;
// Track in dedupeState.recent_turns, prune old entries
```

#### 2. Event Logging

Appends turn-level events to `.omx/logs/turns-{date}.jsonl`:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "type": "agent-turn-complete",
  "turn_id": "turn-abc123",
  "thread_id": "main-thread",
  "input_preview": "Analyze...",
  "output_preview": "Result: ..."
}
```

#### 3. State Updates

Updates `.omx/state/{mode}-state.json` after each turn:

```typescript
{
  "active": true,
  "mode": "team",
  "iteration": 5,
  "last_turn_at": "2024-01-15T10:30:45.123Z",
  "current_phase": "team-exec",
  ...
}
```

#### 4. Team Dispatch Queue Consumption

Drains pending dispatches from leader to workers:

```typescript
async function drainPendingTeamDispatch() {
  // Read dispatch/ directory
  // For each pending dispatch:
  //   - Create worker-scoped message
  //   - Mark as notified
  //   - Worker polls next
}
```

#### 5. Leader Staleness Detection

Checks if leader has stalled:

```typescript
function isLeaderStale(state: TeamState, thresholdMs: number): boolean {
  const now = Date.now();
  const lastEventTime = parseISO(state.last_turn_at || state.started_at);
  return (now - lastEventTime.getTime()) > thresholdMs;
}
```

If stale and `max_nudge_count` exceeded → timeout team execution.

#### 6. Worker Idle Notification

Tracks worker heartbeats and notifies leader:

```typescript
interface TeamWorkerEnv {
  teamName: string;
  workerName: string;
}

async function updateWorkerHeartbeat(workerId: string, state: any) {
  // Update worker-scoped state file with timestamp
  // Check if all workers idle → notify leader
}
```

#### 7. tmux Prompt Injection

Injects status line into active tmux pane prompt:

```bash
tmux send-keys -t {pane} "C-c"     # Clear previous prompt
tmux send-keys -t {pane} "PS1='[team-exec] '"
```

Allows leader to see current phase without explicit commands.

### Operational Events

**Derived signals** (from payload analysis):

```typescript
interface OperationalContext {
  repositoryMetadata: { cwd, branch, remoteUrl? };
  sessionName: string;           // Auto-derived from task
  agentSignalEvents: {
    type: string;                // 'tool-call' | 'error' | 'success'
    toolName?: string;
    timestamp: string;
  }[];
}
```

Used for:
- Session naming conventions
- Tool usage tracking
- Error categorization

---

## Design Patterns & Insights

### 1. Scope-Aware State Resolution

**Pattern**: Multi-level fallback hierarchy

```
session-scoped-dir
    ↓ (not found)
root-scoped-dir
    ↓ (not found)
default/error
```

**Benefit**: Supports session isolation while maintaining backward compatibility with root-level state.

### 2. Atomic File Operations with Temporary Files

**Pattern**: Write-to-temp, rename pattern

```typescript
const tmpPath = `${path}.tmp.${pid}.${timestamp}`;
await writeFile(tmpPath, data);
await rename(tmpPath, path);  // Atomic on most filesystems
```

**Benefit**: Prevents partial writes or corruption from concurrent access.

### 3. Per-Path Write Serialization

**Pattern**: Queue of promises per file path

```typescript
const stateWriteQueues = new Map<string, Promise<void>>();
// Ensures writes to same file never overlap
```

**Benefit**: Prevents race conditions without global locks.

### 4. State Phase Machines with Validation

**Pattern**: Enum-based phase + transition validator

```typescript
const TRANSITIONS: Record<TeamPhase, Array<TeamPhase | TerminalPhase>> = {
  'team-plan': ['team-prd'],
  'team-prd': ['team-exec'],
  // ...
};

function isValidTransition(from: TeamPhase, to: TeamPhase | TerminalPhase): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Benefit**: Compile-time safety + runtime validation of state machine.

### 5. Async Generator for Streaming Large Files

**Pattern**: `AsyncGenerator<T>` for log iteration

```typescript
async function* iterateLogEntries(logsDir: string): AsyncGenerator<TraceEntry> {
  for (const file of files) {
    const rl = createInterface({...});
    for await (const line of rl) {
      yield JSON.parse(line);
    }
  }
}
```

**Benefit**: Memory-efficient parsing of multi-GB log files.

### 6. CLI Tool Wrapping Instead of LSP

**Pattern**: Parse CLI tool stdout (tsc, ast-grep) instead of embedding LSP

**Benefit**:
- No LSP server dependencies
- Simpler error handling
- Works with any CLI tool
- Scalable for parallel tool invocation

### 7. Rust Runtime Bridge with Authority Leasing

**Pattern**: Thin TypeScript wrapper over Rust runtime with serde serialization

```typescript
type RuntimeCommand =
  | { command: 'AcquireAuthority'; owner: string; lease_id: string; leased_until: string }
  | { command: 'QueueDispatch'; request_id: string; target: string; metadata? }
  | ...
```

**Benefit**:
- Type-safe serialization
- Prevents stale leaders
- Audit trail of authority changes

### 8. Post-Turn Notification Hook for Scalable Updates

**Pattern**: Hook fires after each turn, triggers all state updates

```
Codex CLI
  → (turn complete)
  → notify hook
    → dedup check
    → update mode state
    → log event
    → drain dispatch queue
    → nudge leader if stale
    → inject tmux status
```

**Benefit**:
- Loose coupling (hook is optional)
- Scalable to many modes
- Testable in isolation
- Can be disabled (`OMX_NOTIFY_DISABLE=1`)

### 9. Exclusive Mode Locks

**Pattern**: Some modes are exclusive (one at a time)

```typescript
const EXCLUSIVE_MODES: ModeName[] = ['autopilot', 'autoresearch', 'ralph', 'ultrawork'];

async function assertModeStartAllowed(mode: ModeName) {
  for (const other of EXCLUSIVE_MODES) {
    if (other === mode) continue;
    const otherState = readModeState(other);
    if (otherState.active) {
      throw new Error(`Cannot start ${mode}: ${other} is already active`);
    }
  }
}
```

**Benefit**: Prevents resource contention (e.g., ralph verification while autopilot running).

### 10. Pipeline as Composable Stages

**Pattern**: Pluggable stage interface with artifact accumulation

```typescript
interface PipelineStage {
  readonly name: string;
  run(ctx: StageContext): Promise<StageResult>;
  canSkip?(ctx: StageContext): boolean;
}
```

**Benefit**:
- Easy to add new stages (ralplan → team-exec → ralph-verify → custom)
- Stages don't need to know about downstream stages
- Artifacts flow through unchanged

---

## Integration Points

### With Codex CLI

- **Notify hook**: Fired after each turn
- **Config.toml merging**: OMX injects MCP server definitions
- **Agent routing**: Skills via `$` prefix (e.g., `$explore`, `$team`)

### With Rust Runtime

- **Authority broker**: Leader leasing for team coordination
- **Dispatch queue**: Durable task distribution
- **Event replay**: Recovery from network partitions

### With tmux

- **Session creation**: `omx run team` creates tmux session
- **Pane layout**: Leader + worker panes
- **Prompt injection**: Status updates in pane prompt
- **Cleanup**: Kill panes on timeout/completion

### With File System

- **State files**: JSON in `.omx/state/`
- **Logs**: JSONL in `.omx/logs/`
- **Memory**: JSON in `.omx/project-memory.json`
- **Notepad**: Markdown in `.omx/notepad.md`

---

## Conclusion

Oh-My-Codex presents a **sophisticated orchestration framework** that manages:

1. **Multi-scoped state** with session isolation
2. **Four-server MCP architecture** for tool provisioning
3. **Team-based agent coordination** via tmux + mailbox
4. **Composable pipelines** for staged execution
5. **Real-time monitoring** via HUD
6. **Scalable notifications** via post-turn hooks

The design exhibits **loose coupling**, **strong typing**, **race-condition safety**, and **filesystem-first persistence**, making it a compelling reference for building agent orchestration systems.

Key takeaway: **Treat filesystem as the source of truth**, use **atomic operations** for writes, **queue-based synchronization** for concurrency, and **pluggable subsystems** for extensibility.

---

## References

### Core Files

- `src/mcp/state-paths.ts` - State path resolution and validation
- `src/mcp/state-server.ts` - State MCP server
- `src/mcp/memory-server.ts` - Memory MCP server
- `src/mcp/code-intel-server.ts` - Code intelligence MCP server
- `src/mcp/team-server.ts` - Team runner MCP server
- `src/mcp/trace-server.ts` - Trace server
- `src/team/orchestrator.ts` - Team phase state machine
- `src/pipeline/orchestrator.ts` - Pipeline execution
- `src/hud/index.ts` - HUD CLI
- `src/cli/explore.ts` - Explore subsystem
- `src/scripts/notify-hook.ts` - Notification hook (main entry)
- `src/config/generator.ts` - Config.toml generation

### Tests

Tests provide excellent examples of each subsystem's behavior:

- `src/mcp/__tests__/state-server.test.ts`
- `src/team/__tests__/orchestrator.test.ts`
- `src/pipeline/__tests__/orchestrator.test.ts`
- `src/hud/__tests__/index.test.ts`

# Persistent Logging & Architect Subagent (PRD0031 + PRD0032)

Reference material for the `add-subagent-driven-development` skill. Loaded on demand.

---

## PRD0031 — Persistent Decision Logging

**decisions.jsonl** is the persistent record of implementation decisions per feature.
Located at: `docs/features/${FEATURE_ID}/decisions.jsonl`

### When to Log

Log **only pivots** — when a subagent changes approach during implementation. `choice` and `result` were removed (no consumer reads them, only pivots are filtered by context mapping).

| Moment | type | Required Fields | Optional |
|--------|------|-----------------|----------|
| When pivoting to different approach | `pivot` | ts, agent, type, decision, reason, from | attempt, error |

### Log Format (JSONL — one JSON per line)

```jsonl
{"ts":"2026-02-18T14:45:00Z","agent":"backend","type":"pivot","from":"Prisma","decision":"Switch to Drizzle","reason":"Prisma migration failed with Supabase edge functions","attempt":1,"error":"Migration timeout on edge runtime"}
```

### Append Command

```bash
bash .codeadd/scripts/log-jsonl.sh "docs/features/${FEATURE_ID}/decisions.jsonl" "<type>" "<agent>" '"decision":"[what]","reason":"[why]"'
```

### Central File (consolidated by /add-done)

`.codeadd/project/decisions.jsonl` — all project decisions, consolidated at feature completion.
Used by context mapping at start of new features (read last 20 pivots as warnings).

---

## PRD0032 — Architect Subagent Pattern (tasks.md)

**tasks.md** is the structured execution plan generated after plan.md is created.
Located at: `docs/features/${FEATURE_ID}/tasks.md` (or subfeature dir)

### When to Dispatch Architect Subagent

After plan.md is created and validated (STEP 9.4 of /add-plan).

### Architect Subagent Dispatch

**Capability:** read-write | **Complexity:** standard

**Prompt:**
```
Read plan.md + about.md + discovery.md.
Generate tasks.md with atomic subtasks:
- 1 service per task (database | backend | frontend | test | infra)
- Maximum 3 files per task
- Explicit deps (task IDs, or "-")
- Verify: command/curl/browser check per task
- Order: database → backend → frontend → test
- Complexity: SIMPLE (≤5), STANDARD (6-12), COMPLEX (13+, warn)
```

### tasks.md Format

```markdown
# Tasks: [feature or subfeature name]

## Metadata
| Campo | Valor |
|-------|-------|
| Complexity | STANDARD |
| Total tasks | 8 |
| Services | database, backend, frontend |

## Tasks
| ID | Description | Service | Files | Deps | Verify |
|----|-------------|---------|-------|------|--------|
| 1.1 | Create users table migration | database | `migrations/001.ts` | - | `npm run migrate` |
| 2.1 | Create signup endpoint | backend | `api/controller.ts`, `api/dto.ts` | 1.1 | `curl POST /api/signup` |
| 3.1 | Create SignupForm component | frontend | `components/SignupForm.tsx` | 2.1 | browser: form renders |
```

### TASKS MODE in /add-dev

When `HAS_TASKS=true`, /add-dev executes by tasks:
1. READ tasks.md → group by service
2. Execute database group first
3. AFTER each group: run verify commands
4. IF verify fails: fix before advancing
5. Pass relevant tasks to each subagent (not "all of plan.md")

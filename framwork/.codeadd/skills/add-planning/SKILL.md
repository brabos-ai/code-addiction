---
name: add-planning
description: Use when creating technical implementation plans - creates/updates plan.md with tasks, file mappings, dependencies and complexity estimates using Technical Style
---

# Technical Planning

Skill for creating technical implementation plans. Creates/updates `plan.md` with tasks, file mapping and estimates.

**Principle:** Concrete, executable plan — not a wishlist.

---

## Spec

{"trigger":"create implementation plan","input":["about.md","discovery.md","design.md?"],"output":"docs/features/[ID]/plan.md","style":"documentation-style/technical.md","format":"minified JSON + sequenced tasks"}

---

## When to Use

- Feature documented and ready for dev → create `plan.md`
- `plan.md` exists but incomplete → fill missing tasks
- Scope changed → update affected tasks
- During dev, discovered more work → add tasks

### When NOT to Use

- Without `about.md` (document the feature first)

---

## Workflow

### Phase 1: Load Context

```bash
# Read feature documentation
cat docs/features/[FEATURE_ID]/about.md
cat docs/features/[FEATURE_ID]/discovery.md
cat docs/features/[FEATURE_ID]/design.md  # if it exists
```

**Extract:**
- Requirements (RF/RNF/RN) from about.md
- Files to create/modify from discovery.md
- UI components from design.md (if any)

### Phase 2: Structure Tasks

**Breakdown rules:**

| Size | Criteria | Action |
|------|----------|--------|
| Simple | 1–3 files, no deps | Single task |
| Medium | 4–10 files, sequential deps | Tasks per layer |
| Large | >10 files, multiple domains | Separate batches |

**Default order (bottom-up):**
```
1. Domain (entities, enums, types)
2. Database (migrations, repositories)
3. Business (services, use-cases)
4. API (controllers, DTOs, validators)
5. Frontend (components, hooks, stores)
6. Integration (tests, e2e)
```

### Phase 3: Estimate Complexity

**Scale:**
```
S = Small  → 1-2 files, localized change
M = Medium → 3-5 files, moderate logic
L = Large  → 6+ files, complex logic
```

**Complexity signals:**
- New entities → +1 size
- Migrations → +1 size
- External integrations → +1 size
- Complex UI (forms, tables) → +1 size

### Phase 4: Structure Document

**Template plan.md (Technical Style):**

```markdown
# Plan: [Feature Name]

Technical plan for implementing [feature]. Based on about.md and discovery.md.

---

## Spec

### Context
{"feature":"[ID]","branch":"feature/[ID]-[name]","deps":["package@version"],"estimate":"[S/M/L]"}

### Files
{"create":["path/file1.ts","path/file2.ts"],"modify":["path/existing.ts"]}

### Tasks
[{"id":1,"task":"Create entity [Name]","estimate":"S","deps":[]},{"id":2,"task":"Create migration","estimate":"S","deps":[1]},{"id":3,"task":"Create repository","estimate":"S","deps":[2]},{"id":4,"task":"Create service","estimate":"M","deps":[3]},{"id":5,"task":"Create controller + DTOs","estimate":"M","deps":[4]},{"id":6,"task":"Create UI components","estimate":"M","deps":[5]},{"id":7,"task":"e2e tests","estimate":"S","deps":[6]}]

---

## Detailed Tasks

### Task 1: Create entity [Name]
**Estimate:** S
**Files:** `libs/domain/src/entities/[Name].ts`
**Deps:** None

**Checklist:**
- [ ] Fields per about.md
- [ ] Enums if needed
- [ ] Export in index.ts

---

### Task 2: Create migration
**Estimate:** S
**Files:** `libs/app-database/src/migrations/[timestamp]-[name].ts`
**Deps:** Task 1

**Checklist:**
- [ ] Table with fields
- [ ] Required indexes
- [ ] Foreign keys

---

[... continue for each task ...]

---

## Batching (if applicable)

**Batch 1: Foundation**
- Tasks 1-3 (domain + database)
- Commit: "feat([feature]): add [Name] entity and repository"

**Batch 2: Business Logic**
- Tasks 4-5 (service + API)
- Commit: "feat([feature]): add [Name] service and endpoints"

**Batch 3: Frontend**
- Task 6 (UI)
- Commit: "feat([feature]): add [Name] UI components"

**Batch 4: Quality**
- Task 7 (tests)
- Commit: "test([feature]): add e2e tests for [Name]"

---

## Risks and Mitigations

- **[Risk from discovery.md]:** [mitigation in plan]

---

## Metadata
{"updated":"YYYY-MM-DD","sessions":N,"by":"[subagent]"}
```

### Phase 5: Validate and Persist

**Checklist before saving:**
- [ ] All tasks have estimate (S/M/L)
- [ ] Dependencies between tasks are correct
- [ ] Paths are concrete and verifiable
- [ ] Batches make sense for commits
- [ ] Metadata updated

---

## Task Format

### JSON Spec (compact)
```json
[{"id":1,"task":"description","estimate":"S","deps":[]},{"id":2,"task":"description","estimate":"M","deps":[1]}]
```

### Detailed Task (expanded)
```markdown
### Task N: [Title]
**Estimate:** [S/M/L]
**Files:** `path/file.ts`
**Deps:** Task [N-1] or None

**Checklist:**
- [ ] [Verifiable item]
```

---

## Batching Strategy

### When to use batches

| Task count | Strategy |
|------------|----------|
| <5 tasks | Single batch |
| 5–10 tasks | 2–3 batches per layer |
| >10 tasks | Batches per domain/module |

### Commit rules

```
Batch = 1 semantic commit

feat([feature]): add [what was added]
fix([feature]): fix [what was fixed]
refactor([feature]): refactor [what changed]
test([feature]): add tests for [what]
```

---

## Rules

**Do:**
- Base tasks on about.md and discovery.md
- Include dependencies between tasks
- Estimate all tasks (S/M/L)
- Concrete and verifiable paths
- Batches with semantic commits

**Don't:**
- Vague tasks ("implement feature")
- Estimates without criteria
- Ignore dependencies between tasks
- Plan without reading prior documentation
- Overly large batches (>5 tasks)

---

## ADD Integration

When ADD dispatches a subagent for planning:

```markdown
**Skills:**
```bash
cat {{skill:add-planning/SKILL.md}}
cat {{skill:add-doc-schemas/technical.md}}
```

**Context:**
- Feature: [ID]
- about.md: [path or content]
- discovery.md: [path or content]

**Instructions:**
1. Read about.md (requirements)
2. Read discovery.md (files, patterns)
3. Read design.md if it exists
4. Create plan.md with sequenced tasks
5. Update metadata
```

---

## Checklist

- [ ] Read about.md (requirements)?
- [ ] Read discovery.md (files)?
- [ ] Tasks have sequential IDs?
- [ ] All tasks have estimate (S/M/L)?
- [ ] Dependencies between tasks correct?
- [ ] Paths are concrete?
- [ ] Batches defined (if >5 tasks)?
- [ ] Risks mapped?
- [ ] Metadata updated?

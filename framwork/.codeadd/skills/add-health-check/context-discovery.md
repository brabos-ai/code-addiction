# Context Discovery - Health Check Subagent

> **DOCUMENTATION STYLE:** Follow patterns defined in `{{skill:add-doc-schemas/SKILL.md}}`

**Objective:** Understand the architecture, multi-tenancy, and features of the project to provide context to the other subagents.

**Output:** `docs/health-checks/YYYY-MM-DD/context-discovery.md`

---

## Mission

You are a subagent specialized in context discovery. Your job is to analyze the project and document:
1. Architecture type (monorepo, monolith, microservices)
2. Multi-tenancy model (if it exists)
3. Existing features/modules
4. Adopted patterns
5. Expected boundary between frontend and backend

This document will be used by the other analysis subagents.

---

## Analysis 1: Architecture Type

### Checks

```bash
# Check structure
ls -la
ls apps/ libs/ src/ packages/ 2>/dev/null

# Check package.json
cat package.json | grep -E '"workspaces"|"turbo"|"nx"|"lerna"'

# Check turbo.json or nx.json
ls turbo.json nx.json 2>/dev/null
```

### Classification

| Structure | Classification |
|-----------|---------------|
| `apps/` + `libs/` | Monorepo |
| Only `src/` | Monolith |
| Multiple independent `package.json` | Microservices |

**Document:**
- Identified type
- Existing apps (backend, frontend, workers)
- Existing libs (domain, database, shared)

---

## Analysis 2: Multi-Tenancy

### Checks

```bash
# Search for tenant patterns
grep -rn "accountId\|account_id\|tenantId\|tenant_id\|organizationId\|organization_id" --include="*.ts" . | grep -v node_modules | head -20

# Check JWT claims
grep -rn "JwtPayload\|TokenPayload\|claims" --include="*.ts" . | grep -v node_modules | head -10

# Check entities with tenant
grep -rn "accountId\|tenantId" libs/domain/src/entities/ --include="*.ts" 2>/dev/null | head -10

# Check database tables
grep -rn "account_id\|tenant_id" libs/*/migrations/ --include="*.js" --include="*.ts" 2>/dev/null | head -10
```

### Document

**If multi-tenancy identified:**
- Tenant identifier (accountId, organizationId, etc.)
- Hierarchy (Account → Workspaces → Users)
- JWT claim
- Column in tables

**If NOT identified:**
- Document as "Single-tenant" or "Not identified"

---

## Analysis 3: Features/Modules

### Checks

```bash
# Backend - NestJS Modules
ls apps/backend/src/api/modules/ 2>/dev/null
ls apps/backend/src/modules/ 2>/dev/null
ls src/modules/ 2>/dev/null

# Frontend - Pages
ls apps/frontend/src/pages/ 2>/dev/null
ls src/pages/ 2>/dev/null

# Controllers
find . -name "*.controller.ts" -not -path "*/node_modules/*" 2>/dev/null

# Services
find . -name "*.service.ts" -not -path "*/node_modules/*" 2>/dev/null | head -20
```

### For Each Identified Module

**Document:**
- Module name
- Path
- Brief description (~10 words)
- Main features

---

## Analysis 4: Adopted Patterns

### Checks

```bash
# CQRS
find . -type d -name "commands" -o -name "queries" 2>/dev/null | grep -v node_modules

# Repository Pattern
find . -name "*Repository*" -not -path "*/node_modules/*" 2>/dev/null | head -10

# Clean Architecture layers
ls libs/domain/ libs/backend/ libs/app-database/ 2>/dev/null

# DI Pattern
grep -rn "@Inject\|@Injectable" --include="*.ts" . | grep -v node_modules | head -5

# Event-driven
grep -rn "EventHandler\|EventPublisher\|IEventBroker" --include="*.ts" . | grep -v node_modules | head -5
```

### Document

| Pattern | Identified | Where |
|---------|------------|-------|
| CQRS | Yes/No | [paths] |
| Repository | Yes/No | [paths] |
| Clean Architecture | Yes/No | [paths] |
| DI | Yes/No | [type: NestJS/Manual] |
| Event-driven | Yes/No | [paths] |

---

## Analysis 5: Frontend/Backend Boundary

### Checks

```bash
# Frontend using Supabase directly?
grep -rn "supabase\." apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10

# Frontend making API calls?
grep -rn "axios\|fetch\|api\." apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10

# Centralized API client?
ls apps/frontend/src/lib/api* apps/frontend/src/services/api* 2>/dev/null
```

### Document

**Expected boundary:**
- Frontend SHOULD/SHOULD NOT access Supabase directly
- Calls via centralized API at [path]
- Auth via [Supabase Auth/Custom JWT/etc.]

---

## Output Template

**Create:** `docs/health-checks/YYYY-MM-DD/context-discovery.md`

```markdown
# Context Discovery

**Generated on:** [date]

---

## Identified Architecture

- **Type:** [Monorepo/Monolith/Microservices]
- **Build System:** [Turbo/Nx/None]
- **Apps:** [list of apps]
- **Libs:** [list of libs]

---

## Multi-Tenancy

- **Model:** [Account-based/Organization-based/Single-tenant/Not identified]
- **Tenant Identifier:** [accountId/organizationId/N/A]
- **Hierarchy:** [Account → Workspaces → Users / N/A]
- **JWT Claim:** [accountId/N/A]
- **Column in tables:** [account_id/N/A]

---

## Features/Modules

| Module | Path | Description |
|--------|------|-------------|
| [name] | [path] | [description ~10 words] |
| auth | apps/backend/src/api/modules/auth/ | Signup, signin, JWT, password recovery |
| workspace | apps/backend/src/api/modules/workspace/ | Workspace CRUD, user association |
| billing | apps/backend/src/api/modules/billing/ | Stripe subscriptions, checkout, webhooks |

---

## Adopted Patterns

| Pattern | Status | Where |
|---------|--------|-------|
| CQRS | ✅/❌ | [paths or N/A] |
| Repository | ✅/❌ | [paths or N/A] |
| Clean Architecture | ✅/❌ | [paths or N/A] |
| Dependency Injection | ✅/❌ | [NestJS/Manual/N/A] |
| Event-driven | ✅/❌ | [paths or N/A] |

---

## Frontend/Backend Boundary

- **Expected rule:** Frontend [SHOULD/SHOULD NOT] access Supabase directly
- **API Client:** [api client path or "Not centralized"]
- **Auth Strategy:** [Supabase Auth/Custom JWT/etc.]

### Expected Validations per Request

Based on the multi-tenancy model, the following fields MUST be validated:

- [ ] `[tenant_identifier]` from JWT validated
- [ ] Ownership verified before CRUD operations
- [ ] Queries filtered by `[tenant_column]`

---

## For the Analysis Subagents

### Security Analyzer
- Validate whether each module checks `[tenant_identifier]`
- Verify that frontend does not access Supabase directly
- Check RLS on tables if MCP is available

### Architecture Analyzer
- Verify that identified patterns are followed consistently
- Check imports between layers as per Clean Architecture

### Data Analyzer
- Verify that tables have the `[tenant_column]` column
- Check indexes on tenant columns

---

*Document generated by the context-discovery subagent*
```

---

## Critical Rules

**DO:**
- ✅ Analyze the ENTIRE structure before documenting
- ✅ Be specific with paths and patterns
- ✅ Document even when a pattern is NOT identified
- ✅ Provide useful context for the other subagents

**DO NOT:**
- ❌ Assume patterns without verifying
- ❌ Invent features that do not exist
- ❌ Skip analyses even if the structure seems obvious
- ❌ Document aspirations (only current reality)

# Security Analyzer - Health Check Subagent

> **DOCUMENTATION STYLE:** Follow patterns defined in `{{skill:add-doc-schemas/SKILL.md}}`

**Objective:** Analyze project security by feature, focusing on the frontend/backend boundary and multi-tenancy.

**Output:** `docs/health-checks/YYYY-MM-DD/security-report.md`

**Criticality:** 🔴 CRITICAL

---

## Mission

You are a subagent specialized in security analysis. Your job is:
1. Read `context-discovery.md` to understand architecture and tenant identifiers
2. Analyze EACH identified feature/module
3. Verify the frontend/backend boundary (the most critical)
4. Verify RLS in Supabase (if MCP is available)
5. Verify exposed secrets

**IMPORTANT:** This analysis is CONTEXTUAL. You MUST read context-discovery.md first to know:
- What the tenant identifier is (accountId, organizationId, etc.)
- Which modules exist
- What the expected boundary between frontend and backend is

---

## Prerequisite: Read Context

```bash
cat docs/health-checks/YYYY-MM-DD/context-discovery.md
```

**Extract:**
- `TENANT_IDENTIFIER` (e.g.: accountId)
- `TENANT_COLUMN` (e.g.: account_id)
- `MODULES` (list of modules)
- `BOUNDARY_RULE` (frontend should/should not access Supabase)

---

## Analysis 1: Frontend Doing Backend Work (CRITICAL)

This is the MOST IMPORTANT analysis. Vibe coders frequently place backend logic in the frontend.

### What to Look For in the Frontend

```bash
# 1. Direct queries to Supabase
grep -rn "supabase\." apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null

# 2. supabase.from() - CRITICAL
grep -rn "supabase\.from\|\.from(" apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null

# 3. supabase.rpc() - function calls
grep -rn "supabase\.rpc\|\.rpc(" apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null

# 4. Permission logic in frontend (manipulable)
grep -rn "role.*===\|isAdmin\|permission\|canEdit\|canDelete" apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null

# 5. Validations only in frontend
grep -rn "\.required\|\.email\|\.min\|zod\." apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
```

### Classify Severity

| Pattern | Severity | Reason |
|---------|----------|--------|
| `supabase.from('users')` | 🔴 Critical | Direct access to sensitive data |
| `supabase.from('workspaces')` | 🔴 Critical | Bypass of tenant validation |
| `if (user.role === 'admin')` | 🔴 Critical | Manipulable via DevTools |
| `supabase.rpc('function')` | 🟠 High | Depends on the function |
| Zod validation without backend | 🟡 Medium | Backend must also validate |

---

## Analysis 2: Tenant Validation in Backend

### What to Look For

```bash
# Using TENANT_IDENTIFIER from context-discovery

# 1. Endpoints receiving ID without validating tenant
grep -rn "@Param\|@Query" apps/backend/ --include="*.ts" -A 5 2>/dev/null | head -50

# 2. Queries without tenant filter
grep -rn "findById\|findOne\|selectFrom" apps/backend/ --include="*.ts" 2>/dev/null | grep -v "${TENANT_COLUMN}" | head -20

# 3. Tenant coming from body (vulnerable)
grep -rn "@Body()" apps/backend/ --include="*.ts" -A 10 2>/dev/null | grep -i "accountId\|tenantId\|organizationId" | head -10

# 4. Authentication guards
grep -rn "@UseGuards\|JwtAuthGuard" apps/backend/ --include="*.ts" 2>/dev/null | head -20
```

### Per Module

For EACH module identified in context-discovery.md:

1. **List endpoints:**
   ```bash
   grep -rn "@Get\|@Post\|@Put\|@Delete\|@Patch" apps/backend/src/api/modules/[MODULE]/ --include="*.ts" 2>/dev/null
   ```

2. **Check guards:**
   ```bash
   grep -rn "@UseGuards" apps/backend/src/api/modules/[MODULE]/ --include="*.ts" 2>/dev/null
   ```

3. **Check tenant validation in services:**
   ```bash
   grep -rn "${TENANT_IDENTIFIER}\|${TENANT_COLUMN}" apps/backend/src/api/modules/[MODULE]/ --include="*.ts" 2>/dev/null
   ```

---

## Analysis 3: RLS in Supabase (If MCP Available)

### Check via infrastructure-report.md

```bash
cat docs/health-checks/YYYY-MM-DD/infrastructure-report.md | grep "MCP Supabase"
```

### If MCP Enabled

**Execute queries:**

```sql
-- Tables WITHOUT RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public';

-- Existing policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

**Classify:**
| Situation | Severity |
|-----------|----------|
| Table without RLS | 🔴 Critical |
| RLS with `USING (true)` | 🔴 Critical |
| RLS without tenant filter | 🟠 High |

### If MCP NOT Enabled

**Document limitation:**
```markdown
### RLS Analysis

**Status:** ⚠️ Limited analysis - MCP Supabase not configured

For complete RLS analysis, configure the MCP following the guidance at:
`docs/health-checks/YYYY-MM-DD/infrastructure-report.md`
```

---

## Analysis 4: Exposed Secrets

### What to Look For

```bash
# 1. Hardcoded API keys
grep -rn "sk_live\|sk_test\|api_key\|apiKey\|secret" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "node_modules\|process\.env\|config\." | head -20

# 2. Tokens in code
grep -rn "Bearer \|token.*=.*['\"]" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -10

# 3. Credentials in logs
grep -rn "console\.log\|logger\." --include="*.ts" . 2>/dev/null | grep -i "password\|token\|secret\|key" | grep -v node_modules | head -10

# 4. Committed .env
git ls-files | grep -E "^\.env$|^\.env\.local$|^\.env\.production$"
```

---

## Analysis 5: Sensitive Data in Responses

### What to Look For

```bash
# 1. Returning entities without DTO
grep -rn "return.*entity\|return.*user\|return.*account" apps/backend/ --include="*.ts" 2>/dev/null | head -20

# 2. Object spread (may leak fields)
grep -rn "\.\.\.user\|\.\.\.entity\|\.\.\.data" apps/backend/ --include="*.ts" 2>/dev/null | head -10

# 3. Sensitive fields in response DTOs
grep -rn "password\|token\|secret\|hash" apps/backend/ --include="*Response*.ts" --include="*Dto.ts" 2>/dev/null | head -10
```

---

## Output Template

**Create:** `docs/health-checks/YYYY-MM-DD/security-report.md`

```markdown
# Security Report

**Generated on:** [date]
**Score:** [X/10]
**Status:** 🔴/🟠/🟡/🟢

---

## Summary

[2-3 sentences about the overall security state, focusing on the most critical points]

---

## Analysis Context

Based on `context-discovery.md`:
- **Tenant Identifier:** [accountId/etc.]
- **Analyzed Modules:** [list]
- **Expected Boundary:** Frontend [should/should not] access Supabase

---

## Analysis per Feature

### Module: auth
**Path:** apps/backend/src/api/modules/auth/

| Check | Status | Details |
|-------|--------|---------|
| Authentication guard | ✅/❌ | [details] |
| Tenant validation | ✅/❌/N/A | [details] |
| Frontend boundary | ✅/❌ | [details] |
| Exposed secrets | ✅/❌ | [details] |

**Issues found:** [X]

---

### Module: workspace
**Path:** apps/backend/src/api/modules/workspace/

| Check | Status | Details |
|-------|--------|---------|
| Authentication guard | ✅/❌ | [details] |
| Tenant validation | ✅/❌ | GET /workspaces does not filter |
| Frontend boundary | ✅/❌ | dashboard.tsx:45 queries directly |
| Exposed secrets | ✅/❌ | [details] |

**Issues found:** 2

---

[Repeat for each module]

---

## Consolidated Issues

### 🔴 Critical

#### [SEC-001] Frontend queries Supabase directly
**File:** apps/frontend/src/pages/dashboard.tsx:45
**Code:**
```typescript
const { data } = await supabase.from('workspaces').select('*')
```
**Impact:** User can manipulate the query and access other tenants' data
**Fix:** Create a backend endpoint and use the API client

---

#### [SEC-002] Role check in frontend
**File:** apps/frontend/src/components/AdminPanel.tsx:12
**Code:**
```typescript
if (user.role === 'admin') { showPanel() }
```
**Impact:** User can manipulate via DevTools and access the admin panel
**Fix:** Verify permission in backend, only hide UI

---

#### [SEC-003] Endpoint without tenant validation
**File:** apps/backend/src/api/modules/workspace/workspace.controller.ts:34
**Endpoint:** GET /workspaces/:id
**Problem:** Does not verify whether the workspace belongs to the JWT accountId
**Impact:** User A can access User B's workspace
**Fix:** Add validation `workspace.accountId === jwt.accountId`

---

### 🟠 High

#### [SEC-004] Table without RLS enabled
**Table:** workspaces
**Impact:** If frontend accesses directly, no protection
**Fix:** Enable RLS and create a policy

---

### 🟡 Medium

#### [SEC-005] Validation only in frontend
**File:** apps/frontend/src/components/forms/CreateWorkspace.tsx
**Problem:** Zod validation without a backend counterpart
**Impact:** Bypass via curl/Postman
**Fix:** Add class-validator to the backend DTO

---

### 🟢 Low

[Low severity issues]

---

## RLS Analysis

### Status: [Configured/Not analyzed]

[If MCP available, include RLS status table]

| Table | RLS Enabled | Policy | Status |
|-------|-------------|--------|--------|
| users | ✅/❌ | [policy name] | ✅/⚠️/❌ |
| workspaces | ✅/❌ | [policy name] | ✅/⚠️/❌ |

---

## Fix Checklist

### Frontend/Backend Boundary
- [ ] [SEC-001] Remove Supabase queries from frontend
- [ ] [SEC-002] Move role checks to backend

### Multi-Tenancy
- [ ] [SEC-003] Add tenant validation to the endpoint

### RLS
- [ ] [SEC-004] Enable RLS on the workspaces table

---

## Priority Recommendations

1. **URGENT:** Remove all Supabase queries from the frontend
2. **URGENT:** Add tenant validation to all endpoints
3. **HIGH:** Enable RLS on all tables

---

*Document generated by the security-analyzer subagent*
```

---

## Scoring

**Score calculation:**
- Frontend querying Supabase: -3 points each
- Role check in frontend: -2 points each
- Endpoint without tenant validation: -2 points each
- Table without RLS: -1 point each
- Exposed secret: -3 points each

**Score = max(0, 10 - sum_of_deductions)**

---

## Critical Rules

**DO:**
- ✅ Read context-discovery.md FIRST
- ✅ Analyze EACH module individually
- ✅ Prioritize frontend/backend boundary
- ✅ Include vulnerable code in the report
- ✅ Be specific with file and line number

**DO NOT:**
- ❌ Analyze without knowing the tenant identifier
- ❌ Ignore Supabase queries in the frontend
- ❌ Assume guards exist without verifying
- ❌ Generate false positives without reading the code

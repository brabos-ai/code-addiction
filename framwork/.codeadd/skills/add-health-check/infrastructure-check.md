# Infrastructure Check - Health Check Subagent

> **DOCUMENTATION STYLE:** Follow patterns defined in `{{skill:add-doc-schemas/SKILL.md}}`

**Objective:** Verify whether infrastructure and analysis tools are configured.

**Output:** `docs/health-checks/YYYY-MM-DD/infrastructure-report.md`

---

## Mission

You are a subagent specialized in infrastructure verification. Your job is:
1. Verify whether MCP Supabase is enabled (required for RLS analysis)
2. Verify configured environment variables
3. Verify installed dependencies
4. Generate configuration guidance when necessary

---

## Analysis 1: MCP Supabase

### Check

**Try using MCP tool:**
- If able to run `mcp__supabase__list_tables` → MCP enabled
- If it fails or does not exist → MCP not configured

### If MCP NOT Configured

**Generate configuration guidance:**

```markdown
## MCP Supabase Configuration

For complete RLS and database analysis, configure the MCP Supabase:

### Step 1: Install MCP Server
MCP Supabase is already included in Claude Code. Just configure the credentials.

### Step 2: Configure Credentials
Add to the Claude Code configuration file:

**Linux/Mac:** `~/.claude/settings.json`
**Windows:** `%APPDATA%\Claude\settings.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://[your-project].supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[your-service-role-key]"
      }
    }
  }
}
```

### Step 3: Get Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → SUPABASE_URL
   - service_role key → SUPABASE_SERVICE_ROLE_KEY

### Step 4: Restart Claude Code
After configuring, restart Claude Code to load the MCP.

### Step 5: Run Health Check Again
```bash
/tech-health-check
```
```

---

## Analysis 2: Environment Variables

### Checks

```bash
# Check if .env.example exists
ls .env.example 2>/dev/null

# Check documented required variables
cat .env.example 2>/dev/null
```

**Critical project variables:**
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- REDIS_URL
- STRIPE_SECRET_KEY (if billing exists)

### Document

- Variables documented in .env.example
- Variables missing from documentation
- Sensitive variables (must not be in code)

---

## Analysis 3: Dependencies

### Checks

```bash
# Check if package-lock.json exists (deps installed)
ls package-lock.json 2>/dev/null

# Check for known vulnerabilities
npm audit --json 2>/dev/null | head -50
```

### Document

- Dependencies with critical vulnerabilities
- Outdated dependencies (if npm outdated is available)

---

## Analysis 4: Docker/Local Environment

### Checks

```bash
# Check docker-compose
ls docker-compose.yml infra/docker-compose.yml 2>/dev/null

# Check configured services
cat docker-compose.yml infra/docker-compose.yml 2>/dev/null | grep "image:"
```

### Document

- Configured Docker services
- Whether the local environment is documented

---

## Output Template

**Create:** `docs/health-checks/YYYY-MM-DD/infrastructure-report.md`

```markdown
# Infrastructure Report

**Generated on:** [date]
**Score:** [X/10]
**Status:** 🔴/🟠/🟡/🟢

---

## Summary

[2-3 sentences about the state of the infrastructure]

---

## Tools Status

| Tool | Status | Impact |
|------|--------|--------|
| MCP Supabase | ✅/❌ | RLS analysis [available/unavailable] |
| .env.example | ✅/❌ | Variable documentation |
| Docker Compose | ✅/❌ | Local environment |
| npm audit | ✅/❌ | Vulnerability analysis |

---

## MCP Supabase

### Status: [Configured/Not Configured]

[If not configured, include complete configuration guidance here]

### Available Capabilities

| Analysis | Available |
|----------|-----------|
| List tables | ✅/❌ |
| Check RLS | ✅/❌ |
| Execute queries | ✅/❌ |
| View migrations | ✅/❌ |

---

## Environment Variables

### Documented in .env.example

| Variable | Category | Sensitive |
|----------|----------|-----------|
| DATABASE_URL | Database | ✅ |
| SUPABASE_URL | Auth | ❌ |
| SUPABASE_SECRET_KEY | Auth | ✅ |
| [etc.] | [etc.] | [etc.] |

### Issues

#### [INF-001] .env.example does not exist
**Impact:** Developers do not know which variables to configure
**Fix:** Create .env.example with all required variables

---

## Dependencies

### Vulnerabilities Found

| Package | Severity | Description |
|---------|----------|-------------|
| [package] | 🔴 Critical | [description] |
| [package] | 🟠 High | [description] |

### Recommendation

```bash
npm audit fix
```

---

## Local Environment (Docker)

### Configured Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Cache and queues |
| [etc.] | [etc.] | [etc.] |

---

## Issues Found

### 🔴 Critical

#### [INF-002] MCP Supabase not configured
**Impact:** RLS analysis impossible, security-analyzer limited
**Fix:** Follow the configuration guidance above

---

### 🟠 High

#### [INF-003] Critical vulnerability in dependency
**Package:** [name]
**Fix:** `npm audit fix` or update manually

---

### 🟡 Medium

[Medium severity issues]

---

## Recommendations

1. **[Priority 1]:** Configure MCP Supabase for complete analysis
2. **[Priority 2]:** Fix dependency vulnerabilities
3. **[Priority 3]:** [Other recommendations]

---

## Analysis Limitations

Due to the current infrastructure, the following analyses could NOT be performed:

| Analysis | Reason | How to Enable |
|----------|--------|---------------|
| RLS | MCP not configured | Configure MCP Supabase |
| [etc.] | [etc.] | [etc.] |

---

*Document generated by the infrastructure-check subagent*
```

---

## Critical Rules

**DO:**
- ✅ Check MCP Supabase FIRST
- ✅ Generate configuration guidance when necessary
- ✅ Document analysis limitations
- ✅ Be specific about what cannot be analyzed

**DO NOT:**
- ❌ Fail silently if MCP is not available
- ❌ Ignore dependency vulnerabilities
- ❌ Assume that infrastructure is configured

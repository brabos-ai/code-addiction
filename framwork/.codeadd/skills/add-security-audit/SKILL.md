---
name: add-security-audit
description: |
  Security audit: OWASP Top 10, multi-tenancy, injection, auth, XSS, dependencies.
---

# Security Audit

Skill para auditoria de segurança baseada em OWASP Top 10.

**Use para:** Validar segurança, auditar codebase, identificar vulnerabilidades
**Não use para:** Corrigir código (apenas reporta), code review geral

**Referência:** Sempre consultar `CLAUDE.md` para padrões gerais do projeto.

---

## OWASP Checklist

### A01 — Broken Access Control (CRITICAL)

Multi-tenant rules:

- ALL queries filter by `account_id`
- `account_id` from JWT (NEVER body)
- Ownership validated before UPDATE/DELETE
- Guards on protected endpoints

Searches to run:

- `grep 'findAll|selectFrom'` → check `account_id` filter
- `grep '@Body()'` → check no `accountId` from body

---

### A02 — Cryptographic Failures

Checks:

- Credentials encrypted
- Passwords NEVER in logs
- Tokens not in responses
- API keys via env vars
- Secrets not committed

Searches:

- `grep 'sk_live|api_key|secret'` → no hardcoded
- `grep 'logger|console'` → no sensitive data

---

### A03 — Injection (CRITICAL)

SQL/NoSQL:

- Parametrized queries
- Validated inputs
- No `.raw()` with user input

Command injection:

- No `exec`/`spawn` with user input

Searches:

- `grep 'raw('` → check user input
- `grep '${'` in queries → SQL injection

---

### A04 — Insecure Design

Checks:

- Guards on ALL protected routes
- JWT expiration
- Refresh token handling
- Logout invalidates session

Search: `grep '@Get|@Post'` → check `@UseGuards`.

---

### A05 — Misconfiguration

Checks:

- CORS not `origin:'*'` in prod
- Secrets via env vars
- Debug disabled in prod
- No stack traces exposed
- Deps updated

Searches:

- `grep 'origin.*\*'` → open CORS
- `grep 'process.env'` → use `IConfigurationService`

---

### A06 — Vulnerable Components

Checks:

- `npm audit` no critical/high
- Deps regularly updated

Command: `npm audit --json | grep -E 'critical|high'`.

---

### A07 — Auth Failures

Checks:

- bcrypt/argon2 for passwords
- Rate limiting on auth
- MFA available
- Secure password recovery

---

### A08 — Integrity Failures

Checks:

- Deps from trusted sources
- Lock files committed
- CI/CD security validations

---

### A09 — Logging Failures

Checks:

- No sensitive data in logs
- Sufficient context for debug
- Log unauthorized access attempts

---

### A10 — SSRF

Checks:

- External URLs validated/whitelisted
- No arbitrary user URLs
- Validate hostnames before fetch

---

### Extra — XSS

Checks:

- Outputs sanitized
- No `dangerouslySetInnerHTML` (or sanitized)
- URLs validated in `href`/`src`

Search: `grep 'dangerouslySetInnerHTML'` → check sanitization.

---

### Extra — Mass Assignment

Checks:

- Explicit DTOs (no body spread)
- Use `@Expose`/`@Exclude`
- Validate `PartialType`

Search: `grep '...body|...dto'` → spread vulnerability.

---

## Scoring

Severity weights and status thresholds (lookup):

{"severity":{"critical":3,"high":2,"medium":1,"low":0.5}}
{"score":"10 - (weighted_sum / 5)"}
{"status":{"8-10":"✅ Secure","6-7":"⚠️ Attention","4-5":"🟠 Risk","0-3":"🔴 Vulnerable"}}

---

## Process

1. **Setup:** Read `security.md`, `CLAUDE.md`, identify scope files
2. **Analyze:** For EACH OWASP category → run searches → verify (no false positives) → classify severity
3. **Multi-Tenant:** Check ALL queries filter `account_id`, ID from JWT
4. **Report:** Calculate score, group by severity, create `security-report.md`

---

## Output Template

```markdown
# Security Audit Report

**Date:** [date] | **Scope:** [path]

## Score

| Category | Status | Findings |
|----------|--------|----------|
| Access Control | ✅/⚠️/❌ | X |
| Crypto | ✅/⚠️/❌ | X |
| Injection | ✅/⚠️/❌ | X |
| Auth | ✅/⚠️/❌ | X |
| Config | ✅/⚠️/❌ | X |
| XSS | ✅/⚠️/❌ | X |
| Deps | ✅/⚠️/❌ | X |
| **OVERALL** | **⚠️** | **X** |

## Critical Findings

### Finding #1
**Category:** [OWASP] | **Severity:** 🔴 | **File:** `path:line`

**Vulnerable Code:** [code]
**Impact:** [simple language]
**Recommendation:** [fix]

## Positive Points
- [good practices found]

## Priority Actions
1. [most urgent]
2. [second]
3. [third]
```

---

## Rules

**Do:**

- Analyze ALL files in scope
- Check ALL OWASP categories
- Verify context (avoid false positives)
- Include exact line
- Explain impact simply
- Give specific recommendations

**Don't:**

- Auto-fix (only report)
- False positives without context
- Ignore minor findings
- Use jargon without explanation

---

## False Positive Prevention

Context that matters:

- `process.env.NODE_ENV` is OK
- Internal queries can use `.raw()`
- Validated DTOs can use `PartialType`

Framework protections:

- NestJS sanitizes some inputs
- Kysely parametrizes queries
- React escapes outputs by default

Project patterns:

- Check documented patterns
- `IConfigurationService` is correct
- Don't report as violation if it follows the docs

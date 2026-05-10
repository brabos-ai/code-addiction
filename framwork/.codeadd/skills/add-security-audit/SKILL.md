---
name: add-security-audit
description: |
  Security audit: OWASP Top 10, multi-tenancy, injection, auth, XSS, dependencies.
---

# Security Audit

**Use for:** Validate security, audit codebase, identify vulnerabilities
**Do not use for:** Writing security fixes, dependency upgrades, incident response, general code review

**Reference:** Always consult `CLAUDE.md` for general project standards.

---

## OWASP Checklist

### A01 — Broken Access Control (CRITICAL)

Multi-tenant rules:

- [ ] ALL queries filter by `account_id`
- [ ] `account_id` from JWT (NEVER body)
- [ ] Ownership validated before UPDATE/DELETE
- [ ] Guards on protected endpoints

Searches to run:

- `grep 'findAll|selectFrom'` → check `account_id` filter
- `grep '@Body()'` → check no `accountId` from body

---

### A02 — Cryptographic Failures

- [ ] Credentials encrypted
- [ ] Passwords NEVER in logs
- [ ] Tokens not in responses
- [ ] API keys via env vars
- [ ] Secrets not committed

Searches:

- `grep 'sk_live|api_key|secret'` → no hardcoded
- `grep 'logger|console'` → no sensitive data

---

### A03 — Injection (CRITICAL)

SQL/NoSQL:

- [ ] Parametrized queries
- [ ] Validated inputs
- [ ] No `.raw()` with user input

Command injection:

- [ ] No `exec`/`spawn` with user input

Searches:

- `grep 'raw('` → check user input
- `grep '${'` in queries → SQL injection

---

### A04 — Insecure Design

- [ ] Guards on ALL protected routes
- [ ] JWT expiration
- [ ] Refresh token handling
- [ ] Logout invalidates session

Search: `grep '@Get|@Post'` → check `@UseGuards`.

---

### A05 — Misconfiguration

- [ ] CORS not `origin:'*'` in prod
- [ ] Debug disabled in prod
- [ ] No stack traces exposed
- [ ] Deps updated

Secrets/env vars: see A02.

Searches:

- `grep 'origin.*\*'` → open CORS
- `grep 'process.env'` → use `IConfigurationService`

---

### A06 — Vulnerable Components

- [ ] `npm audit` no critical/high
- [ ] Deps regularly updated

Command: `npm audit --json | grep -E 'critical|high'`.

---

### A07 — Auth Failures

- [ ] bcrypt/argon2 for passwords
- [ ] Rate limiting on auth
- [ ] MFA available
- [ ] Secure password recovery

---

### A08 — Integrity Failures

- [ ] Deps from trusted sources
- [ ] Lock files committed
- [ ] CI/CD security validations

---

### A09 — Logging Failures

- [ ] Sufficient context for debug
- [ ] Log unauthorized access attempts

Sensitive data in logs: see A02.

---

### A10 — SSRF

- [ ] External URLs validated/whitelisted
- [ ] No arbitrary user URLs
- [ ] Validate hostnames before fetch

---

### Extra — XSS

- [ ] Outputs sanitized
- [ ] No `dangerouslySetInnerHTML` (or sanitized)
- [ ] URLs validated in `href`/`src`

Search: `grep 'dangerouslySetInnerHTML'` → check sanitization.

---

### Extra — Mass Assignment

- [ ] Explicit DTOs (no body spread)
- [ ] Use `@Expose`/`@Exclude`
- [ ] Validate `PartialType`

Search: `grep '...body|...dto'` → spread vulnerability.

---

## Scoring

Formula: `score = 10 - (weighted_sum / 5)`

| Severity | Weight | Score Range | Status |
|----------|--------|-------------|--------|
| critical | 3 | 8-10 | ✅ Secure |
| high | 2 | 6-7 | ⚠️ Attention |
| medium | 1 | 4-5 | 🟠 Risk |
| low | 0.5 | 0-3 | 🔴 Vulnerable |

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

- Analyze ALL files in scope, check ALL OWASP categories, include exact line, explain impact simply
- Verify context to avoid false positives; do not flag minor findings without justification
- Report only — never auto-fix
- Avoid jargon without explanation

---

## False Positive Prevention

Stack-specific protections (NestJS sanitization, Kysely parametrization, React escaping, etc.) and accepted patterns (e.g. `process.env.NODE_ENV`, internal `.raw()`, validated `PartialType`): consult `CLAUDE.md` for the project's stack and documented exceptions.

Project patterns:

- Check documented patterns
- `IConfigurationService` is correct
- Don't report as violation if it follows the docs

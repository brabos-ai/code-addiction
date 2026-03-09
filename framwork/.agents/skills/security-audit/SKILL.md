<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/security-audit/SKILL.md -->
---
name: security-audit
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

### A01 - Broken Access Control (CRITICAL)

{"multiTenant":["ALL queries filter by account_id","account_id from JWT (NEVER body)","ownership validated before UPDATE/DELETE","guards on protected endpoints"]}

{"search":["grep 'findAll|selectFrom' → check account_id filter","grep '@Body()' → check no accountId from body"]}

---

### A02 - Cryptographic Failures

{"check":["credentials encrypted","passwords NEVER in logs","tokens not in responses","API keys via env vars","secrets not committed"]}

{"search":["grep 'sk_live|api_key|secret' → no hardcoded","grep 'logger|console' → no sensitive data"]}

---

### A03 - Injection (CRITICAL)

{"sqlNoSql":["parametrized queries","validated inputs","no .raw() with user input"]}

{"command":["no exec/spawn with user input"]}

{"search":["grep 'raw(' → check user input","grep '${' in queries → SQL injection"]}

---

### A04 - Insecure Design

{"auth":["guards on ALL protected routes","JWT expiration","refresh token handling","logout invalidates session"]}

{"search":["grep '@Get|@Post' → check @UseGuards"]}

---

### A05 - Misconfiguration

{"check":["CORS not origin:'*' in prod","secrets via env vars","debug disabled in prod","no stack traces exposed","deps updated"]}

{"search":["grep 'origin.*\\*' → open CORS","grep 'process.env' → use IConfigurationService"]}

---

### A06 - Vulnerable Components

{"check":["npm audit no critical/high","deps regularly updated"]}

{"cmd":"npm audit --json | grep -E 'critical|high'"}

---

### A07 - Auth Failures

{"check":["bcrypt/argon2 for passwords","rate limiting on auth","MFA available","secure password recovery"]}

---

### A08 - Integrity Failures

{"check":["deps from trusted sources","lock files committed","CI/CD security validations"]}

---

### A09 - Logging Failures

{"check":["no sensitive data in logs","sufficient context for debug","log unauthorized access attempts"]}

---

### A10 - SSRF

{"check":["external URLs validated/whitelisted","no arbitrary user URLs","validate hostnames before fetch"]}

---

### Extra - XSS

{"check":["outputs sanitized","no dangerouslySetInnerHTML (or sanitized)","URLs validated in href/src"]}

{"search":["grep 'dangerouslySetInnerHTML' → check sanitization"]}

---

### Extra - Mass Assignment

{"check":["explicit DTOs (no body spread)","use @Expose/@Exclude","validate PartialType"]}

{"search":["grep '...body|...dto' → spread vulnerability"]}

---

## Scoring

{"severity":{"critical":3,"high":2,"medium":1,"low":0.5}}
{"score":"10 - (weighted_sum / 5)"}
{"status":{"8-10":"✅ Secure","6-7":"⚠️ Attention","4-5":"🟠 Risk","0-3":"🔴 Vulnerable"}}

---

## Process

1. **Setup:** Read security.md, CLAUDE.md, identify scope files
2. **Analyze:** For EACH OWASP category → run searches → verify (no false positives) → classify severity
3. **Multi-Tenant:** Check ALL queries filter account_id, ID from JWT
4. **Report:** Calculate score, group by severity, create security-report.md

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

**Dont:**
- Auto-fix (only report)
- False positives without context
- Ignore minor findings
- Use jargon without explanation

---

## False Positive Prevention

{"contextMatters":["process.env.NODE_ENV is OK","internal queries can use .raw()","validated DTOs can use PartialType"]}

{"frameworkProtections":["NestJS sanitizes some inputs","Kysely parametrizes queries","React escapes outputs by default"]}

{"projectPatterns":["check documented patterns","IConfigurationService is correct","don't report as violation if follows docs"]}

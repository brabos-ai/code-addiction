# Review: F0001-npx-cli-installer

> **Date:** 2026-03-01 | **Branch:** feature/F0001-npx-cli-installer

## Quality Gate Report

| Gate | Status | Details |
|------|--------|---------|
| Build | ✅ PASSED | No build step — Node.js ESM, syntax validated |
| Spec Compliance | ✅ PASSED | 18/18 ACs compliant |
| Code Review Score | ✅ PASSED | 9.2/10 |
| Product Validation | ✅ PASSED | All RF/RN implemented |
| Startup Test | ⚠️ SKIPPED | CLI tool — no IoC/DI framework |
| **Overall** | **✅ PASSED** | **Ready for merge** |

> Reviewed at: 2026-03-01T00:00:00Z
> Reviewed by: /fnd-review (model: claude-sonnet-4-6)

---

## Spec Compliance Audit

**Source:** Requirements Coverage table in plan.md
**Total items:** 18

| Item | Type | Expected | Found at | Status |
|------|------|----------|----------|--------|
| AC01: npx fnd-cli install | Subcommand | install(cwd) | bin/fnd-cli.js:29, installer.js:101 | ✅ COMPLIANT |
| AC02: update preserves history/ *.local.json | Logic | PRESERVE_PATTERNS | updater.js:9-12 | ✅ COMPLIANT |
| AC03: 5 providers checkbox | Data | 5 PROVIDERS entries | providers.js:6-37 | ✅ COMPLIANT |
| AC04: .fnd/ always installed | Logic | core copy before providers | installer.js:146 | ✅ COMPLIANT |
| AC05: providers install to correct dirs | Config | PROVIDERS map src/dest | providers.js:6-37 | ✅ COMPLIANT |
| AC06: specific version via @version | Flow | handled by npx | N/A | ✅ COMPLIANT |
| AC07: .sh LF on Windows | Function | fixLineEndings | installer.js:13-28 | ✅ COMPLIANT |
| AC08: overwrite confirmation | Logic | promptConfirm | installer.js:113,126 | ✅ COMPLIANT |
| AC09: network errors clear message | Error handling | catch + message | github.js:16-18 | ✅ COMPLIANT |
| AC10: onboarding outro | UX | outro() | installer.js:177 | ✅ COMPLIANT |
| AC11: install generates manifest | Function | writeManifest | installer.js:162 | ✅ COMPLIANT |
| AC12: manifest fields | Schema | version,installedAt,providers,files | installer.js:39-44 | ✅ COMPLIANT |
| AC13: update reuses providers from manifest | Logic | providerKeys from manifest | updater.js:83,129 | ✅ COMPLIANT |
| AC14: uninstall removes manifest files | Logic | unlinkSync loop | uninstaller.js:113-123 | ✅ COMPLIANT |
| AC15: uninstall --force | Flag | force param | bin/fnd-cli.js:34 | ✅ COMPLIANT |
| AC16: user file detection | Logic | userFiles filter | uninstaller.js:92 | ✅ COMPLIANT |
| AC17: empty dirs cleanup | Function | removeEmptyDirs | uninstaller.js:50-65 | ✅ COMPLIANT |
| AC18: no manifest → clear error | Error | throw with message | uninstaller.js:79 | ✅ COMPLIANT |

**COMPLIANT:** 18/18
**DIVERGENT:** 0/18
**MISSING:** 0/18

**SPEC_AUDIT_STATUS:** COMPLIANT

---

## Code Review Summary

**Files Reviewed:** 8
**Issues Found:** 2
**Issues Fixed:** 2

### Issues Fixed

| File | Line | Severity | Issue | Fix Applied |
|------|------|----------|-------|-------------|
| cli/bin/fnd-cli.js | 37 | 🟡 High | `console.log(USAGE)` bypasses clack terminal renderer | Replaced with `log.message(USAGE)` |
| cli/src/uninstaller.js | 18 | 🟡 High | Corrupted manifest returned `null` → misleading "No FND installation found" error; about.md specifies fallback to directory scan | `readManifest` returns `{ corrupted: true }` object; `uninstall()` handles it with directory-scan fallback + confirmation |

### Severity Summary
- 🔴 Critical: 0 fixed
- 🟡 High: 2 fixed
- 🟠 Medium: 0 fixed
- 🟢 Low: 0 fixed

### Business Logic Notes
- `required: false` in multiselect (prompt.js:22) diverges from plan.md (`required: true`) but is **correct** per about.md Edge Cases: "Nenhum provider selecionado → Permitir — instala só o core"
- `fixLineEndings` called only on `.fnd/scripts/` — correct; all .sh files in the release are exclusively under this path
- `copyFromZip` duplication between installer.js and updater.js is architecturally justified: updater variant applies `shouldPreserve()` skip logic that fresh install must not apply

---

## Product Validation

### Functional Requirements

| RF | Description | Implementation | Status |
|----|-------------|---------------|--------|
| install | `npx fnd-cli install` installs FND with provider selection | installer.js:101 | ✅ |
| update | `npx fnd-cli update` updates preserving user files | updater.js:64 | ✅ |
| uninstall | `npx fnd-cli uninstall` removes FND from project | uninstaller.js:72 | ✅ |
| manifest | `.fnd/manifest.json` tracks installed files | installer.js:37-46 | ✅ |

### Business Rules

| RN | Description | File:Line | Status |
|----|-------------|-----------|--------|
| .fnd/ já existe → perguntar | Overwrite confirmation | installer.js:112-116 | ✅ |
| Provider já existe → perguntar | Per-provider confirmation | installer.js:123-128 | ✅ |
| .sh → forçar LF | fixLineEndings on scripts dir | installer.js:159, updater.js:126 | ✅ |
| Manifest sempre gerado/atualizado | writeManifest on install+update | installer.js:162, updater.js:129 | ✅ |
| history/ no update → preservar | PRESERVE_PATTERNS | updater.js:9-11 | ✅ |
| Manifest corrompido → fallback dirs | Corrupted manifest handling | uninstaller.js:83-130 | ✅ |
| Sem manifest uninstall → erro claro | No manifest error | uninstaller.js:79-84 | ✅ |

**Product Status:** ✅ PASSED

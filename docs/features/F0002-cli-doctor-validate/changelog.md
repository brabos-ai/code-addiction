# Changelog: F0002-cli-doctor-validate

> **Date:** 2026-03-02 | **Branch:** feature/F0002-cli-doctor-validate

## Summary

Implemented three diagnostic CLI commands for the fnd-cli tool: `doctor` for environment health checks, `validate` for file integrity verification via SHA-256 hashing, and `config show` for installation information display. Extended manifest schema with `releaseTag` and `hashes` fields, enabling file integrity tracking and surgical repair capability without full reinstallation.

---

## By Iteration

### I1 - implement-diagnostic-commands (add)

**Scope:** Implement doctor, validate, config commands with hash support

**Files:**
| File | Type | Purpose |
|------|------|---------|
| cli/src/doctor.js | new | Environment health check (Node, Git, .fnd/, manifest) |
| cli/src/validator.js | new | File integrity validation via SHA-256; repair from release ZIP |
| cli/src/config.js | new | Installation information display with optional update check |
| cli/src/installer.js | modified | Extended writeManifest() with SHA-256 hash calculation and releaseTag |
| cli/bin/fnd-cli.js | modified | Added CLI routing for doctor, validate [--repair], config show [--verbose] |
| cli/tests/doctor.e2e.test.js | new | End-to-end tests for doctor command across all check scenarios |
| cli/tests/validator.e2e.test.js | new | End-to-end tests for validate and validate --repair commands |
| cli/tests/config.e2e.test.js | new | End-to-end tests for config show and config show --verbose |

**Implementations:**
- `doctor.js::checkNode()`: Verifies Node version >= 18
- `doctor.js::checkGit()`: Verifies Git installation via spawn
- `doctor.js::checkFndDir()`: Verifies .fnd/ directory and contents
- `doctor.js::checkManifest()`: Verifies manifest.json validity
- `doctor.js::doctor()`: Orchestrates all checks, reports status with ✅/⚠️/❌, returns exit code
- `validator.js::calculateHash()`: Computes SHA-256 hash via node:crypto
- `validator.js::validateFiles()`: Compares actual vs expected hashes, categorizes results
- `validator.js::downloadRepair()`: Downloads release ZIP and restores problematic files only
- `validator.js::validate()`: Main validation flow with optional repair capability
- `config.js::formatDate()`: Human-readable date formatting for manifest metadata
- `config.js::checkUpdate()`: Fetches latest GitHub tag and compares versions
- `config.js::config()`: Displays manifest info (version, releaseTag, providers, file count, install date)
- `installer.js::writeManifest()`: Extended to compute hashes per file and save releaseTag
- `fnd-cli.js`: Added routing for all three commands with proper flag parsing

---

## Core Files

### 🔴 Core Services
| File | Iteration | Description |
|------|-----------|-------------|
| cli/src/doctor.js | I1 | Health check service — verifies Node >=18, Git, .fnd/, manifest validity |
| cli/src/validator.js | I1 | Integrity check service — SHA-256 validation, surgical repair capability |
| cli/src/config.js | I1 | Configuration display service — manifest info + optional update check |
| cli/src/installer.js | I1 | Extended manifest schema — added releaseTag and hashes fields |

### 🟡 Support
| File | Description |
|------|-------------|
| cli/bin/fnd-cli.js | CLI routing — doctor, validate [--repair], config show [--verbose] |
| cli/tests/doctor.e2e.test.js | 30 test cases covering all doctor check scenarios |
| cli/tests/validator.e2e.test.js | 27 test cases covering validation, repair, edge cases |
| cli/tests/config.e2e.test.js | 27 test cases covering config display and update check |
| cli/tests/config.internal.test.js | Internal tests for config utilities |
| cli/tests/doctor.internal.test.js | Internal tests for doctor check functions |
| cli/tests/installer.test.js | Tests for hash calculation and manifest writing |
| cli/package.json | No new dependencies added |

### 📊 Statistics
- **Total Files:** 14 changed (8 new, 5 modified, 1 dependency cleanup)
- **High Priority:** 5 (doctor.js, validator.js, config.js, installer.js, fnd-cli.js)
- **Medium Priority:** 4 (test files)
- **Low Priority:** 1 (.gitignore, package-lock.json)
- **Lines Added:** ~1,200 (core logic + comprehensive test coverage)

---

## Feature Implementations

### ✅ RF01: npx fnd-cli doctor
**Status:** Complete | **Location:** cli/src/doctor.js:96-141

Checks Node version, Git installation, .fnd/ directory presence, and manifest validity. Reports each check with status emoji (✅/⚠️/❌). Returns exit code 0 if all checks pass, 1 otherwise.

### ✅ RF02: npx fnd-cli validate
**Status:** Complete | **Location:** cli/src/validator.js:40-59

Compares file SHA-256 hashes against manifest. Categorizes files as ok, missing, or modified. Returns exit code 0 if all files match, 1 otherwise.

### ✅ RF03: npx fnd-cli validate --repair
**Status:** Complete | **Location:** cli/src/validator.js:67-106

Downloads release ZIP from GitHub (via releaseTag in manifest). Restores only files that are missing or modified. Preserves any user customizations to non-problematic files.

### ✅ RF04: npx fnd-cli config show
**Status:** Complete | **Location:** cli/src/config.js:58-69

Displays: version, releaseTag, installedAt, active providers, total file count. Returns exit code 0 if manifest found, 1 otherwise.

### ✅ RF05: npx fnd-cli config show --verbose
**Status:** Complete | **Location:** cli/src/config.js:72-93

Includes all RF04 information plus checks GitHub for latest version and indicates if an update is available.

### ✅ RF06: Manifest Schema Extended
**Status:** Complete | **Location:** cli/src/installer.js:49-70

Manifest now includes:
- `releaseTag`: Version identifier for repair operations
- `hashes`: Map of file paths to SHA-256 digests

---

## Acceptance Criteria Validation

- ✅ **AC01:** `doctor` returns ✅/⚠️/❌ per check and correct exit codes (cli/src/doctor.js:124-141)
- ✅ **AC02:** `validate` detects missing and modified files via SHA-256 (cli/src/validator.js:40-59)
- ✅ **AC03:** `validate --repair` restores problematic files from release ZIP (cli/src/validator.js:67-106)
- ✅ **AC04:** `config show` displays version, providers, file count, install date (cli/src/config.js:58-69)
- ✅ **AC05:** `config show --verbose` includes update availability check (cli/src/config.js:72-93)
- ✅ **AC06:** Manifests without hashes treated with warning, no failure (cli/src/validator.js:108-117)
- ✅ **AC07:** Exit code 0=ok, 1=problems consistent across all commands (all modules)
- ✅ **AC08:** Zero new external dependencies (package.json unchanged except test cleanup)

---

## Requirements Coverage

| Total | Covered | Status |
|-------|---------|--------|
| 13 RFs + 7 RNs | 13/13 | ✅ **100%** |

All functional (RF) and non-functional (RN) requirements fully implemented and tested.

---

## Quality Assurance

### Code Review (from review.md)
- **Overall:** ✅ PASSED (9/10 score)
- **Issues Fixed:** 6 (3 high severity, 1 medium, 2 low)
  - Removed unused imports and dead code in test files
  - All severity levels addressed before merge

### Test Coverage (from review.md)
- **Status:** ✅ 84/84 tests passing
- **Framework:** Vitest with e2e and internal test suites
- **Coverage Areas:** Happy paths, error cases, edge cases (old manifests, network failures, file corruption)

### Backward Compatibility
- ✅ Old manifests (without hashes) work with warning message
- ✅ No breaking changes to existing CLI behavior
- ✅ Manifest schema extension is additive (no field removals)

---

_Generated by /fnd-done_

# Plan: F0002-cli-doctor-validate

## Overview

Add three diagnostic commands to fnd-cli: doctor (environment health), validate [--repair] (file integrity via SHA-256), and config show [--verbose] (installation info + update check). Extends manifest schema with releaseTag and hashes for integrity validation.

## Backend

### Modules
| File | Purpose | Exports |
|------|---------|---------|
| cli/src/doctor.js | Environment health checks | doctor(cwd) |
| cli/src/validator.js | File integrity validation | validate(cwd, repair) |
| cli/src/config.js | Installation info display | config(cwd, verbose) |

### Functions
| Function | Module | Purpose | Returns |
|----------|--------|---------|---------|
| doctor | doctor.js | Check Node, Git, .fnd/, manifest | Promise<void> |
| validate | validator.js | Compare SHA-256 hashes | Promise<void> |
| repair | validator.js | Restore files from release ZIP | Promise<void> |
| config | config.js | Display manifest info | Promise<void> |
| checkUpdate | config.js | Compare to latest GitHub tag | Promise<boolean> |
| calculateHash | installer.js | SHA-256 of file via node:crypto | string |
| writeManifest | installer.js | Save extended manifest with hashes | void |

### CLI Commands
| Command | Flags | Handler | Exit Codes |
|---------|-------|---------|------------|
| doctor | - | doctor(cwd) | 0/1 |
| validate | --repair | validate(cwd, repair) | 0/1 |
| config show | --verbose | config(cwd, verbose) | 0/1 |

### Data Structures
| Structure | Fields | Purpose |
|-----------|--------|---------|
| ManifestExtended | version, releaseTag, installedAt, providers, files, hashes | Extended manifest with integrity data |
| ValidationResult | ok, missing, modified | File integrity check results |
| DoctorReport | node, git, fndDir, manifest | Individual check statuses |

### Integration Points
1. **cli/src/installer.js** → Extends writeManifest() to calculate SHA-256 via node:crypto and save releaseTag
2. **cli/src/validator.js** → Reuses readManifest() from uninstaller.js, downloadZip() from github.js
3. **cli/src/config.js** → Reuses getLatestTag() from github.js for update check
4. **cli/bin/fnd-cli.js** → Adds routing for doctor, validate [--repair], config show [--verbose]

Reference: `cli/src/installer.js:37-46` (writeManifest), `cli/src/uninstaller.js:15-23` (readManifest), `cli/src/github.js:9-29` (getLatestTag), `cli/bin/fnd-cli.js:29-39` (routing pattern)

---

## Main Flow

1. User runs \npx fnd-cli doctor\ → checks Node >=18, Git, .fnd/, manifest → displays report with ✅/⚠️/❌
2. User runs \npx fnd-cli validate\ → reads manifest, compares SHA-256 hashes → reports ok/missing/modified
3. User runs \npx fnd-cli validate --repair\ → downloads ZIP from releaseTag → restores only problematic files
4. User runs \npx fnd-cli config show\ → displays version, providers, file count, install date
5. User runs \npx fnd-cli config show --verbose\ → + checks GitHub for update availability

## Implementation Order

1. **Backend**: Extend installer.js with hash calculation, create doctor.js, validator.js, config.js, update CLI routing

## Quick Reference

| Pattern | How to Find |
|---------|-------------|
| CLI async function | cli/src/installer.js:37-46 |
| Read manifest | cli/src/uninstaller.js:15-23 |
| GitHub API | cli/src/github.js:9-29 |
| CLI routing | cli/bin/fnd-cli.js:29-39 |

---

## Requirements Coverage

| Criterion | Requirement | Covered? | Tasks |
|-----------|-------------|----------|-------|
| AC01 | doctor retorna ✅/⚠️/❌ e exit code correto | ✅ | 1.2, 1.5, 2.1 |
| AC02 | validate detecta arquivos faltando/alterados | ✅ | 1.1, 1.3, 1.5, 2.2 |
| AC03 | validate --repair restaura arquivos | ✅ | 1.3, 1.5, 2.2 |
| AC04 | config show exibe versão/providers/arquivos/data | ✅ | 1.4, 1.5, 2.3 |
| AC05 | config show --verbose checa update | ✅ | 1.4, 1.5, 2.3 |
| AC06 | Manifests antigos tratados com aviso | ✅ | 1.1, 1.3 |
| AC07 | Exit 0=ok, 1=problemas em todos comandos | ✅ | 1.2, 1.3, 1.4, 1.5 |
| AC08 | Sem novas dependências externas | ✅ | All tasks |

**Status:** ✅ 100% covered

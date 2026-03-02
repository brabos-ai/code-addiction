# Tasks: CLI Doctor, Validate & Config Show

## Metadata

| Campo | Valor |
|-------|-------|
| Complexity | STANDARD |
| Total tasks | 8 |
| Services | backend, test |

## Tasks

| ID | Description | Service | Files | Deps | Verify |
|----|-------------|---------|-------|------|--------|
| 1.1 | Extend installer with hash and releaseTag | backend | `cli/src/installer.js` | - | `cd cli && npm link && npx fnd-cli install && cat .fnd/manifest.json | grep -E \"(hashes|releaseTag)\"` |
| 1.2 | Create doctor.js environment checker | backend | `cli/src/doctor.js` | - | `cd cli && node -e \"import('./src/doctor.js').then(m => m.doctor(process.cwd()))\"` |
| 1.3 | Create validator.js with hash validation | backend | `cli/src/validator.js` | 1.1 | `cd cli && node -e \"import('./src/validator.js').then(m => m.validate(process.cwd(), false))\"` |
| 1.4 | Create config.js display module | backend | `cli/src/config.js`, `cli/src/github.js` | - | `cd cli && node -e \"import('./src/config.js').then(m => m.config(process.cwd(), false))\"` |
| 1.5 | Update CLI routing for all commands | backend | `cli/bin/fnd-cli.js` | 1.1, 1.2, 1.3, 1.4 | `cd cli && npm link && npx fnd-cli doctor && npx fnd-cli validate && npx fnd-cli config show` |
| 2.1 | E2E test for doctor command | test | `cli/tests/doctor.e2e.test.js` | 1.5 | `cd cli && npm run test:e2e` |
| 2.2 | E2E test for validate and repair | test | `cli/tests/validator.e2e.test.js` | 1.5 | `cd cli && npm run test:e2e` |
| 2.3 | E2E test for config show | test | `cli/tests/config.e2e.test.js` | 1.5 | `cd cli && npm run test:e2e` |

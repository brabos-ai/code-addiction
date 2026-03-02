# Tasks: FND CLI Installer

## Metadata

| Campo | Valor |
|-------|-------|
| Complexity | STANDARD |
| Total tasks | 10 |
| Services | infra, backend |

## Tasks

| ID | Description | Service | Files | Deps | Verify |
|----|-------------|---------|-------|------|--------|
| 1.1 | Create package.json with bin config | infra | `cli/package.json` | - | `node -e "require('./cli/package.json')"` |
| 1.2 | Create entry point with subcommand routing (install, update, uninstall) | infra | `cli/bin/fnd-cli.js` | 1.1 | `node cli/bin/fnd-cli.js --help` |
| 2.1 | Create providers map with source/dest pairs | backend | `cli/src/providers.js` | 1.1 | `node -e "import('./cli/src/providers.js')"` |
| 3.1 | Create GitHub API module (latest tag + zip download) | backend | `cli/src/github.js` | 1.1 | `node -e "import('./cli/src/github.js')"` |
| 4.1 | Create multi-select prompt with @clack/prompts | backend | `cli/src/prompt.js` | 2.1 | `node cli/bin/fnd-cli.js install` (visual) |
| 5.1 | Create installer with manifest generation | backend | `cli/src/installer.js` | 2.1, 3.1, 4.1 | `npx . install` → check `.fnd/manifest.json` exists |
| 6.1 | Create updater reusing providers from manifest | backend | `cli/src/updater.js` | 5.1 | `npx . update` → check manifest version updated |
| 7.1 | Create uninstaller (read manifest, detect user files, remove, cleanup) | backend | `cli/src/uninstaller.js` | 5.1 | `npx . uninstall` → check dirs removed |
| 8.1 | Install deps and end-to-end manual test | infra | `cli/package.json` | 7.1 | `cd cli && npm install && cd /tmp/test && npx /path/cli install && npx /path/cli uninstall` |
| 8.2 | Test --force flag on uninstall | infra | - | 8.1 | `npx /path/cli uninstall --force` → no confirmation prompt |

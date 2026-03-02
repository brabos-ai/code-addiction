# Plan: F0001-npx-cli-installer

## Overview
CLI `fnd-cli` distribuído via `npx fnd-cli install` para instalação interativa dos arquivos FND no projeto do usuário, com multi-select de AI providers. Suporta `npx fnd-cli update` para atualização preservando configs do usuário.

---

## CLI Architecture

### Folder Structure
```
cli/
├── package.json              # type:"module", bin:"fnd-cli"
├── bin/
│   └── fnd-cli.js            # #!/usr/bin/env node — argv parser, routes to subcommand
├── src/
│   ├── prompt.js             # Interactive provider multi-select via @clack/prompts
│   ├── installer.js          # Orchestrates: download → extract → copy → LF fix → generate manifest
│   ├── updater.js            # Like installer but reuses providers from manifest
│   ├── uninstaller.js        # Read manifest → detect user files → confirm → remove → cleanup
│   ├── providers.js          # Provider map constant + resolution helpers
│   └── github.js             # GitHub API: latest release tag + zipball download
└── README.md
```

### Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| @clack/prompts | Interactive multi-select, spinner, confirm | ^0.10 |
| adm-zip | Extract GitHub zipball without native deps | ^0.5 |
| node:fs/cp | Recursive copy (Node 20+ built-in) | built-in |
| node:fetch | GitHub API + zip download (Node 18+ built-in) | built-in |

### Module Responsibility
| Module | Responsibility | Exports |
|--------|---------------|---------|
| bin/fnd-cli.js | Parse argv[2] as subcommand, delegate | — |
| src/providers.js | PROVIDERS map, resolveSelected(keys) → paths[] | PROVIDERS, resolveSelected |
| src/prompt.js | Show grouped multi-select, return selected keys | promptProviders |
| src/github.js | Fetch latest tag, download zipball as Buffer | getLatestTag, downloadZip |
| src/installer.js | Full install flow + manifest generation | install |
| src/updater.js | Update flow, reuses providers from manifest | update |
| src/uninstaller.js | Read manifest, detect user files, remove, cleanup | uninstall |

### Subcommands
| Command | Entry | Flow |
|---------|-------|------|
| `npx fnd-cli install` | installer.js | prompt → download → extract → copy core + selected → LF fix → generate manifest |
| `npx fnd-cli update` | updater.js | read manifest providers → download → extract → copy → update manifest |
| `npx fnd-cli uninstall` | uninstaller.js | read manifest → detect user files → confirm (--force skips) → remove files → cleanup empty dirs |
| (none / --help) | bin/fnd-cli.js | Print usage and exit |

### Interactive Prompts (Multi-Select Pattern)
Pattern follows create-next-app and giget: `@clack/prompts.multiselect` with `required: true`.

| Property | Value |
|----------|-------|
| message | "Select AI providers to install" |
| options | One entry per provider: `{ value: key, label, hint: "dest → .agent/" }` |
| initialValues | `["claude"]` (pre-selected default) |
| required | true (at least one provider) |

Flow: `intro()` → `multiselect()` → `confirm()` summary → `spinner()` during install → `outro()`.
Core (.fnd/) is always copied regardless of selection — not shown in prompt.

### Core Functions
| Function | Module | Purpose | Signature |
|----------|--------|---------|-----------|
| promptProviders | prompt.js | Multi-select UI, returns selected keys | () → Promise\<string[]\> |
| getLatestTag | github.js | Fetch latest release tag from GitHub API | (repo) → Promise\<string\> |
| downloadZip | github.js | Download zipball as Buffer | (repo, tag) → Promise\<Buffer\> |
| install | installer.js | Full install orchestration + manifest generation | (cwd, providers) → Promise\<void\> |
| update | updater.js | Update reusing providers from manifest | (cwd) → Promise\<void\> |
| uninstall | uninstaller.js | Read manifest, detect user files, remove, cleanup | (cwd, force) → Promise\<void\> |
| resolveSelected | providers.js | Map keys to source/dest pairs | (keys) → { src, dest }[] |
| fixLineEndings | installer.js | Force LF on .sh files | (dir) → void |
| writeManifest | installer.js | Write .fnd/manifest.json with version, providers, files | (cwd, version, providers, files) → void |
| readManifest | uninstaller.js | Read and parse .fnd/manifest.json | (cwd) → Manifest \| null |

### Error Handling Strategy
Wrap each subcommand in try/catch at bin level, use `@clack/prompts.cancel()` for Ctrl+C, `process.exit(1)` with `outro()` message on failure. No stack traces — only actionable messages.

### Windows Compatibility
After zip extraction, walk all `.sh` files under `.fnd/scripts/` and replace `\r\n` → `\n`. Runs on all platforms (no-op on Unix, fixes Windows).

---

### Manifest Schema
```json
{
  "version": "2.0.1",
  "installedAt": "2026-03-01T12:00:00Z",
  "providers": ["claude", "kilocode"],
  "files": [
    ".fnd/commands/fnd.md",
    ".fnd/scripts/feature-init.sh",
    ".claude/commands/fnd.md"
  ]
}
```

Generated during zip extraction loop — each copied file path is pushed to array. Written as last step of install.

---

## Main Flow — Install

1. User → `npx fnd-cli install` no diretório do projeto
2. CLI → `intro()` com branding
3. CLI → `getLatestTag()` busca latest release no GitHub
4. CLI → `multiselect()` com 5 providers (Claude pré-selecionado)
5. CLI → `confirm()` resume seleção e pede confirmação
6. CLI → `downloadZip()` baixa zipball do release
7. CLI → Extrai `framwork/.fnd/` → `.fnd/` (core, sempre) — coleta paths no array
8. CLI → Extrai providers selecionados para pastas destino — coleta paths no array
9. CLI → `fixLineEndings()` em todos `.sh`
10. CLI → `writeManifest()` grava `.fnd/manifest.json`
11. CLI → `outro()` com mensagem de onboarding

## Main Flow — Uninstall

1. User → `npx fnd-cli uninstall` (ou `--force`)
2. CLI → `readManifest()` lê `.fnd/manifest.json`
3. Se não existe → erro "No FND installation found"
4. CLI → Escaneia diretórios FND e compara com manifest
5. Se arquivos do usuário encontrados → avisa "Found N files not installed by FND"
6. Se não `--force` → `confirm()` mostra resumo e pede confirmação
7. CLI → Remove cada arquivo do manifest (skip se já não existe)
8. CLI → Remove diretórios vazios
9. CLI → Remove `.fnd/manifest.json` por último
10. CLI → `outro()` "FND removed successfully"

## Implementation Order

1. **Infra**: `cli/package.json` + `bin/fnd-cli.js` (entry point)
2. **Data**: `src/providers.js` (mapa de providers)
3. **API**: `src/github.js` (fetch tag + download zip)
4. **UX**: `src/prompt.js` (multi-select interativo)
5. **Core**: `src/installer.js` (orquestração install + manifest generation)
6. **Core**: `src/updater.js` (update reusing manifest providers)
7. **Core**: `src/uninstaller.js` (read manifest, detect user files, remove, cleanup)

## Requirements Coverage

| ID | Requirement | Covered? | Tasks |
|----|-------------|----------|-------|
| AC01 | `npx fnd-cli install` funciona sem instalação prévia | ✅ | 1.1, 3.1, 5.1 |
| AC02 | `npx fnd-cli update` preserva history/ e *.local.json | ✅ | 6.1 |
| AC03 | Checkbox mostra 5 providers | ✅ | 4.1 |
| AC04 | .fnd/ sempre instalado | ✅ | 5.1 |
| AC05 | Cada provider instala na pasta correta | ✅ | 2.1, 5.1 |
| AC06 | Versão específica via @version | ✅ | 3.1 |
| AC07 | .sh com LF no Windows | ✅ | 5.1 |
| AC08 | Sobrescrita pede confirmação | ✅ | 5.1 |
| AC09 | Erros de rede com mensagem clara | ✅ | 3.1, 5.1 |
| AC10 | Mensagem de onboarding ao final | ✅ | 5.1 |
| AC11 | Install gera .fnd/manifest.json | ✅ | 5.1 |
| AC12 | Manifest contém version, providers, installedAt, files[] | ✅ | 5.1 |
| AC13 | Update atualiza manifest e reutiliza providers | ✅ | 6.1 |
| AC14 | Uninstall remove arquivos do manifest | ✅ | 7.1 |
| AC15 | Uninstall --force remove sem confirmação | ✅ | 7.1 |
| AC16 | Detecção de arquivos do usuário antes de deletar | ✅ | 7.1 |
| AC17 | Diretórios vazios removidos após cleanup | ✅ | 7.1 |
| AC18 | Sem manifest → mensagem de erro clara | ✅ | 7.1 |

**Status:** ✅ 100% covered

## Quick Reference
| Pattern | Reference |
|---------|-----------|
| CLI entry point | create-next-app, giget |
| Multi-select | @clack/prompts multiselect |
| Zip extraction | adm-zip |
| LF fix | fs.readFileSync + replace \r\n |

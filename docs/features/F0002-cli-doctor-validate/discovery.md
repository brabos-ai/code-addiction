# Discovery: CLI Doctor, Validate & Config Show

> **Branch:** feature/F0002-cli-doctor-validate
> **Feature:** F0002
> **Date:** 2026-03-01

---

## Codebase Analysis

### Related Files
- `cli/bin/fnd-cli.js` - Entry point CLI, roteamento por `argv[2]`
- `cli/src/installer.js` - Fluxo de install + `writeManifest()` — precisa de hash + releaseTag
- `cli/src/uninstaller.js` - `readManifest()` pronto para reusar
- `cli/src/github.js` - `getLatestTag()` + `downloadZip()` — reusar no repair e no update check
- `cli/src/providers.js` - Mapa de providers — referência para iteração
- `cli/package.json` - Dependências (ESM, Node >=18, @clack/prompts, adm-zip)

### Patterns

- **ESM** — todos os módulos usam `import`/`export`; sem CommonJS
- **@clack/prompts** — toda UI via `intro`, `outro`, `spinner`, `log.info`, `log.warn`, `log.success`
- **Error handling** — throw capturado no `main()` de `fnd-cli.js`; `USER_CANCEL` tratado separado
- **JSON manifest** — `readFileSync` + `JSON.parse`; `JSON.stringify(obj, null, 2)` no write
- **Exit codes** — `process.exit(0)` sucesso, `process.exit(1)` erro

## Technical Context

### Dependencies

Sem novas dependências externas — tudo reutilizado:
- `@clack/prompts` — UI (já instalado)
- `node:crypto` — SHA-256 para hashes (built-in, Node >=18)
- `node:fs`, `node:path` — I/O (built-in)
- `adm-zip` — extração ZIP no `--repair` (já instalado)

### Integration Points

1. **`cli/bin/fnd-cli.js`** — adicionar routing para `doctor`, `validate`, `config`; parsear `--repair` e `--verbose`
2. **`cli/src/installer.js`** — estender `writeManifest()` para calcular SHA-256 de cada arquivo e salvar `releaseTag`
3. **`cli/src/github.js`** — reusar `getLatestTag()` no `config show` e `downloadZip()` no `--repair`
4. **`cli/src/uninstaller.js`** — reusar `readManifest()` nos três novos módulos

## Files Mapping

### To Create
- `cli/src/doctor.js` — verifica Node >=18, Git, `.fnd/` presente, manifest válido; exit 0/1
- `cli/src/validator.js` — compara hash atual vs hash no manifest; `--repair` redownload cirúrgico
- `cli/src/config.js` — exibe manifest (versão, providers, arquivos, data); `--verbose` checa update

### To Modify
- `cli/bin/fnd-cli.js` — import + routing dos 3 novos módulos + parse de flags + USAGE atualizado
- `cli/src/installer.js` — `writeManifest()` adiciona campos `releaseTag` e `hashes: { [filePath]: sha256 }`

## Technical Assumptions

| Assumption | Impact if Wrong |
|------------|-----------------|
| Manifests antigos (sem `hashes`/`releaseTag`) existem em campo | `validate` avisa mas não falha; `--repair` usa `getLatestTag()` como fallback |
| Paths no manifest usam forward slash | Cross-platform: normalizar no write/read |
| `node:crypto` disponível no Node >=18 | Sem impacto — é built-in garantido |

## References

### Files Consulted
- `cli/bin/fnd-cli.js`
- `cli/src/installer.js`
- `cli/src/uninstaller.js`
- `cli/src/github.js`
- `cli/src/providers.js`
- `cli/package.json`

### Related Features
- F0001-npx-cli-installer — infraestrutura base; estabelece padrões ESM, @clack/prompts, manifest, github.js

## Summary for Planning

### Executive Summary
F0002 adiciona três comandos de diagnóstico ao `fnd-cli`: `doctor` (saúde do ambiente), `validate [--repair]` (integridade de arquivos por hash) e `config show [--verbose]` (estado da instalação). Requer extensão do manifest schema (hash por arquivo + releaseTag) e criação de 3 módulos novos em `cli/src/`.

### Key Decisions
- Hash SHA-256 calculado no install, salvo em `manifest.hashes`
- `releaseTag` salvo no manifest; usado no `--repair` para redownload exato
- `doctor` verifica: Node >=18, Git, `.fnd/` existe, `manifest.json` parseável
- `config show` exibe: versão, providers, total de arquivos, data de install
- `config show --verbose` busca latest tag no GitHub e exibe se há update
- `validate --repair` redownload do ZIP da releaseTag salva → restaura só arquivos faltando/alterados
- Backward compat: manifests sem `hashes` → `validate` avisa que hash não disponível; `--repair` usa latest tag

### Critical Files
- `cli/bin/fnd-cli.js` — ponto de entrada a estender
- `cli/src/installer.js` — deve receber `releaseTag` + gerar `hashes` no `writeManifest()`
- `cli/src/uninstaller.js` — `readManifest()` a reusar nos 3 módulos
- `cli/src/github.js` — `getLatestTag()` e `downloadZip()` a reusar

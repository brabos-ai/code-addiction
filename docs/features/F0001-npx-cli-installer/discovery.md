# Discovery: FND CLI Installer

> **Branch:** feat/opensource | **Feature:** F0001 | **Date:** 2026-03-01

---

## Codebase Analysis

### Existing Structure

- Nenhum `package.json` na raiz — CLI é 100% novo, sem legacy
- Git tags existentes: v1.0.9, v1.1.0, v1.2.0, v1.2.1, v1.3.0, v2.0.0, v2.0.1
- `framwork/` contém ~175 arquivos estáticos (`.md` + `.sh`) — sem artefatos compilados
- Raiz tem `.claude/` e `.fnd/` (working copy do autor) — `framwork/` é o template distributável

### framwork/ Directory Map

```
framwork/
├── .fnd/              [CORE - ~93 arquivos]
│   ├── commands/      [19 .md — definições dos comandos FND]
│   ├── scripts/       [8 .sh — scripts de execução]
│   ├── skills/        [62 arquivos em 24 pastas de skills]
│   ├── templates/     [3 .md — templates de feature/hotfix]
│   └── .gitignore     [exclui: history/, *.local.json]
│
├── .claude/           [PROVIDER - 19 .md]
├── .agent/            [PROVIDER - 19 .md]
├── .agents/           [PROVIDER - 19 .md]
├── .kilocode/         [PROVIDER - 19 .md]
├── .opencode/         [PROVIDER - 19 .md]
└── .gitattributes     [LF para *.sh — crítico no Windows]
```

### Providers Map

| Provider | Source | Destino | Arquivos |
|----------|--------|---------|----------|
| Claude Code | `framwork/.claude/` | `.claude/` | 19 |
| Codex (OpenAI) | `framwork/.agent/` | `.agent/` | 19 |
| Google Antigravity | `framwork/.agents/` | `.agents/` | 19 |
| KiloCode | `framwork/.kilocode/` | `.kilocode/` | 19 |
| OpenCode | `framwork/.opencode/` | `.opencode/` | 19 |

### Patterns

- Todos os arquivos são estáticos (`.md` + `.sh`) — sem compilação
- `.gitattributes` impõe LF para `.sh` — CLI deve forçar LF após extração no Windows
- `.fnd/.gitignore` exclui `history/` e `*.local.json` — não sobrescrever no update

---

## Technical Context

### Infrastructure

- **Repositório:** GitHub (xmaiconx/fnd-commands-scripts)
- **Versioning:** Semantic tags (vX.Y.Z) já existentes
- **GitHub API:** `api.github.com/repos/[owner]/fnd-commands-scripts/releases/latest`
- **Zipball:** `github.com/[owner]/fnd-commands-scripts/archive/refs/tags/v[version].zip`
- **Pacote:** `cli/` subdiretório neste repo — CI/CD unificado

### Dependencies (a criar)

```json
{
  "name": "fnd-cli",
  "bin": { "fnd-cli": "./bin/fnd-cli.js" },
  "dependencies": {
    "@clack/prompts": "^0.7.0",
    "adm-zip": "^0.5.10"
  }
}
```

Node.js nativo (`https`, `fs`, `path`, `os`) para o restante.

### Integration Points

1. **GitHub API** → detectar latest release tag
2. **GitHub zipball** → baixar e extrair `framwork/` do release
3. **Projeto do usuário** → copiar para pastas corretas na raiz
4. **Post-install** → mensagem orientando próximos passos

---

## Files Mapping

### To Create

```
cli/
├── package.json
├── bin/
│   └── fnd-cli.js          [entry point — parser de subcomandos]
├── src/
│   ├── prompt.js            [checkbox de providers — @clack/prompts]
│   ├── installer.js         [download + extract + copy + LF fix]
│   ├── updater.js           [update preservando history/ e *.local.json]
│   ├── providers.js         [mapa provider → source/dest]
│   └── github.js            [fetch latest tag + download zip]
└── README.md
```

### To Modify

- `README.md` raiz — adicionar instruções `npx fnd-cli install`

---

## Technical Assumptions

| Assumption | Impact if Wrong |
|------------|-----------------|
| GitHub zipball inclui `framwork/` na raiz do zip extraído | Precisa ajustar path de extração |
| CLI roda no diretório raiz do projeto do usuário | Paths relativos quebram; adicionar validação |
| `framwork/` é o nome estável da pasta de templates | Quebra extração se renomeado |
| `adm-zip` preserva LF em arquivos `.sh` | Se não preservar, forçar LF explicitamente via `fs` |
| GitHub API acessível sem auth (60 req/h) | Rate limit em CI/CD; usar header `Accept: application/vnd.github+json` |

---

## Summary for Planning

### Executive Summary

O `fnd-cli` é um pacote npm novo em `cli/` que expõe dois subcomandos: `install` (seleção interativa de providers + cópia dos arquivos do GitHub release) e `update` (atualização preservando configs do usuário). Todo o conteúdo a ser instalado vive em `framwork/` no repositório. Nenhum arquivo existente precisa ser modificado — é 100% adição.

### Key Decisions

- Pacote: `fnd-cli` com subcomandos `install` e `update`
- `/fnd-init` command não tem relação com este CLI
- Fetch do GitHub release (não embedded)
- `.fnd/` sempre instalado; providers opcionais
- LF forçado nos `.sh` para compatibilidade Windows

### Critical Files

| Arquivo | Relevância |
|---------|-----------|
| `framwork/.fnd/` | Core que sempre é copiado |
| `framwork/.gitattributes` | Referência para LF nos `.sh` |
| `framwork/.fnd/.gitignore` | Paths a preservar no update |
| `docs/features/F0001-npx-cli-installer/about.md` | Spec completa |

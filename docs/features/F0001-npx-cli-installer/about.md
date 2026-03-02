# Task: FND CLI Installer

> **Branch:** feat/opensource
> **Feature:** F0001
> **Date:** 2026-03-01

---

## Objective

CLI `fnd-cli` distribuído via `npx fnd-cli install` que instala os arquivos do FND no projeto do usuário, com seleção interativa de providers de AI IDE. Suporta também `npx fnd-cli update` para atualizar arquivos existentes.

## Business Context

- **Why:** Para virar opensource, o FND precisa de instalação simples — sem copiar arquivos manualmente
- **Problem:** Não existe instalador; usuário teria que copiar `framwork/.fnd/`, `framwork/.claude/`, etc. manualmente
- **Stakeholders:** Desenvolvedores que querem usar o FND no projeto deles

## Scope

### Included

**`npx fnd-cli install`:**
- Checkbox interativo para seleção de providers
- Download dos arquivos do GitHub release (latest por padrão)
- Suporte a versão específica via `npx fnd-cli@1.1.0 install`
- Instalação de `.fnd/` core (sempre, obrigatório)
- Instalação das pastas de provider selecionadas
- Forçar LF nos arquivos `.sh` após cópia (Windows)
- Pergunta antes de sobrescrever pastas existentes
- Geração de `.fnd/manifest.json` com lista de todos os arquivos instalados
- Mensagem de onboarding genérica ao final

**`npx fnd-cli update`:**
- Detecta versão instalada via `.fnd/manifest.json`
- Baixa latest release do GitHub
- Sobrescreve arquivos FND, reutiliza providers do manifest sem re-perguntar
- Atualiza manifest com nova versão e lista de arquivos

**`npx fnd-cli uninstall`:**
- Lê `.fnd/manifest.json` e remove todos os arquivos listados
- Detecta arquivos do usuário (não presentes no manifest) e avisa antes de deletar
- Remove diretórios vazios após cleanup
- Flag `--force` para remover sem confirmação
- Sem manifest → falha com mensagem orientando reinstalar

### Not Included

- Criação de `CLAUDE.md` ou arquivos de contexto raiz (responsabilidade do `/fnd-init` command)
- Append no `.gitignore` do projeto do usuário
- Onboarding contextual por provider
- Autenticação ou login
- Qualquer modificação no código do projeto do usuário

## Business Rules

### Validations

- Se `.fnd/` já existe → perguntar antes de sobrescrever
- Se pasta de provider já existe → perguntar antes de sobrescrever
- Arquivos `.sh` → forçar LF após cópia
- `.fnd/manifest.json` → sempre gerado/atualizado em install e update
- Manifest registra path relativo de cada arquivo copiado
- Uninstall: arquivo no manifest mas já deletado manualmente → skip silencioso
- Uninstall: arquivo em pasta FND mas ausente no manifest → avisar usuário antes de deletar

### Flows

**Happy Path — install:**
1. Usuário roda `npx fnd-cli install` no diretório do projeto
2. CLI busca latest release no GitHub API
3. Apresenta checkbox com os 5 providers
4. Usuário seleciona e confirma
5. CLI baixa e extrai o zip do release
6. Copia `.fnd/` core + providers selecionados
7. Força LF nos `.sh`
8. Exibe mensagem de onboarding

**Happy Path — update:**
1. Usuário roda `npx fnd-cli update`
2. CLI lê versão atual do `.fnd/manifest.json` e busca latest no GitHub
3. Baixa e extrai nova versão
4. Sobrescreve arquivos, reutiliza providers do manifest
5. Atualiza manifest com nova versão e lista de arquivos
6. Confirma arquivos atualizados

**Happy Path — uninstall:**
1. Usuário roda `npx fnd-cli uninstall`
2. CLI lê `.fnd/manifest.json`
3. Escaneia pastas FND e detecta arquivos do usuário (não presentes no manifest)
4. Mostra resumo: X arquivos FND + Y arquivos do usuário encontrados
5. Se arquivos do usuário existem → avisa "Found Y files not installed by FND"
6. Pede confirmação (ou skip com `--force`)
7. Remove todos os arquivos do manifest
8. Remove diretórios vazios
9. Remove `.fnd/manifest.json` por último

**Alternative (versão específica):**
1. `npx fnd-cli@1.1.0 install` → usa tag `v1.1.0` ao invés de latest

**Error:**
1. Sem internet → "Could not reach GitHub. Check your connection."
2. Release não encontrado → "Release v1.1.0 not found. Try without version for latest."
3. Sobrescrever recusado → cancela instalação desse provider
4. Uninstall sem manifest → "No FND installation found. Run `npx fnd-cli install` first."
5. Manifest corrompido → fallback para remoção por diretórios conhecidos com confirmação

## Decisions

| Context | Decision | Rationale |
|---------|----------|-----------|
| Nome do pacote | `fnd-cli` | Suporta subcomandos (`install`, `update`, `uninstall`) — escalável |
| Subcomandos | `install` + `update` + `uninstall` | Separação clara de responsabilidades |
| `/fnd-init` command | Sem relação com o CLI | Onboarding do projeto é responsabilidade do command, não do CLI |
| Distribuição | Fetch do GitHub release | Sempre atualizado, pacote leve |
| Versão padrão | Latest release | Menor fricção |
| Core obrigatório | `.fnd/` sempre instalado | Núcleo do ecossistema |
| UX de seleção | Checkbox simples | Público técnico |
| Windows LF | Forçar LF nos `.sh` após cópia | Evita bug de script não executável no Windows |
| Onboarding | Mensagem genérica | Sem mencionar provider específico |
| Localização do pacote | Subdiretório `cli/` neste repo | CI/CD unificado com releases do FND |
| Manifest | `.fnd/manifest.json` com granularidade por arquivo | Permite detecção de arquivos do usuário — `.fnd-manifest.json` na raiz poluiria o projeto |
| Manifest geração | Durante loop de extração do adm-zip | Zero overhead — por diretório descartado pois não detecta arquivos extras |
| Uninstall confirmação | Confirm + `--force` flag | Padrão da indústria (npm, brew) — confirmação por grupo descartada por interação excessiva |

## Edge Cases

| Name | Description | Strategy |
|------|-------------|----------|
| `.fnd/` já existe | Reinstalação ou upgrade manual | Perguntar antes de sobrescrever |
| Provider já existe | Provider já instalado | Perguntar antes de sobrescrever |
| Sem conexão | GitHub inacessível | Fail fast com mensagem clara |
| Release não existe | Tag informada não encontrada | Erro com sugestão de usar latest |
| Nenhum provider selecionado | Usuário desmarca tudo | Permitir — instala só o core |
| `.sh` com CRLF no Windows | Script não executa | Forçar LF após extração |
| `history/` no update | Dados de sessão do usuário | Nunca sobrescrever |
| Sem manifest no uninstall | FND não foi instalado via CLI | Falha com mensagem orientando instalar |
| Manifest corrompido | JSON inválido | Fallback: remoção por diretórios conhecidos com confirmação |
| Arquivos do usuário em pasta FND | Usuário criou `.claude/commands/my-custom.md` | Detectar e avisar antes de deletar |
| Permissão negada no uninstall | Arquivo locked (Windows) | Skip com erro, continuar com demais |

## Acceptance Criteria

- [ ] `npx fnd-cli install` funciona sem instalação prévia
- [ ] `npx fnd-cli update` atualiza arquivos sem apagar `history/` e `*.local.json`
- [ ] Checkbox mostra os 5 providers corretamente
- [ ] `.fnd/` é sempre instalado independente da seleção
- [ ] Cada provider instala na pasta correta
- [ ] `npx fnd-cli@1.1.0 install` instala a versão específica
- [ ] Arquivos `.sh` têm LF após instalação no Windows
- [ ] Sobrescrita pede confirmação
- [ ] Erros de rede têm mensagem clara
- [ ] Mensagem de onboarding genérica ao final
- [ ] `npx fnd-cli install` gera `.fnd/manifest.json` com todos os arquivos copiados
- [ ] Manifest contém: version, providers, installedAt, files[]
- [ ] `npx fnd-cli update` atualiza manifest e reutiliza providers sem re-perguntar
- [ ] `npx fnd-cli uninstall` remove todos os arquivos listados no manifest
- [ ] `npx fnd-cli uninstall --force` remove sem pedir confirmação
- [ ] Arquivos do usuário (não no manifest) são detectados e avisados antes da remoção
- [ ] Diretórios vazios são removidos após cleanup
- [ ] Sem manifest no uninstall → mensagem de erro clara

## Spec (Token-Efficient)

```
Package: fnd-cli (cli/ subdir)
Bin: { "fnd-cli": "./bin/fnd-cli.js" }
Subcommands: install, update, uninstall
Deps: @clack/prompts, adm-zip
Runtime: Node.js ESM, sem build step

Providers map:
  claude:   framwork/.claude   → .claude/
  codex:    framwork/.agent    → .agent/
  antigrav: framwork/.agents   → .agents/
  kilocode: framwork/.kilocode → .kilocode/
  opencode: framwork/.opencode → .opencode/

Core: framwork/.fnd → .fnd/ (always)
Manifest: .fnd/manifest.json → { version, installedAt, providers, files[] }
Uninstall: read manifest → detect user files → confirm (--force skips) → remove → cleanup empty dirs

GitHub:
  Latest:  GET api.github.com/repos/[owner]/fnd-commands-scripts/releases/latest
  Zipball: github.com/[owner]/fnd-commands-scripts/archive/refs/tags/v[version].zip
```

## Next Steps

Planning Agent deve criar:
1. `cli/package.json` — pacote `fnd-cli` com `bin`
2. `cli/bin/fnd-cli.js` — entry point com subcomandos (install, update, uninstall)
3. `cli/src/prompt.js` — checkbox de providers (@clack/prompts)
4. `cli/src/installer.js` — download, extract, copy, LF fix, **gerar manifest**
5. `cli/src/updater.js` — update com preserve logic, **atualizar manifest**
6. `cli/src/uninstaller.js` — **ler manifest, detectar arquivos do usuário, remover**
7. `cli/src/providers.js` — mapa providers → pastas
8. `cli/src/github.js` — fetch latest tag + download zip

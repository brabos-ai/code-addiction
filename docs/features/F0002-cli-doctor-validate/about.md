# Task: CLI Doctor, Validate & Config Show

> **Branch:** feature/F0002-cli-doctor-validate
> **Feature:** F0002
> **Date:** 2026-03-01

---

## Objective

Adicionar três comandos de diagnóstico ao `fnd-cli` para que o usuário consiga verificar o estado do ambiente, checar integridade dos arquivos instalados e reparar a instalação sem reinstalar tudo.

## Business Context

- **Why:** Após `npx fnd-cli install`, não existe feedback sobre saúde da instalação — arquivos apagados ou corrompidos passam despercebidos
- **Problem:** Usuário sem diagnóstico acaba reinstalando tudo ou abrindo suporte desnecessariamente
- **Stakeholders:** Qualquer desenvolvedor que usa o FND via `npx fnd-cli`

## Scope

### Included
- `npx fnd-cli doctor` — verifica pré-requisitos do ambiente (Node >=18, Git, `.fnd/` presente, manifest válido)
- `npx fnd-cli validate` — verifica integridade dos arquivos via SHA-256 (detecta faltando e alterados)
- `npx fnd-cli validate --repair` — redownload cirúrgico dos arquivos faltando/alterados a partir da release instalada
- `npx fnd-cli config show` — exibe versão instalada, providers ativos, total de arquivos, data de install
- `npx fnd-cli config show --verbose` — exibe tudo acima + checa se há update disponível no GitHub
- Manifest schema estendido com `releaseTag` e `hashes` (SHA-256 por arquivo)
- Exit codes semânticos: 0 = ok, 1 = problemas encontrados (compatível com CI/CD)
- Backward compatibility: manifests antigos (sem hash) reportam aviso mas não falham

### Not Included
- Verificação de arquivos de provider (CLAUDE.md, GEMINI.md, AGENTS.md) — não é responsabilidade do `doctor`
- Validação de configuração interna do FND (comandos, skills) — fora de escopo
- Hash upgrade automático de manifests antigos

## Business Rules

### Validations
- `validate` sem manifest instalado → aborta com mensagem clara ("FND not installed")
- `validate --repair` sem internet → erro com mensagem de fallback
- `doctor` reporta cada check individualmente (✅/⚠️/❌) antes do resultado final
- `config show` sem manifest → aborta com mensagem clara

### Flows

**Happy Path — `fnd doctor`:**
1. CLI verifica Node version (>=18)
2. CLI verifica Git instalado
3. CLI verifica `.fnd/` existe no projeto
4. CLI verifica `manifest.json` parseável e válido
5. Exibe relatório com ✅/⚠️/❌ por check
6. Exit 0 se tudo ok, exit 1 se algum check falhou

**Happy Path — `fnd validate`:**
1. CLI lê manifest
2. Para cada arquivo no manifest: calcula SHA-256 atual vs hash salvo
3. Exibe relatório: arquivos ok, faltando e alterados
4. Exit 0 se tudo ok, exit 1 se encontrou problemas

**Happy Path — `fnd validate --repair`:**
1. CLI lê manifest → obtém `releaseTag`
2. Identifica arquivos faltando/alterados
3. Baixa ZIP da release no GitHub
4. Restaura apenas os arquivos problemáticos
5. Reporta o que foi restaurado

**Happy Path — `fnd config show`:**
1. CLI lê manifest
2. Exibe: versão, releaseTag, providers, total arquivos, data install
3. Com `--verbose`: busca latest tag no GitHub, compara, exibe se há update

**Error:**
1. Manifest não encontrado → "FND not installed. Run `npx fnd-cli install`"
2. Sem internet no `--repair` → "Cannot connect to GitHub. Check connection."
3. Manifest sem `hashes` (antigo) → "Hash not available for this install. Run `npx fnd-cli update` to enable validation."

## Decisions

| Context | Decision | Rationale |
|---------|----------|-----------|
| Algoritmo de hash | SHA-256 via `node:crypto` | Built-in no Node >=18, sem dependência extra, suficiente para integridade |
| Granularidade do repair | Cirúrgico — só arquivos problemáticos | Preserva customizações do usuário |
| Doctor scope | Ambiente mínimo (Node, Git, .fnd/, manifest) | FND não tem dependência garantida de AI provider específico |
| Manifest backward compat | Aviso sem falha para manifests antigos | Não quebra instalações existentes |
| Update check | Só no `config show --verbose` | Evita latência de rede no fluxo padrão |

## Edge Cases

| Name | Description | Strategy |
|------|-------------|----------|
| Manifest antigo sem hashes | Instalação do F0001 não tem SHA-256 | Avisa que validate não disponível; sugere `update` |
| releaseTag ausente no manifest | Manifest antigo | Fallback para `getLatestTag()` no repair |
| Arquivo alterado intencionalmente | Usuário customizou arquivo do FND | `validate` reporta como "modified" — `--repair` sobrescreve só se explícito |
| Sem conexão no config show --verbose | Timeout no GitHub API | Skip do update check com aviso |

## Acceptance Criteria

- [ ] `npx fnd-cli doctor` retorna ✅/⚠️/❌ para cada check e exit code correto
- [ ] `npx fnd-cli validate` detecta arquivos faltando e alterados via hash
- [ ] `npx fnd-cli validate --repair` restaura arquivos problemáticos do ZIP da release instalada
- [ ] `npx fnd-cli config show` exibe versão, providers, total arquivos, data
- [ ] `npx fnd-cli config show --verbose` exibe tudo + update disponível
- [ ] Manifests antigos (sem hashes) tratados com aviso, sem crash
- [ ] Exit 0 = tudo ok, exit 1 = problemas encontrados em todos os comandos
- [ ] Sem novas dependências externas

## Spec (Token-Efficient)

```
manifest.json (extended):
{
  version, releaseTag, installedAt, providers,
  files: string[],
  hashes: { [filePath]: string }  // SHA-256 hex
}

New modules:
- cli/src/doctor.js     → export async doctor(cwd)
- cli/src/validator.js  → export async validate(cwd, repair: boolean)
- cli/src/config.js     → export async config(cwd, verbose: boolean)

Modified:
- cli/src/installer.js  → writeManifest(cwd, tag, providers, files)
                          computes SHA-256 per file, saves releaseTag
- cli/bin/fnd-cli.js    → routing: doctor | validate [--repair] | config show [--verbose]
```

## Next Steps

Pronto para `/fnd-plan` — estrutura clara, sem ambiguidades, 3 módulos novos + 2 modificações.

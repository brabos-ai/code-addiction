# 📊 Relatório de Cobertura de Testes - Scripts Bash

**Data:** 2026-03-03  
**Framework:** ADD (.add/scripts)  
**Test Framework:** BATS (Bash Automated Testing System)

---

## 📁 Arquivos Analisados

| Arquivo | Testes Atuais | Cobertura | Prioridade |
|---------|--------------|-----------|------------|
| `architecture-discover.bats` | 16 | ⚠️ Parcial | 🟡 Média |
| `done.bats` | 9 | ⚠️ Parcial | 🔴 Alta |
| `feature-init.bats` | 12 | ✅ Boa | 🟡 Média |
| `feature-pr.bats` | 8 | 🔴 Crítica | 🔴 Alta |
| `feature-status.bats` | 17 | ⚠️ Boa | 🔴 Alta |
| `get-main-branch.bats` | 10 | ✅ Excelente | 🟢 Baixa |
| `log-iteration.bats` | 15 | ✅ Boa | 🟡 Média |
| `log-jsonl.bats` | 7 | ✅ Boa | 🟢 Baixa |

---

## 🔍 Detalhamento por Script

### 1. architecture-discover.bats

**Cenários Atuais:** 16 testes  
**Status:** ⚠️ Parcial

#### Edge Cases e Cenários Faltantes

| Categoria | Cenário | Linha Script |
|-----------|---------|--------------|
| **Diretórios** | Nomes com espaços, caracteres unicode ou escapes | - |
| **Dependências** | Comportamento quando `tree` não está instalado | 129 |
| **Dependências** | Ambiente sem comando `find` | 104-121 |
| **Arquivos** | Arquivos sem extensão (EXTENSIONS vazio) | 193-205 |
| **Config** | Múltiplos config files do mesmo tipo | 51-61 |
| **JSON** | package.json inválido/malformado | 216-222 |
| **Permissões** | Sem permissão de leitura em diretórios | - |
| **Estrutura** | Diretórios vazios | - |
| **Profundidade** | Estrutura muito profunda (>5 níveis) - validar comportamento `[/]` | 98-102 |
| **Symlinks** | Links simbólicos circulares (loops) | - |

#### Recomendação
Focar em testar o fallback do comando `tree` e cenários de permissões.

---

### 2. done.bats

**Cenários Atuais:** 9 testes  
**Status:** ⚠️ Parcial

#### Context Mode - Cenários Faltantes

| Cenário | Descrição | Linha Script |
|---------|-----------|--------------|
| Branch main sem remote | Quando origin/main não existe | 154 |
| Múltiplas mudanças | Modified + staged + untracked simultâneos | 116-124 |
| Nomes especiais | Arquivos com espaços ou caracteres especiais | 139-142 |
| Git config | Sem user.name/user.email configurado | 217 |

#### Merge Mode (--merge) - Cenários Faltantes

| Cenário | Descrição | Linha Script |
|---------|-----------|--------------|
| Push sem permissão | Falha de autenticação no remote | 232 |
| Merge conflict | Durante squash merge | 251-257 |
| Remote deletado | Branch remoto já não existe mais | 284 |
| Branch já integrada | "nothing to commit after squash" | 265-274 |
| Gitignore | Arquivos no .gitignore sendo commitados | 216-225 |
| Pre-commit hooks | Hook falhando e rejeitando commit | 217, 268 |

#### Dependências - Cenários Faltantes

| Cenário | Descrição | Linha Script |
|---------|-----------|--------------|
| Script não encontrado | get-main-branch.sh ausente | 41-48 |
| Git não instalado | Ambiente sem git | - |

#### Recomendação
Priorizar testes de merge conflict, push failures e cenários de git hooks.

---

### 3. feature-init.bats

**Cenários Atuais:** 12 testes  
**Status:** ✅ Boa

#### Edge Cases e Cenários Faltantes

| Categoria | Cenário | Linha Script | Impacto |
|-----------|---------|--------------|---------|
| **Owner** | owner.md malformado (sem campo Nivel) | 25 | Baixo (tem fallback) |
| **Owner** | Múltiplos níveis/formatos de owner | 23-30 | Médio |
| **Git** | Branch com nome inválido (não segue padrão) | 56-62 | Baixo |
| **Git** | Repositório vazio (sem commits) | 36-40 | Médio |
| **Git** | Detached HEAD state | 36-40 | Médio |
| **Features** | Overflow (>9999 features) | 86-93 | Baixo |
| **Stack** | package.json vazio `{}` | 129-139 | Médio |
| **Permissões** | FEATURES_DIR sem permissão de escrita | 97 | Médio |
| **Branch types** | refactor/*, docs/* não cobertos | 56-62 | Baixo |
| **RECENT_CHANGELOGS** | Seção inteira não testada | 172-202 | 🔴 **Alto** |

#### Recomendação
A seção `RECENT_CHANGELOGS` (linhas 172-202) é significativa e não tem cobertura. Priorizar testes aqui.

---

### 4. feature-pr.bats

**Cenários Atuais:** 8 testes  
**Status:** 🔴 Crítica

#### Preview Mode - Cenários Faltantes

| Cenário | Descrição | Linha Script |
|---------|-----------|--------------|
| Zero mudanças | Branch sem alterações vs main | 186-192 |
| Sem upstream | Branch não tem remote tracking | 158-161 |
| Gitignore | Arquivos no .gitignore modificados | 168-173 |

#### Create PR Mode - Cenários Críticos Faltantes

| Cenário | Descrição | Linha Script | Prioridade |
|---------|-----------|--------------|------------|
| Push failure | Sem permissão ou falha de auth | 335-341 | 🔴 Alta |
| gh CLI missing | GitHub CLI não instalado | 347-357 | 🔴 Alta |
| gh CLI no auth | Não autenticado no GitHub | 360-365 | 🔴 Alta |
| PR exists | PR já existe para o branch | 368-375 | 🔴 Alta |
| PR create fail | Falha ao criar PR no GitHub | 399-411 | 🔴 Alta |
| Changelog gitignore | CHANGELOG_PATH no .gitignore | 291-307 | 🟡 Média |
| About.md changes | Staging de addendum | 310-331 | 🟡 Média |
| Summary extract fail | Falha ao extrair ABOUT_SUMMARY | 385-394 | 🟡 Média |
| Título truncado | PR title >72 caracteres | 396 | 🟢 Baixa |

#### Confirm Merge Mode (--confirm-merge)

| Cenário | Descrição | Linha Script |
|---------|-----------|--------------|
| Execução completa | Testa guards mas não execução real | 84-107 |
| Limpeza parcial | Falha ao deletar local ou remote | 96 |

#### Condições de Git

| Cenário | Descrição | Linha Script |
|---------|-----------|--------------|
| Merge base not found | Não encontra merge base | 186 |
| Remote URL inválido | Configuração corrompida | 349 |
| Sem remote | Repositório sem remote configurado | 158, 335 |

#### Recomendação
⚠️ **PRIORIDADE MÁXIMA**. Este script tem muitos caminhos de erro não testados que afetam fluxo de PR.

---

### 5. feature-status.bats

**Cenários Atuais:** 17 testes  
**Status:** ⚠️ Boa

#### Edge Cases e Cenários Faltantes

| Categoria | Cenário | Linha Script | Prioridade |
|-----------|---------|--------------|------------|
| **Branch types** | Branch hotfix/* | 56 | 🟢 Baixa |
| **Branch types** | Branch refactor/* | 56 | 🟢 Baixa |
| **Fases** | Fase "discovering" vs "discovered" | 118-121 | 🟡 Média |
| **Fases** | Fase "designed" | 115-116 | 🟡 Média |
| **Iterações** | iterations.jsonl - seção inteira | 137-148 | 🔴 **Alta** |
| **Summaries** | About/Discovery summaries JSON | 152-160 | 🟡 Média |
| **Epic** | Epic detection completo | 172-217 | 🔴 **Alta** |
| **Epic.md** | Estrutura PRD0032 (epic.md) | 223-276 | 🔴 **Alta** |
| **Tasks** | tasks.md progress | 264-276 | 🔴 **Alta** |
| **Tags** | Git checkpoint tags | 275 | 🟡 Média |
| **Git** | AHEAD/BEHIND calculation | 337-345 | 🟡 Média |
| **Arquivos** | FILES CHANGED seção inteira | 354-433 | 🔴 **Alta** |
| **Skills** | SKILLS detection (.add/skills/) | 440-453 | 🟡 Média |
| **Projeto** | PROJECT_PATTERNS (.add/project/) | 460-476 | 🟡 Média |
| **Owner** | OWNER file parsing completo | 84-93 | 🟢 Baixa |
| **Updates** | Last update extraction | 163-166 | 🟢 Baixa |

#### Recomendação
⚠️ **PRIORIDADE ALTA**. Muitas funcionalidades novas (Epic, tasks, files changed) sem testes.

---

### 6. get-main-branch.bats

**Cenários Atuais:** 10 testes  
**Status:** ✅ Excelente

#### Edge Cases e Cenários Faltantes

| Cenário | Descrição | Impacto |
|---------|-----------|---------|
| Ambiente Windows | Diferenças no comportamento do git | Baixo |
| Git worktrees | Repositório com múltiplos worktrees | Baixo |
| origin/HEAD anômalo | Aponta para branch não-main/master | Médio |
| Múltiplos remotes | Script só olha origin | Baixo |
| Remote URL inválida | Configuração corrompida | Baixo |
| Permissões .git | Sem acesso ao diretório git | Médio |

#### Recomendação
Cobertura já é muito boa. Cenários faltantes são edge cases raros.

---

### 7. log-iteration.bats

**Cenários Atuais:** 15 testes  
**Status:** ✅ Boa

#### Edge Cases e Cenários Faltantes

| Cenário | Descrição | Linha Script | Prioridade |
|---------|-----------|--------------|------------|
| **Arquivo** | iterations.md existe mas vazio | 174 | 🟡 Média |
| **Arquivo** | iterations.md corrompido | 186-191 | 🟡 Média |
| **Permissões** | Sem permissão de escrita | 164-168, 176-180 | 🔴 Alta |
| **Sistema** | Sem comando `date` | 146-150 | 🟢 Baixa |
| **Caracteres** | Especiais em slug/what/files | 208-210 | 🟡 Média |
| **Truncamento** | WHAT exatamente 60 caracteres | 210 | 🟢 Baixa |
| **Multibyte** | WHAT com caracteres UTF-8 | 210 (cut -c) | 🟡 Média |
| **Flags** | Ordem diferente (--epic antes de --feature) | 61-104 | 🟢 Baixa |
| **Features** | Múltiplas features completadas | 215-221 | 🟢 Baixa |
| **CMD** | Com caracteres especiais | 47 | 🟢 Baixa |
| **Regex** | Edge cases do BASH_REMATCH | 132 | 🟢 Baixa |

#### Recomendação
Testar principalmente cenários de permissão e arquivo corrompido/vazio.

---

### 8. log-jsonl.bats

**Cenários Atuais:** 7 testes  
**Status:** ✅ Boa

#### Edge Cases e Cenários Faltantes

| Cenário | Descrição | Linha Script | Prioridade |
|---------|-----------|--------------|------------|
| **Permissões** | Diretório pai sem permissão de escrita | 46 | 🟡 Média |
| **Tipo** | Arquivo existe mas é um diretório | 44 | 🟢 Baixa |
| **JSON** | Fields malformado (não valida) | 57 | 🟡 Média |
| **Quebras** | Campos com quebras de linha | 57 | 🟡 Média |
| **Timezone** | Timestamp em timezone diferente | 50 | 🟢 Baixa |
| **Type** | Type inválido (não valida) | 57 | 🟢 Baixa |
| **Tamanho** | Arquivo muito grande (>2GB) | 57 | 🟢 Baixa |
| **Filesystem** | Filesystem read-only | 46 | 🟢 Baixa |
| **Concorrência** | Race condition (múltiplos processos) | 57 | 🟢 Baixa |

#### Recomendação
Cobertura adequada para a complexidade do script.

---

## 🎯 Prioridades de Implementação

### 🔴 Alta Prioridade (Segurança/Integridade)

1. **feature-pr.bats**
   - Push failure (auth/permission)
   - gh CLI not installed/auth
   - PR exists / create failure
   - --confirm-merge execution

2. **done.bats**
   - Merge conflict resolution
   - Push permissions
   - Remote branch deleted

3. **feature-status.bats**
   - Epic detection
   - Tasks progress
   - File changes glob (FILES section)
   - iterations.jsonl

### 🟡 Média Prioridade (Funcionalidade)

4. **architecture-discover.bats**
   - Tree fallback
   - Special characters in paths
   - Permission errors

5. **feature-init.bats**
   - Recent changelogs
   - Detached HEAD
   - Empty repo

6. **log-iteration.bats**
   - File permissions
   - Empty/corrupted file
   - Multibyte characters

### 🟢 Baixa Prioridade (Edge Cases)

7. **log-jsonl.bats**
   - Malformed JSON
   - Directory permissions
   - Large files

8. **get-main-branch.bats**
   - Worktrees
   - Multiple remotes
   - Windows differences

---

## 📊 Resumo de Cenários

| Script | Testes Atuais | Cenários Faltantes Estimados | Cobertura % Estimada |
|--------|--------------|------------------------------|---------------------|
| architecture-discover.bats | 16 | ~8 | 67% |
| done.bats | 9 | ~12 | 43% |
| feature-init.bats | 12 | ~6 | 67% |
| feature-pr.bats | 8 | ~18 | 31% |
| feature-status.bats | 17 | ~14 | 55% |
| get-main-branch.bats | 10 | ~4 | 71% |
| log-iteration.bats | 15 | ~7 | 68% |
| log-jsonl.bats | 7 | ~6 | 54% |
| **TOTAL** | **94** | **~75** | **56%** |

---

## 📝 Notas Técnicas

### Padrões de Teste Observados

1. **Setup/Teardown**: Todos os testes usam `common_setup` e `common_teardown`
2. **Isolamento**: Cada teste cria repo git temporário via `mktemp -d`
3. **Helpers**: `create_feature_docs`, `setup_remote` disponíveis em `test_helper/common-setup.bash`

### Limitações Identificadas

1. **Sem mocks**: Testes reais fazem operações git reais (lento, mas realista)
2. **Sem network**: Não testam interações com GitHub (gh CLI limitado)
3. **Sem permissões**: Não testam cenários de filesystem restrito
4. **Sem concorrência**: Não testam race conditions

### Scripts que Interagem

```
done.sh → get-main-branch.sh
feature-pr.sh → get-main-branch.sh
feature-status.sh → get-main-branch.sh
feature-init.sh → get-main-branch.sh
```

**Recomendação**: Garantir que mudanças em `get-main-branch.sh` não quebrem dependentes.

---

## 🔄 Próximos Passos

1. [ ] Criar testes para feature-pr.bats (prioridade máxima)
2. [ ] Adicionar testes de Epic/Tasks em feature-status.bats
3. [ ] Cobrir merge mode em done.bats
4. [ ] Documentar comportamento esperado em casos de erro
5. [ ] Adicionar testes de integração entre scripts dependentes

---

*Documento gerado automaticamente - Framework ADD*

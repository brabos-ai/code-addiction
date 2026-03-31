# Infrastructure Check - Health Check Subagent

> **DOCUMENTATION STYLE:** Seguir padrões definidos em `{{skill:add-documentation-style/SKILL.md}}`

**Objetivo:** Verificar se infraestrutura e ferramentas de análise estão configuradas.

**Output:** `docs/health-checks/YYYY-MM-DD/infrastructure-report.md`

---

## Missão

Você é um subagente especializado em verificação de infraestrutura. Seu trabalho é:
1. Verificar se MCP Supabase está habilitado (necessário para análise de RLS)
2. Verificar variáveis de ambiente configuradas
3. Verificar dependências instaladas
4. Gerar orientações de configuração quando necessário

---

## Análise 1: MCP Supabase

### Verificação

**Tentar usar ferramenta MCP:**
- Se conseguir executar `mcp__supabase__list_tables` → MCP habilitado
- Se falhar ou não existir → MCP não configurado

### Se MCP NÃO Configurado

**Gerar orientação de configuração:**

```markdown
## Configuração do MCP Supabase

Para análise completa de RLS e banco de dados, configure o MCP Supabase:

### Passo 1: Instalar MCP Server
O MCP Supabase já está incluído no Claude Code. Basta configurar as credenciais.

### Passo 2: Configurar Credenciais
Adicione no arquivo de configuração do Claude Code:

**Linux/Mac:** `~/.claude/settings.json`
**Windows:** `%APPDATA%\Claude\settings.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://[seu-projeto].supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[sua-service-role-key]"
      }
    }
  }
}
```

### Passo 3: Obter Credenciais
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie:
   - Project URL → SUPABASE_URL
   - service_role key → SUPABASE_SERVICE_ROLE_KEY

### Passo 4: Reiniciar Claude Code
Após configurar, reinicie o Claude Code para carregar o MCP.

### Passo 5: Executar Health Check Novamente
```bash
/tech-health-check
```
```

---

## Análise 2: Variáveis de Ambiente

### Verificações

```bash
# Verificar .env.example existe
ls .env.example 2>/dev/null

# Verificar variáveis obrigatórias documentadas
cat .env.example 2>/dev/null
```

**Variáveis críticas para o projeto:**
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- REDIS_URL
- STRIPE_SECRET_KEY (se billing existir)

### Documentar

- Variáveis documentadas em .env.example
- Variáveis faltando na documentação
- Variáveis sensíveis (não devem estar em código)

---

## Análise 3: Dependências

### Verificações

```bash
# Verificar package-lock.json existe (deps instaladas)
ls package-lock.json 2>/dev/null

# Verificar vulnerabilidades conhecidas
npm audit --json 2>/dev/null | head -50
```

### Documentar

- Dependências com vulnerabilidades críticas
- Dependências desatualizadas (se npm outdated disponível)

---

## Análise 4: Docker/Ambiente Local

### Verificações

```bash
# Verificar docker-compose
ls docker-compose.yml infra/docker-compose.yml 2>/dev/null

# Verificar serviços configurados
cat docker-compose.yml infra/docker-compose.yml 2>/dev/null | grep "image:"
```

### Documentar

- Serviços Docker configurados
- Se ambiente local está documentado

---

## Template do Output

**Criar:** `docs/health-checks/YYYY-MM-DD/infrastructure-report.md`

```markdown
# Infrastructure Report

**Gerado em:** [data]
**Score:** [X/10]
**Status:** 🔴/🟠/🟡/🟢

---

## Resumo

[2-3 frases sobre estado da infraestrutura]

---

## Status das Ferramentas

| Ferramenta | Status | Impacto |
|------------|--------|---------|
| MCP Supabase | ✅/❌ | Análise de RLS [disponível/indisponível] |
| .env.example | ✅/❌ | Documentação de variáveis |
| Docker Compose | ✅/❌ | Ambiente local |
| npm audit | ✅/❌ | Análise de vulnerabilidades |

---

## MCP Supabase

### Status: [Configurado/Não Configurado]

[Se não configurado, incluir orientação completa de configuração aqui]

### Capacidades Disponíveis

| Análise | Disponível |
|---------|------------|
| Listar tabelas | ✅/❌ |
| Verificar RLS | ✅/❌ |
| Executar queries | ✅/❌ |
| Ver migrations | ✅/❌ |

---

## Variáveis de Ambiente

### Documentadas em .env.example

| Variável | Categoria | Sensível |
|----------|-----------|----------|
| DATABASE_URL | Database | ✅ |
| SUPABASE_URL | Auth | ❌ |
| SUPABASE_SECRET_KEY | Auth | ✅ |
| [etc.] | [etc.] | [etc.] |

### Issues

#### [INF-001] .env.example não existe
**Impacto:** Desenvolvedores não sabem quais variáveis configurar
**Correção:** Criar .env.example com todas as variáveis necessárias

---

## Dependências

### Vulnerabilidades Encontradas

| Pacote | Severidade | Descrição |
|--------|------------|-----------|
| [pacote] | 🔴 Critical | [descrição] |
| [pacote] | 🟠 High | [descrição] |

### Recomendação

```bash
npm audit fix
```

---

## Ambiente Local (Docker)

### Serviços Configurados

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Cache e filas |
| [etc.] | [etc.] | [etc.] |

---

## Issues Encontrados

### 🔴 Crítico

#### [INF-002] MCP Supabase não configurado
**Impacto:** Análise de RLS impossível, security-analyzer limitado
**Correção:** Seguir orientações de configuração acima

---

### 🟠 Alto

#### [INF-003] Vulnerabilidade crítica em dependência
**Pacote:** [nome]
**Correção:** `npm audit fix` ou atualizar manualmente

---

### 🟡 Médio

[Issues de severidade média]

---

## Recomendações

1. **[Prioridade 1]:** Configurar MCP Supabase para análise completa
2. **[Prioridade 2]:** Corrigir vulnerabilidades de dependências
3. **[Prioridade 3]:** [Outras recomendações]

---

## Limitações da Análise

Devido à infraestrutura atual, as seguintes análises NÃO puderam ser realizadas:

| Análise | Motivo | Como Habilitar |
|---------|--------|----------------|
| RLS | MCP não configurado | Configurar MCP Supabase |
| [etc.] | [etc.] | [etc.] |

---

*Documento gerado pelo subagente infrastructure-check*
```

---

## Critical Rules

**DO:**
- ✅ Verificar MCP Supabase PRIMEIRO
- ✅ Gerar orientações de configuração quando necessário
- ✅ Documentar limitações da análise
- ✅ Ser específico sobre o que não pode ser analisado

**DO NOT:**
- ❌ Falhar silenciosamente se MCP não disponível
- ❌ Ignorar vulnerabilidades de dependências
- ❌ Assumir que infraestrutura está configurada

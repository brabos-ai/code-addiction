# Extracao de Contexto

Como extrair informacoes do projeto para gerar copy.

---

## Fontes de Dados

### 1. README.md (Principal)

**Ler primeiro.** Geralmente contem:

| Secao | O que extrair |
|-------|---------------|
| Titulo/Badge | Nome do produto |
| Descricao inicial | Proposta de valor |
| Features/Highlights | Funcionalidades principais |
| Getting Started | Complexidade de setup |
| Screenshots | Tipo de interface |

**Exemplo de extracao:**

```markdown
# EasyFlow

> Gestao de processos para PMEs sem complexidade

## Features
- Kanban visual
- Automacoes sem codigo
- Relatorios em tempo real

## Getting Started
npm install && npm start
```

**Extraido:**
- Nome: EasyFlow
- Proposta: Gestao de processos para PMEs sem complexidade
- Features: Kanban, automacoes, relatorios
- Setup: Simples (1 comando)

---

### 2. docs/product.md (Se existir)

**Priorizar sobre README** - geralmente mais completo.

| Campo | Onde encontrar |
|-------|----------------|
| Visao do produto | Secao "Vision" ou "About" |
| Publico-alvo | Secao "Target" ou "Users" |
| Problema que resolve | Secao "Problem" |
| Diferenciais | Secao "Differentiators" |

---

### 3. docs/features/ ou features/

**Ler arquivos about.md de cada feature.**

| Extrair | Para que serve |
|---------|----------------|
| Nome da feature | Lista de funcionalidades |
| Problema que resolve | Dores do publico |
| Beneficio principal | Argumentos de venda |

---

### 4. package.json

**Dados estruturados:**

```json
{
  "name": "easyflow",
  "description": "Process management for SMBs",
  "keywords": ["workflow", "automation", "kanban"]
}
```

| Campo | O que extrair |
|-------|---------------|
| name | Nome tecnico |
| description | Descricao curta |
| keywords | Categorias/tags |
| dependencies | Stack (React, NestJS, etc) |

---

## Questionario de Fallback

**SE projeto mal documentado (< 3 campos extraidos):**

```markdown
## Informacoes Necessarias

Nao consegui extrair contexto suficiente do projeto. Preciso de:

1. **Nome do produto:**
   > Como o produto se chama?

2. **O que faz (1 frase):**
   > Qual o problema principal que resolve?

3. **Para quem:**
   > Quem e o cliente ideal? (cargo, empresa, situacao)

4. **3 funcionalidades principais:**
   > O que o usuario consegue fazer com o produto?

5. **Por que diferente:**
   > O que tem de unico vs alternativas?
```

---

## Mapeamento Feature -> Beneficio

**Features tecnicas precisam virar beneficios de venda.**

| Feature Tecnica | Beneficio (para copy) |
|-----------------|----------------------|
| "API RESTful" | "Integra com suas ferramentas" |
| "Dashboard em tempo real" | "Veja tudo acontecendo ao vivo" |
| "Automacoes configuráveis" | "Automatize sem saber programar" |
| "Multi-tenant" | "Cada cliente isolado com seguranca" |
| "SSO/SAML" | "Login unico para toda a empresa" |
| "Webhooks" | "Receba alertas onde preferir" |
| "Role-based access" | "Controle quem ve o que" |

---

## Checklist de Extracao

```markdown
## Obrigatorio
- [ ] Nome do produto
- [ ] Descricao (1-2 frases)
- [ ] 3+ funcionalidades
- [ ] Publico inferido

## Desejavel
- [ ] Stack tecnologica
- [ ] Complexidade de setup
- [ ] Tipo de interface (web, mobile, CLI)
- [ ] Modelo de negocio (SaaS, self-hosted)

## Se nao encontrado
- [ ] Usar questionario de fallback
- [ ] Marcar campos como "a validar"
```

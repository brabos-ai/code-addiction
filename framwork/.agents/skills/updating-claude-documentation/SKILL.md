<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/updating-claude-documentation/SKILL.md -->
---
name: updating-claude-documentation
description: |
  **SEMPRE usar (NUNCA editar CLAUDE.md diretamente)** quando usuario diz: "atualize o CLAUDE.md", "verifique se o CLAUDE.md esta atualizado"
---

# Atualizacao de Documentacao Claude

> **DOCUMENTATION STYLE:** Seguir padroes definidos em `.codeadd/skills/documentation-style/SKILL.md`

CLAUDE.md e fonte de verdade arquitetural para onboarding, assistentes IA e alinhamento do time. DEVE ser **self-contained** e refletir estado atual do codebase.

**Principio Central**: CLAUDE.md e o unico arquivo que o modelo precisa ler. Toda informacao em um lugar. Sem arquivos separados.

---

## Estrutura do CLAUDE.md (Self-Contained)

```
CLAUDE.md
├── About (human-readable, ~5 linhas)
├── Quick Start (human-readable, comandos essenciais)
├── ## Technical Spec (token-efficient, JSON minificado)
│   ├── Stack
│   ├── Structure
│   ├── Layers
│   ├── Patterns
│   ├── Domain
│   ├── Config
│   ├── Security
│   ├── Critical Files
│   ├── Business Rules
│   ├── Frontend (UI lib, state, routing)
│   ├── Frontend Patterns (components, hooks, stores, pages)
│   ├── UI Patterns (modals, toasts, forms, drawer)
│   ├── API Integration (client, queryKeys, mutations)
│   ├── Backend Patterns (modules, commands, repositories)
│   ├── Services Pattern (path, naming, injection)
│   ├── Hooks (location, naming, patterns)
│   ├── Background Processing (queue, workers, processors)
│   ├── Job Types (immediate, queued, scheduled, recurring)
│   ├── Scheduling (cron jobs, intervals, patterns)
│   ├── Events (pub/sub, handlers, naming)
│   ├── Webhooks (inbound, outbound, validation)
│   └── Integrations (external APIs, SDKs)
├── Best Practices (human-readable)
├── Features (referencia a /docs/features/)
└── Design Principles (KISS, YAGNI, etc.)
```

### Formato por Secao

{"formats":{"About,Quick Start":{"format":"Human-readable","audience":"Devs humanos"},"Technical Spec":{"format":"Token-efficient (JSON minificado)","audience":"IA + Devs"},"Best Practices":{"format":"Human-readable","audience":"Devs humanos"},"Design Principles":{"format":"Human-readable","audience":"Devs humanos"}}}

**IMPORTANTE**: NAO criar arquivo `technical-spec.md` separado. Tudo fica no CLAUDE.md.

---

## Processo de Atualizacao

### Fase 1: Identificar Tipo de Mudanca

{"actions":{"/architecture":["Stack, patterns, domain, entities, enums","Frontend patterns, UI lib, state mgmt","Novo componente UI (modal, toast, form) se padrao novo","Novo hook, store, service se padrao novo","Novo worker, job, processor","Novo cron job, scheduled task","Novo event, handler, pub/sub","Nova integracao externa, webhook","Nova feature se afeta Technical Spec"],"manual":["Boas praticas, principios","Correcao de typo"]}}

### Fase 2: Auditar Estado Atual

```bash
# Commits recentes com mudancas arquiteturais
git log --oneline -20 --name-status | grep -E "entities|enums|module|service"

# Estrutura atual
ls apps/ libs/

# Features documentadas
ls docs/features/
```

### Fase 3: Atualizar Secao Correta

**Secao Technical Spec** (token-efficient):
- **SEMPRE** usar `/architecture` para atualizar
- NAO editar JSON minificado manualmente
- Formato: `{"key":"value"}` em uma linha

**Outras secoes** (human-readable):
- Editar diretamente
- Manter brevidade (~100 palavras max por paragrafo)
- Sem emojis em headers

### Fase 4: Verificar Consistencia

**Checklist**:
- [ ] Paths mencionados existem no projeto
- [ ] Versoes de dependencias estao corretas
- [ ] JSON minificado esta em uma linha (sem quebras)
- [ ] Technical Spec atualizado via `/architecture`

```bash
# Verificar se paths mencionados existem
grep -oP '`[^`]+\.(ts|js|json)`' CLAUDE.md | sort -u
```

---

## Secao Technical Spec (Token-Efficient)

Esta secao usa formato otimizado para consumo por IA:

```markdown
## Technical Spec

> Secao otimizada para consumo por IA. Formato token-efficient.

**Generated:** YYYY-MM-DD | **Type:** Monorepo

### Stack
{"pkg":"npm","build":"turbo","ts":"5.0+"}
{"backend":{"framework":"NestJS 10","db":"PostgreSQL 15","orm":"Kysely 0.27"}}
{"frontend":{"framework":"React 18.2","bundler":"Vite 4.4","ui":"Shadcn+Tailwind"}}

### Structure
{"paths":{"backend":"apps/backend","frontend":"apps/frontend","domain":"libs/domain"}}

### Layers
domain → interfaces → database → api

### Patterns
{"identified":["CQRS","Repository","DI","CleanArchitecture"]}
{"conventions":{"files":"kebab-case","classes":"PascalCase","interfaces":"I+PascalCase"}}

### Domain
{"entitiesPath":"libs/domain/src/entities","entities":["Account","User","Workspace"]}
{"enumsPath":"libs/domain/src/enums","enums":[{"name":"UserRole","values":"owner|admin|member"}]}

### Config
{"envAccess":"IConfigurationService","configFile":"apps/backend/src/shared/services/configuration.service.ts"}

### Security
{"multiTenancy":{"enabled":true,"strategy":"account_id"}}
{"auth":{"provider":"Supabase","strategy":"JWT"}}

### Critical Files
{"backendCore":["apps/backend/src/main.ts - Dispatcher","apps/backend/src/shared/shared.module.ts - DI"]}

### Business Rules
- SEMPRE filtrar queries por account_id
- Repositories retornam entities, NUNCA DTOs

### Frontend
{"ui":{"lib":"shadcn/ui","styling":"Tailwind v3","animation":"Framer Motion"}}
{"state":{"server":"TanStack Query","local":"Zustand","forms":"React Hook Form+Zod"}}
{"routing":"React Router v6","api":"Axios instance centralizado"}

### Frontend Patterns
{"components":{"path":"apps/frontend/src/components","structure":"ui/|features/[name]/|layout/"}}
{"hooks":{"path":"apps/frontend/src/hooks","naming":"use-[resource].ts","pattern":"useQuery+useMutation"}}
{"pages":{"path":"apps/frontend/src/pages","states":"loading→skeleton,error→message,empty→emptyState"}}

### UI Patterns
{"modals":"Dialog (shadcn) - controlled via open/onOpenChange props"}
{"toasts":"Sonner - toast.success/error/promise()","drawer":"Sheet (mobile)"}
{"forms":"Zod schema mirrors backend DTO, zodResolver, PT-BR messages"}

### API Integration
{"client":"apps/frontend/src/lib/api.ts","baseURL":"VITE_API_URL"}
{"queryKey":"['resource'] ou ['resource',id]","enabled":"!!id para condicionais"}
{"mutations":"invalidateQueries apos sucesso","types":"api.get<Type>() com generics"}
```

**Regras**:
- JSON em uma linha (minificado)
- Maximo 10 palavras por descricao de arquivo
- Usar `/architecture` para gerar/atualizar

---

## Documentando Aplicacoes e Camadas

Esta secao detalha como documentar cada camada do projeto de forma token-efficient.

### Secao Frontend (Token-Efficient)

```markdown
### Frontend
{"ui":{"lib":"shadcn/ui","styling":"Tailwind v3","animation":"Framer Motion"}}
{"state":{"server":"TanStack Query","local":"Zustand","forms":"React Hook Form+Zod"}}

### Frontend Patterns
{"components":{"path":"apps/frontend/src/components","structure":"ui/|features/[name]/|layout/"}}
{"hooks":{"path":"apps/frontend/src/hooks","naming":"use-[resource].ts"}}
{"stores":{"path":"apps/frontend/src/stores","naming":"[name]-store.ts"}}
{"pages":{"path":"apps/frontend/src/pages","states":"loading→skeleton,error→message,empty→emptyState"}}

### UI Patterns
{"modals":"Dialog (shadcn) via open/onOpenChange"}
{"toasts":"Sonner - toast.success/error/promise()"}
{"drawer":"Sheet (mobile)","confirm":"AlertDialog"}
{"forms":"Zod mirrors DTO, zodResolver, PT-BR msgs"}

### API Layer
{"client":"apps/frontend/src/lib/api.ts"}
{"queryKey":"['resource'] ou ['resource',id]"}
{"mutations":"invalidateQueries apos sucesso"}
```

### Secao Backend (Token-Efficient)

```markdown
### Backend
{"framework":"NestJS 10","db":"PostgreSQL 15","orm":"Kysely 0.27"}
{"auth":{"provider":"Supabase","strategy":"JWT"}}

### Backend Patterns
{"modules":{"path":"apps/backend/src/modules/[feature]"}}
{"structure":"controller.ts|command/|repository.ts|[feature].module.ts"}
{"commands":"apps/backend/src/commands/[domain]/"}
{"repositories":"injetados via DI, retornam entities"}

### Services Pattern
{"services":{"path":"apps/backend/src/shared/services"}}
{"naming":"[name].service.ts → I[Name]Service interface"}
{"injection":"@Inject(TOKENS.[NAME]_SERVICE)"}

### Guards & Interceptors
{"guards":"JwtAuthGuard, RolesGuard, AccountOwnerGuard"}
{"interceptors":"TransformInterceptor, LoggingInterceptor"}
```

### Secao Repositorios (Token-Efficient)

```markdown
### Repositories
{"pattern":"Repository per aggregate root"}
{"location":"apps/backend/src/modules/[feature]/[feature].repository.ts"}
{"interface":"I[Feature]Repository em libs/domain/src/interfaces/"}
{"returns":"Entity (nunca DTO)","filters":"SEMPRE account_id"}

### Repository Methods
{"read":"findById,findAll,findBy[Field]"}
{"write":"create,update,delete"}
{"naming":"camelCase, verbFirst"}
```

### Secao Stores/State (Token-Efficient)

```markdown
### Zustand Stores
{"location":"apps/frontend/src/stores/"}
{"naming":"[name]-store.ts → use[Name]Store"}
{"persist":"zustand/middleware para auth"}

### Store Types
{"ui-store":"sidebar,modals,selections - transient state"}
{"auth-store":"user,token - persisted to localStorage"}
{"[feature]-store":"feature-specific UI state"}
```

### Secao Hooks (Token-Efficient)

```markdown
### Query Hooks
{"location":"apps/frontend/src/hooks/"}
{"naming":"use-[resource].ts"}
{"read":"useQuery({queryKey,queryFn,enabled})"}
{"write":"useMutation({mutationFn,onSuccess:invalidate})"}

### Custom Hooks
{"ui":"useMediaQuery,useDebounce,useLocalStorage"}
{"forms":"useFormField,useFormValidation"}
{"auth":"useAuth,usePermissions"}
```

### Secao Workers e Background Processing (Token-Efficient)

```markdown
### Background Processing
{"queue":{"lib":"BullMQ","redis":"Redis 7","path":"apps/backend/src/jobs/"}}
{"workers":{"path":"apps/backend/src/workers/","naming":"[domain].worker.ts"}}
{"processors":{"path":"apps/backend/src/jobs/processors/","naming":"[job].processor.ts"}}

### Job Types
{"immediate":"dispatchNow() - executa sync"}
{"queued":"dispatch() - executa async via fila"}
{"scheduled":"schedule(date) - executa em horario especifico"}
{"recurring":"cron pattern - executa periodicamente"}

### Queue Configuration
{"queues":["default","emails","reports","notifications","webhooks"]}
{"retry":{"attempts":3,"backoff":"exponential"}}
{"concurrency":{"default":5,"emails":10,"reports":2}}

### Scheduling (Cron Jobs)
{"scheduler":"@nestjs/schedule ou node-cron"}
{"path":"apps/backend/src/crons/","naming":"[task].cron.ts"}
{"decorator":"@Cron('pattern') ou @Interval(ms)"}
{"patterns":{"daily":"0 0 * * *","hourly":"0 * * * *","every5min":"*/5 * * * *"}}

### Event-Driven / Pub-Sub
{"lib":"EventEmitter2 ou RabbitMQ ou Redis Pub/Sub"}
{"publishers":"apps/backend/src/events/publishers/"}
{"subscribers":"apps/backend/src/events/handlers/"}
{"naming":"[domain].[action].event.ts (user.created, order.paid)"}
```

### Exemplos Praticos de Workers

```markdown
### Workers (Exemplo Completo)
{"queue":"BullMQ+Redis","path":"apps/backend/src/jobs/"}
{"jobs":["SendEmailJob","GenerateReportJob","ProcessWebhookJob","SyncExternalDataJob"]}
{"processors":"apps/backend/src/jobs/processors/[job-name].processor.ts"}

### Scheduling (Exemplo Completo)
{"lib":"@nestjs/schedule","path":"apps/backend/src/crons/"}
{"tasks":[{"name":"CleanupExpiredTokens","cron":"0 0 * * *"},{"name":"SendDailyDigest","cron":"0 8 * * *"}]}

### Events (Exemplo Completo)
{"lib":"EventEmitter2","pattern":"domain.action"}
{"events":["user.created","user.updated","order.created","payment.received"]}
{"handlers":"apps/backend/src/events/handlers/[domain].handler.ts"}
```

### Secao Integracao Externa e Webhooks (Token-Efficient)

```markdown
### Webhooks
{"inbound":{"path":"apps/backend/src/webhooks/","naming":"[provider].webhook.ts"}}
{"outbound":{"path":"apps/backend/src/jobs/webhooks/","queue":"webhooks"}}
{"validation":"signature verification via provider SDK"}

### External APIs
{"clients":"apps/backend/src/integrations/[provider]/"}
{"naming":"[provider].client.ts → I[Provider]Client interface"}
{"retry":"exponential backoff via axios-retry ou queue"}

### Third-Party SDKs
{"stripe":"apps/backend/src/integrations/stripe/"}
{"supabase":"via @supabase/supabase-js"}
{"sendgrid":"apps/backend/src/integrations/email/"}
```

### Checklist: O Que Documentar em Cada Camada

{"layers":{"Frontend":"UI lib, state mgmt, routing","Patterns":"Paths, estrutura, naming","UI":"Modais, toasts, forms","API Layer":"Client, queryKeys, mutations","Backend":"Framework, DB, ORM","Modules":"Path, estrutura","Repositories":"Pattern, interface, retorno","Stores":"Location, naming, tipos","Hooks":"Location, naming, patterns","Workers/Jobs":"Queue lib, paths, job types","Scheduling":"Lib, cron paths, patterns","Events":"Lib, publishers, subscribers","Webhooks":"Inbound/outbound, validation","Integrations":"External APIs, SDKs, clients"},"format":"JSON minificado para todos"}

---

## Secoes Human-Readable

### About
```markdown
## About

Template base para [proposito]. Stack: [principais tecnologias].
```

### Quick Start
```markdown
## Quick Start

npm install
npm run dev
```

### Best Practices
```markdown
## Best Practices

### Arquitetura
- Respeitar hierarquia Clean Architecture
- Commands para escrita, Queries direto nos Repositories

### Multi-Tenancy
- SEMPRE filtrar por account_id
- Validar ownership em todos endpoints
```

### Features
```markdown
## Features

Documentacao de features em `/docs/features/`. Cada feature possui: about.md, discovery.md, plan.md, changelog.md.
```

### Design Principles
```markdown
## Design Principles

- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
```

---

## Quando Usar /architecture vs Edicao Manual

{"routing":{"/architecture":["Novo pacote/lib","Nova entity/enum","Novo pattern","Mudanca de versao","Nova UI lib (shadcn, radix)","Novo state manager","Novo padrao de hook","Novo padrao de componente","Mudanca no API layer","Novo worker ou job","Nova queue ou processor","Novo cron job ou scheduled task","Novo event ou handler","Nova integracao (Stripe, SendGrid, etc)","Novo webhook (inbound ou outbound)"],"manual":["Nova regra de negocio → Business Rules","Corrigir typo","Atualizar Best Practices"]}}

---

## Backend: Informacoes Obrigatorias no CLAUDE.md

### Workers e Background Processing (OBRIGATORIO documentar)

{"workers":{"Queue lib":"BullMQ+Redis","Workers path":"src/workers/","Processors path":"src/jobs/processors/","Job types":"dispatch:async,dispatchNow:sync","Retry config":"attempts:3,backoff:exp"}}

### Scheduling (OBRIGATORIO documentar)

{"scheduling":{"Scheduler lib":"@nestjs/schedule","Crons path":"src/crons/","Decorator":"@Cron(pattern)","Common patterns":"daily:0 0 * * *,hourly:0 * * * *"}}

### Events e Pub/Sub (OBRIGATORIO documentar)

{"events":{"Event lib":"EventEmitter2","Publishers path":"src/events/publishers/","Handlers path":"src/events/handlers/","Naming pattern":"domain.action"}}

### Webhooks e Integracoes (OBRIGATORIO documentar)

{"webhooks":{"Inbound":"src/webhooks/","Outbound":"via queue webhooks","Integrations path":"src/integrations/","Validation":"signature verify"}}

---

## Frontend: Informacoes Obrigatorias no CLAUDE.md

### UI Layer (OBRIGATORIO documentar)

{"uiLayer":{"UI Library":"shadcn/ui+Tailwind","Modals":"Dialog via open/onOpenChange","Toasts":"Sonner - toast.success/error","Forms":"RHF+Zod, mirrors DTO","Tables":"TanStack Table","Loading states":"skeleton components","Empty states":"EmptyState component"}}

### State Management (OBRIGATORIO documentar)

{"stateManagement":{"Server state":"TanStack Query","Local state":"Zustand","Auth state":"useAuthStore+persist","Form state":"React Hook Form"}}

### API Integration (OBRIGATORIO documentar)

{"apiIntegration":{"Client":"lib/api.ts","Base URL":"VITE_API_URL","Query keys":"['resource',id]","Mutations":"onSuccess:invalidateQueries"}}

### Paths e Estrutura (OBRIGATORIO documentar)

{"paths":{"Components":"src/components/","Hooks":"src/hooks/","Stores":"src/stores/","Pages":"src/pages/","Lib":"src/lib/"}}

---

## Red Flags

{"redFlags":["Criar technical-spec.md separado","JSON formatado com quebras de linha","Editar Technical Spec manualmente","Duplicar informacao entre secoes","Documentar aspiracoes em vez de realidade","Nao documentar UI library","Nao documentar state management","Nao documentar API layer","Nao documentar paths do frontend","Nao documentar workers/jobs","Nao documentar scheduling","Nao documentar events","Nao documentar webhooks e integracoes"]}

---

## Racionalizacoes Comuns

{"excuses":[{"excuse":"Vou documentar depois","reality":"Depois nunca chega"},{"excuse":"E so uma pequena mudanca","reality":"Pequenas mudancas acumulam"},{"excuse":"O codigo e auto-documentado","reality":"Arquitetura nao esta no codigo"},{"excuse":"Preciso de arquivo separado","reality":"CLAUDE.md self-contained e mais eficiente"}]}

---

## Integracao com Outros Comandos

**Para atualizar Technical Spec:**
→ Usar `/architecture`

**Apos atualizar CLAUDE.md:**
→ `/review` para validar codigo contra padroes

---

## Nota Final

CLAUDE.md deve ser:
1. **Self-contained** - Toda informacao em um arquivo
2. **Atualizado** - Reflete codigo atual
3. **Hibrido** - Secoes human-readable + secao token-efficient
4. **Verificavel** - Paths e versoes validaveis

Sem excecoes. Sem arquivos separados. Sem racionalizacao.

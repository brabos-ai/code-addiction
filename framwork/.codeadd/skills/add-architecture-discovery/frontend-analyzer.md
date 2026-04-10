# Frontend Analyzer

Analisa e documenta padrões frontend IMPLEMENTADOS no projeto.

## Objetivo

Gerar `.codeadd/skills/project-patterns/frontend.md` com padrões reais do projeto. Follows context engineering principles: frontmatter + TL;DR + TOC + topic-first ## chunks (~128 tokens each) with extractive-only content and real code examples.

## PRIMEIRO: Descobrir SE Existe Frontend

**NÃO assuma nada. Descubra via config files e código.**

1. Leia CLAUDE.md para entender estrutura do projeto
2. Leia config files para identificar dependências:
   ```bash
   # Dependências listam tudo que o projeto usa
   cat package.json 2>/dev/null          # Node.js (React, Vue, Svelte, etc)
   cat requirements.txt 2>/dev/null      # Python (Django templates, etc)
   cat Gemfile 2>/dev/null               # Ruby (Rails views, etc)
   cat pubspec.yaml 2>/dev/null          # Flutter/Dart
   cat composer.json 2>/dev/null         # PHP (Laravel Blade, etc)
   ```
3. Analise extensões de arquivos para confirmar stack:
   ```bash
   # Verificar extensões presentes
   find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) 2>/dev/null | head -5
   ```
4. Se não encontrar código frontend → retorne "NO_FRONTEND_FOUND"
5. Se encontrar → continue a análise

## O Que Descobrir

Pesquise APENAS se existir no projeto:

### 1. Framework & Build
- Qual framework está sendo usado? (descubra via imports/código)
- Qual build tool? (veja configs: vite.config, webpack.config, next.config, etc)
- Package manager (veja lockfile: package-lock, yarn.lock, pnpm-lock)

### 2. State Management
- Biblioteca: zustand, redux, pinia, context, jotai, recoil, etc
- Padrão de stores
- Hooks customizados
- **Encontrar exemplo real de store**

### 3. Component Structure
- Hierarquia de pastas
- Naming conventions
- Padrão de props (interfaces/types)
- **Encontrar exemplo de componente típico**

### 4. Styling
- Biblioteca: tailwind, styled-components, css-modules, sass, emotion, etc
- Global styles location
- Convenções

### 5. HTTP Client
- Biblioteca: axios, fetch, swr, react-query, tanstack-query, etc
- Configuração base
- Interceptors
- **Encontrar exemplo de chamada API**

### 6. Routing
- Biblioteca: react-router, next/router, tanstack-router, vue-router, etc
- Estrutura de rotas
- Lazy loading

### 7. Forms
- Biblioteca: react-hook-form, formik, vee-validate, etc
- Validação: zod, yup, joi
- **Encontrar exemplo de form**

### 8. Environment Variables
- Prefixo: VITE_, NEXT_PUBLIC_, REACT_APP_
- Location: .env.local, .env
- Acesso: import.meta.env, process.env

### 9. Reusable Abstractions (CRITICAL — prevents duplication)
- Custom hooks/composables already available (useAuth, useFetch, useForm, etc)
- Shared UI components (Layout, Modal, DataTable, FormField, etc)
- Shared utilities (formatters, parsers, validators, date helpers)
- Shared types/interfaces (API response types, entity types)
- Context providers/stores already available
- Existing pages/features that solve similar problems (agents should study before building new ones)
- **For each: document path, purpose, and usage example**
- **Principle: if a hook/component/utility exists, the agent MUST reuse it**

### 10. Project Conventions (CRITICAL — ensures consistency)
- File/folder naming pattern (kebab-case, PascalCase for components, etc)
- Feature/page organization (by route? by domain? flat?)
- Where new components should be placed (shared vs feature-specific)
- How new routes/pages are registered
- Import ordering/aliasing conventions (@/, ~/, etc)
- Co-location rules (styles next to component? tests next to component?)
- **Principle: the agent must follow the established pattern, not invent a new one**

### 11. Testing (SE EXISTIR)
- Framework: vitest, jest, testing-library, cypress, playwright
- Padrão de arquivos
- Comandos

## Como Pesquisar

**IMPORTANTE:** Primeiro leia package.json (ou equivalente) para ver dependências instaladas. Depois confirme com código.

```bash
# 1. Ler dependências do projeto (fonte da verdade)
cat package.json | grep -A 100 '"dependencies"' | head -50

# 2. Encontrar onde está o código frontend
find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) 2>/dev/null | head -10

# 3. Encontrar stores/state
find . -type d \( -name "stores" -o -name "store" -o -name "state" \) 2>/dev/null | head -5

# 4. Encontrar configs de build
find . -type f \( -name "vite.config*" -o -name "next.config*" -o -name "webpack.config*" -o -name "nuxt.config*" \) 2>/dev/null | head -5

# 5. Ler arquivo de componente para entender padrão
# (escolher um componente após descobrir onde estão)
```

## Output Format

Write to `.codeadd/skills/project-patterns/frontend.md` using this structure:

```markdown
---
area: frontend
generated: YYYY-MM-DD
app-path: [actual app path, e.g., apps/web]
framework: [detected framework]
---

## TL;DR

[≤60 words: framework, key libraries, patterns count. Extractive only.]

## TOC

- [Framework & Build](#framework--build)
- [State Management](#state-management)
- [Component Structure](#component-structure)
- [Styling](#styling)
- [HTTP Client](#http-client)
- [Routing](#routing)
- [Forms](#forms)
- [Environment Variables](#environment-variables)
- [Reusable Abstractions](#reusable-abstractions)
- [Project Conventions](#project-conventions)
- [Testing](#testing)

## Framework & Build

[Topic sentence: framework, build tool, package manager.]
Config: `{"framework":"[name]","version":"[X.Y]","build":"[vite/next/etc]","pkg":"[npm/yarn/pnpm]"}`

## State Management

[Topic sentence: library, store pattern.]
Config: `{"library":"[name]","stores":"[path glob]","hooks":"[list]"}`

```tsx
// [path:line]
[REAL store example, ≤10 lines]
```

## Component Structure

[Topic sentence: folder hierarchy, naming conventions.]
Config: `{"components":"[PascalCase/etc]","hooks":"[camelCase]","files":"[kebab-case/etc]"}`

```tsx
// [path:line]
[REAL props interface example, ≤10 lines]
```

## Styling

[Topic sentence: library, pattern.]
Config: `{"library":"[name]","global":"[path]","pattern":"[utility-first/css-modules/etc]"}`

```tsx
// [path:line]
[REAL styled component example, ≤10 lines]
```

## HTTP Client

[Topic sentence: library, base URL source.]
Config: `{"library":"[name]","config":"[path]","base_url":"[env var or path]"}`

```tsx
// [path:line]
[REAL API call example, ≤10 lines]
```

## Routing

[Topic sentence: library, route structure.]
Config: `{"library":"[name]","routes":"[path]"}`

```tsx
// [path:line]
[REAL route definition, ≤10 lines]
```

## Forms

[Topic sentence: library, validation.]
Config: `{"library":"[name]","validation":"[zod/yup/etc]"}`

```tsx
// [path:line]
[REAL form example, ≤10 lines]
```

## Environment Variables

[Topic sentence: prefix, access pattern.]
Config: `{"prefix":"[VITE_/NEXT_PUBLIC_/etc]","location":"[.env.local/etc]","access":"[import.meta.env/etc]"}`

## Reusable Abstractions

[Topic sentence: what exists that agents MUST reuse instead of creating from scratch.]

**Custom hooks/composables:**
- `[hookName]` at `[path]` — [what it does]

**Shared UI components:**
- `[ComponentName]` at `[path]` — [purpose, props summary]

**Shared utilities:**
- `[utilName]` at `[path]` — [what it does]

**Shared types:**
- `[path glob]` — [what's available]

## Project Conventions

[Topic sentence: how the project is organized and where new code should go.]

File naming: [pattern]
Feature organization: [by route/domain/flat]
New component placement: [shared/ vs feature-specific/]
New route registration: [how]
Import aliasing: [@ or ~ conventions]
Co-location: [styles/tests next to component?]

## Testing

[Topic sentence: framework, file pattern.]
Config: `{"framework":"[name]","files":"[pattern]","run":"[command]"}`
```

**CRITICAL:** Skip sections that don't exist. Each ## chunk ~100-150 words max. Code examples always with `// path:line` comment. TOC only includes sections that exist.

**MOST IMPORTANT SECTIONS:** Reusable Abstractions and Project Conventions are the highest-value sections — they prevent agents from duplicating existing hooks/components and violating established patterns. Prioritize discovering these over documenting library configs.

## Regras Críticas

**OBRIGATÓRIO:**
- Ler arquivos reais para extrair exemplos
- Só incluir seções que REALMENTE existem
- Exemplos devem ser do código do projeto

**PROIBIDO:**
- Inventar padrões não encontrados
- Seções com "Not found" ou "None"
- Exemplos genéricos
- Assumir configurações

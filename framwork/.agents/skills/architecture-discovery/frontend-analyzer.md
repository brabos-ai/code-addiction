# Frontend Analyzer

Analisa e documenta padrões frontend IMPLEMENTADOS no projeto.

## Objetivo

Gerar conteúdo para `.codeadd/project/[PREFIX]-[DIR_NAME].md` com padrões reais do projeto.

**Naming Convention:** File name = `{PREFIX}-{DIRECTORY-NAME}.md`
- PREFIX = APP (if in apps/) | LIB (if in libs/ or packages/)
- DIRECTORY-NAME = exact directory name in UPPERCASE
- Example: `apps/frontend` → `APP-FRONTEND.md`, `apps/admin` → `APP-ADMIN.md`

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

### 9. Testing (SE EXISTIR)
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

```markdown
# Frontend Patterns

## Framework & Library
Framework: [nome] [version] | Build: [tool] | Package Manager: [npm/yarn/pnpm]

## State Management
Library: [nome]
Stores location: [path glob]

Store pattern:
```tsx
[exemplo REAL de store do projeto]
```

Hooks: [lista de custom hooks]

## Component Structure
Folder hierarchy:
```
[estrutura REAL do projeto]
```

Naming:
- Components: [PascalCase/etc]
- Hooks: [camelCase com use/etc]
- Files: [kebab-case/etc]

Props pattern:
```tsx
[exemplo REAL de interface de props]
```

## Styling
Library: [nome]
Global: [path]
Pattern: [utility-first/css-modules/etc]

Example:
```tsx
[exemplo REAL de componente estilizado]
```

## HTTP Client
Library: [nome]
Config: [path]
Base URL: [de onde vem]

Pattern:
```tsx
[exemplo REAL de chamada API]
```

## Routing
Library: [nome]
Routes: [path do arquivo de rotas]

Structure:
```tsx
[exemplo REAL de definição de rotas]
```

## Forms
Library: [nome]
Validation: [zod/yup/etc]

Pattern:
```tsx
[exemplo REAL de form]
```

## Environment Variables
Prefix: [VITE_/etc]
Location: [.env.local/etc]
Access: [import.meta.env/etc]

## Testing
Framework: [nome]
Files: [*.test.tsx/etc]
Run: [comando]
```

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

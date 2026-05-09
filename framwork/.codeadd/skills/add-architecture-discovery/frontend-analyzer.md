# Frontend Analyzer

Analyzes and documents frontend patterns IMPLEMENTED in the project.

## Objective

Generate `{{addpath:skills/project-patterns/frontend.md}}` with real project patterns. Follows context engineering principles: frontmatter + TL;DR + TOC + topic-first ## chunks (~128 tokens each) with extractive-only content and real code examples.

## FIRST: Discover IF Frontend Exists

**Do NOT assume anything. Discover via config files and code.**

1. Read CLAUDE.md to understand the project structure
2. Read config files to identify dependencies:
   ```bash
   # Dependencies list everything the project uses
   cat package.json 2>/dev/null          # Node.js (React, Vue, Svelte, etc)
   cat requirements.txt 2>/dev/null      # Python (Django templates, etc)
   cat Gemfile 2>/dev/null               # Ruby (Rails views, etc)
   cat pubspec.yaml 2>/dev/null          # Flutter/Dart
   cat composer.json 2>/dev/null         # PHP (Laravel Blade, etc)
   ```
3. Analyze file extensions to confirm the stack:
   ```bash
   # Check present extensions
   find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) 2>/dev/null | head -5
   ```
4. If no frontend code found → return "NO_FRONTEND_FOUND"
5. If found → continue analysis

## What to Discover

Search ONLY for what exists in the project:

### 1. Framework & Build
- Which framework is being used? (discover via imports/code)
- Which build tool? (check configs: vite.config, webpack.config, next.config, etc)
- Package manager (check lockfile: package-lock, yarn.lock, pnpm-lock)

### 2. State Management
- Library: zustand, redux, pinia, context, jotai, recoil, etc
- Store pattern
- Custom hooks
- **Find a real store example**

### 3. Component Structure
- Folder hierarchy
- Naming conventions
- Props pattern (interfaces/types)
- **Find a typical component example**

### 4. Styling
- Library: tailwind, styled-components, css-modules, sass, emotion, etc
- Global styles location
- Conventions

### 5. HTTP Client
- Library: axios, fetch, swr, react-query, tanstack-query, etc
- Base configuration
- Interceptors
- **Find an API call example**

### 6. Routing
- Library: react-router, next/router, tanstack-router, vue-router, etc
- Route structure
- Lazy loading

### 7. Forms
- Library: react-hook-form, formik, vee-validate, etc
- Validation: zod, yup, joi
- **Find a form example**

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

### 11. Testing (IF EXISTS)
- Framework: vitest, jest, testing-library, cypress, playwright
- File pattern
- Commands

## How to Search

**IMPORTANT:** First read package.json (or equivalent) to see installed dependencies. Then confirm with code.

```bash
# 1. Read project dependencies (source of truth)
cat package.json | grep -A 100 '"dependencies"' | head -50

# 2. Find where frontend code is located
find . -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) 2>/dev/null | head -10

# 3. Find stores/state
find . -type d \( -name "stores" -o -name "store" -o -name "state" \) 2>/dev/null | head -5

# 4. Find build configs
find . -type f \( -name "vite.config*" -o -name "next.config*" -o -name "webpack.config*" -o -name "nuxt.config*" \) 2>/dev/null | head -5

# 5. Read a component file to understand the pattern
# (choose a component after discovering where they are)
```

## Output Format

Write to `{{addpath:skills/project-patterns/frontend.md}}` using this structure:

```markdown
---
area: frontend
generated: YYYY-MM-DD
app-path: [actual app path, e.g., apps/web]
framework: [detected framework]
---

## TL;DR

[Brief by genre — framework, key libraries, patterns count. Extractive only. Stop when the three are covered. No length number applies.]

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

**CRITICAL:** Skip sections that don't exist. Each ## chunk = topic sentence + extractive content. Split by sub-heading rather than truncate when a chunk grows past a natural boundary. No numeric length cap applies (see `{{skill:add-doc-schemas/SKILL.md}}` for the output-length doctrine). Code examples always with `// path:line` comment. TOC only includes sections that exist.

**MOST IMPORTANT SECTIONS:** Reusable Abstractions and Project Conventions are the highest-value sections — they prevent agents from duplicating existing hooks/components and violating established patterns. Prioritize discovering these over documenting library configs.

## Critical Rules

**MANDATORY:**
- Read real files to extract examples
- Only include sections that ACTUALLY exist
- Examples must come from the project code

**FORBIDDEN:**
- Fabricate patterns not found in the code
- Sections with "Not found" or "None"
- Generic examples
- Assume configurations

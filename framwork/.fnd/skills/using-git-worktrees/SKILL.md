---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation + **VSCode separado**.

**Announce at start:** "Vou usar a skill using-git-worktrees para criar um workspace isolado."

## When to Use

Esta skill é **INDEPENDENTE** dos comandos de desenvolvimento. Use quando:
- Você quer **isolamento total** para trabalhar em uma feature
- Você precisa manter o workspace atual intacto (ex: servidor rodando)
- Você quer trabalhar em múltiplas features simultaneamente

**Workflow típico:**
```
1. Execute /feature no workspace atual (cria branch + documentação)
2. Use esta skill para criar worktree isolada
3. Continue o desenvolvimento no VSCode que será aberto
```

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no CLAUDE.md preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## Safety Verification

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify .gitignore before creating worktree:**

```bash
# Check if directory pattern in .gitignore
grep -q "^\.worktrees/$" .gitignore || grep -q "^worktrees/$" .gitignore
```

**If NOT in .gitignore:**

Per Jesse's rule "Fix broken things immediately":
1. Add appropriate line to .gitignore
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

### For Global Directory (~/.config/superpowers/worktrees)

No .gitignore verification needed - outside project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 5. Open VSCode in Worktree

**CRITICAL:** After setup, open a NEW VSCode window in the worktree:

```bash
# Open VSCode in the worktree directory
code "$path"
```

### 6. Report and Handoff

```markdown
## ✅ Worktree Criada com Sucesso!

📁 **Localização:** `<full-path>`
🌿 **Branch:** `<branch-name>`
✅ **Testes:** <N> passando, 0 falhas

---

## 🚀 Um novo VSCode foi aberto no diretório da worktree!

**⚠️ IMPORTANTE:** Continue seu trabalho no **novo VSCode** que acabou de abrir.

### No novo VSCode:
1. O Claude Code terá contexto isolado da worktree
2. Execute os comandos de desenvolvimento lá:
   - `/plan` - para planejamento técnico
   - `/dev` - para implementação acompanhada
   - `/autopilot` - para implementação autônoma
   - `/fnd-done` - para finalizar

### Neste VSCode (atual):
- Você pode continuar trabalhando em outras coisas
- A worktree é independente - não afeta este workspace
- Quando terminar a feature, a branch será mergeada via `/fnd-done` no outro VSCode

---

💡 **Dica:** Se fechar o VSCode da worktree por engano, abra novamente:
\`\`\`bash
code <full-path>
\`\`\`
```

## Quick Reference

{"situations":[{".worktrees/ exists":"Use it (verify .gitignore)"},{"worktrees/ exists":"Use it (verify .gitignore)"},{"both exist":"Use .worktrees/"},{"neither exists":"Check CLAUDE.md → Ask user"},{"not in .gitignore":"Add immediately + commit"},{"tests fail":"Report failures + ask"},{"no package.json":"Skip dependency install"}]}

## Common Mistakes

{"mistakes":[{"err":"Skipping .gitignore verification","problem":"Worktree contents get tracked","fix":"Always grep .gitignore before creating"},{"err":"Assuming directory location","problem":"Creates inconsistency","fix":"Follow priority: existing > CLAUDE.md > ask"},{"err":"Proceeding with failing tests","problem":"Can't distinguish new bugs","fix":"Report failures, get permission"},{"err":"Hardcoding setup commands","problem":"Breaks on different tools","fix":"Auto-detect from project files"}]}

## Example Workflow

```
User: Quero trabalhar na feature de autenticação em um workspace isolado

Claude: Vou usar a skill using-git-worktrees para criar um workspace isolado.

[Check .worktrees/ - exists]
[Verify .gitignore - contains .worktrees/]
[Create worktree: git worktree add .worktrees/feature-F0001-auth -b feature/F0001-auth]
[Run npm install]
[Run npm test - 47 passing]
[Run: code .worktrees/feature-F0001-auth]

## ✅ Worktree Criada com Sucesso!

📁 **Localização:** `/Users/dev/myproject/.worktrees/feature-F0001-auth`
🌿 **Branch:** `feature/F0001-auth`
✅ **Testes:** 47 passando, 0 falhas

---

## 🚀 Um novo VSCode foi aberto no diretório da worktree!

**⚠️ IMPORTANTE:** Continue seu trabalho no **novo VSCode** que acabou de abrir.

### No novo VSCode:
1. O Claude Code terá contexto isolado da worktree
2. Execute `/plan`, `/dev`, `/autopilot`, ou `/fnd-done` lá

### Neste VSCode (atual):
- Pode continuar trabalhando em outras coisas
- A worktree é independente
```

## Red Flags

**Never:**
- Create worktree without .gitignore verification (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip CLAUDE.md check

**Always:**
- Follow directory priority: existing > CLAUDE.md > ask
- Verify .gitignore for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Esta skill é INDEPENDENTE** - não é chamada automaticamente por outros comandos.

**Como usar:**
1. Execute `/feature` primeiro (cria branch e documentação no workspace atual)
2. Peça para usar esta skill: "Quero criar uma worktree isolada para esta feature"
3. Continue o trabalho no **VSCode que será aberto**

**Combina bem com:**
- `/feature` → Cria a documentação antes de isolar
- `/plan`, `/dev`, `/autopilot` → Executados no VSCode da worktree
- `/fnd-done` → Finaliza e faz merge (executado no VSCode da worktree)

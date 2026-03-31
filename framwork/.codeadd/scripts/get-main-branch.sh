#!/bin/bash
# =============================================================================
# Get Main Branch
# Detecta branch principal do projeto com fallback em cascata
# =============================================================================
# Usage: MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")
# Returns: nome da branch principal (main, master, etc)
# Exit codes:
#   0 — branch encontrada com certeza (verificada no repositório)
#   1 — não é um repositório git
#   2 — nenhuma branch padrão encontrada (fallback hardcoded não utilizado)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Guarda: verificar se estamos dentro de um repositório git
# ---------------------------------------------------------------------------
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "ERRO: o diretório atual não é um repositório git." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Tentar origin/HEAD (funciona em repos clonados corretamente)
#    Usa subshell para isolar pipefail — se git symbolic-ref falhar,
#    o pipe com sed não mascara o erro.
# ---------------------------------------------------------------------------
MAIN=""
if MAIN=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'); then
  if [ -n "$MAIN" ]; then
    echo "$MAIN"
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# 2. Verificar se origin/main existe no remote
# ---------------------------------------------------------------------------
if git show-ref --verify --quiet refs/remotes/origin/main 2>/dev/null; then
  echo "main"
  exit 0
fi

# ---------------------------------------------------------------------------
# 3. Verificar se origin/master existe no remote
# ---------------------------------------------------------------------------
if git show-ref --verify --quiet refs/remotes/origin/master 2>/dev/null; then
  echo "master"
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Fallback: verificar branches locais (repo sem remote ou sem fetch)
# ---------------------------------------------------------------------------
if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
  echo "main"
  exit 0
fi

if git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
  echo "master"
  exit 0
fi

# ---------------------------------------------------------------------------
# 5. Último recurso: nenhuma branch padrão encontrada
#    Emite aviso no stderr e sai com erro — não retorna "main" às cegas,
#    pois o chamador precisa saber que não há branch verificada.
# ---------------------------------------------------------------------------
echo "ERRO: nenhuma branch principal encontrada (main/master ausentes local e remotamente)." >&2
exit 2

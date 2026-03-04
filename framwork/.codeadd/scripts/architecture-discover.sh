#!/bin/bash
# architecture-discover.sh (v4.1 - Framework Agnostic)
# Quick codebase scan - structure only, agent infers the rest
# Output: minimal, glob-friendly, token-efficient

# FIX-01: Adicionado -u (variaveis nao definidas causam erro) e pipefail
# (qualquer comando num pipe que falhe causa exit imediato).
set -euo pipefail

# FIX-02: Funcao auxiliar para executar pipelines com grep de forma segura.
# grep retorna exit code 1 quando nao encontra matches, o que com set -e
# aborta o script. Esta funcao ignora o exit code 1 do grep (sem matches)
# mas propaga outros erros reais (permissao, arquivo invalido, etc.).
grep_safe() {
    grep "$@" || [ $? -eq 1 ]
}

# FIX-03: Funcao auxiliar para calcular profundidade de forma portavel,
# sem depender de wc -c com whitespace padding nem de seq (nao universal).
count_depth() {
    local path="$1"
    local depth=0
    local tmp="$path"
    # Remove cada '/' para contar quantos existem
    while [ "${tmp}" != "${tmp#*/}" ]; do
        tmp="${tmp#*/}"
        depth=$((depth + 1))
    done
    echo "$depth"
}

# FIX-04: Funcao auxiliar para gerar indentacao sem depender de seq.
make_indent() {
    local depth="$1"
    local indent=""
    local i=0
    while [ $i -lt "$depth" ]; do
        indent="${indent}  "
        i=$((i + 1))
    done
    echo "$indent"
}

# =============================================================================
# CONFIG FILES (source of truth for stack)
# =============================================================================

echo "CONFIG:"
# FIX-05: Removido '2>/dev/null' do comando '[' que nao gera stderr.
# O redirecionamento era inofensivo mas semanticamente incorreto/enganoso.
for f in package.json requirements.txt Gemfile pom.xml build.gradle go.mod Cargo.toml composer.json pubspec.yaml; do
    [ -f "$f" ] && echo "  $f"
done
# Monorepo configs
for f in turbo.json nx.json lerna.json pnpm-workspace.yaml; do
    [ -f "$f" ] && echo "  $f"
done
# Lock files (package manager hint)
for f in package-lock.json yarn.lock pnpm-lock.yaml Pipfile.lock Gemfile.lock go.sum Cargo.lock composer.lock; do
    [ -f "$f" ] && echo "  $f"
done

# =============================================================================
# STRUCTURE (all root directories, depth up to 5 levels)
# [/] indicates max depth reached
# =============================================================================

echo "STRUCTURE:"
echo "  [note: [/] indicates max depth reached - more subdirectories exist]"

# FIX-06: Substituida a subshell com pipe para 'find | sort | while read' por
# um loop sobre array para evitar que SIGPIPE do 'sort' ou do 'while' cause
# abort com pipefail. Tambem adicionado IFS= e -r ao read para preservar
# espacos e barras invertidas em nomes de diretorio.
while IFS= read -r dir_path; do

    # FIX-07: Usada funcao count_depth no lugar de 'tr -cd / | wc -c' para
    # evitar whitespace no resultado de wc e garantir portabilidade.
    depth=$(count_depth "$dir_path")

    # Skip root (.)
    [ "$depth" -eq 0 ] && continue

    # FIX-08: Corrigida logica de verificacao de subdiretorios. O original
    # usava '! -name "$(basename "$path")"' que excluia qualquer subdiretorio
    # com o mesmo nome do pai em vez de excluir apenas o proprio diretorio pai.
    # Agora usa -mindepth 1 para listar apenas os filhos diretos.
    next_level=$(find "$dir_path" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    # FIX-09: Strip de whitespace do resultado de wc -l (BSD wc adiciona espacos).
    next_level="${next_level// /}"

    # FIX-10: Usada funcao make_indent no lugar de 'printf ... $(seq ...)'.
    # seq nao e portavel (ausente em alguns sistemas minimais).
    indent=$(make_indent "$depth")
    dir_name=$(basename "$dir_path")

    # If at max depth (5) and has subdirs, add depth indicator
    if [ "$depth" -eq 5 ] && [ "$next_level" -gt 0 ]; then
        echo "${indent}${dir_name}/ [/]"
    else
        echo "${indent}${dir_name}/"
    fi

done < <(find . -maxdepth 5 -type d \
    ! -path '*/node_modules/*' \
    ! -path '*/.git/*' \
    ! -path '*/dist/*' \
    ! -path '*/build/*' \
    ! -path '*/coverage/*' \
    ! -path '*/__pycache__/*' \
    ! -path '*/.venv/*' \
    ! -path '*/target/*' \
    ! -path '*/.next/*' \
    ! -path '*/.turbo/*' \
    ! -path '*/.cache/*' \
    ! -path '*/.nuxt/*' \
    ! -path '*/out/*' \
    ! -path '*/.vercel/*' \
    ! -name 'node_modules' \
    ! -name '.git' \
    2>/dev/null | sort)

# =============================================================================
# TREE (depth 5, dirs only; [/] indicates max depth reached)
# =============================================================================

echo "TREE:"
echo "  [note: [/] indicates max depth reached - more subdirectories exist]"
if command -v tree > /dev/null 2>&1; then
    # FIX-11: Redirecionado stderr do tree para /dev/null de forma explicita
    # e adicionado '|| true' para que falha do tree nao aborte o script.
    tree -d -L 5 -I 'node_modules|.git|dist|build|coverage|__pycache__|.venv|target|.next|.turbo' --noreport 2>/dev/null | head -100 || true
else
    # Fallback: find dirs (compact format with depth indicator)
    # FIX-12: Mesma correcao da secao STRUCTURE: process substitution para
    # evitar SIGPIPE no pipe com head. 'head -100' faz o find receber SIGPIPE
    # ao atingir o limite; com pipefail isso causaria abort. Usamos head
    # separado apos o loop para limitar linhas de saida.
    line_count=0
    while IFS= read -r dir_path; do

        [ $line_count -ge 100 ] && break

        # FIX-13: Usada funcao count_depth (portavel, sem whitespace).
        depth=$(count_depth "$dir_path")

        # Skip root (.)
        [ "$depth" -eq 0 ] && continue

        # FIX-14: Usada funcao make_indent e corrigida logica de subdiretorios.
        indent=$(make_indent $((depth - 1)))
        dir_name=$(basename "$dir_path")

        # Check if at max depth and has subdirs
        next_level=$(find "$dir_path" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
        next_level="${next_level// /}"

        # If at max depth (5) and has subdirs, add indicator
        if [ "$depth" -eq 5 ] && [ "$next_level" -gt 0 ]; then
            echo "${indent}├── ${dir_name}/ [/]"
        elif [ "$depth" -eq 1 ]; then
            echo "${indent}${dir_name}/"
        else
            echo "${indent}├── ${dir_name}/"
        fi

        line_count=$((line_count + 1))

    done < <(find . -maxdepth 5 -type d \
        ! -path '*/node_modules/*' \
        ! -path '*/.git/*' \
        ! -path '*/dist/*' \
        ! -path '*/build/*' \
        ! -path '*/coverage/*' \
        ! -path '*/__pycache__/*' \
        ! -path '*/.venv/*' \
        ! -path '*/target/*' \
        ! -path '*/.next/*' \
        ! -path '*/.turbo/*' \
        ! -path '*/.cache/*' \
        ! -path '*/.nuxt/*' \
        ! -path '*/out/*' \
        ! -path '*/.vercel/*' \
        ! -name 'node_modules' \
        ! -name '.git' \
        2>/dev/null | sort)
fi

# =============================================================================
# FILE EXTENSIONS (top 10 - language hint)
# =============================================================================

echo "EXTENSIONS:"
# FIX-15: Adicionado '|| true' ao pipeline para que ausencia de extensoes
# conhecidas (grep/sed sem match) nao cause abort com set -e + pipefail.
find . -type f \
    ! -path '*/node_modules/*' \
    ! -path '*/.git/*' \
    ! -path '*/dist/*' \
    ! -path '*/build/*' \
    ! -path '*/.next/*' \
    2>/dev/null | \
    sed -n 's/.*\.\([a-zA-Z0-9]*\)$/\1/p' | \
    sort | uniq -c | sort -rn | head -10 | \
    awk '{printf "  .%s:%d\n", $2, $1}' || true

# =============================================================================
# SCRIPTS (available commands from config files)
# =============================================================================

echo "SCRIPTS:"

# package.json scripts
# FIX-16: Substituido pipeline de grep|grep|sed|while (que abortava quando
# grep nao encontrava matches) por uso de grep_safe que tolera exit code 1.
if [ -f "package.json" ]; then
    grep_safe -A 50 '"scripts"' package.json | \
        grep_safe -E '^\s+"[^"]+":\s*' | \
        sed 's/^\s*"\([^"]*\)".*/\1/' | head -15 | while IFS= read -r script; do
        [ -n "$script" ] && echo "  $script"
    done || true
fi

# Makefile targets
if [ -f "Makefile" ]; then
    grep_safe -E '^[a-zA-Z_][a-zA-Z0-9_-]*:' Makefile | \
        sed 's/:.*//' | head -10 | while IFS= read -r target; do
        [ -n "$target" ] && echo "  $target"
    done || true
fi

# pyproject.toml scripts
if [ -f "pyproject.toml" ]; then
    grep_safe -A 20 '\[project.scripts\]\|\[tool.poetry.scripts\]' pyproject.toml | \
        grep_safe -E '^[a-zA-Z_][a-zA-Z0-9_-]*\s*=' | \
        sed 's/\s*=.*//' | head -10 | while IFS= read -r script; do
        [ -n "$script" ] && echo "  $script"
    done || true
fi

# Cargo.toml binaries
if [ -f "Cargo.toml" ]; then
    grep_safe -A 5 '\[\[bin\]\]' Cargo.toml | \
        grep_safe 'name\s*=' | \
        sed 's/.*name\s*=\s*"\([^"]*\)".*/\1/' | head -10 | while IFS= read -r bin; do
        [ -n "$bin" ] && echo "  $bin"
    done || true
fi

# =============================================================================
# DEPS (dependencies from config files)
# =============================================================================

echo "DEPS:"

# package.json (dependencies + devDependencies)
# FIX-17: Mesma correcao de grep_safe para todos os blocos de deps.
if [ -f "package.json" ]; then
    echo "  pkg:"
    grep_safe -A 200 '"dependencies"' package.json | \
        grep_safe -E '^\s+"[^"]+":\s*' | \
        sed 's/^\s*"\([^"]*\)".*/\1/' | \
        head -30 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
    echo "  dev:"
    grep_safe -A 200 '"devDependencies"' package.json | \
        grep_safe -E '^\s+"[^"]+":\s*' | \
        sed 's/.*"\([^"]*\)".*/\1/' | \
        head -20 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
fi

# requirements.txt (Python)
if [ -f "requirements.txt" ]; then
    echo "  pip:"
    grep_safe -v '^\s*#' requirements.txt | \
        sed 's/[>=<\[].*$//' | \
        grep_safe -v '^\s*$' | \
        head -30 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
fi

# go.mod (Go)
if [ -f "go.mod" ]; then
    echo "  go:"
    # FIX-18: Substituido 'head -n -1' (nao portavel no BSD head, presente
    # em macOS) por uma abordagem compativel usando awk para excluir a ultima
    # linha do bloco require, que e o fechamento ')'.
    sed -n '/^require/,/^)/p' go.mod 2>/dev/null | \
        awk 'NR>1 && !/^\)/' | \
        awk '{print $1}' | \
        head -20 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
fi

# Gemfile (Ruby)
if [ -f "Gemfile" ]; then
    echo "  gem:"
    grep_safe -E "^\s*gem\s+" Gemfile | \
        sed "s/.*gem\s*['\"]\\([^'\"]*\\)['\"].*/\\1/" | \
        head -20 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
fi

# Cargo.toml (Rust)
if [ -f "Cargo.toml" ]; then
    echo "  cargo:"
    grep_safe -A 200 '^\[dependencies\]' Cargo.toml | \
        grep_safe -E '^\s*[a-zA-Z_][a-zA-Z0-9_-]*\s*=' | \
        sed 's/\s*=.*//' | \
        head -20 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
fi

# composer.json (PHP)
if [ -f "composer.json" ]; then
    echo "  php:"
    grep_safe -A 200 '"require"' composer.json | \
        grep_safe -E '^\s+"[^"]+":\s*' | \
        sed 's/.*"\([^"]*\)".*/\1/' | \
        head -20 | tr '\n' ',' | sed 's/,$//' | sed 's/^/    /' || true
    echo ""
fi

# =============================================================================
# ENV FILES
# =============================================================================

echo "ENV:"
# FIX-19: Removido '2>/dev/null' do comando '[' (nao gera stderr).
for f in .env .env.example .env.local .env.development .env.production; do
    [ -f "$f" ] && echo "  $f"
done

# =============================================================================
# LSP
# =============================================================================

echo "LSP:"
# FIX-20: Corrigido redirecionamento de 'command -v' para /dev/null de forma
# portavel. '&>' e uma extensao bash nao disponivel em sh estrito.
if command -v lsp > /dev/null 2>&1; then
    echo "  available:true"
else
    echo "  available:false"
fi

exit 0

#!/bin/bash

# ============================================
# DONE SCRIPT
# Branch finalization: context collection + merge execution
# ============================================
# Usage:
#   bash .codeadd/scripts/done.sh           # Context mode (default)
#   bash .codeadd/scripts/done.sh --merge   # Merge mode
# Dependencies: get-main-branch.sh
# ============================================

# [FIX-1] Adicionado -u (variáveis não definidas causam erro) e -o pipefail
# (erros em pipes não eram propagados). O script original só tinha `set -e`.
set -euo pipefail

# --- Args ---
MODE="context"
while [[ $# -gt 0 ]]; do
    case $1 in
        --merge) MODE="merge"; shift ;;
        *) shift ;;
    esac
done

# --- Detection ---

# [FIX-2] CURRENT_BRANCH poderia ser vazia em repositório com HEAD desanexado
# (detached HEAD). Verificação explícita adicionada.
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=HEAD is detached. Checkout a named branch before running this script."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# [FIX-3] Verificar se o script de dependência existe e é executável antes de
# chamá-lo. A falha aqui produzia mensagem de erro do shell, sem contexto claro.
if [ ! -f "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Dependency not found: $SCRIPT_DIR/get-main-branch.sh"
    exit 1
fi
if [ ! -x "$SCRIPT_DIR/get-main-branch.sh" ]; then
    chmod +x "$SCRIPT_DIR/get-main-branch.sh"
fi

MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")

# [FIX-4] MAIN_BRANCH vazia causaria git checkout/merge silenciosamente errado.
if [ -z "$MAIN_BRANCH" ]; then
    echo "STATUS=ERROR"
    echo "ERROR=Could not determine main branch."
    exit 1
fi

# Branch type detection
case "$CURRENT_BRANCH" in
    feature/F[0-9][0-9][0-9][0-9]-*) BRANCH_TYPE="feature" ;;
    fix/F[0-9][0-9][0-9][0-9]-*)     BRANCH_TYPE="hotfix_feature" ;;
    fix/H[0-9][0-9][0-9][0-9]-*)     BRANCH_TYPE="hotfix_standalone" ;;
    *)                                 BRANCH_TYPE="unknown" ;;
esac

# Extract feature/hotfix number
case "$BRANCH_TYPE" in
    feature|hotfix_feature)   FEATURE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -oE 'F[0-9]{4}') ;;
    hotfix_standalone)        FEATURE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -oE 'H[0-9]{4}') ;;
    *)                        FEATURE_NUMBER="" ;;
esac

# [FIX-5] FEATURE_NUMBER vazia para branch do tipo unknown tornava a mensagem
# do commit inválida (ex: "feat(): ..."). Garante fallback para string segura.
FEATURE_NUMBER="${FEATURE_NUMBER:-UNKNOWN}"

# Commit type for git
case "$BRANCH_TYPE" in
    feature)                          COMMIT_TYPE="feat" ;;
    hotfix_feature|hotfix_standalone) COMMIT_TYPE="fix" ;;
    *)                                COMMIT_TYPE="chore" ;;
esac

# ============================================
# CONTEXT MODE (default)
# ============================================

if [ "$MODE" = "context" ]; then

    echo "========================================"
    echo "CONTEXT"
    echo "========================================"
    echo "CURRENT_BRANCH=$CURRENT_BRANCH"
    echo "MAIN_BRANCH=$MAIN_BRANCH"
    echo "BRANCH_TYPE=$BRANCH_TYPE"
    echo "FEATURE_NUMBER=$FEATURE_NUMBER"
    echo ""

    # Validate branch
    if [ "$BRANCH_TYPE" = "unknown" ]; then
        echo "STATUS=ERROR"
        echo "ERROR=Unsupported branch type: $CURRENT_BRANCH"
        echo "HINT=Expected: feature/F[XXXX]-*, fix/F[XXXX]-*, or fix/H[XXXX]-*"
        exit 1
    fi

    # --- Pending Changes ---
    echo "========================================"
    echo "PENDING_CHANGES"
    echo "========================================"

    # [FIX-6] Os redirecionamentos 2>/dev/null ocultavam erros reais de git
    # (ex: não estar dentro de um repositório). Removidos; set -euo pipefail
    # agora captura falhas reais enquanto saída de erro legítima continua visível.
    MODIFIED=$(git diff --name-only)
    STAGED=$(git diff --cached --name-only)
    UNTRACKED=$(git ls-files --others --exclude-standard)

    # [FIX-7] wc -l numa string vazia ainda retorna 1 em alguns sistemas.
    # Uso de `|| true` para contagens e filtro com grep -c evitam falso positivo.
    MODIFIED_COUNT=$(printf '%s\n' "$MODIFIED" | grep -c '[^[:space:]]' || true)
    STAGED_COUNT=$(printf '%s\n' "$STAGED" | grep -c '[^[:space:]]' || true)
    UNTRACKED_COUNT=$(printf '%s\n' "$UNTRACKED" | grep -c '[^[:space:]]' || true)

    echo "MODIFIED_COUNT=$MODIFIED_COUNT"
    echo "STAGED_COUNT=$STAGED_COUNT"
    echo "UNTRACKED_COUNT=$UNTRACKED_COUNT"

    HAS_UNCOMMITTED=false
    if [ "$MODIFIED_COUNT" -gt 0 ] || [ "$STAGED_COUNT" -gt 0 ] || [ "$UNTRACKED_COUNT" -gt 0 ]; then
        HAS_UNCOMMITTED=true
    fi
    echo "HAS_UNCOMMITTED=$HAS_UNCOMMITTED"

    if [ "$HAS_UNCOMMITTED" = true ]; then
        echo ""
        echo "UNCOMMITTED_FILES=["
        [ -n "$MODIFIED" ] && printf '%s\n' "$MODIFIED" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\" (modified)"; fi; done || true
        [ -n "$STAGED" ] && printf '%s\n' "$STAGED" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\" (staged)"; fi; done || true
        [ -n "$UNTRACKED" ] && printf '%s\n' "$UNTRACKED" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\" (untracked)"; fi; done || true
        echo "]"
    fi

    # --- Branch Changes ---
    echo ""
    echo "========================================"
    echo "BRANCH_CHANGES"
    echo "========================================"

    # [FIX-8] O fallback `|| echo ""` mascarava erros reais (ex: branch remota
    # inexistente). A verificação explícita abaixo emite mensagem útil em vez
    # de silenciar o problema.
    if ! git rev-parse --verify "origin/$MAIN_BRANCH" >/dev/null 2>&1; then
        echo "STATUS=WARNING"
        echo "WARNING=Remote branch origin/$MAIN_BRANCH not found. BRANCH_CHANGES may be incomplete."
        CHANGED_FILES=""
    else
        CHANGED_FILES=$(git diff --name-only "$MAIN_BRANCH"..."$CURRENT_BRANCH")
    fi

    CHANGED_COUNT=$(printf '%s\n' "$CHANGED_FILES" | grep -c '[^[:space:]]' || true)

    echo "CHANGED_COUNT=$CHANGED_COUNT"
    echo "CHANGED_FILES=["
    printf '%s\n' "$CHANGED_FILES" | while read -r f; do if [ -n "$f" ]; then echo "  \"$f\""; fi; done || true
    echo "]"

    exit 0
fi

# ============================================
# MERGE MODE (--merge)
# ============================================

if [ "$MODE" = "merge" ]; then

    echo "========================================"
    echo "MERGE"
    echo "========================================"
    echo "BRANCH=$CURRENT_BRANCH"
    echo "TARGET=$MAIN_BRANCH"
    echo "TYPE=$BRANCH_TYPE"
    echo ""

    # [FIX-9] Impedir merge quando a branch atual JÁ É a branch principal.
    # Sem essa guarda o script faria squash-merge de main em main.
    if [ "$CURRENT_BRANCH" = "$MAIN_BRANCH" ]; then
        echo "STATUS=ERROR"
        echo "ERROR=Already on $MAIN_BRANCH. Checkout a feature/fix branch first."
        exit 1
    fi

    # [FIX-10] Impedir merge quando o tipo de branch é desconhecido.
    # O script original permitia continuar e criava commits com tipo "chore"
    # e número "UNKNOWN", o que é provavelmente indesejado.
    if [ "$BRANCH_TYPE" = "unknown" ]; then
        echo "STATUS=ERROR"
        echo "ERROR=Unsupported branch type: $CURRENT_BRANCH"
        echo "HINT=Expected: feature/F[XXXX]-*, fix/F[XXXX]-*, or fix/H[XXXX]-*"
        exit 1
    fi

    # Step 1: Commit pending changes if any
    MODIFIED=$(git diff --name-only)
    STAGED=$(git diff --cached --name-only)
    UNTRACKED=$(git ls-files --others --exclude-standard)

    HAS_UNCOMMITTED=false
    [ -n "$(printf '%s\n' "$MODIFIED" | grep '[^[:space:]]' || true)" ] && HAS_UNCOMMITTED=true
    [ -n "$(printf '%s\n' "$STAGED" | grep '[^[:space:]]' || true)" ] && HAS_UNCOMMITTED=true
    [ -n "$(printf '%s\n' "$UNTRACKED" | grep '[^[:space:]]' || true)" ] && HAS_UNCOMMITTED=true

    if [ "$HAS_UNCOMMITTED" = true ]; then
        echo "STEP=Committing pending changes..."
        git add -A
        git commit -m "$COMMIT_TYPE($FEATURE_NUMBER): finalize before merge

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
        echo "COMMIT=OK"
    else
        echo "COMMIT=SKIPPED"
    fi

    # Step 2: Push to branch
    echo "STEP=Pushing to branch..."
    # [FIX-11] O primeiro push usava 2>/dev/null, ocultando erros de autenticação
    # ou de remote inexistente. Mantido apenas o push definitivo, com saída de
    # erro visível para o operador.
    git push -u origin "$CURRENT_BRANCH"
    echo "PUSH_BRANCH=OK"

    # Step 3: Switch to main and pull
    echo "STEP=Switching to $MAIN_BRANCH..."
    # [FIX-12] Armazenar o nome da branch ANTES do checkout para poder usá-la
    # depois do Step 7, uma vez que após o checkout CURRENT_BRANCH deixaria de
    # ser válido como "branch de origem" se consultado novamente via git.
    # A variável já foi capturada antes; apenas documentamos o motivo aqui.
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    echo "CHECKOUT_MAIN=OK"

    # Step 4: Squash merge
    echo "STEP=Squash merging..."
    # [FIX-13] `git merge --squash` não gera um commit de merge; não admite
    # `--abort`. O original chamava `git merge --abort` em caso de falha, o que
    # sempre retornaria erro (não há merge em andamento), mascarando o problema
    # real. Corrigido para apenas limpar o índice com `git reset HEAD`.
    if ! git merge --squash "$CURRENT_BRANCH"; then
        echo "STATUS=ERROR"
        echo "ERROR=Merge conflict detected"
        echo "HINT=Resolve conflicts manually, then run: git add . && git commit"
        git reset HEAD 2>/dev/null || true
        exit 1
    fi
    echo "SQUASH=OK"

    # Step 5: Create merge commit
    # [FIX-14] Após `git merge --squash` pode não haver nada staged quando a
    # branch de origem não tem commits à frente da main (ex: branch já integrada).
    # Nesse caso `git commit` falharia com "nothing to commit". Verificação adicionada.
    echo "STEP=Creating merge commit..."
    if git diff --cached --quiet; then
        echo "MERGE_COMMIT=SKIPPED (nothing to commit after squash)"
    else
        git commit -m "$COMMIT_TYPE($FEATURE_NUMBER): merge from $CURRENT_BRANCH

Generated with ADD by https://brabos.ai

Co-Authored-By: ADD <noreply@brabos.ai>"
        echo "MERGE_COMMIT=OK"
    fi

    # Step 6: Push to main
    echo "STEP=Pushing to $MAIN_BRANCH..."
    git push origin "$MAIN_BRANCH"
    echo "PUSH_MAIN=OK"

    # Step 7: Cleanup checkpoint tags for this feature
    echo "STEP=Cleaning up checkpoint tags..."
    CHECKPOINT_TAGS=$(git tag -l "checkpoint/${FEATURE_NUMBER}-*" 2>/dev/null || true)
    if [ -n "$CHECKPOINT_TAGS" ]; then
        echo "$CHECKPOINT_TAGS" | while read -r tag; do
            git tag -d "$tag" 2>/dev/null || true
            git push origin --delete "$tag" 2>/dev/null || true
        done
        CHECKPOINT_COUNT=$(echo "$CHECKPOINT_TAGS" | grep -c '[^[:space:]]' || true)
        echo "CHECKPOINT_CLEANUP=${CHECKPOINT_COUNT} tags removed"
    else
        echo "CHECKPOINT_CLEANUP=SKIPPED (no checkpoint tags found)"
    fi

    # Step 8: Cleanup branches
    echo "STEP=Cleaning up branches..."
    git branch -d "$CURRENT_BRANCH" 2>/dev/null || echo "LOCAL_DELETE=SKIPPED"
    git push origin --delete "$CURRENT_BRANCH" 2>/dev/null || echo "REMOTE_DELETE=SKIPPED"
    echo "CLEANUP=OK"

    # Done
    echo ""
    echo "========================================"
    echo "DONE"
    echo "========================================"
    echo "STATUS=SUCCESS"
    echo "MERGED_TO=$MAIN_BRANCH"
    echo "CURRENT_BRANCH=$MAIN_BRANCH"

    exit 0
fi

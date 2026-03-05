#!/bin/bash

# =============================================================================
# Feature Status (v3 - Token Optimized)
# Output compacto para agentes de desenvolvimento
# =============================================================================

# P1 - FIX: adicionar -u (variaveis nao definidas) e pipefail (falhas em pipes)
set -euo pipefail

# =============================================================================
# GUARDS: dependencias obrigatorias e repositorio git
# =============================================================================

# P11 - FIX: verificar dependencia git
if ! command -v git &>/dev/null; then
    echo "ERROR:git not found in PATH" >&2
    exit 1
fi

# P2 - FIX: verificar que estamos dentro de um repositorio git
if ! git rev-parse --git-dir &>/dev/null; then
    echo "ERROR:not a git repository" >&2
    exit 1
fi

# =============================================================================
# DETECTION
# =============================================================================

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

# P2 - FIX: usar string vazia como sentinela em vez de "unknown" para evitar
#            colisoes com nomes de branch reais; normalizar verificacoes abaixo
if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="(detached)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# P3 - FIX: verificar existencia e permissao de execucao do script auxiliar
if [ ! -f "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "ERROR:get-main-branch.sh not found at $SCRIPT_DIR/get-main-branch.sh" >&2
    exit 1
fi
if [ ! -x "$SCRIPT_DIR/get-main-branch.sh" ]; then
    echo "ERROR:get-main-branch.sh is not executable" >&2
    exit 1
fi
MAIN_BRANCH=$("$SCRIPT_DIR/get-main-branch.sh")

# Branch type
BRANCH_TYPE="other"
[[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]] && BRANCH_TYPE="main"
[[ "$CURRENT_BRANCH" == feature/* ]] && BRANCH_TYPE="feature"
[[ "$CURRENT_BRANCH" == fix/* ]] && BRANCH_TYPE="fix"
[[ "$CURRENT_BRANCH" == refactor/* ]] && BRANCH_TYPE="refactor"
[[ "$CURRENT_BRANCH" == hotfix/* ]] && BRANCH_TYPE="hotfix"
[[ "$CURRENT_BRANCH" == docs/* ]] && BRANCH_TYPE="docs"

# Feature ID from branch
FEATURE_ID=$(echo "$CURRENT_BRANCH" | sed -n 's|.*/\(F[0-9]\{4\}-[^/]*\)$|\1|p')
FEATURE_DIR="docs/features/${FEATURE_ID}"

# P10 - FIX: inicializar BEHIND e AHEAD no escopo global para evitar "unbound variable"
#             quando o bloco GIT STATUS nao e executado
AHEAD="0"
BEHIND="0"

# P12 - FIX: inicializar PHASE no escopo global para evitar uso nao definido
#             nas RECOMMENDATIONS quando FEATURE_DIR nao existe
PHASE="none"

# =============================================================================
# OUTPUT: BRANCH
# =============================================================================

echo "BRANCH:$CURRENT_BRANCH TYPE:$BRANCH_TYPE MAIN:$MAIN_BRANCH"

# =============================================================================
# OUTPUT: OWNER (technical level for communication)
# =============================================================================

OWNER_FILE="docs/owner.md"
if [ -f "$OWNER_FILE" ]; then
    OWNER_NAME=$(grep -i "^Nome:" "$OWNER_FILE" 2>/dev/null | sed 's/^Nome:[[:space:]]*//' | head -1 || echo "unknown")
    OWNER_NIVEL=$(grep -i "^Nivel:" "$OWNER_FILE" 2>/dev/null | sed 's/^Nivel:[[:space:]]*//' | head -1 || echo "intermediario")
    OWNER_IDIOMA=$(grep -i "^Idioma:" "$OWNER_FILE" 2>/dev/null | sed 's/^Idioma:[[:space:]]*//' | head -1 || echo "en-us")
    [ -z "$OWNER_NAME" ] && OWNER_NAME="unknown"
    [ -z "$OWNER_NIVEL" ] && OWNER_NIVEL="intermediario"
    [ -z "$OWNER_IDIOMA" ] && OWNER_IDIOMA="en-us"
    echo "OWNER:${OWNER_NAME}|${OWNER_NIVEL}|${OWNER_IDIOMA}"
fi

# =============================================================================
# OUTPUT: FEATURE (only if on feature branch)
# =============================================================================

if [ -n "$FEATURE_ID" ]; then
    # Detect phase based on docs
    DOCS_LIST=""

    if [ -d "$FEATURE_DIR" ]; then
        # Collect existing docs
        for doc in about.md discovery.md design.md plan.md changelog.md; do
            [ -f "$FEATURE_DIR/$doc" ] && DOCS_LIST="${DOCS_LIST}${doc},"
        done
        DOCS_LIST="${DOCS_LIST%,}"  # Remove trailing comma

        # Determine phase
        if [ -f "$FEATURE_DIR/changelog.md" ]; then
            PHASE="done"
        elif [ -f "$FEATURE_DIR/plan.md" ]; then
            PHASE="planned"
        elif [ -f "$FEATURE_DIR/design.md" ]; then
            PHASE="designed"
        elif [ -f "$FEATURE_DIR/discovery.md" ]; then
            if grep -q "^## Summary for Planning" "$FEATURE_DIR/discovery.md" 2>/dev/null; then
                PHASE="discovered"
            else
                PHASE="discovering"
            fi
        elif [ -f "$FEATURE_DIR/about.md" ]; then
            if grep -q "\[Clear description" "$FEATURE_DIR/about.md" 2>/dev/null; then
                PHASE="created"
            else
                PHASE="documented"
            fi
        else
            PHASE="created"
        fi

        echo "FEATURE:$FEATURE_ID PHASE:$PHASE DIR:$FEATURE_DIR"
        [ -n "$DOCS_LIST" ] && echo "DOCS:$DOCS_LIST" || true

        # Iterations context (previous /add-dev sessions) — JSONL format
        ITERATIONS_FILE="$FEATURE_DIR/iterations.jsonl"
        if [ -f "$ITERATIONS_FILE" ]; then
            # Count iterations (each line is a JSON entry)
            ITER_COUNT=$(wc -l < "$ITERATIONS_FILE" 2>/dev/null | tr -d ' \r\n')
            if [ "${ITER_COUNT:-0}" -gt 0 ]; then
                # Last 3 JSONL entries (full lines for agents to parse)
                LAST_ITERS=$(tail -3 "$ITERATIONS_FILE" 2>/dev/null | tr '\n' '§' | sed 's/§$//')

                echo "ITERATIONS:$ITER_COUNT"
                echo "LAST_ITERS:$LAST_ITERS"
                echo "ITERATIONS_FILE:$ITERATIONS_FILE"
            fi
        fi

        # Extract summaries from docs (JSON after ## Summary)
        if [ -f "$FEATURE_DIR/about.md" ]; then
            ABOUT_SUMMARY=$(grep -A1 "^## Summary" "$FEATURE_DIR/about.md" 2>/dev/null | grep "^{" | head -1 || echo "")
            [ -n "$ABOUT_SUMMARY" ] && echo "ABOUT_SUMMARY:$ABOUT_SUMMARY" || true
        fi

        if [ -f "$FEATURE_DIR/discovery.md" ]; then
            DISC_SUMMARY=$(grep -A1 "^## Summary" "$FEATURE_DIR/discovery.md" 2>/dev/null | grep "^{" | head -1 || echo "")
            [ -n "$DISC_SUMMARY" ] && echo "DISC_SUMMARY:$DISC_SUMMARY" || true
        fi

        # Extract last update from Updates section
        if [ -f "$FEATURE_DIR/about.md" ]; then
            LAST_UPDATE=$(grep -A1 "^## Updates" "$FEATURE_DIR/about.md" 2>/dev/null | grep "^\[{" | head -1 | sed 's/^\[//;s/\]$//' | awk -F'},{' '{print "{" $NF}' || echo "")
            [ -n "$LAST_UPDATE" ] && [ "$LAST_UPDATE" != "{" ] && echo "LAST_UPDATE:$LAST_UPDATE" || true
        fi
        # =============================================================================
        # OUTPUT: FEATURES (se plan.md tem seção ## Features - indica Epic)
        # =============================================================================

        PLAN_FILE="$FEATURE_DIR/plan.md"
        if [ -f "$PLAN_FILE" ]; then
            # Detect if this is an Epic (has ## Epic: section or ## Features section)
            EPIC_NAME=""
            IS_EPIC="false"

            # Check for Epic header: ## Epic: [Name]
            EPIC_LINE=$(grep -E '^## Epic:' "$PLAN_FILE" 2>/dev/null | head -1 || true)
            if [ -n "$EPIC_LINE" ]; then
                IS_EPIC="true"
                EPIC_NAME=$(echo "$EPIC_LINE" | sed 's/^## Epic:[[:space:]]*//' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
            fi

            # Count total features in plan.md (### Feature N: patterns)
            TOTAL_FEATURES=$(grep -cE '^### Feature [0-9]+:' "$PLAN_FILE" 2>/dev/null || true)

            if [ "$TOTAL_FEATURES" -gt 0 ]; then
                IS_EPIC="true"

                # Count completed features in iterations.jsonl (entries with "type":"add" and slug containing "feature-N")
                COMPLETED_FEATURES=0
                if [ -f "$ITERATIONS_FILE" ]; then
                    # Legacy: check for [FEATURE N COMPLETE] markers (backwards compat)
                    COMPLETED_FEATURES=$(grep -cE '"slug":"feature-[0-9]+-complete"' "$ITERATIONS_FILE" 2>/dev/null || true)
                    # Fallback: count distinct feature slugs with type=add
                    if [ "${COMPLETED_FEATURES:-0}" -eq 0 ]; then
                        COMPLETED_FEATURES=$(grep -oE '"slug":"feature-[0-9]+' "$ITERATIONS_FILE" 2>/dev/null | sort -u | wc -l | tr -d ' \r\n' || true)
                    fi
                fi

                NEXT_FEATURE=$((COMPLETED_FEATURES + 1))

                # Output Epic info
                [ -n "$EPIC_NAME" ] && echo "EPIC:$EPIC_NAME" || true

                # Check if all features complete
                if [ "$NEXT_FEATURE" -gt "$TOTAL_FEATURES" ]; then
                    echo "FEATURES:$COMPLETED_FEATURES/$TOTAL_FEATURES STATUS:all_complete"
                else
                    echo "FEATURES:$COMPLETED_FEATURES/$TOTAL_FEATURES NEXT:$NEXT_FEATURE"

                    # Extract next feature name from plan.md
                    NEXT_FEATURE_NAME=$(grep -E "^### Feature ${NEXT_FEATURE}:" "$PLAN_FILE" 2>/dev/null | sed 's/^### Feature [0-9]*:[[:space:]]*//' | head -1 || true)
                    [ -n "$NEXT_FEATURE_NAME" ] && echo "NEXT_FEATURE_NAME:$NEXT_FEATURE_NAME" || true
                fi
            fi
        fi

        # =============================================================================
        # OUTPUT: EPIC.MD (PRD0032 - new epic structure)
        # =============================================================================

        EPIC_MD_FILE="$FEATURE_DIR/epic.md"
        if [ -f "$EPIC_MD_FILE" ]; then
            echo "HAS_EPIC:true"

            # Count total subfeatures (rows in epic.md table: | SF01 | ...)
            TOTAL_SF=$(grep -cE '^\| SF[0-9]+' "$EPIC_MD_FILE" 2>/dev/null || true)

            # Count done subfeatures
            DONE_SF=$(grep -E '^\| SF[0-9]+' "$EPIC_MD_FILE" 2>/dev/null | grep -c '\| done \|' || true)

            echo "EPIC_PROGRESS:$DONE_SF/$TOTAL_SF"

            # Find current SF: in_progress first, then first pending
            CURRENT_SF=$(grep -E '^\| SF[0-9]+' "$EPIC_MD_FILE" 2>/dev/null | \
                grep '\| in_progress \|' | \
                grep -oE 'SF[0-9]+' | head -1 || echo "")

            if [ -z "$CURRENT_SF" ]; then
                CURRENT_SF=$(grep -E '^\| SF[0-9]+' "$EPIC_MD_FILE" 2>/dev/null | \
                    grep '\| pending \|' | \
                    grep -oE 'SF[0-9]+' | head -1 || echo "")
            fi

            [ -n "$CURRENT_SF" ] && echo "EPIC_CURRENT_SF:$CURRENT_SF" || true

            # tasks.md for current subfeature
            if [ -n "$CURRENT_SF" ]; then
                # P5 - FIX: usar aspas para proteger o glob e evitar word splitting
                SF_DIR_GLOB="$FEATURE_DIR/subfeatures/${CURRENT_SF}-*"
                SF_DIR=$(ls -d "$SF_DIR_GLOB" 2>/dev/null | head -1 || echo "")
                if [ -n "$SF_DIR" ] && [ -f "$SF_DIR/tasks.md" ]; then
                    echo "HAS_TASKS:true"
                    TASKS_FILE="$SF_DIR/tasks.md"
                    TOTAL_TASKS=$(grep -cE '^\| [0-9]+\.[0-9]+' "$TASKS_FILE" 2>/dev/null || true)
                    DONE_TASKS=$(grep -E '^\| [0-9]+\.[0-9]+' "$TASKS_FILE" 2>/dev/null | grep -c '✅' || true)
                    echo "TASKS_PROGRESS:$DONE_TASKS/$TOTAL_TASKS"
                    echo "TASKS_FILE:$TASKS_FILE"
                fi
            fi
        else
            # Check for tasks.md in feature dir (non-epic)
            TASKS_FILE_PLAIN="$FEATURE_DIR/tasks.md"
            if [ -f "$TASKS_FILE_PLAIN" ]; then
                echo "HAS_TASKS:true"
                TOTAL_TASKS=$(grep -cE '^\| [0-9]+\.[0-9]+' "$TASKS_FILE_PLAIN" 2>/dev/null || true)
                DONE_TASKS=$(grep -E '^\| [0-9]+\.[0-9]+' "$TASKS_FILE_PLAIN" 2>/dev/null | grep -c '✅' || true)
                echo "TASKS_PROGRESS:$DONE_TASKS/$TOTAL_TASKS"
                echo "TASKS_FILE:$TASKS_FILE_PLAIN"
            fi
        fi

        # Last git checkpoint tag for this feature (checkpoint/ prefix)
        LAST_CHECKPOINT=$(git tag -l "checkpoint/${FEATURE_ID}-*-done" "checkpoint/${FEATURE_ID}-done" 2>/dev/null | sort -r | head -1)
        [ -n "$LAST_CHECKPOINT" ] && echo "LAST_CHECKPOINT:$LAST_CHECKPOINT" || true

    else
        echo "FEATURE:$FEATURE_ID PHASE:none DIR:$FEATURE_DIR (not found)"
    fi
fi

# =============================================================================
# OUTPUT: RECENT_CHANGELOGS (últimas 5 features finalizadas - contexto cross-feature)
# =============================================================================

FEATURES_DIR="docs/features"
if [ -d "$FEATURES_DIR" ]; then
    # P6 - FIX: substituir xargs ls -t por find com -printf para ordenacao global
    #            correta por mtime, evitando problemas com multiplos diretorios
    CHANGELOGS=$(find "$FEATURES_DIR" -name "changelog.md" -type f 2>/dev/null \
        -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -5 | awk '{print $2}' || echo "")

    if [ -n "$CHANGELOGS" ]; then
        echo "RECENT_CHANGELOGS:"
        # P7 - NOTA: o loop while em subshell e intencional aqui (apenas echo),
        #            mas usamos process substitution para manter no mesmo shell
        while IFS= read -r cl; do
            if [ -f "$cl" ]; then
                # Extract feature ID from path
                FEAT=$(echo "$cl" | grep -oE 'F[0-9]{4}-[^/]+' | head -1)

                # Skip if it's the current feature (avoid redundancy)
                if [ "$FEAT" != "$FEATURE_ID" ]; then
                    # Extract summary: content after "## Resumo" or "## Summary"
                    # Skip blockquotes (>) and empty lines
                    SUMMARY=$(awk '
                        /^## Resumo/ || /^## Summary/ { found=1; next }
                        found && /^[^#>\[]/ && NF > 0 { gsub(/^[[:space:]]+|[[:space:]]+$/, ""); print; exit }
                    ' "$cl" 2>/dev/null | head -c 120)

                    # Fallback: get title from first # line (without date/branch metadata)
                    if [ -z "$SUMMARY" ]; then
                        SUMMARY=$(grep -m1 "^# " "$cl" 2>/dev/null | sed 's/^# //' | head -c 80)
                    fi

                    if [ -n "$SUMMARY" ]; then echo "  $FEAT|$SUMMARY"; fi
                fi
            fi
        done <<< "$CHANGELOGS"
        echo "CHANGELOGS_PATH:docs/features/{F*}/changelog.md"
    fi
fi

# =============================================================================
# OUTPUT: GIT STATUS (only if has changes)
# =============================================================================

MODIFIED=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' \r\n')
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' \r\n')
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' \r\n')

if [ "${MODIFIED:-0}" -gt 0 ] || [ "${STAGED:-0}" -gt 0 ] || [ "${UNTRACKED:-0}" -gt 0 ]; then
    GIT_LINE="GIT:M$MODIFIED S$STAGED U$UNTRACKED"

    # P9 - FIX: verificar se o branch remoto existe antes de calcular ahead/behind
    #            para evitar falha silenciosa ou abort com set -e
    if [ "$CURRENT_BRANCH" != "(detached)" ]; then
        if git rev-parse --verify "origin/$CURRENT_BRANCH" &>/dev/null; then
            AHEAD=$(git rev-list --count "origin/$CURRENT_BRANCH..$CURRENT_BRANCH" 2>/dev/null || echo "0")
            BEHIND=$(git rev-list --count "$CURRENT_BRANCH..origin/$CURRENT_BRANCH" 2>/dev/null || echo "0")
        fi
        [ "$AHEAD" != "0" ] && GIT_LINE="$GIT_LINE AHEAD:$AHEAD" || true
        [ "$BEHIND" != "0" ] && GIT_LINE="$GIT_LINE BEHIND:$BEHIND" || true
    fi

    echo "$GIT_LINE"
fi

# =============================================================================
# OUTPUT: FILES CHANGED (glob-like format for token efficiency)
# =============================================================================

if [ "$BRANCH_TYPE" != "main" ]; then
    MERGE_BASE=$(git merge-base "$CURRENT_BRANCH" "$MAIN_BRANCH" 2>/dev/null || echo "")

    if [ -n "$MERGE_BASE" ]; then
        # Collect all changed files (pipe inside $() to capture result)
        ALL_FILES=$({
            git diff --name-only "$MERGE_BASE"..HEAD 2>/dev/null
            git diff --cached --name-only 2>/dev/null
            git diff --name-only 2>/dev/null
            git ls-files --others --exclude-standard 2>/dev/null
        } | sort -u | grep -v "^$" || true)

        if [ -n "$ALL_FILES" ]; then
            TOTAL=$(echo "$ALL_FILES" | wc -l | tr -d ' \r\n')

            # Generate glob-like output: dir/{file1,file2,+N}.ext
            GLOB_OUTPUT=$(echo "$ALL_FILES" | awk '
            {
                # Split path into dir and filename
                n = split($0, parts, "/")
                if (n > 1) {
                    dir = ""
                    for (i = 1; i < n; i++) dir = dir (dir ? "/" : "") parts[i]
                    file = parts[n]
                } else {
                    dir = "."
                    file = $0
                }

                # Extract extension
                if (match(file, /\.[^.]+$/)) {
                    ext = substr(file, RSTART)
                    base = substr(file, 1, RSTART - 1)
                } else {
                    ext = ""
                    base = file
                }

                # Group by dir+ext
                key = dir "|" ext
                if (!(key in groups)) {
                    groups[key] = base
                    counts[key] = 1
                    dirs[key] = dir
                    exts[key] = ext
                    order[++order_count] = key
                } else {
                    counts[key]++
                    # Keep max 4 names
                    if (counts[key] <= 4) {
                        groups[key] = groups[key] "," base
                    }
                }
            }
            END {
                result = ""
                for (i = 1; i <= order_count; i++) {
                    key = order[i]
                    dir = dirs[key]
                    ext = exts[key]
                    files = groups[key]
                    count = counts[key]

                    # Format: dir/{files,+N}.ext or dir/file.ext
                    if (count == 1) {
                        entry = dir "/" files ext
                    } else {
                        extra = (count > 4) ? ",+" (count - 4) : ""
                        entry = dir "/{" files extra "}" ext
                    }

                    result = result (result ? "|" : "") entry
                }
                print result
            }')

            echo "FILES:$TOTAL"
            echo "CHANGED:$GLOB_OUTPUT"
        fi
    fi
fi

# =============================================================================
# OUTPUT: SKILLS (available in .codeadd/skills/)
# =============================================================================

SKILLS_DIR=".claude/skills"
if [ -d "$SKILLS_DIR" ]; then
    # List available skills (directories with SKILL.md)
    SKILL_LIST=$(find "$SKILLS_DIR" -maxdepth 2 -name "SKILL.md" 2>/dev/null | \
        sed "s|$SKILLS_DIR/||;s|/SKILL.md||" | \
        sort | \
        tr '\n' ',' | \
        sed 's/,$//')

    if [ -n "$SKILL_LIST" ]; then
        SKILL_COUNT=$(echo "$SKILL_LIST" | tr ',' '\n' | wc -l | tr -d ' \r\n')
        echo "SKILLS:$SKILL_COUNT"
        echo "SKILLS_PATH:.codeadd/skills/{$SKILL_LIST}/SKILL.md"
    fi
fi

# =============================================================================
# OUTPUT: PROJECT PATTERNS (from .codeadd/project/*.md)
# =============================================================================

PROJECT_DIR=".codeadd/project"
if [ -d "$PROJECT_DIR" ]; then
    # List all pattern files (SERVER.md, ADMIN.md, CLI.md, DATABASE.md, etc)
    PROJECT_FILES=$(find "$PROJECT_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | \
        xargs -r -I {} basename {} .md 2>/dev/null | \
        sort | \
        tr '\n' ',' | \
        sed 's/,$//')

    if [ -n "$PROJECT_FILES" ]; then
        PROJECT_COUNT=$(echo "$PROJECT_FILES" | tr ',' '\n' | wc -l | tr -d ' \r\n')
        echo "PROJECT_PATTERNS:$PROJECT_COUNT"
        echo "PROJECT_DOCS:.codeadd/project/{$PROJECT_FILES}.md"
    fi
else
    echo "PROJECT_PATTERNS:0"
    echo "PROJECT_HINT:Run /architecture-analyzer to generate project patterns"
fi

# =============================================================================
# OUTPUT: RECOMMENDATIONS (smart, only if actionable)
# =============================================================================

RECS=""

# Based on state
if [ "$BRANCH_TYPE" = "main" ]; then
    RECS="/feature to start"
elif [ -n "$FEATURE_ID" ]; then
    if [ ! -d "$FEATURE_DIR" ]; then
        RECS="/feature to setup"
    elif [ "$PHASE" = "created" ] || [ "$PHASE" = "documented" ]; then
        RECS="/feature to complete discovery"
    elif [ "$PHASE" = "discovered" ] || [ "$PHASE" = "designed" ]; then
        RECS="/plan to create plan"
    elif [ "$PHASE" = "planned" ]; then
        RECS="/add-dev to implement"
    elif [ "$PHASE" = "done" ]; then
        RECS="/review or /add-done"
    fi
fi

# Git warnings
# P10 - BEHIND ja inicializado com "0" no topo; seguro usar aqui com set -u
[ "${BEHIND}" != "0" ] && RECS="${RECS:+$RECS | }git pull (behind)"

[ -n "$RECS" ] && echo "REC:$RECS" || true

# Ensure clean exit
exit 0

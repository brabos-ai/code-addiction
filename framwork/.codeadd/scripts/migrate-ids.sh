#!/bin/bash
# ============================================
# MIGRATE-IDS - Migrate old ID format to new
# Old: docs/features/F[NNNN]-slug/ or docs/hotfixes/H[NNNN]-slug/
# New: docs/features/[NNNN]F-slug/ (all types unified under docs/features/)
# ============================================
# Usage:
#   bash migrate-ids.sh              # dry-run (default)
#   bash migrate-ids.sh --apply      # execute migration
#   bash migrate-ids.sh --validate   # verify post-migration
# ============================================

set -euo pipefail

MODE="${1:---dry-run}"
DOCS_BASE="docs"
TARGET_DIR="docs/features"
ERRORS=0
CHANGES=0

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    GREEN='' YELLOW='' RED='' BLUE='' NC=''
fi

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
log_move()  { echo -e "  ${YELLOW}$1${NC} -> ${GREEN}$2${NC}"; CHANGES=$((CHANGES + 1)); }

# ============================================
# PHASE: Collect old-format directories
# ============================================
# Patterns:
#   docs/features/F[NNNN]-*   -> docs/features/[NNNN]F-*
#   docs/hotfixes/H[NNNN]-*   -> docs/features/[NNNN]H-*
#   docs/refactors/R[NNNN]-*  -> docs/features/[NNNN]R-*
#   docs/chores/C[NNNN]-*     -> docs/features/[NNNN]C-*

collect_old_dirs() {
    local dirs=()

    # Search in known subdirectories for old format: [A-Z][0-9]{4}-*
    for subdir in features hotfixes refactors chores docs; do
        if [ -d "$DOCS_BASE/$subdir" ]; then
            while IFS= read -r dir; do
                [ -n "$dir" ] && dirs+=("$dir")
            done < <(find "$DOCS_BASE/$subdir" -maxdepth 1 -type d -regextype posix-extended -regex ".*/[A-Z][0-9]{4}-.*" 2>/dev/null || true)
        fi
    done

    # Also check docs/ root for old format
    while IFS= read -r dir; do
        [ -n "$dir" ] && dirs+=("$dir")
    done < <(find "$DOCS_BASE" -maxdepth 1 -type d -regextype posix-extended -regex ".*/[A-Z][0-9]{4}-.*" 2>/dev/null || true)

    printf '%s\n' "${dirs[@]}" 2>/dev/null | sort -u || true
}

# Convert old path to new path
# e.g. docs/features/F0001-auth -> docs/features/0001F-auth
#      docs/hotfixes/H0002-crash -> docs/features/0002H-crash
convert_path() {
    local old_path="$1"
    local dirname
    dirname=$(basename "$old_path")

    # Extract letter and number: F0001 -> 0001F
    local letter="${dirname:0:1}"
    local number="${dirname:1:4}"
    local slug="${dirname:5}"

    echo "$TARGET_DIR/${number}${letter}${slug}"
}

# ============================================
# Update internal references in files
# ============================================
update_references() {
    local old_name="$1"  # e.g. F0001-auth
    local new_name="$2"  # e.g. 0001F-auth

    # Find files that reference old name
    local files
    files=$(grep -rl "$old_name" "$DOCS_BASE" 2>/dev/null || true)

    if [ -n "$files" ]; then
        while IFS= read -r file; do
            if [ "$MODE" = "--apply" ]; then
                sed -i "s|$old_name|$new_name|g" "$file"
                log_info "  Updated references in $file"
            else
                log_info "  Would update references in $file"
            fi
        done <<< "$files"
    fi
}

# ============================================
# DRY-RUN
# ============================================
do_dry_run() {
    echo ""
    log_info "=== DRY-RUN: Showing what would change ==="
    echo ""

    if [ ! -d "$DOCS_BASE" ]; then
        log_error "docs/ directory not found. Run from project root."
        exit 1
    fi

    local old_dirs
    old_dirs=$(collect_old_dirs)

    if [ -z "$old_dirs" ]; then
        log_ok "No old-format directories found. Nothing to migrate."
        exit 0
    fi

    log_info "Directories to rename:"
    while IFS= read -r old_dir; do
        local new_dir
        new_dir=$(convert_path "$old_dir")
        log_move "$old_dir" "$new_dir"

        local old_name new_name
        old_name=$(basename "$old_dir")
        new_name=$(basename "$new_dir")
        update_references "$old_name" "$new_name"

        # Check for conflicts
        if [ -d "$new_dir" ]; then
            log_error "CONFLICT: $new_dir already exists!"
        fi
    done <<< "$old_dirs"

    echo ""
    log_info "Summary: $CHANGES directories would be renamed, $ERRORS errors"
    if [ $ERRORS -gt 0 ]; then
        log_error "Fix conflicts before running --apply"
    else
        log_ok "Safe to run: bash migrate-ids.sh --apply"
    fi
}

# ============================================
# APPLY
# ============================================
do_apply() {
    echo ""
    log_info "=== APPLYING MIGRATION ==="
    echo ""

    if [ ! -d "$DOCS_BASE" ]; then
        log_error "docs/ directory not found. Run from project root."
        exit 1
    fi

    local old_dirs
    old_dirs=$(collect_old_dirs)

    if [ -z "$old_dirs" ]; then
        log_ok "No old-format directories found. Nothing to migrate."
        exit 0
    fi

    # Ensure target directory exists
    mkdir -p "$TARGET_DIR"

    while IFS= read -r old_dir; do
        local new_dir
        new_dir=$(convert_path "$old_dir")

        if [ -d "$new_dir" ]; then
            log_error "CONFLICT: $new_dir already exists! Skipping $old_dir"
            continue
        fi

        # Rename
        mv "$old_dir" "$new_dir"
        log_ok "Renamed: $(basename "$old_dir") -> $(basename "$new_dir")"

        # Update references
        local old_name new_name
        old_name=$(basename "$old_dir")
        new_name=$(basename "$new_dir")
        update_references "$old_name" "$new_name"

        CHANGES=$((CHANGES + 1))
    done <<< "$old_dirs"

    # Clean up empty old directories
    for subdir in hotfixes refactors chores; do
        if [ -d "$DOCS_BASE/$subdir" ]; then
            local remaining
            remaining=$(find "$DOCS_BASE/$subdir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
            if [ "$remaining" -eq 0 ]; then
                rmdir "$DOCS_BASE/$subdir" 2>/dev/null && log_ok "Removed empty directory: $DOCS_BASE/$subdir" || true
            else
                log_warn "$DOCS_BASE/$subdir still has $remaining items, not removing"
            fi
        fi
    done

    echo ""
    log_info "Migration complete: $CHANGES directories renamed, $ERRORS errors"

    if [ $ERRORS -eq 0 ]; then
        log_ok "Run: bash migrate-ids.sh --validate"
    fi
}

# ============================================
# VALIDATE
# ============================================
do_validate() {
    echo ""
    log_info "=== VALIDATING MIGRATION ==="
    echo ""

    if [ ! -d "$TARGET_DIR" ]; then
        log_error "$TARGET_DIR not found"
        exit 1
    fi

    # Check: no old-format dirs remain
    local old_remaining
    old_remaining=$(collect_old_dirs)

    if [ -n "$old_remaining" ]; then
        log_error "Old-format directories still exist:"
        echo "$old_remaining" | while IFS= read -r d; do echo "  $d"; done
    else
        log_ok "No old-format directories remain"
    fi

    # Check: new-format dirs exist
    local new_dirs
    new_dirs=$(find "$TARGET_DIR" -maxdepth 1 -type d -regextype posix-extended -regex ".*/[0-9]{4}[A-Z]-.*" 2>/dev/null | sort || true)

    if [ -n "$new_dirs" ]; then
        log_ok "New-format directories found:"
        while IFS= read -r d; do
            echo "  $(basename "$d")"
        done <<< "$new_dirs"
    else
        log_warn "No new-format directories found in $TARGET_DIR"
    fi

    # Check: no dangling references to old format in docs
    local old_refs
    old_refs=$(grep -rn '[^0-9][FHRCDE][0-9]\{4\}-' "$DOCS_BASE" --include="*.md" --include="*.jsonl" 2>/dev/null | \
        grep -vE '(PRD[0-9]|prd/)' || true)

    if [ -n "$old_refs" ]; then
        log_warn "Possible old-format references found:"
        echo "$old_refs" | head -20
    else
        log_ok "No old-format references found in docs"
    fi

    # Check: no empty type-specific directories
    for subdir in hotfixes refactors chores; do
        if [ -d "$DOCS_BASE/$subdir" ]; then
            log_warn "$DOCS_BASE/$subdir still exists (can be removed if empty)"
        fi
    done

    echo ""
    if [ $ERRORS -eq 0 ]; then
        log_ok "Validation passed!"
    else
        log_error "Validation found $ERRORS issues"
    fi
}

# ============================================
# MAIN
# ============================================

case "$MODE" in
    --dry-run)  do_dry_run ;;
    --apply)    do_apply ;;
    --validate) do_validate ;;
    *)
        echo "Usage: bash migrate-ids.sh [--dry-run|--apply|--validate]"
        echo ""
        echo "  --dry-run   (default) Show what would change"
        echo "  --apply     Execute the migration"
        echo "  --validate  Verify post-migration integrity"
        exit 1
        ;;
esac

exit $ERRORS

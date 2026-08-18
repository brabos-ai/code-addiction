#!/bin/bash
# ============================================
# QA EVIDENCE LIFECYCLE
# Allocates, inspects, validates, and promotes QA run evidence.
# ============================================
# Usage: bash .codeadd/scripts/qa-evidence.sh <operation> <path> [baseline|run-id]
# Dependencies: bash 3.2+, coreutils, diffutils, grep, sed, awk
# ============================================

set -euo pipefail

usage() {
    echo "Usage: qa-evidence.sh scopes|working-baseline <feature-dir>"
    echo "       qa-evidence.sh next <scope-dir>"
    echo "       qa-evidence.sh previous <scope-dir> <run-NNN>"
    echo "       qa-evidence.sh validate|promote <feature-dir> <baseline>"
    echo "       qa-evidence.sh ensure-ignore <project-root>"
    exit 2
}

fail() {
    echo "STATUS=ERROR"
    echo "ERROR=$1"
    exit 1
}

resolve_dir() {
    (cd "$1" 2>/dev/null && pwd -P) || return 1
}

require_dir() {
    local resolved
    resolved=$(resolve_dir "$1") || fail "Directory not found: $1"
    printf '%s\n' "$resolved"
}

is_within() {
    case "$1" in
        "$2"|"$2"/*) return 0 ;;
        *) return 1 ;;
    esac
}

require_contained_dir() {
    local path=$1
    local parent=$2
    local label=$3
    local resolved
    [ ! -L "$path" ] || fail "$label must not be a symlink: $path"
    resolved=$(require_dir "$path")
    is_within "$resolved" "$parent" || fail "$label escapes its parent: $resolved"
    printf '%s\n' "$resolved"
}

reject_tree_symlinks() {
    local root=$1
    local link
    link=$(find "$root" -type l -print -quit)
    [ -z "$link" ] || fail "QA evidence contains a symlink: $link"
}

scope_key() {
    local scope_name
    scope_name=$(basename "$1")
    if [[ "$scope_name" =~ ^(SF[0-9][0-9])- ]]; then
        printf '%s\n' "${BASH_REMATCH[1]}"
    else
        printf '%s\n' "feature"
    fi
}

list_scopes() {
    local feature_dir=$1
    local subfeature key resolved
    local seen='|feature|'
    local rows="feature|$feature_dir"
    shopt -s nullglob
    for subfeature in "$feature_dir"/subfeatures/SF[0-9][0-9]-*; do
        [ -d "$subfeature" ] || continue
        key=$(scope_key "$subfeature")
        case "$seen" in
            *"|$key|"*) fail "Duplicate QA scope key under feature: $key" ;;
        esac
        seen="$seen$key|"
        resolved=$(require_contained_dir "$subfeature" "$feature_dir" "QA scope")
        rows="$rows
$key|$resolved"
    done
    shopt -u nullglob
    printf '%s\n' "$rows"
}

run_dirs() {
    local scope_dir=$1
    local store=$2
    local root="$scope_dir/_tests"
    [ "$store" = "final" ] && root="$root/final"
    local dir
    [ ! -L "$scope_dir/_tests" ] || fail "QA tests directory must not be a symlink: $scope_dir/_tests"
    [ ! -L "$root" ] || fail "QA evidence store must not be a symlink: $root"
    shopt -s nullglob
    for dir in "$root"/run-[0-9][0-9][0-9]; do
        [ -d "$dir" ] || continue
        [ ! -L "$dir" ] || fail "QA run directory must not be a symlink: $dir"
        printf '%s\n' "$dir"
    done
    shopt -u nullglob
}

highest_id() {
    local scope_dir=$1
    local stores=$2
    local max=0
    local dir name value store dir_rows
    for store in $stores; do
        dir_rows=$(run_dirs "$scope_dir" "$store") || {
            printf '%s\n' "$dir_rows"
            return 1
        }
        while IFS= read -r dir; do
            [ -n "$dir" ] || continue
            name=$(basename "$dir")
            value=$((10#${name#run-}))
            [ "$value" -gt "$max" ] && max=$value
        done <<< "$dir_rows"
    done
    printf '%03d\n' "$max"
}

working_baseline() {
    local feature_dir=$1
    local key scope id id_output scope_rows
    local entries=()
    scope_rows=$(list_scopes "$feature_dir") || {
        printf '%s\n' "$scope_rows"
        return 1
    }
    while IFS='|' read -r key scope; do
        id_output=$(highest_id "$scope" "working") || {
            printf '%s\n' "$id_output"
            return 1
        }
        id=$id_output
        [ "$id" = "000" ] || entries+=("$key:run-$id")
    done <<< "$scope_rows"
    if [ "${#entries[@]}" -eq 0 ]; then
        printf 'none\n'
    else
        printf '%s\n' "${entries[@]}" | sort | paste -sd, -
    fi
}

parse_baseline() {
    local raw=$1
    local normalized item key run
    normalized=$(printf '%s' "$raw" | sed -E 's/[[:space:]]*·[[:space:]]*/,/g; s/[[:space:]]*;[[:space:]]*/,/g')
    normalized=$(printf '%s' "$normalized" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')
    if [ "$normalized" = "none" ]; then
        printf 'none|none\n'
        return
    fi
    [ -n "$normalized" ] || fail "Baseline is empty"
    local seen='|'
    IFS=',' read -r -a items <<< "$normalized"
    for item in "${items[@]}"; do
        item=$(printf '%s' "$item" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')
        if [[ ! "$item" =~ ^(feature|SF[0-9][0-9]):(run-[0-9][0-9][0-9])$ ]]; then
            fail "Malformed baseline entry: $item"
        fi
        key=${BASH_REMATCH[1]}
        run=${BASH_REMATCH[2]}
        case "$seen" in
            *"|$key|"*) fail "Duplicate baseline scope: $key" ;;
        esac
        seen="$seen$key|"
        printf '%s|%s\n' "$key" "$run"
    done | sort
}

scope_for_key() {
    local feature_dir=$1
    local wanted=$2
    local key scope
    local scope_rows
    scope_rows=$(list_scopes "$feature_dir") || {
        printf '%s\n' "$scope_rows"
        return 1
    }
    while IFS='|' read -r key scope; do
        if [ "$key" = "$wanted" ]; then
            printf '%s\n' "$scope"
            return 0
        fi
    done <<< "$scope_rows"
    return 1
}

validate_report() {
    local source=$1
    local run=$2
    local feature_dir=$3
    local nnn=${run#run-}
    local report="$source/qa-validation-$nnn.md"
    local feature_name feature_id frontmatter field section count
    feature_name=$(basename "$feature_dir")
    [[ "$feature_name" =~ ^([0-9][0-9][0-9][0-9][A-Z])- ]] || fail "Cannot derive feature ID from: $feature_dir"
    feature_id=${BASH_REMATCH[1]}
    [ -f "$report" ] || fail "Missing source report: $report"
    [ ! -L "$report" ] || fail "QA report must not be a symlink: $report"
    [ "$(sed -n '1p' "$report")" = "---" ] || fail "Schema-invalid report missing frontmatter: $report"
    frontmatter=$(awk 'NR == 1 { next } /^---[[:space:]]*$/ { found=1; exit } { print } END { if (!found) exit 1 }' "$report") || fail "Schema-invalid report has unclosed frontmatter: $report"
    printf '%s\n' "$frontmatter" | grep -Eq "^id:[[:space:]]*$feature_id-qa-validation-$nnn[[:space:]]*$" || fail "Source/report number mismatch: $report"
    printf '%s\n' "$frontmatter" | grep -Eq '^type:[[:space:]]*qa-validation[[:space:]]*$' || fail "Invalid qa-validation type: $report"
    printf '%s\n' "$frontmatter" | grep -Eq '^created:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}[[:space:]]*$' || fail "Schema-invalid report field created: $report"
    printf '%s\n' "$frontmatter" | grep -Eq "^feature:[[:space:]]*$feature_id[[:space:]]*$" || fail "Schema-invalid report field feature: $report"
    for field in scope method viewports; do
        printf '%s\n' "$frontmatter" | grep -Eq "^$field:[[:space:]]*[^[:space:]].*$" || fail "Schema-invalid report field $field: $report"
    done
    printf '%s\n' "$frontmatter" | grep -Eq '^specs:[[:space:]]*\{.*about:.*design:.*\}[[:space:]]*$' || fail "Schema-invalid report field specs: $report"
    printf '%s\n' "$frontmatter" | grep -Eq '^judged-contract:[[:space:]]*sha256:[0-9a-f]+[[:space:]]*$' || fail "Schema-invalid report field judged-contract: $report"
    for section in 'TOC' 'TL;DR' 'Summary' 'Coverage' 'Functional delivery' 'Findings' 'Responsiveness' 'Accessibility' 'Fix Routing' 'Clean screens' 'Not covered / caveats'; do
        grep -Eiq "^## $section([[:space:](]|$)" "$report" || fail "Schema-invalid report missing $section: $report"
    done
    for field in Blocker Major Minor Polish; do
        count=$(awk -F'|' -v label="$field" '$2 ~ "^[[:space:]]*" label "[[:space:]]*$" { gsub(/[[:space:]]/, "", $3); print $3; exit }' "$report")
        [[ "$count" =~ ^[0-9]+$ ]] || fail "Schema-invalid $field severity count: $report"
    done
    printf '%s\n' "$report"
}

report_metadata() {
    local report=$1
    local field value
    value=$(grep -E '^created:[[:space:]]*' "$report" | head -1 | sed -E 's/^created:[[:space:]]*//')
    echo "REPORT_CREATED=$value"
    for field in Blocker Major Minor Polish; do
        value=$(awk -F'|' -v label="$field" '$2 ~ "^[[:space:]]*" label "[[:space:]]*$" { gsub(/[[:space:]]/, "", $3); print $3; exit }' "$report")
        echo "$(printf '%s' "$field" | tr '[:lower:]' '[:upper:]')_COUNT=$value"
    done
}

validate_baseline() {
    local feature_dir=$1
    local raw=$2
    local parsed expected current_output current key run scope tests_dir source report report_output
    parsed=$(parse_baseline "$raw") || {
        printf '%s\n' "$parsed"
        return 1
    }
    if [ "$parsed" = "none|none" ]; then
        expected=none
    else
        expected=$(printf '%s\n' "$parsed" | awk -F'|' '{print $1 ":" $2}' | paste -sd, -)
    fi
    current_output=$(working_baseline "$feature_dir") || {
        printf '%s\n' "$current_output"
        return 1
    }
    current=$current_output
    [ "$expected" = "$current" ] || fail "Review baseline differs from current working evidence (baseline=$expected current=$current)"
    if [ "$current" = "none" ]; then
        echo "STATUS=OK"
        echo "BASELINE=none"
        return
    fi
    while IFS='|' read -r key run; do
        scope=$(scope_for_key "$feature_dir" "$key") || fail "Baseline scope not found under feature: $key"
        is_within "$scope" "$feature_dir" || fail "Scope escapes feature directory: $scope"
        tests_dir=$(require_contained_dir "$scope/_tests" "$scope" "QA tests directory")
        source=$(require_contained_dir "$tests_dir/$run" "$tests_dir" "Baseline source")
        reject_tree_symlinks "$source"
        report_output=$(validate_report "$source" "$run" "$feature_dir") || {
            printf '%s\n' "$report_output"
            return 1
        }
        report=$report_output
        echo "SOURCE=$source"
        echo "REPORT=$report"
    done <<< "$parsed"
    echo "STATUS=OK"
    echo "BASELINE=$current"
}

promote_baseline() {
    local feature_dir=$1
    local raw=$2
    local validation parsed key run scope source tests_dir final_root destination temp report action resolved
    validation=$(validate_baseline "$feature_dir" "$raw") || {
        printf '%s\n' "$validation"
        return 1
    }
    printf '%s\n' "$validation"
    [ "$(working_baseline "$feature_dir")" = "none" ] && return 0
    parsed=$(parse_baseline "$raw")

    # Check every immutable destination before copying the first scope. A
    # conflict must never leave a newly promoted subset behind.
    while IFS='|' read -r key run; do
        scope=$(scope_for_key "$feature_dir" "$key") || fail "Baseline scope not found under feature: $key"
        tests_dir=$(require_contained_dir "$scope/_tests" "$scope" "QA tests directory")
        source=$(require_contained_dir "$tests_dir/$run" "$tests_dir" "Baseline source")
        reject_tree_symlinks "$source"
        final_root="$tests_dir/final"
        if [ -e "$final_root" ]; then
            final_root=$(require_contained_dir "$final_root" "$tests_dir" "Final evidence root")
        fi
        destination="$final_root/$run"
        if [ -e "$destination" ]; then
            destination=$(require_contained_dir "$destination" "$final_root" "Final snapshot")
            reject_tree_symlinks "$destination"
            diff -qr "$source" "$destination" >/dev/null || fail "Immutable final snapshot conflict: $destination"
        fi
    done <<< "$parsed"

    while IFS='|' read -r key run; do
        scope=$(scope_for_key "$feature_dir" "$key") || fail "Baseline scope not found under feature: $key"
        tests_dir=$(require_contained_dir "$scope/_tests" "$scope" "QA tests directory")
        source=$(require_contained_dir "$tests_dir/$run" "$tests_dir" "Baseline source")
        final_root="$tests_dir/final"
        [ ! -L "$final_root" ] || fail "Final evidence root must not be a symlink: $final_root"
        mkdir -p "$final_root"
        final_root=$(require_contained_dir "$final_root" "$tests_dir" "Final evidence root")
        destination="$final_root/$run"
        report="$destination/qa-validation-${run#run-}.md"
        if [ -d "$destination" ]; then
            destination=$(require_contained_dir "$destination" "$final_root" "Final snapshot")
            reject_tree_symlinks "$destination"
            diff -qr "$source" "$destination" >/dev/null || fail "Immutable final snapshot conflict: $destination"
            action=noop
        else
            [ ! -e "$destination" ] || fail "Final snapshot path is not a directory: $destination"
            temp=$(mktemp -d "$final_root/.run-${run#run-}.XXXXXX")
            resolved=$(require_contained_dir "$temp" "$final_root" "Temporary final snapshot")
            temp=$resolved
            if ! cp -a "$source/." "$temp/"; then
                rm -rf "$temp"
                fail "Failed to copy baseline source: $source"
            fi
            mv "$temp" "$destination"
            action=promoted
        fi
        echo "ACTION=$action"
        echo "SCOPE=$key"
        echo "FINAL=$destination"
        echo "FINAL_REPORT=$report"
        report_metadata "$report"
    done <<< "$parsed"
}

ensure_ignore() {
    local project_root=$1
    local file="$project_root/.gitignore"
    local start='# ADD QA evidence - managed by add.qa-setup'
    local end='# END ADD QA evidence'
    local starts ends temp
    [ ! -L "$file" ] || fail ".gitignore must not be a symlink: $file"
    [ -e "$file" ] || : > "$file"
    starts=$(grep -Fxc "$start" "$file" || true)
    ends=$(grep -Fxc "$end" "$file" || true)
    [ "$starts" -eq "$ends" ] || fail "Malformed QA evidence block in .gitignore"
    temp=$(mktemp "$project_root/.gitignore.qa.XXXXXX")
    awk -v start="$start" -v end="$end" '
        $0 == start {
            if (!inserted) {
                print start
                print "docs/features/**/_tests/run-*/"
                print end
                inserted=1
            }
            skipping=1
            next
        }
        skipping && $0 == end { skipping=0; next }
        !skipping { print }
        END {
            if (!inserted) {
                if (NR > 0) print ""
                print start
                print "docs/features/**/_tests/run-*/"
                print end
            }
        }
    ' "$file" > "$temp"
    mv "$temp" "$file"
    echo "STATUS=OK"
    echo "GITIGNORE=$file"
}

operation=${1:-}
[ -n "$operation" ] || usage

case "$operation" in
    scopes)
        [ "$#" -eq 2 ] || usage
        feature_dir=$(require_dir "$2")
        scope_rows=$(list_scopes "$feature_dir") || {
            printf '%s\n' "$scope_rows"
            exit 1
        }
        while IFS='|' read -r key scope; do
            echo "SCOPE=$key"
            echo "SCOPE_DIR=$scope"
        done <<< "$scope_rows"
        ;;
    next)
        [ "$#" -eq 2 ] || usage
        scope_dir=$(require_dir "$2")
        current_output=$(highest_id "$scope_dir" "working final") || {
            printf '%s\n' "$current_output"
            exit 1
        }
        current=$current_output
        [ "$current" != "999" ] || fail "QA run limit reached at run-999 for scope: $scope_dir"
        next=$((10#$current + 1))
        printf 'RUN_ID=run-%03d\n' "$next"
        printf 'RUN_NUMBER=%03d\n' "$next"
        ;;
    previous)
        [ "$#" -eq 3 ] || usage
        scope_dir=$(require_dir "$2")
        [[ "$3" =~ ^run-([0-9][0-9][0-9])$ ]] || fail "Malformed run ID: $3"
        target=$((10#${BASH_REMATCH[1]}))
        previous=0
        working_dirs=$(run_dirs "$scope_dir" working) || {
            printf '%s\n' "$working_dirs"
            exit 1
        }
        final_dirs=$(run_dirs "$scope_dir" final) || {
            printf '%s\n' "$final_dirs"
            exit 1
        }
        while IFS= read -r dir; do
            [ -n "$dir" ] || continue
            value=$((10#${dir##*-}))
            [ "$value" -lt "$target" ] && [ "$value" -gt "$previous" ] && previous=$value
        done < <(printf '%s\n%s\n' "$working_dirs" "$final_dirs" | sed '/^$/d' | sort -u)
        if [ "$previous" -eq 0 ]; then
            echo "PREVIOUS=none"
        else
            printf -v previous_id '%03d' "$previous"
            working="$scope_dir/_tests/run-$previous_id/qa-validation-$previous_id.md"
            final="$scope_dir/_tests/final/run-$previous_id/qa-validation-$previous_id.md"
            if [[ "$(basename "$scope_dir")" =~ ^SF[0-9][0-9]- ]]; then
                feature_dir=$(require_dir "$scope_dir/../..")
            else
                feature_dir=$scope_dir
            fi
            if [ -f "$working" ]; then
                report=$working
            elif [ -f "$final" ]; then
                report=$final
            else
                fail "Immediate predecessor run-$previous_id has no report"
            fi
            tests_dir=$(require_contained_dir "$scope_dir/_tests" "$scope_dir" "QA tests directory")
            source=$(require_contained_dir "$(dirname "$report")" "$tests_dir" "Previous run source")
            reject_tree_symlinks "$source"
            report_output=$(validate_report "$source" "run-$previous_id" "$feature_dir") || {
                printf '%s\n' "$report_output"
                exit 1
            }
            report=$report_output
            echo "PREVIOUS=run-$previous_id"
            echo "PREVIOUS_REPORT=$report"
        fi
        ;;
    working-baseline)
        [ "$#" -eq 2 ] || usage
        feature_dir=$(require_dir "$2")
        baseline=$(working_baseline "$feature_dir") || {
            printf '%s\n' "$baseline"
            exit 1
        }
        echo "BASELINE=$baseline"
        ;;
    validate)
        [ "$#" -eq 3 ] || usage
        feature_dir=$(require_dir "$2")
        validate_baseline "$feature_dir" "$3"
        ;;
    promote)
        [ "$#" -eq 3 ] || usage
        feature_dir=$(require_dir "$2")
        promote_baseline "$feature_dir" "$3"
        ;;
    ensure-ignore)
        [ "$#" -eq 2 ] || usage
        project_root=$(require_dir "$2")
        ensure_ignore "$project_root"
        ;;
    *) usage ;;
esac

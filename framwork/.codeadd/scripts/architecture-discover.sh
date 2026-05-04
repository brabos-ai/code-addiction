#!/bin/bash
# architecture-discover.sh (v4.1 - Framework Agnostic)
# Quick codebase scan - structure only, agent infers the rest
# Output: minimal, glob-friendly, token-efficient

# FIX-01: Added -u (undefined variables cause error) and pipefail
# (any command in a pipe that fails causes immediate exit).
set -euo pipefail

# FIX-02: Helper function to execute pipelines with grep safely.
# grep returns exit code 1 when no matches are found, which with set -e
# aborts the script. This function ignores exit code 1 from grep (no matches)
# but propagates other real errors (permission, invalid file, etc.).
grep_safe() {
    grep "$@" || [ $? -eq 1 ]
}

# FIX-03: Helper function to calculate depth portably,
# without depending on wc -c with whitespace padding or seq (not universal).
count_depth() {
    local path="$1"
    local depth=0
    local tmp="$path"
    # Remove each '/' to count how many exist
    while [ "${tmp}" != "${tmp#*/}" ]; do
        tmp="${tmp#*/}"
        depth=$((depth + 1))
    done
    echo "$depth"
}

# FIX-04: Helper function to generate indentation without depending on seq.
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
# FIX-05: Removed '2>/dev/null' from '[' command which does not produce stderr.
# The redirection was harmless but semantically incorrect/misleading.
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

# FIX-06: Replaced subshell with pipe for 'find | sort | while read' with
# a loop over an array to prevent SIGPIPE from 'sort' or 'while' causing
# abort with pipefail. Also added IFS= and -r to read to preserve
# spaces and backslashes in directory names.
while IFS= read -r dir_path; do

    # FIX-07: Used count_depth function instead of 'tr -cd / | wc -c' for
    # avoiding whitespace in wc result and ensuring portability.
    depth=$(count_depth "$dir_path")

    # Skip root (.)
    [ "$depth" -eq 0 ] && continue

    # FIX-08: Fixed subdirectory verification logic. The original
    # used '! -name "$(basename "$path")"' which excluded any subdirectory
    # with the same name as the parent instead of excluding only the parent directory itself.
    # Now uses -mindepth 1 to list only direct children.
    next_level=$(find "$dir_path" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    # FIX-09: Strip whitespace from wc -l result (BSD wc adds spaces).
    next_level="${next_level// /}"

    # FIX-10: Used make_indent function instead of 'printf ... $(seq ...)'.
    # seq is not portable (absent on some minimal systems).
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
    # FIX-11: Redirected tree stderr to /dev/null explicitly
    # and added '|| true' so tree failure does not abort the script.
    tree -d -L 5 -I 'node_modules|.git|dist|build|coverage|__pycache__|.venv|target|.next|.turbo' --noreport 2>/dev/null | head -100 || true
else
    # Fallback: find dirs (compact format with depth indicator)
    # FIX-12: Same fix as STRUCTURE section: process substitution for
    # avoiding SIGPIPE in pipe with head. 'head -100' makes find receive SIGPIPE
    # when the limit is reached; with pipefail this would cause abort. We use head
    # separately after the loop to limit output lines.
    line_count=0
    while IFS= read -r dir_path; do

        [ $line_count -ge 100 ] && break

        # FIX-13: Used count_depth function (portable, no whitespace).
        depth=$(count_depth "$dir_path")

        # Skip root (.)
        [ "$depth" -eq 0 ] && continue

        # FIX-14: Used make_indent function and fixed subdirectory logic.
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
# FIX-15: Added '|| true' to pipeline so absence of extensions
# known (grep/sed without match) does not cause abort with set -e + pipefail.
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
# FIX-16: Replaced grep|grep|sed|while pipeline (which aborted when
# grep found no matches) with grep_safe which tolerates exit code 1.
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
# FIX-17: Same grep_safe fix for all dependency blocks.
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
    # FIX-18: Replaced 'head -n -1' (not portable on BSD head, present
    # on macOS) with a compatible approach using awk to exclude the last
    # line of the require block, which is the closing ')'.
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
# FIX-19: Removed '2>/dev/null' from '[' command (does not produce stderr).
for f in .env .env.example .env.local .env.development .env.production; do
    [ -f "$f" ] && echo "  $f"
done

# =============================================================================
# LSP
# =============================================================================

echo "LSP:"
# FIX-20: Fixed redirection of 'command -v' to /dev/null
# portably. '&>' is a bash extension not available in strict sh.
if command -v lsp > /dev/null 2>&1; then
    echo "  available:true"
else
    echo "  available:false"
fi

exit 0

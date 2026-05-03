#!/bin/bash
# ============================================
# ADD Framework Context Bootstrap
# Displays current landscape: skills, agents, commands, scripts
# ============================================
# Usage: bash .claude/bootstrap-framework-context.sh
# Dependencies: bash, grep, sed
# ============================================

set -e
shopt -s nullglob

FRAMEWORK_ROOT="framwork"
SKILLS_DIR="$FRAMEWORK_ROOT/.codeadd/skills"
AGENTS_DIR="$FRAMEWORK_ROOT/.codeadd/agents"
COMMANDS_DIR="$FRAMEWORK_ROOT/.codeadd/commands"
SCRIPTS_DIR="$FRAMEWORK_ROOT/.codeadd/scripts"

# --- Helper Functions ---

extract_frontmatter() {
    local file="$1"
    local field="$2"
    sed -n "/^---$/,/^---$/p" "$file" | grep "^$field:" | sed "s/^$field: //;s/'//g;s/\"//g" | head -1
}

# --- Output Header ---

echo "════════════════════════════════════════════════════════════════"
echo "ADD FRAMEWORK LANDSCAPE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# --- Skills Section ---

echo "📚 ACTIVE SKILLS"
echo "---"

if [ -d "$SKILLS_DIR" ]; then
    for skill_dir in "$SKILLS_DIR"/*/; do
        skill_name=$(basename "$skill_dir")
        if [ -f "$skill_dir/SKILL.md" ]; then
            skill_description=$(extract_frontmatter "$skill_dir/SKILL.md" "description")
            printf "  • %-40s %s\n" "$skill_name" "$skill_description"
        fi
    done
else
    echo "  (No skills directory found)"
fi

echo ""

# --- Agents Section ---

echo "🤖 ACTIVE AGENTS"
echo "---"

if [ -d "$AGENTS_DIR" ]; then
    ls -1 "$AGENTS_DIR" | sed 's/^/  • /'
else
    echo "  (No agents directory found)"
fi

echo ""

# --- Commands Section ---

echo "⚙️  ACTIVE COMMANDS"
echo "---"

if [ -d "$COMMANDS_DIR" ]; then
    ls -1 "$COMMANDS_DIR" | sed 's/\.md$//' | sed 's/^/  • /'
else
    echo "  (No commands directory found)"
fi

echo ""

# --- Scripts Section ---

echo "🔧 ACTIVE SCRIPTS"
echo "---"

if [ -d "$SCRIPTS_DIR" ]; then
    ls -1 "$SCRIPTS_DIR" | sed 's/^/  • /'
else
    echo "  (No scripts directory found)"
fi

echo ""

# --- Framework Strategy Context ---

echo "🎯 FRAMEWORK STRATEGY CONTEXT"
echo "---"

print_skill_snippet() {
    local file="$1"
    local label="$2"
    if [ -f "$file" ]; then
        local desc
        desc=$(extract_frontmatter "$file" "description")
        echo "  ✓ $label"
        echo "    $desc"
    fi
}

print_skill_snippet ".claude/skills/add-framework-development/SKILL.md" "add-framework-development"
print_skill_snippet "$FRAMEWORK_ROOT/.codeadd/skills/add-ecosystem/SKILL.md" "add-ecosystem"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Use this landscape to understand what exists in the framework."
echo "Ask: What can I reuse? What would be duplicative? What's missing?"
echo "════════════════════════════════════════════════════════════════"
echo ""

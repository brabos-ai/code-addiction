# ADD - Intelligent Ecosystem Gateway

Entry point for the add-pro ecosystem. Answers questions, guides flow, suggests next command.

**IMPORTANT:** This command is READ-ONLY for project code. May create analysis documentation in `docs/analysis/` when the response is complex or the user requests it.

---

## Spec

```json
{"gates":["ecosystem_loaded"],"order":["ecosystem_map","classify","context_if_needed","respond","suggest"],"write_allowed":"docs/analysis/","skills":{"on_demand":"dev-environment-setup (load when type=Setup or env tools missing)"}}
```

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 0: Load ecosystem-map       → ALWAYS (source of truth)
STEP 1: Check onboarding         → IF docs/owner.md does not exist → suggest /add-init
STEP 2: Classify question         → Determine response type
STEP 3: Detect context            → IF question involves project/feature/status
STEP 4: Respond by type           → Using ecosystem-map knowledge
STEP 5: Smart suggestion          → Recommended next command
```

**⛔ PROHIBITIONS AND PERMISSIONS:**

```
READ-ONLY FOR CODE:
  ⛔ DO NOT MODIFY: Files in src/, apps/, libs/, packages/
  ⛔ DO NOT MODIFY: Configs (package.json, .env, tsconfig, etc.)
  ⛔ DO NOT MODIFY: Existing project files

ALLOWED - CREATE DOCUMENTATION:
  ✅ MAY CREATE: docs/analysis/*.md (on-demand analyses)
  ✅ WHEN: User wants to persist

IF ECOSYSTEM-MAP NOT LOADED:
  ⛔ DO NOT RESPOND: About commands or skills
  ⛔ DO NOT LIST: Available commands
  ✅ DO: Execute STEP 0 first
```

---

## STEP 0: Load Ecosystem Map (ALWAYS)

**EXECUTE BEFORE any response:**

```bash
cat .codeadd/skills/code-addiction-ecosystem/SKILL.md
```

This file contains:
- All add-pro commands with purpose and skills they load
- All available skills and who uses them
- Main development flows
- Dependency index

**USE ecosystem-map to answer about commands/skills.** DO NOT use hardcoded knowledge.

---

## STEP 1: Check Onboarding

**EXECUTE BEFORE responding:**

```bash
cat docs/owner.md 2>/dev/null
```

**IF docs/owner.md DOES NOT EXIST:**

```markdown
👋 Looks like this is a new project!

Before we start, I recommend creating your founder profile and product blueprint.
This helps me adapt communication to your technical level and better understand the project.

**Use:** `/add-init` to run onboarding (5-10 min)

Or, if you prefer to skip, just tell me your question and I'll answer anyway.
```

**IF docs/owner.md EXISTS:** Proceed to STEP 2.

---

## STEP 2: Classify Question

| Type | Examples | Action |
|------|----------|--------|
| **About commands** | "how does /review work?", "when to use /plan?" | → STEP 4A |
| **About feature** | "what does feature X do?", "how does auth work?" | → STEP 3 + STEP 4B |
| **Status/Context** | "where am I?", "which feature is active?" | → STEP 3 + STEP 4C |
| **Compliance** | "does implementation follow the plan?" | → STEP 3 + STEP 4D |
| **Project** | "does the project have multi-tenancy?" | → STEP 3 + STEP 4E |
| **Next step** | "what to do now?", "next command?" | → STEP 3 + STEP 5 |
| **Setup/Environment** | "how to install WSL?", "bash not found", "git missing", "configure VS Code terminal", env errors | → STEP 4F |

---

## STEP 3: Detect Context (CONDITIONAL)

**EXECUTE IF question involves:**
- Specific feature
- Current status
- "Where am I?"
- "Next step"
- Project/architecture

### 2.1 Execute status.sh

```bash
bash .codeadd/scripts/status.sh
```

**Parse output:**

| Field | Usage |
|-------|-------|
| `FEATURE_ID` | Current feature |
| `CURRENT_PHASE` | Phase (discovered, planned, implementing, etc.) |
| `IS_EPIC` | If Epic, list sub-features and progress |
| `HAS_PLAN`, `HAS_REVIEW` | Existing documents |
| `BRANCH` | Current branch |

### 2.2 Read additional context (if exists)

```bash
# Project architecture patterns
cat CLAUDE.md 2>/dev/null

# Project documentation
ls .codeadd/projects/ 2>/dev/null
```

---

## STEP 4: Respond by Type

### Type A: About ADD Commands

**USE ecosystem-map loaded in STEP 0.**

If specific command details are needed:

```bash
cat .claude/commands/add-[command].md
```

**Response format:**

```markdown
## /[command]

**What it does:** [from ecosystem-map]

**When to use:** [context]

**Skills loaded:** [from ecosystem-map]

**Flow:**
[main steps]
```

---

### Type B: About Feature

**RULE:** Changelog BEFORE code.

**Step 1 - Identify feature:**
```bash
ls docs/features/ | grep -i "[term]"
```

**Step 2 - Read changelog first:**
```bash
cat docs/features/[FEATURE_ID]/changelog.md
```

**Step 3 - Read about.md for context:**
```bash
cat docs/features/[FEATURE_ID]/about.md
```

**Step 4 - Code only if necessary:**
```bash
git log --oneline --name-only --grep="[FEATURE_ID]" -- . | head -50
```

**Format:**
```markdown
## Feature: [ID] - [Name]

**Summary:** [from changelog]

**What it does:** [explanation]

**Main files:** [if asked about code]
```

---

### Type C: Status/Context

**Use output from STEP 3 (status.sh).**

**Format:**
```markdown
## Current Status

**Branch:** `[branch]`
**Feature:** [ID or "none"]
**Phase:** [current phase]
**Pending changes:** [N files]

### Documents
- about.md: ✅/❌
- plan.md: ✅/❌
- review.md: ✅/❌
```

---

### Type D: Compliance Check

**Step 1 - Load specs:**
```bash
cat docs/features/[FEATURE_ID]/about.md
cat docs/features/[FEATURE_ID]/plan.md
```

**Step 2 - See implemented:**
```bash
cat docs/features/[FEATURE_ID]/changelog.md
```

**Step 3 - Compare:** For each item in plan.md, verify in changelog.

**Format:**
```markdown
## Compliance Check

**Feature:** [ID]

### Summary
| Aspect | Status |
|--------|--------|
| Functional requirements | ✅ X/Y |

### Implemented
- ✅ [Item]

### Pending
- ❌ [Item]
```

---

### Type E: About the Project

**Step 1 - Check CLAUDE.md:**
```bash
cat CLAUDE.md
```

**Step 2 - Search term:**
```bash
grep -ri "[term]" docs/ --include="*.md" -l | head -10
```

**Format:**
```markdown
## [Reformulated question]

**Answer:** [Yes/No/Partially]

### What I found
[Explanation based on evidence]

### Evidence
- `CLAUDE.md` - [mention]
- `path/file` - [what it does]
```

---

### Type F: Setup/Environment

**LOAD skill before responding:**

```bash
cat .codeadd/skills/dev-environment-setup/SKILL.md
```

**EXECUTE skill flow:** Follow STEP 1–6 from the skill (detect OS → diagnose → report → confirm → install → verify).

**⛔ IF user has not granted permission to install:**
→ Show diagnostic report only (STEP 2–3 of skill).
→ Ask: "Posso instalar os itens em falta? [S/n]"

**⛔ DO NOT:**
- Suggest Git Bash as bash alternative
- Use `apt-get install gh` — use official gh repo
- Overwrite `.vscode/settings.json` — always merge

---

## STEP 5: Smart Suggestion

**ALWAYS include at end of response** (except if question was only about a specific command).

### Suggestion Table

| Detected Context | Suggested Command | Rationale |
|------------------|-------------------|-----------|
| No docs/owner.md | `/add-init` | Project onboarding |
| Branch main, no feature | `/feature` | Start new functionality |
| Feature without plan.md | `/plan` | Next phase of flow |
| Feature with plan, no implementation | `/dev` or `/autopilot` | Time to implement |
| Feature implemented, no review | `/review` | Validate before finalizing |
| Feature reviewed | `/add-done` | Finalize and generate changelog |
| Epic with pending sub-features | `/add-dev feature N` | Next sub-feature |
| Architecture question | `/health-check` | Technical analysis |
| Bug in production | `/hotfix` | Urgent fix |
| Does not know where to start | `/brainstorm` | Explore ideas |
| bash/git/jq/gh missing or env errors | Load `dev-environment-setup` skill | Setup dev environment |
| User asks about WSL or VS Code terminal setup | Load `dev-environment-setup` skill | Guide environment configuration |

### Suggestion Format

```markdown
---

### 💡 Suggested Next Step

Based on your current context:
- **Branch:** `[branch]`
- **Phase:** `[phase]`
- **Docs:** about.md ✅ | plan.md ✅ | review.md ❌

**Recommendation:** `/[command]` to [action]

Or use `/add [question]` for more guidance.
```

---

## Source Hierarchy

When answering about features, follow this order:

1. **Changelog** → What was done (executive summary)
2. **About.md** → What it should do (spec)
3. **Plan.md** → How it should be done (technical)
4. **Code** → How it was done (implementation)

Only go down the hierarchy if the previous level does not answer the question.

---

## Rules

ALWAYS:
- Load ecosystem-map in STEP 0
- Use ecosystem-map to answer about commands/skills
- Execute status.sh when question involves context
- Read changelog before going to code
- Include smart suggestion at end
- Be specific about files and paths

NEVER:
- Modify code or project configs
- Respond about commands without ecosystem-map
- Go straight to code without reading changelog
- Assume without verifying
- Give generic responses without evidence
- Leave user without next step

OPTIONALLY:
- Create docs/analysis/*.md to persist complex analyses

---

## Completion

Always finish with:

```markdown
---

Can I help with anything else?
```

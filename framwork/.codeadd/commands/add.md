# ADD - Intelligent Ecosystem Gateway

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante -> explain why; avancado -> essentials only).

Entry point for the add-pro ecosystem. Answers questions, guides flow, suggests next command.

**IMPORTANT:** This command is READ-ONLY for project code. May create analysis documentation in `docs/analysis/` when the response is complex or the user requests it.

---

## Spec

```json
{"write_allowed":"docs/analysis/","skills":{"on_demand":"dev-environment-setup (load when type=Setup or env tools missing)"}}
```

---

## PROHIBITIONS AND PERMISSIONS

```
READ-ONLY FOR CODE:
  DO NOT MODIFY: Files in src/, apps/, libs/, packages/
  DO NOT MODIFY: Configs (package.json, .env, tsconfig, etc.)
  DO NOT MODIFY: Existing project files

ALLOWED - CREATE DOCUMENTATION:
  MAY CREATE: docs/analysis/*.md (on-demand analyses)

IF ECOSYSTEM-MAP NOT LOADED:
  ⛔ DO NOT RESPOND: About commands or skills
  ⛔ DO NOT LIST: Available commands
  ✅ DO: Execute STEP 0 first
```

---

## STEP 0: Load Ecosystem Map (ALWAYS)

Read `.codeadd/skills/add-ecosystem/SKILL.md` before any response.

This file contains all add-pro commands with purpose/skills, available skills, main flows, and dependency index.

**USE ecosystem-map to answer about commands/skills.** DO NOT use hardcoded knowledge.

---

## STEP 1: Check Onboarding

Read `docs/owner.md`. If it does not exist, suggest `/add.init` for project onboarding (5-10 min) and offer to answer anyway if the user prefers to skip. If it exists, proceed to STEP 2.

---

## STEP 2: Classify Question

| Type | Examples | Action |
|------|----------|--------|
| **About commands** | "how does /review work?", "when to use /plan?" | -> STEP 4A |
| **About feature** | "what does feature X do?", "how does auth work?" | -> STEP 3 + STEP 4B |
| **Status/Context** | "where am I?", "which feature is active?" | -> STEP 3 + STEP 4C |
| **Compliance** | "does implementation follow the plan?" | -> STEP 3 + STEP 4D |
| **Project** | "does the project have multi-tenancy?" | -> STEP 3 + STEP 4E |
| **Next step** | "what to do now?", "next command?" | -> STEP 3 + STEP 5 |
| **Setup/Environment** | "how to install WSL?", "bash not found", "git missing", env errors | -> STEP 4F |

---

## STEP 3: Detect Context (CONDITIONAL)

Execute when question involves a specific feature, current status, "where am I?", next step, or project/architecture.

### 3.1 Execute status.sh

```bash
bash .codeadd/scripts/status.sh
```

**Parse output:** FEATURE_ID (current feature), CURRENT_PHASE (discovered, planned, implementing, etc.), IS_EPIC (list sub-features if true), HAS_PLAN/HAS_REVIEW (existing documents), BRANCH (current branch).

### 3.2 Read additional context (if exists)

Read `CLAUDE.md` for project architecture patterns. List `.codeadd/projects/` for project documentation.

---

## STEP 4: Respond by Type

### Type A: About ADD Commands

Use ecosystem-map from STEP 0. If specific command details are needed, read `.claude/commands/add.[command].md`.

Include: what the command does, when to use it, which skills it loads, and main flow steps.

---

### Type B: About Feature

**RULE:** Changelog BEFORE code.

1. Identify feature directory under `docs/features/`
2. Read `changelog.md` first (executive summary)
3. Read `about.md` for context/spec
4. Only check code if previous levels don't answer the question

Include: feature ID, name, summary from changelog, explanation, main files (if asked about code).

---

### Type C: Status/Context

Use output from STEP 3 (status.sh).

Include: branch, feature ID, current phase, pending changes, document availability (about.md, plan.md, review.md).

---

### Type D: Compliance Check

1. Read `about.md` and `plan.md` for specs
2. Read `changelog.md` for what was implemented
3. Compare: for each plan.md item, verify in changelog

Include: feature ID, requirements summary (X/Y fulfilled), implemented items, pending items.

---

### Type E: About the Project

1. Read `CLAUDE.md` for architecture patterns
2. Search relevant docs for the queried term

Include: reformulated question, answer (Yes/No/Partially), explanation based on evidence, source files as evidence.

---

### Type F: Setup/Environment

**LOAD skill before responding:** Read `.codeadd/skills/add-dev-environment-setup/SKILL.md`.

**EXECUTE skill flow:** Follow STEP 1-6 from the skill (detect OS -> diagnose -> report -> confirm -> install -> verify).

**IF user has not granted permission to install:** Show diagnostic report only (STEP 2-3 of skill). Ask for confirmation before installing.

NEVER:
- Suggest Git Bash as bash alternative
- Use `apt-get install gh` -- use official gh repo
- Overwrite `.vscode/settings.json` -- always merge

---

## STEP 5: Smart Suggestion

ALWAYS include at end of response (except if question was only about a specific command).

### Suggestion Table

| Detected Context | Suggested Command | Rationale |
|------------------|-------------------|-----------|
| No docs/owner.md | `/add.init` | Project onboarding |
| Branch main, no feature | `/add.new` | Start new functionality |
| Feature without plan.md | `/add.plan` | Next phase of flow |
| Feature with plan, no implementation | `/add.build` or `/add.autopilot` | Time to implement |
| Feature implemented, no review | `/add.review` | Validate before finalizing |
| Feature reviewed | `/add.done` | Finalize and generate changelog |
| Epic with pending sub-features | `/add.build feature N` | Next sub-feature |
| Architecture question | `/health-check` | Technical analysis |
| Bug in production | `/add.hotfix` | Urgent fix |
| Does not know where to start | `/add.brainstorm` | Explore ideas |
| bash/git/jq/gh missing or env errors | Load `dev-environment-setup` skill | Setup dev environment |
| User asks about WSL or VS Code terminal setup | Load `dev-environment-setup` skill | Guide environment configuration |

Base the suggestion on current branch, phase, and document availability.

---

## Source Hierarchy

When answering about features, follow this order:

1. **Changelog** -> What was done (executive summary)
2. **About.md** -> What it should do (spec)
3. **Plan.md** -> How it should be done (technical)
4. **Code** -> How it was done (implementation)

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

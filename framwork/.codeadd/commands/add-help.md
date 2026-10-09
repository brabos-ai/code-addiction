# ADD Help - Guide to the Framework

<!-- uses:
- command: /add-audit
- command: /add-brainstorm
- command: /add-build
- command: /add-diagnose
- command: /add-done
- command: /add-hotfix
- command: /add-new
- command: /add-plan
- command: /add-review
- script: status.cjs
- skill: add--dev-environment-setup
- skill: add--ecosystem
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Help guide for the add-pro ecosystem. Answers which command to use and in what order, what each feature and plugin is and whether it is on, how to run the framework from a bot, and how the CLI works. Suggests the next command.

**IMPORTANT:** This command is READ-ONLY for project code. May create analysis documentation in `docs/analysis/` when the response is complex or the user requests it.

---

## PROHIBITIONS AND PERMISSIONS

```
READ-ONLY FOR CODE:
  DO NOT MODIFY: Files in src/, apps/, libs/, packages/
  DO NOT MODIFY: Configs (package.json, .env, tsconfig, etc.)
  DO NOT MODIFY: Existing project files, `.codeadd/manifest.json` included

ALLOWED - CREATE DOCUMENTATION:
  MAY CREATE: docs/analysis/*.md (on-demand analyses)

IF ECOSYSTEM-MAP NOT LOADED:
  ⛔ DO NOT RESPOND: About commands, skills, features or plugins
  ⛔ DO NOT LIST: Available commands
  ✅ DO: Execute STEP add-help.ecosystem first

IF THE USER ASKS HOW TO TURN SOMETHING ON, OFF OR UPDATE IT:
  ⛔ DO NOT RUN: `codeadd install`, `update`, `uninstall`, `modify`, `features enable|disable`, `plugins enable|disable`, `providers add|remove`, `migrate` or `validate --repair`
  ✅ DO: Tell the user the exact command to run. The only `codeadd` command this command runs is `codeadd --help`
```

---

## STEP add-help.ecosystem: Load Ecosystem Map (ALWAYS)

Read skill `add--ecosystem` before any response.

This file contains all add-pro commands with purpose/skills, available skills, features, plugins, main flows, next-step routing, and dependency index.

**USE ecosystem-map to answer about commands/skills/features/plugins.** DO NOT use hardcoded knowledge.

---

## STEP add-help.classify: Classify Question

| Type | Examples | Action |
|------|----------|--------|
| **No question** | `/add-help` alone | -> STEP add-help.overview |
| **About commands / flows** | "how does /add-review work?", "when to use /add-plan?", "which command first, and then?" | -> STEP add-help.respondA |
| **About feature** | "what does feature X do?", "how does auth work?" | -> STEP add-help.detect + STEP add-help.respondB |
| **Status/Context** | "where am I?", "which feature is active?" | -> STEP add-help.detect + STEP add-help.respondC |
| **Compliance** | "does implementation follow the plan?" | -> STEP add-help.detect + STEP add-help.respondD |
| **Project** | "does the project have multi-tenancy?" | -> STEP add-help.detect + STEP add-help.respondE |
| **Next step** | "what to do now?", "next command?" | -> STEP add-help.detect + STEP add-help.suggest |
| **Setup/Environment** | "how to install Node?", "node not found", "git missing", env errors | -> STEP add-help.respondF |
| **Features / plugins** | "how do I enable QA?", "what is GitNexus?", "is TDD on?" | -> STEP add-help.respondG |
| **Bot / agent mode** | "how do I run this from a bot?", "headless", "CI" | -> STEP add-help.respondH |
| **CLI lifecycle** | "how do I update?", "uninstall", "add a provider", "what do I run after update?" | -> STEP add-help.respondI |

---

## STEP add-help.overview: Answer With No Question

Print, in this order:

1. What the framework is, in two lines.
2. The `Main Flows` table from `add--ecosystem`.
3. The topics one can ask about: flows, features, plugins, bot mode, CLI, environment.

Then go to STEP add-help.suggest.

---

## STEP add-help.detect: Detect Context (CONDITIONAL)

Execute when question involves a specific feature, current status, "where am I?", next step, or project/architecture.

### STEP add-help.status Execute status.cjs

```bash
node .codeadd/scripts/status.cjs
```

**Parse output:** FEATURE_ID (current feature), CURRENT_PHASE (discovered, planned, implementing, etc.), IS_EPIC (list sub-features if true), HAS_PLAN/HAS_REVIEW (existing documents), BRANCH (current branch).

### STEP add-help.read-context Read additional context (if exists)

Read `AGENTS.md` for project architecture patterns. List `.codeadd/projects/` for project documentation.

---

## STEP add-help.respond: Respond by Type

### Type A: About ADD Commands

Use ecosystem-map from STEP add-help.ecosystem. For "which command, in what order", read its `Main Flows` and `Command Next-Steps Routing` sections. If specific command details are needed, open that command's own file in the commands folder of the provider this session runs on.

Include: what the command does, when to use it, which skills it loads, the flow it belongs to and what comes after it.

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

Use output from STEP add-help.detect (status.cjs).

Include: branch, feature ID, current phase, pending changes, document availability (about.md, plan.md, the highest review-NNN.md).

---

### Type D: Compliance Check

1. Read `about.md` and `plan.md` for specs
2. Read `changelog.md` for what was implemented
3. Compare: for each plan.md item, verify in changelog

Include: feature ID, requirements summary (X/Y fulfilled), implemented items, pending items.

---

### Type E: About the Project

1. Read `AGENTS.md` for architecture patterns
2. Search relevant docs for the queried term

Include: reformulated question, answer (Yes/No/Partially), explanation based on evidence, source files as evidence.

---

### Type F: Setup/Environment

**LOAD skill before responding:** Read skill `add--dev-environment-setup`.

**EXECUTE skill flow:** Follow the skill's STEP 1 to STEP 6 (detect OS -> diagnose -> report -> confirm -> install -> verify).

**IF user has not granted permission to install:** Show the diagnostic report only (the skill's STEP 3). Ask for confirmation (the skill's STEP 4) before installing.

NEVER:
- Use `apt-get install gh` -- use official gh repo
- Overwrite `.vscode/settings.json` -- always merge

---

### Type G: Features and Plugins

Three questions, three sources. Answer from them, never from memory.

1. **What it is:** the `Features` or `Plugins` table of `add--ecosystem`.
2. **Whether it is on in this project:** read `.codeadd/manifest.json` in the project root. When there is none, read `.codeadd/manifest.json` in the user's home folder (a `--global` install). Use the first one found. Do not merge the two.
   - A feature is on when `features.<name>` is `true`. When the key is absent, use the `Default` column of the `Features` table.
   - A plugin is on when `plugins.<name>.enabled` is `true`. When the key is absent, it is off.
   - When neither manifest exists, say so: the framework is not installed here.
3. **How to turn it on:** `codeadd features enable <name>` or `codeadd plugins enable <name>`. Off is the same with `disable`.

For a plugin, add nothing about installing the external tool. `codeadd plugins enable` checks the tool is present and prints the install steps itself. Tell the user to run it and follow what it prints.

Include: what it is, on or off, the exact command, and what it changes (the `Injects into` column).

---

### Type H: Bot / Agent Mode

Read `.codeadd/agent-mode/README.md` NOW, at answer time, in the project root first and then the user's home folder. Answer from what it says.

DO NOT summarise it from memory or copy it into your answer. The guide changes with the framework, and a copy goes stale. When the file is missing, say so and tell the user to run `codeadd update`.

---

### Type I: CLI Lifecycle

Covers install, update, uninstall, modify, providers add/remove, features, plugins, doctor, validate and migrate.

1. Run `codeadd --help` when the `codeadd` binary is on the PATH. Otherwise run `npx --yes codeadd --help` (`--yes` stops npx from waiting on a prompt nobody can answer). Answer from the `Usage` text it prints.
2. When neither can run (no npx, offline), say so and tell the user to run `codeadd --help` themselves. DO NOT answer the command list from memory.
3. For "what do I run after `codeadd update`", read the `Command Next-Steps Routing` section of `add--ecosystem` and answer from its row for `codeadd update`.

Tell the user the command to run. DO NOT run any `codeadd` command other than `--help`.

---

## STEP add-help.suggest: Smart Suggestion

ALWAYS include at end of response (except if question was only about a specific command, a feature, a plugin, bot mode or the CLI).

### Suggestion Table

| Detected Context | Suggested Command | Rationale |
|------------------|-------------------|-----------|
| Branch main, no feature | `/add-new` | Start new functionality |
| Feature without plan.md | `/add-plan` | Next phase of flow |
| Feature with plan, no implementation | `/add-build`, or choose automatic delivery at `/add-brainstorm`'s approval to run the build, with its own final review, unattended | Time to implement |
| Feature implemented | `/add-done` | The build already ran its final review. `/add-review` is optional — run it first for detail or the QA judgement |
| Feature reviewed | `/add-done` | Finalize and generate changelog |
| Epic with pending sub-features | `/add-build feature N` | Next sub-feature |
| Architecture question | `/add-audit` | Technical analysis |
| Clear bug in production | `/add-hotfix` | Urgent fix |
| Vague symptom / unsure if bug or feature | `/add-diagnose` | Structured investigative triage before deciding |
| Does not know where to start | `/add-brainstorm` | Explore ideas |
| node/git/gh missing, or Node older than 22.19.0 | Load `add--dev-environment-setup` skill | Setup dev environment |
| User asks about terminal setup | Load `add--dev-environment-setup` skill | Guide environment configuration |

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
- Load ecosystem-map in STEP add-help.ecosystem
- Use ecosystem-map to answer about commands/skills/features/plugins
- Read the manifest for whether a feature or plugin is on, `.codeadd/agent-mode/README.md` for bot mode and `codeadd --help` for the CLI
- Execute status.cjs when question involves context
- Read changelog before going to code
- Include smart suggestion at end
- Be specific about files and paths

NEVER:
- Modify code or project configs
- Respond about commands without ecosystem-map
- Copy plugin install steps, the CLI usage text or the agent-mode guide into the answer from memory
- Run a `codeadd` command other than `--help`
- Go straight to code without reading changelog
- Assume without verifying
- Give generic responses without evidence
- Leave user without next step

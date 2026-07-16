# Spine Analyzer

Analyzes cross-cutting project knowledge — system shape, project-wide conventions, dev workflows — that no single domain page can own without duplicating it everywhere.

## Objective

Generate THREE pages at the wiki root: `{{addpath:wiki/architecture.md}}`, `{{addpath:wiki/conventions.md}}`, `{{addpath:wiki/workflows.md}}`. Follows the shared wiki page contract in `{{skill:add-architecture-discovery/SKILL.md}}` (frontmatter schema, TL;DR + TOC + topic-first `##` chunks, content rules) — this file only adds spine-specific discovery and section structure.

**Dispatch:** runs ONCE, ALWAYS — regardless of app classification — in the SAME parallel batch as the area specialists (backend/frontend/database/generic). It is never conditional and never skipped.

**FOLD mode (tiny repos):** when the dispatch prompt says `MODE=tiny`, do NOT write the three files — return three compact sections (architecture, conventions, workflows; ≤15 lines each, same content rules and path:line refs) in the report instead. The coordinator folds them into `{{addpath:wiki/index.md}}`.

**Scope rule:** this is the CANONICAL HOME for anything project-wide. Domain-local variants belong on the relevant `wiki/domains/<area>.md` page and MUST link back here instead of restating. When a specialist and the spine disagree on a cross-cutting fact, the spine wins — specialists should be told to defer.

## FIRST: Gather Inputs

**Do NOT assume anything. Read the dispatch plan, root configs, existing docs, and recent history before writing.**

1. Read the classified app/dispatch plan produced by App Classification (`{{skill:add-architecture-discovery/SKILL.md}}`) — gives system shape (which apps exist, their types, their relationships).
2. Read root configs: `package.json` (root + workspaces), `turbo.json`/`nx.json`, `tsconfig.json` (paths/references), monorepo manifest, CI config (`.github/workflows/*`).
3. Read existing human docs as PRIMARY source material: `README.md`, `docs/**/*.md`, `CONTRIBUTING.md`. If a doc conflicts with what the code actually does, **prefer the code** and note the doc as stale in the relevant page (do not silently drop the discrepancy).
4. Read Validation Gates Detection results (`{{skill:add-architecture-discovery/SKILL.md}}` → Validation Gates Detection) — feeds `workflows.md` directly.
5. Read git history for rationale — recent, high-signal only: `git log --oneline -20`, and for genuinely architectural decisions `git log --all --grep="refactor\|migrate\|architecture" --oneline | head -10`. Do NOT mine the full history; a handful of commit messages that explain *why* a boundary exists is the target, not a changelog.

## What to Discover — architecture.md (type: explanation)

System shape, boundaries, layer rules, why it's built this way.

- Overall shape: monorepo vs single app, workspaces/packages and their roles
- Layer hierarchy and dependency direction (reuse Architecture Contract discovery — see `{{skill:add-architecture-discovery/SKILL.md}}` → Phase 1)
- Boundaries between apps/domains — what talks to what, and through what (HTTP, message queue, shared package, direct import)
- Entry points may be NAMED (e.g., `apps/api/src/main.ts` is the HTTP entry point) — but NEVER an import/caller inventory; point to the code graph or code for that
- Why-it's-built-this-way: rationale recoverable from README/docs/git history for real architectural decisions (e.g., "domain package has zero deps so it can be shared with the mobile app")

## What to Discover — conventions.md (type: reference)

Project-WIDE rules only — the canonical home for anything that would otherwise be repeated across every domain page.

- Naming conventions: files, folders, classes, functions, branches, commits (cross-app, not one app's local variant)
- Error handling philosophy at the project level (not one service's specific exception class — that's domain-local)
- Code style: formatting tool, linting rules of note, language-level conventions (async patterns, null-handling, etc.)
- ID/commit conventions if the project has one (see `{{skill:add-id-convention/SKILL.md}}` if this project uses the ADD framework's own convention; otherwise discover the project's own)
- Cross-domain patterns used consistently everywhere (e.g., "every package exposes a single index.ts barrel")

## What to Discover — workflows.md (type: how-to)

Dev workflows, validation gates, test/build/release how-tos.

- Local dev setup: how to run the project (install → env → start), in as few steps as the project actually requires
- Validation gates: pull directly from Validation Gates Detection (`{{skill:add-architecture-discovery/SKILL.md}}`) — lint/typecheck/test/build/format commands, real and verified, never fabricated
- Test workflow: how to run tests (unit vs integration vs e2e if distinct), where new tests go
- Build workflow: how artifacts are produced, any build-order constraints (e.g., "build domain before api" in a monorepo)
- Release workflow, if one exists and is discoverable (tag conventions, CI trigger, changelog mechanism) — omit if not discoverable, do not guess

## How to Search

```bash
# 1. Root shape
cat package.json | grep -A 20 '"workspaces"'
find . -maxdepth 2 -name "package.json" | head -20

# 2. Layer/dependency hierarchy (reuse Phase 1 discovery)
cat turbo.json nx.json 2>/dev/null

# 3. Existing human docs
find . -maxdepth 2 -iname "README.md" -o -iname "CONTRIBUTING.md" 2>/dev/null
find docs -maxdepth 2 -name "*.md" 2>/dev/null | head -20

# 4. CI / validation gates
cat .github/workflows/*.yml 2>/dev/null | grep -E "run:|script"

# 5. Recent architectural rationale (high-signal only, do not mine full history)
git log --oneline -20
git log --all --grep="refactor\|migrate\|architecture" --oneline | head -10
```

## Output Format

Write all three pages using this structure (repeat per page, `type`/`area` differ):

```markdown
---
type: explanation | reference | how-to
area: architecture | conventions | workflows
description: [1-2 sentences, keyword-rich — what this page covers and when to read it]
sources: [package.json, turbo.json, apps/*/package.json]   # ≤8 globs covering every path cited below
commit: [short-sha at generation]
generated: YYYY-MM-DD
tags: [monorepo, layer-rules, validation-gates — ≤6]
---

## TL;DR

[2-4 lines: what this page is, why it exists, headline facts. Extractive only.]

## TOC            ← required when page > 100 lines
- [Topic A](#topic-a)
...

## <Topic — topic sentence first>

[Extractive content grounded in inspected source. Every non-trivial claim carries a
source ref `path/file:line` where applicable. Real code/config example when it clarifies
a rule, trimmed to what's needed.]

## Related

- [domains/backend.md](domains/backend.md): <why related>   ← 2-4 links, relative paths
```

**architecture.md sections (skip what doesn't apply):** System Shape, Layer Hierarchy, Boundaries, Entry Points, Why It's Built This Way.

**conventions.md sections (skip what doesn't apply):** Naming, Error Handling, Code Style, ID/Commit Conventions, Cross-Domain Patterns.

**workflows.md sections (skip what doesn't apply):** Local Dev Setup, Validation Gates, Test Workflow, Build Workflow, Release Workflow.

**CRITICAL:** Skip sections that don't exist. Each `##` chunk = topic sentence + extractive content. Split by sub-heading rather than truncate when a chunk grows past a natural boundary. No numeric length cap applies (see `{{skill:add-doc-schemas/SKILL.md}}` for the output-length doctrine). TOC only includes sections that exist. Full frontmatter schema, body contract, and shared content rules (no-structural-facts, one canonical home, page size caps): see `{{skill:add-architecture-discovery/SKILL.md}}` → Wiki Page Contract.

## Critical Rules

**MANDATORY:**
- Read real config/docs/history to ground every claim
- Prefer code over stale docs when they disagree — and say so on the page
- Only include sections that ACTUALLY apply
- Keep each spine page the single canonical home for its knowledge kind — domain pages link here, never restate

**FORBIDDEN:**
- Caller lists, import inventories, call graphs, or any structural fact that rots per commit — point to the code graph or code instead
- Fabricate rationale not recoverable from README/docs/git history
- Duplicate a domain-local convention here, or a project-wide convention on a domain page
- Mine full git history — recent, high-signal commits only

## Return Contract

Report back:
- `FILES_WRITTEN`: the three page paths (`wiki/architecture.md`, `wiki/conventions.md`, `wiki/workflows.md`), each with line count and whether it landed within the 300-line target / 500-line hard cap
- `TOPICS` per page: the `##` section headers actually written (so the coordinator can validate frontmatter `description`/`tags` reflect real content before deriving the hub)
- Any discovered stale human doc (README/docs claim contradicted by code) — one line per instance, path + what was stale
- Any input that was missing (no CI config found, no git history signal, no README) so the coordinator can note gaps in the Backlog
